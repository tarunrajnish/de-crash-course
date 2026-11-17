import type { Topic } from "../types";

export const platformArchitectureAndIncrementalIngestion: Topic = {
  id: "platform-architecture-and-incremental-ingestion",
  title: "Platform architecture: batch, incremental loads, and CDC",
  shortDescription: "Designing scalable source-to-consumer pipelines with replayable ingestion, change capture, and explicit freshness targets.",
  sections: [
    {
      heading: "Start with the consumer and the source contract",
      paragraphs: [
        "A platform design starts with required freshness, peak volume, correctness, retention, and recovery time. A finance close that must reconcile every transaction and a dashboard refreshed every hour have different constraints. Document the source system's extraction limits, available keys, deletion semantics, and schema-change process before choosing a processing engine.",
        "Separate ingestion, storage, transformation, serving, and orchestration. A common lakehouse layout uses bronze for source-aligned records and ingestion metadata, silver for validated and deduplicated entities, and gold for consumer-facing aggregates. These names describe responsibilities; each layer needs an explicit grain, owner, and retention policy.",
      ],
    },
    {
      heading: "Choose the processing mode deliberately",
      paragraphs: [
        "A full batch rereads a bounded dataset. An incremental batch processes changes since a recorded position. A continuously running streaming query consumes an unbounded input, often through micro-batches. Incremental describes how much data is processed; streaming describes how processing continues. A scheduled batch can be incremental.",
        "For a timestamp-based extract, capture a stable upper bound, read a bounded interval with an overlap for late updates, and deduplicate by a durable key and source version. Advance the saved position only after the output commits successfully. An updated_at column cannot expose hard deletes unless the source also provides tombstones or reconciliation.",
        "Change data capture (CDC) carries inserts, updates, and deletes from a source change log. Bootstrap with a snapshot tied to a known log position, then apply subsequent changes in source order. Deduplicate deliveries, define how conflicting versions resolve, and monitor log-retention headroom so a delayed consumer does not lose its recovery position.",
      ],
      table: {
        headers: ["Mode", "Good fit", "Main trade-off"],
        rows: [
          ["Full batch", "Small tables or periodic reconciliation", "Repeated source load and longer processing windows"],
          ["Incremental batch", "Minute-to-hour freshness with identifiable changes", "Cursor correctness, late updates, and delete detection"],
          ["Streaming / CDC", "Low-latency changes and continuous consumers", "Ordering, state, source retention, and operational overhead"],
        ],
      },
    },
    {
      heading: "Scale and recover across integration boundaries",
      paragraphs: [
        "Persist source offsets or versions, ingestion time, and run identifiers alongside data so an operator can trace a record from extraction to publication. Retain replayable input where policy permits. Apply backpressure and bounded concurrency when an upstream API or transactional database cannot sustain the platform's peak read rate.",
        "Publish validated outputs through stable tables, views, or versioned interfaces. Keep partial writes away from consumers through transactional commits or a staged publication step. Reconcile source and target counts, totals, and deletes periodically; a green orchestration run alone cannot prove completeness.",
      ],
      warning: "A stream checkpoint cannot recover source changes that have already expired from the source log. Alert on consumer lag relative to retention, and keep a documented resnapshot procedure.",
    },
  ],
  examplesToAttach: [
    "An architecture diagram labeling source contracts, bronze/silver/gold responsibilities, serving interfaces, and recovery boundaries.",
    "An incremental-load test covering a late update, a delete, and a crash between output commit and cursor advancement.",
  ],
  selfTest: [
    { question: "Can a nightly batch be incremental?", answer: "Yes. It can read only changes after a saved source position each night. Incremental processing does not require a continuously running stream." },
    { question: "Why save the extraction position after the output commits?", answer: "Saving it first can skip records if the write fails. Saving it afterward permits replay after a crash, so the sink also needs idempotent writes or deduplication." },
    { question: "Why can an updated_at cursor miss deletes?", answer: "A physically deleted row no longer exists to match a timestamp filter. Use CDC delete events, soft-delete markers, or periodic source-to-target reconciliation." },
    { question: "What happens when CDC lag exceeds source log retention?", answer: "The consumer may no longer be able to resume from its saved position. Recovery requires a supported retained copy or a new consistent snapshot and log handoff." },
  ],
};
