(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  // Появление первого экрана
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('ready'); }); });
  setTimeout(function () { root.classList.add('ready'); }, 600);

  // Появление секций при прокрутке
  var items = [].slice.call(document.querySelectorAll('.rv'));
  var showAll = function () { items.forEach(function (el) { el.classList.add('in'); }); };
  if (reduce || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  // Движение, привязанное к прокрутке: наклон телефона и растущая панель
  var stage = document.querySelector('.stage');
  var grow = document.querySelector('[data-grow]');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var vh = window.innerHeight;
    if (stage) {
      var r = stage.getBoundingClientRect();
      var p = clamp((vh * 0.5 - (r.top + r.height * 0.5)) / (vh * 0.75) + 0.12);
      stage.style.setProperty('--p', p.toFixed(3));
    }
    if (grow) {
      var g = grow.parentNode.getBoundingClientRect();
      grow.style.setProperty('--g', clamp((vh - g.top) / (vh * 0.75)).toFixed(3));
    }
  }
  if (!reduce) {
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  // Лаймовые световые потоки на холсте
  var cv = document.querySelector('.flow');
  var ctx = cv && cv.getContext && cv.getContext('2d');
  if (!ctx) return;
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
    var sy = window.pageYOffset || 0;
    var ph = t * 0.00016 + sy * 0.0011;
    var drift = 0.10 * Math.sin(sy * 0.0013);
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
  size();
  draw(0);
  window.addEventListener('resize', function () { size(); draw(performance.now()); });
  if (reduce) return;
  var last = 0, running = true;
  function loop(t) {
    if (!running) return;
    if (t - last > 32) { last = t; draw(t); }
    requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) requestAnimationFrame(loop);
  });
  requestAnimationFrame(loop);
})();
