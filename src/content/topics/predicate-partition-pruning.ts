import type { Topic } from "../types";

export const predicatePartitionPruning: Topic = {
  id: "predicate-partition-pruning",
  glossary: ["Predicate pushdown", "Partition pruning", "Row group"],
  title: "Predicate pushdown vs. partition pruning",
  shortDescription: "Two different skipping mechanisms, both defeated by the same mistake.",
  sections: [
    {
      heading: "Two different mechanisms",
      paragraphs: [
        "Partition pruning skips whole directories. It only applies to the column a table is physically partitioned by, and it works because the partition value is encoded in the directory path itself, so Spark never has to open a file in a directory that cannot match.",
        "Predicate pushdown skips row groups inside Parquet files. It works on any column, partitioned or not, using min and max statistics stored per row group. If a filter value falls outside a row group's min/max range, that row group is skipped without being read.",
      ],
      table: {
        caption: "Pruning vs. pushdown",
        headers: ["", "Partition pruning", "Predicate pushdown"],
        rows: [
          ["Granularity", "Whole directory", "Row group inside a file"],
          ["Applies to", "Partition columns only", "Any column with stored stats"],
          ["Mechanism", "Directory path matches filter value", "Min/max stats exclude the filter value"],
          ["Defeated by", "Wrapping the column in a function", "Wrapping the column in a function"],
        ],
      },
    },
    {
      heading: "The common trap",
      paragraphs: [
        "Both mechanisms require the filter to reference the stored column directly. where date(ts) = '2026-01-01' wraps ts in a function, so Spark would have to evaluate that function against every row (or every row group's stats) to know what qualifies, which neither pruning nor pushdown is built to do.",
        "where dt = '2026-01-01', filtering on a column that is actually stored (as a partition column or as a plain column with stats), gets both optimizations for free.",
      ],
      warning: "A filter that looks equivalent to a human reader can be invisible to the planner if it's wrapped in a function.",
    },
    {
      heading: "Spark UI evidence",
      paragraphs: [
        "The SQL tab's scan node reports \"number of partitions read\" and \"number of files read\" against the table's total. A query that should only touch one day's partition but reports reading all partitions has lost pruning, usually to a function-wrapped filter.",
      ],
    },
  ],
  example: {
    title: "Two filters eliminate different scan work",
    description: "Query: date = 2026-11-02 AND amount > 100. Each listed file contains one row group for this small example.",
    table: {
      headers: ["File partition", "Row-group amount range", "Scan decision"],
      rows: [
        ["2026-11-01 / A", "20-200", "Skip by partition date"],
        ["2026-11-02 / B", "10-80", "Skip by Parquet statistics"],
        ["2026-11-02 / C", "90-150", "Read candidate data and apply the row filter"],
      ],
    },
    takeaway: "Partition pruning removes A before reading its data. Predicate pushdown can avoid B's row group; C still needs row-level filtering.",
  },
  selfTest: [
    {
      question: "Why does where date(ts) = '2026-01-01' defeat partition pruning even when ts is the partition column?",
      answer:
        "Pruning matches the raw stored partition value against the filter. Wrapping ts in date() means Spark would need to evaluate that function per directory before it could decide whether to skip it, which pruning does not do; it falls back to scanning every partition.",
    },
    {
      question: "Can predicate pushdown help on a column that isn't a partition column?",
      answer:
        "Yes. Pushdown works on any column with stored min/max statistics at the row-group level, regardless of whether the table is partitioned by it.",
    },
    {
      question: "A table is partitioned by dt. A query filters where dt = '2026-01-01'. What's skipped, directories or row groups?",
      answer: "Directories. This is a direct partition-column match, so partition pruning applies and whole directories outside that value are skipped without being opened.",
    },
  ],
};
