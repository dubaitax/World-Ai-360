/* ═══════════════════════════════════════════════════
   WORLD AI 360 — script.js
   Gemini AI-powered global travel explorer
   ═══════════════════════════════════════════════════ */

'use strict';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Replace with your Gemini API key or inject via GitHub Actions / env variable
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
const GEMINI_MODEL   = 'gemini-2.0-flash';
const UNSPLASH_SOURCE = 'https://source.unsplash.com/featured/800x500?';

// ─── STATE ────────────────────────────────────────────────────────────────────
let selectedTripType   = 'Backpacker';
let selectedBudget     = 'Budget ($)';
let currentQuery       = '';
let isLoading          = false;

// ─── TRENDING DESTINATIONS ────────────────────────────────────────────────────
const trendingDestinations = [
  { name: 'Bali, Indonesia',      region: 'Southeast Asia', emoji: '🌴', tag: 'Trending #1',  query: 'Complete travel guide to Bali Indonesia' },
  { name: 'Kyoto, Japan',         region: 'East Asia',      emoji: '⛩️', tag: 'Trending #2',  query: 'Complete travel guide to Kyoto Japan' },
  { name: 'Santorini, Greece',    region: 'Mediterranean',  emoji: '🇬🇷', tag: 'Trending #3',  query: 'Complete travel guide to Santorini Greece' },
  { name: 'Marrakech, Morocco',   region: 'North Africa',   emoji: '🕌', tag: 'Trending #4',  query: 'Complete travel guide to Marrakech Morocco' },
  { name: 'Patagonia, Argentina', region: 'South America',  emoji: '🏔️', tag: 'Rising Fast',  query: 'Complete travel guide to Patagonia Argentina' },
  { name: 'Amalfi Coast, Italy',  region: 'Mediterranean',  emoji: '🤌', tag: 'Must Visit',   query: 'Complete travel guide to Amalfi Coast Italy' },
  { name: 'Queenstown, NZ',       region: 'Oceania',        emoji: '🏕️', tag: 'Adventure',    query: 'Complete travel guide to Queenstown New Zealand' },
  { name: 'Iceland',              region: 'Northern Europe', emoji: '🌋', tag: 'Unique',       query: 'Complete travel guide to Iceland' },
];

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initCursor();
  initHeader();
  initSearchInput();
  initOptionPills();
  initQuickPills();
  renderTrending();
});

// ─── LOADER ───────────────────────────────────────────────────────────────────
function initLoader() {
  const loader = document.getElementById('loader');
  setTimeout(() => loader.classList.add('hidden'), 1800);
}

// ─── CUSTOM CURSOR ────────────────────────────────────────────────────────────
function initCursor() {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left  = mouseX + 'px';
    dot.style.top   = mouseY + 'px';
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll('a, button, .pill, .opt-pill, .trending-card, .related-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

// ─── HEADER SCROLL ───────────────────────────────────────────────────────────
function initHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// ─── SEARCH INPUT ─────────────────────────────────────────────────────────────
function initSearchInput() {
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('searchClear');

  input.addEventListener('input', () => {
    clear.classList.toggle('visible', input.value.length > 0);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !isLoading) handleSearch();
  });
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('searchClear');
  input.value = '';
  clear.classList.remove('visible');
  input.focus();
}

// ─── OPTION PILLS ─────────────────────────────────────────────────────────────
function initOptionPills() {
  document.querySelectorAll('.opt-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const type = pill.dataset.type;
      document.querySelectorAll(`.opt-pill[data-type="${type}"]`).forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      if (type === 'trip')   selectedTripType = pill.textContent.replace(/^[^\w]+/, '').trim();
      if (type === 'budget') selectedBudget   = pill.textContent.replace(/^[^\w]+/, '').trim();
    });
  });
}

// ─── QUICK PILLS ─────────────────────────────────────────────────────────────
function initQuickPills() {
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const query = pill.dataset.query;
      const input = document.getElementById('searchInput');
      input.value = query;
      document.getElementById('searchClear').classList.add('visible');
      scrollToSearch();
      setTimeout(() => handleSearch(), 400);
    });
  });
}

// ─── TRENDING GRID ────────────────────────────────────────────────────────────
function renderTrending() {
  const grid = document.getElementById('trendingGrid');
  if (!grid) return;
  grid.innerHTML = trendingDestinations.map((dest, i) => `
    <div class="trending-card" onclick="searchFromCard('${dest.query}')">
      <div class="trending-num">${i + 1}</div>
      <div class="trending-img-placeholder">${dest.emoji}</div>
      <div class="trending-body">
        <div class="trending-badge">${dest.tag}</div>
        <div class="trending-name">${dest.name}</div>
        <div class="trending-sub">${dest.region}</div>
      </div>
    </div>
  `).join('');
}

function searchFromCard(query) {
  const input = document.getElementById('searchInput');
  input.value = query;
  document.getElementById('searchClear').classList.add('visible');
  document.getElementById('explore').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => handleSearch(), 600);
}

// ─── SCROLL UTILS ─────────────────────────────────────────────────────────────
function scrollToSearch() {
  document.getElementById('explore').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => document.getElementById('searchInput').focus(), 500);
}

function resetSearch() {
  clearSearch();
  document.getElementById('resultContent').style.display = 'none';
  document.getElementById('resultError').style.display   = 'none';
  document.getElementById('resultLoading').style.display = 'none';
  document.getElementById('searchInput').focus();
}

// ─── MAIN SEARCH ─────────────────────────────────────────────────────────────
async function handleSearch() {
  const input = document.getElementById('searchInput');
  const query = input.value.trim();

  if (!query) {
    input.focus();
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 400);
    return;
  }

  if (isLoading) return;

  currentQuery = query;
  showLoading();

  const prompt = buildPrompt(query, selectedTripType, selectedBudget);

  try {
    const responseText = await callGemini(prompt);
    const parsed = parseResponse(responseText);
    renderResult(parsed, query);
  } catch (err) {
    showError(err.message || 'Unknown error occurred.');
    console.error('Gemini Error:', err);
  }
}

// ─── GEMINI API CALL ─────────────────────────────────────────────────────────
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
   const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
      topP: 0.95,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini.');
  return text;
}

// ─── PROMPT BUILDER ──────────────────────────────────────────────────────────
function buildPrompt(query, tripType, budget) {
  return `You are World AI 360 — the world's most comprehensive travel intelligence system. 
A user is asking about: "${query}"
Trip type: ${tripType} | Budget: ${budget}

Respond ONLY with a valid JSON object (no markdown, no backticks, no extra text).
The JSON must follow this exact structure:

{
  "destination": "Full Destination Name",
  "country": "Country",
  "region": "Continent/Region",
  "tagline": "One-line poetic description of the destination",
  "flag": "🌍",
  "searchImageTerms": ["term1 travel", "term2 landscape", "term3 culture"],
  "quickInfo": [
    { "icon": "🌡️", "label": "Best Season", "value": "Oct–Apr", "sub": "Warm & dry" },
    { "icon": "💰", "label": "Daily Budget", "value": "$40–$80", "sub": "Mid-range" },
    { "icon": "✈️", "label": "Avg Flight", "value": "$800–$1200", "sub": "From US/Europe" },
    { "icon": "🛂", "label": "Visa", "value": "Visa on Arrival", "sub": "30 days" },
    { "icon": "🗣️", "label": "Language", "value": "Bahasa/English", "sub": "English common" },
    { "icon": "⏱️", "label": "Ideal Stay", "value": "7–14 days", "sub": "Recommended" }
  ],
  "seasons": [
    { "name": "Winter", "months": "Dec – Feb", "desc": "Short description of weather and conditions", "best": false },
    { "name": "Spring", "months": "Mar – May", "desc": "Short description", "best": true },
    { "name": "Summer", "months": "Jun – Aug", "desc": "Short description", "best": false },
    { "name": "Autumn", "months": "Sep – Nov", "desc": "Short description", "best": false }
  ],
  "aiResponse": "Write a comprehensive 600–900 word markdown-formatted travel guide here. Include sections with ### headers: Overview, Top Attractions, Getting There, Local Food & Culture, Hidden Gems, Practical Tips. Use **bold** for key points. Be vivid, informative, and inspiring.",
  "budgetBreakdown": [
    {
      "tier": "Budget",
      "pricePerDay": "$25–$45",
      "featured": false,
      "items": [
        { "label": "Accommodation", "value": "$8–$15" },
        { "label": "Food", "value": "$6–$10" },
        { "label": "Transport", "value": "$3–$8" },
        { "label": "Activities", "value": "$5–$12" }
      ]
    },
    {
      "tier": "Mid-Range",
      "pricePerDay": "$60–$120",
      "featured": true,
      "items": [
        { "label": "Accommodation", "value": "$30–$60" },
        { "label": "Food", "value": "$15–$25" },
        { "label": "Transport", "value": "$8–$15" },
        { "label": "Activities", "value": "$10–$20" }
      ]
    },
    {
      "tier": "Luxury",
      "pricePerDay": "$200–$500+",
      "featured": false,
      "items": [
        { "label": "Accommodation", "value": "$100–$300" },
        { "label": "Food", "value": "$40–$80" },
        { "label": "Transport", "value": "$30–$60" },
        { "label": "Activities", "value": "$30–$60" }
      ]
    }
  ],
  "tips": [
    "Pro tip 1 specific to this destination",
    "Pro tip 2 about timing or money saving",
    "Pro tip 3 about local customs",
    "Pro tip 4 about safety or health",
    "Pro tip 5 about transportation",
    "Pro tip 6 about hidden gems"
  ],
  "related": [
    { "name": "Destination 1", "country": "Country", "desc": "Why visit", "emoji": "🌏", "query": "travel guide destination 1" },
    { "name": "Destination 2", "country": "Country", "desc": "Why visit", "emoji": "🏝️", "query": "travel guide destination 2" },
    { "name": "Destination 3", "country": "Country", "desc": "Why visit", "emoji": "🗺️", "query": "travel guide destination 3" }
  ]
}

Make ALL data accurate and specific to the destination. Tailor all cost estimates to the ${budget} budget preference and ${tripType} travel style.`;
}

// ─── RESPONSE PARSER ─────────────────────────────────────────────────────────
function parseResponse(text) {
  let clean = text.trim();
  // Strip ```json ... ``` fences if present
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(clean);
}

// ─── RENDER RESULT ────────────────────────────────────────────────────────────
function renderResult(data, originalQuery) {
  // ── Images ──
  const imgGrid = document.getElementById('destImageGrid');
  const terms   = data.searchImageTerms || [data.destination, data.country, 'travel'];
  imgGrid.innerHTML = terms.slice(0, 3).map(term =>
    `<img src="${UNSPLASH_SOURCE}${encodeURIComponent(term)}&sig=${Math.random()}" alt="${term}" loading="lazy" onerror="this.style.background='#1A2130'">`
  ).join('');

  // ── Dest header ──
  document.getElementById('destBadge').textContent    = `${data.flag || '🌍'} ${data.region || data.country}`;
  document.getElementById('destName').textContent     = data.destination;
  document.getElementById('destTagline').textContent  = data.tagline;

  const metaItems = [
    { icon: '🌐', label: data.country },
    { icon: '✈️', label: (data.quickInfo?.find(q => q.label === 'Avg Flight') || {}).value || '' },
    { icon: '📅', label: (data.quickInfo?.find(q => q.label === 'Best Season') || {}).value || '' },
  ].filter(m => m.label);

  document.getElementById('destMeta').innerHTML = metaItems.map(m =>
    `<div class="dest-meta-item">${m.icon} <span>${m.label}</span></div>`
  ).join('');

  // ── Info cards ──
  const infoGrid = document.getElementById('infoGrid');
  infoGrid.innerHTML = (data.quickInfo || []).map((item, i) =>
    `<div class="info-card" style="animation-delay:${i * 0.05}s">
      <div class="info-card-icon">${item.icon}</div>
      <div class="info-card-label">${item.label}</div>
      <div class="info-card-value">${item.value}</div>
      <div class="info-card-sub">${item.sub}</div>
    </div>`
  ).join('');

  // ── Seasons ──
  const seasonGrid = document.getElementById('seasonGrid');
  seasonGrid.innerHTML = (data.seasons || []).map((s, i) =>
    `<div class="season-card${s.best ? ' best' : ''}" style="animation-delay:${i * 0.07}s">
      <div class="season-name">${s.name}</div>
      <div class="season-months">${s.months}</div>
      <div class="season-desc">${s.desc}</div>
      ${s.best ? '<div class="season-badge">⭐ Best Time</div>' : ''}
    </div>`
  ).join('');

  // ── AI body ──
  document.getElementById('aiBody').innerHTML = markdownToHtml(data.aiResponse || '');

  // ── Budget ──
  const budgetGrid = document.getElementById('budgetGrid');
  budgetGrid.innerHTML = (data.budgetBreakdown || []).map((b, i) =>
    `<div class="budget-card${b.featured ? ' featured' : ''}" style="animation-delay:${i * 0.08}s">
      <div class="budget-tier">${b.tier}</div>
      <div class="budget-price">${b.pricePerDay}</div>
      <div class="budget-per">per person / day</div>
      ${(b.items || []).map(item =>
        `<div class="budget-item"><span>${item.label}</span><strong>${item.value}</strong></div>`
      ).join('')}
    </div>`
  ).join('');

  // ── Tips ──
  const tipsList = document.getElementById('tipsList');
  tipsList.innerHTML = (data.tips || []).map((tip, i) =>
    `<div class="tip-item" style="animation-delay:${i * 0.05}s">
      <div class="tip-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="tip-text">${tip}</div>
    </div>`
  ).join('');

  // ── Related ──
  const relatedGrid = document.getElementById('relatedGrid');
  relatedGrid.innerHTML = (data.related || []).map((r, i) =>
    `<div class="related-card" style="animation-delay:${i * 0.07}s" onclick="searchFromCard('${escapeAttr(r.query)}')">
      <div class="related-flag">${r.emoji}</div>
      <div class="related-name">${r.name}</div>
      <div class="related-desc">${r.country} — ${r.desc}</div>
    </div>`
  ).join('');

  showResult();

  // Scroll to results
  setTimeout(() => {
    document.getElementById('resultContent').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

// ─── MARKDOWN → HTML ─────────────────────────────────────────────────────────
function markdownToHtml(md) {
  if (!md) return '';
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hup])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

// ─── ATTR ESCAPE ─────────────────────────────────────────────────────────────
function escapeAttr(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ─── UI STATE ─────────────────────────────────────────────────────────────────
function showLoading() {
  isLoading = true;
  const btn = document.getElementById('searchBtn');
  btn.disabled = true;
  btn.classList.add('loading');
  btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Exploring the World...</span>`;

  document.getElementById('resultContent').style.display = 'none';
  document.getElementById('resultError').style.display   = 'none';
  document.getElementById('resultLoading').style.display = 'block';
}

function showResult() {
  isLoading = false;
  resetBtn();
  document.getElementById('resultLoading').style.display = 'none';
  document.getElementById('resultError').style.display   = 'none';
  document.getElementById('resultContent').style.display = 'block';
}

function showError(msg) {
  isLoading = false;
  resetBtn();
  document.getElementById('resultLoading').style.display = 'none';
  document.getElementById('resultContent').style.display = 'none';
  document.getElementById('errorMessage').textContent    = msg;
  document.getElementById('resultError').style.display   = 'block';
}

function resetBtn() {
  const btn = document.getElementById('searchBtn');
  btn.disabled = false;
  btn.classList.remove('loading');
  btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span>Explore with AI</span>`;
}

// ─── GSAP-LIKE SCROLL ANIMATIONS (pure CSS/IntersectionObserver) ───────────────
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

function observeElements(selector) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(32px)';
    el.style.transition = `opacity 0.6s ${i * 0.08}s ease, transform 0.6s ${i * 0.08}s ease`;
    io.observe(el);
  });
}

window.addEventListener('load', () => {
  observeElements('.feature-card');
  observeElements('.trending-card');
  observeElements('.section-header');
});
