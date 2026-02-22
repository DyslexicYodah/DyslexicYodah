/**
 * audio.js — Ambient loops + stingers, with graceful fallback if files missing.
 */

const AMBIENT_TRACKS = {
  Spring: 'assets/audio/ambient_spring.ogg',
  Summer: 'assets/audio/ambient_summer.ogg',
  Fall:   'assets/audio/ambient_fall.ogg',
  Winter: 'assets/audio/ambient_winter.ogg',
};

const STINGERS = {
  unlock:    'assets/audio/stinger_unlock.ogg',
  death:     'assets/audio/stinger_death.ogg',
  omen:      'assets/audio/stinger_omen.ogg',
  discovery: 'assets/audio/stinger_discovery.ogg',
};

let currentAmbient = null;
let muted = false;
let volume = 0.4;

function tryPlay(audio) {
  if (!audio || muted) return;
  audio.volume = volume;
  const p = audio.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => { /* file missing or browser blocked autoplay */ });
  }
}

function loadAudio(src) {
  try {
    const a = new Audio(src);
    a.onerror = () => { /* file missing — silent */ };
    return a;
  } catch {
    return null;
  }
}

/** Switch ambient track to the given season name. */
export function playAmbient(season) {
  if (currentAmbient) {
    currentAmbient.pause();
    currentAmbient.currentTime = 0;
    currentAmbient = null;
  }
  const src = AMBIENT_TRACKS[season];
  if (!src) return;
  const audio = loadAudio(src);
  if (!audio) return;
  audio.loop = true;
  currentAmbient = audio;
  tryPlay(currentAmbient);

  const label = document.getElementById('now-playing');
  if (label) label.textContent = `♪ ${season} Ambience`;
}

/** Play a one-shot stinger. */
export function playStinger(type) {
  const src = STINGERS[type];
  if (!src) return;
  const audio = loadAudio(src);
  if (audio) tryPlay(audio);
}

/** Toggle mute. */
export function setMuted(isMuted) {
  muted = isMuted;
  if (currentAmbient) {
    if (muted) {
      currentAmbient.pause();
    } else {
      tryPlay(currentAmbient);
    }
  }
}

/** Set master volume (0–1). */
export function setVolume(v) {
  volume = v;
  if (currentAmbient && !muted) {
    currentAmbient.volume = volume;
  }
}

export function isMuted() { return muted; }
