/* Art direction belongs to a story, so home, related cards and article agree. */
function journalPlate(a, context='card') {
  const captions={nadal:['Уимблдон / 2017','Фото: si.robi'],wall:['Дортмунд / 2010','Фото: Christopher Neundorf'],rucker:['Гарлем / 2008','Фото: Stefano Brivio'],scarf:['Вещь и память','AI-иллюстрация'],three:['Одна корзина','Схема редакции'],rondo:['Увидеть третьего','Схема редакции'],penalty:['Берлин / 2006','Схема редакции'],jersey:['Форма вне игры','AI-иллюстрация']};
  if(a.layout==='yearbook')captions.yearbook=['Хроника / 2026','AI-коллаж'];
  if(a.layout==='belonging')captions.belonging=['Культура трибун','AI-коллаж'];
  const label=captions[a.layout]||['Трибуна','Иллюстрация'];
  const photo=a.coverIsIllustration?null:a.photos?.[0];
  const credit=photo?`<a href="${escapeHTML(photo.source)}" target="_blank" rel="noopener">${escapeHTML(photo.author)}</a> · <a href="${escapeHTML(photo.licenseUrl)}" target="_blank" rel="noopener">${escapeHTML(photo.license)}</a>`:label[1];
  return `<figure class="jp-plate jp-${a.layout} jp-${context}"><a class="jp-photo" href="/article/${a.id}" aria-label="${escapeHTML(a.title)}"><img src="${assetUrl(a.coverImage||a.image)}" alt="${escapeHTML(a.coverAlt||a.alt||a.title)}" loading="lazy"><span class="jp-photo-arrow" aria-hidden="true">↗</span></a><figcaption><span>${label[0]}</span><span>${credit}</span></figcaption></figure>`;
}
const journalOriginalFeature=editorialFormats.feature;
editorialFormats.feature=(item,a)=>a.journal?`<article class="format-feature jp-feature">${editorialRubric(a)}<h2><a href="/article/${a.id}">${item.title}</a></h2>${journalPlate(a)}<p>${escapeHTML(a.description)}</p>${editorialRead(a)}</article>`:journalOriginalFeature(item,a);
const journalOriginalQuote=editorialFormats.quote;
editorialFormats.quote=(item,a)=>a.layout==='rondo'?`<article class="jp-rondo-card">${editorialRubric(a)}<h2><a href="/article/${a.id}">ШКОЛА<br>ПАСА.</a></h2>${journalPlate(a)}<p>Что передаёт La Masia — от игрока к игроку.</p>${editorialRead(a)}</article>`:journalOriginalQuote(item,a);
const journalOriginalNumber=editorialFormats.number;
editorialFormats.number=(item,a)=>a.layout==='three'?`<article class="jp-three-card">${editorialRubric(a)}<a class="jp-three-title" href="/article/${a.id}"><span>3×3</span><h2>ДРУГАЯ<br>СКОРОСТЬ.</h2></a><div class="jp-three-rules"><span><b>12</b>секунд на атаку</span><span><b>10</b>минут игры</span></div>${journalPlate(a)}${editorialRead(a,'Разобраться в игре')}</article>`:journalOriginalNumber(item,a);
const journalOriginalSpecial=specialSlide;
specialSlide=function(index){
 const s=specialStories[index], a=s&&!s.ad?editorialArticle(s.article):null;
 if(!a?.journal)return journalOriginalSpecial(index);
 return `<article class="special-article jp-special jp-special-${a.layout}">${journalPlate(a,'spread')}<div class="special-copy"><span class="special-label">${s.label}</span><h2><a href="/article/${a.id}">${s.title}</a></h2><p>${s.description}</p><ol class="special-chapters">${s.chapters.map(c=>`<li>${escapeHTML(c)}</li>`).join('')}</ol><a class="special-read" href="/article/${a.id}">Читать историю <span aria-hidden="true">↗</span></a></div></article>`;
};
function journalStoryCard(a,level='h3') {
 return `<article class="story-card jp-story-card">${a.image?journalPlate(a,'related'):''}<a class="category" href="/category/${encodeURIComponent(a.category)}">${escapeHTML(a.category)}</a><${level}><a href="/article/${a.id}">${escapeHTML(a.title)}</a></${level}><p>${escapeHTML(a.description)}</p>${meta(a)}</article>`;
}
function journalScarfDetails(a){
 return `<section class="jf-scarf-detail wrap"><div class="jf-scarf-crop"><img src="${assetUrl(a.image)}" alt="Фактура вымышленного шарфа, AI-иллюстрация"></div><div><span>Рассмотреть вещь</span><h2>ПАМЯТЬ<br>НА ОЩУПЬ.</h2><dl><div><dt>Полосы</dt><dd>Издалека мы сначала видим цвета, а уже потом читаем надпись.</dd></div><div><dt>Петли</dt><dd>Ручная работа сохраняет время, потраченное на одну вещь.</dd></div><div><dt>Бахрома</dt><dd>Мягкий край продолжает движение рук, когда шарф поднят над головой.</dd></div></dl><p class="jf-visual-note">Увеличенный фрагмент AI-иллюстрации. Музейные предметы описаны в тексте и источниках.</p></div></section>`;
}
function journalThreeExplainer(){
 return `<section class="jf-three-explainer wrap" aria-label="Цена броска в 3×3"><figure><img src="${assetUrl('journal/three-court.svg')}" alt="Внутри дуги — одно очко, снаружи — два"></figure><div><span>Посмотреть на правила</span><h2>У БРОСКА<br>ЕСТЬ ЦЕНА.</h2><div class="jf-point-buttons" role="group" aria-label="Ситуация на площадке"><button data-point="1" aria-pressed="true">Внутри дуги</button><button data-point="2" aria-pressed="false">За дугой</button><button data-point="ot" aria-pressed="false">Овертайм</button></div><div class="jf-point-result" aria-live="polite" aria-atomic="true"><strong data-point-number>1</strong><p data-point-copy>Одно очко за попадание изнутри дуги. Штрафной тоже приносит одно очко.</p></div><p class="jf-visual-note">По правилам FIBA. Схема не соблюдает масштаб площадки.</p></div></section>`;
}
function journalRondoExplainer(){
 return `<section class="jf-rondo-explainer wrap" data-rondo-step="0" aria-label="Передача через третьего игрока"><div class="jf-rondo-visual"><svg viewBox="0 0 640 600" role="img" aria-label="Игроки A и B разделены защитником. Передача через C обходит его позицию."><defs><marker id="jr-rondo-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10" fill="none" stroke="#204774" stroke-width="2"/></marker></defs><path d="M50 50H590V550H50Z" fill="none" stroke="#204774" stroke-width="2"/><path d="M153 451H485" stroke="#b0473a" stroke-width="3" stroke-dasharray="9 10"/><path class="jf-pass-first" d="M155 415L290 198" fill="none" stroke="#204774" stroke-width="5" marker-end="url(#jr-rondo-arrow)"/><path class="jf-pass-second" d="M350 198L485 415" fill="none" stroke="#204774" stroke-width="5" marker-end="url(#jr-rondo-arrow)"/><g fill="#204774"><circle cx="125" cy="451" r="34"/><circle cx="515" cy="451" r="34"/><circle cx="320" cy="157" r="34"/></g><circle cx="320" cy="451" r="31" fill="#b0473a"/><g fill="#e5e7d8" text-anchor="middle" font-family="Georgia,serif" font-size="30"><text x="125" y="462">A</text><text x="515" y="462">B</text><text x="320" y="168">C</text><text x="320" y="461">×</text></g><circle class="jf-rondo-ball" cx="87" cy="404" r="13" fill="#d9a433" stroke="#204774" stroke-width="2"/></svg></div><div><span>Разобрать один принцип</span><h2>УВИДЕТЬ<br>ТРЕТЬЕГО.</h2><div class="jf-rondo-buttons" role="group" aria-label="Этап передачи"><button data-rondo="0" aria-pressed="true">Линия закрыта</button><button data-rondo="1" aria-pressed="false">Пас к C</button><button data-rondo="2" aria-pressed="false">Пас к B</button></div><p class="jf-rondo-description" aria-live="polite" aria-atomic="true">Защитник перекрывает прямую передачу A → B. Игрок C предлагает другой угол.</p><p class="jf-visual-note">Условная расстановка редакции. Защитник здесь неподвижен, чтобы показать геометрию; в реальной игре ситуация меняется.</p></div></section>`;
}
document.addEventListener('click',event=>{
 const point=event.target.closest('[data-point]');
 if(point){
  const block=point.closest('.jf-three-explainer');
  const text={1:'Одно очко за попадание изнутри дуги. Штрафной тоже приносит одно очко.',2:'Два очка за попадание из-за дуги: вдвое больше ближнего броска.',ot:'При ничьей после основного времени побеждает команда, первой набравшая два очка в овертайме.'};
  block.querySelector('[data-point-number]').textContent=point.dataset.point==='1'?'1':'2';block.querySelector('[data-point-copy]').textContent=text[point.dataset.point];
  block.querySelectorAll('[data-point]').forEach(b=>b.setAttribute('aria-pressed',String(b===point)));
 }
 const rondo=event.target.closest('[data-rondo]');
 if(rondo){
  const block=rondo.closest('.jf-rondo-explainer'),step=Number(rondo.dataset.rondo);
  block.dataset.rondoStep=String(step);
  block.querySelector('.jf-rondo-description').textContent=['Защитник перекрывает прямую передачу A → B. Игрок C предлагает другой угол.','A передаёт мяч игроку C. Направление атаки меняется, прямая линия через защитника больше не нужна.','C передаёт мяч игроку B. Мяч дошёл до партнёра через третьего игрока.'][step];
  block.querySelectorAll('[data-rondo]').forEach(b=>b.setAttribute('aria-pressed',String(b===rondo)));
 }
});
