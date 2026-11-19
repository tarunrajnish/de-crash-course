import type { Topic } from "../types";

export const catalogsAndInterop: Topic = {
  id: "catalogs-and-interop",
  glossary: ["Catalog", "Table format", "Hive Metastore", "Unity Catalog", "Iceberg REST Catalog"],
  title: "Catalogs and interop: why the metadata layer matters more than the table format",
  shortDescription: "Hive Metastore, Unity Catalog, and Iceberg REST Catalog: the layer that decides whether multiple engines can share a table.",
  sections: [
    {
      heading: "What a catalog actually does",
      paragraphs: [
        "A table format (Delta, Iceberg, Hudi) defines how a single table's files and metadata are structured. A catalog is the separate layer that answers a different question: given a table name, where is its current metadata, and who is allowed to read or write it. Every query, regardless of table format, starts by asking the catalog to resolve a name to a location.",
        "This distinction matters because two engines can agree perfectly on a table format's on-disk layout and still be unable to share a table, if they resolve table names through two different, unsynchronized catalogs that each believe they own the authoritative pointer to the table's current metadata.",
      ],
    },
    {
      heading: "Hive Metastore: the legacy default",
      paragraphs: [
        "Hive Metastore (HMS) has been the default catalog since the Hadoop era: a relational database storing table and partition locations, queried over a Thrift API. Nearly every engine (Spark, Trino, Presto, Hive itself) has an HMS connector, which made it the de facto lowest common denominator for years.",
        "Its limitations show up at lakehouse scale: it was designed around Hive-style partition directories, not modern table formats' snapshot-based metadata, so using it as an Iceberg or Delta catalog means bolting table-format-aware extensions onto an API that wasn't built with ACID table formats in mind.",
      ],
    },
    {
      heading: "Unity Catalog and the Iceberg REST Catalog",
      paragraphs: [
        "Unity Catalog (Databricks) centralizes governance (access control, lineage, auditing) across multiple workspaces and, more recently, across multiple table formats and non-Databricks engines, aiming to be a governance layer rather than just a name-to-location lookup.",
        "The Iceberg REST Catalog takes a different approach: it standardizes the catalog as an HTTP API that any engine can implement or call against, rather than requiring a specific metastore implementation. This is what lets Snowflake, Trino, Spark, and Databricks each read and commit to the same Iceberg table through a common protocol, instead of each needing a bespoke connector to one vendor's proprietary metastore.",
      ],
      table: {
        caption: "Catalog options",
        headers: ["Catalog", "Model", "Strongest fit"],
        rows: [
          ["Hive Metastore", "Thrift API over a relational database", "Legacy Hadoop/Spark environments; broad but shallow support"],
          ["Unity Catalog", "Centralized governance layer", "Organizations standardizing on Databricks-centric governance across engines"],
          ["Iceberg REST Catalog", "Open HTTP API standard", "Multi-vendor, multi-engine access to the same tables without a shared metastore implementation"],
        ],
      },
    },
    {
      heading: "Why catalog choice now outweighs table format choice",
      paragraphs: [
        "By 2026, the three major table formats largely agree on core transactional guarantees, and translation layers exist to read one format as another. The remaining hard problem is organizational: which engines and teams can resolve a table name to the same, current metadata at the same time, with consistent access control.",
        "A REST catalog standard matters because it removes the need for every new engine a company adopts to ship a bespoke, vendor-specific metastore connector. Instead, any engine that speaks the REST Catalog protocol can read and write the same governed tables, which is what actually enables cross-engine, cross-vendor interoperability without proprietary lock-in at the catalog layer.",
      ],
    },
    {
      heading: "The failure mode this creates",
      paragraphs: [
        "Two teams standardize on the same table format but register it in two different catalogs (one team's Hive Metastore, another's Unity Catalog instance) without a sync mechanism between them. Each catalog believes it has the authoritative, current metadata pointer, so a write committed through one catalog is invisible to readers going through the other, producing stale reads that look like a data freshness bug rather than what it actually is: a catalog split-brain.",
        "This failure is easy to misdiagnose, because the table format's own transaction log is perfectly consistent; the inconsistency lives entirely in which catalog each reader asked first.",
      ],
      warning:
        "Agreeing on a table format across teams is not the same as agreeing on a catalog. Two catalogs pointing at the same underlying table without a sync mechanism produces silent, hard-to-diagnose stale reads that look like a data bug but are actually a metadata-resolution split-brain.",
    },
  ],
  example: {
    title: "Same table format, different current snapshots",
    description: "Two engines resolve an orders name through separate, unsynchronized registrations of the same analytical table.",
    table: {
      headers: ["Reader", "Catalog resolves to", "Rows visible"],
      rows: [
        ["Spark via catalog A", "Snapshot 10", "12"],
        ["Trino via catalog B", "Snapshot 9", "10"],
      ],
    },
    takeaway: "Use an authoritative registration and compatible catalog integration so readers resolve the intended snapshot. Sharing a file format alone does not repair catalog drift.",
  },
  selfTest: [
    {
      question: "What question does a catalog answer that a table format does not?",
      answer:
        "Given a table name, where its current metadata lives and who is authorized to read or write it. A table format only defines how one table's own files and metadata are structured once you already know where to find them.",
    },
    {
      question: "Why is Hive Metastore a poor fit for modern snapshot-based table formats, even though most engines support it?",
      answer:
        "It was designed around Hive-style partition directories, not the snapshot and manifest-based metadata that Iceberg, Delta, and Hudi use. Using it as a lakehouse catalog requires bolting table-format-aware extensions onto an API that predates ACID table formats.",
    },
    {
      question: "What does the Iceberg REST Catalog standardize that a proprietary metastore does not?",
      answer:
        "It defines the catalog as an open HTTP API any engine can implement or call, rather than requiring a specific metastore implementation. This lets multiple vendors' engines read and commit to the same table through one common protocol instead of needing a bespoke connector per metastore.",
    },
    {
      question: "Two teams use the same table format but register a table in two separate, unsynchronized catalogs. What goes wrong?",
      answer:
        "Each catalog believes it holds the authoritative pointer to the table's current metadata. A write committed through one catalog is invisible to readers resolving the table through the other, producing stale reads that look like a freshness bug but are actually a catalog split-brain.",
    },
    {
      question: "Why does catalog choice matter more than table format choice in a 2026-era multi-engine environment?",
      answer:
        "The major table formats have converged on similar transactional guarantees and increasingly interoperate. The catalog, by contrast, determines whether every engine in the organization can resolve a table name to the same current metadata and access control, which is the actual blocker to true cross-engine interoperability.",
    },
    {
      question: "What does Unity Catalog aim to provide beyond simple name-to-location resolution?",
      answer:
        "Centralized governance, including access control, lineage, and auditing, across multiple workspaces and, increasingly, across multiple table formats and non-Databricks engines, functioning as a governance layer rather than just a metastore.",
    },
  ],
};
