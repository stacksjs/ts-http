import { afterEach, describe, expect, it } from 'bun:test'
import { HttxFakeUnmatchedError } from '../src/fake'
import { httx } from '../src/httx'

/**
 * Faking + assertions (stacksjs/ts-http#1760). Every test tears the
 * fakes down in afterEach so a leak can't bleed into the next case.
 */

afterEach(() => {
  httx.restoreFetch()
})

describe('httx.fake — stubbing', () => {
  it('stubs a matched URL with a JSON body', async () => {
    httx.fake({ 'api.github.com/*': { status: 200, body: { login: 'octocat' } } })

    const res = await httx.get<{ login: string }>('https://api.github.com/users/octocat')
    expect(res.isOk).toBe(true)
    const response = res.unwrap()
    expect(response.status).toBe(200)
    expect(response.data).toEqual({ login: 'octocat' })
  })

  it('bare fake() stubs everything with an empty 200', async () => {
    httx.fake()
    const res = await httx.get('https://anything.test/x')
    expect(res.isOk).toBe(true)
    expect(res.unwrap().status).toBe(200)
  })

  it('matches without requiring the protocol in the pattern', async () => {
    httx.fake({ 'api.test/users/*': { status: 200, body: { ok: true } } })
    const res = await httx.get('https://api.test/users/1')
    expect(res.unwrap().status).toBe(200)
  })

  it('supports a method-prefixed pattern', async () => {
    httx.fake({
      'POST api.test/*': { status: 201, body: { created: true } },
      'GET api.test/*': { status: 200, body: { created: false } },
    })
    const created = await httx.post('https://api.test/orders', { x: 1 })
    expect(created.unwrap().status).toBe(201)
    const fetched = await httx.get('https://api.test/orders')
    expect(fetched.unwrap().status).toBe(200)
  })

  it('supports a function responder that reads the request', async () => {
    httx.fake({
      'api.test/echo': req => ({ status: 200, body: { sawAuth: req.headers.Authorization ?? null } }),
    })
    const res = await httx.request()
      .withToken('abc')
      .get<{ sawAuth: string | null }>('https://api.test/echo')
    expect(res.unwrap().data.sawAuth).toBe('Bearer abc')
  })

  it('supports a response sequence (first call → first spec)', async () => {
    httx.fake({
      'api.test/flaky': httx.sequence([
        { status: 500, body: { err: 'boom' } },
        { status: 200, body: { ok: true } },
      ]),
    })

    const first = await httx.get('https://api.test/flaky')
    // 500 → the client surfaces an error Result (HttxResponseError).
    expect(first.isErr).toBe(true)

    const second = await httx.get<{ ok: boolean }>('https://api.test/flaky')
    expect(second.isOk).toBe(true)
    expect(second.unwrap().data).toEqual({ ok: true })
  })

  it('maps a non-2xx stub to an error Result', async () => {
    httx.fake({ 'api.stripe.com/*': { status: 402, body: { error: 'card_declined' } } })
    const res = await httx.post('https://api.stripe.com/v1/charges', { amount: 100 })
    expect(res.isErr).toBe(true)
  })
})

describe('httx.fake — strict vs passthrough', () => {
  it('throws HttxFakeUnmatchedError when strict and nothing matches', async () => {
    httx.fake({ 'only.this/*': { status: 200 } })
    // The unmatched request throws inside executeRequest; the client's
    // catch turns non-HTTP throws into an error Result, so assert via
    // the recorded attempt + error surface.
    const res = await httx.get('https://other.host/x')
    expect(res.isErr).toBe(true)
    if (res.isErr) expect(res.error).toBeInstanceOf(HttxFakeUnmatchedError)
  })

  it('passthrough lets unmatched requests flow (no throw)', async () => {
    // We can't assert a real network hit hermetically, but we CAN
    // assert that passthrough does NOT raise the unmatched error.
    httx.fake({ 'matches.nothing/*': { status: 200 } }, { passthrough: true })
    const res = await httx.get('https://api.test/unmatched-but-passthrough').catch(() => null)
    // Either it resolved (real fetch) or failed with a network error —
    // but never HttxFakeUnmatchedError.
    if (res && res.isErr) {
      expect(res.error).not.toBeInstanceOf(HttxFakeUnmatchedError)
    }
  })
})

describe('httx assertions', () => {
  it('assertSent matches a recorded request', async () => {
    httx.fake()
    await httx.post('https://api.test/orders', { id: 1 })
    expect(() => httx.assertSent(r => r.method === 'POST' && r.url.endsWith('/orders'))).not.toThrow()
  })

  it('assertSent throws when nothing matches', async () => {
    httx.fake()
    await httx.get('https://api.test/a')
    expect(() => httx.assertSent(r => r.url.includes('/zzz'))).toThrow(/No recorded request matched/)
  })

  it('assertSentCount reflects the number of dispatched requests', async () => {
    httx.fake()
    await httx.get('https://api.test/a')
    await httx.get('https://api.test/b')
    expect(() => httx.assertSentCount(2)).not.toThrow()
    expect(() => httx.assertSentCount(3)).toThrow(/Expected 3/)
  })

  it('assertNothingSent passes when no request was made', () => {
    httx.fake()
    expect(() => httx.assertNothingSent()).not.toThrow()
  })

  it('assertNotSent guards a forbidden request', async () => {
    httx.fake()
    await httx.get('https://api.test/safe')
    expect(() => httx.assertNotSent(r => r.url.includes('/admin'))).not.toThrow()
    expect(() => httx.assertNotSent(r => r.url.includes('/safe'))).toThrow(/should not have/)
  })

  it('records request headers for assertion (auth token check)', async () => {
    httx.fake()
    await httx.request().withToken('secret-token').post('https://api.test/x', { a: 1 })
    expect(() => httx.assertSent(r => r.headers.Authorization === 'Bearer secret-token')).not.toThrow()
  })

  it('restoreFetch clears recorded requests', async () => {
    httx.fake()
    await httx.get('https://api.test/a')
    expect(httx.recorded()).toHaveLength(1)
    httx.restoreFetch()
    httx.fake()
    expect(httx.recorded()).toHaveLength(0)
  })
})
