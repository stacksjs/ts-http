# Request Options

Complete reference for all httx CLI options.

## Content Type Options

### JSON Mode (`-j`, `--json`)

Send request body as JSON:

```bash
httx post https://api.example.com/users \
  name=John \
  age:=25 \
  active:=true \
  -j
```

Sets headers:

- `Content-Type: application/json`
- `Accept: application/json`

### Form Mode (`-f`, `--form`)

Send as URL-encoded form:

```bash
httx post https://api.example.com/login \
  username=john \
  password=secret \
  --form
```

Sets: `Content-Type: application/x-www-form-urlencoded`

### Multipart Mode (`-m`, `--multipart`)

Send as multipart form (for file uploads):

```bash
httx post https://api.example.com/upload \
  file@./photo.jpg \
  description="My photo" \
  --multipart
```

Sets: `Content-Type: multipart/form-data`

## Header Options

### Custom Headers (`-H`, `--header`)

Add custom request headers:

```bash
# Single header
httx get https://api.example.com/data \
  -H "X-Custom-Header: value"

# Multiple headers
httx get https://api.example.com/data \
  -H "Accept: application/xml" \
  -H "X-Request-ID: abc123" \
  -H "Cache-Control: no-cache"
```

### Accept Header

Override accept header:

```bash
# Request XML response
httx get https://api.example.com/data \
  -H "Accept: application/xml"

# Request specific version
httx get https://api.example.com/users \
  -H "Accept: application/vnd.api+json;version=2"
```

## Timeout Options

### Request Timeout (`-t`, `--timeout`)

Set request timeout in seconds:

```bash
# 60 second timeout
httx get https://api.example.com/slow \
  --timeout 60

# Short timeout
httx get https://api.example.com/health \
  -t 5
```

Default timeout is 30 seconds.

## Output Options

### Print Selection (`--print`)

Control what to display:

```bash
# Headers only
httx get https://api.example.com/users --print h

# Body only (default)
httx get https://api.example.com/users --print b

# Both headers and body
httx get https://api.example.com/users --print hb

# Request headers (for debugging)
httx get https://api.example.com/users --print H

# Request body
httx post https://api.example.com/users name=John -j --print B
```

Print flags:

- `H` - Request headers
- `B` - Request body
- `h` - Response headers
- `b` - Response body

### Pretty Print (`--pretty`)

Format JSON output:

```bash
httx get https://api.example.com/users --pretty

# Equivalent to piping through jq
httx get https://api.example.com/users | jq
```

### Output to File (`-o`, `--output`)

Save response to file:

```bash
# Save response body
httx get https://api.example.com/data \
  -o response.json

# Download file
httx get https://cdn.example.com/image.jpg \
  -o downloaded.jpg
```

## Verbose Mode (`--verbose`)

Enable detailed output:

```bash
httx get https://api.example.com/users --verbose
```

Shows:

- Request method and URL
- Request headers
- Request body (if any)
- Response status
- Response headers
- Response body
- Timing information

## Query Parameters

### In URL

```bash
httx get "https://api.example.com/search?q=term&limit=10"
```

### Using == Syntax

```bash
httx get https://api.example.com/search \
  q==term \
  limit==10 \
  page==1
```

Note: Use `==` for query params, `=` for body params.

## Data Types

### String Values (default)

```bash
name=John         # "name": "John"
email=j@test.com  # "email": "j@test.com"
```

### Non-String Values (`:=`)

```bash
age:=25           # "age": 25
price:=19.99      # "price": 19.99
active:=true      # "active": true
count:=null       # "count": null
items:='[1,2,3]'  # "items": [1,2,3]
meta:='{"k":"v"}' # "meta": {"k":"v"}
```

### Nested Objects

```bash
user[name]=John
user[email]=j@test.com
user[address][city]=NYC
user[address][zip]=10001
```

Results in:

```json
{
  "user": {
    "name": "John",
    "email": "j@test.com",
    "address": {
      "city": "NYC",
      "zip": "10001"
    }
  }
}
```

## Authentication Options

See [Authentication](/cli/authentication) for details.

```bash
# Basic auth
-a, --auth <user:pass>

# Bearer token
-b, --bearer <token>
```

## Follow Redirects (`-L`, `--follow`)

Follow HTTP redirects:

```bash
httx get https://short.url/abc --follow

# Limit redirect count
httx get https://short.url/abc --follow --max-redirects 5
```

## Proxy Options

### HTTP Proxy

```bash
httx get https://api.example.com/data \
  --proxy http://proxy.example.com:8080
```

### Authenticated Proxy

```bash
httx get https://api.example.com/data \
  --proxy http://user:pass@proxy.example.com:8080
```

## SSL/TLS Options

### Skip SSL Verification

```bash
# For development only - not recommended for production
httx get https://self-signed.example.com/api \
  --insecure
```

### Client Certificate

```bash
httx get https://secure.example.com/api \
  --cert ./client.crt \
  --cert-key ./client.key
```

## Option Combinations

### Common Patterns

```bash
# Authenticated JSON POST
httx post https://api.example.com/data \
  -a user:pass \
  -j \
  name=value

# File upload with metadata and auth
httx post https://api.example.com/upload \
  -b "$TOKEN" \
  -m \
  file@./doc.pdf \
  title="Report"

# Debug request with verbose and headers
httx get https://api.example.com/users \
  --verbose \
  --print hb \
  -H "X-Debug: true"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `HTTX_TIMEOUT` | Default timeout in seconds |
| `HTTX_VERBOSE` | Enable verbose mode |
| `HTTX_BASE_URL` | Default base URL |
| `HTTP_PROXY` | HTTP proxy URL |
| `HTTPS_PROXY` | HTTPS proxy URL |
| `NO_PROXY` | Hosts to bypass proxy |

## Next Steps

- [HTTP Methods](/cli/methods) - Method-specific options
- [Authentication](/cli/authentication) - Auth options
- [API Reference](/api) - Library options
