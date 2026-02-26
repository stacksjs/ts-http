import { describe, expect, it } from 'bun:test'
import { debugLog, sleep } from '../src/utils'

describe('Utils', () => {
  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const start = performance.now()
      await sleep(100)
      const duration = performance.now() - start

      // Allow some variance due to timer precision
      expect(duration).toBeGreaterThanOrEqual(95)
      expect(duration).toBeLessThan(150)
    })

    it('should resolve immediately for 0ms', async () => {
      const start = performance.now()
      await sleep(0)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(10)
    })
  })

  describe('debugLog', () => {
    it('should accept string messages', () => {
      expect(() => debugLog('test', 'Simple message', false)).not.toThrow()
    })

    it('should accept lazy message functions', () => {
      let called = false
      const lazyMessage = () => {
        called = true
        return 'Lazy message'
      }

      // With verbose = false, function should not be called
      debugLog('test', lazyMessage, false)
      expect(called).toBe(false)
    })

    it('should call lazy message when verbose is true', () => {
      let called = false
      const lazyMessage = () => {
        called = true
        return 'Lazy message'
      }

      debugLog('test', lazyMessage, true)
      expect(called).toBe(true)
    })

    it('should support array-based verbose filtering', () => {
      let requestCalled = false
      let responseCalled = false

      debugLog('request', () => {
        requestCalled = true
        return 'Request log'
      }, ['request'])

      debugLog('response', () => {
        responseCalled = true
        return 'Response log'
      }, ['request'])

      expect(requestCalled).toBe(true)
      expect(responseCalled).toBe(false)
    })

    it('should support prefix matching in verbose arrays', () => {
      let called = false

      debugLog('request:headers', () => {
        called = true
        return 'Headers log'
      }, ['request'])

      expect(called).toBe(true)
    })
  })
})
