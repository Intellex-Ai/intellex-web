interface FactInput {
  text: string;
  sourceId: string;
}

export interface Fact {
  fact_type: string;
  content: string;
  snippet: string;
  source_id: string;
  confidence: number;
}

export function heuristicFacts({ text, sourceId }: FactInput): Fact[] {
  const lines = text.split('\n').filter((line) => /\d/.test(line));
  return lines.slice(0, 3).map((line, idx) => ({
    fact_type: 'stat',
    content: line.trim(),
    snippet: line.trim(),
    source_id: sourceId,
    confidence: 0.4 + idx * 0.1
  }));
}
