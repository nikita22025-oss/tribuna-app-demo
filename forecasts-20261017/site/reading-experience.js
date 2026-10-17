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
      return `${head}${oddsStrip(values)}<p class="demo-note">${values.length?'Ориентир по линии поставщика. Коэффициенты могут меняться.':'Коэффициенты пока недоступны.'} 18+</p>${forecastTeaser(m)}${m.sport==='Футбол'?factsSection({home:m.home,away:m.away,date:m.date}):''}<a class="editorial-link" href="/bookmakers">Смотреть букмекеров ↗</a></section>`;
    }
    const body=b.lines.length
      ? b.lines.map(l=>`<div class="match-book-line" data-book="${h(l.book)}"><div class="match-market"><span class="match-odds-note"><a href="/bookmaker/${h(l.book)}">${h(l.name)}</a> · изм. ${h(changedText(l.changedAt))}</span><span>18+</span></div>${oddsStrip(l.odds)}</div>`).join('')+`<p class="demo-note">Основное время. Линии букмекеров — BKsignal, расписание и счёт — API-Football. Коэффициенты могут меняться. 18+</p>`
      : `<p class="demo-note match-odds-hidden">${h(b.reason)} 18+</p>`;
    return `${head}${body}${forecastTeaser(m)}${m.sport==='Футбол'?factsSection({home:m.home,away:m.away,date:m.date}):''}<a class="editorial-link" href="/bookmakers">Смотреть букмекеров ↗</a></section>`;
  };

  // «Прогнозы»: probabilities of the forecast model (not bookmaker odds), a short explanation, the match analysis
  // in plain blocks, and the model check folded away. Data: forecasts.json (service/forecasts/generate.ts).
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
  // Styles live with the code (one file to ship); colours and fonts are the theme's variables.
  function forecastStyles(){
    if(document.getElementById('fc-styles')) return;
    const s=document.createElement('style'); s.id='fc-styles';
    s.textContent=`
.fc-wrap{--fc-line:var(--line,rgba(242,243,238,.14));--fc-muted:var(--muted,rgba(242,243,238,.72));--fc-acid:var(--acid,#E6FF57);--fc-ink:var(--ink,#F2F3EE);--fc-panel:var(--g-glass,rgba(27,29,25,.62))}
.fc-wrap .fc-kicker{font:700 11px/1.35 var(--font,Golos,sans-serif);letter-spacing:.14em;text-transform:uppercase;color:var(--fc-muted);margin:0}
.fc-wrap .fc-meta{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 8px;padding:0;list-style:none}
.fc-wrap .fc-meta li{font:600 12px/1.2 var(--font,Golos,sans-serif);color:var(--fc-muted);border:1px solid var(--fc-line);padding:7px 10px}
.fc-wrap .fc-meta li:first-child{color:var(--fc-acid);border-color:var(--fc-acid)}
.fc-day{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin:34px 0 14px;padding-top:14px;border-top:1px solid var(--fc-line)}
.fc-day b{font:700 26px/1 var(--display,Oswald,sans-serif);text-transform:uppercase;color:var(--fc-ink)}
.fc-day span{font-size:13px;color:var(--fc-muted)}
.fc-group{font:700 30px/1.05 var(--display,Oswald,sans-serif);text-transform:uppercase;margin:44px 0 6px;color:var(--fc-ink)}
.fc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.fc-card{display:grid;gap:14px;align-content:start;border:1px solid var(--fc-line);background:var(--fc-panel);padding:20px 20px 0}
.fc-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.fc-time{font:500 20px/1 var(--display,Oswald,sans-serif);color:var(--fc-ink);white-space:nowrap}
.fc-teams{display:grid;gap:2px;margin:0;font:700 23px/1.15 var(--serif,Georgia,serif);color:var(--fc-ink);overflow-wrap:anywhere}
.fc-pick{display:flex;align-items:center;gap:16px;border-top:1px solid var(--fc-line);padding-top:14px}
.fc-pick .fc-num{font:500 52px/.9 var(--display,Oswald,sans-serif);color:var(--fc-acid);flex:none}
.fc-pick b{display:block;font:800 18px/1.2 var(--font,Golos,sans-serif);color:var(--fc-ink)}
.fc-pick small{display:block;margin-top:4px;font-size:13px;line-height:1.35;color:var(--fc-muted);overflow-wrap:anywhere}
.fc-track{display:flex;gap:3px;height:8px}
.fc-track span{background:rgba(242,243,238,.24);min-width:6px}
.fc-track span.on{background:var(--fc-acid)}
.fc-legend{list-style:none;padding:0;margin:10px 0 0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.fc-legend li{display:grid;gap:4px;font-size:12px;line-height:1.2;color:var(--fc-muted)}
.fc-legend li b{font:500 22px/1 var(--display,Oswald,sans-serif);color:var(--fc-ink)}
.fc-legend li.on,.fc-legend li.on b{color:var(--fc-acid)}
.fc-sum{margin:0;font-size:15px;line-height:1.5;color:var(--fc-ink)}
.fc-go{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 -20px;padding:16px 20px;border-top:1px solid var(--fc-line);font:700 15px/1.2 var(--font,Golos,sans-serif);color:var(--fc-ink);text-decoration:none}
.fc-go:hover,.fc-go:focus-visible{color:var(--fc-acid)}
.fc-method{margin-top:44px;border:1px solid var(--fc-line);background:var(--fc-panel);padding:4px 20px}
.fc-method summary{cursor:pointer;min-height:52px;display:flex;align-items:center;font:700 20px/1.2 var(--display,Oswald,sans-serif);text-transform:uppercase;color:var(--fc-ink)}
.fc-method p{color:var(--fc-muted);font-size:15px;line-height:1.55;max-width:70ch;margin:10px 0}
.fc-stats{margin:14px 0;border-top:1px solid var(--fc-line)}
.fc-stats div{display:flex;gap:16px;align-items:baseline;padding:12px 0;border-bottom:1px solid var(--fc-line)}
.fc-stats dt{font:500 34px/1 var(--display,Oswald,sans-serif);color:var(--fc-acid);min-width:72px}
.fc-stats dd{margin:0;color:var(--fc-muted);font-size:15px;line-height:1.4}
.fc-legal{margin-top:22px;font-size:13px;color:var(--fc-muted)}
.fc-wrap .fc-h1{display:grid;gap:2px;margin:10px 0 0;font:700 clamp(34px,5.4vw,60px)/1.02 var(--display,Oswald,sans-serif);text-transform:uppercase;letter-spacing:-.01em;color:var(--fc-ink);overflow-wrap:anywhere}
.fc-main{display:grid;gap:16px;margin-top:24px;border:1px solid var(--fc-line);border-top:3px solid var(--fc-acid);background:var(--fc-panel);padding:20px;max-width:720px}
.fc-main .fc-pick{border-top:0;padding-top:0}
.fc-main .fc-pick .fc-num{font-size:68px}
.fc-main .fc-track{height:12px}
.fc-main .fc-legend li b{font-size:30px}
.fc-note{margin:0;font-size:13px;color:var(--fc-muted)}
.fc-short{margin:22px 0 0;max-width:720px;font:400 21px/1.45 var(--serif,Georgia,serif);color:var(--fc-ink)}
.fc-blocks{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-top:26px}
.fc-block{display:grid;gap:12px;align-content:start;border:1px solid var(--fc-line);background:var(--fc-panel);padding:20px}
.fc-xg{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.fc-xg div{display:grid;gap:6px}
.fc-xg b{font:500 46px/1 var(--display,Oswald,sans-serif);color:var(--fc-ink)}
.fc-xg span,.fc-cap{font-size:13px;line-height:1.35;color:var(--fc-muted);overflow-wrap:anywhere;margin:0}
.fc-row{display:grid;gap:8px;padding-top:10px;border-top:1px solid var(--fc-line)}
.fc-row>b{font:700 16px/1.3 var(--font,Golos,sans-serif);color:var(--fc-ink);overflow-wrap:anywhere}
.fc-chips,.fc-form,.fc-scores{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:6px}
.fc-chips li{font-size:13px;line-height:1.2;padding:7px 10px;border:1px solid var(--fc-line);color:var(--fc-muted)}
.fc-chips li.good{color:var(--fc-acid);border-color:var(--fc-acid)}
.fc-chips li.bad{color:#ffb4a8;border-color:rgba(255,180,168,.5)}
.fc-form li{width:34px;height:34px;display:grid;place-items:center;font:700 14px/1 var(--font,Golos,sans-serif);border:1px solid var(--fc-line);color:var(--fc-muted)}
.fc-form li.w{background:var(--fc-acid);border-color:var(--fc-acid);color:#1B1D19}
.fc-form li.l{border-color:rgba(255,180,168,.55);color:#ffb4a8}
.fc-scores li{display:flex;gap:10px;align-items:baseline;padding:8px 12px;border:1px solid var(--fc-line)}
.fc-scores li b{font:500 24px/1 var(--display,Oswald,sans-serif);color:var(--fc-ink)}
.fc-scores li span{color:var(--fc-muted);font-size:13px}
.fc-block p{margin:0;color:var(--fc-muted);font-size:15px;line-height:1.5}
.fc-foot{margin-top:24px;max-width:720px;font-size:13px;line-height:1.5;color:var(--fc-muted)}.fc-obs{display:inline-block;justify-self:start;margin:0;padding:4px 10px;border:1px solid rgba(255,180,168,.6);border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#ffb4a8}.fc-res{margin:0;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--fc-muted)}.fc-res.won{color:var(--fc-acid)}.fc-res.lost{color:#ffb4a8}.fc-real{margin:20px 0;padding:20px;border:1px solid var(--fc-line);display:grid;gap:8px}.fc-real h2{margin:0;font-size:22px;line-height:1.15}.fc-real p{margin:0;font-size:14px;line-height:1.5;color:var(--fc-muted)}.fc-real p.warn{color:#ffb4a8}
.fc-links{display:flex;flex-wrap:wrap;gap:12px 28px;margin-top:20px}
.match-forecast{margin:28px 0}
.match-forecast .fc-card{max-width:520px}
@media (max-width:600px){.fc-card{padding:18px 16px 0}.fc-go{margin:0 -16px;padding:16px}.fc-pick .fc-num{font-size:46px}.fc-main .fc-pick .fc-num{font-size:58px}.fc-teams{font-size:21px}.fc-short{font-size:19px}}`;
    document.head.appendChild(s);
  }
  const pctText=v=>`${Math.round(v*100)}%`;
  const fcLabels={home:'П1',draw:'X',away:'П2'}, fcSides={home:'хозяева',draw:'ничья',away:'гости'}, fcOut={home:'Победа хозяев',draw:'Ничья',away:'Победа гостей'};
  const fcTime=iso=>new Date(iso).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+' МСК';
  const fcClock=iso=>new Date(iso).toLocaleTimeString('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit'});
  const fcDay=iso=>new Date(iso).toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long'});
  const fcOk=f=>f&&typeof f.eventId==='string'&&['home','draw','away'].every(k=>typeof f.probabilities?.[k]==='number'&&f.probabilities[k]>=0&&f.probabilities[k]<=1)&&Array.isArray(f.reasons);
  const fcUpcoming=f=>fcOk(f)&&f.status==='pending'&&Date.parse(f.kickoff)>Date.now();
  const fcNotice=()=>forecastState==='error'?'<p class="demo-note">Не удалось загрузить прогнозы. Обновите страницу позже.</p>':forecastState!=='ready'?'<p class="demo-note">Загружаем прогнозы…</p>':'';
  const fcPlural=(n,a,b,c)=>{const x=n%10,y=n%100;return x===1&&y!==11?a:x>=2&&x<=4&&(y<12||y>14)?b:c;};
  function fcBar(f){
    return `<div class="fc-bar"><div class="fc-track" aria-hidden="true">${['home','draw','away'].map(k=>`<span${k===f.selection?' class="on"':''} style="width:${(f.probabilities[k]*100).toFixed(1)}%"></span>`).join('')}</div><ul class="fc-legend forecast-strip" aria-label="Вероятности исходов">${['home','draw','away'].map(k=>`<li${k===f.selection?' class="on" data-pick="1"':''}><span>${fcLabels[k]} · ${fcSides[k]}</span><b>${pctText(f.probabilities[k])}</b></li>`).join('')}</ul></div>`;
  }
  function fcPick(f){
    const who=f.selection==='draw'?'':' · '+(f.selection==='home'?f.home:f.away);
    return `<div class="fc-pick"><span class="fc-num">${pctText(f.probabilities[f.selection])}</span><div><b>${fcOut[f.selection]}</b><small>самый вероятный исход${h(who)}</small></div></div>`;
  }
  const fcNum=(v,lo,hi)=>typeof v==='number'&&isFinite(v)&&v>=lo&&v<=hi;
  // Outcome of a forecast from the journal (won/lost with the 90-minute score, or void); nothing for pending.
  function fcResult(f){
    if((f.status==='won'||f.status==='lost')&&f.result&&fcNum(f.result.home,0,99)&&fcNum(f.result.away,0,99)) return `<p class="fc-res ${f.status}">${f.status==='won'?'Исход совпал':'Исход не совпал'} · ${f.result.home} : ${f.result.away}</p>`;
    if(f.status==='void') return `<p class="fc-res">Не учитывается${f.voidReason?': '+h(f.voidReason):''}</p>`;
    return '';
  }
  // Real forecasts only (written before kick-off, settled after). Kept apart from the backtest block.
  function fcReal(r){
    if(!r||r.kind!=='real-forecasts'||!['forecasts','settled','voided','pending'].every(k=>Number.isInteger(r[k])&&r[k]>=0)) return '';
    const m=r.model&&fcNum(r.model.accuracy,0,1)&&fcNum(r.model.logLoss,0,10)?r.model:null, b=r.leagueFrequencies&&fcNum(r.leagueFrequencies.logLoss,0,10)?r.leagueFrequencies:null;
    const by=Object.entries(r.byCompetition||{}).filter(([,x])=>x&&Number.isInteger(x.n)&&fcNum(x.accuracy,0,1));
    return `<section class="fc-real" aria-label="История реальных прогнозов"><p class="fc-kicker">Реальные прогнозы</p><h2>${m?'Исход совпал в '+pctText(m.accuracy):'Пока без результатов'}</h2><p>Записано до матчей: ${r.forecasts}${r.since?' с '+h(fcTime(r.since)):''} · завершено: ${r.settled} · ожидают: ${r.pending} · не учитываются: ${r.voided}.</p>${m&&b?`<p>Логарифмическая ошибка ${m.logLoss.toFixed(3).replace('.',',')} · простые частоты исходов ${b.logLoss.toFixed(3).replace('.',',')}. Меньше — лучше.</p>`:''}${by.map(([n,x])=>`<p>${h(n)}: ${x.n} завершено, совпало ${pctText(x.accuracy)}.</p>`).join('')}${r.note?`<p class="warn">${h(r.note)}</p>`:''}<p>Это история прогнозов, записанных до матчей. Проверка модели на прошлых сезонах — отдельно, ниже.</p></section>`;
  }
  function forecastCard(f){
    const d=f.details||{};
    return `<article class="fc-card" data-forecast="${h(f.eventId)}"><div class="fc-top"><p class="fc-kicker">${h(f.league)}</p><span class="fc-time">${h(fcClock(f.kickoff))} МСК</span></div><h3 class="fc-teams"><span>${h(f.home)}</span><span>${h(f.away)}</span></h3>${d.observation===true?'<p class="fc-obs">Режим наблюдения</p>':''}${fcPick(f)}${fcBar(f)}${d.summary?`<p class="fc-sum">${h(d.summary)}</p>`:''}${fcResult(f)}<a class="fc-go" href="/forecast/${encodeURIComponent(f.eventId)}" aria-label="Подробный разбор: ${h(f.home)} — ${h(f.away)}"><span>Подробный разбор</span><span aria-hidden="true">↗</span></a></article>`;
  }
  function fcDays(list){
    let out='', last='';
    list.forEach((f,i)=>{
      const d=fcDay(f.kickoff);
      if(d!==last){ if(last) out+='</div>'; last=d; const n=list.filter(x=>fcDay(x.kickoff)===d).length; out+=`<div class="fc-day"><b>${h(d)}</b><span>${n} ${fcPlural(n,'матч','матча','матчей')}</span></div><div class="fc-grid">`; }
      out+=forecastCard(f);
    });
    return out+(last?'</div>':'');
  }
  function fcMethod(q,ucl){
    if(!q||!q.evaluation||!q.prospective) return '';
    return `<details class="fc-method"><summary>Как модель считает и как проверена</summary><p>Модель оценивает, сколько голов команды забивают и пропускают дома и в гостях за последние два года — свежие матчи весят больше, — и переводит это в вероятности исходов основного времени. Составы, травмы и коэффициенты букмекеров не учитываются.</p><dl class="fc-stats"><div><dt>${pctText(q.evaluation.model.accuracy)}</dt><dd>исход совпал в сезоне ${h(q.evaluation.season)} · ${q.evaluation.matches} матчей</dd></div><div><dt>${pctText(q.evaluation.leagueFrequencies.accuracy)}</dt><dd>у простого ориентира — частот исходов в лиге</dd></div><div><dt>${pctText(q.prospective.model.accuracy)}</dt><dd>в текущем сезоне до расчёта · ${q.prospective.matches} матчей</dd></div></dl><p>В проверке каждый прогноз считался только по матчам, сыгранным раньше него. Это результат на прошлых матчах, а не обещание выигрыша. Чемпионаты: ${h((q.leagues||[]).join(', '))}.</p>${ucl?'<p>Лига чемпионов считается отдельно: рейтинг Эло по всем турнирам клуба — национальным лигам и еврокубкам.</p>':''}</details>`;
  }
  function renderForecasts(){
    forecastStyles();
    const d=forecastFeed, byTime=(a,b)=>Date.parse(a.kickoff)-Date.parse(b.kickoff), list=d?d.forecasts.filter(fcUpcoming).sort(byTime):[], q=d&&d.quality;
    const leagues=d?[...new Set(d.forecasts.filter(fcOk).map(f=>String(f.league)))]:[], ucl=!!d&&d.forecasts.some(f=>f.modelVersion==='elo-cross-league-v1');
    const settled=d?d.forecasts.filter(f=>f.status==='won'||f.status==='lost'||f.status==='void').length:0;
    // Matches that started after the calculation stay listed, marked: the forecast was fixed before kick-off.
    const past=d?d.forecasts.filter(f=>fcOk(f)&&Date.parse(f.kickoff)<=Date.now()).sort((a,b)=>byTime(b,a)):[];
    const snapshot=window.TRIBUNA_FORECASTS_SNAPSHOT===true, stale=d&&!snapshot&&Date.now()-Date.parse(d.updatedAt)>6*3600000;
    const meta=d?`<ul class="fc-meta"><li>${snapshot?'Демо · снимок ':'Расчёт '}${h(fcTime(d.updatedAt))}</li><li>${d.forecasts.length} ${fcPlural(d.forecasts.length,'матч','матча','матчей')}</li>${snapshot?'<li>Не обновляется</li>':stale?'<li>Данные устарели, требуется пересчёт</li>':''}<li>18+</li></ul>`:'';
    return `<section class="wrap reading-forecasts fc-wrap"><a class="back-link" href="/matches">← Все матчи</a><div class="category-header"><p>Футбол · ${h(leagues.length?leagues.join(', '):q?q.leagues.join(', '):'шесть чемпионатов')}</p><h1>ПРОГНОЗЫ</h1><p>Вероятности исходов основного времени по модели «Трибуны» — не коэффициенты букмекеров и не совет делать ставку.</p></div>${meta}${fcNotice()}${d?(list.length?fcDays(list):(past.length?'':'<p class="demo-note">Ближайших матчей с прогнозом нет.</p>')):''}${d?fcReal(d.realStats):''}${past.length?`<h2 class="fc-group">Уже сыграны или идут</h2><p class="demo-note">Прогноз зафиксирован до начала матча и не меняется.${settled?' Результат — счёт основного времени.':' Итоги матчей здесь не подставляются.'}</p>${fcDays(past)}`:''}${fcMethod(q,ucl)}<p class="fc-legal">Вероятность — оценка модели, а не обещание результата. 18+</p></section>`;
  }
  const fcSigned=(r,verb)=>{const v=Math.round((r-1)*100);return verb+' '+(v===0?'на уровне лиги':(v>0?'+':'−')+Math.abs(v)+'% к среднему');};
  function renderForecast(id){
    forecastStyles();
    const f=forecastFeed&&forecastFeed.forecasts.find(x=>x.eventId===id&&fcOk(x));
    if(!f) return `<section class="wrap reading-match reading-forecast fc-wrap"><a class="back-link" href="/forecasts">← Все прогнозы</a>${fcNotice()||'<p class="demo-note">Прогноз на этот матч не найден.</p>'}</section>`;
    const d=f.details||{}, started=Date.parse(f.kickoff)<=Date.now(), m=(window.__INITIAL__?.matches||[]).find(x=>x.id===f.eventId), snapshot=window.TRIBUNA_FORECASTS_SNAPSHOT===true;
    const blocks=[];
    if(d.expectedGoals) blocks.push(['Ожидаемые голы',`<div class="fc-xg"><div><b>${d.expectedGoals.home.toFixed(2).replace('.',',')}</b><span>${h(f.home)}</span></div><div><b>${d.expectedGoals.away.toFixed(2).replace('.',',')}</b><span>${h(f.away)}</span></div></div><p class="fc-cap">Расчёт по забитым и пропущенным голам, не xG по ударам.</p>`]);
    if(d.strength) blocks.push(['Сила команд относительно лиги',[[f.home+' дома',d.strength.home],[f.away+' в гостях',d.strength.away]].map(([n,s])=>`<div class="fc-row"><b>${h(n)}</b><ul class="fc-chips"><li class="${s.attack>=1.05?'good':s.attack<=.95?'bad':''}">${fcSigned(s.attack,'Забивает')}</li><li class="${s.defense<=.95?'good':s.defense>=1.05?'bad':''}">${fcSigned(s.defense,'Пропускает')}</li></ul></div>`).join('')]);
    if(d.form&&(d.form.home.length||d.form.away.length)) blocks.push(['Последние матчи в чемпионате',[[f.home,d.form.home],[f.away,d.form.away]].map(([n,r])=>`<div class="fc-row"><b>${h(n)}</b><ul class="fc-form" aria-label="От старых к новым: ${h(r.join(', ')||'нет данных')}">${(r.length?r:['—']).map(x=>`<li class="${x==='В'?'w':x==='П'?'l':'d'}">${h(x)}</li>`).join('')}</ul></div>`).join('')+'<p class="fc-cap">В — победа, Н — ничья, П — поражение; слева направо от старых к новым.</p>']);
    const r=d.ratings;
    if(r&&fcNum(r.home,0,4000)&&fcNum(r.away,0,4000)&&fcNum(r.difference,-4000,4000)) blocks.push(['Рейтинг Эло по всем турнирам',`<div class="fc-xg"><div><b>${Math.round(r.home)}</b><span>${h(f.home)}</span></div><div><b>${Math.round(r.away)}</b><span>${h(f.away)}</span></div></div><p class="fc-cap">${r.homeAdvantage?'Преимущество своего поля: +'+Math.round(r.homeAdvantage)+'. ':'Нейтральное поле. '}Разница с учётом поля: ${r.difference>0?'+':''}${Math.round(r.difference)}. Рейтинг считается по всем матчам клуба — в национальной лиге и еврокубках.</p>`]);
    if(d.scores&&d.scores.length) blocks.push(['Самые вероятные счета',`<ul class="fc-scores">${d.scores.map(s=>`<li><b>${h(s.score.replace(':',' : '))}</b><span>${pctText(s.probability)}</span></li>`).join('')}</ul>`]);
    blocks.push(['Что модель не учитывает','<p>Составы, травмы, мотивацию, погоду и коэффициенты букмекеров.</p>']);
    const body=f.details?`<div class="fc-blocks">${blocks.map(([t,c],i)=>`<section class="fc-block"><p class="fc-kicker">${String(i+1).padStart(2,'0')} / ${h(t)}</p>${c}</section>`).join('')}</div>`:f.reasons.map(r=>`<p class="market-explanation forecast-reason">${h(r)}</p>`).join('');
    return `<section class="wrap reading-match reading-forecast fc-wrap" data-forecast="${h(f.eventId)}"><a class="back-link" href="/forecasts">← Все прогнозы</a><p class="fc-kicker" style="margin-top:18px">Футбол · ${h(f.league)} · ${h(fcTime(f.kickoff))}</p><h1 class="fc-h1"><span>${h(f.home)}</span><span>— ${h(f.away)}</span></h1><div class="fc-main"><p class="fc-kicker">Прогноз модели · основное время</p>${fcPick(f)}${fcBar(f)}${fcResult(f)}${started&&!fcResult(f)?'<p class="fc-note">Матч начался: прогноз зафиксирован до начала и не меняется.</p>':''}</div>${d.observation===true?'<p class="fc-obs" style="margin-top:14px">Режим наблюдения</p><p class="fc-note" style="margin-top:8px">Модель Лиги чемпионов: на прошлых сезонах её преимущество над простыми частотами исходов не доказано. Прогнозы записываются до матчей, чтобы проверить её честно.</p>':''}${d.summary?`<p class="fc-short">${h(d.summary)}</p>`:''}${body}${factsSection({eventId:f.eventId})}<p class="fc-foot">${snapshot?'Демо: снимок расчёта ':'Расчёт '}${h(fcTime(f.issuedAt))}${snapshot?', не обновляется':''}. Учтены результаты до ${h(fcTime(f.inputUntil))}${d.sample&&Number.isInteger(d.sample.league)?`; ${d.sample.league} матчей лиги, из них ${d.sample.home} домашних у хозяев и ${d.sample.away} выездных у гостей`:d.sample&&Number.isInteger(d.sample.ratingGames)?`; ${d.sample.ratingGames} матчей во всех турнирах, у хозяев ${d.sample.homeGames}, у гостей ${d.sample.awayGames}`:''}. Модель ${h(f.modelVersion)} · ${h(f.source)}. Вероятность — оценка, а не обещание результата. 18+</p><div class="fc-links">${m?`<a class="editorial-link" href="/match/${encodeURIComponent(m.id)}">Страница матча ↗</a>`:''}<a class="editorial-link" href="/forecasts">Все прогнозы ↗</a></div></section>`;
  }

  // «Факты к матчу» (service/facts): neutral facts next to the forecast, never part of it. Every block shows its
  // source, the time it was checked and its period; missing data is said, lineups are only the confirmed ones.
  const FACTS_URL=window.TRIBUNA_FACTS_URL||'/facts.json';
  let factsFeed=null, factsState='idle';
  function loadFacts(){
    if(factsState!=='idle') return;
    factsState='loading';
    fetch(FACTS_URL,{credentials:'omit'}).then(r=>{if(!r.ok)throw new Error('facts '+r.status);return r.json();}).then(d=>{
      if(!d||d.version!==1||!Array.isArray(d.matches)) throw new Error('facts feed');
      factsFeed=d; factsState='ready';
    }).catch(()=>{factsState='error';}).finally(()=>{
      const p=routePath().split('/').filter(Boolean)[0];
      if(p==='forecast'||p==='match') render();
    });
  }
  function factsFor(q){
    if(!factsFeed) return null;
    const key=v=>String(v||'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]/g,'');
    const day=iso=>new Date(Date.parse(iso)+3*3600000).toISOString().slice(0,10);
    return factsFeed.matches.find(x=>q.eventId&&x.eventId===q.eventId)||(q.home?factsFeed.matches.find(x=>key(x.home)===key(q.home)&&key(x.away)===key(q.away)&&day(x.kickoff)===q.date):null)||null;
  }
  const fxTime=iso=>iso?new Date(iso).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+' МСК':'время неизвестно';
  function fxStale(kind,b,kickoff){
    if(!b) return '';
    const at=Date.parse(b.fetchedAt||''), k=Date.parse(kickoff), now=Date.now();
    if(!isFinite(at)) return 'Время проверки неизвестно.';
    if(kind==='absences') return now>=k?'Список на момент последней проверки до матча.':now-at>6*3600000?'Данные могли устареть: список не обновлялся больше 6 часов.':'';
    if(kind==='lineups') return b.state!=='present'&&now>=k-3600000&&at<k-3600000?'Составы уже могли выйти, но мы не обновляли данные после проверки.':'';
    return now-at>86400000?'Данные могли устареть: не обновлялись больше суток.':'';
  }
  function fxFoot(b,stale,period){
    return `<p class="fx-meta">${period?h(period)+'<br>':''}Источник: ${h(b.source)} · проверено ${h(fxTime(b.fetchedAt))}</p>${stale?`<p class="fx-meta fx-stale">${h(stale)}</p>`:''}`;
  }
  const fxMissing=t=>`<p class="fx-missing">${h(t)}</p>`;
  const fxDate=d=>new Date(d+'T12:00:00+03:00').toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'short',year:'numeric'});
  function renderFacts(f){
    const side=s=>s==='home'?f.home:f.away;
    const sec=(title,body)=>`<section class="fx-card"><h3>${h(title)}</h3>${body}</section>`;
    const a=f.absences, l=f.lineups, fm=f.form, hh=f.headToHead, ts=f.teamStats;
    const abs=!a?fxMissing('Нет данных об отсутствующих.'):['home','away'].map(sd=>{const list=a.items.filter(x=>x.side===sd);
      return `<div class="fx-team"><b>${h(side(sd))}</b>${list.length?`<ul class="fx-list">${list.map(x=>`<li><span><b>${h(x.nameRu||x.name)}</b><small>${h(x.reasonRu||x.reason||'причина не указана')}${x.nameRu?' · в источнике: '+h(x.name):' · имя как в источнике'}</small></span><em class="fx-chip ${x.status==='out'?'out':'doubt'}">${x.status==='out'?'не сыграет':'под вопросом'}</em></li>`).join('')}</ul>`:fxMissing('Источник не сообщил об отсутствующих. Это не значит, что все игроки доступны.')}</div>`;}).join('')+fxFoot(a,fxStale('absences',a,f.kickoff),'«Под вопросом» — решение примут перед матчем. Русское написание фамилий — редакционное.');
    const lin=!l?fxMissing('Нет данных о составах.'):(l.state==='present'?l.items.map(t=>`<div class="fx-team"><b>${h(t.team)}${t.formation?' · '+h(t.formation):''}</b><p>${t.startXI.map(x=>h(x.nameRu||x.name)).join(', ')}</p><p class="fx-meta">Подтверждённый стартовый состав · запасных: ${t.substitutes}${t.coach?' · тренер: '+h(t.coachRu||t.coach):''} · ${(n=>n===t.startXI.length?'русское написание фамилий — редакционное':n?'русское написание — редакционное, остальные имена как в источнике':'имена как в источнике')(t.startXI.filter(x=>x.nameRu).length)}</p></div>`).join(''):fxMissing(l.note))+fxFoot(l,fxStale('lineups',l,f.kickoff));
    const R={W:['В','w'],D:['Н','d'],L:['П','l']};
    const frm=!fm?fxMissing('Нет данных о форме.'):['home','away'].map(sd=>{const rows=fm.items[sd]||[];
      return `<div class="fx-team"><b>${h(side(sd))}</b>${rows.length?`<ul class="fx-form" aria-label="${rows.slice().reverse().map(r=>R[r.result][0]).join(' ')}">${rows.slice().reverse().map(r=>`<li class="${R[r.result][1]}">${R[r.result][0]}</li>`).join('')}</ul>${rows.map(r=>`<p class="fx-meta">${h(fxDate(r.date))} · ${h(r.competition)} · ${r.venue==='home'?'дома':'в гостях'} — ${h(r.opponent)} · ${h(r.score)}</p>`).join('')}`:fxMissing('Сыгранных матчей в нашей базе нет.')}</div>`;}).join('')+fxFoot(fm,fxStale('results',fm,f.kickoff),'Последние 5 матчей во всех турнирах клуба, результат за 90 минут. Кружки слева направо — от старых к новым; В — победа, Н — ничья, П — поражение.');
    const h2h=!hh?fxMissing('Нет данных об очных встречах.'):(hh.items.length?`<ul class="fx-rows">${hh.items.map(r=>`<li>${h(fxDate(r.date))} · ${h(r.home)} <b>${h(r.score)}</b> ${h(r.away)} <small>· ${h(r.competition)}</small></li>`).join('')}</ul>`:fxMissing('В нашей базе с 2021 года очных матчей нет.'))+fxFoot(hh,fxStale('results',hh,f.kickoff),'Последние очные матчи с 2021 года, счёт за 90 минут.');
    const row=(lab,get)=>`<tr><th>${h(lab)}</th>${['home','away'].map(sd=>`<td>${ts.items[sd]?h(get(ts.items[sd])):'нет данных'}</td>`).join('')}</tr>`;
    const sea=!ts?fxMissing('Нет данных о статистике сезона.'):`<table class="fx-table"><thead><tr><th></th><th>${h(f.home)}</th><th>${h(f.away)}</th></tr></thead><tbody>${row('Матчей',t=>String(t.played))}${row('В / Н / П',t=>`${t.wins} / ${t.draws} / ${t.losses}`)}${row('Голы: забито — пропущено',t=>`${t.goalsFor} — ${t.goalsAgainst}`)}${row('Матчей без пропущенных',t=>String(t.cleanSheets))}${row('Матчей без забитых',t=>String(t.failedToScore))}${(ts.items.home&&ts.items.home.xgMatches)||(ts.items.away&&ts.items.away.xgMatches)?row('xG за матч: создано — пропущено',t=>t.xgMatches?`${t.xgFor.toFixed(2).replace('.',',')} — ${t.xgAgainst.toFixed(2).replace('.',',')}`:'нет данных'):''}${[ts.items.home,ts.items.away].some(t=>t&&t.xgMatches&&t.xgMatches<t.played)?row('Матчей с xG',t=>t.xgMatches?String(t.xgMatches):'нет данных'):''}</tbody></table>`+fxFoot(ts,fxStale('results',ts,f.kickoff),ts.period);
    return `<section class="fx-wrap" aria-label="Факты к матчу"><h2>Факты к матчу</h2><p class="fx-notice">В расчёт вероятностей не входят. Модель их не учитывает; это справка к матчу.</p>${sec('Кто не сыграет',abs)}${sec('Составы',lin)}${sec('Форма · последние матчи',frm)}${sec('Очные встречи',h2h)}${sec('Сезон в турнире',sea)}</section>`;
  }
  function factsSection(q){
    if(factsState==='idle') loadFacts();
    const f=factsFor(q);
    if(!f) return factsState==='error'&&q.eventId?'<p class="demo-note">Не удалось загрузить факты к матчу.</p>':'';
    factsStyles();
    return renderFacts(f);
  }
  function factsStyles(){
    if(document.getElementById('fx-styles')) return;
    const s=document.createElement('style'); s.id='fx-styles';
    s.textContent=`.fx-wrap{margin:28px 0;max-width:720px}.fx-wrap h2{margin:0;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--fc-acid,#E6FF57)}
.fx-notice{margin:8px 0 0;padding:10px 12px;border:1px solid var(--fc-line,rgba(242,243,238,.14));border-left:3px solid var(--fc-acid,#E6FF57);font-size:13px;color:var(--fc-ink,#F2F3EE)}
.fx-card{margin-top:12px;padding:16px;border:1px solid var(--fc-line,rgba(242,243,238,.14));background:rgba(27,29,25,.62)}
.fx-card h3{margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--fc-ink,#F2F3EE)}
.fx-team{margin-top:10px}.fx-team>b{display:block;font-size:14px;color:var(--fc-ink,#F2F3EE)}.fx-team p{margin:4px 0 0;font-size:14px;color:var(--fc-ink,#F2F3EE)}
.fx-list{list-style:none;padding:0;margin:4px 0 0}.fx-list li{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:8px 0;border-top:1px solid var(--fc-line,rgba(242,243,238,.14))}
.fx-list li span{display:grid}.fx-list li b{font-size:14px;color:var(--fc-ink,#F2F3EE)}.fx-list small,.fx-rows small{font-size:12px;color:var(--fc-muted,rgba(242,243,238,.72))}
.fx-chip{font-style:normal;font-weight:700;font-size:11px;padding:4px 8px;color:#1B1D19;white-space:nowrap}.fx-chip.out{background:#FF8A7A}.fx-chip.doubt{background:#E8AD7D}
.fx-form{list-style:none;padding:0;margin:6px 0;display:flex;gap:6px}.fx-form li{width:26px;height:26px;display:grid;place-items:center;font-weight:700;font-size:12px}
.fx-form li.w{background:#E6FF57;color:#1B1D19}.fx-form li.d{background:rgba(242,243,238,.24);color:#F2F3EE}.fx-form li.l{background:#FF8A7A;color:#1B1D19}
.fx-rows{list-style:none;padding:0;margin:4px 0 0}.fx-rows li{padding:6px 0;font-size:14px;color:var(--fc-ink,#F2F3EE)}
.fx-table{width:100%;border-collapse:collapse;font-size:14px;color:var(--fc-ink,#F2F3EE)}.fx-table th,.fx-table td{padding:8px 0;border-top:1px solid var(--fc-line,rgba(242,243,238,.14));text-align:right}
.fx-table th:first-child{text-align:left;font-weight:400;color:var(--fc-muted,rgba(242,243,238,.72));font-size:12px}.fx-table thead th{border-top:0;font-weight:700;color:var(--fc-ink,#F2F3EE)}
.fx-meta{margin:10px 0 0;font-size:12px;line-height:1.45;color:var(--fc-muted,rgba(242,243,238,.72))}.fx-stale{color:#E8AD7D}.fx-missing{margin:6px 0 0;font-size:14px;color:var(--fc-muted,rgba(242,243,238,.72))}`;
    document.head.appendChild(s);
  }
  function forecastTeaser(m){
    if(forecastState==='idle') loadForecasts();
    // By match id (football from the odds board) or, for other feeds, by both team names and the Moscow date.
    const key=v=>String(v||'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]/g,'');
    const day=f=>new Date(Date.parse(f.kickoff)+3*3600000).toISOString().slice(0,10);
    const f=forecastFeed&&(forecastFeed.forecasts.find(x=>x.eventId===m.id&&fcOk(x))||(m.sport==='Футбол'?forecastFeed.forecasts.find(x=>fcOk(x)&&key(x.home)===key(m.home)&&key(x.away)===key(m.away)&&day(x)===m.date):null));
    if(!f) return '';
    forecastStyles();
    return `<div class="match-forecast fc-wrap"><h2>Прогноз модели</h2><div class="fc-card">${fcPick(f)}${fcBar(f)}${f.details?.summary?`<p class="fc-sum">${h(f.details.summary)}</p>`:''}<a class="fc-go" href="/forecast/${encodeURIComponent(f.eventId)}"><span>Почему так — подробный разбор</span><span aria-hidden="true">↗</span></a></div></div>`;
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
      loadForecasts(); if(parts[0]==='forecast') loadFacts();
      document.body.classList.add('forecast-route');
      page.innerHTML=parts[0]==='forecasts'?renderForecasts():renderForecast(decodeURIComponent(parts[1]));
      document.title=(parts[0]==='forecasts'?'Прогнозы':'Прогноз матча')+' — Трибуна';closeMenu();setPageSchema(null);
      return;
    }
    document.body.classList.remove('forecast-route');
    forecastBaseRender();
    if(parts[0]==='matches'&&!page.querySelector('.forecast-entry')) {
      const at=page.querySelector('.category-header')||page.querySelector('h1');
      if(at) at.insertAdjacentHTML('afterend','<p class="forecast-entry demo-note"><a class="editorial-link" href="/forecasts">Прогнозы модели на футбол ↗</a> Вероятности исходов по шести чемпионатам — не коэффициенты букмекеров.</p>');
    }
  };
  render();
})();
