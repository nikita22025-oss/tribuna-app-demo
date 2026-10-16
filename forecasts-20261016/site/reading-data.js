/* Shared, data-only reading helpers. Current records win over archived copies. */
((root) => {
  const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g,'е');
  const flatten = value => typeof value === 'string' ? value.replace(/<[^>]*>/g,' ') : Array.isArray(value) ? value.map(flatten).join(' ') : value && typeof value === 'object' ? Object.values(value).map(flatten).join(' ') : '';
  const catalog = (current, archive) => [...new Map([...archive, ...current].filter(a=>a?.id).map(a=>[a.id,a])).values()];
  const isNews = a => !a.journal && Boolean(a.sourceName || a.sourceUrl);
  function search(all, query) {
    const words = normalize(query).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return all.map(a => {
      const title = normalize(a.title);
      const lead = normalize([a.description,a.category,a.editorialCategory,a.format,a.author,a.sourceName].join(' '));
      const body = normalize(flatten([a.body,a.chapters,a.sections,a.intro,a.ending]));
      const scores = words.map(word => title.includes(word) ? 6 : lead.includes(word) ? 3 : body.includes(word) ? 1 : 0);
      return {article:a,score:scores.every(Boolean) ? scores.reduce((x,y)=>x+y,0) : 0};
    }).filter(x=>x.score).sort((a,b)=>b.score-a.score || String(b.article.date||'').localeCompare(String(a.article.date||''))).map(x=>x.article);
  }
  const pageNumber = (value,total) => Math.min(Math.max(1, Math.floor(Number(value)) || 1), Math.max(1,total));
  const archivePage = (archive,id) => Math.floor(Math.max(0,archive.findIndex(a=>a.id===id))/30)+1;
  const api = {catalog,search,isNews,pageNumber,archivePage};
  if (typeof module !== 'undefined' && module.exports) module.exports=api;
  else root.TribunaReadingData=api;
})(globalThis);
