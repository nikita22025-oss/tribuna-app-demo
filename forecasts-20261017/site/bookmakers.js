/* Editorial catalog. Loaded after sports-modules and before app's first render. */
const bkCatalog = window.TRIBUNA_BOOKMAKERS;
const bkAllBooks = bkCatalog.books;
const bkBooks = bkAllBooks.filter(b=>b.listed!==false);
const bkState = {query:'', type:'all', sort:'editorial', selected:[], expanded:false};
const bkEsc = value => escapeHTML(String(value ?? ''));
const bkDate = value => value ? longDate(value) : 'Не подтверждено';
const bkNumber = value => new Intl.NumberFormat('ru-RU').format(value);
const bkPageSize = 6;
const bkUrl = b => '/bookmaker/' + b.id;
const bkStatuses = {verified:'Правила прочитаны', details_checked:'Официальная карточка проверена', conflict:'В источниках есть расхождение', blocked:'Правила недоступны', none:'Публичные акции не найдены', expired:'Срок по правилам закончился', stale:'Нужна повторная проверка'};
function bkStatus(b) {
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(b.offer.validUntilAt && Date.now()>=Date.parse(b.offer.validUntilAt)) return 'expired';
 if(b.offer.validUntil && b.offer.validUntil<today) return 'expired';
 if(['verified','details_checked'].includes(b.offer.status) && Date.now()-Date.parse(b.source.checkedAt+'T00:00:00+03:00')>14*86400000) return 'stale';
 return b.offer.status;
}
function bkStatusText(b) { return bkStatuses[bkStatus(b)] || 'Условия уточняются'; }
function bkPeriod(b) { return b.offer.periodText ? bkEsc(b.offer.periodText) : b.offer.validUntil ? `${b.offer.validFrom?bkDate(b.offer.validFrom)+' — ': 'До '}${bkDate(b.offer.validUntil)}` : b.id==='baltbet' ? 'Без даты окончания, до отмены организатором' : b.offer.status==='none' ? 'Публичная акция не найдена' : 'Общий период в прочитанном источнике не подтверждён'; }
try { const ids=JSON.parse(sessionStorage.getItem('tribuna-book-compare')||'[]'); if(Array.isArray(ids)) bkState.selected=[...new Set(ids)].filter(id=>bkBooks.some(b=>b.id===id)).slice(0,3); } catch {}
function bkLogo(b) {
 const src=`/tribuna-app-demo/forecasts-20261017/site/${b.logoLocal?'bookmakers-assets':'assets'}/${bkEsc(b.logo)}`;
 // Frame the visible mark, keeping the original artwork and its proportions.
 const frames={
  'olimpbet.webp':{width:409,height:216,box:'76 88 256 40'},
  'fonbet.png':{width:240,height:90,box:'0 21 240 47'},
  'betcity.png':{width:240,height:90,box:'0 29 240 33'},
  'betboom.svg':{width:240,height:90,box:'17 20 206 50'}
 };
 const frame=frames[b.logo];
 if(frame)return `<svg class="bk-logo bk-logo-normalized" width="180" height="58" viewBox="${frame.box}" preserveAspectRatio="xMinYMid meet" role="img" aria-label="${bkEsc(b.name)}"><image href="${src}" width="${frame.width}" height="${frame.height}"/></svg>`;
 return `<img class="bk-logo" src="${src}" alt="${bkEsc(b.name)}" width="180" height="58">`;
}
function bkTrack(name, data={}) { if(typeof tribunaTrack==='function') tribunaTrack(name,{market:'RU',mode:bkCatalog.mode,...data}); }
function bkAmount(b) { return b.offer.amount===null ? (b.offer.status==='none'?'Не опубликованы':'Не подтверждён') : `${b.offer.prefix ? `<span class="bk-amount-prefix">${bkEsc(b.offer.prefix)}</span> ` : ''}<span class="bk-amount-value">${bkNumber(b.offer.amount)}</span> <span class="bk-amount-currency">₽</span>`; }
function bkListAmount(b) {
 const amount=b.offer.displayAmount?.value??b.offer.amount;
 return amount===null ? bkAmount(b) : `<span class="bk-amount-value">${bkNumber(amount)}</span><span class="bk-amount-currency">₽</span>`;
}
function bkListAmountNote(b) {
 return b.offer.displayAmount?.note || `${b.offer.label}: ${b.offer.prefix?b.offer.prefix+' ':''}${b.offer.amount===null?'сумма не подтверждена':bkNumber(b.offer.amount)+' ₽'}. Условия — в раскрытии строки.`;
}
function bkListAmountLabel(b) {
 if(b.offer.displayAmount?.kind==='max_payout')return 'Макс. выигрыш';
 return {freebet:'Фрибет',deposit:'Бонус к депозиту',gift:'Подарочные пари'}[b.offer.type] || b.offer.label;
}
function bkOfferBadge(b) {
 if(!['verified','details_checked'].includes(bkStatus(b)))return '';
 // Exclusivity is a partner-specific fact, never inferred from a large amount.
 if(b.offer.badge?.kind==='exclusive' && b.offer.badge.confirmed===true)
  return '<span class="bk-offer-badge bk-offer-badge-exclusive">Эксклюзив</span>';
 if(b.offer.type==='freebet' && b.offer.deposit===0)
  return '<span class="bk-offer-badge">Без депозита</span>';
 return '';
}
function bkSourceLink(b, label='Открыть источник') { return `<a href="${bkEsc(b.source.url)}" target="_blank" rel="noopener noreferrer" data-bk-source="${b.id}">${label}<span aria-hidden="true"> ↗</span></a>`; }
function bkBonusUrl(b) {
 // Prefer a configured campaign URL, then an official web page rather than a PDF.
 const candidates=[b.offer.claimUrl,b.source.url,...b.sources.map(s=>s.url)];
 for(const value of candidates) {
  if(!value)continue;
  try {
   const url=new URL(value), domain=b.domain.replace(/^www\./,'');
   if(url.protocol!=='https:'||url.username||url.password||/\.pdf$/i.test(url.pathname))continue;
   if(value===b.offer.claimUrl||url.hostname===domain||url.hostname.endsWith('.'+domain))return url.href;
  } catch {}
 }
 return 'https://'+b.domain+'/';
}
function bkBonusLink(b) {
 const available=['verified','details_checked'].includes(bkStatus(b))&&b.offer.amount>0;
 const label='Забрать бонус';
 const gift='<svg class="bk-bonus-gift" viewBox="0 0 32 32" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 15 1 12 20-1 .5-11M3.5 10.5 28 10l.5 5-25 .5zM15.5 11l1 16M15.5 10C9 10 5 7 7 4.5c2-2.5 7 1 8.5 5.5Zm0 0C16 4 20 1.5 22 4s-1 5.5-6.5 6ZM16 16l-5 4m6-4 4 3"/></svg>';
 return `<a class="bk-bonus-link${available?'':' bk-bonus-check'}" href="${bkEsc(bkBonusUrl(b))}" target="_blank" rel="noopener noreferrer" data-bk-bonus="${b.id}" aria-label="${label}: ${bkEsc(b.name)} — сайт букмекера, новая вкладка"><span class="bk-bonus-icon">${gift}</span><span>${label}</span><span class="bk-bonus-arrow" aria-hidden="true">↗</span></a>`;
}
function bkSelection(b,compact=false) { if(b.listed===false)return ''; return `<button type="button" class="bk-compare-pick${compact?' bk-compare-compact':''}" data-bk-compare="${b.id}" title="Сравнить ${bkEsc(b.name)}" aria-pressed="${bkState.selected.includes(b.id)}" aria-label="${bkState.selected.includes(b.id)?'Убрать из сравнения':'Сравнить'} ${bkEsc(b.name)}"><span aria-hidden="true">${bkState.selected.includes(b.id)?'✓':'+'}</span><span class="bk-compare-label">Сравнить</span></button>`; }
function bkSourceMeta(b) { return b.source.checkedAt ? `Источник просмотрен ${bkDate(b.source.checkedAt)}` : `Условия не подтверждены${b.source.attemptedAt?' · попытка проверки '+bkDate(b.source.attemptedAt):''}`; }
function bkSourceList(b) {
 return `<ul class="bk-source-list">${b.sources.map(s=>`<li><a href="${bkEsc(s.url)}" target="_blank" rel="noopener noreferrer" data-bk-source="${b.id}">${bkEsc(s.name)} ↗</a><small>${s.checkedAt?'Просмотрено '+bkDate(s.checkedAt):s.linkedOnly?'Ссылка из карточки; документ отдельно не проверен':s.attemptedAt?'Не удалось прочитать · '+bkDate(s.attemptedAt):'Требует проверки'}</small></li>`).join('')}</ul>`;
}
function bkHighlight(b) {
 // Owner-selected editorial nominations; no comparative scoring is implied.
 let label, sketch;
 if(b.id==='fonbet') {
  label='Лучшие коэффициенты';
  sketch='<path d="m14 3 2.5 7 7.5.3-5.9 4.6 1.8 7.1-6-4.3-6.5 4.5 2.3-7.4L4 10.3l7.5-.2ZM3 4l2 2m18-3-2 3M2 20l3-1"/>';
 } else if(b.id==='winline') {
  label='Лучшая программа лояльности';
  sketch='<path d="M22 7A10 10 0 1 0 24 19M22 2v5h-5M14 20l-5-5c-4-5 2-8 5-4 3-4 9-1 5 4Z"/>';
 } else return '';
 return `<div class="bk-highlight"><svg viewBox="0 0 28 28" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${sketch}</svg><span class="bk-highlight-copy"><small>Выбор редакции</small><span>${label}</span></span></div>`;
}
function bkRow(b) {
 const status=bkStatus(b), caution=['conflict','blocked','expired','stale'].includes(status);
 const highlight=bkHighlight(b);
 return `<article class="bk-row${highlight?' bk-row-featured':''}" data-bk-row="${b.id}" data-bk-status="${status}">
 <div class="bk-row-main"><span class="bk-position" aria-label="${b.order} в подборке">${pad2(b.order)}</span>
 <div class="bk-brand"><a href="${bkUrl(b)}" aria-label="Обзор ${bkEsc(b.name)}" data-bk-open="${b.id}">${bkLogo(b)}</a></div>
 <div class="bk-offer"><div class="bk-amount-card">${bkOfferBadge(b)}<span class="bk-amount-label">${bkEsc(bkListAmountLabel(b))}</span><h2 class="bk-amount-chip${b.offer.amount===null?' bk-no-amount':''}" title="${bkEsc(bkListAmountNote(b))}" aria-label="${bkEsc(bkListAmountNote(b))}">${bkListAmount(b)}</h2></div>${caution?`<small class="bk-offer-caution">${status==='expired'?'Срок истёк':'Условия уточняются'}</small>`:''}</div>
 <div class="bk-row-actions"><a class="bk-review-link" href="${bkUrl(b)}" aria-label="Обзор и условия ${bkEsc(b.name)}">Обзор <span aria-hidden="true">↗</span></a>${bkBonusLink(b)}${bkSelection(b,true)}</div></div>${highlight}
 <details class="bk-row-details"><summary aria-label="Условия ${bkEsc(b.name)}" title="Раскрыть условия"><span class="sr-only">Условия ${bkEsc(b.name)}</span><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></summary>
 <div class="bk-details-content"><div><h3>Как устроено предложение</h3><p class="bk-expanded-intro">${bkEsc(b.offer.summary)}</p><ol>${b.offer.steps.map(s=>`<li>${bkEsc(s)}</li>`).join('')}</ol></div><div><h3>На что обратить внимание</h3><dl class="bk-expanded-terms"><div><dt>Пополнение</dt><dd>${bkEsc(b.offer.depositText)}</dd></div><div><dt>Кому доступно</dt><dd>${bkEsc(b.offer.audience)}</dd></div><div><dt>Срок</dt><dd>${bkEsc(b.offer.duration)}</dd></div></dl><p>${bkEsc(b.offer.limits[0])}</p><p class="bk-status"><i aria-hidden="true"></i>${bkEsc(bkStatusText(b))}</p><p class="bk-source-caption">${bkEsc(bkSourceMeta(b))}</p>${bkSourceLink(b)}<a class="bk-detail-link" href="${bkUrl(b)}">Открыть полный разбор ↗</a></div></div></details></article>`;
}
function bkFiltered() {
 let out=bkBooks.filter(b=>(bkState.type==='all'||b.offer.type===bkState.type)&&(!bkState.query||`${b.name} ${b.domain}`.toLocaleLowerCase('ru').includes(bkState.query.toLocaleLowerCase('ru'))));
 return out.sort(bkState.sort==='name'?(a,b)=>a.name.localeCompare(b.name,'ru'):(a,b)=>a.order-b.order);
}
function bkVisibleBooks() {
 const list=bkFiltered();
 return bkState.expanded||bkState.query||bkState.type!=='all'?list:list.slice(0,bkPageSize);
}
function bkResultCount() {
 const count=bkVisibleBooks().length, total=bkFiltered().length;
 return bkState.query||bkState.type!=='all'?`${total} из ${bkBooks.length} компаний`:`Показано ${count} из ${bkBooks.length}`;
}
function bkListToggle() {
 if(bkState.query||bkState.type!=='all'||bkFiltered().length<=bkPageSize) return '';
 return `<button id="bk-show-all" type="button" class="bk-show-all" data-bk-expand aria-expanded="${bkState.expanded}" aria-controls="bk-results"><span>${bkState.expanded?'Свернуть список':'Смотреть всех '+bkBooks.length}</span><span aria-hidden="true">${bkState.expanded?'↑':'↓'}</span></button>`;
}
function bkResults() {
 const list=bkVisibleBooks();
 return list.length ? list.map(bkRow).join('') : '<div class="bk-empty"><h2>Ничего не нашлось</h2><p>Попробуйте другое название или сбросьте фильтры.</p><button type="button" class="bk-button" data-bk-reset>Сбросить фильтры</button></div>';
}
function bkMethod() {
 return `<section class="bk-method" id="bk-method"><div><span class="bk-section-label">О подборке</span><h2>Что за цифрой<br>на баннере.</h2><p>У каждого предложения — источник и дата проверки. Все требования к получению бонуса сохранены в подробном разборе.</p></div><div class="bk-method-points"><details><summary>Как устроен порядок компаний <span>+</span></summary><p>Это редакционная подборка «Трибуны». Порядок не означает оценку надёжности или размера возможного выигрыша. Плашки «Выбор редакции» — номинации, отражающие мнение «Трибуны». Актуальные условия смотрите в обзорах и правилах букмекеров.</p></details><details><summary>Почему у предложения есть статус проверки <span>+</span></summary><p>Сверяем условия на сайте букмекера. Расхождения между баннером и правилами отмечаем отдельно. Дата просмотра не гарантирует, что условия не изменились.</p></details><details><summary>Бонус и фрибет — одно и то же? <span>+</span></summary><p>Механики отличаются. Сравнивайте пополнение, оборот, сроки и ограничения. Максимум на баннере не равен сумме, которую можно сразу вывести.</p></details></div></section>`;
}
function bkPartnerSlot() {
 return `<aside class="bk-side-rail" aria-label="Будущее рекламное размещение"><div class="bk-partner-placeholder" data-ad-slot="bookmakers-sidebar" data-placeholder="true"><div class="bk-partner-meta"><span>Рекламное место</span><span>18+</span></div><p class="bk-partner-title">ВАШ БРЕНД.<br>НА ТРИБУНЕ.</p><svg class="bk-partner-court" viewBox="0 0 240 240" fill="none" aria-hidden="true"><path d="M-30 32 267 85 214 294-78 241Z"/><path d="M-22 49 245 96 199 274-62 227Z"/><path d="m-50 138 274 49"/><ellipse cx="88" cy="164" rx="45" ry="39" transform="rotate(10 88 164)"/><path d="m67 63-12 50 95 17 13-49M29 243l13-50 96 17-12 50"/><circle cx="90" cy="164" r="5" class="bk-court-ball"/></svg><div class="bk-partner-bottom"><p>Здесь появится<br>баннер партнёра.</p><a href="/advertising">О размещении <span aria-hidden="true">↗</span></a></div></div></aside>`;
}
function bkPredictionsSoon() {
 return `<section class="bk-predictions" id="bk-predictions" aria-labelledby="bk-predictions-title"><header><h2 id="bk-predictions-title">Прогнозы на спорт</h2><span class="bk-soon-badge">SOON <span>Скоро в «Трибуне»</span></span></header><div class="bk-predictions-body"><div class="bk-ai-intro"><h3>У каждого матча<br>свой контекст.</h3><p>Готовим разборы на основе формы команд, составов и статистики. С объяснением факторов и ограничений прогноза.</p></div><div class="bk-sport-preview"><article><span>Футбол</span><h4>Форма.<br>Состав.<br>Темп.</h4><svg viewBox="0 0 120 95" aria-hidden="true" fill="none"><path d="M8 13h104v69H8zM60 13v69"/><circle cx="60" cy="47.5" r="15"/><path d="M8 29h17v37H8m104-37H95v37h17"/></svg></article><article><span>Хоккей</span><h4>Звенья.<br>Нагрузка.<br>Вратарь.</h4><svg viewBox="0 0 120 95" aria-hidden="true" fill="none"><rect x="7" y="14" width="106" height="68" rx="26"/><path d="M39 14v68M81 14v68M60 14v68"/><circle cx="60" cy="48" r="14"/></svg></article><article><span>Теннис</span><h4>Покрытие.<br>Подача.<br>Ритм.</h4><svg viewBox="0 0 120 95" aria-hidden="true" fill="none"><path d="M14 10h92v75H14zM14 23h92M14 72h92M60 10v75M32 23v49m55-49v49M32 47.5h55"/></svg></article></div></div><p class="bk-predictions-note">Раздел в подготовке. Первые прогнозы появятся после проверки данных и качества аналитики.</p></section>`;
}
function bkTray() { return '<aside id="bk-tray" class="bk-tray" aria-label="Выбранные для сравнения" hidden></aside><p class="sr-only" id="bk-selection-status" role="status" aria-live="polite"></p>'; }
function renderBooks() {
 const params=new URLSearchParams(location.search);
 bkState.query=params.get('q')||'';bkState.type=['freebet','deposit','gift'].includes(params.get('type'))?params.get('type'):'all';bkState.sort=params.get('sort')==='name'?'name':'editorial';bkState.expanded=params.get('show')==='all';
 return `<div class="bk-page bk-directory wrap"><div class="bk-breadcrumb"><a href="/">Журнал</a><span aria-hidden="true">/</span><span>Рейтинг букмекеров</span><span class="bk-market">Россия <b>18+</b></span></div>
 <div class="bk-directory-layout"><div class="bk-directory-main"><header class="bk-hero"><h1>РЕЙТИНГ БУКМЕКЕРОВ<span class="bk-title-dot">.</span></h1><p>Предложения и условия в одной подборке.</p></header>
 <div class="bk-edition-note"><span>${bkBooks.length} компаний из списка ЦУПИС</span><a href="/bookmakers#bk-method" data-bk-anchor="bk-method">О подборке ↘</a></div>
 <section aria-label="Подборка букмекеров"><div class="bk-toolbar"><div class="bk-tabs" role="group" aria-label="Тип предложения">${[['all','Все'],['freebet','Фрибеты'],['deposit','Бонусы'],['gift','Подарочные пари']].map(([k,v])=>`<button type="button" data-bk-filter="${k}" aria-pressed="${bkState.type===k}">${v}${k==='all'?` <small>${bkBooks.length}</small>`:''}</button>`).join('')}</div><div class="bk-search"><label for="bk-search" class="sr-only">Найти букмекера</label><span aria-hidden="true">⌕</span><input id="bk-search" type="search" placeholder="Найти букмекера" value="${bkEsc(bkState.query)}" autocomplete="off"></div></div>
 <div class="bk-list-heading"><span id="bk-result-count" role="status" aria-live="polite">${bkResultCount()}</span><label><span>Порядок</span><select id="bk-sort" aria-label="Сортировка"><option value="editorial" ${bkState.sort==='editorial'?'selected':''}>Подборка редакции</option><option value="name" ${bkState.sort==='name'?'selected':''}>По названию</option></select></label></div><div id="bk-results">${bkResults()}</div><div id="bk-list-toggle">${bkListToggle()}</div><p class="bk-list-note">Сверено ${bkDate(bkCatalog.registryCheckedAt)}. Условия и источники — по стрелке в строке.</p></section></div>${bkPartnerSlot()}</div>
 ${bkPredictionsSoon()}${bkMethod()}<div class="bk-disclaimer"><b>18+</b><p>Участие в азартных играх может вызвать игровую зависимость. Раздел предназначен для совершеннолетней аудитории России. «Трибуна» не принимает ставки.</p></div>${bkTray()}</div>`;
}
function renderBook(oldBook) {
 const b=bkAllBooks.find(x=>x.id===oldBook.id);
 if(!b) return `<section class="bk-page wrap"><a href="/bookmakers">← К рейтингу</a><h1 class="bk-unavailable">Карточка обновляется</h1><p>Обзор ${bkEsc(oldBook.name)} появится после проверки данных.</p></section>`;
 return `<article class="bk-page bk-profile wrap" data-bk-profile="${b.id}"><div class="bk-breadcrumb"><a href="/bookmakers">Все букмекеры</a><span aria-hidden="true">/</span><span>${bkEsc(b.name)}</span><span class="bk-market">Россия <b>18+</b></span></div>
 <header class="bk-profile-heading"><div>${bkLogo(b)}<p>${bkEsc(b.tag)}</p></div><div class="bk-profile-score"><span>Официальные источники</span><p>${bkEsc(bkSourceMeta(b))}</p><a href="/bookmakers#bk-method">О подборке ↗</a></div></header>
 <div class="bk-profile-grid"><div class="bk-profile-story"><h1>${bkEsc(b.headline)}</h1><p class="bk-profile-lead">${bkEsc(b.intro)}</p><dl class="bk-facts">${b.facts.map(([k,v])=>`<div><dt>${bkEsc(k)}</dt><dd>${bkEsc(v)}</dd></div>`).join('')}<div><dt>Список ЦУПИС</dt><dd>Компания найдена · ${bkDate(b.legal.checkedAt)}</dd></div><div><dt>Официальный домен</dt><dd>${bkEsc(b.domain)}</dd></div></dl>${bkSelection(b)}</div>
 <aside class="bk-offer-panel ${b.id==='winline'?'bk-offer-winline':''}" data-bk-status="${bkStatus(b)}" aria-label="Разбор предложения"><div class="bk-panel-top"><span>${bkEsc(b.offer.label)}</span><b>18+</b></div><p class="bk-panel-amount ${b.offer.amount===null?'bk-panel-no-amount':''}">${bkAmount(b)}</p><p class="bk-panel-desc">${bkEsc(b.offer.summary)}</p><ol class="bk-step-list">${b.offer.steps.map((s,i)=>`<li><span>${pad2(i+1)}</span><p>${bkEsc(s)}</p></li>`).join('')}</ol><div class="bk-panel-status"><strong>${bkEsc(bkStatusText(b))}</strong><p>${bkEsc(bkSourceMeta(b))}</p></div>${bkSourceLink(b,b.source.kind==='rules'?'Читать правила у букмекера':'Открыть страницу букмекера')}<p class="bk-panel-warning">Участие в азартных играх может вызвать игровую зависимость.</p></aside></div>
 <section class="bk-profile-section"><div><span class="bk-section-label">Внимательное чтение</span><h2>До первого<br>пополнения.</h2></div><div class="bk-conditions"><dl><div><dt>Кому доступно</dt><dd>${bkEsc(b.offer.audience)}</dd></div><div><dt>Пополнение</dt><dd>${bkEsc(b.offer.depositText)}</dd></div><div><dt>Срок участия</dt><dd>${bkEsc(b.offer.duration)}</dd></div><div><dt>Оборот / задания</dt><dd>${bkEsc(b.offer.wager)}</dd></div><div><dt>Коэффициенты</dt><dd>${bkEsc(b.offer.odds)}</dd></div><div><dt>Промокод</dt><dd>${bkEsc(b.offer.promoCode||'Не указан в прочитанном источнике')}</dd></div><div><dt>Период акции</dt><dd>${bkPeriod(b)}</dd></div></dl>${b.offer.limits.map(s=>`<p>${bkEsc(s)}</p>`).join('')}</div></section>
 ${b.extras.length?`<section class="bk-profile-section bk-other-offers"><div><span class="bk-section-label">Кроме приветственного</span><h2>Другие программы</h2></div><div>${b.extras.map(o=>`<article><h3>${bkEsc(o.name)}</h3><p>${bkEsc(o.text)}</p><a href="${bkEsc(o.url)}" target="_blank" rel="noopener noreferrer" data-bk-source="${b.id}">Посмотреть у букмекера ↗</a></article>`).join('')}</div></section>`:''}
 <section class="bk-source-section"><div><span class="bk-section-label">Проверяемость</span><h2>Откуда данные</h2><p class="bk-source-status">${bkEsc(bkStatusText(b))}</p></div><div><p>${bkEsc(b.source.note)}</p>${bkSourceList(b)}<p class="bk-source-footnote">Даты относятся к просмотру источников. Условия могут измениться; автоматической проверки личной доступности предложения нет.</p></div></section>
 <section class="bk-next-books"><h2>Посмотреть рядом</h2><div>${bkBooks.filter(x=>x.id!==b.id).slice(0,3).map(x=>`<a href="${bkUrl(x)}">${bkLogo(x)}<span>Разбор условий ↗</span></a>`).join('')}</div></section>
 <div class="bk-disclaimer"><b>18+</b><p>Участие в азартных играх может вызвать игровую зависимость. Проверяйте текущие правила у организатора. Доступность зависит от действующих правил и требований к участнику.</p></div>${bkTray()}</article>`;
}
function ratingWidget() {
 return `<section class="rating-widget bk-home-widget" aria-labelledby="rating-title"><div class="rating-kicker"><span>НАВИГАТОР ПО БК</span><span>18+</span></div><h2 id="rating-title">РЕЙТИНГ<br>БУКМЕКЕРОВ</h2><p class="rating-intro">Компании и предложения.<br>С вниманием к условиям.</p><div class="bk-widget-list">${bkBooks.slice(0,5).map(b=>`<a href="${bkUrl(b)}"><span>${pad2(b.order)}</span>${bkLogo(b)}<span aria-label="Открыть обзор">↗</span></a>`).join('')}</div><a class="editorial-link" href="/bookmakers">Сравнить букмекеров <span>↗</span></a><p class="source-note">Редакционная подборка. Условия — в обзорах.</p></section>`;
}
function bkUpdateQuery() {
 const url=new URL(location.href); ['q','type','sort','show'].forEach(k=>url.searchParams.delete(k));
 if(bkState.query)url.searchParams.set('q',bkState.query);if(bkState.type!=='all')url.searchParams.set('type',bkState.type);if(bkState.sort!=='editorial')url.searchParams.set('sort',bkState.sort);
 if(bkState.expanded)url.searchParams.set('show','all');
 history.replaceState({},'',url.pathname+url.search+url.hash);
}
function bkUpdateResults() {
 const area=document.getElementById('bk-results');if(!area)return;
 area.innerHTML=bkResults();document.getElementById('bk-result-count').textContent=bkResultCount();
 document.getElementById('bk-list-toggle').innerHTML=bkListToggle();
 document.querySelectorAll('[data-bk-filter]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.bkFilter===bkState.type)));
 bkUpdateQuery();bkUpdateTray();
}
function bkUpdateTray() {
 const tray=document.getElementById('bk-tray');if(!tray)return;
 const selected=bkState.selected.map(id=>bkBooks.find(b=>b.id===id));tray.hidden=!selected.length;
 tray.innerHTML=`<div><strong>Сравнение <span>${selected.length}/3</span></strong><div class="bk-tray-books">${selected.map(b=>`<button type="button" data-bk-remove="${b.id}" aria-label="Убрать ${bkEsc(b.name)} из сравнения">${bkEsc(b.name)} <span aria-hidden="true">×</span></button>`).join('')}</div></div><button type="button" class="bk-button" data-bk-compare-open ${selected.length<2?'disabled':''}>Сравнить${selected.length<2?' · выберите ещё':''} <span aria-hidden="true">↗</span></button>`;
 document.querySelectorAll('[data-bk-compare]').forEach(btn=>{const b=bkAllBooks.find(x=>x.id===btn.dataset.bkCompare), chosen=bkState.selected.includes(b.id);btn.setAttribute('aria-pressed',String(chosen));btn.setAttribute('aria-label',`${chosen?'Убрать из сравнения':'Сравнить'} ${b.name}`);btn.firstElementChild.textContent=chosen?'✓':'+';});
 try{sessionStorage.setItem('tribuna-book-compare',JSON.stringify(bkState.selected));}catch{}
}
function bkToggle(id, remove=false) {
 if(!bkBooks.some(b=>b.id===id))return;
 let message;
 if(bkState.selected.includes(id)){bkState.selected=bkState.selected.filter(x=>x!==id);message='Компания убрана из сравнения.';}
 else if(!remove&&bkState.selected.length<3){bkState.selected.push(id);message=`Выбрано ${bkState.selected.length} из 3 компаний.`;}
 else message='Можно сравнить до трёх компаний. Уберите одну, чтобы добавить другую.';
 bkUpdateTray();const status=document.getElementById('bk-selection-status');if(status)status.textContent=message;
 let toast=document.getElementById('bk-toast');if(!toast){toast=document.createElement('div');toast.id='bk-toast';toast.className='bk-toast';document.body.append(toast);} toast.textContent=message;toast.hidden=false;clearTimeout(bkToastTimer);bkToastTimer=setTimeout(()=>toast.hidden=true,3500);
 bkTrack('bookmaker_compare_change',{bookmaker_id:id,selected:bkState.selected.join(',')});
}
let bkToastTimer, bkDialogTrigger;
function bkOpenCompare(trigger) {
 if(bkState.selected.length<2){const status=document.getElementById('bk-selection-status');if(status)status.textContent='Выберите две или три компании кнопками «Сравнить».';document.querySelector('[data-bk-compare]')?.focus();return;}
 bkDialogTrigger=trigger;
 let dialog=document.getElementById('bk-comparison');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='bk-comparison';dialog.className='bk-comparison';dialog.setAttribute('aria-labelledby','bk-compare-title');document.body.append(dialog);dialog.addEventListener('close',()=>{document.body.classList.remove('bk-dialog-open');bkDialogTrigger?.focus();});}
 const books=bkState.selected.map(id=>bkBooks.find(b=>b.id===id));
 const rows=[['Предложение',b=>`${bkEsc(b.offer.label)}<strong>${bkAmount(b)}</strong>`],['Пополнение',b=>bkEsc(b.offer.depositText)],['Для кого',b=>bkEsc(b.offer.audience)],['Срок участия',b=>bkEsc(b.offer.duration)],['Оборот / задания',b=>bkEsc(b.offer.wager)],['Коэффициенты',b=>bkEsc(b.offer.odds)],['Промокод',b=>bkEsc(b.offer.promoCode||'Не указан')],['Период акции',bkPeriod],['Статус проверки',b=>bkEsc(bkStatusText(b))],['Дата просмотра',b=>bkDate(b.source.checkedAt)],['Источник',b=>bkSourceLink(b)],['Главное ограничение',b=>bkEsc(b.offer.limits[0])]];
 dialog.innerHTML=`<div class="bk-dialog-header"><div><span>Россия · 18+</span><h2 id="bk-compare-title">Сравнить условия</h2></div><button type="button" data-bk-close aria-label="Закрыть сравнение">×</button></div><p>Сравнение по официальным источникам на дату просмотра. Максимум бонуса не равен гарантированной выплате; проверяйте статус и ограничения.</p><p class="bk-table-hint">Листайте таблицу вбок →</p><div class="bk-table-scroll" tabindex="0" role="region" aria-label="Таблица сравнения — прокручивается горизонтально"><table style="--bk-compare-count:${books.length}"><caption class="sr-only">Сравнение ${books.map(b=>b.name).join(', ')}</caption><thead><tr><th scope="col">Что сравниваем</th>${books.map(b=>`<th scope="col">${bkLogo(b)}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,fn])=>`<tr><th scope="row">${label}</th>${books.map(b=>`<td>${fn(b)}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">Подробности</th>${books.map(b=>`<td><a href="${bkUrl(b)}" data-bk-dialog-link>Открыть разбор ↗</a></td>`).join('')}</tr></tbody></table></div>`;
 document.body.classList.add('bk-dialog-open');dialog.showModal();bkTrack('bookmaker_compare_open',{bookmakers:bkState.selected.join(',')});
}
function refreshBookmakers() {
 const active=/^\/bookmakers?(\/|$)/.test(__demo.pathname);
 document.body.classList.toggle('bk-route',active);bkUpdateTray();
 if(location.hash==='#bk-method') requestAnimationFrame(()=>document.getElementById('bk-method')?.scrollIntoView());
}
document.addEventListener('input',e=>{if(e.target.id==='bk-search'){bkState.query=e.target.value;bkUpdateResults();}});
document.addEventListener('change',e=>{if(e.target.id==='bk-sort'){bkState.sort=e.target.value;bkUpdateResults();}});
document.addEventListener('click',e=>{
 const target=e.target.closest('button,a');if(!target)return;
 if(target.hasAttribute('data-bk-expand')){bkState.expanded=!bkState.expanded;bkUpdateResults();document.getElementById('bk-show-all')?.focus({preventScroll:true});if(!bkState.expanded)document.querySelector('.bk-list-heading')?.scrollIntoView({block:'start',behavior:'instant'});}
 if(target.hasAttribute('data-bk-filter')){bkState.type=target.dataset.bkFilter;bkUpdateResults();}
 if(target.hasAttribute('data-bk-reset')){bkState.query='';bkState.type='all';bkState.sort='editorial';bkState.expanded=false;document.getElementById('bk-search').value='';document.getElementById('bk-sort').value='editorial';bkUpdateResults();}
 if(target.hasAttribute('data-bk-compare'))bkToggle(target.dataset.bkCompare);
 if(target.hasAttribute('data-bk-remove'))bkToggle(target.dataset.bkRemove,true);
 if(target.hasAttribute('data-bk-compare-open'))bkOpenCompare(target);
 if(target.hasAttribute('data-bk-close'))document.getElementById('bk-comparison')?.close();
 if(target.hasAttribute('data-bk-dialog-link'))document.getElementById('bk-comparison')?.close();
 if(target.hasAttribute('data-bk-anchor')){e.preventDefault();history.replaceState({},'',location.pathname+location.search+'#'+target.dataset.bkAnchor);document.getElementById(target.dataset.bkAnchor)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
 const bookHref=(target.getAttribute('href')||'').match(/^\/bookmaker\/([a-z0-9-]+)\/?(?:[?#]|$)/);
 if(bookHref)bkTrack('bookmaker_card_open',{bookmaker_id:bookHref[1]});
 if(target.hasAttribute('data-bk-source'))bkTrack('bookmaker_source_open',{bookmaker_id:target.dataset.bkSource});
 if(target.hasAttribute('data-bk-bonus')) {
  const b=bkBooks.find(x=>x.id===target.dataset.bkBonus);
  if(b)bkTrack('bookmaker_bonus_click',{bookmaker_id:b.id,offer_id:b.offerId,placement:'rating_row',offer_status:bkStatus(b)});
 }
});
document.addEventListener('toggle',e=>{if(e.target.matches?.('.bk-row-details')&&e.target.open)bkTrack('bookmaker_terms_open',{bookmaker_id:e.target.closest('[data-bk-row]').dataset.bkRow});},true);
window.addEventListener('popstate',()=>document.getElementById('bk-comparison')?.close());
