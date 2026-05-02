/// <reference lib="dom" />

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
} as const

export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS]

export interface BunFetchInit extends Omit<RequestInit, 'body'> {
  verbose?: boolean
  timeout?: number
  body?: BodyInit | Record<string, string>
}

export interface RetryOptions {
  retries?: number
  retryDelay?: number
  retryOn?: number[]
  shouldRetry?: (error: Error, attempt: number) => boolean
}

export interface RequestOptions extends Omit<BunFetchInit, 'method'> {
  method: HttpMethod
  query?: Record<string, string>
  form?: boolean
  multipart?: boolean
  json?: boolean
  unix?: string
  proxy?: string
  downloadProgress?: (progress: number) => void
  retry?: RetryOptions
  stream?: boolean
  acceptHeader?: string
}

export interface RequestCompleteRecord {
  method: string
  url: string
  status: number
  statusText: string
  duration: number
  requestHeaders: Record<string, string>
  responseHeaders: Record<string, string>
  requestBody?: string
  responseBody?: string
  error?: string
  retryCount: number
}

export interface HttxConfig {
  verbose?: boolean | string[]
  defaultHeaders?: Record<string, string>
  baseUrl?: string
  timeout?: number
  retry?: RetryOptions
  onRequestComplete?: (record: RequestCompleteRecord) => void | Promise<void>
  /**
   * Per-host circuit breaker. `true` opts in with defaults
   * (5 failures → 30s cooldown), or pass an options object for
   * tuning. Defaults to disabled. When the breaker is open for
   * a host, requests fail fast with `CircuitOpenError` *without*
   * consuming retry attempts — letting the upstream recover
   * instead of being hammered by N retrying clients.
   */
  circuitBreaker?: boolean | import('./circuit-breaker').CircuitBreakerOptions
}

export type HttxOptions = Partial<HttxConfig>

export interface HttxResponse<T = unknown> {
  status: number
  statusText: string
  headers: Headers
  data: T
  timings: {
    start: number
    end: number
    duration: number
  }
}
