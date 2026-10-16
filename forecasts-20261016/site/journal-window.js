/* Two editorial issues in the feed. Archived records keep their original URLs. */
(() => {
  'use strict';
  const issues = window.TRIBUNA_JOURNAL_WINDOW?.issues || [];
  if (!issues.length) return;
  const h = escapeHTML;
  const date = issue => new Intl.DateTimeFormat('ru', {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(issue.date+'T12:00:00Z'));
  const heading = (issue, previous=false) => `<header class="jw-issue-heading wrap"${previous?' id="journal-previous-issue" tabindex="-1"':''}><h2>${previous?'Предыдущий выпуск':'Свежий выпуск'}</h2><time datetime="${h(issue.date)}">${h(date(issue))}</time></header>`;
  const record = id => articles.find(a=>a.id===id) || (window.TRIBUNA_ARCHIVE||[]).find(a=>a.id===id);
  const previous = issues[1];
  function previousFeed() {
    if (!previous) return '';
    const cards = previous.sequence.map(item => {
      const a = record(item.article), format = editorialFormats[item.type];
      if (!a || !format) return '';
      return `<div class="editorial-slot" data-format="${h(item.type)}" data-issue-article="${h(a.id)}"><div class="editorial-card-body">${format(item,a)}</div></div>`;
    }).join('');
    return `<section class="jw-previous" data-journal-issue="${h(previous.id)}" aria-labelledby="jw-previous-title">${heading(previous,true).replace('<h2>','<h2 id="jw-previous-title">')}<div class="editorial-masonry wrap">${cards}</div><a class="jw-archive-link wrap" href="/archive">Больше историй в архиве <span aria-hidden="true">↗</span></a></section>`;
  }
  const stream = renderEditorialStream;
  renderEditorialStream = function() {
    let html = stream();
    html = html.replace('<div class="editorial-feed">', `<div class="editorial-feed" data-journal-issue="${h(issues[0].id)}">${heading(issues[0])}`);
    if (previous) {
      // Complete each masonry grid before the full-width divider, avoiding empty cells.
      html = html.replace(/(<aside\b[^>]*id="journal-sketch-break"[\s\S]*?<\/aside>)/, (_,divider) =>
        divider.replace('href="/#journal-next-part"','href="/#journal-previous-issue"') + previousFeed());
    }
    return html;
  };

  const sectionIds = new Set(['journal-stories','journal-sketch-break','journal-next-part','journal-previous-issue']);
  window.scrollJournalSection = function(id, focus=false) {
    if(!sectionIds.has(id))return false;
    const target=document.getElementById(id),stage=target?.closest('.editorial-stage');
    // The fresh-issue heading precedes the passing stage rather than living in it.
    if(id==='journal-stories'&&target){
      const margin=parseFloat(getComputedStyle(target).scrollMarginTop)||0;
      window.scrollTo({top:Math.max(0,target.getBoundingClientRect().top+window.scrollY-margin),behavior:'instant'});
      if(focus){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
      return true;
    }
    if(!stage)return false;
    const feed=stage.querySelector('.editorial-feed'),sector=stage.querySelector('.special-section');
    const feedStyle=getComputedStyle(feed);
    let top=target.getBoundingClientRect().top+window.scrollY;
    if(feed.contains(target)&&feedStyle.position==='sticky'&&sector&&getComputedStyle(sector).position==='absolute') {
      const offset=target.getBoundingClientRect().top-feed.getBoundingClientRect().top;
      const stop=Math.max(0,-parseFloat(feedStyle.top)||0);
      const travel=parseFloat(getComputedStyle(stage,'::after').height)||0;
      top=stage.getBoundingClientRect().top+window.scrollY+(parseFloat(getComputedStyle(stage).paddingTop)||0)+offset+(offset>stop?travel:0);
    }
    const margin=parseFloat(getComputedStyle(target).scrollMarginTop)||0;
    // Jump to the requested section after the passing sheet, without disabling
    // the effect for subsequent scrolling or returning to the top of the page.
    window.scrollTo({top:Math.max(0,top-margin),behavior:'instant'});
    if(focus){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
    return true;
  };
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest('a[href]');
    if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
    const url=new URL(link.href);
    if(url.origin!==location.origin||url.pathname.replace(/\/$/,'')!==location.pathname.replace(/\/$/,'')||!sectionIds.has(url.hash.slice(1)))return;
    if(!window.scrollJournalSection(url.hash.slice(1),editorialKeyboardMode))return;
    event.preventDefault();
    history.replaceState({},'',url.pathname+url.search+url.hash);
  },true);
})();
