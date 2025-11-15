import type { Fact } from '@/lib/parsers/extractors';

interface VerifiedFact extends Fact {
  verified: boolean;
  verification_notes: string | null;
  verified_at: string | null;
  confidence: number;
}

const MIN_SNIPPET_LENGTH = 12;
const MIN_OVERLAP_RATIO = 0.55;

export function verifyFactsAgainstSource(facts: Fact[], sourceText: string): VerifiedFact[] {
  const normalizedSource = normalizeText(sourceText);
  return facts.map((fact) => {
    const snippet = fact.snippet || fact.content;
    const normalizedSnippet = normalizeText(snippet);

    if (!normalizedSnippet || normalizedSnippet.length < MIN_SNIPPET_LENGTH) {
      return withVerificationMeta(fact, false, 'Snippet too short for verification');
    }

    if (normalizedSource.includes(normalizedSnippet)) {
      return withVerificationMeta(fact, true, 'Exact snippet match');
    }

    const overlap = tokenOverlap(normalizedSnippet, normalizedSource);
    if (overlap >= MIN_OVERLAP_RATIO) {
      return withVerificationMeta(fact, true, `Token overlap ${(overlap * 100).toFixed(0)}%`);
    }

    return withVerificationMeta(fact, false, `Only ${(overlap * 100).toFixed(0)}% token overlap`);
  });
}

function withVerificationMeta(fact: Fact, verified: boolean, note: string): VerifiedFact {
  const confidence = verified ? Math.min(0.95, (fact.confidence ?? 0.4) + 0.4) : Math.max(0.2, (fact.confidence ?? 0.4) - 0.2);
  return {
    ...fact,
    verified,
    verification_notes: note,
    verified_at: verified ? new Date().toISOString() : null,
    confidence
  };
}

function normalizeText(text?: string | null) {
  return (text ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 800);
}

function tokenOverlap(snippet: string, source: string) {
  const tokens = snippet.split(' ').filter((token) => token.length > 3);
  if (!tokens.length) return 0;
  const matches = tokens.filter((token) => source.includes(token));
  return matches.length / tokens.length;
}
