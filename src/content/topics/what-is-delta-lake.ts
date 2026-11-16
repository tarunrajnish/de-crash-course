import type { Topic } from "../types";

export const whatIsDeltaLake: Topic = {
  id: "what-is-delta-lake",
  title: "What is Delta Lake",
  shortDescription: "Plain files plus a transaction log: the thing that turns a data lake into something you can trust.",
  sections: [
    {
      heading: "A data lake's original problem",
      paragraphs: [
        "A plain data lake is just files (usually Parquet) sitting in object storage. Nothing stops two jobs from writing at the same time and corrupting each other's output, and nothing records what the table looked like at any given moment.",
        "Reads can see partially written files, failed jobs can leave half-finished output behind, and there is no single answer to \"what does this table contain right now.\"",
      ],
    },
    {
      heading: "What Delta Lake adds",
      paragraphs: [
        "Delta Lake is a storage format: the same Parquet files, plus a transaction log (a sequence of JSON files describing every change) sitting alongside them.",
        "Every write (add files, remove files, change schema) is recorded as an atomic entry in that log. A reader doesn't guess what the table contains; it reads the log to know exactly which files currently make up the table.",
      ],
    },
    {
      heading: "What this buys you",
      paragraphs: [
        "Readers never see a half-finished write, because the log entry for that write either exists in full or doesn't exist at all.",
        "You get time travel (read the table as of an earlier log entry), reliable concurrent writes, and a single source of truth for what the table currently is, none of which plain files on their own provide.",
      ],
    },
  ],
  selfTest: [
    {
      question: "What is Delta Lake, physically?",
      answer:
        "The same Parquet files a plain data lake would use, plus a transaction log (a sequence of JSON entries) that records every change made to the table.",
    },
    {
      question: "Why can't a reader see a half-finished write in a Delta table?",
      answer:
        "Because the write only becomes visible once its transaction log entry is committed atomically. Until then, the files it wrote exist on disk but aren't part of any committed version of the table.",
    },
  ],
};
