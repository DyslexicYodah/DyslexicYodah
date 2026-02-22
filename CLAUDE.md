# CLAUDE.md

This file provides guidance for AI assistants (Claude and others) working in this repository.

## Project Overview

**PNW Legacy** is a text-based generational survival city-builder RPG set ~5000 years ago (circa 3000 BCE) in a fictionalized Pacific Northwest. Players guide a small band of people across seasons and years, making labor allocation decisions, responding to narrative events, constructing buildings, and surviving winters.

- **Name:** PNW Legacy (working title)
- **Language/Stack:** Plain HTML + CSS + JavaScript (ES Modules). No frameworks.
- **Entry point:** `pnw-legacy-game/index.html`
- **Run via:** `python -m http.server 8000` inside `pnw-legacy-game/`

## Repository Structure

```
pnw-legacy-game/
  index.html              # Entry point — open this in browser
  README.md               # Player-facing documentation
  src/
    styles.css            # All styles (dark theme, CSS variables)
    main.js               # UI controller and game loop wiring
    game/
      state.js            # Authoritative state shape + helpers (newGame, applyEffects, clamp)
      rng.js              # Seeded deterministic RNG (mulberry32)
      systems/
        economy.js        # Production (fishing/hunting/gather) + consumption
        population.js     # Aging, births, winter survival check
        skills.js         # Skill display helpers
        buildings.js      # Build cost checking, effect computation
        events.js         # Event selection + choice application
        map.js            # Map node stub (v0.2 expansion)
        audio.js          # Ambient loops + stingers with graceful fallback
        saveload.js       # LocalStorage save/load
      content/
        events.v0.json    # 24 narrative events with weighted selection + conditions
        buildings.v0.json # 6 buildings with costs, effects, unlock conditions
        seasons.v0.json   # Season metadata and production multipliers
  assets/
    images/               # (placeholder — v0.1 has no images)
    audio/                # (placeholder — .ogg files expected here)
  docs/
    notes.md              # Dev notes, architecture summary, v0.2 priorities
CLAUDE.md                 # This file
```

## Development Setup

### Prerequisites
- A modern browser (Chrome, Firefox, Safari, Edge)
- Python 3 (for local server) OR any static file server

### Running the Game
```bash
cd pnw-legacy-game
python -m http.server 8000
# open http://localhost:8000
```

> Note: `fetch()` calls for JSON content files require a server. `file://` may work in some browsers but is not reliable.

### No Build Step
There is no bundler, transpiler, or build system. Edit files and refresh the browser.

## Common Commands

| Task | Command |
|------|---------|
| Run game | `cd pnw-legacy-game && python -m http.server 8000` |
| Lint (none yet) | — |
| Test (none yet) | — |

## Architecture

### State
One authoritative `state` object defined in `state.js`. All systems take `state` as a parameter and mutate it directly. State is serialized to LocalStorage for save/load.

### Game Loop (per season advance)
```
advanceSeason() in main.js:
  1. Read allocations from UI
  2. resolveEconomy()     — labor → yields
  3. resolveConsumption() — people eat + use firewood
  4. resolveAging()       — births, maturation
  5. resolveWinterSurvival() — winter-only mortality
  6. Advance season/year counter
  7. Check game-over conditions
  8. Auto-save
  9. pickEvent() → show event UI
```

### RNG
Seeded mulberry32 in `rng.js`. Seed is stored in the save file so games are reproducible. Always pass `rng` as a parameter; never use `Math.random()`.

### Events
- Defined in `events.v0.json`
- Gated by: `seasonTags`, `conditions.minSkill`, `conditions.hasBuilding`, `conditions.flag`, `conditions.notFlag`, `conditions.minResource`
- Selected via `pickEvent()` using weighted random
- Choices apply `effects` via `applyEffects()` in `state.js`

### Buildings
- Defined in `buildings.v0.json`
- Effects are passive and recomputed each season via `computeBuildingEffects()`
- Build costs and unlock conditions checked in `buildBuilding()`

## Code Style and Conventions

- ES Modules (`import`/`export`) throughout — no CommonJS
- No external dependencies; no npm
- All game logic in `src/game/`; UI wiring only in `main.js`
- State mutations happen inside system functions, not in `main.js`
- Use `clamp()` from `state.js` for all stat clamping
- Content data lives in JSON files — do not hardcode event/building data in JS
- Audio must never throw — all audio calls are wrapped in try/catch

## Git Workflow

- Branch naming: `feature/<description>`, `fix/<description>`, `chore/<description>`
- Commit messages: clear, imperative mood (e.g. `Add smokehouse building effect`)
- Do not commit `.env` files or secrets (none expected in this project)

## Key Design Constraints (Non-Negotiable)

- **No real tribe names** — all cultures are fictional, ecology-inspired
- **No frameworks** — plain HTML/CSS/JS only for v0.1
- **No magic systems** — tone is grounded and mythic, not fantasy
- **Audio must fail silently** — missing audio files must not crash the game
- **Scope discipline** — v0.2 features (map, multi-village, more skills) are documented in `docs/notes.md` but must not be implemented until v0.1 is complete

## v0.2 Planned (Do Not Implement Yet)

- Node map UI with scouting labor
- Territory control and outposts
- Multi-village logistics
- Additional skills: woodcraft, toolmaking, preservation, diplomacy, healing, navigation, spiritual guidance
- Larger building tree

## Notes for AI Assistants

- Always read a file before modifying it
- The game runs via ES modules — any new JS file must use `export`/`import`
- Add new events to `events.v0.json`, not inline in JS
- Add new buildings to `buildings.v0.json`, not inline in JS
- `main.js` should stay as UI wiring only — push logic into system files
- Test changes by running the local server and opening the browser
- The RNG instance (`rng`) lives in `main.js` and must be passed to all system functions — do not create new RNG instances in system files
