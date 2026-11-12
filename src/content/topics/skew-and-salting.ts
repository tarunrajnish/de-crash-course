import type { Topic } from "../types";

export const skewAndSalting: Topic = {
  id: "skew-and-salting",
  title: "Data skew and salting",
  shortDescription: "The most misdiagnosed Spark problem, and the fix ladder from cheapest to manual.",
  animation: "/assets/skew-and-salting.svg",
  animationCaption:
    "Phase 1: hot key store_id=1042 overloads one reduce partition, its task runs far longer than the others, blocking the stage barrier. Phase 2: salting the hot key into 1042_0/1/2 and exploding the small side across salt values levels out task durations.",
  sections: [
    {
      heading: "Reading the symptom",
      paragraphs: [
        "Skew shows up as a max task duration that is many multiples of the median on a shuffle stage. Open the Stages tab Summary Metrics and compare the Max column to the 75th percentile for both Duration and Shuffle Read Size. A 10x gap is suspicious; a 50x gap is conclusive.",
        "That pattern points to skew, the most misdiagnosed problem in Spark. The tell is that raising spark.sql.shuffle.partitions does nothing for it, because the hot key still lands in one task regardless of how many buckets exist.",
      ],
    },
    {
      heading: "What causes it",
      paragraphs: [
        "Partition assignment is hash(key) % numPartitions, which concentrates a hot key in one partition no matter how many partitions you configure.",
        "The usual suspects: null or sentinel join keys (-1, 'UNKNOWN') that collapse a huge fraction of rows onto a single key, one genuinely dominant business entity such as a flagship store or an enterprise customer, time-based keys during a backfill where one partition value covers far more history than the rest, and low-cardinality keys in general.",
      ],
    },
    {
      heading: "Diagnosing the hot key directly",
      paragraphs: [
        'df.groupBy("key").count().orderBy(desc("count")).show(20) finds the culprit directly, before you touch any join logic. Run this on the join key before assuming the fix.',
      ],
    },
    {
      heading: "Let AQE try first",
      paragraphs: [
        "AQE skew join (spark.sql.adaptive.skewJoin.enabled) splits oversized post-shuffle partitions automatically once it sees the real sizes, replicating the matching partition on the other side so the split still produces a correct join.",
        "It only handles joins, not groupBy. Try it before anything manual; it costs nothing to enable and handles the common case without code changes.",
      ],
    },
    {
      heading: "Fix ladder, cheapest first",
      paragraphs: [
        "Filter nulls before the join. This often removes the entire problem in one line, since null or sentinel keys are frequently the dominant hot key.",
        "Broadcast the small side. No redistribution means no skew by construction, because the large side is never repartitioned by key.",
        "Pre-aggregate before joining. Collapsing rows for the hot key before the shuffle removes what would have skewed in the first place.",
        "Salt, the manual fallback. It is also the only option for groupBy, since AQE skew join does not cover it.",
      ],
      table: {
        caption: "Fix ladder",
        headers: ["Fix", "Covers groupBy", "Covers joins", "Cost"],
        rows: [
          ["AQE skew join", "No", "Yes", "Free, config flag only"],
          ["Filter null/sentinel keys", "Yes", "Yes", "One line, if applicable"],
          ["Broadcast small side", "N/A", "Yes", "Memory for the broadcast copy"],
          ["Pre-aggregate before join", "N/A", "Yes", "Extra aggregation stage"],
          ["Salting", "Yes (two-pass)", "Yes", "Code complexity, side growth"],
        ],
      },
    },
    {
      heading: "Salting mechanics",
      paragraphs: [
        "The big side gets a random suffix appended to the hot key only, for example store_id becomes store_id_0, store_id_1, ... store_id_N. The small side is exploded so every salted variant of the hot key still has a matching row: each original small-side row is duplicated once per salt value.",
        "Join on the salted key, then drop the salt suffix afterward. The trade is that the small side grows by the salt factor, but only for the hot key, in exchange for that key's work now splitting across N tasks instead of one.",
        "For groupBy, salting is two-pass: aggregate by (key, salt) first, producing partial results per salt bucket, then aggregate those partials by key alone. This works for decomposable aggregates like sum, count, min, and max, but not directly for median or countDistinct, since those cannot be combined from partial results without re-examining the original rows.",
      ],
    },
    {
      heading: "Isolate-and-union as an alternative",
      paragraphs: [
        "Split the hot keys from the cold keys up front. Broadcast-join the hot subset (now small enough to broadcast once isolated), sort-merge-join the rest, then union the two results. This avoids salting's two-pass complexity when only a handful of keys are hot.",
      ],
    },
    {
      heading: "Spark UI evidence",
      paragraphs: [
        "Stages tab -> click the slow stage -> Summary Metrics. Compare the Max column to the p75 column for Duration and for Shuffle Read Size; a single task standing far above the rest on both is the signature of skew.",
      ],
    },
  ],
  videos: [
    { title: "Spark joins explained: broadcast vs shuffle join, data skew", url: "https://www.youtube.com/watch?v=Et-Ia27N2JA" },
  ],
  examplesToAttach: [
    "A Stages tab Summary Metrics screenshot showing Max vs p75 duration on a skewed stage.",
    "A groupBy().count().orderBy(desc) output identifying your own hot key.",
  ],
  selfTest: [
    {
      question: "You raise shuffle partitions from 200 to 2000 and the stage takes the same time. What does that tell you?",
      answer:
        "The stage is skewed, not under-partitioned. Hash partitioning still routes the hot key into a single task regardless of partition count, so adding buckets only spreads out the cold keys.",
    },
    {
      question: "Why doesn't AQE skew join help a groupBy?",
      answer:
        "AQE skew join works by splitting an oversized post-shuffle partition and replicating the matching partition on the other side of a join. A groupBy has no other side to replicate against, so the mechanism does not apply.",
    },
    {
      question: "You salt with 10 values and it barely improves. What are two likely reasons?",
      answer:
        "Either the hot key is so dominant that even split 10 ways each salted partition is still larger than the other tasks, or there are multiple hot keys and only one was salted, leaving the others to still concentrate.",
    },
    {
      question: "When is skew not worth fixing?",
      answer:
        "When the skewed stage is a small fraction of total job time, or when the hot key's volume is expected to shrink on its own (for example a backfill that completes), the engineering cost of salting may exceed the runtime saved.",
    },
    {
      question: "How do you salt a countDistinct?",
      answer:
        "countDistinct is not decomposable across salt buckets the way sum or count is, because a value could appear under more than one salt bucket for the same key. You need to first deduplicate by (key, value) across the salted data, then count the deduplicated rows per key, rather than combining partial distinct counts directly.",
    },
    {
      question: "Broadcast eliminates skew. Why isn't it always the answer?",
      answer:
        "Broadcast only works when one side is small enough to fit in memory on every executor. For two large tables joining on a skewed key, neither side is a broadcast candidate, so the skew has to be handled some other way.",
    },
  ],
};
