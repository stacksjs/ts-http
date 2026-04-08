/**
 * STX Runtime Globals
 *
 * These functions are injected by the stx runtime into <script client> blocks.
 * This declaration file provides TypeScript types for them.
 */

// Signals
// eslint-disable-next-line pickier/no-unused-vars
declare function state<T>(initial: T): {
  (): T
  set(value: T): void
  update(fn: (current: T) => T): void
  subscribe(cb: (value: T) => void): () => void
  _isSignal: true
}
// eslint-disable-next-line pickier/no-unused-vars
declare function derived<T>(compute: () => T): { (): T, _isSignal: true }
// eslint-disable-next-line pickier/no-unused-vars
declare function effect(fn: () => void | (() => void)): () => void
// eslint-disable-next-line pickier/no-unused-vars
declare function batch(fn: () => void): void

// Lifecycle
// eslint-disable-next-line pickier/no-unused-vars
declare function onMount(fn: () => void | (() => void)): void
// eslint-disable-next-line pickier/no-unused-vars
declare function onDestroy(fn: () => void): void

// Stores
// eslint-disable-next-line pickier/no-unused-vars
declare function defineStore<T>(id: string, setup: () => T, options?: { persist?: boolean | { pick?: string[], storage?: string, key?: string } }): () => T
// eslint-disable-next-line pickier/no-unused-vars
declare function useStore<T = any>(id: string): T

// Composables
// eslint-disable-next-line pickier/no-unused-vars
declare function useRef<T = HTMLElement>(name: string): { current: T | null }
// eslint-disable-next-line pickier/no-unused-vars
declare function useLocalStorage<T>(key: string, defaultValue: T): { (): T, set(value: T): void }
// eslint-disable-next-line pickier/no-unused-vars
declare function useWebSocket(url: string, options?: any): any
// eslint-disable-next-line pickier/no-unused-vars
declare function useQuery<T>(url: string, options?: any): { data: any, loading: any, error: any, refetch: () => void }
// eslint-disable-next-line pickier/no-unused-vars
declare function useMutation<T>(url: string, options?: any): { data: any, loading: any, error: any, mutate: (body: any) => Promise<T> }
// eslint-disable-next-line pickier/no-unused-vars
declare function navigate(url: string): void
declare function useRoute(): { path: string, params: Record<string, string> }

// Vue compat
// eslint-disable-next-line pickier/no-unused-vars
declare function ref<T>(value: T): { value: T }
// eslint-disable-next-line pickier/no-unused-vars
declare function computed<T>(getter: () => T): { value: T }
// eslint-disable-next-line pickier/no-unused-vars
declare function watch(source: any, callback: any): void

// Globals
declare const stx: { helpers: Record<string, any>, [key: string]: any }
