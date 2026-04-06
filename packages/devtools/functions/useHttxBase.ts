/**
 * Prefix composable for httx devtools.
 *
 * In standalone mode (bun server.ts), base path is '' — zero impact.
 * In plugin mode (Stacks app), base path is e.g. '/_httx'.
 *
 * All pages and stores use these helpers instead of hardcoding paths.
 */

declare global {
  var __httxBasePath: string | undefined
  var __httxWsUrl: string | undefined
}

/**
 * Returns the base path for httx devtools page routes.
 * Prepends the configured prefix to the given path.
 */
export function httxPath(path: string): string {
  const base = globalThis.__httxBasePath ?? ''
  return base + path
}

/**
 * Returns the full API URL with the configured prefix.
 * Use for all fetch/useQuery calls.
 */
export function httxApi(path: string): string {
  const base = globalThis.__httxBasePath ?? ''
  return base + path
}

/**
 * Returns the WebSocket URL for real-time broadcasting.
 * Falls back to localhost:6002 in standalone mode.
 */
export function httxWsUrl(): string {
  return globalThis.__httxWsUrl ?? 'ws://localhost:6002/app'
}
