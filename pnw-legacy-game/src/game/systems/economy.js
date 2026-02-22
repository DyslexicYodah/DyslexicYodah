/**
 * economy.js — Production, consumption, and storage rules
 */
import { clamp, applyEffects } from '../state.js';

/**
 * Resolve labor allocations → produce resources.
 * Returns a summary of deltas and messages.
 */
export function resolveEconomy(state, alloc, buildingEffects, rng) {
  const { fishing, hunting, gather, firewood: firewoodWork, ceremony } = alloc;
  const msgs = [];
  const deltas = { resources: {}, social: {}, skills: {} };

  const fishSkill  = state.skills.fishing;
  const huntSkill  = state.skills.hunting;

  // ── Fishing ──
  if (fishing > 0) {
    const base = fishing * (1.2 + fishSkill * 0.3);
    const yield_ = Math.round(base * (0.8 + rng.float(0.4)));
    const actual = yield_ + (buildingEffects.fishingBonus || 0);
    state.resources.foodFresh = clamp(state.resources.foodFresh + actual, 0, 9999);
    deltas.resources.foodFresh = (deltas.resources.foodFresh || 0) + actual;
    state.skills.fishing = clamp(fishSkill + 0.1, 1, 10);
    msgs.push(`Fishing crews brought in ${actual} fresh food.`);
  }

  // ── Hunting ──
  if (hunting > 0) {
    const base = hunting * (1.0 + huntSkill * 0.25);
    const yield_ = Math.round(base * (0.7 + rng.float(0.6)));
    const actual = yield_ + (buildingEffects.huntingBonus || 0);
    state.resources.foodFresh = clamp(state.resources.foodFresh + actual, 0, 9999);
    deltas.resources.foodFresh = (deltas.resources.foodFresh || 0) + actual;
    state.skills.hunting = clamp(huntSkill + 0.1, 1, 10);
    msgs.push(`Hunters returned with ${actual} fresh food.`);
  }

  // ── Gathering ──
  if (gather > 0) {
    const yield_ = Math.round(gather * (1.0 + rng.float(0.5)));
    state.resources.foodFresh = clamp(state.resources.foodFresh + yield_, 0, 9999);
    msgs.push(`Gatherers found ${yield_} fresh food.`);
  }

  // ── Firewood ──
  if (firewoodWork > 0) {
    const yield_ = Math.round(firewoodWork * (1.5 + rng.float(0.5)));
    state.resources.firewood = clamp(state.resources.firewood + yield_, 0, 9999);
    msgs.push(`${yield_} firewood collected.`);
  }

  // ── Ceremony ──
  if (ceremony > 0) {
    const spiritGain = Math.round(ceremony * 3 * (0.8 + rng.float(0.4)));
    const moraleGain = Math.round(ceremony * 2 * (0.8 + rng.float(0.4)));
    state.social.spirit = clamp(state.social.spirit + spiritGain, 0, 100);
    state.social.morale = clamp(state.social.morale + moraleGain, 0, 100);
    msgs.push(`Ceremony raised spirit (+${spiritGain}) and morale (+${moraleGain}).`);
  }

  // ── Passive storage preservation (Smokehouse, Drying Rack) ──
  const preservationRate = buildingEffects.preservationRate || 0.5;
  const dryingCap = buildingEffects.dryingCap || 0;

  // Convert fresh food → stored (limited by capacity and preservation rate)
  const canPreserve = Math.min(state.resources.foodFresh, dryingCap + Math.floor(state.resources.foodFresh * preservationRate));
  if (canPreserve > 0) {
    const stored = Math.min(canPreserve, state.resources.foodFresh);
    state.resources.foodFresh  = clamp(state.resources.foodFresh  - stored, 0, 9999);
    state.resources.foodStored = clamp(state.resources.foodStored + stored, 0, 9999);
    if (stored > 0) msgs.push(`${stored} food preserved for storage.`);
  }

  // ── Skill decay (unused skills) ──
  if (!fishing && fishSkill > 1) {
    state.skills.fishing = Math.max(1, +(fishSkill - 0.05).toFixed(2));
  }
  if (!hunting && huntSkill > 1) {
    state.skills.hunting = Math.max(1, +(huntSkill - 0.05).toFixed(2));
  }

  return msgs;
}

/**
 * Daily consumption: adults eat more, children/elders less.
 * Returns messages about food status.
 */
export function resolveConsumption(state, buildingEffects) {
  const { children, adults, elders } = state.population;
  const pop = children + adults + elders;
  const msgs = [];

  // Consumption per season
  const consumed = children * 1 + adults * 2 + elders * 1;
  const moraleHit = buildingEffects.moraleBonus || 0;

  let remaining = consumed;

  // Eat fresh first, then stored
  const fromFresh = Math.min(state.resources.foodFresh, remaining);
  state.resources.foodFresh -= fromFresh;
  remaining -= fromFresh;

  const fromStored = Math.min(state.resources.foodStored, remaining);
  state.resources.foodStored -= fromStored;
  remaining -= fromStored;

  if (remaining > 0) {
    // Starvation
    const starved = Math.ceil(remaining / 4);
    const adultLoss = Math.min(starved, adults);
    state.population.adults -= adultLoss;
    state.social.morale = clamp(state.social.morale - 20 - adultLoss * 5, 0, 100);
    state.social.spirit = clamp(state.social.spirit - 15, 0, 100);
    msgs.push({ text: `Starvation! The people did not have enough food. ${adultLoss} adult(s) perished.`, type: 'danger' });
  } else {
    msgs.push({ text: `The people ate well this season (${consumed} food consumed).`, type: 'normal' });
  }

  // Morale from buildings
  if (moraleHit > 0) {
    state.social.morale = clamp(state.social.morale + moraleHit, 0, 100);
  }

  // Firewood consumption
  const woodUsed = Math.ceil(pop * 0.5);
  if (state.resources.firewood >= woodUsed) {
    state.resources.firewood -= woodUsed;
  } else {
    const deficit = woodUsed - state.resources.firewood;
    state.resources.firewood = 0;
    state.social.morale = clamp(state.social.morale - 10, 0, 100);
    msgs.push({ text: `Firewood shortage! Cold nights hurt morale.`, type: 'danger' });
  }

  return msgs;
}
