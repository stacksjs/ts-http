# Authentication

httx supports various authentication methods for securing your API requests.

## Basic Authentication

Use the `-a` or `--auth` flag:

```bash
# Basic syntax
httx get https://api.example.com/secure -a username:password

# Alternative syntax
httx get https://api.example.com/secure --auth username:password
```

This sets the `Authorization` header:

```
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

### Basic Auth Examples

```bash
# API with basic auth
httx get https://api.example.com/users -a admin:secret123

# With other options
httx post https://api.example.com/data \
  -a admin:secret123 \
  name=value \
  -j
```

## Bearer Token Authentication

Use the `-b` or `--bearer` flag for JWT/OAuth tokens:

```bash
# Bearer token
httx get https://api.example.com/me -b "eyJhbGciOiJIUzI1NiIsInR..."

# With full option name
httx get https://api.example.com/me --bearer "your-jwt-token"
```

This sets:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...
```

### Bearer Token Examples

```bash
# OAuth access token
httx get https://api.github.com/user \
  -b "$GITHUB_TOKEN"

# API request with bearer auth
httx post https://api.example.com/orders \
  -b "$API_TOKEN" \
  items:='[{"id": 1}]' \
  -j
```

## Custom Authorization Header

For other auth schemes, use the `-H` flag:

```bash
# API Key in header
httx get https://api.example.com/data \
  -H "X-API-Key: your-api-key"

# Custom auth scheme
httx get https://api.example.com/data \
  -H "Authorization: Token abc123"

# AWS Signature (custom header)
httx get https://api.aws.com/resource \
  -H "Authorization: AWS4-HMAC-SHA256 Credential=..."
```

## API Key Authentication

### Header-Based API Key

```bash
# X-API-Key header
httx get https://api.example.com/users \
  -H "X-API-Key: your-key-here"

# Alternative header names
httx get https://api.example.com/users \
  -H "Api-Key: your-key-here"
```

### Query Parameter API Key

```bash
# API key in query string
httx get "https://api.example.com/users?api_key=your-key"

# Using query parameter syntax
httx get https://api.example.com/users \
  api_key==your-key
```

## OAuth 2.0 Flows

### Using Access Token

```bash
# After obtaining token via OAuth flow
httx get https://api.example.com/me \
  -b "$ACCESS_TOKEN"
```

### Token Refresh Pattern

```bash
# Refresh token request
httx post https://auth.example.com/oauth/token \
  grant_type=refresh_token \
  refresh_token="$REFRESH_TOKEN" \
  client_id="$CLIENT_ID" \
  client_secret="$CLIENT_SECRET" \
  --form
```

## Environment Variables for Credentials

Never hardcode credentials. Use environment variables:

```bash
# Set credentials in environment
export API_USER=admin
export API_PASS=secret
export API_TOKEN=eyJ...

# Use in httx commands
httx get https://api.example.com/secure -a "$API_USER:$API_PASS"
httx get https://api.example.com/data -b "$API_TOKEN"
```

### Shell Script Pattern

```bash
# !/bin/bash
# api-request.sh

# Load credentials
source ~/.api-credentials

# Make authenticated request
httx get https://api.example.com/data \
  -b "$API_TOKEN" \
  --verbose
```

## Authentication with Sessions

For session-based auth, capture and reuse cookies:

```bash
# Login and save cookies
httx post https://app.example.com/login \
  username=user \
  password=pass \
  --form \
  --session login

# Use session for subsequent requests
httx get https://app.example.com/dashboard \
  --session login
```

## Digest Authentication

```bash
# Digest auth (if server requires it)
httx get https://api.example.com/secure \
  --auth-type digest \
  -a username:password
```

## Client Certificate Authentication

```bash
# mTLS with client certificate
httx get https://api.example.com/secure \
  --cert ./client.crt \
  --cert-key ./client.key
```

## Security Best Practices

### 1. Never Commit Credentials

```bash
# BAD - hardcoded credentials
httx get https://api.example.com -a admin:secret123

# GOOD - use environment variables
httx get https://api.example.com -a "$API_USER:$API_PASS"
```

### 2. Use Secret Management

```bash
# Load from password manager
export API_TOKEN=$(pass show api/token)
httx get https://api.example.com -b "$API_TOKEN"

# Use 1Password CLI
export API_TOKEN=$(op read "op://vault/item/token")
```

### 3. Rotate Credentials Regularly

```bash
# Check token expiration
httx get https://api.example.com/token/info \
  -b "$API_TOKEN"
```

### 4. Use Minimal Permissions

Request only necessary scopes in OAuth:

```bash
httx post https://auth.example.com/oauth/token \
  scope="read:users read:data" \
  ...
```

## Troubleshooting Authentication

### 401 Unauthorized

```bash
# Enable verbose mode to see auth headers
httx get https://api.example.com/secure \
  -a user:pass \
  --verbose
```

### 403 Forbidden

```bash
# Check if token has required permissions
httx get https://api.example.com/admin \
  -b "$TOKEN" \
  --verbose

# Verify token claims
echo "$TOKEN" | cut -d'.' -f2 | base64 -d | jq
```

## Next Steps

- [File Uploads](/cli/file-uploads) - Upload files with authentication
- [Request Options](/cli/options) - Other request options
- [Error Handling](/api/errors) - Handle auth errors in library
