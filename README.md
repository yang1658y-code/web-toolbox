# Multi-Source News Aggregation Pipeline

A complete, dependency-light **web scraping & data pipeline** in Node.js: fetch articles from dozens of sources, extract clean text, remove cross-source duplicates, classify by topic, and export structured JSON — with **one command**.

> Built from real-world production code. Every module is self-contained, documented and runnable (`npm run demo`). No per-site rules, no API keys, no external services.

---

## What this repo is

```
                 ┌─────────────────────────────────────────────────┐
                 │            news-aggregator (flagship)           │
                 │                                                 │
  50+ RSS feeds  │   fetch → extract → dedupe → classify → output  │
  or any URLs ──▶│                                                 │──▶ clean JSON
                 │   │          │          │          │            │
                 └───┼──────────┼──────────┼──────────┼────────────┘
                     │          │          │          │
              ┌──────▼───┐ ┌────▼─────┐ ┌───▼────┐ ┌──▼─────┐
              │ web-     │ │readability│ │ dedupe │ │classify│
              │ fetcher  │ │extractor  │ │(own)   │ │(own)   │
              └──────────┘ └──────────┘ └────────┘ └────────┘
```

| Module | What it does | Highlights |
|---|---|---|
| [`news-aggregator`](./news-aggregator) | End-to-end pipeline: fetch → extract → dedupe → classify → export | **The flagship.** 50+ real feeds configured, offline demo, live mode |
| [`readability-extractor`](./readability-extractor) | Extracts clean article text from raw HTML | Text-density scoring — **works across thousands of sites with zero per-site rules** |
| [`web-fetcher`](./web-fetcher) | Fetches any URL, follows redirects, returns title + clean text | Proxy support, hard 8s timeout, 200 KB streaming cap — never hangs |

---

## The flagship: `news-aggregator`

The classic production problem this solves: **the same story is reported by every outlet** — with different headlines, different wording, different amounts of clutter. Scraping 50 feeds naively gives you 50 articles where 12 are the same story.

The pipeline handles it in four stages:

1. **Fetch** — pull raw HTML from any URL (or any of the 50 pre-configured feeds).
2. **Extract** — strip nav, ads, sidebars, footers; keep the article (`readability-extractor`).
3. **Dedupe** — collapse cross-source duplicates using a hybrid similarity score:
   - **title overlap coefficient** (shared core entities — "OpenAI Unveils GPT-5" vs "OpenAI Ships GPT-5" both carry `openai gpt 5 reasoning`)
   - **body word Jaccard** (rewrites of the same story keep the same vocabulary)
4. **Classify & export** — keyword-scored topic tagging (`ai`, `tech`, `science`, `business`, `world`, `sports`) + clean JSON.

### Verified results

Offline demo (6 built-in sample pages, **zero network needed**):

```
Fetched: 6 | Filtered: 0 | Duplicates removed: 1 | Final articles: 5

 1. [ai      ] OpenAI Unveils GPT-5: A Leap in Reasoning
 2. [world   ] Pacific Island Nations Sign Historic Climate Deal
 3. [science ] Webb Telescope Spots Faintest Galaxy Ever Observed
 4. [business] Global Chip Market Rebounds as AI Demand Surges
 5. [sports  ] Underdogs Stun Favorites in World Cup Qualifier

✗ "OpenAI Ships GPT-5 with Advanced Reasoning Capabilities" (DevBlog)
   → duplicate of "OpenAI Unveils GPT-5: A Leap in Reasoning" (TechDaily)
```

Live demo (real feeds — this repo was tested against Wired, TechCrunch and Ars Technica):

```
✓ TechCrunch: 3 entries
✓ Ars Technica: 3 entries
✓ Wired: 3 entries

 1. [ai      ] The Safety Reckoning Inside OpenAI | WIRED
 2. [business] Investors sue Selena Gomez alleging fraud tied to her mental health startup
```

The sample pages are deliberately nasty: navigation bars, banner ads, sidebars, footers, comment sections, and a **Wikipedia-style page where almost every sentence is a link** (the case that breaks naive extractors). All are stripped correctly.

---

## Building blocks

### `readability-extractor` — the "no more CSS selectors" problem

Most scrapers break the moment a site changes its HTML classes. This extractor **scores candidate containers** by text density and link ratio instead:

```
raw HTML → 1. strip noise → 2. score containers → 3. pick best → 4. clean → article text
```

**The catch most naive extractors miss:** Wikipedia-style pages link almost every sentence — so "lots of links" must not automatically mean "navigation". The link-ratio threshold is relaxed to 0.9 with a 0.5 penalty coefficient, which keeps article containers while still rejecting pure nav blocks.

### `web-fetcher` — the "it hangs forever" problem

Scrapers die in production for boring reasons: redirects, proxies, slow servers. This fetcher:

- follows redirects (the one-hop case covers ~all sites)
- honors `HTTPS_PROXY` / `HTTP_PROXY` env vars
- **never hangs**: hard 8s timeout per request
- streams large responses — caps buffering at 200 KB *without destroying the socket* (destroying prevents the `end` event and silently hangs the Promise — a real bug found and fixed in production)

---

## Quick start

```bash
# One install at the repo root — cheerio is shared by every module
npm install

npm run demo                # flagship pipeline, offline (6 built-in pages, no network)
npm run demo:live           # flagship pipeline, live (fetches real feeds)
npm run demo:extractor      # readability-extractor standalone demo
npm run demo:fetcher        # web-fetcher standalone demo
```

Each demo prints a summary table, runs self-checks and writes structured JSON — the same artifact shape clients need for their own pipelines.

---

## Production notes

- **Zero per-site configuration** — the extractor is algorithmic, not selector-based.
- **Zero external services** — no paid APIs, no cloud accounts; everything runs locally.
- **Graceful degradation everywhere** — timeouts, redirects, proxies, fallback extraction, feed-description fallback.
- Easy to extend: add a feed to `sources.js`, plug in a classifier of your choice (the keyword classifier is intentionally swappable for an ML model or an LLM call).

## License

MIT
