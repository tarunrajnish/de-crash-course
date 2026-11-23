export interface SummaryCard {
  courseId: string;
  points: string[];
}

// One card per topic set, in the same order as the homepage. Titles come from the course itself.
export const summaryCards: SummaryCard[] = [
  {
    courseId: "spark-delta-basics",
    points: [
      "Spark splits data across a cluster; a job breaks into stages at shuffles, and stages into tasks per partition.",
      "DataFrames beat RDDs: the optimizer can plan structured operations.",
      "Delta Lake = Parquet files + a transaction log, which gives ACID, time travel, and safe concurrent writes.",
    ],
  },
  {
    courseId: "transformations-joins-skew",
    points: [
      "Narrow transformations stay in a partition; wide ones shuffle, the costliest step in Spark.",
      "Broadcast small tables; sort-merge is the large-table default; OOM on a broadcast is the classic failure.",
      "Skew: fix with AQE first, then salting. Avoid tiny or oversized partitions and files.",
      "Cache to reuse a result; checkpoint to cut lineage. Filter on partition columns to prune.",
    ],
  },
  {
    courseId: "delta-streaming-internals",
    points: [
      "Watermarks bound streaming state; a longer delay keeps more late data but costs more memory.",
      "Exactly-once needs an idempotent sink, not just Spark's internal guarantee.",
      "The Delta log is the table; concurrent MERGE conflicts follow from optimistic concurrency.",
      "Schema enforcement rejects drift by default; opt in to evolution explicitly.",
    ],
  },
  {
    courseId: "data-modeling-warehousing",
    points: [
      "OLTP serves many small writes; OLAP serves large scans and aggregates. Columnar storage suits OLAP.",
      "Declare the grain first: one row per what? Facts hold measures, dimensions hold context.",
      "Star schemas denormalize for speed; snowflake normalizes for less redundancy.",
      "SCD type 1 overwrites, type 2 keeps history with validity dates.",
    ],
  },
  {
    courseId: "orchestration-and-pipelines",
    points: [
      "A DAG encodes dependencies; every task must be safe to run twice (idempotent).",
      "Backfills rerun the past: partition-scoped overwrites make them repeatable.",
      "Schedule by time or trigger by event; most real systems use both.",
      "Airflow is task-based, Dagster is asset-based. Data contracts make dependencies safe.",
    ],
  },
  {
    courseId: "data-quality-observability",
    points: [
      "A green run is not correct data. Watch freshness, volume, schema, distribution, and lineage.",
      "Schema registries and compatibility rules stop producer changes from breaking consumers.",
      "Test the data (expectations, dbt tests), not just the code.",
      "Simple thresholds usually beat statistical anomaly models; lineage speeds up incident response.",
    ],
  },
  {
    courseId: "lakehouse-storage-formats",
    points: [
      "Parquet stores columns in row groups with min/max statistics so engines can skip files.",
      "Delta, Iceberg, and Hudi add ACID and time travel over Parquet files.",
      "Compaction fixes small files, at a write cost.",
      "The catalog decides whether multiple engines can share a table.",
    ],
  },
  {
    courseId: "ai-feature-embedding-pipelines",
    points: [
      "Feature stores serve one definition to training and inference, with point-in-time correctness to avoid leakage.",
      "Most production feature sets mix batch and streaming features.",
      "Embeddings turn text into vectors; approximate search finds nearest neighbors at scale.",
      "RAG data work: chunking, index freshness, and fine-tuning data (dedupe, decontaminate).",
    ],
  },
  {
    courseId: "ai-de-frontier",
    points: [
      "Text-to-SQL and agentic ETL still depend on solid data engineering underneath.",
      "A semantic layer maps business terms to governed SQL, which AI consumers need even more.",
      "Context pipelines are ETL with a new consumer: keep agent context fresh and reliable.",
      "AI governance adds provenance: what fed this specific answer.",
    ],
  },
  {
    courseId: "retrieval-systems-and-agent-tools",
    points: [
      "Parse PDFs, audio, and images into structured, citable text before embedding.",
      "Hybrid search (keyword plus vector) with a reranker beats cosine similarity alone.",
      "Build a 30-50 question eval set so retrieval tuning is measured, not guessed.",
      "Expose pipelines as MCP tools; agents loop reason, act, observe.",
    ],
  },
  {
    courseId: "databricks-and-platform-architecture",
    points: [
      "Load incrementally: full loads are simple, changed-row loads are cheaper, CDC captures every change.",
      "Express logic in SQL or PySpark and promote notebooks to repeatable jobs.",
      "Unity Catalog: least privilege, workload identities, governed storage, lineage.",
      "Find the bottleneck first, then trade cost against the service target.",
    ],
  },
  {
    courseId: "production-engineering-and-ownership",
    points: [
      "Promote one versioned artifact through dev, staging, and prod with tested migrations.",
      "Share ingestion mechanics, keep business rules explicit, and test the failure paths.",
      "Support: bound the investigation, recover safely, then fix the root cause.",
      "Own the source-to-consumer outcome and ship in small, measurable steps.",
    ],
  },
];
