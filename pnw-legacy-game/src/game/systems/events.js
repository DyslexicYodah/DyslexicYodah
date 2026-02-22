/**
 * events.js — Event selection and choice application
 */
import { applyEffects } from '../state.js';

/**
 * Pick an eligible event for the current season.
 * @param {Object} state
 * @param {Object[]} eventDefs - events.v0.json data
 * @param {RNG} rng
 * @returns {Object|null} event definition or null if none eligible
 */
export function pickEvent(state, eventDefs, rng) {
  const season = ['Spring', 'Summer', 'Fall', 'Winter'][state.seasonIndex];

  const recent = state.recentEvents || [];

  const eligible = eventDefs.filter(ev => {
    // Season filter
    if (ev.seasonTags && ev.seasonTags.length > 0) {
      if (!ev.seasonTags.includes(season)) return false;
    }

    // Cooldown: skip events seen in the last 4 seasons
    if (recent.includes(ev.id)) return false;

    // Conditions
    const cond = ev.conditions || {};

    if (cond.minSkill) {
      for (const [skill, min] of Object.entries(cond.minSkill)) {
        if ((state.skills[skill] || 0) < min) return false;
      }
    }
    if (cond.hasBuilding && !state.buildings.includes(cond.hasBuilding)) return false;
    if (cond.flag && !state.flags[cond.flag]) return false;
    if (cond.notFlag && state.flags[cond.notFlag]) return false;

    if (cond.minResource) {
      for (const [res, min] of Object.entries(cond.minResource)) {
        if ((state.resources[res] || 0) < min) return false;
      }
    }

    return true;
  });

  if (eligible.length === 0) return null;

  const weighted = eligible.map(ev => ({ item: ev, weight: ev.weight || 1 }));
  const chosen = rng.weighted(weighted);

  // Track this event; keep a rolling window of 4
  if (chosen) {
    state.recentEvents = [chosen.id, ...recent].slice(0, 4);
  }

  return chosen;
}

/**
 * Apply a choice's effects to state.
 * @param {Object} state
 * @param {Object} choice - { label, effects, followupText }
 * @returns {string} followup text
 */
export function applyChoice(state, choice) {
  if (choice.effects) {
    applyEffects(state, choice.effects);
  }
  return choice.followupText || '';
}
