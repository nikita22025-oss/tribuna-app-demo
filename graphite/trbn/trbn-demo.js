/* Небольшая замена скриптов сайта для статичного демо: раскладка ленты, «сектор», меню, вкладки, реклама.
   Повторяет поведение trbn.ru; на сервер ничего не отправляет. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // картинки: запасной фон, если оригинал не загрузился
  $$('img[data-g-img]').forEach(function (img) {
    var fail = function () { img.classList.add('g-img-failed'); };
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
    img.addEventListener('error', fail);
  });

  // лента-кладка: высота карточки → число строк сетки (как layoutEditorial на сайте)
  function sizeCard(body) { var h = Math.ceil(body.getBoundingClientRect().height); if (h > 0) body.parentElement.style.setProperty('--card-rows', String(h)); }
  function layout() { $$('.editorial-card-body').forEach(sizeCard); $$('.editorial-masonry').forEach(function (g) { g.classList.add('is-enhanced'); }); }
  function sizeSector() {
    var stage = $('.editorial-stage'), sector = stage && $('.special-section', stage); if (!sector) return;
    var h = Math.ceil(sector.getBoundingClientRect().height);
    if (h > 0) { stage.style.setProperty('--sector-height', h + 'px'); stage.classList.add('has-sector'); }
  }
  layout(); sizeSector();
  if (typeof ResizeObserver !== 'undefined') {
    var ro = new ResizeObserver(function (es) { es.forEach(function (e) { sizeCard(e.target); }); });
    $$('.editorial-card-body').forEach(function (b) { ro.observe(b); });
    var sec = $('.special-section'); if (sec) new ResizeObserver(sizeSector).observe(sec);
  }
  var raf = 0; window.addEventListener('resize', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { layout(); sizeSector(); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Tab') { var st = $('.editorial-stage'); if (st) st.classList.add('is-linear'); } });

  // «Все темы»
  var toggle = $('.menu-toggle'), menu = $('#mobile-menu');
  function setMenu(open) { if (!toggle || !menu) return; menu.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('menu-open', open); }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(menu.hidden); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); } });
    document.addEventListener('click', function (e) { if (!menu.hidden && !e.target.closest('.site-header')) setMenu(false); });
  }

  // формы: в демо никуда не отправляются
  $$('form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = f.querySelector('.g-form-note'); if (!n) { n = document.createElement('span'); n.className = 'g-form-note'; n.setAttribute('role', 'status'); f.appendChild(n); }
      n.textContent = 'В демо поиск не подключён';
    });
  });

  // матч-центр: вкладки видов спорта фильтруют сохранённые карточки
  $$('.matches-module').forEach(function (mod) {
    var buttons = $$('.sport-filters button', mod), cards = $$('.match-card', mod);
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var sport = b.getAttribute('data-sport');
        buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        cards.forEach(function (c) { var s = c.querySelector('.match-sport'); c.hidden = !(sport === 'all' || (s && s.textContent.trim() === sport)); });
      });
    });
  });

  // плавающая реклама: место под неё и закрытие
  var ad = $('#tribuna-floating-ad');
  if (ad) {
    var inline = ad.classList.contains('is-inline');
    var reserve = function () { var h = ad.hidden || inline ? 0 : ad.getBoundingClientRect().height; document.documentElement.style.setProperty('--floating-ad-space', h ? Math.ceil(h + 16) + 'px' : '0px'); };
    reserve(); var adRo = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(reserve) : null; if (adRo) adRo.observe(ad);
    var close = $('.floating-ad-close', ad);
    if (close) close.addEventListener('click', function () { if (adRo) adRo.disconnect(); document.body.classList.remove('has-floating-ad'); document.documentElement.style.removeProperty('--floating-ad-space'); ad.remove(); });
  }
})();
