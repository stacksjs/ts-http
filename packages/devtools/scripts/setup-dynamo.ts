#!/usr/bin/env bun
/**
 * Setup the DynamoDB table for httx devtools request tracking.
 *
 * Usage:
 *   bun packages/devtools/scripts/setup-dynamo.ts
 *   bun packages/devtools/scripts/setup-dynamo.ts --profile stacks --table httx-requests
 */

import { ensureTable } from '../src/dynamo'

const args = process.argv.slice(2)

function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`)
  if (idx >= 0 && args[idx + 1]) return args[idx + 1]
  return fallback
}

const profile = getArg('profile', 'stacks')
const tableName = getArg('table', 'httx-requests')
const region = getArg('region', 'us-east-1')

console.log(`Setting up DynamoDB table "${tableName}" in ${region} (profile: ${profile})...`)

try {
  await ensureTable({ profile, tableName, region })
  console.log(`Table "${tableName}" is ready.`)
}
catch (err: any) {
  console.error('Failed to create table:', err.message)
  process.exit(1)
}
