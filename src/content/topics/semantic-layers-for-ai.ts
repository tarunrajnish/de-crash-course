import type { Topic } from "../types";

export const semanticLayersForAi: Topic = {
  id: "semantic-layers-for-ai",
  title: "Semantic layers, now even more necessary",
  shortDescription: "A governed mapping from business terms to exact SQL, and why AI consumers make it harder to skip.",
  sections: [
    {
      heading: "What a semantic layer is",
      paragraphs: [
        "A semantic (or metrics) layer is a governed mapping between business concepts, such as 'active user' or 'monthly revenue', and the exact SQL needed to compute them: which tables, which filters, which join, which date grain. Analysts and dashboards query the metric by name instead of re-deriving its SQL from scratch each time.",
        "Without one, the same metric tends to drift: one dashboard defines 'active user' as logged in within 30 days, another as performed any tracked event within 7 days, and both get presented in the same meeting as 'active users' with no indication they disagree.",
      ],
    },
    {
      heading: "Why an AI consumer makes this worse, not better",
      paragraphs: [
        "A human analyst asked to compute revenue will usually notice if two candidate definitions disagree and ask which one is intended. An LLM agent given direct table access and asked for 'revenue' will construct a definition from whatever columns look plausible, run it, and report a number with no indication that a different, equally plausible query would have produced a different answer.",
        "This is the central risk of pairing AI agents with raw warehouse access: the agent is fluent, confident, and has no way to know it chose the wrong one of several defensible definitions unless something in its context tells it which definition is authoritative.",
      ],
      warning:
        "An agent with raw SQL access and no semantic layer will answer 'what was our churn rate' every time it's asked, using a different definition each time depending on which columns it happens to notice, with no warning that the number changed.",
    },
    {
      heading: "The current generation of tooling",
      paragraphs: [
        "The dbt Semantic Layer and tools like Cube implement this pattern by defining metrics once, as code, alongside their dimensions and grains, and exposing a query interface (SQL, API, or MCP-style tool call) that always resolves back to that single definition rather than letting a caller write ad hoc aggregation logic.",
        "For an AI agent specifically, this turns 'revenue' from an open-ended SQL-writing problem into a bounded tool call: the agent asks for the metric by name and the requested dimensions, the semantic layer returns the governed SQL, and the agent never has the opportunity to invent its own definition.",
      ],
    },
  ],
  selfTest: [
    {
      question: "What problem does a semantic layer solve that raw table access does not?",
      answer:
        "It gives a single, governed definition for a business metric (which tables, filters, joins, and grain) so every consumer computes the same number, instead of each consumer deriving its own SQL and silently disagreeing with others.",
    },
    {
      question: "Why does an AI agent make the lack of a semantic layer more dangerous than it was with only human analysts?",
      answer:
        "A human asked to compute an ambiguous metric often notices the ambiguity and asks for clarification. An agent given raw table access will construct a plausible definition and report a confident number with no signal that a different, equally defensible query existed.",
    },
    {
      question: "How does restricting an agent to semantic-layer tool calls change its failure mode compared to raw SQL access?",
      answer:
        "It removes the agent's ability to invent a metric definition at all: the agent requests a named metric and dimensions, and the semantic layer returns governed SQL. The failure mode shifts from 'wrong metric definition' to 'metric not yet defined in the semantic layer', which is visible and fixable rather than silent.",
    },
    {
      question: "Give an example of two defensible but different definitions of the same metric that a semantic layer would resolve.",
      answer:
        "Active user defined as logged in within the last 30 days versus performed any tracked event within the last 7 days. Both are reasonable definitions; a semantic layer picks one as canonical so every query uses it consistently.",
    },
    {
      question: "Why is defining a metric 'as code' in a semantic layer better than defining it in a BI tool's dashboard config?",
      answer:
        "Code can be version-controlled, reviewed, tested, and reused by every consumer, including agents and multiple BI tools, whereas a definition buried in one dashboard's config is invisible to and unreusable by any other consumer, including an AI agent querying through a different path.",
    },
  ],
};
