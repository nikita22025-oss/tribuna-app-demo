// Live rating (variant A) for the landing. It reads the same catalogue the app shows:
// data/app-data.json is produced by scripts/build-landing-data.ts with the app's own parser.
// No card is written by hand here; when the file changes, the section changes with it.
(function () {
  'use strict';
  var root = document.getElementById('live-rating');
  if (!root) return;
  var SRC = root.getAttribute('data-src') || '../data/app-data.json';
  var LOGOS = root.getAttribute('data-logos') || '../logos/';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  // The same four filters as the app's Rating tab.
  var FILTERS = [['Все', null], ['Фрибеты', 'freebet'], ['Бонусы', 'deposit'], ['Подарочные пари', 'gift']];
  var state = { all: [], list: [], index: 0, filter: null, query: '', picked: [], data: null };
  var cards = [], moved = false;

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
  function date(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
  function stamp(s) { var d = new Date(s); return isNaN(d) ? '' : d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); }
  function tint(hex) { var m = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 'rgba(230,255,87,.2)'; var v = parseInt(m[1], 16); return 'rgba(' + (v >> 16) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',.42)'; }
  function icon(d) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); var p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); s.appendChild(p); return s; }
  function plate(b) {
    var d = el('div', 'lr-plate');
    if (b.logoFile) { var img = el('img'); img.src = LOGOS + b.logoFile; img.alt = b.name; img.draggable = false; if (b.logoSurface && b.logoSurface.toUpperCase() !== '#FFFFFF') d.style.background = b.logoSurface; d.appendChild(img); }
    else { d.classList.add('text'); d.textContent = b.name; }
    return d;
  }
  function sum(b, cls) {
    var p = el('p', cls);
    if (b.amount) { if (b.prefix) p.appendChild(el('small', null, b.prefix.toLowerCase())); p.appendChild(document.createTextNode(money(b.amount))); }
    else { p.classList.add('word'); p.textContent = 'По условиям'; }
    return p;
  }

  /* ---------- skeleton ---------- */
  var head = el('div', 'lr-head');
  head.appendChild(el('p', 'lr-kicker', 'Рейтинг · 18+ · данные приложения'));
  var title = el('h2', 'lr-title', 'Сравнить, а потом выбрать.'); title.id = 'lr-title'; head.appendChild(title);
  var fresh = el('p', 'lr-fresh'); head.appendChild(fresh);
  var tools = el('div', 'lr-tools');
  var search = el('label', 'lr-search'); search.appendChild(icon('M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.6-3.6'));
  var input = el('input'); input.type = 'search'; input.placeholder = 'Найти букмекера'; input.setAttribute('aria-label', 'Найти букмекера'); input.autocomplete = 'off'; input.setAttribute('enterkeyhint', 'search');
  var clear = el('button', null, '×'); clear.type = 'button'; clear.setAttribute('aria-label', 'Очистить поиск'); clear.hidden = true;
  search.appendChild(input); search.appendChild(clear); tools.appendChild(search);
  var chips = el('div', 'lr-chips'); tools.appendChild(chips);
  var count = el('p', 'lr-count'); count.setAttribute('aria-live', 'polite'); tools.appendChild(count);
  var stage = el('div', 'lr-stage'); stage.tabIndex = 0; stage.setAttribute('role', 'group'); stage.setAttribute('aria-roledescription', 'карусель'); stage.setAttribute('aria-label', 'Букмекеры');
  var message = el('div', 'lr-state'); stage.appendChild(message);
  var dock = el('div', 'lr-dock');
  var prev = el('button'); prev.type = 'button'; prev.setAttribute('aria-label', 'Предыдущий букмекер'); prev.appendChild(icon('m15 5-7 7 7 7'));
  var next = el('button'); next.type = 'button'; next.setAttribute('aria-label', 'Следующий букмекер'); next.appendChild(icon('m9 5 7 7-7 7'));
  var now = el('div', 'lr-now'), nowName = el('b'), nowPos = el('span'); now.appendChild(nowName); now.appendChild(nowPos);
  dock.appendChild(prev); dock.appendChild(now); dock.appendChild(next);
  var dots = el('div', 'lr-dots'); dots.setAttribute('aria-hidden', 'true');
  var compare = el('div', 'lr-compare'); compare.hidden = true;
  var compareText = el('p'), compareOpen = el('button', null, 'Сравнить →'); compareOpen.type = 'button'; compare.appendChild(compareText); compare.appendChild(compareOpen);
  var foot = el('div', 'lr-foot');
  foot.appendChild(el('p', null, '18+. «Трибуна» не принимает ставки. Участие в азартных играх может вызвать игровую зависимость. Условия могут меняться; максимальная сумма не означает гарантированную выплату.'));
  var sourceLine = el('p'); foot.appendChild(sourceLine);
  root.classList.add('lr'); root.setAttribute('aria-labelledby', 'lr-title');
  [head, tools, stage, dock, dots, compare, foot].forEach(function (n) { root.appendChild(n); });

  function show(kind, text, retry) {
    cards.forEach(function (c) { c.remove(); }); cards = [];
    message.hidden = false; message.textContent = '';
    message.appendChild(el('b', null, kind)); if (text) message.appendChild(el('span', null, text));
    if (retry) { var b = el('button', 'lr-btn main', 'Повторить'); b.type = 'button'; b.style.flex = 'none'; b.style.padding = '0 22px'; b.addEventListener('click', load); message.appendChild(b); }
    dock.hidden = dots.hidden = true;
  }

  /* ---------- cards ---------- */
  function build() {
    cards.forEach(function (c) { c.remove(); });
    cards = state.list.map(function (b, i) {
      var c = el('article', 'lr-card'); c.style.setProperty('--tint', tint(b.accent)); c.dataset.id = b.id;
      c.setAttribute('aria-label', b.name + '. ' + (b.amount ? (b.prefix ? b.prefix + ' ' : '') + money(b.amount) + ', ' + b.label : b.label));
      var row = el('div', 'lr-row'); row.appendChild(plate(b));
      row.appendChild(el('span', 'lr-num', String(b.order).padStart(2, '0') + ' / ' + String(state.all.length).padStart(2, '0'))); c.appendChild(row);
      var st = el('p', 'lr-status', b.statusText); if (b.statusText !== 'Правила проверены') st.classList.add('warn'); c.appendChild(st);
      var offer = el('div', 'lr-offer'); offer.appendChild(el('span', 'lr-kind', b.label)); offer.appendChild(sum(b, 'lr-sum'));
      offer.appendChild(el('p', 'lr-text', b.summary)); offer.appendChild(el('p', 'lr-checked', b.checkedAt ? 'На дату проверки · ' + date(b.checkedAt) : 'Дата проверки не указана'));
      c.appendChild(offer);
      var acts = el('div', 'lr-acts');
      var more = el('button', 'lr-btn main', 'Подробности'); more.type = 'button'; more.addEventListener('click', function (e) { e.stopPropagation(); openTerms(b); });
      var pick = el('button', 'lr-btn pick'); pick.type = 'button'; pick.dataset.id = b.id; pick.addEventListener('click', function (e) { e.stopPropagation(); toggle(b.id); });
      acts.appendChild(more); acts.appendChild(pick); c.appendChild(acts);
      c.addEventListener('click', function () { if (!moved && i !== state.index) go(i); });
      stage.appendChild(c); return c;
    });
    dots.textContent = ''; state.list.forEach(function () { dots.appendChild(el('i')); });
    if (!state.list.length) { show('Ничего не найдено', 'Попробуйте другое название или тип предложения.'); syncPicks(); return; }
    message.hidden = true; dock.hidden = dots.hidden = false;
    syncPicks(); layout(0);
  }
  function layout(drag) {
    if (!cards.length) return;
    var w = cards[0].offsetWidth || 300, step = w * 0.62, pos = state.index - drag / step;
    cards.forEach(function (c, i) {
      var d = i - pos, a = Math.abs(d), s = d < 0 ? -1 : 1;
      if (a > 3.2) { c.style.visibility = 'hidden'; return; }
      c.style.visibility = '';
      var near = Math.min(a, 1), x = s * (near * step * 1.08 + Math.max(0, a - 1) * step * 0.56), z = -near * 170 - Math.max(0, a - 1) * 120;
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + (reduce.matches ? 0 : -s * near * 40).toFixed(1) + 'deg)';
      c.style.opacity = String(Math.max(0, 1 - Math.max(0, a - 0.35) * 0.46));
      c.style.zIndex = String(100 - Math.round(a * 10));
      c.style.filter = a > 0.5 ? 'brightness(' + (1 - Math.min(a, 2) * 0.16).toFixed(2) + ')' : '';
      var cur = i === state.index;
      c.setAttribute('aria-current', cur ? 'true' : 'false'); c.setAttribute('aria-hidden', cur ? 'false' : 'true');
      Array.prototype.forEach.call(c.querySelectorAll('button'), function (b) { b.tabIndex = cur ? 0 : -1; });
    });
    var b = state.list[state.index];
    nowName.textContent = b ? b.name : ''; nowPos.textContent = b ? (state.index + 1) + ' ИЗ ' + state.list.length : '';
    prev.disabled = state.index <= 0; next.disabled = state.index >= state.list.length - 1;
    Array.prototype.forEach.call(dots.children, function (d, i) { d.className = i === state.index ? 'on' : ''; });
  }
  function go(i) { state.index = Math.max(0, Math.min(state.list.length - 1, i)); layout(0); }

  /* ---------- gestures and keys ---------- */
  var sx = 0, sy = 0, dx = 0, active = false, lock = null, lastX = 0, lastT = 0, vel = 0;
  stage.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; active = true; lock = null; moved = false; dx = vel = 0; sx = lastX = e.clientX; sy = e.clientY; lastT = e.timeStamp; });
  window.addEventListener('pointermove', function (e) {
    if (!active) return;
    var mx = e.clientX - sx, my = e.clientY - sy;
    if (lock === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) lock = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
    if (lock !== 'x') return;
    moved = true; stage.classList.add('dragging');
    var edge = (state.index === 0 && mx > 0) || (state.index === state.list.length - 1 && mx < 0);
    dx = edge ? mx * 0.3 : mx;
    var dt = e.timeStamp - lastT; if (dt > 0) vel = (e.clientX - lastX) / dt; lastX = e.clientX; lastT = e.timeStamp;
    layout(dx);
  });
  function end() {
    if (!active) return; active = false; stage.classList.remove('dragging');
    if (lock === 'x' && cards.length) { var w = cards[0].offsetWidth * 0.62, n = Math.round(-dx / w); if (n === 0 && Math.abs(vel) > 0.45) n = vel < 0 ? 1 : -1; go(state.index + n); }
    setTimeout(function () { moved = false; }, 60);
  }
  window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  // A drag must never end as a click on «Подробности», «+» or a side card.
  stage.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  // Trackpad: a horizontal two-finger swipe turns one card; vertical wheel stays with the page.
  var wheelLock = 0;
  stage.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) return;
    e.preventDefault();
    if (e.timeStamp < wheelLock) return; wheelLock = e.timeStamp + 380;
    go(state.index + (e.deltaX > 0 ? 1 : -1));
  }, { passive: false });
  stage.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
    var k = { ArrowRight: state.index + 1, ArrowLeft: state.index - 1, Home: 0, End: state.list.length - 1 }[e.key];
    if (k !== undefined) { go(k); e.preventDefault(); }
  });
  prev.addEventListener('click', function () { go(state.index - 1); }); next.addEventListener('click', function () { go(state.index + 1); });
  window.addEventListener('resize', function () { layout(0); });

  /* ---------- search, filters ---------- */
  function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е').replace(/[\s\-_.]/g, ''); }
  function apply(keep) {
    var q = norm(state.query);
    state.list = state.all.filter(function (b) { return (!state.filter || b.type === state.filter) && (!q || norm(b.name).indexOf(q) >= 0 || norm(b.id).indexOf(q) >= 0); });
    var at = keep ? state.list.map(function (b) { return b.id; }).indexOf(keep) : -1; state.index = at >= 0 ? at : 0;
    // The counter is for screen readers only; the visible line was removed at the owner's request.
    count.textContent = 'Показано ' + state.list.length + ' из ' + state.all.length;
    build();
  }
  function current() { var b = state.list[state.index]; return b ? b.id : null; }
  FILTERS.forEach(function (f) {
    var c = el('button', 'lr-chip', f[0]); c.type = 'button'; c.setAttribute('aria-pressed', f[1] === null ? 'true' : 'false');
    c.addEventListener('click', function () { state.filter = f[1]; Array.prototype.forEach.call(chips.children, function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); }); apply(current()); });
    chips.appendChild(c);
  });
  input.addEventListener('input', function () { state.query = input.value; clear.hidden = !input.value; apply(input.value ? null : current()); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') input.blur(); });
  clear.addEventListener('click', function () { input.value = ''; state.query = ''; clear.hidden = true; apply(null); input.focus(); });

  /* ---------- compare ---------- */
  function byId(id) { return state.all.filter(function (b) { return b.id === id; })[0]; }
  function toggle(id) { var at = state.picked.indexOf(id); if (at >= 0) state.picked.splice(at, 1); else if (state.picked.length < 3) state.picked.push(id); syncPicks(); }
  function syncPicks() {
    var full = state.picked.length >= 3;
    Array.prototype.forEach.call(root.querySelectorAll('.lr-btn.pick'), function (b) {
      var on = state.picked.indexOf(b.dataset.id) >= 0, name = byId(b.dataset.id).name;
      b.textContent = on ? '✓' : '+'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', (on ? 'Убрать из сравнения: ' : 'Сравнить ') + name); b.disabled = !on && full;
    });
    var n = state.picked.length; compare.hidden = n === 0;
    compareText.textContent = n === 1 ? 'Выбран 1. Добавьте ещё одного' : 'Выбрано ' + n + ' из 3'; compareOpen.disabled = n < 2;
  }
  compareOpen.addEventListener('click', openCompare);

  /* ---------- sheet ---------- */
  var sheet = el('div', 'lr-sheet'); sheet.hidden = true; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'lr-sheet-title');
  var back = el('div', 'lr-sheet-back'), body = el('div', 'lr-sheet-body'), x = el('button', 'lr-sheet-x', '×'), content = el('div'), lastFocus = null;
  x.type = 'button'; x.setAttribute('aria-label', 'Закрыть'); body.appendChild(x); body.appendChild(content); sheet.appendChild(back); sheet.appendChild(body); document.body.appendChild(sheet);
  function open() { lastFocus = document.activeElement; sheet.hidden = false; document.documentElement.style.overflow = 'hidden'; body.scrollTop = 0; x.focus(); }
  function close() { sheet.hidden = true; document.documentElement.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  back.addEventListener('click', close); x.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); });
  function rows(pairs) { var dl = el('dl'); pairs.forEach(function (p) { if (!p[1]) return; var d = el('div'); d.appendChild(el('dt', null, p[0])); d.appendChild(el('dd', null, p[1])); dl.appendChild(d); }); return dl; }
  function list(tag, items) { var l = el(tag); (items || []).forEach(function (t) { l.appendChild(el('li', null, t)); }); return l; }
  function openTerms(b) {
    content.textContent = ''; content.appendChild(plate(b));
    var h = el('h2', null, b.name); h.id = 'lr-sheet-title'; content.appendChild(h);
    content.appendChild(sum(b, 'big')); content.appendChild(el('p', null, b.label)); content.appendChild(el('p', null, b.summary));
    content.appendChild(el('p', b.statusText === 'Правила проверены' ? 'note' : 'warn', b.statusText + (b.checkedAt ? ' · проверено ' + date(b.checkedAt) : ' · дата проверки не указана')));
    content.appendChild(el('h3', null, 'Коротко'));
    content.appendChild(rows([['Депозит', b.deposit], ['Кому', b.audience], ['Срок', b.duration], ['Отыгрыш', b.wager], ['Коэффициенты', b.odds], ['Промокод', b.promoCode || 'Не требуется или не указан'], ['Период акции', b.period || b.periodText || 'В источнике не указан']]));
    if ((b.steps || []).length) { content.appendChild(el('h3', null, 'Как это устроено')); content.appendChild(list('ol', b.steps)); }
    if ((b.limits || []).length) { content.appendChild(el('h3', null, 'Ограничения')); content.appendChild(list('ul', b.limits)); }
    content.appendChild(el('h3', null, 'Источник'));
    var src = el('p');
    if (b.source && /^https:\/\//.test(b.source.url || '')) { var a = el('a', null, b.source.name || b.source.url); a.href = b.source.url; a.target = '_blank'; a.rel = 'noopener noreferrer nofollow'; src.appendChild(a); }
    else src.textContent = (b.source && b.source.name) || 'Источник не указан';
    content.appendChild(src);
    content.appendChild(el('p', 'note', '18+. Условия могут измениться после даты проверки. Максимальная сумма не гарантирована.'));
    open();
  }
  function openCompare() {
    var books = state.picked.map(byId); content.textContent = '';
    var h = el('h2', null, 'Сравнение условий'); h.id = 'lr-sheet-title'; content.appendChild(h);
    content.appendChild(el('p', 'note', 'Только факты из условий. Победителя здесь нет.'));
    var wrap = el('div', 'lr-cmp'), t = el('table'), thead = el('thead'), tr = el('tr'); tr.appendChild(el('th'));
    books.forEach(function (b) { var th = el('th', null, b.name); th.scope = 'col'; tr.appendChild(th); }); thead.appendChild(tr); t.appendChild(thead);
    var tb = el('tbody');
    [['Предложение', function (b) { return (b.amount ? (b.prefix ? b.prefix.toLowerCase() + ' ' : '') + money(b.amount) + ' · ' : '') + b.label; }], ['Депозит', function (b) { return b.deposit; }], ['Кому', function (b) { return b.audience; }],
      ['Срок', function (b) { return b.duration; }], ['Отыгрыш', function (b) { return b.wager; }], ['Коэффициенты', function (b) { return b.odds; }], ['Промокод', function (b) { return b.promoCode || 'Не указан'; }],
      ['Проверка', function (b) { return b.statusText + (b.checkedAt ? ' · ' + date(b.checkedAt) : ''); }]].forEach(function (r) {
      var row = el('tr'), th = el('th', null, r[0]); th.scope = 'row'; row.appendChild(th); books.forEach(function (b) { row.appendChild(el('td', null, r[1](b) || '—')); }); tb.appendChild(row);
    });
    t.appendChild(tb); wrap.appendChild(t); content.appendChild(wrap);
    var reset = el('button', 'lr-btn', 'Очистить сравнение'); reset.type = 'button'; reset.style.cssText = 'margin-top:18px;width:100%;background:#1B1D19;color:#F2F3EE;border:0';
    reset.addEventListener('click', function () { state.picked = []; syncPicks(); close(); }); content.appendChild(reset);
    open();
  }

  /* ---------- data ---------- */
  function load() {
    show('Загружаем каталог…', '');
    fetch(SRC, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (d) {
      if (!d || !Array.isArray(d.books)) throw new Error('В файле нет каталога');
      state.data = d; state.all = d.books.slice().sort(function (a, b) { return a.order - b.order; }); state.picked = [];
      var checked = state.all.map(function (b) { return b.checkedAt; }).filter(Boolean).sort();
      var range = !checked.length ? 'дата проверки условий не указана' : checked[0] === checked[checked.length - 1] ? 'условия проверены ' + date(checked[0]) : 'условия проверены с ' + date(checked[0]) + ' по ' + date(checked[checked.length - 1]);
      fresh.textContent = state.all.length + ' букмекеров в каталоге приложения; ' + range + '. Суммы показаны на дату проверки каждой карточки.';
      sourceLine.textContent = 'Тот же каталог, что в разделе «Рейтинг» приложения. Данные получены ' + stamp(d.generatedAt) + '.';
      root.dataset.state = 'ready'; root.dispatchEvent(new CustomEvent('lr:data', { detail: d, bubbles: true }));
      // Facts elsewhere on the page come from the same file, so they cannot drift from the cards.
      var line = 'Условия проверены ' + (checked.length ? (checked[0] === checked[checked.length - 1] ? date(checked[0]) : 'с ' + date(checked[0]) + ' по ' + date(checked[checked.length - 1])) : '— дата не указана') + '.';
      Array.prototype.forEach.call(document.querySelectorAll('[data-fact="books"]'), function (n) { n.textContent = String(state.all.length); });
      Array.prototype.forEach.call(document.querySelectorAll('[data-fact-line="checked"]'), function (n) { n.textContent = line; });
      var newest = (d.news || [])[0], matchLine = d.counts ? 'Сейчас в расписании ' + d.counts.matchesUpcoming + ' ближайших матчей' + (d.matchUpdatedAt ? '; данные от ' + stamp(d.matchUpdatedAt) : '') + '.' : '';
      var newsLine = newest ? 'Последняя новость в ленте получена ' + stamp(newest.date) + '.' : '';
      Array.prototype.forEach.call(document.querySelectorAll('[data-fact-line="matches"]'), function (n) { n.textContent = matchLine; });
      Array.prototype.forEach.call(document.querySelectorAll('[data-fact-line="news"]'), function (n) { n.textContent = newsLine; });
      Array.prototype.forEach.call(document.querySelectorAll('[data-fact-line="rating"]'), function (n) { n.textContent = 'Сейчас в нём ' + state.all.length + ' букмекеров. ' + line; });
      if (!state.all.length) { root.dataset.state = 'empty'; count.textContent = ''; show('Каталог пуст', 'В источнике сейчас нет предложений.'); return; }
      apply(null);
    }).catch(function (e) {
      root.dataset.state = 'error'; fresh.textContent = ''; count.textContent = '';
      show('Не удалось загрузить каталог', 'Проверьте соединение и попробуйте ещё раз. (' + e.message + ')', true);
    });
  }
  window.__liveRating = { state: state, go: go, reload: load };
  load();
})();
