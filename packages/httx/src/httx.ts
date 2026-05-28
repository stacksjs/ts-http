/**
 * Default `httx` facade — a process-wide convenience singleton that
 * bundles the verb methods of a shared {@link HttxClient}, the fluent
 * {@link http} builder, and the test-faking controls
 * (stacksjs/ts-http#1759, #1760).
 *
 * ```ts
 * import { httx } from '@stacksjs/httx'
 *
 * const res = await httx.get<User>('https://api.test/users/1')
 * const built = await httx.request().withToken(t).post('https://api.test/x', body)
 *
 * // tests
 * httx.fake({ 'api.test/*': { status: 200, body: { ok: true } } })
 * await httx.get('https://api.test/ping')
 * httx.assertSentCount(1)
 * httx.restoreFetch()
 * ```
 */

import type { Result } from 'ts-error-handling'
import type { FakeMap, FakeOptions, FakeRequest, FakeResponseSpec } from './fake'
import type { HttxConfig, HttxResponse, RequestOptions } from './types'
import { HttxClient } from './client'
import {
  assertNothingSent,
  assertNotSent,
  assertSent,
  assertSentCount,
  clearRecorded,
  FakeSequence,
  installFakes,
  recordedRequests,
  uninstallFakes,
} from './fake'
import { http, PendingRequest } from './pending-request'

type VerbResult<T> = Promise<Result<HttxResponse<T>, Error>>
type BodylessOptions = Omit<RequestOptions, 'method'>
type BodyOptions = Omit<RequestOptions, 'method' | 'body'>

/** Public shape of the {@link httx} facade. Annotated explicitly so
 *  the package can build under `--isolatedDeclarations`. */
export interface Httx {
  client: HttxClient
  create: (config?: Partial<HttxConfig>) => HttxClient
  request: (config?: Partial<HttxConfig>) => PendingRequest
  get: <T = unknown>(url: string, options?: BodylessOptions) => VerbResult<T>
  post: <T = unknown>(url: string, body?: unknown, options?: BodyOptions) => VerbResult<T>
  put: <T = unknown>(url: string, body?: unknown, options?: BodyOptions) => VerbResult<T>
  patch: <T = unknown>(url: string, body?: unknown, options?: BodyOptions) => VerbResult<T>
  delete: <T = unknown>(url: string, options?: BodylessOptions) => VerbResult<T>
  head: <T = unknown>(url: string, options?: BodylessOptions) => VerbResult<T>
  fake: (stubs?: FakeMap, options?: FakeOptions) => void
  restoreFetch: () => void
  sequence: (specs: FakeResponseSpec[]) => FakeSequence
  assertSent: (predicate: (req: FakeRequest) => boolean) => void
  assertNotSent: (predicate: (req: FakeRequest) => boolean) => void
  assertSentCount: (count: number) => void
  assertNothingSent: () => void
  recorded: () => readonly FakeRequest[]
  clearRecorded: () => void
}

const defaultClient = new HttxClient()

export const httx: Httx = {
  client: defaultClient,
  create: (config: Partial<HttxConfig> = {}): HttxClient => new HttxClient(config),
  request: (config: Partial<HttxConfig> = {}): PendingRequest => http(config),

  // verbs delegate to the shared client (which honours the fake registry)
  get: <T = unknown>(url: string, options?: BodylessOptions): VerbResult<T> => defaultClient.get<T>(url, options),
  post: <T = unknown>(url: string, body?: unknown, options?: BodyOptions): VerbResult<T> => defaultClient.post<T>(url, body, options),
  put: <T = unknown>(url: string, body?: unknown, options?: BodyOptions): VerbResult<T> => defaultClient.put<T>(url, body, options),
  patch: <T = unknown>(url: string, body?: unknown, options?: BodyOptions): VerbResult<T> => defaultClient.patch<T>(url, body, options),
  delete: <T = unknown>(url: string, options?: BodylessOptions): VerbResult<T> => defaultClient.delete<T>(url, options),
  head: <T = unknown>(url: string, options?: BodylessOptions): VerbResult<T> => defaultClient.head<T>(url, options),

  // faking (stacksjs/ts-http#1760)
  fake: (stubs?: FakeMap, options?: FakeOptions): void => installFakes(stubs, options),
  restoreFetch: (): void => uninstallFakes(),
  sequence: (specs: FakeResponseSpec[]): FakeSequence => new FakeSequence(specs),

  // assertions
  assertSent: (predicate: (req: FakeRequest) => boolean): void => assertSent(predicate),
  assertNotSent: (predicate: (req: FakeRequest) => boolean): void => assertNotSent(predicate),
  assertSentCount: (count: number): void => assertSentCount(count),
  assertNothingSent: (): void => assertNothingSent(),
  recorded: (): readonly FakeRequest[] => recordedRequests(),
  clearRecorded: (): void => clearRecorded(),
}
