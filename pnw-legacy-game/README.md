# PNW Legacy

A generational survival city-builder RPG set ~5000 years ago (circa 3000 BCE) in a fictionalized Pacific Northwest. Guide a small band of people across seasons and years as they grow into a thriving community.

---

## What It Is

- **Genre:** Text-based generational survival / city-builder
- **Setting:** Fictionalized Pacific Northwest — real geography, fictional cultures
- **Time period:** ~3000 BCE
- **Tone:** Atmospheric, grounded, mythic

You manage labor allocations each season, respond to narrative events, construct buildings, and try to survive the winter. The land remembers how you treated it.

---

## How to Run

**Option A — Local server (recommended):**
```bash
cd pnw-legacy-game
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Option B — Double-click index.html:**
Works in most browsers. If the game shows a "Failed to start" error, use Option A instead (some browsers block `fetch()` on `file://` URLs).

---

## Controls

| Action | How |
|--------|-----|
| Assign workers | Enter numbers in the Labor Allocation fields (right panel) |
| Advance the season | Click **Advance Season ▶** (top right) |
| Respond to events | Click the choice buttons in the center panel |
| Build a structure | Select from the **Construct Building** dropdown and click **Build** |
| Save | Click **Save** (top right) |
| Load | Click **Load** (top right) |
| New game | Click **New Game** (top right) |
| Mute / volume | Bottom bar audio controls |

---

## Gameplay Tips

- Assign workers every season — unassigned adults produce nothing.
- Always keep some firewood in reserve for winter.
- Build a **Drying Rack** early to start preserving food.
- Watch your morale — if it hits 0, the community disbands.
- The **Plank Lodge** significantly reduces winter mortality.
- Respond to events carefully; some choices have lasting consequences.

---

## Save / Load

- The game auto-saves after each season advance.
- One save slot stored in browser LocalStorage.
- Save files include the RNG seed for reproducibility.
- Clearing browser data will erase your save.

---

## Audio

Audio files are placeholder paths (`assets/audio/`). The game runs silently without them — no errors will appear. To add audio:

- Place `.ogg` files in `assets/audio/`:
  - `ambient_spring.ogg`, `ambient_summer.ogg`, `ambient_fall.ogg`, `ambient_winter.ogg`
  - `stinger_unlock.ogg`, `stinger_death.ogg`, `stinger_omen.ogg`, `stinger_discovery.ogg`

---

## Roadmap

### v0.2 (planned)
- Node map exploration — scout action reveals new locations
- Territory control and outposts
- Multi-village logistics and coordination
- More skills: woodcraft, toolmaking, preservation, diplomacy, healing, navigation, spiritual guidance
- Larger building tree with technology thresholds

### v0.3+
- Generational succession — name and remember your leaders
- Regional weather systems
- Conflict and alliance mechanics

---

## Cultural Notes

This game uses fictional cultures inspired by Pacific Northwest ecology. It does **not** use real tribal names, sacred ceremony names, or copy specific sacred traditions. All cultures depicted are invented.

---

## License

TBD
