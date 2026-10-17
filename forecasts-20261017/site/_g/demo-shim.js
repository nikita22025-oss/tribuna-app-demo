/* Демо сайта «Трибуна» на статическом хостинге под префиксом (GitHub Pages).
   Тот же опубликованный сайт и та же тема «Графит», что на trbn.ru. Скрипты сайта считают, что живут в корне;
   эта прослойка (по образцу v2-shim.js превью /v2/):
   1) держит внутренние ссылки и адреса файлов внутри префикса демо — после каждой отрисовки, при записи в историю;
      прямые ссылки на trbn.ru/<раздел> тоже ведут внутрь демо, а не на рабочий сайт;
   2) отдаёт скриптам путь без префикса (__demo.pathname, __demo.strip);
   3) ставит фон и логотип «Графит», как g-root.js на trbn.ru, и полоску «Демо».
   Данные, реклама и их обработчики не трогаются; аналитика в демо выключена в config.js. */
(function () {
  'use strict';
  var P = '/tribuna-app-demo/forecasts-20261017/site';                       // например /tribuna-app-demo/forecasts-20261016/site
  var STAMP = 'прогнозы и результаты 17.10';
  // Non-empty only for a synthetic-state test page: replaces the ribbon text and keeps it fixed on screen.
  var BANNER = '';
  var ROUTE = /^\/(?:$|(?:article|archive|category|author|search|sitemap|matches|match|bookmakers|bookmaker|advertising|privacy|about|format|forecasts|forecast)(?:\/|$))/;
  function strip(p) { p = String(p); return p === P ? '/' : (p.indexOf(P + '/') === 0 ? p.slice(P.length) : p); }
  window.__demo = { prefix: P, strip: strip, get pathname() { return strip(location.pathname); } };
  window.TRIBUNA_FORECASTS_URL = P + '/forecasts.json';
  window.TRIBUNA_FORECASTS_SNAPSHOT = true;
  window.TRIBUNA_FACTS_URL = P + '/facts.json';

  function inside(raw) {
    if (raw == null) return raw;
    var s = String(raw);
    if (!s || s.charAt(0) === '#' || s.charAt(0) === '?') return raw;
    var path = s;
    if (/^https?:\/\//i.test(s)) {
      var x; try { x = new URL(s); } catch (e) { return raw; }
      if (x.origin === location.origin) path = x.pathname + x.search + x.hash;
      else if (/^(www\.)?trbn\.ru$/i.test(x.hostname)) {          // ссылка на раздел рабочего сайта → тот же раздел демо
        var plain0; try { plain0 = decodeURIComponent(x.pathname); } catch (e) { plain0 = x.pathname; }
        if (!ROUTE.test(plain0)) return raw;                       // файлы рабочего сайта (картинки архива) — как есть
        path = x.pathname + x.search + x.hash;
      } else return raw;                                           // внешние ссылки, в том числе рекламные
    } else if (s.charAt(0) !== '/' || s.charAt(1) === '/') return raw; // относительные адреса, mailto:, tel:, //host
    var bare = path.split(/[?#]/, 1)[0];
    if (bare === P || bare.indexOf(P + '/') === 0) return path === s ? raw : path;
    return P + path;
  }
  ['pushState', 'replaceState'].forEach(function (name) {
    var original = history[name];
    history[name] = function (state, title, url) { return original.call(this, state, title, arguments.length > 2 ? inside(url) : url); };
  });
  var ATTR = { A: 'href', IMG: 'src', SOURCE: 'src', LINK: 'href', SCRIPT: 'src', IFRAME: 'src' };
  function fix(node) {
    var name = ATTR[node.nodeName]; if (!name) return;
    var raw = node.getAttribute(name); if (raw == null) return;
    var next = inside(raw); if (next !== raw) node.setAttribute(name, next);
  }
  function fixAll(root) {
    if (!root || root.nodeType !== 1) return;
    fix(root);
    var list = root.querySelectorAll ? root.querySelectorAll('a[href],img[src],source[src],link[href],script[src],iframe[src]') : [];
    for (var i = 0; i < list.length; i++) fix(list[i]);
  }

  function dress() {
    var body = document.body; if (!body || body.__graphite) return; body.__graphite = true;
    var canvas = document.createElement('canvas'); canvas.className = 'graphite-bg'; canvas.setAttribute('aria-hidden', 'true');
    var veil = document.createElement('div'); veil.className = 'veil'; veil.setAttribute('aria-hidden', 'true');
    body.insertBefore(veil, body.firstChild); body.insertBefore(canvas, veil);
    var bar = document.createElement('div'); bar.className = 'demo-ribbon'; bar.setAttribute('role', 'note');
    bar.textContent = BANNER || ('Демо сайта «Трибуна» · снимок ' + STAMP + ' · не рабочая версия');
    if (BANNER) { bar.id = 'demo-banner'; bar.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483647;background:#FFB4A8;color:#11130F;pointer-events:none'; }
    body.insertBefore(bar, body.firstChild);
  }
  function logo() {
    var mark = document.querySelector('.site-header .classic-wordmark');
    if (!mark || mark.querySelector('.g-logo-box')) return;
    var box = document.createElement('span'); box.className = 'g-logo-box';
    var img = document.createElement('img'); img.className = 'g-logo'; img.alt = ''; img.width = 184; img.height = 54; img.src = P + '/_g/tribuna-logo-plain.svg?v=3';
    box.appendChild(img); mark.appendChild(box);
  }
  var dressed = false;
  new MutationObserver(function (records) {
    if (!dressed) { dress(); logo(); dressed = !!(document.body && document.body.__graphite && document.querySelector('.g-logo-box')); }
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (r.type === 'attributes') { fix(r.target); continue; }
      for (var j = 0; j < r.addedNodes.length; j++) fixAll(r.addedNodes[j]);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'src'] });
  document.addEventListener('DOMContentLoaded', function () { dress(); logo(); fixAll(document.documentElement); });
})();
