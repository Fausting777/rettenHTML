(function(){
  const PAGE_SIZE = 9;
  const listEl = document.getElementById('blog-list');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageInfo = document.getElementById('pageInfo');
  let posts = []; let page = 1; let totalPages = 1;

  fetch('/blog/posts.json?_=' + Date.now())
    .then(r => r.json())
    .then(data => {
      posts = data.posts || [];
      totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
      render();
    })
    .catch(() => {
      listEl.innerHTML = '<div class="text-red-400">Fehler beim Laden der Beiträge.</div>';
    });

  function render(){
    const start = (page - 1) * PAGE_SIZE;
    const slice = posts.slice(start, start + PAGE_SIZE);
    listEl.innerHTML = slice.map(card).join('');
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
    pageInfo.textContent = `Seite ${page} / ${totalPages}`;
  }

  function card(p){
    const d = new Date(p.date).toLocaleDateString('de-DE',{year:'numeric',month:'long',day:'numeric'});
    return `
      <article class="bg-white text-gray-900 rounded-xl shadow-2xl border-t-4 border-orange-600 hover:translate-y-[-4px] transition p-6">
        <a href="/blog/posts/${p.slug}.html" class="block hover:underline">
          <h2 class="text-2xl font-bold mb-2">${escapeHtml(p.title)}</h2>
        </a>
        <p class="text-sm text-gray-500 mb-3">${d} · ${p.readingTime || '4 Min'}</p>
        <p class="text-gray-700 mb-4">${escapeHtml(p.excerpt || '')}</p>
        <a class="inline-flex items-center gap-2 text-red-600 font-semibold hover:underline" href="/blog/posts/${p.slug}.html">Weiterlesen →</a>
      </article>`;
  }

  prevBtn && prevBtn.addEventListener('click', () => { if(page>1){ page--; render(); }});
  nextBtn && nextBtn.addEventListener('click', () => { if(page<totalPages){ page++; render(); }});

  function escapeHtml(s){ return (s||'').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
})();
