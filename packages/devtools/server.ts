#!/usr/bin/env bun
/**
 * httx Devtools — Dev Server
 *
 * Starts the dashboard with SQLite storage and WebSocket broadcasting.
 * All page rendering is handled by stx via serveDashboard().
 */

import { resolve, dirname } from 'node:path'
import { serveDashboard } from './src/index'

const dbPath = resolve(dirname(import.meta.path), 'httx.sqlite')

await serveDashboard({
  port: 4401,
  host: 'localhost',
  broadcastPort: 6002,
  storage: { driver: 'sqlite', sqlite: { dbPath } },
})
