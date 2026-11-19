import { termDefinition, type GlossaryTerm } from "../content/glossary";

interface TermMatch {
  start: number;
  end: number;
  text: string;
  term: GlossaryTerm;
}

export function createGlossaryMatcher(terms: readonly GlossaryTerm[]) {
  const aliases = new Map<string, GlossaryTerm>();
  for (const term of terms) {
    for (const alias of [term, ...(termDefinition(term).aliases ?? [])]) {
      const key = alias.toLowerCase();
      const existing = aliases.get(key);
      if (existing && existing !== term) throw new Error(`Ambiguous glossary alias: ${alias}`);
      aliases.set(key, term);
    }
  }
  const choices = [...aliases.keys()]
    .sort((a, b) => b.length - a.length)
    .map(alias => alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = choices.length
    ? new RegExp(`(?<![\\p{L}\\p{N}_])(?:${choices.join("|")})(?![\\p{L}\\p{N}_])`, "giu")
    : null;

  return (text: string, wholeTermOnly = false): TermMatch[] => {
    if (!pattern) return [];
    pattern.lastIndex = 0;
    const matches: TermMatch[] = [];
    for (const match of text.matchAll(pattern)) {
      if (wholeTermOnly && (match.index !== 0 || match[0].length !== text.length)) continue;
      const term = aliases.get(match[0].toLowerCase())!;
      const entry = termDefinition(term);
      if (entry.caseSensitive && ![term, ...(entry.aliases ?? [])].includes(match[0])) continue;
      matches.push({ start: match.index, end: match.index + match[0].length, text: match[0], term });
    }
    return matches;
  };
}

export function createGlossaryRenderer(terms: readonly GlossaryTerm[]) {
  if (terms.length > 10) throw new Error("Select at most 10 glossary concepts per topic.");
  const matchTerms = createGlossaryMatcher(terms);
  const defined = new Set<GlossaryTerm>();
  return (target: HTMLElement, text: string, wholeTermOnly = false): void => {
    let cursor = 0;
    for (const match of matchTerms(text, wholeTermOnly)) {
      if (defined.has(match.term)) continue;
      defined.add(match.term);
      target.appendChild(document.createTextNode(text.slice(cursor, match.start)));
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "glossary-term";
      trigger.dataset.glossaryTerm = match.term;
      trigger.textContent = match.text;
      target.appendChild(trigger);
      cursor = match.end;
    }
    target.appendChild(document.createTextNode(text.slice(cursor)));
  };
}
