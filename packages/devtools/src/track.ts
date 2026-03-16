import type { RequestCompleteRecord } from '../../httx/src/types'
import type { SqliteStorageConfig } from './storage'
import { createRecorder } from './recorder'

export interface TrackRequestsOptions {
  /**
   * Devtools server ingest URL. When set, request records are sent over HTTP
   * instead of writing to SQLite directly.
   *
   * Defaults to 'http://localhost:4401/api/ingest'.
   */
  endpoint?: string

  /**
   * SQLite database path. Only used when `endpoint` is not set.
   * For direct SQLite mode (same-process recording).
   */
  dbPath?: string

  /**
   * Ignore requests to these hosts.
   * The devtools endpoint host is automatically ignored.
   */
  ignoreHosts?: string[]

  /**
   * Ignore requests whose URL matches any of these patterns.
   */
  ignoreUrls?: (string | RegExp)[]

  /**
   * Maximum response body size (in chars) to capture. Larger bodies are truncated.
   * Defaults to 10_000.
   */
  maxBodySize?: number

  /**
   * Whether to capture request/response bodies. Defaults to true.
   */
  captureBodies?: boolean
}

let isTracking = false
let restoreFetch: (() => void) | null = null

const DEFAULT_ENDPOINT = 'http://localhost:4401/api/ingest'

/**
 * Patches `globalThis.fetch` to track every HTTP request.
 *
 * By default, sends request records to the devtools server at localhost:4401.
 * The devtools server must be running (`bunx @stacksjs/httx-dashboard`).
 *
 * Usage:
 * ```ts
 * import { trackRequests } from '@stacksjs/httx-dashboard'
 *
 * trackRequests()
 *
 * // Every fetch() call is now tracked
 * await fetch('https://api.github.com/repos/stacksjs/stx')
 * ```
 *
 * @returns A cleanup function that restores the original fetch
 */
export function trackRequests(options: TrackRequestsOptions = {}): () => void {
  if (isTracking) {
    console.warn('[httx] trackRequests() already active — call the returned cleanup function first')
    return restoreFetch || (() => {})
  }

  const originalFetch = globalThis.fetch
  const mode = options.dbPath ? 'sqlite' : 'endpoint'
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT
  const maxBodySize = options.maxBodySize ?? 10_000
  const captureBodies = options.captureBodies ?? true

  // Build the ignore list — always ignore the ingest endpoint host
  const ignoreHosts = new Set(options.ignoreHosts ?? [])
  if (mode === 'endpoint') {
    try {
      const parsed = new URL(endpoint)
      ignoreHosts.add(parsed.host)
      ignoreHosts.add(parsed.hostname)
    }
    catch {}
  }
  const ignoreUrls = options.ignoreUrls ?? []

  // SQLite recorder (only created if in sqlite mode)
  const sqliteRecorder = mode === 'sqlite'
    ? createRecorder({ dbPath: options.dbPath })
    : null

  function record(data: RequestCompleteRecord): void {
    if (mode === 'sqlite' && sqliteRecorder) {
      sqliteRecorder(data)
    }
    else {
      // Fire and forget — don't await, don't block the app
      originalFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {
        // Silently ignore — devtools server might not be running
      })
    }
  }

  function shouldIgnore(url: string): boolean {
    try {
      const parsed = new URL(url)
      if (ignoreHosts.has(parsed.hostname)) return true
      if (ignoreHosts.has(parsed.host)) return true
    }
    catch {}

    for (const pattern of ignoreUrls) {
      if (typeof pattern === 'string') {
        if (url.includes(pattern)) return true
      }
      else if (pattern.test(url)) {
        return true
      }
    }

    return false
  }

  function truncateBody(body: string | undefined): string | undefined {
    if (!body) return undefined
    if (body.length > maxBodySize) return `${body.slice(0, maxBodySize)}... (truncated, ${body.length} chars total)`
    return body
  }

  function headersToRecord(headers: HeadersInit | undefined): Record<string, string> {
    const result: Record<string, string> = {}
    if (!headers) return result

    if (headers instanceof Headers) {
      headers.forEach((value, key) => { result[key] = value })
    }
    else if (Array.isArray(headers)) {
      for (const [key, value] of headers) {
        result[key] = value
      }
    }
    else {
      Object.assign(result, headers)
    }

    return result
  }

  const trackedFetch = async function trackedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url

    if (shouldIgnore(url)) {
      return originalFetch(input, init)
    }

    const method = (init?.method || 'GET').toUpperCase()
    const start = performance.now()

    let requestBody: string | undefined
    if (captureBodies && init?.body) {
      if (typeof init.body === 'string') {
        requestBody = init.body
      }
      else {
        try {
          requestBody = JSON.stringify(init.body)
        }
        catch {
          requestBody = '[non-serializable body]'
        }
      }
    }

    try {
      const response = await originalFetch(input, init)
      const duration = performance.now() - start

      let responseBody: string | undefined
      if (captureBodies) {
        try {
          const clone = response.clone()
          const text = await clone.text()
          responseBody = truncateBody(text)
        }
        catch {}
      }

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => { responseHeaders[key] = value })

      record({
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        duration,
        requestHeaders: headersToRecord(init?.headers),
        responseHeaders,
        requestBody: truncateBody(requestBody),
        responseBody,
        retryCount: 0,
      })

      return response
    }
    catch (error) {
      const duration = performance.now() - start

      record({
        method,
        url,
        status: 0,
        statusText: 'Network Error',
        duration,
        requestHeaders: headersToRecord(init?.headers),
        responseHeaders: {},
        requestBody: truncateBody(requestBody),
        error: error instanceof Error ? error.message : String(error),
        retryCount: 0,
      })

      throw error
    }
  }

  // Preserve any extra properties on the original fetch (e.g. Bun's `preconnect`)
  Object.assign(trackedFetch, originalFetch)
  globalThis.fetch = trackedFetch as typeof fetch

  isTracking = true

  restoreFetch = () => {
    globalThis.fetch = originalFetch
    isTracking = false
    restoreFetch = null
  }

  return restoreFetch
}

/**
 * Check if fetch tracking is currently active.
 */
export function isTrackingRequests(): boolean {
  return isTracking
}
