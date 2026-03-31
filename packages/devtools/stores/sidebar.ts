/**
 * Sidebar state store with localStorage persistence.
 */

export const useSidebar = defineStore('sidebar', () => {
  const collapsed = state(false)

  function toggle(): void {
    collapsed.set(!collapsed())
  }

  return { collapsed, toggle }
}, { persist: { key: 'httx-sidebar-collapsed' } })
