import type { Topic } from "../types";

export const narrowVsWide: Topic = {
  id: "narrow-vs-wide",
  title: "Narrow vs. wide transformations",
  shortDescription: "What causes a shuffle, and why it is the single most expensive thing Spark does.",
  animation: "/assets/narrow-vs-wide.svg",
  animationCaption:
    "Narrow path: straight-through partition mapping, no crossing. Wide path: a dashed Exchange boundary draws in, then crossing arrows route rows into hash-keyed reducers.",
  sections: [
    {
      heading: "The rule",
      paragraphs: [
        "Narrow means one input partition maps to exactly one output partition. No row ever needs to leave the partition it started in, so there is no network movement. select, filter, withColumn, union, and mapPartitions are all narrow.",
        "Wide means the output needs data from many input partitions at once. Spark cannot compute a result like that in place, so it has to redistribute rows across the cluster first. That redistribution is the shuffle.",
      ],
    },
    {
      heading: "Stage boundaries are shuffle boundaries",
      paragraphs: [
        "Spark splits a job into stages at every point where data must move between partitions. A plan with N stages has exactly N-1 shuffles between them.",
        "In the physical plan, every Exchange node is a shuffle. BroadcastExchange is the cheap variant: it copies a small side to every executor instead of redistributing the large side. Run df.explain(True) and grep the output for Exchange to see exactly where shuffles happen in a query.",
      ],
    },
    {
      heading: "Wide operations to memorize",
      paragraphs: [
        "groupBy, any join that is not a broadcast join, distinct and dropDuplicates, window functions, orderBy, and repartition all require a shuffle because each of them needs rows with a shared key or ordering to land together.",
      ],
    },
    {
      heading: "Why a shuffle costs what it costs",
      paragraphs: [
        "A shuffle is the only point in an otherwise in-memory job where Spark touches disk: each task writes its shuffle output to local disk, and the next stage's tasks read it back over the network.",
        "A shuffle is also a barrier. The next stage cannot start until the slowest map task in the current stage finishes, so one straggler task delays the entire job, not just its own partition.",
        "Finally, a shuffle amplifies skew. Partition assignment is hash(key) % numPartitions, so a single hot key lands entirely in one task no matter how many partitions you configure. More partitions spread cold keys thinner; they do nothing for a key that is already alone in its bucket.",
      ],
      warning:
        "These three costs compound: disk and network I/O, a synchronization barrier, and skew concentration all happen on the same operation.",
    },
    {
      heading: "repartition vs. coalesce",
      paragraphs: [
        "repartition shuffles the data and produces evenly sized partitions. coalesce avoids the shuffle by merging adjacent partitions, which means it can leave existing skew in place and it propagates reduced parallelism backwards through the plan.",
        "coalesce(1) on a 1 TB dataset forces the entire upstream chain onto a single task, since every stage feeding that final coalesce now has nowhere to parallelize into.",
      ],
      table: {
        caption: "repartition vs. coalesce",
        headers: ["", "repartition", "coalesce"],
        rows: [
          ["Shuffles data", "Yes", "No"],
          ["Partition sizes", "Even", "Uneven, inherits upstream skew"],
          ["Can increase partition count", "Yes", "No, only decreases"],
          ["Affects upstream parallelism", "No", "Yes, can collapse it"],
        ],
      },
    },
    {
      heading: "Spark UI evidence",
      paragraphs: [
        "Stages tab: count the stages and look for the Exchange nodes in the SQL / DAG view, one per shuffle. Shuffle Read Size and Shuffle Write Size columns show how much data actually crossed the network. Task duration distribution within a stage (the Summary Metrics table) is the fastest way to spot a shuffle that is also skewed.",
      ],
    },
  ],
  videos: [
    { title: "Spark joins explained: broadcast vs shuffle join, data skew", url: "https://www.youtube.com/watch?v=Et-Ia27N2JA" },
  ],
  examplesToAttach: [
    "A df.explain(True) output from one of your own jobs with an Exchange node highlighted.",
    "A Stages tab screenshot from a job where coalesce(1) collapsed upstream parallelism.",
  ],
  selfTest: [
    {
      question: "You raise spark.sql.shuffle.partitions from 200 to 2000 and a stage's runtime doesn't change. What does that suggest?",
      answer:
        "The stage is likely skewed rather than under-partitioned. More partitions spread cold keys thinner, but a hot key still lands entirely in one task regardless of the partition count, so the slowest task's duration is unchanged.",
    },
    {
      question: "Why does coalesce(1) hurt performance even before any action that follows it?",
      answer:
        "coalesce avoids a shuffle by merging partitions in place, which propagates backwards through the plan: every upstream stage that feeds the coalesce loses parallelism because its output now has to collapse onto a single task.",
    },
    {
      question: "Is orderBy narrow or wide? Why?",
      answer:
        "Wide. A global order requires rows to be compared against rows that may live in any other partition, so Spark must range-partition the data via a shuffle before each partition can be sorted locally.",
    },
    {
      question: "A stage has one Exchange node feeding it. How many shuffles occurred to produce its input?",
      answer: "One. Each Exchange node in the plan corresponds to exactly one shuffle boundary.",
    },
    {
      question: "Name two operations that look wide but are actually narrow under the right conditions.",
      answer:
        "A join is narrow when the small side is broadcast instead of shuffled. coalesce, which looks like repartition, is narrow because it only merges adjacent partitions without moving data across the network.",
    },
    {
      question: "Why is BroadcastExchange not considered a \"real\" shuffle in the cost sense?",
      answer:
        "It copies one small side to every executor once; the large side is never redistributed, so there is no per-key network shuffle, no barrier on the large side's partitions, and no skew amplification from hashing a key.",
    },
  ],
};
