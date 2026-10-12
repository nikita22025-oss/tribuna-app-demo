// 1. «Прожекторы» — вечерний стадион: лучи мачт освещения в лёгкой дымке, внизу — отсвет поля.
// Лучи медленно качаются (период 50–70 с) и чуть «дышат»; в лучах плывут редкие пылинки.
// Мягкость даёт низкое разрешение холста и слоёные градиенты, фильтров размытия нет.
(function () {
  'use strict';
  var cv = null, ctx = null, W = 0, H = 0, K = 1;
  var TAU = Math.PI * 2;
  var PAPER = '242,243,238', LIME = '230,255,87', MOSS = '120,190,110';
  // ox, oy — мачта в долях экрана (за краем); ang — направление, sweep — размах качания, per — период в секундах
  var beams = [
    { ox: -0.06, oy: -0.04, ang: 0.98, sweep: 0.07, per: 61, ph: 0.0, half: 0.150, len: 1.55, col: PAPER, a: 0.105 },
    { ox: 1.06, oy: -0.04, ang: Math.PI - 0.92, sweep: 0.08, per: 53, ph: 1.9, half: 0.160, len: 1.60, col: LIME, a: 0.105 },
    { ox: 0.22, oy: -0.10, ang: 1.32, sweep: 0.05, per: 71, ph: 3.3, half: 0.085, len: 1.35, col: PAPER, a: 0.060 },
    { ox: 0.84, oy: -0.10, ang: Math.PI - 1.26, sweep: 0.06, per: 67, ph: 4.6, half: 0.095, len: 1.40, col: PAPER, a: 0.085 },
    { ox: 1.10, oy: 0.30, ang: Math.PI - 0.34, sweep: 0.05, per: 79, ph: 2.6, half: 0.070, len: 1.30, col: MOSS, a: 0.060 }
  ];
  var LAYERS = [1, 0.80, 0.62, 0.46, 0.33, 0.22, 0.13, 0.06];
  var motes = [];
  (function () { // постоянный набор пылинок: без случайности между запусками
    var s = 7;
    function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 46; i++) motes.push({ x: r(), y: r(), vx: (r() - 0.5) * 0.004, vy: -0.0015 - r() * 0.003, ph: r() * TAU, per: 9 + r() * 9, r: 0.6 + r() * 1.1 });
  })();
  function size() {
    K = Math.min(window.devicePixelRatio || 1, 2) * 0.5;
    W = cv.width = Math.max(1, Math.round(window.innerWidth * K));
    H = cv.height = Math.max(1, Math.round(window.innerHeight * K));
  }
  function frac(v) { return v - Math.floor(v); }
  function draw(t) {
    var s = t / 1000, D = Math.max(W, H);
    var sy = window.__flowScroll ? window.__flowScroll() : 0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    // ночное небо над чашей: чуть светлее к низу
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, 'rgba(17,19,15,0)'); sky.addColorStop(1, 'rgba(34,42,30,.55)');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    // отсвет поля снизу
    var breathe = 0.5 + 0.5 * Math.sin(s * TAU / 27);
    var gx = W * (0.56 + 0.04 * Math.sin(s * TAU / 43)), gy = H * 1.06 - sy * K * 0.08;
    var glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, D * 0.62);
    glow.addColorStop(0, 'rgba(' + LIME + ',' + (0.19 + 0.04 * breathe).toFixed(3) + ')');
    glow.addColorStop(0.45, 'rgba(' + MOSS + ',.06)'); glow.addColorStop(1, 'rgba(' + MOSS + ',0)');
    ctx.save(); ctx.translate(gx, gy); ctx.scale(1.5, 0.62); ctx.translate(-gx, -gy);
    ctx.fillStyle = glow; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore();
    // лучи
    for (var b = 0; b < beams.length; b++) {
      var B = beams[b];
      var ang = B.ang + B.sweep * Math.sin(s * TAU / B.per + B.ph);
      var power = 0.82 + 0.18 * Math.sin(s * TAU / (B.per * 0.61) + B.ph * 2.3);
      var ox = B.ox * W, oy = B.oy * H - sy * K * 0.03, L = B.len * D;
      var ex = ox + Math.cos(ang) * L, ey = oy + Math.sin(ang) * L;
      var g = ctx.createLinearGradient(ox, oy, ex, ey);
      g.addColorStop(0, 'rgba(' + B.col + ',' + (B.a * power).toFixed(4) + ')');
      g.addColorStop(0.42, 'rgba(' + B.col + ',' + (B.a * power * 0.42).toFixed(4) + ')');
      g.addColorStop(1, 'rgba(' + B.col + ',0)');
      ctx.fillStyle = g;
      for (var l = 0; l < LAYERS.length; l++) {
        var h = B.half * LAYERS[l];
        ctx.beginPath(); ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(ang - h) * L, oy + Math.sin(ang - h) * L);
        ctx.lineTo(ox + Math.cos(ang + h) * L, oy + Math.sin(ang + h) * L);
        ctx.closePath(); ctx.fill();
      }
      // ореол у мачты
      var halo = ctx.createRadialGradient(ox, oy, 0, ox, oy, D * 0.26);
      halo.addColorStop(0, 'rgba(' + B.col + ',' + (B.a * 1.5 * power).toFixed(4) + ')'); halo.addColorStop(1, 'rgba(' + B.col + ',0)');
      ctx.fillStyle = halo; ctx.fillRect(ox - D * 0.26, oy - D * 0.26, D * 0.52, D * 0.52);
    }
    // пылинки в свете
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      var x = (frac(m.x + m.vx * s) * 1.1 - 0.05) * W, y = (frac(m.y + m.vy * s) * 1.1 - 0.05) * H;
      var a = 0.05 + 0.13 * (0.5 + 0.5 * Math.sin(s * TAU / m.per + m.ph));
      ctx.fillStyle = 'rgba(' + (i % 5 ? PAPER : LIME) + ',' + a.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, m.r * Math.max(1, K * 1.4), 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  (window.TribunaBackgrounds = window.TribunaBackgrounds || []).push({
    name: 'floodlights',
    title: 'Прожекторы',
    note: 'Вечерний стадион: лучи мачт освещения в лёгкой дымке и отсвет поля снизу.',
    start: function (canvas) { cv = canvas; ctx = cv.getContext('2d'); size(); },
    stop: function () { if (ctx) ctx.clearRect(0, 0, W, H); ctx = null; cv = null; },
    resize: function () { if (cv) size(); },
    frame: function (t) { if (ctx) draw(t); }
  });
})();
