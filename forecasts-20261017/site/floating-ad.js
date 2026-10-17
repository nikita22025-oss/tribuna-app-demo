/* Dismissible advertising placement; existing native placement supplies attribution. */
(() => {
  'use strict';
  const config = window.TRIBUNA_FLOATING_AD;
  if (!config?.enabled || document.getElementById('tribuna-floating-ad')) return;
  if (config.preview_only && !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
  const creative = window.__INITIAL__?.ads?.native?.find(ad => ad.advertiser_name === config.source_advertiser);
  if (!creative?.click_url || !creative.erid) return;
  let destination;
  try {
    destination = new URL(creative.click_url);
    if (destination.protocol !== 'https:') return;
  } catch { return; }
  const storageKey = 'tribuna:floating-ad:closed:' + config.id;
  try { if (sessionStorage.getItem(storageKey) === '1') return; } catch { /* Storage may be unavailable. */ }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }
  const host = node('aside', 'floating-ad');
  host.id = 'tribuna-floating-ad';
  host.hidden = true;
  host.dataset.adSlot = 'floating';
  host.dataset.advertiser = creative.advertiser_name;
  host.setAttribute('aria-label', 'Реклама Фонбет, 18+');
  const close = node('button', 'floating-ad-close');
  close.type = 'button';
  close.setAttribute('aria-label', 'Закрыть рекламу Фонбет');
  const cross = node('span', '', '×');
  cross.setAttribute('aria-hidden', 'true');
  close.append(cross);
  const link = node('a', 'floating-ad-link');
  link.href = destination.href;
  link.target = '_blank';
  link.rel = 'nofollow sponsored noopener noreferrer';
  link.setAttribute('aria-label', 'Фонбет. Фрибеты без депозита до 15 000 рублей новым клиентам. Перейти на сайт, новая вкладка.');
  const artwork = node('div', 'floating-ad-artwork');
  artwork.setAttribute('aria-hidden', 'true');
  const ns = 'http://www.w3.org/2000/svg';
  function sketch(className, viewBox, paths) {
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    for (const d of paths) {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      svg.append(path);
    }
    return svg;
  }
  const brand = node('div', 'floating-ad-brand');
  // Reuse the official wordmark, framing its transparent padding without changing the file.
  const logo = document.createElementNS(ns, 'svg');
  logo.setAttribute('viewBox', '0 21 240 47');
  logo.setAttribute('focusable', 'false');
  const logoImage = document.createElementNS(ns, 'image');
  logoImage.setAttribute('href', config.logo);
  logoImage.setAttribute('width', '240');
  logoImage.setAttribute('height', '90');
  logo.append(logoImage);
  brand.append(logo, node('span', '', 'Новым клиентам'));
  const copy = node('div', 'floating-ad-copy');
  copy.append(node('strong', '', config.headline), node('span', '', config.condition));
  const ball = sketch('floating-ad-ball', '0 0 116 86', [
    'M5 70c15-1 28-7 39-18M7 78c14-1 24-5 32-10M18 55l16-7',
    'M80 12c21 0 34 16 31 34-3 19-19 29-36 26-20-3-29-18-25-34 3-16 15-26 30-26Z',
    'm77 30 14 7-2 16-17 2-8-14 13-11ZM77 30l-1-16m15 23 18-2M89 53l10 11M72 55l-7 12M64 41l-13-5',
  ]);
  const offer = node('div', 'floating-ad-offer');
  const amount = node('strong', 'floating-ad-amount');
  amount.append(node('small', '', 'до'), document.createTextNode(config.amount));
  offer.append(amount, sketch('floating-ad-underline', '0 0 232 16', [
    'M4 8c59-5 137-5 223-1M39 14c45-3 82-4 121-4',
  ]));
  const cta = node('span', 'floating-ad-cta', config.cta);
  cta.append(sketch('floating-ad-arrow', '0 0 32 26', [
    'M3 21C9 13 17 8 27 6M18 3l10 3-5 10',
  ]));
  artwork.append(brand, copy, ball, offer, cta);
  link.append(artwork);
  const legal = node('div', 'floating-ad-legal');
  const meta = node('div', 'floating-ad-meta');
  const advertiserLegal = String(creative.legal || creative.advertiser_name).replace(/^Реклама[.\s]*/, '');
  meta.append(node('span', '', 'Реклама · 18+ · ' + advertiserLegal), node('span', '', 'ERID: ' + creative.erid));
  legal.append(meta, node('p', '', 'Участие в азартных играх может вызвать игровую зависимость.'));
  host.append(close, link, legal);
  document.body.append(host);

  const reserveSpace = () => {
    const height = host.hidden || host.classList.contains('is-inline') ? 0 : host.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--floating-ad-space', height ? Math.ceil(height + 16) + 'px' : '0px');
  };
  const resize = new ResizeObserver(reserveSpace);
  resize.observe(host);
  let dismissed = false;
  function place() {
    if (dismissed) return;
    const article = /^\/article\//.test(__demo.pathname) && document.querySelector('#page > article');
    host.classList.toggle('is-inline', Boolean(article));
    if (article) {
      const after = article.querySelector('.jf-chapter,.pj-intro,.jr-reading,.article-body');
      if (!article.contains(host)) {
        if (after) after.after(host); else article.append(host);
      }
    } else if (host.parentElement !== document.body) document.body.append(host);
    document.body.classList.toggle('has-floating-ad', !article && !host.hidden);
    reserveSpace();
  }
  const show = () => {
    if (dismissed) return;
    host.hidden = false;
    place();
    window.tribunaTrack?.('ad_view', { slot: 'floating', advertiser: creative.advertiser_name });
  };
  place();
  // The article placement reserves its own space from the initial reading layout.
  const timer = host.classList.contains('is-inline') ? (show(), null) : setTimeout(show, Math.max(0, Number(config.delay_ms) || 0));
  const pageObserver = new MutationObserver(place);
  const page = document.getElementById('page');
  if (page) pageObserver.observe(page, {childList:true});
  window.addEventListener('popstate', place);
  close.addEventListener('click', () => {
    dismissed = true;
    clearTimeout(timer);
    try { sessionStorage.setItem(storageKey, '1'); } catch { /* Closing still works for this document. */ }
    window.tribunaTrack?.('ad_close', { slot: 'floating', advertiser: creative.advertiser_name });
    resize.disconnect();
    pageObserver.disconnect();
    window.removeEventListener('popstate', place);
    document.body.classList.remove('has-floating-ad');
    document.documentElement.style.removeProperty('--floating-ad-space');
    host.remove();
    const main = document.getElementById('page') || document.querySelector('main');
    if (main) {
      const temporary = !main.hasAttribute('tabindex');
      if (temporary) main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
      if (temporary) main.removeAttribute('tabindex');
    }
  });
})();
