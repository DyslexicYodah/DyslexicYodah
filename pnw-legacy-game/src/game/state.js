/**
 * state.js — Authoritative game state and initialization
 */

export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
export const SAVE_VERSION = 1;

/**
 * Create a fresh game state.
 * @param {number} seed - RNG seed
 */
export function newGame(seed = Date.now() & 0xffffffff) {
  return {
    version: SAVE_VERSION,
    seed,
    rngState: seed,       // persisted RNG cursor
    year: 1,
    seasonIndex: 0,       // 0=Spring 1=Summer 2=Fall 3=Winter

    population: {
      children: 4,
      adults: 8,
      elders: 2,
    },

    resources: {
      foodFresh:  6,
      foodStored: 10,
      firewood:   8,
      tools:      3,
    },

    social: {
      morale: 60,   // 0–100
      spirit: 50,   // 0–100
    },

    skills: {
      fishing: 2,   // 1–10
      hunting: 2,
    },

    buildings: [],   // array of building ids that have been built

    flags: {},       // arbitrary boolean/string flags set by events

    recentEvents: [],  // last 4 event IDs — used to prevent back-to-back repeats

    log: [],         // chronicle entries { label, text, type }

    pendingEvent: null,   // event object waiting for player choice

    gameOver: false,
    gameOverReason: '',
  };
}

/** Derived stat: total population */
export function totalPop(state) {
  return state.population.children + state.population.adults + state.population.elders;
}

/** Clamp a value between min and max */
export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/** Apply a delta object to state resources / social / skills / flags */
export function applyEffects(state, effects) {
  if (!effects) return;

  if (effects.resources) {
    for (const [k, v] of Object.entries(effects.resources)) {
      if (k in state.resources) {
        state.resources[k] = clamp(state.resources[k] + v, 0, 9999);
      }
    }
  }
  if (effects.social) {
    for (const [k, v] of Object.entries(effects.social)) {
      if (k in state.social) {
        state.social[k] = clamp(state.social[k] + v, 0, 100);
      }
    }
  }
  if (effects.skills) {
    for (const [k, v] of Object.entries(effects.skills)) {
      if (k in state.skills) {
        state.skills[k] = clamp(state.skills[k] + v, 1, 10);
      }
    }
  }
  if (effects.population) {
    for (const [k, v] of Object.entries(effects.population)) {
      if (k in state.population) {
        state.population[k] = Math.max(0, state.population[k] + v);
      }
    }
  }
  if (effects.flags) {
    Object.assign(state.flags, effects.flags);
  }
}
