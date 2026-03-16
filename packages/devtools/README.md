# @stacksjs/httx-dashboard

HTTP request devtools for any application. Track, inspect, and analyze every HTTP request your app makes — in real time.

## Quick Start

### 1. Start the Dashboard

```bash
# Run the devtools server (serves the dashboard UI + ingest API)
bunx @stacksjs/httx-dashboard

# Or with a custom port
bunx @stacksjs/httx-dashboard --port 4401
```

Open [http://localhost:4401](http://localhost:4401) to view the dashboard.

### 2. Track Requests in Your App

```ts
import { trackRequests } from '@stacksjs/httx-dashboard'

// One line — every fetch() call is now tracked
trackRequests()
```

That's it. Every HTTP request your app makes will appear in the dashboard.

## How It Works

```
Your App                        Devtools Server
────────                        ───────────────
fetch('https://api.stripe.com')
  │
  ├─→ original fetch executes normally
  │
  └─→ POST localhost:4401/api/ingest ──→ SQLite ──→ Dashboard UI
       (request metadata)
```

`trackRequests()` patches `globalThis.fetch` to observe every outgoing HTTP request. After each request completes, it sends the metadata (method, URL, status, duration, headers, body) to the devtools server. Your app's behavior is completely unchanged — the original response is returned untouched.

## Usage

### Basic (zero config)

```ts
import { trackRequests } from '@stacksjs/httx-dashboard'

trackRequests()

// All of these are tracked automatically:
await fetch('https://api.stripe.com/v1/charges')
await fetch('https://api.github.com/repos/stacksjs/stx')
await fetch('https://httpbin.org/post', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' }),
})
```

### With Options

```ts
import { trackRequests } from '@stacksjs/httx-dashboard'

const stop = trackRequests({
  // Devtools server URL (default: http://localhost:4401)
  endpoint: 'http://localhost:4401/api/ingest',

  // Don't track requests to these hosts
  ignoreHosts: ['localhost', '127.0.0.1'],

  // Don't track requests matching these patterns
  ignoreUrls: ['/health', /\/internal\//],

  // Max response body size to capture in characters (default: 10000)
  maxBodySize: 10_000,

  // Disable body capture entirely for performance (default: true)
  captureBodies: true,
})

// Later, stop tracking and restore original fetch
stop()
```

### With @stacksjs/httx Client

If you're already using `@stacksjs/httx` as your HTTP client, you can use the built-in hook instead:

```ts
import { HttxClient } from '@stacksjs/httx'
import { createRecorder } from '@stacksjs/httx-dashboard'

const recorder = createRecorder()
const client = new HttxClient({
  onRequestComplete: recorder,
})

await client.get('https://api.stripe.com/v1/charges')
```

### Works With Any HTTP Library

`trackRequests()` patches the global `fetch`, so it works with any library that uses `fetch` under the hood:

```ts
import { trackRequests } from '@stacksjs/httx-dashboard'

trackRequests()

// Raw fetch
await fetch('https://api.example.com/data')

// @stacksjs/httx
import { httx } from '@stacksjs/httx'
await httx.get('https://api.example.com/data')

// ky
import ky from 'ky'
await ky.get('https://api.example.com/data')

// ofetch
import { ofetch } from 'ofetch'
await ofetch('https://api.example.com/data')
```

> **Note:** Libraries that use Node's `http` module directly (like older versions of axios) won't be captured. Most modern libraries use `fetch`.

## Dashboard Pages

| Page | What It Shows |
|---|---|
| **Dashboard** | Overview stats, throughput chart, status distribution, recent requests, active alerts |
| **Requests** | Full request list with method, URL, status, duration. Click any row for details |
| **Request Details** | Headers, request/response bodies, timing breakdown |
| **Endpoints** | Aggregated stats per endpoint — count, avg duration, error rate |
| **Endpoint Details** | Per-endpoint deep dive with response time trends and status breakdown |
| **Metrics** | Response time percentiles (P50/P95/P99), throughput, charts |
| **Monitoring** | Health score, active alerts, event log |
| **Timeline** | Swimlane visualization of request timing (D3) |
| **Network** | Force-directed graph of host connections (D3) |
| **Compare** | Side-by-side endpoint comparison with charts |
| **Export** | Export request data as JSON or CSV |

## API Reference

### `trackRequests(options?)`

Patches `globalThis.fetch` to track all HTTP requests.

```ts
function trackRequests(options?: TrackRequestsOptions): () => void
```

Returns a cleanup function that restores the original `fetch`.

**Options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `endpoint` | `string` | `'http://localhost:4401/api/ingest'` | Devtools server ingest URL |
| `ignoreHosts` | `string[]` | `[]` | Hosts to skip tracking |
| `ignoreUrls` | `(string \| RegExp)[]` | `[]` | URL patterns to skip |
| `maxBodySize` | `number` | `10000` | Max body size to capture (chars) |
| `captureBodies` | `boolean` | `true` | Whether to capture request/response bodies |

### `createRecorder(options?)`

Creates an `onRequestComplete` callback for use with `HttxClient`.

```ts
function createRecorder(options?: SqliteStorageConfig): (record: RequestCompleteRecord) => void
```

### `isTrackingRequests()`

Check if fetch tracking is currently active.

```ts
function isTrackingRequests(): boolean
```

## Seeding Test Data

To populate the dashboard with sample data for development:

```bash
# Using trackRequests() — plain fetch calls
bun packages/devtools/scripts/seed-track.ts

# Using HttxClient — with onRequestComplete hook
bun packages/devtools/scripts/seed.ts
```

## Architecture

```
@stacksjs/httx-dashboard
├── src/
│   ├── track.ts        # trackRequests() — global fetch patch
│   ├── recorder.ts     # createRecorder() — onRequestComplete callback
│   ├── storage.ts      # SQLite read/write layer
│   ├── api.ts          # API route handlers (/api/requests, /api/stats, etc.)
│   ├── types.ts        # TypeScript interfaces
│   └── pages/          # Dashboard UI (STX templates)
├── scripts/
│   ├── seed.ts         # Seed via HttxClient
│   └── seed-track.ts   # Seed via trackRequests()
└── serve.ts            # Dev server entry point
```

## License

MIT
