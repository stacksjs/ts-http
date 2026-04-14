# Introduction

httx is a modern, lightweight HTTP client designed for simplicity and performance. It provides both CLI and library interfaces, making it perfect for quick API testing from the terminal or integrating into your TypeScript/JavaScript projects.

## Why httx

Modern development requires constant API interaction. Whether you're testing endpoints, debugging integrations, or building HTTP-powered applications, you need a tool that's:

- **Fast** - Built on Bun's native fetch with minimal overhead
- **Type-Safe** - Full TypeScript support with typed errors
- **Lightweight** - Zero runtime dependencies
- **Intuitive** - Familiar syntax inspired by httpie
- **Versatile** - Works as both CLI and library

## Features at a Glance

### CLI Features

```bash
# Simple GET request
httx get api.example.com/users

# POST with JSON body
httx post api.example.com/users name=john email=john@example.com -j

# File uploads with multipart
httx post api.example.com/upload file@./photo.jpg -m

# Basic authentication
httx get api.example.com/secure -a username:password
```

### Library Features

```typescript
import { HttxClient } from '@stacksjs/httx'

const client = new HttxClient({
  baseUrl: 'https://api.example.com',
  timeout: 30000,
})

const result = await client.request('/users', {
  method: 'GET',
})

if (result.isOk) {
  console.log(result.value.data)
}
```

## Design Philosophy

httx follows these core principles:

1. **Simplicity First** - Common operations should require minimal syntax
2. **Type Safety** - Catch errors at compile time, not runtime
3. **Result-Based Errors** - No thrown exceptions, explicit error handling
4. **Performance** - Leverage Bun's speed without compromise
5. **Familiarity** - Syntax that feels natural to httpie users

## Comparison with Alternatives

| Feature | httx | httpie | curl | axios |
|---------|------|--------|------|-------|
| TypeScript Native | Yes | No | No | Partial |
| Type-Safe Errors | Yes | No | No | No |
| Zero Dependencies | Yes | No | Yes | No |
| CLI Support | Yes | Yes | Yes | No |
| Library Support | Yes | Limited | Limited | Yes |
| Bun Optimized | Yes | No | No | No |

## Next Steps

- [Installation](/guide/installation) - Get httx installed
- [Quick Start](/guide/quick-start) - Make your first request
- [Configuration](/guide/configuration) - Customize httx behavior
