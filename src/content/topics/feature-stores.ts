import type { Topic } from "../types";

export const featureStores: Topic = {
  id: "feature-stores",
  title: "Feature stores and point-in-time correctness",
  shortDescription: "A system that serves the same feature definitions to training and inference, and the leakage bug it exists to prevent.",
  sections: [
    {
      heading: "Why feature definitions need a home",
      paragraphs: [
        "Before feature stores, a data scientist would compute a feature in a training notebook, usually with a Spark or pandas job that scans historical data. Someone else would then have to reimplement that same logic in an online service to serve it at inference time, often in a different language with a different aggregation window.",
        "The two implementations drift. A `user_purchase_count_7d` computed one way in a batch notebook and another way in a Java service will disagree on some fraction of rows, and the model sees different inputs in production than it saw during training. A feature store's core job is to make that impossible by registering one definition and computing it the same way for both paths.",
      ],
    },
    {
      heading: "The offline and online split",
      paragraphs: [
        "The offline store holds historical feature values at scale, usually backed by a data warehouse or lakehouse table, and is used to build training datasets by joining features to historical labels. It is optimized for throughput over large time ranges, not for single-row latency.",
        "The online store holds only the current value of each feature per entity (a user, a product, a store), backed by a low-latency key-value system such as Redis or DynamoDB. A model serving a prediction in 20 ms cannot afford to scan a warehouse table; it does a point lookup by entity key instead.",
        "Both stores are populated from the same feature definition, usually compiled from one pipeline specification into two materialization jobs: a batch job that backfills the offline store and a streaming or batch job that keeps the online store current.",
      ],
    },
    {
      heading: "Point-in-time correctness",
      paragraphs: [
        "When you build a training set, you join features to labels using the label's timestamp, not the current time. For a label observed on March 1st, the feature value joined in must be the value that was knowable as of March 1st, computed only from data available up to that point.",
        "Getting this wrong is called label leakage: if the join instead pulls today's feature value (which may have been updated by events that happened after March 1st, including events caused by the labeled outcome itself), the model trains on information it will never have at actual inference time. It looks like a strong model offline and performs far worse in production, because the signal it learned to rely on does not exist yet when a real prediction is made.",
        "Feature stores implement this with time-travel joins: the offline store keeps a history of feature values with their valid-from timestamps, and the training-set builder asks for \"the value of this feature as of this row's label timestamp\" rather than \"the current value.\"",
      ],
      warning:
        "A training pipeline that joins features by entity key alone, with no as-of timestamp, will silently leak future information into every row. The model's offline AUC can look excellent and still collapse in production, because the leaked feature simply doesn't exist at prediction time.",
    },
    {
      heading: "What this buys you operationally",
      paragraphs: [
        "A registered feature becomes reusable across models: a `days_since_last_order` feature built for a churn model can be reused as-is by a recommendation model, instead of a second team reimplementing the same aggregation with subtly different edge-case handling.",
        "It also gives you a single place to monitor feature drift and freshness. If the online value for a feature stops updating because an upstream job failed, that is one alert on one system, rather than a silent staleness bug discovered weeks later when model accuracy quietly degrades.",
      ],
    },
  ],
  examplesToAttach: [
    "A training-serving skew report comparing offline vs. online values for the same feature and entity at the same timestamp.",
    "A time-travel join query from your feature store showing the as-of timestamp logic used to build a training set.",
  ],
  selfTest: [
    {
      question: "What problem does a feature store solve that two separately-written implementations of the same feature do not?",
      answer:
        "Training-serving skew: when the batch logic used for training and the low-latency logic used for online inference are written independently, they tend to drift and disagree, so the model sees different inputs at serving time than it saw during training. A feature store registers one definition and computes it the same way for both paths.",
    },
    {
      question: "Why does the online store hold only current values while the offline store holds history?",
      answer:
        "The online store exists to serve single-entity lookups at low latency for live inference, so it only needs the latest value per entity. The offline store exists to build training datasets across historical time ranges, which requires keeping a history of values, not just the latest one.",
    },
    {
      question: "What is point-in-time correctness, and what failure mode does it prevent?",
      answer:
        "It means a feature value joined into a training row reflects only data available as of that row's label timestamp, not the current value. It prevents label leakage, where a model trains on future information (sometimes information caused by the very outcome being predicted) that will not exist at real inference time.",
    },
    {
      question: "A model has excellent offline AUC but performs much worse in production. The team suspects leakage. Where would you look first?",
      answer:
        "The training-set join logic: check whether features were joined by entity key alone versus an as-of timestamp matching each label's observation time. A missing as-of join is the most common source of this exact symptom.",
    },
    {
      question: "Why is a feature store's materialization job usually split into two outputs instead of one?",
      answer:
        "Because the offline and online stores have different access patterns: the offline store needs large time-range scans for training-set construction, and the online store needs single-key point lookups under tight latency budgets. One feature definition is compiled into both an offline backfill job and an online (streaming or batch) upsert job.",
    },
  ],
};
