// Галерея вариантов фона. Один холст, один цикл отрисовки на всю страницу.
// Вариант — модуль { name, title, note, start(canvas), stop(), frame(t), resize() } из window.TribunaBackgrounds.
// Цикл принадлежит галерее, а не модулям: при переключении нечему накапливаться.
(function () {
  'use strict';
  var list = window.TribunaBackgrounds || [];
  var root = document.documentElement;
  var canvas = document.getElementById('bg-canvas');
  var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var VIEWS = ['mobile', 'site'];
  var FRAME_MS = 32;        // не чаще ~30 кадров в секунду, как в исходном фоне
  var STILL_MS = 9000;      // момент, который показывается неподвижным кадром

  var current = null, index = 0, view = 'mobile', paused = false;
  var raf = 0, last = 0, clock = 0, frames = 0, resizeQueued = false;

  var $ = function (id) { return document.getElementById(id); };
  var gal = $('gal'), vars = $('gal-vars'), note = $('gal-note'), titleEl = $('gal-title'), posEl = $('gal-pos'), pauseBtn = $('gal-pause'), foldBtn = $('gal-fold');
  var sampleMobile = $('sample-mobile'), sampleSite = $('sample-site');

  // Прокрутка для фонов с параллаксом: страница сайта прокручивается, мобильный экран — нет.
  window.__flowScroll = function () { return view === 'site' ? (window.pageYOffset || 0) : 0; };

  function indexOf(name) { for (var i = 0; i < list.length; i++) if (list[i].name === name) return i; return -1; }
  function still() { return reduceQuery.matches; }
  function canRun() { return !paused && !document.hidden && !still() && !!current; }

  function draw() { if (!current) return; frames++; current.frame(still() ? STILL_MS : clock); }
  function loop(ts) {
    raf = 0;
    if (!canRun()) return;
    if (!last) { last = ts; draw(); }
    else if (ts - last > FRAME_MS) { clock += Math.min(ts - last, 100); last = ts; draw(); }
    raf = requestAnimationFrame(loop);
  }
  function run() { if (!raf && canRun()) { last = 0; raf = requestAnimationFrame(loop); } }
  function halt() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  function select(i, replaceUrl) {
    i = (i + list.length) % list.length;
    halt();
    if (current) current.stop();
    index = i; current = list[i];
    root.setAttribute('data-bg', current.name);
    current.start(canvas);
    draw();
    run();
    syncPanel();
    if (replaceUrl !== false) syncUrl();
  }
  function setView(v, replaceUrl) {
    view = VIEWS.indexOf(v) >= 0 ? v : 'mobile';
    root.setAttribute('data-view', view);
    sampleMobile.hidden = view !== 'mobile'; sampleSite.hidden = view !== 'site';
    window.scrollTo(0, 0);
    if (window.TribunaSample) window.TribunaSample.relayout();
    if (current) { current.resize(); draw(); }
    syncPanel();
    if (replaceUrl !== false) syncUrl();
  }
  function setPaused(p) {
    paused = !!p;
    if (paused) halt(); else run();
    syncPanel();
  }

  function syncUrl() {
    var q = new URLSearchParams(location.search);
    q.set('bg', current.name); q.set('view', view);
    history.replaceState(null, '', location.pathname + '?' + q.toString());
  }
  function syncPanel() {
    Array.prototype.forEach.call(vars.children, function (b, i) { b.setAttribute('aria-pressed', i === index ? 'true' : 'false'); });
    Array.prototype.forEach.call(gal.querySelectorAll('[data-view]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === view ? 'true' : 'false'); });
    if (current) { titleEl.textContent = current.title; note.textContent = current.note; posEl.textContent = (index + 1) + ' / ' + list.length; }
    if (still()) { pauseBtn.disabled = true; pauseBtn.textContent = 'Без движения'; pauseBtn.title = 'В системе включено «уменьшение движения»: показан неподвижный кадр'; pauseBtn.setAttribute('aria-pressed', 'false'); }
    else { pauseBtn.disabled = false; pauseBtn.title = ''; pauseBtn.textContent = paused ? 'Продолжить' : 'Пауза'; pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false'); }
  }
  function setFolded(f) {
    gal.classList.toggle('folded', f);
    foldBtn.setAttribute('aria-expanded', f ? 'false' : 'true');
    foldBtn.setAttribute('aria-label', f ? 'Развернуть панель' : 'Свернуть панель');
  }

  /* ---------- панель ---------- */
  list.forEach(function (m, i) {
    var b = document.createElement('button'), n = document.createElement('i');
    b.type = 'button'; n.textContent = String(i); b.appendChild(n); b.appendChild(document.createTextNode(m.title));
    b.setAttribute('aria-pressed', 'false'); b.title = m.note;
    b.addEventListener('click', function () { select(i); });
    vars.appendChild(b);
  });
  $('gal-prev').addEventListener('click', function () { select(index - 1); });
  $('gal-next').addEventListener('click', function () { select(index + 1); });
  Array.prototype.forEach.call(gal.querySelectorAll('[data-view]'), function (b) { b.addEventListener('click', function () { setView(b.getAttribute('data-view')); }); });
  pauseBtn.addEventListener('click', function () { setPaused(!paused); });
  foldBtn.addEventListener('click', function () { setFolded(!gal.classList.contains('folded')); });

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); select(index + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); select(index - 1); }
    else if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); if (!e.repeat && !still()) setPaused(!paused); }
  });
  // Пробел — всегда пауза: не даём ему заодно «нажать» кнопку, на которой стоит фокус.
  document.addEventListener('keyup', function (e) { if (e.key === ' ' || e.code === 'Space') e.preventDefault(); });

  /* ---------- окно, вкладка, настройки движения ---------- */
  window.addEventListener('resize', function () {
    if (resizeQueued) return; resizeQueued = true;
    requestAnimationFrame(function () { resizeQueued = false; if (current) { current.resize(); draw(); } });
  });
  window.addEventListener('scroll', function () { if (current && !raf && !still()) draw(); }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden) halt(); else run(); });
  function onReduce() { halt(); draw(); run(); syncPanel(); }
  if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', onReduce);
  else if (reduceQuery.addListener) reduceQuery.addListener(onReduce);

  /* ---------- запуск: состояние из адреса ---------- */
  var q = new URLSearchParams(location.search);
  var hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  var wantBg = q.get('bg') || hash.get('bg'), wantView = q.get('view') || hash.get('view');
  if (q.get('panel') === '0') root.setAttribute('data-panel', 'off');
  setFolded(window.innerWidth <= 700);
  setView(wantView, false);
  select(Math.max(0, indexOf(wantBg)), false);
  syncUrl();
  if (window.TribunaSample) window.TribunaSample.ready.then(function () { window.TribunaSample.relayout(); }, function () {});

  // Для проверок: счётчики кадров и циклов, показ произвольного момента.
  window.__bg = {
    frames: function () { return frames; },
    loops: function () { return raf ? 1 : 0; },
    state: function () { return { bg: current && current.name, view: view, paused: paused, still: still(), clock: clock }; },
    seek: function (ms) { halt(); clock = ms; draw(); },
    names: function () { return list.map(function (m) { return m.name; }); }
  };
})();
