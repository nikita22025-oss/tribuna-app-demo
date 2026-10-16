/* Editable advertising copy: shared by the public site and the private preview. */
(function () {
  'use strict';
  window.specialAdSlide = function (slide) {
    var ad = slide && slide.creative;
    if (!ad) return '';
    var offer = ad.offer;
    var media = '<a class="special-artwork winline-offer-art" href="' + liveEsc(ad.click_url) + '" target="_blank" rel="nofollow sponsored noopener noreferrer">' + liveAdMedia(ad, 'ad-managed-art') + '</a>';
    if (!offer) return '<article class="special-article special-article-ad" data-ad-slot="special">' + media + '<div class="special-copy"><span class="special-label">Реклама' + (ad.is_18plus ? ' · 18+' : '') + '</span><h2>' + liveEsc(ad.title || ad.advertiser_name || 'Партнёр выпуска') + '</h2><p>' + liveEsc(ad.claim || 'Партнёр выпуска.') + '</p><p class="special-erid">ERID: ' + liveEsc(ad.erid) + '</p>' + liveAdLegal(ad) + '<a class="special-read" href="' + liveEsc(ad.click_url) + '" target="_blank" rel="nofollow sponsored noopener noreferrer">Перейти <span aria-hidden="true">↗</span></a></div></article>';
    var headline = String(offer.headline || ad.title || 'Предложение партнёра');
    var split = headline.match(/^(.*?)(\d[\d\s.,]*(?:₽|%)?)(.*)$/);
    var title = split ? '<span>' + liveEsc(split[1].trim()) + '</span><strong>' + liveEsc(split[2].trim()) + '</strong>' + (split[3].trim() ? '<span>' + liveEsc(split[3].trim()) + '</span>' : '') : '<span class="ad-offer-plain">' + liveEsc(headline) + '</span>';
    var steps = (offer.steps || []).filter(Boolean).map(function (s) { return '<li>' + liveEsc(s) + '</li>'; }).join('');
    return '<article class="special-article special-article-ad winline-offer' + (offer.kind === 'winline-welcome' ? '' : ' ad-managed-offer') + '" data-ad-slot="special">' + media + '<div class="special-copy winline-offer-copy"><div class="winline-offer-meta"><span>' + liveEsc(offer.audience || ad.advertiser_name) + '</span><span>Реклама' + (ad.is_18plus ? ' · 18+' : '') + '</span></div><h2 class="winline-offer-title">' + title + '</h2><p class="winline-offer-caption">' + liveEsc(offer.mechanic) + '</p><ol class="winline-offer-steps">' + steps + '</ol>' + (offer.conditions || offer.rules_url ? '<details class="winline-offer-details"><summary>Условия предложения</summary><div class="winline-offer-terms"><p>' + liveEsc(offer.conditions) + '</p>' + (offer.rules_url ? '<a href="' + liveEsc(offer.rules_url) + '" target="_blank" rel="noopener noreferrer">Правила акции ↗</a>' : '') + '</div></details>' : '') + '<a class="winline-offer-cta" href="' + liveEsc(ad.click_url) + '" target="_blank" rel="nofollow sponsored noopener noreferrer">' + liveEsc(offer.cta || 'Перейти') + '<span aria-hidden="true">↗</span></a><div class="winline-offer-footer"><span>' + liveEsc(ad.legal || 'По условиям акции рекламодателя') + '</span><span>ERID: ' + liveEsc(ad.erid) + '</span></div></div></article>';
  };
})();
