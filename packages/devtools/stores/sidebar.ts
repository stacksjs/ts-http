/**
 * Sidebar state store with localStorage persistence.
 *
 * Usage: const { collapsed, toggle } = useSidebar()
 */
export function useSidebar() {
  return defineStore('sidebar', () => {
    const collapsed = state(false)

    function toggle(): void {
      collapsed.set(!collapsed())
    }

    return { collapsed, toggle }
  }, { persist: { key: 'httx-sidebar-collapsed' } })
}
