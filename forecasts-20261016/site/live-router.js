/* Навигация по настоящим адресам.

   Ссылки на сайте теперь ведут на /v2/article/… вместо #/article/…
   Этот перехватчик делает переходы мгновенными (без перезагрузки страницы),
   сохраняя при этом обычное поведение ссылки: её можно открыть в новой вкладке,
   скопировать адрес, добавить в закладки — чего решётка не давала.

   Подключается ПОСЛЕ app.js, чтобы router уже был готов. */

(function () {
  'use strict';

  var BASE = (typeof ROUTE_BASE === 'string' && ROUTE_BASE) || '/';

  function isInternal(href) {
    if (!href) return false;
    if (/^(https?:|mailto:|tel:)/i.test(href)) return false;  // внешние
    if (href.charAt(0) === '#') return false;                 // якорь на странице
    if (href.indexOf(BASE) !== 0) return false;
    var path = href.slice(BASE.length).split(/[?#]/, 1)[0];
    // At the domain root, API, CRM, OAuth, files and /bonus are independent.
    return /^(?:$|(?:article|archive|category|author|search|sitemap|matches|match|bookmakers|bookmaker|advertising|privacy|about|format|forecasts|forecast)(?:\/|$))/.test(path);
  }

  document.addEventListener('click', function (event) {
    /* Клик с модификатором или средней кнопкой — пусть браузер откроет как обычно. */
    if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var node = event.target;
    while (node && node.nodeName !== 'A') node = node.parentNode;
    if (!node || node.nodeName !== 'A') return;

    if (node.target && node.target !== '_self') return;       // _blank и прочее
    if (node.hasAttribute('download')) return;

    var href = node.getAttribute('href');
    if (!isInternal(href)) return;

    event.preventDefault();
    if (href === location.pathname) return;                   // уже здесь

    history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  if (window.console) {
    console.info('[Трибуна] адреса:', BASE + '… (без решётки)');
  }
})();
