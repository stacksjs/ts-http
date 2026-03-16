import type { RequestCompleteRecord } from '../../httx/src/types'
import type { DashboardConfig, DashboardStats, EndpointDetail, EndpointStats, EventLogEntry, HttpMethod, MonitoringAlert, RequestRecord, StatusDistribution, TimeSeriesPoint, ThroughputPoint } from './types'

const defaultConfig: Required<Pick<DashboardConfig, 'port' | 'host' | 'refreshInterval' | 'maxHistory'>> = {
  port: 4401,
  host: 'localhost',
  refreshInterval: 5000,
  maxHistory: 1000,
}

export function resolveConfig(config: DashboardConfig): DashboardConfig & typeof defaultConfig {
  return { ...defaultConfig, ...config }
}

// --- Mock Data ---

function generateTimestamp(minutesAgo: number): string {
  const d = new Date(Date.now() - minutesAgo * 60_000)
  return d.toISOString()
}

const mockEndpoints: Array<{ method: HttpMethod, host: string, path: string, url: string }> = [
  { method: 'GET', host: 'api.github.com', path: '/repos/stacksjs/httx', url: 'https://api.github.com/repos/stacksjs/httx' },
  { method: 'GET', host: 'api.github.com', path: '/users/octocat', url: 'https://api.github.com/users/octocat' },
  { method: 'POST', host: 'api.github.com', path: '/repos/stacksjs/httx/issues', url: 'https://api.github.com/repos/stacksjs/httx/issues' },
  { method: 'GET', host: 'api.stripe.com', path: '/v1/charges', url: 'https://api.stripe.com/v1/charges' },
  { method: 'POST', host: 'api.stripe.com', path: '/v1/charges', url: 'https://api.stripe.com/v1/charges' },
  { method: 'GET', host: 'api.stripe.com', path: '/v1/customers', url: 'https://api.stripe.com/v1/customers' },
  { method: 'PUT', host: 'api.stripe.com', path: '/v1/customers/cus_123', url: 'https://api.stripe.com/v1/customers/cus_123' },
  { method: 'DELETE', host: 'api.stripe.com', path: '/v1/customers/cus_456', url: 'https://api.stripe.com/v1/customers/cus_456' },
  { method: 'GET', host: 'jsonplaceholder.typicode.com', path: '/posts', url: 'https://jsonplaceholder.typicode.com/posts' },
  { method: 'GET', host: 'jsonplaceholder.typicode.com', path: '/posts/1', url: 'https://jsonplaceholder.typicode.com/posts/1' },
  { method: 'POST', host: 'jsonplaceholder.typicode.com', path: '/posts', url: 'https://jsonplaceholder.typicode.com/posts' },
  { method: 'PATCH', host: 'jsonplaceholder.typicode.com', path: '/posts/1', url: 'https://jsonplaceholder.typicode.com/posts/1' },
  { method: 'DELETE', host: 'jsonplaceholder.typicode.com', path: '/posts/1', url: 'https://jsonplaceholder.typicode.com/posts/1' },
  { method: 'GET', host: 'httpbin.org', path: '/get', url: 'https://httpbin.org/get' },
  { method: 'POST', host: 'httpbin.org', path: '/post', url: 'https://httpbin.org/post' },
  { method: 'PUT', host: 'httpbin.org', path: '/put', url: 'https://httpbin.org/put' },
  { method: 'GET', host: 'httpbin.org', path: '/status/200', url: 'https://httpbin.org/status/200' },
  { method: 'GET', host: 'httpbin.org', path: '/delay/2', url: 'https://httpbin.org/delay/2' },
  { method: 'GET', host: 'api.openweathermap.org', path: '/data/2.5/weather', url: 'https://api.openweathermap.org/data/2.5/weather?q=London' },
  { method: 'GET', host: 'rickandmortyapi.com', path: '/api/character', url: 'https://rickandmortyapi.com/api/character' },
]

function pickStatus(index: number): { status: number, statusText: string } {
  const roll = index % 20
  if (roll < 14) {
    const codes = [
      { status: 200, statusText: 'OK' },
      { status: 201, statusText: 'Created' },
      { status: 204, statusText: 'No Content' },
    ]
    return codes[index % codes.length]
  }
  if (roll < 15) return { status: 301, statusText: 'Moved Permanently' }
  if (roll < 17) return { status: 404, statusText: 'Not Found' }
  if (roll < 18) return { status: 401, statusText: 'Unauthorized' }
  if (roll < 19) return { status: 429, statusText: 'Too Many Requests' }
  return { status: 500, statusText: 'Internal Server Error' }
}

function seededDuration(index: number): number {
  const base = [45, 120, 230, 67, 890, 12, 340, 1500, 78, 200, 56, 3200, 150, 95, 420, 180, 700, 33, 510, 1100]
  return base[index % base.length]
}

const tags = ['api', 'auth', 'public', 'internal', 'webhook', 'retry', 'cached', 'slow']

function generateMockRequests(): RequestRecord[] {
  const requests: RequestRecord[] = []
  for (let i = 0; i < 50; i++) {
    const ep = mockEndpoints[i % mockEndpoints.length]
    const { status, statusText } = pickStatus(i)
    const duration = seededDuration(i)
    requests.push({
      id: `req-${String(i + 1).padStart(3, '0')}`,
      method: ep.method,
      url: ep.url,
      path: ep.path,
      host: ep.host,
      status,
      statusText,
      duration,
      requestSize: 100 + (i * 37) % 2000,
      responseSize: 200 + (i * 89) % 15000,
      timestamp: generateTimestamp(50 - i),
      requestHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'httx/1.0',
        ...(i % 3 === 0 ? { Authorization: 'Bearer tok_xxx' } : {}),
      },
      responseHeaders: {
        'Content-Type': 'application/json',
        'X-Request-Id': `rid-${i + 1}`,
        ...(status === 429 ? { 'Retry-After': '30' } : {}),
      },
      requestBody: ep.method !== 'GET' ? JSON.stringify({ data: `payload-${i}` }) : undefined,
      responseBody: JSON.stringify({ id: i + 1, ok: status < 400 }),
      tags: [tags[i % tags.length], ...(duration > 1000 ? ['slow'] : [])],
      retryCount: status === 429 ? 2 : status >= 500 ? 1 : 0,
      error: status >= 500 ? `Server error: ${statusText}` : undefined,
    })
  }
  return requests
}

export const mockRequests: RequestRecord[] = generateMockRequests()

function generateMockEvents(): EventLogEntry[] {
  const events: EventLogEntry[] = []
  const types: EventLogEntry['type'][] = ['request', 'error', 'alert', 'system', 'config']
  const messages = [
    'Server started on port 4401',
    'High error rate detected on api.stripe.com',
    'Request timeout on httpbin.org/delay/2',
    'Alert triggered: P95 > 1000ms',
    'Config updated: maxHistory changed to 2000',
    'New endpoint discovered: /api/character',
    'Rate limit hit on api.github.com',
    'Connection reset by peer: api.stripe.com',
    'SSL certificate verified for httpbin.org',
    'Cache invalidated for /v1/charges',
    'Alert resolved: Error rate normalized',
    'Retry succeeded for req-045',
    'DNS resolution slow for rickandmortyapi.com',
    'Response size exceeded 10KB on /posts',
    'Auth token refreshed for github API',
    'Health check passed',
    'Memory usage at 45%',
    'Request queue depth: 3',
    'Endpoint /v1/customers latency spike',
    'Dashboard refresh completed',
  ]
  for (let i = 0; i < 20; i++) {
    events.push({
      id: `evt-${String(i + 1).padStart(3, '0')}`,
      type: types[i % types.length],
      message: messages[i],
      timestamp: generateTimestamp(20 - i),
      metadata: i % 4 === 0 ? { source: 'monitor', severity: 'info' } : undefined,
    })
  }
  return events
}

export const mockEvents: EventLogEntry[] = generateMockEvents()

function generateMockAlerts(): MonitoringAlert[] {
  return [
    { id: 'alert-001', name: 'High Error Rate', condition: 'errorRate', threshold: 10, operator: '>', severity: 'critical', triggeredAt: generateTimestamp(5), resolved: false },
    { id: 'alert-002', name: 'Slow P95 Response', condition: 'p95ResponseTime', threshold: 1000, operator: '>', severity: 'warning', triggeredAt: generateTimestamp(15), resolved: false },
    { id: 'alert-003', name: 'High Request Volume', condition: 'requestsPerMinute', threshold: 100, operator: '>', severity: 'info', triggeredAt: generateTimestamp(30), resolved: true },
    { id: 'alert-004', name: 'Endpoint Down', condition: 'status', threshold: 500, operator: '>=', severity: 'critical', triggeredAt: generateTimestamp(2), resolved: false },
    { id: 'alert-005', name: 'Memory Threshold', condition: 'memory', threshold: 80, operator: '>', severity: 'warning', resolved: true },
  ]
}

export const mockAlerts: MonitoringAlert[] = generateMockAlerts()

// --- SQLite imports ---
import { queryAllRequests as sqliteQueryAll, getRequestById as sqliteGetById } from './storage'
import { createRecorder } from './recorder'
import type { SqliteStorageConfig } from './storage'

function getSqliteConfig(config: DashboardConfig): SqliteStorageConfig {
  return config.storage?.sqlite ?? {}
}

function isSqlite(config: DashboardConfig): boolean {
  return config.storage?.driver === 'sqlite'
}

// --- Fetch Functions ---

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

async function getRequests(config: DashboardConfig): Promise<RequestRecord[]> {
  if (isSqlite(config)) {
    return sqliteQueryAll(getSqliteConfig(config), { limit: config.maxHistory ?? 1000 })
  }
  return mockRequests
}

export async function fetchRequestHistory(config: DashboardConfig): Promise<RequestRecord[]> {
  return getRequests(config)
}

export async function fetchRequestById(id: string, config?: DashboardConfig): Promise<RequestRecord | undefined> {
  if (config && isSqlite(config)) {
    return sqliteGetById(id, getSqliteConfig(config))
  }
  return mockRequests.find(r => r.id === id)
}

export async function fetchDashboardStats(config: DashboardConfig): Promise<DashboardStats> {
  const reqs = await getRequests(config)
  const total = reqs.length
  const durations = reqs.map(r => r.duration).sort((a, b) => a - b)
  const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / total)
  const errors = reqs.filter(r => r.status >= 400).length
  const errorRate = Math.round((errors / total) * 100 * 10) / 10

  const sd: StatusDistribution = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 }
  for (const r of reqs) {
    if (r.status < 300) sd['2xx']++
    else if (r.status < 400) sd['3xx']++
    else if (r.status < 500) sd['4xx']++
    else sd['5xx']++
  }

  const endpoints = aggregateEndpoints(reqs)

  const throughputHistory: ThroughputPoint[] = []
  const responseTimeHistory: TimeSeriesPoint[] = []
  for (let i = 0; i < 30; i++) {
    const ts = generateTimestamp(30 - i)
    const bucket = reqs.filter((_, idx) => idx % 30 === i)
    const sc = bucket.filter(r => r.status < 400).length
    const ec = bucket.filter(r => r.status >= 400).length
    throughputHistory.push({ timestamp: ts, value: sc + ec, successCount: sc, errorCount: ec })
    const avgD = bucket.length > 0 ? Math.round(bucket.reduce((a, r) => a + r.duration, 0) / bucket.length) : 0
    responseTimeHistory.push({ timestamp: ts, value: avgD })
  }

  return {
    totalRequests: total,
    avgResponseTime: avgDuration,
    errorRate,
    requestsPerMinute: Math.round((total / 50) * 60 * 10) / 10,
    statusDistribution: sd,
    topEndpoints: endpoints.slice(0, 10),
    throughputHistory,
    responseTimeHistory,
    recentEvents: mockEvents.slice(-10),
    activeAlerts: mockAlerts.filter(a => !a.resolved),
  }
}

function aggregateEndpoints(reqs: RequestRecord[]): EndpointStats[] {
  const map = new Map<string, RequestRecord[]>()
  for (const r of reqs) {
    const key = `${r.method} ${r.path}`
    const arr = map.get(key) || []
    arr.push(r)
    map.set(key, arr)
  }
  const endpoints: EndpointStats[] = []
  for (const [, group] of map) {
    const first = group[0]
    const avg = Math.round(group.reduce((a, r) => a + r.duration, 0) / group.length)
    const errs = group.filter(r => r.status >= 400).length
    endpoints.push({
      url: first.path,
      method: first.method,
      count: group.length,
      avgDuration: avg,
      errorRate: Math.round((errs / group.length) * 100 * 10) / 10,
    })
  }
  return endpoints.sort((a, b) => b.count - a.count)
}

export async function fetchEndpointList(config?: DashboardConfig): Promise<EndpointStats[]> {
  const reqs = config ? await getRequests(config) : mockRequests
  return aggregateEndpoints(reqs)
}

export async function fetchEndpointDetail(method: string, path: string, config?: DashboardConfig): Promise<EndpointDetail | undefined> {
  const allReqs = config ? await getRequests(config) : mockRequests
  const reqs = allReqs.filter(r => r.method === method && r.path === path)
  if (reqs.length === 0) return undefined

  const durations = reqs.map(r => r.duration).sort((a, b) => a - b)
  const avg = Math.round(durations.reduce((a, b) => a + b, 0) / reqs.length)
  const errs = reqs.filter(r => r.status >= 400).length

  const sd: StatusDistribution = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 }
  for (const r of reqs) {
    if (r.status < 300) sd['2xx']++
    else if (r.status < 400) sd['3xx']++
    else if (r.status < 500) sd['4xx']++
    else sd['5xx']++
  }

  const trend: TimeSeriesPoint[] = reqs.map((r, _i) => ({
    timestamp: r.timestamp,
    value: r.duration,
  }))

  return {
    url: path,
    method: reqs[0].method,
    count: reqs.length,
    avgDuration: avg,
    errorRate: Math.round((errs / reqs.length) * 100 * 10) / 10,
    p50Duration: percentile(durations, 50),
    p95Duration: percentile(durations, 95),
    p99Duration: percentile(durations, 99),
    lastSeen: reqs[reqs.length - 1].timestamp,
    statusDistribution: sd,
    recentRequests: reqs.slice(-10),
    responseTrend: trend,
  }
}

export async function fetchEventLog(_config?: DashboardConfig): Promise<EventLogEntry[]> {
  // Events are still mock for now — will be stored in DynamoDB in a future iteration
  return mockEvents
}

export async function fetchAlerts(_config?: DashboardConfig): Promise<MonitoringAlert[]> {
  return mockAlerts
}

export async function fetchMonitoringState(_config?: DashboardConfig): Promise<{ healthScore: number, uptime: string, activeAlerts: MonitoringAlert[], events: EventLogEntry[] }> {
  const active = mockAlerts.filter(a => !a.resolved)
  const score = Math.max(0, 100 - active.length * 15)
  return {
    healthScore: score,
    uptime: '99.7%',
    activeAlerts: active,
    events: mockEvents,
  }
}

// --- API Routes ---

export function createApiRoutes(config: DashboardConfig) {
  const resolvedConfig = resolveConfig(config)

  // Recorder for ingest endpoint — writes to the same SQLite the dashboard reads
  const sqliteConfig = getSqliteConfig(config)
  const recorder = isSqlite(config) ? createRecorder(sqliteConfig) : null

  return {
    '/api/ingest': async (req?: Request) => {
      if (!req || req.method !== 'POST') {
        return Response.json({ error: 'POST required' }, { status: 405 })
      }

      if (!recorder) {
        return Response.json({ error: 'SQLite storage not configured' }, { status: 500 })
      }

      try {
        const body = await req.json() as RequestCompleteRecord

        if (!body.method || !body.url) {
          return Response.json({ error: 'Missing required fields: method, url' }, { status: 400 })
        }

        recorder(body)
        return Response.json({ ok: true })
      }
      catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
      }
    },

    '/api/stats': async (_req?: Request) => {
      const stats = await fetchDashboardStats(resolvedConfig)
      return Response.json(stats)
    },
    '/api/requests': async (_req?: Request) => {
      const requests = await fetchRequestHistory(resolvedConfig)
      return Response.json(requests)
    },
    '/api/requests/:id': async (id: string) => {
      const record = await fetchRequestById(id, resolvedConfig)
      if (!record) return Response.json({ error: 'Not found' }, { status: 404 })
      return Response.json(record)
    },
    '/api/endpoints': async (_req?: Request) => {
      const endpoints = await fetchEndpointList(resolvedConfig)
      return Response.json(endpoints)
    },
    '/api/endpoints/:path': async (method: string, path: string) => {
      const detail = await fetchEndpointDetail(method, path, resolvedConfig)
      if (!detail) return Response.json({ error: 'Not found' }, { status: 404 })
      return Response.json(detail)
    },
    '/api/events': async (_req?: Request) => {
      const events = await fetchEventLog()
      return Response.json(events)
    },
    '/api/alerts': async (_req?: Request) => {
      const alerts = await fetchAlerts()
      return Response.json(alerts)
    },
  }
}
