import type { Topic } from "../types";

export const partitioningFileSizing: Topic = {
  id: "partitioning-file-sizing",
  title: "Partition count, file sizing, and the small-file problem",
  shortDescription: "Why 200 shuffle partitions is almost always wrong, and how directory layout can destroy a table.",
  sections: [
    {
      heading: "The rule",
      paragraphs: [
        "Target 128 to 256 MB per shuffle partition and per output file. spark.sql.shuffle.partitions defaults to 200, and that number is wrong for most jobs in both directions: too many for a small job, too few for a large one.",
        "A job shuffling 10 GB into 200 partitions produces 50 MB partitions, comfortably in range. The same setting applied to a 10 TB shuffle produces 50 GB partitions, each one too large to process without spilling.",
      ],
    },
    {
      heading: "Why it costs what it costs",
      paragraphs: [
        "Too few, oversized partitions mean each task holds more data than fits comfortably in memory, forcing spills to disk and slower, less parallel execution. Too many, undersized partitions mean per-task scheduling overhead and per-file open and metadata cost start to dominate the actual work being done.",
        "AQE's coalesce feature (spark.sql.adaptive.coalescePartitions.enabled) merges small post-shuffle partitions at runtime based on real observed sizes, which is why hand-tuning the 200 default is mostly obsolete on modern Spark versions. It solves the too-many-partitions side of the problem automatically; it does not fix a static shuffle count that is too low for the data volume.",
      ],
    },
    {
      heading: "The small-file problem",
      paragraphs: [
        "Thousands of tiny files mean per-file open cost on every read, bloated file-listing metadata, and slower directory listing overall. In Delta Lake this also bloats the transaction log, since every file is tracked as an entry in the log's metadata.",
        "The fix is OPTIMIZE (file compaction) or liquid clustering, both of which rewrite many small files into fewer, properly sized ones.",
      ],
    },
    {
      heading: "Partition columns are physical directories",
      paragraphs: [
        "Choosing a partition column means choosing a directory structure on disk. Pick a low-cardinality, high-selectivity column that queries actually filter on, usually a date.",
        "Partitioning by a high-cardinality column (customer_id, for example) creates one directory per distinct value. With millions of customers that is millions of directories, each potentially holding a handful of tiny files. This is the fastest way to destroy a table's read and write performance at once.",
      ],
      warning: "A high-cardinality partition column turns the small-file problem into the default behavior of every write.",
    },
    {
      heading: "Comparison: partition column choices",
      paragraphs: [],
      table: {
        caption: "Partition column cardinality",
        headers: ["Column", "Cardinality", "Effect"],
        rows: [
          ["event_date", "Low (one value per day)", "Good: few large directories, queries filter on it naturally"],
          ["region", "Low", "Good, if queries commonly filter by region"],
          ["customer_id", "Very high", "Bad: one directory per customer, small-file problem by construction"],
          ["store_id", "Medium", "Depends: fine if stores number in the hundreds, risky in the tens of thousands"],
        ],
      },
    },
    {
      heading: "Pruning only works on the stored column",
      paragraphs: [
        "Partition pruning skips entire directories based on the partition column appearing directly in a filter. Predicate pushdown skips row groups inside Parquet files using min/max statistics, independent of partitioning.",
        "Both only work if the filter is written against the stored column itself, not a function of it. where date(ts) = '2026-01-01' often defeats pruning, because Spark would have to evaluate date() against every row's ts to know which partitions qualify. where dt = '2026-01-01', filtering directly on a stored partition column, gets the pruning.",
      ],
    },
    {
      heading: "Spark UI evidence",
      paragraphs: [
        "Check the number of tasks in the read stage against the expected file count: thousands of tasks reading tiny files shows up as a task count far exceeding the data volume would justify. The SQL tab's scan node shows \"number of files read\" and total size, letting you compute average file size directly.",
      ],
    },
  ],
  examplesToAttach: [
    "A table's file listing before and after an OPTIMIZE run, showing file count and average size.",
    "A query plan comparing where dt = '...' against where date(ts) = '...' on the same table.",
  ],
  selfTest: [
    {
      question: "A job shuffles 10 TB with the default 200 shuffle partitions. What's wrong, and what's the fix?",
      answer:
        "200 partitions over 10 TB is 50 GB per partition, far above the 128-256 MB target, so tasks spill heavily. Raise spark.sql.shuffle.partitions to bring each partition back into range, or rely on AQE coalesce only if the issue is too many small partitions, which it is not here.",
    },
    {
      question: "Why does AQE coalesce make manual shuffle-partition tuning mostly unnecessary?",
      answer:
        "AQE observes the actual post-shuffle partition sizes at runtime and merges undersized ones automatically, so setting shuffle partitions high up front and letting AQE coalesce down is safer than guessing a fixed number in advance.",
    },
    {
      question: "A table has 2 million files for 500 GB of data. What's the likely root cause and the fix?",
      answer:
        "Likely a high-cardinality partition column or many small incremental writes without compaction. Fix with OPTIMIZE or liquid clustering to rewrite the small files into properly sized ones, and reconsider the partition column choice going forward.",
    },
    {
      question: "Why does where date(ts) = '2026-01-01' often fail to prune partitions that where dt = '2026-01-01' would prune?",
      answer:
        "Partition pruning matches filters against the stored partition column directly. Wrapping ts in date() requires evaluating a function per row, which pruning logic does not do, so Spark falls back to scanning every partition.",
    },
    {
      question: "What's the difference between partition pruning and predicate pushdown?",
      answer:
        "Partition pruning skips whole directories based on the partition column in the filter. Predicate pushdown skips row groups inside Parquet files using stored min/max statistics, and applies even to non-partition columns.",
    },
    {
      question: "Why is customer_id a poor partition column choice even if queries do filter on it?",
      answer:
        "Its cardinality is extremely high, so partitioning by it creates one directory per customer, almost certainly with small files in each. The small-file problem this creates usually costs more than the pruning benefit gains back.",
    },
  ],
};
