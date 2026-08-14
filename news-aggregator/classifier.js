/**
 * classifier.js — Lightweight keyword-based article classification.
 *
 * Scores each category by counting keyword hits in the headline + the
 * first ~800 chars of the body. Returns a primary category plus all
 * matched tags. Zero dependencies; easily replaced with an ML model or
 * an LLM call in production.
 *
 * Author: portfolio demo
 * License: MIT
 */

const CATEGORIES = {
  ai: {
    weight: 3,
    keywords: [
      'openai', 'gpt-5', 'gpt-4', 'gpt', 'chatgpt', 'llm', 'large language model',
      'machine learning', 'deep learning', 'neural network', 'artificial intelligence',
      'gemini', 'claude', 'anthropic', 'agentic', 'chatbot', 'model', 'inference',
      'transformer', 'fine-tuning',
    ],
  },
  tech: {
    weight: 2,
    keywords: [
      'chip', 'semiconductor', 'software', 'startup', 'app', 'platform', 'cloud',
      'developer', 'code', 'api', 'hardware', 'gadget', 'smartphone', 'computer',
      'database', 'server', 'robot', 'self-driving', 'crypto', 'blockchain',
      'cybersecurity', 'programming', 'javascript', 'python',
    ],
  },
  science: {
    weight: 2,
    keywords: [
      'telescope', 'galaxy', 'nasa', 'research', 'scientist', 'study', 'quantum',
      'particle', 'space', 'dna', 'climate', 'physics', 'biology', 'astronomer',
      'universe', 'star', 'planet', 'genome', 'vaccine', 'neutrino', 'redshift',
    ],
  },
  business: {
    weight: 2,
    keywords: [
      'market', 'revenue', 'shares', 'stock', 'earnings', 'economy', 'merger',
      'acquisition', 'investor', 'profit', 'sales', 'company', 'ceo', 'funding',
      'ipo', 'valuation', 'bank', 'quarter', 'quarterly', 'semiconductor market',
    ],
  },
  world: {
    weight: 1,
    keywords: [
      'election', 'government', 'minister', 'summit', 'policy', 'military',
      'president', 'war', 'peace', 'diplomat', 'country', 'nation', 'treaty',
      'sanction', 'parliament', 'vote', 'ambassador', 'climate deal', 'leader',
    ],
  },
  sports: {
    weight: 2,
    keywords: [
      'cup', 'match', 'league', 'championship', 'team', 'player', 'goal', 'season',
      'coach', 'tournament', 'olympic', 'football', 'basketball', 'tennis',
      'qualifier', 'stadium', 'comeback', 'upset', 'captain', 'halftime',
    ],
  },
};

/**
 * Classify an article.
 * @param {string} title - Headline.
 * @param {string} content - Article body.
 * @returns {{ primary: string, tags: string[] }}
 */
function classify(title, content) {
  const hay = ((title || '') + ' ' + (content || '').slice(0, 800)).toLowerCase();
  const scores = {};
  for (const [cat, cfg] of Object.entries(CATEGORIES)) {
    let score = 0;
    for (const kw of cfg.keywords) {
      if (hay.includes(kw)) score += cfg.weight;
    }
    if (score > 0) scores[cat] = score;
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return {
    primary: ranked.length ? ranked[0][0] : 'other',
    tags: ranked.map(([c]) => c),
  };
}

module.exports = { classify, CATEGORIES };
