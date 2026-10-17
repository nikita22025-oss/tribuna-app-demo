/* Local editorial layer. Existing v2 home, advertising and sports UI stay intact. */
const journalPinnedOpening = renderPinnedOpening;
renderPinnedOpening = function () {
  return journalPinnedOpening().replace('<div class="live-feed-heading wrap">','<div id="journal-stories" class="live-feed-heading wrap">').replace('Сейчас в спорте', 'Читайте в «Трибуне»').replace('Свежие новости', 'Истории, которые остаются');
};
const journalCoverFormat = editorialFormats.cover;
editorialFormats.cover = (item, article) => journalCoverFormat(item, article.coverImage ? {...article, image: article.coverImage, alt: article.coverAlt || article.alt} : article);

// Give the three existing ad placements stable columns, independent of story height.
const journalEditorialCard = renderEditorialCard;
renderEditorialCard = function (item) {
  const html = journalEditorialCard(item);
  const adKeys = ['baltbet-sidebar', 'fonbet', 'baltbet-native'];
  return item.type === 'advertisement' && adKeys.includes(item.adKey)
    ? html.replace('data-format="advertisement"', `data-format="advertisement" data-journal-ad="${item.adKey}"`)
    : html;
};

function journalParagraphs(items) {
  return (items || []).map(([tag, text]) => {
    const safeTag = ['p','h2','h3','blockquote'].includes(tag) ? tag : 'p';
    return `<${safeTag}>${escapeHTML(stripTags(text))}</${safeTag}>`;
  }).join('');
}
function journalImage(file, alt, index, className = '') {
  return `<button class="jr-photo ${className}" type="button" data-jr-gallery="${index}" aria-label="Рассмотреть: ${escapeHTML(alt)}"><img src="${assetUrl(file)}" alt="${escapeHTML(alt)}" loading="${index===0?'eager':'lazy'}"><span aria-hidden="true">↗</span></button>`;
}
function journalSources(a) {
  return `<details class="jr-sources"><summary>Источники и работа над материалом <span>+</span></summary><div><p>Материал редакции «Трибуны» о спортивном стиле и культуре.</p>${(a.sources||[]).map(x=>`<p><a href="${escapeHTML(x.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(x.name)} ↗</a></p>`).join('')}<p>${escapeHTML(a.imageCredit||'Иллюстрации из визуального архива проекта.')} Наблюдения и выделенные фразы — редакционный текст, а не цитаты спортсменов.</p></div></details>`;
}
function journalRelated(a) {
  return `<section class="article-related wrap"><div class="section-label large"><h2 class="section-title">ЕЩЁ ОДНА ИСТОРИЯ</h2><a href="/">К выпуску ↗</a></div><div class="stories-grid stories-grid-three">${relatedArticles(a).map(x=>card(x)).join('')}</div></section>`;
}
function renderJournalArticle(a) {
  if(a.layout==='yearbook'||a.layout==='belonging') return renderPinnedJournal(a);
  if(a.chapters) return renderJournalFeature(a);
  if(a.layout!=='jersey') return renderJournalEssay(a);
  const hero = 'journal/jersey-street.png', detail = 'journal/jersey-still.png';
  return `<article class="journal-article jr-jersey" data-journal-article="${a.id}">
    <div class="jr-progress" aria-hidden="true"><span></span></div>
    <header class="jr-opening wrap">
      <div class="jr-topline"><a href="/">← К выпуску</a><span>Стиль и культура</span><span>${a.minutes} минут чтения</span></div>
      <div class="jr-cover"><div class="jr-cover-copy"><span class="jr-kicker">За пределами поля</span><h1>ФОРМА<br>ВНЕ ИГРЫ.</h1><p class="jr-deck">${escapeHTML(a.description)}</p><div class="jr-author">Редакция «Трибуны»<br><time datetime="${a.date}">${longDate(a.date)}</time></div><a class="jr-start" href="/article/${a.id}#belonging">Читать историю <span>↓</span></a></div><figure>${journalImage(hero,a.alt,0)}<figcaption>Спортивная форма. Городской контекст. <span>AI-иллюстрация</span></figcaption></figure></div>
    </header>
    <div class="jr-reading wrap"><aside class="jr-toc"><span>В этой истории</span><nav aria-label="Главы статьи"><a href="/article/${a.id}#belonging">Цвета команды</a><a href="/article/${a.id}#city">Форма в городе</a><a href="/article/${a.id}#details">Память в деталях</a><a href="/article/${a.id}#own">Носить по-своему</a></nav><button data-jr-save="${a.id}" aria-pressed="false">Сохранить историю +</button></aside>
      <div class="jr-prose"><section id="belonging" class="jr-dropcap">${journalParagraphs(a.sections.belonging)}</section><section id="city">${journalParagraphs(a.sections.city)}</section></div></div>
    <aside class="jr-pullquote wrap"><span>Из редакционного эссе</span><p>Матч заканчивается.<br><em>История на майке — нет.</em></p></aside>
    <section class="jr-detail-spread" id="details"><div class="wrap jr-details-grid"><figure>${journalImage(detail,'Бордовая майка, шарф и бутсы — предметная композиция',1)}<figcaption>Вымышленная форма. Предметная AI-иллюстрация.</figcaption></figure><div class="jr-detail-copy"><span>Рассмотреть поближе</span><h2>ПАМЯТЬ<br>В ДЕТАЛЯХ.</h2><p>Мы запоминаем вещи не целиком. Иногда всё решает одна полоска на воротнике.</p><dl><div><dt>Воротник</dt><dd>Спортивная майка неожиданно напоминает повседневное поло. Деталь меняет характер всей вещи.</dd></div><div><dt>Фактура</dt><dd>Рисунок проявляется в движении и при боковом свете. Его хочется рассматривать вблизи.</dd></div><div><dt>Следы времени</dt><dd>Мягкая ткань, знакомая складка. Для владельца они могут значить больше, чем идеальное состояние.</dd></div></dl><button data-jr-gallery="1" class="jr-detail-link">Открыть изображение ↗</button></div></div></section>
    <div class="jr-reading jr-reading-last wrap"><aside class="jr-margin-note">У каждого<br>своя история.</aside><div class="jr-prose"><section id="own">${journalParagraphs(a.sections.own)}</section></div></div>
    <section class="wrap jr-gallery-section"><div class="jr-section-heading"><h2>На языке вещей</h2><span>Рассмотрите кадры</span></div><div class="jr-gallery">${journalImage(hero,a.alt,0)}${journalImage(detail,'Майка, шарф и бутсы',1)}</div>${journalSources(a)}<div class="jr-ending"><p>Хорошие истории<br>стоит оставлять рядом.</p><button data-jr-save="${a.id}" aria-pressed="false">Сохранить историю +</button></div></section>
  </article>${journalRelated(a)}`;
}
function renderJournalEssay(a) {
  const image = a.image ? `<figure class="jr-essay-image"><img src="${assetUrl(a.image)}" alt="${escapeHTML(a.alt||a.title)}"><figcaption>${escapeHTML(a.imageCredit||'Из визуального архива «Трибуны»')}</figcaption></figure>` : '';
  return `<article class="journal-article jr-essay wrap" data-journal-article="${a.id}"><header class="jr-essay-header"><a href="/">← К выпуску</a><div class="jr-topline"><span>${escapeHTML(a.category)} / ${escapeHTML(a.format)}</span><span>Редакционное эссе</span></div><h1>${escapeHTML(a.title)}</h1><p class="jr-deck">${escapeHTML(a.description)}</p>${meta(a)}</header>${image}<div class="jr-essay-body jr-prose">${journalParagraphs(a.body)}${journalSources(a)}</div></article>${journalRelated(a)}`;
}
function renderJournalArchive() {
  const all = window.TRIBUNA_ARCHIVE || [], limit = 30;
  const current = Math.min(Math.max(1, Number(new URLSearchParams(location.search).get('page'))||1), Math.max(1,Math.ceil(all.length/limit)));
  const entries = all.slice((current-1)*limit,current*limit);
  return `<section class="wrap jr-archive"><a class="back-link" href="/">← К журналу</a><div class="category-header"><h1>АРХИВ НОВОСТЕЙ</h1><p>Прежние материалы «Трибуны». ${all.length} публикаций.</p></div><div class="jr-archive-list">${entries.map(a=>`<a href="/article/${a.id}"><time>${escapeHTML(a.date)}</time><h2>${escapeHTML(a.title)}</h2><span>${escapeHTML(a.sourceName||a.author)}</span></a>`).join('')}</div><nav class="jr-archive-pages" aria-label="Страницы архива">${current>1?`<a href="/archive?page=${current-1}">← Назад</a>`:''}<span>${current} / ${Math.ceil(all.length/limit)}</span>${current*limit<all.length?`<a href="/archive?page=${current+1}">Дальше →</a>`:''}</nav></section>`;
}

let journalGalleryIndex=0, journalGalleryReturn=null;
const journalJerseyGallery=[['journal/jersey-street.png','Форма в городе. AI-иллюстрация «Трибуны».'],['journal/jersey-still.png','Память в деталях. Предметная AI-иллюстрация.']];
let journalGalleryItems=journalJerseyGallery;
function journalGallerySet(index) {
  journalGalleryIndex=(index+journalGalleryItems.length)%journalGalleryItems.length;
  const [src,alt]=journalGalleryItems[journalGalleryIndex], dialog=document.getElementById('jr-lightbox');
  dialog.querySelector('img').src=assetUrl(src);dialog.querySelector('img').alt=alt;
  dialog.querySelector('p').textContent=alt;dialog.querySelector('[data-jr-count]').textContent=`${journalGalleryIndex+1} / ${journalGalleryItems.length}`;
  dialog.querySelectorAll('[data-jr-step]').forEach(button=>{button.disabled=journalGalleryItems.length<2;});
}
function journalGalleryOpen(index, trigger) {
  let dialog=document.getElementById('jr-lightbox');
  if(!dialog){
    dialog=document.createElement('dialog');dialog.id='jr-lightbox';dialog.className='jr-lightbox';dialog.setAttribute('aria-label','Фотографии материала');
    dialog.innerHTML='<div class="jr-lightbox-top"><span data-jr-count></span><button data-jr-close aria-label="Закрыть галерею">✕</button></div><img alt=""><div class="jr-lightbox-bottom"><button data-jr-step="-1" aria-label="Предыдущий кадр">←</button><p></p><button data-jr-step="1" aria-label="Следующий кадр">→</button></div>';
    document.body.append(dialog);
    dialog.addEventListener('close',()=>{document.body.classList.remove('jr-dialog-open');journalGalleryReturn?.focus();});
    dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();journalGallerySet(journalGalleryIndex+(event.key==='ArrowLeft'?-1:1));}});
  }
  journalGalleryReturn=trigger;journalGallerySet(index);dialog.showModal();document.body.classList.add('jr-dialog-open');
}
function journalSyncSaved(){
  document.querySelectorAll('[data-jr-save]').forEach(button=>{
    let saved=false;try{saved=localStorage.getItem('tribuna-saved-'+button.dataset.jrSave)==='1';}catch{}
    button.setAttribute('aria-pressed',String(saved));button.textContent=saved?'История сохранена ✓':'Сохранить историю +';
  });
}
function refreshJournal(){
  document.getElementById('jr-lightbox')?.close();
  journalSyncSaved();
  const categoryLinks=document.querySelector('.topic-links');
  if(categoryLinks&&!categoryLinks.querySelector('[data-category="Стиль"]')) categoryLinks.insertAdjacentHTML('beforeend','<a href="/category/Стиль" data-category="Стиль"><span class="topic-number">10</span><span class="topic-name">Стиль</span><span class="topic-arrow" aria-hidden="true">↗</span><span class="topic-note">Форма, вещи и спортивная культура</span></a>');
  const count=document.querySelector('.menu-count');if(count&&categoryLinks)count.textContent=String(categoryLinks.children.length).padStart(2,'0');
  document.querySelectorAll('link[rel="canonical"],meta[property="og:url"]').forEach(node=>node.setAttribute(node.tagName==='LINK'?'href':'content',location.origin+location.pathname));
  const article=document.querySelector('[data-journal-article]');
  journalGalleryItems=articleById(article?.dataset.journalArticle)?.photos?.map(p=>[p.file,`${p.caption} ${p.author}. ${p.license}.`])||journalJerseyGallery;
  if(article){const data=articleById(article.dataset.journalArticle);setPageSchema({'@context':'https://schema.org','@type':'Article',headline:data.title,description:data.description,datePublished:data.date,author:{'@type':'Organization',name:'Редакция «Трибуны»'},mainEntityOfPage:location.origin+routeHref('/article/'+data.id),image:data.image?new URL(assetUrl(data.image),document.baseURI).href:undefined});}
  journalReadingProgress();
}
function journalReadingProgress(){
  const bar=document.querySelector('.jr-progress span'),article=document.querySelector('.journal-article');if(!bar||!article)return;
  const rect=article.getBoundingClientRect();const progress=Math.max(0,Math.min(1,-rect.top/Math.max(1,rect.height-innerHeight)));bar.style.transform=`scaleX(${progress})`;
}
document.addEventListener('scroll',journalReadingProgress,{passive:true});
document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(button?.hasAttribute('data-jr-gallery'))journalGalleryOpen(Number(button.dataset.jrGallery),button);
  else if(button?.hasAttribute('data-jr-step'))journalGallerySet(journalGalleryIndex+Number(button.dataset.jrStep));
  else if(button?.hasAttribute('data-jr-close'))document.getElementById('jr-lightbox').close();
  else if(button?.hasAttribute('data-jr-save')){
    try{const key='tribuna-saved-'+button.dataset.jrSave;localStorage.setItem(key,localStorage.getItem(key)==='1'?'0':'1');journalSyncSaved();}catch{button.textContent='Сохранение недоступно';}
  }
  const link=event.target.closest('a');
  if(link&&!event.defaultPrevented&&event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&link.getAttribute('href')?.includes('#')){
    const url=new URL(link.href);if(url.origin===location.origin&&url.pathname.replace(/\/$/,'')===location.pathname.replace(/\/$/,'')&&url.hash){const target=document.getElementById(url.hash.slice(1));if(target){event.preventDefault();for(let parent=target.parentElement;parent;parent=parent.parentElement){if(parent.tagName==='DETAILS')parent.open=true;}history.replaceState({},'',url.pathname+url.hash);target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}}
  }
});
