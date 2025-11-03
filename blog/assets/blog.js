(function(){
  const PAGE_SIZE = 9;
  const listEl = document.getElementById('blog-list');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageInfo = document.getElementById('pageInfo');
  let posts = []; let page = 1; let totalPages = 1;

  // ЧИТАЕМ ИМЕННО ИЗ ТЕКУЩЕЙ ПАПКИ /blog/
  fetch('posts.json?_=' + Date.now())
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
    prevBtn && (prevBtn.disabled = page <= 1);
    nextBtn && (nextBtn.disabled = page >= totalPages);
    pageInfo && (pageInfo.textContent = `Seite ${page} / ${totalPages}`);
  }

  function card(p){
    const d = new Date(p.date).toLocaleDateString('de-DE',{year:'numeric',month:'long',day:'numeric'});
    return `
      <article class="bg-white text-gray-900 rounded-3xl shadow-2xl border border-gray-200 overflow-hidden transition-transform duration-300 hover:-translate-y-1">
        <a href="posts/${p.slug}.html" class="block p-8 h-full">
          <span class="inline-flex items-center text-xs font-semibold uppercase tracking-[0.3em] text-red-600 mb-4">Blog</span>
          <h2 class="text-2xl font-extrabold mb-3 leading-snug text-gray-900">${escapeHtml(p.title)}</h2>
          <p class="text-sm text-gray-500 mb-4">${d} · ${p.readingTime || '4 Min'}</p>
          <p class="text-gray-700 mb-6 leading-relaxed">${escapeHtml(p.excerpt || '')}</p>
          <span class="inline-flex items-center gap-2 text-red-600 font-semibold">Weiterlesen <i class="fa-solid fa-arrow-right"></i></span>
        </a>
      </article>`;
  }

  prevBtn && prevBtn.addEventListener('click', () => { if(page>1){ page--; render(); }});
  nextBtn && nextBtn.addEventListener('click', () => { if(page<totalPages){ page++; render(); }});

  function escapeHtml(s){ return (s||'').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
})();
