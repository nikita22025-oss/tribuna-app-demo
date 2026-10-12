// 4. «Плоскости» — большие полупрозрачные листы света с чёткой освещённой кромкой: как сложенные стёкла
// или грани трофея. Листы медленно поворачиваются и плывут; где они перекрываются, свет складывается.
(function () {
  'use strict';
  var cv = null, ctx = null, W = 0, H = 0, K = 1;
  var TAU = Math.PI * 2;
  // cx, cy, w, h — в долях большей стороны экрана; rot — наклон; per — период поворота в секундах
  var planes = [
    { cx: 0.70, cy: 0.20, w: 1.30, h: 0.50, rot: -0.52, col: '120,190,110', a: 0.150, per: 83, ph: 0.0 },
    { cx: 0.86, cy: 0.52, w: 1.10, h: 0.42, rot: 0.62, col: '230,255,87', a: 0.150, per: 67, ph: 1.7 },
    { cx: 0.42, cy: 0.78, w: 1.40, h: 0.46, rot: -0.30, col: '70,150,120', a: 0.170, per: 97, ph: 3.1 },
    { cx: 0.56, cy: 0.40, w: 0.90, h: 0.30, rot: 0.24, col: '242,243,238', a: 0.070, per: 59, ph: 4.4 },
    { cx: 1.00, cy: 0.86, w: 0.90, h: 0.50, rot: -0.86, col: '190,215,70', a: 0.120, per: 73, ph: 5.3 },
    { cx: 0.14, cy: 0.14, w: 0.80, h: 0.34, rot: 0.40, col: '242,243,238', a: 0.050, per: 89, ph: 2.4 }
  ];
  function size() {
    K = Math.min(window.devicePixelRatio || 1, 1.5);
    W = cv.width = Math.max(1, Math.round(window.innerWidth * K));
    H = cv.height = Math.max(1, Math.round(window.innerHeight * K));
  }
  function draw(t) {
    var s = t / 1000, D = Math.max(W, H), sy = (window.__flowScroll ? window.__flowScroll() : 0) * K;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round';
    for (var i = 0; i < planes.length; i++) {
      var P = planes[i], a1 = s * TAU / P.per + P.ph;
      var rot = P.rot + 0.10 * Math.sin(a1), cs = Math.cos(rot), sn = Math.sin(rot);
      var cx = P.cx * W + D * 0.035 * Math.sin(a1 * 0.7 + 1), cy = P.cy * H + D * 0.030 * Math.cos(a1 * 0.9) - sy * (0.03 + 0.02 * i);
      var hw = P.w * D * 0.5, hh = P.h * D * 0.5, bend = 0.10 * Math.sin(a1 * 1.3 + i);
      // четыре угла; верхняя кромка — освещённая, лист слегка «гнётся»
      var local = [[-hw, -hh * (1 + bend)], [hw, -hh * (1 - bend)], [hw * (1 - bend * 0.6), hh], [-hw * (1 + bend * 0.6), hh]];
      var pts = local.map(function (p) { return [cx + p[0] * cs - p[1] * sn, cy + p[0] * sn + p[1] * cs]; });
      var top = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2], bot = [(pts[2][0] + pts[3][0]) / 2, (pts[2][1] + pts[3][1]) / 2];
      var power = 0.85 + 0.15 * Math.sin(a1 * 0.5 + i * 1.3);
      var g = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
      g.addColorStop(0, 'rgba(' + P.col + ',' + (P.a * power).toFixed(4) + ')');
      g.addColorStop(0.5, 'rgba(' + P.col + ',' + (P.a * power * 0.30).toFixed(4) + ')');
      g.addColorStop(1, 'rgba(' + P.col + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[2][0], pts[2][1]); ctx.lineTo(pts[3][0], pts[3][1]); ctx.closePath(); ctx.fill();
      // освещённая кромка: тонкая линия, гаснущая к краям
      var e = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[1][0], pts[1][1]);
      e.addColorStop(0, 'rgba(' + P.col + ',0)'); e.addColorStop(0.5, 'rgba(' + P.col + ',' + Math.min(0.6, P.a * 3.4 * power).toFixed(3) + ')'); e.addColorStop(1, 'rgba(' + P.col + ',0)');
      ctx.strokeStyle = e; ctx.lineWidth = Math.max(1, K * 1.1);
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  (window.TribunaBackgrounds = window.TribunaBackgrounds || []).push({
    name: 'planes',
    title: 'Плоскости',
    note: 'Большие листы света с чёткой кромкой: медленно поворачиваются, на перекрытиях свет складывается.',
    start: function (canvas) { cv = canvas; ctx = cv.getContext('2d'); size(); },
    stop: function () { if (ctx) ctx.clearRect(0, 0, W, H); ctx = null; cv = null; },
    resize: function () { if (cv) size(); },
    frame: function (t) { if (ctx) draw(t); }
  });
})();
