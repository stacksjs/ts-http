import type { Result } from 'ts-error-handling'
import type { FakeRequest } from './fake'
import type { HttxConfig, HttxResponse, RequestCompleteRecord, RequestOptions, RetryOptions } from './types'
import { err, ok } from 'ts-error-handling'
import { CircuitBreaker, CircuitOpenError } from './circuit-breaker'
import { HttxNetworkError, HttxRequestError, HttxResponseError, HttxTimeoutError } from './errors'
import { buildFakeResponse, HttxFakeUnmatchedError, isFaking, resolveFake } from './fake'
import { debugLog, sleep } from './utils'

export class HttxClient {
  private config: Required<Omit<HttxConfig, 'onRequestComplete' | 'circuitBreaker'>> & Pick<HttxConfig, 'onRequestComplete' | 'circuitBreaker'>
  private readonly breaker: CircuitBreaker | null

  constructor(config: Partial<HttxConfig> = {}) {
    this.config = {
      verbose: false,
      defaultHeaders: {},
      baseUrl: '',
      timeout: 30000,
      retry: {},
      ...config,
    }
    // The circuit breaker is opt-in: callers who don't pass `circuitBreaker`
    // get the existing behavior unchanged. Passing `true` accepts the
    // defaults (5 failures, 30s cooldown), or pass the options object for
    // tuning. A `false` literal disables it explicitly even if a parent
    // config tried to enable it.
    this.breaker = config.circuitBreaker === false || config.circuitBreaker === undefined
      ? null
      : new CircuitBreaker(config.circuitBreaker === true ? {} : config.circuitBreaker)
  }

  // ---------------------------------------------------------------------------
  // Convenience verb methods. The original `request(url, options)` form is
  // still the canonical entry point; these wrappers just save callers from
  // typing `{ method: 'GET' }` for the common cases.
  // ---------------------------------------------------------------------------

  /**
   * GET request.
   *
   * @example
   * ```ts
   * const result = await client.get('/users/42')
   * if (result.isOk) console.log(result.value.data)
   * ```
   */
  get<T = unknown>(url: string, options: Omit<RequestOptions, 'method'> = {} as Omit<RequestOptions, 'method'>): Promise<Result<HttxResponse<T>, Error>> {
    return this.request<T>(url, { ...(options as RequestOptions), method: 'GET' })
  }

  /** POST request. `body` is sent as JSON unless `options.form`/`options.multipart` is set. */
  post<T = unknown>(url: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {} as Omit<RequestOptions, 'method' | 'body'>): Promise<Result<HttxResponse<T>, Error>> {
    return this.request<T>(url, {
      ...(options as RequestOptions),
      method: 'POST',
      body: body as RequestOptions['body'],
      json: (options as RequestOptions).json ?? (body !== undefined && !((options as RequestOptions).form || (options as RequestOptions).multipart)),
    })
  }

  /** PUT request. Same body handling as `post`. */
  put<T = unknown>(url: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {} as Omit<RequestOptions, 'method' | 'body'>): Promise<Result<HttxResponse<T>, Error>> {
    return this.request<T>(url, {
      ...(options as RequestOptions),
      method: 'PUT',
      body: body as RequestOptions['body'],
      json: (options as RequestOptions).json ?? (body !== undefined && !((options as RequestOptions).form || (options as RequestOptions).multipart)),
    })
  }

  /** PATCH request. Same body handling as `post`. */
  patch<T = unknown>(url: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {} as Omit<RequestOptions, 'method' | 'body'>): Promise<Result<HttxResponse<T>, Error>> {
    return this.request<T>(url, {
      ...(options as RequestOptions),
      method: 'PATCH',
      body: body as RequestOptions['body'],
      json: (options as RequestOptions).json ?? (body !== undefined && !((options as RequestOptions).form || (options as RequestOptions).multipart)),
    })
  }

  /** DELETE request. */
  delete<T = unknown>(url: string, options: Omit<RequestOptions, 'method'> = {} as Omit<RequestOptions, 'method'>): Promise<Result<HttxResponse<T>, Error>> {
    return this.request<T>(url, { ...(options as RequestOptions), method: 'DELETE' })
  }

  /** HEAD request — useful for existence/size checks. */
  head<T = unknown>(url: string, options: Omit<RequestOptions, 'method'> = {} as Omit<RequestOptions, 'method'>): Promise<Result<HttxResponse<T>, Error>> {
    return this.request<T>(url, { ...(options as RequestOptions), method: 'HEAD' })
  }

  /**
   * Snapshot of the circuit-breaker state for diagnostics. Returns an
   * empty array when the breaker is disabled.
   */
  circuitSnapshot(): ReturnType<CircuitBreaker['snapshot']> {
    return this.breaker?.snapshot() ?? []
  }

  /**
   * Force-close the circuit for a specific host (no-op if breaker
   * disabled or host has no entry). Useful after a manual remediation.
   */
  resetCircuit(host: string): void {
    this.breaker?.reset(host)
  }

  async request<T = unknown>(
    url: string,
    options: RequestOptions,
  ): Promise<Result<HttxResponse<T>, Error>> {
    const retryOptions = this.mergeRetryOptions(options.retry)
    let lastError: Error | undefined

    // Compute the host once so we can short-circuit before consuming a
    // retry attempt when the circuit is open. URL-parse failures fall
    // through to the existing per-attempt error handler — those are
    // user-error (typo'd URL), not breaker concerns.
    const host = this.tryGetHost(url)

    if (this.breaker && host) {
      try {
        this.breaker.guard(host)
      }
      catch (e) {
        if (e instanceof CircuitOpenError) return err(e as Error)
        throw e
      }
    }

    for (let attempt = 0; attempt <= (retryOptions.retries || 0); attempt++) {
      if (attempt > 0) {
        const delay = this.calculateRetryDelay(attempt, retryOptions.retryDelay || 1000)
        debugLog('retry', () => `Retrying request (attempt ${attempt}/${retryOptions.retries}) after ${delay}ms`, this.config.verbose)
        await sleep(delay)
      }

      const result = await this.executeRequest<T>(url, options, attempt)

      if (result.isOk) {
        if (this.breaker && host) this.breaker.recordSuccess(host)
        return result
      }

      lastError = result.error

      // Check if we should retry
      if (!lastError || !this.shouldRetry(lastError, attempt, retryOptions)) {
        break
      }

      debugLog('retry', () => `Request failed: ${lastError?.message || 'Unknown error'}`, this.config.verbose)
    }

    if (this.breaker && host && lastError) this.breaker.recordFailure(host)
    return err(lastError || new Error('Request failed'))
  }

  /**
   * Best-effort URL parse for the breaker's host key. Returns null
   * when the URL is unparseable (not absolute + no baseUrl) — in
   * that case the breaker is bypassed for this request rather than
   * throwing, since URL parsing happens for real later in the flow.
   */
  private tryGetHost(url: string): string | null {
    try {
      const base = this.config.baseUrl ? new URL(this.config.baseUrl) : null
      const parsed = base ? new URL(url, base) : new URL(url)
      return parsed.host
    }
    catch {
      return null
    }
  }

  private async executeRequest<T = unknown>(
    url: string,
    options: RequestOptions,
    retryCount: number = 0,
  ): Promise<Result<HttxResponse<T>, Error>> {
    const startTime = performance.now()

    try {
      const finalUrl = this.buildUrl(url, options.query)
      debugLog('request', () => `${options.method} ${finalUrl}`, this.config.verbose)

      const timeoutSignal = options.timeout || this.config.timeout
        ? AbortSignal.timeout(options.timeout || this.config.timeout)
        : undefined

      const headers = this.buildHeaders(options)
      const body = await this.buildBody(options)

      debugLog('request', () => {
        const headerObj: Record<string, string> = {}
        headers.forEach((value, key) => {
          headerObj[key] = value
        })
        return `Request headers: ${JSON.stringify(headerObj)}`
      }, this.config.verbose)
      if (body) {
        debugLog('request', () => `Request body: ${typeof body === 'string' ? body : '[FormData/Binary]'}`, this.config.verbose)
      }

      const requestInit: RequestInit = {
        method: options.method,
        headers,
        signal: options.signal || timeoutSignal,
        body,
      }

      // Faking intercept (stacksjs/ts-http#1760): when fakes are
      // installed, resolve a stub instead of hitting the network. The
      // recorder captures every request (matched or not) so
      // `assertSent` can inspect it. A real `Response` is synthesized
      // so the parse path below is identical to a live request.
      const response = isFaking()
        ? await this.fetchFaked(finalUrl, headers, body, options)
        : await fetch(finalUrl, {
            ...requestInit,
            verbose: options.verbose || this.config.verbose !== false,
          })

      // Handle streaming response
      if (options.stream && response.body) {
        const streamResult: HttxResponse<T> = {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.body as T,
          timings: {
            start: startTime,
            end: performance.now(),
            duration: performance.now() - startTime,
          },
        }

        debugLog('response', () => `${streamResult.status} ${streamResult.statusText} (streaming)`, this.config.verbose)
        this.fireRequestComplete(options, finalUrl, streamResult, retryCount)
        return ok(streamResult)
      }

      const data = await this.parseResponse<T>(response, options.method, finalUrl)
      const endTime = performance.now()

      const result: HttxResponse<T> = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data,
        timings: {
          start: startTime,
          end: endTime,
          duration: endTime - startTime,
        },
      }

      debugLog('response', () => `${result.status} ${result.statusText} (${result.timings.duration.toFixed(2)}ms)`, this.config.verbose)
      debugLog('response', () => `Response data: ${this.serializeData(data)}`, this.config.verbose)

      this.fireRequestComplete(options, finalUrl, result, retryCount)
      return ok(result)
    }
    catch (error) {
      const duration = performance.now() - startTime
      if (error instanceof Error) {
        this.fireRequestComplete(options, url, null, retryCount, error, duration)

        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          const timeout = options.timeout || this.config.timeout
          return err(new HttxTimeoutError(options.method, url, timeout) as Error)
        }

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          return err(new HttxNetworkError(
            `Unable to connect to ${url}`,
            options.method,
            url,
            error,
          ) as Error)
        }

        return err(error)
      }

      return err(new Error(String(error)))
    }
  }

  /**
   * Resolve a faked response (stacksjs/ts-http#1760). Records the
   * request, then either returns a synthesized `Response` from the
   * matched stub, falls through to the real network (passthrough), or
   * throws `HttxFakeUnmatchedError` (strict default).
   */
  private async fetchFaked(
    finalUrl: string,
    headers: Headers,
    body: BodyInit | undefined,
    options: RequestOptions,
  ): Promise<Response> {
    // Record headers with the caller's original casing (HTTP header
    // names are case-insensitive, but assertions read a plain object,
    // so `req.headers.Authorization` should match what the caller
    // wrote). Mirror buildHeaders' content-type/accept derivation.
    const headerObj: Record<string, string> = { ...this.config.defaultHeaders }
    if (options.headers && !(options.headers instanceof Headers) && !Array.isArray(options.headers)) {
      Object.assign(headerObj, options.headers as Record<string, string>)
    }
    else if (options.headers) {
      new Headers(options.headers).forEach((value, key) => { headerObj[key] = value })
    }
    if (options.json) headerObj['Content-Type'] = 'application/json'
    else if (options.form) headerObj['Content-Type'] = 'application/x-www-form-urlencoded'
    else if (options.multipart) delete headerObj['Content-Type']
    if (options.acceptHeader) headerObj.Accept = options.acceptHeader
    else if (options.json && !('Accept' in headerObj)) headerObj.Accept = 'application/json'

    const fakeReq: FakeRequest = {
      method: options.method,
      url: finalUrl,
      headers: headerObj,
      body: typeof body === 'string' ? body : undefined,
    }

    const resolution = resolveFake(fakeReq)
    if (resolution.matched && resolution.spec) {
      return buildFakeResponse(resolution.spec)
    }
    if (resolution.passthrough) {
      return fetch(finalUrl, {
        method: options.method,
        headers,
        signal: options.signal,
        body,
        verbose: options.verbose || this.config.verbose !== false,
      })
    }
    throw new HttxFakeUnmatchedError(options.method, finalUrl)
  }

  private fireRequestComplete<T>(
    options: RequestOptions,
    url: string,
    response: HttxResponse<T> | null,
    retryCount: number,
    error?: Error,
    fallbackDuration?: number,
  ): void {
    if (!this.config.onRequestComplete) return

    const reqHeaders: Record<string, string> = {}
    const builtHeaders = this.buildHeaders(options)
    builtHeaders.forEach((value, key) => { reqHeaders[key] = value })

    const resHeaders: Record<string, string> = {}
    if (response) {
      response.headers.forEach((value, key) => { resHeaders[key] = value })
    }

    // Extract status from HttxResponseError when no response object
    const errorStatus = error instanceof HttxResponseError ? error.statusCode ?? 0
      : error instanceof HttxRequestError ? error.statusCode ?? 0
        : 0
    const errorStatusText = error instanceof HttxResponseError ? error.statusText : ''

    const record: RequestCompleteRecord = {
      method: options.method,
      url,
      status: response?.status ?? errorStatus,
      statusText: response?.statusText ?? (errorStatusText || error?.message || 'Unknown Error'),
      duration: response?.timings.duration ?? fallbackDuration ?? 0,
      requestHeaders: reqHeaders,
      responseHeaders: resHeaders,
      requestBody: typeof options.body === 'string' ? options.body : options.body ? JSON.stringify(options.body) : undefined,
      responseBody: response ? this.serializeData(response.data) : undefined,
      error: error?.message,
      retryCount,
    }

    try {
      this.config.onRequestComplete(record)
    }
    catch {
      // Don't let hook errors affect the request
    }
  }

  private buildUrl(url: string, query?: Record<string, string>): string {
    const baseUrl = this.config.baseUrl ? new URL(this.config.baseUrl) : null
    const finalUrl = baseUrl ? new URL(url, baseUrl) : new URL(url)

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        finalUrl.searchParams.append(key, value)
      })
    }

    return finalUrl.toString()
  }

  private buildHeaders(options: RequestOptions): Headers {
    const headers = new Headers(this.config.defaultHeaders)

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        if (value) {
          headers.set(key, value)
        }
      }
    }

    // Set Content-Type based on request body type
    if (options.json) {
      headers.set('Content-Type', 'application/json')
    }
    else if (options.form) {
      headers.set('Content-Type', 'application/x-www-form-urlencoded')
    }
    else if (options.multipart) {
      // Content-Type is automatically set for FormData with boundary
      headers.delete('Content-Type')
    }

    // Set Accept header for response preference
    if (options.acceptHeader) {
      headers.set('Accept', options.acceptHeader)
    }
    else if (options.json && !headers.has('Accept')) {
      headers.set('Accept', 'application/json')
    }

    return headers
  }

  private async buildBody(options: RequestOptions): Promise<BodyInit | undefined> {
    if (!options.body) {
      return undefined
    }

    if (options.json) {
      debugLog('request', () => `Building JSON body from: ${JSON.stringify(options.body)}`, this.config.verbose)
      return JSON.stringify(options.body)
    }

    if (options.form && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(options.body)) {
        params.append(key, String(value))
      }
      return params.toString()
    }

    if (options.body instanceof FormData) {
      return options.body
    }

    if (typeof options.body === 'string') {
      return options.body
    }

    if (typeof options.body === 'object') {
      return JSON.stringify(options.body)
    }

    throw new Error('Invalid body type')
  }

  private async parseResponse<T>(response: Response, method: string, url: string): Promise<T> {
    const contentType = response.headers.get('content-type')

    if (!response.ok) {
      let errorBody: unknown
      try {
        if (contentType?.includes('application/json')) {
          errorBody = await response.json()
        }
        else {
          errorBody = await response.text()
        }
      }
      catch {
        errorBody = response.statusText
      }

      throw new HttxResponseError(
        `HTTP ${response.status}: ${response.statusText}`,
        method,
        url,
        response.status,
        response.statusText,
        errorBody,
      )
    }

    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>
    }

    if (contentType?.includes('text/')) {
      return response.text() as unknown as T
    }

    return response.blob() as unknown as T
  }

  private mergeRetryOptions(optionsRetry?: RetryOptions): Required<RetryOptions> {
    const configRetry = this.config.retry || {}
    return {
      retries: optionsRetry?.retries ?? configRetry.retries ?? 0,
      retryDelay: optionsRetry?.retryDelay ?? configRetry.retryDelay ?? 1000,
      retryOn: optionsRetry?.retryOn ?? configRetry.retryOn ?? [408, 429, 500, 502, 503, 504],
      shouldRetry: optionsRetry?.shouldRetry ?? configRetry.shouldRetry ?? (() => true),
    }
  }

  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * 2 ** (attempt - 1)
    const jitter = Math.random() * 0.3 * exponentialDelay
    return Math.min(exponentialDelay + jitter, 30000) // Max 30s
  }

  private shouldRetry(error: Error, attempt: number, options: Required<RetryOptions>): boolean {
    if (attempt >= (options.retries || 0)) {
      return false
    }

    // Don't retry timeout errors by default
    if (error instanceof HttxTimeoutError) {
      return false
    }

    // Retry network errors
    if (error instanceof HttxNetworkError) {
      return options.shouldRetry(error, attempt)
    }

    // Retry specific HTTP status codes
    if (error instanceof HttxResponseError) {
      if (options.retryOn && error.statusCode && options.retryOn.includes(error.statusCode)) {
        return options.shouldRetry(error, attempt)
      }
      return false
    }

    return false
  }

  private serializeData(data: unknown): string {
    if (typeof data === 'string') {
      return data.length > 1000 ? `${data.substring(0, 1000)}... (${data.length} chars)` : data
    }

    if (data instanceof Blob) {
      return `[Blob ${data.size} bytes]`
    }

    try {
      const json = JSON.stringify(data)
      return json.length > 1000 ? `${json.substring(0, 1000)}... (${json.length} chars)` : json
    }
    catch {
      return '[Unable to serialize data]'
    }
  }
}
