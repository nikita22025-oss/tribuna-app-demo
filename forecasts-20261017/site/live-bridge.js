/* Мост между бэкендом Трибуны и фронтом v6.
   Подключается ПОСЛЕ data-файлов и ДО модулей рендера.

   Что делает:
   1) подменяет демонстрационные материалы живой лентой из window.__INITIAL__
      (данные приходят из нашего Go-бэкенда, который парсит RSS);
   2) учит фронт понимать абсолютные адреса картинок новостей (наши лежат на /uploads/news/...,
      а не в assets/);
   3) добавляет рекламный слайд в разворот «В сектор трибуны».

   Массивы материалов объявлены через const, но их СОДЕРЖИМОЕ мутабельно —
   поэтому подмена не требует правок больших data-файлов. */

/* ---------- Адреса страниц ----------
   Раньше переходы шли через решётку (#/article/…): поисковики и роботы модерации
   такие ссылки не индексируют. Теперь адреса настоящие: /v2/article/…

   Базовый путь приходит из данных, поэтому переезд на основной домен —
   это смена одной строки в генераторе ("/" → "/"). */
var ROUTE_BASE = (window.__INITIAL__ && window.__INITIAL__.base) || '/';

/* Адрес страницы → внутренний маршрут приложения. */
function routePath() {
  var path;
  try { path = decodeURIComponent(location.pathname || '/'); } catch (e) { return '/404'; }
  if (ROUTE_BASE !== '/' && path.indexOf(ROUTE_BASE) === 0) {
    path = '/' + path.slice(ROUTE_BASE.length);
  }
  path = path.replace(/\/{2,}/g, '/').replace(/(.)\/$/, '$1');
  return path || '/';
}

/* Внутренний маршрут → полный адрес. */
function routeHref(route) {
  var r = String(route || '/');
  if (r.charAt(0) !== '/') r = '/' + r;
  return ROUTE_BASE.replace(/\/$/, '') + r;
}

/* Переход без перезагрузки страницы. */
function navigateTo(route) {
  history.pushState({}, '', routeHref(route));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/* Абсолютный адрес (http… или /…) отдаём как есть, короткое имя — из assets/. */
function assetUrl(value) {
  var v = String(value || '');
  if (!v) return '';
  return /^(https?:)?\/\//.test(v) || v.charAt(0) === '/' ? v : 'assets/' + v;
}

/* Рекламный слайд внутри разворота — пятое рекламное место.
   Креатив приходит из нашей базы (erid, ссылка, картинка); пока место зарезервировано. */
function specialAdSlide(slide) {
  var ad = (slide && slide.creative) || null;
  if (ad && ad.offer && ad.offer.kind === 'winline-welcome') return winlineOfferSlide(ad);
  var body = ad
    ? '<a class="special-artwork" href="' + ad.click_url + '" target="_blank" rel="noopener noreferrer sponsored">' +
        '<img src="' + assetUrl(ad.url) + '" alt="' + (ad.advertiser_name || '') + '" loading="lazy">' +
      '</a>'
    : '<div class="special-artwork special-ad-empty" aria-hidden="true"></div>';

  return '<article class="special-article special-article-ad" data-ad-slot="special">' +
      body +
      '<div class="special-copy">' +
        '<span class="special-label">' + (ad ? 'Реклама · 18+' : 'Рекламное место') + '</span>' +
        '<h2>' + (ad ? (ad.advertiser_name || 'Партнёр выпуска') : 'Ваш бренд<br>в секторе трибуны.') + '</h2>' +
        '<p>' + (ad ? 'Партнёр выпуска.' : 'Место для партнёра рядом с теми, кто живёт спортом.') + '</p>' +
        (ad && ad.erid ? '<p class="special-erid">ERID: ' + ad.erid + '</p>' : '') +
        '<a class="special-read" href="' + (ad ? ad.click_url : '#/advertising') + '"' +
          (ad ? ' target="_blank" rel="noopener noreferrer sponsored"' : '') + '>' +
          (ad ? 'Перейти' : 'Занять место') + ' <span aria-hidden="true">↗</span></a>' +
      '</div>' +
    '</article>';
}

/* Условия взяты из действующих правил Winline; контент хранится с креативом. */
function winlineOfferSlide(ad) {
  var offer = ad.offer;
  var marks = Array.from({length: 10}, function (_, i) {
    return '<i style="--step:' + i + '"></i>';
  }).join('');
  var steps = offer.steps.map(function (step) { return '<li>' + liveEsc(step) + '</li>'; }).join('');
  return '<article class="special-article special-article-ad winline-offer" data-ad-slot="special">' +
    '<a class="special-artwork winline-offer-art" href="' + liveEsc(ad.click_url) + '" target="_blank" rel="nofollow sponsored noopener noreferrer">' +
      '<img src="' + liveEsc(assetUrl(ad.url)) + '" alt="' + liveEsc(ad.advertiser_name) + ': ' + liveEsc(offer.headline) + '" width="' + ad.width + '" height="' + ad.height + '" loading="lazy">' +
    '</a>' +
    '<div class="special-copy winline-offer-copy">' +
      '<div class="winline-offer-meta"><span>' + liveEsc(offer.audience) + '</span><span>Реклама · 18+</span></div>' +
      '<h2 class="winline-offer-title"><span>Фрибеты до</span><strong>10 000</strong></h2>' +
      '<div class="winline-offer-scale" aria-hidden="true">' + marks + '</div>' +
      '<p class="winline-offer-caption">' + liveEsc(offer.mechanic) + '</p>' +
      '<ol class="winline-offer-steps">' + steps + '</ol>' +
      '<details class="winline-offer-details"><summary>Условия фрибета</summary><div class="winline-offer-terms"><p>' + liveEsc(offer.conditions) + '</p>' +
        '<a href="' + liveEsc(offer.rules_url) + '" target="_blank" rel="noopener noreferrer">Полные правила Winline ↗</a></div></details>' +
      '<a class="winline-offer-cta" href="' + liveEsc(ad.click_url) + '" target="_blank" rel="nofollow sponsored noopener noreferrer">' + liveEsc(offer.cta) + '<span aria-hidden="true">↗</span></a>' +
      '<div class="winline-offer-footer"><span>По условиям акции Winline</span><span>ERID: ' + liveEsc(ad.erid) + '</span></div>' +
    '</div></article>';
}

/* Подмена демо-данных живой лентой. */
(function applyLiveData() {
  var I = window.__INITIAL__;
  if (!I) return;

  function swap(target, source) {
    if (!Array.isArray(target) || !Array.isArray(source) || !source.length) return false;
    target.length = 0;
    for (var i = 0; i < source.length; i++) target.push(source[i]);
    return true;
  }

  var ok = [];
  if (typeof articles !== 'undefined' && swap(articles, I.articles)) ok.push('articles:' + articles.length);
  if (typeof editorialSequence !== 'undefined' && swap(editorialSequence, I.editorialSequence)) ok.push('sequence:' + editorialSequence.length);
  if (typeof specialStories !== 'undefined' && swap(specialStories, I.specialStories)) ok.push('special:' + specialStories.length);
  if (typeof matches !== 'undefined' && swap(matches, I.matches)) ok.push('matches:' + matches.length);

  if (window.console && ok.length) console.info('[Трибуна] живые данные:', ok.join(' · '), '| обновлено:', I.updatedAt || '—');
})();

/* Закреплённые материалы сохраняются и после выхода из свежей RSS-выборки. */
(window.TRIBUNA_PINNED || []).forEach(function (story) {
  var index = articles.findIndex(function (a) { return a.id === story.id; });
  if (index >= 0) articles[index] = story; else articles.push(story);
});

/* Лимит карточек матч-центра на главной (полное расписание — на отдельной странице). */
var matchesLimit = 4;

/* Ближайшие первыми. */
function matchKickoff(m) {
  return String((m && m.date) || '') + ' ' + String((m && m.time) || '');
}

/* Отбор матчей для витрины.

   Без фильтра лента должна показывать РАЗНЫЕ виды спорта, а не четыре футбольных
   подряд — иначе при живом API главная забьётся одной лигой. Поэтому берём
   по одному ближайшему матчу на вид спорта по кругу, пока не наберём лимит.

   Когда включён фильтр по виду спорта, список уже состоит из одного вида —
   тот же обход честно отдаёт просто ближайшие матчи этого вида. */
function pickMatches(list, limit) {
  if (!Array.isArray(list)) return [];
  var sorted = list.slice().sort(function (a, b) {
    return matchKickoff(a).localeCompare(matchKickoff(b));
  });
  if (!isFinite(limit) || limit >= sorted.length) return sorted;

  var bySport = {}, order = [];
  sorted.forEach(function (m) {
    var s = (m && m.sport) || '—';
    if (!bySport[s]) { bySport[s] = []; order.push(s); }
    bySport[s].push(m);
  });

  var out = [], round = 0;
  while (out.length < limit) {
    var added = false;
    for (var k = 0; k < order.length && out.length < limit; k++) {
      var m = bySport[order[k]][round];
      if (m) { out.push(m); added = true; }
    }
    if (!added) break;
    round++;
  }
  return out.sort(function (a, b) {
    return matchKickoff(a).localeCompare(matchKickoff(b));
  });
}

/* ---------- Рекламные креативы ----------
   Разметка живёт здесь, а не в live-ads.js, по важной причине: app.js
   заканчивается прямым вызовом render(), то есть рисует страницу сразу при
   загрузке. Всё, что подключается после него, к первой отрисовке опаздывает —
   именно поэтому боковая и нативная реклама раньше не показывались.
   Этот файл грузится до модулей отрисовки, поэтому функции готовы вовремя. */

var LIVE_ADS = (window.__INITIAL__ && window.__INITIAL__.ads) || {};
var liveNativeQueue = 0;

function liveEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Картинка или зацикленное видео без звука. */
function liveAdMedia(c, cls) {
  if (!c || !c.url) return '';
  var attrs = 'class="' + cls + '" loading="lazy" width="' + (c.width || '') + '" height="' + (c.height || '') + '"';
  if (c.file_kind === 'video') {
    return '<video ' + attrs + ' src="' + liveEsc(c.url) + '"' +
      (c.poster ? ' poster="' + liveEsc(c.poster) + '"' : '') + ' autoplay muted loop playsinline></video>';
  }
  return '<img ' + attrs + ' src="' + liveEsc(c.url) + '" alt="' + liveEsc(c.advertiser_name || 'Реклама') + '">';
}

/* Обязательная маркировка: «Реклама · 18+», рекламодатель и ERID. */
function liveAdMark(c) {
  return '<span class="ad-mark">РЕКЛАМА' + (c.is_18plus ? ' · 18+' : '') + '</span>' +
    '<span class="ad-advertiser">' + liveEsc(c.advertiser_name || '') + '</span>' +
    (c.erid ? '<span class="ad-erid">ERID: ' + liveEsc(c.erid) + '</span>' : '');
}

function liveAdLegal(c) {
  return c.legal ? '<p class="ad-legal">' + liveEsc(c.legal) + '</p>' : '';
}

function liveAdLink(c, inner, cls) {
  return '<a class="' + cls + '" href="' + liveEsc(c.click_url || '#') + '"' +
    ' target="_blank" rel="nofollow sponsored noopener noreferrer">' + inner + '</a>';
}

/* Бегущая строка для верхнего баннера. */
function liveTickerAd(c) {
  var t = c.ticker || {};
  var items = (t.items && t.items.length) ? t.items : [c.advertiser_name || ''];
  var logo = t.logo ? '<img class="ad-ticker-logo" src="' + liveEsc(t.logo) + '" alt="' + liveEsc(c.advertiser_name || '') + '">' : '';
  var run = items.map(function (text) {
    return '<span class="ad-ticker-item"><span class="ad-ticker-text">' + liveEsc(text) + '</span>' + logo + '</span>';
  }).join('');
  return '<div class="ad-ticker"><div class="ad-ticker-track">' + run + run + '</div></div>';
}

/* Боковая плитка. */
function liveSidebarAd() {
  var c = LIVE_ADS.sidebar;
  if (!c) return '';
  return '<aside class="side-ad live-ad live-ad-box" aria-label="Реклама" data-ad-slot="sidebar">' +
      '<div class="ad-head">' + liveAdMark(c) + '</div>' +
      liveAdLink(c, liveAdMedia(c, 'live-ad-media'), 'live-ad-link') +
      '<div class="ad-foot">' + liveAdLink(c, 'Перейти <span aria-hidden="true">↗</span>', 'live-ad-cta') + liveAdLegal(c) + '</div>' +
    '</aside>';
}

/* Нативные карточки в ленте — по очереди из списка креативов. */
function liveNativeAd() {
  var list = LIVE_ADS.native || [];
  if (!list.length) return '';
  var c = list[liveNativeQueue % list.length];
  liveNativeQueue++;
  var wide = c.width && c.height && (c.width / c.height) > 3;
  return '<aside class="native-ad live-ad' + (wide ? ' live-ad-wide' : '') + '" aria-label="Реклама" data-ad-slot="native">' +
      '<div class="ad-head">' + liveAdMark(c) + '</div>' +
      liveAdLink(c, liveAdMedia(c, 'live-ad-media'), 'live-ad-link') +
      '<div class="ad-foot">' + liveAdLink(c, 'Перейти <span aria-hidden="true">↗</span>', 'live-ad-cta') + liveAdLegal(c) + '</div>' +
    '</aside>';
}

/* ---------- Матч-центр ----------
   Расписание и коэффициенты приходят из открытой линии Leon.
   Коэффициенты показываем как ориентир рынка, без привязки к букмекеру:
   подписывать чужую линию именем другой конторы нельзя — по ней ставят деньги. */

function liveMatchOdds(m) {
  if (m && Array.isArray(m.odds)) {
    return m.odds.filter(function (v) { return v !== null && v !== undefined; });
  }
  /* запасной путь для демо-данных v6 */
  try {
    var b = bookById(m.book);
    return (m.quotes[b.id] || []).filter(function (v) { return v !== null; });
  } catch (e) { return []; }
}

/* Куда ведёт карточка матча — на регистрацию партнёра. */
function livePartnerBetUrl() {
  var ads = (window.__INITIAL__ && window.__INITIAL__.ads) || {};
  var c = ads.matchPartner || ads.leaderboard || ads.special || (ads.native || [])[0];
  return (c && c.click_url) || 'https://winline.ru/registration?utm_source=trbn';
}
