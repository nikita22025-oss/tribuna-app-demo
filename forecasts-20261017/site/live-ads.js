/* Верхний рекламный баннер — бегущая строка.

   Разметка баннера лежит статикой в index.html, поэтому заполняем её из DOM
   после загрузки. Остальные четыре рекламных места отрисовываются через функции
   из live-bridge.js: он подключается ДО модулей отрисовки, иначе реклама
   не успевает к первому render() и в ленте не появляется. */

(function () {
  'use strict';

  function fillLeaderboard() {
    var ads = (window.__INITIAL__ && window.__INITIAL__.ads) || {};
    var c = ads.leaderboard;
    var host = document.querySelector('[data-ad-slot="leaderboard"]');
    if (!c || !host) return;

    host.classList.add('live-ad', 'live-ad-leaderboard');
    var isTicker = c.file_kind === 'ticker' && typeof liveTickerAd === 'function';
    host.classList.toggle('live-ad-ticker', isTicker);
    var body = isTicker
      ? liveTickerAd(c)
      : liveAdMedia(c, 'live-ad-media');

    if (isTicker) {
      var erid = c.erid ? '<span class="ad-ticker-erid">ERID: ' + liveEsc(c.erid) + '</span>' : '';
      host.innerHTML = liveAdLink(c, body + erid, 'live-ad-link') + liveAdLegal(c);
      return;
    }

    host.innerHTML =
      '<div class="ad-head">' + liveAdMark(c) + '</div>' +
      liveAdLink(c, body, 'live-ad-link') +
      liveAdLegal(c);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fillLeaderboard);
  } else {
    fillLeaderboard();
  }
})();
