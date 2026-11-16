import type { Topic } from "../types";

export const olapVsOltp: Topic = {
  id: "olap-vs-oltp",
  title: "OLAP vs. OLTP",
  shortDescription: "Two workloads with opposite access patterns, and why one database rarely serves both well.",
  sections: [
    {
      heading: "Two different jobs",
      paragraphs: [
        "OLTP (online transaction processing) handles the operational side of a business: creating an order, updating an account balance, placing a reservation. These are short, frequent transactions that read and write a handful of rows at a time.",
        "OLAP (online analytical processing) handles analysis: how many orders shipped last quarter by region, what is the average order value by customer segment. These queries scan and aggregate millions of rows, but run far less frequently.",
      ],
    },
    {
      heading: "Why the same schema struggles at both",
      paragraphs: [
        "OLTP schemas are normalized to make single-row writes fast and consistent: minimal duplication, strict foreign keys, row-oriented storage so a whole record can be fetched or updated in one disk read.",
        "Running an analytical aggregation against a normalized OLTP schema means joining many tables and scanning rows the query doesn't need column-by-column, which is slow precisely because the storage layout optimizes for the opposite access pattern.",
      ],
      table: {
        caption: "OLTP vs. OLAP",
        headers: ["", "OLTP", "OLAP"],
        rows: [
          ["Typical query", "Insert/update a single row", "Aggregate millions of rows"],
          ["Schema shape", "Normalized", "Denormalized (star/snowflake)"],
          ["Storage orientation", "Row-oriented", "Column-oriented"],
          ["Optimized for", "Write latency, consistency", "Scan and aggregation throughput"],
        ],
      },
    },
    {
      heading: "Why data warehouses exist",
      paragraphs: [
        "A data warehouse is a separate system, fed from OLTP sources, deliberately denormalized and column-oriented so analytical queries are fast without touching the production system that serves live transactions.",
        "This separation also protects OLTP latency: a heavy analytical scan running directly against a production transactional database would compete for the same resources that need to stay fast for live customer traffic.",
      ],
      warning: "Running analytics directly against a production OLTP database risks slowing down the live transactions that database exists to serve.",
    },
  ],
  selfTest: [
    {
      question: "Why is a normalized schema good for OLTP but bad for OLAP?",
      answer:
        "Normalization minimizes duplication and keeps single-row writes fast and consistent, which OLTP needs. But it forces OLAP queries to join many tables to answer a single analytical question, which is slow at scan scale.",
    },
    {
      question: "Why shouldn't heavy analytical queries run directly against a production OLTP database?",
      answer:
        "They compete for the same CPU, memory, and I/O that the OLTP system needs to keep live transactions fast, risking latency for actual customer-facing operations.",
    },
  ],
};
