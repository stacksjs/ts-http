/**
 * Dashboard stats store — persists across SPA navigation.
 */
export function useStats() {
  return defineStore('stats', () => {
    const data = state<any>({
      totalRequests: 0, avgResponseTime: 0, errorRate: 0, requestsPerMinute: 0,
      statusDistribution: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
      throughputHistory: [], responseTimeHistory: [], recentEvents: [], activeAlerts: [], topEndpoints: [],
    })
    const loading = state(true)
    const error = state<string | null>(null)

    async function fetch() {
      loading.set(true)
      error.set(null)
      try {
        const res = await globalThis.fetch('/api/stats')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        data.set(await res.json())
      }
      catch (e: any) { error.set(e.message) }
      finally { loading.set(false) }
    }

    onMount(fetch)

    return { data, loading, error, refetch: fetch }
  })
}
