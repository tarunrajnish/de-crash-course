import type { Topic } from "../types";

export const rddVsDataframe: Topic = {
  id: "rdd-vs-dataframe",
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
  ],
};
