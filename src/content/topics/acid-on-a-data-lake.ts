import type { Topic } from "../types";

export const acidOnADataLake: Topic = {
  id: "acid-on-a-data-lake",
  glossary: ["ACID", "Atomicity", "Consistency", "Isolation", "Durability"],
  title: "ACID guarantees on a data lake",
  shortDescription: "The four database guarantees, and what each one means once your 'table' is just files in object storage.",
  sections: [
    {
      heading: "The four letters",
      paragraphs: [
        "Atomicity: a write either fully happens or doesn't happen at all. There is no state where half the new files are visible and half aren't.",
        "Consistency: the table always moves from one valid state to another; a failed or partial write never leaves it in a state that violates its own schema or constraints.",
        "Isolation: concurrent writers don't see each other's uncommitted changes. Two writes happening at the same time don't interleave into a corrupted result.",
        "Durability: once a write is committed, it survives, even if the cluster that wrote it crashes a moment later.",
      ],
      table: {
        caption: "ACID, mapped to Delta",
        headers: ["Guarantee", "What breaks without it", "How Delta provides it"],
        rows: [
          ["Atomicity", "Readers see half-written files", "Log entry commits all-or-nothing"],
          ["Consistency", "Table ends up with wrong schema/data", "Schema checked before commit"],
          ["Isolation", "Two writers corrupt each other's output", "Optimistic concurrency control on the log"],
          ["Durability", "A committed write can disappear", "Log entry is a durable file write"],
        ],
      },
    },
    {
      heading: "Why plain files don't have this",
      paragraphs: [
        "Plain Parquet files in object storage have no transaction boundary. If a job writes 50 files and crashes after 30, there is no mechanism that hides those 30 files or rolls them back; they're just sitting there, half of an incomplete write.",
        "ACID guarantees require something that tracks what counts as 'the table' at any instant, which is exactly what Delta Lake's transaction log provides.",
      ],
    },
  ],
  selfTest: [
    {
      question: "Which ACID guarantee is specifically about two writers not corrupting each other's output?",
      answer: "Isolation: concurrent writes don't see or interfere with each other's uncommitted changes.",
    },
    {
      question: "Why don't plain Parquet files in object storage have atomicity on their own?",
      answer:
        "There's no transaction boundary. If a multi-file write crashes partway through, the files already written stay on disk with nothing to mark the write as incomplete or roll it back.",
    },
  ],
};
