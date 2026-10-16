// Общие детали интерфейса. Механика перенесена из согласованных демо:
// поиск — search-demo/index.html, внутренние вкладки — tabs-demo/index.html.
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function svg(viewBox, shapes) {
    var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', viewBox); s.setAttribute('aria-hidden', 'true');
    shapes.forEach(function (sh) { var n = document.createElementNS(NS, sh[0]); Object.keys(sh[1]).forEach(function (k) { n.setAttribute(k, sh[1][k]); }); s.appendChild(n); });
    return s;
  }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ---------- Поиск: круг → тонкая линия → капсула, крестик уходит вправо ---------- */
  var INK = [27, 29, 25], PAPER = [242, 243, 238];
  var OPEN_MS = 640, CLOSE_MS = 520, KNOB = 48;
  function mix(a, b, t) { return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',') + ')'; }
  function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function outBack(t) { var c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

  function makeSearch(host, o) {
    var bar = el('div', 'sb'); bar.setAttribute('role', 'search');
    var field = el('div', 'sb-field'); field.id = o.id + '-field';
    var input = el('input'); input.type = 'search'; input.id = o.id + '-input'; input.placeholder = o.placeholder; input.setAttribute('aria-label', o.label);
    input.autocomplete = 'off'; input.setAttribute('autocorrect', 'off'); input.setAttribute('autocapitalize', 'off'); input.spellcheck = false;
    input.setAttribute('enterkeyhint', 'search'); input.tabIndex = -1;
    field.appendChild(input);
    var knob = el('button', 'sb-knob'); knob.type = 'button'; knob.setAttribute('aria-label', 'Открыть поиск: ' + o.label.toLowerCase());
    knob.setAttribute('aria-expanded', 'false'); knob.setAttribute('aria-controls', field.id);
    var lens = svg('0 0 24 24', [['circle', { cx: 10.5, cy: 10.5, r: 6.5 }], ['path', { d: 'm15.4 15.4 5 5' }]]);
    var cross = svg('0 0 24 24', [['path', { d: 'M6.5 6.5l11 11M17.5 6.5l-11 11' }]]);
    knob.appendChild(lens); knob.appendChild(cross);
    var hint = el('span', 'sb-hint', o.hint); hint.setAttribute('aria-hidden', 'true');
    bar.appendChild(hint); bar.appendChild(field); bar.appendChild(knob); host.appendChild(bar);

    var p = 0, target = 0, raf = 0, last = 0, openedAt = 0;
    // p: 0 — круглая кнопка с лупой, 1 — раскрытая капсула.
    function draw() {
      var a = clamp(p / 0.22), b = clamp((p - 0.18) / 0.62), c = clamp((p - 0.8) / 0.2);
      var flip = outBack(b), slide = inOut(b);
      var w = bar.offsetWidth;
      field.style.visibility = target || p > 0.001 ? 'visible' : 'hidden';
      field.style.opacity = String(clamp(p / 0.08));
      field.style.transform = 'rotateX(' + (88 * (1 - flip)).toFixed(2) + 'deg) scaleX(' + (0.9 + 0.1 * slide).toFixed(3) + ')';
      input.style.opacity = String(c);
      var size = KNOB - 8 * slide, x = Math.max(0, w - KNOB - 4) * slide;
      var light = a * (1 - clamp((b - 0.42) / 0.4));
      knob.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0) scale(' + (size / KNOB).toFixed(3) + ')';
      knob.style.backgroundColor = mix(INK, PAPER, light);
      knob.style.color = mix(PAPER, INK, light);
      knob.style.borderColor = p > 0.02 ? 'transparent' : '';
      lens.style.opacity = String(1 - clamp(p / 0.2));
      cross.style.opacity = String(clamp((b - 0.5) / 0.4));
      cross.style.transform = 'rotate(' + (-90 * (1 - slide)).toFixed(1) + 'deg)';
      hint.style.opacity = String(1 - clamp(p / 0.15));
      hint.style.visibility = p > 0.15 ? 'hidden' : 'visible';
    }
    function tick(now) {
      var dt = Math.max(0, Math.min(48, now - last)); last = now;
      var step = dt / (target ? OPEN_MS : CLOSE_MS);
      p = target ? Math.min(1, p + step) : Math.max(0, p - step);
      draw();
      raf = p === target ? 0 : requestAnimationFrame(tick);
    }
    function run() {
      if (reduce.matches) { p = target; draw(); return; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    }
    function open() {
      if (target === 1) return;
      target = 1; openedAt = performance.now();
      knob.setAttribute('aria-expanded', 'true'); knob.setAttribute('aria-label', 'Закрыть поиск');
      input.tabIndex = 0; field.style.visibility = 'visible';
      input.focus({ preventScroll: true }); // внутри нажатия, иначе iPhone не поднимет клавиатуру
      run();
    }
    function close(focusKnob) {
      if (target === 0) return;
      target = 0;
      knob.setAttribute('aria-expanded', 'false'); knob.setAttribute('aria-label', 'Открыть поиск: ' + o.label.toLowerCase());
      var had = input.value; input.value = ''; input.tabIndex = -1; input.blur();
      if (focusKnob) knob.focus({ preventScroll: true });
      run(); if (had) o.onInput('');
    }
    knob.addEventListener('click', function () { if (target) close(false); else open(); });
    hint.addEventListener('click', open);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === 'Enter') { e.preventDefault(); if (performance.now() - openedAt > 250) input.blur(); }
    });
    input.addEventListener('input', function () { o.onInput(input.value); });
    window.addEventListener('resize', draw);
    if (reduce.addEventListener) reduce.addEventListener('change', function () { p = target; draw(); });
    draw();
    return { open: open, close: close, redraw: draw, input: input, knob: knob, state: function () { return { p: p, target: target }; } };
  }

  /* ---------- Внутренние вкладки со световым следом ---------- */
  var LEAD = { k: 420, c: 30, m: 0.7 }, TRAIL = { k: 120, c: 20, m: 0.9 }; // голова рвётся вперёд, хвост догоняет
  var SHORT = 26; // подчёркивание в покое, px

  function makeTabs(root, names, onChange, idPrefix) {
    var index = 0, raf = 0, last = 0, dir = 1;
    var A = { x: 0, v: 0, s: LEAD, t: 0 }, B = { x: 0, v: 0, s: LEAD, t: 0 };
    var streak = el('span', 'streak'); streak.setAttribute('aria-hidden', 'true');
    root.textContent = '';
    var tabs = names.map(function (n, i) {
      var b = el('button', 'tab', n); b.type = 'button'; b.setAttribute('role', 'tab'); b.id = idPrefix + '-tab-' + i;
      b.addEventListener('click', function () { select(i, true); });
      root.appendChild(b); return b;
    });
    root.appendChild(streak);
    root.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      e.preventDefault(); var n = (index + d + names.length) % names.length; select(n, true); tabs[n].focus();
    });
    function rest(i) { var t = tabs[i], c = t.offsetLeft + t.offsetWidth / 2; return [c - SHORT / 2, c + SHORT / 2]; }
    function draw() {
      var a = Math.min(A.x, B.x), b = Math.max(A.x, B.x), w = Math.max(SHORT * 0.6, b - a);
      var g = Math.min(1, Math.max(0, (w - SHORT) / 70)); // свечение идёт за растяжением и гаснет вместе с ним
      streak.style.width = w.toFixed(1) + 'px';
      streak.style.transform = 'translate3d(' + a.toFixed(1) + 'px,0,0)';
      streak.style.height = (2 + g).toFixed(2) + 'px';
      streak.style.background = g < 0.02 ? '#E6FF57'
        : 'linear-gradient(' + (dir > 0 ? '90deg' : '270deg') + ', rgba(230,255,87,' + (1 - g * 0.9).toFixed(2) + '), #E6FF57 62%, #FBFFE0)';
      streak.style.boxShadow = g < 0.02 ? 'none'
        : '0 0 ' + (6 + 12 * g).toFixed(1) + 'px rgba(230,255,87,' + (0.75 * g).toFixed(2) + '), 0 0 ' + (2 + 3 * g).toFixed(1) + 'px rgba(251,255,224,' + (0.9 * g).toFixed(2) + ')';
    }
    function step(o, dt) {
      var acc = (-o.s.k * (o.x - o.t) - o.s.c * o.v) / o.s.m; o.v += acc * dt; o.x += o.v * dt;
      return Math.abs(o.x - o.t) > 0.05 || Math.abs(o.v) > 0.5;
    }
    function tick(now) {
      var dt = Math.max(0, Math.min(0.064, (now - last) / 1000)); last = now; var moving = false;
      for (var n = Math.max(1, Math.ceil(dt / 0.004)), i = 0; i < n; i++) { var a = step(A, dt / n), b = step(B, dt / n); moving = a || b; }
      if (!moving) { A.x = A.t; B.x = B.t; A.v = B.v = 0; }
      draw(); raf = moving ? requestAnimationFrame(tick) : 0;
    }
    function snap() { var r = rest(index); A.x = A.t = r[0]; B.x = B.t = r[1]; A.v = B.v = 0; draw(); }
    function select(i, user) {
      var r = rest(i);
      if (i !== index) { dir = i > index ? 1 : -1; A.s = dir > 0 ? TRAIL : LEAD; B.s = dir > 0 ? LEAD : TRAIL; }
      index = i; A.t = r[0]; B.t = r[1];
      tabs.forEach(function (t, n) { t.setAttribute('aria-selected', n === i ? 'true' : 'false'); t.tabIndex = n === i ? 0 : -1; });
      if (user) {
        var t = tabs[i], want = t.offsetLeft - (root.clientWidth - t.offsetWidth) / 2;
        root.scrollTo({ left: Math.max(0, want), behavior: reduce.matches ? 'auto' : 'smooth' });
      }
      onChange(names[i]);
      if (reduce.matches || !root.offsetWidth) { snap(); return; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    }
    window.addEventListener('resize', snap);
    // Подписи меняют ширину, когда приходит шрифт или экран становится видимым: держим линию под своей вкладкой.
    function refit() { var r = rest(index); A.t = r[0]; B.t = r[1]; if (!raf) snap(); }
    if (window.ResizeObserver) { var ro = new ResizeObserver(refit); tabs.forEach(function (t) { ro.observe(t); }); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
    if (reduce.addEventListener) reduce.addEventListener('change', snap);
    select(0, false); snap();
    return {
      refit: refit, select: function (i) { select(i, true); }, names: names,
      state: function () { return { index: index, name: names[index], a: A.x, b: B.x, ta: A.t, tb: B.t, moving: !!raf }; }
    };
  }

  window.TribunaUI = { el: el, svg: svg, reduce: reduce, makeSearch: makeSearch, makeTabs: makeTabs };
})();
