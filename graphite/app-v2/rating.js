// Рейтинг: полноэкранная карусель букмекеров. Перенесено из landing-v2/rating/rating.js
// (карточки, жесты, фильтры, сравнение, подробности — без изменения логики).
// Отличия: данные передаёт приложение (один сетевой запрос на все разделы), поиск — общая панель с переворотом,
// лист подробностей живёт внутри колонки приложения и получает ловушку фокуса.
(function () {
  'use strict';
  var root = document.getElementById('live-rating');
  if (!root || !window.TribunaUI) return;
  var UI = window.TribunaUI, el = UI.el, reduce = UI.reduce;
  var LOGOS = root.getAttribute('data-logos') || '../logos/';
  var host = document.getElementById('app') || document.body;
  // Те же четыре фильтра, что во вкладке «Рейтинг» приложения.
  var FILTERS = [['Все', null], ['Фрибеты', 'freebet'], ['Бонусы', 'deposit'], ['Подарочные пари', 'gift']];
  var state = { all: [], list: [], index: 0, filter: null, query: '', picked: [], data: null, opened: 0 };
  var cards = [], moved = false, retry = function () {};

  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
  function date(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }
  function stamp(s) { var d = new Date(s); return isNaN(d) ? '' : d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' }) + ' МСК'; }
  function tint(hex) { var m = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 'rgba(230,255,87,.2)'; var v = parseInt(m[1], 16); return 'rgba(' + (v >> 16) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',.42)'; }
  function icon(d) { return UI.svg('0 0 24 24', [['path', { d: d }]]); }
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

  /* ---------- каркас ---------- */
  var head = el('header', 'lr-head');
  head.appendChild(el('p', 'kicker', '04 / Рейтинг · 18+'));
  var title = el('h1', 'lr-title'); title.id = 'lr-title'; title.tabIndex = -1;
  title.appendChild(document.createTextNode('Сравнить, а потом ')); title.appendChild(el('em', null, 'выбрать.')); head.appendChild(title);
  head.appendChild(el('p', 'lr-honest', 'Трибуна не принимает ставки. Порядок редакции — не оценка надёжности.'));
  var tools = el('div', 'lr-tools'); tools.hidden = true;
  var searchHost = el('div'); tools.appendChild(searchHost);
  var search = UI.makeSearch(searchHost, { id: 'lr-search', placeholder: 'Найти букмекера', label: 'Поиск букмекера', hint: 'Найти букмекера',
    onInput: function (v) { state.query = v; apply(v ? null : current()); } });
  var chips = el('div', 'lr-chips'); chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Тип предложения'); tools.appendChild(chips);
  var count = el('p', 'lr-count'); count.setAttribute('aria-live', 'polite'); tools.appendChild(count);
  var stage = el('div', 'lr-stage'); stage.tabIndex = 0; stage.setAttribute('role', 'group'); stage.setAttribute('aria-roledescription', 'карусель'); stage.setAttribute('aria-label', 'Букмекеры. Листайте стрелками влево и вправо');
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
  var fresh = el('p'); foot.appendChild(fresh);
  foot.appendChild(el('p', null, '18+. «Трибуна» не принимает ставки. Участие в азартных играх может вызвать игровую зависимость. Условия могут меняться; максимальная сумма не означает гарантированную выплату.'));
  var sourceLine = el('p'); foot.appendChild(sourceLine);
  root.classList.add('lr'); root.setAttribute('aria-labelledby', 'lr-title');
  [head, tools, stage, dock, dots, compare, foot].forEach(function (n) { root.appendChild(n); });

  function show(kind, text, canRetry) {
    cards.forEach(function (c) { c.remove(); }); cards = [];
    message.hidden = false; message.textContent = '';
    message.appendChild(el('b', null, kind)); if (text) message.appendChild(el('span', null, text));
    if (canRetry) { var b = el('button', 'lr-btn main', 'Повторить'); b.type = 'button'; b.style.flex = 'none'; b.style.padding = '0 22px'; b.addEventListener('click', function () { retry(); }); message.appendChild(b); }
    dock.hidden = dots.hidden = true;
  }

  /* ---------- карточки ---------- */
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

  /* ---------- жесты и клавиши ---------- */
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
  // Перетаскивание не должно заканчиваться нажатием на «Подробности», «+» или боковую карточку.
  stage.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  // Трекпад: горизонтальный жест двумя пальцами листает одну карточку; вертикальная прокрутка остаётся экрану.
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

  /* ---------- поиск, фильтры ---------- */
  function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е').replace(/[\s\-_.]/g, ''); }
  function apply(keep) {
    var q = norm(state.query);
    state.list = state.all.filter(function (b) { return (!state.filter || b.type === state.filter) && (!q || norm(b.name).indexOf(q) >= 0 || norm(b.id).indexOf(q) >= 0); });
    var at = keep ? state.list.map(function (b) { return b.id; }).indexOf(keep) : -1; state.index = at >= 0 ? at : 0;
    count.textContent = 'Показано ' + state.list.length + ' из ' + state.all.length;
    build();
  }
  function current() { var b = state.list[state.index]; return b ? b.id : null; }
  FILTERS.forEach(function (f) {
    var c = el('button', 'lr-chip', f[0]); c.type = 'button'; c.setAttribute('aria-pressed', f[1] === null ? 'true' : 'false');
    c.addEventListener('click', function () { state.filter = f[1]; Array.prototype.forEach.call(chips.children, function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); }); apply(current()); });
    chips.appendChild(c);
  });

  /* ---------- сравнение ---------- */
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

  /* ---------- лист ---------- */
  var sheet = el('div', 'lr-sheet'); sheet.hidden = true; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'lr-sheet-title');
  var back = el('div', 'lr-sheet-back'), body = el('div', 'lr-sheet-body'), x = el('button', 'lr-sheet-x', '×'), content = el('div'), lastFocus = null;
  x.type = 'button'; x.setAttribute('aria-label', 'Закрыть'); body.appendChild(x); body.appendChild(content); sheet.appendChild(back); sheet.appendChild(body); host.appendChild(sheet);
  function open() { lastFocus = document.activeElement; sheet.hidden = false; state.opened++; body.scrollTop = 0; x.focus(); }
  function close() { if (sheet.hidden) return; sheet.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  back.addEventListener('click', close); x.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (sheet.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    var f = sheet.querySelectorAll('button, a[href]'); if (!f.length) return;
    var first = f[0], lastEl = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  });
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
    wrap.tabIndex = 0; wrap.setAttribute('role', 'region'); wrap.setAttribute('aria-label', 'Таблица сравнения, прокручивается вбок');
    books.forEach(function (b) { var th = el('th', null, b.name); th.scope = 'col'; tr.appendChild(th); }); thead.appendChild(tr); t.appendChild(thead);
    var tb = el('tbody');
    [['Предложение', function (b) { return (b.amount ? (b.prefix ? b.prefix.toLowerCase() + ' ' : '') + money(b.amount) + ' · ' : '') + b.label; }], ['Депозит', function (b) { return b.deposit; }], ['Кому', function (b) { return b.audience; }],
      ['Срок', function (b) { return b.duration; }], ['Отыгрыш', function (b) { return b.wager; }], ['Коэффициенты', function (b) { return b.odds; }], ['Промокод', function (b) { return b.promoCode || 'Не указан'; }],
      ['Проверка', function (b) { return b.statusText + (b.checkedAt ? ' · ' + date(b.checkedAt) : ''); }]].forEach(function (r) {
      var row = el('tr'), th = el('th', null, r[0]); th.scope = 'row'; row.appendChild(th); books.forEach(function (b) { row.appendChild(el('td', null, r[1](b) || '—')); }); tb.appendChild(row);
    });
    t.appendChild(tb); wrap.appendChild(t); content.appendChild(wrap);
    var reset = el('button', 'lr-btn lr-reset', 'Очистить сравнение'); reset.type = 'button';
    reset.addEventListener('click', function () { state.picked = []; syncPicks(); close(); }); content.appendChild(reset);
    open();
  }

  /* ---------- данные приходят от приложения ---------- */
  function loading() { root.dataset.state = 'loading'; tools.hidden = true; show('Загружаем каталог…', ''); }
  function fail(text, again) {
    retry = again || retry; root.dataset.state = 'error'; tools.hidden = true; fresh.textContent = ''; sourceLine.textContent = ''; count.textContent = '';
    show('Не удалось загрузить каталог', 'Проверьте соединение и попробуйте ещё раз. (' + text + ')', true);
  }
  function setData(d) {
    state.data = d; state.all = d.books.slice().sort(function (a, b) { return a.order - b.order; }); state.picked = []; state.filter = null; state.query = '';
    Array.prototype.forEach.call(chips.children, function (c, i) { c.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); });
    var checked = state.all.map(function (b) { return b.checkedAt; }).filter(Boolean).sort();
    var range = !checked.length ? 'дата проверки условий не указана' : checked[0] === checked[checked.length - 1] ? 'условия проверены ' + date(checked[0]) : 'условия проверены с ' + date(checked[0]) + ' по ' + date(checked[checked.length - 1]);
    fresh.textContent = state.all.length + ' букмекеров в каталоге приложения; ' + range + '. Суммы показаны на дату проверки каждой карточки.';
    sourceLine.textContent = 'Тот же каталог, что в разделе «Рейтинг» приложения. Данные получены ' + stamp(d.generatedAt) + '.';
    if (!state.all.length) { root.dataset.state = 'empty'; tools.hidden = true; count.textContent = ''; show('Каталог пуст', 'В источнике сейчас нет предложений.'); return; }
    root.dataset.state = 'ready'; tools.hidden = false; search.redraw();
    apply(null);
  }
  function closeAll() { close(); }
  window.TribunaRating = { state: state, go: go, loading: loading, fail: fail, setData: setData, relayout: function () { search.redraw(); layout(0); }, closeSheet: closeAll, search: search, title: title };
  loading();
})();
