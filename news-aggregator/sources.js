/**
 * sources.js — Feed & sample-page registry for the news aggregator.
 *
 * LIVE_SOURCES : 50 real-world RSS feeds (used by `node demo.js --live`).
 * SAMPLE_PAGES : 6 built-in offline sample pages (used by `node demo.js`),
 *                designed to exercise every stage of the pipeline:
 *                noise stripping, link-dense (wiki-style) pages, cross-source
 *                duplicates, and keyword classification.
 *
 * Author: portfolio demo
 * License: MIT
 */

/**
 * 50 real feeds across tech / AI / world / business / science.
 * `type: 'rss'` — feed URL; `category` is a hint used as a fallback label
 * when the classifier is unsure.
 */
const LIVE_SOURCES = [
  // ── Tech ──────────────────────────────────────────────
  { id: 'hn',        name: 'Hacker News',             url: 'https://news.ycombinator.com/rss',                      type: 'rss', category: 'tech' },
  { id: 'verge',     name: 'The Verge',               url: 'https://www.theverge.com/rss/index.xml',                 type: 'rss', category: 'tech' },
  { id: 'techcrunch', name: 'TechCrunch',             url: 'https://techcrunch.com/feed/',                            type: 'rss', category: 'tech' },
  { id: 'ars',       name: 'Ars Technica',            url: 'https://feeds.arstechnica.com/arstechnica/index',         type: 'rss', category: 'tech' },
  { id: 'wired',     name: 'Wired',                   url: 'https://www.wired.com/feed/rss',                          type: 'rss', category: 'tech' },
  { id: 'engadget',  name: 'Engadget',                url: 'https://www.engadget.com/rss.xml',                        type: 'rss', category: 'tech' },
  { id: 'zdnet',     name: 'ZDNet',                   url: 'https://www.zdnet.com/news/rss.xml',                      type: 'rss', category: 'tech' },
  { id: 'gizmodo',   name: 'Gizmodo',                 url: 'https://gizmodo.com/rss',                                 type: 'rss', category: 'tech' },
  { id: 'tnw',       name: 'The Next Web',            url: 'https://thenextweb.com/feed/',                            type: 'rss', category: 'tech' },
  { id: 'vb',        name: 'VentureBeat',             url: 'https://venturebeat.com/feed/',                           type: 'rss', category: 'tech' },
  { id: 'mit-tr',    name: 'MIT Technology Review',   url: 'https://www.technologyreview.com/feed/',                  type: 'rss', category: 'tech' },
  { id: 'ieee',      name: 'IEEE Spectrum',           url: 'https://spectrum.ieee.org/feed/rss',                      type: 'rss', category: 'tech' },
  { id: 'infoq',     name: 'InfoQ',                   url: 'https://www.infoq.com/feed/',                             type: 'rss', category: 'tech' },
  { id: 'smashing',  name: 'Smashing Magazine',       url: 'https://www.smashingmagazine.com/feed/',                  type: 'rss', category: 'tech' },
  { id: 'css-tricks', name: 'CSS-Tricks',             url: 'https://css-tricks.com/feed/',                            type: 'rss', category: 'tech' },
  { id: 'github',    name: 'GitHub Blog',             url: 'https://github.blog/feed/',                               type: 'rss', category: 'tech' },
  { id: 'google-dev', name: 'Google Developers Blog', url: 'https://developers.googleblog.com/feeds/posts/default',   type: 'rss', category: 'tech' },
  { id: 'cloudflare', name: 'Cloudflare Blog',        url: 'https://blog.cloudflare.com/rss/',                        type: 'rss', category: 'tech' },
  { id: 'aws',       name: 'AWS News Blog',           url: 'https://aws.amazon.com/blogs/aws/feed/',                  type: 'rss', category: 'tech' },
  { id: 'mozilla',   name: 'Mozilla Hacks',           url: 'https://hacks.mozilla.org/feed/',                         type: 'rss', category: 'tech' },
  // ── AI ────────────────────────────────────────────────
  { id: 'openai',    name: 'OpenAI Blog',             url: 'https://openai.com/blog/rss.xml',                         type: 'rss', category: 'ai' },
  { id: 'deepmind',  name: 'DeepMind Blog',           url: 'https://deepmind.google/blog/rss.xml',                    type: 'rss', category: 'ai' },
  { id: 'google-ai', name: 'Google AI Blog',          url: 'https://blog.google/technology/ai/rss/',                  type: 'rss', category: 'ai' },
  { id: 'anthropic', name: 'Anthropic',               url: 'https://www.anthropic.com/rss.xml',                       type: 'rss', category: 'ai' },
  { id: 'huggingface', name: 'Hugging Face Blog',     url: 'https://huggingface.co/blog/feed.xml',                    type: 'rss', category: 'ai' },
  // ── World ─────────────────────────────────────────────
  { id: 'bbc',       name: 'BBC World',               url: 'http://feeds.bbci.co.uk/news/world/rss.xml',              type: 'rss', category: 'world' },
  { id: 'reuters',   name: 'Reuters World',           url: 'https://feeds.reuters.com/reuters/worldNews',             type: 'rss', category: 'world' },
  { id: 'ap',        name: 'AP Top News',             url: 'https://apnews.com/apf-topnews',                          type: 'rss', category: 'world' },
  { id: 'cnn',       name: 'CNN',                     url: 'http://rss.cnn.com/rss/edition.rss',                      type: 'rss', category: 'world' },
  { id: 'guardian',  name: 'The Guardian World',      url: 'https://www.theguardian.com/world/rss',                   type: 'rss', category: 'world' },
  { id: 'aljazeera', name: 'Al Jazeera',              url: 'https://www.aljazeera.com/xml/rss/all.xml',               type: 'rss', category: 'world' },
  { id: 'dw',        name: 'DW',                      url: 'https://rss.dw.com/rdf/rss-en-world',                     type: 'rss', category: 'world' },
  { id: 'france24',  name: 'France 24',               url: 'https://www.france24.com/en/rss',                         type: 'rss', category: 'world' },
  { id: 'nyt',       name: 'NYT World',               url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',  type: 'rss', category: 'world' },
  { id: 'economist', name: 'The Economist',           url: 'https://www.economist.com/world/rss.xml',                 type: 'rss', category: 'world' },
  // ── Business ──────────────────────────────────────────
  { id: 'bloomberg', name: 'Bloomberg',               url: 'https://feeds.bloomberg.com/markets/news.rss',            type: 'rss', category: 'business' },
  { id: 'cnbc',      name: 'CNBC',                    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', type: 'rss', category: 'business' },
  { id: 'marketwatch', name: 'MarketWatch',           url: 'https://feeds.marketwatch.com/marketwatch/topstories/',   type: 'rss', category: 'business' },
  { id: 'forbes',    name: 'Forbes',                  url: 'https://www.forbes.com/business/feed/',                   type: 'rss', category: 'business' },
  { id: 'fortune',   name: 'Fortune',                 url: 'https://fortune.com/feed/',                               type: 'rss', category: 'business' },
  { id: 'bi',        name: 'Business Insider',        url: 'https://www.businessinsider.com/rss',                     type: 'rss', category: 'business' },
  { id: 'ft',        name: 'Financial Times',         url: 'https://www.ft.com/rss/home',                             type: 'rss', category: 'business' },
  { id: 'wsj',       name: 'WSJ',                     url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',             type: 'rss', category: 'business' },
  // ── Science ───────────────────────────────────────────
  { id: 'nasa',      name: 'NASA Breaking News',      url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',          type: 'rss', category: 'science' },
  { id: 'nature',    name: 'Nature',                  url: 'https://www.nature.com/nature.rss',                       type: 'rss', category: 'science' },
  { id: 'sciencedaily', name: 'ScienceDaily',         url: 'https://www.sciencedaily.com/rss/all.xml',                type: 'rss', category: 'science' },
  { id: 'quanta',    name: 'Quanta Magazine',         url: 'https://www.quantamagazine.org/feed/',                    type: 'rss', category: 'science' },
  { id: 'phys',      name: 'Phys.org',                url: 'https://phys.org/rss-feed/',                              type: 'rss', category: 'science' },
  { id: 'ars-science', name: 'Ars Technica Science',  url: 'https://feeds.arstechnica.com/arstechnica/science',       type: 'rss', category: 'science' },
  { id: 'newscientist', name: 'New Scientist',        url: 'https://www.newscientist.com/feed/home',                  type: 'rss', category: 'science' },
];

/**
 * 6 built-in sample pages for the offline demo.
 *
 * Each page deliberately contains navigation, ads, sidebars and footers so
 * the extractor has real noise to strip. Two pages (TechDaily & DevBlog)
 * report the SAME story from different outlets — the dedupe stage must
 * collapse them into one.
 */
const SAMPLE_PAGES = [
  {
    id: 'techdaily',
    name: 'TechDaily',
    url: 'https://techdaily.example.com/gpt5-launch',
    category: 'ai',
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>OpenAI Unveils GPT-5: A Leap in Reasoning | TechDaily</title></head>
<body>
<header class="site-header">
  <a class="logo" href="/">TechDaily</a>
  <nav class="nav"><a href="/tech">Tech</a><a href="/ai">AI</a><a href="/business">Business</a><a href="/science">Science</a><a href="/about">About</a></nav>
</header>
<div class="ad-banner"><img src="/ads/banner.png" alt="ad"><p>Sponsored: Upgrade your hosting today — get 50% off!</p></div>
<main class="content">
  <article>
    <h1>OpenAI Unveils GPT-5: A Leap in Reasoning</h1>
    <p class="byline">By Sarah Chen · March 12, 2026 · 6 min read</p>
    <p>OpenAI today unveiled GPT-5, its most advanced model to date, claiming significant improvements in multi-step reasoning, tool use and long-context understanding. The model will roll out to ChatGPT subscribers starting next week.</p>
    <p>In internal benchmarks shared with reporters, GPT-5 outperformed its predecessor on mathematics, code generation and scientific problem solving. The company says the model can plan and execute complex tasks with far fewer errors than GPT-4.</p>
    <p>"This is the first model that feels genuinely agentic," said the OpenAI CEO at the launch event in San Francisco. "It doesn't just answer questions — it works through problems the way a skilled engineer would."</p>
    <p>Developers can access GPT-5 through the API starting today, with pricing set at a 30 percent premium over GPT-4. Early enterprise customers include several major banks and healthcare providers.</p>
    <p>Industry analysts say the release intensifies the race among AI labs, with Google and Anthropic expected to announce competing models in the coming months.</p>
  </article>
  <aside class="sidebar">
    <h3>Trending</h3>
    <ul><li><a href="/t1">10 AI tools to try in 2026</a></li><li><a href="/t2">Chip shortage update</a></li><li><a href="/t3">Robotaxi launches in Tokyo</a></li></ul>
    <div class="ad-box">Ad: Invest in AI stocks now</div>
  </aside>
</main>
<footer class="site-footer">© 2026 TechDaily. All rights reserved. | <a href="/privacy">Privacy</a> | <a href="/terms">Terms</a></footer>
</body>
</html>`,
  },
  {
    id: 'devblog',
    name: 'DevBlog',
    url: 'https://devblog.example.com/posts/openai-gpt5',
    category: 'ai',
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>OpenAI Ships GPT-5 with Advanced Reasoning Capabilities | DevBlog</title></head>
<body>
<nav class="nav"><a href="/">Home</a><a href="/news">News</a><a href="/tutorials">Tutorials</a><a href="/jobs">Jobs</a></nav>
<main>
  <article class="post">
    <h1>OpenAI Ships GPT-5 with Advanced Reasoning Capabilities</h1>
    <p class="meta">Posted by Marcus Lee · 2026-03-12 · Category: AI</p>
    <p>OpenAI has officially released GPT-5, the newest version of its flagship AI model. The company reports major gains in reasoning, planning and long document handling compared to GPT-4.</p>
    <p>Early tests show the model solving complex math problems and writing production-quality code with noticeably fewer mistakes. Subscribers on ChatGPT Plus can start using it from next week.</p>
    <p>At the launch in San Francisco, the CEO described GPT-5 as the company's first truly agentic model — one that can break down a task and work through it step by step like a professional engineer.</p>
    <p>The API is open for developers today. Pricing is about 30 percent higher than GPT-4. Several large banks and hospitals have already signed up as early customers.</p>
    <p>Competition is heating up: Google and Anthropic are both expected to counter with their own new models soon, according to industry watchers.</p>
  </article>
</main>
<footer>© 2026 DevBlog</footer>
</body>
</html>`,
  },
  {
    id: 'sciwire',
    name: 'SciWire',
    url: 'https://sciwire.example.com/webb-faintest-galaxy',
    category: 'science',
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Webb Telescope Spots Faintest Galaxy Ever Observed - SciWire</title></head>
<body>
<div class="topbar">SciWire · <a href="/science">Science</a> · <a href="/space">Space</a> · <a href="/health">Health</a> · <a href="/tech">Tech</a></div>
<main>
  <article>
    <h1>Webb Telescope Spots Faintest Galaxy Ever Observed</h1>
    <p>Astronomers using the <a href="/jwst">James Webb Space Telescope</a> have detected the <a href="/faintest">faintest galaxy</a> ever recorded, a finding published <a href="/nature">in Nature</a> on Tuesday. The galaxy, designated <a href="/jades">JADES-GS-z14-0</a>, formed just 290 million years after the <a href="/big-bang">Big Bang</a>, making it one of the <a href="/earliest">earliest known objects</a> in the universe.</p>
    <p>The discovery relied on <a href="/nircam">NIRCam</a> observations combined with <a href="/spectroscopy">spectroscopic follow-up</a> from the telescope's <a href="/nirspec">NIRSpec</a> instrument. The team says the galaxy's <a href="/redshift">redshift</a> of 14.3 breaks the <a href="/record">previous record</a> by a significant margin.</p>
    <p>"We are looking at the <a href="/cosmic-dawn">cosmic dawn</a>," said <a href="/dr-roberts">Dr. Elena Roberts</a> of the <a href="/cambridge">University of Cambridge</a>, lead author of the study. "This galaxy is <a href="/bright">surprisingly bright</a> for its age, which suggests <a href="/star-formation">star formation</a> began earlier than <a href="/models">theoretical models</a> predicted."</p>
    <p>Follow-up <a href="/observations">observations</a> are scheduled for the <a href="/next-cycle">next observing cycle</a>, as astronomers hope to <a href="/reionization">understand reionization</a> — the epoch when the <a href="/first-stars">first stars</a> reionized the <a href="/medium">intergalactic medium</a>.</p>
  </article>
</main>
<footer>SciWire © 2026 · <a href="/about">About</a></footer>
</body>
</html>`,
  },
  {
    id: 'biztimes',
    name: 'BizTimes',
    url: 'https://biztimes.example.com/chip-market-rebound',
    category: 'business',
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Global Chip Market Rebounds as AI Demand Surges | BizTimes</title></head>
<body>
<header>BizTimes <nav><a href="/markets">Markets</a><a href="/economy">Economy</a><a href="/tech">Tech</a></nav></header>
<div class="ad">Advertisement: Trade smarter with ACME Brokerage</div>
<main>
  <article>
    <h1>Global Chip Market Rebounds as AI Demand Surges</h1>
    <p>The global semiconductor market grew 18 percent in the first quarter, its strongest quarter in three years, driven by explosive demand for AI accelerators and data center hardware.</p>
    <p>Revenue at the top five chipmakers rose to a combined $142 billion, beating analyst expectations. Shares of leading manufacturers jumped 6 to 9 percent on the earnings reports.</p>
    <p>"The AI buildout is real and it is accelerating," said analyst James Whitfield of Meridian Capital. "Every hyperscaler is doubling down on GPU capacity, and the supply chain is finally catching up."</p>
    <p>Memory makers reported the sharpest recovery, with prices for high-bandwidth memory up 40 percent year over year. Foundries, meanwhile, are running at near-full utilization, and several announced new fab construction in Arizona and Germany.</p>
    <p>Investors are watching whether the momentum can hold into the second half, with some warning of an inventory glut if AI capex slows.</p>
  </article>
</main>
<footer>© 2026 BizTimes</footer>
</body>
</html>`,
  },
  {
    id: 'worldwire',
    name: 'WorldWire',
    url: 'https://worldwire.example.com/pacific-climate-deal',
    category: 'world',
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Pacific Island Nations Sign Historic Climate Deal | WorldWire</title></head>
<body>
<nav><a href="/world">World</a><a href="/asia">Asia</a><a href="/europe">Europe</a><a href="/americas">Americas</a></nav>
<main>
  <article>
    <h1>Pacific Island Nations Sign Historic Climate Deal</h1>
    <p>Leaders of fourteen Pacific island nations signed a landmark agreement on Wednesday, committing to a regional framework for sea-level adaptation and renewable energy investment worth $9 billion over the next decade.</p>
    <p>The summit, hosted in Suva, Fiji, brought together heads of government, finance ministers and climate negotiators. Under the deal, participating nations will jointly fund coastal defenses, early-warning systems and a regional renewable grid.</p>
    <p>"This is the most consequential agreement our region has ever signed," said the summit's chair in the closing statement. "We are turning policy commitments into concrete, funded action."</p>
    <p>Several development banks and donor governments pledged matching contributions, though details on disbursement schedules remain to be worked out in bilateral talks.</p>
    <p>Environmental groups welcomed the deal but urged faster implementation, noting that projected sea-level rise threatens to displace millions in the region within decades.</p>
  </article>
</main>
<footer>WorldWire © 2026</footer>
</body>
</html>`,
  },
  {
    id: 'sportnet',
    name: 'SportNet',
    url: 'https://sportnet.example.com/worldcup-upset',
    category: 'sports',
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Underdogs Stun Favorites in World Cup Qualifier | SportNet</title></head>
<body>
<header>SportNet <nav><a href="/football">Football</a><a href="/basketball">Basketball</a><a href="/tennis">Tennis</a><a href="/formula1">F1</a></nav></header>
<main>
  <article>
    <h1>Underdogs Stun Favorites in World Cup Qualifier</h1>
    <p>In one of the biggest upsets of the qualifying campaign, the home side came from two goals down to beat the tournament favorites 3-2 in front of a raucous 74,000-strong crowd.</p>
    <p>The visitors dominated the first half, with their captain scoring twice before the break. But a double substitution at halftime changed the game — the team pressed higher, and an own goal plus two clinical finishes completed the remarkable comeback.</p>
    <p>"I told the players at halftime that we had nothing to lose," the coach said afterward. "This group showed the character of champions tonight."</p>
    <p>The result shakes up Group B, with the favorites now needing a win in their final qualifier to guarantee a place at the tournament next summer.</p>
    <p>Ticket sales for the decisive match, already sold out, are expected to see record resale prices.</p>
  </article>
</main>
<footer>© 2026 SportNet</footer>
</body>
</html>`,
  },
];

module.exports = { LIVE_SOURCES, SAMPLE_PAGES };
