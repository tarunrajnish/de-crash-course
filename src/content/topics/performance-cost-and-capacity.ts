import type { Topic } from "../types";

export const performanceCostAndCapacity: Topic = {
  id: "performance-cost-and-capacity",
  glossary: ["Throughput", "Latency", "Physical plan", "Skew", "Spill"],
  title: "Performance, scalability, and cost trade-offs",
  shortDescription: "Finding the bottleneck, measuring cost per useful output, and choosing capacity against a service target.",
  sections: [
    {
      heading: "Set a measurable target before tuning",
      paragraphs: [
        "Define the required freshness, completion deadline, peak input rate, and recovery window. Track cost per successful output, such as a reconciled daily partition or a million accepted events, including retries, idle compute, storage, and data transfer.",
        "Benchmark representative data with comparable cache state, runtime, concurrency, and input skew. Record output correctness alongside runtime. A faster query that silently drops unmatched records fails the workload's requirements.",
      ],
    },
    {
      heading: "Diagnose before changing cluster size",
      paragraphs: [
        "Use query plans, Spark stage metrics, and infrastructure telemetry to separate scan volume, shuffle, skew, spill, driver pressure, source throttling, and queue delay. Large scanned bytes suggest projection and pruning work; a few long-running tasks suggest skew; queued jobs may indicate scheduling or concurrency pressure.",
        "Reduce unnecessary work first: read required columns, filter early where semantics permit, fix accidental many-to-many joins, and improve file layout for actual predicates. Then measure whether more compute reduces the remaining bottleneck. A source-limited extraction will not speed up simply because more workers are available.",
      ],
    },
    {
      heading: "Trade latency against steady-state cost",
      paragraphs: [
        "An always-running stream can meet tight freshness targets while paying for idle periods. Incremental scheduled jobs may satisfy a looser target at lower cost, but incur startup overhead and bursty source load. Include recovery after an outage in the comparison: normal throughput alone does not establish sufficient capacity.",
        "Choose interactive, job, SQL-serving, or serverless compute according to workload and the platform's available options. Evaluate autoscaling bounds, auto-termination, runtime compatibility, and interruption tolerance. Monitor actual utilization and spend by workload owner rather than assuming autoscaling automatically minimizes cost.",
      ],
      table: {
        headers: ["Change", "Potential benefit", "Cost or risk to measure"],
        rows: [
          ["More workers", "Higher parallel throughput", "Extra spend; little gain for skew or external bottlenecks"],
          ["Cache reused data", "Avoid repeated reads and computation", "Memory pressure, eviction, and stale assumptions"],
          ["Compact or cluster files", "Better scans and fewer small-file operations", "Rewrite cost and maintenance contention"],
          ["Longer trigger interval", "Less scheduling and startup overhead", "Higher freshness latency and larger recovery batches"],
        ],
      },
      warning: "A lower hourly rate can produce a higher total cost when a workload runs longer or retries more often. Compare complete successful runs at the required service level.",
    },
  ],
  example: {
    title: "Reduce scanned work before buying more workers",
    description: "Illustrative measurements for the same source dataset and reconciled output. Baseline compute costs $0.20 per minute; doubling workers doubles that rate.",
    table: {
      headers: ["Plan", "Scanned", "Runtime", "Run cost"],
      rows: [
        ["Baseline", "100 GB", "30 min", "$6.00"],
        ["Read required columns and prune", "20 GB", "10 min", "$2.00"],
        ["Only double workers", "100 GB", "18 min", "$7.20"],
      ],
    },
    takeaway: "The pruned plan meets a 15-minute deadline at lower cost. More workers improve this baseline's runtime but still miss that deadline and cost more.",
  },
  selfTest: [
    { question: "Why can adding workers fail to speed up a job?", answer: "The bottleneck may be one skewed task, the driver, an external source, or queue policy. More parallel capacity only helps work that can use it." },
    { question: "What makes a performance comparison meaningful?", answer: "Comparable inputs, correctness, runtime and cache conditions, concurrency, and measured total cost against the same freshness or completion target." },
    { question: "Why must recovery throughput exceed normal arrival rate?", answer: "If processing only matches new arrivals, an outage backlog never drains. Reserve enough headroom to catch up within the recovery target." },
  ],
};
