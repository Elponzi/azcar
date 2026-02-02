/**
 * Compute the Levenshtein (edit) distance between two strings.
 * Operations: insert, delete, substitute — each costs 1.
 * Uses a standard two-row dynamic programming approach.
 *
 * When `maxDist` is provided, the function exits early and returns
 * `maxDist + 1` as soon as it can prove the real distance exceeds the
 * threshold.  This avoids unnecessary work in the common "no match" case.
 */
export function levenshtein(a: string, b: string, maxDist?: number): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // Early exit: length difference alone exceeds threshold
  if (maxDist !== undefined && Math.abs(m - n) > maxDist) {
    return maxDist + 1;
  }

  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
      }
      if (curr[j] < rowMin) rowMin = curr[j];
    }

    // Early exit: every value in this row exceeds threshold
    if (maxDist !== undefined && rowMin > maxDist) {
      return maxDist + 1;
    }

    [prev, curr] = [curr, prev];
  }

  return prev[n];
}
