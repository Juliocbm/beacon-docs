/**
 * Levenshtein distance (classic DP, O(m·n)).
 * Used for "did you mean X?" suggestions when a user typos a command or category.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]!
        : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

/**
 * Find the closest match in `options` for the user's `input`.
 * Returns null if nothing is within `maxDistance` (default 3).
 * Case-insensitive comparison.
 */
export function closestMatch(input: string, options: readonly string[], maxDistance = 3): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  const lower = input.toLowerCase();
  for (const opt of options) {
    const d = levenshtein(lower, opt.toLowerCase());
    if (d < bestDist && d <= maxDistance) {
      bestDist = d;
      best = opt;
    }
  }
  return best;
}
