// Swipeable app screens inside the hero phone. The strip follows the finger and settles on the
// nearest screen (one step per gesture); vertical movement is left to the page (touch-action: pan-y).
// Mouse: drag; trackpad: two-finger horizontal swipe; keyboard: arrows on the phone or the dots.
(function () {
  'use strict';
  var SCREENS = [['journal', 'Журнал'], ['news', 'Новости'], ['matches', 'Матчи'], ['rating', 'Рейтинг'], ['forecasts', 'Прогнозы']];
  var host = document.querySelector('[data-screens]');
  if (!host) return;
  var first = host.querySelector('img'), base = first.getAttribute('src').replace(/[^/]+$/, '');
  var index = Math.max(0, SCREENS.map(function (s) { return s[0] + '.jpg'; }).indexOf(first.getAttribute('src').split('/').pop()));
  var left = document.querySelector('[data-screens-prev] img'), right = document.querySelector('[data-screens-next] img');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var scr = document.createElement('div'); scr.className = 'scr'; scr.tabIndex = 0;
  scr.setAttribute('role', 'group'); scr.setAttribute('aria-roledescription', 'карусель'); scr.setAttribute('aria-label', 'Экраны приложения. Листайте в стороны');
  var track = document.createElement('div'); track.className = 'scr-track'; scr.appendChild(track);
  SCREENS.forEach(function (s) { var img = document.createElement('img'); img.src = base + s[0] + '.jpg'; img.alt = 'Экран раздела «' + s[1] + '»'; img.width = 552; img.height = 1200; img.draggable = false; track.appendChild(img); });
  host.replaceChild(scr, first);
  var nav = document.createElement('div'); nav.className = 'scr-nav';
  var name = document.createElement('p'); name.className = 'scr-name'; name.setAttribute('aria-live', 'polite');
  var dots = SCREENS.map(function (s, i) { var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Показать экран «' + s[1] + '»'); b.appendChild(document.createElement('i')); b.addEventListener('click', function () { go(i); }); nav.appendChild(b); return b; });
  // Dots and the screen name go right under the whole phone block, outside its 3D transforms.
  var block = host.closest('.stage') || host.parentNode;
  block.insertAdjacentElement('afterend', name); block.insertAdjacentElement('afterend', nav);

  function width() { return scr.clientWidth || 1; }
  function place(drag, animate) {
    track.style.transition = animate && !reduce.matches ? 'transform .42s cubic-bezier(.2,.8,.2,1)' : 'none';
    track.style.transform = 'translate3d(' + (-index * width() + drag).toFixed(1) + 'px,0,0)';
  }
  function go(i, quiet) {
    index = Math.max(0, Math.min(SCREENS.length - 1, i));
    dots.forEach(function (d, n) { d.setAttribute('aria-current', n === index ? 'true' : 'false'); });
    name.textContent = SCREENS[index][1];
    // The phones behind show the neighbours, so the block reads as one row of screens.
    if (left) left.src = base + SCREENS[(index + SCREENS.length - 1) % SCREENS.length][0] + '.jpg';
    if (right) right.src = base + SCREENS[(index + 1) % SCREENS.length][0] + '.jpg';
    place(0, !quiet);
  }
  var active = false, lock = null, sx = 0, sy = 0, dx = 0, lastX = 0, lastT = 0, vel = 0;
  scr.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; active = true; holdStart(e); lock = null; dx = vel = 0; sx = lastX = e.clientX; sy = e.clientY; lastT = e.timeStamp; });
  window.addEventListener('pointermove', function (e) {
    if (!active) return;
    if (tilt.grabbed) return; // the body is being turned: the screens stay where they are
    var mx = e.clientX - sx, my = e.clientY - sy;
    if (Math.abs(mx) > 6 || Math.abs(my) > 6) holdCancel();
    if (lock === null && (Math.abs(mx) > 6 || Math.abs(my) > 6)) lock = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
    if (lock !== 'x') return;
    scr.classList.add('dragging');
    var edge = (index === 0 && mx > 0) || (index === SCREENS.length - 1 && mx < 0);
    dx = edge ? mx * 0.3 : mx;
    var dt = e.timeStamp - lastT; if (dt > 0) vel = (e.clientX - lastX) / dt; lastX = e.clientX; lastT = e.timeStamp;
    place(dx, false);
  });
  function end() {
    if (!active) return; active = false; scr.classList.remove('dragging'); holdCancel();
    if (tilt.grabbed) { place(0, true); return; }
    var step = 0;
    if (lock === 'x') { if (Math.abs(dx) > width() * 0.22 || Math.abs(vel) > 0.35) step = dx < 0 ? 1 : -1; }
    go(index + step);
  }
  window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  var wheelLock = 0;
  scr.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) return; // vertical wheel belongs to the page
    e.preventDefault();
    if (e.timeStamp < wheelLock) return; wheelLock = e.timeStamp + 420;
    go(index + (e.deltaX > 0 ? 1 : -1));
  }, { passive: false });
  scr.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); go(index + d); } });
  window.addEventListener('resize', function () { place(0, false); });
  go(index, true);

  /* ---------- turning the phone body ----------
     Grab the frame (or a phone behind) and drag: the body turns after the pointer in 3D and eases back
     on release. On the screen itself a short swipe still turns the pages; holding the screen for a
     moment grabs the body instead. The turn uses the separate CSS `rotate` property, so the page's
     scroll-driven `transform` is never overwritten. Vertical swipes stay with the page. */
  var tilt = { el: null, grabbed: false, id: null, sx: 0, sy: 0, rx: 0, ry: 0, raf: 0, pending: null };
  var holdTimer = 0;
  function setTilt(el, rx, ry) {
    var a = Math.sqrt(rx * rx + ry * ry);
    el.style.rotate = a < 0.05 ? '' : (rx / a).toFixed(4) + ' ' + (ry / a).toFixed(4) + ' 0 ' + a.toFixed(2) + 'deg';
    el.dataset.tilt = a < 0.05 ? '0' : rx.toFixed(1) + ',' + ry.toFixed(1);
  }
  function release() {
    var el = tilt.el; if (!el) return;
    tilt.grabbed = false; tilt.pending = null; el.classList.remove('grabbed'); hint.classList.remove('on');
    if (tilt.id !== null) { try { el.releasePointerCapture(tilt.id); } catch (x) { /* already released */ } tilt.id = null; }
    cancelAnimationFrame(tilt.raf);
    if (reduce.matches) { tilt.rx = tilt.ry = 0; setTilt(el, 0, 0); return; }
    var vx = 0, vy = 0, last = performance.now();
    (function back(now) { // a soft spring home
      var dt = Math.min(0.032, Math.max(0, (now - last) / 1000)); last = now;
      vx += (-170 * tilt.rx - 16 * vx) * dt; vy += (-170 * tilt.ry - 16 * vy) * dt; tilt.rx += vx * dt; tilt.ry += vy * dt;
      if (Math.abs(tilt.rx) < 0.05 && Math.abs(tilt.ry) < 0.05 && Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5) { tilt.rx = tilt.ry = 0; setTilt(el, 0, 0); return; }
      setTilt(el, tilt.rx, tilt.ry); tilt.raf = requestAnimationFrame(back);
    })(last);
  }
  function grab(el, e) {
    if (tilt.el && tilt.el !== el) { cancelAnimationFrame(tilt.raf); tilt.rx = tilt.ry = 0; setTilt(tilt.el, 0, 0); }
    cancelAnimationFrame(tilt.raf);
    tilt.el = el; tilt.grabbed = true; tilt.id = e.pointerId; tilt.sx = e.clientX - tilt.ry / 0.34; tilt.sy = e.clientY + tilt.rx / 0.3;
    el.classList.add('grabbed'); hint.classList.add('on');
    try { el.setPointerCapture(e.pointerId); } catch (x) { /* pointer gone */ } // capture only once the body is really grabbed
  }
  function turn(e) {
    if (!tilt.grabbed) return;
    var k = reduce.matches ? 0.5 : 1;
    tilt.ry = Math.max(-40, Math.min(40, (e.clientX - tilt.sx) * 0.34)) * k;
    tilt.rx = Math.max(-30, Math.min(30, -(e.clientY - tilt.sy) * 0.3)) * k;
    setTilt(tilt.el, tilt.rx, tilt.ry);
  }
  function holdStart(e) { holdCancel(); var ev = { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY }; holdTimer = setTimeout(function () { holdTimer = 0; if (active) grab(host, ev); }, 380); }
  function holdCancel() { if (holdTimer) { clearTimeout(holdTimer); holdTimer = 0; } }
  var hint = document.createElement('p'); hint.className = 'scr-hint'; hint.textContent = 'Телефон можно повернуть: потяните за корпус или удержите экран';
  name.insertAdjacentElement('afterend', hint);
  var stageEl = host.closest('.stage');
  if (stageEl && getComputedStyle(stageEl).perspective === 'none') stageEl.style.perspective = '1300px';
  [host, document.querySelector('[data-screens-prev]'), document.querySelector('[data-screens-next]')].forEach(function (el) {
    if (!el) return;
    el.classList.add('tiltable');
    // A picture must not start the browser's own drag instead of ours.
    el.addEventListener('dragstart', function (e) { e.preventDefault(); });
    Array.prototype.forEach.call(el.querySelectorAll('img'), function (i) { i.draggable = false; });
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (el === host && e.target.closest && e.target.closest('.scr')) return; // the screen: swipe or hold, handled above
      // Intent first: nothing is captured until the pointer has moved sideways (or at all, for a mouse).
      tilt.pending = { el: el, id: e.pointerId, x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse' };
    });
  });
  window.addEventListener('pointermove', function (e) {
    var w = tilt.pending;
    if (w && e.pointerId === w.id && !tilt.grabbed) {
      var mx = Math.abs(e.clientX - w.x), my = Math.abs(e.clientY - w.y);
      if (mx > 5 || my > 5) { if (w.mouse || mx >= my) grab(w.el, { pointerId: w.id, clientX: w.x, clientY: w.y }); tilt.pending = null; } // a vertical touch belongs to the page
    }
    turn(e);
  });
  window.addEventListener('pointerup', function () { tilt.pending = null; if (tilt.grabbed) release(); });
  window.addEventListener('pointercancel', function () { tilt.pending = null; if (tilt.grabbed) release(); });
  // Once the body is grabbed by holding the screen, the page must not start scrolling under the finger.
  host.addEventListener('touchmove', function (e) { if (tilt.grabbed && e.cancelable) e.preventDefault(); }, { passive: false });
  host.addEventListener('contextmenu', function (e) { if (tilt.grabbed || holdTimer) e.preventDefault(); });

  window.__screens = { index: function () { return index; }, go: go, tilt: function () { return { grabbed: tilt.grabbed, rx: tilt.rx, ry: tilt.ry }; } };
})();
