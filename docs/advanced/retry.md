# Retry Logic

httx provides built-in retry functionality for handling transient failures.

## Configuration

Configure retries at client or request level:

```typescript
// Client-level configuration
const client = new HttxClient({
  retry: {
    retries: 3,
    retryDelay: 1000,
    retryOn: [408, 429, 500, 502, 503, 504],
  },
})

// Request-level override
await client.request('/api/data', {
  method: 'GET',
  retry: {
    retries: 5,
    retryDelay: 2000,
  },
})
```

## Retry Options

```typescript
interface RetryOptions {
  // Maximum number of retry attempts
  retries?: number

  // Base delay between retries (milliseconds)
  retryDelay?: number

  // HTTP status codes that trigger retry
  retryOn?: number[]

  // Custom function to determine if retry should occur
  shouldRetry?: (error: Error, attempt: number) => boolean
}
```

## Exponential Backoff

httx uses exponential backoff with jitter:

```
Delay = min(baseDelay * 2^attempt + jitter, 30000)
```

Example delays for `retryDelay: 1000`:

| Attempt | Base Delay | With Jitter (approx) |
|---------|------------|----------------------|
| 1 | 1000ms | 1000-1300ms |
| 2 | 2000ms | 2000-2600ms |
| 3 | 4000ms | 4000-5200ms |
| 4 | 8000ms | 8000-10400ms |
| 5+ | 16000ms+ | Max 30000ms |

## Default Retry Behavior

| Scenario | Default Behavior |
|----------|------------------|
| Timeout errors | No retry |
| Network errors | Retry |
| 4xx errors | No retry |
| 5xx errors | Retry if in `retryOn` |
| Non-idempotent methods (POST, PATCH) | No retry unless `shouldRetry` is supplied |

### Idempotency-safe retries

By default httx will **not** automatically retry non-idempotent methods
(`POST`, `PATCH`), even on network or 5xx failures. The original request
may have already reached the server before the failure was observed, so a
blind retry can duplicate side effects (double charge, double order).

Idempotent methods (`GET`, `HEAD`, `PUT`, `DELETE`, `OPTIONS`, `TRACE`) are
retried normally. If you know a `POST`/`PATCH` endpoint is safe to retry
(for example it accepts an `Idempotency-Key`), opt back in by supplying your
own `shouldRetry` predicate:

```typescript
await client.request('/api/charge', {
  method: 'POST',
  json: true,
  body: payload,
  headers: { 'Idempotency-Key': key },
  retry: {
    retries: 3,
    retryOn: [500, 502, 503, 504],
    // Explicit opt-in re-enables retries for this non-idempotent request.
    shouldRetry: () => true,
  },
})
```

## Status Codes

Common status codes to retry:

```typescript
const retryOn = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]
```

## Custom Retry Logic

### Using shouldRetry

```typescript
await client.request('/api/data', {
  method: 'POST',
  json: true,
  body: data,
  retry: {
    retries: 3,
    retryDelay: 1000,
    shouldRetry: (error, attempt) => {
      // Don't retry client errors
      if (error instanceof HttxResponseError) {
        if (error.statusCode >= 400 && error.statusCode < 500) {
          return false
        }

        // Retry server errors
        if (error.statusCode >= 500) {
          return attempt < 3
        }
      }

      // Retry network errors
      if (error instanceof HttxNetworkError) {
        return attempt < 5
      }

      // Don't retry timeout errors
      if (error instanceof HttxTimeoutError) {
        return false
      }

      return false
    },
  },
})
```

### Retry with Token Refresh

```typescript
async function requestWithTokenRefresh<T>(url: string, options: RequestOptions) {
  const result = await client.request<T>(url, {
    ...options,
    retry: {
      retries: 1,
      shouldRetry: async (error, attempt) => {
        if (error instanceof HttxResponseError && error.statusCode === 401) {
          // Refresh token
          const refreshed = await refreshToken()
          if (refreshed) {
            // Update auth header for retry
            options.headers = {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`,
            }
            return true
          }
        }
        return false
      },
    },
  })

  return result
}
```

## Retry with Rate Limiting

Handle rate limit responses:

```typescript
async function requestWithRateLimit<T>(url: string, options: RequestOptions) {
  const result = await client.request<T>(url, {
    ...options,
    retry: {
      retries: 3,
      shouldRetry: (error, attempt) => {
        if (error instanceof HttxResponseError && error.statusCode === 429) {
          // Get retry-after header if available
          const retryAfter = error.body?.['retryAfter'] || 60
          console.log(`Rate limited. Retry after ${retryAfter}s`)
          return true
        }
        return false
      },
    },
  })

  return result
}
```

## Idempotency

Ensure safe retries for non-idempotent operations:

```typescript
async function safePost<T>(url: string, data: unknown) {
  const idempotencyKey = crypto.randomUUID()

  return client.request<T>(url, {
    method: 'POST',
    json: true,
    body: data,
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    retry: {
      retries: 3,
      retryOn: [500, 502, 503, 504],
    },
  })
}
```

## Monitoring Retries

Track retry attempts:

```typescript
let retryCount = 0

const result = await client.request('/api/data', {
  method: 'GET',
  retry: {
    retries: 3,
    shouldRetry: (error, attempt) => {
      retryCount = attempt
      console.log(`Retry attempt ${attempt}:`, error.message)

      // Log to monitoring
      metrics.increment('http.retry', {
        url: '/api/data',
        attempt: String(attempt),
        error: error.constructor.name,
      })

      return attempt < 3
    },
  },
})

if (retryCount > 0) {
  console.log(`Request succeeded after ${retryCount} retries`)
}
```

## Best Practices

### 1. Limit Retries for User-Facing Requests

```typescript
// Fast failure for UI requests
const userRequest = {
  retry: {
    retries: 1,
    retryDelay: 500,
  },
}

// More retries for background jobs
const backgroundRequest = {
  retry: {
    retries: 5,
    retryDelay: 2000,
  },
}
```

### 2. Use Idempotency Keys

Always include idempotency keys for POST/PUT/DELETE:

```typescript
headers: {
  'Idempotency-Key': `${userId}-${operationId}-${timestamp}`,
}
```

### 3. Set Reasonable Timeouts

Combine retry with timeout:

```typescript
{
  timeout: 10000,  // 10 second timeout per attempt
  retry: {
    retries: 3,    // 3 attempts = max 30 seconds total
    retryDelay: 1000,
  },
}
```

### 4. Log Retry Attempts

```typescript
shouldRetry: (error, attempt) => {
  logger.warn('Request retry', {
    attempt,
    error: error.message,
    url,
    method,
  })
  return attempt < maxRetries
}
```

## Next Steps

- [Timeouts](/advanced/timeouts) - Configure timeout behavior
- [Streaming](/advanced/streaming) - Handle streaming responses
- [Error Handling](/api/errors) - Handle retry failures
