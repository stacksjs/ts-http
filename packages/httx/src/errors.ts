export class HttxError extends Error {
  public readonly context: Record<string, unknown> | undefined

  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'HttxError'
    this.context = context
    Object.setPrototypeOf(this, HttxError.prototype)
  }
}

export class HttxRequestError extends HttxError {
  constructor(
    message: string,
    public readonly method: string,
    public readonly url: string,
    public readonly statusCode?: number,
    context?: Record<string, unknown>,
  ) {
    super(message, context)
    this.name = 'HttxRequestError'
    Object.setPrototypeOf(this, HttxRequestError.prototype)
  }
}

export class HttxTimeoutError extends HttxError {
  constructor(
    public readonly method: string,
    public readonly url: string,
    public readonly timeout: number,
  ) {
    super(`Request timeout after ${timeout}ms: ${method} ${url}`)
    this.name = 'HttxTimeoutError'
    Object.setPrototypeOf(this, HttxTimeoutError.prototype)
  }
}

export class HttxNetworkError extends HttxError {
  public readonly method: string
  public readonly url: string
  public readonly originalError: Error | undefined

  constructor(
    message: string,
    method: string,
    url: string,
    originalError?: Error,
  ) {
    super(message, { originalError })
    this.name = 'HttxNetworkError'
    this.method = method
    this.url = url
    this.originalError = originalError
    Object.setPrototypeOf(this, HttxNetworkError.prototype)
  }
}

export class HttxResponseError extends HttxRequestError {
  constructor(
    message: string,
    method: string,
    url: string,
    statusCode: number,
    public readonly statusText: string,
    public readonly responseBody?: unknown,
  ) {
    super(message, method, url, statusCode, { statusText, responseBody })
    this.name = 'HttxResponseError'
    Object.setPrototypeOf(this, HttxResponseError.prototype)
  }
}
