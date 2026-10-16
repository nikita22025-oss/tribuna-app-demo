/* Настройки интеграций Трибуна.ру. Это единственный файл, который нужно править
   при подключении сервисов. Значения ниже безопасно публиковать: секретных ключей здесь нет.

   ПРОВЕРИТЬ ПЕРЕД ЗАПУСКОМ: siteUrl, metrika.id, crm.provider и contacts.email. */
window.TRIBUNA_CONFIG = {
 /* Публичный адрес сайта без слэша в конце. Используется в разметке статей (schema.org). */
 siteUrl:'https://trbn.ru',

 /* Яндекс Метрика. id — номер счётчика из кабинета metrika.yandex.ru. 0 — счётчик выключен.
    После включения на всех страницах отправляются просмотры (SPA-режим) и цели:
    lead_form_open, lead_submit, lead_error, ad_click, bookmaker_card_open,
    bookmaker_site_click, bookmaker_review_click. Цели нужно создать в кабинете с типом «JavaScript-событие». */
 metrika:{ id:0, webvisor:true, clickmap:true, trackLinks:true, accurateTrackBounce:true },

 /* Приём заявок рекламодателей (страница «Рекламодателям»).
    provider:
      'email'    — заявка открывает письмо на contacts.email (работает без настройки сервера);
      'webhook'  — POST JSON на endpoint: своя функция в Yandex Cloud (см. server/lead-proxy), n8n, Make, Albato;
      'bitrix24' — прямое создание лида через входящий вебхук Битрикс24: endpoint вида
                   https://ВАШ_ПОРТАЛ.bitrix24.ru/rest/1/КОД_ВЕБХУКА/ (выдайте вебхуку только право crm);
      'embed'    — вставить готовую HTML-форму amoCRM, Битрикс24 «CRM-формы» или другого сервиса в embedHtml. */
 crm:{ provider:'email', endpoint:'', embedHtml:'', sourceName:'Трибуна.ру — заявка рекламодателя' },

 /* Контакты редакции и отдела рекламы. Показываются на страницах «О редакции» и «Рекламодателям». */
 contacts:{ email:'ads@trbn.ru', phone:'', telegram:'' },

 /* Реквизиты для раздела «Контакты и реквизиты» и политики конфиденциальности.
    Пустые поля не выводятся. Для СМИ с рекламой БК заполните регистрацию Роскомнадзора. */
 legal:{ operator:'', inn:'', ogrn:'', address:'', editor:'', mediaRegistration:'' }
};
