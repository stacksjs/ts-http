import { afterEach, describe, expect, it } from 'bun:test'
import { httx } from '../src/httx'
import { http, PendingRequest } from '../src/pending-request'

/**
 * Fluent builder (stacksjs/ts-http#1759). All hermetic — faking
 * intercepts dispatch, and the function-responder echoes request
 * shape back so we can assert what the builder produced.
 */

afterEach(() => {
  httx.restoreFetch()
})

describe('http() builder', () => {
  it('returns a PendingRequest', () => {
    expect(http()).toBeInstanceOf(PendingRequest)
  })

  it('withToken sets a Bearer Authorization header', async () => {
    httx.fake({ 'api.test/*': req => ({ status: 200, body: { auth: req.headers.Authorization } }) })
    const res = await http().withToken('tok').get<{ auth: string }>('https://api.test/me')
    expect(res.unwrap().data.auth).toBe('Bearer tok')
  })

  it('withToken honours a custom scheme', async () => {
    httx.fake({ 'api.test/*': req => ({ status: 200, body: { auth: req.headers.Authorization } }) })
    const res = await http().withToken('tok', 'Token').get<{ auth: string }>('https://api.test/me')
    expect(res.unwrap().data.auth).toBe('Token tok')
  })

  it('withBasicAuth base64-encodes credentials', async () => {
    httx.fake({ 'api.test/*': req => ({ status: 200, body: { auth: req.headers.Authorization } }) })
    const res = await http().withBasicAuth('user', 'pass').get<{ auth: string }>('https://api.test/me')
    expect(res.unwrap().data.auth).toBe(`Basic ${btoa('user:pass')}`)
  })

  it('withHeaders merges; later calls overwrite', async () => {
    httx.fake({ 'api.test/*': req => ({ status: 200, body: { headers: req.headers } }) })
    const res = await http()
      .withHeaders({ 'X-A': '1', 'X-B': '2' })
      .withHeaders({ 'X-B': '3' })
      .get<{ headers: Record<string, string> }>('https://api.test/h')
    const headers = res.unwrap().data.headers
    expect(headers['X-A']).toBe('1')
    expect(headers['X-B']).toBe('3')
  })

  it('replaceHeaders discards previously-set headers', async () => {
    httx.fake({ 'api.test/*': req => ({ status: 200, body: { headers: req.headers } }) })
    const res = await http()
      .withHeaders({ 'X-Old': 'gone' })
      .replaceHeaders({ 'X-New': 'kept' })
      .get<{ headers: Record<string, string> }>('https://api.test/h')
    const headers = res.unwrap().data.headers
    expect(headers['X-Old']).toBeUndefined()
    expect(headers['X-New']).toBe('kept')
  })

  it('acceptJson sets the Accept header', async () => {
    httx.fake({ 'api.test/*': req => ({ status: 200, body: { accept: req.headers.Accept } }) })
    const res = await http().acceptJson().get<{ accept: string }>('https://api.test/a')
    expect(res.unwrap().data.accept).toBe('application/json')
  })

  it('withQueryParameters appends to the URL', async () => {
    httx.fake({ 'api.test/*': req => ({ status: 200, body: { url: req.url } }) })
    const res = await http()
      .withQueryParameters({ page: '2', per_page: '10' })
      .get<{ url: string }>('https://api.test/items')
    const url = res.unwrap().data.url
    expect(url).toContain('page=2')
    expect(url).toContain('per_page=10')
  })

  it('post sends a JSON body by default for objects', async () => {
    httx.fake({ 'api.test/*': req => ({ status: 201, body: { received: req.body, ct: req.headers['Content-Type'] } }) })
    const res = await http().post<{ received: string, ct: string }>('https://api.test/x', { name: 'ada' })
    const data = res.unwrap().data
    expect(data.ct).toBe('application/json')
    expect(JSON.parse(data.received)).toEqual({ name: 'ada' })
  })

  it('asForm switches the content-type', async () => {
    httx.fake({ 'api.test/*': req => ({ status: 200, body: { ct: req.headers['Content-Type'] } }) })
    const res = await http().asForm().post<{ ct: string }>('https://api.test/x', { a: '1', b: '2' })
    expect(res.unwrap().data.ct).toBe('application/x-www-form-urlencoded')
  })

  it('baseUrl resolves relative request URLs', async () => {
    httx.fake({ 'api.test/*': req => ({ status: 200, body: { url: req.url } }) })
    const res = await http().baseUrl('https://api.test').get<{ url: string }>('/v1/ping')
    expect(res.unwrap().data.url).toBe('https://api.test/v1/ping')
  })

  it('chains through the shared httx.request() entry point', async () => {
    httx.fake({ 'api.test/*': req => ({ status: 200, body: { method: req.method } }) })
    const res = await httx.request().acceptJson().delete<{ method: string }>('https://api.test/x')
    expect(res.unwrap().data.method).toBe('DELETE')
  })
})
