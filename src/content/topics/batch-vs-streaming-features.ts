import type { Topic } from "../types";

export const batchVsStreamingFeatures: Topic = {
  id: "batch-vs-streaming-features",
  title: "Batch vs. streaming features",
  shortDescription: "Nightly aggregates vs. features computed as events arrive, and why most production feature sets use both.",
  sections: [
    {
      heading: "Batch-computed features",
      paragraphs: [
        "A batch feature is computed on a schedule, typically a nightly job that scans a day's (or more) worth of history and writes out an aggregate per entity: total orders in the last 30 days, average order value last quarter, days since account creation.",
        "The appeal is simplicity and cost. A nightly Spark job over a day's partition is cheap to run, easy to backfill (just rerun it over historical partitions), and easy to reason about, because the output is deterministic given the same input data. The cost is staleness: the feature value is up to 24 hours old at the moment it's served, because the job only ran once overnight.",
      ],
    },
    {
      heading: "Streaming / real-time features",
      paragraphs: [
        "A streaming feature is computed as events arrive, usually by a stream processor maintaining rolling state: items added to cart in the last 10 minutes, clicks in the current session, requests per second for fraud scoring. The feature value updates continuously instead of once a day.",
        "This is necessary wherever the signal that matters decays within minutes rather than days. A fraud model that only knows yesterday's transaction count for an account is useless against an attack happening right now; a recommendation model that only knows what a user bought last month misses what they're actively browsing this session.",
        "The cost is operational complexity: you now run a stateful streaming job (Flink, Spark Structured Streaming, or similar) that must handle late-arriving events, out-of-order delivery, and window eviction, and that state has to be checkpointed so a job restart doesn't silently reset rolling counters to zero.",
      ],
    },
    {
      heading: "Latency, freshness, and cost are a trade-off, not a free choice",
      paragraphs: [
        "Freshness is what streaming buys you: a feature value that reflects events from seconds ago instead of hours ago. Latency is what you pay at serving time: a streaming pipeline that maintains pre-aggregated state in a low-latency store can still answer in milliseconds, but if the online store requires scanning raw events on demand, serving latency explodes.",
        "Cost scales differently for each. A nightly batch job costs roughly a fixed amount per day regardless of event volume spikes. A streaming job runs continuously and its infrastructure cost scales with sustained event throughput, including idle hours, which is why teams default to batch unless a specific feature genuinely needs sub-hour freshness.",
      ],
      table: {
        caption: "Batch vs. streaming features",
        headers: ["Dimension", "Batch", "Streaming"],
        rows: [
          ["Freshness", "Hours to a day stale", "Seconds to minutes stale"],
          ["Infra cost pattern", "Fixed cost per scheduled run", "Continuous cost, scales with event volume"],
          ["Failure mode", "Late/missing nightly run delays all features for a day", "Stuck or lagging consumer silently serves stale rolling state"],
          ["Operational complexity", "Low: rerun a job over a partition", "Higher: watermarks, late data, checkpointed state"],
        ],
      },
    },
    {
      heading: "Why most production feature sets are hybrid",
      paragraphs: [
        "A typical fraud or recommendation model mixes both: long-horizon behavioral features (lifetime spend, account age, 90-day category affinity) computed in batch because they change slowly and don't need minute-level freshness, alongside short-horizon features (last-5-minutes velocity, current session activity) computed in streaming because they capture exactly the signal batch can't.",
        "Maintaining both means the feature definitions have to agree on semantics even when their computation paths differ: a `30d_order_count` computed nightly and a `10m_order_count` computed by a stream processor must both be registered the same way in the feature store so training and serving code can request them uniformly, without the model-serving layer needing to know which pipeline produced which value.",
      ],
      warning:
        "A streaming feature pipeline with a consumer that silently falls behind (for example, a Flink job backlogged by a Kafka partition skew) doesn't fail loudly. It keeps serving values, just increasingly stale ones, which can degrade a fraud model's recall for hours before anyone notices the consumer lag metric.",
    },
  ],
  videos: [{ title: "Streaming vs. Batch Processing", url: "https://www.youtube.com/watch?v=fw8pb4H1TB4" }],
  examplesToAttach: [
    "A consumer-lag dashboard for a streaming feature pipeline, showing the gap between event time and processing time.",
    "A feature definition spec showing both a batch and a streaming materialization registered under the same logical feature name.",
  ],
  selfTest: [
    {
      question: "Why would a team choose a batch job over a streaming job for a feature, given that streaming is always 'fresher'?",
      answer:
        "Cost and operational complexity. A scheduled batch job is cheap, deterministic, and easy to backfill, while a streaming job runs continuously, requires handling late/out-of-order events and checkpointed state, and costs more even during idle periods. Batch is the right default unless the feature genuinely needs sub-hour freshness.",
    },
    {
      question: "What is the typical silent failure mode of a streaming feature pipeline, and why is it dangerous?",
      answer:
        "A consumer falling behind its input (consumer lag), which doesn't cause errors; it keeps serving values, just increasingly stale ones. It's dangerous because nothing crashes, so a model can degrade for hours before anyone checks the lag metric, unlike a batch job failure which is usually visible immediately as a missing partition.",
    },
    {
      question: "Give an example of a feature that must be streaming, not batch, and explain why.",
      answer:
        "A fraud-detection velocity feature such as transactions-in-the-last-10-minutes. Fraud attacks play out in minutes; a value that's a day stale from a nightly batch job would miss the attack entirely by the time it updates.",
    },
    {
      question: "Why do most production feature sets end up hybrid rather than all-batch or all-streaming?",
      answer:
        "Different features decay at different rates. Long-horizon behavioral signals (lifetime spend, account age) don't need minute-level freshness and are cheaper in batch; short-horizon signals (session activity, velocity) only have predictive value if updated within minutes, which requires streaming. Using one approach for everything either wastes money or misses fast-moving signal.",
    },
    {
      question: "How does registering both a batch and streaming materialization under the same feature name help the serving layer?",
      answer:
        "It lets model-serving code request a feature by logical name without needing to know whether it comes from a nightly job or a stream processor, as long as both materializations are kept semantically consistent (same aggregation window definition, same entity key).",
    },
  ],
};
