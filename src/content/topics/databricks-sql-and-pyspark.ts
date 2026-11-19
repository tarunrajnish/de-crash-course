import type { Topic } from "../types";

export const databricksSqlAndPyspark: Topic = {
  id: "databricks-sql-and-pyspark",
  glossary: ["Databricks", "PySpark", "SQL warehouse", "Window function", "UDF", "MERGE"],
  title: "Databricks engineering with SQL, PySpark, and Delta Lake",
  shortDescription: "Choosing compute, expressing transformations, and moving notebook experiments into repeatable Databricks jobs.",
  sections: [
    {
      heading: "Separate the platform from its components",
      paragraphs: [
        "Databricks combines managed compute, orchestration, SQL serving, and governance. Spark is the distributed execution engine used by many workloads, PySpark is its Python API, and Delta Lake supplies transactional table storage. A SQL warehouse serves SQL workloads; job compute executes scheduled engineering tasks. Select compute according to workload, isolation, startup latency, and cost.",
        "Use notebooks for exploration and explanations, while keeping reusable transformation logic in versioned modules or SQL files. A production job should declare its entry point, dependencies, parameters, identity, and output tables so another engineer can reproduce a run without hidden notebook state.",
      ],
    },
    {
      heading: "SQL correctness starts with grain",
      paragraphs: [
        "Define what one output row represents before writing a join or aggregation. Joining orders to multiple customer-history rows can multiply revenue even though the query completes successfully. Check key uniqueness, effective-date predicates, and unmatched rows explicitly.",
        "SQL window functions preserve row-level context while ranking or aggregating within a partition. For deduplication, use `ROW_NUMBER()` with `PARTITION BY order_id` and descending order by source_version, then ingest_sequence. The ordering needs a documented, deterministic tie-breaker. Filter to rank one before merging into a target when the contract requires one source row per key.",
        "SQL null comparisons use three-valued logic: use `IS NULL` to test for nulls. A WHERE predicate on the nullable side of a LEFT JOIN can remove unmatched rows and change the result's meaning. Include null keys and missing dimension rows in fixtures.",
      ],
    },
    {
      heading: "Keep PySpark work distributed",
      paragraphs: [
        "DataFrame operations build a lazy execution plan. Prefer built-in expressions that Spark can optimize over Python UDFs when equivalent functionality exists. Avoid collecting large datasets to the driver or converting them to pandas as an intermediate transformation step.",
        "Use `df.explain(mode=\"formatted\")` and the Spark UI to inspect scans, exchanges, join strategies, and task imbalance. SQL and the DataFrame API often produce comparable plans for equivalent expressions; compare the actual plans and measurements rather than assuming one language is faster.",
      ],
    },
    {
      heading: "Make Delta writes safe to rerun",
      paragraphs: [
        "Choose append, scoped overwrite, or MERGE from the data's semantics. MERGE requires a well-defined business key and source-version rule. Deduplicate source records and handle deletes explicitly; an upsert that ignores delete events leaves obsolete records behind.",
        "Use Databricks Jobs to declare task dependencies, retries, timeouts, and concurrency limits. Record the code revision, runtime, parameters, source range, and output table versions for each run. Keep checkpoints and environment-specific destinations explicit, and test retry behavior before relying on automatic recovery.",
      ],
      warning: "MERGE does not automatically make every pipeline idempotent. Non-deterministic source selection, incrementing target values on every match, and duplicate source keys can still produce incorrect retries.",
    },
  ],
  example: {
    title: "Choose the latest order before summing",
    description: "Incoming order versions contain one update. The output grain is one row per order, using the greatest source_version.",
    table: {
      headers: ["order_id", "source_version", "amount"],
      rows: [
        ["42", "1", "10"],
        ["42", "2", "15"],
        ["43", "1", "8"],
      ],
    },
    takeaway: "ROW_NUMBER() by order_id, ordered by source_version descending, keeps (42, 2, 15) and (43, 1, 8). The total is 23; summing all incoming versions incorrectly gives 33.",
  },
  selfTest: [
    { question: "What distinguishes Databricks, Spark, PySpark, and Delta Lake?", answer: "Databricks is the managed platform; Spark executes distributed computations; PySpark is Spark's Python API; Delta Lake provides transactional table storage." },
    { question: "A join doubles revenue without raising an error. What do you inspect first?", answer: "Check input grain and join-key cardinality, especially duplicate dimension keys or multiple effective-date matches. Compare counts and totals before and after the join." },
    { question: "Why can collect() cause a production failure?", answer: "It transfers results to the driver, whose memory and network capacity are limited. Keep large transformations distributed and collect only intentionally bounded results." },
    { question: "Why can a MERGE still be unsafe on retry?", answer: "Its matching and update rules may apply a change again, or its source may change across runs. Use deterministic inputs, source-version conditions, and explicit deduplication." },
  ],
};
