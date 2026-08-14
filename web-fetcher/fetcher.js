/**
 * fetcher.js — Resilient Web Page Fetcher
 *
 * Fetches a URL (with redirect following, proxy support and timeouts)
 * and returns the page title plus clean article text extracted via
 * the readability extractor (../readability-extractor/extractor.js).
 *
 * Features:
 *  - Follows up to 1 redirect (covers the vast majority of sites).
 *  - Optional HTTP(S) proxy via `HTTP_PROXY` / `HTTPS_PROXY` env vars.
 *  - Hard 8s timeout per request — never hangs forever.
 *  - Streams large responses and truncates at 200 KB before extraction,
 *    so Wikipedia-sized pages are handled gracefully.
 *
 * Author: portfolio demo
 * License: MIT
 */

const { extractArticle, extractTitle } = require('../readability-extractor/extractor');

const MAX_BYTES = 200000; // cap on buffered response bytes
const TIMEOUT_MS = 8000;

/**
 * Fetch a URL and return extracted content.
 *
 * @param {string} url - The URL to fetch.
 * @param {object} options
 *   - maxLength {number}  Max chars of article text to return (default 8000).
 *   - proxy {string}      Override proxy URL. Defaults to HTTPS_PROXY/HTTP_PROXY env.
 * @returns {Promise<object>} { url, statusCode, title, content, rawBytes }
 */
function fetchPage(url, options = {}) {
  const maxLength = options.maxLength || 8000;
  const proxy = options.proxy || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || null;

  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const mod = isHttps ? require('https') : require('http');

    // Optional proxy agent (http-proxy-agent / https-proxy-agent must be installed).
    let agent = null;
    if (proxy) {
      try {
        const { HttpProxyAgent } = require('http-proxy-agent');
        const { HttpsProxyAgent } = require('https-proxy-agent');
        agent = isHttps ? new HttpsProxyAgent(proxy) : new HttpProxyAgent(proxy);
      } catch (e) { /* proxy agents not installed — fall back to direct */ }
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      'Accept-Language': 'en,zh;q=0.8',
    };

    const timer = setTimeout(() => {
      try { req.destroy(); } catch (e) {}
      resolve({ url, error: 'Request timeout (' + TIMEOUT_MS + 'ms)' });
    }, TIMEOUT_MS);

    const done = () => clearTimeout(timer);

    const req = mod.get(url, { agent: agent || undefined, headers }, (res) => {
      // Follow one redirect.
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        try { req.destroy(); } catch (e) {}
        done();
        const nextUrl = new (require('url')).URL(res.headers.location, url).href;
        const mod2 = nextUrl.startsWith('https') ? require('https') : require('http');
        const req2 = mod2.get(nextUrl, { agent: agent || undefined, headers }, (r2) => {
          let data = '';
          r2.on('data', (chunk) => data += chunk);
          r2.on('end', () => {
            done();
            resolve({
              url,
              statusCode: r2.statusCode,
              title: extractTitle(data),
              content: extractArticle(data, { maxLength }),
              rawBytes: Buffer.byteLength(data),
            });
          });
        });
        req2.on('error', (e) => { done(); resolve({ url, error: e.message }); });
        req2.setTimeout(TIMEOUT_MS, () => {
          try { req2.destroy(); } catch (e) {}
          done();
          resolve({ url, error: 'Redirect request timeout (' + TIMEOUT_MS + 'ms)' });
        });
        return;
      }

      let data = '';
      let totalBytes = 0;
      // Note: never destroy() the stream after the cap — destroy prevents the
      // 'end' event, which would leave the Promise hanging until the timeout.
      // Instead, stop buffering and keep consuming until natural 'end'.
      res.on('data', (chunk) => {
        totalBytes += chunk.length;
        if (data.length < MAX_BYTES) data += chunk.toString();
      });
      res.on('end', () => {
        done();
        resolve({
          url,
          statusCode: res.statusCode,
          title: extractTitle(data),
          content: extractArticle(data, { maxLength }),
          rawBytes: totalBytes,
        });
      });
    });

    req.on('error', (err) => { done(); resolve({ url, error: err.message }); });
    req.setTimeout(TIMEOUT_MS, () => {
      done();
      try { req.destroy(); } catch (e) {}
      resolve({ url, error: 'Request timeout (' + TIMEOUT_MS + 'ms)' });
    });
  });
}

module.exports = { fetchPage };
