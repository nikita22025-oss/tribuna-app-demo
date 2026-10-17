/* Яндекс Метрика для одностраничного сайта с hash-маршрутами.
   Счётчик подключается только при metrika.id > 0 в config.js. */
(function(){
 const config=window.TRIBUNA_CONFIG||{};const settings=config.metrika||{};const counter=Number(settings.id)||0;
 let lastUrl='';
 function ym(){if(typeof window.ym==='function')window.ym.apply(null,arguments);}
 if(counter&&typeof document.createElement==='function'){
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments);};m[i].l=1*new Date();k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a);})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
  window.ym(counter,'init',{clickmap:settings.clickmap!==false,trackLinks:settings.trackLinks!==false,accurateTrackBounce:settings.accurateTrackBounce!==false,webvisor:!!settings.webvisor,defer:true});
 }
 /* tribunaTrack('pageview') — просмотр страницы; tribunaTrack('имя_цели', параметры) — достижение цели. */
 window.tribunaTrack=function(event,params){
  if(!counter)return false;
  if(event==='pageview'){const url=String(location.href||'');ym(counter,'hit',url,{title:document.title,referer:lastUrl||document.referrer||''});lastUrl=url;return true;}
  ym(counter,'reachGoal',event,params||{});return true;
 };
 window.tribunaClientId=function(){return new Promise(resolve=>{if(!counter||typeof window.ym!=='function')return resolve('');let done=false;const finish=id=>{if(!done){done=true;resolve(id||'');}};try{window.ym(counter,'getClientID',finish);}catch{finish('');}setTimeout(()=>finish(''),400);});};
 // Existing Metrika goals are also used by earlier advertising campaigns.
 // Match the current creative's destination, not its domain: rules/source links
 // inside an ad must not become bookmaker conversions. Read CRM data on click.
 const advertiserGoals={winline:'click_winline','винлайн':'click_winline',fonbet:'click_fonbet','фонбет':'click_fonbet',baltbet:'click_baltbet','балтбет':'click_baltbet'};
 function destination(value){
  if(!value)return '';
  try{const url=new URL(value,location.href);return /^https?:$/.test(url.protocol)?url.href:'';}catch{return '';}
 }
 function bannerGoal(link){
  const href=destination(link.getAttribute('href'));if(!href)return '';
  const ads=(window.__INITIAL__||{}).ads||{};
  const creatives=[ads.leaderboard,ads.sidebar,...(Array.isArray(ads.native)?ads.native:[]),ads.special];
  const creative=creatives.find(ad=>ad&&destination(ad.click_url)===href);
  return creative?advertiserGoals[String(creative.advertiser_name||'').trim().toLowerCase()]||'':'';
 }
 document.addEventListener('click',event=>{
  const link=typeof event.target.closest==='function'?event.target.closest('a'):null;if(!link)return;
  const slot=link.closest('[data-ad-slot]');if(slot){
   const params={slot:slot.dataset.adSlot};window.tribunaTrack('ad_click',params);
   const goal=bannerGoal(link);if(goal)window.tribunaTrack(goal,params);
  }
  if(link.dataset.bookLink)window.tribunaTrack('bookmaker_site_click',{bookmaker:link.dataset.bookLink});
  if(link.dataset.bookReview)window.tribunaTrack('bookmaker_review_click',{bookmaker:link.dataset.bookReview});
  const href=link.getAttribute('href')||'';if(href.startsWith('#/bookmaker/'))window.tribunaTrack('bookmaker_card_open',{bookmaker:href.split('/')[2]});
 });
})();
