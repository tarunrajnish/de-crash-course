import type { Topic } from "../types";

export const deltaLogMerge: Topic = {
  id: "delta-log-merge",
  title: "Delta transaction log, optimistic concurrency, and MERGE failure modes",
  shortDescription: "The log is the table. Everything else, including every MERGE failure, follows from that.",
  sections: [
    {
      heading: "The transaction log is the table",
      paragraphs: [
        "_delta_log holds JSON commit files plus periodic Parquet checkpoints that compact a long run of JSON commits into a single readable snapshot. A reader resolves a version of the table by replaying the log up to a point in time, not by scanning whatever Parquet files happen to sit in the table's directory.",
        "Because reading means resolving a snapshot from the log rather than acquiring any lock, readers never block writers and writers never block readers. A long-running query reads a consistent snapshot even while new commits land underneath it.",
      ],
    },
    {
      heading: "Optimistic concurrency",
      paragraphs: [
        "A writer reads a table version, does its work against that version, and then attempts to commit. The commit succeeds only if nothing conflicting landed on the table in the meantime; if it did, the writer either retries against the new version or fails outright.",
        "Two concurrent writers touching entirely different files rarely conflict, since blind appends to different parts of the table don't overlap. A MERGE touching overlapping partitions is much more likely to conflict, since two concurrent MERGE operations may both try to rewrite the same underlying files.",
      ],
    },
    {
      heading: "MERGE failure modes",
      paragraphs: [
        "Multiple source rows matching one target row throws an error unless the source is deduplicated first; Delta refuses to guess which of several matching source rows should update a given target row.",
        "A MERGE without partition predicates scans the whole table to find matches, even when the actual matching rows are concentrated in one small partition, because Delta has no way to prune directories it isn't told to filter on.",
        "MERGE rewrites whole files, not individual rows, since Parquet files are immutable. Updating a handful of rows scattered across many files means rewriting all of those files in full, so write amplification is real and can dominate the cost of an otherwise small logical update.",
      ],
      table: {
        caption: "MERGE failure modes and fixes",
        headers: ["Failure", "Cause", "Fix"],
        rows: [
          ["Multiple source matches error", "Non-unique match key in source", "Dedupe the source before MERGE"],
          ["Full table scan", "No partition predicate in the MERGE condition", "Add a partition-column filter to the ON clause"],
          ["High write amplification", "Rewriting whole files for scattered row updates", "Cluster or Z-order on the merge key to localize matching rows"],
        ],
      },
    },
    {
      heading: "Time travel and VACUUM are in tension",
      paragraphs: [
        "Old file versions stay readable (via time travel, for example a query AS OF a prior version) until VACUUM physically deletes them. The default 7-day retention is what makes rollback to a recent version possible after a bad write.",
        "Vacuuming aggressively to reclaim storage sooner removes the ability to recover from exactly the kind of mistake that time travel exists to protect against. Shortening retention is a direct trade against your own recovery window.",
      ],
      warning: "A VACUUM run with an aggressively short retention window can permanently foreclose a rollback you don't yet know you'll need.",
    },
    {
      heading: "Evidence: reading the log and history",
      paragraphs: [
        "DESCRIBE HISTORY on a Delta table shows every commit, its operation type, and the metrics logged with it (such as rows merged or files rewritten). Listing _delta_log directly shows the raw JSON commit files and Parquet checkpoint files backing that history.",
      ],
    },
  ],
  videos: [
    { title: "Delta Lake: Optimizing Merge (Databricks)", url: "https://www.youtube.com/watch?v=o2k9PICWdx0" },
  ],
  examplesToAttach: [
    "A DESCRIBE HISTORY output from one of your own tables showing a MERGE operation's metrics.",
    "A MERGE statement you've written, with and without a partition predicate in the ON clause.",
  ],
  selfTest: [
    {
      question: "Why do Delta readers never block on a concurrent writer?",
      answer: "Readers resolve a consistent snapshot from the transaction log rather than acquiring a lock on the current files, so a writer committing a new version doesn't interfere with a reader that's already resolved an earlier, still-valid snapshot.",
    },
    {
      question: "Two writers both append new files to a Delta table with no overlapping partitions. Do they conflict?",
      answer: "Rarely. Blind appends to disjoint files generally don't touch the same underlying data, so optimistic concurrency allows both commits to succeed without a conflict.",
    },
    {
      question: "A MERGE throws \"multiple source rows matched\". What's the fix?",
      answer: "Deduplicate the source data on the match key before running the MERGE, since Delta requires exactly one source row per matched target row and refuses to guess otherwise.",
    },
    {
      question: "A MERGE on a 10 TB partitioned table takes hours even though only one day's data changed. What's missing?",
      answer: "A partition predicate in the MERGE's ON clause. Without one, Delta scans the whole table to find matches instead of pruning to the relevant partition.",
    },
    {
      question: "Why does VACUUM with a very short retention period threaten rollback capability?",
      answer: "Time travel depends on old file versions still existing on disk. VACUUM physically deletes versions older than its retention window, so a short window removes the ability to roll back to anything beyond that recent point.",
    },
  ],
};
