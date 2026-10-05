// Fuzzy matching for the command palette: every query letter must appear in order;
// word starts and runs of consecutive letters score higher. Pure, so it is tested.

export function fuzzyScore(query: string, text: string): number {
  const q = query.trim().toLowerCase(), t = text.toLowerCase();
  if (!q) return 1;
  let score = 0, at = 0, run = 0;
  for (const char of q) {
    if (char === " ") { run = 0; continue; }
    const found = t.indexOf(char, at);
    if (found < 0) return 0;
    const wordStart = found === 0 || /[\s\-_·/:.]/.test(t[found - 1]);
    run = found === at ? run + 1 : 0;
    score += 1 + (wordStart ? 3 : 0) + run * 2 - Math.min(found - at, 6) * .25;
    at = found + 1;
  }
  return score + (t.startsWith(q) ? 6 : t.includes(q) ? 3 : 0);
}

export function rank<T>(items: T[], query: string, text: (item: T) => string, limit = 40): T[] {
  return items.map(item => ({ item, score: fuzzyScore(query, text(item)) })).filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score).slice(0, limit).map(entry => entry.item);
}
