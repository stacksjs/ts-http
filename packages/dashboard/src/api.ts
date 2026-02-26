import type { DashboardConfig, DashboardStats, RequestRecord, StatusDistribution } from './types'

const defaultConfig: Required<Pick<DashboardConfig, 'port' | 'host' | 'refreshInterval' | 'maxHistory'>> = {
  port: 4401,
  host: 'localhost',
  refreshInterval: 5000,
  maxHistory: 1000,
}

export function resolveConfig(config: DashboardConfig): DashboardConfig & typeof defaultConfig {
  return { ...defaultConfig, ...config }
}

export async function fetchRequestHistory(_config: DashboardConfig): Promise<RequestRecord[]> {
  // TODO: Connect to httx metrics store to read request history
  return []
}

export async function fetchDashboardStats(_config: DashboardConfig): Promise<DashboardStats> {
  // TODO: Aggregate stats from httx metrics
  const statusDistribution: StatusDistribution = {
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0,
  }

  return {
    totalRequests: 0,
    avgResponseTime: 0,
    errorRate: 0,
    requestsPerMinute: 0,
    statusDistribution,
    topEndpoints: [],
  }
}

export function createApiRoutes(config: DashboardConfig) {
  const resolvedConfig = resolveConfig(config)

  return {
    '/api/stats': async (_req?: Request) => {
      const stats = await fetchDashboardStats(resolvedConfig)
      return Response.json(stats)
    },
    '/api/requests': async (_req?: Request) => {
      const requests = await fetchRequestHistory(resolvedConfig)
      return Response.json(requests)
    },
  }
}
