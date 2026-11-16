import type { Topic } from "../types";

export const columnarVsRowStorage: Topic = {
  id: "columnar-vs-row-storage",
  title: "Columnar vs. row-oriented storage",
  shortDescription: "The physical layout decision underneath every OLTP/OLAP trade-off, made concrete.",
  sections: [
    {
      heading: "Row-oriented: good for whole-record access",
      paragraphs: [
        "A row-oriented format stores all of a record's columns next to each other on disk. Fetching or updating one whole row, the common OLTP pattern, means reading one contiguous block, which is fast.",
        "But answering an analytical question that touches only 2 columns out of 50 still means reading every column of every row that qualifies, since the layout doesn't let you skip the other 48 columns on disk.",
      ],
    },
    {
      heading: "Column-oriented: good for scanning a few columns across many rows",
      paragraphs: [
        "A column-oriented format (like Parquet) stores each column's values contiguously, separately from the other columns. An analytical query that only needs 2 of 50 columns reads only those 2 columns' data, skipping the rest entirely.",
        "This is the physical reason columnar formats dominate analytical workloads: I/O scales with the number of columns actually used, not the width of the whole table.",
      ],
      table: {
        caption: "Row vs. columnar storage",
        headers: ["", "Row-oriented", "Column-oriented"],
        rows: [
          ["Fast at", "Reading/writing one whole record", "Scanning a few columns across many rows"],
          ["I/O for a 2-of-50-column query", "Reads all 50 columns per row", "Reads only the 2 needed columns"],
          ["Compression", "Weaker (mixed types adjacent)", "Stronger (same type and often repetitive values adjacent)"],
          ["Typical use", "OLTP databases", "OLAP, data warehouses, Parquet/Delta"],
        ],
      },
    },
    {
      heading: "Why columnar also compresses better",
      paragraphs: [
        "Storing a column's values together means adjacent values are often similar or repeated (a status column with only a few distinct values, a date column that's mostly sequential), which compression algorithms exploit far better than when dissimilar column types sit next to each other in a row.",
        "This is part of why predicate pushdown works the way it does on formats like Parquet: per-column statistics (like min/max) are cheap to maintain and check exactly because each column already lives in its own contiguous, often sorted-ish block.",
      ],
    },
  ],
  selfTest: [
    {
      question: "Why is a columnar format faster for a query that only needs 2 out of 50 columns?",
      answer:
        "Because each column is stored contiguously and separately, the engine can read just the 2 needed columns' data from disk, skipping the other 48 entirely, unlike a row-oriented layout where every column of a qualifying row is stored together.",
    },
    {
      question: "Why does columnar storage typically compress better than row-oriented storage?",
      answer:
        "Adjacent values within one column tend to be similar or repetitive (same type, often a narrow range of distinct values), which compresses more effectively than a row's mix of different column types stored next to each other.",
    },
  ],
};
