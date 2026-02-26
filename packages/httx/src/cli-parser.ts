import type { HttpMethod, RequestOptions } from './types'
import { HTTP_METHODS } from './types'
import { debugLog } from './utils'

const REQUEST_PATTERNS = {
  QUERY: /^([^:=@]+)==(.+)$/,
  RAW_JSON: /^([^:=@]+):=(.+)$/,
  HEADER: /^([^:=@]+):([^=].*)$/,
  DATA: /^([^:=@]+)=([^=].*)$/,
  FILE_UPLOAD: /^([^:=@]+)@(.+)$/,
} as const

interface ParsedArgs {
  url: string
  method: HttpMethod
  options: RequestOptions
}

function isHttpMethod(method: string): method is HttpMethod {
  return Object.values(HTTP_METHODS).includes(method.toUpperCase() as HttpMethod)
}

export function parseCliArgs(args: string[]): ParsedArgs {
  let method: HttpMethod = 'GET'
  let url = ''
  const options: RequestOptions = {
    method: 'GET',
    headers: {} as Record<string, string>,
    query: {},
    body: undefined,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (!arg)
      continue

    debugLog('parser', `Processing arg: ${arg}`)

    // First argument could be method
    if (i === 0) {
      if (isHttpMethod(arg.toUpperCase())) {
        method = arg.toUpperCase() as HttpMethod
        options.method = method
        debugLog('parser', `Method set to: ${method}`)
        continue
      }
      else {
        // If first arg isn't a method, treat it as URL
        url = arg.includes('://') ? arg : `http://${arg}`
        debugLog('parser', `URL set to: ${url}`)
        continue
      }
    }

    // Second argument should be URL if not already set
    if (i === 1 && !url) {
      url = arg.includes('://') ? arg : `http://${arg}`
      debugLog('parser', `URL set to: ${url}`)
      continue
    }

    // Parse request items
    let matched = false
    for (const [type, regex] of Object.entries(REQUEST_PATTERNS)) {
      const match = arg.match(regex)
      if (!match)
        continue

      const [, key, value] = match
      matched = true
      debugLog('parser', `Matched ${type} - Key: ${key}, Value: ${value}`)

      switch (type) {
        case 'HEADER': {
          if (!options.headers) {
            options.headers = {}
          }
          (options.headers as Record<string, string>)[key.trim()] = value.trim()
          break
        }
        case 'DATA': {
          if (!options.body)
            options.body = {}
          if (options.body instanceof FormData)
            options.body.append(key.trim(), value.trim())
          else if (typeof options.body === 'object')
            (options.body as Record<string, string>)[key.trim()] = value.trim()
          break
        }
        case 'RAW_JSON': {
          if (!options.body || typeof options.body !== 'object' || options.body instanceof FormData)
            options.body = {}
          try {
            (options.body as Record<string, unknown>)[key.trim()] = JSON.parse(value.trim())
          }
          catch (e) {
            debugLog('parser', `Failed to set JSON value: ${e}`)
          }
          options.json = true
          break
        }
        case 'QUERY': {
          options.query![key.trim()] = value.trim()
          break
        }
        case 'FILE_UPLOAD': {
          if (!options.body || !(options.body instanceof FormData)) {
            options.body = new FormData()
            options.multipart = true
          }
          (options.body as FormData).append(key.trim(), value.trim())
          break
        }
      }
      break
    }

    if (!matched)
      debugLog('parser', `Unmatched argument: ${arg}`)
  }

  if (!url)
    throw new Error('No URL provided')

  try {
    // eslint-disable-next-line no-new
    new URL(url) // Validate URL
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (e) {
    throw new Error(`Invalid URL: ${url}`)
  }

  if (options.json) {
    debugLog('parser', `Final request body: ${JSON.stringify(options.body)}`)
  }

  return { url, method, options }
}
