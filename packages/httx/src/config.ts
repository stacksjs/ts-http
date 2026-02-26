import type { HttxConfig } from './types'
import { resolve } from 'node:path'
import { loadConfig } from 'bunfig'

export const defaultConfig: HttxConfig = {
  verbose: true,
}

// Lazy-loaded config to avoid top-level await (enables bun --compile)
let _config: HttxConfig | null = null

export async function getConfig(): Promise<HttxConfig> {
  if (!_config) {
    _config = await loadConfig({
      name: 'httx',
      cwd: resolve(__dirname, '..'),
      defaultConfig,
    })
  }
  return _config
}

// For backwards compatibility - synchronous access with default fallback
export const config: HttxConfig = defaultConfig
