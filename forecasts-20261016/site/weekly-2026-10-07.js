/* Issue 03. All overrides are scoped to this issue; earlier renderers stay loaded. */
(() => {
 const date='2026-10-07', h=x=>escapeHTML(x), own=a=>a?.editionId===date;
 const drawings={
  "contracts": [
    "M27 20L130 26 123 148 22 145Z",
    "M46 46L110 50M44 66L107 70M42 88L76 91",
    "M53 129L140 52 153 68 69 143 53 144Z",
    "M136 59L146 74M55 133L66 140"
  ],
  "clock": [
    "M51 17L116 16M82 18L83 33",
    "M40 45Q81 22 126 49T133 127Q95 161 45 137T40 45Z",
    "M85 48L83 91 115 107",
    "M32 26L17 37M137 26L151 38",
    "M58 117Q88 134 116 113"
  ],
  "cup": [
    "M48 24Q87 34 127 22L120 63Q89 94 53 64Z",
    "M57 71L50 145Q84 153 131 143L118 70",
    "M53 92Q86 101 122 91M51 112Q88 123 126 110M50 133Q93 143 128 131",
    "M48 33Q5 18 31 58L52 59M126 31Q169 17 147 58L124 58"
  ],
  "track": [
    "M42 30H122Q162 30 157 84T118 143H45Q8 143 15 83T42 30Z",
    "M48 45H116Q140 45 140 84T113 127H49Q32 127 33 85T48 45Z",
    "M52 60H108Q126 60 124 83T107 109H54Q48 109 47 85T52 60Z",
    "M41 83L146 84M118 9L132 14 122 28"
  ],
  "polo": [
    "M57 28L30 40 11 70 33 88 43 69 39 145 132 142 129 68 148 84 163 66 138 38 112 27",
    "M57 28L75 54 87 40 98 56 112 27M57 28Q84 34 112 27",
    "M87 40L85 91M95 65L96 66M94 78L95 79",
    "M49 127L119 124"
  ],
  "pass": [
    "M19 145V22H146V147M50 23V60H115V24",
    "M71 23V40H95V23",
    "M83 85Q64 110 39 117L61 123M39 117L47 98",
    "M121 100Q139 115 123 128Q106 128 105 116T121 100Z",
    "M113 109L124 116 114 124M131 114L124 116"
  ]
};
 const svg=key=>`<svg class="es-drawing oc-sketch" viewBox="0 0 180 180" aria-hidden="true" focusable="false" fill="none">${drawings[key].map((d,i)=>`<path d="${d}" pathLength="1" style="--es-delay:${i*65}ms"/>`).join('')}</svg>`;
 const note=(a,where)=>`<div class="es-note oc-note" data-es-reveal="${date}-${a.id}-${where}" aria-hidden="true">${svg(a.sketch)}<span>${h(a.sketchNote)}</span></div>`;
 const label=a=>a.image.endsWith('.svg')?'Графика редакции':'AI-иллюстрация редакции';
 const plate=a=>`<figure class="oc-plate"><a href="/article/${a.id}/"><img src="${assetUrl(a.image)}" width="1440" height="960" loading="lazy" alt="${h(a.alt)}"></a><figcaption>${label(a)}</figcaption></figure>`;
 const card=a=>`<article class="oc-card oc-card-${a.sketch}"><span class="oc-kicker">${h(a.format)}</span>${plate(a)}<h2><a href="/article/${a.id}/">${h(a.title)}</a></h2><p>${h(a.description.split('. ')[0])}.</p>${editorialRead(a)}${['contracts','cup','pass'].includes(a.sketch)?note(a,'card'):''}</article>`;
 for(const type of ['cover','feature','poster','quote','number']) { const old=editorialFormats[type]; editorialFormats[type]=(item,a)=>own(a)?card(a):old(item,a); }
 const divider=`<aside class="es-intermission wrap oc-intermission" id="journal-sketch-break" aria-labelledby="es-break-title" data-es-reveal="${date}-divider"><div class="es-break-copy"><span class="es-eyebrow">На полях «Трибуны» / 7 октября</span><h2 id="es-break-title">ИГРА<br>ПРОДОЛЖАЕТСЯ.</h2><a href="/#journal-previous-issue">Предыдущий выпуск <span aria-hidden="true">↘</span></a></div><div class="oc-divider-art" aria-hidden="true">${svg('contracts')}${svg('clock')}${svg('pass')}<span>Одно решение.<br>Другое продолжение.</span></div></aside>`;
 const oldStream=renderEditorialStream;
 renderEditorialStream=()=>oldStream().replace(/<aside\b[^>]*id="journal-sketch-break"[\s\S]*?<\/aside>/,divider);
 const home=editorialHome; editorialHome=()=>home().replace(/ВЫПУСК № 0[12] \/ 2026/g,'ВЫПУСК № 03 / 2026');
 function interlude(a){
  if(a.sketch==='contracts')return `<section class="wrap oc-interlude oc-signatures"><div><span class="oc-kicker">Хьюстон / 23 сентября 1970</span><h2>ОДНА СУММА.<br>ДЕВЯТЬ РЕШЕНИЙ.</h2>${note(a,'inside')}<p>У каждой участницы было собственное имя и собственное решение. Список по Международному залу теннисной славы.</p></div><ol>${['Билли Джин Кинг','Рози Казалс','Нэнси Ричи','Кристи Пиджен','Валери Зигенфусс','Пичес Барткович','Джули Хелдман','Керри Мелвилл Рид','Джуди Тегарт Далтон'].map((n,i)=>`<li><span>0${i+1}</span>${n}</li>`).join('')}</ol></section>`;
  if(a.sketch==='clock')return `<section class="wrap oc-interlude"><div><span class="oc-kicker">Посмотреть на правило</span><h2>СКОЛЬКО<br>ОСТАЛОСЬ?</h2><p>Передвиньте ползунок. Это условный отсчёт одного владения: чем меньше времени, тем ближе обязательное решение.</p>${note(a,'inside')}</div><div class="oc-clock-panel"><output id="oc-time" for="oc-seconds">24</output><label for="oc-seconds">Осталось секунд на атаку</label><input id="oc-seconds" type="range" min="0" max="24" value="24"><p>48 × 60 ÷ (60 + 60) = 24</p><small>Исходный расчёт, не статистика каждого владения.</small></div></section>`;
  if(a.sketch==='cup')return `<section class="wrap oc-interlude"><div><span class="oc-kicker">Как сохраняется память</span><h2>КОЛЬЦО<br>МЕНЯЕТ АДРЕС.</h2><p>Старшее кольцо отправляется в музей. Новый ряд получает место на трофее. Схема показывает принцип, а не точное устройство кубка.</p>${note(a,'inside')}</div><div class="oc-rings" role="img" aria-label="Пять колец трофея; снятое кольцо сохраняется в музее"><span>Музей ← снятое кольцо</span>${Array.from({length:5},(_,i)=>`<i>${i===4?'Новый ряд чемпионов':'История побед'}</i>`).join('')}</div></section>`;
  if(a.sketch==='track')return `<section class="wrap oc-interlude"><div><span class="oc-kicker">Три финала</span><h2>РАЗНАЯ ДЛИНА.<br>ОДИН ИЮЛЬ.</h2><p>Сравнение дистанций. Полосы передают только длину, а не сложность или нагрузку забега. Предварительные старты здесь не показаны.</p>${note(a,'inside')}</div><ol class="oc-distance">${[['20 июля','10 000 м',23.7],['24 июля','5 000 м',11.85],['27 июля','42 195 м',100]].map(([d,n,w])=>`<li><span>${d}</span><b>${n}</b><i style="--distance:${w}%" aria-hidden="true"></i></li>`).join('')}</ol></section>`;
  if(a.sketch==='polo')return `<section class="wrap oc-interlude"><div><span class="oc-kicker">Вещь без эмблемы</span><h2>ТРИ ДЕТАЛИ<br>ДВИЖЕНИЯ.</h2>${note(a,'inside')}</div><dl class="oc-details"><dt>Рукав</dt><dd>Короткий; движение руки становится отправной точкой кроя.</dd><dt>Воротник</dt><dd>Сохраняет узнаваемый силуэт рубашки.</dd><dt>Petit piqué</dt><dd>Хлопковый трикотаж с мелкой рельефной структурой.</dd></dl></section>`;
  return `<section class="wrap oc-interlude"><div><span class="oc-kicker">Обычный намеренный пас ногой</span><h2>КАК ПРИНЯТЬ<br>ПЕРЕДАЧУ?</h2><p>Партнёр отдал мяч вратарю в его штрафную. Исключений и попытки выбить мяч в этом условном эпизоде нет.</p>${note(a,'inside')}</div><div class="oc-rule"><div class="oc-rule-buttons" role="group" aria-label="Способ приёма мяча"><button data-oc-pass="feet" aria-pressed="true">Ногами</button><button data-oc-pass="hands" aria-pressed="false">Руками</button></div><p aria-live="polite" data-oc-result>Игра продолжается. Передавать мяч назад разрешено.</p><small>Правило 12.2 IFAB. Это объяснение типового эпизода, не оценка видеоповтора.</small></div></section>`;
 }
 const oldRender=renderJournalFeature;
 renderJournalFeature=function(a){
  if(!own(a))return oldRender(a);
  const nav=`<nav class="jf-contents wrap" aria-label="Главы материала">${a.chapters.map((c,i)=>`<a href="/article/${a.id}/#${c.id}"><span>0${i+1}</span>${h(c.title)}</a>`).join('')}</nav>`;
  const sources=`<section class="jf-sources wrap"><details id="feature-sources"><summary>Источники и иллюстрации <span>+</span></summary><div class="jf-source-content"><p>Проверено 7 октября 2026. Наблюдения редакции не являются цитатами героев.</p><ol>${a.sources.map(s=>`<li><a href="${h(s.url)}" target="_blank" rel="noopener">${h(s.name)} ↗</a><p>${h(s.supports)}</p></li>`).join('')}</ol><p>${h(a.imageCredit)}. ${h(a.imageCaption)}</p></div></details><div class="jr-ending"><p>История, к которой<br>можно вернуться.</p><button data-jr-save="${a.id}" aria-pressed="false">Сохранить историю +</button></div></section>`;
  return `<article class="journal-article jf-feature oc-article oc-${a.sketch}" data-journal-article="${a.id}"><div class="jr-progress" aria-hidden="true"><span></span></div><div class="jf-return wrap"><a href="/#journal-stories">← К выпуску</a><span>${h(a.category)}</span></div><header class="jf-hero"><div class="wrap jf-hero-inner"><div class="jf-hero-copy"><p class="jf-kicker">${h(a.kicker)}</p><h1>${a.heroLines.map(x=>`<span>${h(x)}</span>`).join('')}</h1><p class="jf-deck">${h(a.description)}</p>${note(a,'hero')}<p class="jf-byline">Редакция «Трибуны» · 7 октября 2026 · ${a.minutes} мин</p><a class="jf-start" href="/article/${a.id}/#chapter-1">Читать историю ↓</a></div><figure class="oc-hero-photo">${journalImage(a.image,a.alt,0)}<figcaption>${label(a)}. ${h(a.imageCaption)}</figcaption></figure></div></header>${nav}<div class="wrap jf-reading">${a.chapters.slice(0,2).map((c,i)=>journalFeatureChapter(a,c,i)).join('')}</div>${interlude(a)}<div class="wrap jf-reading">${a.chapters.slice(2).map((c,i)=>journalFeatureChapter(a,c,i+2)).join('')}</div>${['clock','track'].includes(a.sketch)?'':journalFeatureTimeline(a)}${journalFeatureQuote(a)}${sources}</article>${journalRelated(a)}`;
 };
 const refresh=refreshJournal;
 refreshJournal=function(){refresh();const el=document.querySelector('[data-journal-article]'),a=articleById(el?.dataset.journalArticle);if(own(a))journalGalleryItems=[[a.image,a.imageCaption]];};
 document.addEventListener('input',e=>{if(e.target.id==='oc-seconds')document.getElementById('oc-time').value=e.target.value;});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-oc-pass]');if(!b)return;const box=b.closest('.oc-rule');box.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));box.querySelector('[data-oc-result]').textContent=b.dataset.ocPass==='hands'?'Нарушение: свободный удар сопернику. Это не пенальти.':'Игра продолжается. Передавать мяч назад разрешено.';});
})();
