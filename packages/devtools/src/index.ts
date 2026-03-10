import type { DashboardConfig } from './types'
import { createApiRoutes, fetchEndpointDetail, fetchRequestById, resolveConfig } from './api'

export type { DashboardConfig, DashboardStats, EndpointDetail, EndpointStats, EventLogEntry, HttpMethod, MonitoringAlert, RequestMetrics, RequestRecord, StatusDistribution, StorageConfig, TimeSeriesPoint, ThroughputPoint } from './types'
export { createApiRoutes, fetchAlerts, fetchDashboardStats, fetchEndpointDetail, fetchEndpointList, fetchEventLog, fetchMonitoringState, fetchRequestById, fetchRequestHistory } from './api'
export { createRecorder } from './recorder'
export { putRequest, queryAllRequests, getRequestById, getRequestCount, pruneOldRequests, closeDb } from './storage'
export type { SqliteStorageConfig } from './storage'

// Lightweight parameterized route matcher
interface RouteMatch {
  handler: string
  params: Record<string, string>
}

const pageRoutes: Array<{ pattern: RegExp, handler: string, paramNames: string[] }> = [
  { pattern: /^\/$/, handler: 'dashboard', paramNames: [] },
  { pattern: /^\/index$/, handler: 'dashboard', paramNames: [] },
  { pattern: /^\/requests\/([^/]+)$/, handler: 'request-details', paramNames: ['id'] },
  { pattern: /^\/requests$/, handler: 'requests', paramNames: [] },
  { pattern: /^\/endpoints\/([^/]+)$/, handler: 'endpoint-details', paramNames: ['path'] },
  { pattern: /^\/endpoints$/, handler: 'endpoints', paramNames: [] },
  { pattern: /^\/metrics$/, handler: 'metrics', paramNames: [] },
  { pattern: /^\/monitoring$/, handler: 'monitoring', paramNames: [] },
  { pattern: /^\/timeline$/, handler: 'timeline', paramNames: [] },
  { pattern: /^\/network$/, handler: 'network', paramNames: [] },
  { pattern: /^\/compare$/, handler: 'compare', paramNames: [] },
  { pattern: /^\/export$/, handler: 'export', paramNames: [] },
  { pattern: /^\/settings$/, handler: 'settings', paramNames: [] },
]

function matchRoute(pathname: string): RouteMatch | null {
  for (const route of pageRoutes) {
    const match = pathname.match(route.pattern)
    if (match) {
      const params: Record<string, string> = {}
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1])
      })
      return { handler: route.handler, params }
    }
  }
  return null
}

function pageShell(title: string, activePage: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — httx</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4" defer><\/script>
  <script src="https://cdn.jsdelivr.net/npm/d3@7" defer><\/script>
  <style>
    :root {
      --bg: #0a0a0f; --bg2: #141419; --bg3: #1e1e26;
      --text: #f5f5f7; --text2: #a1a1aa; --muted: #71717a; --border: #27272a;
      --accent: #6366f1; --accent2: #818cf8;
      --success: #10b981; --warning: #f59e0b; --error: #ef4444;
      --sidebar-w: 240px; --sidebar-collapsed: 56px;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; min-height: 100vh; -webkit-font-smoothing: antialiased; }
    .sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: var(--sidebar-w); background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; transition: width 0.2s ease; z-index: 50; overflow: hidden; }
    .sidebar.collapsed { width: var(--sidebar-collapsed); }
    .sidebar.collapsed .nav-label, .sidebar.collapsed .nav-group-title, .sidebar.collapsed .sidebar-brand span, .sidebar.collapsed .sidebar-footer span { display: none; }
    .sidebar.collapsed .nav-item { justify-content: center; padding: 0.5rem 0; }
    .sidebar.collapsed .nav-item svg { margin-right: 0; }
    .main-wrapper { margin-left: var(--sidebar-w); transition: margin-left 0.2s ease; min-height: 100vh; }
    .main-wrapper.collapsed { margin-left: var(--sidebar-collapsed); }
    .chart-container { position: relative; height: 280px; width: 100%; }
    .chart-container-sm { position: relative; height: 200px; width: 100%; }
    .status-card-accent::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
    .accent-success::before { background: var(--success); }
    .accent-info::before { background: var(--accent); }
    .accent-warning::before { background: var(--warning); }
    .accent-error::before { background: var(--error); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .animate-fade-in { animation: fadeIn 0.3s ease forwards; }
    .animate-pulse { animation: pulse 2s ease-in-out infinite; }
    .d3-container { width: 100%; min-height: 400px; overflow: hidden; }
    .d3-container svg { width: 100%; height: 100%; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: var(--bg); } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    a { text-decoration: none; }
  </style>
</head>
<body>
  <aside class="sidebar" id="sidebar">
    <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);" class="sidebar-brand">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      <span style="font-size:14px;font-weight:600;color:var(--text);">httx</span>
    </div>
    <nav style="flex:1;padding:12px 0;overflow-y:auto;">
      ${sidebarGroup('Overview', [
        { href: '/', icon: 'grid', label: 'Dashboard', page: 'dashboard' },
        { href: '/timeline', icon: 'activity', label: 'Timeline', page: 'timeline' },
      ], activePage)}
      ${sidebarGroup('Traffic', [
        { href: '/requests', icon: 'download', label: 'Requests', page: 'requests' },
        { href: '/endpoints', icon: 'target', label: 'Endpoints', page: 'endpoints' },
        { href: '/network', icon: 'share2', label: 'Network', page: 'network' },
        { href: '/compare', icon: 'columns', label: 'Compare', page: 'compare' },
      ], activePage)}
      ${sidebarGroup('Performance', [
        { href: '/metrics', icon: 'bar-chart', label: 'Metrics', page: 'metrics' },
        { href: '/monitoring', icon: 'heart', label: 'Monitoring', page: 'monitoring' },
      ], activePage)}
      ${sidebarGroup('Tools', [
        { href: '/export', icon: 'upload', label: 'Export', page: 'export' },
        { href: '/settings', icon: 'settings', label: 'Settings', page: 'settings' },
      ], activePage)}
    </nav>
    <button id="sidebar-toggle" style="display:flex;align-items:center;justify-content:center;width:100%;padding:12px;border:none;border-top:1px solid var(--border);color:var(--muted);background:transparent;cursor:pointer;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
    </button>
    <div style="padding:8px 16px;border-top:1px solid var(--border);" class="sidebar-footer">
      <span style="font-size:11px;color:#52525b;">httx v0.1.0</span>
    </div>
  </aside>
  <div class="main-wrapper" id="main-wrapper">
    <header style="display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:var(--bg2);border-bottom:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text2);">
        <a href="/" style="color:var(--text2);">httx</a>
        <span style="color:#52525b;">/</span>
        <span style="color:var(--text);">${activePage || 'Dashboard'}</span>
      </div>
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);cursor:pointer;">
        <input type="checkbox" id="auto-refresh" checked style="accent-color:#6366f1;">
        <span>Auto-refresh</span>
      </label>
    </header>
    <main style="padding:24px;max-width:1400px;margin:0 auto;">
      ${bodyContent}
    </main>
  </div>
  <script>
    const sidebar = document.getElementById('sidebar');
    const mainWrapper = document.getElementById('main-wrapper');
    const toggle = document.getElementById('sidebar-toggle');
    if (localStorage.getItem('httx-sidebar-collapsed') === 'true') { sidebar.classList.add('collapsed'); mainWrapper.classList.add('collapsed'); }
    toggle.addEventListener('click', () => { sidebar.classList.toggle('collapsed'); mainWrapper.classList.toggle('collapsed'); localStorage.setItem('httx-sidebar-collapsed', sidebar.classList.contains('collapsed')); });
  <\/script>
</body>
</html>`
}

function navIcon(name: string): string {
  const icons: Record<string, string> = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    share2: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    columns: '<rect x="2" y="4" width="8" height="16" rx="1"/><rect x="14" y="4" width="8" height="16" rx="1"/>',
    'bar-chart': '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    heart: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  }
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">${icons[name] || ''}</svg>`
}

function sidebarGroup(title: string, items: Array<{ href: string, icon: string, label: string, page: string }>, activePage: string): string {
  return `
    <div style="padding:0 12px;margin-top:${title === 'Overview' ? '0' : '16px'};margin-bottom:4px;">
      <div class="nav-group-title" style="font-size:10px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;padding:0 8px;margin-bottom:4px;">${title}</div>
    </div>
    ${items.map(item => {
      const isActive = activePage === item.page
      const style = isActive
        ? 'background:rgba(99,102,241,0.15);color:#818cf8;'
        : 'color:var(--text2);'
      return `<a href="${item.href}" class="nav-item" style="display:flex;align-items:center;gap:12px;padding:8px 16px;margin:0 8px;border-radius:6px;font-size:13px;font-weight:500;transition:all 0.15s;${style}">
        ${navIcon(item.icon)}
        <span class="nav-label">${item.label}</span>
      </a>`
    }).join('')}`
}

// Page content generators
function dashboardPageContent(): string {
  return `<div class="animate-fade-in">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
    <div><h1 style="font-size:18px;font-weight:600;">Overview</h1><p style="font-size:13px;color:var(--muted);margin-top:2px;">HTTP client monitoring & analytics</p></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;" id="stat-cards">
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;"><div style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;">Total Requests</div><div style="font-size:28px;font-weight:700;margin-top:4px;" id="s-total">—</div></div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;"><div style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;">Avg Response Time</div><div style="font-size:28px;font-weight:700;color:var(--accent);margin-top:4px;" id="s-avg">—</div></div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;"><div style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;">Error Rate</div><div style="font-size:28px;font-weight:700;color:var(--error);margin-top:4px;" id="s-err">—</div></div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;"><div style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;">Requests/min</div><div style="font-size:28px;font-weight:700;margin-top:4px;" id="s-rpm">—</div></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;margin-bottom:24px;">
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="display:flex;justify-content:space-between;margin-bottom:16px;"><span style="font-size:14px;font-weight:600;">Throughput</span><span style="font-size:12px;color:var(--muted);">Last 30 min</span></div><div class="chart-container"><canvas id="throughputChart"></canvas></div></div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="display:flex;justify-content:space-between;margin-bottom:16px;"><span style="font-size:14px;font-weight:600;">Status Distribution</span><a href="/metrics" style="font-size:12px;color:var(--accent);">Details</a></div><div class="chart-container"><canvas id="statusChart"></canvas></div></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;">
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="display:flex;justify-content:space-between;margin-bottom:16px;"><span style="font-size:14px;font-weight:600;">Recent Requests</span><a href="/requests" style="font-size:12px;color:var(--accent);">View All</a></div><div id="recent-table" style="font-size:13px;color:var(--muted);text-align:center;padding:16px;">Loading...</div></div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="display:flex;justify-content:space-between;margin-bottom:16px;"><span style="font-size:14px;font-weight:600;">Active Alerts</span><a href="/monitoring" style="font-size:12px;color:var(--accent);">View All</a></div><div id="alerts-panel" style="font-size:13px;color:var(--muted);text-align:center;padding:16px;">Loading...</div></div>
  </div>
</div>
<script>
document.addEventListener('DOMContentLoaded', async()=>{
  const [sr,rr,ar]=await Promise.all([fetch('/api/stats'),fetch('/api/requests'),fetch('/api/alerts')]);
  const s=await sr.json(), reqs=await rr.json(), alerts=await ar.json();
  document.getElementById('s-total').textContent=s.totalRequests;
  document.getElementById('s-avg').innerHTML=s.avgResponseTime+' <span style="font-size:12px;color:var(--muted);font-weight:400;">ms</span>';
  document.getElementById('s-err').innerHTML=s.errorRate+' <span style="font-size:12px;color:var(--muted);font-weight:400;">%</span>';
  document.getElementById('s-rpm').textContent=s.requestsPerMinute;
  if(typeof Chart!=='undefined'){
    new Chart(document.getElementById('throughputChart'),{type:'line',data:{labels:s.throughputHistory.map((_,i)=>(30-i)+'m'),datasets:[{label:'Success',data:s.throughputHistory.map(p=>p.successCount),borderColor:'#10b981',backgroundColor:'rgba(16,185,129,0.1)',fill:true,tension:0.3,pointRadius:0},{label:'Errors',data:s.throughputHistory.map(p=>p.errorCount),borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,0.1)',fill:true,tension:0.3,pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#a1a1aa',font:{size:11}}}},scales:{x:{ticks:{color:'#71717a',font:{size:10}},grid:{color:'#27272a'}},y:{ticks:{color:'#71717a',font:{size:10}},grid:{color:'#27272a'}}}}});
    const sd=s.statusDistribution;
    new Chart(document.getElementById('statusChart'),{type:'doughnut',data:{labels:['2xx','3xx','4xx','5xx'],datasets:[{data:[sd['2xx'],sd['3xx'],sd['4xx'],sd['5xx']],backgroundColor:['#10b981','#6366f1','#f59e0b','#ef4444'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom',labels:{color:'#a1a1aa',font:{size:11},padding:16}}}}});
  }
  const recent=reqs.slice(-10).reverse();
  const rt=document.getElementById('recent-table');
  if(recent.length){
    rt.innerHTML='<table style="width:100%;border-collapse:collapse;"><thead><tr>'+['Method','URL','Status','Duration'].map(h=>'<th style="padding:6px 8px;text-align:left;font-size:11px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid var(--border);">'+h+'</th>').join('')+'</tr></thead><tbody>'+recent.map(r=>{
      const mc=r.method==='GET'?'color:#10b981;background:rgba(16,185,129,0.15);':r.method==='POST'?'color:#6366f1;background:rgba(99,102,241,0.15);':r.method==='DELETE'?'color:#ef4444;background:rgba(239,68,68,0.15);':'color:#f59e0b;background:rgba(245,158,11,0.15);';
      const sc=r.status<300?'color:#10b981;background:rgba(16,185,129,0.15);':r.status<400?'color:#6366f1;background:rgba(99,102,241,0.15);':r.status<500?'color:#f59e0b;background:rgba(245,158,11,0.15);':'color:#ef4444;background:rgba(239,68,68,0.15);';
      return '<tr style="cursor:pointer;" onclick="window.location=\\'/requests/'+r.id+'\\'"><td style="padding:6px 8px;border-bottom:1px solid rgba(39,39,42,0.5);"><span style="display:inline-flex;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;'+mc+'">'+r.method+'</span></td><td style="padding:6px 8px;border-bottom:1px solid rgba(39,39,42,0.5);font-family:monospace;font-size:12px;color:var(--text2);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+r.url+'</td><td style="padding:6px 8px;border-bottom:1px solid rgba(39,39,42,0.5);"><span style="display:inline-flex;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;'+sc+'">'+r.status+'</span></td><td style="padding:6px 8px;border-bottom:1px solid rgba(39,39,42,0.5);text-align:right;font-family:monospace;font-size:12px;color:var(--text2);">'+r.duration+'ms</td></tr>';
    }).join('')+'</tbody></table>';
  }
  const active=alerts.filter(a=>!a.resolved);
  const ap=document.getElementById('alerts-panel');
  if(active.length){
    ap.innerHTML=active.map(a=>{
      const sc=a.severity==='critical'?'color:#ef4444;background:rgba(239,68,68,0.15);':a.severity==='warning'?'color:#f59e0b;background:rgba(245,158,11,0.15);':'color:#6366f1;background:rgba(99,102,241,0.15);';
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(39,39,42,0.5);"><div style="display:flex;align-items:center;gap:12px;"><span style="display:inline-flex;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;'+sc+'">'+a.severity+'</span><span style="font-size:14px;color:var(--text2);">'+a.name+'</span></div><span style="font-size:12px;color:var(--muted);">'+a.condition+' '+a.operator+' '+a.threshold+'</span></div>';
    }).join('');
  } else { ap.innerHTML='<div style="color:#10b981;font-size:14px;padding:16px;text-align:center;">All systems operational</div>'; }
});
<\/script>`
}

function genericPageContent(_pageName: string, pageTitle: string, apiEndpoint: string): string {
  return `<div class="animate-fade-in">
  <div style="margin-bottom:24px;"><h1 style="font-size:18px;font-weight:600;">${pageTitle}</h1><p style="font-size:13px;color:var(--muted);margin-top:2px;">Loading data from API...</p></div>
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;">
    <div id="page-content" style="text-align:center;padding:24px;color:var(--muted);font-size:13px;">Loading...</div>
  </div>
</div>
<script>
document.addEventListener('DOMContentLoaded', async()=>{
  const res = await fetch('${apiEndpoint}');
  const data = await res.json();
  document.getElementById('page-content').innerHTML = '<pre style="text-align:left;font-size:12px;color:var(--text2);font-family:monospace;max-height:500px;overflow:auto;">' + JSON.stringify(data, null, 2) + '</pre>';
});
<\/script>`
}

function getPageContent(handler: string, params: Record<string, string>): { title: string, content: string } {
  switch (handler) {
    case 'dashboard':
      return { title: 'Overview', content: dashboardPageContent() }
    case 'requests':
      return { title: 'Requests', content: requestsPageContent() }
    case 'request-details':
      return { title: 'Request Details', content: requestDetailsPageContent(params.id) }
    case 'endpoints':
      return { title: 'Endpoints', content: endpointsPageContent() }
    case 'endpoint-details':
      return { title: 'Endpoint Details', content: endpointDetailsPageContent(params.path) }
    case 'metrics':
      return { title: 'Metrics', content: metricsPageContent() }
    case 'monitoring':
      return { title: 'Monitoring', content: monitoringPageContent() }
    case 'timeline':
      return { title: 'Timeline', content: timelinePageContent() }
    case 'network':
      return { title: 'Network', content: networkPageContent() }
    case 'compare':
      return { title: 'Compare', content: comparePageContent() }
    case 'export':
      return { title: 'Export', content: exportPageContent() }
    case 'settings':
      return { title: 'Settings', content: settingsPageContent() }
    default:
      return { title: 'Not Found', content: '<div style="text-align:center;padding:48px;color:var(--muted);">Page not found.</div>' }
  }
}

// --- Specific page content functions ---

function requestsPageContent(): string {
  return `<div class="animate-fade-in">
  <div style="margin-bottom:24px;"><h1 style="font-size:18px;font-weight:600;">Request History</h1><p style="font-size:13px;color:var(--muted);margin-top:2px;">Browse HTTP request history</p></div>
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
    <input type="text" id="search-input" placeholder="Search by URL, host, or status..." style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px 12px;font-size:14px;color:var(--text2);width:280px;outline:none;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
    <div style="display:flex;gap:4px;" id="method-filters">
      <button class="mf" data-method="ALL" style="padding:6px 12px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid rgba(99,102,241,0.3);background:rgba(99,102,241,0.15);color:#818cf8;">ALL</button>
      <button class="mf" data-method="GET" style="padding:6px 12px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--bg3);color:var(--text2);">GET</button>
      <button class="mf" data-method="POST" style="padding:6px 12px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--bg3);color:var(--text2);">POST</button>
      <button class="mf" data-method="PUT" style="padding:6px 12px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--bg3);color:var(--text2);">PUT</button>
      <button class="mf" data-method="PATCH" style="padding:6px 12px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--bg3);color:var(--text2);">PATCH</button>
      <button class="mf" data-method="DELETE" style="padding:6px 12px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--bg3);color:var(--text2);">DELETE</button>
    </div>
    <select id="status-filter" style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 12px;font-size:12px;color:var(--text2);cursor:pointer;">
      <option value="ALL">All Status</option><option value="2xx">2xx</option><option value="3xx">3xx</option><option value="4xx">4xx</option><option value="5xx">5xx</option>
    </select>
  </div>
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div id="req-table" style="text-align:center;padding:24px;color:var(--muted);font-size:13px;">Loading...</div></div>
</div>
<script>
document.addEventListener('DOMContentLoaded',async()=>{
  const res=await fetch('/api/requests');const all=await res.json();let am='ALL',as='ALL',q='';
  function mc(m){return m==='GET'?'color:#10b981;background:rgba(16,185,129,0.15);':m==='POST'?'color:#6366f1;background:rgba(99,102,241,0.15);':m==='DELETE'?'color:#ef4444;background:rgba(239,68,68,0.15);':'color:#f59e0b;background:rgba(245,158,11,0.15);';}
  function sc(s){return s<300?'color:#10b981;background:rgba(16,185,129,0.15);':s<400?'color:#6366f1;background:rgba(99,102,241,0.15);':s<500?'color:#f59e0b;background:rgba(245,158,11,0.15);':'color:#ef4444;background:rgba(239,68,68,0.15);';}
  function render(){
    let f=all;
    if(am!=='ALL')f=f.filter(r=>r.method===am);
    if(as!=='ALL')f=f.filter(r=>{if(as==='2xx')return r.status>=200&&r.status<300;if(as==='3xx')return r.status>=300&&r.status<400;if(as==='4xx')return r.status>=400&&r.status<500;if(as==='5xx')return r.status>=500;return true;});
    if(q){const ql=q.toLowerCase();f=f.filter(r=>r.url.toLowerCase().includes(ql)||r.host.toLowerCase().includes(ql)||String(r.status).includes(ql));}
    const el=document.getElementById('req-table');
    if(!f.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--muted);font-size:13px;">No matching requests.</div>';return;}
    el.innerHTML='<table style="width:100%;border-collapse:collapse;"><thead><tr>'+['Method','URL','Status','Duration','Size','Time'].map(h=>'<th style="padding:8px;text-align:'+(h==='Duration'||h==='Size'?'right':'left')+';font-size:11px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid var(--border);">'+h+'</th>').join('')+'</tr></thead><tbody>'+f.map(r=>'<tr style="cursor:pointer;" onclick="window.location=\\'/requests/'+r.id+'\\'"><td style="padding:8px;border-bottom:1px solid rgba(39,39,42,0.5);"><span style="display:inline-flex;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;'+mc(r.method)+'">'+r.method+'</span></td><td style="padding:8px;border-bottom:1px solid rgba(39,39,42,0.5);font-family:monospace;font-size:12px;color:var(--text2);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+r.url+'</td><td style="padding:8px;border-bottom:1px solid rgba(39,39,42,0.5);"><span style="display:inline-flex;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;'+sc(r.status)+'">'+r.status+'</span></td><td style="padding:8px;border-bottom:1px solid rgba(39,39,42,0.5);text-align:right;font-family:monospace;font-size:12px;color:var(--text2);">'+r.duration+'ms</td><td style="padding:8px;border-bottom:1px solid rgba(39,39,42,0.5);text-align:right;font-size:12px;color:var(--text2);">'+r.responseSize+'B</td><td style="padding:8px;border-bottom:1px solid rgba(39,39,42,0.5);font-size:12px;color:var(--muted);">'+r.timestamp+'</td></tr>').join('')+'</tbody></table>';
  }
  document.querySelectorAll('.mf').forEach(b=>b.addEventListener('click',()=>{am=b.dataset.method;document.querySelectorAll('.mf').forEach(x=>{x.style.background=x.dataset.method===am?'rgba(99,102,241,0.15)':'var(--bg3)';x.style.color=x.dataset.method===am?'#818cf8':'var(--text2)';x.style.borderColor=x.dataset.method===am?'rgba(99,102,241,0.3)':'var(--border)';});render();}));
  document.getElementById('status-filter').addEventListener('change',e=>{as=e.target.value;render();});
  document.getElementById('search-input').addEventListener('input',e=>{q=e.target.value;render();});
  render();
});
<\/script>`
}

function requestDetailsPageContent(id: string): string {
  return `<div class="animate-fade-in">
  <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--muted);margin-bottom:16px;">
    <a href="/requests" style="color:var(--text2);">Requests</a><span style="color:#52525b;">/</span><span style="color:var(--text);" id="bc-id">${id}</span>
  </div>
  <div id="req-header" style="margin-bottom:24px;font-size:13px;color:var(--muted);">Loading...</div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;" id="detail-panels"></div>
  <div style="margin-top:24px;display:flex;align-items:center;gap:16px;" id="meta-section"></div>
</div>
<script>
document.addEventListener('DOMContentLoaded',async()=>{
  const res=await fetch('/api/requests/${id}');
  if(!res.ok){document.getElementById('req-header').innerHTML='<span style="color:var(--error);">Request not found.</span>';return;}
  const r=await res.json();
  const mc=r.method==='GET'?'color:#10b981;background:rgba(16,185,129,0.15);':r.method==='POST'?'color:#6366f1;background:rgba(99,102,241,0.15);':r.method==='DELETE'?'color:#ef4444;background:rgba(239,68,68,0.15);':'color:#f59e0b;background:rgba(245,158,11,0.15);';
  const sc=r.status<300?'color:#10b981;background:rgba(16,185,129,0.15);':r.status<400?'color:#6366f1;background:rgba(99,102,241,0.15);':r.status<500?'color:#f59e0b;background:rgba(245,158,11,0.15);':'color:#ef4444;background:rgba(239,68,68,0.15);';
  document.getElementById('req-header').innerHTML='<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;"><span style="display:inline-flex;padding:4px 10px;border-radius:6px;font-size:14px;font-weight:700;text-transform:uppercase;'+mc+'">'+r.method+'</span><span style="font-family:monospace;font-size:14px;color:var(--text2);word-break:break-all;">'+r.url+'</span><span style="display:inline-flex;padding:4px 10px;border-radius:9999px;font-size:14px;font-weight:500;'+sc+'">'+r.status+' '+r.statusText+'</span><span style="font-size:14px;color:var(--muted);">'+r.duration+'ms</span></div>';
  function ht(h){if(!h||!Object.keys(h).length)return '<div style="font-size:13px;color:var(--muted);">No headers</div>';return '<table style="width:100%;border-collapse:collapse;">'+Object.entries(h).map(([k,v])=>'<tr><td style="padding:4px 8px;font-family:monospace;font-size:12px;color:var(--accent);border-bottom:1px solid rgba(39,39,42,0.5);white-space:nowrap;">'+k+'</td><td style="padding:4px 8px;font-family:monospace;font-size:12px;color:var(--text2);border-bottom:1px solid rgba(39,39,42,0.5);word-break:break-all;">'+v+'</td></tr>').join('')+'</table>';}
  function cb(b){if(!b)return '<div style="font-size:13px;color:var(--muted);">No body</div>';try{b=JSON.stringify(JSON.parse(b),null,2);}catch{}return '<pre style="background:var(--bg);border-radius:6px;padding:12px;font-size:12px;font-family:monospace;color:var(--text2);overflow-x:auto;max-height:256px;overflow-y:auto;">'+b+'</pre>';}
  document.getElementById('detail-panels').innerHTML='<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="font-size:14px;font-weight:600;margin-bottom:16px;">Request</div><div style="font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Headers</div>'+ht(r.requestHeaders)+'<div style="font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:16px;margin-bottom:8px;">Body</div>'+cb(r.requestBody)+'</div><div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="font-size:14px;font-weight:600;margin-bottom:16px;">Response</div><div style="font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Headers</div>'+ht(r.responseHeaders)+'<div style="font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-top:16px;margin-bottom:8px;">Body</div>'+cb(r.responseBody)+'</div>';
  const tags=(r.tags||[]).map(t=>'<span style="display:inline-flex;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;background:rgba(113,113,122,0.15);color:var(--muted);">'+t+'</span>').join('');
  const retry=r.retryCount>0?'<span style="font-size:12px;color:var(--warning);">'+r.retryCount+' retries</span>':'';
  document.getElementById('meta-section').innerHTML='<div style="display:flex;gap:8px;">'+tags+'</div>'+retry+'<span style="font-size:12px;color:var(--muted);">'+r.timestamp+'</span>';
});
<\/script>`
}

function endpointsPageContent(): string {
  return `<div class="animate-fade-in">
  <div style="margin-bottom:24px;"><h1 style="font-size:18px;font-weight:600;">Endpoints</h1><p style="font-size:13px;color:var(--muted);margin-top:2px;">Aggregated endpoint performance</p></div>
  <input type="text" id="ep-search" placeholder="Search endpoints..." style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px 12px;font-size:14px;color:var(--text2);width:280px;outline:none;margin-bottom:16px;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div id="ep-table" style="text-align:center;padding:24px;color:var(--muted);font-size:13px;">Loading...</div></div>
</div>
<script>
document.addEventListener('DOMContentLoaded',async()=>{
  const res=await fetch('/api/endpoints');const eps=await res.json();let q='';
  function mc(m){return m==='GET'?'color:#10b981;background:rgba(16,185,129,0.15);':m==='POST'?'color:#6366f1;background:rgba(99,102,241,0.15);':m==='DELETE'?'color:#ef4444;background:rgba(239,68,68,0.15);':'color:#f59e0b;background:rgba(245,158,11,0.15);';}
  function render(){
    const f=q?(()=>{const ql=q.toLowerCase();return eps.filter(e=>e.url.toLowerCase().includes(ql)||e.method.toLowerCase().includes(ql));})():eps;
    const el=document.getElementById('ep-table');
    if(!f.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--muted);">No endpoints found.</div>';return;}
    el.innerHTML='<table style="width:100%;border-collapse:collapse;"><thead><tr>'+['Method','Path','Requests','Avg Duration','Error Rate'].map(h=>'<th style="padding:8px;text-align:'+(h==='Requests'||h==='Avg Duration'||h==='Error Rate'?'right':'left')+';font-size:11px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid var(--border);">'+h+'</th>').join('')+'</tr></thead><tbody>'+f.map(e=>{
      const ec=e.errorRate>20?'color:#ef4444;':e.errorRate>5?'color:#f59e0b;':'color:#10b981;';
      return '<tr style="cursor:pointer;" onclick="window.location=\\'/endpoints/'+encodeURIComponent(e.method+' '+e.url)+'\\'"><td style="padding:8px;border-bottom:1px solid rgba(39,39,42,0.5);"><span style="display:inline-flex;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;'+mc(e.method)+'">'+e.method+'</span></td><td style="padding:8px;border-bottom:1px solid rgba(39,39,42,0.5);font-family:monospace;font-size:12px;color:var(--text2);">'+e.url+'</td><td style="padding:8px;border-bottom:1px solid rgba(39,39,42,0.5);text-align:right;font-size:14px;color:var(--text2);">'+e.count+'</td><td style="padding:8px;border-bottom:1px solid rgba(39,39,42,0.5);text-align:right;font-family:monospace;font-size:12px;color:var(--text2);">'+e.avgDuration+'ms</td><td style="padding:8px;border-bottom:1px solid rgba(39,39,42,0.5);text-align:right;font-size:12px;'+ec+'">'+e.errorRate+'%</td></tr>';
    }).join('')+'</tbody></table>';
  }
  document.getElementById('ep-search').addEventListener('input',e=>{q=e.target.value;render();});
  render();
});
<\/script>`
}

function endpointDetailsPageContent(encodedPath: string): string {
  return `<div class="animate-fade-in">
  <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--muted);margin-bottom:16px;">
    <a href="/endpoints" style="color:var(--text2);">Endpoints</a><span style="color:#52525b;">/</span><span style="color:var(--text);" id="bc-ep">Loading...</span>
  </div>
  <div id="ep-header" style="margin-bottom:24px;font-size:13px;color:var(--muted);">Loading...</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;" id="ep-stats"></div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;margin-bottom:24px;">
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="font-size:14px;font-weight:600;margin-bottom:16px;">Response Time Trend</div><div class="chart-container"><canvas id="epTrend"></canvas></div></div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="font-size:14px;font-weight:600;margin-bottom:16px;">Status Distribution</div><div class="chart-container"><canvas id="epStatus"></canvas></div></div>
  </div>
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="font-size:14px;font-weight:600;margin-bottom:16px;">Recent Requests</div><div id="ep-reqs" style="text-align:center;padding:16px;color:var(--muted);font-size:13px;">Loading...</div></div>
</div>
<script>
document.addEventListener('DOMContentLoaded',async()=>{
  const res=await fetch('/api/endpoints/${encodedPath}');
  if(!res.ok){document.getElementById('ep-header').innerHTML='<span style="color:var(--error);">Endpoint not found.</span>';return;}
  const ep=await res.json();
  document.getElementById('bc-ep').textContent=ep.method+' '+ep.url;
  const mc=ep.method==='GET'?'color:#10b981;background:rgba(16,185,129,0.15);':ep.method==='POST'?'color:#6366f1;background:rgba(99,102,241,0.15);':'color:#f59e0b;background:rgba(245,158,11,0.15);';
  document.getElementById('ep-header').innerHTML='<div style="display:flex;align-items:center;gap:12px;"><span style="display:inline-flex;padding:4px 10px;border-radius:6px;font-size:14px;font-weight:700;'+mc+'">'+ep.method+'</span><span style="font-family:monospace;font-size:16px;color:var(--text2);">'+ep.url+'</span></div><p style="font-size:12px;color:var(--muted);margin-top:4px;">'+ep.count+' requests</p>';
  document.getElementById('ep-stats').innerHTML=['Avg|'+ep.avgDuration+'|ms|var(--accent)','P50|'+ep.p50Duration+'|ms|var(--accent)','P95|'+ep.p95Duration+'|ms|var(--warning)','Error Rate|'+ep.errorRate+'|%|'+(ep.errorRate>10?'var(--error)':'var(--success)')].map(s=>{const[l,v,u,c]=s.split('|');return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;"><div style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;">'+l+'</div><div style="font-size:28px;font-weight:700;color:'+c+';margin-top:4px;">'+v+' <span style="font-size:12px;color:var(--muted);font-weight:400;">'+u+'</span></div></div>';}).join('');
  if(typeof Chart!=='undefined'){
    new Chart(document.getElementById('epTrend'),{type:'line',data:{labels:ep.responseTrend.map((_,i)=>'#'+(i+1)),datasets:[{label:'Duration',data:ep.responseTrend.map(p=>p.value),borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,0.1)',fill:true,tension:0.3,pointRadius:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#a1a1aa',font:{size:11}}}},scales:{x:{ticks:{color:'#71717a',font:{size:10}},grid:{color:'#27272a'}},y:{ticks:{color:'#71717a',font:{size:10}},grid:{color:'#27272a'}}}}});
    const sd=ep.statusDistribution;
    new Chart(document.getElementById('epStatus'),{type:'doughnut',data:{labels:['2xx','3xx','4xx','5xx'],datasets:[{data:[sd['2xx'],sd['3xx'],sd['4xx'],sd['5xx']],backgroundColor:['#10b981','#6366f1','#f59e0b','#ef4444'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom',labels:{color:'#a1a1aa',font:{size:11},padding:16}}}}});
  }
  const reqs=ep.recentRequests||[];const el=document.getElementById('ep-reqs');
  if(reqs.length){
    el.innerHTML='<table style="width:100%;border-collapse:collapse;"><thead><tr>'+['Status','Duration','Size','Time'].map(h=>'<th style="padding:6px 8px;text-align:'+(h==='Duration'||h==='Size'?'right':'left')+';font-size:11px;font-weight:500;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--border);">'+h+'</th>').join('')+'</tr></thead><tbody>'+reqs.map(r=>{
      const sc=r.status<300?'color:#10b981;background:rgba(16,185,129,0.15);':r.status<400?'color:#6366f1;background:rgba(99,102,241,0.15);':r.status<500?'color:#f59e0b;background:rgba(245,158,11,0.15);':'color:#ef4444;background:rgba(239,68,68,0.15);';
      return '<tr style="cursor:pointer;" onclick="window.location=\\'/requests/'+r.id+'\\'"><td style="padding:6px 8px;border-bottom:1px solid rgba(39,39,42,0.5);"><span style="display:inline-flex;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;'+sc+'">'+r.status+'</span></td><td style="padding:6px 8px;border-bottom:1px solid rgba(39,39,42,0.5);text-align:right;font-family:monospace;font-size:12px;color:var(--text2);">'+r.duration+'ms</td><td style="padding:6px 8px;border-bottom:1px solid rgba(39,39,42,0.5);text-align:right;font-size:12px;color:var(--text2);">'+r.responseSize+'B</td><td style="padding:6px 8px;border-bottom:1px solid rgba(39,39,42,0.5);font-size:12px;color:var(--muted);">'+r.timestamp+'</td></tr>';
    }).join('')+'</tbody></table>';
  }
});
<\/script>`
}

function metricsPageContent(): string {
  return `<div class="animate-fade-in">
  <div style="margin-bottom:24px;"><h1 style="font-size:18px;font-weight:600;">Performance Metrics</h1><p style="font-size:13px;color:var(--muted);margin-top:2px;">Response times and status distribution</p></div>
  <div style="font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Response Times</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;" id="rt-cards"></div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;margin-bottom:24px;">
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="font-size:14px;font-weight:600;margin-bottom:16px;">Response Time Trend</div><div class="chart-container"><canvas id="rtChart"></canvas></div></div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="font-size:14px;font-weight:600;margin-bottom:16px;">Status Distribution</div><div class="chart-container"><canvas id="sdChart"></canvas></div></div>
  </div>
  <div style="font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Status Codes</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;" id="sd-cards"></div>
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="font-size:14px;font-weight:600;margin-bottom:16px;">Top Endpoints</div><div class="chart-container"><canvas id="epBar"></canvas></div></div>
</div>
<script>
document.addEventListener('DOMContentLoaded',async()=>{
  const[sr,rr,er]=await Promise.all([fetch('/api/stats'),fetch('/api/requests'),fetch('/api/endpoints')]);
  const s=await sr.json(),reqs=await rr.json(),eps=await er.json();
  const d=reqs.map(r=>r.duration).sort((a,b)=>a-b);
  const pct=p=>d[Math.ceil((p/100)*d.length)-1]||0;
  const avg=Math.round(d.reduce((a,b)=>a+b,0)/d.length);
  document.getElementById('rt-cards').innerHTML=['Average|'+avg+'|var(--accent)','P50|'+pct(50)+'|var(--accent)','P95|'+pct(95)+'|var(--warning)','P99|'+pct(99)+'|var(--error)'].map(x=>{const[l,v,c]=x.split('|');return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;"><div style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;">'+l+'</div><div style="font-size:28px;font-weight:700;color:'+c+';margin-top:4px;">'+v+'</div><div style="font-size:12px;color:var(--muted);">ms</div></div>';}).join('');
  const sd=s.statusDistribution;
  document.getElementById('sd-cards').innerHTML=[['2xx',sd['2xx'],'var(--success)'],['3xx',sd['3xx'],'var(--accent)'],['4xx',sd['4xx'],'var(--warning)'],['5xx',sd['5xx'],'var(--error)']].map(([l,v,c])=>'<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;position:relative;overflow:hidden;"><div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:'+c+';"></div><div style="font-size:13px;font-weight:600;color:var(--muted);">'+l+'</div><div style="font-size:28px;font-weight:700;color:'+c+';margin-top:4px;">'+v+'</div></div>').join('');
  if(typeof Chart!=='undefined'){
    new Chart(document.getElementById('rtChart'),{type:'line',data:{labels:s.responseTimeHistory.map((_,i)=>(30-i)+'m'),datasets:[{label:'Avg Response Time',data:s.responseTimeHistory.map(p=>p.value),borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,0.1)',fill:true,tension:0.3,pointRadius:2,pointBackgroundColor:'#6366f1'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#a1a1aa',font:{size:11}}}},scales:{x:{ticks:{color:'#71717a',font:{size:10}},grid:{color:'#27272a'}},y:{ticks:{color:'#71717a',font:{size:10},callback:v=>v+'ms'},grid:{color:'#27272a'}}}}});
    new Chart(document.getElementById('sdChart'),{type:'doughnut',data:{labels:['2xx','3xx','4xx','5xx'],datasets:[{data:[sd['2xx'],sd['3xx'],sd['4xx'],sd['5xx']],backgroundColor:['#10b981','#6366f1','#f59e0b','#ef4444'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom',labels:{color:'#a1a1aa',font:{size:11},padding:16}}}}});
    const top=eps.slice(0,8);
    new Chart(document.getElementById('epBar'),{type:'bar',data:{labels:top.map(e=>e.method+' '+e.url),datasets:[{label:'Requests',data:top.map(e=>e.count),backgroundColor:'#6366f1',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#71717a',font:{size:10}},grid:{color:'#27272a'}},y:{ticks:{color:'#a1a1aa',font:{size:10,family:'monospace'}},grid:{display:false}}}}});
  }
});
<\/script>`
}

function monitoringPageContent(): string {
  return `<div class="animate-fade-in">
  <div style="margin-bottom:24px;"><h1 style="font-size:18px;font-weight:600;">Monitoring</h1><p style="font-size:13px;color:var(--muted);margin-top:2px;">Health, alerts, and event log</p></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;text-align:center;"><div style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;margin-bottom:8px;">Health Score</div><div id="health" style="font-size:36px;font-weight:700;">—</div></div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;text-align:center;"><div style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;margin-bottom:8px;">Uptime</div><div style="font-size:36px;font-weight:700;color:var(--success);">99.7%</div></div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;text-align:center;"><div style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;margin-bottom:8px;">Active Alerts</div><div id="ac" style="font-size:36px;font-weight:700;color:var(--error);">—</div></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;">
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="font-size:14px;font-weight:600;margin-bottom:16px;">Alerts</div><div id="al"></div></div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="display:flex;justify-content:space-between;margin-bottom:16px;"><span style="font-size:14px;font-weight:600;">Event Log</span><span style="font-size:12px;color:var(--muted);" class="animate-pulse">Live</span></div><div id="el" style="max-height:400px;overflow-y:auto;"></div></div>
  </div>
</div>
<script>
document.addEventListener('DOMContentLoaded',async()=>{
  const[ar,er]=await Promise.all([fetch('/api/alerts'),fetch('/api/events')]);
  const alerts=await ar.json(),events=await er.json();
  const active=alerts.filter(a=>!a.resolved);
  const score=Math.max(0,100-active.length*15);
  const he=document.getElementById('health');he.textContent=score;he.style.color=score>=80?'var(--success)':score>=50?'var(--warning)':'var(--error)';
  document.getElementById('ac').textContent=active.length;
  const al=document.getElementById('al');
  al.innerHTML=alerts.map(a=>{const sc=a.severity==='critical'?'color:#ef4444;background:rgba(239,68,68,0.15);':a.severity==='warning'?'color:#f59e0b;background:rgba(245,158,11,0.15);':'color:#6366f1;background:rgba(99,102,241,0.15);';const st=a.resolved?'<span style="font-size:12px;color:var(--success);">Resolved</span>':'<span style="font-size:12px;color:var(--error);">Active</span>';return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(39,39,42,0.5);"><div style="display:flex;align-items:center;gap:12px;"><span style="display:inline-flex;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;'+sc+'">'+a.severity+'</span><div><div style="font-size:14px;color:var(--text2);">'+a.name+'</div><div style="font-size:12px;color:var(--muted);">'+a.condition+' '+a.operator+' '+a.threshold+'</div></div></div>'+st+'</div>';}).join('');
  const tc={request:'color:#6366f1;',error:'color:#ef4444;',alert:'color:#f59e0b;',system:'color:var(--text2);',config:'color:#10b981;'};
  document.getElementById('el').innerHTML=events.reverse().map(e=>'<div style="display:flex;align-items:flex-start;gap:12px;padding:8px 0;border-bottom:1px solid rgba(39,39,42,0.3);"><span style="font-size:11px;font-weight:500;text-transform:uppercase;width:56px;flex-shrink:0;'+(tc[e.type]||'')+'">'+e.type+'</span><span style="font-size:12px;color:var(--text2);flex:1;">'+e.message+'</span><span style="font-size:11px;color:#52525b;flex-shrink:0;">'+new Date(e.timestamp).toLocaleTimeString()+'</span></div>').join('');
});
<\/script>`
}

function timelinePageContent(): string {
  return `<div class="animate-fade-in">
  <div style="margin-bottom:24px;"><h1 style="font-size:18px;font-weight:600;">Timeline</h1><p style="font-size:13px;color:var(--muted);margin-top:2px;">Request timeline swimlane visualization</p></div>
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div class="d3-container" id="timeline-viz" style="min-height:500px;"></div></div>
</div>
<script>
document.addEventListener('DOMContentLoaded',async()=>{
  const res=await fetch('/api/requests');const requests=await res.json();
  if(typeof d3==='undefined'){document.getElementById('timeline-viz').innerHTML='<div style="text-align:center;padding:48px;color:var(--muted);">D3 is loading...</div>';return;}
  const c=document.getElementById('timeline-viz'),w=c.clientWidth,rH=28,m={top:30,right:20,bottom:30,left:200};
  const urls=[...new Set(requests.map(r=>r.method+' '+r.path))].slice(0,20);
  const h=urls.length*rH+m.top+m.bottom;
  const svg=d3.select('#timeline-viz').append('svg').attr('width',w).attr('height',h);
  const times=requests.map(r=>new Date(r.timestamp));
  const x=d3.scaleTime().domain([d3.min(times),d3.max(times)]).range([m.left,w-m.right]);
  const y=d3.scaleBand().domain(urls).range([m.top,h-m.bottom]).padding(0.3);
  svg.append('g').attr('transform','translate(0,'+(h-m.bottom)+')').call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat('%H:%M'))).selectAll('text').style('fill','#71717a').style('font-size','10px');
  svg.append('g').attr('transform','translate('+m.left+',0)').call(d3.axisLeft(y)).selectAll('text').style('fill','#a1a1aa').style('font-size','10px').style('font-family','monospace');
  svg.selectAll('.domain,.tick line').style('stroke','#27272a');
  function sc(s){return s<300?'#10b981':s<400?'#6366f1':s<500?'#f59e0b':'#ef4444';}
  const tt=d3.select('body').append('div').style('position','absolute').style('display','none').style('background','#1e1e26').style('border','1px solid #27272a').style('border-radius','6px').style('padding','8px 12px').style('font-size','11px').style('color','#f5f5f7').style('pointer-events','none').style('z-index','100');
  svg.selectAll('rect.bar').data(requests.filter(r=>urls.includes(r.method+' '+r.path))).enter().append('rect').attr('x',d=>x(new Date(d.timestamp))).attr('y',d=>y(d.method+' '+d.path)).attr('width',d=>Math.max(4,d.duration/50)).attr('height',y.bandwidth()).attr('rx',2).attr('fill',d=>sc(d.status)).attr('opacity',0.8).on('mouseover',(ev,d)=>{tt.style('display','block').html('<strong>'+d.method+' '+d.path+'</strong><br/>Status: '+d.status+' · '+d.duration+'ms');}).on('mousemove',ev=>{tt.style('left',(ev.pageX+10)+'px').style('top',(ev.pageY-10)+'px');}).on('mouseout',()=>tt.style('display','none'));
});
<\/script>`
}

function networkPageContent(): string {
  return `<div class="animate-fade-in">
  <div style="margin-bottom:24px;"><h1 style="font-size:18px;font-weight:600;">Network Graph</h1><p style="font-size:13px;color:var(--muted);margin-top:2px;">Force-directed graph of host connections</p></div>
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div class="d3-container" id="network-viz" style="min-height:500px;"></div></div>
</div>
<script>
document.addEventListener('DOMContentLoaded',async()=>{
  const res=await fetch('/api/requests');const requests=await res.json();
  if(typeof d3==='undefined'){document.getElementById('network-viz').innerHTML='<div style="text-align:center;padding:48px;color:var(--muted);">D3 is loading...</div>';return;}
  const c=document.getElementById('network-viz'),w=c.clientWidth,h=500;
  const hc={},lm={};
  requests.forEach(r=>{hc[r.host]=(hc[r.host]||0)+1;const k='httx->'+r.host;lm[k]=(lm[k]||0)+1;});
  const nodes=[{id:'httx',group:'client',count:requests.length},...Object.entries(hc).map(([host,count])=>({id:host,group:'server',count}))];
  const links=Object.entries(lm).map(([k,count])=>{const[s,t]=k.split('->');return{source:s,target:t,count};});
  const svg=d3.select('#network-viz').append('svg').attr('width',w).attr('height',h);
  const sim=d3.forceSimulation(nodes).force('link',d3.forceLink(links).id(d=>d.id).distance(120)).force('charge',d3.forceManyBody().strength(-300)).force('center',d3.forceCenter(w/2,h/2));
  const tt=d3.select('body').append('div').style('position','absolute').style('display','none').style('background','#1e1e26').style('border','1px solid #27272a').style('border-radius','6px').style('padding','8px 12px').style('font-size','11px').style('color','#f5f5f7').style('pointer-events','none').style('z-index','100');
  const link=svg.append('g').selectAll('line').data(links).enter().append('line').style('stroke','#27272a').style('stroke-width',d=>Math.max(1,Math.sqrt(d.count))).style('opacity',0.6);
  const ll=svg.append('g').selectAll('text').data(links).enter().append('text').text(d=>d.count).style('fill','#71717a').style('font-size','9px').style('text-anchor','middle');
  const node=svg.append('g').selectAll('circle').data(nodes).enter().append('circle').attr('r',d=>d.group==='client'?16:8+Math.sqrt(d.count)*2).style('fill',d=>d.group==='client'?'#6366f1':'#10b981').style('stroke','#0a0a0f').style('stroke-width',2).style('cursor','pointer').on('mouseover',(ev,d)=>{tt.style('display','block').html('<strong>'+d.id+'</strong><br/>'+d.count+' requests');}).on('mousemove',ev=>{tt.style('left',(ev.pageX+10)+'px').style('top',(ev.pageY-10)+'px');}).on('mouseout',()=>tt.style('display','none')).call(d3.drag().on('start',(ev,d)=>{if(!ev.active)sim.alphaTarget(0.3).restart();d.fx=d.x;d.fy=d.y;}).on('drag',(ev,d)=>{d.fx=ev.x;d.fy=ev.y;}).on('end',(ev,d)=>{if(!ev.active)sim.alphaTarget(0);d.fx=null;d.fy=null;}));
  const label=svg.append('g').selectAll('text').data(nodes).enter().append('text').text(d=>d.id).style('fill','#a1a1aa').style('font-size','10px').style('text-anchor','middle').attr('dy',d=>(d.group==='client'?16:8+Math.sqrt(d.count)*2)+14);
  sim.on('tick',()=>{link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);ll.attr('x',d=>(d.source.x+d.target.x)/2).attr('y',d=>(d.source.y+d.target.y)/2);node.attr('cx',d=>d.x).attr('cy',d=>d.y);label.attr('x',d=>d.x).attr('y',d=>d.y);});
});
<\/script>`
}

function comparePageContent(): string {
  return `<div class="animate-fade-in">
  <div style="margin-bottom:24px;"><h1 style="font-size:18px;font-weight:600;">Compare Endpoints</h1><p style="font-size:13px;color:var(--muted);margin-top:2px;">Side-by-side endpoint comparison</p></div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;margin-bottom:24px;">
    <div><label style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:8px;">Endpoint A</label><select id="sel-a" style="width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px 12px;font-size:14px;color:var(--text2);cursor:pointer;"></select></div>
    <div><label style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;display:block;margin-bottom:8px;">Endpoint B</label><select id="sel-b" style="width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:8px 12px;font-size:14px;color:var(--text2);cursor:pointer;"></select></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px;" id="cmp-cards"></div>
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;"><div style="font-size:14px;font-weight:600;margin-bottom:16px;">Status Distribution</div><div class="chart-container"><canvas id="cmpChart"></canvas></div></div>
</div>
<script>
document.addEventListener('DOMContentLoaded',async()=>{
  const res=await fetch('/api/endpoints');const eps=await res.json();
  const sa=document.getElementById('sel-a'),sb=document.getElementById('sel-b');
  eps.forEach((e,i)=>{const o=e.method+' '+e.url;sa.add(new Option(o,o,i===0,i===0));sb.add(new Option(o,o,i===1,i===1));});
  let chart=null;
  async function compare(){
    const[ra,rb]=await Promise.all([fetch('/api/endpoints/'+encodeURIComponent(sa.value)),fetch('/api/endpoints/'+encodeURIComponent(sb.value))]);
    const a=await ra.json(),b=await rb.json();
    function sc(l,va,vb,u){const w=va<=vb?'A':'B';return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;"><div style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;margin-bottom:12px;">'+l+'</div><div style="display:flex;justify-content:space-between;align-items:flex-end;"><div style="text-align:center;"><div style="font-size:12px;color:var(--muted);margin-bottom:4px;">A</div><div style="font-size:20px;font-weight:700;color:'+(w==='A'?'var(--success)':'var(--text2)')+';">'+va+' <span style="font-size:12px;color:var(--muted);font-weight:400;">'+u+'</span></div></div><div style="font-size:12px;color:#52525b;">vs</div><div style="text-align:center;"><div style="font-size:12px;color:var(--muted);margin-bottom:4px;">B</div><div style="font-size:20px;font-weight:700;color:'+(w==='B'?'var(--success)':'var(--text2)')+';">'+vb+' <span style="font-size:12px;color:var(--muted);font-weight:400;">'+u+'</span></div></div></div></div>';}
    document.getElementById('cmp-cards').innerHTML=sc('Avg Duration',a.avgDuration,b.avgDuration,'ms')+sc('P95 Duration',a.p95Duration,b.p95Duration,'ms')+sc('Error Rate',a.errorRate,b.errorRate,'%')+sc('Total Requests',a.count,b.count,'');
    if(typeof Chart!=='undefined'){
      if(chart)chart.destroy();
      chart=new Chart(document.getElementById('cmpChart'),{type:'bar',data:{labels:['2xx','3xx','4xx','5xx'],datasets:[{label:'A',data:[a.statusDistribution['2xx'],a.statusDistribution['3xx'],a.statusDistribution['4xx'],a.statusDistribution['5xx']],backgroundColor:'#6366f1',borderRadius:4},{label:'B',data:[b.statusDistribution['2xx'],b.statusDistribution['3xx'],b.statusDistribution['4xx'],b.statusDistribution['5xx']],backgroundColor:'#818cf8',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#a1a1aa',font:{size:11}}}},scales:{x:{ticks:{color:'#71717a'},grid:{color:'#27272a'}},y:{ticks:{color:'#71717a'},grid:{color:'#27272a'}}}}});
    }
  }
  sa.addEventListener('change',compare);sb.addEventListener('change',compare);compare();
});
<\/script>`
}

function exportPageContent(): string {
  return `<div class="animate-fade-in">
  <div style="margin-bottom:24px;"><h1 style="font-size:18px;font-weight:600;">Export Data</h1><p style="font-size:13px;color:var(--muted);margin-top:2px;">Export request history as JSON or CSV</p></div>
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;margin-bottom:24px;">
    <div style="font-size:14px;font-weight:600;margin-bottom:16px;">Filters</div>
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
      <div><label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Method</label><select id="ex-method" style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 12px;font-size:12px;color:var(--text2);cursor:pointer;"><option value="ALL">All</option><option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option><option value="PATCH">PATCH</option><option value="DELETE">DELETE</option></select></div>
      <div><label style="font-size:12px;color:var(--muted);display:block;margin-bottom:4px;">Status</label><select id="ex-status" style="background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 12px;font-size:12px;color:var(--text2);cursor:pointer;"><option value="ALL">All</option><option value="2xx">2xx</option><option value="3xx">3xx</option><option value="4xx">4xx</option><option value="5xx">5xx</option></select></div>
      <div style="margin-left:auto;display:flex;gap:8px;">
        <button id="btn-json" style="padding:8px 16px;border-radius:6px;font-size:14px;font-weight:500;background:var(--accent);color:white;border:none;cursor:pointer;">Export JSON</button>
        <button id="btn-csv" style="padding:8px 16px;border-radius:6px;font-size:14px;font-weight:500;background:var(--bg3);color:var(--text2);border:1px solid var(--border);cursor:pointer;">Export CSV</button>
      </div>
    </div>
  </div>
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:16px;"><span style="font-size:14px;font-weight:600;">Preview</span><span style="font-size:12px;color:var(--muted);" id="ex-count">0 records</span></div>
    <div id="ex-preview" style="max-height:400px;overflow-y:auto;"></div>
  </div>
</div>
<script>
document.addEventListener('DOMContentLoaded',async()=>{
  const res=await fetch('/api/requests');const all=await res.json();
  function gf(){let d=all;const m=document.getElementById('ex-method').value,s=document.getElementById('ex-status').value;if(m!=='ALL')d=d.filter(r=>r.method===m);if(s!=='ALL')d=d.filter(r=>{if(s==='2xx')return r.status>=200&&r.status<300;if(s==='3xx')return r.status>=300&&r.status<400;if(s==='4xx')return r.status>=400&&r.status<500;return r.status>=500;});return d;}
  function render(){
    const d=gf();document.getElementById('ex-count').textContent=d.length+' records';
    const el=document.getElementById('ex-preview');
    if(!d.length){el.innerHTML='<div style="text-align:center;padding:32px;color:var(--muted);">No records.</div>';return;}
    el.innerHTML='<table style="width:100%;border-collapse:collapse;"><thead><tr>'+['Method','URL','Status','Duration'].map(h=>'<th style="padding:6px 8px;text-align:left;font-size:11px;font-weight:500;color:var(--muted);text-transform:uppercase;border-bottom:1px solid var(--border);">'+h+'</th>').join('')+'</tr></thead><tbody>'+d.slice(0,20).map(r=>'<tr><td style="padding:6px 8px;border-bottom:1px solid rgba(39,39,42,0.5);font-size:12px;color:var(--text2);">'+r.method+'</td><td style="padding:6px 8px;border-bottom:1px solid rgba(39,39,42,0.5);font-family:monospace;font-size:12px;color:var(--text2);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+r.url+'</td><td style="padding:6px 8px;border-bottom:1px solid rgba(39,39,42,0.5);font-size:12px;color:var(--text2);">'+r.status+'</td><td style="padding:6px 8px;border-bottom:1px solid rgba(39,39,42,0.5);font-size:12px;color:var(--text2);">'+r.duration+'ms</td></tr>').join('')+'</tbody></table>'+(d.length>20?'<div style="text-align:center;padding:8px;font-size:12px;color:var(--muted);">...and '+(d.length-20)+' more</div>':'');
  }
  document.getElementById('ex-method').addEventListener('change',render);document.getElementById('ex-status').addEventListener('change',render);
  document.getElementById('btn-json').addEventListener('click',()=>{const d=gf();const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='httx-requests.json';a.click();URL.revokeObjectURL(u);});
  document.getElementById('btn-csv').addEventListener('click',()=>{const d=gf();const h=['id','method','url','status','statusText','duration','requestSize','responseSize','timestamp'];const csv=[h.join(','),...d.map(r=>h.map(k=>'"'+String(r[k]||'').replace(/"/g,'""')+'"').join(','))].join('\\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='httx-requests.csv';a.click();URL.revokeObjectURL(u);});
  render();
});
<\/script>`
}

function settingsPageContent(): string {
  return `<div class="animate-fade-in">
  <div style="margin-bottom:24px;"><h1 style="font-size:18px;font-weight:600;">Settings</h1><p style="font-size:13px;color:var(--muted);margin-top:2px;">Dashboard configuration</p></div>
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;margin-bottom:24px;">
    <div style="font-size:14px;font-weight:600;margin-bottom:16px;">Server Configuration</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
      ${['Port|4401', 'Host|localhost', 'Refresh Interval|5000 ms', 'Max History|1000'].map(x => { const [l, v] = x.split('|'); return `<div style="background:var(--bg);border-radius:6px;padding:16px;"><div style="font-size:12px;font-weight:500;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">${l}</div><div style="font-size:18px;font-weight:600;color:var(--text2);">${v}</div></div>`; }).join('')}
    </div>
  </div>
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;margin-bottom:24px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:16px;"><div style="font-size:14px;font-weight:600;">Authentication</div><span style="display:inline-flex;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;background:rgba(113,113,122,0.15);color:var(--muted);">Read-only</span></div>
    <div style="display:flex;align-items:center;gap:12px;padding:12px 0;">
      <div style="width:36px;height:20px;border-radius:10px;background:var(--border);position:relative;"><div style="width:16px;height:16px;border-radius:50%;background:var(--muted);position:absolute;top:2px;left:2px;"></div></div>
      <span style="font-size:14px;color:var(--text2);">Enable authentication</span>
    </div>
    <p style="font-size:12px;color:#52525b;margin-top:4px;">Authentication settings are read-only. Configure in your application code.</p>
  </div>
  <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px;">
    <div style="font-size:14px;font-weight:600;margin-bottom:16px;">About</div>
    ${[['Package', '@stacksjs/httx-dashboard'], ['Version', '0.1.0'], ['Runtime', 'Bun'], ['Template Engine', 'stx']].map(([l, v]) => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(39,39,42,0.5);"><span style="font-size:14px;color:var(--text2);">${l}</span><span style="font-size:14px;color:var(--text);font-family:monospace;">${v}</span></div>`).join('')}
  </div>
</div>`
}

// --- Server ---

export async function serveDashboard(options: DashboardConfig = {}): Promise<void> {
  const config = resolveConfig(options)
  const apiRoutes = createApiRoutes(config)

  const server = Bun.serve({
    port: config.port,
    hostname: config.host,

    async fetch(req: Request) {
      const url = new URL(req.url)
      const path = url.pathname

      // Static API routes (exact match)
      if (path === '/api/stats') return apiRoutes['/api/stats']()
      if (path === '/api/requests') return apiRoutes['/api/requests']()
      if (path === '/api/endpoints') return apiRoutes['/api/endpoints']()
      if (path === '/api/events') return apiRoutes['/api/events']()
      if (path === '/api/alerts') return apiRoutes['/api/alerts']()

      // Parameterized API routes
      const reqMatch = path.match(/^\/api\/requests\/(.+)$/)
      if (reqMatch) {
        const id = decodeURIComponent(reqMatch[1])
        return apiRoutes['/api/requests/:id'](id)
      }

      const epMatch = path.match(/^\/api\/endpoints\/(.+)$/)
      if (epMatch) {
        const encoded = decodeURIComponent(epMatch[1])
        const parts = encoded.split(' ')
        const method = parts[0]
        const epPath = parts.slice(1).join(' ')
        return apiRoutes['/api/endpoints/:path'](method, epPath)
      }

      // Page routes
      const route = matchRoute(path)
      if (route) {
        const { title, content } = getPageContent(route.handler, route.params)
        const html = pageShell(title, route.handler, content)
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' },
        })
      }

      return new Response('Not Found', { status: 404 })
    },
  })

  console.log(`httx dashboard running at http://${server.hostname}:${server.port}`)
}
