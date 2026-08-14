/**
 * demo.js — Fetch a real page and print the extracted article.
 *
 * Usage: node demo.js [url]
 * Default: https://en.wikipedia.org/wiki/Web_scraping
 *
 * If you are behind a proxy, set HTTPS_PROXY env var (or pass options.proxy).
 */

const { fetchPage } = require('./fetcher');

const url = process.argv[2] || 'https://en.wikipedia.org/wiki/Web_scraping';

(async () => {
  console.log('Fetching:', url);
  const result = await fetchPage(url, { maxLength: 3000 });
  if (result.error) {
    console.error('ERROR:', result.error);
    process.exit(1);
  }
  console.log('Status:', result.statusCode);
  console.log('Title:', result.title);
  console.log('Raw bytes:', result.rawBytes);
  console.log('Extracted chars:', result.content.length);
  console.log('---');
  console.log(result.content);
  console.log('---');
  console.log('Demo finished.');
})();
