// Демо тёмного сайта «Трибуны». Страницы собираются из двух файлов:
//   ../data/app-data.json   — материалы, новости, матчи, букмекеры (публичные ленты trbn.ru, тот же разбор, что в приложении);
//   data/site-snapshot.json — структура действующего сайта, прочитанная на его публичных страницах.
// Наружу страница не обращается. DOM из данных строится только через createElement/textContent.
(function () {
  'use strict';
  var DATA_SRC = '../data/app-data.json', SNAP_SRC = 'data/site-snapshot.json', ORIGIN = 'https://trbn.ru';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (id) { return document.getElementById(id); };
  var view = $('view'), ratingView = $('view-rating'), main = $('main');
  var D = null, S = {}, status = 'loading', errText = '', current = null, INDEX = [];

  /* ---------- helpers ---------- */
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function add(parent) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]); return parent; }
  function a(href, cls, text) { var n = el('a', cls, text); n.href = href; return n; }
  function ext(href, cls, text) { var n = a(href, cls, text); n.target = '_blank'; n.rel = 'noopener'; return n; }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  var MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var MON3 = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  function ymd(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? [+m[1], +m[2], +m[3]] : null; }
  function dLong(s) { var m = ymd(s); return m ? m[2] + ' ' + MON[m[1] - 1] + ' ' + m[0] : ''; }
  function dShort(s) { var m = ymd(s); return m ? m[2] + ' ' + MON3[m[1] - 1] : ''; }
  function dNum(s) { var m = ymd(s); return m ? ('0' + m[2]).slice(-2) + '.' + ('0' + m[1]).slice(-2) + '.' + m[0] : ''; }
  function two(n) { return ('0' + n).slice(-2); }
  // Время в лентах — UTC; на сайте показано московское.
  function stampMsk(iso) {
    var d = new Date(iso); if (isNaN(d)) return '';
    d = new Date(d.getTime() + 3 * 3600e3);
    return two(d.getUTCDate()) + '.' + two(d.getUTCMonth() + 1) + '.' + d.getUTCFullYear() + ', ' + two(d.getUTCHours()) + ':' + two(d.getUTCMinutes()) + ' МСК';
  }
  function plural(n, one, few, many) { var a10 = n % 10, a100 = n % 100; return a10 === 1 && a100 !== 11 ? one : a10 >= 2 && a10 <= 4 && (a100 < 12 || a100 > 14) ? few : many; }
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
  function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е'); }
  var HUES = { 'Футбол': 96, 'Теннис': 68, 'Баскетбол': 26, 'Хоккей': 188, 'Спорт': 150, 'Стиль': 44, 'ММА': 4, 'Авто': 212, 'Олимпизм': 128 };
  var NEWS_RUBRIC = { 'ФУТБОЛ': 'Футбол', 'ХОККЕЙ': 'Хоккей', 'БАСКЕТ': 'Баскетбол', 'ТЕННИС': 'Теннис', 'АВТО': 'Авто', 'ОЛИМП.': 'Олимпизм', 'СПОРТ': 'Спорт', 'ММА': 'ММА' };
  function articleHref(x) { return '#/article/' + encodeURIComponent(x.id); }
  function originalUrl(x) { return ORIGIN + '/article/' + encodeURIComponent(x.id) + '/'; }
  function byId(id) { for (var i = 0; i < D.articles.length; i++) if (D.articles[i].id === id) return D.articles[i]; return null; }

  function cover(x, n, cls) {
    var c = el('div', 'cover' + (cls ? ' ' + cls : '')); c.setAttribute('aria-hidden', 'true');
    c.style.setProperty('--h', String(HUES[x.category] != null ? HUES[x.category] : 68));
    if (n) c.appendChild(el('span', 'cover-n', n));
    if (x.format) c.appendChild(el('span', 'cover-f', x.format));
    c.appendChild(el('span', 'cover-w', x.category || 'Трибуна'));
    return c;
  }
  function metaLine(x) {
    var m = el('p', 'meta');
    if (x.author) m.appendChild(el('span', null, x.author));
    if (x.date) { var t = el('time', null, dShort(x.date)); t.dateTime = x.date; m.appendChild(t); }
    if (x.minutes) m.appendChild(el('span', null, x.minutes + ' мин чтения'));
    var go = el('span', 'go', '↗'); go.setAttribute('aria-hidden', 'true'); m.appendChild(go);
    return m;
  }
  function card(x, n, tag, cls, line) {
    var art = el('article', (cls || 'card') + ' card rv'), link = a(articleHref(x)), body = el('div', 'card-body');
    add(body, el('span', 'kicker', x.category), el(tag || 'h3', null, x.title), el('p', null, line || x.description), metaLine(x));
    add(link, cover(x, n), body); art.appendChild(link); return art;
  }
  function matchCard(m) {
    var c = el('article', 'match rv'), top = el('div', 'match-top'), t = el('time', null, dShort(m.date) + ' · ' + m.time);
    t.dateTime = m.date + 'T' + m.time + '+03:00';
    add(top, el('b', null, m.sport), t); c.appendChild(top);
    c.appendChild(el('p', 'match-league', m.league));
    [[m.home, m.homeCode, 0], [m.away, m.awayCode, 1]].forEach(function (r) {
      var row = el('p', 'team'), b = el('span', 'badge', r[1] || (r[0] || '').slice(0, 3).toUpperCase());
      b.setAttribute('aria-hidden', 'true'); b.style.background = (m.colors && /^#[0-9a-f]{6}$/i.test(m.colors[r[2]] || '')) ? m.colors[r[2]] : '#3a4030';
      add(row, b, el('span', null, r[0])); c.appendChild(row);
    });
    if (m.odds && m.odds.length >= 2) {
      var line = el('div', 'line'), dl = el('dl');
      line.appendChild(el('p', null, 'Линия букмекера, не прогноз · 18+'));
      var names = m.odds.length === 3 ? ['П1', 'X', 'П2'] : ['П1', 'П2'];
      names.forEach(function (nm, i) { var d = el('div'); add(d, el('dt', null, nm), el('dd', null, Number(m.odds[i]).toFixed(2))); dl.appendChild(d); });
      line.appendChild(dl); c.appendChild(line);
    }
    return c;
  }
  function secHead(kicker, title, side, tag) {
    var h = el('header', 'sec-head'), l = el('div');
    if (kicker) l.appendChild(el('p', 'kicker rv', kicker));
    var t = el(tag || 'h2', 'rv', title); l.appendChild(t); h.appendChild(l);
    if (side) { side.classList.add('rv'); h.appendChild(side); }
    return h;
  }
  function stateBox(kind, title, text, retry) {
    var b = el('div', 'state glass ' + kind); b.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    b.appendChild(el('b', null, title)); if (text) b.appendChild(el('p', null, text));
    if (retry) { var r = el('button', 'btn', 'Повторить'); r.type = 'button'; r.addEventListener('click', load); b.appendChild(r); }
    return b;
  }

  /* ---------- появление секций (как в лендинге) ---------- */
  var io = null;
  if ('IntersectionObserver' in window && !reduce.matches) {
    root.classList.add('io');
    io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); },
      { threshold: 0, rootMargin: '0px 0px -6% 0px' });
  }
  function reveal(scope) {
    var items = [].slice.call(scope.querySelectorAll('.rv'));
    if (!io) { items.forEach(function (n) { n.classList.add('in'); }); return; }
    items.forEach(function (n, i) { if (!n.style.getPropertyValue('--d')) n.style.setProperty('--d', (i % 4) * 60 + 'ms'); io.observe(n); });
  }

  /* ---------- вкладки со световым следом (tabs-demo) ---------- */
  var LEAD = { k: 420, c: 30, m: 0.7 }, TRAIL = { k: 120, c: 20, m: 0.9 }, SHORT = 26;
  function makeTabs(rootEl, names, onChange, start, counts) {
    var index = Math.max(0, start || 0), raf = 0, last = 0, dir = 1, alive = true;
    var A = { x: 0, v: 0, s: LEAD, t: 0 }, B = { x: 0, v: 0, s: LEAD, t: 0 };
    var streak = el('span', 'streak'); streak.setAttribute('aria-hidden', 'true');
    var tabs = names.map(function (n, i) {
      var b = el('button', 'tab', n); b.type = 'button'; b.setAttribute('role', 'tab');
      if (counts && counts[i] != null) b.appendChild(el('small', null, String(counts[i])));
      b.addEventListener('click', function () { select(i, true); });
      rootEl.appendChild(b); return b;
    });
    rootEl.appendChild(streak);
    rootEl.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      e.preventDefault(); var n = (index + d + names.length) % names.length; select(n, true); tabs[n].focus();
    });
    function rest(i) { var t = tabs[i], c = t.offsetLeft + t.offsetWidth / 2; return [c - SHORT / 2, c + SHORT / 2]; }
    function draw() {
      var a1 = Math.min(A.x, B.x), b1 = Math.max(A.x, B.x), w = Math.max(SHORT * 0.6, b1 - a1);
      var g = Math.min(1, Math.max(0, (w - SHORT) / 70));
      streak.style.width = w.toFixed(1) + 'px';
      streak.style.transform = 'translate3d(' + a1.toFixed(1) + 'px,0,0)';
      streak.style.height = (2 + g).toFixed(2) + 'px';
      streak.style.background = g < 0.02 ? '#E6FF57'
        : 'linear-gradient(' + (dir > 0 ? '90deg' : '270deg') + ', rgba(230,255,87,' + (1 - g * 0.9).toFixed(2) + '), #E6FF57 62%, #FBFFE0)';
      streak.style.boxShadow = g < 0.02 ? 'none'
        : '0 0 ' + (6 + 12 * g).toFixed(1) + 'px rgba(230,255,87,' + (0.75 * g).toFixed(2) + '), 0 0 ' + (2 + 3 * g).toFixed(1) + 'px rgba(251,255,224,' + (0.9 * g).toFixed(2) + ')';
    }
    function step(o, dt) {
      var acc = (-o.s.k * (o.x - o.t) - o.s.c * o.v) / o.s.m; o.v += acc * dt; o.x += o.v * dt;
      return Math.abs(o.x - o.t) > 0.05 || Math.abs(o.v) > 0.5;
    }
    function tick(now) {
      if (!alive || !rootEl.isConnected) { raf = 0; return; }
      var dt = Math.max(0, Math.min(0.064, (now - last) / 1000)); last = now; var moving = false;
      for (var n = Math.max(1, Math.ceil(dt / 0.004)), i = 0; i < n; i++) { var m1 = step(A, dt / n), m2 = step(B, dt / n); moving = m1 || m2; }
      if (!moving) { A.x = A.t; B.x = B.t; A.v = B.v = 0; }
      draw(); raf = moving ? requestAnimationFrame(tick) : 0;
    }
    function snap() { if (!rootEl.isConnected) return; var r = rest(index); A.x = A.t = r[0]; B.x = B.t = r[1]; A.v = B.v = 0; draw(); }
    function select(i, user) {
      var r = rest(i), changed = i !== index;
      if (changed) { dir = i > index ? 1 : -1; A.s = dir > 0 ? TRAIL : LEAD; B.s = dir > 0 ? LEAD : TRAIL; }
      index = i; A.t = r[0]; B.t = r[1];
      tabs.forEach(function (t, n) { t.setAttribute('aria-selected', n === i ? 'true' : 'false'); t.tabIndex = n === i ? 0 : -1; });
      if (user || changed) {
        var t = tabs[i], want = t.offsetLeft - (rootEl.clientWidth - t.offsetWidth) / 2;
        rootEl.scrollTo({ left: Math.max(0, want), behavior: reduce.matches ? 'auto' : 'smooth' });
      }
      onChange(i, !!user);
      if (reduce.matches) { snap(); return; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    }
    function refit() { if (!rootEl.isConnected) return; var r = rest(index); A.t = r[0]; B.t = r[1]; if (!raf) snap(); }
    window.addEventListener('resize', snap);
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(refit); tabs.forEach(function (t) { ro.observe(t); }); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
    select(index, false); snap();
    return {
      refit: refit,
      set: function (i) { if (i !== index && i >= 0 && i < tabs.length) select(i, false); },
      index: function () { return index; },
      state: function () { return { index: index, a: A.x, b: B.x, moving: !!raf, glow: streak.style.boxShadow }; },
      destroy: function () { alive = false; window.removeEventListener('resize', snap); if (ro) ro.disconnect(); }
    };
  }
  function tablist(label, small) { var t = el('div', 'tabs' + (small ? ' small' : '')); t.setAttribute('role', 'tablist'); t.setAttribute('aria-label', label); return t; }

  /* ---------- данные сайта, выведенные из файлов ---------- */
  function issueArticles() {
    var ids = S.currentIssue && S.currentIssue.articles;
    if (!ids) return D.articles.slice();
    var list = ids.map(byId).filter(Boolean);
    return list.length ? list : D.articles.slice();
  }
  function archiveArticles() {
    var cur = issueArticles();
    return D.articles.filter(function (x) { return cur.indexOf(x) < 0; }).sort(function (p, q) { return (q.edition || q.date || '').localeCompare(p.edition || p.date || ''); });
  }
  function rubricNames() {
    var names = (S.rubrics || []).concat(S.extraRubrics || []).map(function (r) { return r.name; });
    D.articles.forEach(function (x) { if (x.category && names.indexOf(x.category) < 0) names.push(x.category); });
    return names;
  }
  function rubricAbout(name) { var all = (S.rubrics || []).concat(S.extraRubrics || []); for (var i = 0; i < all.length; i++) if (all[i].name === name) return all[i].about; return ''; }
  function editions() { var e = []; D.articles.forEach(function (x) { var k = x.edition || x.date; if (k && e.indexOf(k) < 0) e.push(k); }); return e.sort().reverse(); }
  function newestNews() { return D.news.slice().sort(function (p, q) { return (q.date || '').localeCompare(p.date || ''); }); }
  function newsRow(n) {
    var li = el('li'), url = safeUrl(n.url), row = url ? ext(url) : el('div');
    var t = el('time', 'when', stampMsk(n.date)); t.dateTime = n.date;
    add(row, t, el('b', null, n.title), el('span', 'src', 'Источник: ' + n.source + (n.category ? ' · ' + (NEWS_RUBRIC[n.category] || n.category) : '') + (url ? ' ↗' : '')));
    li.appendChild(row); return li;
  }
  function newsNotice() {
    var nn = newestNews()[0];
    return el('p', 'notice rv', nn
      ? 'Последняя новость в ленте получена ' + stampMsk(nn.date) + '. Приём новостей на сервере сейчас остановлен, поэтому более свежих записей нет. Заголовок ведёт на сайт источника.'
      : 'В срезе данных новостей нет.');
  }

  /* ---------- страницы ---------- */
  function pageHome() {
    var frag = document.createDocumentFragment(), H = S.home || {}, site = S.site || {};
    var heroes = el('section', 'hero wrap'); heroes.setAttribute('aria-labelledby', 'home-h1');
    var h1 = el('h1'); h1.id = 'home-h1'; h1.tabIndex = -1;
    add(h1, document.createTextNode('Журнал о спорте, людях и '), el('em', null, 'культуре.'));
    add(heroes, el('p', 'kicker', (site.issueLabel ? site.issueLabel + ' · ' : '') + 'авторское медиа о спорте'), h1,
      el('p', 'lead', 'Большие истории, матч-центр и навигатор по букмекерам. Те же разделы, что на trbn.ru, — в тёмном оформлении.'));
    var ad = el('aside', 'adslot'); ad.setAttribute('aria-label', 'Рекламное место');
    add(ad, el('b', null, 'Рекламное место'), el('span', null, 'На trbn.ru здесь баннер партнёра с маркировкой. В демо не перенесено.'));
    heroes.appendChild(ad); frag.appendChild(heroes);

    // Матч-центр
    var ms = el('section', 'sec wrap'); ms.setAttribute('aria-labelledby', 'home-matches');
    var side = a('#/matches', 'more', 'Все матчи →');
    var mh = secHead('Матч-центр', 'Ближайшие матчи', side); mh.querySelector('h2').id = 'home-matches'; ms.appendChild(mh);
    if (!D.matches.length) ms.appendChild(stateBox('empty', 'Матчей в расписании нет', 'В срезе данных нет ближайших матчей.'));
    else {
      var sports = []; D.matches.forEach(function (m) { if (sports.indexOf(m.sport) < 0) sports.push(m.sport); });
      var row = el('div', 'tabs-row'), tl = tablist('Вид спорта'), grid = el('div', 'mgrid scroller'); grid.setAttribute('aria-live', 'polite');
      add(row, tl, el('span', 'tabs-note', 'Время московское · МСК')); add(ms, row, grid);
      var mt = makeTabs(tl, ['Все'].concat(sports), function (i) {
        grid.textContent = '';
        D.matches.filter(function (m) { return !i || m.sport === sports[i - 1]; }).slice(0, 4).forEach(function (m) { var c = matchCard(m); c.classList.add('in'); grid.appendChild(c); });
      });
      tabsAlive.push(mt);
      ms.appendChild(el('p', 'fineprint', (H.matchNote || 'Коэффициенты — линия букмекера и могут меняться. 18+') + ' Это не прогноз редакции. Расписание в файле данных от ' + stampMsk(D.matchUpdatedAt || D.generatedAt) + '.'));
      ms.lastChild.style.marginTop = '14px';
    }
    frag.appendChild(ms);

    // Лента рубрик
    var issue = issueArticles(), rs = el('nav', 'sec wrap'); rs.setAttribute('aria-label', 'Рубрики выпуска'); rs.style.paddingTop = '34px';
    var strip = el('div', 'rubrics rv'), first = a('#/rubric/all', 'first', (S.currentIssue && S.currentIssue.label) || 'Весь выпуск');
    first.appendChild(el('span', null, String(issue.length))); strip.appendChild(first);
    var seen = []; issue.forEach(function (x) { if (seen.indexOf(x.category) < 0) seen.push(x.category); });
    seen.forEach(function (c) {
      var l = a('#/rubric/' + encodeURIComponent(c), null, c);
      l.appendChild(el('span', null, String(issue.filter(function (x) { return x.category === c; }).length))); strip.appendChild(l);
    });
    rs.appendChild(strip); frag.appendChild(rs);

    // Закреплённые истории + навигатор по БК
    var pins = (H.pinned || []).map(byId).filter(Boolean), W = H.ratingWidget || {};
    var ps = el('section', 'sec wrap'); ps.setAttribute('aria-labelledby', 'home-pinned'); ps.style.paddingTop = '26px';
    var ph = el('h2', 'sr-only', 'Главное в номере и рейтинг букмекеров'); ph.id = 'home-pinned'; ps.appendChild(ph);
    var pg = el('div', 'pinned');
    pins.forEach(function (x) { pg.appendChild(card(x, null, 'h3', 'pin', (H.pinnedLines || {})[x.id])); });
    if (D.books.length) {
      var bw = el('aside', 'bkw glass rv'); bw.setAttribute('aria-labelledby', 'bkw-title');
      var top = el('div', 'bkw-top'); add(top, el('span', 'kicker', W.kicker || 'Навигатор по БК'), el('span', 'age', '18+')); bw.appendChild(top);
      var bt = el('h3', null, W.title || 'Рейтинг букмекеров'); bt.id = 'bkw-title'; bw.appendChild(bt);
      bw.appendChild(el('p', 'muted', W.lead || '')).style.fontSize = '15px';
      var ol = el('ol');
      D.books.slice().sort(function (p, q) { return p.order - q.order; }).slice(0, W.count || 5).forEach(function (b) {
        var li = el('li'), l = a('#/rating'), plate = el('span', 'plate');
        if (b.logoFile) { var im = el('img'); im.src = '../logos/' + b.logoFile; im.alt = ''; im.loading = 'lazy'; if (b.logoSurface) plate.style.background = b.logoSurface; plate.appendChild(im); }
        var nm = el('span'); add(nm, el('b', null, b.name), el('small', null, b.checkedAt ? 'проверено ' + dNum(b.checkedAt) : 'дата проверки не указана'));
        add(l, el('i', null, two(b.order)), plate, nm);
        li.appendChild(l); ol.appendChild(li);
      });
      bw.appendChild(ol);
      bw.appendChild(a('#/rating', 'btn', (W.link || 'Сравнить букмекеров') + ' →'));
      bw.appendChild(el('p', 'fineprint', (W.note || '') + ' «Трибуна» не принимает ставки.'));
      pg.appendChild(bw);
    }
    ps.appendChild(pg); frag.appendChild(ps);

    // Свежий выпуск
    var eds = editions(), latest = (H.latestIssue && eds.indexOf(H.latestIssue.date) >= 0) ? H.latestIssue.date : eds[0];
    var prev = (H.previousIssue && eds.indexOf(H.previousIssue.date) >= 0) ? H.previousIssue.date : eds[1];
    function issueSection(id, kicker, title, date) {
      var list = D.articles.filter(function (x) { return (x.edition || x.date) === date; });
      if (!list.length) return null;
      var s = el('section', 'sec wrap'); s.setAttribute('aria-labelledby', id);
      var t = el('time', 'side', dLong(date)); t.dateTime = date;
      var h = secHead(kicker, title, t); h.querySelector('h2').id = id; s.appendChild(h);
      var g = el('div', 'grid'); list.forEach(function (x, i) { g.appendChild(card(x, two(i + 1))); }); s.appendChild(g);
      return s;
    }
    if (latest) {
      var rh = el('div', 'sec wrap'); rh.style.paddingBottom = '0';
      add(rh, el('p', 'kicker rv', H.readSub || 'Истории, которые остаются'), el('p', 'h2 rv', H.readHeading || 'Читайте в «Трибуне»'));
      frag.appendChild(rh);
      var ls = issueSection('home-latest', null, (H.latestIssue && H.latestIssue.label) || 'Свежий выпуск', latest);
      ls.style.paddingTop = '26px'; ls.querySelector('h2').style.fontSize = 'clamp(22px, 3.4vw, 30px)'; frag.appendChild(ls);
    }

    // В сектор трибуны
    var sp = H.special, spa = sp && byId(sp.article);
    if (spa) {
      var ss = el('section', 'sec wrap'); ss.setAttribute('aria-labelledby', 'home-special');
      var sh = secHead(sp.kicker, sp.lead); sh.querySelector('h2').id = 'home-special'; ss.appendChild(sh);
      var sa = el('article', 'special rv'), sl = a(articleHref(spa), 'glass'), st = el('div', 'special-text');
      add(st, el('span', 'kicker', sp.tag || spa.format), el('h3', null, sp.title || spa.title), el('p', null, sp.line || spa.description), metaLine(spa));
      add(sl, cover(spa, null, 'wide'), st); sa.appendChild(sl); ss.appendChild(sa); frag.appendChild(ss);
    }

    // На полях «Трибуны»
    var im2 = H.intermission;
    if (im2) {
      var is = el('aside', 'sec wrap band'); is.setAttribute('aria-label', 'На полях «Трибуны»');
      var ic = el('div', 'band-card rv');
      add(ic, el('p', 'kicker', im2.kicker), el('p', 'big', im2.title), el('p', 'sub', (im2.lines || []).join(' ')));
      is.appendChild(ic); frag.appendChild(is);
    }

    // Предыдущий выпуск
    if (prev) { var pv = issueSection('home-prev', null, (H.previousIssue && H.previousIssue.label) || 'Предыдущий выпуск', prev); if (pv) frag.appendChild(pv); }

    // Архив
    var as = el('section', 'sec wrap'); as.setAttribute('aria-labelledby', 'home-archive');
    var ah = secHead('Архив', 'Больше историй в архиве'); ah.querySelector('h2').id = 'home-archive'; as.appendChild(ah);
    var tz = el('div', 'teasers'), t1 = el('div', 'teaser glass rv'), t2 = el('div', 'teaser glass rv'), arch = archiveArticles();
    add(t1, el('h3', null, 'Прошлые выпуски'), el('p', null, arch.length + ' ' + plural(arch.length, 'материал', 'материала', 'материалов') + ' журнала вне текущего выпуска.'));
    var u1 = el('ul'); arch.slice(0, 3).forEach(function (x) { var li = el('li'), l = a(articleHref(x), null, x.title); l.appendChild(el('small', null, x.category + ' · ' + dLong(x.edition || x.date))); li.appendChild(l); u1.appendChild(li); });
    add(t1, u1, a('#/archive', 'more', 'Архив материалов →'));
    var nn = newestNews();
    add(t2, el('h3', null, 'Архив новостей'), el('p', null, nn.length
      ? 'В срезе ' + nn.length + ' ' + plural(nn.length, 'новость', 'новости', 'новостей') + '; последняя получена ' + stampMsk(nn[0].date) + '. Приём новостей на сервере сейчас остановлен.'
      : 'В срезе данных новостей нет.'));
    var u2 = el('ul'); nn.slice(0, 3).forEach(function (n) { var li = el('li'), l = a('#/archive/news', null, n.title); l.appendChild(el('small', null, n.source + ' · ' + stampMsk(n.date))); li.appendChild(l); u2.appendChild(li); });
    add(t2, u2, a('#/archive/news', 'more', 'Архив новостей →'));
    add(tz, t1, t2); as.appendChild(tz); frag.appendChild(as);

    // Конец выпуска
    var E = H.issueEnd || {}, es = el('section', 'sec wrap band'); es.setAttribute('aria-labelledby', 'home-end'); es.style.paddingBottom = 'clamp(50px, 9vh, 100px)';
    var ec = el('div', 'band-card rv'), eh = el('h2', 'big', E.title || 'Игра продолжается.'); eh.id = 'home-end';
    var links = el('p', 'band-links');
    add(links, a('#/rubric/all', null, 'Есть что почитать →'), ext(ORIGIN + '/sitemap', null, 'Карта сайта на trbn.ru ↗'));
    add(ec, el('p', 'kicker', (E.kicker || '') + (site.issueLabel ? ' · ' + site.issueLabel : '')), eh, links); es.appendChild(ec); frag.appendChild(es);
    return { node: frag, title: 'Трибуна — журнал о спорте, людях и культуре', nav: '' };
  }

  function pageRubric(name) {
    var names = rubricNames(), issue = issueArticles();
    var wrap = el('section', 'page wrap'); wrap.setAttribute('aria-labelledby', 'rubric-h1');
    var h1 = el('h1', 'page-title'); h1.id = 'rubric-h1'; h1.tabIndex = -1;
    var lead = el('p', 'page-lead'), tl = tablist('Рубрики'), out = el('div'); out.setAttribute('aria-live', 'polite'); out.style.marginTop = '18px';
    add(wrap, a('#/', 'back', '← На главную'), el('p', 'kicker', 'Рубрика'), h1, lead, tl, out);
    tl.style.marginTop = '22px';
    var labels = ['Весь выпуск'].concat(names);
    var counts = labels.map(function (n, i) { return i ? issue.filter(function (x) { return x.category === n; }).length : issue.length; });
    function fill(i) {
      var nm = labels[i], list = i ? issue.filter(function (x) { return x.category === nm; }) : issue;
      h1.textContent = nm;
      var about = i ? rubricAbout(nm) : '';
      lead.textContent = list.length + ' ' + plural(list.length, 'материал', 'материала', 'материалов') + (about ? ' · ' + about : '');
      document.title = nm + ' — Трибуна (демо)';
      out.textContent = '';
      if (list.length) { var g = el('div', 'grid'); list.forEach(function (x, k) { var c = card(x, two(k + 1), 'h2'); g.appendChild(c); }); out.appendChild(g); }
      else out.appendChild(stateBox('empty', 'В рубрике пока нет материалов', 'В текущем выпуске журнала нет историй с рубрикой «' + nm + '».'));
      var old = i ? archiveArticles().filter(function (x) { return x.category === nm; }) : [];
      if (old.length) {
        var s2 = el('section', 'sec'); s2.appendChild(secHead('Архив', 'Из прошлых выпусков'));
        var g2 = el('div', 'grid'); old.forEach(function (x) { g2.appendChild(card(x, null)); }); s2.appendChild(g2); out.appendChild(s2);
      }
      var news = i ? newestNews().filter(function (n) { return NEWS_RUBRIC[n.category] === nm; }) : [];
      if (news.length) {
        var s3 = el('section', 'sec'); s3.appendChild(secHead('Архив новостей', 'Новости рубрики'));
        s3.appendChild(newsNotice()); var ul = el('ul', 'rows'); news.forEach(function (n) { ul.appendChild(newsRow(n)); }); s3.appendChild(ul); out.appendChild(s3);
      }
      reveal(out);
    }
    var start = name === 'all' ? 0 : labels.indexOf(name);
    var known = start >= 0, tabs = null;
    return {
      node: wrap, title: (known ? labels[start] : name) + ' — Трибуна (демо)', nav: 'rubric/' + name, kind: 'rubric',
      mount: function () {
        if (!known) { h1.textContent = name; tl.hidden = true; out.appendChild(stateBox('empty', 'Такой рубрики нет', 'Выберите рубрику в меню «Все темы».')); return; }
        tabs = makeTabs(tl, labels, function (i, user) {
          fill(i);
          if (user) { var h = '#/rubric/' + (i ? encodeURIComponent(labels[i]) : 'all'); if (location.hash !== h) location.hash = h; }
        }, start, counts);
        tabsAlive.push(tabs);
      },
      update: function (r) {
        var i = r.arg === 'all' ? 0 : labels.indexOf(r.arg); if (i < 0 || !tabs) return false;
        tabs.set(i); return true;
      }
    };
  }

  function pageMatches() {
    var wrap = el('section', 'page wrap'); wrap.setAttribute('aria-labelledby', 'matches-h1');
    var h1 = el('h1', 'page-title', 'Расписание матчей'); h1.id = 'matches-h1'; h1.tabIndex = -1;
    add(wrap, a('#/', 'back', '← На главную'), el('p', 'kicker', 'Матч-центр'), h1,
      el('p', 'page-lead', 'Время московское · МСК. В расписании ' + D.matches.length + ' ' + plural(D.matches.length, 'матч', 'матча', 'матчей') + '; данные от ' + stampMsk(D.matchUpdatedAt || D.generatedAt) + '.'));
    if (!D.matches.length) { wrap.appendChild(stateBox('empty', 'Матчей в расписании нет', 'В срезе данных нет ближайших матчей.')); return { node: wrap, title: 'Матчи — Трибуна (демо)', nav: 'matches' }; }
    var sports = [], dates = [];
    D.matches.forEach(function (m) { if (sports.indexOf(m.sport) < 0) sports.push(m.sport); if (dates.indexOf(m.date) < 0) dates.push(m.date); });
    dates.sort();
    var t1 = tablist('Вид спорта'), t2 = tablist('Дата', true), out = el('div'), count = el('p', 'fineprint'); out.setAttribute('aria-live', 'polite');
    t1.style.marginTop = '22px';
    add(wrap, t1, t2, count, out);
    var si = 0, di = 0;
    function fill() {
      out.textContent = '';
      var list = D.matches.filter(function (m) { return (!si || m.sport === sports[si - 1]) && (!di || m.date === dates[di - 1]); });
      count.textContent = 'Показано матчей: ' + list.length;
      if (!list.length) { out.appendChild(stateBox('empty', 'На этот день матчей нет', 'Выберите другой вид спорта или дату.')); return; }
      var days = []; list.forEach(function (m) { if (days.indexOf(m.date) < 0) days.push(m.date); });
      days.sort().forEach(function (d) {
        var h = el('h2', 'day', dLong(d)), part = list.filter(function (m) { return m.date === d; });
        h.appendChild(el('small', null, part.length + ' ' + plural(part.length, 'матч', 'матча', 'матчей'))); out.appendChild(h);
        var g = el('div', 'mgrid'); part.sort(function (p, q) { return p.time.localeCompare(q.time); }).forEach(function (m) { g.appendChild(matchCard(m)); }); out.appendChild(g);
      });
      reveal(out);
    }
    var note = el('p', 'fineprint', ((S.home || {}).matchNote || 'Коэффициенты — линия букмекера и могут меняться. 18+') + ' Это не прогноз редакции.');
    note.style.marginTop = '26px'; wrap.appendChild(note);
    wrap.appendChild(a('#/rating', 'more', 'Рейтинг букмекеров · 18+ →'));
    return {
      node: wrap, title: 'Матчи — Трибуна (демо)', nav: 'matches',
      mount: function () {
        var counts = [D.matches.length].concat(sports.map(function (s) { return D.matches.filter(function (m) { return m.sport === s; }).length; }));
        tabsAlive.push(makeTabs(t1, ['Все'].concat(sports), function (i) { si = i; fill(); }, 0, counts));
        tabsAlive.push(makeTabs(t2, ['Все даты'].concat(dates.map(dShort)), function (i) { di = i; fill(); }));
      }
    };
  }

  function pageArchive(tab) {
    var A = S.archive || {}, arch = archiveArticles(), news = newestNews();
    var wrap = el('section', 'page wrap'); wrap.setAttribute('aria-labelledby', 'archive-h1');
    var h1 = el('h1', 'page-title', A.title || 'Архив'); h1.id = 'archive-h1'; h1.tabIndex = -1;
    var lead = (A.lead || 'Прошлые выпуски и новости «Трибуны».') + (A.publicationsOnSite ? ' На trbn.ru в архиве ' + A.publicationsOnSite + ' ' + plural(A.publicationsOnSite, 'публикация', 'публикации', 'публикаций') + ' (на ' + dNum(S.snapshotAt) + ');' : '') +
      ' в демо — ' + arch.length + ' ' + plural(arch.length, 'материал', 'материала', 'материалов') + ' и ' + news.length + ' ' + plural(news.length, 'новость', 'новости', 'новостей') + ' из файла данных.';
    var tl = tablist('Раздел архива'), out = el('div'); out.setAttribute('aria-live', 'polite'); tl.style.marginTop = '22px'; out.style.marginTop = '14px';
    add(wrap, a('#/', 'back', '← К журналу'), el('p', 'kicker', 'Журнал и новости'), h1, el('p', 'page-lead', lead), tl, out);
    if (A.url) { var orig = ext(A.url, 'more', 'Полный архив на trbn.ru ↗'); orig.style.marginTop = '26px'; wrap.appendChild(orig); }
    var tabs = null;
    function fill(i) {
      out.textContent = '';
      if (!i) {
        if (!arch.length) { out.appendChild(stateBox('empty', 'Прошлых выпусков нет', 'В файле данных только текущий выпуск.')); return; }
        var ul = el('ul', 'rows');
        arch.forEach(function (x) {
          var li = el('li'), l = a(articleHref(x)), t = el('time', 'when', dNum(x.edition || x.date)); t.dateTime = x.edition || x.date;
          add(l, t, el('b', null, x.title), el('span', 'src', 'Журнал · ' + x.category)); li.appendChild(l); ul.appendChild(li);
        });
        out.appendChild(ul);
      } else {
        out.appendChild(newsNotice());
        if (!news.length) { out.appendChild(stateBox('empty', 'Новостей нет', 'В файле данных лента пуста.')); return; }
        var ul2 = el('ul', 'rows'); news.forEach(function (n) { ul2.appendChild(newsRow(n)); }); out.appendChild(ul2);
      }
      reveal(out);
    }
    return {
      node: wrap, title: 'Архив — Трибуна (демо)', nav: 'archive', kind: 'archive',
      mount: function () {
        tabs = makeTabs(tl, ['Журнал', 'Новости'], function (i, user) {
          fill(i);
          if (user) { var h = i ? '#/archive/news' : '#/archive'; if (location.hash !== h) location.hash = h; }
        }, tab === 'news' ? 1 : 0, [arch.length, news.length]);
        tabsAlive.push(tabs);
      },
      update: function (r) { if (!tabs) return false; tabs.set(r.arg === 'news' ? 1 : 0); return true; }
    };
  }

  function pageArticle(id) {
    var x = byId(id);
    if (!x) return pageMissing('Материал не найден', 'В файле данных нет материала «' + id + '».');
    var art = el('article', 'page article'); art.setAttribute('aria-labelledby', 'article-h1');
    var head = el('header', 'a-head'), h1 = el('h1', null, x.title); h1.id = 'article-h1'; h1.tabIndex = -1;
    var meta = el('p', 'a-meta');
    if (x.author) meta.appendChild(el('span', null, x.author));
    if (x.date) { var t = el('time', null, dLong(x.date)); t.dateTime = x.date; meta.appendChild(t); }
    if (x.minutes) meta.appendChild(el('span', null, x.minutes + ' мин'));
    add(head, a('#/rubric/all', 'back', '← К выпуску'), el('p', 'kicker', [x.category, x.format].filter(Boolean).join(' · ')), h1, el('p', 'a-lead', x.description), meta);
    art.appendChild(head);
    var fig = el('figure', 'a-cover'); fig.appendChild(cover(x, null, 'wide'));
    fig.appendChild(el('figcaption', null, 'Типографская обложка демо. Иллюстрация оригинала в макет не перенесена' + (x.caption ? '; её подпись на trbn.ru: «' + x.caption + '»' : '.')));
    art.appendChild(fig);
    var grid = el('div', 'a-grid'), toc = el('nav', 'a-toc glass'), body = el('div', 'a-body'); toc.setAttribute('aria-label', 'Содержание материала');
    toc.appendChild(el('h2', null, 'Содержание'));
    var n = 0;
    (x.blocks || []).forEach(function (b) {
      if (!b || !b.text) return;
      if (b.type === 'heading') {
        n++; var h = el('h2'), num = el('i', null, two(n)); num.setAttribute('aria-hidden', 'true'); h.tabIndex = -1;
        add(h, num, document.createTextNode(b.text)); body.appendChild(h);
        var btn = el('button'), bi = el('i', null, two(n)); bi.setAttribute('aria-hidden', 'true'); btn.type = 'button';
        add(btn, bi, el('span', null, b.text));
        btn.addEventListener('click', function () { h.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' }); h.focus({ preventScroll: true }); });
        toc.appendChild(btn);
      } else if (b.type === 'quote') body.appendChild(el('blockquote', null, b.text));
      else body.appendChild(el('p', null, b.text));
    });
    if (!body.children.length) body.appendChild(el('p', 'muted', 'Текст материала в файле данных отсутствует.'));
    var foot = el('aside', 'a-foot glass'); foot.setAttribute('aria-label', 'Источники и оригинал');
    var srcs = (x.sources || []).filter(function (s) { return s && s.name; });
    if (srcs.length) {
      foot.appendChild(el('h2', null, 'Источники'));
      var ul = el('ul'); srcs.forEach(function (s) { var li = el('li'), u = safeUrl(s.url); li.appendChild(u ? ext(u, null, s.name + ' ↗') : document.createTextNode(s.name)); ul.appendChild(li); }); foot.appendChild(ul);
    }
    foot.appendChild(ext(originalUrl(x), 'btn', 'Читать оригинал на trbn.ru ↗'));
    foot.appendChild(el('p', 'fineprint', 'В оригинале материал оформлен иллюстрациями, хронологией и врезками; в демо перенесён только текст из публичной ленты.'));
    body.appendChild(foot);
    if (n) grid.appendChild(toc); else grid.style.gridTemplateColumns = 'minmax(0, 720px)';
    grid.appendChild(body); art.appendChild(grid);
    // Ещё одна история: следующие три из того же списка, что на сайте
    var pool = issueArticles().indexOf(x) >= 0 ? issueArticles() : D.articles, at = pool.indexOf(x), rel = [];
    for (var k = 1; k < pool.length && rel.length < 3; k++) rel.push(pool[(at + k) % pool.length]);
    if (rel.length) {
      var rs = el('section', 'sec'); rs.setAttribute('aria-labelledby', 'article-more');
      var rh = secHead(null, 'Ещё одна история', a('#/rubric/all', 'more', 'К выпуску →')); rh.querySelector('h2').id = 'article-more'; rs.appendChild(rh);
      var g = el('div', 'grid'); rel.forEach(function (r) { g.appendChild(card(r, null)); }); rs.appendChild(g); art.appendChild(rs);
    }
    return { node: art, title: x.title + ' — Трибуна (демо)', nav: 'rubric/' + x.category };
  }

  function pageMissing(title, text) {
    var wrap = el('section', 'page wrap'), h1 = el('h1', 'page-title', title || 'Страницы нет'); h1.tabIndex = -1;
    add(wrap, h1, el('p', 'page-lead', text || 'В демо такого адреса нет.'), a('#/', 'btn', 'На главную'));
    wrap.lastChild.style.marginTop = '22px';
    return { node: wrap, title: 'Не найдено — Трибуна (демо)', nav: '' };
  }

  var ratingBuilt = false;
  function fillRating() {
    var B = S.bookmakers || {};
    if (B.lead) $('rating-lead').textContent = B.lead;
    if (D) {
      var checked = D.books.map(function (b) { return b.checkedAt; }).filter(Boolean).sort();
      $('rating-facts').textContent = 'В файле данных ' + D.books.length + ' ' + plural(D.books.length, 'букмекер', 'букмекера', 'букмекеров') +
        (checked.length ? '; даты проверки условий: с ' + dNum(checked[0]) + ' по ' + dNum(checked[checked.length - 1]) : '; дата проверки условий не указана') +
        '. 18+. «Трибуна» не принимает ставки.' + (B.companies ? ' На trbn.ru раздел подписан: «' + B.companies + '».' : '');
    }
    if (ratingBuilt || !S.bookmakers) return; ratingBuilt = true;
    var box = $('rating-extra'), P = B.predictions, M = B.method;
    if (P) {
      var s = el('section', 'soon glass'); s.setAttribute('aria-labelledby', 'soon-h');
      var d = el('div'), h = el('h2', null, P.title); h.id = 'soon-h';
      add(d, el('span', 'soon-badge', P.badge), h, el('p', null, P.lead + ' ' + P.text));
      var ul = el('ul'); (P.items || []).forEach(function (it) { var li = el('li'); add(li, el('b', null, it[0]), el('span', null, it[1])); ul.appendChild(li); });
      add(s, d, ul, el('p', 'fineprint', P.note + ' Прогнозов в демо нет.')); box.appendChild(s);
    }
    if (M) {
      var m = el('section', 'method glass'); m.setAttribute('aria-labelledby', 'method-h');
      var mh = el('h2', null, M.title); mh.id = 'method-h';
      add(m, el('p', 'kicker', M.kicker), mh, el('p', null, M.text));
      var ml = el('ul'); (M.questions || []).forEach(function (q) { var li = el('li', null, q); li.appendChild(el('small', null, 'Ответ — на странице рейтинга trbn.ru')); ml.appendChild(li); });
      add(m, ml, ext(ORIGIN + '/bookmakers', 'more', 'Раздел на trbn.ru ↗'));
      m.lastChild.style.justifySelf = 'start';
      if (B.disclaimer) m.appendChild(el('p', 'fineprint', '18+. ' + B.disclaimer));
      box.appendChild(m);
    }
  }

  /* ---------- маршруты ---------- */
  var tabsAlive = [], stack = [], scrolls = {};
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function parse() {
    var h = location.hash || '#/';
    if (h.indexOf('#/') !== 0) return null; // обычный якорь, не маршрут
    var raw = h.slice(2).replace(/\/+$/, ''), parts = raw ? raw.split('/') : [];
    var dec = parts.map(function (p) { try { return decodeURIComponent(p); } catch (e) { return p; } });
    return { key: dec.join('/'), name: dec[0] || 'home', arg: dec[1] || '' };
  }
  function setNav(key) {
    [].forEach.call(document.querySelectorAll('.nav a'), function (l) {
      if (l.getAttribute('data-nav') === key) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
  }
  function navigate(first) {
    var r = parse(); if (!r) return;
    closePanels();
    var back = stack.length > 1 && stack[stack.length - 2] === r.key;
    if (back) stack.pop(); else if (stack[stack.length - 1] !== r.key) stack.push(r.key);
    // та же страница с вкладками: только переключаем вкладку (световой след доигрывает)
    if (current && current.kind && current.kind === r.name && current.update && status === 'ready' && current.update(r)) { setNav(r.name + '/' + r.arg); return; }
    tabsAlive.forEach(function (t) { t.destroy(); }); tabsAlive = [];
    view.textContent = ''; current = null;
    var isRating = r.name === 'rating';
    ratingView.hidden = !isRating; view.hidden = isRating;
    if (isRating) {
      document.title = 'Рейтинг букмекеров — Трибуна (демо)'; setNav('rating'); fillRating();
      requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
      finish(back, first, $('rating-h1')); return;
    }
    if (status === 'loading') { view.appendChild(stateBox('loading', 'Загружаем данные', 'Материалы, матчи и новости читаются из файла данных.')); return; }
    if (status === 'error') { view.appendChild(stateBox('error', 'Не удалось загрузить данные', 'Проверьте соединение и попробуйте ещё раз. (' + errText + ')', true)); document.title = 'Ошибка загрузки — Трибуна (демо)'; return; }
    if (status === 'empty') { view.appendChild(stateBox('empty', 'Данных пока нет', 'Файл данных прочитан, но в нём нет ни материалов, ни матчей, ни новостей.', true)); return; }
    var p = r.name === 'home' ? pageHome()
      : r.name === 'rubric' ? pageRubric(r.arg || 'all')
      : r.name === 'article' ? pageArticle(r.arg)
      : r.name === 'matches' ? pageMatches()
      : r.name === 'archive' ? pageArchive(r.arg)
      : r.name === 'news' ? pageArchive('news')
      : pageMissing();
    view.appendChild(p.node); current = p; document.title = p.title; setNav(p.nav);
    if (p.mount) p.mount();
    tabsAlive.forEach(function (t) { t.refit(); });
    reveal(view);
    finish(back, first, view.querySelector('h1'));
  }
  function finish(back, first, h1) {
    var y = back ? (scrolls[stack[stack.length - 1]] || 0) : 0;
    window.scrollTo(0, y);
    if (!first && h1) h1.focus({ preventScroll: true });
  }
  var st = 0;
  window.addEventListener('scroll', function () {
    if (st) return; st = setTimeout(function () { st = 0; if (stack.length) scrolls[stack[stack.length - 1]] = window.pageYOffset; }, 120);
  }, { passive: true });
  window.addEventListener('hashchange', function () { navigate(false); });
  $('skip').addEventListener('click', function (e) { e.preventDefault(); main.focus(); main.scrollIntoView(); });

  /* ---------- панель «Все темы» ---------- */
  var topics = $('topics'), topicsOpen = $('topics-open'), menuOpen = $('menu-open'), lastOpener = null;
  function buildTopics() {
    var list = $('topics-list'); list.textContent = '';
    var issue = D ? issueArticles() : [], items = [];
    items.push(['#/', 'Главная', 'Выпуск, матч-центр и навигатор по букмекерам', null]);
    rubricNames().forEach(function (nm) { items.push(['#/rubric/' + encodeURIComponent(nm), nm, rubricAbout(nm), issue.filter(function (x) { return x.category === nm; }).length]); });
    items.push(['#/rubric/all', 'Истории', 'Весь выпуск', issue.length]);
    items.push(['#/matches', 'Матчи', 'Расписание, время московское', D ? D.matches.length : null]);
    items.push(['#/archive', 'Архив', 'Прошлые выпуски и новости', null]);
    items.push(['#/rating', 'Букмекеры', 'Рейтинг и сравнение · 18+', D ? D.books.length : null]);
    items.forEach(function (it, i) {
      var li = el('li'), l = a(it[0]);
      add(l, el('i', null, two(i + 1)), el('b', null, it[1]), it[3] != null ? el('span', 'n', String(it[3])) : el('span', 'n', ''), it[2] ? el('small', null, it[2]) : null);
      li.appendChild(l); list.appendChild(li);
    });
  }
  function openTopics(opener) {
    closeSearch(true); lastOpener = opener; topics.hidden = false;
    topicsOpen.setAttribute('aria-expanded', 'true'); menuOpen.setAttribute('aria-expanded', 'true');
    var f = topics.querySelector('a'); if (f) f.focus({ preventScroll: true });
  }
  function closeTopics(refocus) {
    if (topics.hidden) return; topics.hidden = true;
    topicsOpen.setAttribute('aria-expanded', 'false'); menuOpen.setAttribute('aria-expanded', 'false');
    if (refocus && lastOpener) lastOpener.focus({ preventScroll: true });
  }
  [topicsOpen, menuOpen].forEach(function (b) { b.addEventListener('click', function () { if (topics.hidden) openTopics(b); else closeTopics(true); }); });
  $('topics-close').addEventListener('click', function () { closeTopics(true); });
  topics.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) closeTopics(false); });

  /* ---------- поиск: круг → тонкая линия → капсула (search-demo) ---------- */
  var sPanel = $('search'), sOpen = $('search-open'), bar = $('bar'), field = $('field'), input = $('q'), knob = $('knob'), lens = $('lens'), cross = $('cross'), sOut = $('s-out');
  var INK = [27, 29, 25], PAPER = [242, 243, 238], OPEN_MS = 640, CLOSE_MS = 520;
  var p = 0, target = 0, raf = 0, last = 0, openedAt = 0;
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function mix(c1, c2, t) { return 'rgb(' + c1.map(function (v, i) { return Math.round(v + (c2[i] - v) * t); }).join(',') + ')'; }
  function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function outBack(t) { var c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  // p: 0 — круглая кнопка с лупой, 1 — раскрытая капсула.
  function draw() {
    var a1 = clamp(p / 0.22), b = clamp((p - 0.18) / 0.62), c = clamp((p - 0.8) / 0.2);
    var flip = outBack(b), slide = inOut(b), w = bar.offsetWidth;
    field.style.visibility = target || p > 0.001 ? 'visible' : 'hidden';
    field.style.opacity = String(clamp(p / 0.08));
    field.style.transform = 'rotateX(' + (88 * (1 - flip)).toFixed(2) + 'deg) scaleX(' + (0.9 + 0.1 * slide).toFixed(3) + ')';
    input.style.opacity = String(c);
    var size = 56 - 8 * slide, x = (w / 2 - 6 - 24) * slide, light = a1 * (1 - clamp((b - 0.42) / 0.4));
    knob.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0) scale(' + (size / 56).toFixed(3) + ')';
    knob.style.backgroundColor = mix(INK, PAPER, light);
    knob.style.color = mix(PAPER, INK, light);
    knob.style.boxShadow = light > 0.5 ? '0 0 0 1px rgba(27,29,25,.14), 0 6px 12px -6px rgba(27,29,25,.4)' : '';
    lens.style.opacity = String(1 - clamp(p / 0.2));
    cross.style.opacity = String(clamp((b - 0.5) / 0.4));
    cross.style.transform = 'rotate(' + (-90 * (1 - slide)).toFixed(1) + 'deg)';
  }
  function settle() { if (!target && p === 0) sPanel.hidden = true; }
  function tick(now) {
    var dt = Math.max(0, Math.min(48, now - last)); last = now;
    var step = dt / (target ? OPEN_MS : CLOSE_MS);
    p = target ? Math.min(1, p + step) : Math.max(0, p - step);
    draw();
    if (p === target) { raf = 0; settle(); } else raf = requestAnimationFrame(tick);
  }
  function run() {
    if (reduce.matches) { p = target; draw(); settle(); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  function openSearch() {
    if (target === 1) return;
    closeTopics(false);
    sPanel.hidden = false; target = 1; openedAt = performance.now();
    sOpen.setAttribute('aria-expanded', 'true'); sOpen.setAttribute('aria-label', 'Закрыть поиск');
    input.tabIndex = 0; field.style.visibility = 'visible'; draw();
    input.focus({ preventScroll: true }); // внутри нажатия, иначе iPhone не поднимет клавиатуру
    run(); renderSearch();
  }
  function closeSearch(silent) {
    if (target === 0) return;
    target = 0;
    sOpen.setAttribute('aria-expanded', 'false'); sOpen.setAttribute('aria-label', 'Поиск по сайту');
    input.value = ''; input.tabIndex = -1; input.blur();
    if (!silent) sOpen.focus({ preventScroll: true });
    if (silent) { p = 0; if (raf) { cancelAnimationFrame(raf); raf = 0; } draw(); sPanel.hidden = true; } else run();
    sOut.textContent = '';
  }
  sOpen.addEventListener('click', function () { if (target) closeSearch(false); else openSearch(); });
  knob.addEventListener('click', function () { closeSearch(false); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); renderSearch(); if (performance.now() - openedAt > 250) { var f = sOut.querySelector('a'); if (f) f.focus(); } }
  });
  input.addEventListener('input', renderSearch);
  window.addEventListener('resize', function () { if (!sPanel.hidden) draw(); });
  sOut.addEventListener('click', function (e) { var l = e.target.closest && e.target.closest('a'); if (l && !l.target) closeSearch(true); });

  function buildIndex() {
    INDEX = [];
    function push(kind, title, sub, when, href, external, rest) { INDEX.push({ kind: kind, title: title, sub: sub, when: when, href: href, external: external, t: norm(title), rest: norm(sub + ' ' + rest + ' ' + kind) }); }
    D.articles.forEach(function (x) {
      push('Журнал', x.title, x.description, dLong(x.date), articleHref(x), false, [x.category, x.format, x.author, (x.blocks || []).map(function (b) { return b.text; }).join(' ')].join(' '));
    });
    D.news.forEach(function (n) { push('Новость', n.title, 'Источник: ' + n.source, stampMsk(n.date), safeUrl(n.url) || '#/archive/news', !!safeUrl(n.url), NEWS_RUBRIC[n.category] || n.category || ''); });
    D.matches.forEach(function (m) { push('Матч', m.home + ' — ' + m.away, m.sport + ' · ' + m.league, dShort(m.date) + ', ' + m.time + ' МСК', '#/matches', false, ''); });
    D.books.forEach(function (b) { push('Букмекер · 18+', b.name, b.summary, b.checkedAt ? 'условия проверены ' + dNum(b.checkedAt) : 'условия не проверены', '#/rating', false, b.label + ' ' + b.id); });
  }
  function marked(text, q) {
    var h = el('p', 's-title'), at = norm(text).indexOf(q);
    if (!q || at < 0) { h.textContent = text; return h; }
    add(h, document.createTextNode(text.slice(0, at)), el('mark', null, text.slice(at, at + q.length)), document.createTextNode(text.slice(at + q.length)));
    return h;
  }
  var TIPS = ['Кубок', 'Теннис', 'КХЛ', 'Фонбет', 'Марафон'];
  function renderSearch() {
    sOut.textContent = '';
    if (!target) return;
    if (status !== 'ready') { sOut.appendChild(el('p', 's-hint', status === 'loading' ? 'Данные ещё загружаются…' : 'Данные не загружены — искать не по чему.')); return; }
    var q = norm(input.value.trim());
    if (!q) {
      sOut.appendChild(el('p', 's-hint', ((S.search || {}).hint || 'Ищем по заголовкам, вступлениям и тексту материалов.') + ' В демо — ещё по матчам и букмекерам. Попробуйте:'));
      var tips = el('div', 'tips');
      TIPS.forEach(function (t) {
        var b = el('button', 'tip', t); b.type = 'button';
        b.addEventListener('click', function () { input.value = t; input.focus({ preventScroll: true }); renderSearch(); });
        tips.appendChild(b);
      });
      sOut.appendChild(tips); return;
    }
    var hits = INDEX.filter(function (x) { return x.t.indexOf(q) >= 0; }).concat(INDEX.filter(function (x) { return x.t.indexOf(q) < 0 && x.rest.indexOf(q) >= 0; }));
    if (!hits.length) {
      var none = el('div', 's-none'); none.appendChild(el('b', null, 'Ничего не найдено'));
      none.appendChild(document.createTextNode('По запросу «' + input.value.trim() + '» в данных демо ничего нет.'));
      sOut.appendChild(none); return;
    }
    sOut.appendChild(el('p', 's-count', 'Найдено: ' + hits.length + (hits.length > 30 ? ', показаны первые 30' : '')));
    var ul = el('ul', 's-list');
    hits.slice(0, 30).forEach(function (x) {
      var li = el('li'), l = x.external ? ext(x.href) : a(x.href);
      add(l, el('span', 's-kind', x.kind), el('span', 's-when', x.when), marked(x.title + (x.external ? ' ↗' : ''), q), x.sub ? el('p', 's-sub', x.sub) : null);
      li.appendChild(l); ul.appendChild(li);
    });
    sOut.appendChild(ul);
  }

  function closePanels() { closeTopics(false); closeSearch(true); }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (document.querySelector('.lr-sheet:not([hidden])')) return; // окно рейтинга закрывается само
    if (target) { e.preventDefault(); closeSearch(false); } else if (!topics.hidden) { e.preventDefault(); closeTopics(true); }
  });
  main.addEventListener('pointerdown', function () { if (!topics.hidden) closeTopics(false); if (target) closeSearch(true); });
  function fitTop() { root.style.setProperty('--top', $('top').offsetHeight + 'px'); }
  window.addEventListener('resize', fitTop); fitTop();

  /* ---------- загрузка ---------- */
  function getJson(src) { return fetch(src, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); }
  function load() {
    status = 'loading'; D = null; navigate(true);
    var wasError = root.dataset.state === 'error';
    root.dataset.state = 'loading';
    Promise.all([getJson(DATA_SRC), getJson(SNAP_SRC).catch(function () { return {}; })]).then(function (res) {
      var d = res[0];
      if (!d || typeof d !== 'object') throw new Error('В файле нет данных');
      ['articles', 'news', 'matches', 'books'].forEach(function (k) { if (!Array.isArray(d[k])) d[k] = []; });
      D = d; S = res[1] || {};
      status = d.articles.length + d.news.length + d.matches.length + d.books.length ? 'ready' : 'empty';
      if (status === 'ready') buildIndex();
      buildTopics();
      $('data-stamp').textContent = 'Данные — срез публичных лент trbn.ru от ' + stampMsk(d.generatedAt) + (S.snapshotAt ? '; структура сайта прочитана ' + dNum(S.snapshotAt) : '') + '. Срез сам не обновляется.';
    }).catch(function (e) {
      status = 'error'; errText = e && e.message ? e.message : 'ошибка';
    }).then(function () {
      root.dataset.state = status;
      if (wasError && window.__liveRating) window.__liveRating.reload();
      navigate(true);
    });
  }
  load();
  window.__site = {
    state: function () { return { status: status, route: parse(), search: { p: p, target: target }, tabs: tabsAlive.map(function (t) { return t.state(); }), index: INDEX.length }; },
    reload: load
  };
})();
