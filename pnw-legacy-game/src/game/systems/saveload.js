/**
 * saveload.js — LocalStorage save/load with versioned JSON
 */

const SLOT_KEY = 'pnw_legacy_save_v1';

/**
 * Save the current state to LocalStorage.
 * @param {Object} state
 * @returns {boolean} success
 */
export function saveGame(state) {
  try {
    const data = JSON.stringify({ ...state, savedAt: Date.now() });
    localStorage.setItem(SLOT_KEY, data);
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

/**
 * Load saved state from LocalStorage.
 * @returns {Object|null} state or null if none
 */
export function loadGame() {
  try {
    const raw = localStorage.getItem(SLOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Load failed:', e);
    return null;
  }
}

/**
 * Check whether a save exists.
 */
export function hasSave() {
  return !!localStorage.getItem(SLOT_KEY);
}

/**
 * Delete the save.
 */
export function deleteSave() {
  localStorage.removeItem(SLOT_KEY);
}
