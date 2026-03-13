# CLAUDE.md — ts-http / httx devtools

---

## 1. ZERO TOLERANCE — BANNED PATTERNS

**Every single one of these is FORBIDDEN in `.stx` files. No exceptions. No "just this once." If you write any of these, delete it immediately and use the STX replacement.**

| BANNED | WHY | STX REPLACEMENT |
|---|---|---|
| `innerHTML = ...` | Raw DOM mutation, XSS risk | `@foreach(list as item)...@endforeach` / `{{ expr }}` / `x-html="expr"` |
| `outerHTML = ...` | Raw DOM mutation | Template directives |
| `document.querySelector(...)` | Direct DOM query | `ref="name"` in template + `ref<T>()` in script (canvas/D3 only) |
| `document.querySelectorAll(...)` | Direct DOM query | `@foreach` to render lists |
| `document.getElementById(...)` | Direct DOM query | Template directives |
| `document.getElementsByClassName(...)` | Direct DOM query | `@class` directive |
| `document.createElement(...)` | DOM node creation | Template directives. **One exception:** `document.createElement('a')` for Blob download triggers |
| `.textContent = val` | Direct text mutation | `{{ val }}` or `x-text="val"` |
| `.style.display = 'none'` | Inline style toggle | `@if(condition)...@endif` or `x-show="condition"` |
| `.style.anything = ...` | Inline style mutation | `@style="{ prop: value }"` or `@class` |
| `.className = ...` | Direct class mutation | `@class="getClass(item)"` or `@class="{ active: isActive.value }"` |
| `.classList.add/remove/toggle` | Direct class mutation | `@class` directive |
| `.setAttribute(...)` | Direct attribute mutation | `@bind:attr="expr"` or `:attr="expr"` |
| `.removeAttribute(...)` | Direct attribute mutation | `@if` to conditionally render |
| `element.addEventListener(...)` | Manual event binding | `@click`, `@input`, `@change`, `@submit`, `@keydown.enter`, etc. |
| `setInterval(updateUI, N)` | Polling for reactivity | DELETE IT. Reactivity is automatic via `ref`/`computed`/`watch`/`effect` |
| `setTimeout(updateUI, N)` | Delayed DOM update | `effect()` or `watch()` for reactive updates |
| `window.anything` | Global namespace pollution | STX composables (`useRoute()`, `navigate()`, `useLocalStorage()`, etc.) |
| `document.title = ...` | Direct head mutation | `useTitle()` or `useHead()` composable |
| `ref<HTMLElement>` for DOM manip | Holding elements to mutate | Template directives. **One exception:** `ref<HTMLCanvasElement>` for Chart.js/D3 |

### The ONLY acceptable uses of refs to DOM elements:
1. **Chart.js canvas**: `const chart = ref<HTMLCanvasElement | null>(null)` → `new Chart(chart.value, config)` in `onMount()`
2. **D3.js container**: `const viz = ref<HTMLElement | null>(null)` → `d3.select(viz.value)` in `onMount()`
3. **Blob download**: `document.createElement('a')` to trigger file downloads (browser File API)

**Everything else uses template directives. No exceptions.**

---

## 2. COMPLETE STX CLIENT-SIDE RUNTIME API

### Reactivity Primitives

| Function | Signature | Purpose |
|---|---|---|
| `ref()` | `ref<T>(value: T): Signal<T>` | Create reactive state. Read via `.value`, write via `.value =` |
| `computed()` | `computed<T>(getter: () => T): Signal<T>` | Derived reactive value, auto-tracks dependencies |
| `reactive()` | `reactive<T>(obj: T): T` | Make object deeply reactive |
| `watch()` | `watch(source, callback, options?): stop` | Watch a source and run callback on change |
| `watchEffect()` | `watchEffect(fn: () => void): stop` | Auto-tracking effect (alias: `effect()`) |
| `effect()` | `effect(fn: () => void): cleanup` | Run side effect, re-runs when dependencies change |
| `batch()` | `batch(fn: () => void): void` | Batch multiple signal updates, run effects once |
| `isRef()` | `isRef(value): boolean` | Check if value is a signal |
| `unref()` | `unref(value): T` | Unwrap signal without tracking |
| `peek()` | `peek(fn: () => T): T` | Read signals without tracking as dependencies |

**Vue compatibility aliases:** `ref` → `state`, `computed` → `derived`, `watchEffect` → `effect`

### Lifecycle Hooks

| Hook | Signature | Purpose |
|---|---|---|
| `onMount()` | `onMount(callback: () => void \| cleanup): void` | Run after component mounts. Return cleanup function for teardown |
| `onDestroy()` | `onDestroy(callback: () => void): void` | Run when component is destroyed |

### Data Fetching

| Composable | Returns | Purpose |
|---|---|---|
| `useQuery<T>(url, options?)` | `{ data, loading, error, isStale, refetch, invalidate }` | Cached data fetching. Options: `initialData`, `cacheTime` (default 5min), `staleTime`, `refetchInterval`, `refetchOnFocus` |
| `useFetch<T>(url, options?)` | `{ data, loading, error, refetch, isLoading, hasError, isEmpty }` | Simple fetch. Options: `transform`, `immediate`, `method`, `headers`, `body` |
| `useMutation<T>(url, options?)` | `{ data, loading, error, mutate, reset }` | POST/PUT/DELETE. Options: `method`, `onSuccess`, `onError`, `optimisticUpdate`, `invalidateQueries` |

### Navigation & Routing

| Function | Signature | Purpose |
|---|---|---|
| `navigate()` | `navigate(url: string): void` | SPA navigation. Uses router if available, falls back to `location.href` |
| `goBack()` | `goBack(): void` | `history.back()` |
| `goForward()` | `goForward(): void` | `history.forward()` |
| `useRoute()` | `useRoute(): RouteInfo` | Returns `{ path, fullPath, hash, query, params }` — read-only current route |
| `useSearchParams()` | `useSearchParams(): Params` | Returns `{ data, get(key), set(key, value), setAll(obj) }` — reactive URL query params |

### DOM & Events

| Composable | Returns | Purpose |
|---|---|---|
| `useRef(name)` | `{ current, value }` | Access template element by `ref="name"` |
| `useEventListener(event, handler, opts?)` | `void` | Attach event listener with auto-cleanup. Options: `target`, `capture`, `passive`, `once` |
| `useClickOutside(target, handler)` | `{ remove }` | Detect clicks outside element (dropdowns, modals) |
| `useFocus(target)` | `{ isFocused, focus, blur }` | Track and control element focus |

### Storage

| Composable | Returns | Purpose |
|---|---|---|
| `useLocalStorage(key, default?)` | `Signal<T>` | Reactive localStorage, auto-syncs across tabs |
| `useSessionStorage(key, default?)` | `Signal<T>` | Reactive sessionStorage |

### Timers

| Composable | Returns | Purpose |
|---|---|---|
| `useDebounce(fn, delay?)` | `fn & { cancel, flush, pending }` | Debounced function |
| `useDebouncedValue(getter, delay?)` | `{ value }` | Debounced reactive value |
| `useThrottle(fn, limit?)` | `fn & { cancel }` | Throttled function |
| `useInterval(ms?, opts?)` | `{ counter, pause, resume, reset }` | Reactive interval timer |
| `useTimeout(callback, delay?)` | `{ isPending, start, stop }` | One-shot timer |

### Utilities

| Composable | Returns | Purpose |
|---|---|---|
| `useToggle(initial?)` | `[ref, toggle, set]` | Boolean toggle state |
| `useCounter(initial?, opts?)` | `{ count, inc, dec, set, reset }` | Counter with min/max bounds |
| `useAsync(fn, opts?)` | `{ state, isLoading, error, data, execute }` | Async operation tracking |
| `useColorMode(opts?)` | `{ mode, preference, isDark, set, toggle }` | Dark/light mode management |
| `useDark(opts?)` | `{ isDark, toggle, set }` | Simplified dark mode |
| `useTitle(title)` | `void` | Set document title |

### Window & Media

| Composable | Returns | Purpose |
|---|---|---|
| `useWindowSize()` | `{ width, height }` | Reactive window dimensions |
| `useMediaQuery(query)` | `Signal<boolean>` | Reactive CSS media query |
| `useBreakpoints()` | `{ isMobile, isTablet, isDesktop, isLargeDesktop }` | Tailwind-like breakpoints |
| `usePrefersDark()` | `Signal<boolean>` | OS dark mode preference |
| `useOnline()` | `Signal<boolean>` | Network connectivity |
| `useMouse()` | `{ x, y }` | Reactive mouse position |
| `useScroll(el?)` | `{ x, y, isScrolling }` | Reactive scroll position |

### Head & SEO

| Composable | Purpose |
|---|---|
| `useHead(options)` | Set title, meta, link, script, style, htmlAttrs, bodyAttrs |
| `useSeoMeta(options)` | Set SEO meta: title, description, ogTitle, ogImage, twitterCard, etc. |
| `definePageMeta(options)` | Page config: title, description, layout, middleware, keepAlive |

### Template Directives (HTML Attributes)

**Conditionals & Loops:**
| Attribute | Purpose | Example |
|---|---|---|
| `@if="condition"` / `:if="condition"` | Conditional render (removes from DOM) | `@if="loading.value"` |
| `@for="item in list"` / `:for="item in list"` | List render | `@for="r in requests.value"` |
| `x-show="condition"` / `@show="condition"` | Toggle visibility (keeps in DOM) | `x-show="!collapsed.value"` |
| `@for-loading` / `@loading` | Show during fetch | Sibling of `@for` element |
| `@for-empty` / `@empty` | Show when list empty | Sibling of `@for` element |

**Block-style (in templates with `<script client>`):**
| Block | Converts To | Example |
|---|---|---|
| `@if(expr)...@endif` | `<template @if="expr">` | `@if(loading.value)..@endif` |
| `@foreach(list as item)...@endforeach` | `<template @for="item in list">` | `@foreach(items.value as r)..@endforeach` |

**Data Binding:**
| Attribute | Purpose | Example |
|---|---|---|
| `{{ expr }}` | Text interpolation (auto-escapes) | `{{ item.name }}` |
| `x-text="expr"` / `@text="expr"` | Set textContent | `x-text="count.value"` |
| `x-html="expr"` / `@html="expr"` | Set innerHTML (careful: XSS) | `x-html="rendered.value"` |
| `x-model="var"` / `@model="var"` | Two-way binding (input/select/textarea) | `<input x-model="search">` |
| `@class="expr"` / `:class="expr"` | Dynamic classes (string or object) | `@class="{ active: isOn.value }"` |
| `@style="expr"` / `:style="expr"` | Dynamic styles (string or object) | `@style="{ color: c.value }"` |
| `@bind:attr="expr"` / `:attr="expr"` | Bind any HTML attribute | `:href="link.value"` |
| `ref="name"` | Store element reference | `<canvas ref="chart">` |

**Events:**
| Attribute | Purpose | Modifiers |
|---|---|---|
| `@click="handler"` | Click event | `.prevent`, `.stop`, `.once`, `.self`, `.capture` |
| `@input="handler"` | Input event | Same modifiers |
| `@change="handler"` | Change event | Same modifiers |
| `@submit="handler"` | Form submit | `.prevent` (almost always) |
| `@keydown="handler"` | Key event | `.enter`, `.escape`, `.tab`, `.space`, `.up`, `.down`, `.left`, `.right`, `.delete`, `.backspace`, `.ctrl`, `.alt`, `.shift`, `.meta` |
| `@dblclick`, `@mouseenter`, `@mouseleave`, `@focus`, `@blur`, `@scroll`, `@resize` | Other events | Same modifiers |

### Template Pipes/Filters

Use in `{{ }}` expressions: `{{ value | pipeName }}` or `{{ value | pipeName:arg }}`

| Pipe | Purpose | Example |
|---|---|---|
| `fmt` | Format number (1K, 2.5M) | `{{ count \| fmt }}` |
| `formatDate` | Date formatting | `{{ date \| formatDate:'YYYY-MM-DD' }}` |
| `timeAgo` | Relative time ("2h ago") | `{{ timestamp \| timeAgo }}` |
| `capitalize` | Capitalize first letter | `{{ name \| capitalize }}` |
| `truncate` | Truncate with ellipsis | `{{ text \| truncate:50 }}` |
| `json` | JSON stringify | `{{ obj \| json:2 }}` |
| `pluralize` | Pluralize words | `{{ count \| pluralize:'item':'items' }}` |
| `currency` | Format as currency | `{{ price \| currency:'$':2 }}` |
| `percent` | Format as percentage | `{{ rate \| percent:1 }}` |
| `clamp` | Clamp number | `{{ val \| clamp:0:100 }}` |

---

## 3. SPA ROUTER — `@stxRouter`

### What it is
STX ships a built-in SPA router. It intercepts link clicks, fetches pages via AJAX, swaps content, manages history, handles cleanup, and re-initializes scripts — **all automatically**. You never need to write a custom router.

### How to enable it
```html
<!-- In your layout file, before </body> -->
@stxRouter('main')
```
The argument is the CSS selector for the content container. `'main'` targets the `<main>` element. You can also use `'#content'`, `'[data-stx-content]'`, etc.

### What it does on navigation
1. Intercepts `<a href>` clicks on internal links (same-origin, no `target="_blank"`, no modifier keys)
2. Fetches the new page HTML via `fetch()` with `X-STX-Router: true` header
3. Calls `window.stx._cleanupContainer()` to dispose all effects/signals in the old content
4. Swaps the container's innerHTML with the new page content
5. Injects new `<style>` tags, loads new `<script src>` tags
6. Re-executes inline page scripts (skips router/runtime/layout scripts)
7. Updates `document.title` from new page
8. Pushes `history.pushState()`
9. Dispatches `stx:navigate` and `stx:load` events
10. Optionally scrolls to top

### Configuration
```javascript
// Set before router loads, in layout script
window.__stxRouterConfig = {
  container: 'main',              // Content container selector
  loadingClass: 'stx-navigating', // Class added to <html> during navigation
  viewTransitions: true,          // Use View Transitions API (Chrome/Edge)
  cache: true,                    // Cache fetched pages
  scrollToTop: true,              // Scroll to top on navigate
  prefetch: true                  // Prefetch on hover
}
```

### How `navigate()` works
```typescript
// Auto-imported in <script client>
navigate('/requests')           // SPA navigate
navigate('/endpoints/' + id)    // Dynamic routes
// Falls back to location.href if router not available
```

### Link interception rules — links are NOT intercepted if:
- External URL (different origin)
- Has `target="_blank"`
- Has `data-stx-no-router` or `data-no-router` attribute
- Has `download` attribute
- Hash-only link (`#section`)
- Special protocol (`mailto:`, `tel:`, `javascript:`)
- User holding Ctrl/Meta/Shift/Alt key

### Router public API (on `window.stxRouter` / `window.stx.router`)
```typescript
stxRouter.navigate(url)     // Navigate programmatically
stxRouter.prefetch(url)     // Manually prefetch a page
stxRouter.clearCache()      // Clear response cache
stxRouter.updateNav()       // Refresh active link classes
```

### WHY you never write a custom router
The STX router handles: effect cleanup, scope disposal, style injection/removal, script re-execution, view transitions, prefetching, history management, active link classes. Rolling your own means missing all of this and leaking memory.

---

## 4. CORRECT PATTERNS — How to Write STX Pages

### Layout file pattern (`layouts/app.stx`)
```stx
<script client>
const sidebarCollapsed = ref<boolean>(false)
const route = useRoute()

onMount(() => {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('httx-sidebar-collapsed')
    if (stored === 'true') sidebarCollapsed.value = true
  }
})

function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value
  if (typeof localStorage !== 'undefined')
    localStorage.setItem('httx-sidebar-collapsed', String(sidebarCollapsed.value))
}

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function breadcrumb(): string {
  if (route.path === '/') return 'Dashboard'
  const segment = route.path.slice(1)
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}
</script>

<!DOCTYPE html>
<html lang="en">
<head>...</head>
<body>
  @include('sidebar')

  <div class="main-wrapper" :class="{ collapsed: sidebarCollapsed.value }">
    <header>
      <span>{{ breadcrumb() }}</span>
    </header>
    <main>
      @yield('content')
    </main>
  </div>

  @stxRouter('main')
</body>
</html>
```

**Key points:**
- Sidebar collapse uses `ref<boolean>` + `:class` binding — NOT `.style.display` or `.classList.toggle`
- Route info from `useRoute()` — NOT `window.location`
- `localStorage` access only in `onMount()` — it's a browser API, acceptable
- `@stxRouter('main')` before `</body>` — enables SPA navigation

### Sidebar pattern (partials/sidebar.stx)
```stx
<aside class="sidebar" :class="{ collapsed: sidebarCollapsed.value }">
  <div class="sidebar-brand">
    <span>httx</span>
  </div>

  <nav>
    <a href="/" @click.prevent="navigate('/')"
       class="nav-item" :class="{ active: isActive('/') }">
      Dashboard
    </a>
    <a href="/requests" @click.prevent="navigate('/requests')"
       class="nav-item" :class="{ active: isActive('/requests') }">
      Requests
    </a>
    <!-- more nav items... -->
  </nav>

  <button @click="toggleSidebar()" class="collapse-btn">
    <!-- icon -->
  </button>
</aside>
```

**Key points:**
- `@click.prevent="navigate(...)"` for SPA links — NOT `onclick="window.location ="`
- `:class="{ active: isActive('/path') }"` for active state — NOT `element.classList.add('active')`
- `:class="{ collapsed: sidebarCollapsed.value }"` for collapse — NOT `.style.width = '56px'`

### Page script pattern (data-driven page)
```stx
@extends('layouts/app')

@section('content')
<script client>
// 1. Fetch data with useQuery (auto-caches, auto-refetches)
const { data: items, loading } = useQuery<Item[]>('/api/items', { initialData: [] })

// 2. Derive filtered/computed state — NO manual updateUI() function
const searchTerm = ref<string>('')
const filtered = computed<Item[]>(() => {
  let list: Item[] = items.value || []
  if (searchTerm.value) {
    const q = searchTerm.value.toLowerCase()
    list = list.filter((item: Item) => item.name.toLowerCase().includes(q))
  }
  return list
})

// 3. Helper functions for template use (pure functions, no DOM access)
function getStatusClass(status: number): string {
  if (status < 300) return 'bg-emerald-500/15 text-emerald-500'
  if (status < 400) return 'bg-indigo-500/15 text-indigo-400'
  return 'bg-red-500/15 text-red-500'
}

// 4. onMount ONLY for external libs (Chart.js, D3) — NOT for updateUI
onMount(() => {
  // Chart.js init — legitimate canvas API usage
  const waitForChart = setInterval(() => {
    if (typeof Chart === 'undefined' || !chartRef.value) return
    clearInterval(waitForChart)
    new Chart(chartRef.value, { ... })
  }, 100)
  return () => clearInterval(waitForChart)
})
</script>

<!-- 5. Template uses @if/@foreach — NO innerHTML, NO DOM manipulation -->
<div class="animate-fade-in">
  <input type="text" x-model="searchTerm" placeholder="Search...">

  @if(loading.value)
    <div>Loading...</div>
  @endif

  @if(!loading.value && filtered.value.length === 0)
    <div>No items found.</div>
  @endif

  @if(!loading.value && filtered.value.length > 0)
    <table>
      <thead>...</thead>
      <tbody>
        @foreach(filtered.value as item)
          <tr @click="navigate('/items/' + item.id)">
            <td><span @class="getStatusClass(item.status)">{{ item.status }}</span></td>
            <td>{{ item.name }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>
  @endif
</div>
@endsection
```

**Key points:**
- `useQuery()` for data — NOT `fetch()` in `onMount()` with manual state
- `computed()` for derived state — NOT `updateUI()` function
- `@if`/`@foreach` in template — NOT `innerHTML` string building
- `@class` for dynamic classes — NOT ternary in class attribute string
- `x-model` for search input — NOT `addEventListener('input')`
- `navigate()` in `@click` — NOT `window.location` or `onclick`
- `onMount()` ONLY for Chart.js/D3 — NOT for DOM manipulation

### What NEVER belongs in a page script:
```typescript
// ALL OF THESE ARE WRONG:
const container = ref<HTMLElement | null>(null)     // ← holding element to mutate
function updateUI(): void { ... }                   // ← manual DOM update function
setInterval(updateUI, 200)                          // ← polling for reactivity
container.value.innerHTML = list.map(...).join('')   // ← innerHTML rendering
element.style.display = 'none'                      // ← manual visibility toggle
element.textContent = String(value)                  // ← manual text update
element.className = 'some-class'                     // ← manual class update
```

---

## 5. STX SOURCE PATHS — Read Before Writing Code

### Core framework
| File | What's in it | When to read |
|---|---|---|
| `/Users/glennmichaeltorregosa/Documents/Projects/stx/API.md` | Complete API reference | Before writing ANY .stx file |
| `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx/src/signals.ts` | Client runtime: `bindIf`, `bindFor`, `bindShow`, `bindModel`, `bindClass`, `ref`, `computed`, `effect`, composables, DOMContentLoaded init | When debugging client-side behavior |
| `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx/src/process.ts` | Build-time processing: directive conversion, loop/conditional processing, signal detection | When `@if`/`@foreach` aren't working |
| `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx/src/expressions.ts` | Expression evaluation, `usesSignalsInScript()` detection | When expressions aren't evaluating |
| `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/router/src/client.ts` | SPA router: navigate, link interception, content swap, cleanup, prefetch, view transitions | When navigation breaks |
| `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx/src/client/directive.ts` | `@stxRouter` directive handler, router script injection | When router isn't injecting |
| `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx/src/composables/use-router.ts` | `navigate()`, `goBack()`, `goForward()`, `useRoute()`, `useSearchParams()` | When routing composables fail |
| `/Users/glennmichaeltorregosa/Documents/Projects/stx/packages/bun-plugin/src/serve.ts` | Dev server, HMR, file serving | When dev server has issues |

### Documentation
| File | Contents |
|---|---|
| `/Users/glennmichaeltorregosa/Documents/Projects/stx/docs/api/template-syntax.md` | Template syntax reference |
| `/Users/glennmichaeltorregosa/Documents/Projects/stx/docs/api/state.md` | State management (stores) |
| `/Users/glennmichaeltorregosa/Documents/Projects/stx/docs/api/core.md` | Core API |
| `/Users/glennmichaeltorregosa/Documents/Projects/stx/docs/api/components.md` | Component system |
| `/Users/glennmichaeltorregosa/Documents/Projects/stx/docs/advanced/custom-directives.md` | Custom directive creation |

### Build commands (always run in this order after STX changes)
```bash
cd /Users/glennmichaeltorregosa/Documents/Projects/stx/packages/stx && bun run build
cd /Users/glennmichaeltorregosa/Documents/Projects/stx/packages/bun-plugin && bun run build
rm -rf /Users/glennmichaeltorregosa/Documents/Stacks/ts-http/packages/devtools/.stx
# Then restart dev server
```

### This project
| File | What it is |
|---|---|
| `packages/httx/src/client.ts` | HTTP client library |
| `packages/devtools/server.ts` | API server (SQLite backend) |
| `packages/devtools/serve.ts` | Dev server entry |
| `packages/devtools/src/pages/layouts/app.stx` | Main layout (sidebar, header, router) |
| `packages/devtools/src/pages/partials/sidebar.stx` | Sidebar navigation partial |
| `packages/devtools/src/pages/*.stx` | All page templates |

---

## Processing Pipeline (How `@if`/`@foreach` Work With Signals)

When a `.stx` file has `<script client>` with signals:

1. `usesSignalsInScript(output)` detects `ref()`, `computed()`, `useQuery()`, etc.
2. `convertSignalDirectivesToAttributes(output)` converts `@if(expr)...@endif` → `<template @if="expr">...</template>`
3. `convertSignalLoopsToAttributes(output)` converts `@foreach(list as item)...@endforeach` → `<template @for="item in list">...</template>`
4. **These run BEFORE `processLoops`** so server-side loop processor skips signal loops
5. `processLoops` only handles remaining non-signal loops (server-side data)
6. `processConditionals` only handles remaining non-signal conditionals
7. Client receives `@if="expr"` and `@for="item in list"` as HTML attributes
8. `bindIf()` in signals.ts creates reactive effects that add/remove DOM nodes
9. `bindFor()` in signals.ts creates reactive effects that clone/remove list items

**If this pipeline breaks:** read `process.ts` lines 1741-1755 and `signals.ts` `bindIf`/`bindFor` functions.

---

## Common Gotchas

1. **`@if` vs `x-show`**: `@if` removes/adds elements from DOM (use for loading states, conditionally-rendered sections). `x-show` toggles `display: none` (use for quick show/hide of existing elements).
2. **Nested `@if` inside `@foreach`**: Works. Loop variable is in scope.
3. **Complex list expressions in `@foreach`**: Use `computed()` to pre-compute the list. Don't inline `items.value.filter(...).map(...)` in the directive.
4. **`@class` syntax**: String — `@class="getClass(item)"`. Object — `@class="{ active: isActive.value, 'text-red': hasError.value }"`.
5. **After editing STX source**: Always rebuild STX + bun-plugin, clear `.stx` cache, restart dev server.
6. **Chart.js/D3 polling for lib load**: `setInterval` to wait for `typeof Chart !== 'undefined'` is OK — this polls for external lib loading, not for UI updates.
7. **Devtools port**: 4401. Kill old process with `lsof -i :4401 -t | xargs kill` if port is in use.

---

## Linting

- Use **pickier** for linting — never use eslint directly
- Run `bunx --bun pickier .` to lint, `bunx --bun pickier . --fix` to auto-fix
- When fixing unused variable warnings, prefer `// eslint-disable-next-line` comments over prefixing with `_`

## Frontend

- Use **stx** for templating — never write vanilla JS (`var`, `document.*`, `window.*`) in stx templates
- Use **crosswind** as the default CSS framework which enables standard Tailwind-like utility classes
- stx `<script>` tags should only contain stx-compatible code (signals, composables, directives)

## Dependencies

- **buddy-bot** handles dependency updates — not renovatebot
- **better-dx** provides shared dev tooling as peer dependencies — do not install its peers (e.g., `typescript`, `pickier`, `bun-plugin-dtsx`) separately if `better-dx` is already in `package.json`
- If `better-dx` is in `package.json`, ensure `bunfig.toml` includes `linker = "hoisted"`
