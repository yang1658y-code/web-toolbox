/**
 * dedupe.js — Cross-source duplicate detection.
 *
 * The same story is reported by many outlets with slightly different
 * headlines and wording. This module collapses near-duplicates by scoring:
 *
 *   similarity = 0.65 × title overlap  +  0.35 × body word Jaccard
 *
 * Title overlap uses the **overlap coefficient** (shared tokens ÷ smaller
 * headline), not Jaccard — because "OpenAI Unveils GPT-5: A Leap in
 * Reasoning" vs "OpenAI Ships GPT-5 with Advanced Reasoning Capabilities"
 * shares its core entities (openai/gpt/5/reasoning) while the descriptive
 * verbs differ. Overlap keeps the strong signal; Jaccard would dilute it.
 *
 * The body term uses word-level Jaccard over the full text (stop-words
 * removed) — rewrites of the same story keep the same vocabulary
 * (model, launch, API, pricing, GPT-4...), while unrelated articles share
 * almost nothing.
 *
 * Zero dependencies — pure JS.
 *
 * Author: portfolio demo
 * License: MIT
 */

// Common English stop-words removed before tokenization.
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'for', 'to', 'with',
  'from', 'at', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
  'its', 'it', 'this', 'that', 'their', 'they', 'new', 'has', 'have',
  'had', 'will', 'would', 'can', 'could', 'after', 'over', 'into',
]);

/** Lowercase, strip punctuation, drop stop-words. */
function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));
}

/** Overlap coefficient: |A∩B| / min(|A|,|B|) — robust to rewording. */
function overlap(a, b) {
  if (!a.length || !b.length) return 0;
  const sa = new Set(a), sb = new Set(b);
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  return inter / Math.min(sa.size, sb.size);
}

/** Jaccard similarity of two token sets. */
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Similarity between two articles in [0, 1].
 * @param {object} a - { title, content }
 * @param {object} b - { title, content }
 */
function similarity(a, b) {
  const titleSim = overlap(tokenize(a.title), tokenize(b.title));
  const bodySim = jaccard(
    new Set(tokenize((a.content || '').slice(0, 2000))),
    new Set(tokenize((b.content || '').slice(0, 2000)))
  );
  return titleSim * 0.65 + bodySim * 0.35;
}

/**
 * Remove near-duplicates, keeping the first occurrence of each cluster.
 * @param {Array} items - [{ title, content, ... }]
 * @param {number} threshold - similarity above which items are duplicates (default 0.45).
 *   Tuned so cross-source rewrites of the same story (typically 0.45–0.7)
 *   are caught while unrelated articles (measured < 0.02) stay far below.
 * @returns {{ kept: Array, dupes: Array }}
 */
function dedupe(items, threshold = 0.45) {
  const kept = [];
  const dupes = [];
  for (const item of items) {
    let dupOf = null;
    for (const k of kept) {
      if (similarity(item, k) >= threshold) { dupOf = k; break; }
    }
    if (dupOf) {
      dupes.push({ ...item, duplicateOf: dupOf.title });
    } else {
      kept.push(item);
    }
  }
  return { kept, dupes };
}

module.exports = { dedupe, similarity, tokenize, normalizeTitle: (t) => tokenize(t).join(' ') };
