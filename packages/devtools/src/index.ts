import type { DashboardConfig } from './types'
import path from 'node:path'
import { defaultConfig as stxDefaultConfig, injectRouterScript, processDirectives } from '@stacksjs/stx'
import { createApiRoutes, resolveConfig } from './api'

export type { DashboardConfig, DashboardStats, EndpointDetail, EndpointStats, EventLogEntry, HttpMethod, MonitoringAlert, RequestMetrics, RequestRecord, StatusDistribution, StorageConfig, TimeSeriesPoint, ThroughputPoint } from './types'
export { createApiRoutes, fetchAlerts, fetchDashboardStats, fetchEndpointDetail, fetchEndpointList, fetchEventLog, fetchMonitoringState, fetchRequestById, fetchRequestHistory } from './api'
export { createRecorder } from './recorder'
export { trackRequests, isTrackingRequests } from './track'
export type { TrackRequestsOptions } from './track'
export { putRequest, queryAllRequests, getRequestById, getRequestCount, pruneOldRequests, closeDb } from './storage'
export type { SqliteStorageConfig } from './storage'

const PAGES_DIR = path.join(import.meta.dir, 'pages')

const stxConfig = {
  ...stxDefaultConfig,
  componentsDir: path.join(PAGES_DIR, 'components'),
  layoutsDir: path.join(PAGES_DIR, 'layouts'),
  partialsDir: path.join(PAGES_DIR, 'partials'),
}

// Lightweight parameterized route matcher
interface RouteMatch {
  handler: string
  params: Record<string, string>
}

const pageRoutes: Array<{ pattern: RegExp, handler: string, paramNames: string[] }> = [
  { pattern: /^\/$/, handler: 'index', paramNames: [] },
  { pattern: /^\/index$/, handler: 'index', paramNames: [] },
  { pattern: /^\/requests\/([^/]+)$/, handler: 'request-details', paramNames: ['id'] },
  { pattern: /^\/requests$/, handler: 'requests', paramNames: [] },
  { pattern: /^\/endpoints\/([^/]+)$/, handler: 'endpoint-details', paramNames: ['path'] },
  { pattern: /^\/endpoints$/, handler: 'endpoints', paramNames: [] },
  { pattern: /^\/metrics$/, handler: 'metrics', paramNames: [] },
  { pattern: /^\/monitoring$/, handler: 'monitoring', paramNames: [] },
  { pattern: /^\/timeline$/, handler: 'timeline', paramNames: [] },
  { pattern: /^\/network$/, handler: 'network', paramNames: [] },
  { pattern: /^\/compare$/, handler: 'compare', paramNames: [] },
  { pattern: /^\/export$/, handler: 'export', paramNames: [] },
  { pattern: /^\/settings$/, handler: 'settings', paramNames: [] },
]

function matchRoute(pathname: string): RouteMatch | null {
  for (const route of pageRoutes) {
    const match = pathname.match(route.pattern)
    if (match) {
      const params: Record<string, string> = {}
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1])
      })
      return { handler: route.handler, params }
    }
  }
  return null
}

async function renderStxPage(templateName: string, context: Record<string, unknown> = {}): Promise<string> {
  const templatePath = path.join(PAGES_DIR, `${templateName}.stx`)
  const content = await Bun.file(templatePath).text()
  const templateContext = {
    ...context,
    __filename: templatePath,
    __dirname: path.dirname(templatePath),
  }
  let html = await processDirectives(content, templateContext, templatePath, stxConfig, new Set())
  html = injectRouterScript(html)
  return html
}

// --- Server ---

export async function serveDashboard(options: DashboardConfig = {}): Promise<void> {
  const config = resolveConfig(options)
  const apiRoutes = createApiRoutes(config)

  const server = Bun.serve({
    port: config.port,
    hostname: config.host,

    async fetch(req: Request) {
      const url = new URL(req.url)
      const pathname = url.pathname

      // Static API routes (exact match)
      if (pathname === '/api/stats') return apiRoutes['/api/stats']()
      if (pathname === '/api/requests') return apiRoutes['/api/requests']()
      if (pathname === '/api/endpoints') return apiRoutes['/api/endpoints']()
      if (pathname === '/api/events') return apiRoutes['/api/events']()
      if (pathname === '/api/alerts') return apiRoutes['/api/alerts']()

      // Parameterized API routes
      const reqMatch = pathname.match(/^\/api\/requests\/(.+)$/)
      if (reqMatch) {
        const id = decodeURIComponent(reqMatch[1])
        return apiRoutes['/api/requests/:id'](id)
      }

      const epMatch = pathname.match(/^\/api\/endpoints\/(.+)$/)
      if (epMatch) {
        const encoded = decodeURIComponent(epMatch[1])
        const parts = encoded.split(' ')
        const method = parts[0]
        const epPath = parts.slice(1).join(' ')
        return apiRoutes['/api/endpoints/:path'](method, epPath)
      }

      // Page routes — render .stx templates
      const route = matchRoute(pathname)
      if (route) {
        const html = await renderStxPage(route.handler, route.params)
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' },
        })
      }

      return new Response('Not Found', { status: 404 })
    },
  })

  console.log(`httx dashboard running at http://${server.hostname}:${server.port}`)
}
