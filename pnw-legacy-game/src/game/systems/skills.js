/**
 * skills.js — Skill display helpers and round-off for display
 */

/**
 * Return display-friendly skill level (rounded to 1 decimal).
 */
export function displaySkill(value) {
  return value.toFixed(1);
}

/**
 * Get a descriptive label for a skill level 1–10.
 */
export function skillLabel(value) {
  if (value < 2)  return 'Novice';
  if (value < 4)  return 'Apprentice';
  if (value < 6)  return 'Skilled';
  if (value < 8)  return 'Expert';
  return 'Master';
}
