import { httxApi } from '@/functions/useHttxBase'

/**
 * Alerts store — monitoring alerts across pages.
 */
export function useAlerts() {
  return defineStore('alerts', () => {
    const data = state<any[]>([])
    const loading = state(true)
    const error = state<string | null>(null)

    async function fetch() {
      loading.set(true)
      error.set(null)
      try {
        const res = await globalThis.fetch(httxApi('/api/alerts'))
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
