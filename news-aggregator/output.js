/**
 * output.js — Console summary + JSON export for aggregated articles.
 *
 * Author: portfolio demo
 * License: MIT
 */

const fs = require('fs');
const path = require('path');

/**
 * Print a human-readable summary table to the console.
 * @param {object} result - { articles, dupes, stats } from pipeline.processArticles
 */
function printSummary(result) {
  const { articles, dupes, stats } = result;
  console.log('\n━━━ Summary ━━━');
  console.log(
    `Fetched: ${stats.fetched} | Filtered (too short): ${stats.filtered} | ` +
    `Duplicates removed: ${stats.dupes} | Final articles: ${stats.kept}\n`
  );
  articles.forEach((a, i) => {
    const cat = (a.category.primary || 'other').padEnd(9);
    console.log(`${String(i + 1).padStart(2)}. [${cat}] ${a.title}`);
    console.log(`   ${a.source} · ${a.chars} chars · ${a.url}`);
  });
  if (dupes.length) {
    console.log('\n━━━ Duplicates detected & removed ━━━');
    dupes.forEach((d) => {
      console.log(`  ✗ "${d.title}" (${d.source})  →  duplicate of "${d.duplicateOf}"`);
    });
  }
}

/**
 * Write the aggregated result to a JSON file.
 * @param {object} result - { articles, dupes, stats }
 * @param {string} filePath - output path (parent dir auto-created).
 */
function toJSON(result, filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    stats: result.stats,
    articles: result.articles.map((a) => ({
      source: a.source,
      url: a.url,
      title: a.title,
      category: a.category.primary,
      tags: a.category.tags,
      chars: a.chars,
      content: a.content,
    })),
    duplicatesRemoved: result.dupes,
  };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  console.log(`📄 JSON written to ${filePath}`);
}

module.exports = { printSummary, toJSON };
