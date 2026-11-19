import type { Topic } from "../types";

export const dagsAndIdempotentDesign: Topic = {
  id: "dags-and-idempotent-design",
  glossary: ["DAG", "Idempotency", "Logical date", "Non-deterministic"],
  title: "DAGs and idempotent pipeline design",
  shortDescription: "What a DAG actually encodes, and why every task in it has to be safe to run twice.",
  sections: [
    {
      heading: "What a DAG is, concretely",
      paragraphs: [
        "A DAG (directed acyclic graph) is a set of tasks plus the dependencies between them: task B cannot start until task A finishes, and the graph has no cycles, so there is no path that loops back on itself.",
        "An orchestrator's job is to read that graph, figure out which tasks are currently runnable (all of their upstream dependencies have succeeded), and hand them to a scheduler or executor. The DAG itself is just a dependency declaration; it says nothing about what each task does internally.",
      ],
    },
    {
      heading: "Why idempotency is the real requirement",
      paragraphs: [
        "A task is idempotent if running it twice with the same inputs produces the same end state as running it once. This matters because every orchestrator eventually retries a task: a worker dies mid-run, a network call times out, an operator manually re-triggers a failed run. If a task is not idempotent, a retry is not a safe recovery mechanism, it's a second, different mutation.",
        "The common failure mode is a plain INSERT into a table with no corresponding delete or dedup step. The first run inserts today's rows. The retry, after a transient failure partway through, inserts the same rows again, and now the downstream aggregate is double-counted. The orchestrator did exactly what it was told; the task just wasn't safe to repeat.",
      ],
    },
    {
      heading: "How idempotency actually breaks",
      paragraphs: [
        "Non-deterministic inputs are the most common cause: a task that reads 'now()' or 'current_date' internally instead of receiving the logical execution date as a parameter produces a different result depending on when it happens to run, which defeats both backfills and retries.",
        "Append-only writes without a delete-or-overwrite step are the second cause, covered above. The fix is almost always the same shape: delete (or overwrite) the partition or key range the task owns, then insert, so re-running the task for the same logical period always leaves the table in the same state. Side effects that live outside the data platform, like an email alert or a webhook fired from inside a task, are the third cause, and they can't be fixed by changing the write pattern; they need a separate, explicit dedup check (e.g. 'has this notification already been sent for this run id?').",
      ],
      warning:
        "A task that looks correct in a single clean run can double-count silently for months, because the bug only shows up on the one retry that happens after a flaky run. The bad numbers often get fixed by a resegmented dashboard before anyone finds the root cause.",
    },
  ],
  example: {
    title: "Retry the same logical day without multiplying rows",
    description: "Every attempt reads the same 120 source rows for logical date 2026-11-02. The two sink strategies produce different target counts.",
    table: {
      headers: ["Attempt", "Append every time", "Replace that date's partition"],
      rows: [
        ["First run", "120", "120"],
        ["Retry 1", "240", "120"],
        ["Retry 2", "360", "120"],
      ],
    },
    takeaway: "Use the run's logical interval and a retry-safe sink operation. A stable row count is useful evidence, but keys and values must also match after replay.",
  },
  selfTest: [
    {
      question: "What does a DAG encode, and what does it not encode?",
      answer:
        "It encodes tasks and the dependency order between them (what must finish before what can start), and that the graph has no cycles. It says nothing about whether any individual task is safe to retry or re-run; that's a property of the task's implementation, not the graph.",
    },
    {
      question: "Define idempotent in the context of a pipeline task.",
      answer:
        "Running the task twice with the same logical inputs leaves the system in the same end state as running it once. It does not mean the task has no side effects; it means repeating those side effects doesn't change the outcome.",
    },
    {
      question: "A daily load task does a plain INSERT and no delete. What happens on retry, and why?",
      answer:
        "The retry inserts the same day's rows a second time, because nothing removed the first partial or complete insert before the retry ran. The table now has duplicate rows for that day, and anything aggregating over it double-counts.",
    },
    {
      question: "Why does calling now() inside a task body break idempotency, even if the task is otherwise pure?",
      answer:
        "The result depends on the wall-clock time the task happens to execute, not on the logical period it's supposed to process. A retry an hour later, or a backfill run next month, produces a different timestamp and therefore different output for what should be the same logical run.",
    },
    {
      question: "What's the standard fix for an append-only write that isn't idempotent?",
      answer:
        "Replace the plain append with a delete-then-insert or overwrite scoped to the exact partition or key range the task owns, so re-running it for the same logical period always converges to the same state regardless of how many times it runs.",
    },
    {
      question: "Why can't a side effect like sending an email be fixed just by changing the write pattern?",
      answer:
        "There's no table partition to overwrite; the side effect happens outside the data platform entirely. It needs its own idempotency mechanism, typically a dedup check keyed on something like a run id, so a retry can detect 'this notification already went out for this run' and skip re-sending it.",
    },
  ],
};
