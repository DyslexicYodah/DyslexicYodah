# Dev Notes — PNW Legacy

## v0.1 Architecture

### State flow
```
newGame() → state object
  ↓
advanceSeason()
  ├─ resolveEconomy()     — labor → food/firewood/skills
  ├─ resolveConsumption() — feeding the people
  ├─ resolveAging()       — births, children → adults, adults → elders
  ├─ resolveWinterSurvival() — winter-only mortality check
  └─ pickEvent()          — weighted random event for new season
```

### RNG
Seeded mulberry32 — fast, small, good distribution. Seed stored in save file for reproducibility.

### Event system
Events are gated by:
- Season tags
- Skill thresholds (e.g. fishing >= 3)
- Building presence
- State flags (e.g. `discoveredLake`, `peacePact`)
- Resource thresholds

### Buildings
Buildings provide passive effects computed once per season via `computeBuildingEffects()`. Effects are additive across all built buildings.

## Known v0.1 Limitations

- Single save slot only
- No map UI (map.js is a stub for v0.2)
- Skill display shows raw float — could be made into a label bar
- Events do not have "used" tracking — same event can repeat
- No elder-specific skill contribution logic beyond death decay

## v0.2 Priorities

1. Event "used" flag to prevent immediate repeats
2. Map node UI with scouting labor allocation
3. Elder knowledge contribution to skill floor
4. More building effects (Watch Post passive hunting yield needs tuning)
