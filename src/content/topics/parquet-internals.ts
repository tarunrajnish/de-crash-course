import type { Topic } from "../types";

export const parquetInternals: Topic = {
  id: "parquet-internals",
  glossary: ["Row group", "Column chunk", "Page", "Footer", "Predicate pushdown"],
  title: "Parquet internals: row groups, column chunks, and pages",
  shortDescription: "The physical layout that makes columnar storage fast, and the statistics that let engines skip files entirely.",
  sections: [
    {
      heading: "The physical layout",
      paragraphs: [
        "A Parquet file is split horizontally into row groups, typically 128 MB to 1 GB each. Within a row group, data is stored column by column rather than row by row: every value for a given column sits contiguously as a column chunk.",
        "Each column chunk is further split into pages, usually a few KB to a few MB, which are the unit of compression and encoding. A footer at the end of the file holds the schema and, critically, per-row-group and per-column metadata, so a reader can plan what to read before touching any data pages.",
      ],
    },
    {
      heading: "Why columnar layout helps",
      paragraphs: [
        "Storing a column contiguously means a query that only needs three of forty columns reads only those three column chunks, not the whole row. This is the opposite of row-oriented formats (CSV, Avro), where every column for a row lives next to every other column, forcing a full scan even for a narrow projection.",
        "Columnar layout also compresses far better, because adjacent values in the same column tend to be similar (a timestamp column, a country-code column) while adjacent values across a row typically are not. Combined with encodings like dictionary and run-length encoding, this is why Parquet files are routinely 5 to 10 times smaller than the equivalent CSV.",
      ],
    },
    {
      heading: "Row group statistics and file skipping",
      paragraphs: [
        "The footer stores, per row group and per column, the min value, max value, and null count. A query engine reads only the footer first, compares the filter predicate against these statistics, and skips any row group whose min/max range cannot possibly satisfy the predicate, without decompressing a single page.",
        "This is predicate pushdown at the file level: a filter like `WHERE event_date = '2026-03-01'` can skip every row group whose stored max event_date is earlier than that date, turning a full file scan into a handful of row group reads.",
      ],
      table: {
        caption: "What lives where",
        headers: ["Unit", "Typical size", "Purpose"],
        rows: [
          ["Row group", "128 MB – 1 GB", "Horizontal partition; unit of parallel read and the min/max statistics"],
          ["Column chunk", "Varies", "One column's data within one row group, stored contiguously"],
          ["Page", "KB – few MB", "Unit of compression and encoding within a column chunk"],
          ["Footer", "Small, end of file", "Schema plus per-row-group, per-column statistics (min, max, null count)"],
        ],
      },
    },
    {
      heading: "Where this goes wrong in practice",
      paragraphs: [
        "Statistics only help if the data is actually sorted or clustered on the filtered column within each row group. If rows for every date are scattered evenly across all row groups (an unsorted, append-only write pattern), every row group's min/max range spans the entire table and nothing gets skipped, even though the statistics are technically present and correct.",
        "A wide row group with many columns also means that even a narrow projection still pays the cost of decompressing whichever pages were touched to resolve the predicate, since row group statistics operate at row-group granularity, not at the row level.",
      ],
      warning:
        "Row group statistics only eliminate a row group if the data is physically sorted or clustered on that column. An unsorted write pattern silently defeats file skipping even though the min/max values are still written correctly.",
    },
  ],
  example: {
    title: "Skip row groups using their date ranges",
    description: "Filter: event_date = 2026-02-14. The reader first checks stored min/max statistics for each row group.",
    table: {
      headers: ["Row group", "Minimum date", "Maximum date", "Read?"],
      rows: [
        ["RG1", "2026-01-01", "2026-01-31", "Skip"],
        ["RG2", "2026-02-01", "2026-02-28", "Read candidate pages"],
        ["RG3", "2026-03-01", "2026-03-31", "Skip"],
      ],
    },
    takeaway: "Only RG2 can contain the requested date. Its statistics do not prove every row matches, so the reader must still apply the filter to candidate data.",
  },
  selfTest: [
    {
      question: "What are the three levels of physical structure inside a Parquet file, from largest to smallest?",
      answer:
        "Row groups (horizontal partitions), column chunks (one column's data within a row group), and pages (the unit of compression and encoding within a column chunk).",
    },
    {
      question: "Why does a narrow column projection read less data from Parquet than from CSV?",
      answer:
        "Parquet stores each column contiguously as its own column chunk, so reading three of forty columns only touches those three chunks. CSV is row-oriented, so every column for a row is interleaved and a full row scan is required regardless of projection.",
    },
    {
      question: "What statistics does the Parquet footer store per row group and per column, and what are they used for?",
      answer:
        "Min value, max value, and null count. A query engine compares these against the filter predicate before reading any data, and skips a row group outright if its min/max range cannot satisfy the predicate.",
    },
    {
      question: "A table has a date filter, Parquet statistics exist, but file skipping isn't happening. What's the most likely cause?",
      answer:
        "The data isn't sorted or clustered on the filtered column, so each row group's min/max range spans the whole table's date range and nothing can be eliminated, even though the statistics themselves are correct.",
    },
    {
      question: "Why does Parquet compress better than row-oriented formats like CSV or Avro?",
      answer:
        "Values within one column tend to be similar to their neighbors (same type, often a narrow range of values), so dictionary and run-length encoding work well. Row-oriented formats interleave dissimilar column values, which compresses worse.",
    },
    {
      question: "What's the practical trade-off of choosing very small row groups?",
      answer:
        "Smaller row groups mean finer-grained statistics and more opportunities to skip data, but more metadata overhead and less efficient compression per column chunk, plus more row groups to plan against per file.",
    },
  ],
};
