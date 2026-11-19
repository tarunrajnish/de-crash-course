import type { Topic } from "../types";

export const lakehouseVsWarehouseVsLake: Topic = {
  id: "lakehouse-vs-warehouse-vs-lake",
  glossary: ["Data warehouse", "Data lake", "Lakehouse", "Table format", "ACID"],
  title: "Warehouse, lake, lakehouse: what actually changed at each step",
  shortDescription: "The historical progression from expensive structure, to cheap chaos, to open files with warehouse-like guarantees.",
  sections: [
    {
      heading: "The data warehouse: structured, fast, expensive",
      paragraphs: [
        "A traditional data warehouse (Teradata, then later Snowflake, BigQuery, Redshift) stores data in a proprietary, tightly managed format, enforces a schema on write, and is optimized end to end for SQL analytics. Performance is predictable and strong, because the engine controls storage layout, indexing, and query execution together.",
        "The cost is flexibility and price. Loading unstructured or semi-structured data (logs, JSON, images) usually requires transforming it to fit the warehouse's schema first, and both storage and compute are billed at warehouse rates even for data that's rarely queried.",
      ],
    },
    {
      heading: "The data lake: cheap, flexible, and unreliable",
      paragraphs: [
        "A data lake (Hadoop HDFS, then S3/ADLS/GCS object storage) stores files in open formats (Parquet, JSON, CSV) at commodity storage prices, with no schema enforced at write time. Any tool can read the raw files directly, and storing data speculatively, before you know exactly how you'll use it, becomes cheap enough to be routine.",
        "What it didn't solve: no atomic transactions, so concurrent writers could corrupt a table; no schema enforcement, so a malformed write could silently poison downstream consumers; and no efficient way to update or delete specific rows without rewriting entire files or directories.",
      ],
    },
    {
      heading: "The lakehouse: warehouse guarantees on lake storage",
      paragraphs: [
        "A lakehouse is a data lake (cheap object storage, open file formats) with a transactional metadata layer (Delta Lake, Iceberg, Hudi) added on top, providing ACID transactions, schema enforcement, and time travel, the properties a warehouse always had but a plain lake never did.",
        "Concretely, this means you can now run reliable UPDATE/DELETE/MERGE operations directly against files in object storage, enforce a schema so a bad write fails loudly instead of corrupting the table silently, and let multiple engines (Spark, Trino, Snowflake) query or write the same physical files without each needing its own copy.",
      ],
      table: {
        caption: "What each stage added or lacked",
        headers: ["Stage", "Storage cost", "Schema enforcement", "ACID transactions", "Engine flexibility"],
        rows: [
          ["Data warehouse", "High", "Yes, on write", "Yes", "Low, proprietary format"],
          ["Data lake", "Low", "No", "No", "High, open files"],
          ["Lakehouse", "Low", "Yes, via table format", "Yes, via table format", "High, open files plus multi-engine metadata"],
        ],
      },
    },
    {
      heading: "Where a traditional warehouse still wins",
      paragraphs: [
        "A managed warehouse still typically delivers lower-latency, highly concurrent interactive SQL out of the box, because the vendor controls the full stack (storage format, caching, query optimizer) as one tightly coupled system, rather than coordinating an open table format across independently evolving engines.",
        "It also removes operational burden: no compaction jobs to schedule, no choice of table format or catalog to make, no cross-engine compatibility to verify. For a workload that is purely BI dashboards against a few terabytes with a small, known set of query patterns, that operational simplicity is often worth more than the lakehouse's openness and cost advantage.",
      ],
      warning:
        "Migrating a warehouse-native workload to a lakehouse purely to reduce storage cost, without validating query latency against the new stack's actual compaction and clustering state, can leave interactive dashboards measurably slower, since the warehouse's tightly integrated optimizer is no longer doing that work for you.",
    },
  ],
  example: {
    title: "Which physical copy counts as the current row?",
    description: "Order 42 changes from amount 10 to 15. Old and replacement files remain in storage during the retention period.",
    table: {
      headers: ["Read approach", "Data included", "Reported amount"],
      rows: [
        ["Naive lake file glob", "Old row 10 plus replacement row 15", "25, incorrect"],
        ["Lakehouse active snapshot", "Replacement file only", "15"],
        ["Warehouse current table", "Updated order 42 row", "15"],
      ],
    },
    takeaway: "The naive scan lacks active-file tracking. Transactional table metadata or managed database state identifies which version belongs in the current result.",
  },
  selfTest: [
    {
      question: "What capability did a traditional data warehouse always have that a plain data lake lacked?",
      answer:
        "ACID transactions and enforced schema on write. A plain data lake stores open files with no transactional guarantees, so concurrent writers can corrupt a table and malformed data can be written without being rejected.",
    },
    {
      question: "What does a lakehouse concretely add on top of a plain data lake's files?",
      answer:
        "A transactional metadata layer (an open table format like Delta Lake, Iceberg, or Hudi) that provides ACID transactions, schema enforcement, and time travel, while keeping the underlying data in open file formats on commodity object storage.",
    },
    {
      question: "Why might a managed data warehouse still outperform a lakehouse for interactive BI dashboards?",
      answer:
        "The warehouse vendor controls storage layout, caching, and query optimization as one tightly coupled system. A lakehouse coordinates an open table format across independently evolving engines, which can mean less aggressive, less integrated optimization unless compaction and clustering are actively maintained.",
    },
    {
      question: "What made speculative data storage (saving data before knowing exactly how it'll be used) practical for the first time?",
      answer:
        "The data lake's commodity object storage pricing and lack of upfront schema requirements. Warehouses charge for storage and compute at warehouse rates and require the data to fit a defined schema before loading, making speculative storage expensive and impractical.",
    },
    {
      question: "A team moves a BI workload from a warehouse to a lakehouse purely to cut storage cost and finds dashboards slower. What's the likely gap?",
      answer:
        "The lakehouse table likely isn't compacted or clustered the way the warehouse's optimizer automatically maintained its own storage. Lakehouse performance depends on actively running maintenance (compaction, clustering), which the warehouse handled transparently.",
    },
    {
      question: "What operational burden does a lakehouse introduce that a managed warehouse removes?",
      answer:
        "Choosing and maintaining a table format and catalog, scheduling compaction and clustering jobs, and verifying cross-engine compatibility; all handled transparently by the vendor in a managed warehouse.",
    },
  ],
};
