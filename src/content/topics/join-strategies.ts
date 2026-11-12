import type { Topic } from "../types";

export const joinStrategies: Topic = {
  id: "join-strategies",
  title: "Broadcast, sort-merge, and shuffle-hash joins",
  shortDescription: "How Spark picks a join strategy, and the one production failure every team eventually hits.",
  animation: "/assets/join-strategies.svg",
  animationCaption:
    "Three panels: broadcast hash join replicating the small table, sort-merge join shuffling and zipper-merging both sorted sides, shuffle hash join building an in-memory hash table on one shuffled side.",
  sections: [
    {
      heading: "Broadcast hash join",
      paragraphs: [
        "The small side is collected to the driver and shipped to every executor. Each executor builds a local hash table from it, so the big side never needs a shuffle at all.",
        "The default auto-broadcast threshold is 10 MB (spark.sql.autoBroadcastJoinThreshold), though a practical ceiling in production is a few hundred MB before driver and executor memory pressure becomes a real risk.",
      ],
    },
    {
      heading: "Sort-merge join",
      paragraphs: [
        "This is the default strategy when both sides are large. Both sides are shuffled by the join key, each resulting partition is sorted, and then the two sorted partitions are merged like a zipper.",
        "It costs two shuffles plus two sorts, but it streams through the data: it never needs to hold an entire side in memory, which is why it is the safe default for large-to-large joins.",
      ],
    },
    {
      heading: "Shuffle hash join",
      paragraphs: [
        "Both sides are shuffled, but instead of sorting, one side is built into an in-memory hash table. This skips the sort step entirely and beats sort-merge when one side comfortably fits in executor memory.",
        "Spark only picks this strategy when it believes its own size estimate for that side, and it OOMs when that estimate is wrong, because there is no fallback to spilling mid-join.",
      ],
    },
    {
      heading: "How Spark chooses",
      paragraphs: [
        "Broadcast first, if a side is under the threshold and the join type allows it. Otherwise shuffle hash, if spark.sql.join.preferSortMergeJoin is off and a side is estimated to fit in memory. Otherwise sort-merge, the default fallback.",
        "Adaptive Query Execution (AQE) can switch a join to broadcast at runtime once it observes the real post-shuffle partition sizes, which beats any static size estimate made before the query ran.",
      ],
      table: {
        caption: "Join strategy selection",
        headers: ["Strategy", "Trigger", "Shuffles the large side", "Risk"],
        rows: [
          ["Broadcast hash", "Small side under threshold, join type allows it", "No", "Driver / executor OOM if estimate is wrong"],
          ["Shuffle hash", "preferSortMergeJoin off, a side estimated to fit in memory", "Yes", "OOM if the size estimate is wrong"],
          ["Sort-merge", "Default when neither of the above applies", "Yes", "Slower, but spills to disk gracefully"],
        ],
      },
    },
    {
      heading: "Join type limits which side can broadcast",
      paragraphs: [
        "Left outer can only broadcast the right side. Right outer can only broadcast the left side. Full outer cannot broadcast either side.",
        "The side that must be preserved in the output, meaning its unmatched rows still have to appear, has to stay partitioned across the cluster. If it were broadcast instead, each executor would independently emit its own copy of the unmatched rows, duplicating them once per executor.",
      ],
    },
    {
      heading: "The production failure to know cold",
      paragraphs: [
        "A broadcast() hint on a table that is 4 MB in dev and 900 MB in prod. In dev it works fine. In prod it causes a driver OOM during the collect step, or an OOM on every executor that tries to hold its own copy.",
        "Raising spark.sql.autoBroadcastJoinThreshold globally to make one join broadcast turns a local win into an intermittent, data-dependent failure elsewhere in the same application, because it now applies to every eligible join, not just the one you tuned it for.",
      ],
      warning: "A hardcoded broadcast() hint does not get safer just because it worked once in dev.",
    },
    {
      heading: "Why sort-merge is the default",
      paragraphs: [
        "Sort-merge spills to disk gracefully when data does not fit in memory. Shuffle hash OOMs outright when its size estimate for the build side is wrong. Spark defaults to the strategy that survives a bad guess rather than the one that is fastest when the guess is right.",
      ],
    },
    {
      heading: "Duplicate keys and row explosion",
      paragraphs: [
        "If a join produces more output rows than either input, duplicate keys exist on both sides, producing a per-key cross product. The usual culprit is a non-unique dimension table, for example an SCD2 table joined without an effective-date filter, or a partial join key that does not uniquely identify a row on one side.",
      ],
    },
  ],
  videos: [
    { title: "Spark joins explained: broadcast vs shuffle join, data skew", url: "https://www.youtube.com/watch?v=Et-Ia27N2JA" },
  ],
  examplesToAttach: [
    "A query plan where AQE upgraded a sort-merge join to broadcast at runtime.",
    "An incident writeup from a broadcast() hint that worked in dev and OOM'd in prod.",
  ],
  selfTest: [
    {
      question: "Why can't a left outer join broadcast the left side?",
      answer:
        "The left side must preserve every row, including unmatched ones, in the output. If it were broadcast, each executor would independently emit the unmatched rows from its own copy, producing duplicates instead of one row per unmatched key.",
    },
    {
      question: "A broadcast join works in dev (4 MB table) and OOMs in prod. What changed?",
      answer:
        "The table's real size in prod is far larger (for example 900 MB) than in dev, so collecting it to the driver and copying it to every executor now exceeds available memory, even though the join logic is identical.",
    },
    {
      question: "Two 500 GB tables join on store_id. Which strategy, and what's the first concern?",
      answer:
        "Sort-merge join, since neither side can be broadcast. The first concern is skew on store_id: a dominant store concentrates one post-shuffle partition and slows the whole stage.",
    },
    {
      question: "How do you confirm in the Spark UI that a join actually broadcast?",
      answer:
        "Open the SQL / DAG view for the query and look for a BroadcastHashJoin node fed by a BroadcastExchange, rather than a SortMergeJoin fed by two Exchange nodes.",
    },
    {
      question: "Why does preferSortMergeJoin default to true?",
      answer:
        "Sort-merge join spills to disk when memory runs out, while shuffle hash join OOMs if its build-side size estimate is wrong. Defaulting to the strategy that degrades gracefully is safer across unpredictable data sizes.",
    },
    {
      question: "A join produces more output rows than either input. What's the most likely cause?",
      answer:
        "Duplicate keys on one or both sides, producing a per-key cross product. Common cause: joining to a non-unique dimension, such as an SCD2 table without an effective-date filter.",
    },
  ],
};
