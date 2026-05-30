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

const CURRENCIES = {
  USD: { symbol: '$',   name: 'US Dollar',         flag: '🇺🇸', rate: 1      },
  EUR: { symbol: '€',   name: 'Euro',               flag: '🇪🇺', rate: 0.92  },
  GBP: { symbol: '£',   name: 'British Pound',      flag: '🇬🇧', rate: 0.79  },
  INR: { symbol: '₹',   name: 'Indian Rupee',       flag: '🇮🇳', rate: 83.5  },
  JPY: { symbol: '¥',   name: 'Japanese Yen',       flag: '🇯🇵', rate: 149.5 },
  AED: { symbol: 'د.إ', name: 'UAE Dirham',         flag: '🇦🇪', rate: 3.67  },
  SGD: { symbol: 'S$',  name: 'Singapore Dollar',   flag: '🇸🇬', rate: 1.34  },
  AUD: { symbol: 'A$',  name: 'Australian Dollar',  flag: '🇦🇺', rate: 1.53  },
  CAD: { symbol: 'C$',  name: 'Canadian Dollar',    flag: '🇨🇦', rate: 1.36  },
  CHF: { symbol: 'Fr',  name: 'Swiss Franc',        flag: '🇨🇭', rate: 0.90  },
  BRL: { symbol: 'R$',  name: 'Brazilian Real',     flag: '🇧🇷', rate: 4.97  },
  MXN: { symbol: 'MX$', name: 'Mexican Peso',       flag: '🇲🇽', rate: 17.15 },
  THB: { symbol: '฿',   name: 'Thai Baht',          flag: '🇹🇭', rate: 35.1  },
  IDR: { symbol: 'Rp',  name: 'Indonesian Rupiah',  flag: '🇮🇩', rate: 15650 },
  NPR: { symbol: '₨',   name: 'Nepali Rupee',       flag: '🇳🇵', rate: 133.5 },
  PKR: { symbol: '₨',   name: 'Pakistani Rupee',    flag: '🇵🇰', rate: 278   },
  BDT: { symbol: '৳',   name: 'Bangladeshi Taka',   flag: '🇧🇩', rate: 110   },
  LKR: { symbol: '₨',   name: 'Sri Lankan Rupee',   flag: '🇱🇰', rate: 305   },
  KRW: { symbol: '₩',   name: 'South Korean Won',   flag: '🇰🇷', rate: 1335  },
  CNY: { symbol: '¥',   name: 'Chinese Yuan',       flag: '🇨🇳', rate: 7.24  },
  SAR: { symbol: '﷼',   name: 'Saudi Riyal',        flag: '🇸🇦', rate: 3.75  },
  ZAR: { symbol: 'R',   name: 'South African Rand', flag: '🇿🇦', rate: 18.6  },
  TRY: { symbol: '₺',   name: 'Turkish Lira',       flag: '🇹🇷', rate: 32.1  },
  RUB: { symbol: '₽',   name: 'Russian Ruble',      flag: '🇷🇺', rate: 92.5  },
  NGN: { symbol: '₦',   name: 'Nigerian Naira',     flag: '🇳🇬', rate: 1580  },
  EGP: { symbol: 'E£',  name: 'Egyptian Pound',     flag: '🇪🇬', rate: 30.9  },
};

let selectedTripType = 'Backpacker';
let selectedBudget   = 'Budget ($)';
let selectedCurrency = 'USD';
let currentQuery     = '';
let isLoading        = false;
let lastParsedData   = null;

const trendingDestinations = [
  { name: 'Bali, Indonesia',      region: 'Southeast Asia',  emoji: '🌴', tag: 'Trending #1', query: 'Complete travel guide to Bali Indonesia' },
  { name: 'Kyoto, Japan',         region: 'East Asia',       emoji: '⛩️', tag: 'Trending #2', query: 'Complete travel guide to Kyoto Japan' },
  { name: 'Santorini, Greece',    region: 'Mediterranean',   emoji: '🇬🇷', tag: 'Trending #3', query: 'Complete travel guide to Santorini Greece' },
  { name: 'Marrakech, Morocco',   region: 'North Africa',    emoji: '🕌',  tag: 'Trending #4', query: 'Complete travel guide to Marrakech Morocco' },
  { name: 'Patagonia, Argentina', region: 'South America',   emoji: '🏔️', tag: 'Rising Fast', query: 'Complete travel guide to Patagonia Argentina' },
  { name: 'Amalfi Coast, Italy',  region: 'Mediterranean',   emoji: '🤌',  tag: 'Must Visit',  query: 'Complete travel guide to Amalfi Coast Italy' },
  { name: 'Queenstown, NZ',       region: 'Oceania',         emoji: '🏕️', tag: 'Adventure',   query: 'Complete travel guide to Queenstown New Zealand' },
  { name: 'Iceland',              region: 'Northern Europe', emoji: '🌋',  tag: 'Unique',      query: 'Complete travel guide to Iceland' },
];

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initLocationDetect();
  initCursor();
  initHeader();
  initSearchInput();
  initOptionPills();
  initQuickPills();
  renderTrending();
  initCurrencySelector();
});

// LOADER
function initLoader() {
  const loader = document.getElementById('loader');
  setTimeout(() => loader.classList.add('hidden'), 1800);
}

// LOCATION
function initLocationDetect() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos => {
      fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + pos.coords.latitude + '&longitude=' + pos.coords.longitude + '&localityLanguage=en')
        .then(r => r.json())
        .then(d => {
          const city    = d.city || d.locality || '';
          const country = d.countryName || '';
          if (city) {
            window._userLocation = { city, country };
            const inp = document.getElementById('searchInput');
            if (inp) inp.placeholder = "e.g. 'Best places near " + city + "' or any destination worldwide...";
            autoSetCurrency(d.countryCode);
          }
        })
        .catch(() => {});
    },
    () => {}
  );
}

function autoSetCurrency(countryCode) {
  const map = {
    IN:'INR', GB:'GBP', JP:'JPY', AU:'AUD', CA:'CAD', CH:'CHF',
    SG:'SGD', AE:'AED', SA:'SAR', BR:'BRL', MX:'MXN', TH:'THB',
    ID:'IDR', KR:'KRW', CN:'CNY', TR:'TRY', ZA:'ZAR', EG:'EGP',
    NG:'NGN', PK:'PKR', BD:'BDT', LK:'LKR', NP:'NPR', RU:'RUB'
  };
  const code = map[countryCode];
  if (code && CURRENCIES[code]) {
    selectedCurrency = code;
    const sel = document.getElementById('currencySelect');
    if (sel) sel.value = code;
    updateCurrencyDisplay();
  }
}

// CURSOR
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

// HEADER
function initHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// CURRENCY
function initCurrencySelector() {
  const sel = document.getElementById('currencySelect');
  if (!sel) return;
  Object.entries(CURRENCIES).forEach(function(entry) {
    var code = entry[0], c = entry[1];
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = c.flag + ' ' + code + ' — ' + c.name;
    if (code === 'USD') opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => {
    selectedCurrency = sel.value;
    updateCurrencyDisplay();
  });
}

function updateCurrencyDisplay() {
  const badge = document.getElementById('currencyBadge');
  if (badge) {
    const c = CURRENCIES[selectedCurrency];
    badge.textContent = c.flag + ' ' + selectedCurrency;
  }
  if (lastParsedData) {
    renderBudget(lastParsedData.budgetBreakdown);
    renderQuickInfo(lastParsedData.quickInfo);
    renderDestMeta(lastParsedData);
  }
  const dd = document.getElementById('currencyDropdown');
  if (dd) dd.classList.remove('open');
}

function convertPriceStr(str) {
  const c    = CURRENCIES[selectedCurrency];
  const rate = c.rate;
  const sym  = c.symbol;
  return str.replace(/\$[\d,]+(\+)?/g, function(match) {
    const isPlus    = match.endsWith('+');
    const num       = parseFloat(match.replace(/[$,+]/g, ''));
    const converted = Math.round(num * rate);
    const formatted = formatNumber(converted);
    return sym + formatted + (isPlus ? '+' : '');
  });
}

function formatNumber(n) {
  if (n >= 10000) return (n / 1000).toFixed(0) + 'K';
  if (n >= 1000)  return n.toLocaleString();
  return n.toString();
}

// SEARCH INPUT
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

// OPTION PILLS
function initOptionPills() {
  document.querySelectorAll('.opt-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const type = pill.dataset.type;
      document.querySelectorAll('.opt-pill[data-type="' + type + '"]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      if (type === 'trip')   selectedTripType = pill.textContent.replace(/^[^\w]+/, '').trim();
      if (type === 'budget') selectedBudget   = pill.textContent.replace(/^[^\w]+/, '').trim();
    });
  });
}

// QUICK PILLS
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

// TRENDING
function renderTrending() {
  const grid = document.getElementById('trendingGrid');
  if (!grid) return;
  grid.innerHTML = trendingDestinations.map((dest, i) =>
    '<div class="trending-card" onclick="searchFromCard(\'' + dest.query + '\')">' +
      '<div class="trending-num">' + (i + 1) + '</div>' +
      '<div class="trending-img-placeholder">' + dest.emoji + '</div>' +
      '<div class="trending-body">' +
        '<div class="trending-badge">' + dest.tag + '</div>' +
        '<div class="trending-name">' + dest.name + '</div>' +
        '<div class="trending-sub">' + dest.region + '</div>' +
      '</div>' +
    '</div>'
  ).join('');

  setTimeout(function() {
    document.querySelectorAll('.feature-card').forEach(function(card) {
      const title = (card.querySelector('h3') || {}).textContent || '';
      card.style.cursor = 'pointer';
      card.addEventListener('click', function() {
        var q = title.indexOf('Smart Itineraries')   >= 0 ? 'Best 7-day itinerary for a travel destination' :
                title.indexOf('Season Intelligence') >= 0 ? 'Best season to visit top world destinations'   :
                title.indexOf('Real Cost Estimates') >= 0 ? 'Budget travel tips worldwide'                  : '';
        if (q) {
          document.getElementById('searchInput').value = q;
          document.getElementById('searchClear').classList.add('visible');
          scrollToSearch();
          setTimeout(handleSearch, 400);
        }
      });
    });
  }, 600);
}

function searchFromCard(query) {
  const input = document.getElementById('searchInput');
  input.value = query;
  document.getElementById('searchClear').classList.add('visible');
  document.getElementById('explore').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => handleSearch(), 600);
}

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

// MAIN SEARCH
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

// GEMINI STREAMING
async function callGemini(prompt) {
  const url  = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':streamGenerateContent?alt=sse&key=' + GEMINI_API_KEY;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 3500, topP: 0.9 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err.error && err.error.message) || ('HTTP ' + res.status));
  }

  let fullText = '';
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const result = await reader.read();
    if (result.done) break;
    const chunk = decoder.decode(result.value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      try {
        const json = JSON.parse(line.slice(6));
        const part = json && json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0] && json.candidates[0].content.parts[0].text;
        if (part) fullText += part;
      } catch(e) {}
    }
  }

  if (!fullText) throw new Error('No response from Gemini.');
  return fullText;
}

// PROMPT
function buildPrompt(query, tripType, budget) {
  var locationHint = '';
  if (window._userLocation) {
    locationHint = 'User is from ' + window._userLocation.city + ', ' + window._userLocation.country + '. Tailor flight costs and travel advice accordingly.';
  }

  return 'You are World AI 360 — the world\'s most comprehensive travel intelligence system.\n' +
    'A user is asking about: "' + query + '"\n' +
    'Trip type: ' + tripType + ' | Budget: ' + budget + '\n' +
    locationHint + '\n' +
    'IMPORTANT: All monetary values MUST be in USD (US Dollars) using $ symbol. The app will convert to other currencies automatically.\n' +
    'Respond ONLY with a valid JSON object (no markdown, no backticks, no extra text).\n' +
    '{\n' +
    '  "destination": "Full Destination Name",\n' +
    '  "country": "Country",\n' +
    '  "region": "Continent/Region",\n' +
    '  "tagline": "One-line poetic description",\n' +
    '  "flag": "🌍",\n' +
    '  "searchImageTerms": ["term1 travel", "term2 landscape", "term3 culture"],\n' +
    '  "quickInfo": [\n' +
    '    { "icon": "🌡️", "label": "Best Season", "value": "Oct–Apr", "sub": "Avg 25°C • Low humidity • No rain" },\n' +
    '    { "icon": "💰", "label": "Daily Budget", "value": "$40–$80", "sub": "Hotels+Food+Transport included" },\n' +
    '    { "icon": "✈️", "label": "Avg Flight", "value": "$800–$1200", "sub": "From nearest major airport" },\n' +
    '     { "icon": "🛂", "label": "Visa", "value": "Visa on Arrival", "sub": "30 days • $25 fee • Apply online" },\n' +
    '    { "icon": "🗣️", "label": "Language", "value": "Bahasa/English", "sub": "English common" },\n' +
    '     { "icon": "⏱️", "label": "Ideal Stay", "value": "7–14 days", "sub": "Min 5 days • Ideal 10 days" }\n' +
    '  ],\n' +
    '  "seasons": [\n' +
    '    { "name": "Winter", "months": "Dec – Feb", "desc": "Short description", "best": false },\n' +
    '    { "name": "Spring", "months": "Mar – May", "desc": "Short description", "best": true },\n' +
    '    { "name": "Summer", "months": "Jun – Aug", "desc": "Short description", "best": false },\n' +
    '    { "name": "Autumn", "months": "Sep – Nov", "desc": "Short description", "best": false }\n' +
    '  ],\n' +
    '  "aiResponse": "600–900 word markdown travel guide. Sections: ### Overview, ### Top Attractions, ### Getting There, ### Local Food & Culture, ### Hidden Gems, ### Practical Tips. Use **bold** for key points.",\n' +
    '  "budgetBreakdown": [\n' +
    '    { "tier": "Budget", "pricePerDay": "$25–$45", "featured": false, "items": [{ "label": "Accommodation", "value": "$8–$15" },{ "label": "Food", "value": "$6–$10" },{ "label": "Transport", "value": "$3–$8" },{ "label": "Activities", "value": "$5–$12" }] },\n' +
    '    { "tier": "Mid-Range", "pricePerDay": "$60–$120", "featured": true, "items": [{ "label": "Accommodation", "value": "$30–$60" },{ "label": "Food", "value": "$15–$25" },{ "label": "Transport", "value": "$8–$15" },{ "label": "Activities", "value": "$10–$20" }] },\n' +
    '    { "tier": "Luxury", "pricePerDay": "$200–$500+", "featured": false, "items": [{ "label": "Accommodation", "value": "$100–$300" },{ "label": "Food", "value": "$40–$80" },{ "label": "Transport", "value": "$30–$60" },{ "label": "Activities", "value": "$30–$60" }] }\n' +
    '  ],\n' +
    '  "tips": ["tip1","tip2","tip3","tip4","tip5","tip6"],\n' +
    '  "related": [\n' +
    '    { "name": "Dest 1", "country": "Country", "desc": "Why visit", "emoji": "🌏", "query": "travel guide dest 1" },\n' +
    '    { "name": "Dest 2", "country": "Country", "desc": "Why visit", "emoji": "🏝️", "query": "travel guide dest 2" },\n' +
    '    { "name": "Dest 3", "country": "Country", "desc": "Why visit", "emoji": "🗺️", "query": "travel guide dest 3" }\n' +
    '  ]\n' +
    '}\n' +
    'All prices must be realistic USD values. Tailor to ' + budget + ' budget and ' + tripType + ' style.';
}

// PARSE
function parseResponse(text) {
  let clean = text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');
  return JSON.parse(clean);
}

// RENDER RESULT
function renderResult(data, originalQuery) {
  const imgGrid = document.getElementById('destImageGrid');
  const terms   = data.searchImageTerms || [data.destination, data.country, 'travel'];
  var allPhotos = [];
  terms.slice(0, 3).forEach(function(term) {
    for (var i = 1; i <= 22; i++) {
      allPhotos.push({ src: 'https://picsum.photos/seed/' + encodeURIComponent(term) + '-' + i + '/1200/800', term: term });
    }
  });
  window._allPhotos = allPhotos;

  imgGrid.innerHTML = terms.slice(0, 3).map(function(term, idx) {
    return '<img src="https://picsum.photos/seed/' + encodeURIComponent(term) + '/800/500" alt="' + term + '" loading="lazy" ' +
      'style="cursor:pointer" 'onclick="openLightbox(' + (idx * 22) + ')" ' +
      'onerror="this.style.background=\'#1A2130\'">';
  }).join('');

  document.getElementById('destBadge').textContent   = (data.flag || '🌍') + ' ' + (data.region || data.country);
  document.getElementById('destName').textContent    = data.destination;
  document.getElementById('destTagline').textContent = data.tagline;
  renderDestMeta(data);
  renderQuickInfo(data.quickInfo);

  const seasonGrid = document.getElementById('seasonGrid');
  seasonGrid.innerHTML = (data.seasons || []).map(function(s, i) {
    var destSafe = escapeAttr(data.destination);
    return '<div class="season-card' + (s.best ? ' best' : '') + '" style="cursor:pointer;animation-delay:' + (i * 0.07) + 's" ' +
      'onclick="searchFromCard(\'' + destSafe + ' in ' + s.name + ' season — what to do, weather, events, packing tips\')">' +
      '<div class="season-name">' + s.name + '</div>' +
      '<div class="season-months">' + s.months + '</div>' +
      '<div class="season-desc">' + s.desc + '</div>' +
      (s.best ? '<div class="season-badge">⭐ Best Time</div>' : '') +
      '</div>';
  }).join('');

  document.getElementById('aiBody').innerHTML = markdownToHtml(data.aiResponse || '');
  renderBudget(data.budgetBreakdown);

  const tipsList = document.getElementById('tipsList');
  tipsList.innerHTML = (data.tips || []).map(function(tip, i) {
    return '<div class="tip-item" style="animation-delay:' + (i * 0.05) + 's">' +
      '<div class="tip-num">' + String(i + 1).padStart(2, '0') + '</div>' +
      '<div class="tip-text">' + tip + '</div></div>';
  }).join('');

  const relatedGrid = document.getElementById('relatedGrid');
  relatedGrid.innerHTML = (data.related || []).map(function(r, i) {
    return '<div class="related-card" style="animation-delay:' + (i * 0.07) + 's" onclick="searchFromCard(\'' + escapeAttr(r.query) + '\')">' +
      '<div class="related-flag">' + r.emoji + '</div>' +
      '<div class="related-name">' + r.name + '</div>' +
      '<div class="related-desc">' + r.country + ' — ' + r.desc + '</div></div>';
  }).join('');
   initFollowupChat(data.destination);
  showResult();
  setTimeout(function() {
    document.getElementById('resultContent').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

function renderDestMeta(data) {
  const flightInfo = (data.quickInfo && data.quickInfo.find(function(q) { return q.label === 'Avg Flight'; })) || {};
  const seasonInfo = (data.quickInfo && data.quickInfo.find(function(q) { return q.label === 'Best Season'; })) || {};
  const flightVal  = flightInfo.value ? convertPriceStr(flightInfo.value) : '';
  const metaItems  = [
    { icon: '🌐', label: data.country },
    { icon: '✈️', label: flightVal },
    { icon: '📅', label: seasonInfo.value || '' },
  ].filter(function(m) { return m.label; });
  document.getElementById('destMeta').innerHTML = metaItems.map(function(m) {
    return '<div class="dest-meta-item">' + m.icon + ' <span>' + m.label + '</span></div>';
  }).join('');
}

function renderQuickInfo(quickInfo) {
  const infoGrid = document.getElementById('infoGrid');
  infoGrid.innerHTML = (quickInfo || []).map(function(item, i) {
    const isMonetary = item.label === 'Daily Budget' || item.label === 'Avg Flight' || item.label === 'Visa';
    const value      = isMonetary ? convertPriceStr(item.value) : item.value;
    return '<div class="info-card" style="animation-delay:' + (i * 0.05) + 's">' +
      '<div class="info-card-icon">' + item.icon + '</div>' +
      '<div class="info-card-label">' + item.label + '</div>' +
      '<div class="info-card-value">' + value + '</div>' +
      '<div class="info-card-sub">' + item.sub + '</div></div>';
  }).join('');
}

function renderBudget(budgetBreakdown) {
  const c          = CURRENCIES[selectedCurrency];
  const budgetGrid = document.getElementById('budgetGrid');
  budgetGrid.innerHTML = (budgetBreakdown || []).map(function(b, i) {
    return '<div class="budget-card' + (b.featured ? ' featured' : '') + '" style="animation-delay:' + (i * 0.08) + 's">' +
      '<div class="budget-tier">' + b.tier + '</div>' +
      '<div class="budget-price">' + convertPriceStr(b.pricePerDay) + '</div>' +
      '<div class="budget-per">per person / day · ' + c.flag + ' ' + selectedCurrency + '</div>' +
      (b.items || []).map(function(item) {
        return '<div class="budget-item"><span>' + item.label + '</span><strong>' + convertPriceStr(item.value) + '</strong></div>';
      }).join('') +
      '</div>';
  }).join('');
}

function markdownToHtml(md) {
  if (!md) return '';
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/^- (.+)$/gm,    '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, function(m) { return '<ul>' + m + '</ul>'; })
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hup])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

function escapeAttr(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function showLoading() {
  isLoading = true;
  const btn = document.getElementById('searchBtn');
  btn.disabled = true;
  btn.classList.add('loading');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Exploring the World...</span>';
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
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span>Explore with AI</span>';
}

const io = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) {
      e.target.style.opacity   = '1';
      e.target.style.transform = 'translateY(0)';
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

function observeElements(selector) {
  document.querySelectorAll(selector).forEach(function(el, i) {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(32px)';
    el.style.transition = 'opacity 0.6s ' + (i * 0.08) + 's ease, transform 0.6s ' + (i * 0.08) + 's ease';
    io.observe(el);
  });
}

window.addEventListener('load', function() {
  observeElements('.feature-card');
  observeElements('.trending-card');
  observeElements('.section-header');
});

function toggleCurrencyDropdown() {
  const dd = document.getElementById('currencyDropdown');
  dd.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  const wrap = document.querySelector('.currency-wrap');
  if (wrap && !wrap.contains(e.target)) {
    const dd = document.getElementById('currencyDropdown');
    if (dd) dd.classList.remove('open');
  }
});

// LIGHTBOX
function openLightbox(startIdx) {
  var photos = window._allPhotos || [];
  var current = startIdx;

  var lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.96);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;';

  function render() {
    var thumbs = '';
    for (var i = 0; i < Math.min(22, photos.length); i++) {
      thumbs += '<img src="' + photos[i].src.replace('1200/800','120/80') + '" onclick="window._lbGoto(' + i + ')" ' +
        'style="width:58px;height:38px;object-fit:cover;border-radius:5px;cursor:pointer;flex-shrink:0;' +
        'opacity:' + (i === current ? 1 : 0.45) + ';' +
        'border:' + (i === current ? '2px solid #C9A84C' : '2px solid transparent') + ';">';
    }
    lb.innerHTML =
      '<button onclick="document.getElementById(\'lightbox\').remove()" ' +
        'style="position:absolute;top:20px;right:28px;background:none;border:none;color:#fff;font-size:36px;cursor:pointer;line-height:1;">✕</button>' +
      '<button onclick="window._lbPrev()" ' +
        'style="position:absolute;left:16px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:32px;cursor:pointer;padding:10px 18px;border-radius:10px;">‹</button>' +
      '<button onclick="window._lbNext()" ' +
        'style="position:absolute;right:16px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:32px;cursor:pointer;padding:10px 18px;border-radius:10px;">›</button>' +
      '<img src="' + photos[current].src + '" style="max-height:72vh;max-width:82vw;object-fit:contain;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.8);">' +
      '<div style="color:#C9A84C;font-size:13px;margin-top:16px;font-family:monospace;">' + (current + 1) + ' / ' + photos.length + '  —  ' + photos[current].term + '</div>' +
      '<div style="display:flex;gap:6px;margin-top:14px;overflow-x:auto;max-width:90vw;padding:6px 10px;">' + thumbs + '</div>';
  }

  window._lbPrev = function() { current = (current - 1 + photos.length) % photos.length; render(); };
  window._lbNext = function() { current = (current + 1) % photos.length; render(); };
  window._lbGoto = function(i) { current = i; render(); };

  document.body.appendChild(lb);
  render();

  document.addEventListener('keydown', function lbKey(e) {
    if (e.key === 'ArrowRight') window._lbNext();
    if (e.key === 'ArrowLeft')  window._lbPrev();
    if (e.key === 'Escape') {
      lb.remove();
      document.removeEventListener('keydown', lbKey);
    }
  });
}
// ═══════════ AI FOLLOW-UP CHAT ═══════════
let chatHistory = [];
let isChatLoading = false;

function initFollowupChat(destination) {
  chatHistory = [];
  const msgs = document.getElementById('chatMessages');
  const sugg = document.getElementById('chatSuggestions');
  if (!msgs) return;

  msgs.innerHTML = '';

  // Welcome message
  appendChatMsg('ai', 'Hi! I know everything about <strong>' + destination + '</strong>. Ask me anything — safety, food, packing, local tips, budget, hidden gems!');

  // Suggestion pills
  const suggestions = [
    'Is it safe for solo travel?',
    'What to pack?',
    'Best local food to try?',
    'Any scams to avoid?',
    'Cheapest way to get around?',
    'Hidden gems tourists miss?'
  ];

  sugg.innerHTML = suggestions.map(function(s) {
    return '<button class="chat-pill" onclick="fillChatInput(\'' + s + '\')">' + s + '</button>';
  }).join('');

  // Enter key support
  const input = document.getElementById('chatInput');
  if (input) {
    input.onkeydown = function(e) {
      if (e.key === 'Enter' && !isChatLoading) sendFollowup();
    };
  }
}

function fillChatInput(text) {
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = text;
    input.focus();
  }
}

function appendChatMsg(role, html) {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;

  const div = document.createElement('div');
  div.className = 'chat-msg ' + role;

  const avatar = document.createElement('div');
  avatar.className = 'chat-avatar';
  avatar.textContent = role === 'user' ? 'You' : 'AI';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.innerHTML = html;

  div.appendChild(avatar);
  div.appendChild(bubble);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function showTyping() {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return null;

  const div = document.createElement('div');
  div.className = 'chat-msg ai';
  div.id = 'typingIndicator';

  const avatar = document.createElement('div');
  avatar.className = 'chat-avatar';
  avatar.textContent = 'AI';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble typing';
  bubble.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

  div.appendChild(avatar);
  div.appendChild(bubble);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

async function sendFollowup() {
  const input = document.getElementById('chatInput');
  const btn   = document.getElementById('chatSendBtn');
  const question = (input.value || '').trim();
  if (!question || isChatLoading) return;

  isChatLoading = true;
  btn.disabled  = true;
  input.value   = '';

  appendChatMsg('user', question);
  chatHistory.push({ role: 'user', content: question });

  const typing = showTyping();

  const destination = (lastParsedData && lastParsedData.destination) || currentQuery || 'this destination';
  const context     = lastParsedData ? JSON.stringify({
    destination: lastParsedData.destination,
    country:     lastParsedData.country,
    tagline:     lastParsedData.tagline,
    tips:        lastParsedData.tips
  }) : '';

  const systemPrompt = 'You are a friendly expert travel guide for ' + destination + '. ' +
    'Context: ' + context + '. ' +
    'Answer in 2-4 short paragraphs. Use **bold** for key points. Be specific, practical, and conversational. ' +
    'Currency context: user selected ' + selectedCurrency + '.';

  const messages = [{ role: 'user', content: systemPrompt + '\n\nUser asks: ' + question }];

  // Add previous chat history (last 4 messages)
  chatHistory.slice(-4).forEach(function(m) {
    messages.push(m);
  });

  try {
    const url  = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':streamGenerateContent?alt=sse&key=' + GEMINI_API_KEY;
    const body = {
      contents: messages.map(function(m) {
        return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] };
      }),
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    let fullText = '';
    const reader  = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const result = await reader.read();
      if (result.done) break;
      const chunk = decoder.decode(result.value);
      const lines = chunk.split('\n').filter(function(l) { return l.startsWith('data: '); });
      for (var i = 0; i < lines.length; i++) {
        try {
          const json = JSON.parse(lines[i].slice(6));
          const part = json && json.candidates && json.candidates[0] &&
                       json.candidates[0].content && json.candidates[0].content.parts &&
                       json.candidates[0].content.parts[0] && json.candidates[0].content.parts[0].text;
          if (part) fullText += part;
        } catch(e) {}
      }
    }

    if (typing) typing.remove();
    chatHistory.push({ role: 'assistant', content: fullText });
    appendChatMsg('ai', markdownToHtml(fullText));

  } catch(err) {
    if (typing) typing.remove();
    appendChatMsg('ai', 'Sorry, kuch error aa gaya. Dobara try karo!');
  }

  isChatLoading = false;
  btn.disabled  = false;
  input.focus();
}
