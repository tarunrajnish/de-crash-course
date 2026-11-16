import type { Topic } from "../types";

export const whereDataEngineeringIsHeading: Topic = {
  id: "where-data-engineering-is-heading",
  title: "Where data engineering is heading",
  shortDescription: "What's genuinely changed by 2026, what hasn't, and why the fundamentals still decide outcomes.",
  sections: [
    {
      heading: "What has genuinely changed",
      paragraphs: [
        "AI systems are now a real consumer of pipeline output, alongside dashboards and applications, and that consumer has its own requirements: semantic layers to prevent ambiguous metrics, context pipelines with their own freshness guarantees, and provenance tracking that extends past the table into the model's output. That's a real shift in who you're building for, not a hypothetical one.",
        "Separately, the lakehouse pattern (open table formats like Iceberg or Delta Lake sitting under both batch and streaming engines) has consolidated into the default architecture at most organizations building anything new, replacing the older split between a data warehouse and a data lake maintained as two systems. Catalog interoperability, Iceberg's REST catalog spec in particular, has made it realistic to point multiple engines (Spark, Trino, DuckDB, a warehouse's native engine) at the same underlying tables instead of locking data into one engine's storage format.",
      ],
    },
    {
      heading: "What hasn't changed",
      paragraphs: [
        "Correctness still means the same thing it always did: a pipeline either produces the right answer for every row, including the edge cases, or it doesn't. An LLM agent orchestrating a transformation doesn't get a pass on a null join key or a duplicate row any more than a hand-written Spark job did.",
        "Idempotency, schema discipline, and understanding the actual shape of your data (its skew, its nulls, its late-arriving records) remain the skills that separate a pipeline that survives contact with production from one that doesn't. None of the newer consumers of data, agents included, are more forgiving of sloppy data modeling than a human analyst was; if anything, as covered earlier in this course, they're less forgiving, because they fail silently instead of asking a clarifying question.",
      ],
    },
    {
      heading: "Why the fundamentals are still the leverage point",
      paragraphs: [
        "Every topic in this course, partitioning, join strategies, schema evolution, idempotent writes, is what makes a table something a human, a dashboard, or an agent can rely on. None of that work goes away when the consumer changes; it becomes more valuable, because a fluent AI consumer amplifies a bad schema's mistakes at the same speed it amplifies a good one's clarity.",
        "The specific tools and frameworks on top of this layer will keep changing year to year, as they always have. The underlying discipline, building pipelines you can trust, verify, and reason about, is what carries across that churn, whether you're feeding a nightly batch job or an agent making a decision in real time.",
      ],
    },
  ],
  selfTest: [
    {
      question: "What is genuinely new about data engineering's role as of 2026, as covered in this course?",
      answer:
        "AI agents are a first-class consumer of pipeline output with their own requirements: semantic layers to avoid ambiguous metric definitions, context/retrieval pipelines with freshness guarantees, and provenance tracking that extends to model outputs, not just tables.",
    },
    {
      question: "What architectural consolidation has happened in data platforms by 2026?",
      answer:
        "The lakehouse pattern, open table formats like Iceberg or Delta Lake under both batch and streaming engines, has become the default, replacing a separately maintained warehouse and data lake, with catalog interoperability (such as Iceberg's REST catalog spec) letting multiple engines read the same tables.",
    },
    {
      question: "Why doesn't an AI-orchestrated pipeline get more tolerance for a bad join or a null key than a hand-written one?",
      answer:
        "Correctness is defined by the data, not the author. An agent planning a transformation is exposed to the exact same null keys, duplicate rows, and skew as a hand-written pipeline, and produces the same wrong output if those are not handled, just without a human noticing before it ships.",
    },
    {
      question: "Why does the course argue that AI consumers make fundamentals like schema discipline more valuable, not less?",
      answer:
        "An AI consumer is fluent and confident regardless of whether the underlying data is well-modeled, and it tends to fail silently rather than asking a clarifying question the way a human analyst would. A bad schema's mistakes get amplified just as fast as a good schema's clarity does.",
    },
    {
      question: "What is the course's closing claim about which skills remain useful across future tooling changes?",
      answer:
        "That the specific tools and frameworks will keep changing, but the underlying discipline, building pipelines that are correct, idempotent, and well-understood in shape, is what carries across that churn and makes someone useful whether they're building a batch job or feeding an agent.",
    },
  ],
};
