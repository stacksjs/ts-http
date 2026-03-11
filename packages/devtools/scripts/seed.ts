#!/usr/bin/env bun
/**
 * Seed the SQLite database with real HTTP requests via httx + recorder.
 *
 * Usage:
 *   bun packages/devtools/scripts/seed.ts
 */

import { HttxClient } from '../../httx/src/client'
import { createRecorder } from '../src/recorder'
import { getRequestCount } from '../src/storage'

const recorder = createRecorder({ dbPath: 'httx.sqlite' })

const client = new HttxClient({
  timeout: 10000,
  onRequestComplete: recorder,
})

const targets = [
  // Public APIs — variety of methods and endpoints
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/posts' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/posts/1' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/posts/2' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/comments?postId=1' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/users' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/users/1' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/todos' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/albums' },
  { method: 'POST' as const, url: 'https://jsonplaceholder.typicode.com/posts', body: JSON.stringify({ title: 'httx test', body: 'seeding dashboard', userId: 1 }), json: true },
  { method: 'PUT' as const, url: 'https://jsonplaceholder.typicode.com/posts/1', body: JSON.stringify({ id: 1, title: 'updated', body: 'updated body', userId: 1 }), json: true },
  { method: 'PATCH' as const, url: 'https://jsonplaceholder.typicode.com/posts/1', body: JSON.stringify({ title: 'patched' }), json: true },
  { method: 'DELETE' as const, url: 'https://jsonplaceholder.typicode.com/posts/1' },

  // httpbin — different response types
  { method: 'GET' as const, url: 'https://httpbin.org/get' },
  { method: 'GET' as const, url: 'https://httpbin.org/headers' },
  { method: 'GET' as const, url: 'https://httpbin.org/ip' },
  { method: 'GET' as const, url: 'https://httpbin.org/user-agent' },
  { method: 'POST' as const, url: 'https://httpbin.org/post', body: JSON.stringify({ key: 'value' }), json: true },
  { method: 'GET' as const, url: 'https://httpbin.org/status/200' },
  { method: 'GET' as const, url: 'https://httpbin.org/status/201' },
  { method: 'GET' as const, url: 'https://httpbin.org/status/404' },
  { method: 'GET' as const, url: 'https://httpbin.org/status/500' },
  { method: 'GET' as const, url: 'https://httpbin.org/delay/1' },

  // Rick & Morty API
  { method: 'GET' as const, url: 'https://rickandmortyapi.com/api/character' },
  { method: 'GET' as const, url: 'https://rickandmortyapi.com/api/character/1' },
  { method: 'GET' as const, url: 'https://rickandmortyapi.com/api/location' },
  { method: 'GET' as const, url: 'https://rickandmortyapi.com/api/episode' },

  // GitHub API (public, no auth needed)
  { method: 'GET' as const, url: 'https://api.github.com/repos/stacksjs/httx' },
  { method: 'GET' as const, url: 'https://api.github.com/repos/stacksjs/stx' },
  { method: 'GET' as const, url: 'https://api.github.com/users/chrisbbreuer' },

  // More jsonplaceholder for volume
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/posts/3' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/posts/4' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/posts/5' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/comments?postId=2' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/users/2' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/users/3' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/photos?albumId=1' },
  { method: 'POST' as const, url: 'https://jsonplaceholder.typicode.com/posts', body: JSON.stringify({ title: 'second post', body: 'more data', userId: 2 }), json: true },
  { method: 'DELETE' as const, url: 'https://jsonplaceholder.typicode.com/posts/2' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/todos/1' },
  { method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/todos/2' },
]

const before = getRequestCount({ dbPath: 'httx.sqlite' })
console.log(`Starting seed... (${before} existing records)`)

let success = 0
let failed = 0

for (const target of targets) {
  const { method, url, body, json } = target as any
  process.stdout.write(`  ${method} ${url.slice(0, 60)}...`)

  const result = await client.request(url, {
    method,
    ...(body ? { body } : {}),
    ...(json ? { json: true } : {}),
  })

  if (result.isOk) {
    console.log(` ${result.value.status} (${Math.round(result.value.timings.duration)}ms)`)
    success++
  }
  else {
    console.log(` FAIL: ${result.error.message}`)
    failed++
  }
}

const after = getRequestCount({ dbPath: 'httx.sqlite' })
console.log(`\nDone! ${success} succeeded, ${failed} failed. Total records: ${after}`)
