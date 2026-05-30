/* ═══════════════════════════════════════════════════
   WORLD AI 360 — script.js
   Gemini AI-powered global travel explorer
   ═══════════════════════════════════════════════════ */

'use strict';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Replace with your Gemini API key or inject via GitHub Actions / env variable
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
const GEMINI_MODEL   = 'gemini-3-flash-preview';
const UNSPLASH_SOURCE = 'https://picsum.photos/seed/';


// ─── CURRENCY DATA ────────────────────────────────────────────────────────────
// Rates relative to USD (approximate, updated manually or via API)
const CURRENCIES = {
  USD: { symbol: '$',   name: 'US Dollar',        flag: '🇺🇸', rate: 1       },
  EUR: { symbol: '€',   name: 'Euro',              flag: '🇪🇺', rate: 0.92   },
  GBP: { symbol: '£',   name: 'British Pound',     flag: '🇬🇧', rate: 0.79   },
  INR: { symbol: '₹',   name: 'Indian Rupee',      flag: '🇮🇳', rate: 83.5   },
  JPY: { symbol: '¥',   name: 'Japanese Yen',      flag: '🇯🇵', rate: 149.5  },
  AED: { symbol: 'د.إ', name: 'UAE Dirham',        flag: '🇦🇪', rate: 3.67   },
  SGD: { symbol: 'S$',  name: 'Singapore Dollar',  flag: '🇸🇬', rate: 1.34   },
  AUD: { symbol: 'A$',  name: 'Australian Dollar', flag: '🇦🇺', rate: 1.53   },
  CAD: { symbol: 'C$',  name: 'Canadian Dollar',   flag: '🇨🇦', rate: 1.36   },
  CHF: { symbol: 'Fr',  name: 'Swiss Franc',       flag: '🇨🇭', rate: 0.90   },
  BRL: { symbol: 'R$',  name: 'Brazilian Real',    flag: '🇧🇷', rate: 4.97   },
  MXN: { symbol: 'MX$', name: 'Mexican Peso',      flag: '🇲🇽', rate: 17.15  },
  THB: { symbol: '฿',   name: 'Thai Baht',         flag: '🇹🇭', rate: 35.1   },
  IDR: { symbol: 'Rp',  name: 'Indonesian Rupiah', flag: '🇮🇩', rate: 15650  },
  NPR: { symbol: '₨',   name: 'Nepali Rupee',      flag: '🇳🇵', rate: 133.5  },
  PKR: { symbol: '₨',   name: 'Pakistani Rupee',   flag: '🇵🇰', rate: 278    },
  BDT: { symbol: '৳',   name: 'Bangladeshi Taka',  flag: '🇧🇩', rate: 110    },
  LKR: { symbol: '₨',   name: 'Sri Lankan Rupee',  flag: '🇱🇰', rate: 305    },
  KRW: { symbol: '₩',   name: 'South Korean Won',  flag: '🇰🇷', rate: 1335   },
  CNY: { symbol: '¥',   name: 'Chinese Yuan',      flag: '🇨🇳', rate: 7.24   },
  SAR: { symbol: '﷼',   name: 'Saudi Riyal',       flag: '🇸🇦', rate: 3.75   },
  ZAR: { symbol: 'R',   name: 'South African Rand',flag: '🇿🇦', rate: 18.6   },
  TRY: { symbol: '₺',   name: 'Turkish Lira',      flag: '🇹🇷', rate: 32.1   },
  RUB: { symbol: '₽',   name: 'Russian Ruble',     flag: '🇷🇺', rate: 92.5   },
  NGN: { symbol: '₦',   name: 'Nigerian Naira',    flag: '🇳🇬', rate: 1580   },
  EGP: { symbol: 'E£',  name: 'Egyptian Pound',    flag: '🇪🇬', rate: 30.9   },
};

// ─── STATE ────────────────────────────────────────────────────────────────────
let selectedTripType = 'Backpacker';
let selectedBudget   = 'Budget ($)';
let selectedCurrency = 'USD';
let currentQuery     = '';
let isLoading        = false;
let lastParsedData   = null; // store raw USD data for re-rendering on currency change

// ─── TRENDING DESTINATIONS ────────────────────────────────────────────────────
const trendingDestinations = [
  { name: 'Bali, Indonesia',      region: 'Southeast Asia',  emoji: '🌴', tag: 'Trending #1', query: 'Complete travel guide to Bali Indonesia' },
  { name: 'Kyoto, Japan',         region: 'East Asia',       emoji: '⛩️', tag: 'Trending #2', query: 'Complete travel guide to Kyoto Japan' },
  { name: 'Santorini, Greece',    region: 'Mediterranean',   emoji: '🇬🇷', tag: 'Trending #3', query: 'Complete travel guide to Santorini Greece' },
  { name: 'Marrakech, Morocco',   region: 'North Africa',    emoji: '🕌', tag: 'Trending #4', query: 'Complete travel guide to Marrakech Morocco' },
  { name: 'Patagonia, Argentina', region: 'South America',   emoji: '🏔️', tag: 'Rising Fast', query: 'Complete travel guide to Patagonia Argentina' },
  { name: 'Amalfi Coast, Italy',  region: 'Mediterranean',   emoji: '🤌', tag: 'Must Visit',  query: 'Complete travel guide to Amalfi Coast Italy' },
  { name: 'Queenstown, NZ',       region: 'Oceania',         emoji: '🏕️', tag: 'Adventure',   query: 'Complete travel guide to Queenstown New Zealand' },
  { name: 'Iceland',              region: 'Northern Europe', emoji: '🌋', tag: 'Unique',      query: 'Complete travel guide to Iceland' },
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
  initCurrencySelector();
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
    mouseX = e.clientX; mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
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

// ─── CURRENCY SELECTOR ───────────────────────────────────────────────────────
function initCurrencySelector() {
  const sel = document.getElementById('currencySelect');
  if (!sel) return;

  // Populate options
  Object.entries(CURRENCIES).forEach(([code, c]) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = `${c.flag} ${code} — ${c.name}`;
    if (code === 'USD') opt.selected = true;
    sel.appendChild(opt);
  });

  sel.addEventListener('change', () => {
    selectedCurrency = sel.value;
    updateCurrencyDisplay();
  });
}

function updateCurrencyDisplay() {
  // Update the currency badge in header
  const badge = document.getElementById('currencyBadge');
  if (badge) {
    const c = CURRENCIES[selectedCurrency];
    badge.textContent = `${c.flag} ${selectedCurrency}`;
  }

  // Re-render budget if data exists
  if (lastParsedData) {
    renderBudget(lastParsedData.budgetBreakdown);
    renderQuickInfo(lastParsedData.quickInfo);
    renderDestMeta(lastParsedData);
  }

  // Close dropdown
  document.getElementById('currencyDropdown')?.classList.remove('open');
}

// Convert a USD dollar string like "$25–$45" or "$1,200" to selected currency
function convertPriceStr(str) {
  const c    = CURRENCIES[selectedCurrency];
  const rate = c.rate;
  const sym  = c.symbol;

  // Match patterns like $25–$45, $1,200, $800–$1400, $500+
  return str.replace(/\$[\d,]+(\+)?/g, (match) => {
    const isPlus = match.endsWith('+');
    const num    = parseFloat(match.replace(/[$,+]/g, ''));
    const converted = Math.round(num * rate);
    const formatted = formatNumber(converted);
    return sym + formatted + (isPlus ? '+' : '');
  });
}

function formatNumber(n) {
  if (n >= 10000)  return (n / 1000).toFixed(0) + 'K';
  if (n >= 1000)   return n.toLocaleString();
  return n.toString();
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
  lastParsedData = null;
  document.getElementById('resultContent').style.display = 'none';
  document.getElementById('resultError').style.display   = 'none';
  document.getElementById('resultLoading').style.display = 'none';
  document.getElementById('searchInput').focus();
}

// ─── MAIN SEARCH ─────────────────────────────────────────────────────────────
async function handleSearch() {
  const input = document.getElementById('searchInput');
  const query = input.value.trim();
  if (!query) { input.focus(); return; }
  if (isLoading) return;

  currentQuery = query;
  showLoading();

  const prompt = buildPrompt(query, selectedTripType, selectedBudget);

  try {
    const responseText = await callGemini(prompt);
    const parsed       = parseResponse(responseText);
    lastParsedData     = parsed;
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
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096, topP: 0.95 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ]
  };

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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

IMPORTANT: All monetary values MUST be in USD (US Dollars) using $ symbol. The app will convert to other currencies automatically.

Respond ONLY with a valid JSON object (no markdown, no backticks, no extra text).

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
    { "name": "Winter", "months": "Dec – Feb", "desc": "Short description", "best": false },
    { "name": "Spring", "months": "Mar – May", "desc": "Short description", "best": true },
    { "name": "Summer", "months": "Jun – Aug", "desc": "Short description", "best": false },
    { "name": "Autumn", "months": "Sep – Nov", "desc": "Short description", "best": false }
  ],
  "aiResponse": "600–900 word markdown travel guide. Sections: ### Overview, ### Top Attractions, ### Getting There, ### Local Food & Culture, ### Hidden Gems, ### Practical Tips. Use **bold** for key points.",
  "budgetBreakdown": [
    {
      "tier": "Budget", "pricePerDay": "$25–$45", "featured": false,
      "items": [
        { "label": "Accommodation", "value": "$8–$15" },
        { "label": "Food", "value": "$6–$10" },
        { "label": "Transport", "value": "$3–$8" },
        { "label": "Activities", "value": "$5–$12" }
      ]
    },
    {
      "tier": "Mid-Range", "pricePerDay": "$60–$120", "featured": true,
      "items": [
        { "label": "Accommodation", "value": "$30–$60" },
        { "label": "Food", "value": "$15–$25" },
        { "label": "Transport", "value": "$8–$15" },
        { "label": "Activities", "value": "$10–$20" }
      ]
    },
    {
      "tier": "Luxury", "pricePerDay": "$200–$500+", "featured": false,
      "items": [
        { "label": "Accommodation", "value": "$100–$300" },
        { "label": "Food", "value": "$40–$80" },
        { "label": "Transport", "value": "$30–$60" },
        { "label": "Activities", "value": "$30–$60" }
      ]
    }
  ],
  "tips": ["tip1","tip2","tip3","tip4","tip5","tip6"],
  "related": [
    { "name": "Dest 1", "country": "Country", "desc": "Why visit", "emoji": "🌏", "query": "travel guide dest 1" },
    { "name": "Dest 2", "country": "Country", "desc": "Why visit", "emoji": "🏝️", "query": "travel guide dest 2" },
    { "name": "Dest 3", "country": "Country", "desc": "Why visit", "emoji": "🗺️", "query": "travel guide dest 3" }
  ]
}

All prices must be realistic USD values for the destination. Tailor to ${budget} budget and ${tripType} style.`;
}

// ─── RESPONSE PARSER ─────────────────────────────────────────────────────────
function parseResponse(text) {
  let clean = text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');
  return JSON.parse(clean);
}

// ─── RENDER RESULT ────────────────────────────────────────────────────────────
function renderResult(data, originalQuery) {
  // Images
  const imgGrid = document.getElementById('destImageGrid');
  const terms   = data.searchImageTerms || [data.destination, data.country, 'travel'];
  imgGrid.innerHTML = terms.slice(0, 3).map(term =>
    `<img src="${UNSPLASH_SOURCE}${encodeURIComponent(term)}/800/500" alt="${term}" loading="lazy" onerror="this.style.background='#1A2130'">`
  ).join('');

  // Dest header
  document.getElementById('destBadge').textContent   = `${data.flag || '🌍'} ${data.region || data.country}`;
  document.getElementById('destName').textContent    = data.destination;
  document.getElementById('destTagline').textContent = data.tagline;
  renderDestMeta(data);

  // Info cards
  renderQuickInfo(data.quickInfo);

  // Seasons
  const seasonGrid = document.getElementById('seasonGrid');
  seasonGrid.innerHTML = (data.seasons || []).map((s, i) =>
    `<div class="season-card${s.best ? ' best' : ''}" style="animation-delay:${i * 0.07}s">
      <div class="season-name">${s.name}</div>
      <div class="season-months">${s.months}</div>
      <div class="season-desc">${s.desc}</div>
      ${s.best ? '<div class="season-badge">⭐ Best Time</div>' : ''}
    </div>`
  ).join('');

  // AI body
  document.getElementById('aiBody').innerHTML = markdownToHtml(data.aiResponse || '');

  // Budget with currency
  renderBudget(data.budgetBreakdown);

  // Tips
  const tipsList = document.getElementById('tipsList');
  tipsList.innerHTML = (data.tips || []).map((tip, i) =>
    `<div class="tip-item" style="animation-delay:${i * 0.05}s">
      <div class="tip-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="tip-text">${tip}</div>
    </div>`
  ).join('');

  // Related
  const relatedGrid = document.getElementById('relatedGrid');
  relatedGrid.innerHTML = (data.related || []).map((r, i) =>
    `<div class="related-card" style="animation-delay:${i * 0.07}s" onclick="searchFromCard('${escapeAttr(r.query)}')">
      <div class="related-flag">${r.emoji}</div>
      <div class="related-name">${r.name}</div>
      <div class="related-desc">${r.country} — ${r.desc}</div>
    </div>`
  ).join('');

  showResult();
  setTimeout(() => {
    document.getElementById('resultContent').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

function renderDestMeta(data) {
  const flightInfo  = (data.quickInfo?.find(q => q.label === 'Avg Flight') || {});
  const seasonInfo  = (data.quickInfo?.find(q => q.label === 'Best Season') || {});
  const flightVal   = flightInfo.value ? convertPriceStr(flightInfo.value) : '';
  const metaItems   = [
    { icon: '🌐', label: data.country },
    { icon: '✈️', label: flightVal },
    { icon: '📅', label: seasonInfo.value || '' },
  ].filter(m => m.label);
  document.getElementById('destMeta').innerHTML = metaItems.map(m =>
    `<div class="dest-meta-item">${m.icon} <span>${m.label}</span></div>`
  ).join('');
}

function renderQuickInfo(quickInfo) {
  const infoGrid = document.getElementById('infoGrid');
  infoGrid.innerHTML = (quickInfo || []).map((item, i) => {
    // Convert monetary values in Daily Budget and Avg Flight cards
    const isMonetary = item.label === 'Daily Budget' || item.label === 'Avg Flight';
    const value      = isMonetary ? convertPriceStr(item.value) : item.value;
    return `<div class="info-card" style="animation-delay:${i * 0.05}s">
      <div class="info-card-icon">${item.icon}</div>
      <div class="info-card-label">${item.label}</div>
      <div class="info-card-value">${value}</div>
      <div class="info-card-sub">${item.sub}</div>
    </div>`;
  }).join('');
}

function renderBudget(budgetBreakdown) {
  const c          = CURRENCIES[selectedCurrency];
  const budgetGrid = document.getElementById('budgetGrid');
  budgetGrid.innerHTML = (budgetBreakdown || []).map((b, i) =>
    `<div class="budget-card${b.featured ? ' featured' : ''}" style="animation-delay:${i * 0.08}s">
      <div class="budget-tier">${b.tier}</div>
      <div class="budget-price">${convertPriceStr(b.pricePerDay)}</div>
      <div class="budget-per">per person / day · ${c.flag} ${selectedCurrency}</div>
      ${(b.items || []).map(item =>
        `<div class="budget-item"><span>${item.label}</span><strong>${convertPriceStr(item.value)}</strong></div>`
      ).join('')}
    </div>`
  ).join('');
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

// ─── SCROLL ANIMATIONS ───────────────────────────────────────────────────────
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity   = '1';
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

// ─── CURRENCY DROPDOWN TOGGLE ────────────────────────────────────────────────
function toggleCurrencyDropdown() {
  const dd = document.getElementById('currencyDropdown');
  dd.classList.toggle('open');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.currency-wrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('currencyDropdown')?.classList.remove('open');
  }
});

  
