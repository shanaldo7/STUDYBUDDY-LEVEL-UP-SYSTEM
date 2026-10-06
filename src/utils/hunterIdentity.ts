/**
 * StudyBuddy AI - Hunter Identity Formatter
 * Normalizes user display names, salutations, and titles to eliminate
 * malformed duplicates like "Hunter Hunter monarch".
 */

export function normalizeHunterName(rawName?: string): string {
  if (!rawName) return 'Hunter';
  const clean = rawName.trim();

  // If the raw name contains repeated "Hunter" occurrences, clean them up
  // e.g. "Hunter Hunter monarch" -> "Monarch"
  // e.g. "Hunter monarch" -> "Monarch"
  const withoutLeadingHunter = clean.replace(/^(?:hunter\s*)+/i, '').trim();
  if (withoutLeadingHunter) {
    return withoutLeadingHunter.charAt(0).toUpperCase() + withoutLeadingHunter.slice(1);
  }

  return 'Hunter';
}

export function formatHunterSalutation(rawName?: string): string {
  const norm = normalizeHunterName(rawName);
  if (!norm || norm.toLowerCase() === 'hunter') {
    return 'Hunter';
  }
  return `Hunter ${norm}`;
}

export function formatHunterTitle(title?: string): string {
  if (!title) return 'Awakened Novice';
  const clean = title.trim();
  return clean || 'Awakened Novice';
}
