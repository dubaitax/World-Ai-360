/* ═══════════════════════════════════════════════════
   WORLD AI 360 — script.js
   Gemini AI-powered global travel explorer
   ═══════════════════════════════════════════════════ */

'use strict';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Replace with your Gemini API key or inject via GitHub Actions / env variable
const GROQ_API_KEY = 'YOUR_GROQ_KEY';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const PEXELS_API_KEY = 'YOUR_PEXELS_KEY';

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
let selectedLang = 'English';
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

// GROQ API
async function callGemini(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + GROQ_API_KEY
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3500,
      temperature: 0.6
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err.error && err.error.message) || ('HTTP ' + res.status));
  }

  const data = await res.json();
  const fullText = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!fullText) throw new Error('No response from Groq.');
  return fullText;
}
// PROMPT
function buildPrompt(query, tripType, budget) {
  var locationHint = '';
  if (window._userLocation) {
    locationHint = 'User is from ' + window._userLocation.city + ', ' + window._userLocation.country + '. Tailor flight costs and travel advice accordingly.';
  }

  return 'You are World AI 360 — the world\'s most comprehensive travel intelligence system.\n' +
'CRITICAL LANGUAGE INSTRUCTION: You MUST write the "aiResponse" field and all "tips" array items and all "tagline" field ENTIRELY in ' + selectedLang + ' language. All other JSON fields (destination, country, region, label names, visa values, season names) stay in English for app functionality. Only aiResponse, tips array, and tagline must be in ' + selectedLang + '.\n' +
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
    '  "weatherByMonth": [\n' +
'    { "month": "Jan", "temp": 28, "rainfall": 20,  "crowd": 60, "desc": "Sunny and warm" },\n' +
'    { "month": "Feb", "temp": 29, "rainfall": 15,  "crowd": 55, "desc": "Best weather" },\n' +
'    { "month": "Mar", "temp": 31, "rainfall": 25,  "crowd": 50, "desc": "Getting warmer" },\n' +
'    { "month": "Apr", "temp": 33, "rainfall": 60,  "crowd": 45, "desc": "Pre-monsoon" },\n' +
'    { "month": "May", "temp": 32, "rainfall": 120, "crowd": 35, "desc": "Monsoon starts" },\n' +
'    { "month": "Jun", "temp": 29, "rainfall": 200, "crowd": 25, "desc": "Heavy rains" },\n' +
'    { "month": "Jul", "temp": 27, "rainfall": 250, "crowd": 20, "desc": "Peak monsoon" },\n' +
'    { "month": "Aug", "temp": 27, "rainfall": 220, "crowd": 22, "desc": "Still rainy" },\n' +
'    { "month": "Sep", "temp": 28, "rainfall": 150, "crowd": 30, "desc": "Monsoon ends" },\n' +
'    { "month": "Oct", "temp": 29, "rainfall": 70,  "crowd": 55, "desc": "Good weather" },\n' +
'    { "month": "Nov", "temp": 28, "rainfall": 30,  "crowd": 70, "desc": "Peak season" },\n' +
'    { "month": "Dec", "temp": 27, "rainfall": 20,  "crowd": 80, "desc": "Festive season" }\n' +
'  ],\n' +
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
const searchQuery = data.destination + ' ' + data.country;
window._allPhotos = [];

fetch('https://api.pexels.com/v1/search?query=' + encodeURIComponent(searchQuery) + '&per_page=60', {
  headers: { 'Authorization': PEXELS_API_KEY }
})
.then(function(r) { return r.json(); })
.then(function(pexData) {
  var photos = pexData.photos || [];
  window._allPhotos = photos.map(function(p) {
    return { src: p.src.large, term: p.photographer };
  });

  // Grid mein pehle 3 photos dikhao
  imgGrid.innerHTML = photos.slice(0, 3).map(function(p, idx) {
    return '<img src="' + p.src.medium + '" ' +
      'alt="' + searchQuery + '" loading="lazy" ' +
      'style="cursor:pointer;width:100%;height:100%;object-fit:cover;" ' +
      'onclick="openLightbox(' + idx + ')">';
  }).join('');

  if (photos.length === 0) {
    imgGrid.innerHTML = '<div style="color:rgba(255,255,255,0.3);padding:20px;">No photos found</div>';
  }
})
.catch(function() {
  imgGrid.innerHTML = '<div style="color:rgba(255,255,255,0.3);padding:20px;">Photos load nahi hui</div>';
});
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

  var aiBody = document.getElementById('aiBody');
aiBody.innerHTML = markdownToHtml(data.aiResponse || '');
if (selectedLang === 'Arabic') {
  aiBody.classList.add('lang-rtl');
} else {
  aiBody.classList.remove('lang-rtl');
}
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
   setTimeout(updateCalc, 100);
   initBucketBar(data);
   initTripCard(data);
   initWeatherChart(data);
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
    'IMPORTANT: Answer ENTIRELY in ' + selectedLang + ' language. ' +
    'Answer in 2-4 short paragraphs. Use **bold** for key points. Be specific, practical, and conversational. ' +
    'Currency context: user selected ' + selectedCurrency + '.';

  const messages = [{ role: 'user', content: systemPrompt + '\n\nUser asks: ' + question }];

  // Add previous chat history (last 4 messages)
  chatHistory.slice(-4).forEach(function(m) {
    messages.push(m);
  });

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages,
        max_tokens: 800,
        temperature: 0.7
      })
    });

    const data = await res.json();
    const fullText = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

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
// ═══════════ COST CALCULATOR ═══════════
let selectedTierIndex = 0;

function selectTier(btn) {
  document.querySelectorAll('.calc-tier-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  btn.classList.add('active');
  selectedTierIndex = parseInt(btn.dataset.tier);
  updateCalc();
}

function parsePriceRange(str) {
  if (!str) return { min: 0, max: 0 };
  var nums = str.replace(/[^0-9.\-]/g, ' ').trim().split(/\s+/).filter(Boolean).map(Number);
  if (nums.length >= 2) return { min: nums[0], max: nums[1] };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: 0, max: 0 };
}

function updateCalc() {
  if (!lastParsedData || !lastParsedData.budgetBreakdown) return;

  var days    = parseInt(document.getElementById('calcDays').value);
  var people  = parseInt(document.getElementById('calcPeople').value);
  var tier    = lastParsedData.budgetBreakdown[selectedTierIndex];

  document.getElementById('calcDaysVal').textContent   = days + ' day' + (days > 1 ? 's' : '');
  document.getElementById('calcPeopleVal').textContent = people + ' person' + (people > 1 ? 's' : '');

  if (!tier) return;

  var dayRange  = parsePriceRange(tier.pricePerDay);
  var minPerDay = dayRange.min;
  var maxPerDay = dayRange.max;

  var minTotal  = Math.round(minPerDay * days * people);
  var maxTotal  = Math.round(maxPerDay * days * people);
  var minPerson = Math.round(minPerDay * days);
  var maxPerson = Math.round(maxPerDay * days);

  var flightInfo  = lastParsedData.quickInfo && lastParsedData.quickInfo.find(function(q) { return q.label === 'Avg Flight'; });
  var flightRange = flightInfo ? parsePriceRange(flightInfo.value) : { min: 0, max: 0 };
  var flightMin   = Math.round(flightRange.min * people);
  var flightMax   = Math.round(flightRange.max * people);

  var c   = CURRENCIES[selectedCurrency];
  var sym = c.symbol;
  var r   = c.rate;

  function fmt(n) {
    var converted = Math.round(n * r);
    return sym + (converted >= 1000 ? (converted / 1000).toFixed(1) + 'K' : converted);
  }

  document.getElementById('calcPerDay').textContent    = fmt(minPerDay) + ' – ' + fmt(maxPerDay);
  document.getElementById('calcPerPerson').textContent = fmt(minPerson) + ' – ' + fmt(maxPerson);
  document.getElementById('calcTotal').textContent     = fmt(minTotal)  + ' – ' + fmt(maxTotal);
  document.getElementById('calcFlights').textContent   = flightMin > 0 ? fmt(flightMin) + ' – ' + fmt(flightMax) : 'N/A';

  var breakdown = document.getElementById('calcBreakdown');
  breakdown.innerHTML = (tier.items || []).map(function(item) {
    var iRange = parsePriceRange(item.value);
    var iMin   = Math.round(iRange.min * days * people);
    var iMax   = Math.round(iRange.max * days * people);
    return '<div class="calc-breakdown-row">' +
      '<span>' + item.label + ' (' + days + 'd × ' + people + 'p)</span>' +
      '<span>' + fmt(iMin) + ' – ' + fmt(iMax) + '</span>' +
    '</div>';
  }).join('');
}
// ═══════════ BUCKET LIST / WISHLIST ═══════════
function loadBucketList() {
  try {
    return JSON.parse(localStorage.getItem('worldai360_wishlist') || '[]');
  } catch(e) {
    return [];
  }
}

function saveBucketList(list) {
  localStorage.setItem('worldai360_wishlist', JSON.stringify(list));
  updateWishlistCount();
}

function updateWishlistCount() {
  var list  = loadBucketList();
  var count = document.getElementById('wishlistCount');
  if (count) count.textContent = list.length;
}

function initBucketBar(data) {
  var nameEl = document.getElementById('bucketDestName');
  var btn    = document.getElementById('bucketSaveBtn');
  var heart  = document.getElementById('bucketHeart');
  if (!nameEl || !data) return;

  nameEl.textContent = data.destination;
  var list   = loadBucketList();
  var exists = list.some(function(i) { return i.destination === data.destination; });

  if (exists) {
    btn.textContent = '✓ Saved';
    btn.classList.add('saved');
    heart.textContent = '❤️';
  } else {
    btn.textContent = 'Save Destination';
    btn.classList.remove('saved');
    heart.textContent = '🤍';
  }
}

function toggleBucketList() {
  if (!lastParsedData) return;
  var list   = loadBucketList();
  var idx    = list.findIndex(function(i) { return i.destination === lastParsedData.destination; });
  var btn    = document.getElementById('bucketSaveBtn');
  var heart  = document.getElementById('bucketHeart');

  if (idx >= 0) {
    // Remove
    list.splice(idx, 1);
    btn.textContent = 'Save Destination';
    btn.classList.remove('saved');
    heart.textContent = '🤍';
  } else {
    // Add
    list.push({
      destination: lastParsedData.destination,
      country:     lastParsedData.country,
      flag:        lastParsedData.flag || '🌍',
      tagline:     lastParsedData.tagline || '',
      savedAt:     new Date().toLocaleDateString(),
      query:       currentQuery
    });
    btn.textContent = '✓ Saved';
    btn.classList.add('saved');
    heart.textContent = '❤️';
    heart.classList.add('saved');
    setTimeout(function() { heart.classList.remove('saved'); }, 400);
  }

  saveBucketList(list);
}

function openWishlist() {
  renderWishlistItems();
  document.getElementById('wishlistOverlay').classList.add('open');
  document.getElementById('wishlistModal').classList.add('open');
}

function closeWishlist() {
  document.getElementById('wishlistOverlay').classList.remove('open');
  document.getElementById('wishlistModal').classList.remove('open');
}

function renderWishlistItems() {
  var list      = loadBucketList();
  var empty     = document.getElementById('wishlistEmpty');
  var itemsWrap = document.getElementById('wishlistItems');

  if (list.length === 0) {
    empty.style.display     = 'block';
    itemsWrap.style.display = 'none';
    return;
  }

  empty.style.display     = 'none';
  itemsWrap.style.display = 'flex';

  itemsWrap.innerHTML = list.map(function(item, i) {
    return '<div class="wishlist-item" id="witem-' + i + '">' +
      '<div class="wishlist-item-left">' +
        '<span class="wishlist-item-flag">' + item.flag + '</span>' +
        '<div>' +
          '<div class="wishlist-item-name">' + item.destination + '</div>' +
          '<div class="wishlist-item-meta">' + item.country + ' · Saved ' + item.savedAt + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="wishlist-item-actions">' +
        '<button class="wishlist-action-btn" onclick="exploreFromWishlist(\'' + escapeAttr(item.query) + '\')">Explore</button>' +
        '<button class="wishlist-action-btn remove" onclick="removeFromWishlist(' + i + ')">Remove</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function removeFromWishlist(idx) {
  var list = loadBucketList();
  list.splice(idx, 1);
  saveBucketList(list);
  renderWishlistItems();
  if (lastParsedData) initBucketBar(lastParsedData);
}

function exploreFromWishlist(query) {
  closeWishlist();
  var input = document.getElementById('searchInput');
  input.value = query;
  document.getElementById('searchClear').classList.add('visible');
  document.getElementById('explore').scrollIntoView({ behavior: 'smooth' });
  setTimeout(handleSearch, 600);
}

// Wishlist count on page load
document.addEventListener('DOMContentLoaded', function() {
  updateWishlistCount();
});
// ═══════════ DESTINATION COMPARE ═══════════
let isCompareLoading = false;

// Enter key support for compare inputs
document.addEventListener('DOMContentLoaded', function() {
  var i1 = document.getElementById('compareInput1');
  var i2 = document.getElementById('compareInput2');
  if (i1) i1.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleCompare(); });
  if (i2) i2.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleCompare(); });
});

async function handleCompare() {
  var dest1 = (document.getElementById('compareInput1').value || '').trim();
  var dest2 = (document.getElementById('compareInput2').value || '').trim();

  if (!dest1 || !dest2) {
    alert('Dono destinations type karo!');
    return;
  }
  if (isCompareLoading) return;

  isCompareLoading = true;
  var btn = document.querySelector('.compare-btn');
  btn.disabled = true;

  document.getElementById('compareResult').style.display = 'none';
  document.getElementById('compareError').style.display  = 'none';
  document.getElementById('compareLoading').style.display = 'block';

  var prompt = buildComparePrompt(dest1, dest2);

  try {
    var responseText = await callGemini(prompt);
    var parsed       = parseCompareResponse(responseText);
    renderCompareResult(parsed, dest1, dest2);
  } catch(err) {
    document.getElementById('compareErrorMsg').textContent = err.message || 'Error. Try again.';
    document.getElementById('compareError').style.display  = 'block';
  }

  document.getElementById('compareLoading').style.display = 'none';
  isCompareLoading = false;
  btn.disabled = false;
}

function buildComparePrompt(dest1, dest2) {
  return 'Compare these two travel destinations for a ' + selectedTripType + ' traveler with ' + selectedBudget + ' budget.\n' +
    'Destination 1: ' + dest1 + '\n' +
    'Destination 2: ' + dest2 + '\n' +
    'IMPORTANT: All prices in USD using $ symbol.\n' +
    'Respond ONLY with valid JSON, no markdown, no backticks:\n' +
    '{\n' +
    '  "winner": "Destination name that wins overall",\n' +
    '  "winnerReason": "One line why it wins",\n' +
    '  "dest1": {\n' +
    '    "name": "Full name",\n' +
    '    "country": "Country",\n' +
    '    "flag": "🌍",\n' +
    '    "dailyBudget": "$40-$80",\n' +
    '    "bestSeason": "Oct-Apr",\n' +
    '    "visa": "Visa on Arrival / Free / Required",\n' +
    '    "avgFlight": "$600-$900",\n' +
    '    "safetyScore": "8/10",\n' +
    '    "language": "English / Local",\n' +
    '    "idealDays": "7-10 days",\n' +
    '    "highlights": "Top 2-3 things in one line"\n' +
    '  },\n' +
    '  "dest2": {\n' +
    '    "name": "Full name",\n' +
    '    "country": "Country",\n' +
    '    "flag": "🌏",\n' +
    '    "dailyBudget": "$30-$60",\n' +
    '    "bestSeason": "Nov-Mar",\n' +
    '    "visa": "Visa on Arrival / Free / Required",\n' +
    '    "avgFlight": "$500-$800",\n' +
    '    "safetyScore": "7/10",\n' +
    '    "language": "Thai / English",\n' +
    '    "idealDays": "10-14 days",\n' +
    '    "highlights": "Top 2-3 things in one line"\n' +
    '  }\n' +
    '}';
}

function parseCompareResponse(text) {
  var clean = text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');
  return JSON.parse(clean);
}

function renderCompareResult(data, query1, query2) {
  var d1        = data.dest1;
  var d2        = data.dest2;
  var winnerIs1 = data.winner && data.winner.toLowerCase().indexOf(d1.name.toLowerCase().split(',')[0]) >= 0;

  var fields = [
    { label: '💰 Daily Budget', key: 'dailyBudget',  monetary: true  },
    { label: '📅 Best Season',  key: 'bestSeason',   monetary: false },
    { label: '🛂 Visa',         key: 'visa',         monetary: false },
    { label: '✈️ Avg Flight',   key: 'avgFlight',    monetary: true  },
    { label: '🛡️ Safety',       key: 'safetyScore',  monetary: false },
    { label: '🗣️ Language',     key: 'language',     monetary: false },
    { label: '⏱️ Ideal Stay',   key: 'idealDays',    monetary: false },
    { label: '⭐ Highlights',   key: 'highlights',   monetary: false },
  ];

  function buildRows(dest, isWinner) {
    return fields.map(function(f) {
      var val = dest[f.key] || '—';
      if (f.monetary) val = convertPriceStr(val);
      var betterClass = '';
      if (f.key === 'dailyBudget' || f.key === 'avgFlight') {
        betterClass = isWinner ? ' better' : '';
      }
      if (f.key === 'safetyScore') {
        betterClass = isWinner ? ' better' : '';
      }
      return '<div class="compare-row">' +
        '<span class="compare-row-label">' + f.label + '</span>' +
        '<span class="compare-row-val' + betterClass + '">' + val + '</span>' +
      '</div>';
    }).join('');
  }

  var html =
    '<div class="compare-winner-banner">' +
      '<div class="compare-winner-badge">🏆 ' + (data.winner || '') + ' wins — ' + (data.winnerReason || '') + '</div>' +
    '</div>' +
    '<div class="compare-cards">' +
      '<div class="compare-card' + (winnerIs1 ? ' winner' : '') + '">' +
        '<div class="compare-card-header">' +
          '<div>' +
            '<div class="compare-card-name">' + (d1.flag || '') + ' ' + d1.name + '</div>' +
            '<div class="compare-card-country">' + d1.country + '</div>' +
          '</div>' +
          (winnerIs1 ? '<span class="compare-winner-tag">🏆 WINNER</span>' : '') +
        '</div>' +
        '<div class="compare-rows">' + buildRows(d1, winnerIs1) + '</div>' +
      '</div>' +
      '<div class="compare-card' + (!winnerIs1 ? ' winner' : '') + '">' +
        '<div class="compare-card-header">' +
          '<div>' +
            '<div class="compare-card-name">' + (d2.flag || '') + ' ' + d2.name + '</div>' +
            '<div class="compare-card-country">' + d2.country + '</div>' +
          '</div>' +
          (!winnerIs1 ? '<span class="compare-winner-tag">🏆 WINNER</span>' : '') +
        '</div>' +
        '<div class="compare-rows">' + buildRows(d2, !winnerIs1) + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="compare-explore-btns">' +
      '<button class="compare-explore-btn" onclick="searchFromCard(\'' + escapeAttr('Complete travel guide to ' + d1.name) + '\')">' +
        'Explore ' + d1.name + ' →' +
      '</button>' +
      '<button class="compare-explore-btn" onclick="searchFromCard(\'' + escapeAttr('Complete travel guide to ' + d2.name) + '\')">' +
        'Explore ' + d2.name + ' →' +
      '</button>' +
    '</div>';

  var resultEl = document.getElementById('compareResult');
  resultEl.innerHTML = html;
  resultEl.style.display = 'block';
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
// ═══════════ TRIP CARD GENERATOR ═══════════
var selectedTheme = 'gold';

var cardThemes = {
  gold: {
    bg1: '#0A0F1A', bg2: '#1A2540',
    accent: '#C9A84C', accent2: '#E8C96A',
    text: '#FFFFFF', sub: 'rgba(255,255,255,0.6)'
  },
  ocean: {
    bg1: '#0A1628', bg2: '#0D2B4A',
    accent: '#38BDF8', accent2: '#7DD3FC',
    text: '#FFFFFF', sub: 'rgba(255,255,255,0.6)'
  },
  forest: {
    bg1: '#0A1A0F', bg2: '#0F2D18',
    accent: '#4ADE80', accent2: '#86EFAC',
    text: '#FFFFFF', sub: 'rgba(255,255,255,0.6)'
  },
  sunset: {
    bg1: '#1A0A0A', bg2: '#2D1010',
    accent: '#FB923C', accent2: '#FCD34D',
    text: '#FFFFFF', sub: 'rgba(255,255,255,0.6)'
  },
  dark: {
    bg1: '#000000', bg2: '#111111',
    accent: '#FFFFFF', accent2: '#CCCCCC',
    text: '#FFFFFF', sub: 'rgba(255,255,255,0.5)'
  }
};

function selectTheme(btn) {
  document.querySelectorAll('.theme-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  btn.classList.add('active');
  selectedTheme = btn.dataset.theme;
  if (lastParsedData) drawTripCard(lastParsedData);
}

function initTripCard(data) {
  drawTripCard(data);
}

function drawTripCard(data) {
  var canvas = document.getElementById('tripcardCanvas');
  if (!canvas) return;
  var ctx    = canvas.getContext('2d');
  var W      = 1080;
  var H      = 1080;
  var t      = cardThemes[selectedTheme] || cardThemes.gold;

  ctx.clearRect(0, 0, W, H);

  // Background gradient
  var bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, t.bg1);
  bgGrad.addColorStop(1, t.bg2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Decorative circle top right
  ctx.beginPath();
  ctx.arc(W - 80, 80, 260, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(W - 80, 80, 180, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fill();

  // Decorative circle bottom left
  ctx.beginPath();
  ctx.arc(100, H - 100, 200, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  ctx.fill();

  // Top accent line
  var lineGrad = ctx.createLinearGradient(60, 0, 500, 0);
  lineGrad.addColorStop(0, t.accent);
  lineGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(60, 70, 440, 3);

  // Flag + Region badge
  var flag   = data.flag || '🌍';
  var region = data.region || data.country || '';
  ctx.font      = '52px serif';
  ctx.fillStyle = t.text;
  ctx.fillText(flag, 60, 160);

  ctx.font      = 'bold 26px sans-serif';
  ctx.fillStyle = t.accent;
  ctx.fillText(region.toUpperCase(), 130, 155);

  ctx.font      = '22px sans-serif';
  ctx.fillStyle = t.sub;
  ctx.fillText(data.country || '', 131, 185);

  // Destination Name
  var destName = data.destination || '';
  ctx.fillStyle = t.text;
  if (destName.length > 18) {
    ctx.font = 'bold 72px sans-serif';
  } else if (destName.length > 12) {
    ctx.font = 'bold 88px sans-serif';
  } else {
    ctx.font = 'bold 108px sans-serif';
  }
  ctx.fillText(destName, 60, 340);

  // Tagline
  var tagline = data.tagline || '';
  ctx.font      = 'italic 30px serif';
  ctx.fillStyle = t.sub;
  wrapText(ctx, tagline, 60, 400, 960, 42);

  // Divider
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(60, 480, 960, 1);

  // Info boxes — 3 across
  var quickInfo = data.quickInfo || [];
  var season    = quickInfo.find(function(q) { return q.label === 'Best Season'; })  || {};
  var budget    = quickInfo.find(function(q) { return q.label === 'Daily Budget'; }) || {};
  var flight    = quickInfo.find(function(q) { return q.label === 'Avg Flight'; })   || {};
  var visa      = quickInfo.find(function(q) { return q.label === 'Visa'; })         || {};
  var stay      = quickInfo.find(function(q) { return q.label === 'Ideal Stay'; })   || {};

  var boxes = [
    { icon: '📅', label: 'BEST SEASON', val: season.value || '—' },
    { icon: '💰', label: 'DAILY BUDGET', val: budget.value ? convertPriceStr(budget.value) : '—' },
    { icon: '✈️', label: 'AVG FLIGHT',  val: flight.value ? convertPriceStr(flight.value) : '—' },
    { icon: '🛂', label: 'VISA',        val: visa.value   || '—' },
    { icon: '⏱️', label: 'IDEAL STAY',  val: stay.value   || '—' },
  ];

  var boxW   = 176;
  var boxH   = 170;
  var startX = 60;
  var startY = 510;
  var gapX   = 18;

  boxes.forEach(function(box, i) {
    var x = startX + i * (boxW + gapX);
    var y = startY;

    // Box background
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    roundRect(ctx, x, y, boxW, boxH, 16);
    ctx.fill();

    // Accent top border
    ctx.fillStyle = t.accent;
    roundRect(ctx, x, y, boxW, 3, 2);
    ctx.fill();

    // Icon
    ctx.font = '28px serif';
    ctx.fillText(box.icon, x + 16, y + 46);

    // Label
    ctx.font      = 'bold 16px sans-serif';
    ctx.fillStyle = t.sub;
    ctx.fillText(box.label, x + 16, y + 80);

    // Value
    ctx.font      = 'bold 22px sans-serif';
    ctx.fillStyle = t.accent;
    var val = box.val.length > 12 ? box.val.substring(0, 12) + '…' : box.val;
    ctx.fillText(val, x + 16, y + 116);
  });

  // Tips section
  var tips = data.tips || [];
  if (tips.length > 0) {
    ctx.font      = 'bold 22px sans-serif';
    ctx.fillStyle = t.accent;
    ctx.fillText('✦ PRO TIP', 60, 730);

    ctx.font      = '24px sans-serif';
    ctx.fillStyle = t.sub;
    wrapText(ctx, tips[0], 60, 768, 960, 36);
  }

  // Bottom bar
  var barGrad = ctx.createLinearGradient(0, H - 100, W, H);
  barGrad.addColorStop(0, t.accent + '22');
  barGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, H - 100, W, 100);

  // Bottom divider
  ctx.fillStyle = t.accent + '44';
  ctx.fillRect(0, H - 100, W, 1);

  // Branding
  ctx.font      = 'bold 28px sans-serif';
  ctx.fillStyle = t.accent;
  ctx.fillText('◎ WorldAI360', 60, H - 40);

  ctx.font      = '22px sans-serif';
  ctx.fillStyle = t.sub;
  ctx.textAlign = 'right';
  ctx.fillText('AI-Powered Travel Intelligence', W - 60, H - 40);
  ctx.textAlign = 'left';
}

// Helper — wrap long text
function wrapText(ctx, text, x, y, maxW, lineH) {
  if (!text) return;
  var words = text.split(' ');
  var line  = '';
  var lines = 0;
  for (var i = 0; i < words.length; i++) {
    var test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxW && line !== '') {
      ctx.fillText(line.trim(), x, y);
      line = words[i] + ' ';
      y   += lineH;
      lines++;
      if (lines >= 2) { ctx.fillText(line.trim() + '...', x, y); return; }
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, y);
}

// Helper — rounded rectangle
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function downloadTripCard() {
  var canvas = document.getElementById('tripcardCanvas');
  if (!canvas) return;
  var dest = (lastParsedData && lastParsedData.destination) || 'trip';
  var link  = document.createElement('a');
  link.download = dest.replace(/\s+/g, '-').toLowerCase() + '-trip-card.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function copyTripCard() {
  var canvas = document.getElementById('tripcardCanvas');
  if (!canvas) return;
  canvas.toBlob(function(blob) {
    try {
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]).then(function() {
        var btn = document.querySelector('.tripcard-copy-btn');
        var orig = btn.innerHTML;
        btn.innerHTML = '✓ Copied!';
        setTimeout(function() { btn.innerHTML = orig; }, 2000);
      });
    } catch(e) {
      alert('Copy supported nahi hai is browser mein. Download use karo!');
    }
  });
}
// ═══════════ MULTI-LANGUAGE ═══════════
function selectLang(btn) {
  document.querySelectorAll('.lang-pill').forEach(function(b) {
    b.classList.remove('active');
  });
  btn.classList.add('active');
  selectedLang = btn.dataset.lang;
}
// ═══════════ WEATHER CHART ═══════════
var weatherChartInstance = null;

function initWeatherChart(data) {
  var weatherData = data.weatherByMonth;
  if (!weatherData || weatherData.length === 0) return;

  var section = document.getElementById('weatherChartSection');
  if (section) section.style.display = 'block';

  var canvas = document.getElementById('weatherChart');
  if (!canvas) return;

  // Destroy old chart if exists
  if (weatherChartInstance) {
    weatherChartInstance.destroy();
    weatherChartInstance = null;
  }

  var labels = weatherData.map(function(m) { return m.month; });
  var temps  = weatherData.map(function(m) { return m.temp; });
  var rains  = weatherData.map(function(m) { return m.rainfall; });
  var crowds = weatherData.map(function(m) { return m.crowd; });

  weatherChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Rainfall (mm)',
          data: rains,
          backgroundColor: 'rgba(56,189,248,0.25)',
          borderColor: 'rgba(56,189,248,0.7)',
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: 'yRain',
          order: 3
        },
        {
          label: 'Crowd Level (%)',
          data: crowds,
          backgroundColor: 'rgba(248,113,113,0.2)',
          borderColor: 'rgba(248,113,113,0.6)',
          borderWidth: 1,
          borderRadius: 6,
          yAxisID: 'yCrowd',
          order: 2
        },
        {
          label: 'Temperature (°C)',
          data: temps,
          type: 'line',
          borderColor: '#E8C96A',
          backgroundColor: 'rgba(232,201,106,0.1)',
          borderWidth: 2.5,
          pointBackgroundColor: '#E8C96A',
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4,
          fill: false,
          yAxisID: 'yTemp',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      onClick: function(evt, elements) {
        if (elements && elements.length > 0) {
          var idx = elements[0].index;
          highlightWeatherMonth(weatherData, idx);
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,15,26,0.95)',
          borderColor: 'rgba(201,168,76,0.3)',
          borderWidth: 1,
          titleColor: '#C9A84C',
          bodyColor: 'rgba(232,230,224,0.8)',
          padding: 12,
          callbacks: {
            title: function(items) {
              return weatherData[items[0].dataIndex].month;
            },
            label: function(item) {
              if (item.dataset.label.indexOf('Temp') >= 0)   return '🌡️ ' + item.raw + '°C';
              if (item.dataset.label.indexOf('Rain') >= 0)   return '🌧️ ' + item.raw + ' mm';
              if (item.dataset.label.indexOf('Crowd') >= 0)  return '👥 ' + item.raw + '% crowd';
              return item.raw;
            },
            afterBody: function(items) {
              var idx  = items[0].dataIndex;
              return ['', '📝 ' + (weatherData[idx].desc || '')];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: 'rgba(232,230,224,0.5)', font: { size: 12 } }
        },
        yTemp: {
          type: 'linear',
          position: 'left',
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: {
            color: '#E8C96A',
            font: { size: 11 },
            callback: function(v) { return v + '°'; }
          },
          title: {
            display: true,
            text: 'Temp °C',
            color: 'rgba(232,201,106,0.6)',
            font: { size: 11 }
          }
        },
        yRain: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            color: 'rgba(56,189,248,0.7)',
            font: { size: 11 },
            callback: function(v) { return v + 'mm'; }
          },
          title: {
            display: true,
            text: 'Rain mm',
            color: 'rgba(56,189,248,0.5)',
            font: { size: 11 }
          }
        },
        yCrowd: {
          type: 'linear',
          position: 'right',
          display: false,
          max: 200
        }
      }
    }
  });

  // Month cards render karo
  renderWeatherMonthCards(weatherData);
}

function renderWeatherMonthCards(weatherData) {
  var detail = document.getElementById('weatherMonthDetail');
  if (!detail) return;

  // Best month find karo — low rain + high temp + medium crowd
  var bestIdx = 0;
  var bestScore = -999;
  weatherData.forEach(function(m, i) {
    var score = m.temp - (m.rainfall / 10) - (m.crowd > 80 ? 10 : 0);
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  });

  detail.innerHTML = weatherData.map(function(m, i) {
    var isBest = i === bestIdx;
    return '<div class="weather-month-card' + (isBest ? ' best-month' : '') + '" ' +
      'onclick="highlightWeatherMonth(window._weatherData, ' + i + ')">' +
      '<div class="wmc-name">' + m.month + '</div>' +
      '<div class="wmc-temp">' + m.temp + '°C</div>' +
      '<div class="wmc-rain">🌧 ' + m.rainfall + 'mm</div>' +
      '<div class="wmc-crowd">👥 ' + m.crowd + '%</div>' +
      (isBest ? '<div class="wmc-badge">⭐ BEST</div>' : '') +
    '</div>';
  }).join('');

  window._weatherData = weatherData;
}

function highlightWeatherMonth(weatherData, idx) {
  var m = weatherData[idx];
  if (!m) return;

  // Chart tooltip force show
  if (weatherChartInstance) {
    weatherChartInstance.tooltip.setActiveElements(
      [
        { datasetIndex: 0, index: idx },
        { datasetIndex: 1, index: idx },
        { datasetIndex: 2, index: idx }
      ],
      { x: 0, y: 0 }
    );
    weatherChartInstance.update();
  }

  // Month cards highlight
  document.querySelectorAll('.weather-month-card').forEach(function(card, i) {
    card.style.borderColor = i === idx ? 'rgba(201,168,76,0.6)' : '';
    card.style.background  = i === idx ? 'rgba(201,168,76,0.1)' : '';
  });
}
