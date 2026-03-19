#!/usr/bin/env bun
/**
 * Devtools dev server
 *
 * Runs the STX page server with API route handlers for the dashboard.
 *
 * Usage:
 *   bun packages/devtools/serve.ts
 *   bun packages/devtools/serve.ts --port 4401
 */

import { resolve, dirname } from 'node:path'
import { serve } from 'bun-plugin-stx/serve'
import { createApiRoutes } from './src/api'
import type { DashboardConfig } from './src/types'

const args = process.argv.slice(2)
const portIdx = args.indexOf('--port')
const port = portIdx >= 0 && args[portIdx + 1] ? Number(args[portIdx + 1]) : 4401

// Resolve dbPath relative to this file so it works regardless of CWD
const dbPath = resolve(dirname(import.meta.path), 'httx.sqlite')

const dashboardConfig: DashboardConfig = {
  port,
  host: 'localhost',
  storage: { driver: 'sqlite', sqlite: { dbPath } },
}

const apiHandlers = createApiRoutes(dashboardConfig)

// Build exact-match routes for STX serve
const routes: Record<string, (req: Request) => Response | Promise<Response>> = {
  '/api/ingest': (req) => apiHandlers['/api/ingest'](req),
  '/api/stats': (req) => apiHandlers['/api/stats'](req),
  '/api/requests': (req) => apiHandlers['/api/requests'](req),
  '/api/endpoints': (req) => apiHandlers['/api/endpoints'](req),
  '/api/events': (req) => apiHandlers['/api/events'](req),
  '/api/alerts': (req) => apiHandlers['/api/alerts'](req),
}

// Handle parameterized API routes via onRequest
function onRequest(req: Request): Response | Promise<Response> | null {
  const url = new URL(req.url)
  const pathname = url.pathname

  const requestMatch = pathname.match(/^\/api\/requests\/(.+)$/)
  if (requestMatch) {
    const id = decodeURIComponent(requestMatch[1])
    return apiHandlers['/api/requests/:id'](id)
  }

  const endpointMatch = pathname.match(/^\/api\/endpoints\/(.+)$/)
  if (endpointMatch) {
    const encoded = decodeURIComponent(endpointMatch[1])
    const dashSlash = encoded.indexOf('-/')
    if (dashSlash >= 0) {
      const method = encoded.slice(0, dashSlash)
      const path = encoded.slice(dashSlash + 1)
      return apiHandlers['/api/endpoints/:path'](method, path)
    }
  }

  return null
}

await serve({
  patterns: ['src/pages/'],
  port,
  routes,
  onRequest,
})
