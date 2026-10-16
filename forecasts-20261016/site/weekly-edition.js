/* Dated editorial layer. No publishing, tracking or remote requests. */
(() => {
  const date='2026-09-23';
  const isWeekly=a=>a?.editionId===date;
  const drawings={
    lace:['M23 28Q84 6 140 42L145 104Q88 131 25 107Z','M43 44L111 60 47 70 114 83 50 94','M71 33Q30-1 28 18Q26 34 71 33Q120-4 131 16Q137 30 71 33','M71 33Q57 66 35 149M76 34Q90 113 158 131'],
    screen:['M17 47Q83 39 145 45L150 139Q79 147 19 140Z','M26 58H135V124H28Z','M57 11L84 43 113 9','M66 79C83 64 106 77 102 95S74 115 64 99 57 85 66 79Z','M64 78Q87 85 65 101M89 74Q79 92 102 96'],
    cards:['M18 34L90 17 114 114 43 133Z','M82 61L153 74 137 165 69 151Z','M111 12L115 1M142 34L157 26M19 157L6 168'],
    pave:['M20 55L91 27 158 49 87 83Z','M20 55L27 117 89 149 87 83M89 149L152 116 158 49','M39 64L106 36M62 74L132 42M51 44L117 71M73 36L142 60','M45 91L67 103M108 106L134 95'],
    arc:['M23 133V73H151V131','M12 154Q62 123 70 49Q86 7 120 35T158 87','M141 78L159 88 168 67','M43 58L45 41M11 59L2 51'],
    route:['M16 29H103Q153 29 147 63T70 99H38Q15 101 24 132T97 156H148','M13 17V44M153 140V170','M46 27L61 31M79 29L93 29M111 95L101 97M53 155L68 158','M46 67L61 62 68 79']
  };
  const svg=kind=>`<svg class="es-drawing we-sketch" viewBox="0 0 180 180" aria-hidden="true" focusable="false" fill="none">${drawings[kind].map((d,i)=>`<path d="${d}" pathLength="1" style="--es-delay:${i*70}ms"/>`).join('')}</svg>`;
  const note=(a,context)=>`<div class="es-note we-note we-note-${context}" data-es-reveal="${date}-${a.id}-${context}" aria-hidden="true">${svg(a.sketch)}<span>${escapeHTML(a.sketchNote)}</span></div>`;
  const plate=(a,context='card')=>`<figure class="we-plate we-plate-${context}"><a href="/article/${a.id}" aria-label="${escapeHTML(a.title)}"><img src="${assetUrl(a.image)}" alt="${escapeHTML(a.alt)}" width="900" height="1200" loading="lazy"><span aria-hidden="true">↗</span></a><figcaption>${a.image.endsWith('.svg')?'Графика редакции':'Предметная AI-иллюстрация'}</figcaption></figure>`;
  const originalPlate=journalPlate;
  journalPlate=(a,context)=>isWeekly(a)?plate(a,context):originalPlate(a,context);
  const oldCover=editorialFormats.cover;
  editorialFormats.cover=(item,a)=>isWeekly(a)?`<article class="we-cover"><a href="/article/${a.id}"><span class="we-card-rubric">Стиль и вещи / 02</span><h2>КЕДЫ<br>ПОСЛЕ СИРЕНЫ.</h2><img src="${assetUrl(a.image)}" alt="${escapeHTML(a.alt)}" width="1086" height="1448"><span class="we-cover-foot">Вторая жизнь All Star <b aria-hidden="true">↗</b></span></a>${note(a,'card')}</article>`:oldCover(item,a);
  const oldFeature=editorialFormats.feature;
  editorialFormats.feature=(item,a)=>{
    const html=oldFeature(item,a);
    return isWeekly(a)?html.replace('</figure>',`</figure>${note(a,'card')}`):html;
  };
  for(const type of ['poster','quote','number']){
    const old=editorialFormats[type];
    editorialFormats[type]=(item,a)=>isWeekly(a)?`<article class="we-graphic-card we-graphic-${a.sketch}">${editorialRubric(a)}<h2><a href="/article/${a.id}">${a.heroLines.map(escapeHTML).join('<br>')}</a></h2>${plate(a)}<p>${escapeHTML(a.description)}</p>${editorialRead(a)}</article>`:old(item,a);
  }
  const divider=`<aside class="es-intermission wrap we-intermission" id="journal-sketch-break" aria-labelledby="es-break-title" data-es-reveal="${date}-divider"><div class="es-break-copy"><span class="es-eyebrow">На полях «Трибуны» / Выпуск 02</span><h2 id="es-break-title">МАЛЕНЬКАЯ ВЕЩЬ.<br>БОЛЬШАЯ ИГРА.</h2><a href="/#journal-next-part">Листаем дальше <span aria-hidden="true">↘</span></a></div><div class="we-divider-art" aria-hidden="true">${svg('lace')}${svg('cards')}${svg('route')}<span>Всё начинается<br>с детали.</span></div></aside>`;
  const oldStream=renderEditorialStream;
  renderEditorialStream=function(){return oldStream().replace(/<aside class="es-intermission wrap"[\s\S]*?<\/aside>/,divider);};
  const oldHome=editorialHome;
  editorialHome=()=>oldHome().replace('ВЫПУСК № 01 / 2026','ВЫПУСК № 02 / 2026');

  function interlude(a){
    if(a.sketch==='screen')return `<section class="we-interactive wrap" aria-labelledby="we-look-title"><div><span>Посмотреть на предмет</span><h2 id="we-look-title">ЦВЕТ<br>МЕНЯЕТ КАДР.</h2><p>Переключите условный мяч. Это иллюстрация различия цветов, не проверка видимости в реальных условиях.</p><div class="we-buttons" role="group" aria-label="Цвет мяча"><button data-we-color="white" aria-pressed="true">Белый</button><button data-we-color="yellow" aria-pressed="false">Жёлтый</button></div></div><div class="we-court" data-we-court="white" role="img" aria-label="Условный белый мяч на синем корте"><div class="we-tennis-ball"></div><span class="we-court-label">Белый</span></div></section>`;
    if(a.sketch==='route')return `<section class="we-interactive wrap"><div><span>Как считают дистанцию</span><h2>ОДНА ТРАССА.<br>ДВА ПУТИ.</h2><p>Кратчайший допустимый маршрут и пример более длинной траектории. Схема условная и не показывает конкретную гонку.</p><div class="we-buttons" role="group" aria-label="Путь на трассе"><button data-we-route="short" aria-pressed="true">Измеритель</button><button data-we-route="runner" aria-pressed="false">Бегун</button></div></div><figure class="we-route" data-we-route-display="short"><svg viewBox="0 0 500 430" role="img" aria-label="Пример двух путей внутри одной дороги"><path d="M25 120H255Q340 120 340 235V285H475" fill="none" stroke="#dedccc" stroke-width="115"/><path class="we-route-short" d="M25 160H230Q293 160 293 215V287Q293 330 355 330H475" fill="none" stroke="#df3027" stroke-width="6"/><path class="we-route-runner" d="M25 101Q125 150 226 95Q376 76 383 214V270Q385 291 475 272" fill="none" stroke="#234d79" stroke-width="6" stroke-dasharray="9 8"/></svg><figcaption aria-live="polite">Красная линия — пример кратчайшего пути внутри границ.</figcaption></figure></section>`;
    if(a.sketch==='cards')return `<section class="we-interactive wrap"><div><span>Знак и значение</span><h2>ВИДНО<br>С ТРИБУНЫ.</h2><p>Карточка сообщает назначенное наказание. Основания решения описаны в правилах отдельно.</p></div><div class="we-card-pair"><div><i aria-hidden="true"></i><h3>Предупреждение</h3><p>Жёлтая карточка</p></div><div><i aria-hidden="true"></i><h3>Удаление</h3><p>Красная карточка</p></div></div></section>`;
    if(a.sketch==='arc')return `<section class="we-result wrap"><div><span>Мехико / 20 октября 1968</span><h2>ВЫСОТА<br>В ПРОТОКОЛЕ.</h2></div><ol>${[['Дик Фосбери','2,24'],['Эд Карутерс','2,22'],['Валентин Гаврилов','2,20']].map(([n,r],i)=>`<li><span>${i+1}</span><b>${n}</b><strong>${r}<small> м</small></strong></li>`).join('')}</ol><p>Источник: Olympedia. Олимпийский финал, мужские прыжки в высоту.</p></section>`;
    return `<section class="we-detail wrap"><figure><img src="${assetUrl(a.image)}" alt="${escapeHTML(a.alt)}" width="1086" height="1448"><figcaption>${escapeHTML(a.imageCaption)}</figcaption></figure><div><span>Рассмотреть деталь</span><h2>${a.sketch==='lace'?'ТКАНЬ.<br>РЕЗИНА.<br>ШНУРОВКА.':'ВЕС.<br>ФАКТУРА.<br>МЕСТО.'}</h2><p>${a.sketch==='lace'?'В спортивном силуэте остаются следы его первой задачи. Город добавляет новые значения.':'Трофей узнаётся по поверхности, которая стала частью испытания.'}</p>${note(a,'detail')}</div></section>`;
  }
  const oldRender=renderJournalFeature;
  renderJournalFeature=function(a){
    if(!isWeekly(a))return oldRender(a);
    const nav=`<nav class="jf-contents wrap" aria-label="Главы материала">${a.chapters.map((c,i)=>`<a href="/article/${a.id}#${c.id}"><span>0${i+1}</span>${escapeHTML(c.title)}</a>`).join('')}</nav>`;
    const sources=`<section class="jf-sources wrap"><details><summary>Источники и иллюстрации <span>+</span></summary><div class="jf-source-content"><p>Проверено 23 сентября 2026. Наблюдения редакции не являются цитатами героев.</p><ol>${a.sources.map(s=>`<li><a href="${escapeHTML(s.url)}" target="_blank" rel="noopener">${escapeHTML(s.name)} ↗</a><p>${escapeHTML(s.supports)}</p></li>`).join('')}</ol><p>${escapeHTML(a.imageCredit)}</p></div></details><div class="jr-ending"><p>История, к которой<br>можно вернуться.</p><button data-jr-save="${a.id}" aria-pressed="false">Сохранить историю +</button></div></section>`;
    return `<article class="journal-article jf-feature we-article we-${a.sketch}" data-journal-article="${a.id}"><div class="jr-progress" aria-hidden="true"><span></span></div><div class="jf-return wrap"><a href="/#journal-stories">← К выпуску</a><span>${escapeHTML(a.editorialCategory)}</span></div><header class="jf-hero"><div class="wrap jf-hero-inner"><div class="jf-hero-copy"><p class="jf-kicker">${escapeHTML(a.kicker)}</p><h1>${a.heroLines.map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</h1><p class="jf-deck">${escapeHTML(a.description)}</p>${note(a,'hero')}<p class="jf-byline">Редакция «Трибуны»<br>23 сентября 2026 · ${a.minutes} мин</p><a class="jf-start" href="/article/${a.id}#${a.chapters[0].id}">Читать историю <span>↓</span></a></div><figure class="we-hero-photo">${journalImage(a.image,a.alt,0)}<figcaption>${escapeHTML(a.imageCaption)}</figcaption></figure></div></header>${nav}<div class="wrap jf-reading">${a.chapters.slice(0,2).map((c,i)=>journalFeatureChapter(a,c,i)).join('')}</div>${interlude(a)}<div class="wrap jf-reading">${a.chapters.slice(2).map((c,i)=>journalFeatureChapter(a,c,i+2)).join('')}</div>${journalFeatureTimeline(a)}${journalFeatureQuote(a)}${sources}</article>${journalRelated(a)}`;
  };
  const oldRefresh=refreshJournal;
  refreshJournal=function(){oldRefresh();const el=document.querySelector('[data-journal-article]');const a=articleById(el?.dataset.journalArticle);if(isWeekly(a))journalGalleryItems=[[a.image,a.imageCaption]];};
  document.addEventListener('click',event=>{
    const b=event.target.closest('[data-we-color],[data-we-route]');if(!b)return;
    const parent=b.closest('.we-interactive');parent.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    if(b.dataset.weColor){const yellow=b.dataset.weColor==='yellow',court=parent.querySelector('[data-we-court]');court.dataset.weCourt=b.dataset.weColor;court.setAttribute('aria-label',`Условный ${yellow?'жёлтый':'белый'} мяч на синем корте`);court.querySelector('span').textContent=yellow?'Жёлтый':'Белый';}
    if(b.dataset.weRoute){const fig=parent.querySelector('[data-we-route-display]');fig.dataset.weRouteDisplay=b.dataset.weRoute;fig.querySelector('figcaption').textContent=b.dataset.weRoute==='short'?'Красная линия — пример кратчайшего пути внутри границ.':'Синяя линия — возможный более длинный путь бегуна.';}
  });
})();
