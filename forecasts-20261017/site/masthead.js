/* A single stadium wave on entry; replay on mouse hover or keyboard focus. */
(() => {
  const logo = document.querySelector('.masthead-refresh .masthead');
  if (!logo || typeof logo.animate !== 'function') return;
  const letters = [...logo.querySelectorAll('.masthead-letter')];
  const dot = logo.querySelector('.wordmark-dot');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animations = [];
  let lastPlayed = -Infinity;

  function stop() {
    animations.forEach(animation => animation.cancel());
    animations = [];
  }

  function wave() {
    const now = performance.now();
    if (reducedMotion.matches || document.hidden || now - lastPlayed < 1700) return;
    lastPlayed = now;
    stop();
    animations = letters.map((letter, index) => letter.animate([
      { transform: 'translateY(0) rotate(0deg)', offset: 0 },
      { transform: 'translateY(-.045em) rotate(-1.5deg)', offset: .35 },
      { transform: 'translateY(.009em) rotate(.4deg)', offset: .7 },
      { transform: 'translateY(0) rotate(0deg)', offset: 1 }
    ], { duration: 660, delay: index * 72, easing: 'cubic-bezier(.22,.7,.3,1)' }));
    if (dot) animations.push(dot.animate([
      { transform: 'translateY(0) scale(1,1)', offset: 0 },
      { transform: 'translateY(-.19em) scale(.95,1.05)', offset: .38 },
      { transform: 'translateY(0) scale(1.14,.86)', offset: .72 },
      { transform: 'translateY(0) scale(1,1)', offset: 1 }
    ], { duration: 760, delay: 430, easing: 'cubic-bezier(.22,.7,.3,1)' }));
  }

  logo.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') wave();
  });
  logo.addEventListener('focus', wave);
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) stop(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => requestAnimationFrame(wave));
})();
