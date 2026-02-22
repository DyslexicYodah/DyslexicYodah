/**
 * rng.js — Seeded deterministic RNG (mulberry32)
 * Usage: const rng = new RNG(seed); rng.next() → [0,1)
 */
export class RNG {
  constructor(seed) {
    this.seed = seed >>> 0;
  }

  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive */
  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Float in [0, max) */
  float(max = 1) {
    return this.next() * max;
  }

  /** Pick a weighted item from [{item, weight}, ...] */
  weighted(items) {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = this.next() * total;
    for (const entry of items) {
      r -= entry.weight;
      if (r <= 0) return entry.item;
    }
    return items[items.length - 1].item;
  }

  /** Serialize / restore */
  getState() { return this.seed; }
  setState(s) { this.seed = s >>> 0; }
}
