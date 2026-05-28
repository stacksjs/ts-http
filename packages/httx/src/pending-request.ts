/**
 * Fluent request builder for httx (stacksjs/ts-http#1759).
 *
 * Sugar over `HttxClient.request()` — accumulates per-request config
 * through a chainable API, then dispatches via the existing client so
 * all retry / circuit-breaker / timing machinery is reused. The
 * options-object API on `HttxClient` stays the canonical entry point;
 * this is purely additive.
 *
 * ```ts
 * import { http } from '@stacksjs/httx'
 *
 * const res = await http()
 *   .withToken(token)
 *   .withHeaders({ 'X-Tenant': id })
 *   .acceptJson()
 *   .retry(3, 200)
 *   .timeout(5000)
 *   .post<CreatedOrder>('https://api.test/orders', body)
 * ```
 */

import type { Result } from 'ts-error-handling'
import type { HttpMethod, HttxConfig, HttxResponse, RequestOptions, RetryOptions } from './types'
import { HttxClient } from './client'

export class PendingRequest {
  private clientConfig: Partial<HttxConfig>
  private client: HttxClient
  private headers: Record<string, string> = {}
  private query: Record<string, string> = {}
  private bodyMode: 'json' | 'form' | 'multipart' | null = null
  private perRequest: Partial<Omit<RequestOptions, 'method' | 'body'>> = {}

  constructor(config: Partial<HttxConfig> = {}) {
    this.clientConfig = config
    this.client = new HttxClient(config)
  }

  // --- headers -------------------------------------------------------------

  /** Merge headers (existing keys win is NOT the rule — later calls overwrite). */
  withHeaders(headers: Record<string, string>): this {
    Object.assign(this.headers, headers)
    return this
  }

  /** Replace the accumulated header set entirely. */
  replaceHeaders(headers: Record<string, string>): this {
    this.headers = { ...headers }
    return this
  }

  /** `Authorization: <type> <token>` (defaults to Bearer). */
  withToken(token: string, type = 'Bearer'): this {
    this.headers.Authorization = `${type} ${token}`
    return this
  }

  /** `Authorization: Basic base64(user:pass)`. */
  withBasicAuth(username: string, password: string): this {
    const encoded = btoa(`${username}:${password}`)
    this.headers.Authorization = `Basic ${encoded}`
    return this
  }

  /** `User-Agent` header. */
  withUserAgent(userAgent: string): this {
    this.headers['User-Agent'] = userAgent
    return this
  }

  /** `Accept` header. */
  accept(mime: string): this {
    this.perRequest.acceptHeader = mime
    return this
  }

  /** Shorthand for `accept('application/json')`. */
  acceptJson(): this {
    return this.accept('application/json')
  }

  // --- query ---------------------------------------------------------------

  /** Merge query-string parameters. */
  withQueryParameters(params: Record<string, string>): this {
    Object.assign(this.query, params)
    return this
  }

  // --- body encoding -------------------------------------------------------

  /** Send the body as JSON (default for object bodies on post/put/patch). */
  asJson(): this {
    this.bodyMode = 'json'
    return this
  }

  /** Send the body as `application/x-www-form-urlencoded`. */
  asForm(): this {
    this.bodyMode = 'form'
    return this
  }

  /** Send the body as `multipart/form-data`. */
  asMultipart(): this {
    this.bodyMode = 'multipart'
    return this
  }

  // --- transport -----------------------------------------------------------

  /** Per-request timeout in milliseconds. */
  timeout(ms: number): this {
    this.perRequest.timeout = ms
    return this
  }

  /** Retry config. `retry(3)` or `retry(3, 200)` or full `RetryOptions`. */
  retry(times: number | RetryOptions, delayMs?: number, shouldRetry?: RetryOptions['shouldRetry']): this {
    this.perRequest.retry = typeof times === 'number'
      ? { retries: times, ...(delayMs != null ? { retryDelay: delayMs } : {}), ...(shouldRetry ? { shouldRetry } : {}) }
      : times
    return this
  }

  /** Per-builder base URL. Rebuilds the underlying client. */
  baseUrl(url: string): this {
    this.clientConfig = { ...this.clientConfig, baseUrl: url }
    this.client = new HttxClient(this.clientConfig)
    return this
  }

  /** Escape hatch: merge raw `RequestOptions` (minus method/body). */
  withOptions(options: Partial<Omit<RequestOptions, 'method' | 'body'>>): this {
    Object.assign(this.perRequest, options)
    return this
  }

  // --- terminal verbs ------------------------------------------------------

  get<T = unknown>(url: string): Promise<Result<HttxResponse<T>, Error>> {
    return this.dispatch<T>('GET', url)
  }

  post<T = unknown>(url: string, body?: unknown): Promise<Result<HttxResponse<T>, Error>> {
    return this.dispatch<T>('POST', url, body)
  }

  put<T = unknown>(url: string, body?: unknown): Promise<Result<HttxResponse<T>, Error>> {
    return this.dispatch<T>('PUT', url, body)
  }

  patch<T = unknown>(url: string, body?: unknown): Promise<Result<HttxResponse<T>, Error>> {
    return this.dispatch<T>('PATCH', url, body)
  }

  delete<T = unknown>(url: string, body?: unknown): Promise<Result<HttxResponse<T>, Error>> {
    return this.dispatch<T>('DELETE', url, body)
  }

  head<T = unknown>(url: string): Promise<Result<HttxResponse<T>, Error>> {
    return this.dispatch<T>('HEAD', url)
  }

  private dispatch<T>(method: HttpMethod, url: string, body?: unknown): Promise<Result<HttxResponse<T>, Error>> {
    const options: RequestOptions = {
      ...this.perRequest,
      method,
      headers: this.headers,
    }

    if (Object.keys(this.query).length > 0) {
      options.query = this.query
    }

    if (body !== undefined) {
      options.body = body as RequestOptions['body']
      // Default to JSON for object bodies unless an explicit mode was set.
      const mode = this.bodyMode
        ?? (typeof body === 'object' && body !== null && !(body instanceof FormData) ? 'json' : null)
      if (mode) options[mode] = true
    }
    else if (this.bodyMode) {
      options[this.bodyMode] = true
    }

    return this.client.request<T>(url, options)
  }
}

/**
 * Start a fluent request. Pass a config (baseUrl, defaultHeaders,
 * timeout, retry, circuitBreaker) to seed defaults for this chain.
 */
export function http(config: Partial<HttxConfig> = {}): PendingRequest {
  return new PendingRequest(config)
}
