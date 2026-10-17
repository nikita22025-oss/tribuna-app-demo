/* Navigation shared by classic-header pages; the logo itself is static. */
(() => {
  const header = document.querySelector('.classic-masthead');
  if (!header) return;
  const brand = header.querySelector('.classic-brand-strip');
  const nav = header.querySelector('.classic-nav');
  const services = header.querySelector('.classic-services');
  function syncTopics() {
    const current = decodeURIComponent(__demo.pathname).replace(/\/$/, '');
    const article = /^\/article\/[^/]+$/.test(current);
    header.classList.toggle('is-article', article);
    // Keep keyboard order consistent with the compact bar's visual order.
    if (article && brand.parentElement !== nav) nav.insertBefore(brand, services);
    else if (!article && brand.parentElement !== header) header.insertBefore(brand, nav);
    header.querySelectorAll('.classic-topics a').forEach(link => {
      if (decodeURIComponent(__demo.strip(new URL(link.href).pathname)).replace(/\/$/, '') === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
  const content = document.getElementById('page') || document.getElementById('content');
  if (content) new MutationObserver(syncTopics).observe(content, { childList: true });
  window.addEventListener('popstate', syncTopics);
  syncTopics();
})();
