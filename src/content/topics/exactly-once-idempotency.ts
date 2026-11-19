import type { Topic } from "../types";

export const exactlyOnceIdempotency: Topic = {
  id: "exactly-once-idempotency",
  glossary: ["Exactly-once", "Idempotency", "Deduplication", "Offset", "Checkpoint"],
  title: "Exactly-once claims vs. end-to-end idempotency",
  shortDescription: "Spark's internal guarantee and your sink's guarantee are two different promises, often conflated into one.",
  sections: [
    {
      heading: "The rule",
      paragraphs: [
        "Spark's exactly-once claim is real, but narrow: it covers Spark's own offset tracking. Spark will process each source offset exactly once according to its internal bookkeeping, even across restarts, as long as the checkpoint is intact.",
        "End-to-end idempotency is a separate, broader claim: that re-applying the same batch of output to the sink produces the same final state as applying it once. That depends entirely on how the sink is written to.",
      ],
    },
    {
      heading: "Why conflating the two costs you",
      paragraphs: [
        "A team that hears \"Spark guarantees exactly-once\" and stops there assumes the pipeline as a whole is exactly-once. But if the sink is a plain file append or an INSERT without a uniqueness constraint, replaying a micro-batch after a failure and restart writes the data again, producing duplicates in the sink even though Spark itself never reprocessed a source offset twice.",
        "The two problems are genuinely different and need different fixes: duplicate sends from the source (the same logical event delivered twice upstream) are a dedup problem, while reprocessing after a Spark-side failure and restart is an idempotency problem.",
      ],
      table: {
        caption: "Two different problems",
        headers: ["", "Duplicate upstream sends", "Reprocessing after restart"],
        rows: [
          ["Cause", "Same event delivered twice by the source", "Spark restarts and replays a micro-batch"],
          ["Fixed by", "Dedup on a lifecycle-aware business key", "Idempotent sink write (delete-then-rewrite or MERGE)"],
          ["Spark's exactly-once offset tracking helps?", "No, this happens before Spark sees distinct events as duplicates", "Partially, it tracks what Spark processed, but not what the sink durably received"],
        ],
      },
    },
    {
      heading: "A concrete worked example",
      paragraphs: [
        "A payments stream has two failure modes to solve independently. Duplicate sends: the same payment event arrives twice from upstream with identical (payment_id, lifecycle_stage). Dedup on exactly that composite key, with a watermark to bound the state needed to detect it, solves this.",
        "Reprocessing after a failure: Spark restarts mid-batch and replays a micro-batch it had partially written to the sink. Tagging each row with its source file identifier and writing with a delete-then-rewrite pattern keyed on that identifier (or a MERGE keyed on the business key) solves this, since replaying the same batch produces the same final rows rather than appending a second copy.",
      ],
    },
    {
      heading: "Why these are the same mistake, twice",
      paragraphs: [
        "Both failure modes look identical from the outside: the sink ends up with duplicate rows. But the fix for one does nothing for the other. Deduping on event id will not catch a sink-side replay that wrote the exact same event id once (there is nothing to dedup against, it's one logical write happening twice at the storage layer). An idempotent sink write will not catch a true duplicate event sent twice by an upstream producer, since to the sink both are legitimately distinct Spark-side batches carrying the same business event.",
      ],
      warning: "Fixing only one of these two problems leaves a pipeline that looks correct in testing and duplicates data in production under the failure mode you didn't cover.",
    },
    {
      heading: "Spark UI / verification evidence",
      paragraphs: [
        "Checkpoint directory offset logs show which source offsets Spark has committed, confirming the internal exactly-once claim. Verifying end-to-end idempotency requires testing at the sink: deliberately replay a committed micro-batch and confirm row counts and content in the sink are unchanged, which is not something the Spark UI shows directly.",
      ],
    },
  ],
  example: {
    title: "Deduplicate sends without discarding real updates",
    description: "The sink holds one current row per order. It updates that row only when an incoming source version is newer.",
    table: {
      headers: ["Delivery", "Order / version / amount", "Target amount"],
      rows: [
        ["First event", "42 / v1 / 10", "10"],
        ["Duplicate send", "42 / v1 / 10", "10"],
        ["Legitimate update", "42 / v2 / 15", "15"],
        ["Replay older event", "42 / v1 / 10", "15"],
      ],
    },
    takeaway: "Order ID alone is too coarse for event deduplication: it would discard v2. Combine event/version identity with a sink rule that prevents older replays from overwriting newer state.",
  },
  selfTest: [
    {
      question: "A team says \"our pipeline is exactly-once because Spark guarantees it.\" What's missing from that claim?",
      answer: "Spark's exactly-once guarantee covers its own offset tracking. It says nothing about what happens at the sink. Without an idempotent sink (delete-then-rewrite or MERGE), replaying a batch after a restart can still duplicate data there.",
    },
    {
      question: "What's the difference between a duplicate upstream send and a Spark-side reprocess after failure?",
      answer: "A duplicate upstream send is the same logical event delivered twice by the source before Spark ever sees it as two distinct batches; a reprocess is Spark itself replaying a micro-batch it already partially wrote, because it restarted mid-batch.",
    },
    {
      question: "Why doesn't deduping on (payment_id, lifecycle_stage) protect against a sink-side replay?",
      answer: "A sink-side replay re-applies the exact same already-deduped batch again. There's no duplicate for the dedup logic to catch, since from Spark's perspective it processed that batch's offset once; the duplication happens at the write to the sink, which dedup logic upstream of the sink never sees.",
    },
    {
      question: "What makes a sink write idempotent against replay?",
      answer: "A write pattern where re-applying the same batch produces the same final state as applying it once, such as delete-then-rewrite keyed on a stable identifier like a source file id, or MERGE keyed on a business key that overwrites rather than appends.",
    },
    {
      question: "Why might deduping on payment_id alone (without lifecycle_stage) be wrong?",
      answer: "A single payment can legitimately pass through multiple lifecycle stages (authorized, captured, refunded), each a distinct, valid event sharing the same payment_id. Deduping on payment_id alone would discard all but one of these legitimate stage transitions.",
    },
  ],
};
