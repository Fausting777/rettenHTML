// RETTER Auto-Blog Generator (простая версия)
// Создаёт 1 пост в /blog/posts/, обновляет posts.json, rss.xml, sitemap-blog.xml

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');
const BLOG = path.join(ROOT, 'blog');
const POSTS_DIR = path.join(BLOG, 'posts');
const POSTS_JSON = path.join(BLOG, 'posts.json');
const RSS_XML = path.join(BLOG, 'rss.xml');
const SITEMAP = path.join(BLOG, 'sitemap-blog.xml');
const TEMPLATE = path.join(BLOG, 'postTemplate.html');
const ORIGIN = 'https://retter-schlusseldienst.de';

function ensure() {
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
  if (!fs.existsSync(POSTS_JSON)) fs.writeFileSync(POSTS_JSON, JSON.stringify({ posts: [] }, null, 2));
  if (!fs.existsSync(RSS_XML)) fs.writeFileSync(RSS_XML,
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>RETTER Schlüsseldienst Blog</title>
    <link>${ORIGIN}/blog/</link>
    <description>Tägliche Tipps zu Türöffnung, Schlosswechsel und Einbruchschutz in Berlin.</description>
    <language>de-de</language>
  </channel>
</rss>
`);
  if (!fs.existsSync(SITEMAP)) fs.writeFileSync(SITEMAP,
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${ORIGIN}/blog/</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`);
  if (!fs.existsSync(TEMPLATE)) {
    fs.writeFileSync(TEMPLATE, `<!DOCTYPE html>
<html lang="de"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>{{SEO_TITLE}}</title>
<meta name="description" content="{{META_DESCRIPTION}}">
<link rel="canonical" href="${ORIGIN}/blog/posts/{{POST-SLUG}}.html">
</head><body>
<h1>{{H1}}</h1>
<p>Veröffentlicht am {{DATE_READABLE}} · {{READING_TIME}}</p>
{{HTML_CONTENT}}
<hr>
<a href="/">Startseite</a> · <a href="/blog/">Blog</a>
<script type="application/ld+json">{{FAQ_JSONLD}}</script>
</body></html>`);
  }
}

const Bezirke = ['Mitte','Charlottenburg','Prenzlauer Berg','Friedrichshain','Kreuzberg','Neukölln','Tempelhof','Schöneberg','Steglitz','Zehlendorf','Spandau','Reinickendorf','Pankow','Lichtenberg','Marzahn','Hellersdorf','Treptow','Köpenick'];
const Topics = [
  { key:'tuer-zugefallen', h1:'Tür zugefallen: So öffne ich schadenfrei', baseTitle:'Tür zugefallen – schadenfrei öffnen' },
  { key:'schlosswechsel', h1:'Schlosswechsel & Zylindertausch – sicher & fair', baseTitle:'Schlosswechsel in Berlin – fair & schnell' },
  { key:'einbruchschutz', h1:'Einbruchschutz zu Hause – schnelle Maßnahmen', baseTitle:'Einbruchschutz in Berlin – Checkliste' }
];

function todayISO() { return new Date().toISOString().slice(0,10); }
function dateReadable() { return new Date().toLocaleDateString('de-DE',{year:'numeric',month:'long',day:'numeric'}); }
function slugify(s){
  return s.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function pick() {
  const d = Math.floor(Date.now()/86400000);
  return { topic: Topics[d % Topics.length], bezirk: Bezirke[d % Bezirke.length] };
}

function buildSEO(t, b) {
  const title = `${t.baseTitle} in Berlin ${b}`.slice(0, 60);
  const desc = `Hilfe in ${b}: Türöffnung zum Festpreis, schnell vor Ort. Verständlich erklärt vom Meister-Schlüsseldienst.`;
  const slug = slugify(`${t.key}-berlin-${b}`);
  return { title, desc, slug };
}

function readingTime(html) {
  const words = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return `${Math.max(3, Math.round(words/180))} Min`;
}

function generateHtml(bezirk) {
  const body = `
<p>Guten Tag! Ich bin Ihr lokaler Schlüsseldienst in Berlin ${bezirk}. Ich zeige, wie ich Türen professionell und möglichst schadenfrei öffne – mit realistischen Kosten und klaren Tipps.</p>
<h2>Festpreis 90 € für zugefallene Türen</h2>
<ul>
<li>Anfahrt in Berlin inklusive</li>
<li>Transparente Erklärung vor Beginn</li>
<li>Nachtzuschlag zwischen 22–08 Uhr</li>
</ul>
<h2>Schonende Methoden</h2>
<p>Ich arbeite mit Spezialwerkzeug und vermeide unnötiges Bohren.</p>
<p>Interne Links: <a href="/">Startseite</a>, <a href="/impressum.html">Impressum</a>, <a href="/datenschutz.html">Datenschutz</a>.</p>
`;
  const faq = {
    '@context':'https://schema.org','@type':'FAQPage',
    'mainEntity':[
      {'@type':'Question','name':`Wie schnell sind Sie in ${bezirk} vor Ort?`,'acceptedAnswer':{'@type':'Answer','text':'Meist in 15–30 Minuten, je nach Verkehr.'}},
      {'@type':'Question','name':'Gilt der Festpreis wirklich?','acceptedAnswer':{'@type':'Answer','text':'Ja. Für zugefallene Türen 90 € inkl. Anfahrt in Berlin.'}},
      {'@type':'Question','name':'Kann ich Karte zahlen?','acceptedAnswer':{'@type':'Answer','text':'Ja, Bar, EC- und Kreditkarte.'}}
    ]
  };
  return { body, faqJson: JSON.stringify(faq) };
}

function updatePostsJson(meta) {
  const data = JSON.parse(fs.readFileSync(POSTS_JSON,'utf8'));
  if (data.posts.some(p=>p.slug===meta.slug)) return false;
  data.posts.unshift({ title: meta.title, slug: meta.slug, date: todayISO(), excerpt: meta.desc, readingTime: meta.readingTime });
  fs.writeFileSync(POSTS_JSON, JSON.stringify(data, null, 2));
  return true;
}

function updateRss(meta) {
  let rss = fs.readFileSync(RSS_XML,'utf8');
  const item = `
    <item>
      <title>${meta.title}</title>
      <link>${ORIGIN}/blog/posts/${meta.slug}.html</link>
      <description>${meta.desc}</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <guid>${ORIGIN}/blog/posts/${meta.slug}.html</guid>
    </item>`;
  rss = rss.replace('</channel>\n</rss>','') + item + '\n  </channel>\n</rss>\n';
  fs.writeFileSync(RSS_XML, rss);
}

function updateSitemap(slug) {
  let sm = fs.readFileSync(SITEMAP,'utf8');
  const url = `
  <url>
    <loc>${ORIGIN}/blog/posts/${slug}.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  sm = sm.replace('</urlset>','') + url + '\n</urlset>\n';
  fs.writeFileSync(SITEMAP, sm);
}

function main() {
  ensure();
  const { topic, bezirk } = pick();
  const { title, desc, slug } = buildSEO(topic, bezirk);
  const tpl = fs.readFileSync(TEMPLATE, 'utf8');
  const { body, faqJson } = generateHtml(bezirk);
  const rt = readingTime(body);

  const html = tpl
    .replaceAll('{{SEO_TITLE}}', title)
    .replaceAll('{{META_DESCRIPTION}}', desc)
    .replaceAll('{{POST-SLUG}}', slug)
    .replaceAll('{{H1}}', `${topic.h1} in Berlin ${bezirk}`)
    .replaceAll('{{DATE_READABLE}}', dateReadable())
    .replaceAll('{{READING_TIME}}', rt)
    .replaceAll('{{HTML_CONTENT}}', body)
    .replaceAll('{{FAQ_JSONLD}}', faqJson);

  const out = path.join(POSTS_DIR, `${slug}.html`);
  if (fs.existsSync(out)) {
    console.log('Already exists for today, skip:', out);
    return;
  }
  fs.writeFileSync(out, html);

  const added = updatePostsJson({ title, slug, desc, readingTime: rt });
  if (added) {
    updateRss({ title, slug, desc });
    updateSitemap(slug);
    console.log('New post created:', slug);
  } else {
    console.log('posts.json already has this slug, nothing to do');
  }
}

main();
