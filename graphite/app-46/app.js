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
  var SRC = '../data/app-data.json?v=20261015';
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
  var NAMES = ['journal', 'news', 'matches', 'rating', 'forecasts', 'article', 'about', 'auth'];
  var TITLES = { journal: 'Журнал', news: 'Новости', matches: 'Матчи', rating: 'Рейтинг', forecasts: 'Прогнозы', article: 'Статья', about: 'О приложении', auth: 'Вход' };
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
    var key = r.name === 'article' ? 'article/' + r.arg : r.name, next = screens[r.name];
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
    if (r.name === 'auth') setMode(/(?:^|&)mode=register/.test(r.query) ? 'register' : 'login', false);
    next.scrollTop = scrollPos[key] || 0;
    var tab = r.name === 'article' ? 0 : TABS.map(function (t) { return t.id; }).indexOf(r.name);
    var noDock = r.name === 'about' || r.name === 'auth';
    app.classList.toggle('no-dock', noDock);
    Array.prototype.forEach.call(capsule.querySelectorAll('.cell'), function (c) { c.disabled = noDock; });
    if (tab >= 0) setNav(tab, first);
    document.title = (r.name === 'article' ? articleTitle(r.arg) : r.name === 'auth' ? (authMode() === 'login' ? 'Вход' : 'Регистрация') : TITLES[r.name]) + ' — Трибуна, демо приложения';
    refit(r.name);
    if (!first && changed && tab < 0 || (!first && r.name === 'article')) { var h = next.querySelector('h1'); if (h) h.focus({ preventScroll: true }); }
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

  /* ---------- О приложении ---------- */
  function renderAbout() {
    var dl = $('ab-facts'); dl.textContent = '';
    [['Статей в журнале', DATA.articles.length], ['Новостей в файле данных', DATA.news.length], ['Ближайших матчей', DATA.matches.length], ['Букмекеров в каталоге', DATA.books.length], ['Опубликованных прогнозов', 0]].forEach(function (r) {
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
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measureNav(); refit(parse().name); });
})();
