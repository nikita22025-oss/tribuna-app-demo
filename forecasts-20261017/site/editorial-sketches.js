/* Small editorial drawings. Loaded after journal renderers, before app's first render. */
(() => {
  const drawings = {
    shirt: {
      box: '0 0 160 145',
      paths: [
        'M57 23 L40 29 15 54 35 73 45 63 41 123 Q79 133 118 121 L113 62 126 72 145 52 119 28 102 23',
        'M57 23 Q79 50 102 23 M59 25 L67 47 80 38 93 46 100 26',
        'M42 115 Q79 123 117 114 M20 51 L39 67 M122 65 L140 50',
        'M69 61 L70 95 M91 59 Q108 62 94 76 L81 95 103 95',
        'M30 18 L23 11 M45 12 L43 3 M124 17 L133 8'
      ]
    },
    ball: {
      box: '0 0 230 115',
      paths: [
        'M10 87 Q67 13 117 47 Q136 65 121 74 Q107 83 111 62 Q121 25 161 25',
        'M176 12 C194 1 222 15 222 38 C223 63 193 76 175 60 C159 48 159 24 176 12Z',
        'M177 12 Q207 37 175 60 M207 13 Q182 36 211 60',
        'M151 31 L164 26 154 17 M213 4 L219 0 M230 17 L225 19',
        'M11 101 Q52 98 86 102'
      ]
    },
    scarf: {
      box: '0 0 510 170',
      paths: [
        'M32 43 Q136 15 253 39 Q376 62 469 28 L476 87 Q382 123 253 98 Q137 74 36 102Z',
        'M36 52 Q138 27 252 49 Q376 73 470 38 M38 91 Q139 65 254 87 Q380 111 474 76',
        'M87 32 L92 89 M118 27 L122 84 M381 47 L385 106 M415 42 L420 101',
        'M33 48 L16 47 M33 58 L11 60 M34 70 L17 73 M34 81 L11 88 M35 93 L18 104',
        'M470 35 L490 27 M471 45 L498 40 M472 57 L491 57 M474 70 L499 71 M476 81 L494 88',
        'M28 19 L16 7 M52 15 L54 1 M476 111 L487 124 M454 116 L455 133',
        'M151 136 Q223 120 316 138 M171 148 Q235 136 277 144'
      ]
    }
  };
  const svg = kind => {
    const d = drawings[kind];
    return `<svg class="es-drawing es-drawing-${kind}" viewBox="${d.box}" aria-hidden="true" focusable="false" fill="none" xmlns="http://www.w3.org/2000/svg">${d.paths.map((path,i)=>`<path d="${path}" pathLength="1" style="--es-delay:${i*65}ms"/>`).join('')}</svg>`;
  };
  const note = (kind, text, key, context) => `<div class="es-note es-note-${context} es-note-${kind}" data-es-reveal="${key}" aria-hidden="true">${svg(kind)}<span>${text}</span></div>`;

  // Keep the photographs and their credits intact. Marks sit outside the image.
  const originalCover = editorialFormats.cover;
  editorialFormats.cover = (item,a) => {
    const html = originalCover(item,a);
    return a.layout === 'jersey'
      ? html.replace('</article>',`${note('shirt','У каждой вещи<br>своя история.',`card-${a.id}`,'card')}</article>`)
      : html;
  };
  const originalFeature = editorialFormats.feature;
  editorialFormats.feature = (item,a) => {
    const html = originalFeature(item,a);
    return a.layout === 'nadal'
      ? html.replace('</figure>',`</figure>${note('ball','Сначала — пауза.',`card-${a.id}`,'card')}`)
      : html;
  };

  function intermission() {
    return `<aside class="es-intermission wrap" id="journal-sketch-break" aria-labelledby="es-break-title" data-es-reveal="home-scarf">
      <div class="es-break-copy"><span class="es-eyebrow">На полях «Трибуны»</span><h2 id="es-break-title">ЕСТЬ ЗА КОГО<br>БОЛЕТЬ.</h2><a href="/#journal-next-part">Листаем дальше <span aria-hidden="true">↘</span></a></div>
      <div class="es-break-art" aria-hidden="true">${svg('scarf')}<span class="es-scarf-word">свои цвета</span><span class="es-handwritten">Одни цвета.<br>Тысячи историй.</span></div>
    </aside>`;
  }
  // Keep the whole selection in one masonry grid. A full-width break inside
  // the grid would strand space below the shorter columns.
  const originalStream = renderEditorialStream;
  renderEditorialStream = function() {
    const pinned = new Set((window.TRIBUNA_PINNED||[]).slice(0,2).map(a=>a.id));
    const cards = editorialSequence.filter(item=>item.type!=='special' && (!(window.TRIBUNA_PINNED||[]).length||item.type!=='rating') && !pinned.has(item.article));
    if(cards.length<=4) return originalStream();
    liveNativeQueue=0;
    const selection=cards.map(renderEditorialCard).join('');
    const sector=editorialSequence.some(item=>item.type==='special')
      ? renderSpecial().replace('class="special-section"','class="special-section" id="journal-next-part"')
      : '';
    // Fragment links keep the passing spread. Only keyboard reading uses the
    // linear flow; the journal window accounts for sticky travel when linking.
    const linear=editorialKeyboardMode;
    return `<div class="editorial-stage${linear?' is-linear':''}"><div class="editorial-feed"><div class="editorial-masonry wrap">${selection}</div>${intermission()}</div>${sector}</div>`;
  };

  const originalArticle = renderJournalArticle;
  renderJournalArticle = function(a) {
    const html=originalArticle(a);
    if(a.layout!=='jersey') return html;
    return html.replace('<div class="jr-author">',`${note('shirt','Носить.<br>Помнить. Болеть.',`article-${a.id}`,'hero')}<div class="jr-author">`);
  };
  const originalFeatureArticle = renderJournalFeature;
  renderJournalFeature = function(a) {
    const html=originalFeatureArticle(a);
    if(a.layout!=='nadal') return html;
    return html.replace('<p class="jf-byline">',`${note('ball','У игры есть<br>свой ритм.',`article-${a.id}`,'hero')}<p class="jf-byline">`);
  };

  const seen = new Set();
  let observer;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  window.refreshEditorialSketches = function() {
    observer?.disconnect();
    const nodes=document.querySelectorAll('[data-es-reveal]');
    if(!nodes.length) return;
    if(reducedMotion.matches || typeof IntersectionObserver==='undefined') {
      nodes.forEach(node=>node.classList.add('es-visible'));
      return;
    }
    observer = new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      const node=entry.target;
      node.classList.add('es-visible');
      seen.add(node.dataset.esReveal);
      observer.unobserve(node);
    }), {threshold:0.15});
    nodes.forEach(node=>{
      if(seen.has(node.dataset.esReveal)) node.classList.add('es-visible');
      else { node.classList.add('es-ready'); observer.observe(node); }
    });
  };
})();
