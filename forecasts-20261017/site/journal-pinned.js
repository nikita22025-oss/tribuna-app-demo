/* Two lead stories: the approved covers open into a complete magazine feature. */
function journalYearCollage(a) {
  return `<div class="cover-collage pj-collage"><img class="collage-base" src="${assetUrl(a.image)}" alt="${escapeHTML(a.alt)}" width="1086" height="1448"><span class="collage-layer collage-layer-one" aria-hidden="true"><img src="${assetUrl(a.photos[0].file)}" alt=""></span><span class="collage-layer collage-layer-two" aria-hidden="true"><img src="${assetUrl(a.photos[1].file)}" alt=""></span><span class="collage-layer collage-layer-three" aria-hidden="true"><img src="${assetUrl(a.image)}" alt=""></span></div>`;
}
const journalPinnedBeforeRefresh=renderPinnedOpening;
renderPinnedOpening=function(){
  const a=articles.find(a=>a.id==='sport-2026');
  const html=journalPinnedBeforeRefresh();
  if(!a?.photos)return html;
  return html.replace(/<div class="cover-collage">[\s\S]*?<\/div>/,journalYearCollage(a));
};
function pinnedArticlePhoto(a,index,className='') {
  const p=a.photos[index];
  const image=journalImage(p.file,p.caption,index).replace('<img ',`<img width="${p.width}" height="${p.height}" `);
  return `<figure class="jf-photo pj-photo ${className}">${image}<figcaption>${journalPhotoCredit(p)}</figcaption></figure>`;
}
function pinnedChapterHeading(c,index){
  return `<header class="pj-chapter-heading"><div class="pj-date"><span>${String(index+1).padStart(2,'0')}</span><div><span>${escapeHTML(c.dateLabel)}</span><small>${escapeHTML(c.place)}</small></div></div><p class="pj-person">${escapeHTML(c.person)}</p><h2>${escapeHTML(c.title)}</h2></header>`;
}
function pinnedProse(a,c){return `<div class="jr-prose">${c.paragraphs.map(p=>`<p>${escapeHTML(p)}</p>`).join('')}${journalChapterSources(a,c)}</div>`;}
function pinnedChronicleVisual(c){
  if(c.visual==='stopwatch')return `<figure class="pj-stopwatch"><div class="pj-stat-top"><span>МИЛАН — КОРТИНА / 2026</span><span>1000 М</span></div><div class="pj-oval" aria-hidden="true"><i></i><i></i><i></i></div><strong>1:06<span>,28</span></strong><p>Первое олимпийское золото.<br>Олимпийский рекорд.</p><figcaption>Джордан Штольц · 11 февраля 2026<br>Конькобежный спорт · 1000 м.</figcaption></figure>`;
  if(c.visual==='bar')return `<figure class="pj-height"><div class="pj-stat-top"><span>УППСАЛА / 2026</span><span>ПРЫЖОК С ШЕСТОМ</span></div><div class="pj-height-number">6,31<small>м</small></div><div class="pj-height-lines" aria-hidden="true"><span>6,31</span><i></i><span>6,30</span><i></i></div><p>Весь прыжок заново.<br>Ради одного сантиметра.</p><figcaption>6,30 м — Токио, 2025 → 6,31 м — Уппсала, 2026.<br>Разница увеличена для наглядности. Схема не в масштабе.</figcaption></figure>`;
  return `<figure class="pj-final"><div class="pj-stat-top"><span>ФИНАЛ / 19.07.2026</span><span>ПОСЛЕ ДОП. ВРЕМЕНИ</span></div><div class="pj-score"><span>ИСПАНИЯ</span><strong>1 : 0</strong><span>АРГЕНТИНА</span></div><div class="pj-goal"><b>106′</b><p>Ферран Торрес.<br>Один гол, который остаётся.</p></div><figcaption>Нью-Йорк / Нью-Джерси · чемпионат мира 2026</figcaption></figure>`;
}
function pinnedYearChapter(a,c,index){
  if(c.photo===0)return `<section class="pj-chapter pj-alcaraz wrap" id="${c.id}">${pinnedChapterHeading(c,index)}<div class="pj-split">${pinnedArticlePhoto(a,0,'pj-portrait')}<div>${pinnedProse(a,c)}<aside class="pj-match-card"><span>ФИНАЛ / AUSTRALIAN OPEN</span><b>2:6 · 6:2 · 6:3 · 7:5</b><p>Алькарас — Джокович<br>Четыре турнира Большого шлема за карьеру.</p></aside></div></div></section>`;
  if(c.photo===1)return `<section class="pj-chapter pj-masters wrap" id="${c.id}">${pinnedChapterHeading(c,index)}<div class="pj-wide-photo">${pinnedArticlePhoto(a,1)}<aside><strong>20</strong><p>Паралимпийских медалей<br>к 7 марта 2026 года.</p><span>В этой главе — новая попытка.<br>На фотографии — другая глава карьеры.</span></aside></div><div class="pj-reading">${pinnedProse(a,c)}</div></section>`;
  return `<section class="pj-chapter pj-chapter-${c.visual} wrap" id="${c.id}">${pinnedChapterHeading(c,index)}<div class="pj-split">${pinnedChronicleVisual(c)}${pinnedProse(a,c)}</div></section>`;
}
function pinnedFansChapter(a,c,index){
  const photo=Number.isInteger(c.photo)?pinnedArticlePhoto(a,c.photo,'pj-landscape'):'';
  const visual=c.visual==='after-whistle'?`<aside class="pj-stay"><span>ПОСЛЕ ФИНАЛЬНОГО СВИСТКА</span><p>ОСТАТЬСЯ.<br><em>Ещё ненадолго.</em></p><div class="pj-seat-rows" aria-hidden="true">${Array.from({length:30},()=>'<i></i>').join('')}</div><a href="${escapeHTML(a.sources.find(s=>s.id==='fifa-video').url)}" target="_blank" rel="noopener">Посмотреть видео FIFA <span>↗</span></a><small>Редакционная иллюстрация трибуны.<br>Документальные кадры — по ссылке.</small></aside>`:'';
  return `<section class="pj-chapter pj-fans-${c.id} wrap" id="${c.id}">${pinnedChapterHeading(c,index)}${photo}<div class="pj-fans-reading">${visual||`<aside class="pj-margin"><b>${index===0?'ВЕРНУТЬ.':'СОБРАТЬСЯ.'}</b><p>${index===0?'Клуб начинается с людей.\nИ обретает адрес.':'89 человек.\nТак начиналась традиция.'}</p></aside>`}${pinnedProse(a,c)}</div></section>`;
}
function renderPinnedJournal(a){
  const year=a.layout==='yearbook';
  const cover=year?journalYearCollage(a):renderStadiumCover(a);
  const caption=year?'AI-обложка + архивные фото: Алькарас, 2025; Мастерс, 2012.':'Художественная AI-обложка. Документальные фотографии — внутри.';
  const nav=a.chapters.map((c,i)=>`<a href="/article/${a.id}#${c.id}"><span>${String(i+1).padStart(2,'0')} / ${escapeHTML(year?c.dateLabel:c.place)}</span><b>${escapeHTML(c.person)}</b></a>`).join('');
  return `<article class="journal-article pj-article pj-${a.layout}" data-journal-article="${a.id}"><div class="jr-progress" aria-hidden="true"><span></span></div><div class="jf-return wrap"><a href="/#journal-stories">← К выпуску</a><span>${escapeHTML(a.editorialCategory)}</span></div><header class="pj-hero wrap"><div class="pj-hero-copy"><p class="pj-kicker">${escapeHTML(a.kicker)}</p><h1>${a.heroLines.map(s=>`<span>${escapeHTML(s)}</span>`).join(' ')}</h1><p class="pj-deck">${escapeHTML(a.description)}</p><div class="pj-byline"><span>Редакция «Трибуны»<br><time datetime="${a.date}">${longDate(a.date)}</time> · ${a.minutes} мин</span><a href="/article/${a.id}#${a.chapters[0].id}" aria-label="Начать чтение">↓</a></div>${year?`<p class="pj-edition-date">${escapeHTML(a.period)}<br>Хроника по состоянию на 16 сентября</p>`:''}</div><figure class="pj-hero-art pj-motion">${cover}<figcaption><span>${caption}</span><a href="/article/${a.id}#feature-sources">Авторы и источники ↗</a></figcaption><button type="button" data-pinned-motion="${year?'collage':'stadium'}" aria-pressed="false">${year?'Остановить коллаж':'Остановить свет'}</button></figure></header><nav class="pj-contents wrap" aria-label="Главы материала">${nav}</nav><section class="pj-intro wrap" aria-label="Вступление"><span>${year?'ПЯТЬ ОСТАНОВОК\nВ ОДНОМ ГОДУ':'НАШЕ МЕСТО\nВ ИГРЕ'}</span><div class="jr-prose">${a.intro.map(p=>`<p>${escapeHTML(p)}</p>`).join('')}</div></section>${a.chapters.map((c,i)=>year?pinnedYearChapter(a,c,i):pinnedFansChapter(a,c,i)).join('')}<section class="pj-ending wrap"><span>${year?'ХРОНИКА ПРОДОЛЖИТСЯ':'ЗРИТЕЛЬ — ТОЖЕ УЧАСТНИК'}</span><p>${escapeHTML(a.ending)}</p></section><div class="pj-cover-credit wrap"><p>${escapeHTML(a.imageCredit)}</p></div>${journalFeatureSources(a)}</article>${journalRelated(a)}`;
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-pinned-motion]');if(!button)return;
  const paused=button.getAttribute('aria-pressed')!=='true',type=button.dataset.pinnedMotion;
  button.setAttribute('aria-pressed',String(paused));
  button.closest('.pj-motion').classList.toggle(type+'-is-paused',paused);
  button.textContent=type==='collage'?(paused?'Продолжить коллаж':'Остановить коллаж'):(paused?'Продолжить свет':'Остановить свет');
});
