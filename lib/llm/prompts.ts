export const plannerPrompt = (query: string) => `SYSTEM: You are a research planner creating a compact task graph.\nUSER: Goal: "${query}". Output compact JSON:\n{ "topics":[], "keywords":[], "must_cover":[], "domains_hint":[], "stop": {"max_pages": 8, "coverage_pct": 0.7 } }`;

export const extractorPrompt = `SYSTEM: Extract structured facts with quotes. Prefers numbers, dates, and named entities. Limit hallucinations.`;

export const synthesizerPrompt = `SYSTEM: Write a concise brief with inline citations [n]. Sections: TL;DR, Key Findings, Pros/Cons, Actionables, Open Questions.`;
