import { describe, expect, it } from 'bun:test'
import {
  HttxError,
  HttxNetworkError,
  HttxRequestError,
  HttxResponseError,
  HttxTimeoutError,
} from '../src/errors'

describe('Error Classes', () => {
  describe('HttxError', () => {
    it('should create basic error', () => {
      const error = new HttxError('Test error')
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('HttxError')
      expect(error.message).toBe('Test error')
      expect(error.context).toBeUndefined()
    })

    it('should create error with context', () => {
      const context = { code: 'TEST_ERROR', details: 'Some details' }
      const error = new HttxError('Test error', context)
      expect(error.context).toEqual(context)
    })
  })

  describe('HttxRequestError', () => {
    it('should create request error with method and url', () => {
      const error = new HttxRequestError(
        'Request failed',
        'GET',
        'https://api.example.com/test',
        400,
      )

      expect(error).toBeInstanceOf(HttxError)
      expect(error.name).toBe('HttxRequestError')
      expect(error.message).toBe('Request failed')
      expect(error.method).toBe('GET')
      expect(error.url).toBe('https://api.example.com/test')
      expect(error.statusCode).toBe(400)
    })

    it('should create request error with context', () => {
      const error = new HttxRequestError(
        'Request failed',
        'POST',
        'https://api.example.com/test',
        500,
        { retries: 3 },
      )

      expect(error.context).toEqual({ retries: 3 })
    })
  })

  describe('HttxTimeoutError', () => {
    it('should create timeout error', () => {
      const error = new HttxTimeoutError(
        'GET',
        'https://api.example.com/slow',
        5000,
      )

      expect(error).toBeInstanceOf(HttxError)
      expect(error.name).toBe('HttxTimeoutError')
      expect(error.message).toBe('Request timeout after 5000ms: GET https://api.example.com/slow')
      expect(error.method).toBe('GET')
      expect(error.url).toBe('https://api.example.com/slow')
      expect(error.timeout).toBe(5000)
    })
  })

  describe('HttxNetworkError', () => {
    it('should create network error', () => {
      const error = new HttxNetworkError(
        'Unable to connect',
        'GET',
        'https://api.example.com/unreachable',
      )

      expect(error).toBeInstanceOf(HttxError)
      expect(error.name).toBe('HttxNetworkError')
      expect(error.message).toBe('Unable to connect')
      expect(error.method).toBe('GET')
      expect(error.url).toBe('https://api.example.com/unreachable')
    })

    it('should include original error', () => {
      const originalError = new Error('Connection refused')
      const error = new HttxNetworkError(
        'Unable to connect',
        'GET',
        'https://api.example.com/unreachable',
        originalError,
      )

      expect(error.originalError).toBe(originalError)
      expect(error.context?.originalError).toBe(originalError)
    })
  })

  describe('HttxResponseError', () => {
    it('should create response error', () => {
      const error = new HttxResponseError(
        'HTTP 404: Not Found',
        'GET',
        'https://api.example.com/missing',
        404,
        'Not Found',
      )

      expect(error).toBeInstanceOf(HttxRequestError)
      expect(error.name).toBe('HttxResponseError')
      expect(error.message).toBe('HTTP 404: Not Found')
      expect(error.statusCode).toBe(404)
      expect(error.statusText).toBe('Not Found')
    })

    it('should include response body', () => {
      const responseBody = { error: 'Resource not found' }
      const error = new HttxResponseError(
        'HTTP 404: Not Found',
        'GET',
        'https://api.example.com/missing',
        404,
        'Not Found',
        responseBody,
      )

      expect(error.responseBody).toEqual(responseBody)
      expect(error.context?.responseBody).toEqual(responseBody)
    })
  })

  describe('Error inheritance', () => {
    it('should maintain instanceof relationships', () => {
      const httxError = new HttxError('Test')
      const requestError = new HttxRequestError('Test', 'GET', 'http://test', 400)
      const timeoutError = new HttxTimeoutError('GET', 'http://test', 5000)
      const networkError = new HttxNetworkError('Test', 'GET', 'http://test')
      const responseError = new HttxResponseError('Test', 'GET', 'http://test', 404, 'Not Found')

      expect(httxError).toBeInstanceOf(Error)
      expect(requestError).toBeInstanceOf(Error)
      expect(requestError).toBeInstanceOf(HttxError)
      expect(timeoutError).toBeInstanceOf(Error)
      expect(timeoutError).toBeInstanceOf(HttxError)
      expect(networkError).toBeInstanceOf(Error)
      expect(networkError).toBeInstanceOf(HttxError)
      expect(responseError).toBeInstanceOf(Error)
      expect(responseError).toBeInstanceOf(HttxError)
      expect(responseError).toBeInstanceOf(HttxRequestError)
    })
  })

  describe('Error serialization', () => {
    it('should be JSON serializable', () => {
      const error = new HttxResponseError(
        'HTTP 500: Internal Server Error',
        'POST',
        'https://api.example.com/action',
        500,
        'Internal Server Error',
        { error: 'Database connection failed' },
      )

      const json = JSON.stringify(error)
      expect(json).toContain('500')
      expect(json).toContain('POST')
      expect(json).toContain('api.example.com')
    })
  })
})
