/* Approved stadium masthead, shared by previews and production. */
(() => {
  const header = document.querySelector('.stadium-masthead');
  if (!header) return;

  const crowd = header.querySelector('.stadium-crowd');
  const wordmark = header.querySelector('.stadium-wordmark svg');
  const contour = header.querySelector('.stadium-stand-contour');
  function alignStandContour() {
    const box = crowd.getBoundingClientRect();
    const svgMatrix = wordmark.getScreenCTM();
    if (!box.width || !box.height || !svgMatrix) return;
    const sourceWidth = Number(crowd.getAttribute('width'));
    const sourceHeight = Number(crowd.getAttribute('height'));
    const scale = Math.max(box.width / sourceWidth, box.height / sourceHeight);
    const [positionX, positionY] = getComputedStyle(crowd).objectPosition
      .split(' ').map(value => parseFloat(value) / 100);
    const x = box.left + (box.width - sourceWidth * scale) * positionX;
    const y = box.top + (box.height - sourceHeight * scale) * positionY;
    // Map the photograph's cover crop into the SVG's letterboxed viewBox.
    // Both layers keep their existing desktop/mobile layout and share one contour.
    const matrix = svgMatrix.inverse().translate(x, y).scale(scale);
    contour.setAttribute('transform', `matrix(${[matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f].join(' ')})`);
    header.classList.add('stadium-contour-ready');
  }
  const contourObserver = new ResizeObserver(alignStandContour);
  contourObserver.observe(crowd);
  contourObserver.observe(wordmark);
  crowd.addEventListener('load', alignStandContour);
  alignStandContour();

  const telegram = window.TRIBUNA_CONFIG?.contacts?.telegram?.trim();
  if (telegram && /^@?[a-z\d_]{5,32}$/i.test(telegram)) {
    const link = header.querySelector('.stadium-telegram');
    link.href = 'https://t.me/' + telegram.replace(/^@/, '');
    link.hidden = false;
  }
  function syncTopics() {
    const current = decodeURIComponent(__demo.pathname).replace(/\/$/, '');
    header.querySelectorAll('.stadium-topics a').forEach(link => {
      if (decodeURIComponent(__demo.strip(new URL(link.href).pathname)).replace(/\/$/, '') === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
  new MutationObserver(syncTopics).observe(document.getElementById('content') || document.getElementById('page'), { childList: true });
  window.addEventListener('popstate', syncTopics);
  syncTopics();
})();
