import type { Topic } from "../types";

export const watermarksStateEviction: Topic = {
  id: "watermarks-state-eviction",
  glossary: ["Event time", "Processing time", "Watermark", "Operator state", "Deduplication"],
  title: "Event time, processing time, watermarks, and state eviction",
  shortDescription: "How Structured Streaming bounds state, and the trade every watermark setting makes explicit.",
  sections: [
    {
      heading: "Event time vs. processing time",
      paragraphs: [
        "Event time is when something actually happened, carried in the data itself. Processing time is when Spark happens to see that row. Streaming aggregations are usually defined against event time, since that is what the business actually cares about, even though rows can arrive out of order relative to it.",
        'Watermarks are defined on event time and tell Spark how long to wait for stragglers. withWatermark("ts", "10 minutes") means state older than the maximum event time seen so far, minus 10 minutes, can be evicted, and any row that arrives later than that cutoff is dropped rather than processed.',
      ],
    },
    {
      heading: "Why watermarks exist",
      paragraphs: [
        "Without a watermark, aggregations and stream-stream joins would have to keep state forever, since Spark would have no way to know a given time window will never receive another late row. State grows unbounded, and eventually memory or disk runs out.",
        "The watermark trade is explicit and has to be chosen deliberately: a longer watermark window catches more late-arriving data correctly, but it costs more memory and disk because more state has to be retained while waiting.",
      ],
      table: {
        caption: "Watermark length trade-off",
        headers: ["Watermark", "Late data caught", "State retained"],
        rows: [
          ["1 minute", "Low", "Small"],
          ["10 minutes", "Moderate", "Moderate"],
          ["1 hour", "High", "Large, can dominate memory on a high-throughput stream"],
        ],
      },
    },
    {
      heading: "Dedup choice matters more than the dedup call itself",
      paragraphs: [
        "dropDuplicates on an event id grows state without bound, since every unique id that has ever been seen has to be remembered to detect a future duplicate of it, forever, unless bounded by a watermark.",
        "dropDuplicates on a business key alone, without an event id, silently discards legitimate lifecycle transitions, since a business key like order_id can legitimately appear multiple times across its lifecycle (created, shipped, delivered) and deduping on the key alone collapses those into one.",
        "The fix is to pick a lifecycle-aware key, for example (order_id, status), and attach a watermark to the dedup so the state involved is bounded rather than growing forever.",
      ],
      warning: "A dedup key that is too broad silently drops real events; a dedup key that is too narrow (an id alone) never bounds state.",
    },
    {
      heading: "Checkpoint placement is a design decision",
      paragraphs: [
        "The checkpoint defines what replay means for a given query: its offsets and state are the sole record of progress. One checkpoint belongs to exactly one query and should never be shared between two different queries, since each query's state schema and offset semantics are specific to its own plan.",
        "Treat the checkpoint path as part of the deployment contract. Changing the query's structure (adding an aggregation, changing a join) in a way that is incompatible with the existing state usually requires a new checkpoint, which in turn requires a decision about how much history to reprocess.",
      ],
    },
    {
      heading: "Spark UI / query progress evidence",
      paragraphs: [
        "Streaming query progress (df.lastProgress or the Structured Streaming tab) reports input rows, processing time, and watermark position per micro-batch. A watermark that never advances, or state size that grows monotonically across batches, both indicate the watermark is not doing its job, often because event time itself is not advancing in the source data.",
      ],
    },
  ],
  videos: [
    { title: "Late Data Processing, Watermarks, and Window Operations in Spark Streaming", url: "https://www.youtube.com/watch?v=4DT528dAjtU" },
  ],
  example: {
    title: "An advanced watermark bounds a windowed aggregation",
    description: "Assume a single-input, ten-minute tumbling aggregation has advanced its watermark to 10:11 after observing event time 10:21 with a ten-minute delay.",
    table: {
      headers: ["Item", "Event time or interval", "Effect"],
      rows: [
        ["New event", "10:15", "Within the lateness guarantee"],
        ["Older event", "10:05", "Outside the guarantee; may be dropped"],
        ["Retained window", "[10:00, 10:10)", "Eligible for finalization and state eviction"],
      ],
    },
    takeaway: "The watermark follows observed event-time progress. It does not mean every older event is always dropped, and the exact eviction rule depends on the stateful operator.",
  },
  selfTest: [
    {
      question: "What does withWatermark(\"ts\", \"10 minutes\") actually bound?",
      answer: "It bounds how long Spark retains state for aggregation windows or joins keyed on event time: state older than the max event time seen minus 10 minutes can be evicted, and later-arriving rows for that window are dropped.",
    },
    {
      question: "Why does a longer watermark cost more even when it catches more late data correctly?",
      answer: "A longer watermark means more state (aggregation buffers, join buffers) has to be retained in memory or spilled to disk while waiting for the window to close, since nothing can be evicted until the watermark has passed it.",
    },
    {
      question: "Why does dropDuplicates on an event id alone grow state forever?",
      answer: "Without a watermark, Spark has to remember every id it has ever seen to detect a future duplicate, since there is no point at which it can safely conclude a given id will never reappear.",
    },
    {
      question: "An order can appear multiple times with different statuses (created, shipped, delivered). Why is dropDuplicates(\"order_id\") wrong here?",
      answer: "It collapses the legitimate lifecycle transitions into a single row, since order_id alone cannot distinguish a new status update from a true duplicate of the same event. The key should include the status, for example (order_id, status).",
    },
    {
      question: "Can two different streaming queries share one checkpoint directory?",
      answer: "No. A checkpoint's offsets and state are specific to one query's plan; sharing it between two queries corrupts both queries' progress tracking.",
    },
  ],
};
