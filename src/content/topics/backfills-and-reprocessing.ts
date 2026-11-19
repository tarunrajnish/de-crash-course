import type { Topic } from "../types";

export const backfillsAndReprocessing: Topic = {
  id: "backfills-and-reprocessing",
  glossary: ["Backfill", "Full reprocessing", "Logical date", "Concurrency", "Idempotency"],
  title: "Backfills and reprocessing",
  shortDescription: "Running a pipeline for the past instead of the present, and why that's a different, riskier operation.",
  sections: [
    {
      heading: "What a backfill is",
      paragraphs: [
        "A normal scheduled run processes one logical period, usually the most recent one, as soon as its upstream dependencies are ready. A backfill runs the same task definition for one or more past logical periods, either because they were never run (a new pipeline, a gap from an outage) or because the source data for them changed and needs to be reprocessed.",
        "The task code doesn't change between a scheduled run and a backfill; what changes is the logical date (or date range) passed in, and the volume of work triggered at once. That's exactly why idempotent task design matters here: a backfill is, by definition, a bunch of retries of already-completed logical periods.",
      ],
    },
    {
      heading: "Partition-based backfills vs full reprocessing",
      paragraphs: [
        "A partition-based backfill re-runs the pipeline for a bounded set of logical periods, for example the 12 days affected by an upstream outage, and only touches those partitions. This is the common case and is relatively cheap: the blast radius is known in advance.",
        "Full reprocessing re-runs the entire history of the pipeline, typically because the transformation logic itself changed in a way that affects every past row, not just recent ones (a bug fix in a join, a new business rule applied retroactively). This is much more expensive and has to be scoped deliberately, since it touches every downstream consumer of that dataset, not just the ones that care about recent data.",
      ],
    },
    {
      heading: "Operational risks",
      paragraphs: [
        "Overloading the warehouse or cluster is the first risk: a backfill over 90 days submits 90 (or more, if downstream tasks fan out) jobs roughly at once if nothing throttles concurrency. That competes with the normal scheduled runs for the same compute and can starve today's pipeline of resources it needs to finish on time.",
        "Double-counting if idempotency is broken is the second risk, and it's amplified here: a task that quietly breaks idempotency might only ever be retried once or twice in normal operation, but a backfill retries it dozens or hundreds of times in a row, turning a rare bug into guaranteed, large-scale duplication.",
      ],
      warning:
        "Backfilling into a table whose schema has since evolved is the risk that's easy to miss: if a column was added, renamed, or had its semantics changed after the period being backfilled, the backfill either fails outright or silently writes data under the new schema's assumptions, producing rows that look valid but don't mean what the rest of the table thinks they mean.",
    },
    {
      heading: "Making backfills safe in practice",
      paragraphs: [
        "Most orchestrators let you cap backfill concurrency independently of normal scheduling concurrency, so a large backfill can be throttled to a handful of parallel tasks instead of flooding the cluster. Pair that with the idempotent delete-then-insert pattern from the DAG topic, and a backfill becomes a safe, if slow, batch of normal runs rather than a special, risky operation.",
      ],
    },
  ],
  example: {
    title: "Repair one missing date and preserve its neighbors",
    description: "Only the November 2 partition is missing. A date-scoped overwrite replaces that day using its replayable source input.",
    table: {
      headers: ["Logical date", "Source rows", "Target before", "Target after"],
      rows: [
        ["2026-11-01", "100", "100", "100"],
        ["2026-11-02", "120", "0", "120"],
        ["2026-11-03", "110", "110", "110"],
      ],
    },
    takeaway: "Rerunning November 2 should leave 120 rows, not append another 120. Reconcile keys and totals as well as counts, and cap concurrent backfill runs.",
  },
  selfTest: [
    {
      question: "What's the core difference between a scheduled run and a backfill, given the same task code?",
      answer:
        "The logical date (or range of dates) passed to the task, and the fact that a backfill usually submits many logical periods at once instead of one. The task implementation is identical; only the input period and volume differ.",
    },
    {
      question: "When would you choose a partition-based backfill over full reprocessing?",
      answer:
        "When only a bounded, known set of logical periods is affected, such as a 12-day outage window, and the transformation logic itself hasn't changed. Full reprocessing is reserved for logic changes that affect correctness across the entire history.",
    },
    {
      question: "Why does a backfill expose idempotency bugs more severely than normal operation?",
      answer:
        "Normal operation might retry a given task once in a while. A backfill retries the same non-idempotent logic across dozens or hundreds of logical periods in quick succession, turning an occasional duplicate into systematic, large-scale duplication.",
    },
    {
      question: "What operational control limits a backfill's impact on cluster or warehouse load?",
      answer:
        "Capping backfill concurrency (the number of logical periods processed in parallel) independently from normal scheduling concurrency, so the backfill doesn't compete for all available compute at once with the pipelines currently running on schedule.",
    },
    {
      question: "Why can backfilling old data into a table with an evolved schema produce incorrect results even if the backfill 'succeeds'?",
      answer:
        "If a column's meaning changed after the backfilled period (renamed, added, or had its semantics redefined), the backfill writes rows that are schema-valid but don't carry the meaning the rest of the table assumes for that column, producing data that is structurally fine but semantically wrong.",
    },
  ],
};
