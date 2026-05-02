/**
 * Per-host circuit breaker.
 *
 * After N consecutive failures against a host, the circuit opens and
 * subsequent requests fail-fast (without hitting the network) for a
 * cooldown window — letting the upstream recover instead of being
 * hammered by retries from N callers. After the cooldown elapses, the
 * circuit moves to "half-open": exactly one request goes through. If
 * it succeeds, the circuit closes and traffic resumes; if it fails,
 * the circuit re-opens for another cooldown.
 *
 * The breaker is per-host because most outages are upstream-specific
 * — one bad service shouldn't trip every other endpoint your app
 * talks to. Buckets are kept in a Map keyed by `URL.host`.
 */

interface BreakerState {
  /** Number of consecutive failures since the last success. */
  failures: number
  /** Unix-ms timestamp when the circuit opened (0 = closed). */
  openedAt: number
  /** Whether the circuit is currently allowing one probe (half-open). */
  probing: boolean
}

export interface CircuitBreakerOptions {
  /** Failures before the circuit opens. Default 5. */
  threshold?: number
  /** Cooldown in ms before the circuit moves to half-open. Default 30s. */
  cooldownMs?: number
}

/**
 * Thrown when a request is rejected without hitting the network
 * because the circuit for its host is open. Distinct error class so
 * callers can show "service degraded" UX instead of treating it like
 * a transient network error worth retrying.
 */
export class CircuitOpenError extends Error {
  override readonly name = 'CircuitOpenError'
  readonly host: string
  readonly cooldownRemainingMs: number

  constructor(host: string, cooldownRemainingMs: number) {
    super(`Circuit open for host '${host}'; retry in ${cooldownRemainingMs}ms`)
    this.host = host
    this.cooldownRemainingMs = cooldownRemainingMs
  }
}

export class CircuitBreaker {
  private readonly threshold: number
  private readonly cooldownMs: number
  private readonly buckets = new Map<string, BreakerState>()

  constructor(options: CircuitBreakerOptions = {}) {
    this.threshold = options.threshold ?? 5
    this.cooldownMs = options.cooldownMs ?? 30_000
  }

  /**
   * Check whether a request to `host` is allowed right now. Throws
   * `CircuitOpenError` if the circuit is open and the cooldown hasn't
   * elapsed; returns silently when the request can proceed.
   *
   * Idempotent for closed circuits — call as many times as you want
   * before the actual request. Only the half-open probe counts.
   */
  guard(host: string): void {
    const state = this.buckets.get(host)
    if (!state || state.openedAt === 0) return // closed — proceed

    const elapsed = Date.now() - state.openedAt
    if (elapsed >= this.cooldownMs && !state.probing) {
      // Move to half-open: let exactly one request through.
      state.probing = true
      return
    }

    if (state.probing) {
      // A probe is already in flight; subsequent callers wait.
      throw new CircuitOpenError(host, Math.max(0, this.cooldownMs - elapsed))
    }

    throw new CircuitOpenError(host, this.cooldownMs - elapsed)
  }

  /**
   * Record a successful request. Closes the circuit if it was open
   * or probing.
   */
  recordSuccess(host: string): void {
    const state = this.buckets.get(host)
    if (!state) return
    state.failures = 0
    state.openedAt = 0
    state.probing = false
  }

  /**
   * Record a failed request. Opens the circuit if the consecutive-
   * failure threshold is reached, or re-opens it if a half-open
   * probe failed.
   */
  recordFailure(host: string): void {
    const state = this.buckets.get(host) ?? { failures: 0, openedAt: 0, probing: false }
    if (state.probing) {
      // Probe failed — re-open.
      state.openedAt = Date.now()
      state.probing = false
      this.buckets.set(host, state)
      return
    }
    state.failures += 1
    if (state.failures >= this.threshold) {
      state.openedAt = Date.now()
    }
    this.buckets.set(host, state)
  }

  /**
   * Force-close a host's circuit. Useful after a manual remediation
   * (e.g. credentials rotated) when you want to bypass the cooldown.
   */
  reset(host: string): void {
    this.buckets.delete(host)
  }

  /**
   * Snapshot of current breaker state for debugging / dashboards.
   */
  snapshot(): Array<{ host: string, status: 'closed' | 'open' | 'half-open', failures: number, openedAt: number }> {
    const out: Array<{ host: string, status: 'closed' | 'open' | 'half-open', failures: number, openedAt: number }> = []
    for (const [host, state] of this.buckets) {
      const status = state.openedAt === 0
        ? 'closed' as const
        : state.probing
          ? 'half-open' as const
          : 'open' as const
      out.push({ host, status, failures: state.failures, openedAt: state.openedAt })
    }
    return out
  }
}
