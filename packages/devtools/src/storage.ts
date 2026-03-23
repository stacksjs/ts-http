import { Database } from 'bun:sqlite'
import type { RequestRecord } from './types'

export interface SqliteStorageConfig {
  dbPath?: string
}

const DEFAULT_DB_PATH = 'httx.sqlite'

let db: Database | null = null

function getDb(config: SqliteStorageConfig = {}): Database {
  if (!db) {
    db = new Database(config.dbPath ?? DEFAULT_DB_PATH, { create: true })
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA foreign_keys = ON')
    ensureSchema(db)
  }
  return db
}

function ensureSchema(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      path TEXT NOT NULL,
      host TEXT NOT NULL,
      status INTEGER NOT NULL,
      status_text TEXT NOT NULL,
      duration REAL NOT NULL,
      request_size INTEGER NOT NULL DEFAULT 0,
      response_size INTEGER NOT NULL DEFAULT 0,
      timestamp TEXT NOT NULL,
      request_headers TEXT,
      response_headers TEXT,
      request_body TEXT,
      response_body TEXT,
      tags TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.exec('CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON requests(timestamp DESC)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_requests_host ON requests(host, timestamp DESC)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status, timestamp DESC)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_requests_method ON requests(method, timestamp DESC)')
}

// --- CRUD ---

export function putRequest(record: RequestRecord, config: SqliteStorageConfig = {}): void {
  const d = getDb(config)
  const stmt = d.prepare(`
    INSERT OR REPLACE INTO requests
    (id, method, url, path, host, status, status_text, duration, request_size, response_size,
    timestamp, request_headers, response_headers, request_body, response_body, tags, retry_count, error)
    VALUES
    ($id, $method, $url, $path, $host, $status, $statusText, $duration, $requestSize, $responseSize,
    $timestamp, $requestHeaders, $responseHeaders, $requestBody, $responseBody, $tags, $retryCount, $error)
  `)

  stmt.run({
    $id: record.id,
    $method: record.method,
    $url: record.url,
    $path: record.path,
    $host: record.host,
    $status: record.status,
    $statusText: record.statusText,
    $duration: record.duration,
    $requestSize: record.requestSize,
    $responseSize: record.responseSize,
    $timestamp: record.timestamp,
    $requestHeaders: JSON.stringify(record.requestHeaders),
    $responseHeaders: JSON.stringify(record.responseHeaders),
    $requestBody: record.requestBody ?? null,
    $responseBody: record.responseBody ?? null,
    $tags: JSON.stringify(record.tags),
    $retryCount: record.retryCount,
    $error: record.error ?? null,
  })
}

function rowToRecord(row: any): RequestRecord {
  return {
    id: row.id,
    method: row.method,
    url: row.url,
    path: row.path,
    host: row.host,
    status: row.status,
    statusText: row.status_text,
    duration: row.duration,
    requestSize: row.request_size,
    responseSize: row.response_size,
    timestamp: row.timestamp,
    requestHeaders: JSON.parse(row.request_headers || '{}'),
    responseHeaders: JSON.parse(row.response_headers || '{}'),
    requestBody: row.request_body,
    responseBody: row.response_body,
    tags: JSON.parse(row.tags || '[]'),
    retryCount: row.retry_count,
    error: row.error,
  }
}

export function queryAllRequests(config: SqliteStorageConfig = {}, opts: { limit?: number } = {}): RequestRecord[] {
  const d = getDb(config)
  const limit = opts.limit ?? 100
  const rows = d.prepare('SELECT * FROM requests ORDER BY timestamp DESC LIMIT ?').all(limit)
  return rows.map(rowToRecord)
}

export function queryByHost(host: string, config: SqliteStorageConfig = {}, opts: { limit?: number } = {}): RequestRecord[] {
  const d = getDb(config)
  const rows = d.prepare('SELECT * FROM requests WHERE host = ? ORDER BY timestamp DESC LIMIT ?').all(host, opts.limit ?? 100)
  return rows.map(rowToRecord)
}

export function queryByStatus(statusMin: number, statusMax: number, config: SqliteStorageConfig = {}, opts: { limit?: number } = {}): RequestRecord[] {
  const d = getDb(config)
  const rows = d.prepare('SELECT * FROM requests WHERE status >= ? AND status < ? ORDER BY timestamp DESC LIMIT ?').all(statusMin, statusMax, opts.limit ?? 100)
  return rows.map(rowToRecord)
}

export function getRequestById(id: string, config: SqliteStorageConfig = {}): RequestRecord | undefined {
  const d = getDb(config)
  const row = d.prepare('SELECT * FROM requests WHERE id = ?').get(id)
  return row ? rowToRecord(row) : undefined
}

export function getRequestCount(config: SqliteStorageConfig = {}): number {
  const d = getDb(config)
  const row = d.prepare('SELECT COUNT(*) as count FROM requests').get() as any
  return row?.count ?? 0
}

export function pruneOldRequests(maxAge: number = 7 * 24 * 60 * 60 * 1000, config: SqliteStorageConfig = {}): number {
  const d = getDb(config)
  const cutoff = new Date(Date.now() - maxAge).toISOString()
  const result = d.prepare('DELETE FROM requests WHERE timestamp < ?').run(cutoff)
  return result.changes
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
