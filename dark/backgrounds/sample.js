// Образцы экранов для галереи фона. Разметка и классы — те же, что строят dark-demos/app/rating.js
// и dark-demos/site/site.js; содержимое берётся из ../data/app-data.json. Образцы неподвижны:
// это один и тот же экран под любым фоном, поэтому жестов, поиска и переходов здесь нет.
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var LOGOS = '../logos/';
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function add(p) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) p.appendChild(arguments[i]); return p; }
  function svg(viewBox, shapes) {
    var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', viewBox); s.setAttribute('aria-hidden', 'true');
    shapes.forEach(function (sh) { var n = document.createElementNS(NS, sh[0]); Object.keys(sh[1]).forEach(function (k) { n.setAttribute(k, sh[1][k]); }); s.appendChild(n); });
    return s;
  }
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
  function ymd(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? [+m[1], +m[2], +m[3]] : null; }
  function dNum(s) { var m = ymd(s); return m ? ('0' + m[2]).slice(-2) + '.' + ('0' + m[1]).slice(-2) + '.' + m[0] : ''; }
  var MON3 = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  var MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  function dShort(s) { var m = ymd(s); return m ? m[2] + ' ' + MON3[m[1] - 1] : ''; }
  function dLong(s) { var m = ymd(s); return m ? m[2] + ' ' + MON[m[1] - 1] + ' ' + m[0] : ''; }
  function two(n) { return ('0' + n).slice(-2); }
  function stampMsk(iso) {
    var d = new Date(iso); if (isNaN(d)) return '';
    d = new Date(d.getTime() + 3 * 3600e3);
    return two(d.getUTCDate()) + '.' + two(d.getUTCMonth() + 1) + '.' + d.getUTCFullYear() + ', ' + two(d.getUTCHours()) + ':' + two(d.getUTCMinutes()) + ' МСК';
  }
  function stamp(s) { var d = new Date(s); return isNaN(d) ? '' : d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' }) + ' МСК'; }
  function tint(hex) { var m = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 'rgba(230,255,87,.2)'; var v = parseInt(m[1], 16); return 'rgba(' + (v >> 16) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',.42)'; }

  /* ---------- «Мобильный экран»: вкладка «Рейтинг» ---------- */
  var TABS = [
    { icon: 'journal', label: 'Журнал', w: 19.8, h: 20.8 },
    { icon: 'news', label: 'Новости', w: 21.8, h: 21.8 },
    { icon: 'matches', label: 'Матчи', w: 21.8, h: 17.8 },
    { icon: 'books', label: 'Рейтинг', w: 21.8, h: 18.8 },
    { icon: 'predictions', label: 'Прогнозы', w: 21.8, h: 21.8 }
  ];
  var WAVE = { base: 61.5, top: 3.5, half: 0.66, flank: 0.62, pad: 10, maxHalf: 54 };
  var NAV_INDEX = 3;
  var cards = [];

  function plate(b) {
    var d = el('div', 'lr-plate');
    if (b.logoFile) { var img = el('img'); img.src = LOGOS + b.logoFile; img.alt = b.name; img.draggable = false; if (b.logoSurface && b.logoSurface.toUpperCase() !== '#FFFFFF') d.style.background = b.logoSurface; d.appendChild(img); }
    else { d.classList.add('text'); d.textContent = b.name; }
    return d;
  }
  function sum(b) {
    var p = el('p', 'lr-sum');
    if (b.amount) { if (b.prefix) p.appendChild(el('small', null, b.prefix.toLowerCase())); p.appendChild(document.createTextNode(money(b.amount))); }
    else { p.classList.add('word'); p.textContent = 'По условиям'; }
    return p;
  }
  function buildMobile(d) {
    var root = document.getElementById('m-rating'); root.textContent = '';
    var all = d.books.slice().sort(function (a, b) { return a.order - b.order; });
    var head = el('header', 'lr-head');
    head.appendChild(el('p', 'kicker', '04 / Рейтинг · 18+'));
    var title = el('h1', 'lr-title');
    add(title, document.createTextNode('Сравнить, а потом '), el('em', null, 'выбрать.')); head.appendChild(title);
    head.appendChild(el('p', 'lr-honest', 'Трибуна не принимает ставки. Порядок редакции — не оценка надёжности.'));

    var tools = el('div', 'lr-tools'), bar = el('div', 'sb');
    var knob = el('span', 'sb-knob'); knob.appendChild(svg('0 0 24 24', [['circle', { cx: 10.5, cy: 10.5, r: 6.5 }], ['path', { d: 'm15.4 15.4 5 5' }]]));
    add(bar, el('span', 'sb-hint', 'Найти букмекера'), el('div', 'sb-field'), knob); tools.appendChild(bar);
    var chips = el('div', 'lr-chips');
    ['Все', 'Фрибеты', 'Бонусы', 'Подарочные пари'].forEach(function (n, i) { var c = el('span', 'lr-chip', n); c.setAttribute('aria-pressed', i ? 'false' : 'true'); c.style.display = 'inline-flex'; c.style.alignItems = 'center'; chips.appendChild(c); });
    tools.appendChild(chips);

    var stage = el('div', 'lr-stage');
    cards = all.slice(0, 4).map(function (b) {
      var c = el('article', 'lr-card'); c.style.setProperty('--tint', tint(b.accent));
      var row = el('div', 'lr-row'); row.appendChild(plate(b));
      row.appendChild(el('span', 'lr-num', two(b.order) + ' / ' + two(all.length))); c.appendChild(row);
      var st = el('p', 'lr-status', b.statusText); if (b.statusText !== 'Правила проверены') st.classList.add('warn'); c.appendChild(st);
      var offer = el('div', 'lr-offer'); offer.appendChild(el('span', 'lr-kind', b.label)); offer.appendChild(sum(b));
      offer.appendChild(el('p', 'lr-text', b.summary)); offer.appendChild(el('p', 'lr-checked', b.checkedAt ? 'На дату проверки · ' + dNum(b.checkedAt) : 'Дата проверки не указана'));
      c.appendChild(offer);
      var acts = el('div', 'lr-acts'), more = el('span', 'lr-btn main', 'Подробности'), pick = el('span', 'lr-btn pick', '+');
      [more, pick].forEach(function (x) { x.style.display = 'flex'; x.style.alignItems = 'center'; x.style.justifyContent = 'center'; });
      add(acts, more, pick); c.appendChild(acts);
      stage.appendChild(c); return c;
    });
    var dots = el('div', 'lr-dots'); all.forEach(function (_, i) { dots.appendChild(el('i', i ? '' : 'on')); });
    var foot = el('div', 'lr-foot');
    var checked = all.map(function (b) { return b.checkedAt; }).filter(Boolean).sort();
    var range = !checked.length ? 'дата проверки условий не указана' : checked[0] === checked[checked.length - 1] ? 'условия проверены ' + dNum(checked[0]) : 'условия проверены с ' + dNum(checked[0]) + ' по ' + dNum(checked[checked.length - 1]);
    foot.appendChild(el('p', null, all.length + ' букмекеров в каталоге приложения; ' + range + '. Суммы показаны на дату проверки каждой карточки.'));
    foot.appendChild(el('p', null, '18+. «Трибуна» не принимает ставки. Участие в азартных играх может вызвать игровую зависимость. Условия могут меняться; максимальная сумма не означает гарантированную выплату.'));
    foot.appendChild(el('p', null, 'Тот же каталог, что в разделе «Рейтинг» приложения. Данные получены ' + stamp(d.generatedAt) + '.'));
    add(root, head, tools, stage, dots, foot);

    var capsule = document.getElementById('m-capsule');
    Array.prototype.slice.call(capsule.querySelectorAll('.cell')).forEach(function (c) { c.remove(); });
    TABS.forEach(function (t, i) {
      var b = el('span', 'cell'); b.setAttribute('aria-selected', i === NAV_INDEX ? 'true' : 'false');
      var ico = el('span', 'ico'); ico.style.setProperty('--src', 'url(icons/' + t.icon + '.svg)'); ico.style.setProperty('--w', t.w + 'px'); ico.style.setProperty('--h', t.h + 'px');
      add(b, ico, el('span', 'lab', t.label)); capsule.appendChild(b);
    });
    layoutMobile();
  }
  // Раскладка карусели — формулы layout() из rating.js для первой карточки, без перетаскивания.
  function layoutMobile() {
    if (cards.length && cards[0].offsetWidth) {
      var w = cards[0].offsetWidth, step = w * 0.62;
      cards.forEach(function (c, i) {
        var a = i, near = Math.min(a, 1), x = near * step * 1.08 + Math.max(0, a - 1) * step * 0.56, z = -near * 170 - Math.max(0, a - 1) * 120;
        c.style.transition = 'none';
        c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + (-near * 40).toFixed(1) + 'deg)';
        c.style.opacity = String(Math.max(0, 1 - Math.max(0, a - 0.35) * 0.46));
        c.style.zIndex = String(100 - Math.round(a * 10));
        c.style.filter = a > 0.5 ? 'brightness(' + (1 - Math.min(a, 2) * 0.16).toFixed(2) + ')' : '';
        c.setAttribute('aria-current', i === 0 ? 'true' : 'false');
      });
    }
    // Лаймовая арка нижней панели — формула drawWave() из app.js для вкладки «Рейтинг».
    var capsule = document.getElementById('m-capsule'), navWidth = capsule.clientWidth;
    if (!navWidth) return;
    document.getElementById('m-wave').setAttribute('width', navWidth);
    var cell = (navWidth - WAVE.pad * 2) / TABS.length;
    var half = Math.min(cell * WAVE.half, WAVE.maxHalf), flank = half * WAVE.flank, plateau = half - flank;
    var cx = WAVE.pad + NAV_INDEX * cell + cell / 2, a = cx - half, b = cx + half, base = WAVE.base, top = WAVE.top;
    var f = function (n) { return n.toFixed(2); };
    var arch = 'C ' + f(a + flank * 0.5) + ' ' + base + ' ' + f(cx - plateau - flank * 0.5) + ' ' + top + ' ' + f(cx - plateau) + ' ' + top +
      ' L ' + f(cx + plateau) + ' ' + top +
      ' C ' + f(cx + plateau + flank * 0.5) + ' ' + top + ' ' + f(b - flank * 0.5) + ' ' + base + ' ' + f(b) + ' ' + base;
    document.getElementById('m-wave-line').setAttribute('d', 'M -8 ' + base + ' L ' + f(a) + ' ' + base + ' ' + arch + ' L ' + f(navWidth + 8) + ' ' + base);
    document.getElementById('m-wave-glow').setAttribute('d', 'M ' + f(a) + ' ' + base + ' ' + arch + ' Z');
  }

  /* ---------- «Сайт»: первый экран главной, матч-центр, карточки ---------- */
  var HUES = { 'Футбол': 96, 'Теннис': 68, 'Баскетбол': 26, 'Хоккей': 188, 'Спорт': 150, 'Стиль': 44, 'ММА': 4, 'Авто': 212, 'Олимпизм': 128 };
  function secHead(kicker, title, side) {
    var h = el('header', 'sec-head'), l = el('div');
    if (kicker) l.appendChild(el('p', 'kicker', kicker));
    l.appendChild(el('h2', null, title)); h.appendChild(l);
    if (side) h.appendChild(side);
    return h;
  }
  function matchCard(m) {
    var c = el('article', 'match'), top = el('div', 'match-top'), t = el('time', null, dShort(m.date) + ' · ' + m.time);
    add(top, el('b', null, m.sport), t); c.appendChild(top);
    c.appendChild(el('p', 'match-league', m.league));
    [[m.home, m.homeCode, 0], [m.away, m.awayCode, 1]].forEach(function (r) {
      var row = el('p', 'team'), b = el('span', 'badge', r[1] || (r[0] || '').slice(0, 3).toUpperCase());
      b.style.background = (m.colors && /^#[0-9a-f]{6}$/i.test(m.colors[r[2]] || '')) ? m.colors[r[2]] : '#3a4030';
      add(row, b, el('span', null, r[0])); c.appendChild(row);
    });
    if (m.odds && m.odds.length >= 2) {
      var line = el('div', 'line'), dl = el('dl');
      line.appendChild(el('p', null, 'Линия букмекера, не прогноз · 18+'));
      var names = m.odds.length === 3 ? ['П1', 'X', 'П2'] : ['П1', 'П2'];
      names.forEach(function (nm, i) { var dv = el('div'); add(dv, el('dt', null, nm), el('dd', null, Number(m.odds[i]).toFixed(2))); dl.appendChild(dv); });
      line.appendChild(dl); c.appendChild(line);
    }
    return c;
  }
  function articleCard(x, n) {
    var art = el('article', 'card'), link = el('a'), body = el('div', 'card-body');
    var c = el('div', 'cover'); c.style.setProperty('--h', String(HUES[x.category] != null ? HUES[x.category] : 68));
    add(c, el('span', 'cover-n', n), x.format ? el('span', 'cover-f', x.format) : null, el('span', 'cover-w', x.category || 'Трибуна'));
    var meta = el('p', 'meta');
    if (x.author) meta.appendChild(el('span', null, x.author));
    if (x.date) meta.appendChild(el('time', null, dShort(x.date)));
    if (x.minutes) meta.appendChild(el('span', null, x.minutes + ' мин чтения'));
    meta.appendChild(el('span', 'go', '↗'));
    add(body, el('span', 'kicker', x.category), el('h3', null, x.title), el('p', null, x.description), meta);
    add(link, c, body); art.appendChild(link); return art;
  }
  function buildSite(d) {
    var main = document.getElementById('s-main'); main.textContent = '';
    var hero = el('section', 'hero wrap'), h1 = el('h1');
    add(h1, document.createTextNode('Журнал о спорте, людях и '), el('em', null, 'культуре.'));
    add(hero, el('p', 'kicker', 'Авторское медиа о спорте'), h1,
      el('p', 'lead', 'Большие истории, матч-центр и навигатор по букмекерам. Те же разделы, что на trbn.ru, — в тёмном оформлении.'));
    var ad = el('aside', 'adslot');
    add(ad, el('b', null, 'Рекламное место'), el('span', null, 'На trbn.ru здесь баннер партнёра с маркировкой. В демо не перенесено.'));
    hero.appendChild(ad); main.appendChild(hero);

    var ms = el('section', 'sec wrap');
    ms.appendChild(secHead('Матч-центр', 'Ближайшие матчи', el('span', 'more', 'Все матчи →')));
    var sports = []; d.matches.forEach(function (m) { if (sports.indexOf(m.sport) < 0) sports.push(m.sport); });
    var row = el('div', 'tabs-row'), tl = el('div', 'tabs'), grid = el('div', 'mgrid scroller');
    ['Все'].concat(sports).forEach(function (n, i) { var t = el('span', 'tab', n); t.setAttribute('aria-selected', i ? 'false' : 'true'); t.style.display = 'inline-flex'; t.style.alignItems = 'center'; tl.appendChild(t); });
    var streak = el('span', 'streak'); streak.style.background = '#E6FF57'; streak.style.width = '26px'; tl.appendChild(streak);
    add(row, tl, el('span', 'tabs-note', 'Время московское · МСК')); add(ms, row, grid);
    d.matches.slice(0, 4).forEach(function (m) { grid.appendChild(matchCard(m)); });
    var fine = el('p', 'fineprint', 'Коэффициенты — линия букмекера и могут меняться. 18+ Это не прогноз редакции. Расписание в файле данных от ' + stampMsk(d.matchUpdatedAt || d.generatedAt) + '.');
    fine.style.marginTop = '14px'; ms.appendChild(fine); main.appendChild(ms);

    var latest = d.articles.map(function (x) { return x.edition || x.date; }).filter(Boolean).sort().reverse()[0];
    var list = d.articles.filter(function (x) { return (x.edition || x.date) === latest; }).slice(0, 3);
    if (list.length) {
      var as = el('section', 'sec wrap'), side = el('span', 'side', dLong(latest));
      as.appendChild(secHead(null, 'Свежий выпуск', side));
      var g = el('div', 'grid'); list.forEach(function (x, i) { g.appendChild(articleCard(x, two(i + 1))); }); as.appendChild(g); main.appendChild(as);
    }
    window.__sampleStreak = function () { var first = tl.querySelector('.tab'); if (first && first.offsetWidth) streak.style.transform = 'translate3d(' + (first.offsetLeft + first.offsetWidth / 2 - 13).toFixed(1) + 'px,0,0)'; };
    window.__sampleStreak();
  }

  var ready = fetch('../data/app-data.json').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (d) {
    buildMobile(d); buildSite(d); return d;
  });
  ready.catch(function () { document.getElementById('g-fail').hidden = false; });
  function relayout() { layoutMobile(); if (window.__sampleStreak) window.__sampleStreak(); }
  window.addEventListener('resize', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  window.TribunaSample = { ready: ready, relayout: relayout };
})();
