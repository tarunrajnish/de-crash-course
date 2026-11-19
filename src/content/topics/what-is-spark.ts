import type { Topic } from "../types";

export const whatIsSpark: Topic = {
  id: "what-is-spark",
  glossary: ["Spark", "Hadoop MapReduce", "Driver", "Executor", "Partition"],
  title: "What is Spark, and why does it exist",
  shortDescription: "A distributed engine for processing data too large for one machine, and the problem it replaced.",
  sections: [
    {
      heading: "The problem before Spark",
      paragraphs: [
        "A single machine has a ceiling on CPU, memory, and disk I/O. Once a dataset outgrows that ceiling, processing it on one machine either fails outright or takes too long to be useful.",
        "Hadoop MapReduce solved this by splitting work across many machines, but it wrote intermediate results to disk between every step. That made it reliable but slow for anything with multiple processing stages.",
      ],
    },
    {
      heading: "What Spark does differently",
      paragraphs: [
        "Spark distributes the same way: it splits data into partitions and runs the same computation on each partition, in parallel, across a cluster of machines.",
        "The difference is that Spark keeps intermediate data in memory across steps whenever possible, only spilling to disk when memory runs out. That's the main reason it is faster than plain MapReduce for multi-step pipelines.",
      ],
    },
    {
      heading: "The driver and the executors",
      paragraphs: [
        "A Spark application has one driver process, which plans the work and tracks its progress, and many executor processes, which actually run the computation on their slice of the data.",
        "You write code against the driver's API. Spark turns that code into a plan, splits the plan into tasks, and sends those tasks to executors to run against their partitions.",
      ],
    },
  ],
  selfTest: [
    {
      question: "What is the main reason Spark is typically faster than plain MapReduce?",
      answer:
        "Spark keeps intermediate results in memory across processing steps instead of writing them to disk after every step, only spilling to disk when memory is insufficient.",
    },
    {
      question: "What are the two kinds of processes in a running Spark application?",
      answer:
        "A single driver, which plans the work and tracks progress, and many executors, which run the actual computation against their partition of the data.",
    },
  ],
};
