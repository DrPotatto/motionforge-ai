/**
 * Reads window.MF_CONFIG (from /config.js) and applies it to the page:
 * brand text, support email, canonical URL, analytics, and OG tags.
 */
export function getConfig() {
  return window.MF_CONFIG || {};
}

export function applyConfigToPage() {
  const c = getConfig();
  if (!c.site) return;
  // Brand name everywhere
  document.querySelectorAll('[data-brand]').forEach(el => {
    if (c.site.name) el.textContent = c.site.name;
  });
  // Support email links
  document.querySelectorAll('[data-support]').forEach(el => {
    if (c.site.supportEmail) el.setAttribute('href', 'mailto:' + c.site.supportEmail);
  });
  // Document title suffix
  if (c.site.name && !document.title.includes(c.site.name)) {
    const parts = document.title.split('—');
    if (parts.length > 1) document.title = parts[0].trim() + ' — ' + c.site.name;
  }
  // Canonical
  if (c.site.url) {
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = c.site.url.replace(/\/$/, '') + location.pathname;
    document.head.appendChild(link);
    // og:url
    const ogu = document.querySelector('meta[property="og:url"]') || document.createElement('meta');
    ogu.setAttribute('property', 'og:url');
    ogu.setAttribute('content', c.site.url.replace(/\/$/, '') + location.pathname);
    if (!ogu.parentNode) document.head.appendChild(ogu);
  }
  // Analytics
  if (c.analytics && c.analytics.scriptUrl) {
    const s = document.createElement('script');
    s.defer = true;
    s.src = c.analytics.scriptUrl;
    if (c.analytics.domain) s.setAttribute('data-domain', c.analytics.domain);
    document.head.appendChild(s);
  }
}
