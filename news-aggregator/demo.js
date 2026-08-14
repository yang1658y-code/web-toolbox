#!/usr/bin/env node
/**
 * demo.js — End-to-end demo of the news aggregation pipeline.
 *
 *   node demo.js          offline: 6 built-in sample pages, zero network
 *   node demo.js --live   live: fetch 5 real RSS feeds (needs internet)
 *
 * Offline demo exercises every stage:
 *   noise stripping (nav/ads/sidebars/footers),
 *   link-dense wiki-style pages,
 *   cross-source duplicate detection,
 *   keyword classification,
 *   clean JSON export.
 *
 * Author: portfolio demo
 * License: MIT
 */

const path = require('path');
const { SAMPLE_PAGES, LIVE_SOURCES } = require('./sources');
const { processArticles } = require('./pipeline');
const { printSummary, toJSON } = require('./output');

const LIVE = process.argv.includes('--live');

async function main() {
  console.log('=== Multi-Source News Aggregator Demo ===\n');

  let articles;
  if (LIVE) {
    articles = await fetchLiveArticles();
  } else {
    articles = extractSampleArticles();
  }

  if (!articles.length) {
    console.log('No articles could be retrieved — nothing to aggregate.');
    process.exit(LIVE ? 2 : 1);
  }

  const result = processArticles(articles, { minChars: 150 });
  printSummary(result);
  toJSON(result, path.join(__dirname, 'output', 'demo-result.json'));

  // Self-check assertions (offline demo).
  if (!LIVE) {
    verify(result);
  }
}

/** Offline: run the readability extractor over the 6 built-in pages. */
function extractSampleArticles() {
  console.log(`Offline mode: ${SAMPLE_PAGES.length} built-in sample pages, zero network needed.\n`);
  const { extractArticle, extractTitle } = require('../readability-extractor/extractor');
  return SAMPLE_PAGES.map((p) => {
    const title = extractTitle(p.html);
    const content = extractArticle(p.html, { maxLength: 8000 });
    return { source: p.name, url: p.url, title, content, chars: content.length };
  });
}

/** Live: fetch the first 5 real feeds, parse entries, extract each article. */
async function fetchLiveArticles() {
  const { fetchPage } = require('../web-fetcher/fetcher');
  const sources = LIVE_SOURCES.slice(0, 5);
  console.log(`Live mode: fetching ${sources.length} feeds (${sources.map((s) => s.name).join(', ')})\n`);

  const articles = [];
  for (const src of sources) {
    // Fetch the RAW feed XML (not through the article extractor — RSS is
    // XML, not HTML, so extraction would strip the <item> tags we need).
    const feed = await fetchRaw(src.url);
    if (!feed.ok) {
      console.log(`  ⚠ ${src.name}: feed fetch failed (${feed.error}) — skipped`);
      continue;
    }
    const items = parseRSSItems(feed.xml);
    if (!items.length) {
      console.log(`  ⚠ ${src.name}: no RSS items parsed — skipped`);
      continue;
    }
    console.log(`  ✓ ${src.name}: ${items.length} entries`);
    // Fetch the top article from each feed to demonstrate real extraction.
    const top = items[0];
    const page = await fetchPage(top.link, { maxLength: 8000 });
    if (page.error || !page.content || page.content.length < 150) {
      console.log(`    ↳ top article too short or failed (${page.error || 'short content'}) — using feed description`);
      articles.push({
        source: src.name, url: top.link, title: top.title,
        content: top.description, chars: top.description.length,
      });
      continue;
    }
    articles.push({
      source: src.name, url: top.link, title: page.title,
      content: page.content, chars: page.content.length,
    });
  }
  return articles;
}

/**
 * Fetch a URL and return the RAW response body (no extraction, no parsing).
 * Used for RSS/XML feeds. Honors HTTPS_PROXY/HTTP_PROXY env vars (tries to
 * reuse the proxy agents installed in the sibling web-fetcher module).
 */
function fetchRaw(url, timeout = 12000) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? require('https') : require('http');
    const agent = proxyAgent(url);
    const req = mod.get(url, {
      agent: agent || undefined,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { if (data.length < 2000000) data += c; });
      res.on('end', () => resolve({ ok: true, xml: data }));
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.setTimeout(timeout, () => {
      try { req.destroy(); } catch (e) {}
      resolve({ ok: false, error: 'timeout (' + timeout + 'ms)' });
    });
  });
}

/** Optional HTTP(S) proxy agent from env vars (gracefully degrades to direct). */
function proxyAgent(url) {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxy) return null;
  try {
    const base = path.join(__dirname, '..', 'web-fetcher', 'node_modules');
    if (url.startsWith('https')) {
      const { HttpsProxyAgent } = require(base + '/https-proxy-agent');
      return new HttpsProxyAgent(proxy);
    }
    const { HttpProxyAgent } = require(base + '/http-proxy-agent');
    return new HttpProxyAgent(proxy);
  } catch (e) {
    return null; // proxy agents not installed — go direct
  }
}

/** Tiny zero-dependency RSS parser (good enough for a demo). */
function parseRSSItems(xml) {
  const items = [];
  const itemRe = /<item[\s\S]*?<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml || '')) !== null) {
    const block = m[0];
    const title = (block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1] || '';
    const link = (block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '';
    const desc = (block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) || [])[1] || '';
    if (title && link) {
      items.push({
        title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
        link: link.trim(),
        description: desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500),
      });
    }
  }
  return items.slice(0, 3); // keep demo fast: max 3 entries per feed
}

/** Assert the pipeline behaved as expected (offline demo only). */
function verify(result) {
  console.log('\n━━━ Self-check ━━━');
  const checks = [];
  const { articles, dupes, stats } = result;

  // 1) Noise was stripped — content should not contain nav/ad/footer text.
  const badTerms = ['Sponsored', 'Trending', 'All rights reserved', 'Advertisement', 'ACME Brokerage'];
  const clean = articles.every((a) => !badTerms.some((t) => a.content.includes(t)));
  checks.push(['Noise (nav/ads/footer) stripped', clean]);

  // 2) Wiki-style link-dense page survived extraction.
  const sciwire = articles.find((a) => a.source === 'SciWire');
  checks.push(['Link-dense (wiki-style) page extracted', !!sciwire && sciwire.chars > 300]);

  // 3) Cross-source duplicates were collapsed (TechDaily vs DevBlog).
  checks.push(['Duplicate story collapsed (TechDaily/DevBlog)', stats.dupes >= 1 && dupes.some((d) => d.source === 'DevBlog' || d.source === 'TechDaily')]);

  // 4) Classifier produced sensible categories.
  const cats = articles.map((a) => a.category.primary);
  checks.push(['AI story → ai', cats.includes('ai')]);
  checks.push(['Science story → science', cats.includes('science')]);
  checks.push(['Business story → business', cats.includes('business')]);

  // 5) Every final article has a non-trivial body.
  checks.push(['All final articles ≥ 150 chars', articles.every((a) => a.chars >= 150)]);

  let allPass = true;
  for (const [label, ok] of checks) {
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
    if (!ok) allPass = false;
  }
  console.log(allPass ? '\n✅ All checks passed — pipeline works as designed.\n' : '\n⚠️ Some checks failed — inspect output above.\n');
  return allPass;
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
