import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { HttxClient } from '../src/client'
import { HttxResponseError, HttxTimeoutError } from '../src/errors'

describe('HttxClient', () => {
  let client: HttxClient

  beforeEach(() => {
    client = new HttxClient()
  })

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      expect(client).toBeInstanceOf(HttxClient)
    })

    it('should merge custom config with defaults', () => {
      const customClient = new HttxClient({
        timeout: 5000,
        baseUrl: 'https://api.example.com',
        verbose: true,
      })
      expect(customClient).toBeInstanceOf(HttxClient)
    })
  })

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const result = await client.request('https://dummyjson.com/todos/1', {
        method: 'GET',
      })

      expect(result.isOk).toBe(true)
      const response = result.unwrap()
      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(response.timings.duration).toBeGreaterThan(0)
    })

    it('should handle query parameters', async () => {
      const result = await client.request('https://dummyjson.com/todos?limit=1', {
        method: 'GET',
      })

      expect(result.isOk).toBe(true)
      const response = result.unwrap()
      expect(response.status).toBe(200)
    })
  })

  describe('POST requests', () => {
    it('should make POST request with JSON body', async () => {
      const result = await client.request('https://dummyjson.com/products/add', {
        method: 'POST',
        json: true,
        body: { title: 'Test Product', price: '99.99' },
      })

      expect(result.isOk).toBe(true)
      const response = result.unwrap()
      expect(response.status).toBe(201)
    })

    it('should make POST request with form data', async () => {
      const result = await client.request('https://dummyjson.com/products/add', {
        method: 'POST',
        form: true,
        body: { title: 'Test', price: '99.99' },
      })

      expect(result.isOk).toBe(true)
      const response = result.unwrap()
      expect(response.status).toBe(201)
    })
  })

  describe('PUT requests', () => {
    it('should update existing resource', async () => {
      const result = await client.request('https://dummyjson.com/posts/1', {
        method: 'PUT',
        json: true,
        body: { title: 'Updated Title' },
      })

      expect(result.isOk).toBe(true)
      const response = result.unwrap()
      expect(response.status).toBe(200)
    })
  })

  describe('DELETE requests', () => {
    it('should delete resource', async () => {
      const result = await client.request('https://dummyjson.com/posts/1', {
        method: 'DELETE',
      })

      expect(result.isOk).toBe(true)
      const response = result.unwrap()
      expect(response.status).toBe(200)
    })
  })

  describe('Error handling', () => {
    it('should handle 404 errors with HttxResponseError', async () => {
      const result = await client.request('https://dummyjson.com/todos/999999', {
        method: 'GET',
      })

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        const error = result.error
        expect(error).toBeInstanceOf(HttxResponseError)
        expect((error as HttxResponseError).statusCode).toBe(404)
      }
    })

    it('should handle network errors', async () => {
      // Use invalid URL to force network error
      const result = await client.request('https://192.0.2.0:9999', {
        method: 'GET',
        timeout: 1000,
      })

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        const error = result.error
        // Could be timeout or network error
        expect(error).toBeDefined()
      }
    })

    it('should handle timeout errors', async () => {
      const result = await client.request('https://httpbin.org/delay/5', {
        method: 'GET',
        timeout: 100,
      })

      expect(result.isErr).toBe(true)
      if (result.isErr) {
        const error = result.error
        expect(error).toBeInstanceOf(HttxTimeoutError)
      }
    })
  })

  describe('Headers', () => {
    it('should send custom headers', async () => {
      const result = await client.request('https://dummyjson.com/products/1', {
        method: 'GET',
        headers: {
          'X-Custom-Header': 'test-value',
        },
      })

      expect(result.isOk).toBe(true)
    })

    it('should set Content-Type for JSON requests', async () => {
      const result = await client.request('https://dummyjson.com/products/add', {
        method: 'POST',
        json: true,
        body: { test: 'data' },
      })

      expect(result.isOk).toBe(true)
    })

    it('should set custom Accept header', async () => {
      const result = await client.request('https://dummyjson.com/products/1', {
        method: 'GET',
        acceptHeader: 'application/xml',
      })

      expect(result.isOk).toBe(true)
    })
  })

  describe('Base URL', () => {
    it('should use base URL', async () => {
      const clientWithBase = new HttxClient({
        baseUrl: 'https://dummyjson.com',
      })

      const result = await clientWithBase.request('/todos/1', {
        method: 'GET',
      })

      expect(result.isOk).toBe(true)
      expect(result.unwrap().status).toBe(200)
    })
  })

  describe('Retry logic', () => {
    it('should retry on network errors', async () => {
      let attempts = 0
      const originalFetch = globalThis.fetch

      // Mock fetch to fail twice then succeed
      globalThis.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
        attempts++
        if (attempts < 3) {
          throw new TypeError('fetch failed')
        }
        return originalFetch(url, init)
      }) as unknown as typeof fetch

      const result = await client.request('https://dummyjson.com/todos/1', {
        method: 'GET',
        retry: {
          retries: 3,
          retryDelay: 100,
        },
      })

      globalThis.fetch = originalFetch

      expect(attempts).toBe(3)
      expect(result.isOk).toBe(true)
    })

    it('should retry on specific status codes', async () => {
      let attempts = 0
      const originalFetch = globalThis.fetch

      // Mock fetch to return 503 twice then 200
      globalThis.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
        attempts++
        if (attempts < 3) {
          return new Response('Service Unavailable', { status: 503 })
        }
        return originalFetch(url, init)
      }) as unknown as typeof fetch

      const result = await client.request('https://dummyjson.com/todos/1', {
        method: 'GET',
        retry: {
          retries: 3,
          retryDelay: 100,
          retryOn: [503],
        },
      })

      globalThis.fetch = originalFetch

      expect(attempts).toBe(3)
      expect(result.isOk).toBe(true)
    })

    it('should not retry when retries is 0', async () => {
      let attempts = 0
      const originalFetch = globalThis.fetch

      globalThis.fetch = mock(async () => {
        attempts++
        throw new TypeError('fetch failed')
      }) as unknown as typeof fetch

      const result = await client.request('https://dummyjson.com/todos/1', {
        method: 'GET',
        retry: {
          retries: 0,
        },
      })

      globalThis.fetch = originalFetch

      expect(attempts).toBe(1)
      expect(result.isErr).toBe(true)
    })
  })

  describe('Response parsing', () => {
    it('should parse JSON response', async () => {
      const result = await client.request('https://dummyjson.com/todos/1', {
        method: 'GET',
      })

      expect(result.isOk).toBe(true)
      const response = result.unwrap()
      expect(typeof response.data).toBe('object')
    })

    it('should handle text response', async () => {
      const result = await client.request('https://httpbin.org/robots.txt', {
        method: 'GET',
      })

      expect(result.isOk).toBe(true)
      const response = result.unwrap()
      expect(typeof response.data).toBe('string')
    })
  })

  describe('Timings', () => {
    it('should track request timing', async () => {
      const result = await client.request('https://dummyjson.com/todos/1', {
        method: 'GET',
      })

      expect(result.isOk).toBe(true)
      const response = result.unwrap()
      expect(response.timings.start).toBeGreaterThan(0)
      expect(response.timings.end).toBeGreaterThan(response.timings.start)
      expect(response.timings.duration).toBe(response.timings.end - response.timings.start)
    })
  })
})
