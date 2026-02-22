/**
 * map.js — Node map stub (v0.1: single village + nearby nodes)
 * Full map expansion planned for v0.2.
 */

export const MAP_NODES = [
  { id: 'village',    label: 'Home Village',     revealed: true  },
  { id: 'river',      label: 'Salmon River',     revealed: true  },
  { id: 'forest',     label: 'Cedar Forest',     revealed: true  },
  { id: 'coast',      label: 'Rocky Coast',      revealed: false },
  { id: 'mountains',  label: 'Mountain Pass',    revealed: false },
  { id: 'meadow',     label: 'Great Meadow',     revealed: false },
];

export function revealNode(state, nodeId) {
  if (!state.flags) state.flags = {};
  state.flags[`map_revealed_${nodeId}`] = true;
}

export function isNodeRevealed(state, nodeId) {
  const base = MAP_NODES.find(n => n.id === nodeId);
  if (base && base.revealed) return true;
  return !!(state.flags && state.flags[`map_revealed_${nodeId}`]);
}
