/* Issue 04: dated, isolated renderer. Published editions keep their renderers. */
(() => {
 const date='2026-10-14', h=x=>escapeHTML(x), own=a=>a?.editionId===date;
 const drawings={
  "footprint": [
    "M67 48Q35 53 45 84T57 131Q62 159 90 147T105 107Q111 67 88 55",
    "M52 32Q42 11 34 28T52 32",
    "M67 24Q61 6 55 18T67 24",
    "M83 23Q80 5 72 16T83 23",
    "M99 32Q104 11 93 16T99 32",
    "M115 44Q129 30 119 27T115 44",
    "M24 155Q84 168 141 139L128 158M141 139L121 140"
  ],
  "signs": [
    "M85 17L88 159",
    "M22 34L125 31 148 52 127 70 24 73Z",
    "M150 87L46 91 25 111 48 130 151 127Z",
    "M46 51L110 49M106 41L116 50 108 59",
    "M126 109L65 110M69 100L59 111 69 119"
  ],
  "paper": [
    "M29 29L138 24 143 148 28 153Z",
    "M31 42L13 44 19 147Q22 159 34 152",
    "M44 48L119 45M44 63L120 60",
    "M46 80L75 80 75 112 44 114Z",
    "M89 80L125 79M90 96L125 94M90 111L125 110M45 130L125 127"
  ],
  "flag": [
    "M40 158L38 20M30 160L51 158",
    "M41 29Q77 11 103 30T151 29L149 105Q122 121 97 104T40 104",
    "M66 54L77 47 77 84M95 52Q121 37 122 56Q122 67 99 82L125 84",
    "M17 21L11 13M53 11L56 5"
  ],
  "rackets": [
    "M61 25Q23 15 16 59T53 114Q86 114 96 70T61 25Z",
    "M45 113L36 151 55 157 66 114",
    "M123 43Q98 42 99 75T125 111Q154 107 151 76T123 43Z",
    "M120 112L125 154 145 149 137 109",
    "M27 48Q46 29 67 39M112 60L138 90M111 83L133 57"
  ],
  "ice": [
    "M17 60L106 57 116 86 149 93 151 125 18 124Z",
    "M33 60L37 37 99 36 105 57",
    "M36 125Q22 144 42 152T59 126M117 125Q105 144 125 150T139 125",
    "M17 95L94 93M116 87L114 68 137 69 143 91",
    "M11 162L156 157M152 115L167 116 166 140 148 141"
  ]
};
 const svg=key=>`<svg class="es-drawing nv-sketch" viewBox="0 0 180 180" aria-hidden="true" focusable="false" fill="none">${drawings[key].map((d,i)=>`<path d="${d}" pathLength="1" style="--es-delay:${i*60}ms"/>`).join('')}</svg>`;
 const note=(a,where)=>`<div class="es-note nv-note" data-es-reveal="${date}-${a.id}-${where}" aria-hidden="true">${svg(a.sketch)}<span>${h(a.sketchNote)}</span></div>`;
 const credit=a=>a.imageSource?`<a href="${h(a.imageSource)}" target="_blank" rel="noopener">Источник ↗</a>${a.imageLicenseUrl?` · <a href="${h(a.imageLicenseUrl)}" target="_blank" rel="noopener">${h(a.imageLicense)} ↗</a>`:''}`:'';
 const label=a=>h(a.imageLabel)+(a.imageKind==='photo'?` ${credit(a)}`:'');
 const plate=a=>`<figure class="nv-plate"><a href="/article/${a.id}/"><img src="${assetUrl(a.image)}" width="${a.imageWidth}" height="${a.imageHeight}" style="aspect-ratio:${a.imageWidth}/${a.imageHeight}" loading="lazy" alt="${h(a.alt)}"></a><figcaption>${label(a)}</figcaption></figure>`;
 const oldPlate=journalPlate;
 journalPlate=(a,context='card')=>own(a)?plate(a):oldPlate(a,context);
 const card=a=>`<article class="nv-card nv-card-${a.sketch}"><span class="nv-kicker">${h(a.format)}</span>${plate(a)}<h2><a href="/article/${a.id}/">${h(a.title)}</a></h2><p>${h(a.description.split('. ')[0])}.</p>${editorialRead(a)}${['footprint','paper','ice'].includes(a.sketch)?note(a,'card'):''}</article>`;
 for(const type of ['cover','feature','poster','quote','number']){const old=editorialFormats[type];editorialFormats[type]=(item,a)=>own(a)?card(a):old(item,a);}
 const divider=`<aside class="es-intermission wrap nv-intermission" id="journal-sketch-break" aria-labelledby="es-break-title" data-es-reveal="${date}-divider"><div class="es-break-copy"><span class="es-eyebrow">На полях «Трибуны» / 14 октября</span><h2 id="es-break-title">ВИДЕТЬ<br>ИГРУ.</h2><a href="/#journal-previous-issue">Предыдущий выпуск <span aria-hidden="true">↘</span></a></div><div class="nv-divider-art" aria-hidden="true"><div>${svg('footprint')}${svg('flag')}${svg('ice')}</div><svg class="es-drawing nv-stroke" viewBox="0 0 800 85" fill="none"><path d="M12 56Q228 4 420 45T778 42L750 19M778 42L752 68" pathLength="1"/></svg><span>За каждым знаком — чья-то работа.</span></div></aside>`;
 const stream=renderEditorialStream;renderEditorialStream=()=>stream().replace(/<aside\b[^>]*id="journal-sketch-break"[\s\S]*?<\/aside>/,divider);
 const home=editorialHome;editorialHome=()=>home().replace(/ВЫПУСК № 03 \/ 2026/g,'ВЫПУСК № 04 / 2026');
 const intro=(a,k,title,p)=>`<div><span class="nv-kicker">${k}</span><h2>${title}</h2><p>${p}</p>${note(a,'inside')}</div>`;
 function interlude(a){
  if(a.sketch==='footprint')return `<section class="wrap nv-interlude nv-finish">${intro(a,'Два отдельных результата','ОДНО ИМЯ.<br>ДВА ЗОЛОТА.','Два олимпийских марафона. Сравнение времени не уравнивает разные трассы и условия.')}<div class="nv-results"><div><span>Рим / 10.09.1960</span><strong>2:15:16<span>,2</span></strong><p>Босиком</p></div><div><span>Токио / 21.10.1964</span><strong>2:12:11<span>,2</span></strong><p>В обуви</p></div><small>Результаты: World Athletics.</small></div></section>`;
  if(a.sketch==='signs')return `<section class="wrap nv-interlude nv-sign-system">${intro(a,'Прочитать движение','ЧТО НУЖНО<br>ОСТАВИТЬ?','Новые редакционные знаки. Поза, предмет и направление помогают различить действие. Это не копии олимпийской графики.')}<div class="nv-sign-board"><img src="${assetUrl('journal/2026-10-14/signs.svg')}" width="1440" height="960" alt="Слева бег: действие узнаётся по позе. В центре плавание: помогают волны. Справа ракетка и мяч: помогает предмет."><dl><dt>Поза</dt><dd>Показывает действие.</dd><dt>Предмет</dt><dd>Уточняет дисциплину.</dd><dt>Контекст</dt><dd>Подпись снимает сомнение.</dd></dl></div></section>`;
  if(a.sketch==='paper')return `<section class="wrap nv-interlude nv-yellow">${intro(a,'Условная гонка / два дня','ЭТАП И СУММА —<br>РАЗНЫЕ ИТОГИ.','Первый участник потерял двадцать секунд сегодня, но сохранил сорок по сумме. Пример вымышленный; бонусы и штрафы не учитываются.')}<div class="nv-time-table"><table><caption>Время двух участников</caption><thead><tr><th scope="col">Участник</th><th scope="col">День 1</th><th scope="col">День 2</th><th scope="col">Сумма</th></tr></thead><tbody><tr class="nv-leader"><th scope="row">А</th><td>4:00:00</td><td>3:30:20</td><td>7:30:20</td></tr><tr><th scope="row">Б</th><td>4:01:00</td><td>3:30:00</td><td>7:31:00</td></tr></tbody></table><p><b>Сегодня: Б.</b><br>По сумме: А, преимущество 40 секунд.</p></div></section>`;
  if(a.sketch==='flag')return `<section class="wrap nv-interlude nv-twelve">${intro(a,'Одиннадцать на поле','ДВЕНАДЦАТЫЙ —<br>НА ТРИБУНЕ.','Условное объяснение клубного символа. Точки не изображают расстановку игроков или дополнительного участника на поле.')}<div class="nv-crowd"><div class="nv-eleven" aria-label="Одиннадцать игроков">${Array.from({length:11},()=>'<i aria-hidden="true"></i>').join('')}</div><span class="nv-plus" aria-hidden="true">+</span><div class="nv-twelfth"><b>12</b><span>Трибуна</span></div></div></section>`;
  if(a.sketch==='rackets')return `<section class="wrap nv-interlude">${intro(a,'Палитра с 1 октября 2021','ПОВЕРНУТЬ<br>В ЛАДОНИ.','Одна сторона чёрная. Для другой появились дополнительные одобренные цвета. Выбор ниже меняет только рисунок; свойства накладки он не моделирует.')}<div class="nv-paddle-box"><svg viewBox="0 0 300 360" role="img" aria-label="Чёрная сторона ракетки" data-nv-paddle><rect x="130" y="220" width="40" height="120" rx="6" fill="#c4a879" stroke="#1d211d" stroke-width="3"/><ellipse cx="150" cy="140" rx="99" ry="120" fill="#1d211d" stroke="#c4a879" stroke-width="5" data-nv-rubber/></svg><button type="button" data-nv-flip aria-pressed="false">Перевернуть ракетку ↻</button><label for="nv-colour">Цвет второй стороны</label><select id="nv-colour"><option value="#df3027">Красный</option><option value="#d8478b">Розовый</option><option value="#794294">Фиолетовый</option><option value="#318c4a">Зелёный</option><option value="#2671a8">Синий</option></select><p data-nv-face aria-live="polite">Сейчас видна чёрная сторона.</p></div></section>`;
  return `<section class="wrap nv-interlude">${intro(a,'Последовательность работы','СНАЧАЛА УБРАТЬ.<br>ПОТОМ ВОССТАНОВИТЬ.','Четыре этапа общего принципа. Узлы конкретных машин могут быть устроены иначе.')}<div class="nv-ice-panel"><ol class="nv-steps" aria-label="Этапы восстановления льда">${['Снять','Собрать','Очистить','Нанести воду'].map((t,i)=>`<li><button type="button" data-nv-step="${i}" aria-pressed="${i===0}"><span>0${i+1}</span>${t}</button></li>`).join('')}</ol><svg viewBox="0 0 540 150" role="img" aria-label="Условный разрез: следы коньков, снятый слой, ровная поверхность"><path d="M0 49L30 55 54 48 75 75 91 50 136 53 150 68 161 52H540V145H0Z" fill="#cbdce1"/><path d="M236 30L214 53 320 53" fill="none" stroke="#df3027" stroke-width="7"/><path d="M320 52H540" stroke="#7697a3" stroke-width="4"/><path d="M415 22v19m-8-8 8 8 8-8" fill="none" stroke="#1d211d" stroke-width="3"/></svg><p data-nv-ice-result aria-live="polite">Нож снимает повреждённый верхний слой льда.</p></div></section>`;
 }
 const oldRender=renderJournalFeature;
 renderJournalFeature=function(a){
  if(!own(a))return oldRender(a);
  const nav=`<nav class="jf-contents wrap" aria-label="Главы материала">${a.chapters.map((c,i)=>`<a href="/article/${a.id}/#${c.id}"><span>0${i+1}</span>${h(c.title)}</a>`).join('')}</nav>`;
  const imageCredit=credit(a), imageCaption=a.imageLicense?a.imageCaption.replace(' · '+a.imageLicense+'.','.') :a.imageCaption;
  const sources=`<section class="jf-sources wrap"><details id="feature-sources"><summary>Источники и иллюстрации <span>+</span></summary><div class="jf-source-content"><p>Проверено 16 октября 2026. Наблюдения редакции и условные примеры не являются цитатами или протоколами соревнований.</p><ol>${a.sources.map(s=>`<li><a href="${h(s.url)}" target="_blank" rel="noopener">${h(s.name)} ↗</a><p>${h(s.supports)}</p></li>`).join('')}</ol><p>${h(a.imageCredit)}. ${h(a.imageCaption)} ${imageCredit}</p></div></details><div class="jr-ending"><p>История, к которой<br>можно вернуться.</p><button data-jr-save="${a.id}" aria-pressed="false">Сохранить историю +</button></div></section>`;
  return `<article class="journal-article jf-feature nv-article nv-${a.sketch}" data-journal-article="${a.id}"><div class="jr-progress" aria-hidden="true"><span></span></div><div class="jf-return wrap"><a href="/#journal-stories">← К выпуску</a><span>${h(a.category)}</span></div><header class="jf-hero"><div class="wrap jf-hero-inner"><div class="jf-hero-copy"><p class="jf-kicker">${h(a.kicker)}</p><h1>${a.heroLines.map(x=>`<span>${h(x)}</span>`).join('')}</h1><p class="jf-deck">${h(a.description)}</p>${note(a,'hero')}<p class="jf-byline">Редакция «Трибуны» · Выпуск 14 октября 2026 · ${a.minutes} мин</p><a class="jf-start" href="/article/${a.id}/#chapter-1">Читать историю ↓</a></div><figure class="nv-hero-photo" style="--nv-image-ratio:${a.imageWidth}/${a.imageHeight}">${journalImage(a.image,a.alt,0)}<figcaption>${h(imageCaption)} ${imageCredit}</figcaption></figure></div></header>${nav}<div class="wrap jf-reading">${a.chapters.slice(0,2).map((c,i)=>journalFeatureChapter(a,c,i)).join('')}</div>${interlude(a)}<div class="wrap jf-reading">${a.chapters.slice(2).map((c,i)=>journalFeatureChapter(a,c,i+2)).join('')}</div>${a.sketch==='footprint'?'':journalFeatureTimeline(a)}${journalFeatureQuote(a)}${sources}</article>${journalRelated(a)}`;
 };
 const refresh=refreshJournal;refreshJournal=function(){refresh();const el=document.querySelector('[data-journal-article]'),a=articleById(el?.dataset.journalArticle);if(own(a))journalGalleryItems=[[a.image,a.imageCaption]];};
 const colours={'#df3027':'красная','#d8478b':'розовая','#794294':'фиолетовая','#318c4a':'зелёная','#2671a8':'синяя'};
 function paddle(){const box=document.querySelector('.nv-paddle-box');if(!box)return;const flipped=box.querySelector('[data-nv-flip]').getAttribute('aria-pressed')==='true',colour=box.querySelector('select').value;box.querySelector('[data-nv-rubber]').setAttribute('fill',flipped?colour:'#1d211d');const text=`Сейчас видна ${flipped?colours[colour]:'чёрная'} сторона.`;box.querySelector('[data-nv-paddle]').setAttribute('aria-label',text);box.querySelector('[data-nv-face]').textContent=text;}
 document.addEventListener('change',e=>{if(e.target.id==='nv-colour')paddle();});
 document.addEventListener('click',e=>{const flip=e.target.closest('[data-nv-flip]');if(flip){flip.setAttribute('aria-pressed',String(flip.getAttribute('aria-pressed')!=='true'));paddle();}const step=e.target.closest('[data-nv-step]');if(step){const panel=step.closest('.nv-ice-panel');panel.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===step)));panel.querySelector('[data-nv-ice-result]').textContent=['Нож снимает повреждённый верхний слой льда.','Снятая ледяная стружка собирается в ёмкость для снега.','Поверхность очищается от оставшихся загрязнений и частиц.','Тонкая водяная плёнка распределяется по поверхности и замерзает.'][Number(step.dataset.nvStep)];}});
})();
