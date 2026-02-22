/**
 * buildings.js — Build costs, effects, and passive modifiers
 */

/**
 * Compute the aggregated passive effects from all built buildings.
 * @param {string[]} builtIds - list of built building ids
 * @param {Object[]} buildingDefs - buildings.v0.json data
 */
export function computeBuildingEffects(builtIds, buildingDefs) {
  const effects = {
    fishingBonus:     0,
    huntingBonus:     0,
    preservationRate: 0,
    dryingCap:        0,
    moraleBonus:      0,
    shelterBonus:     0,
    storageBonus:     0,
  };

  for (const id of builtIds) {
    const def = buildingDefs.find(b => b.id === id);
    if (!def || !def.effects) continue;
    for (const [k, v] of Object.entries(def.effects)) {
      if (k in effects) effects[k] += v;
    }
  }

  return effects;
}

/**
 * Attempt to construct a building.
 * Returns { success, message }
 */
export function buildBuilding(state, buildingId, buildingDefs) {
  const def = buildingDefs.find(b => b.id === buildingId);
  if (!def) return { success: false, message: 'Unknown building.' };

  if (state.buildings.includes(buildingId)) {
    return { success: false, message: `${def.name} is already built.` };
  }

  // Check unlock conditions
  if (def.unlockConditions) {
    const { hasBuilding, minAdults } = def.unlockConditions;
    if (hasBuilding && !state.buildings.includes(hasBuilding)) {
      const dep = buildingDefs.find(b => b.id === hasBuilding);
      return { success: false, message: `Requires ${dep ? dep.name : hasBuilding} first.` };
    }
    if (minAdults && state.population.adults < minAdults) {
      return { success: false, message: `Need at least ${minAdults} adults.` };
    }
  }

  // Check resources
  const cost = def.cost || {};
  for (const [resource, amount] of Object.entries(cost)) {
    if ((state.resources[resource] || 0) < amount) {
      return { success: false, message: `Not enough ${resource} (need ${amount}).` };
    }
  }

  // Deduct costs
  for (const [resource, amount] of Object.entries(cost)) {
    state.resources[resource] -= amount;
  }

  state.buildings.push(buildingId);
  return { success: true, message: `${def.name} constructed!` };
}

/**
 * Get a human-readable cost string for a building.
 */
export function buildingCostText(def) {
  if (!def || !def.cost) return 'No cost';
  return Object.entries(def.cost)
    .map(([k, v]) => `${v} ${k}`)
    .join(', ');
}
