/* Four researched features, each with its own visual opening and reading rhythm. */
function journalPhotoCredit(photo) {
  return `<span>${escapeHTML(photo.caption)}</span><span><a href="${escapeHTML(photo.source)}" target="_blank" rel="noopener">${escapeHTML(photo.author)}</a> · <a href="${escapeHTML(photo.licenseUrl)}" target="_blank" rel="noopener">${escapeHTML(photo.license)}</a></span>`;
}
function journalFeaturePhoto(a, index, className = '') {
  const photo = a.photos[index];
  return `<figure class="jf-photo ${className}">${journalImage(photo.file, index===0?a.alt:photo.caption, index)}<figcaption>${journalPhotoCredit(photo)}</figcaption></figure>`;
}
function journalFeatureSources(a) {
  return `<section class="jf-sources wrap" id="feature-sources"><details><summary>Источники и фотографии <span>+</span></summary><div class="jf-source-content"><p>Материал подготовлен по открытым источникам. Факты проверены ${longDate(a.factCheckedAt)}. Авторские наблюдения не являются цитатами героев.</p><ol>${a.sources.map(s=>`<li id="source-${s.id}"><a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.name)} ↗</a></li>`).join('')}</ol>${a.photos?`<div id="photo-credits"><h3>Фотографии</h3>${a.photos.map(p=>`<p>${journalPhotoCredit(p)}</p>`).join('')}<p>Файлы фотографий сохранены без изменений. На обложках показан кадрированный фрагмент; в галерее — полный кадр. Лицензии относятся к соответствующим фотографиям.</p></div>`:`<p>${escapeHTML(a.imageCredit)}</p>`}</div></details><div class="jr-ending"><p>История, к которой<br>можно вернуться.</p><button data-jr-save="${a.id}" aria-pressed="false">Сохранить историю +</button></div></section>`;
}
function journalChapterSources(a, chapter) {
  const links = chapter.sources.map(id=>{
    if(id==='photos') return `<a href="/article/${a.id}#photo-credits">Фотографии и подписи</a>`;
    const source=a.sources.find(s=>s.id===id);
    return source?`<a href="${escapeHTML(source.url)}" target="_blank" rel="noopener">${escapeHTML(source.name)}</a>`:'';
  }).filter(Boolean);
  return links.length?`<p class="jf-chapter-sources">${links.join(' / ')}</p>`:'';
}
function journalFeatureChapter(a,c,index) {
  return `<section class="jf-chapter" id="${c.id}"><div class="jf-chapter-title"><span>${String(index+1).padStart(2,'0')}</span><h2>${escapeHTML(c.title)}</h2></div><div class="jr-prose">${c.paragraphs.map(p=>`<p>${escapeHTML(p)}</p>`).join('')}${journalChapterSources(a,c)}</div></section>`;
}
function journalFeatureTimeline(a) {
  return `<section class="jf-timeline wrap" aria-label="Хронология"><h2>Место во времени</h2><ol>${a.timeline.map(([date,title,text])=>`<li><time>${escapeHTML(date)}</time><h3>${escapeHTML(title)}</h3><p>${escapeHTML(text)}</p></li>`).join('')}</ol></section>`;
}
function journalFeatureQuote(a) {
  return `<aside class="jf-quote wrap"><span>${escapeHTML(a.pullquoteLabel)}</span><p>${escapeHTML(a.pullquote)}</p></aside>`;
}
function journalShootout(a) {
  return `<section class="jf-shootout wrap" aria-labelledby="shootout-title" data-shootout="${a.id}"><div class="jf-shootout-heading"><div><span>Финал ЧМ-2006</span><h2 id="shootout-title">Пройдите серию<br>по ударам.</h2></div><p>Италия — Франция<br><span>Счёт матча: 1:1</span></p></div><div class="jf-shot-display"><div class="jf-shot-score" aria-live="polite" aria-atomic="true"><span>Италия</span><strong data-shot-score>0 : 0</strong><span>Франция</span><p data-shot-caption>Серия ещё не началась. Выберите удар ниже.</p></div><div class="jf-shot-track" role="group" aria-label="Удары в серии">${a.shots.map(([team,name,goal],index)=>`<button type="button" data-shot="${index}" aria-label="Удар ${index+1}: ${name}, ${team}" aria-pressed="false"><span>${index+1}</span><b>${escapeHTML(name)}</b><small>${escapeHTML(team)}</small></button>`).join('')}</div></div><button type="button" class="jf-shot-reset" data-shot-reset>Начать сначала ↺</button><details class="jf-shot-transcript"><summary>Все результаты серии</summary><ol>${a.shots.map(([team,name,goal])=>`<li>${escapeHTML(name)}, ${escapeHTML(team)} — ${goal?'гол':'перекладина'}</li>`).join('')}</ol><p>Италия выигрывает серию 5:3. Источник: протокол RSSSF и отчёт UEFA.</p></details></section>`;
}
function journalNadalNote() {
  return `<figure class="jf-ritual-note"><img src="/tribuna-app-demo/forecasts-20261016/site/assets/journal/nadal-bottles.svg" alt="Красный рисунок двух бутылок у линии корта" width="480" height="270" loading="lazy"><figcaption><strong>У каждой вещи — своё место.</strong><p>Две бутылки у скамейки — одна из деталей знакомого порядка Надаля перед следующим розыгрышем.</p><span>Рисунок редакции к первой главе.</span></figcaption></figure>`;
}
function renderJournalFeature(a) {
  const heading=a.heroLines.map(line=>`<span>${escapeHTML(line)}</span>`).join('');
  const byline=`<p class="jf-byline">Редакция «Трибуны»<br><time datetime="${a.date}">${longDate(a.date)}</time> · ${a.minutes} мин</p>`;
  const heroImage=a.photos?journalFeaturePhoto(a,0,'jf-hero-photo'):`<figure class="jf-hero-photo ${a.layout==='scarf'?'jf-illustration':'jf-diagram'}"><img src="${assetUrl(a.image)}" alt="${escapeHTML(a.alt)}"><figcaption>${escapeHTML(a.imageCaption||'Схема редакции. Расстояние — по IFAB.')}</figcaption></figure>`;
  const deck=a.layout==='nadal'?'Две бутылки, знакомые жесты. Рассматриваем теннис Надаля в паузах между розыгрышами.':a.description;
  const intro=`<div class="jf-hero-copy"><p class="jf-kicker">${escapeHTML(a.kicker)}</p><h1>${heading}</h1><p class="jf-deck">${escapeHTML(deck)}</p>${byline}<a class="jf-start" href="/article/${a.id}#${a.chapters[0].id}">Читать историю <span>↓</span></a></div>`;
  const nav=`<nav class="jf-contents wrap" aria-label="Главы материала">${a.chapters.map((c,i)=>`<a href="/article/${a.id}#${c.id}"><span>${String(i+1).padStart(2,'0')}</span>${escapeHTML(c.title)}</a>`).join('')}</nav>`;
  const split=a.chapters.slice(0,2).map((c,i)=>journalFeatureChapter(a,c,i)+(i===0&&a.layout==='nadal'?journalNadalNote():'')).join('');
  const finish=a.chapters.slice(2).map((c,i)=>journalFeatureChapter(a,c,i+2)).join('');
  const interlude=a.layout==='nadal'?`<section class="jf-nadal-interlude"><div class="wrap"><div><span>Рассмотреть паузу</span><h2>КРУПНЫМ<br>ПЛАНОМ.</h2><p>Тренировка, вода, тейпы на пальцах. Спортивная жизнь между кадрами с кубком.</p></div>${journalFeaturePhoto(a,1)}</div></section>`:a.layout==='penalty'?journalShootout(a):a.layout==='three'?journalThreeExplainer():a.layout==='rondo'?journalRondoExplainer():a.layout==='scarf'?journalScarfDetails(a):journalFeatureTimeline(a);
  return `<article class="journal-article jf-feature jf-${a.layout}" data-journal-article="${a.id}"><div class="jr-progress" aria-hidden="true"><span></span></div><div class="jf-return wrap"><a href="/#journal-stories">← К выпуску</a><span>${escapeHTML(a.editorialCategory)}</span></div><header class="jf-hero"><div class="wrap jf-hero-inner">${intro}${heroImage}</div></header>${nav}<div class="wrap jf-reading">${split}</div>${interlude}<div class="wrap jf-reading">${finish}</div>${journalFeatureQuote(a)}${journalFeatureSources(a)}</article>${journalRelated(a)}`;
}

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-shot],[data-shot-reset]');
  if(!button)return;
  const section=button.closest('[data-shootout]'), a=articleById(section.dataset.shootout);
  const index=button.hasAttribute('data-shot-reset')?-1:Number(button.dataset.shot);
  const score=[0,0];a.shots.slice(0,index+1).forEach(([team,name,goal])=>{if(goal)score[team==='Италия'?0:1]++;});
  section.querySelector('[data-shot-score]').textContent=score.join(' : ');
  const shot=a.shots[index];
  section.querySelector('[data-shot-caption]').textContent=shot?`Удар ${index+1}. ${shot[1]} — ${shot[2]?'гол':'перекладина'}.${index===a.shots.length-1?' Италия — чемпион мира 2006 года.':''}`:'Серия ещё не началась. Выберите удар ниже.';
  section.querySelectorAll('[data-shot]').forEach((node,i)=>{node.setAttribute('aria-pressed',String(i===index));node.classList.toggle('is-played',i<=index);node.classList.toggle('is-miss',i<=index&&!a.shots[i][2]);});
});
