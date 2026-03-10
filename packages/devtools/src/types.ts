export interface StorageConfig {
  driver?: 'mock' | 'sqlite'
  sqlite?: {
    dbPath?: string
  }
}

export interface DashboardConfig {
  port?: number
  host?: string
  auth?: AuthConfig
  refreshInterval?: number
  maxHistory?: number
  storage?: StorageConfig
}

export interface AuthConfig {
  enabled?: boolean
  username?: string
  password?: string
}

export interface RequestRecord {
  id: string
  method: HttpMethod
  url: string
  path: string
  host: string
  status: number
  statusText: string
  duration: number
  requestSize: number
  responseSize: number
  timestamp: string
  headers?: Record<string, string>
  requestHeaders: Record<string, string>
  responseHeaders: Record<string, string>
  requestBody?: string
  responseBody?: string
  tags: string[]
  retryCount: number
  error?: string
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export interface RequestMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  avgResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerMinute: number
}

export interface StatusDistribution {
  '2xx': number
  '3xx': number
  '4xx': number
  '5xx': number
}

export interface TimeSeriesPoint {
  timestamp: string
  value: number
}

export interface ThroughputPoint extends TimeSeriesPoint {
  successCount: number
  errorCount: number
}

export interface DashboardStats {
  totalRequests: number
  avgResponseTime: number
  errorRate: number
  requestsPerMinute: number
  statusDistribution: StatusDistribution
  topEndpoints: EndpointStats[]
  throughputHistory: ThroughputPoint[]
  responseTimeHistory: TimeSeriesPoint[]
  recentEvents: EventLogEntry[]
  activeAlerts: MonitoringAlert[]
}

export interface EndpointStats {
  url: string
  method: HttpMethod
  count: number
  avgDuration: number
  errorRate: number
}

export interface EndpointDetail extends EndpointStats {
  p50Duration: number
  p95Duration: number
  p99Duration: number
  lastSeen: string
  statusDistribution: StatusDistribution
  recentRequests: RequestRecord[]
  responseTrend: TimeSeriesPoint[]
}

export interface MonitoringAlert {
  id: string
  name: string
  condition: string
  threshold: number
  operator: '>' | '<' | '>=' | '<=' | '=='
  severity: 'critical' | 'warning' | 'info'
  triggeredAt?: string
  resolved: boolean
}

export interface EventLogEntry {
  id: string
  type: 'request' | 'error' | 'alert' | 'system' | 'config'
  message: string
  timestamp: string
  metadata?: Record<string, unknown>
}
