/**
 * Test faking / mocking for httx (stacksjs/ts-http#1760).
 *
 * Intercepts dispatch before the network call so tests can stub
 * responses and assert what was sent — no real HTTP, no per-test
 * `globalThis.fetch` monkey-patch. Mirrors Laravel's `Http::fake()`.
 *
 * ```ts
 * import { httx } from '@stacksjs/httx'
 *
 * httx.fake({ 'api.github.com/*': { status: 200, body: { login: 'octocat' } } })
 * const res = await httx.get('https://api.github.com/users/octocat')
 * httx.assertSent(req => req.method === 'GET')
 * httx.restoreFetch()
 * ```
 */

/** A request as seen by the fake layer (and the recorder). */
export interface FakeRequest {
  method: string
  url: string
  headers: Record<string, string>
  body?: string
}

/** A canned response. All fields optional — defaults to an empty 200. */
export interface FakeResponseSpec {
  status?: number
  body?: unknown
  headers?: Record<string, string>
  /** Override the reason phrase; defaults to the standard for `status`. */
  statusText?: string
}

/** Dynamic stub: compute the response from the outgoing request. */
export type FakeResponder = FakeResponseSpec | ((req: FakeRequest) => FakeResponseSpec)

/**
 * Ordered responses for a single pattern — first call returns the
 * first spec, second the second, etc. The last spec repeats once the
 * sequence is exhausted (matches Laravel's `Http::sequence()` "pad"
 * behaviour rather than throwing).
 */
export class FakeSequence {
  private index = 0
  constructor(private readonly specs: FakeResponseSpec[]) {
    if (specs.length === 0)
      throw new Error('[httx.sequence] needs at least one response spec')
  }

  next(): FakeResponseSpec {
    const spec = this.specs[Math.min(this.index, this.specs.length - 1)]
    this.index++
    return spec
  }
}

export type FakeStub = FakeResponder | FakeSequence

/** Map of URL glob (or `'METHOD url-glob'`) → stub. */
export type FakeMap = Record<string, FakeStub>

export interface FakeOptions {
  /**
   * When a request matches no stub: `false` (default) throws so a
   * test can't silently hit the network; `true` lets it fall through
   * to the real `fetch`.
   */
  passthrough?: boolean
}

interface FakeState {
  stubs: FakeMap | null // null → fake everything with an empty 200
  passthrough: boolean
}

let state: FakeState | null = null
const recorded: FakeRequest[] = []

/** Error thrown when faking is strict and a request matches no stub. */
export class HttxFakeUnmatchedError extends Error {
  constructor(method: string, url: string) {
    super(
      `[httx.fake] No stub matched ${method} ${url}. `
      + `Add a matching pattern to httx.fake({...}), pass { passthrough: true } to allow real requests, `
      + `or call httx.fake() with no arguments to stub everything.`,
    )
    this.name = 'HttxFakeUnmatchedError'
  }
}

/**
 * Turn a glob pattern into a RegExp. `*` matches any run of
 * characters; everything else is matched literally. The protocol
 * (`https://`) is optional in patterns, so `api.test/*` matches
 * `https://api.test/x`.
 */
function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // escape regex metachars (not `*`)
    .replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`)
}

/**
 * Does a `'pattern'` (optionally `'METHOD pattern'`) match this
 * request? URL is compared both as-is and with the protocol stripped,
 * so patterns can omit `https://`.
 */
function patternMatches(pattern: string, req: FakeRequest): boolean {
  let urlPattern = pattern
  const spaceIdx = pattern.indexOf(' ')
  if (spaceIdx > 0) {
    const maybeMethod = pattern.slice(0, spaceIdx).toUpperCase()
    if (/^[A-Z]+$/.test(maybeMethod) && ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(maybeMethod)) {
      if (maybeMethod !== req.method.toUpperCase()) return false
      urlPattern = pattern.slice(spaceIdx + 1).trim()
    }
  }

  const re = globToRegExp(urlPattern)
  const stripped = req.url.replace(/^[a-z]+:\/\//i, '')
  return re.test(req.url) || re.test(stripped)
}

/** Enable faking. No args → stub everything with an empty 200. */
export function installFakes(stubs?: FakeMap, options: FakeOptions = {}): void {
  state = { stubs: stubs ?? null, passthrough: options.passthrough ?? false }
  recorded.length = 0
}

/** Disable faking and clear recorded requests. */
export function uninstallFakes(): void {
  state = null
  recorded.length = 0
}

export function isFaking(): boolean {
  return state !== null
}

export interface FakeResolution {
  matched: boolean
  spec?: FakeResponseSpec
  /** True when faking is on but no stub matched and passthrough is set. */
  passthrough?: boolean
}

/**
 * Record the request, then resolve a stub for it. Always records
 * (even unmatched) so `assertSent` sees every attempt.
 */
export function resolveFake(req: FakeRequest): FakeResolution {
  if (!state) return { matched: false }
  recorded.push(req)

  // Bare fake() → everything is an empty 200.
  if (state.stubs === null) {
    return { matched: true, spec: { status: 200 } }
  }

  for (const [pattern, stub] of Object.entries(state.stubs)) {
    if (!patternMatches(pattern, req)) continue
    const spec = stub instanceof FakeSequence
      ? stub.next()
      : typeof stub === 'function'
        ? stub(req)
        : stub
    return { matched: true, spec }
  }

  if (state.passthrough) return { matched: false, passthrough: true }
  return { matched: false }
}

/** Build a real `Response` from a spec so the client's parse path is unchanged. */
export function buildFakeResponse(spec: FakeResponseSpec): Response {
  const status = spec.status ?? 200
  const headers = new Headers(spec.headers ?? {})

  let body: BodyInit | null = null
  if (spec.body != null) {
    if (typeof spec.body === 'string') {
      body = spec.body
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'text/plain')
    }
    else {
      body = JSON.stringify(spec.body)
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    }
  }

  // 204/205/304 must not carry a body per the Fetch spec.
  const nullBody = status === 204 || status === 205 || status === 304
  return new Response(nullBody ? null : body, {
    status,
    statusText: spec.statusText,
    headers,
  })
}

// ---------------------------------------------------------------------------
// Recorder + assertions
// ---------------------------------------------------------------------------

/** Every request dispatched while faking was active, in order. */
export function recordedRequests(): readonly FakeRequest[] {
  return recorded
}

export function clearRecorded(): void {
  recorded.length = 0
}

export function assertSent(predicate: (req: FakeRequest) => boolean): void {
  if (!recorded.some(predicate)) {
    throw new Error(
      `[httx.assertSent] No recorded request matched the predicate. `
      + `${recorded.length} request(s) recorded: ${summarize(recorded)}`,
    )
  }
}

export function assertNotSent(predicate: (req: FakeRequest) => boolean): void {
  const hit = recorded.find(predicate)
  if (hit) {
    throw new Error(`[httx.assertNotSent] A request matched the predicate but should not have: ${hit.method} ${hit.url}`)
  }
}

export function assertSentCount(count: number): void {
  if (recorded.length !== count) {
    throw new Error(`[httx.assertSentCount] Expected ${count} request(s), recorded ${recorded.length}: ${summarize(recorded)}`)
  }
}

export function assertNothingSent(): void {
  if (recorded.length > 0) {
    throw new Error(`[httx.assertNothingSent] Expected no requests, recorded ${recorded.length}: ${summarize(recorded)}`)
  }
}

function summarize(reqs: readonly FakeRequest[]): string {
  if (reqs.length === 0) return '(none)'
  return reqs.map(r => `${r.method} ${r.url}`).join(', ')
}
