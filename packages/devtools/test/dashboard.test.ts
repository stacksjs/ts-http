import { describe, expect, it } from 'bun:test'
import { createApiRoutes, fetchAlerts, fetchDashboardStats, fetchEndpointDetail, fetchEndpointList, fetchEventLog, fetchRequestById, fetchRequestHistory, mockAlerts, mockEvents, mockRequests, resolveConfig } from '../src/api'
import type { DashboardConfig } from '../src/types'

describe('httx-dashboard', () => {
  describe('resolveConfig', () => {
    it('should use default values when no config provided', () => {
      const config = resolveConfig({})
      expect(config.port).toBe(4401)
      expect(config.host).toBe('localhost')
      expect(config.refreshInterval).toBe(5000)
      expect(config.maxHistory).toBe(1000)
    })

    it('should allow overriding defaults', () => {
      const config = resolveConfig({ port: 9000, host: '0.0.0.0' })
      expect(config.port).toBe(9000)
      expect(config.host).toBe('0.0.0.0')
    })
  })

  describe('mock data', () => {
    it('should have 50 mock requests', () => {
      expect(mockRequests).toHaveLength(50)
    })

    it('should have required fields on each request', () => {
      for (const req of mockRequests) {
        expect(req.id).toBeTruthy()
        expect(req.method).toBeTruthy()
        expect(req.url).toBeTruthy()
        expect(req.path).toBeTruthy()
        expect(req.host).toBeTruthy()
        expect(typeof req.status).toBe('number')
        expect(typeof req.duration).toBe('number')
        expect(req.timestamp).toBeTruthy()
        expect(req.requestHeaders).toBeDefined()
        expect(req.responseHeaders).toBeDefined()
        expect(Array.isArray(req.tags)).toBe(true)
        expect(typeof req.retryCount).toBe('number')
      }
    })

    it('should have 20 mock events', () => {
      expect(mockEvents).toHaveLength(20)
    })

    it('should have 5 mock alerts', () => {
      expect(mockAlerts).toHaveLength(5)
    })
  })

  describe('fetchDashboardStats', () => {
    it('should return non-zero aggregated stats', async () => {
      const stats = await fetchDashboardStats({})
      expect(stats.totalRequests).toBe(50)
      expect(stats.avgResponseTime).toBeGreaterThan(0)
      expect(stats.errorRate).toBeGreaterThan(0)
      expect(stats.requestsPerMinute).toBeGreaterThan(0)
      expect(stats.statusDistribution['2xx']).toBeGreaterThan(0)
      expect(stats.topEndpoints.length).toBeGreaterThan(0)
      expect(stats.throughputHistory).toHaveLength(30)
      expect(stats.responseTimeHistory).toHaveLength(30)
      expect(stats.recentEvents.length).toBeGreaterThan(0)
      expect(stats.activeAlerts.length).toBeGreaterThan(0)
    })
  })

  describe('fetchRequestHistory', () => {
    it('should return all 50 mock requests', async () => {
      const requests = await fetchRequestHistory({})
      expect(requests).toHaveLength(50)
    })
  })

  describe('fetchRequestById', () => {
    it('should return a request when found', async () => {
      const req = await fetchRequestById('req-001')
      expect(req).toBeDefined()
      expect(req!.id).toBe('req-001')
      expect(req!.method).toBeTruthy()
      expect(req!.url).toBeTruthy()
    })

    it('should return undefined when not found', async () => {
      const req = await fetchRequestById('nonexistent')
      expect(req).toBeUndefined()
    })
  })

  describe('fetchEndpointList', () => {
    it('should return aggregated endpoints', async () => {
      const endpoints = await fetchEndpointList()
      expect(endpoints.length).toBeGreaterThan(0)
      for (const ep of endpoints) {
        expect(ep.url).toBeTruthy()
        expect(ep.method).toBeTruthy()
        expect(ep.count).toBeGreaterThan(0)
        expect(typeof ep.avgDuration).toBe('number')
        expect(typeof ep.errorRate).toBe('number')
      }
    })

    it('should be sorted by request count descending', async () => {
      const endpoints = await fetchEndpointList()
      for (let i = 1; i < endpoints.length; i++) {
        expect(endpoints[i - 1].count).toBeGreaterThanOrEqual(endpoints[i].count)
      }
    })
  })

  describe('fetchEndpointDetail', () => {
    it('should return detail with trend data for existing endpoint', async () => {
      const endpoints = await fetchEndpointList()
      const first = endpoints[0]
      const detail = await fetchEndpointDetail(first.method, first.url)
      expect(detail).toBeDefined()
      expect(detail!.url).toBe(first.url)
      expect(detail!.method).toBe(first.method)
      expect(detail!.count).toBeGreaterThan(0)
      expect(typeof detail!.p50Duration).toBe('number')
      expect(typeof detail!.p95Duration).toBe('number')
      expect(typeof detail!.p99Duration).toBe('number')
      expect(detail!.lastSeen).toBeTruthy()
      expect(detail!.statusDistribution).toBeDefined()
      expect(detail!.recentRequests.length).toBeGreaterThan(0)
      expect(detail!.responseTrend.length).toBeGreaterThan(0)
    })

    it('should return undefined for nonexistent endpoint', async () => {
      const detail = await fetchEndpointDetail('GET', '/nonexistent')
      expect(detail).toBeUndefined()
    })
  })

  describe('fetchEventLog', () => {
    it('should return events array', async () => {
      const events = await fetchEventLog()
      expect(Array.isArray(events)).toBe(true)
      expect(events).toHaveLength(20)
      for (const event of events) {
        expect(event.id).toBeTruthy()
        expect(event.type).toBeTruthy()
        expect(event.message).toBeTruthy()
        expect(event.timestamp).toBeTruthy()
      }
    })
  })

  describe('fetchAlerts', () => {
    it('should return alerts array', async () => {
      const alerts = await fetchAlerts()
      expect(Array.isArray(alerts)).toBe(true)
      expect(alerts).toHaveLength(5)
      for (const alert of alerts) {
        expect(alert.id).toBeTruthy()
        expect(alert.name).toBeTruthy()
        expect(alert.condition).toBeTruthy()
        expect(typeof alert.threshold).toBe('number')
        expect(alert.operator).toBeTruthy()
        expect(alert.severity).toBeTruthy()
        expect(typeof alert.resolved).toBe('boolean')
      }
    })
  })

  describe('createApiRoutes', () => {
    it('should create all 7 API route handlers', () => {
      const routes = createApiRoutes({})
      expect(routes['/api/stats']).toBeDefined()
      expect(routes['/api/requests']).toBeDefined()
      expect(routes['/api/requests/:id']).toBeDefined()
      expect(routes['/api/endpoints']).toBeDefined()
      expect(routes['/api/endpoints/:path']).toBeDefined()
      expect(routes['/api/events']).toBeDefined()
      expect(routes['/api/alerts']).toBeDefined()
    })

    it('should return JSON from stats endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/stats']()
      expect(response).toBeInstanceOf(Response)
      const data = await response.json()
      expect(data).toHaveProperty('totalRequests')
      expect(data).toHaveProperty('avgResponseTime')
      expect(data).toHaveProperty('statusDistribution')
      expect(data).toHaveProperty('throughputHistory')
      expect(data).toHaveProperty('responseTimeHistory')
      expect(data).toHaveProperty('recentEvents')
      expect(data).toHaveProperty('activeAlerts')
    })

    it('should return JSON array from requests endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/requests']()
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(50)
    })

    it('should return JSON from events endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/events']()
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(20)
    })

    it('should return JSON from alerts endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/alerts']()
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(5)
    })

    it('should return request by id from requests/:id endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/requests/:id']('req-001')
      const data = await response.json()
      expect(data.id).toBe('req-001')
    })

    it('should return 404 for nonexistent request id', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/requests/:id']('nonexistent')
      expect(response.status).toBe(404)
    })

    it('should return endpoints list from endpoints endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/endpoints']()
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })
  })
})
