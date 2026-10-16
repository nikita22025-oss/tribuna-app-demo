/* Reading improvements shared by the existing journal and its complete archive. */
(() => {
  'use strict';
  const model = window.TribunaReadingData;
  const archive = () => window.TRIBUNA_ARCHIVE || [];
  const catalog = () => model.catalog(articles,archive());
  const archived = a => !articles.some(x=>x.id===a.id) && archive().some(x=>x.id===a.id);
  const inPreviousIssue = a => (window.TRIBUNA_JOURNAL_WINDOW?.issues[1]?.sequence||[]).some(item=>item.article===a.id);
  const h = escapeHTML;
  const articleHref = a => '/article/'+encodeURIComponent(a.id)+(archived(a)?'?archivePage='+model.archivePage(archive(),a.id):'');
  const archiveHref = a => '/archive?page='+model.archivePage(archive(),a.id)+'#archive-'+encodeURIComponent(a.id);
  const sourceUrl = a => {try{const u=new URL(a.sourceUrl);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}};
  const sourceLabel = a => a.sourceName || a.author || 'Источник не указан';
  const source = a => sourceUrl(a)?`<a href="${h(sourceUrl(a))}" target="_blank" rel="noopener noreferrer">${h(sourceLabel(a))} ↗</a>`:h(sourceLabel(a));
  const kind = a => model.isNews(a)?'Архив новостей':archived(a)?'Журнал · прошлый выпуск':'Журнал';
  function resultRow(a) {
    return `<article class="reading-result"><div class="reading-result-meta"><span>${kind(a)} · ${h(a.category)}</span><time datetime="${h(a.date)}">${h(a.date?longDate(a.date):'')}</time></div><h2><a href="${articleHref(a)}">${h(a.title)}</a></h2><p>${h(a.description)}</p>${model.isNews(a)?`<div class="reading-source">Источник: ${source(a)}</div>`:''}</article>`;
  }
  searchArticles = query => model.search(catalog(),query);
  renderSearch = function(query) {
    const params=new URLSearchParams(location.search);
    const type=['journal','news'].includes(params.get('type'))?params.get('type'):'all';
    const found=searchArticles(query), filtered=found.filter(a=>type==='all'||(type==='news'?model.isNews(a):!model.isNews(a)));
    const total=Math.max(1,Math.ceil(filtered.length/24)), current=model.pageNumber(params.get('page'),total);
    const href=(type,page=1)=>'/search/'+encodeURIComponent(query)+'?type='+type+'&page='+page;
    return `<section class="wrap reading-search"><a class="back-link" href="/">← На главную</a><div class="category-header"><h1>ПОИСК</h1><p>${query?`${filtered.length} ${plural(filtered.length,'материал','материала','материалов')} по запросу «${h(query)}»`:'По всем выпускам журнала и архиву новостей'}</p></div><form class="search-form" data-search role="search"><label class="sr-only" for="search-field">Поиск по журналу и архиву</label><input id="search-field" name="q" type="search" value="${h(query)}" placeholder="Тема, имя или название истории" autocomplete="off"><button type="submit">Найти ↗</button></form><nav class="reading-filters" aria-label="Тип материала">${[['all','Все материалы'],['journal','Журнал'],['news','Архив новостей']].map(([key,label])=>`<a href="${href(key)}"${type===key?' aria-current="page"':''}>${label}<span>${found.filter(a=>key==='all'||(key==='news'?model.isNews(a):!model.isNews(a))).length}</span></a>`).join('')}</nav><div class="reading-results">${filtered.slice((current-1)*24,current*24).map(resultRow).join('')||`<p class="search-empty">${query?'Ничего не нашли. Попробуйте другое имя или более короткий запрос.':'Ищем по заголовкам, вступлениям и тексту всех доступных материалов.'}</p>`}</div>${total>1?`<nav class="jr-archive-pages" aria-label="Страницы результатов">${current>1?`<a href="${href(type,current-1)}">← Назад</a>`:''}<span>${current} / ${total}</span>${current<total?`<a href="${href(type,current+1)}">Дальше →</a>`:''}</nav>`:''}</section>`;
  };
  function archiveNav(a) {
    const list=archive(), i=list.findIndex(x=>x.id===a.id), prev=list[i-1],next=list[i+1];
    return `<nav class="article-nav reading-archive-nav wrap" aria-label="Соседние материалы архива">${prev?`<a href="${articleHref(prev)}"><small>← Предыдущий в архиве</small><span>${h(prev.title)}</span></a>`:'<span></span>'}${next?`<a href="${articleHref(next)}"><small>Следующий в архиве →</small><span>${h(next.title)}</span></a>`:'<span></span>'}</nav>`;
  }
  renderJournalArchive = function() {
    const all=archive(), total=Math.max(1,Math.ceil(all.length/30)), current=model.pageNumber(new URLSearchParams(location.search).get('page'),total);
    return `<section class="wrap jr-archive"><a class="back-link" href="/">← К журналу</a><div class="category-header"><h1>АРХИВ</h1><p>Прошлые выпуски и новости «Трибуны». ${all.length} публикаций.</p></div><div class="jr-archive-list">${all.slice((current-1)*30,current*30).map(a=>`<a id="archive-${h(a.id)}" href="${articleHref(a)}"><time>${h(a.date)}</time><h2>${h(a.title)}</h2><span>${model.isNews(a)?'Источник: '+h(sourceLabel(a)):'Журнал'}</span></a>`).join('')}</div><nav class="jr-archive-pages" aria-label="Страницы архива">${current>1?`<a href="/archive?page=${current-1}">← Назад</a>`:''}<span>${current} / ${total}</span>${current<total?`<a href="/archive?page=${current+1}">Дальше →</a>`:''}</nav></section>`;
  };
  const originalArticle=renderArticle;
  renderArticle = function(a) {
    if(!archived(a)||a.journal)return originalArticle(a);
    const body=(a.body||[]).filter(([tag])=>bodyTags.has(tag)).map(([tag,text])=>`<${tag}>${text}</${tag}>`).join('');
    return `<article class="wrap reading-archive-article"><header class="article-header"><a class="back-link" href="${archiveHref(a)}">← К странице архива</a><div class="category">Архив · ${h(a.category)}</div><h1>${h(a.title)}</h1><p class="article-lead">${h(a.description)}</p><div class="meta"><time datetime="${h(a.date)}">${h(longDate(a.date))}</time>${model.isNews(a)?`<span>Источник: ${source(a)}</span>`:`<span>${h(authorName(a))}</span>`}</div></header>${a.image?`<figure class="article-image"><img src="${h(assetUrl(a.image))}" alt="${h(a.alt||a.title)}"></figure>`:''}<div class="article-body">${body}${sourceUrl(a)?`<p class="reading-original">Читать у источника: ${source(a)}</p>`:''}</div></article>${archiveNav(a)}<section class="article-related wrap"><div class="section-label large"><h2 class="section-title">ВЫБОР РЕДАКЦИИ</h2></div><div class="stories-grid stories-grid-three">${relatedArticles(a).map(x=>card(x)).join('')}</div></section>`;
  };
  // Football from the odds board carries named prematch lines (Фонбет, Winline), status and score from
  // API-Football. Lines are shown only while the feed is fresh (30 min) and the match has not started;
  // otherwise the reason is shown instead of prices. Other sports keep Leon's single market line.
  function partner() {
    const ads=window.__INITIAL__?.ads||{};
    const ad=ads.matchPartner||ads.leaderboard||ads.special||(ads.native||[])[0];
    return {url:livePartnerBetUrl(),name:ad?.advertiser_name||'букмекера'};
  }
  const FEED_FRESH_MS=30*60000, LINE_TTL_MS=15*60000, CLOCK_SKEW_MS=60000;
  // Each line lives 15 minutes from the moment the odds service last saw it (fetchedAt), whatever the feed age;
  // changedAt (last price change) is not freshness. Missing or zone-less stamps hide the line.
  const zoned=v=>typeof v==='string'&&/T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(v)&&Number.isFinite(Date.parse(v));
  const lineEnd=l=>zoned(l.fetchedAt)&&zoned(l.validUntil)?Math.min(Date.parse(l.validUntil),Date.parse(l.fetchedAt)+LINE_TTL_MS):NaN;
  const lineLive=(l,now)=>{const end=lineEnd(l);return Number.isFinite(end)&&Date.parse(l.fetchedAt)-now<=CLOCK_SKEW_MS&&now<=end;};
  const kickoffAt=m=>Date.parse(`${m.date}T${m.time}:00+03:00`);
  const changedText=iso=>{const t=new Date(iso);return Number.isFinite(t.getTime())?t.toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';};
  function boardView(m) {
    if(!m||!['scheduled','live','finished'].includes(m.state)) return null;
    const score=Array.isArray(m.score)&&m.score.length===2&&m.score.every(v=>Number.isInteger(v)&&v>=0)&&m.state!=='scheduled'?m.score:null;
    const status=m.state==='live'?`Идёт матч${Number.isInteger(m.elapsed)?` · ${m.elapsed}′`:''}`:m.state==='finished'?'Матч завершён':'';
    const all=(Array.isArray(m.lines)?m.lines:[]).filter(l=>l&&(l.book==='fonbet'||l.book==='winline')&&Array.isArray(l.odds)&&l.odds.length===3&&l.odds.every(v=>typeof v==='number'&&v>1&&v<1000));
    const feedAt=Date.parse(window.__INITIAL__?.updatedAt||''), now=Date.now(), lines=all.filter(l=>lineLive(l,now));
    let reason='';
    if(m.state!=='scheduled'||kickoffAt(m)<=now) reason='Предматчевые коэффициенты скрыты после начала матча.';
    else if(!Number.isFinite(feedAt)||feedAt>now||now-feedAt>FEED_FRESH_MS||(all.length&&!lines.length)) reason='Данные устарели. Коэффициенты скрыты до обновления.';
    else if(!lines.length) reason='Букмекеры пока не выставили линию на этот матч.';
    armOddsTimer();
    return {score,status,reason,lines:reason?[]:lines};
  }
  // An open card or match page redraws its own block the moment a shown line expires, the feed stops being
  // fresh or the match starts — no reload, no scroll jump. One timer for the whole page.
  let oddsTimer=0, oddsArmQueued=false;
  function armOddsTimer() {
    if(oddsArmQueued) return; oddsArmQueued=true;
    setTimeout(()=>{
      oddsArmQueued=false; clearTimeout(oddsTimer);
      const now=Date.now(), feedEnd=Date.parse(window.__INITIAL__?.updatedAt||'')+FEED_FRESH_MS, at=[];
      document.querySelectorAll('[data-odds-match]').forEach(el=>{
        const m=(window.__INITIAL__?.matches||[]).find(x=>x.id===el.dataset.oddsMatch); if(!m) return;
        at.push(kickoffAt(m),feedEnd,...(Array.isArray(m.lines)?m.lines:[]).filter(l=>lineLive(l,now)).map(lineEnd));
      });
      const next=Math.min(...at.filter(t=>Number.isFinite(t)&&t>=now));
      if(!Number.isFinite(next)) return;
      oddsTimer=setTimeout(()=>{
        document.querySelectorAll('[data-odds-match]').forEach(el=>{
          const m=(window.__INITIAL__?.matches||[]).find(x=>x.id===el.dataset.oddsMatch); if(!m) return;
          el.outerHTML=el.tagName==='ARTICLE'?matchCard(m):renderMatch(m);
        });
        armOddsTimer();
      },Math.min(next-now+1,2147483647));
    },0);
  }
  const oddsStrip=values=>{const labels=values.length===2?['П1','П2']:['П1','X','П2'];return `<div class="odds-strip ${values.length===2?'two-outcomes':''}">${values.map((v,i)=>`<span><small>${labels[i]}</small><b>${oddText(v)}</b></span>`).join('')}</div>`;};
  matchCard = function(m) {
    const p=partner(), b=boardView(m), goal=i=>b&&b.score?`<span class="match-goal">${b.score[i]}</span>`:'<span aria-hidden="true">—</span>';
    const market=b
      ? (b.lines.length
        ? `<div class="match-market"><span class="match-odds-note">${h(b.lines[0].name)} · до начала матча</span><span>18+</span></div>${oddsStrip(b.lines[0].odds)}`
        : `<div class="match-market"><span class="match-odds-note">${h(b.status||b.reason)}</span><span>18+</span></div>`)
      : `<div class="match-market"><span class="match-odds-note">Коэффициенты — ориентир рынка</span><span>18+</span></div>${oddsStrip(liveMatchOdds(m))}`;
    return `<article class="match-card"${b?` data-odds-match="${h(m.id)}" data-state="${b.score?m.state:b.lines.length?'odds':'hidden'}"`:''}><div class="match-card-meta">${sportLink(m.sport)}${matchTime(m)}</div><a class="match-card-link" href="/match/${encodeURIComponent(m.id)}"><p class="match-league">${h(m.league)}</p><div class="match-teams"><div>${teamBadge(m,'home')}<strong>${h(m.home)}</strong>${goal(0)}</div><div>${teamBadge(m,'away')}<strong>${h(m.away)}</strong>${goal(1)}</div></div></a>${market}<a class="match-odds-link" href="${h(p.url)}" target="_blank" rel="nofollow sponsored noopener noreferrer"><span class="match-open">На сайт ${h(p.name)} <span aria-hidden="true">↗</span></span></a></article>`;
  };
  renderMatch = function(m) {
    const b=boardView(m);
    const head=`<section class="wrap reading-match"${b?` data-odds-match="${h(m.id)}"`:''}><a class="back-link" href="/matches">← Все матчи</a><div class="category-header"><p>${h(m.sport)} · ${h(m.league)}</p><h1>${h(m.home)}<br>— ${h(m.away)}</h1><p>${matchTime(m)} · МСК</p>${b&&b.score?`<p class="match-score"><b>Счёт ${b.score[0]} : ${b.score[1]}</b> · ${h(b.status)} · по данным API-Football</p>`:''}</div><h2>Коэффициенты перед матчем</h2>`;
    if(!b){
      const values=liveMatchOdds(m);
      return `${head}${oddsStrip(values)}<p class="demo-note">${values.length?'Ориентир по линии поставщика. Коэффициенты могут меняться.':'Коэффициенты пока недоступны.'} 18+</p>${forecastTeaser(m)}<a class="editorial-link" href="/bookmakers">Смотреть букмекеров ↗</a></section>`;
    }
    const body=b.lines.length
      ? b.lines.map(l=>`<div class="match-book-line" data-book="${h(l.book)}"><div class="match-market"><span class="match-odds-note"><a href="/bookmaker/${h(l.book)}">${h(l.name)}</a> · изм. ${h(changedText(l.changedAt))}</span><span>18+</span></div>${oddsStrip(l.odds)}</div>`).join('')+`<p class="demo-note">Основное время. Линии букмекеров — BKsignal, расписание и счёт — API-Football. Коэффициенты могут меняться. 18+</p>`
      : `<p class="demo-note match-odds-hidden">${h(b.reason)} 18+</p>`;
    return `${head}${body}${forecastTeaser(m)}<a class="editorial-link" href="/bookmakers">Смотреть букмекеров ↗</a></section>`;
  };

  // «Прогнозы»: probabilities of the forecast model (not bookmaker odds), the explanation and the model's
  // measured quality, from forecasts.json (service/forecasts/generate.ts).
  const FORECASTS_URL=window.TRIBUNA_FORECASTS_URL||'/forecasts.json';
  let forecastFeed=null, forecastState='idle';
  function loadForecasts(){
    if(forecastState!=='idle') return;
    forecastState='loading';
    fetch(FORECASTS_URL,{credentials:'omit'}).then(r=>{if(!r.ok)throw new Error('forecasts '+r.status);return r.json();}).then(d=>{
      if(!d||d.version!==1||!Array.isArray(d.forecasts)) throw new Error('forecast feed');
      forecastFeed=d; forecastState='ready';
    }).catch(()=>{forecastState='error';}).finally(()=>{
      const p=routePath().split('/').filter(Boolean)[0];
      if(p==='forecasts'||p==='forecast'||p==='match') render();
    });
  }
  const pctText=v=>`${Math.round(v*100)}%`;
  const decText=(v,d=3)=>v.toFixed(d).replace('.',',');
  const fcLabels={home:'П1',draw:'X',away:'П2'}, fcWords={home:'победа хозяев',draw:'ничья',away:'победа гостей'};
  const fcTime=iso=>new Date(iso).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+' МСК';
  const fcOk=f=>f&&typeof f.eventId==='string'&&['home','draw','away'].every(k=>typeof f.probabilities?.[k]==='number'&&f.probabilities[k]>=0&&f.probabilities[k]<=1)&&Array.isArray(f.reasons);
  const fcUpcoming=f=>fcOk(f)&&f.status==='pending'&&Date.parse(f.kickoff)>Date.now();
  const fcStrip=f=>`<div class="odds-strip forecast-strip">${['home','draw','away'].map(k=>`<span${k===f.selection?' data-pick="1"':''}><small>${fcLabels[k]}</small><b>${pctText(f.probabilities[k])}</b></span>`).join('')}</div>`;
  const fcBadges=f=>{const m=(window.__INITIAL__?.matches||[]).find(x=>x.id===f.eventId);return m||{sport:'Футбол',home:f.home,away:f.away,homeCode:f.home.slice(0,3).toUpperCase(),awayCode:f.away.slice(0,3).toUpperCase(),colors:['#2f7a4f','#1f5f8b']};};
  const fcNotice=()=>forecastState==='error'?'<p class="demo-note">Не удалось загрузить прогнозы. Обновите страницу позже.</p>':forecastState!=='ready'?'<p class="demo-note">Загружаем прогнозы…</p>':'';
  function forecastCard(f){
    const t=fcBadges(f);
    return `<article class="match-card" data-forecast="${h(f.eventId)}"><div class="match-card-meta"><span>Футбол</span><time datetime="${h(f.kickoff)}">${h(fcTime(f.kickoff))}</time></div><a class="match-card-link" href="/forecast/${encodeURIComponent(f.eventId)}"><p class="match-league">${h(f.league)}</p><div class="match-teams"><div>${teamBadge(t,'home')}<strong>${h(f.home)}</strong></div><div>${teamBadge(t,'away')}<strong>${h(f.away)}</strong></div></div></a><div class="match-market"><span class="match-odds-note">Вероятности модели · не коэффициенты</span><span>18+</span></div>${fcStrip(f)}</article>`;
  }
  function qualityPart(q,label){
    if(!q||!q.model) return '';
    const diff=q.logLossDifference||{};
    return `<div class="forecast-quality" data-quality="${h(label)}"><h3>${h(label)}: сезон ${h(q.season)}</h3><p>${q.matches} матчей, прогноз рассчитан для ${pctText(q.coverage)}. Исход с наибольшей вероятностью совпал в ${pctText(q.model.accuracy)} матчей (частоты исходов лиги — ${pctText(q.leagueFrequencies.accuracy)}).</p><p>Логарифмическая ошибка ${decText(q.model.logLoss)} против ${decText(q.leagueFrequencies.logLoss)} у частот лиги и ${decText(q.equalThirds.logLoss)} у равных вероятностей; оценка Брайера ${decText(q.model.brier)} против ${decText(q.leagueFrequencies.brier)}. Меньше — лучше. Разница с частотами лиги ${decText(diff.mean)}, 95% интервал ${decText(diff.lower95)}…${decText(diff.upper95)}.</p><div class="table-scroll"><table class="odds-table"><caption>Надёжность вероятностей: самый вероятный исход</caption><thead><tr><th scope="col">Модель давала</th><th scope="col">В среднем</th><th scope="col">Сбылось</th><th scope="col">Матчей</th></tr></thead><tbody>${(q.calibration||[]).map(b=>`<tr><td>${Math.round(b.from*100)}–${Math.round(b.to*100)}%</td><td>${pctText(b.predicted)}</td><td>${pctText(b.observed)}</td><td>${b.n}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function renderForecasts(){
    const d=forecastFeed, byTime=(a,b)=>Date.parse(a.kickoff)-Date.parse(b.kickoff), list=d?d.forecasts.filter(fcUpcoming).sort(byTime):[], q=d&&d.quality;
    // Matches that started after the calculation stay listed, marked: the forecast was fixed before kick-off.
    const past=d?d.forecasts.filter(f=>fcOk(f)&&Date.parse(f.kickoff)<=Date.now()).sort(byTime):[];
    const snapshot=window.TRIBUNA_FORECASTS_SNAPSHOT===true, stale=d&&!snapshot&&Date.now()-Date.parse(d.updatedAt)>6*3600000;
    return `<section class="wrap reading-forecasts"><a class="back-link" href="/matches">← Все матчи</a><div class="category-header"><p>Футбол · ${h(q?q.leagues.join(', '):'шесть чемпионатов')}</p><h1>ПРОГНОЗЫ</h1><p>Вероятности исходов основного времени по модели «Трибуны». Это не коэффициенты букмекеров и не совет делать ставку. 18+</p>${d?`<p class="forecast-updated">${snapshot?'Демо: снимок расчёта ':'Расчёт '}${h(fcTime(d.updatedAt))}${snapshot?'. Прогнозы не обновляются.':stale?' · данные устарели, требуется пересчёт':''}</p>`:''}</div>${fcNotice()}${d?(list.length?`<div class="match-grid">${list.map(forecastCard).join('')}</div>`:'<p class="demo-note">Ближайших матчей с прогнозом нет.</p>'):''}${past.length?`<h2>Матч начался — прогноз зафиксирован до матча</h2><p class="demo-note">Вероятности показаны такими, какими были до начала. Итоги матчей здесь не подставляются.</p><div class="match-grid">${past.map(forecastCard).join('')}</div>`:''}${q?`<h2>Как модель проверена</h2><p class="demo-note">${h(q.method)} Источник: ${h(q.source)}; ${q.historyMatches} матчей в истории. Параметры подобраны на сезоне 2023/24, калибровка — на 2024/25.</p>${qualityPart(q.evaluation,'Проверочный сезон')}${qualityPart(q.prospective,'Текущий сезон, до сегодняшнего дня')}<p class="demo-note">Показатели описывают прошлые сезоны и не гарантируют результат будущих матчей.</p>`:''}</section>`;
  }
  function renderForecast(id){
    const f=forecastFeed&&forecastFeed.forecasts.find(x=>x.eventId===id&&fcOk(x));
    if(!f) return `<section class="wrap reading-match reading-forecast"><a class="back-link" href="/forecasts">← Все прогнозы</a>${fcNotice()||'<p class="demo-note">Прогноз на этот матч не найден.</p>'}</section>`;
    const started=Date.parse(f.kickoff)<=Date.now(), m=(window.__INITIAL__?.matches||[]).find(x=>x.id===f.eventId);
    return `<section class="wrap reading-match reading-forecast" data-forecast="${h(f.eventId)}"><a class="back-link" href="/forecasts">← Все прогнозы</a><div class="category-header"><p>Футбол · ${h(f.league)}</p><h1>${h(f.home)}<br>— ${h(f.away)}</h1><p>${h(fcTime(f.kickoff))}</p></div><h2>Вероятности исходов</h2>${fcStrip(f)}<p class="demo-note">Основное время: 90 минут и добавленное. Вероятнее всего по модели — ${fcWords[f.selection]} (${pctText(f.probabilities[f.selection])}). Это оценка модели, а не коэффициенты букмекеров и не обещание результата. 18+${started?' Матч уже начался: прогноз зафиксирован до начала и не меняется.':''}</p><h2>Почему так</h2>${f.reasons.map(r=>`<p class="market-explanation forecast-reason">${h(r)}</p>`).join('')}<p class="demo-note">Расчёт ${h(fcTime(f.issuedAt))} · учтены результаты до ${h(fcTime(f.inputUntil))} · модель ${h(f.modelVersion)} · ${h(f.source)}</p>${m?`<a class="editorial-link" href="/match/${encodeURIComponent(m.id)}">Страница матча ↗</a>`:''}<a class="editorial-link" href="/forecasts">Все прогнозы ↗</a></section>`;
  }
  function forecastTeaser(m){
    if(forecastState==='idle') loadForecasts();
    // By match id (football from the odds board) or, for other feeds, by both team names and the Moscow date.
    const key=v=>String(v||'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]/g,'');
    const day=f=>new Date(Date.parse(f.kickoff)+3*3600000).toISOString().slice(0,10);
    const f=forecastFeed&&(forecastFeed.forecasts.find(x=>x.eventId===m.id&&fcOk(x))||(m.sport==='Футбол'?forecastFeed.forecasts.find(x=>fcOk(x)&&key(x.home)===key(m.home)&&key(x.away)===key(m.away)&&day(x)===m.date):null));
    return f?`<div class="match-forecast"><h2>Прогноз модели</h2>${fcStrip(f)}<p class="demo-note">Вероятности модели, не коэффициенты. <a href="/forecast/${encodeURIComponent(f.eventId)}">Почему так ↗</a></p></div>`:'';
  }
  const originalRender=render;
  render = function() {
    const parts=routePath().split('/').filter(Boolean);
    if(parts[0]==='format') {
      const format=parts.slice(1).join('/'), list=catalog().filter(a=>a.journal&&a.format===format);
      page.innerHTML=`<section class="wrap reading-format"><a class="back-link" href="/#journal-stories">← К историям</a><div class="category-header"><p>Формат журнала</p><h1>${h(format)}</h1><p>${list.length} ${plural(list.length,'история','истории','историй')}</p></div><div class="reading-results">${list.map(resultRow).join('')||'<p>В этом формате пока нет материалов.</p>'}</div></section>`;
      document.title=format+' — Трибуна';closeMenu();setPageSchema(null);refreshEditorialLayout();
    } else {
      originalRender();
      if(parts[0]==='article') {
        const a=articleById(parts[1]);
        if(a&&archived(a)&&a.journal) {
          const link=page.querySelector('.jf-return>a,.jr-topline>a,.jr-essay-header>a');
          const previous=inPreviousIssue(a), fromArchive=new URLSearchParams(location.search).has('archivePage');
          if(link){link.href=previous&&!fromArchive?'/#journal-previous-issue':archiveHref(a);link.textContent=previous&&!fromArchive?'← К предыдущему выпуску':'← К странице архива';}
          const article=page.querySelector('[data-journal-article]');
          if(article&&(!previous||fromArchive))article.insertAdjacentHTML('afterend',archiveNav(a));
          const related=page.querySelector('.article-related .section-title');
          if(related)related.textContent='РЕКОМЕНДУЕТ РЕДАКЦИЯ';
        }
        if(a&&model.isNews(a)) {
          const schema=articleSchema(a);delete schema.author;
          if(sourceUrl(a))schema.isBasedOn=sourceUrl(a);
          schema.mainEntityOfPage=location.origin+'/article/'+encodeURIComponent(a.id)+'/';
          setPageSchema(schema);
        }
      }
    }
    if(parts[0]==='archive'&&location.hash.startsWith('#archive-'))requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'center',behavior:'instant'}));
    if(!parts.length&&/^#journal-(stories|previous-issue|sketch-break|next-part)$/.test(location.hash)) {
      // The base router scrolls to the top after popstate. Restore the section
      // after layout/fonts settle, but only if the reader is still on this route.
      const href=location.href;
      document.fonts.ready.then(()=>requestAnimationFrame(()=>{
        if(location.href!==href)return;
        window.scrollJournalSection?.(location.hash.slice(1),editorialKeyboardMode);
      }));
    }
  };
  // /forecasts and /forecast/<match id> — the forecast section, without touching the masthead or other routes.
  const forecastBaseRender=render;
  render = function() {
    const parts=routePath().split('/').filter(Boolean);
    if(parts[0]==='forecasts'||(parts[0]==='forecast'&&parts[1])) {
      loadForecasts();
      page.innerHTML=parts[0]==='forecasts'?renderForecasts():renderForecast(decodeURIComponent(parts[1]));
      document.title=(parts[0]==='forecasts'?'Прогнозы':'Прогноз матча')+' — Трибуна';closeMenu();setPageSchema(null);
      return;
    }
    forecastBaseRender();
    if(parts[0]==='matches'&&!page.querySelector('.forecast-entry')) {
      const at=page.querySelector('.category-header')||page.querySelector('h1');
      if(at) at.insertAdjacentHTML('afterend','<p class="forecast-entry demo-note"><a class="editorial-link" href="/forecasts">Прогнозы модели на футбол ↗</a> Вероятности исходов по шести чемпионатам — не коэффициенты букмекеров.</p>');
    }
  };
  render();
})();
