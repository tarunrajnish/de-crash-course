import type { Topic } from "../types";

export const lakehouseTableFormats: Topic = {
  id: "lakehouse-table-formats",
  title: "The open table format landscape: Delta Lake, Iceberg, and Hudi",
  shortDescription: "Three different answers to the same problem: ACID transactions and time travel on top of plain Parquet files.",
  sections: [
    {
      heading: "The shared problem",
      paragraphs: [
        "Plain Parquet files in object storage have no concept of a table version, no atomic commit, and no efficient way to answer \"which files make up this table right now.\" Delta Lake, Apache Iceberg, and Apache Hudi all solve this the same basic way: a metadata layer that tracks table state as a sequence of versioned snapshots, giving readers a consistent view and writers an atomic commit point.",
        "All three give you ACID transactions, time travel (query the table as of an earlier snapshot), and schema evolution without rewriting existing data. Where they diverge is in how that metadata is organized, which engines they were built around, and which workload each optimizes for.",
      ],
    },
    {
      heading: "Delta Lake: a transaction log tied to Spark",
      paragraphs: [
        "Delta Lake's metadata is a sequence of JSON (and periodically compacted Parquet checkpoint) files describing every add/remove file operation. It originated inside Databricks and has historically been the most tightly integrated with Spark, with first-class support for MERGE, schema enforcement, and constraints.",
        "Delta Lake has since opened up (Delta Kernel, Delta Universal Format / UniForm) to reduce the Spark lock-in, but in practice it still has the deepest tooling and the smoothest experience inside the Databricks ecosystem specifically.",
      ],
    },
    {
      heading: "Iceberg: hidden partitioning and catalog independence",
      paragraphs: [
        "Iceberg tracks table state through a hierarchy of metadata files, manifest lists, and manifests, each snapshot pointing to the manifests that describe exactly which data files it contains. This hierarchy lets engines prune at the manifest level before even opening a data file's footer.",
        "Iceberg's defining feature is hidden partitioning: partition values are derived from a column via a transform (for example, day(event_timestamp)) and stored as metadata, not baked into physical directory names. Queries filter on the logical column, Iceberg maps that to the physical partition transparently, which eliminates the classic mistake of a correct predicate that misses partition pruning because it doesn't match the directory naming scheme exactly. Iceberg was also designed from day one to be catalog-agnostic and engine-agnostic (Spark, Trino, Flink, Snowflake all read and write it natively).",
      ],
    },
    {
      heading: "Hudi: built for upserts and CDC",
      paragraphs: [
        "Apache Hudi was built around the assumption that most tables aren't append-only; they're continuously updated from upstream OLTP systems via change data capture. It offers two table types: Copy-on-Write, which rewrites affected Parquet files on every update, and Merge-on-Read, which writes updates to a separate log and merges them with base files at read time.",
        "Merge-on-Read trades slightly slower reads for much faster, lower-amplification writes, which is the right trade-off for high-frequency upsert workloads (streaming CDC ingestion) where Delta's or Iceberg's copy-on-write merge would rewrite far more data per update.",
      ],
      table: {
        caption: "Delta Lake vs Iceberg vs Hudi",
        headers: ["Format", "Strongest fit", "Partitioning", "Ecosystem origin"],
        rows: [
          ["Delta Lake", "Spark-centric pipelines, Databricks environments", "Physical directories by default", "Databricks"],
          ["Iceberg", "Multi-engine access, large analytical tables", "Hidden, metadata-driven transforms", "Netflix, now Apache"],
          ["Hudi", "High-frequency upserts, CDC ingestion", "Physical directories", "Uber, now Apache"],
        ],
      },
    },
    {
      heading: "Picking one isn't permanent, but switching isn't free",
      paragraphs: [
        "All three formats are converging on similar capabilities, and tools exist to read one format's tables as another's (Delta UniForm, Iceberg metadata translation). But migrating an existing table between formats still means rewriting or re-registering metadata at minimum, and sometimes rewriting data files if the target format's layout assumptions differ.",
        "The practical decision in 2026 is usually driven less by the format itself and more by which engines and catalogs the organization already standardizes on, since all three now support the same core transactional guarantees.",
      ],
      warning:
        "Choosing Copy-on-Write Hudi (or Delta/Iceberg's default merge behavior) for a table that receives thousands of small upserts per minute can make write amplification the dominant cost, since each update potentially rewrites entire Parquet files just to change a handful of rows.",
    },
  ],
  videos: [
    { title: "A Thorough Comparison of Delta Lake, Iceberg and Hudi", url: "https://www.youtube.com/watch?v=Wx8G08jaedo" },
  ],
  examplesToAttach: [
    "A snapshot history or `DESCRIBE HISTORY` output showing time travel across table versions in your format of choice.",
    "A write-amplification comparison between Copy-on-Write and Merge-on-Read for the same upsert workload, if using Hudi.",
  ],
  selfTest: [
    {
      question: "What core problem do Delta Lake, Iceberg, and Hudi all solve that plain Parquet files in object storage don't?",
      answer:
        "ACID transactions and a consistent, versioned view of which files make up a table at any point in time, which plain files alone cannot provide since there's no atomic commit boundary or snapshot concept.",
    },
    {
      question: "What does Iceberg's \"hidden partitioning\" solve that physical directory partitioning doesn't?",
      answer:
        "It derives partition values from a column via a transform and stores the mapping as metadata rather than baking it into directory names. A query filtering on the logical column always gets partition pruning, instead of silently missing it because the predicate doesn't match the directory naming convention exactly.",
    },
    {
      question: "Why does Hudi offer both Copy-on-Write and Merge-on-Read table types?",
      answer:
        "Copy-on-Write rewrites affected files on every update, which keeps reads simple and fast but is expensive for high-frequency updates. Merge-on-Read defers merging to read time, trading some read cost for much cheaper, lower-amplification writes, suiting CDC-heavy ingestion.",
    },
    {
      question: "Which of the three table formats was designed from the start to be catalog- and engine-agnostic?",
      answer:
        "Apache Iceberg. It was built so that Spark, Trino, Flink, Snowflake, and others could read and write the same tables natively, rather than being anchored to one engine's ecosystem.",
    },
    {
      question: "A table receives thousands of small upserts per minute. Why might Copy-on-Write be the wrong choice?",
      answer:
        "Copy-on-Write rewrites entire affected Parquet files for each update, so at high upsert frequency the write amplification (bytes rewritten per logical row changed) becomes the dominant cost. Merge-on-Read avoids this by writing updates to a separate log instead.",
    },
    {
      question: "If all three formats now offer similar ACID guarantees and time travel, what usually drives the choice between them in practice?",
      answer:
        "Which engines, catalogs, and platforms the organization already uses, since the formats have converged on core capabilities and the bigger cost is now ecosystem and tooling fit rather than any single missing feature.",
    },
  ],
};
