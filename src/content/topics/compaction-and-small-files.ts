import type { Topic } from "../types";

export const compactionAndSmallFiles: Topic = {
  id: "compaction-and-small-files",
  glossary: ["Small-file problem", "Compaction", "OPTIMIZE", "Z-ordering", "Liquid clustering"],
  title: "Compaction and the small-file problem",
  shortDescription: "Why thousands of tiny files quietly wreck read performance, and the operations that fix it at a cost.",
  sections: [
    {
      heading: "How small files accumulate",
      paragraphs: [
        "Streaming jobs that commit a micro-batch every few seconds, or high-frequency append/upsert pipelines, each write a new file (or a new file per partition per batch) regardless of how little data that batch contains. Left unmanaged, a table ingesting from a busy stream can accumulate tens of thousands of files that are each only a few KB to a few MB, far below an efficient row group size.",
        "This isn't unique to streaming: any pipeline with high partition cardinality combined with frequent writes (per-hour partitions updated every five minutes, for example) produces the same pattern, because each partition directory accumulates its own trickle of small files independently.",
      ],
    },
    {
      heading: "Why small files hurt reads",
      paragraphs: [
        "Every file carries fixed overhead: opening a connection to object storage, reading its footer, and scheduling a task to process it. When files are small, this per-file overhead dominates the actual data processing time, and a query that should take seconds spends most of its time on file-open latency rather than computation.",
        "It also strains the metadata layer. A table format's manifests or transaction log have to track every file individually, so a table with 200,000 tiny files produces far more metadata to list, parse, and plan against than the same data in a few hundred well-sized files, slowing down query planning before a single row is read.",
      ],
    },
    {
      heading: "Compaction (OPTIMIZE)",
      paragraphs: [
        "Compaction reads many small files and rewrites them as fewer, larger files at a target size (commonly 128 MB to 1 GB, matching a healthy row group size). This is a write amplification cost paid deliberately and on a schedule, in exchange for every subsequent read being faster.",
        "It's typically run as a periodic maintenance job (Delta's OPTIMIZE, Iceberg's rewrite_data_files, Hudi's clustering) rather than inline with every write, because compacting after every micro-batch would mean paying full rewrite cost constantly instead of batching it.",
      ],
    },
    {
      heading: "Z-ordering and liquid clustering: multi-dimensional skipping",
      paragraphs: [
        "Simple compaction fixes file size but says nothing about which rows end up colocated inside a file. Z-ordering interleaves the bits of multiple column values into a single sort key, so files end up clustered on several columns simultaneously rather than just one, improving file-skipping statistics for queries that filter on any of those columns.",
        "Liquid clustering (Delta) and similar adaptive clustering approaches go further: clustering keys can be changed after the fact without a full table rewrite, and clustering is applied incrementally as new data lands rather than requiring a full Z-order pass across the whole table each time.",
      ],
      table: {
        caption: "Compaction and clustering trade-offs",
        headers: ["Operation", "What it improves", "Cost paid"],
        rows: [
          ["Compaction / OPTIMIZE", "File count and average file size", "Rewrites small files into larger ones; compute at maintenance time"],
          ["Z-ordering", "Multi-column data skipping within compacted files", "Additional sort cost during compaction"],
          ["Liquid clustering", "Same as Z-order, plus can change clustering key later", "Incremental clustering cost on new data, not a full rewrite"],
        ],
      },
    },
    {
      heading: "The trade-off that's easy to get wrong",
      paragraphs: [
        "Running compaction too rarely leaves query performance degrading silently as file count grows; running it too aggressively (on every write) turns a cheap streaming append into an expensive rewrite on the pipeline's critical path. The usual approach is to let small files accumulate for a bounded window, then compact asynchronously outside the ingestion path.",
        "A table that looks fine in development, with a handful of test files, can hide a severe small-file problem that only appears at production ingestion volume weeks or months later, once file count crosses the threshold where per-file overhead starts to dominate.",
      ],
      warning:
        "A streaming pipeline with no scheduled compaction will keep working correctly while query latency silently climbs, because small-file buildup degrades performance gradually rather than causing an outright failure that would get noticed immediately.",
    },
  ],
  videos: [
    { title: "Delta Lake Tutorial: VACUUM, OPTIMIZE and Z-Ordering Explained", url: "https://www.youtube.com/watch?v=8e2a1MYgdqU" },
  ],
  example: {
    title: "The same rows with fewer file opens",
    description: "An illustrative 128 MiB of data is rewritten without changing its 128,000 logical rows. Real physical sizes also depend on encoding and compression.",
    table: {
      headers: ["Layout", "Files", "Approx. size per file", "Rows"],
      rows: [
        ["Before compaction", "128", "1 MiB", "128,000"],
        ["After compaction", "1", "128 MiB", "128,000"],
      ],
    },
    takeaway: "Compaction reduces per-file overhead without changing logical results. Z-ordering or liquid clustering additionally changes which values are colocated for data skipping.",
  },
  selfTest: [
    {
      question: "Why do streaming pipelines tend to produce a small-file problem even when total data volume isn't large?",
      answer:
        "Each micro-batch commits as its own file (or set of files) regardless of how little data it contains, so frequent small commits accumulate many tiny files over time, independent of overall data volume.",
    },
    {
      question: "Why does a query over many small files run slower than the same data in fewer, larger files, even with identical total bytes?",
      answer:
        "Each file carries fixed per-file overhead (opening a connection, reading its footer, scheduling a task), and with many small files this overhead dominates actual processing time. It also increases the metadata the table format must list and parse during query planning.",
    },
    {
      question: "Why is compaction usually run as a scheduled maintenance job instead of inline with every write?",
      answer:
        "Compacting after every write would mean paying full rewrite cost on every commit. Batching compaction on a schedule lets small files accumulate briefly and rewrites them together, amortizing the cost instead of paying it constantly.",
    },
    {
      question: "What does Z-ordering add beyond what plain compaction (file-size optimization) achieves?",
      answer:
        "Plain compaction only fixes file size and count. Z-ordering additionally interleaves multiple column values into a sort key so rows end up clustered on several columns at once, improving multi-column file-skipping statistics, not just the number of files.",
    },
    {
      question: "What does liquid clustering allow that traditional Z-ordering does not?",
      answer:
        "The clustering key can be changed later without a full table rewrite, and clustering is applied incrementally to new data rather than requiring a complete Z-order pass over the entire table each time.",
    },
    {
      question: "A production table's query latency has been climbing for months with no errors or alerts. What should you check first?",
      answer:
        "File count and average file size for the table's recent partitions. Small-file buildup degrades performance gradually and silently, with no failure to trigger an alert, which is why it's easy to miss until it's checked directly.",
    },
  ],
};
