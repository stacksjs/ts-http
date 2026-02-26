export interface DashboardConfig {
  port?: number
  host?: string
  auth?: AuthConfig
  refreshInterval?: number
  maxHistory?: number
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
  status: number
  statusText: string
  duration: number
  requestSize: number
  responseSize: number
  timestamp: string
  headers?: Record<string, string>
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

export interface DashboardStats {
  totalRequests: number
  avgResponseTime: number
  errorRate: number
  requestsPerMinute: number
  statusDistribution: StatusDistribution
  topEndpoints: EndpointStats[]
}

export interface EndpointStats {
  url: string
  method: HttpMethod
  count: number
  avgDuration: number
  errorRate: number
}
