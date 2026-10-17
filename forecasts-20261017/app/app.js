// Демо приложения «Трибуна»: маршруты по hash, нижняя панель, экраны.
// Все данные — из ../data/app-data.json (собран тем же кодом разбора, что приложение). Ничего не выдумывается.
(function () {
  'use strict';
  var UI = window.TribunaUI, R = window.TribunaRating;
  var $ = function (id) { return document.getElementById(id); };
  var app = $('app'), fatal = $('fatal');
  function crash() { if (fatal) fatal.hidden = false; }
  window.addEventListener('error', crash);
  window.addEventListener('unhandledrejection', crash);
  $('fatal-reload').addEventListener('click', function () { location.reload(); });
  if (!UI) { crash(); return; }
  var el = UI.el, reduce = UI.reduce;
  var SRC = '../data/app-data.json';
  var DATA = null;

  /* ---------- помощники ---------- */
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е'); }
  function day(s, year) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + (year ? ' ' + m[1] : '') : ''; }
  function stamp(s) {
    var d = new Date(s); if (isNaN(d)) return '';
    return d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' }) + ' МСК';
  }
  function mskDate(offsetDays) { // сегодняшняя дата по Москве: расписание в данных тоже по Москве
    var d = new Date(Date.now() + (offsetDays || 0) * 864e5);
    var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d), o = {};
    p.forEach(function (x) { o[x.type] = x.value; });
    return o.year + '-' + o.month + '-' + o.day;
  }
  function plural(n, one, few, many) { var a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; }
  function stateBlock(title, text, retry, plain) {
    var s = el('div', 'state' + (plain ? ' plain' : '')); s.appendChild(el('b', null, title)); if (text) s.appendChild(el('span', null, text));
    if (retry) { var b = el('button', 'btn', 'Повторить'); b.type = 'button'; b.addEventListener('click', retry); s.appendChild(b); }
    return s;
  }
  function skeleton(host) { host.textContent = ''; host.setAttribute('aria-busy', 'true'); var s = el('p', 'sr', 'Загружаем данные…'); host.appendChild(s); for (var i = 0; i < 4; i++) host.appendChild(el('div', 'skeleton')); }
  function external(a, url) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  function https(u) { return /^https:\/\//.test(u || ''); }
  function safe(name, fn) { try { fn(); } catch (e) { if (window.console) console.error(name, e); crash(); } }

  /* ---------- нижняя панель: арка и одна пружина (nav-demo) ---------- */
  var TABS = [
    { id: 'journal', icon: 'journal', label: 'Журнал', w: 19.8, h: 20.8 },
    { id: 'news', icon: 'news', label: 'Новости', w: 21.8, h: 21.8 },
    { id: 'matches', icon: 'matches', label: 'Матчи', w: 21.8, h: 17.8 },
    { id: 'rating', icon: 'books', label: 'Рейтинг', w: 21.8, h: 18.8 },
    { id: 'forecasts', icon: 'predictions', label: 'Прогнозы', w: 21.8, h: 21.8 }
  ];
  // Те же числа, что в src/TribunaNavigation.tsx (UI72).
  var WAVE = { base: 61.5, top: 3.5, half: 0.66, flank: 0.62, pad: 10, maxHalf: 54 };
  var SPRING = { damping: 22, stiffness: 240, mass: 0.8 };
  var capsule = $('capsule'), waveSvg = $('wave-svg'), wavePath = $('wave-line'), glowPath = $('wave-glow');
  var navIndex = 0, navWidth = 0, navRaf = 0, navLast = 0, X = { x: 0, v: 0 };
  var cells = TABS.map(function (t, i) {
    var b = el('button', 'cell'); b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'tab-' + t.id; b.setAttribute('aria-controls', 's-' + t.id);
    var ico = el('span', 'ico'); ico.style.setProperty('--src', 'url(icons/' + t.icon + '.svg)'); ico.style.setProperty('--w', t.w + 'px'); ico.style.setProperty('--h', t.h + 'px');
    b.appendChild(ico); b.appendChild(el('span', 'lab', t.label));
    b.addEventListener('click', function () { openTab(i); });
    capsule.appendChild(b); return b;
  });
  function openTab(i) {
    var id = TABS[i].id, now = parse();
    if (now.name === id) { var s = screens[id]; s.scrollTo({ top: 0, behavior: reduce.matches ? 'auto' : 'smooth' }); return; }
    location.hash = id;
  }
  capsule.addEventListener('keydown', function (e) {
    var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
    e.preventDefault(); var n = (navIndex + d + TABS.length) % TABS.length; openTab(n); cells[n].focus();
  });
  // Метка фокуса — только для клавиатуры: касание и клик её не рисуют.
  window.addEventListener('keydown', function (e) { if (e.key === 'Tab' || e.key.indexOf('Arrow') === 0) document.documentElement.classList.add('kbd'); });
  window.addEventListener('pointerdown', function () { document.documentElement.classList.remove('kbd'); });
  function drawWave() {
    var cell = (navWidth - WAVE.pad * 2) / TABS.length;
    var half = Math.min(cell * WAVE.half, WAVE.maxHalf), flank = half * WAVE.flank, plateau = half - flank;
    var cx = WAVE.pad + X.x * cell + cell / 2, a = cx - half, b = cx + half, base = WAVE.base, top = WAVE.top;
    var f = function (n) { return n.toFixed(2); };
    var arch = 'C ' + f(a + flank * 0.5) + ' ' + base + ' ' + f(cx - plateau - flank * 0.5) + ' ' + top + ' ' + f(cx - plateau) + ' ' + top +
      ' L ' + f(cx + plateau) + ' ' + top +
      ' C ' + f(cx + plateau + flank * 0.5) + ' ' + top + ' ' + f(b - flank * 0.5) + ' ' + base + ' ' + f(b) + ' ' + base;
    wavePath.setAttribute('d', 'M -8 ' + base + ' L ' + f(a) + ' ' + base + ' ' + arch + ' L ' + f(navWidth + 8) + ' ' + base);
    glowPath.setAttribute('d', 'M ' + f(a) + ' ' + base + ' ' + arch + ' Z');
  }
  function navTick(now) {
    var dt = Math.max(0, Math.min(0.064, (now - navLast) / 1000)); navLast = now;
    var moving = true;
    for (var n = Math.max(1, Math.ceil(dt / 0.004)), i = 0; i < n; i++) {
      var acc = (-SPRING.stiffness * (X.x - navIndex) - SPRING.damping * X.v) / SPRING.mass;
      X.v += acc * dt / n; X.x += X.v * dt / n;
    }
    if (Math.abs(X.x - navIndex) < 0.0008 && Math.abs(X.v) < 0.008) { X.x = navIndex; X.v = 0; moving = false; }
    drawWave();
    navRaf = moving ? requestAnimationFrame(navTick) : 0;
  }
  function setNav(i, instant) {
    navIndex = i;
    cells.forEach(function (c, n) { c.setAttribute('aria-selected', n === i ? 'true' : 'false'); c.tabIndex = n === i ? 0 : -1; });
    if (reduce.matches || instant) { X.x = i; X.v = 0; drawWave(); return; }
    if (!navRaf) { navLast = performance.now(); navRaf = requestAnimationFrame(navTick); }
  }
  function measureNav() { navWidth = capsule.clientWidth; waveSvg.setAttribute('width', navWidth); drawWave(); }
  window.addEventListener('resize', measureNav);
  if (reduce.addEventListener) reduce.addEventListener('change', function () { X.x = navIndex; X.v = 0; drawWave(); });

  /* ---------- маршруты ---------- */
  var NAMES = ['journal', 'news', 'matches', 'rating', 'forecasts', 'forecast', 'article', 'about', 'auth'];
  var TITLES = { journal: 'Журнал', news: 'Новости', matches: 'Матчи', rating: 'Рейтинг', forecasts: 'Прогнозы', forecast: 'Прогноз матча', article: 'Статья', about: 'О приложении', auth: 'Вход' };
  var screens = {}; NAMES.forEach(function (n) { screens[n] = $('s-' + n); });
  var current = null, currentKey = '', scrollPos = {}, steps = 0, first = true;
  function parse() {
    var h = location.hash.replace(/^#/, ''), q = h.indexOf('?'), query = q >= 0 ? h.slice(q + 1) : '';
    if (q >= 0) h = h.slice(0, q);
    var parts = h.split('/'), arg = '';
    try { arg = decodeURIComponent(parts.slice(1).join('/')); } catch (e) { arg = ''; }
    return { name: parts[0] || 'journal', arg: arg, query: query };
  }
  function route() {
    var r = parse();
    if (!screens[r.name]) { try { history.replaceState(null, '', '#journal'); } catch (e) { /* file:// */ } r = { name: 'journal', arg: '', query: '' }; }
    var key = r.name === 'article' || r.name === 'forecast' ? r.name + '/' + r.arg : r.name, next = screens[r.name];
    if (current) scrollPos[currentKey] = current.scrollTop;
    if (R) R.closeSheet();
    var changed = key !== currentKey;
    if (current && current !== next) current.hidden = true;
    // Opened straight on a section link: no screen has been current yet, so hide every other one.
    if (!current) Object.keys(screens).forEach(function (k) { if (screens[k] !== next) screens[k].hidden = true; });
    next.hidden = false; next.classList.remove('enter');
    if (changed && !first && !reduce.matches) { void next.offsetWidth; next.classList.add('enter'); }
    current = next; currentKey = key;
    if (r.name === 'article') safe('article', function () { renderArticle(r.arg); });
    if (r.name === 'forecast') safe('forecast', function () { renderForecast(r.arg); });
    if (r.name === 'forecasts') safe('forecasts', renderForecasts);
    if (r.name === 'auth') setMode(/(?:^|&)mode=register/.test(r.query) ? 'register' : 'login', false);
    next.scrollTop = scrollPos[key] || 0;
    var tab = r.name === 'article' ? 0 : TABS.map(function (t) { return t.id; }).indexOf(r.name === 'forecast' ? 'forecasts' : r.name);
    var noDock = r.name === 'about' || r.name === 'auth';
    app.classList.toggle('no-dock', noDock);
    Array.prototype.forEach.call(capsule.querySelectorAll('.cell'), function (c) { c.disabled = noDock; });
    if (tab >= 0) setNav(tab, first);
    document.title = (r.name === 'article' ? articleTitle(r.arg) : r.name === 'forecast' ? forecastTitle(r.arg) : r.name === 'auth' ? (authMode() === 'login' ? 'Вход' : 'Регистрация') : TITLES[r.name]) + ' — Трибуна, демо приложения';
    refit(r.name);
    if (!first && changed && tab < 0 || (!first && (r.name === 'article' || r.name === 'forecast'))) { var h = next.querySelector('h1'); if (h) h.focus({ preventScroll: true }); }
    first = false;
  }
  function refit(name) {
    var s = searches[name]; if (s) s.redraw();
    var t = innerTabs[name]; if (t) t.refit();
    if (name === 'rating' && R) R.relayout();
    if (name === 'auth') fitPanel();
  }
  window.addEventListener('hashchange', function () { steps++; safe('route', route); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-back]'), function (b) {
    b.addEventListener('click', function () { if (steps > 0) history.back(); else location.hash = b.getAttribute('data-back'); });
  });
  // Фон сдвигается вместе с прокруткой экрана — как на лендинге со страницей.
  window.__flowScroll = function () { return current ? current.scrollTop : 0; };

  /* ---------- общие поля экранов ---------- */
  var searches = {}, innerTabs = {};
  var J = { topic: 'Главное', q: '', picks: [] }, N = { cat: 'Все', q: '' }, M = { day: 'Ближайшие', sport: null, q: '' };
  var jBody = $('j-body'), nBody = $('n-body'), mBody = $('m-body');
  var COVER = { 'Теннис': ['#42601a', '#D9FF5E'], 'Баскетбол': ['#6a3410', '#FFA35C'], 'Хоккей': ['#143e58', '#8FDBFF'], 'Футбол': ['#0f5232', '#6BEA98'], 'Стиль': ['#481c54', '#EC9CFF'], 'Спорт': ['#3a4016', '#E6FF57'] };
  function cover(a) { var c = COVER[a.category] || COVER['Спорт'], d = el('div', 'cover'); d.style.setProperty('--c1', c[0]); d.style.setProperty('--c2', c[1]); d.setAttribute('aria-hidden', 'true'); return d; }
  function artNo(a) { return String(DATA.articles.indexOf(a) + 1).padStart(2, '0'); }

  /* ---------- Журнал ---------- */
  function renderJournal() {
    var q = norm(J.q.trim());
    var list = DATA.articles.filter(function (a) {
      var byTopic = J.topic === 'Главное' || (J.topic === 'Для вас' ? J.picks.indexOf(a.category) >= 0 : a.category === J.topic);
      return byTopic && (!q || norm(a.title + ' ' + a.description + ' ' + a.category + ' ' + a.format).indexOf(q) >= 0);
    });
    jBody.textContent = ''; jBody.removeAttribute('aria-busy');
    if (J.topic === 'Для вас') {
      var box = el('div', 'picker'); box.appendChild(el('p', null, 'Отметьте темы — лента соберётся из них. Выбор живёт только до закрытия вкладки: учётные записи пока не подключены.'));
      var row = el('div', 'chips'); row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Мои темы');
      J.cats.forEach(function (c) {
        var b = el('button', 'chip', c); b.type = 'button'; b.setAttribute('aria-pressed', J.picks.indexOf(c) >= 0 ? 'true' : 'false');
        b.addEventListener('click', function () { var at = J.picks.indexOf(c); if (at >= 0) J.picks.splice(at, 1); else J.picks.push(c); renderJournal(); var again = jBody.querySelectorAll('.picker .chip')[J.cats.indexOf(c)]; if (again) again.focus({ preventScroll: true }); });
        row.appendChild(b);
      });
      box.appendChild(row); jBody.appendChild(box);
    }
    $('j-count').textContent = list.length + ' ' + plural(list.length, 'материал', 'материала', 'материалов') + (q ? ' по запросу «' + J.q.trim() + '»' : '') + (J.topic !== 'Главное' ? ' · ' + J.topic : '');
    if (!list.length) {
      jBody.appendChild(J.topic === 'Для вас' && !J.picks.length ? stateBlock('Темы не выбраны', 'Отметьте хотя бы одну тему выше.', null, true)
        : stateBlock('Ничего не найдено', q ? 'Попробуйте другое слово или другую тему.' : 'В этой теме пока нет материалов.', null, true));
      return;
    }
    var from = 0;
    if (J.topic === 'Главное' && !q) {
      var a = list[0], hero = el('a', 'hero'); hero.href = '#article/' + encodeURIComponent(a.id); hero.dataset.id = a.id;
      hero.appendChild(el('p', 'kicker', 'Главная история · ' + a.category));
      hero.appendChild(el('h2', null, a.title)); hero.appendChild(el('p', 'desc', a.description));
      var cv = cover(a); cv.appendChild(el('b', null, artNo(a))); cv.appendChild(el('span', null, a.format)); hero.appendChild(cv);
      var more = el('p', 'more'); more.appendChild(el('span', null, 'Читать историю · ' + a.minutes + ' мин →')); more.appendChild(el('span', null, day(a.date, true))); hero.appendChild(more);
      jBody.appendChild(hero); jBody.appendChild(el('h2', 'sub-h', 'Все материалы')); from = 1;
    }
    list.slice(from).forEach(function (a) {
      var c = el('a', 'acard'); c.href = '#article/' + encodeURIComponent(a.id); c.dataset.id = a.id;
      var cv = cover(a); cv.appendChild(el('b', null, artNo(a))); c.appendChild(cv);
      var t = el('div', 'txt'); t.appendChild(el('span', 'tag', a.category + ' · ' + a.format)); t.appendChild(el('h3', null, a.title));
      t.appendChild(el('p', 'meta', day(a.date, true) + ' · ' + a.minutes + ' мин')); c.appendChild(t);
      jBody.appendChild(c);
    });
  }
  function initJournal() {
    J.cats = []; DATA.articles.forEach(function (a) { if (a.category && J.cats.indexOf(a.category) < 0) J.cats.push(a.category); });
    if (!DATA.articles.length) { $('j-tools').hidden = true; jBody.textContent = ''; jBody.appendChild(stateBlock('В журнале пока пусто', 'В данных нет ни одной статьи.')); return; }
    $('j-tools').hidden = false;
    if (!searches.journal) searches.journal = UI.makeSearch($('j-search'), { id: 'j-q', placeholder: 'Заголовок, тема, формат', label: 'Поиск по журналу', hint: 'Поиск по журналу', onInput: function (v) { J.q = v; renderJournal(); } });
    if (innerTabs.journal) renderJournal(); else innerTabs.journal = UI.makeTabs($('j-tabs'), ['Главное', 'Для вас'].concat(J.cats), function (name) { J.topic = name; renderJournal(); }, 'j');
  }

  /* ---------- Статья ---------- */
  function findArticle(id) { return DATA ? DATA.articles.filter(function (a) { return a.id === id; })[0] : null; }
  function articleTitle(id) { var a = findArticle(id); return a ? a.title : 'Статья'; }
  var shownArticle = null;
  function renderArticle(id) {
    var host = $('a-body');
    if (!DATA) { if (loadError) { host.textContent = ''; host.appendChild(stateBlock('Не удалось загрузить статью', 'Проверьте соединение и попробуйте ещё раз. (' + loadError + ')', load)); } else skeleton(host); shownArticle = null; return; }
    if (shownArticle === id) return;
    shownArticle = id; host.textContent = ''; host.removeAttribute('aria-busy');
    var a = findArticle(id);
    if (!a) { var h0 = el('h1', null, 'Статья не найдена'); h0.id = 'a-title'; h0.tabIndex = -1; host.appendChild(h0); host.appendChild(stateBlock('Такой статьи нет в данных', 'Возможно, ссылка устарела.', null, true)); return; }
    var cv = cover(a); cv.appendChild(el('b', null, a.category)); cv.appendChild(el('span', null, a.format)); host.appendChild(cv);
    host.appendChild(el('p', 'kicker', 'Журнал · ' + a.category));
    var h = el('h1', null, a.title); h.id = 'a-title'; h.tabIndex = -1; host.appendChild(h);
    if (a.description) host.appendChild(el('p', 'standfirst', a.description));
    host.appendChild(el('p', 'byline', [a.author, day(a.date, true), a.minutes ? a.minutes + ' мин чтения' : ''].filter(Boolean).join(' · ')));
    var prose = el('div', 'prose');
    (a.blocks || []).forEach(function (b) {
      if (!b || !b.text) return;
      prose.appendChild(el(b.type === 'heading' ? 'h2' : b.type === 'quote' ? 'blockquote' : 'p', null, b.text));
    });
    if (!prose.childNodes.length) prose.appendChild(el('p', null, 'Текст статьи в данных отсутствует.'));
    host.appendChild(prose);
    var src = el('div', 'sources'), line = el('p'); line.appendChild(document.createTextNode('Источник: '));
    if (https(a.url)) { var link = el('a', null, 'trbn.ru'); external(link, a.url); link.setAttribute('aria-label', 'Источник: trbn.ru, откроется в новой вкладке'); line.appendChild(link); } else line.appendChild(document.createTextNode('trbn.ru'));
    src.appendChild(line);
    var refs = (a.sources || []).filter(function (s) { return s && s.name; });
    if (refs.length) {
      src.appendChild(el('p', null, 'Материалы, на которые опирается текст:'));
      var ul = el('ul'); refs.forEach(function (s) { var li = el('li'); if (https(s.url)) { var x = el('a', null, s.name); external(x, s.url); li.appendChild(x); } else li.textContent = s.name; ul.appendChild(li); });
      src.appendChild(ul);
    }
    src.appendChild(el('p', null, 'Иллюстрации статьи в демо не загружаются: обложка собрана из названия рубрики.'));
    host.appendChild(src);
  }

  /* ---------- Новости ---------- */
  function renderNews() {
    var q = norm(N.q.trim());
    var list = DATA.news.filter(function (n) { return (N.cat === 'Все' || n.category === N.cat) && (!q || norm(n.title + ' ' + n.source + ' ' + n.category).indexOf(q) >= 0); });
    nBody.textContent = ''; nBody.removeAttribute('aria-busy');
    $('n-count').textContent = list.length + ' ' + plural(list.length, 'новость', 'новости', 'новостей') + (q ? ' по запросу «' + N.q.trim() + '»' : '') + (N.cat !== 'Все' ? ' · ' + N.cat : '');
    var newest = DATA.news.map(function (n) { return n.date; }).filter(Boolean).sort().pop();
    nBody.appendChild(el('p', 'fresh', (newest ? 'Последняя новость получена ' + stamp(newest) + '. ' : '') + 'В файле данных — ' + DATA.news.length + ' ' + plural(DATA.news.length, 'новость', 'новости', 'новостей') + ' из ленты приложения.'));
    if (!list.length) { nBody.appendChild(stateBlock('Ничего не найдено', q ? 'Попробуйте другое слово или рубрику «Все».' : 'В этой рубрике новостей нет.', null, true)); return; }
    list.forEach(function (n, i) {
      var ok = https(n.url), c = el(ok ? 'a' : 'div', 'ncard' + (i === 0 && N.cat === 'Все' && !q ? ' first' : ''));
      if (ok) external(c, n.url);
      c.appendChild(el('span', 'badge', n.category || 'Новость')); c.appendChild(el('h3', null, n.title));
      var m = el('p', 'meta'); m.appendChild(el('span', null, (n.source || 'Источник не указан') + (n.date ? ' · получено ' + stamp(n.date) : '')));
      if (ok) { var go = el('span', 'go-src', 'Источник ↗'); m.appendChild(go); c.setAttribute('aria-label', n.title + '. Источник: ' + (n.source || 'сайт') + ', откроется в новой вкладке'); }
      c.appendChild(m); nBody.appendChild(c);
    });
  }
  function initNews() {
    if (!DATA.news.length) { $('n-tools').hidden = true; nBody.textContent = ''; nBody.appendChild(stateBlock('Новостей нет', 'В данных сейчас нет ни одной новости.')); return; }
    $('n-tools').hidden = false;
    var cats = []; DATA.news.forEach(function (n) { if (n.category && cats.indexOf(n.category) < 0) cats.push(n.category); });
    if (!searches.news) searches.news = UI.makeSearch($('n-search'), { id: 'n-q', placeholder: 'Команда, турнир, источник', label: 'Поиск по новостям', hint: 'Поиск по новостям', onInput: function (v) { N.q = v; renderNews(); } });
    if (innerTabs.news) renderNews(); else innerTabs.news = UI.makeTabs($('n-tabs'), ['Все'].concat(cats), function (name) { N.cat = name; renderNews(); }, 'n');
  }

  /* ---------- Матчи ---------- */
  function renderMatches() {
    var q = norm(M.q.trim()), today = mskDate(0), tomorrow = mskDate(1);
    var list = DATA.matches.filter(function (m) {
      var byDay = M.day === 'Ближайшие' || m.date === (M.day === 'Сегодня' ? today : tomorrow);
      return byDay && (!M.sport || m.sport === M.sport) && (!q || norm(m.home + ' ' + m.away + ' ' + m.league + ' ' + m.sport).indexOf(q) >= 0);
    }).sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
    mBody.textContent = ''; mBody.removeAttribute('aria-busy');
    $('m-count').textContent = list.length + ' ' + plural(list.length, 'матч', 'матча', 'матчей') + (M.day !== 'Ближайшие' ? ' · ' + M.day.toLowerCase() + ', ' + day(M.day === 'Сегодня' ? today : tomorrow) : '') + (M.sport ? ' · ' + M.sport : '') + (q ? ' · «' + M.q.trim() + '»' : '');
    mBody.appendChild(el('p', 'fresh', 'Время московское. ' + (DATA.matchUpdatedAt ? 'Данные от ' + stamp(DATA.matchUpdatedAt) + '. ' : '') + 'Счёт и ход встреч здесь не показываются.'));
    if (!list.length) {
      mBody.appendChild(stateBlock(M.day === 'Ближайшие' ? 'Матчей не найдено' : 'На этот день матчей в данных нет',
        q || M.sport ? 'Снимите фильтр или измените запрос.' : M.day === 'Ближайшие' ? 'В расписании сейчас пусто.' : 'Откройте «Ближайшие», чтобы увидеть всё расписание из файла.', null, true));
      return;
    }
    var lastDate = '';
    list.forEach(function (m) {
      if (m.date !== lastDate) {
        lastDate = m.date; var h = el('h2', 'day-h');
        h.appendChild(el('b', null, (m.date === today ? 'Сегодня, ' : m.date === tomorrow ? 'Завтра, ' : '') + day(m.date)));
        var n = list.filter(function (x) { return x.date === m.date; }).length; h.appendChild(el('span', null, n + ' ' + plural(n, 'матч', 'матча', 'матчей')));
        mBody.appendChild(h);
      }
      var c = el('article', 'mcard'); c.dataset.id = m.id;
      var w = el('div', 'when'); w.appendChild(el('b', null, m.time || '—')); w.appendChild(el('span', null, 'МСК')); c.appendChild(w);
      var t = el('div'); t.appendChild(el('span', 'tag', m.sport)); t.appendChild(el('p', 'league', m.league));
      [[m.home, m.homeCode, 0], [m.away, m.awayCode, 1]].forEach(function (s) {
        var row = el('p', 'team'), code = el('span', 'code', s[1] || '—'); code.setAttribute('aria-hidden', 'true');
        if (m.colors && /^#[0-9a-f]{6}$/i.test(m.colors[s[2]] || '')) code.style.setProperty('--c', m.colors[s[2]]);
        row.appendChild(code); row.appendChild(el('span', null, s[0])); t.appendChild(row);
      });
      c.appendChild(t); mBody.appendChild(c);
    });
  }
  function initMatches() {
    if (!DATA.matches.length) { $('m-tools').hidden = true; mBody.textContent = ''; mBody.appendChild(stateBlock('Расписание пусто', 'В данных сейчас нет ближайших матчей.')); return; }
    $('m-tools').hidden = false;
    var sports = []; DATA.matches.forEach(function (m) { if (m.sport && sports.indexOf(m.sport) < 0) sports.push(m.sport); });
    var chips = $('m-sports'); chips.textContent = ''; M.sport = null;
    [null].concat(sports).forEach(function (s) {
      var b = el('button', 'chip', s || 'Все виды'); b.type = 'button'; b.setAttribute('aria-pressed', s === null ? 'true' : 'false');
      b.addEventListener('click', function () { M.sport = s; Array.prototype.forEach.call(chips.children, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); renderMatches(); });
      chips.appendChild(b);
    });
    if (!searches.matches) searches.matches = UI.makeSearch($('m-search'), { id: 'm-q', placeholder: 'Команда, игрок или турнир', label: 'Поиск по матчам', hint: 'Поиск по матчам', onInput: function (v) { M.q = v; renderMatches(); } });
    if (innerTabs.matches) renderMatches(); else innerTabs.matches = UI.makeTabs($('m-tabs'), ['Ближайшие', 'Сегодня', 'Завтра'], function (name) { M.day = name; renderMatches(); }, 'm');
  }

  /* ---------- Прогнозы (демо-снимок расчёта модели) ---------- */
  // Снимок ленты прогнозов, рассчитанной моделью «Трибуны» по истории API-Football. Не обновляется сам и не
  // выдаётся за живую ленту: дата расчёта показана на каждом экране. После начала матча прогноз остаётся
  // в снимке таким, каким был до матча, — раздел не пустеет.
  var SRC_F = '../data/forecasts.json', FC = null, fcError = '';
  var LBL = { home: 'П1', draw: 'X', away: 'П2' }, WORD = { home: 'победа хозяев', draw: 'ничья', away: 'победа гостей' };
  function pctf(v) { return Math.round(v * 100) + '%'; }
  function decf(v) { return v.toFixed(3).replace('.', ','); }
  function mskTime(iso) { var d = new Date(Date.parse(iso) + 3 * 3600000); return d.toISOString().slice(11, 16); }
  function mskDay(iso) { return new Date(Date.parse(iso) + 3 * 3600000).toISOString().slice(0, 10); }
  function fcStamp(iso) { return day(mskDay(iso), true) + ', ' + mskTime(iso) + ' МСК'; }
  function findForecast(id) { return FC ? FC.forecasts.filter(function (f) { return f.eventId === id; })[0] : null; }
  function forecastTitle(id) { var f = findForecast(id); return f ? f.home + ' — ' + f.away : 'Прогноз матча'; }
  var SHORT = { home: 'хозяева', draw: 'ничья', away: 'гости' }, OUT = { home: 'Победа хозяев', draw: 'Ничья', away: 'Победа гостей' };
  // Полоска трёх исходов: ширина — вероятность, главный исход — акцентом; под ней подписи с числами.
  function outcomeBar(f, big) {
    var wrap = el('div', 'fc-bar' + (big ? ' big' : ''));
    var track = el('div', 'fc-track'); track.setAttribute('aria-hidden', 'true');
    ['home', 'draw', 'away'].forEach(function (k) { var s = el('span', k === f.selection ? 'on' : null); s.style.width = (f.probabilities[k] * 100).toFixed(1) + '%'; track.appendChild(s); });
    wrap.appendChild(track);
    var legend = el('ul', 'fc-legend'); legend.setAttribute('aria-label', 'Вероятности исходов');
    ['home', 'draw', 'away'].forEach(function (k) {
      var li = el('li', k === f.selection ? 'on' : null); li.appendChild(el('span', null, LBL[k] + ' · ' + SHORT[k])); li.appendChild(el('b', null, pctf(f.probabilities[k]))); legend.appendChild(li);
    });
    wrap.appendChild(legend); return wrap;
  }
  function mainPick(f) {
    var d = el('div', 'fc-pick'); d.appendChild(el('p', 'num', pctf(f.probabilities[f.selection])));
    var t = el('div'); t.appendChild(el('b', null, OUT[f.selection]));
    t.appendChild(el('span', null, f.selection === 'draw' ? 'самый вероятный исход' : 'самый вероятный исход · ' + (f.selection === 'home' ? f.home : f.away)));
    d.appendChild(t); return d;
  }
  // Итог из журнала: вписывается автоматически после матча (счёт за 90 минут); до этого — ничего не показываем.
  function resultLine(f) {
    var r = f.result; if (!r || (f.status !== 'won' && f.status !== 'lost')) return null;
    return el('p', 'fc-res ' + (f.status === 'won' ? 'ok' : 'miss'), (f.status === 'won' ? 'Исход совпал' : 'Исход не совпал') + ' · ' + r.home + ' : ' + r.away);
  }
  // Реальная история: только прогнозы, записанные в журнал до матчей; честно говорим, что матчей пока мало.
  function realBlock(rs) {
    if (!rs || !rs.settled) return null;
    var a = el('article', 'glass fc-real'); a.appendChild(el('p', 'kicker', 'Реальные прогнозы'));
    a.appendChild(el('h3', null, 'Исход совпал в ' + pctf(rs.model.accuracy)));
    a.appendChild(el('p', null, 'Записано до матчей: ' + rs.forecasts + ' с ' + day(mskDay(rs.since)) + ' · завершено: ' + rs.settled + ' · ожидают: ' + rs.pending + '.'));
    a.appendChild(el('p', null, 'Матчей пока мало — по нескольким играм о точности судить нельзя. Журнал записывается до начала матча и не меняется задним числом.'));
    return a;
  }
  function forecastCard(f) {
    var c = el('article', 'glass fc-card'); c.dataset.id = f.eventId;
    var top = el('p', 'fc-top'); top.appendChild(el('span', 'kicker', f.league)); top.appendChild(el('span', 'fc-time', mskTime(f.kickoff) + ' МСК')); c.appendChild(top);
    var h = el('h3', 'fc-teams'); h.appendChild(el('span', null, f.home)); h.appendChild(el('span', null, f.away)); c.appendChild(h);
    c.appendChild(mainPick(f)); c.appendChild(outcomeBar(f));
    if (f.details && f.details.summary) c.appendChild(el('p', 'fc-sum', f.details.summary));
    var res = resultLine(f); if (res) c.appendChild(res);
    var go = el('a', 'btn ghost fc-go'); go.href = '#forecast/' + encodeURIComponent(f.eventId);
    go.setAttribute('aria-label', 'Подробный разбор: ' + f.home + ' — ' + f.away);
    go.appendChild(el('span', null, 'Подробный разбор')); var arr = el('span', null, '→'); arr.setAttribute('aria-hidden', 'true'); go.appendChild(arr);
    c.appendChild(go); return c;
  }
  // Методика и проверка — свёрнуто: открывает тот, кому это нужно.
  function methodBlock(q) {
    var a = el('article', 'glass fc-method'), det = el('details');
    det.appendChild(el('summary', null, 'Как модель считает и как проверена'));
    det.appendChild(el('p', null, 'Модель оценивает, сколько голов команды забивают и пропускают дома и в гостях за последние два года — свежие матчи весят больше, — и переводит это в вероятности исходов основного времени. Составы, травмы и коэффициенты букмекеров не учитываются.'));
    var dl = el('dl', 'fc-stats');
    [[pctf(q.evaluation.model.accuracy), 'исход совпал в сезоне ' + q.evaluation.season + ' · ' + q.evaluation.matches + ' матчей'],
     [pctf(q.evaluation.leagueFrequencies.accuracy), 'у простого ориентира — частот исходов в лиге'],
     [pctf(q.prospective.model.accuracy), 'в текущем сезоне до расчёта · ' + q.prospective.matches + ' матчей']].forEach(function (r) {
      var d = el('div'); d.appendChild(el('dt', null, r[0])); d.appendChild(el('dd', null, r[1])); dl.appendChild(d);
    });
    det.appendChild(dl);
    det.appendChild(el('p', null, 'В проверке каждый прогноз считался только по матчам, сыгранным раньше него. Это результат на прошлых матчах, а не обещание выигрыша. Чемпионаты: ' + q.leagues.join(', ') + '.'));
    a.appendChild(det); return a;
  }
  function renderForecasts() {
    var host = $('f-body'); host.textContent = '';
    if (!FC) { if (fcError) host.appendChild(stateBlock('Не удалось загрузить прогнозы', 'Проверьте соединение и попробуйте ещё раз. (' + fcError + ')', loadForecasts)); else skeleton(host); return; }
    host.removeAttribute('aria-busy');
    var meta = el('ul', 'pills fc-meta');
    ['Демо · снимок ' + day(mskDay(FC.updatedAt)) + ', ' + mskTime(FC.updatedAt) + ' МСК', FC.forecasts.length + ' ' + plural(FC.forecasts.length, 'матч', 'матча', 'матчей'), 'Не обновляется', '18+'].forEach(function (t) { meta.appendChild(el('li', null, t)); });
    host.appendChild(meta);
    host.appendChild(el('p', 'fresh', 'Вероятности исходов основного времени по модели «Трибуны» — не коэффициенты букмекеров и не совет делать ставку.'));
    var now = Date.now(), list = FC.forecasts.slice().sort(function (a, b) { return Date.parse(a.kickoff) - Date.parse(b.kickoff); });
    var ahead = list.filter(function (f) { return Date.parse(f.kickoff) > now; }), past = list.filter(function (f) { return Date.parse(f.kickoff) <= now; });
    function group(items, label, note) {
      if (!items.length) return;
      if (label) { host.appendChild(el('h2', 'fc-group', label)); if (note) host.appendChild(el('p', 'fresh', note)); }
      var last = '';
      items.forEach(function (f) {
        var d = mskDay(f.kickoff);
        if (d !== last) { last = d; var h = el('h2', 'day-h'); h.appendChild(el('b', null, day(d))); var n = items.filter(function (x) { return mskDay(x.kickoff) === d; }).length; h.appendChild(el('span', null, n + ' ' + plural(n, 'матч', 'матча', 'матчей'))); host.appendChild(h); }
        host.appendChild(forecastCard(f));
      });
    }
    group(ahead, ahead.length && past.length ? 'До начала матча' : '');
    group(past, 'Уже сыграны или идут', 'Прогноз зафиксирован до начала матча и не меняется. Итог вписывается в журнал автоматически после матча.');
    var real = realBlock(FC.realStats); if (real) host.appendChild(real);
    if (FC.quality) host.appendChild(methodBlock(FC.quality));
    host.appendChild(el('p', 'legal', 'Вероятность — оценка модели, а не обещание результата. 18+ Трибуна не принимает ставки.'));
  }
  function signed(r, verb) { var v = Math.round((r - 1) * 100); return verb + ' ' + (v === 0 ? 'на уровне лиги' : (v > 0 ? '+' : '−') + Math.abs(v) + '% к среднему'); }
  function block(no, title) { var s = el('section', 'glass fc-block'); s.appendChild(el('p', 'kicker', no + ' / ' + title)); return s; }
  function renderForecast(id) {
    var host = $('fc-body'); host.textContent = '';
    if (!FC) { if (fcError) host.appendChild(stateBlock('Не удалось загрузить прогноз', 'Проверьте соединение и попробуйте ещё раз. (' + fcError + ')', loadForecasts)); else skeleton(host); return; }
    host.removeAttribute('aria-busy');
    var f = findForecast(id);
    if (!f) { var h0 = el('h1', null, 'Прогноз не найден'); h0.id = 'fc-title'; h0.tabIndex = -1; host.appendChild(h0); host.appendChild(stateBlock('Такого матча нет в снимке', 'Откройте список прогнозов.', null, true)); return; }
    var d = f.details || {};
    host.appendChild(el('p', 'kicker', f.league + ' · ' + day(mskDay(f.kickoff)) + ', ' + mskTime(f.kickoff) + ' МСК'));
    var h = el('h1', 'fc-h1'); h.id = 'fc-title'; h.tabIndex = -1; h.appendChild(el('span', null, f.home)); h.appendChild(el('span', null, '— ' + f.away)); host.appendChild(h);
    var main = el('section', 'glass stub fc-main'); main.appendChild(el('p', 'fc-label', 'Прогноз модели · основное время'));
    main.appendChild(mainPick(f)); main.appendChild(outcomeBar(f, true));
    var fres = resultLine(f);
    if (fres) main.appendChild(fres);
    else if (Date.parse(f.kickoff) <= Date.now()) main.appendChild(el('p', 'fc-note', 'Матч начался: прогноз зафиксирован до начала, итог появится после матча.'));
    host.appendChild(main);
    if (d.summary) host.appendChild(el('p', 'standfirst fc-short', d.summary));
    if (d.expectedGoals) {
      var b1 = block('01', 'Ожидаемые голы'), g = el('div', 'fc-xg');
      [[d.expectedGoals.home, f.home], [d.expectedGoals.away, f.away]].forEach(function (x) { var c = el('div'); c.appendChild(el('b', null, x[0].toFixed(2).replace('.', ','))); c.appendChild(el('span', null, x[1])); g.appendChild(c); });
      b1.appendChild(g); b1.appendChild(el('p', 'fc-cap', 'Расчёт по забитым и пропущенным голам, не xG по ударам.')); host.appendChild(b1);
    }
    if (d.strength) {
      var b2 = block('02', 'Сила команд относительно лиги');
      [[f.home + ' дома', d.strength.home], [f.away + ' в гостях', d.strength.away]].forEach(function (x) {
        var row = el('div', 'fc-row'); row.appendChild(el('b', null, x[0]));
        var ul = el('ul', 'pills fc-chips');
        var a = el('li', x[1].attack >= 1.05 ? 'good' : x[1].attack <= 0.95 ? 'bad' : null, signed(x[1].attack, 'Забивает'));
        var p = el('li', x[1].defense <= 0.95 ? 'good' : x[1].defense >= 1.05 ? 'bad' : null, signed(x[1].defense, 'Пропускает'));
        ul.appendChild(a); ul.appendChild(p); row.appendChild(ul); b2.appendChild(row);
      });
      host.appendChild(b2);
    }
    if (d.form && (d.form.home.length || d.form.away.length)) {
      var b3 = block('03', 'Последние матчи в чемпионате');
      [[f.home, d.form.home], [f.away, d.form.away]].forEach(function (x) {
        var row = el('div', 'fc-row'); row.appendChild(el('b', null, x[0]));
        var ul = el('ul', 'fc-form'); ul.setAttribute('aria-label', 'Последние матчи, от старых к новым: ' + (x[1].join(', ') || 'нет данных'));
        x[1].forEach(function (r) { ul.appendChild(el('li', r === 'В' ? 'w' : r === 'П' ? 'l' : 'd', r)); });
        if (!x[1].length) ul.appendChild(el('li', 'd', '—'));
        row.appendChild(ul); b3.appendChild(row);
      });
      b3.appendChild(el('p', 'fc-cap', 'В — победа, Н — ничья, П — поражение; слева направо от старых к новым.')); host.appendChild(b3);
    }
    if (d.scores && d.scores.length) {
      var b4 = block('04', 'Самые вероятные счета'), ul4 = el('ul', 'pills fc-scores');
      d.scores.forEach(function (s) { var li = el('li'); li.appendChild(el('b', null, s.score.replace(':', ' : '))); li.appendChild(el('span', null, pctf(s.probability))); ul4.appendChild(li); });
      b4.appendChild(ul4); host.appendChild(b4);
    }
    var b5 = block(d.scores ? '05' : '01', 'Что модель не учитывает');
    b5.appendChild(el('p', null, 'Составы, травмы, мотивацию, погоду и коэффициенты букмекеров.')); host.appendChild(b5);
    if (!f.details) { var prose = el('div', 'prose'); f.reasons.forEach(function (r) { prose.appendChild(el('p', null, r)); }); host.appendChild(prose); }
    var src = el('div', 'sources');
    src.appendChild(el('p', null, 'Демо: снимок расчёта ' + fcStamp(f.issuedAt) + ', не обновляется. Учтены результаты до ' + fcStamp(f.inputUntil) + (d.sample ? '; ' + d.sample.league + ' матчей лиги, из них ' + d.sample.home + ' домашних у хозяев и ' + d.sample.away + ' выездных у гостей.' : '.')));
    src.appendChild(el('p', null, 'Модель ' + f.modelVersion + ' · ' + f.source + '. Вероятность — оценка, а не обещание результата. 18+'));
    host.appendChild(src);
  }
  function loadForecasts() {
    FC = null; fcError = '';
    var n = parse().name; if (n === 'forecasts') renderForecasts(); if (n === 'forecast') renderForecast(parse().arg);
    fetch(SRC_F, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (d) {
      if (!d || d.version !== 1 || !Array.isArray(d.forecasts)) throw new Error('В файле нет прогнозов');
      FC = d;
    }).catch(function (e) { fcError = e && e.message ? e.message : 'ошибка сети'; }).then(function () {
      var r = parse();
      if (r.name === 'forecasts') safe('forecasts', renderForecasts);
      if (r.name === 'forecast') safe('forecast', function () { renderForecast(r.arg); document.title = forecastTitle(r.arg) + ' — Трибуна, демо приложения'; });
      if (DATA) safe('about', renderAbout);
    });
  }

  /* ---------- О приложении ---------- */
  function renderAbout() {
    var dl = $('ab-facts'); dl.textContent = '';
    [['Статей в журнале', DATA.articles.length], ['Новостей в файле данных', DATA.news.length], ['Ближайших матчей', DATA.matches.length], ['Букмекеров в каталоге', DATA.books.length], ['Прогнозов в демо-снимке', FC ? FC.forecasts.length : '—']].forEach(function (r) {
      var d = el('div'); d.appendChild(el('dt', null, r[0])); d.appendChild(el('dd', null, String(r[1]))); dl.appendChild(d);
    });
    $('ab-stamp').textContent = 'Числа посчитаны по файлу данных, собранному ' + stamp(DATA.generatedAt) + '. Файл не обновляется сам.';
  }

  /* ---------- Вход и регистрация (auth-demo): ничего не отправляется и не сохраняется ---------- */
  var panel = $('panel');
  var faces = { register: panel.querySelectorAll('.for-register'), login: panel.querySelectorAll('.for-login') };
  function authMode() { return panel.dataset.mode; }
  // Высота панели идёт за активной формой: ошибки и итог не обрезаются, пустоты под кнопкой нет.
  function fitPanel() { var f = $(panel.dataset.mode === 'register' ? 'register' : 'login'), hgt = f ? f.offsetHeight : 0; if (hgt > 0) panel.style.setProperty('--fh', hgt + 'px'); }
  if (window.ResizeObserver) { var panelRo = new ResizeObserver(fitPanel); panelRo.observe($('register')); panelRo.observe($('login')); }
  window.addEventListener('resize', fitPanel);
  function setMode(mode, user) {
    if (mode !== 'login' && mode !== 'register') mode = 'login';
    panel.dataset.mode = mode; fitPanel();
    Object.keys(faces).forEach(function (k) { Array.prototype.forEach.call(faces[k], function (f) { f.inert = k !== mode; f.setAttribute('aria-hidden', k !== mode ? 'true' : 'false'); }); });
    if (user) {
      try { history.replaceState(null, '', '#auth?mode=' + mode); } catch (e) { /* file:// */ }
      document.title = (mode === 'login' ? 'Вход' : 'Регистрация') + ' — Трибуна, демо приложения';
      var firstInput = $(mode).querySelector('input');
      if (firstInput && window.matchMedia('(hover: hover)').matches) firstInput.focus({ preventScroll: true });
    }
  }
  Array.prototype.forEach.call(panel.querySelectorAll('[data-go]'), function (b) { b.addEventListener('click', function () { setMode(b.dataset.go, true); }); });
  Array.prototype.forEach.call(panel.querySelectorAll('.eye'), function (b) {
    b.addEventListener('click', function () {
      var input = $(b.getAttribute('aria-controls')), show = input.type === 'password';
      input.type = show ? 'text' : 'password'; b.textContent = show ? 'Скрыть' : 'Показать'; b.setAttribute('aria-pressed', show ? 'true' : 'false');
    });
  });
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var RULES = {
    'r-name': function (v) { return v.trim().length >= 2 ? '' : 'Укажите имя: хотя бы две буквы.'; },
    'r-email': function (v) { return !v.trim() ? 'Укажите почту.' : EMAIL.test(v.trim()) ? '' : 'Похоже, в адресе ошибка. Пример: name@example.ru'; },
    'r-pass': function (v) { return !v ? 'Придумайте пароль.' : v.length < 8 ? 'Пароль короче 8 символов: сейчас ' + v.length + '.' : !/\d/.test(v) || !/[^\d\s]/.test(v) ? 'Добавьте в пароль и буквы, и цифры.' : ''; },
    'r-age': function (v, input) { return input.checked ? '' : 'Сервис только для совершеннолетних: подтвердите возраст.'; },
    'l-email': function (v) { return !v.trim() ? 'Укажите почту.' : EMAIL.test(v.trim()) ? '' : 'Похоже, в адресе ошибка. Пример: name@example.ru'; },
    'l-pass': function (v) { return v ? '' : 'Введите пароль.'; }
  };
  function check(id) {
    var input = $(id), msg = RULES[id](input.value, input);
    $('e-' + id).textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    return !msg;
  }
  Object.keys(RULES).forEach(function (id) {
    var input = $(id);
    // Ошибки появляются при отправке; дальше гаснут, как только поле становится верным.
    input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', function () { if (input.hasAttribute('aria-invalid')) check(id); });
  });
  function wire(formId, ids, done) {
    var form = $(formId), res = $('res-' + formId);
    form.addEventListener('submit', function (e) {
      e.preventDefault(); // страницу ничего не покидает
      res.hidden = true;
      var bad = ids.filter(function (id) { return !check(id); });
      fitPanel();
      if (bad.length) { $(bad[0]).focus(); return; }
      res.textContent = done; res.hidden = false; fitPanel();
    });
    form.addEventListener('input', function () { res.hidden = true; });
  }
  wire('register', ['r-name', 'r-email', 'r-pass', 'r-age'], 'Аккаунт не создан: учётные записи пока не подключены. Введённое никуда не отправлено и не сохранено.');
  wire('login', ['l-email', 'l-pass'], 'Вход не выполнен: учётные записи пока не подключены. Введённое никуда не отправлено и не сохранено.');

  /* ---------- данные ---------- */
  var loadError = '', loading = false;
  function load() {
    if (loading) return; loading = true; loadError = ''; DATA = null; shownArticle = null;
    ['j-tools', 'n-tools', 'm-tools'].forEach(function (id) { $(id).hidden = true; });
    [jBody, nBody, mBody].forEach(skeleton);
    if (R) R.loading();
    if (currentKey.indexOf('article/') === 0) renderArticle(parse().arg);
    fetch(SRC, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (d) {
      if (!d || !Array.isArray(d.books) || !Array.isArray(d.matches) || !Array.isArray(d.news) || !Array.isArray(d.articles)) throw new Error('В файле нет нужных разделов');
      loading = false; DATA = d;
      safe('journal', initJournal); safe('news', initNews); safe('matches', initMatches); safe('about', renderAbout);
      if (R) safe('rating', function () { R.setData(d); });
      app.dataset.state = 'ready';
      safe('route', function () { if (currentKey.indexOf('article/') === 0) { renderArticle(parse().arg); document.title = articleTitle(parse().arg) + ' — Трибуна, демо приложения'; } refit(parse().name); });
    }).catch(function (e) {
      loading = false; loadError = e && e.message ? e.message : 'ошибка сети'; app.dataset.state = 'error';
      [[jBody, 'журнал'], [nBody, 'новости'], [mBody, 'расписание']].forEach(function (p) {
        p[0].textContent = ''; p[0].removeAttribute('aria-busy');
        p[0].appendChild(stateBlock('Не удалось загрузить ' + p[1], 'Проверьте соединение и попробуйте ещё раз. (' + loadError + ')', load));
      });
      var dl = $('ab-facts'); dl.textContent = ''; var d = el('div'); d.appendChild(el('dt', null, 'Данные')); d.appendChild(el('dd', null, '—')); dl.appendChild(d);
      $('ab-stamp').textContent = 'Файл данных не загрузился: ' + loadError + '.';
      if (R) R.fail(loadError, load);
      if (currentKey.indexOf('article/') === 0) renderArticle(parse().arg);
    });
  }

  window.__app = {
    state: function () { return { route: parse(), key: currentKey, nav: navIndex, x: X.x, moving: !!navRaf, d: wavePath.getAttribute('d'), width: navWidth, data: app.dataset.state || 'loading', J: J, N: N, M: M, mode: authMode() }; },
    searches: searches, tabs: innerTabs, reload: load, mskDate: mskDate
  };
  measureNav();
  safe('route', route);
  load();
  loadForecasts();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measureNav(); refit(parse().name); });
})();
