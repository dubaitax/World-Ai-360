// =============================================
//  WORLD AI 360 — Main Script
//  js/script.js
// =============================================

// ---- GEMINI API CONFIG ----
const GEMINI_MODEL  = 'gemini-2.0-flash';
const GEMINI_URL    = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const STORAGE_KEY   = 'world_ai_360_gemini_key';

// ---- STATE ----
let currentCat    = 'Trending';
let currentFilter = 'All';
let geminiApiKey  = localStorage.getItem(STORAGE_KEY) || '';

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  if (!geminiApiKey) {
    showApiModal();
  } else {
    init();
  }

  document.getElementById('searchInput')
    .addEventListener('keydown', e => { if (e.key === 'Enter') searchDestination(); });
});

function init() {
  renderDestinations('Trending');
  renderRegions();
}

// =============================================
//  API KEY MODAL
// =============================================
function showApiModal() {
  document.getElementById('apiModal').classList.remove('hidden');
}

function hideApiModal() {
  document.getElementById('apiModal').classList.add('hidden');
}

function saveApiKey() {
  const val = document.getElementById('apiKeyInput').value.trim();
  if (!val || !val.startsWith('AIza')) {
    alert('Please enter a valid Gemini API key (starts with AIza...)');
    return;
  }
  geminiApiKey = val;
  localStorage.setItem(STORAGE_KEY, val);
  hideApiModal();
  init();
}

// =============================================
//  GEMINI API CALL
// =============================================
async function callGemini(systemPrompt, userMessage) {
  if (!geminiApiKey) { showApiModal(); throw new Error('No API key'); }

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: { maxOutputTokens: 1200, temperature: 0.8 }
  };

  const res = await fetch(`${GEMINI_URL}?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    if (res.status === 400 || res.status === 403) {
      localStorage.removeItem(STORAGE_KEY);
      geminiApiKey = '';
      showApiModal();
      throw new Error('Invalid API key — please re-enter.');
    }
    throw new Error(msg);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
}

// =============================================
//  SEARCH DESTINATION
// =============================================
async function searchDestination() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) { alert('Please enter a destination!'); return; }

  const panel  = document.getElementById('aiPanel');
  const result = document.getElementById('aiResult');
  const actions = document.getElementById('aiActions');

  panel.classList.add('visible');
  actions.innerHTML = '';
  result.innerHTML = `
    <div class="ai-loading">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      <span class="loading-text">Searching ${escHtml(q)}...</span>
    </div>`;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const system = `You are World AI 360 — the world's smartest travel intelligence system designed for Indian travellers.
When asked about any destination, give a rich response using this structure:

🗺️ OVERVIEW — 2 lines of vivid description
✈️ HOW TO REACH — flight time, best airports, from major Indian cities
💰 BUDGET — daily costs in INR for budget / mid-range / luxury travellers
📅 BEST TIME — specific months with reasons (weather, festivals, crowds)
🌡️ SEASONS — brief note on each season
🏨 WHERE TO STAY — 2–3 specific neighborhoods or areas with reason
🍽️ MUST-EAT — 5 local dishes or foods with prices
🎯 TOP 5 EXPERIENCES — numbered, specific and exciting
💡 INSIDER TIP — one golden tip most tourists don't know
⚠️ AVOID — 2 common tourist mistakes

Be enthusiastic, specific, use emojis per section header. Max 500 words. Always mention prices in INR.`;

  try {
    const text = await callGemini(system, `Complete travel guide for Indian travellers visiting: ${q}`);
    result.innerHTML = text.replace(/\n/g, '<br>');

    actions.innerHTML = `
      <button class="ai-action-btn" onclick="askItinerary('${escAttr(q)}')">📋 7-Day Itinerary</button>
      <button class="ai-action-btn" onclick="askVisa('${escAttr(q)}')">🛂 Visa & Documents</button>
      <button class="ai-action-btn" onclick="askBudget('${escAttr(q)}')">💸 Full Budget Plan</button>
      <button class="ai-action-btn" onclick="askPacking('${escAttr(q)}')">🎒 Packing List</button>
    `;
  } catch (err) {
    result.innerHTML = `<span style="color:rgba(255,100,100,0.8)">⚠️ ${escHtml(err.message)}</span>`;
  }
}

// ---- Quick-action buttons ----
async function askItinerary(dest) {
  await runAiQuery(
    `You are World AI 360. Create an exciting 7-day itinerary for ${dest} for Indian travellers. 
     Day-by-day plan with morning/afternoon/evening activities, specific place names, estimated costs in INR per activity, 
     where to eat each day, transport between places. Be detailed and exciting.`,
    `7-day detailed itinerary for ${dest}`,
    dest
  );
}

async function askVisa(dest) {
  await runAiQuery(
    `You are World AI 360. Give complete visa and travel documents information for Indian travellers visiting ${dest}.
     Cover: visa type, application process, fees in INR, processing time, documents required, 
     travel insurance recommendation, health requirements, currency exchange tips.`,
    `Visa and travel documents for Indians visiting ${dest}`,
    dest
  );
}

async function askBudget(dest) {
  await runAiQuery(
    `You are World AI 360. Create a complete budget breakdown for a 7-day trip to ${dest} for Indian travellers.
     Include: flights (economy), accommodation per night (3 categories), food per day, transport, 
     entry fees for top attractions, shopping budget, total per person. Give everything in INR.`,
    `Complete 7-day budget breakdown for ${dest} from India`,
    dest
  );
}

async function askPacking(dest) {
  await runAiQuery(
    `You are World AI 360. Give a practical packing list for Indian travellers visiting ${dest}.
     Organise by: Documents, Clothes (weather-specific), Toiletries, Electronics, Medicines, 
     Money & Cards, Misc essentials. Add any destination-specific items. Be practical and specific.`,
    `Packing list for Indian travellers visiting ${dest}`,
    dest
  );
}

async function runAiQuery(system, userMsg, destName) {
  const result  = document.getElementById('aiResult');
  const actions = document.getElementById('aiActions');
  actions.innerHTML = '';
  result.innerHTML = `
    <div class="ai-loading">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      <span class="loading-text">Loading ${escHtml(destName)} info...</span>
    </div>`;

  try {
    const text = await callGemini(system, userMsg);
    result.innerHTML = text.replace(/\n/g, '<br>');
    actions.innerHTML = `
      <button class="ai-action-btn" onclick="searchDestination()">🔄 Search Again</button>
      <button class="ai-action-btn" onclick="askItinerary('${escAttr(destName)}')">📋 7-Day Plan</button>
      <button class="ai-action-btn" onclick="askBudget('${escAttr(destName)}')">💸 Budget</button>
    `;
  } catch (err) {
    result.innerHTML = `<span style="color:rgba(255,100,100,0.8)">⚠️ ${escHtml(err.message)}</span>`;
  }
}

// =============================================
//  GET AI PLAN (from detail card button)
// =============================================
async function getAIPlan(destName) {
  const panel  = document.getElementById('aiPanel');
  const result = document.getElementById('aiResult');
  const actions = document.getElementById('aiActions');

  panel.classList.add('visible');
  actions.innerHTML = '';
  result.innerHTML = `
    <div class="ai-loading">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      <span class="loading-text">Building ${escHtml(destName)} plan...</span>
    </div>`;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const system = `You are World AI 360 travel planner. Create the most exciting, 
  practical and detailed travel plans for Indian travellers. Use emojis, be specific about prices in INR,
  mention real places and insider tips.`;

  try {
    const text = await callGemini(system,
      `Create a perfect 5-day travel plan for ${destName} for an Indian traveller.
       Include: day-by-day itinerary with timings, budget breakdown (budget ₹/mid ₹/luxury ₹),
       must-try local foods with prices, best photo spots, practical tips, and one thing everyone gets wrong.`
    );
    result.innerHTML = text.replace(/\n/g, '<br>');
    actions.innerHTML = `
      <button class="ai-action-btn" onclick="askItinerary('${escAttr(destName)}')">📋 Full 7-Day Plan</button>
      <button class="ai-action-btn" onclick="askBudget('${escAttr(destName)}')">💸 Budget Breakdown</button>
      <button class="ai-action-btn" onclick="askVisa('${escAttr(destName)}')">🛂 Visa Info</button>
    `;
  } catch (err) {
    result.innerHTML = `<span style="color:rgba(255,100,100,0.8)">⚠️ ${escHtml(err.message)}</span>`;
  }
}

// =============================================
//  RENDER DESTINATIONS
// =============================================
function renderDestinations(cat) {
  const list  = filterDestinations(DESTINATIONS[cat] || DESTINATIONS.Trending);
  const grid  = document.getElementById('destGrid');
  grid.innerHTML = '';

  list.forEach(d => {
    const grad = TYPE_GRADIENTS[d.type] || '1a1a2e,457b9d';
    const card = document.createElement('div');
    card.className = 'dest-card';
    card.innerHTML = `
      <div class="dest-img" style="background:linear-gradient(135deg,${grad})">
        <span>${d.emoji}</span>
      </div>
      <div class="dest-price">${d.price}</div>
      <div class="dest-rating">⭐ ${d.rating}</div>
      <div class="dest-overlay">
        <div class="dest-name">${escHtml(d.name)}</div>
        <div class="dest-country">📍 ${escHtml(d.country)} · ${escHtml(d.best)}</div>
      </div>
    `;
    card.addEventListener('click', () => openDetail(d));
    grid.appendChild(card);
  });

  if (list.length === 0) {
    grid.innerHTML = `<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:2rem">No destinations match this filter.</p>`;
  }
}

function filterDestinations(list) {
  if (currentFilter === 'All') return list;
  return list.filter(d =>
    d.type === currentFilter ||
    (d.tags && d.tags.includes(currentFilter))
  );
}

// =============================================
//  RENDER REGIONS
// =============================================
function renderRegions() {
  const grid = document.getElementById('regionGrid');
  grid.innerHTML = '';

  REGIONS.forEach(r => {
    const card = document.createElement('div');
    card.className = 'region-card';
    card.innerHTML = `
      <div class="region-img" style="background:linear-gradient(135deg,${r.color}22,${r.color}66)">
        <span>${r.emoji}</span>
      </div>
      <div class="region-info">
        <div class="region-name">${escHtml(r.name)}</div>
        <div class="region-count">${escHtml(r.count)}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      document.getElementById('searchInput').value = r.name;
      runAiQuery(
        `You are World AI 360. Give a curated guide to the top 8 travel destinations in ${r.name} 
         for Indian travellers. For each destination include: 1-line description, price range in INR, 
         best season and one unique highlight. Make it exciting and practical.`,
        `Top destinations in ${r.name} for Indians`,
        r.name
      );
      document.getElementById('aiPanel').classList.add('visible');
      document.getElementById('aiPanel').scrollIntoView({ behavior: 'smooth' });
    });
    grid.appendChild(card);
  });
}

// =============================================
//  DETAIL PANEL
// =============================================
function openDetail(d) {
  const panel   = document.getElementById('detailPanel');
  const content = document.getElementById('detailContent');
  const months  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const seasonHtml = months.map((m, i) => {
    const cls = d.peak && d.peak.includes(i) ? 'month-cell month-peak'
              : d.good && d.good.includes(i) ? 'month-cell month-good'
              : 'month-cell month-off';
    return `<div class="${cls}">${m.slice(0,1)}</div>`;
  }).join('');

  const tagHtml = (d.tags || []).map(t => `<span class="pill pill-teal">${escHtml(t)}</span>`).join('');

  const grad = TYPE_GRADIENTS[d.type] || '#1a1a2e,#457b9d';

  content.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;padding-right:3rem;flex-wrap:wrap;gap:0.75rem">
      <div>
        <h2 style="font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;line-height:1.1">
          ${d.emoji} ${escHtml(d.name)}
        </h2>
        <p style="color:var(--muted);margin-top:6px;font-size:0.9rem">
          📍 ${escHtml(d.country)} &nbsp;·&nbsp; ⭐ ${d.rating}/5 &nbsp;·&nbsp; ${escHtml(d.type)}
        </p>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:2rem;font-weight:700;color:var(--accent);font-family:'Playfair Display',serif">${d.price}</div>
        <div style="font-size:0.78rem;color:var(--muted)">per person (approx)</div>
      </div>
    </div>

    <div class="detail-hero-img" style="background:linear-gradient(135deg,${grad})">
      <span>${d.emoji}</span>
    </div>

    <p style="font-size:1rem;line-height:1.75;color:var(--text);margin-bottom:1.25rem">${escHtml(d.desc)}</p>

    <div class="tag-row">
      ${tagHtml}
      <span class="pill pill-red">✈️ ${escHtml(d.flight || '—')}</span>
      <span class="pill pill-gold">💰 ${escHtml(d.budget_per_day || '—')}/day</span>
    </div>

    <div class="detail-meta-grid">
      <div class="detail-stat">
        <div class="detail-stat-label">Best Season</div>
        <div class="detail-stat-val">${escHtml(d.best)}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Visa</div>
        <div class="detail-stat-val">${escHtml(d.visa || 'Check embassy')}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Currency</div>
        <div class="detail-stat-val">${escHtml(d.currency || '—')}</div>
      </div>
      <div class="detail-stat">
        <div class="detail-stat-label">Language</div>
        <div class="detail-stat-val">${escHtml(d.lang || '—')}</div>
      </div>
    </div>

    <div style="margin:1.5rem 0">
      <div style="font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:0.6rem">
        📅 Monthly Visit Calendar
      </div>
      <div class="season-bar">${seasonHtml}</div>
      <div class="season-legend">
        <span><span class="legend-dot" style="background:var(--accent)"></span>Peak</span>
        <span><span class="legend-dot" style="background:var(--teal)"></span>Good</span>
        <span><span class="legend-dot" style="background:#ccc"></span>Off-season</span>
      </div>
    </div>

    ${d.stay_tip ? `
    <div class="insider-tip">
      <div class="insider-tip-label">💡 Insider Tip</div>
      <div class="insider-tip-text">${escHtml(d.stay_tip)}</div>
    </div>` : ''}

    <div class="detail-cta-row">
      <button class="cta-primary" onclick="getAIPlan('${escAttr(d.name)}')">
        ✦ AI Travel Plan
      </button>
      <button class="cta-secondary" onclick="askItinerary('${escAttr(d.name)}')">
        📋 Full Itinerary
      </button>
    </div>
  `;

  panel.classList.add('active');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeDetail() {
  document.getElementById('detailPanel').classList.remove('active');
}

// =============================================
//  FILTERS & CATEGORIES
// =============================================
function setCat(el, cat) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentCat = cat;
  document.getElementById('sectionTitle').textContent = CATEGORY_TITLES[cat] || cat;
  renderDestinations(cat);
  closeDetail();
}

function setFilter(el, f) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  currentFilter = f;
  renderDestinations(currentCat);
}

function seeAll() {
  document.getElementById('searchInput').value = CATEGORY_TITLES[currentCat] || currentCat;
  searchDestination();
}

// =============================================
//  UTILS
// =============================================
function escHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/'/g, "\\'");
}
