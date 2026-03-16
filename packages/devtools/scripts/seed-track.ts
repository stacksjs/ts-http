#!/usr/bin/env bun
/**
 * Seed the database using trackRequests() — the global fetch patch.
 *
 * This demonstrates how ANY app can track requests with a single line.
 * No need to use HttxClient — plain fetch() calls are recorded automatically.
 *
 * Usage:
 *   bun packages/devtools/scripts/seed-track.ts
 */

import { resolve, dirname } from 'node:path'
import { trackRequests } from '../src/track'
import { getRequestCount } from '../src/storage'

// Resolve dbPath relative to the devtools package
const dbPath = resolve(dirname(import.meta.path), '..', 'httx.sqlite')

// One line — every fetch() call is now recorded to SQLite
const stop = trackRequests({ dbPath })

const before = getRequestCount({ dbPath })
console.log(`Tracking enabled. (${before} existing records)\n`)

const targets = [
  'https://jsonplaceholder.typicode.com/posts',
  'https://jsonplaceholder.typicode.com/posts/1',
  'https://jsonplaceholder.typicode.com/users',
  'https://jsonplaceholder.typicode.com/todos',
  'https://httpbin.org/get',
  'https://httpbin.org/ip',
  'https://httpbin.org/headers',
  'https://httpbin.org/status/200',
  'https://httpbin.org/status/404',
  'https://httpbin.org/status/500',
  'https://rickandmortyapi.com/api/character',
  'https://rickandmortyapi.com/api/location',
  'https://api.github.com/repos/stacksjs/stx',
  'https://api.github.com/repos/stacksjs/httx',
]

let success = 0
let failed = 0

for (const url of targets) {
  process.stdout.write(`  GET ${url.slice(0, 60)}...`)
  try {
    // Plain fetch() — no httx, no special client, just fetch
    const res = await fetch(url)
    console.log(` ${res.status} (recorded!)`)
    success++
  }
  catch (err: any) {
    console.log(` FAIL: ${err.message} (recorded!)`)
    failed++
  }
}

// POST example
process.stdout.write(`  POST https://jsonplaceholder.typicode.com/posts...`)
try {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'tracked post', body: 'via trackRequests()', userId: 1 }),
  })
  console.log(` ${res.status} (recorded!)`)
  success++
}
catch (err: any) {
  console.log(` FAIL: ${err.message} (recorded!)`)
  failed++
}

// Stop tracking, restore original fetch
stop()

const after = getRequestCount({ dbPath })
console.log(`\nDone! ${success} succeeded, ${failed} failed. Total records: ${after}`)
