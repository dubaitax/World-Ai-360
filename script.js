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
    const responseText = await callGroq(prompt);
    const parsed       = parseResponse(responseText);
    lastParsedData     = parsed;
    renderResult(parsed, query);
  } catch (err) {
    showError(err.message || 'Unknown error occurred.');
    console.error('Gemini Error:', err);
  }
}

// GROQ API
async function callGroq(prompt) {
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
  temperature: 0.6,
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
  var userCity = (window._userLocation ? window._userLocation.city + ', ' + window._userLocation.country : 'their nearest major airport');
  if (window._userLocation) {
    locationHint = 'User is from ' + window._userLocation.city + ', ' + window._userLocation.country + '. Tailor flight costs and travel advice accordingly.';
  }

  return 'You are World AI 360 — the world\'s most comprehensive travel intelligence system.\n' +
'CRITICAL LANGUAGE INSTRUCTION: You MUST write the "aiResponse" field and all "tips" array items and all "tagline" field ENTIRELY in ' + selectedLang + ' language. All other JSON fields stay in English for app functionality.\n' +
    'A user is asking about: "' + query + '"\n' +
    'Trip type: ' + tripType + ' | Budget: ' + budget + '\n' +
    locationHint + '\n' +
    'IMPORTANT: All monetary values MUST be in USD using $ symbol. The app converts to other currencies automatically.\n' +
    'Provide REAL and ACCURATE data for this specific destination. Do NOT use placeholder or example values.\n' +
    'Respond ONLY with a valid JSON object (no markdown, no backticks, no extra text).\n' +
    '{\n' +
    '  "destination": "Full Destination Name",\n' +
    '  "country": "Country",\n' +
    '  "region": "Continent/Region",\n' +
    '  "tagline": "One-line poetic description in ' + selectedLang + '",\n' +
    '  "flag": "correct flag emoji for this country",\n' +
    '  "searchImageTerms": ["specific landmark", "specific landscape", "specific culture scene"],\n' +
    '  "quickInfo": [\n' +
    '    { "icon": "🌡️", "label": "Best Season", "value": "actual best months for this destination", "sub": "actual avg temp • actual humidity • actual rain info" },\n' +
    '    { "icon": "💰", "label": "Daily Budget", "value": "actual realistic daily cost in USD for ' + tripType + ' traveler", "sub": "Hotels+Food+Transport included" },\n' +
    '    { "icon": "✈️", "label": "Avg Flight", "value": "actual flight cost in USD from ' + userCity + '", "sub": "From ' + userCity + '" },\n' +
    '    { "icon": "🛂", "label": "Visa", "value": "actual visa requirement for most travelers", "sub": "actual duration • actual fee in USD if any • how to apply" },\n' +
    '    { "icon": "🗣️", "label": "Language", "value": "actual official language of destination", "sub": "actual English proficiency level among locals" },\n' +
    '    { "icon": "⏱️", "label": "Ideal Stay", "value": "actual recommended trip duration", "sub": "actual minimum days • actual ideal days" }\n' +
    '  ],\n' +
    '  "seasons": [\n' +
    '    { "name": "Winter", "months": "actual winter months", "desc": "actual winter weather and experience", "best": false },\n' +
    '    { "name": "Spring", "months": "actual spring months", "desc": "actual spring weather and experience", "best": true },\n' +
    '    { "name": "Summer", "months": "actual summer months", "desc": "actual summer weather and experience", "best": false },\n' +
    '    { "name": "Autumn", "months": "actual autumn months", "desc": "actual autumn weather and experience", "best": false }\n' +
    '  ],\n' +
    '  "aiResponse": "600-900 word markdown travel guide in ' + selectedLang + '. Sections: ### Overview, ### Top Attractions, ### Getting There, ### Local Food & Culture, ### Hidden Gems, ### Practical Tips. Use **bold** for key points.",\n' +
    '  "budgetBreakdown": [\n' +
    '    { "tier": "Budget", "pricePerDay": "actual budget daily cost in USD", "featured": false, "items": [{ "label": "Accommodation", "value": "actual budget hotel cost" },{ "label": "Food", "value": "actual budget food cost" },{ "label": "Transport", "value": "actual local transport cost" },{ "label": "Activities", "value": "actual budget activity cost" }] },\n' +
    '    { "tier": "Mid-Range", "pricePerDay": "actual mid-range daily cost in USD", "featured": true, "items": [{ "label": "Accommodation", "value": "actual mid hotel cost" },{ "label": "Food", "value": "actual mid food cost" },{ "label": "Transport", "value": "actual mid transport cost" },{ "label": "Activities", "value": "actual mid activity cost" }] },\n' +
    '    { "tier": "Luxury", "pricePerDay": "actual luxury daily cost in USD", "featured": false, "items": [{ "label": "Accommodation", "value": "actual luxury hotel cost" },{ "label": "Food", "value": "actual luxury food cost" },{ "label": "Transport", "value": "actual luxury transport cost" },{ "label": "Activities", "value": "actual luxury activity cost" }] }\n' +
    '  ],\n' +
    '  "tips": ["actual tip 1 in ' + selectedLang + '","actual tip 2","actual tip 3","actual tip 4","actual tip 5","actual tip 6"],\n' +
    '  "weatherByMonth": [\n' +
    '    { "month": "Jan", "temp": actual_jan_temp_celsius, "rainfall": actual_jan_rainfall_mm, "crowd": actual_jan_crowd_0_to_100, "desc": "actual Jan weather" },\n' +
    '    { "month": "Feb", "temp": actual_feb_temp, "rainfall": actual_feb_rainfall, "crowd": actual_feb_crowd, "desc": "actual Feb weather" },\n' +
    '    { "month": "Mar", "temp": actual_mar_temp, "rainfall": actual_mar_rainfall, "crowd": actual_mar_crowd, "desc": "actual Mar weather" },\n' +
    '    { "month": "Apr", "temp": actual_apr_temp, "rainfall": actual_apr_rainfall, "crowd": actual_apr_crowd, "desc": "actual Apr weather" },\n' +
    '    { "month": "May", "temp": actual_may_temp, "rainfall": actual_may_rainfall, "crowd": actual_may_crowd, "desc": "actual May weather" },\n' +
    '    { "month": "Jun", "temp": actual_jun_temp, "rainfall": actual_jun_rainfall, "crowd": actual_jun_crowd, "desc": "actual Jun weather" },\n' +
    '    { "month": "Jul", "temp": actual_jul_temp, "rainfall": actual_jul_rainfall, "crowd": actual_jul_crowd, "desc": "actual Jul weather" },\n' +
    '    { "month": "Aug", "temp": actual_aug_temp, "rainfall": actual_aug_rainfall, "crowd": actual_aug_crowd, "desc": "actual Aug weather" },\n' +
    '    { "month": "Sep", "temp": actual_sep_temp, "rainfall": actual_sep_rainfall, "crowd": actual_sep_crowd, "desc": "actual Sep weather" },\n' +
    '    { "month": "Oct", "temp": actual_oct_temp, "rainfall": actual_oct_rainfall, "crowd": actual_oct_crowd, "desc": "actual Oct weather" },\n' +
    '    { "month": "Nov", "temp": actual_nov_temp, "rainfall": actual_nov_rainfall, "crowd": actual_nov_crowd, "desc": "actual Nov weather" },\n' +
    '    { "month": "Dec", "temp": actual_dec_temp, "rainfall": actual_dec_rainfall, "crowd": actual_dec_crowd, "desc": "actual Dec weather" }\n' +
    '  ],\n' +
    '  "visaDetails": {\n' +
    '    "passportFriendly": ["actual visa-free countries for this destination"],\n' +
    '    "visaOnArrival": ["actual visa on arrival countries"],\n' +
    '    "visaRequired": ["actual countries that need advance visa"],\n' +
    '    "duration": "actual visa duration for this destination",\n' +
    '    "cost": "actual visa fee in USD",\n' +
    '    "processingTime": "actual processing time",\n' +
    '    "documents": ["actual required document 1","actual required document 2","actual required document 3"],\n' +
    '    "applyLink": "actual official visa application website URL",\n' +
    '    "notes": "actual important visa note for this destination"\n' +
    '  },\n' +
    '  "safetyIndex": {\n' +
    '    "overallScore": "actual safety score out of 10",\n' +
    '    "overallLabel": "actual safety label eg: Very Safe / Generally Safe / Exercise Caution / Dangerous",\n' +
    '    "crimeLevel": "actual crime level: Low or Medium or High",\n' +
    '    "crimeDesc": "actual one line about crime situation in this destination",\n' +
    '    "womenSafety": "actual women safety score out of 10",\n' +
    '    "womenDesc": "actual one line for solo women travelers in this destination",\n' +
    '    "healthRisk": "actual health risk: Low or Medium or High",\n' +
    '    "healthDesc": "actual vaccinations needed, water safety, hospital quality",\n' +
    '    "naturalDisaster": "actual disaster risk: Low or Medium or High",\n' +
    '    "disasterDesc": "actual natural disaster risks for this destination",\n' +
    '    "politicalStability": "actual stability: Stable or Moderate or Unstable",\n' +
    '    "politicalDesc": "actual one line about political situation",\n' +
    '    "advisoryLevel": "actual US travel advisory: Level 1 or Level 2 or Level 3 or Level 4",\n' +
    '    "advisoryDesc": "actual advisory description",\n' +
    '    "emergencyNumbers": {\n' +
    '      "police": "actual police emergency number of destination country",\n' +
    '      "ambulance": "actual ambulance number of destination country",\n' +
    '      "tourist": "actual tourist helpline number of destination country"\n' +
    '    },\n' +
    '    "safetyTips": ["actual safety tip 1 for this destination", "actual safety tip 2", "actual safety tip 3"]\n' +
    '  },\n' +
    '  "related": [\n' +
    '    { "name": "actual similar destination 1", "country": "actual country", "desc": "actual reason why similar", "emoji": "relevant emoji", "query": "complete travel guide to actual destination 1" },\n' +
    '    { "name": "actual similar destination 2", "country": "actual country", "desc": "actual reason why similar", "emoji": "relevant emoji", "query": "complete travel guide to actual destination 2" },\n' +
    '    { "name": "actual similar destination 3", "country": "actual country", "desc": "actual reason why similar", "emoji": "relevant emoji", "query": "complete travel guide to actual destination 3" }\n' +
    '  ]\n' +
    '}\n' +
    'IMPORTANT: Every single value must be REAL and ACCURATE for ' + query + '. Do NOT copy example values. Tailor everything to ' + budget + ' budget and ' + tripType + ' travel style.';
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
    return { src: p.src.large2x || p.src.large, thumb: p.src.small, term: p.photographer };
  });

  // Grid mein pehle 3 photos dikhao
  imgGrid.innerHTML = photos.slice(0, 3).map(function(p, idx) {
    return '<img src="' + p.src.medium + '" ' +
      'alt="' + searchQuery + '" loading="lazy" ' +
      'style="cursor:pointer;width:100%;height:100%;object-fit:cover;position:relative;z-index:10;" ' +
       'onclick="window.openLightbox(' + idx + ')">'
  }).join('');

  if (photos.length === 0) {
    imgGrid.innerHTML = '<div style="color:rgba(255,255,255,0.3);padding:20px;">No photos found</div>';
  }
})
.catch(function() {
  imgGrid.innerHTML = '<div style="color:rgba(255,255,255,0.3);padding:20px;">Photos could not be loaded</div>';
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
   // Safety Index render karo
if (data.safetyIndex) {
  renderSafetyIndex(data.safetyIndex);
  document.getElementById('safetySection').style.display = 'block';
} else {
  document.getElementById('safetySection').style.display = 'none';
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
   // Visa section
if (data.visaDetails) {
  document.getElementById('visaSection').style.display = 'block';
  document.getElementById('visaResultCard').style.display = 'none';
  document.getElementById('passportSelect').value = '';
}
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
const value = isMonetary ? convertPriceStr(item.value) : item.value;
const sub = isMonetary ? convertPriceStr(item.sub) : item.sub;
return '<div class="info-card" style="animation-delay:' + (i * 0.05) + 's">' +
  '<div class="info-card-icon">' + item.icon + '</div>' +
  '<div class="info-card-label">' + item.label + '</div>' +
  '<div class="info-card-value">' + value + '</div>' +
  '<div class="info-card-sub">' + sub + '</div></div>';
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
window.openLightbox = function(startIdx) {
  var photos = window._allPhotos || [];
  if (photos.length === 0) return;
  var current = startIdx;

  var lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.96);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;';

  function render() {
    var thumbs = '';
    for (var i = 0; i < photos.length; i++) {
      thumbs += '<img src="' + photos[i].thumb + '" onclick="window._lbGoto(' + i + ')" ' +
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
      '<div style="color:#C9A84C;font-size:13px;margin-top:16px;font-family:monospace;">' + (current + 1) + ' / ' + photos.length + '  —  📷 ' + photos[current].term + '</div>' +
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
  temperature: 0.7,
})
    });

    const data = await res.json();
    const fullText = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

    if (typing) typing.remove();
    chatHistory.push({ role: 'assistant', content: fullText });
    appendChatMsg('ai', markdownToHtml(fullText));

  } catch(err) {
    if (typing) typing.remove();
    appendChatMsg('ai', 'Sorry, something went wrong. Please try again!');
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
    alert('Please enter both destinations!');
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
    var responseText = await callGroq(prompt);
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
    '    "flag": "correct flag emoji for this country",\n' +
    '    "dailyBudget": "actual daily budget in USD for ' + selectedTripType + ' traveler",\n' +
    '    "bestSeason": "actual best months to visit",\n' +
    '    "visa": "actual visa requirement",\n' +
    '    "avgFlight": "actual flight cost in USD from ' + (window._userLocation ? window._userLocation.city + ', ' + window._userLocation.country : 'nearest major airport') + '",\n' +
    '    "safetyScore": "actual safety score out of 10",\n' +
    '    "language": "actual official language",\n' +
    '    "idealDays": "actual recommended duration",\n' +
    '    "highlights": "actual top 2-3 unique things about this destination"\n' +
    '  },\n' +
    '  "dest2": {\n' +
    '    "name": "Full name",\n' +
    '    "country": "Country",\n' +
    '    "flag": "correct flag emoji for this country",\n' +
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
      alert('Copy not supported in this browser. Please use Download instead!');
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
// ═══════════ VISA CHECKER ═══════════
function updateVisaInfo() {
  var passport = document.getElementById('passportSelect').value;
  if (!passport || !lastParsedData || !lastParsedData.visaDetails) return;

  var v = lastParsedData.visaDetails;
  var card = document.getElementById('visaResultCard');
  var badge = document.getElementById('visaStatusBadge');
  var grid = document.getElementById('visaDetailsGrid');

  card.style.display = 'block';

  var isFree = v.passportFriendly && v.passportFriendly.some(function(p) {
    return p.toLowerCase().indexOf(passport.toLowerCase()) >= 0 ||
           passport.toLowerCase().indexOf(p.toLowerCase()) >= 0;
  });
  var isVOA = v.visaOnArrival && v.visaOnArrival.some(function(p) {
    return p.toLowerCase().indexOf(passport.toLowerCase()) >= 0 ||
           passport.toLowerCase().indexOf(p.toLowerCase()) >= 0;
  });
  var isRequired = v.visaRequired && v.visaRequired.some(function(p) {
    return p.toLowerCase().indexOf(passport.toLowerCase()) >= 0 ||
           passport.toLowerCase().indexOf(p.toLowerCase()) >= 0;
  });

  var statusText, statusClass;
  if (isFree) {
    statusText = '✅ Visa Free Entry';
    statusClass = 'visa-free';
  } else if (isVOA) {
    statusText = '🟡 Visa on Arrival';
    statusClass = 'visa-voa';
  } else if (isRequired) {
    statusText = '🔴 Visa Required in Advance';
    statusClass = 'visa-required';
  } else {
    statusText = '🔵 Check Official Sources';
    statusClass = 'visa-check';
  }

  badge.textContent = statusText;
  badge.className = 'visa-status-badge ' + statusClass;

  var docs = (v.documents || []).map(function(d) {
    return '<li>' + d + '</li>';
  }).join('');

  grid.innerHTML =
    '<div class="visa-detail-item"><span class="vdi-label">Duration</span><span class="vdi-val">' + (v.duration || '—') + '</span></div>' +
    '<div class="visa-detail-item"><span class="vdi-label">Cost</span><span class="vdi-val">' + convertPriceStr(v.cost || '—') + '</span></div>' +
    '<div class="visa-detail-item"><span class="vdi-label">Processing</span><span class="vdi-val">' + (v.processingTime || '—') + '</span></div>' +
    '<div class="visa-detail-item full"><span class="vdi-label">Documents Required</span><ul class="visa-docs-list">' + docs + '</ul></div>' +
    (v.notes ? '<div class="visa-detail-item full"><span class="vdi-label">Important Note</span><span class="vdi-val">' + v.notes + '</span></div>' : '') +
    (v.applyLink ? '<div class="visa-detail-item full"><a href="' + v.applyLink + '" target="_blank" class="visa-apply-link">🔗 Apply / Check Official Visa Site →</a></div>' : '');
}
// ═══════════ VOICE SEARCH ═══════════
function startVoiceSearch() {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert('Your browser does not support voice search. Please use Chrome!');
    return;
  }

  var btn  = document.getElementById('voiceBtn');
  var icon = document.getElementById('voiceIcon');
  var input = document.getElementById('searchInput');

  var recog = new SpeechRecognition();
  recog.lang = 'en-US';
  recog.interimResults = true;
  recog.maxAlternatives = 1;

  // Listening shuru — button red ho jaata hai
  btn.classList.add('voice-listening');
  icon.innerHTML = '<circle cx="12" cy="12" r="10" fill="rgba(239,68,68,0.3)"/>' +
    '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor"/>' +
    '<path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor"/>' +
    '<line x1="12" y1="19" x2="12" y2="23" stroke="currentColor"/>' +
    '<line x1="8" y1="23" x2="16" y2="23" stroke="currentColor"/>';
  input.placeholder = '🎙️ Listening... speak now';

  recog.onresult = function(e) {
    var transcript = e.results[0][0].transcript;
    input.value = transcript;
    document.getElementById('searchClear').classList.add('visible');
  };

  recog.onend = function() {
    // Button wapas normal
    btn.classList.remove('voice-listening');
    icon.innerHTML = '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>' +
      '<path d="M19 10v2a7 7 0 0 1-14 0v-2"/>' +
      '<line x1="12" y1="19" x2="12" y2="23"/>' +
      '<line x1="8" y1="23" x2="16" y2="23"/>';
    input.placeholder = "e.g. 'Best time to visit Switzerland'...";

    // Agar kuch bola toh auto search
    if (input.value.trim()) {
      setTimeout(function() { handleSearch(); }, 500);
    }
  };

  recog.onerror = function(e) {
    btn.classList.remove('voice-listening');
    input.placeholder = "e.g. 'Best time to visit Switzerland'...";
    if (e.error === 'not-allowed') {
      alert('Please allow microphone permission in your browser!');
    }
  };

  recog.start();
}
// ═══════════ PHOTO → DESTINATION IDENTIFIER ═══════════
var photoBase64 = null;
var photoIdentifiedQuery = '';

function photoDragOver(e) {
  e.preventDefault();
  document.getElementById('photoDropZone').classList.add('dragover');
}

function photoDragLeave(e) {
  document.getElementById('photoDropZone').classList.remove('dragover');
}

function photoDrop(e) {
  e.preventDefault();
  document.getElementById('photoDropZone').classList.remove('dragover');
  var file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    processPhotoFile(file);
  }
}

function handlePhotoUpload(e) {
  var file = e.target.files[0];
  if (!file) return;
  processPhotoFile(file);
}

function processPhotoFile(file) {
  // File size check — 10MB max
  if (file.size > 10 * 1024 * 1024) {
    alert('Photo is too large! Please use a photo under 10MB.');
    return;
  }

  var reader = new FileReader();
  reader.onload = function(e) {
    var result = e.target.result;
    // base64 string extract karo (data:image/jpeg;base64, ke baad wala part)
    photoBase64 = result.split(',')[1];
    var mimeType = file.type || 'image/jpeg';
    window._photoMimeType = mimeType;

    // Preview dikhao
    document.getElementById('photoPreviewImg').src = result;
    document.getElementById('photoDropZone').style.display = 'none';
    document.getElementById('photoPreviewWrap').style.display = 'block';
    document.getElementById('photoIdentifyBtn').style.display = 'flex';
    document.getElementById('photoResult').style.display = 'none';
    document.getElementById('photoError').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removePhoto() {
  photoBase64 = null;
  photoIdentifiedQuery = '';
  document.getElementById('photoFileInput').value = '';
  document.getElementById('photoPreviewImg').src = '';
  document.getElementById('photoDropZone').style.display = 'flex';
  document.getElementById('photoPreviewWrap').style.display = 'none';
  document.getElementById('photoIdentifyBtn').style.display = 'none';
  document.getElementById('photoResult').style.display = 'none';
  document.getElementById('photoError').style.display = 'none';
}

async function identifyDestination() {
  if (!photoBase64) return;

  // Loading dikhao
  document.getElementById('photoIdentifyBtn').style.display = 'none';
  document.getElementById('photoLoading').style.display = 'flex';
  document.getElementById('photoResult').style.display = 'none';
  document.getElementById('photoError').style.display = 'none';

  try {
    var mimeType = window._photoMimeType || 'image/jpeg';

    var res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-maverick-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: 'data:' + mimeType + ';base64,' + photoBase64
                }
              },
              {
                type: 'text',
                text: 'Identify the travel destination or location in this photo. Respond ONLY with valid JSON, no markdown, no backticks:\n' +
                  '{\n' +
                  '  "destination": "City or Place Name",\n' +
                  '  "country": "Country Name",\n' +
                  '  "flag": "🌍",\n' +
                  '  "confidence": "High / Medium / Low",\n' +
                  '  "description": "One line about this place and why it is famous",\n' +
                  '  "landmarks": ["landmark1", "landmark2"],\n' +
                  '  "searchQuery": "Complete travel guide to [destination] [country]"\n' +
                  '}'
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!res.ok) {
      var errData = await res.json().catch(function() { return {}; });
      throw new Error((errData.error && errData.error.message) || 'API Error: ' + res.status);
    }

    var data = await res.json();
    var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!text) throw new Error('Koi response nahi mila.');

    // JSON parse karo
    var clean = text.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');
    var parsed = JSON.parse(clean);

    // Result dikhao
    photoIdentifiedQuery = parsed.searchQuery || ('Complete travel guide to ' + parsed.destination + ' ' + parsed.country);

    document.getElementById('photoResultFlag').textContent = parsed.flag || '🌍';
    document.getElementById('photoResultName').textContent = parsed.destination || 'Unknown';
    document.getElementById('photoResultCountry').textContent = parsed.country || '';
    document.getElementById('photoResultDesc').textContent = parsed.description || '';

    var confidenceColor = parsed.confidence === 'High' ? '#4ade80' : parsed.confidence === 'Medium' ? '#facc15' : '#f87171';
    document.getElementById('photoConfidence').innerHTML =
      'AI Confidence: <span style="color:' + confidenceColor + ';font-weight:600;">' + (parsed.confidence || 'Medium') + '</span>' +
      (parsed.landmarks && parsed.landmarks.length > 0 ? ' &nbsp;·&nbsp; Landmarks: ' + parsed.landmarks.join(', ') : '');

    document.getElementById('photoLoading').style.display = 'none';
    document.getElementById('photoResult').style.display = 'block';
    document.getElementById('photoIdentifyBtn').style.display = 'flex';

  } catch(err) {
    document.getElementById('photoLoading').style.display = 'none';
    document.getElementById('photoIdentifyBtn').style.display = 'flex';
    document.getElementById('photoErrorMsg').textContent = err.message || 'Could not identify. Please try another photo.';
    document.getElementById('photoError').style.display = 'block';
    console.error('Photo identify error:', err);
  }
}

function searchFromPhotoResult() {
  if (!photoIdentifiedQuery) return;
  var input = document.getElementById('searchInput');
  input.value = photoIdentifiedQuery;
  document.getElementById('searchClear').classList.add('visible');
  document.getElementById('explore').scrollIntoView({ behavior: 'smooth' });
  setTimeout(function() { handleSearch(); }, 600);
}
// ═══════════ DREAM TRIP GENERATOR ═══════════
function fillDreamInput(text) {
  var input = document.getElementById('dreamInput');
  input.value = text;
  input.focus();
}

async function generateDreamTrip() {
  var input = document.getElementById('dreamInput');
  var mood  = (input.value || '').trim();

  if (!mood) {
    input.focus();
    input.placeholder = '⚠️ Please describe your mood first!';
    setTimeout(function() {
      input.placeholder = "e.g. 'I want snow mountains and adventure under $1500'...";
    }, 2000);
    return;
  }

  var btn = document.getElementById('dreamBtn');
  btn.disabled = true;
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Searching...</span>';
  document.getElementById('dreamLoading').style.display = 'flex';
  document.getElementById('dreamResults').style.display = 'none';
  document.getElementById('dreamError').style.display   = 'none';

  var prompt = 'You are a world travel expert. A traveler describes their dream trip as: "' + mood + '"\n' +
    'Suggest exactly 3 perfect destinations that match this vibe, budget, and style.\n' +
    'Consider trip type: ' + selectedTripType + ' and budget preference: ' + selectedBudget + '\n' +
    'IMPORTANT: All prices in USD using $ symbol.\n' +
    'Respond ONLY with valid JSON, no markdown, no backticks:\n' +
    '{\n' +
    '  "trips": [\n' +
    '    {\n' +
    '      "destination": "City, Country",\n' +
    '      "country": "Country",\n' +
    '      "flag": "🌍",\n' +
    '      "matchScore": actual match percentage 0-100 based on how well it matches the travelers mood,\n' +
    '      "avgBudget": "actual total trip budget in USD for ' + selectedBudget + ' traveler",\n' +
    '      "bestSeason": "actual best months for this destination",\n' +
    '      "topThings": ["actual top thing 1", "actual top thing 2", "actual top thing 3"],\n' +
    '      "hiddenGem": "actual unique lesser-known fact about this place",\n' +
    '      "searchQuery": "Complete travel guide to [destination]"\n' +
    '    }\n' +
    '  ]\n' +
    '}';

  try {
    var res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY
      },
      body: JSON.stringify({
  model: GROQ_MODEL,
  messages: [{ role: 'user', content: prompt }],
  max_tokens: 1500,
  temperature: 0.8,
})
    });

    if (!res.ok) {
      var errData = await res.json().catch(function() { return {}; });
      throw new Error((errData.error && errData.error.message) || 'API Error: ' + res.status);
    }

    var data = await res.json();
    var text = data.choices && data.choices[0] &&
               data.choices[0].message && data.choices[0].message.content;
    if (!text) throw new Error('No response received.');

    var clean = text.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');
    var parsed = JSON.parse(clean);

    renderDreamResults(parsed.trips || []);

  } catch(err) {
    document.getElementById('dreamLoading').style.display = 'none';
    document.getElementById('dreamErrorMsg').textContent = err.message || 'Something went wrong. Please try again!';
    document.getElementById('dreamError').style.display  = 'block';
    console.error('Dream trip error:', err);
  }

  btn.disabled = false;
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span>Find My Dream Trip</span>';
}

function renderDreamResults(trips) {
  document.getElementById('dreamLoading').style.display = 'none';

  if (!trips || trips.length === 0) {
    document.getElementById('dreamErrorMsg').textContent = 'No results found. Please try again!';
    document.getElementById('dreamError').style.display  = 'block';
    return;
  }

  var grid = document.getElementById('dreamCardsGrid');

  grid.innerHTML = trips.map(function(trip, i) {
    var scoreColor =
      trip.matchScore >= 90 ? '#4ade80' :
      trip.matchScore >= 75 ? '#facc15' : '#f87171';

    var topThings = (trip.topThings || []).map(function(t) {
      return '<span class="dream-thing">' + t + '</span>';
    }).join('');

    return '<div class="dream-result-card" style="animation-delay:' + (i * 0.12) + 's">' +

      '<div class="dream-card-top">' +
        '<div class="dream-card-flag">' + (trip.flag || '🌍') + '</div>' +
        '<div class="dream-match-score" style="color:' + scoreColor + '">' +
          '<span class="score-num">' + (trip.matchScore || 0) + '</span>' +
          '<span class="score-pct">% match</span>' +
        '</div>' +
      '</div>' +

      '<div class="dream-card-name">' + (trip.destination || '') + '</div>' +
      '<div class="dream-card-reason">' + (trip.matchReason || '') + '</div>' +

      '<div class="dream-card-meta">' +
        '<span>💰 ' + convertPriceStr(trip.avgBudget || '—') + '</span>' +
        '<span>📅 ' + (trip.bestSeason || '—') + '</span>' +
        '<span>🎯 ' + (trip.bestFor || '—') + '</span>' +
      '</div>' +

      '<div class="dream-things-wrap">' + topThings + '</div>' +

      (trip.hiddenGem ?
        '<div class="dream-hidden-gem">💎 ' + trip.hiddenGem + '</div>' : '') +

      '<button class="dream-explore-btn" onclick="searchFromCard(\'' + escapeAttr(trip.searchQuery || '') + '\')">' +
        '✈️ View Full Guide →' +
      '</button>' +

    '</div>';
  }).join('');

  document.getElementById('dreamResults').style.display = 'block';
  document.getElementById('dreamResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
// ═══════════ PDF TRIP REPORT EXPORT ═══════════
async function exportTripPDF() {
  if (!lastParsedData) return;

  var btn = document.getElementById('pdfExportBtn');
  btn.disabled = true;
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Generating PDF...</span>';

  try {
    var d    = lastParsedData;
    var jsPDF = window.jspdf.jsPDF;
    var doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var W    = 210;
    var margin = 18;
    var y    = 0;
    var c    = CURRENCIES[selectedCurrency];

    // ── helper functions ──────────────────────────────
    function addPage() {
      doc.addPage();
      y = 20;
      // header line on every page
      doc.setDrawColor(201, 168, 76);
      doc.setLineWidth(0.4);
      doc.line(margin, 12, W - margin, 12);
      doc.setFontSize(8);
      doc.setTextColor(150, 130, 80);
      doc.text('WorldAI360  •  ' + d.destination + '  •  AI Travel Report', margin, 10);
      doc.setTextColor(30, 30, 30);
    }

    function checkY(needed) {
      if (y + needed > 272) addPage();
    }

    function sectionTitle(title) {
      checkY(14);
      doc.setFillColor(245, 240, 220);
      doc.roundedRect(margin, y, W - margin * 2, 9, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 85, 20);
      doc.text(title, margin + 4, y + 6.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      y += 13;
    }

    function bodyText(text, indent) {
      indent = indent || 0;
      var lines = doc.splitTextToSize(text, W - margin * 2 - indent);
      lines.forEach(function(line) {
        checkY(6);
        doc.setFontSize(9.5);
        doc.setTextColor(50, 50, 50);
        doc.text(line, margin + indent, y);
        y += 5.5;
      });
    }

    function bulletPoint(text) {
      checkY(6);
      doc.setFontSize(9);
      doc.setTextColor(201, 168, 76);
      doc.text('•', margin + 2, y);
      doc.setTextColor(50, 50, 50);
      var lines = doc.splitTextToSize(text, W - margin * 2 - 8);
      lines.forEach(function(line, i) {
        doc.text(line, margin + 8, y);
        y += 5.2;
      });
    }

    function twoCol(label, value) {
      checkY(7);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(label + ':', margin + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(String(value), margin + 50, y);
      y += 6;
    }

    // ── PAGE 1 — COVER ────────────────────────────────
    // Dark header block
    doc.setFillColor(10, 15, 26);
    doc.rect(0, 0, W, 70, 'F');

    // Gold accent line
    doc.setFillColor(201, 168, 76);
    doc.rect(0, 70, W, 1.5, 'F');

    // WorldAI360 branding
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 130, 80);
    doc.text('◎  WORLDAI360  —  AI TRAVEL INTELLIGENCE', margin, 16);

    // Destination name
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(201, 168, 76);
    var destName = d.destination || 'Travel Report';
    // Long name split karo
    if (destName.length > 22) {
      doc.setFontSize(20);
    }
    doc.text(destName, margin, 38);

    // Country + region
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 170, 150);
    doc.text((d.flag || '🌍') + '  ' + (d.country || '') + '   •   ' + (d.region || ''), margin, 50);

    // Tagline
    doc.setFontSize(10);
    doc.setTextColor(140, 130, 110);
    doc.setFont('helvetica', 'italic');
    var tagLines = doc.splitTextToSize(d.tagline || '', W - margin * 2);
    doc.text(tagLines, margin, 62);

    // Reset
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);

    y = 82;

    // ── QUICK INFO GRID ───────────────────────────────
    sectionTitle('✈  Quick Info');
    var qi = d.quickInfo || [];
    var colW = (W - margin * 2) / 3;
    var row = 0;
    qi.forEach(function(item, i) {
      var col = i % 3;
      if (col === 0 && i > 0) { y += 20; row++; }
      var x = margin + col * colW;
      checkY(20);
      doc.setFillColor(248, 246, 240);
      doc.roundedRect(x, y - 2, colW - 3, 18, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(150, 130, 80);
      doc.text(item.icon + ' ' + item.label, x + 3, y + 4);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      var val = (item.label === 'Daily Budget' || item.label === 'Avg Flight') ?
        convertPriceStr(item.value) : item.value;
      doc.text(val, x + 3, y + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      var subLines = doc.splitTextToSize(item.sub || '', colW - 6);
      doc.text(subLines[0] || '', x + 3, y + 15);
    });
    y += 24;

    // ── BEST SEASONS ──────────────────────────────────
    checkY(10);
    sectionTitle('📅  Best Time to Visit');
    (d.seasons || []).forEach(function(s) {
      checkY(12);
      if (s.best) {
        doc.setFillColor(240, 255, 240);
        doc.roundedRect(margin, y - 2, W - margin * 2, 10, 2, 2, 'F');
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(s.best ? 30 : 60, s.best ? 100 : 60, s.best ? 30 : 60);
      doc.text((s.best ? '⭐ ' : '   ') + s.name + '  (' + s.months + ')', margin + 3, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8.5);
      var descLines = doc.splitTextToSize(s.desc || '', W - margin * 2 - 80);
      doc.text(descLines[0] || '', margin + 75, y + 5);
      y += 11;
    });
    y += 4;

    // ── BUDGET BREAKDOWN ──────────────────────────────
    checkY(10);
    sectionTitle('💰  Budget Breakdown  (' + c.flag + ' ' + selectedCurrency + ')');
    (d.budgetBreakdown || []).forEach(function(b) {
      checkY(8);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(b.featured ? 120 : 60, b.featured ? 85 : 60, b.featured ? 20 : 60);
      doc.text((b.featured ? '★ ' : '  ') + b.tier + '  —  ' + convertPriceStr(b.pricePerDay) + ' / person / day', margin + 2, y);
      y += 5.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(90, 90, 90);
      (b.items || []).forEach(function(item) {
        checkY(5.5);
        doc.text('       ' + item.label + ':  ' + convertPriceStr(item.value), margin + 2, y);
        y += 5;
      });
      y += 3;
    });

    // ── NEW PAGE — AI TRAVEL GUIDE ────────────────────
    addPage();
    sectionTitle('🌍  AI Travel Guide');

    // Strip markdown
    var aiText = (d.aiResponse || '')
      .replace(/###\s*/g, '\n')
      .replace(/##\s*/g, '\n')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^- /gm, '• ')
      .trim();

    var aiLines = aiText.split('\n');
    aiLines.forEach(function(line) {
      line = line.trim();
      if (!line) { y += 2; return; }
      if (line.startsWith('###') || line.startsWith('##') ||
          (line.length < 50 && line === line.toUpperCase())) {
        checkY(10);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 85, 20);
        doc.text(line.replace(/^#+\s*/, ''), margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        y += 7;
      } else if (line.startsWith('•')) {
        bulletPoint(line.replace(/^•\s*/, ''));
      } else {
        bodyText(line);
      }
    });

    // ── PRO TIPS ──────────────────────────────────────
    checkY(14);
    sectionTitle('💡  Pro Travel Tips');
    (d.tips || []).forEach(function(tip, i) {
      checkY(8);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(201, 168, 76);
      doc.text(String(i + 1).padStart(2, '0') + '.', margin + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      var tipLines = doc.splitTextToSize(tip, W - margin * 2 - 12);
      tipLines.forEach(function(tl) {
        checkY(5.5);
        doc.text(tl, margin + 12, y);
        y += 5.2;
      });
      y += 2;
    });

    // ── RELATED DESTINATIONS ──────────────────────────
    checkY(14);
    sectionTitle('🗺️  You Might Also Love');
    (d.related || []).forEach(function(r) {
      checkY(8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(r.emoji + '  ' + r.name + '  —  ' + r.country, margin + 3, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8.5);
      doc.text(r.desc || '', margin + 3, y + 5);
      y += 11;
    });

    // ── LAST PAGE FOOTER ──────────────────────────────
    checkY(20);
    y += 6;
    doc.setDrawColor(201, 168, 76);
    doc.setLineWidth(0.3);
    doc.line(margin, y, W - margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(150, 130, 80);
    doc.text('Generated by WorldAI360  •  AI-Powered Travel Intelligence  •  worldai360.com', margin, y);
    y += 5;
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 160);
    doc.text('Travel data is AI-generated. Always verify with official sources before traveling.', margin, y);

    // ── SAVE ──────────────────────────────────────────
    var filename = (d.destination || 'trip')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase() + '-travel-report.pdf';

    doc.save(filename);

  } catch(err) {
    console.error('PDF error:', err);
    alert('PDF export error: ' + err.message);
  }

  btn.disabled = false;
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg><span>Download PDF Trip Report</span>';
}
// ═══════════ 3D INTERACTIVE GLOBE ═══════════
var globeInstance = null;
var globeInitialized = false;

var globeDestinations = [
  { name: 'Bali',         country: 'Indonesia',  lat:  -8.34,  lng: 115.09, color: '#C9A84C', query: 'Complete travel guide to Bali Indonesia'           },
  { name: 'Paris',        country: 'France',      lat:  48.85,  lng:   2.35, color: '#C9A84C', query: 'Complete travel guide to Paris France'             },
  { name: 'Tokyo',        country: 'Japan',       lat:  35.68,  lng: 139.69, color: '#C9A84C', query: 'Complete travel guide to Tokyo Japan'              },
  { name: 'New York',     country: 'USA',         lat:  40.71,  lng: -74.00, color: '#C9A84C', query: 'Complete travel guide to New York USA'             },
  { name: 'Dubai',        country: 'UAE',         lat:  25.20,  lng:  55.27, color: '#C9A84C', query: 'Complete travel guide to Dubai UAE'                },
  { name: 'London',       country: 'UK',          lat:  51.50,  lng:  -0.12, color: '#C9A84C', query: 'Complete travel guide to London UK'                },
  { name: 'Sydney',       country: 'Australia',   lat: -33.86,  lng: 151.20, color: '#C9A84C', query: 'Complete travel guide to Sydney Australia'         },
  { name: 'Rome',         country: 'Italy',       lat:  41.90,  lng:  12.49, color: '#C9A84C', query: 'Complete travel guide to Rome Italy'               },
  { name: 'Maldives',     country: 'Maldives',    lat:   3.20,  lng:  73.22, color: '#4ade80', query: 'Complete travel guide to Maldives'                 },
  { name: 'Santorini',    country: 'Greece',      lat:  36.39,  lng:  25.46, color: '#C9A84C', query: 'Complete travel guide to Santorini Greece'         },
  { name: 'Machu Picchu', country: 'Peru',        lat: -13.16,  lng: -72.54, color: '#f87171', query: 'Complete travel guide to Machu Picchu Peru'        },
  { name: 'Cairo',        country: 'Egypt',       lat:  30.04,  lng:  31.23, color: '#C9A84C', query: 'Complete travel guide to Cairo Egypt'              },
  { name: 'Bangkok',      country: 'Thailand',    lat:  13.75,  lng: 100.52, color: '#C9A84C', query: 'Complete travel guide to Bangkok Thailand'         },
  { name: 'Cape Town',    country: 'South Africa',lat: -33.92,  lng:  18.42, color: '#4ade80', query: 'Complete travel guide to Cape Town South Africa'   },
  { name: 'Kyoto',        country: 'Japan',       lat:  35.01,  lng: 135.76, color: '#f87171', query: 'Complete travel guide to Kyoto Japan'              },
  { name: 'Barcelona',    country: 'Spain',       lat:  41.38,  lng:   2.17, color: '#C9A84C', query: 'Complete travel guide to Barcelona Spain'          },
  { name: 'Istanbul',     country: 'Turkey',      lat:  41.01,  lng:  28.97, color: '#C9A84C', query: 'Complete travel guide to Istanbul Turkey'          },
  { name: 'Singapore',    country: 'Singapore',   lat:   1.35,  lng: 103.82, color: '#4ade80', query: 'Complete travel guide to Singapore'                },
  { name: 'Queenstown',   country: 'New Zealand', lat: -45.03,  lng: 168.66, color: '#f87171', query: 'Complete travel guide to Queenstown New Zealand'   },
  { name: 'Marrakech',    country: 'Morocco',     lat:  31.63,  lng:  -7.99, color: '#f87171', query: 'Complete travel guide to Marrakech Morocco'        },
  { name: 'Bengaluru',    country: 'India',       lat:  12.97,  lng:  77.59, color: '#60a5fa', query: 'Complete travel guide to Bengaluru India'          },
  { name: 'Mumbai',       country: 'India',       lat:  19.07,  lng:  72.87, color: '#60a5fa', query: 'Complete travel guide to Mumbai India'             },
  { name: 'Goa',          country: 'India',       lat:  15.29,  lng:  74.12, color: '#60a5fa', query: 'Complete travel guide to Goa India'                },
  { name: 'Rajasthan',    country: 'India',       lat:  27.02,  lng:  74.21, color: '#60a5fa', query: 'Complete travel guide to Rajasthan India'          },
  { name: 'Iceland',      country: 'Iceland',     lat:  64.96,  lng: -19.02, color: '#f87171', query: 'Complete travel guide to Iceland'                  },
];

function initGlobe() {
  if (globeInitialized) return;

  var container = document.getElementById('globeContainer');
  if (!container) return;

  // Size
  var size = Math.min(window.innerWidth * 0.85, 680);
  container.style.width  = size + 'px';
  container.style.height = size + 'px';

  // Wishlist pins gold mein dikhao
  var wishlist = loadBucketList();
  var allPoints = globeDestinations.map(function(d) {
    var inWishlist = wishlist.some(function(w) {
      return w.destination && w.destination.toLowerCase().indexOf(d.name.toLowerCase()) >= 0;
    });
    return Object.assign({}, d, {
      color:  inWishlist ? '#ff6b6b' : d.color,
      size:   inWishlist ? 0.6 : 0.45,
      label:  d.name + '\n' + d.country
    });
  });

  try {
    globeInstance = Globe()(container)
      // Earth texture
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')

      // Atmosphere
      .showAtmosphere(true)
      .atmosphereColor('#1a4080')
      .atmosphereAltitude(0.15)

      // Points (destination pins)
      .pointsData(allPoints)
      .pointLat('lat')
      .pointLng('lng')
      .pointColor('color')
      .pointRadius('size')
      .pointAltitude(0.02)
      .pointResolution(12)

      // Hover tooltip
      .onPointHover(function(point) {
        var tooltip = document.getElementById('globeTooltip');
        if (point) {
          document.getElementById('globeTooltipFlag').textContent = '📍';
          document.getElementById('globeTooltipName').textContent = point.name + ', ' + point.country;
          tooltip.style.display = 'block';
          container.style.cursor = 'pointer';
        } else {
          tooltip.style.display = 'none';
          container.style.cursor = 'grab';
        }
      })

      // Click — search trigger
      .onPointClick(function(point) {
        if (!point || !point.query) return;

        // Ripple animation
        showGlobeRipple(point);

        // Scroll to search aur guide load karo
        setTimeout(function() {
          searchFromCard(point.query);
        }, 600);
      })

      // Size
      .width(size)
      .height(size);

    // Auto rotate
    globeInstance.controls().autoRotate      = true;
    globeInstance.controls().autoRotateSpeed = 0.6;
    globeInstance.controls().enableZoom      = true;
    globeInstance.controls().minDistance     = 150;
    globeInstance.controls().maxDistance     = 500;

    // India ke upar start karo (Bengaluru user hai)
    globeInstance.pointOfView({ lat: 15, lng: 78, altitude: 2.2 }, 0);

    globeInitialized = true;

  } catch(err) {
    console.error('Globe init error:', err);
    container.innerHTML =
      '<div style="color:rgba(255,255,255,0.4);text-align:center;padding:60px 20px;">' +
      '🌍<br><br>Globe could not load.<br>Please refresh the page.</div>';

  }
}

function showGlobeRipple(point) {
  if (!globeInstance) return;
  var rings = [{ lat: point.lat, lng: point.lng, maxR: 3, propagationSpeed: 2, repeatPeriod: 700 }];
  globeInstance
    .ringsData(rings)
    .ringColor(function() { return '#C9A84C'; })
    .ringMaxRadius('maxR')
    .ringPropagationSpeed('propagationSpeed')
    .ringRepeatPeriod('repeatPeriod');

  setTimeout(function() {
    if (globeInstance) globeInstance.ringsData([]);
  }, 2000);
}

// Globe tab mein aate hi initialize karo — IntersectionObserver se
function initGlobeObserver() {
  var section = document.getElementById('globeSection');
  if (!section) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && !globeInitialized) {
        // Libraries load hone ka wait karo
        setTimeout(initGlobe, 300);
      }
    });
  }, { threshold: 0.2 });

  observer.observe(section);
}

// Destination pills under globe
function renderGlobeDestPills() {
  var wrap = document.getElementById('globeDestPills');
  if (!wrap) return;

  var featured = globeDestinations.slice(0, 12);
  wrap.innerHTML = featured.map(function(d) {
    return '<button class="globe-dest-pill" onclick="flyToDestination(' +
      d.lat + ',' + d.lng + ',\'' + escapeAttr(d.query) + '\')">' +
      d.name +
      '</button>';
  }).join('');
}

function flyToDestination(lat, lng, query) {
  if (globeInstance) {
    // Rotate band karo jab fly kar rahe hain
    globeInstance.controls().autoRotate = false;

    globeInstance.pointOfView({ lat: lat, lng: lng, altitude: 1.5 }, 1200);

    // 3 second baad wapas rotate shuru
    setTimeout(function() {
      if (globeInstance) globeInstance.controls().autoRotate = true;
    }, 3000);
  }

  // Search trigger
  setTimeout(function() {
    searchFromCard(query);
  }, 1400);
}

// Window resize pe globe resize karo
window.addEventListener('resize', function() {
  if (!globeInstance || !globeInitialized) return;
  var size = Math.min(window.innerWidth * 0.85, 680);
  globeInstance.width(size).height(size);
  document.getElementById('globeContainer').style.width  = size + 'px';
  document.getElementById('globeContainer').style.height = size + 'px';
});

// DOMContentLoaded pe observer aur pills init karo
document.addEventListener('DOMContentLoaded', function() {
  initGlobeObserver();
  renderGlobeDestPills();
});
// ═══════════ SAFETY INDEX DASHBOARD ═══════════
function renderSafetyIndex(s) {
  if (!s) return;

  // Overall score color decide karo
  var scoreNum = parseFloat(s.overallScore) || 0;
  var scoreColor =
    scoreNum >= 8 ? '#4ade80' :
    scoreNum >= 6 ? '#facc15' :
    scoreNum >= 4 ? '#fb923c' : '#f87171';

  // Score circle
  var circle = document.getElementById('safetyScoreCircle');
  circle.style.borderColor = scoreColor;
  circle.style.boxShadow   = '0 0 24px ' + scoreColor + '44';
  document.getElementById('safetyScoreNum').textContent  = s.overallScore || '—';
  document.getElementById('safetyScoreNum').style.color  = scoreColor;
  document.getElementById('safetyOverallLabel').textContent = s.overallLabel || '';
  document.getElementById('safetyOverallLabel').style.color = scoreColor;

  // Advisory level color
  var advColor =
    s.advisoryLevel === 'Level 1' ? '#4ade80' :
    s.advisoryLevel === 'Level 2' ? '#facc15' :
    s.advisoryLevel === 'Level 3' ? '#fb923c' : '#f87171';

  var advEl = document.getElementById('safetyAdvisory');
  advEl.textContent   = s.advisoryLevel || '';
  advEl.style.color   = advColor;
  advEl.style.background = advColor + '22';
  advEl.style.border  = '1px solid ' + advColor + '44';

  document.getElementById('safetyAdvisoryDesc').textContent = s.advisoryDesc || '';

  // Safety cards data
  var cards = [
    {
      icon: '🔫',
      label: 'Crime Level',
      value: s.crimeLevel || '—',
      desc: s.crimeDesc || '',
      color: s.crimeLevel === 'Low' ? '#4ade80' : s.crimeLevel === 'Medium' ? '#facc15' : '#f87171'
    },
    {
      icon: '👩',
      label: 'Women Safety',
      value: s.womenSafety || '—',
      desc: s.womenDesc || '',
      color: parseFloat(s.womenSafety) >= 7 ? '#4ade80' : parseFloat(s.womenSafety) >= 5 ? '#facc15' : '#f87171'
    },
    {
      icon: '🏥',
      label: 'Health Risk',
      value: s.healthRisk || '—',
      desc: s.healthDesc || '',
      color: s.healthRisk === 'Low' ? '#4ade80' : s.healthRisk === 'Medium' ? '#facc15' : '#f87171'
    },
    {
      icon: '🌪️',
      label: 'Natural Disaster',
      value: s.naturalDisaster || '—',
      desc: s.disasterDesc || '',
      color: s.naturalDisaster === 'Low' ? '#4ade80' : s.naturalDisaster === 'Medium' ? '#facc15' : '#f87171'
    },
    {
      icon: '🏛️',
      label: 'Political Stability',
      value: s.politicalStability || '—',
      desc: s.politicalDesc || '',
      color: s.politicalStability === 'Stable' ? '#4ade80' : s.politicalStability === 'Moderate' ? '#facc15' : '#f87171'
    }
  ];

  // Cards render karo
  var grid = document.getElementById('safetyGrid');
  grid.innerHTML = cards.map(function(card, i) {
    return '<div class="safety-card" style="animation-delay:' + (i * 0.07) + 's">' +
      '<div class="safety-card-top">' +
        '<span class="safety-card-icon">' + card.icon + '</span>' +
        '<span class="safety-card-value" style="color:' + card.color + '">' + card.value + '</span>' +
      '</div>' +
      '<div class="safety-card-label">' + card.label + '</div>' +
      '<div class="safety-card-desc">' + card.desc + '</div>' +
      '<div class="safety-card-bar-wrap">' +
        '<div class="safety-card-bar" style="background:' + card.color + ';width:' + getBarWidth(card.value, card.label) + '%"></div>' +
      '</div>' +
    '</div>';
  }).join('');

  // Emergency numbers
  var emNums = s.emergencyNumbers || {};
  var emGrid = document.getElementById('safetyEmergencyGrid');
  var emItems = [
    { icon: '👮', label: 'Police',    val: emNums.police    || '—' },
    { icon: '🚑', label: 'Ambulance', val: emNums.ambulance || '—' },
    { icon: 'ℹ️', label: 'Tourist',   val: emNums.tourist   || '—' }
  ];
  emGrid.innerHTML = emItems.map(function(em) {
    return '<div class="safety-em-item">' +
      '<span class="safety-em-icon">' + em.icon + '</span>' +
      '<span class="safety-em-label">' + em.label + '</span>' +
      '<span class="safety-em-num">' + em.val + '</span>' +
    '</div>';
  }).join('');

  // Safety tips
  var tips = s.safetTips || s.safetyTips || [];
  var tipsList = document.getElementById('safetyTipsList');
  tipsList.innerHTML = tips.map(function(tip, i) {
    return '<div class="safety-tip-item">' +
      '<span class="safety-tip-num">' + (i + 1) + '</span>' +
      '<span class="safety-tip-text">' + tip + '</span>' +
    '</div>';
  }).join('');
}

// Bar width helper — value se percentage nikalo
function getBarWidth(value, label) {
  if (label === 'Women Safety') {
    var n = parseFloat(value) || 5;
    return Math.round((n / 10) * 100);
  }
  if (value === 'Low'      || value === 'Stable')   return 85;
  if (value === 'Medium'   || value === 'Moderate') return 50;
  if (value === 'High'     || value === 'Unstable') return 20;
  // Score jaise 7.5/10
  var match = String(value).match(/^([\d.]+)/);
  if (match) return Math.round((parseFloat(match[1]) / 10) * 100);
  return 50;
}
