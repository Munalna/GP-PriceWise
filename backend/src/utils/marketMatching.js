export const MARKET_MATCH_THRESHOLD = 0.7;

export function normalizeMarketName(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\bice\b/g, "iced")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) =>
      word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word
    )
    .sort()
    .join(" ");
}

export function getNameAnchor(name) {
  const tokens = normalizeMarketName(name).split(" ").filter(Boolean);
  if (tokens.length === 0) return String(name || "").trim();
  return tokens.sort((a, b) => b.length - a.length)[0];
}

function levenshteinRatio(a = "", b = "") {
  const m = a.length;
  const n = b.length;

  if (m === 0 || n === 0) return m === n ? 1 : 0;

  const d = Array.from({ length: m + 1 }, (_, i) => [
    i,
    ...Array(n).fill(0),
  ]);

  for (let j = 0; j <= n; j += 1) d[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }

  return 1 - d[m][n] / Math.max(m, n);
}

export function marketNameSimilarity(a, b) {
  const x = normalizeMarketName(a);
  const y = normalizeMarketName(b);

  if (!x || !y) return 0;
  if (x === y) return 1;

  const sx = new Set(x.split(" "));
  const sy = new Set(y.split(" "));
  const intersection = [...sx].filter((token) => sy.has(token)).length;
  const union = new Set([...sx, ...sy]).size;
  const jaccard = union ? intersection / union : 0;

  return Math.max(jaccard, levenshteinRatio(x, y));
}

export function hasImportantTokenOverlap(a, b) {
  const stopWords = new Set(["hot", "iced", "ice", "drink", "coffee"]);
  const ax = normalizeMarketName(a)
    .split(" ")
    .filter((token) => !stopWords.has(token));
  const bx = normalizeMarketName(b)
    .split(" ")
    .filter((token) => !stopWords.has(token));
  const overlap = ax.filter((token) => bx.includes(token));

  if (Math.min(ax.length, bx.length) <= 2) {
    return overlap.length >= 1;
  }

  return overlap.length >= 2;
}

export function isMarketNameMatch(candidateName, productName) {
  return (
    hasImportantTokenOverlap(candidateName, productName) &&
    marketNameSimilarity(candidateName, productName) >= MARKET_MATCH_THRESHOLD
  );
}
