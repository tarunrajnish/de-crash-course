import type { Topic } from "../types";

export const cachingVsCheckpointing: Topic = {
  id: "caching-vs-checkpointing",
  title: "Caching vs. checkpointing",
  shortDescription: "Keeping a result around versus cutting the lineage that produced it: two different tools for two different problems.",
  sections: [
    {
      heading: "The rule",
      paragraphs: [
        "cache and persist keep a computed result in memory or on disk, but preserve the lineage that produced it. If a cached partition is lost, Spark recomputes it from the original plan, exactly as if the cache had never existed.",
        "checkpoint writes the data to reliable storage and truncates the lineage. The plan is cut at that point; nothing upstream of a checkpoint can ever be re-executed to reproduce it, because Spark no longer remembers how to.",
      ],
    },
    {
      heading: "Why it costs what it costs",
      paragraphs: [
        "Caching an unused or single-use dataframe is pure overhead: it spends memory and the cost of writing to the cache for a benefit that never materializes, and if the cache gets evicted under memory pressure, Spark falls back to recomputation anyway, meaning you paid to cache something that was recomputed regardless.",
        "A long lineage, as commonly happens in iterative algorithms, makes recomputation on failure expensive: an executor loss late in a chain of 50 shuffles can force Spark to re-run most of that chain. checkpoint exists specifically to bound how far back a recompute can go.",
      ],
    },
    {
      heading: "localCheckpoint, the fast but non-durable option",
      paragraphs: [
        "localCheckpoint also truncates lineage, but writes to executor-local storage instead of reliable distributed storage. It's faster because there's no network write to durable storage, but it is not fault-tolerant: if the executor holding that data is lost, the data is gone and cannot be recomputed, since the lineage that would have allowed recomputation was already cut.",
        "This is the right fix for runaway lineage in iterative or DAG-engine code where fault tolerance across executor loss is less of a concern than keeping the plan from growing unbounded.",
      ],
      table: {
        caption: "cache vs. checkpoint vs. localCheckpoint",
        headers: ["", "cache / persist", "checkpoint", "localCheckpoint"],
        rows: [
          ["Lineage", "Preserved", "Truncated", "Truncated"],
          ["Storage", "Memory or local disk", "Reliable distributed storage", "Executor-local storage"],
          ["Fault-tolerant", "Yes, via recompute", "Yes", "No"],
          ["Typical use", "Dataframe reused multiple times", "Breaking a long lineage durably", "Breaking a long lineage fast, tolerating data loss on executor failure"],
        ],
      },
    },
    {
      heading: "When to actually cache",
      paragraphs: [
        "Cache only when a dataframe is read more than once downstream and the cost of recomputing it exceeds the cost of holding it in memory. A dataframe used exactly once gains nothing from caching; the cache write cost is wasted.",
        "Evictions make this worse than not caching at all: Spark spends time managing a cache entry that gets evicted before its second read, then recomputes anyway on that second read, paying both the caching overhead and the full recompute cost.",
      ],
      warning: "A cache hint on a dataframe used once is a net loss, not a neutral no-op.",
    },
    {
      heading: "Streaming checkpoints are a different thing",
      paragraphs: [
        "A streaming query's checkpoint stores offsets (what has been read from the source) and operator state (aggregation buffers, join buffers), so a restart resumes exactly where the query stopped rather than reprocessing from the beginning.",
        "Changing the query, for example adding a new aggregation or changing a join's shape, can make an existing checkpoint incompatible with the new plan. Deleting a checkpoint to work around an incompatibility silently re-reads from the source according to the configured starting offset, which can mean reprocessing data the sink has already seen.",
      ],
      warning: "Deleting a broken streaming checkpoint is rarely free: it is a decision about how much history gets reprocessed, made silently.",
    },
    {
      heading: "Spark UI evidence",
      paragraphs: [
        "The Storage tab shows cached RDDs/dataframes, their memory and disk usage, and fraction cached, letting you see whether a cache was actually fully materialized or partially evicted. For checkpoints, the configured checkpoint directory shows the written files directly, separate from any Spark UI tab.",
      ],
    },
  ],
  examplesToAttach: [
    "A Storage tab screenshot showing a partially evicted cached dataframe.",
    "A streaming job's checkpoint directory listing, showing offset and state files.",
  ],
  selfTest: [
    {
      question: "A cached dataframe shows 40% cached in the Storage tab. What happens on the next read of the uncached 60%?",
      answer: "Spark recomputes that portion from the original lineage, since caching preserves lineage as a fallback for anything not actually resident in the cache.",
    },
    {
      question: "Why does checkpoint truncate lineage but cache does not?",
      answer: "checkpoint is designed to bound recomputation by writing a durable copy and discarding the plan that produced it. cache is designed to avoid recomputation when possible while still guaranteeing correctness if the cached copy is lost, which requires keeping the lineage as a fallback.",
    },
    {
      question: "When would you choose localCheckpoint over checkpoint?",
      answer: "When lineage has grown so long that planning or recomputation becomes a problem (common in iterative algorithms), and you can tolerate losing that data on executor failure, since localCheckpoint is faster but not fault-tolerant.",
    },
    {
      question: "You delete a streaming checkpoint because the query is failing to start. What actually happens next?",
      answer: "The query loses its record of processed offsets and state, and restarts reading from the source according to the configured starting point, which usually means reprocessing data that was already delivered to the sink.",
    },
    {
      question: "A dataframe is read exactly once downstream. Should you cache it?",
      answer: "No. Caching has a write cost and no second read to benefit from it, so it is pure overhead with no corresponding savings.",
    },
  ],
};
