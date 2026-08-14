/**
 * extractor.js — Lightweight Readability Extractor
 *
 * Extracts clean article text from raw HTML by removing navigation,
 * ads, sidebars, footers and other noise. Uses a text-density scoring
 * algorithm (simplified readability) instead of a fixed CSS selector,
 * so it works across arbitrary websites without per-site rules.
 *
 * Zero runtime dependencies required by this file itself — it expects
 * `cheerio` to be available (see package.json).
 *
 * Author: portfolio demo
 * License: MIT
 */

const cheerio = require('cheerio');

// Nodes that are never useful as article content — removed outright.
const NOISE_SELECTORS = [
  'script', 'style', 'noscript', 'iframe', 'svg', 'canvas', 'embed', 'object',
  'nav', 'header', 'footer', 'aside',
  'form', 'button', 'input', 'select', 'textarea',
  '[hidden]', '[aria-hidden="true"]',
  '.ad', '.ads', '.advert', '.advertisement', '.banner', '.popup', '.modal', '.cookie',
  '.nav', '.navbar', '.menu', '.sidebar', '.footer', '.header', '.comment', '.comments',
  '.share', '.social', '.related', '.recommend', '.subscribe', '.newsletter', '.breadcrumb',
  '.pagination', '.toolbar', '.author-box', '.bio', '.meta', '.tag', '.tags', '.category',
];

// Block-level elements: a line break is inserted after each of these so
// paragraph structure is preserved in the extracted text.
const BLOCK_ELEMENTS =
  'br, p, div, li, h1, h2, h3, h4, h5, h6, tr, blockquote, section, article, main, pre, ul, ol, dl, dt, dd, table, hr';

// Candidate containers that are scored for text density.
const CANDIDATE_CONTAINERS =
  'article, main, section, div, p, td, pre, blockquote, ul, ol, dl';

/**
 * Extract the main article text from an HTML document.
 *
 * @param {string} html - Raw HTML string.
 * @param {object} options
 *   - maxLength {number}  Truncate output to this many chars (default 8000).
 *   - fallback {boolean}  Allow rough extraction when scoring fails (default true).
 * @returns {string} Clean article text.
 */
function extractArticle(html, options = {}) {
  const maxLength = options.maxLength || 8000;
  if (!html || typeof html !== 'string') return '';
  // Too short to be a real HTML page — rough-extract directly.
  if (html.length < 200 || !html.includes('<')) {
    return roughExtract(html).slice(0, maxLength);
  }

  let $;
  try {
    $ = cheerio.load(html, { decodeEntities: true });
  } catch (e) {
    return roughExtract(html).slice(0, maxLength);
  }

  // 1) Strip noise nodes.
  try { $(NOISE_SELECTORS.join(',')).remove(); } catch (e) {}
  try { $('*').contents().filter((_, n) => n.type === 'comment').remove(); } catch (e) {}

  // 2) Score candidate containers by text density.
  // Key insight: "lots of links" ≠ navigation. Wikipedia articles link
  // almost every sentence. So the link-ratio hard threshold is relaxed
  // to 0.9 (only >90% links counts as pure navigation) and the penalty
  // coefficient is 0.5.
  let bestNode = null;
  let bestScore = 0;
  try {
    $(CANDIDATE_CONTAINERS).each(function () {
      const el = $(this);
      const clone = el.clone();
      clone.find('script,style,noscript,iframe,svg').remove();
      const text = clone.text() || '';
      const textLen = text.replace(/\s+/g, '').length;
      if (textLen < 50) return; // too small to be a candidate
      const linkTextLen = (clone.find('a').text() || '').replace(/\s+/g, '').length;
      const linkRatio = textLen > 0 ? linkTextLen / textLen : 0;
      if (linkRatio > 0.9) return; // pure navigation / TOC — skip
      const score = textLen * (1 - linkRatio * 0.5);
      if (score > bestScore) { bestScore = score; bestNode = el; }
    });
  } catch (e) {}

  // 3) Extract text while preserving block structure.
  const source = bestNode || $('body') || $.root();
  let result = '';
  try {
    const clone = source.clone();
    clone.find(BLOCK_ELEMENTS).after('\n');
    result = clone.text() || '';
  } catch (e) {
    result = source.text() || '';
  }

  // 4) Clean entities and whitespace.
  result = result
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/[ \t\u00a0]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // 5) Fallbacks when scoring picked a poor container (e.g. link-dense pages).
  if (result.length < 100 && options.fallback !== false) {
    const longestBlock = findLongestBlock($);
    if (longestBlock && longestBlock.length > result.length) result = longestBlock;
  }
  if (result.length < 30 && options.fallback !== false) {
    result = roughExtract(html);
  }
  if (result.length > maxLength) {
    result = result.slice(0, maxLength) + '\n…[truncated]';
  }
  return result;
}

/**
 * Extract the page title (h1 first, then <title>).
 * @param {string} html - Raw HTML.
 * @returns {string} Title, or '' if none found.
 */
function extractTitle(html) {
  if (!html || typeof html !== 'string') return '';
  let $;
  try { $ = cheerio.load(html, { decodeEntities: true }); } catch (e) { return ''; }
  const h1 = $('h1').first().text().trim();
  if (h1 && h1.length > 3) return h1.slice(0, 120);
  const title = $('title').first().text().trim();
  if (title) return title.slice(0, 120);
  return '';
}

/**
 * Fallback: the block-level element with the most text inside <body>.
 * Useful for link-dense pages (Wikipedia-style) where the scoring
 * heuristic may misjudge the article container.
 */
function findLongestBlock($) {
  let longest = '';
  try {
    $(CANDIDATE_CONTAINERS).each(function () {
      const clone = $(this).clone();
      // Remove links and citation superscripts to avoid inflating text length.
      clone.find('script,style,noscript,iframe,svg,a,sup').remove();
      const text = (clone.text() || '').replace(/\s+/g, ' ').trim();
      if (text.length > longest.length) longest = text;
    });
    return longest;
  } catch (e) { return ''; }
}

/**
 * Rough extraction (no cheerio dependency): regex-based tag stripping.
 * Used as a last-resort fallback.
 */
function roughExtract(html) {
  return (html || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { extractArticle, extractTitle, roughExtract };
