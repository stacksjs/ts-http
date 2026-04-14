# File Uploads

httx makes it easy to upload files using multipart form data.

## Basic File Upload

Use the `@` syntax to specify a file:

```bash
# Upload a single file
httx post https://api.example.com/upload \
  file@./document.pdf \
  -m
```

The `-m` or `--multipart` flag sets `Content-Type: multipart/form-data`.

## Multiple Files

Upload multiple files in one request:

```bash
httx post https://api.example.com/upload \
  photo@./image1.jpg \
  photo@./image2.jpg \
  photo@./image3.jpg \
  -m
```

## File with Metadata

Combine file upload with form fields:

```bash
httx post https://api.example.com/documents \
  file@./report.pdf \
  title="Annual Report" \
  category=reports \
  year:=2024 \
  -m
```

## Specify Content Type

Override the file's content type:

```bash
# Specify content type for file
httx post https://api.example.com/upload \
  "file@./data.bin;type=application/octet-stream" \
  -m
```

## Custom Field Names

```bash
# Different field name
httx post https://api.example.com/avatar \
  profile_image@./photo.jpg \
  -m

# With brackets for arrays
httx post https://api.example.com/gallery \
  "images[]@./photo1.jpg" \
  "images[]@./photo2.jpg" \
  -m
```

## Large File Uploads

For large files, consider increasing timeout:

```bash
httx post https://api.example.com/upload \
  file@./large-video.mp4 \
  -m \
  --timeout 300
```

### Upload with Progress

```bash
# Verbose mode shows upload progress
httx post https://api.example.com/upload \
  file@./large-file.zip \
  -m \
  --verbose
```

## Binary File Upload

For raw binary uploads without multipart:

```bash
# Direct binary upload
httx post https://api.example.com/binary \
  --body @./image.png \
  -H "Content-Type: image/png"
```

## JSON with File Reference

When you need to reference a file in JSON:

```bash
# Read file content into JSON field
httx post https://api.example.com/data \
  content@./data.json \
  -j
```

## Common Upload Patterns

### Image Upload with Thumbnail

```bash
httx post https://api.example.com/images \
  original@./photo.jpg \
  thumbnail@./photo-thumb.jpg \
  alt_text="Beautiful sunset" \
  -m
```

### Document Upload with ACL

```bash
httx post https://api.example.com/documents \
  file@./contract.pdf \
  visibility=private \
  "allowed_users:=[\"user1\", \"user2\"]" \
  expires_at="2024-12-31" \
  -m
```

### Avatar with Crop Parameters

```bash
httx post https://api.example.com/users/123/avatar \
  image@./photo.jpg \
  crop_x:=100 \
  crop_y:=50 \
  width:=200 \
  height:=200 \
  -m
```

## Streaming Uploads

For very large files, use streaming:

```bash
# Stream file content
cat large-file.bin | httx post https://api.example.com/stream \
  -H "Content-Type: application/octet-stream" \
  -H "Transfer-Encoding: chunked"
```

## Upload to S3-Compatible Storage

```bash
# Pre-signed URL upload
httx put "https://bucket.s3.amazonaws.com/file.txt?X-Amz-..." \
  --body @./file.txt \
  -H "Content-Type: text/plain"
```

## Handling Upload Responses

```bash
# Capture upload response
RESPONSE=$(httx post https://api.example.com/upload \
  file@./document.pdf \
  -m)

# Parse uploaded file URL
echo "$RESPONSE" | jq -r '.url'
```

## Error Handling

### File Not Found

```bash
# Check file exists before upload
if [ -f "./document.pdf" ]; then
  httx post https://api.example.com/upload \
    file@./document.pdf \
    -m
else
  echo "File not found"
fi
```

### File Too Large

```bash
# Check file size before upload
FILE_SIZE=$(stat -f%z ./large-file.zip)
MAX_SIZE=$((100 _ 1024 _ 1024))  # 100MB

if [ "$FILE_SIZE" -le "$MAX_SIZE" ]; then
  httx post https://api.example.com/upload \
    file@./large-file.zip \
    -m
else
  echo "File too large: $FILE_SIZE bytes"
fi
```

## Resumable Uploads

For APIs supporting resumable uploads:

```bash
# Initiate resumable upload
UPLOAD_URL=$(httx post https://api.example.com/upload/init \
  filename="large-video.mp4" \
  filesize:=$(stat -f%z ./large-video.mp4) \
  -j | jq -r '.upload_url')

# Upload chunks
for chunk in ./chunks/*; do
  httx put "$UPLOAD_URL" \
    --body @"$chunk" \
    -H "Content-Range: bytes ..."
done

# Complete upload
httx post "$UPLOAD_URL/complete" -j
```

## Library File Uploads

Using httx as a library:

```typescript
import { HttxClient } from '@stacksjs/httx'

const client = new HttxClient()

// Create FormData
const formData = new FormData()
formData.append('file', Bun.file('./document.pdf'))
formData.append('title', 'My Document')

const result = await client.request('/upload', {
  method: 'POST',
  body: formData,
  multipart: true,
})
```

## Next Steps

- [Request Options](/cli/options) - Additional options
- [API Client](/api/client) - Library usage for uploads
- [Streaming](/advanced/streaming) - Stream large files
