(function () {
  'use strict';
  var DATA = window.TRIBUNA_RATING;
  var ALL = DATA.books.slice().sort(function (a, b) { return a.order - b.order; });
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  // One script, two looks: the page may set window.RATING_VARIANT before loading it.
  var V = Object.assign({ step: 0.62, near: 1.08, far: 0.56, depth: 170, depthFar: 120, rot: 40, fade: 0.46, dim: 0.16, mono: false }, window.RATING_VARIANT || {});

  var FILTERS = [
    { id: 'all', label: 'Все', test: function () { return true; } },
    { id: 'freebet', label: 'Фрибеты', test: function (b) { return b.type === 'freebet' && b.amount; } },
    { id: 'nodeposit', label: 'Без депозита', test: function (b) { return /^без депозита/i.test(b.depositText || ''); } },
    { id: 'other', label: 'Другие бонусы', test: function (b) { return b.type === 'gift' || b.type === 'deposit'; } },
    { id: 'none', label: 'Не подтверждено', test: function (b) { return !b.amount; } }
  ];
  var STATUS = {
    verified: 'Условия сверены с официальным источником на дату проверки',
    details_checked: 'Сверены основные условия; часть деталей в источнике не указана',
    conflict: 'В официальных источниках условия расходятся',
    blocked: 'Официальный источник недоступен, сумма не подтверждена',
    none: 'Приветственного фрибета в открытых условиях не найдено'
  };

  var state = { filter: 'all', query: '', list: ALL, index: 0, picked: [] };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
  function date(s) { if (!s) return ''; var p = s.split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }
  function age(s) {
    var days = Math.floor((Date.now() - new Date(s + 'T00:00:00').getTime()) / 864e5);
    return days <= 0 ? 'сегодня' : days + ' дн. назад';
  }
  function tint(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m || m[1].toLowerCase() === '1b1d19') return 'rgba(230,255,87,.20)';
    var v = parseInt(m[1], 16);
    return 'rgba(' + (v >> 16) + ',' + ((v >> 8) & 255) + ',' + (v & 255) + ',.42)';
  }
  function kindLabel(b) {
    if (!b.amount) return b.type === 'none' ? 'Фрибета нет' : 'Не подтверждено';
    return b.label;
  }
  function sumNode(b, cls) {
    var p = el('p', cls);
    if (b.amount) {
      if (b.prefix) p.appendChild(el('small', null, b.prefix.toLowerCase()));
      p.appendChild(document.createTextNode(money(b.amount)));
    } else {
      p.classList.add('word');
      p.textContent = b.type === 'none' ? 'Приветственного фрибета нет' : 'Сумма не подтверждена';
    }
    return p;
  }
  function plate(b) {
    var d = el('div', 'plate');
    if (b.logo) {
      var img = el('img'); img.src = 'logos/' + b.logo; img.alt = b.name; img.draggable = false; d.appendChild(img);
    } else { d.classList.add('text'); d.textContent = b.name; }
    return d;
  }

  /* ---------- cards ---------- */
  var track = $('track'), stage = $('stage'), cards = [];

  function build() {
    track.textContent = '';
    cards = state.list.map(function (b, i) {
      var c = el('article', 'card');
      c.style.setProperty('--tint', tint(b.color));
      c.style.setProperty('--brand', /^#[0-9a-f]{6}$/i.test(b.color || '') ? b.color : '#1b1d19');
      c.setAttribute('aria-label', b.name + '. ' + (b.amount ? (b.prefix ? b.prefix + ' ' : '') + money(b.amount) + ', ' + b.label : kindLabel(b)));
      var row = el('div', 'row'); row.appendChild(plate(b));
      row.appendChild(el('span', 'num', String(b.order).padStart(2, '0') + ' / ' + String(ALL.length).padStart(2, '0')));
      c.appendChild(row);
      c.appendChild(el('p', 'tag', b.tag));
      var offer = el('div', 'offer');
      var k = el('span', 'kind', kindLabel(b));
      if (!b.amount) k.classList.add('none'); else if (b.status === 'conflict') k.classList.add('warn');
      offer.appendChild(k);
      offer.appendChild(sumNode(b, 'sum'));
      if (b.amount) offer.appendChild(el('p', 'what', b.depositText || ''));
      offer.appendChild(el('p', 'head', b.headline || b.summary));
      offer.appendChild(el('p', 'checked', b.checkedAt ? 'Проверено ' + date(b.checkedAt) : 'Не проверено'));
      c.appendChild(offer);
      var acts = el('div', 'acts');
      var more = el('button', 'btn main', 'Условия'); more.type = 'button';
      more.addEventListener('click', function (e) { e.stopPropagation(); openTerms(b); });
      var pick = el('button', 'btn pick'); pick.type = 'button'; pick.dataset.id = b.id;
      pick.addEventListener('click', function (e) { e.stopPropagation(); toggle(b.id); });
      acts.appendChild(more); acts.appendChild(pick);
      c.appendChild(acts);
      c.addEventListener('click', function () { if (!moved && i !== state.index) go(i); });
      track.appendChild(c);
      return c;
    });
    var dots = $('dots'); dots.textContent = '';
    state.list.forEach(function () { dots.appendChild(el('i')); });
    $('empty').hidden = state.list.length > 0;
    syncPicks();
    layout(0);
  }

  function layout(drag) {
    var w = cards[0] ? cards[0].offsetWidth : 300;
    var step = w * V.step, pos = state.index - drag / step;
    cards.forEach(function (c, i) {
      var d = i - pos, a = Math.abs(d), s = d < 0 ? -1 : 1;
      if (a > 3.2) { c.style.visibility = 'hidden'; return; }
      c.style.visibility = '';
      var near = Math.min(a, 1);
      var x = s * (near * step * V.near + Math.max(0, a - 1) * step * V.far);
      var z = -near * V.depth - Math.max(0, a - 1) * V.depthFar;
      var rot = reduce.matches ? 0 : -s * near * V.rot;
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + rot.toFixed(1) + 'deg)';
      c.style.opacity = String(Math.max(0, 1 - Math.max(0, a - 0.35) * V.fade));
      c.style.zIndex = String(100 - Math.round(a * 10));
      c.style.filter = V.mono ? 'grayscale(' + Math.min(1, a * 1.6).toFixed(2) + ') brightness(' + (1 - Math.min(a, 2) * V.dim).toFixed(2) + ')'
        : a > 0.5 ? 'brightness(' + (1 - Math.min(a, 2) * V.dim).toFixed(2) + ')' : '';
      var cur = i === state.index;
      c.setAttribute('aria-current', cur ? 'true' : 'false');
      c.setAttribute('aria-hidden', cur ? 'false' : 'true');
      Array.prototype.forEach.call(c.querySelectorAll('button'), function (b) { b.tabIndex = cur ? 0 : -1; });
    });
    var b = state.list[state.index];
    document.body.style.setProperty('--active', b && /^#[0-9a-f]{6}$/i.test(b.color || '') ? b.color : '#1b1d19');
    $('nowName').textContent = b ? b.name : '—';
    $('nowPos').textContent = b ? (state.index + 1) + ' ИЗ ' + state.list.length : '';
    $('prev').disabled = state.index <= 0;
    $('next').disabled = state.index >= state.list.length - 1;
    Array.prototype.forEach.call($('dots').children, function (d, i) { d.className = i === state.index ? 'on' : ''; });
  }

  function go(i) {
    state.index = Math.max(0, Math.min(state.list.length - 1, i));
    layout(0);
  }

  /* ---------- gestures ---------- */
  var startX = 0, startY = 0, dx = 0, active = false, locked = null, moved = false, lastX = 0, lastT = 0, vel = 0;
  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    active = true; locked = null; moved = false; dx = 0; vel = 0;
    startX = lastX = e.clientX; startY = e.clientY; lastT = e.timeStamp;
  });
  window.addEventListener('pointermove', function (e) {
    if (!active) return;
    var mx = e.clientX - startX, my = e.clientY - startY;
    if (locked === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
    if (locked !== 'x') return;
    moved = true; stage.classList.add('dragging');
    var edge = (state.index === 0 && mx > 0) || (state.index === state.list.length - 1 && mx < 0);
    dx = edge ? mx * 0.3 : mx;
    var dt = e.timeStamp - lastT; if (dt > 0) vel = (e.clientX - lastX) / dt;
    lastX = e.clientX; lastT = e.timeStamp;
    layout(dx);
  });
  function end() {
    if (!active) return; active = false;
    stage.classList.remove('dragging');
    if (locked === 'x') {
      var w = cards[0] ? cards[0].offsetWidth * V.step : 190;
      var n = Math.round(-dx / w);
      if (n === 0 && Math.abs(vel) > 0.45) n = vel < 0 ? 1 : -1;
      go(state.index + n);
    }
    setTimeout(function () { moved = false; }, 0);
  }
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  stage.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 24) return;
    e.preventDefault();
    if (stage.dataset.wheel) return;
    stage.dataset.wheel = '1'; setTimeout(function () { delete stage.dataset.wheel; }, 320);
    go(state.index + (e.deltaX > 0 ? 1 : -1));
  }, { passive: false });
  stage.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
    if (e.key === 'ArrowRight') { go(state.index + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { go(state.index - 1); e.preventDefault(); }
    else if (e.key === 'Home') { go(0); e.preventDefault(); }
    else if (e.key === 'End') { go(state.list.length - 1); e.preventDefault(); }
    else if (e.key === 'Enter' && e.target === stage && state.list[state.index]) openTerms(state.list[state.index]);
  });
  $('prev').addEventListener('click', function () { go(state.index - 1); });
  $('next').addEventListener('click', function () { go(state.index + 1); });
  window.addEventListener('resize', function () { layout(0); });
  if (reduce.addEventListener) reduce.addEventListener('change', function () { layout(0); });

  /* ---------- search and filters ---------- */
  function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е').replace(/[\s\-_.]/g, ''); }
  function apply(keepId) {
    var f = FILTERS.filter(function (x) { return x.id === state.filter; })[0];
    var q = norm(state.query);
    state.list = ALL.filter(function (b) {
      return f.test(b) && (!q || norm(b.name).indexOf(q) >= 0 || norm(b.domain).indexOf(q) >= 0 || norm(b.id).indexOf(q) >= 0);
    });
    var at = keepId ? state.list.map(function (b) { return b.id; }).indexOf(keepId) : -1;
    state.index = at >= 0 ? at : 0;
    $('count').textContent = state.list.length === ALL.length
      ? ALL.length + ' букмекеров · срез на ' + date(DATA.meta.preparedAt) + ', сегодня не перепроверялся'
      : 'Показано ' + state.list.length + ' из ' + ALL.length + ' · срез на ' + date(DATA.meta.preparedAt);
    build();
  }
  var chips = $('chips');
  FILTERS.forEach(function (f) {
    var c = el('button', 'chip', f.label + ' · ' + ALL.filter(f.test).length);
    c.type = 'button'; c.setAttribute('role', 'tab'); c.dataset.id = f.id;
    c.setAttribute('aria-selected', f.id === state.filter ? 'true' : 'false');
    c.addEventListener('click', function () {
      state.filter = f.id;
      Array.prototype.forEach.call(chips.children, function (x) { x.setAttribute('aria-selected', x === c ? 'true' : 'false'); });
      apply(current());
    });
    chips.appendChild(c);
  });
  function current() { var b = state.list[state.index]; return b ? b.id : null; }
  $('q').addEventListener('input', function () {
    state.query = this.value; $('clear').hidden = !this.value; apply(this.value ? null : current());
  });
  $('q').addEventListener('keydown', function (e) { if (e.key === 'Enter') this.blur(); });
  $('clear').addEventListener('click', function () { $('q').value = ''; state.query = ''; this.hidden = true; apply(null); $('q').focus(); });

  /* ---------- compare ---------- */
  function toggle(id) {
    var at = state.picked.indexOf(id);
    if (at >= 0) state.picked.splice(at, 1);
    else if (state.picked.length < 3) state.picked.push(id);
    syncPicks();
  }
  function syncPicks() {
    var full = state.picked.length >= 3;
    Array.prototype.forEach.call(document.querySelectorAll('.btn.pick'), function (b) {
      var on = state.picked.indexOf(b.dataset.id) >= 0;
      var name = ALL.filter(function (x) { return x.id === b.dataset.id; })[0].name;
      b.textContent = on ? '✓' : '+';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', (on ? 'Убрать из сравнения: ' : 'Сравнить ') + name);
      b.disabled = !on && full;
    });
    var n = state.picked.length;
    $('compare').hidden = n === 0;
    document.body.classList.toggle('has-compare', n > 0);
    $('compareText').textContent = n === 1 ? 'Выбран 1. Добавьте ещё одного' : 'Выбрано ' + n + ' из 3';
    $('compareOpen').disabled = n < 2;
  }
  $('compareOpen').addEventListener('click', openCompare);

  /* ---------- sheets ---------- */
  var sheet = $('sheet'), content = $('sheetContent'), lastFocus = null;
  function show() {
    lastFocus = document.activeElement;
    sheet.hidden = false; document.body.style.overflow = 'hidden';
    sheet.querySelector('.sheet-body').scrollTop = 0;
    sheet.querySelector('.sheet-x').focus();
  }
  function hide() {
    sheet.hidden = true; document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  sheet.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) hide(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) hide(); });

  function rows(pairs) {
    var dl = el('dl');
    pairs.forEach(function (p) {
      if (!p[1]) return;
      var d = el('div'); d.appendChild(el('dt', null, p[0])); d.appendChild(el('dd', null, p[1])); dl.appendChild(d);
    });
    return dl;
  }
  function list(tag, items) {
    var l = el(tag); (items || []).forEach(function (t) { l.appendChild(el('li', null, t)); }); return l;
  }
  function period(b) {
    if (b.periodText) return b.periodText;
    if (b.validFrom || b.validUntil) return (b.validFrom ? 'с ' + date(b.validFrom) + ' ' : '') + (b.validUntil ? 'до ' + date(b.validUntil) : '');
    return 'В источнике не указан';
  }
  function openTerms(b) {
    content.textContent = '';
    content.appendChild(plate(b));
    var h = el('h2', null, b.name); h.id = 'sheetTitle'; content.appendChild(h);
    content.appendChild(el('p', 'note', b.tag));
    content.appendChild(sumNode(b, 'big'));
    if (b.amount) content.appendChild(el('p', null, b.label + (b.depositText ? ' · ' + b.depositText : '')));
    content.appendChild(el('p', null, b.summary));
    var st = el('p', b.status === 'verified' ? 'note' : 'warnbox', STATUS[b.status] || '');
    content.appendChild(st);
    content.appendChild(el('p', 'warnbox', b.checkedAt
      ? 'Архивная запись: проверено ' + date(b.checkedAt) + ' (' + age(b.checkedAt) + '). После этой даты условия не перепроверялись и могли измениться.'
      : 'Дата проверки не записана: официальный источник открыть не удалось. Условия не подтверждены.'));

    content.appendChild(el('h3', null, 'Коротко'));
    content.appendChild(rows([
      ['Кому', b.audience], ['Срок', b.duration], ['Отыгрыш', b.wager], ['Коэффициенты', b.odds],
      ['Промокод', b.promoCode || 'Не требуется или не указан'], ['Период акции', period(b)]
    ]));
    if ((b.steps || []).length) { content.appendChild(el('h3', null, 'Как это устроено')); content.appendChild(list('ol', b.steps)); }
    if ((b.limits || []).length) { content.appendChild(el('h3', null, 'Ограничения')); content.appendChild(list('ul', b.limits)); }

    content.appendChild(el('h3', null, 'Кто принимает ставки'));
    content.appendChild(rows([
      ['Оператор', b.operator], ['Лицензия', b.license], ['Сайт', b.domain],
      ['ЕДИНЫЙ ЦУПИС', b.cupis ? 'Есть в реестре партнёров' : 'В реестре партнёров не найден']
    ]));

    content.appendChild(el('h3', null, 'Источник'));
    var src = el('p');
    if (b.sourceUrl) {
      var a = el('a', null, b.sourceName || b.sourceUrl); a.href = b.sourceUrl; a.target = '_blank'; a.rel = 'noopener noreferrer nofollow';
      src.appendChild(a);
    } else src.textContent = b.sourceName || 'Официальный источник не найден';
    content.appendChild(src);
    if (b.checkedAt) content.appendChild(el('p', 'note', 'Проверено ' + date(b.checkedAt) + '.'));
    if (b.sourceNote) content.appendChild(el('p', 'note', b.sourceNote));
    content.appendChild(el('p', 'note', '18+. Условия могут измениться после даты проверки. Максимальная сумма не гарантирована.'));
    show();
  }
  function openCompare() {
    var books = state.picked.map(function (id) { return ALL.filter(function (b) { return b.id === id; })[0]; });
    content.textContent = '';
    var h = el('h2', null, 'Сравнение'); h.id = 'sheetTitle'; content.appendChild(h);
    content.appendChild(el('p', 'note', 'Только факты из официальных условий. Победителя здесь нет.'));
    var wrap = el('div', 'cmp'), t = el('table'), thead = el('thead'), tr = el('tr');
    tr.appendChild(el('th'));
    books.forEach(function (b) { var th = el('th', null, b.name); th.scope = 'col'; tr.appendChild(th); });
    thead.appendChild(tr); t.appendChild(thead);
    var body = el('tbody');
    [
      ['Предложение', function (b) { return b.amount ? (b.prefix ? b.prefix.toLowerCase() + ' ' : '') + money(b.amount) + ' · ' + b.label : kindLabel(b); }],
      ['Депозит', function (b) { return b.depositText; }],
      ['Кому', function (b) { return b.audience; }],
      ['Срок', function (b) { return b.duration; }],
      ['Отыгрыш', function (b) { return b.wager; }],
      ['Коэффициенты', function (b) { return b.odds; }],
      ['Промокод', function (b) { return b.promoCode || 'Не указан'; }],
      ['Период', period],
      ['Проверка', function (b) { return STATUS[b.status] + (b.checkedAt ? ' · ' + date(b.checkedAt) : ''); }]
    ].forEach(function (r) {
      var row = el('tr'), th = el('th', null, r[0]); th.scope = 'row'; row.appendChild(th);
      books.forEach(function (b) { row.appendChild(el('td', null, r[1](b) || '—')); });
      body.appendChild(row);
    });
    t.appendChild(body); wrap.appendChild(t); content.appendChild(wrap);
    var clear = el('button', 'btn', 'Очистить сравнение'); clear.type = 'button';
    clear.style.cssText = 'margin-top:18px;width:100%;background:#1B1D19;color:#F2F3EE;border:0';
    clear.addEventListener('click', function () { state.picked = []; syncPicks(); hide(); });
    content.appendChild(clear);
    show();
  }

  $('meta').textContent = 'Данные подготовлены ' + date(DATA.meta.preparedAt) + ' по официальным страницам букмекеров; реестр партнёров ЕДИНОГО ЦУПИС сверен ' + date(DATA.meta.registryCheckedAt) + '.';
  $('fresh').textContent = 'Условия проверены ' + date(DATA.meta.preparedAt) + ' (' + age(DATA.meta.preparedAt) + ') и с тех пор не перепроверялись. Это архивный срез, а не сегодняшние предложения: перед решением сверяйтесь с официальным сайтом букмекера.';
  apply(null);
  window.__rating = { state: state, go: go, toggle: toggle, openTerms: openTerms };
})();
