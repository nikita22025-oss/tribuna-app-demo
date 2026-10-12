// 0. «Потоки» — исходный фон «Трибуны»: лаймовые световые потоки.
// Пучки, size() и draw() перенесены из dark-demos/app/bg.js без изменений (тот же рисунок, цвета и формулы).
// Изменена только обвязка: собственный цикл убран — кадры запрашивает галерея, холст передаётся в start().
(function () {
  'use strict';
  var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var cv = null, ctx = null;
  var frames = 0;
  var W = 0, H = 0;
  var bundles = [
    { y: 0.30, a: 0.20, f: 3.1, v: 1.0, o: 0.0, spread: 0.34, n: 46, hue: 68 },
    { y: 0.58, a: 0.24, f: 2.3, v: -0.7, o: 2.1, spread: 0.30, n: 38, hue: 96 },
    { y: 0.44, a: 0.16, f: 4.2, v: 0.5, o: 4.4, spread: 0.20, n: 26, hue: 150 }
  ];
  function size() {
    var k = Math.min(window.devicePixelRatio || 1, 2) * 0.5;
    W = cv.width = Math.max(1, Math.round(window.innerWidth * k));
    H = cv.height = Math.max(1, Math.round(window.innerHeight * k));
  }
  function draw(t) {
    var sy = reduceQuery.matches ? 0 : (window.__flowScroll ? window.__flowScroll() : 0) || 0;
    var ph = t * 0.00016 + sy * 0.0011;
    var drift = 0.10 * Math.sin(sy * 0.0013);
    frames++;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = Math.max(1, W / 700);
    for (var b = 0; b < bundles.length; b++) {
      var B = bundles[b];
      for (var i = 0; i < B.n; i++) {
        var k = i / (B.n - 1) - 0.5;
        ctx.beginPath();
        for (var j = 0; j <= 40; j++) {
          var s = j / 40;
          var x = (s * 1.3 - 0.15) * W;
          var mid = B.y + drift + B.a * Math.sin(s * B.f + ph * B.v + B.o) + 0.05 * Math.sin(s * 9 + ph * 1.6 + B.o);
          var tw = Math.sin(s * 2.6 + ph * B.v * 0.7 + B.o * 1.7);
          var y = (mid + k * B.spread * tw + 0.012 * Math.sin(i * 1.7 + s * 14 + ph)) * H;
          if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.strokeStyle = 'hsla(' + (B.hue + k * 46) + ',95%,' + (58 + 14 * Math.abs(k)) + '%,' + (0.30 - 0.22 * Math.abs(k)) + ')';
        ctx.stroke();
      }
    }
  }
  (window.TribunaBackgrounds = window.TribunaBackgrounds || []).push({
    name: 'flow',
    title: 'Потоки',
    note: 'Исходный фон: лаймовые световые потоки, как сейчас в приложении и на сайте.',
    start: function (canvas) { cv = canvas; ctx = cv.getContext('2d'); size(); },
    stop: function () { if (ctx) ctx.clearRect(0, 0, W, H); ctx = null; cv = null; },
    resize: function () { if (cv) size(); },
    frame: function (t) { if (ctx) draw(t); }
  });
})();
