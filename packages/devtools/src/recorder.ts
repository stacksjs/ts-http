import type { RequestCompleteRecord } from '../../httx/src/types'
import type { RequestRecord } from './types'
import type { DynamoStorageConfig } from './dynamo'
import { putRequest } from './dynamo'

let requestCounter = 0

function generateId(): string {
  requestCounter++
  const ts = Date.now().toString(36)
  const counter = requestCounter.toString(36).padStart(4, '0')
  return `req-${ts}-${counter}`
}

function extractHostAndPath(url: string): { host: string, path: string } {
  try {
    const parsed = new URL(url)
    return { host: parsed.host, path: parsed.pathname + parsed.search }
  }
  catch {
    return { host: 'unknown', path: url }
  }
}

function estimateSize(data?: string): number {
  if (!data) return 0
  return new TextEncoder().encode(data).byteLength
}

/**
 * Creates an `onRequestComplete` callback that records requests to DynamoDB.
 *
 * Usage:
 * ```ts
 * import { createRecorder } from '@httx/devtools'
 * import { createClient } from 'httx'
 *
 * const recorder = createRecorder({ profile: 'stacks' })
 * const client = createClient({ onRequestComplete: recorder })
 * ```
 */
export function createRecorder(config: DynamoStorageConfig = {}): (record: RequestCompleteRecord) => void {
  return (raw: RequestCompleteRecord) => {
    const { host, path } = extractHostAndPath(raw.url)
    const id = generateId()
    const now = new Date().toISOString()

    const record: RequestRecord = {
      id,
      method: raw.method as RequestRecord['method'],
      url: raw.url,
      path,
      host,
      status: raw.status,
      statusText: raw.statusText,
      duration: Math.round(raw.duration * 100) / 100,
      requestSize: estimateSize(raw.requestBody),
      responseSize: estimateSize(raw.responseBody),
      timestamp: now,
      requestHeaders: raw.requestHeaders,
      responseHeaders: raw.responseHeaders,
      requestBody: raw.requestBody,
      responseBody: raw.responseBody,
      tags: buildTags(raw),
      retryCount: raw.retryCount,
      error: raw.error,
    }

    // Fire and forget — don't block the request
    putRequest(record, config).catch((err) => {
      console.error('[httx-recorder] Failed to store request:', err.message)
    })
  }
}

function buildTags(raw: RequestCompleteRecord): string[] {
  const tags: string[] = []
  if (raw.duration > 1000) tags.push('slow')
  if (raw.status >= 500) tags.push('error')
  if (raw.status === 429) tags.push('rate-limited')
  if (raw.retryCount > 0) tags.push('retry')
  if (raw.requestHeaders['Authorization']) tags.push('auth')
  return tags
}
