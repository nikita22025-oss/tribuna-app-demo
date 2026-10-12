// 3. «Графит» — спокойная графитовая фактура: зерно, тонкая штриховка и едва заметная меловая разметка поля.
// Движется только свет: лаймовый огонёк медленно обходит центральный круг, второй идёт по средней линии,
// в углу раз в полминуты разгорается и гаснет мягкое свечение. Неподвижная часть рисуется один раз.
(function () {
  'use strict';
  var cv = null, ctx = null, W = 0, H = 0, K = 1, cssW = 0, cssH = 0, base = null, calm = false;
  var TAU = Math.PI * 2, ROT = -0.44;
  var geo = { x: 0, y: 0, u: 1 };
  function pitchPath(c) { // разметка в метрах, центр поля — (0, 0)
    c.beginPath();
    c.rect(-52.5, -34, 105, 68);
    c.moveTo(0, -34); c.lineTo(0, 34);
    c.moveTo(9.15, 0); c.arc(0, 0, 9.15, 0, TAU);
    [-1, 1].forEach(function (d) {
      var gx = d * 52.5;
      c.rect(d > 0 ? gx - 16.5 : gx, -20.16, 16.5, 40.32);
      c.rect(d > 0 ? gx - 5.5 : gx, -9.16, 5.5, 18.32);
      var sx = gx - d * 11, a = Math.acos(5.5 / 9.15);
      if (d > 0) { c.moveTo(sx + 9.15 * Math.cos(Math.PI - a), 9.15 * Math.sin(Math.PI - a)); c.arc(sx, 0, 9.15, Math.PI - a, Math.PI + a); }
      else { c.moveTo(sx + 9.15 * Math.cos(-a), 9.15 * Math.sin(-a)); c.arc(sx, 0, 9.15, -a, a); }
    });
  }
  function toPitch(c) { c.setTransform(K, 0, 0, K, 0, 0); c.translate(geo.x, geo.y); c.rotate(ROT); c.scale(geo.u, geo.u); }
  function size() {
    K = Math.min(window.devicePixelRatio || 1, 1.5);
    cssW = window.innerWidth; cssH = window.innerHeight;
    W = cv.width = Math.max(1, Math.round(cssW * K));
    H = cv.height = Math.max(1, Math.round(cssH * K));
    geo.u = Math.max(cssW, cssH) * 1.3 / 105;
    // на широком экране центральный круг стоит справа, вне текста; на узком текст занимает всю ширину,
    // поэтому круг уходит в верхний угол, а огоньки приглушаются (calm), чтобы не спорить с буквами
    calm = cssW < 900;
    if (calm) { geo.x = cssW * 0.92; geo.y = cssH * 0.25; } else { geo.x = cssW * 0.80; geo.y = cssH * 0.45; }
    base = document.createElement('canvas'); base.width = W; base.height = H;
    var c = base.getContext('2d');
    // графит: от #1B1D19 к #11130F, с более светлым пятном справа сверху
    var g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#171915'); g.addColorStop(0.5, '#1B1D19'); g.addColorStop(1, '#11130F');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    var spot = c.createRadialGradient(W * 0.78, H * 0.26, 0, W * 0.78, H * 0.26, Math.max(W, H) * 0.7);
    spot.addColorStop(0, 'rgba(58,64,50,.55)'); spot.addColorStop(1, 'rgba(58,64,50,0)');
    c.fillStyle = spot; c.fillRect(0, 0, W, H);
    // тонкая штриховка под 118° — как на типографских обложках журнала
    c.save(); c.translate(W / 2, H / 2); c.rotate(118 * Math.PI / 180);
    var far = Math.hypot(W, H), gapPx = 11 * K;
    c.strokeStyle = 'rgba(242,243,238,.028)'; c.lineWidth = Math.max(1, K * 0.8); c.beginPath();
    for (var y = -far; y < far; y += gapPx) { c.moveTo(-far, y); c.lineTo(far, y); }
    c.stroke(); c.restore();
    // зерно: одна плитка, повторённая узором
    var tile = document.createElement('canvas'); tile.width = tile.height = 128;
    var tc = tile.getContext('2d'), img = tc.createImageData(128, 128), seed = 20261012;
    for (var i = 0; i < img.data.length; i += 4) {
      seed = (seed * 16807) % 2147483647; var r = seed / 2147483647;
      var light = r > 0.5; img.data[i] = light ? 242 : 0; img.data[i + 1] = light ? 243 : 0; img.data[i + 2] = light ? 238 : 0;
      img.data[i + 3] = Math.round(Math.abs(r - 0.5) * 2 * (light ? 15 : 34));
    }
    tc.putImageData(img, 0, 0);
    c.fillStyle = c.createPattern(tile, 'repeat'); c.fillRect(0, 0, W, H);
    // меловая разметка
    toPitch(c); pitchPath(c);
    c.strokeStyle = 'rgba(242,243,238,.105)'; c.lineWidth = 1.5 / geo.u; c.stroke();
    c.fillStyle = 'rgba(242,243,238,.16)'; c.beginPath(); c.arc(0, 0, 0.45, 0, TAU); c.fill();
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
  function glowAt(x, y, radius, alpha) { // в координатах поля
    var g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, 'rgba(230,255,87,' + alpha.toFixed(3) + ')'); g.addColorStop(0.35, 'rgba(230,255,87,' + (alpha * 0.32).toFixed(3) + ')'); g.addColorStop(1, 'rgba(230,255,87,0)');
    ctx.fillStyle = g; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  function draw(t) {
    var s = t / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(base, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    // редкое свечение в углу: разгорается и гаснет раз в 31 с
    var ember = Math.pow(0.5 + 0.5 * Math.sin(s * TAU / 31 - 1.2), 2);
    var ex = W * 0.88, ey = H * 0.84, er = Math.max(W, H) * 0.55;
    var eg = ctx.createRadialGradient(ex, ey, 0, ex, ey, er);
    eg.addColorStop(0, 'rgba(230,255,87,' + (0.035 + 0.075 * ember).toFixed(3) + ')'); eg.addColorStop(1, 'rgba(230,255,87,0)');
    ctx.fillStyle = eg; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    toPitch(ctx);
    ctx.lineCap = 'butt';
    var top = calm ? 0.26 : 0.78, halo = calm ? 0.035 : 0.20;
    // огонёк на центральном круге: полный оборот за 38 с, за ним тает хвост
    var phi = s * TAU / 38, SEG = 0.07, i;
    ctx.lineWidth = 2.4 / geo.u;
    for (i = 0; i < 18; i++) {
      var fade = 1 - i / 18;
      ctx.strokeStyle = 'rgba(230,255,87,' + (top * fade * fade).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(0, 0, 9.15, phi - (i + 1) * SEG, phi - i * SEG); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
    glowAt(9.15 * Math.cos(phi), 9.15 * Math.sin(phi), 7.5, halo);
    ctx.globalCompositeOperation = 'source-over';
    // огонёк на средней линии: туда и обратно за 58 с
    var ly = 30 * Math.sin(s * TAU / 58), dir = Math.cos(s * TAU / 58) >= 0 ? 1 : -1;
    for (i = 0; i < 12; i++) {
      var f2 = 1 - i / 12;
      ctx.strokeStyle = 'rgba(230,255,87,' + (top * 0.7 * f2 * f2).toFixed(3) + ')';
      ctx.beginPath(); ctx.moveTo(0, ly - dir * i * 0.9); ctx.lineTo(0, ly - dir * (i + 1) * 0.9); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
    glowAt(0, ly, 5.5, halo * 0.7);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }
  (window.TribunaBackgrounds = window.TribunaBackgrounds || []).push({
    name: 'graphite',
    title: 'Графит',
    note: 'Тихая графитовая фактура с меловой разметкой; по линиям изредка проходит лаймовый огонёк.',
    start: function (canvas) { cv = canvas; ctx = cv.getContext('2d'); size(); },
    stop: function () { if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); } ctx = null; cv = null; base = null; },
    resize: function () { if (cv) size(); },
    frame: function (t) { if (ctx && base) draw(t); }
  });
})();

// Runner for the «Графит» background (the gallery variant, unchanged above): one loop, at most ~30 frames
// a second, stopped while the tab is hidden, a single still frame with «reduce motion».
(function () {
  'use strict';
  var bg = (window.TribunaBackgrounds || []).filter(function (b) { return b.name === 'graphite'; })[0];
  var canvas = document.querySelector('canvas.graphite-bg');
  if (!bg || !canvas || !canvas.getContext) return;
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var FRAME_MS = 32, STILL_MS = 9000, raf = 0, last = 0, clock = 0, queued = false;
  function draw() { bg.frame(reduce.matches ? STILL_MS : clock); }
  function can() { return !document.hidden && !reduce.matches; }
  function loop(ts) {
    raf = 0; if (!can()) return;
    if (!last) { last = ts; draw(); } else if (ts - last > FRAME_MS) { clock += Math.min(ts - last, 100); last = ts; draw(); }
    raf = requestAnimationFrame(loop);
  }
  function run() { if (!raf && can()) { last = 0; raf = requestAnimationFrame(loop); } }
  document.documentElement.setAttribute('data-bg', 'graphite');
  bg.start(canvas); draw(); run();
  document.addEventListener('visibilitychange', function () { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else run(); });
  window.addEventListener('resize', function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; bg.resize(); draw(); }); });
  if (reduce.addEventListener) reduce.addEventListener('change', function () { draw(); run(); });
})();
