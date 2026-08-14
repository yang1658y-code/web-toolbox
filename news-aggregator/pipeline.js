/**
 * pipeline.js — The aggregation pipeline core.
 *
 *   raw articles → filter (min length) → dedupe → classify → sort → limit
 *
 * Fetching/extraction is intentionally NOT done here — pass in already
 * extracted articles (from the offline samples or the live fetcher) so
 * this module stays pure, synchronous and trivially testable.
 *
 * Author: portfolio demo
 * License: MIT
 */

const { dedupe } = require('./dedupe');
const { classify } = require('./classifier');

/**
 * Run the dedupe → classify → sort pipeline over raw articles.
 *
 * @param {Array} articles - [{ source, url, title, content, chars }]
 * @param {object} options
 *   - minChars {number}      drop articles shorter than this (default 200)
 *   - dedupeThreshold {number} similarity ≥ this ⇒ duplicate (default 0.45)
 *   - maxItems {number}      max articles to return (default 20)
 * @returns {{ articles: Array, dupes: Array, stats: object }}
 */
function processArticles(articles, options = {}) {
  const { minChars = 200, dedupeThreshold = 0.45, maxItems = 20 } = options;

  // 1) Filter — drop failed fetches and content too short to be useful.
  const good = (articles || []).filter(
    (a) => a && !a.error && a.content && a.content.length >= minChars
  );
  const filtered = (articles ? articles.length : 0) - good.length;

  // 2) Dedupe — collapse the same story reported by multiple outlets.
  const { kept, dupes } = dedupe(good, dedupeThreshold);

  // 3) Classify — tag each article with a primary category + tags.
  const tagged = kept.map((a) => ({ ...a, category: classify(a.title, a.content) }));

  // 4) Sort by length (proxy for depth/quality), then cap the result.
  tagged.sort((a, b) => b.chars - a.chars);
  const final = tagged.slice(0, maxItems);

  return {
    articles: final,
    dupes: dupes.map((d) => ({ title: d.title, source: d.source, duplicateOf: d.duplicateOf })),
    stats: {
      fetched: articles ? articles.length : 0,
      filtered,
      dupes: dupes.length,
      kept: final.length,
    },
  };
}

module.exports = { processArticles };
