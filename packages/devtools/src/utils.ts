/**
 * Shared UI helper functions for the devtools dashboard.
 *
 * These return Tailwind/crosswind class strings for consistent styling
 * across all dashboard pages.
 */

export function getMethodClass(method: string): string {
  if (method === 'GET') return 'bg-emerald-500/15 text-emerald-500'
  if (method === 'POST') return 'bg-indigo-500/15 text-indigo-400'
  if (method === 'PUT' || method === 'PATCH') return 'bg-amber-500/15 text-amber-500'
  if (method === 'DELETE') return 'bg-red-500/15 text-red-500'
  return 'bg-zinc-500/15 text-zinc-400'
}

export function getStatusClass(status: number): string {
  if (status < 300) return 'bg-emerald-500/15 text-emerald-500'
  if (status < 400) return 'bg-indigo-500/15 text-indigo-400'
  if (status < 500) return 'bg-amber-500/15 text-amber-500'
  return 'bg-red-500/15 text-red-500'
}

export function getSeverityClass(severity: string): string {
  if (severity === 'critical') return 'bg-red-500/15 text-red-500'
  if (severity === 'warning') return 'bg-amber-500/15 text-amber-500'
  return 'bg-indigo-500/15 text-indigo-400'
}

export function getErrorRateClass(errorRate: number): string {
  if (errorRate > 20) return 'text-red-500'
  if (errorRate > 5) return 'text-amber-500'
  return 'text-emerald-500'
}

export function getHealthClass(score: number): string {
  if (score >= 80) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  return 'text-red-500'
}

const typeColors: Record<string, string> = {
  request: 'text-indigo-400',
  error: 'text-red-500',
  alert: 'text-amber-500',
  system: 'text-zinc-400',
  config: 'text-emerald-500',
}

export function getTypeColor(type: string): string {
  return typeColors[type] || 'text-zinc-400'
}

export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString()
}
