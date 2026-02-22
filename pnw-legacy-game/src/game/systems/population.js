/**
 * population.js — Aging, births, and winter survival
 */
import { clamp } from '../state.js';

/**
 * Seasonal aging: children grow up, adults age to elders.
 * Very slow — roughly 1 life stage per 40 seasons (10 years).
 */
export function resolveAging(state, rng) {
  const msgs = [];
  const { children, adults, elders } = state.population;

  // Children → Adults (~1 in 40 chance per child per season)
  let newAdults = 0;
  for (let i = 0; i < children; i++) {
    if (rng.next() < 0.025) newAdults++;
  }
  if (newAdults > 0) {
    state.population.children -= newAdults;
    state.population.adults   += newAdults;
    msgs.push({ text: `${newAdults} child${newAdults > 1 ? 'ren' : ''} came of age.`, type: 'good' });
  }

  // Adults → Elders (~1 in 60 chance per adult per season)
  let newElders = 0;
  for (let i = 0; i < adults; i++) {
    if (rng.next() < 0.017) newElders++;
  }
  if (newElders > 0) {
    state.population.adults -= newElders;
    state.population.elders += newElders;
    msgs.push({ text: `${newElders} adult${newElders > 1 ? 's' : ''} entered elderhood.`, type: 'normal' });
  }

  // Births: chance per season based on adult count and morale
  const moraleFactor = state.social.morale / 100;
  const birthChance  = adults * 0.04 * moraleFactor;
  if (rng.next() < birthChance) {
    const births = rng.int(1, 2);
    state.population.children += births;
    msgs.push({ text: `${births} child${births > 1 ? 'ren were' : ' was'} born — the people rejoiced.`, type: 'good' });
  }

  return msgs;
}

/**
 * Winter survival check — the primary early-game gate.
 * Elders and children are most vulnerable.
 */
export function resolveWinterSurvival(state, buildingEffects, rng) {
  const msgs = [];
  const { children, adults, elders } = state.population;
  const plankLodge = buildingEffects.shelterBonus || 0;   // 0 or 1
  const firewoodOk = state.resources.firewood >= (children + adults + elders);

  // Base mortality chance per elder/child
  const elderMortBase  = firewoodOk ? 0.08 : 0.18;
  const childMortBase  = firewoodOk ? 0.04 : 0.12;
  const sheltReduction = plankLodge * 0.04;

  let elderDeaths = 0;
  let childDeaths = 0;

  for (let i = 0; i < elders; i++) {
    if (rng.next() < Math.max(0, elderMortBase - sheltReduction)) elderDeaths++;
  }
  for (let i = 0; i < children; i++) {
    if (rng.next() < Math.max(0, childMortBase - sheltReduction)) childDeaths++;
  }

  if (elderDeaths > 0) {
    state.population.elders = clamp(elders - elderDeaths, 0, 9999);
    state.social.morale = clamp(state.social.morale - elderDeaths * 8, 0, 100);
    state.social.spirit = clamp(state.social.spirit - elderDeaths * 5, 0, 100);
    // Elder death reduces skills slightly (loss of knowledge)
    state.skills.fishing = Math.max(1, +(state.skills.fishing - elderDeaths * 0.1).toFixed(2));
    state.skills.hunting = Math.max(1, +(state.skills.hunting - elderDeaths * 0.1).toFixed(2));
    msgs.push({ text: `${elderDeaths} elder${elderDeaths > 1 ? 's' : ''} did not survive the winter. Their wisdom is mourned.`, type: 'danger' });
  }

  if (childDeaths > 0) {
    state.population.children = clamp(children - childDeaths, 0, 9999);
    state.social.morale = clamp(state.social.morale - childDeaths * 12, 0, 100);
    msgs.push({ text: `${childDeaths} child${childDeaths > 1 ? 'ren were' : ' was'} lost to the winter.`, type: 'danger' });
  }

  if (elderDeaths === 0 && childDeaths === 0) {
    state.social.morale = clamp(state.social.morale + 5, 0, 100);
    msgs.push({ text: `The people endured the winter. All survived.`, type: 'good' });
  }

  return msgs;
}
