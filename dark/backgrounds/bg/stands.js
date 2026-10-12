// 2. «Трибуны» — чаша стадиона изнутри: сорок рядов кресел уходят вверх и вдаль, сектора разделены проходами.
// Глубину дают перспектива (дальние ряды мельче и бледнее) и параллакс (ближние ряды смещаются сильнее).
// По рядам медленно прокатывается лаймовая «волна болельщиков»: кресла на её гребне приподнимаются.
(function () {
  'use strict';
  var cv = null, ctx = null, W = 0, H = 0, K = 1, cssW = 0, cssH = 0;
  var TAU = Math.PI * 2, PI = Math.PI;
  var N = 40, RATIO = 0.955, SECTOR = 0.26, AISLE = 0.024;
  var rows = [];
  function size() {
    K = Math.min(window.devicePixelRatio || 1, 1.5);
    cssW = window.innerWidth; cssH = window.innerHeight;
    W = cv.width = Math.max(1, Math.round(cssW * K));
    H = cv.height = Math.max(1, Math.round(cssH * K));
    var D = Math.max(cssW, cssH * 0.7), R0 = D * 0.30, span = D * 1.05, norm = 1 - Math.pow(RATIO, N);
    rows = [];
    for (var i = 0; i < N; i++) {
      var tier = i >= 27 ? 2 : i >= 13 ? 1 : 0;
      var R = R0 + span * (1 - Math.pow(RATIO, i)) / norm + tier * D * 0.035;
      var gap = span * Math.pow(RATIO, i) * (1 - RATIO) / norm;
      var n = Math.max(2, Math.floor((SECTOR - AISLE) * R / (gap * 0.66)));
      rows.push({ R: R, gap: gap, n: n, step: (SECTOR - AISLE) / n, depth: i / (N - 1), tier: tier });
    }
  }
  function draw(t) {
    var s = t / 1000, sy = window.__flowScroll ? window.__flowScroll() : 0;
    var D = Math.max(cssW, cssH * 0.7), last = rows[N - 1];
    // сжатие эллипса: верхний ряд уходит за край экрана; на узком экране чаша вытянута, чтобы вверху были видны крупные ряды
    var q = Math.min(2.2, (cssW < cssH ? 1.9 : 1.3) * cssH / last.R);
    var baseX = cssW * 0.64, baseY = cssH * 1.10;
    var swayX = D * 0.014 * Math.sin(s * TAU / 37), swayA = 0.028 * Math.sin(s * TAU / 57);
    // две волны: лаймовая слева направо и слабая встречная
    var w1 = PI * 0.72 + (s / 41 - Math.floor(s / 41)) * PI * 1.56;
    var w2 = PI * 2.28 - ((s + 19) / 67 - Math.floor((s + 19) / 67)) * PI * 1.56;
    ctx.setTransform(K, 0, 0, K, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.globalCompositeOperation = 'source-over';
    // свет поля у подножия трибун
    var px = baseX + swayX, py = baseY - sy * 0.10;
    var pitch = ctx.createRadialGradient(px, py, 0, px, py, rows[0].R * 1.9);
    pitch.addColorStop(0, 'rgba(230,255,87,.20)'); pitch.addColorStop(0.5, 'rgba(120,190,110,.07)'); pitch.addColorStop(1, 'rgba(120,190,110,0)');
    ctx.save(); ctx.translate(px, py); ctx.scale(1, q); ctx.translate(-px, -py);
    ctx.fillStyle = pitch; ctx.fillRect(px - rows[0].R * 2, py - rows[0].R * 2, rows[0].R * 4, rows[0].R * 4); ctx.restore();
    ctx.lineCap = 'butt';
    for (var i = N - 1; i >= 0; i--) {
      var r = rows[i], near = 1 - r.depth;
      var cx = baseX + swayX * near, cy = baseY - sy * (0.10 - 0.07 * r.depth);
      var off = swayA * (0.3 + 0.7 * near);
      var alpha = 0.035 + 0.15 * Math.pow(near, 1.25);
      var ink = r.tier === 1 ? '206,226,196' : '242,243,238';
      var wl1 = w1 - i * 0.006, wl2 = w2 + i * 0.006;
      var seat = r.step * 0.66, thick = r.gap * 0.36 * Math.min(1.2, q);
      // видимый диапазон углов: только верхняя половина эллипса, попадающая в экран
      var first = Math.ceil((PI - off) / SECTOR) - 1, lastS = Math.floor((TAU - off) / SECTOR) + 1;
      var paths = [[], [], [], []];
      for (var sec = first; sec <= lastS; sec++) {
        var a0 = sec * SECTOR + off + AISLE * 0.5, dim = (sec & 1) ? 0 : 1;
        for (var k = 0; k < r.n; k++) {
          var th = a0 + k * r.step;
          if (th < PI + 0.02 || th > TAU - 0.02) continue;
          var d1 = th - wl1, d2 = th - wl2;
          var g = Math.exp(-d1 * d1 / 0.016), g2 = 0.5 * Math.exp(-d2 * d2 / 0.012);
          var R = r.R + (g + g2) * r.gap * 0.32;
          var x1 = cx + R * Math.cos(th), y1 = cy + R * q * Math.sin(th);
          if (x1 < -40 || x1 > cssW + 40 || y1 < -40 || y1 > cssH + 40) continue;
          var x2 = cx + R * Math.cos(th + seat), y2 = cy + R * q * Math.sin(th + seat);
          var bucket = g > 0.6 ? 3 : g > 0.2 ? 2 : dim;
          paths[bucket].push(x1, y1, x2, y2);
        }
      }
      ctx.lineWidth = Math.max(1, thick);
      for (var b = 0; b < 4; b++) {
        var p = paths[b]; if (!p.length) continue;
        ctx.strokeStyle = b === 3 ? 'rgba(230,255,87,' + (0.20 + 0.32 * near).toFixed(3) + ')'
          : b === 2 ? 'rgba(214,240,110,' + (0.10 + 0.16 * near).toFixed(3) + ')'
          : 'rgba(' + ink + ',' + (alpha * (b ? 1 : 0.72)).toFixed(3) + ')';
        ctx.beginPath();
        for (var j = 0; j < p.length; j += 4) { ctx.moveTo(p[j], p[j + 1]); ctx.lineTo(p[j + 2], p[j + 3]); }
        ctx.stroke();
      }
    }
    // кромка козырька над верхним рядом и кромка поля под нижним
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(230,255,87,.20)';
    ctx.beginPath(); ctx.ellipse(baseX, baseY - sy * 0.03, last.R + last.gap * 3, (last.R + last.gap * 3) * q, 0, PI, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(230,255,87,.34)';
    ctx.beginPath(); ctx.ellipse(baseX + swayX, baseY - sy * 0.10, rows[0].R - rows[0].gap * 0.9, (rows[0].R - rows[0].gap * 0.9) * q, 0, PI, TAU); ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  (window.TribunaBackgrounds = window.TribunaBackgrounds || []).push({
    name: 'stands',
    title: 'Трибуны',
    note: 'Чаша стадиона изнутри: ряды кресел с глубиной, по ним катится лаймовая волна болельщиков.',
    start: function (canvas) { cv = canvas; ctx = cv.getContext('2d'); size(); },
    stop: function () { if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); } ctx = null; cv = null; },
    resize: function () { if (cv) size(); },
    frame: function (t) { if (ctx) draw(t); }
  });
})();
