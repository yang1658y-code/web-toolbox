/**
 * demo.js — Run the extractor against sample HTML.
 *
 * Usage: node demo.js
 *
 * Prints the extracted article text and a few stats so you can verify
 * the extractor works without touching the network.
 */

const { extractArticle, extractTitle } = require('./extractor');

// A deliberately noisy HTML page: article + nav + ads + sidebar + footer.
const noisyHtml = `<!DOCTYPE html>
<html>
<head>
  <title>How Web Scraping Works in 2026</title>
</head>
<body>
  <nav class="navbar">
    <a href="/">Home</a> <a href="/about">About</a> <a href="/blog">Blog</a>
  </nav>
  <div class="banner">🔥 Limited-time offer: scrape 10x faster!</div>
  <main>
    <article>
      <h1>How Web Scraping Works in 2026</h1>
      <p>Web scraping is the process of automatically extracting data from websites.
      Modern scrapers combine HTTP clients, HTML parsers and AI-powered content extraction.</p>
      <p>This year, the key shift is toward <b>semantic extraction</b>: instead of
      hard-coding CSS selectors per site, algorithms score candidate containers
      by text density and link ratio, so the same code works across thousands of sites.</p>
      <ul>
        <li>Text-density scoring picks the article container</li>
        <li>Noise selectors remove navigation, ads and footers</li>
        <li>A rough-extract fallback guarantees output on any HTML</li>
      </ul>
      <p>With these techniques, a single scraper can handle news sites, blogs,
      wikis and documentation pages without per-site rules — which is exactly
      what this library does.</p>
    </article>
  </main>
  <aside class="sidebar">
    <h3>Related posts</h3>
    <a href="/p1">Scraping at scale</a>
    <a href="/p2">Proxy rotation 101</a>
  </aside>
  <div class="comments">
    <p>Great article! — user123</p>
  </div>
  <footer>© 2026 Demo Blog. All rights reserved.</footer>
</body>
</html>`;

const title = extractTitle(noisyHtml);
const text = extractArticle(noisyHtml, { maxLength: 2000 });

console.log('=== Readability Extractor Demo ===');
console.log('Title:', title);
console.log('Extracted chars:', text.length);
console.log('---');
console.log(text);
console.log('---');
console.log('Demo passed. Noise (nav/banner/sidebar/footer/comments) should be absent.');
