import type { Topic } from "../types";

export const rddVsDataframe: Topic = {
  id: "rdd-vs-dataframe",
  glossary: ["RDD", "DataFrame", "Catalyst", "Schema", "UDF"],
  title: "RDDs vs. DataFrames",
  shortDescription: "Two APIs over the same engine: one untyped-to-Spark and opaque, one structured and optimizable.",
  sections: [
    {
      heading: "RDD: the original abstraction",
      paragraphs: [
        "An RDD (Resilient Distributed Dataset) is a distributed collection of objects, split into partitions across the cluster. You operate on it with functional transformations like map and filter, writing arbitrary code that Spark cannot look inside.",
        "Because that code is opaque, Spark has no way to optimize it. It runs exactly the operations you wrote, in the order you wrote them.",
      ],
    },
    {
      heading: "DataFrame: structured and optimizable",
      paragraphs: [
        "A DataFrame is also a distributed collection, but with a known schema: named columns and types. Operations are expressed through a structured API (select, filter, groupBy) or SQL, rather than arbitrary functions.",
        "Because Spark can see the structure of the operations, not just opaque code, its query optimizer (Catalyst) can reorder, combine, or skip work before anything runs.",
      ],
      table: {
        caption: "RDD vs. DataFrame",
        headers: ["", "RDD", "DataFrame"],
        rows: [
          ["Schema", "None, just objects", "Named columns with types"],
          ["Optimization", "None, runs as written", "Catalyst optimizer rewrites the plan"],
          ["API style", "Functional (map, filter, reduce)", "Declarative (select, groupBy, SQL)"],
        ],
      },
    },
    {
      heading: "Interview question: when would you switch to an RDD?",
      paragraphs: [
        "Start with DataFrames or SQL. Switch to an RDD when a specific requirement needs an RDD-only interface or low-level control that the structured APIs cannot reasonably provide. Explain the requirement first, then why the RDD API fits it.",
        "Custom business logic alone is not enough reason to switch. Check built-in expressions, SQL, a UDF, pandas UDFs, or `mapInPandas` first. For example, `mapInPandas` can process an iterator of pandas batches within a partition while returning a DataFrame with an explicit schema. Custom functions can still be opaque to Catalyst and add overhead, so compare the available approaches.",
      ],
      table: {
        caption: "Choosing the API for the requirement",
        headers: ["Requirement", "Choice and reason"],
        rows: [
          ["An existing distributed library or legacy pipeline requires an RDD", "Convert at the integration boundary. Its interface expects an RDD, so a DataFrame cannot be passed directly; JVM GraphX graph construction is one example."],
          ["An algorithm needs a custom key-to-partition mapping", "A pair RDD supports `partitionBy` with a custom partition function in PySpark, or a custom `Partitioner` on the JVM. Ordinary repartitioning by columns can stay in the DataFrame API."],
          ["A custom processor requires per-partition iterators of arbitrary objects", "RDD `mapPartitions` gives the processor an iterator and allows arbitrary object output. First check whether DataFrame `mapInPandas` or `mapInArrow` can meet the requirement with schema-based batches."],
          ["Joins, filters, aggregations, or routine parsing", "Keep the work in DataFrames or SQL. These operations already have structured APIs that preserve query optimization."],
        ],
      },
    },
    {
      heading: "The tradeoff and how to switch back",
      paragraphs: [
        "In classic PySpark, `df.rdd` exposes the DataFrame as a distributed RDD of `Row` objects; it does not collect the dataset onto the driver. Perform selective filters and projections before that boundary, then apply the required RDD operations. `mapPartitions` processes an iterator within each partition; it does not create global ordering or shared state across partitions.",
        "RDDs retain distributed execution and fault recovery, but Catalyst cannot inspect and rewrite your arbitrary RDD functions. PySpark RDD processing also introduces JVM/Python serialization and Python object-processing costs. More control does not guarantee better performance; benchmark the actual workload.",
        "When the result is structured again, use `spark.createDataFrame(result_rdd, schema)` with an explicit schema and continue with DataFrame operations. Catalyst can optimize those later operations, but converting back does not make the earlier RDD functions optimizable.",
      ],
      warning: "RDD APIs, including `df.rdd`, are unavailable in Spark Connect. Check your platform's access-mode restrictions before relying on an RDD-based solution.",
    },
    {
      heading: "Why this still matters",
      paragraphs: [
        "Almost all production Spark code today is written against DataFrames (or the SQL API on top of them), specifically to get the optimizer's benefit. RDDs still exist underneath; DataFrames compile down to RDD operations at execution time.",
      ],
    },
  ],
  selfTest: [
    {
      question: "Why can Spark optimize DataFrame code but not arbitrary RDD code?",
      answer:
        "DataFrame operations are declarative and structured (select, filter, groupBy), so Spark's Catalyst optimizer can inspect and rewrite the plan before running it. RDD transformations are arbitrary functions Spark cannot see inside, so it just runs them as written.",
    },
    {
      question: "Do DataFrames replace RDDs at the execution level?",
      answer:
        "No. DataFrame operations are compiled down to RDD operations under the hood; the DataFrame API is a higher-level, optimizable layer on top of the same underlying engine.",
    },
    {
      question: "When would a developer switch from a DataFrame to an RDD, and why?",
      answer:
        "I would use an RDD for an RDD-only library or legacy interface, a required custom key-to-partition mapping, or object/iterator processing that suitable DataFrame APIs cannot support. The reason is the required interface or low-level control. I would filter and project first, keep the RDD portion small, accept the loss of Catalyst visibility and possible Python serialization overhead, then return to a DataFrame with an explicit schema when the output is structured.",
    },
    {
      question: "Does custom Python logic or partition-level processing automatically require an RDD?",
      answer:
        "No. Built-in expressions, UDFs, pandas UDFs, and `mapInPandas` may satisfy the requirement without leaving the DataFrame API. `mapInPandas` already accepts an iterator of batches within a partition. Evaluate those alternatives, their optimization limits, and measured performance before choosing an RDD; Spark Connect does not support RDD APIs.",
    },
  ],
};
