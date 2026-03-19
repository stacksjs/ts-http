# @stacksjs/httx-dashboard

HTTP request devtools for any application. Track, inspect, and analyze every HTTP request your app makes — in real time.

## Quick Start

### 1. Start the Dashboard

```bash
# Run the devtools server (dashboard UI + ingest API + WebSocket)
bunx @stacksjs/httx-dashboard

# Or with options
bunx @stacksjs/httx-dashboard --port 4401 --broadcast-port 6002
```

Open [http://localhost:4401](http://localhost:4401) to view the dashboard.

### 2. Track Requests in Your App

```ts
import { trackRequests } from '@stacksjs/httx-dashboard'

// One line — every fetch() call is now tracked
trackRequests()
```

That's it. Every HTTP request your app makes will appear in the dashboard — in real time via WebSocket.

## How It Works

```
Your App                        Devtools Server (:4401)
────────                        ───────────────────────
fetch('https://api.stripe.com')
  │
  ├─→ original fetch executes normally
  │
  └─→ POST /api/ingest ──→ SQLite ──→ Dashboard UI
       (request metadata)      │
                               └──→ WebSocket broadcast ──→ Live update
                                    (ws://localhost:6002)
```

`trackRequests()` patches `globalThis.fetch` to observe every outgoing HTTP request. After each request completes, it sends the metadata (method, URL, status, duration, headers, body) to the devtools server. The server records it to SQLite and broadcasts a WebSocket event — so the dashboard updates in real time. Your app's behavior is completely unchanged.

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

## Configuration

### Config File

The dashboard auto-loads `httx.config.ts` from `./`, `./config/`, or `./.config/`:

```ts
// httx.config.ts
export default {
  dashboard: {
    port: 4401,
    broadcastPort: 6002,
  },

  storage: {
    driver: 'sqlite',
    dbPath: './httx.sqlite',
    maxAge: '7d',
  },

  ignore: {
    hosts: ['localhost'],
    urls: ['/health'],
  },
}
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `HTTX_DASHBOARD_PORT` | Dashboard server port | `4401` |
| `HTTX_BROADCAST_PORT` | WebSocket broadcast port | `6002` |
| `HTTX_DB_PATH` | SQLite database file path | `./httx.sqlite` |

### CLI Flags

```bash
bunx @stacksjs/httx-dashboard --port 4401 --broadcast-port 6002 --db-path ./httx.sqlite
```

### Priority

CLI flags > environment variables > config file > defaults

## Real-Time Updates

The dashboard uses WebSocket broadcasting via `ts-broadcasting` for live updates. When a request is ingested:

1. Request metadata is saved to SQLite
2. A `request.recorded` event is broadcast on the `dashboard` WebSocket channel
3. Connected dashboard clients receive the event and update the UI

Dashboard pages connect automatically — no configuration needed. The WebSocket URL is injected into the page at render time via `window.__HTTX_WS_URL`.

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

### `serveDashboard(options?)`

Starts the dashboard server programmatically.

```ts
function serveDashboard(options?: DashboardConfig): Promise<void>
```

### `isTrackingRequests()`

Check if fetch tracking is currently active.

```ts
function isTrackingRequests(): boolean
```

## Architecture

```
@stacksjs/httx-dashboard
├── src/
│   ├── cli.ts          # Standalone CLI entry (bunx @stacksjs/httx-dashboard)
│   ├── index.ts        # serveDashboard() — HTTP server + WebSocket broadcasting
│   ├── track.ts        # trackRequests() — global fetch patch
│   ├── recorder.ts     # createRecorder() — onRequestComplete callback
│   ├── storage.ts      # SQLite read/write layer
│   ├── api.ts          # API route handlers (/api/requests, /api/stats, etc.)
│   ├── types.ts        # TypeScript interfaces
│   └── pages/          # Dashboard UI (STX templates)
│       ├── layouts/    # App layout with sidebar
│       ├── partials/   # Sidebar navigation
│       └── *.stx       # Page templates
├── scripts/
│   ├── seed.ts         # Seed via HttxClient
│   └── seed-track.ts   # Seed via trackRequests()
└── serve.ts            # Dev server entry point
```

## Seeding Test Data

To populate the dashboard with sample data for development:

```bash
# Using trackRequests() — plain fetch calls
bun packages/devtools/scripts/seed-track.ts

# Using HttxClient — with onRequestComplete hook
bun packages/devtools/scripts/seed.ts
```

## License

MIT
