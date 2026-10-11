const ICONS = {
  home: 'M3 12l9-9 9 9M5 10v10h14V10',
  new: 'M12 5v14M5 12h14',
  projects: 'M3 7h18M3 12h18M3 17h18',
  templates: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  brand: 'M12 2l3 7h7l-5.5 4 2 8L12 17l-6.5 4 2-8L2 9h7z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06A1.65 1.65 0 0015 19.4a1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z',
};
export function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  const items = [
    { href: 'app.html', label: 'Home', icon: 'home' },
    { href: 'app.html', label: 'New project', icon: 'new' },
    { href: 'projects.html', label: 'My projects', icon: 'projects' },
    { href: 'templates.html', label: 'Templates', icon: 'templates' },
    { href: 'brand.html', label: 'Brand kit', icon: 'brand' },
    { href: 'settings.html', label: 'Settings', icon: 'settings' },
  ];
  const cur = location.pathname.split('/').pop() || 'app.html';
  nav.innerHTML = items.map(it => {
    const active = cur === it.href ? ' is-active' : '';
    return '<a href="' + it.href + '" class="nav-item' + active + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + ICONS[it.icon] + '"/></svg><span>' + it.label + '</span></a>';
  }).join('');
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (toggle && sidebar) toggle.addEventListener('click', () => sidebar.classList.toggle('is-open'));
}
