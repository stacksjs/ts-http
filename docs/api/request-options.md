# Request Options

Complete reference for all request options available in httx.

## RequestOptions Interface

```typescript
interface RequestOptions {
  // Required: HTTP method
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

  // Request body
  body?: BodyInit | Record<string, unknown>

  // Query parameters
  query?: Record<string, string>

  // Custom headers
  headers?: Record<string, string>

  // Content type flags
  json?: boolean
  form?: boolean
  multipart?: boolean

  // Timeout (overrides client default)
  timeout?: number

  // Enable streaming response
  stream?: boolean

  // Custom Accept header
  acceptHeader?: string

  // Abort signal
  signal?: AbortSignal

  // Retry options
  retry?: RetryOptions

  // Enable verbose logging
  verbose?: boolean
}
```

## Method

Required HTTP method:

```typescript
await client.request('/users', { method: 'GET' })
await client.request('/users', { method: 'POST', body: data, json: true })
await client.request('/users/1', { method: 'PUT', body: data, json: true })
await client.request('/users/1', { method: 'PATCH', body: data, json: true })
await client.request('/users/1', { method: 'DELETE' })
await client.request('/users', { method: 'HEAD' })
await client.request('/users', { method: 'OPTIONS' })
```

## Body

Request body data:

```typescript
// Object (serialized based on content type flags)
await client.request('/users', {
  method: 'POST',
  json: true,
  body: { name: 'John', email: 'john@example.com' },
})

// String
await client.request('/data', {
  method: 'POST',
  body: 'raw string data',
  headers: { 'Content-Type': 'text/plain' },
})

// FormData
const formData = new FormData()
formData.append('file', Bun.file('./doc.pdf'))
await client.request('/upload', {
  method: 'POST',
  body: formData,
  multipart: true,
})
```

## Query Parameters

Add URL query parameters:

```typescript
await client.request('/search', {
  method: 'GET',
  query: {
    q: 'search term',
    page: '1',
    limit: '10',
    sort: 'created_at',
  },
})
// URL: /search?q=search+term&page=1&limit=10&sort=created_at
```

## Headers

Custom request headers:

```typescript
await client.request('/data', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer token123',
    'X-Custom-Header': 'value',
    'Accept-Language': 'en-US',
  },
})
```

## Content Type Flags

### JSON Mode

```typescript
await client.request('/users', {
  method: 'POST',
  json: true,  // Sets Content-Type: application/json
  body: {
    name: 'John',
    age: 25,
    active: true,
  },
})
```

Sets headers:

- `Content-Type: application/json`
- `Accept: application/json` (if not already set)

### Form Mode

```typescript
await client.request('/login', {
  method: 'POST',
  form: true,  // Sets Content-Type: application/x-www-form-urlencoded
  body: {
    username: 'john',
    password: 'secret',
  },
})
```

Sets: `Content-Type: application/x-www-form-urlencoded`

### Multipart Mode

```typescript
const formData = new FormData()
formData.append('file', Bun.file('./photo.jpg'))
formData.append('description', 'My photo')

await client.request('/upload', {
  method: 'POST',
  multipart: true,  // Content-Type set automatically with boundary
  body: formData,
})
```

Sets: `Content-Type: multipart/form-data` (with boundary)

## Timeout

Override client default timeout:

```typescript
// Short timeout for health checks
await client.request('/health', {
  method: 'GET',
  timeout: 5000,  // 5 seconds
})

// Long timeout for file upload
await client.request('/upload', {
  method: 'POST',
  timeout: 300000,  // 5 minutes
  body: largeFormData,
  multipart: true,
})
```

## Streaming

Enable streaming response:

```typescript
const result = await client.request('/stream', {
  method: 'GET',
  stream: true,
})

if (result.isOk) {
  const reader = (result.value.data as ReadableStream).getReader()
  // Process stream...
}
```

## Accept Header

Custom Accept header:

```typescript
// Request XML
await client.request('/data', {
  method: 'GET',
  acceptHeader: 'application/xml',
})

// Request specific API version
await client.request('/users', {
  method: 'GET',
  acceptHeader: 'application/vnd.api+json;version=2',
})
```

## Abort Signal

Cancel requests:

```typescript
const controller = new AbortController()

// Cancel after 10 seconds
setTimeout(() => controller.abort(), 10000)

await client.request('/slow', {
  method: 'GET',
  signal: controller.signal,
})
```

## Retry Options

Configure retry behavior:

```typescript
interface RetryOptions {
  // Number of retry attempts
  retries?: number

  // Base delay between retries (ms)
  retryDelay?: number

  // Status codes to retry on
  retryOn?: number[]

  // Custom retry decision function
  shouldRetry?: (error: Error, attempt: number) => boolean
}
```

### Example

```typescript
await client.request('/unreliable', {
  method: 'GET',
  retry: {
    retries: 3,
    retryDelay: 1000,
    retryOn: [500, 502, 503, 504],
    shouldRetry: (error, attempt) => {
      // Custom logic
      if (error instanceof HttxResponseError) {
        return error.statusCode >= 500
      }
      return attempt < 3
    },
  },
})
```

## Verbose Mode

Enable request logging:

```typescript
await client.request('/debug', {
  method: 'POST',
  json: true,
  body: data,
  verbose: true,  // Log this request only
})
```

## Complete Example

```typescript
const result = await client.request<ApiResponse>('/api/complex', {
  // HTTP method
  method: 'POST',

  // Request body
  body: {
    name: 'John',
    settings: { notifications: true },
  },

  // Content type
  json: true,

  // Query parameters
  query: {
    include: 'profile',
    expand: 'orders',
  },

  // Custom headers
  headers: {
    'X-Request-ID': crypto.randomUUID(),
    'X-Client-Version': '1.0.0',
  },

  // Timeout
  timeout: 30000,

  // Retry configuration
  retry: {
    retries: 2,
    retryDelay: 500,
  },

  // Debug logging
  verbose: process.env.DEBUG === 'true',
})
```

## Option Precedence

Options are merged in this order:

1. Client defaults
2. Request options

```typescript
const client = new HttxClient({
  timeout: 30000,
  defaultHeaders: { 'Authorization': 'Bearer default' },
})

// Request options override client defaults
await client.request('/data', {
  method: 'GET',
  timeout: 60000,  // Overrides 30000
  headers: {
    'Authorization': 'Bearer override',  // Overrides default
    'X-Extra': 'value',  // Added
  },
})
```

## Next Steps

- [Response Handling](/api/response) - Work with responses
- [Error Handling](/api/errors) - Handle request errors
- [Retry Logic](/advanced/retry) - Advanced retry patterns
