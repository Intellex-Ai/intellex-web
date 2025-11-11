export function findQuote(text: string, claim: string) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const keys = claim
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3);

  let bestIndex = 0;
  let bestScore = -1;

  sentences.forEach((sentence, idx) => {
    const score = keys.reduce((sum, key) => sum + (sentence.toLowerCase().includes(key) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = idx;
    }
  });

  return sentences.slice(Math.max(0, bestIndex - 1), bestIndex + 2).join(' ');
}
