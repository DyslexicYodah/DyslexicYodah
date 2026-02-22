/**
 * main.js — Game controller and UI wiring
 */
import { newGame, SEASONS, clamp, applyEffects } from './game/state.js';
import { RNG } from './game/rng.js';
import { resolveEconomy, resolveConsumption } from './game/systems/economy.js';
import { resolveAging, resolveWinterSurvival } from './game/systems/population.js';
import { computeBuildingEffects, buildBuilding, buildingCostText } from './game/systems/buildings.js';
import { pickEvent, applyChoice } from './game/systems/events.js';
import { saveGame, loadGame, hasSave } from './game/systems/saveload.js';
import { playAmbient, playStinger, setMuted, setVolume, isMuted } from './game/systems/audio.js';

// ── Content data (loaded once) ──
let BUILDINGS_DATA = [];
let EVENTS_DATA    = [];
let SEASONS_DATA   = {};

// ── Live game state and RNG ──
let state = null;
let rng   = null;

// ── Helpers ──
function $(id) { return document.getElementById(id); }

// ── Mobile tab navigation ──
const PANEL_IDS = ['panel-left', 'panel-center', 'panel-right'];

function switchTab(targetId) {
  PANEL_IDS.forEach(id => {
    document.getElementById(id).classList.toggle('active', id === targetId);
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === targetId);
  });
}

function initMobileTabs() {
  // Set initial active panel
  switchTab('panel-center');
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
  });
}

function showModal(title, body) {
  $('modal-title').textContent = title;
  $('modal-body').textContent  = body;
  $('modal-overlay').classList.remove('hidden');
}

function hideModal() {
  $('modal-overlay').classList.add('hidden');
}

function addLog(text, type = 'normal') {
  const season = SEASONS[state.seasonIndex];
  const label  = `Year ${state.year} · ${season}`;
  const entry  = { label, text, type };
  state.log.unshift(entry);
  if (state.log.length > 60) state.log.pop();
  renderLog();
}

// ── Render ──
function renderAll() {
  if (!state) return;
  renderStats();
  renderBuildings();
  renderBuildSelect();
  renderLog();
  renderSeasonBadge();
  renderAllocInfo();
}

function renderStats() {
  const { population: p, resources: r, social: s, skills: sk } = state;
  $('display-year').textContent  = state.year;
  $('stat-children').textContent = p.children;
  $('stat-adults').textContent   = p.adults;
  $('stat-elders').textContent   = p.elders;
  $('stat-total').textContent    = p.children + p.adults + p.elders;

  $('stat-foodFresh').textContent  = r.foodFresh;
  $('stat-foodStored').textContent = r.foodStored;
  $('stat-firewood').textContent   = r.firewood;
  $('stat-tools').textContent      = r.tools;

  $('stat-morale').textContent  = s.morale;
  $('stat-spirit').textContent  = s.spirit;

  $('stat-fishing').textContent = sk.fishing.toFixed(1);
  $('stat-hunting').textContent = sk.hunting.toFixed(1);

  $('adults-available').textContent = state.population.adults;
}

function renderBuildings() {
  const list = $('buildings-list');
  if (state.buildings.length === 0) {
    list.innerHTML = '<em>None yet</em>';
    return;
  }
  list.innerHTML = state.buildings.map(id => {
    const def = BUILDINGS_DATA.find(b => b.id === id);
    return `<div class="building-tag">${def ? def.name : id}</div>`;
  }).join('');
}

function renderBuildSelect() {
  const sel   = $('build-select');
  const built = state.buildings;
  sel.innerHTML = '<option value="">— choose —</option>';
  for (const b of BUILDINGS_DATA) {
    if (built.includes(b.id)) continue;
    const opt  = document.createElement('option');
    opt.value  = b.id;
    opt.textContent = b.name;
    sel.appendChild(opt);
  }
  updateCostPreview();
}

function updateCostPreview() {
  const id  = $('build-select').value;
  const def = BUILDINGS_DATA.find(b => b.id === id);
  $('build-cost-preview').textContent = def
    ? `Cost: ${buildingCostText(def)} — ${def.description}`
    : '';
}

function renderSeasonBadge() {
  const seasonName = SEASONS[state.seasonIndex];
  const badge = $('label-season');
  badge.textContent = seasonName;
  badge.className   = `season-badge ${seasonName.toLowerCase()}`;
}

function renderAllocInfo() {
  updateAllocTotal();
}

function renderLog() {
  const container = $('log-entries');
  container.innerHTML = state.log.slice(0, 30).map(e => `
    <div class="log-entry ${e.type === 'danger' ? 'log-danger' : e.type === 'good' ? 'log-good' : ''}">
      <span class="log-label">${e.label}</span>
      ${e.text}
    </div>
  `).join('');
}

// ── Allocation total watcher ──
const ALLOC_IDS = ['fishing', 'hunting', 'gather', 'build', 'firewood', 'ceremony'];

function getAllocations() {
  const alloc = {};
  for (const id of ALLOC_IDS) {
    alloc[id] = Math.max(0, parseInt($(`alloc-${id}`).value, 10) || 0);
  }
  return alloc;
}

function totalAllocated(alloc) {
  return Object.values(alloc).reduce((s, v) => s + v, 0);
}

function updateAllocTotal() {
  const alloc = getAllocations();
  const total = totalAllocated(alloc);
  $('alloc-total-count').textContent = total;
  const warning = $('allocation-warning');
  if (state && total > state.population.adults) {
    warning.classList.remove('hidden');
  } else {
    warning.classList.add('hidden');
  }
}

function resetAllocations() {
  for (const id of ALLOC_IDS) {
    $(`alloc-${id}`).value = 0;
  }
  updateAllocTotal();
}

// ── Event UI ──
function showEvent(ev) {
  $('hint-box').classList.add('hidden');
  $('event-box').classList.remove('hidden');
  $('event-title').textContent = ev.title;
  $('event-text').textContent  = ev.text;

  const choicesEl = $('event-choices');
  choicesEl.innerHTML = '';
  ev.choices.forEach((choice, idx) => {
    const btn = document.createElement('button');
    btn.className   = 'choice-btn';
    btn.textContent = choice.label;
    btn.addEventListener('click', () => handleChoice(ev, idx));
    choicesEl.appendChild(btn);
  });

  // Disable advance while event is pending
  $('btn-advance').disabled = true;

  // On mobile, switch to the Chronicle panel so the event is visible
  if (window.innerWidth <= 768) switchTab('panel-center');
}

function handleChoice(ev, choiceIdx) {
  const choice   = ev.choices[choiceIdx];
  const followup = applyChoice(state, choice);

  // Check for discovery stinger
  if (choice.effects && choice.effects.flags) {
    playStinger('discovery');
  }

  state.pendingEvent = null;
  $('event-box').classList.add('hidden');
  $('hint-box').classList.remove('hidden');
  $('btn-advance').disabled = false;

  if (followup) addLog(followup, 'normal');
  renderAll();
}

// ── Season Advance ──
async function advanceSeason() {
  if (!state || state.gameOver) return;

  const alloc = getAllocations();

  // Warn if over-allocated
  if (totalAllocated(alloc) > state.population.adults) {
    showModal('Too Many Workers', 'You have allocated more adults than you have. Please adjust before advancing.');
    return;
  }

  const seasonName   = SEASONS[state.seasonIndex];
  const buildingFx   = computeBuildingEffects(state.buildings, BUILDINGS_DATA);
  const seasonData   = SEASONS_DATA[seasonName] || { modifiers: {} };

  // Apply season multipliers to allocations before economy resolution
  const mod = seasonData.modifiers || {};
  const scaledAlloc = {
    ...alloc,
    fishing:  Math.round(alloc.fishing  * (mod.fishingMultiplier  || 1)),
    hunting:  Math.round(alloc.hunting  * (mod.huntingMultiplier  || 1)),
    gather:   Math.round(alloc.gather   * (mod.gatherMultiplier   || 1)),
    firewood: alloc.firewood,
    ceremony: alloc.ceremony,
    build:    alloc.build,
  };

  const econMsgs = resolveEconomy(state, scaledAlloc, buildingFx, rng);
  econMsgs.forEach(m => addLog(m));

  const consumeMsgs = resolveConsumption(state, buildingFx);
  consumeMsgs.forEach(m => addLog(m.text, m.type));

  const agingMsgs = resolveAging(state, rng);
  agingMsgs.forEach(m => addLog(m.text, m.type));

  // Death stinger
  if (consumeMsgs.some(m => m.type === 'danger') || agingMsgs.some(m => m.type === 'danger')) {
    playStinger('death');
  }

  // Winter survival check
  if (seasonName === 'Winter') {
    const winterMsgs = resolveWinterSurvival(state, buildingFx, rng);
    winterMsgs.forEach(m => {
      addLog(m.text, m.type);
      if (m.type === 'danger') playStinger('death');
    });
  }

  // Morale drift toward center
  state.social.morale = clamp(state.social.morale + (state.social.morale < 50 ? 1 : -1), 0, 100);
  state.social.spirit = clamp(state.social.spirit + (state.social.spirit < 40 ? 1 : -1), 0, 100);

  // Advance time
  state.seasonIndex++;
  if (state.seasonIndex >= 4) {
    state.seasonIndex = 0;
    state.year++;
  }

  // Persist RNG state
  state.rngState = rng.getState();

  // Check game over
  const total = state.population.children + state.population.adults + state.population.elders;
  if (total <= 0) {
    state.gameOver = true;
    state.gameOverReason = 'The last of your people did not survive.';
  }
  if (state.social.morale <= 0) {
    state.gameOver = true;
    state.gameOverReason = 'The community lost all hope and disbanded.';
  }

  resetAllocations();
  renderAll();
  playAmbient(SEASONS[state.seasonIndex]);

  if (state.gameOver) {
    $('btn-advance').disabled = true;
    showModal('The People Are Gone', state.gameOverReason);
    addLog(state.gameOverReason, 'danger');
    return;
  }

  // Auto-save each season
  saveGame(state);

  // Pick and show event for new season
  const ev = pickEvent(state, EVENTS_DATA, rng);
  if (ev) {
    state.pendingEvent = ev.id;
    showEvent(ev);
    if (ev.id.includes('omen') || ev.id.includes('dark') || ev.id.includes('sacred')) {
      playStinger('omen');
    }
  }
}

// ── New Game ──
function startNewGame() {
  const seed = Date.now() & 0xffffffff;
  state = newGame(seed);
  rng   = new RNG(seed);

  // Fire Circle is always present at start
  state.buildings = ['fire_circle'];

  addLog('A new people settle by the river. The land is vast and unknown. May they endure.', 'good');
  renderAll();
  playAmbient(SEASONS[state.seasonIndex]);

  $('hint-box').classList.remove('hidden');
  $('event-box').classList.add('hidden');
  $('btn-advance').disabled = false;

  // Show opening event
  const ev = pickEvent(state, EVENTS_DATA, rng);
  if (ev) {
    state.pendingEvent = ev.id;
    showEvent(ev);
  }
}

// ── Load Game ──
function handleLoad() {
  const saved = loadGame();
  if (!saved) {
    showModal('No Save Found', 'There is no saved game in this browser.');
    return;
  }
  state = saved;
  rng   = new RNG(0);
  rng.setState(state.rngState || state.seed);

  renderAll();
  playAmbient(SEASONS[state.seasonIndex]);
  addLog('Game loaded.', 'normal');
  $('btn-advance').disabled = !!state.pendingEvent || state.gameOver;

  if (state.pendingEvent) {
    const ev = EVENTS_DATA.find(e => e.id === state.pendingEvent);
    if (ev) showEvent(ev);
  }
}

// ── Boot ──
async function loadContent() {
  const [bldResp, evResp, seaResp] = await Promise.all([
    fetch('src/game/content/buildings.v0.json'),
    fetch('src/game/content/events.v0.json'),
    fetch('src/game/content/seasons.v0.json'),
  ]);
  BUILDINGS_DATA = await bldResp.json();
  EVENTS_DATA    = await evResp.json();
  SEASONS_DATA   = await seaResp.json();
}

async function init() {
  await loadContent();

  initMobileTabs();

  // Wire buttons
  $('btn-new').addEventListener('click', () => {
    if (state && !state.gameOver) {
      if (!confirm('Start a new game? Unsaved progress will be lost.')) return;
    }
    startNewGame();
  });

  $('btn-save').addEventListener('click', () => {
    if (!state) return;
    const ok = saveGame(state);
    showModal(ok ? 'Saved' : 'Save Failed', ok ? 'Game saved to browser storage.' : 'Could not save. Storage may be full.');
  });

  $('btn-load').addEventListener('click', handleLoad);
  $('btn-advance').addEventListener('click', advanceSeason);
  $('modal-ok').addEventListener('click', hideModal);

  $('build-select').addEventListener('change', updateCostPreview);

  $('btn-build').addEventListener('click', () => {
    const id = $('build-select').value;
    if (!id) return;
    const result = buildBuilding(state, id, BUILDINGS_DATA);
    if (result.success) {
      addLog(result.message, 'good');
      playStinger('unlock');
      renderAll();
      saveGame(state);
    } else {
      showModal('Cannot Build', result.message);
    }
  });

  // Allocation inputs
  for (const id of ALLOC_IDS) {
    $(`alloc-${id}`).addEventListener('input', updateAllocTotal);
  }

  // Audio controls
  $('btn-mute').addEventListener('click', () => {
    const nowMuted = !isMuted();
    setMuted(nowMuted);
    $('btn-mute').textContent = nowMuted ? '🔇 Unmute' : '🔊 Mute';
  });

  $('volume-slider').addEventListener('input', (e) => {
    setVolume(parseFloat(e.target.value));
  });

  // Start or load
  if (hasSave()) {
    handleLoad();
  } else {
    startNewGame();
  }
}

init().catch(err => {
  console.error('Init failed:', err);
  document.body.innerHTML = `<div style="color:#e07070;padding:2rem;font-family:sans-serif;">
    <h2>Failed to start</h2><p>${err.message}</p>
    <p>Make sure you're running via a local server (e.g. <code>python -m http.server</code>), not file:// directly.</p>
  </div>`;
});
