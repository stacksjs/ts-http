import type { Result } from 'ts-error-handling'
import type { HttxConfig, HttxResponse, RequestOptions, RetryOptions } from './types'
import { err, ok } from 'ts-error-handling'
import { HttxNetworkError, HttxResponseError, HttxTimeoutError } from './errors'
import { debugLog, sleep } from './utils'

export class HttxClient {
  private config: Required<HttxConfig>

  constructor(config: Partial<HttxConfig> = {}) {
    this.config = {
      verbose: false,
      defaultHeaders: {},
      baseUrl: '',
      timeout: 30000,
      retry: {},
      ...config,
    }
  }

  async request<T = unknown>(
    url: string,
    options: RequestOptions,
  ): Promise<Result<HttxResponse<T>, Error>> {
    const retryOptions = this.mergeRetryOptions(options.retry)
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= (retryOptions.retries || 0); attempt++) {
      if (attempt > 0) {
        const delay = this.calculateRetryDelay(attempt, retryOptions.retryDelay || 1000)
        debugLog('retry', () => `Retrying request (attempt ${attempt}/${retryOptions.retries}) after ${delay}ms`, this.config.verbose)
        await sleep(delay)
      }

      const result = await this.executeRequest<T>(url, options)

      if (result.isOk) {
        return result
      }

      lastError = result.error

      // Check if we should retry
      if (!lastError || !this.shouldRetry(lastError, attempt, retryOptions)) {
        break
      }

      debugLog('retry', () => `Request failed: ${lastError?.message || 'Unknown error'}`, this.config.verbose)
    }

    return err(lastError || new Error('Request failed'))
  }

  private async executeRequest<T = unknown>(
    url: string,
    options: RequestOptions,
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

      const response = await fetch(finalUrl, {
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

      return ok(result)
    }
    catch (error) {
      if (error instanceof Error) {
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
