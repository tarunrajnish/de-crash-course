import type { Topic } from "../types";

export const platformArchitectureAndIncrementalIngestion: Topic = {
  id: "platform-architecture-and-incremental-ingestion",
  glossary: ["Batch", "Incremental", "CDC", "Cursor", "Idempotency"],
  title: "Platform architecture: batch, incremental loads, and CDC",
  shortDescription: "Follow an orders dashboard from source to report, then compare full loads, changed-row loads, and change logs.",
  sections: [
    {
      heading: "The problem: keep an orders dashboard up to date",
      paragraphs: [
        "Imagine an online shop. Its application database stores orders, and a separate dashboard reports their current amounts. The dashboard needs a reporting copy so analytical queries do not compete with checkout traffic. Platform architecture describes the route data takes from that application database to the report, including how the copy stays correct.",
        "Use this small example throughout the lesson: the reporting copy initially matches the source. Then order 42 changes, order 43 is physically deleted, and order 44 is inserted. Assume the dashboard must reflect committed changes within five minutes. Our job is to move those changes reliably.",
      ],
      table: {
        headers: ["order_id", "Before the changes", "After the changes"],
        rows: [
          ["42", "amount = 10", "amount = 15"],
          ["43", "amount = 8", "Row deleted"],
          ["44", "No row yet", "amount = 6"],
        ],
      },
    },
    {
      heading: "The path: copy, store, clean, then serve",
      paragraphs: [
        "Before choosing how often to run, give each part of the pipeline a clear job. Here is one possible design for the orders dashboard.",
        "You may hear these stored layers called bronze, silver, and gold: source-aligned input, cleaned records, and reporting output. An orchestrator coordinates the steps and retries failures. The names matter less than knowing what each step reads, writes, and promises to its next reader.",
      ],
      table: {
        headers: ["Step", "Job", "Orders example"],
        rows: [
          ["Copy from the source", "Extract rows or change records", "Read the update to order 42"],
          ["Keep recoverable input", "Store received data and source positions", "Keep change 101 so it can be replayed"],
          ["Build clean current records", "Validate keys and apply changes", "Keep one current row per order"],
          ["Serve the dashboard", "Publish a validated table or view", "Show orders 42 and 44, totaling 21"],
        ],
      },
    },
    {
      heading: "Full batch: read the entire table each time",
      paragraphs: [
        "A batch is one run over a bounded collection of data. A full batch reads the whole source table. In our example, a new full extract contains order 42 at amount 15 and order 44 at amount 6. Replacing the reporting copy with that complete extract also removes order 43.",
        "This is often a simple choice for small tables. As the source grows, rereading every unchanged row costs more and can burden the application database. For our five-minute freshness requirement, the entire extract and publication would need to finish often enough. A nightly full load would leave the dashboard too far behind.",
      ],
      warning: "Appending each full extract would duplicate existing orders. Publish a complete replacement safely, or use a merge strategy that also handles rows removed from the source.",
    },
    {
      heading: "Incremental batch: read only what changed",
      paragraphs: [
        "An incremental load reads changes since the previous successful run. Instead of copying a million unchanged orders, a run might read only a few hundred new or updated rows. It can still run on a schedule, such as every five minutes.",
        "One approach uses an updated_at column. A cursor is the saved position that tells the next run where to resume. For example, start from the last saved timestamp, capture an upper cutoff for this run, and read rows in that interval. Timestamp extraction needs rules for tied timestamps and late-visible updates; overlapping intervals plus deduplication can help when the source's timing guarantees support them.",
        "This approach can find the new value for order 42 and the new order 44. It cannot find physically deleted order 43: that row is gone, so there is no updated_at value left to read. A soft-delete flag can expose the deletion; otherwise you need another way to detect it.",
      ],
    },
    {
      heading: "CDC: capture inserts, updates, and deletes from a change log",
      paragraphs: [
        "Change data capture (CDC) reads records of source changes, often from the database's change log. Each event identifies what changed, including a deletion. For our example, the log might contain these three events; the positions are illustrative ordered identifiers.",
        "To start with an existing database, take a consistent snapshot tied to a known log position, then consume changes after that position. The snapshot supplies existing orders, and the log supplies subsequent changes. Use a supported snapshot-to-log handoff so changes are neither missed nor applied out of order.",
      ],
      table: {
        headers: ["Source position", "Change event", "Effect on the reporting copy"],
        rows: [
          ["101", "UPDATE order 42: amount = 15", "Replace its previous amount of 10"],
          ["102", "DELETE order 43", "Remove its current row"],
          ["103", "INSERT order 44: amount = 6", "Add the new order"],
        ],
      },
    },
    {
      heading: "Streaming: decide how soon to process the changes",
      paragraphs: [
        "The previous sections explain which data to read. You also need to choose when to process it. A streaming pipeline keeps consuming new input as it arrives, often in small micro-batches. A scheduled job starts, processes a bounded portion, and finishes.",
        "CDC can feed either design: a job could collect five minutes of change-log events, or a continuously running pipeline could apply them with a shorter delay. Choose a design whose total extraction, processing, and publication delay meets the dashboard's freshness requirement.",
      ],
      table: {
        headers: ["Design", "What it reads", "When it processes"],
        rows: [
          ["Nightly full batch", "The whole orders table", "Once each night"],
          ["Scheduled timestamp increment", "Rows found through updated_at", "Each scheduled run"],
          ["Scheduled CDC batch", "A bounded range of change-log events", "Each scheduled run"],
          ["Continuously processed CDC", "New change-log events", "As the running pipeline consumes them"],
        ],
      },
    },
    {
      heading: "Retries: save the data before saving your progress",
      paragraphs: [
        "Suppose the saved cursor is 100. Read changes 101 through 103, apply them to the reporting table, and commit that output. Only then save cursor 103. If you save 103 first and the data write fails, the next run may start after changes that never reached the dashboard.",
        "A crash after the data commit but before the cursor save creates the opposite situation: the next run reads those changes again. Idempotency means the replay leaves the same intended result. Use stable order keys and source versions or positions so duplicate and older events cannot overwrite newer state. Retain enough deletion information to prevent an old replay from restoring a deleted order.",
        "Publish the changes through a transactional commit or an equivalent staged publication step. Readers should see a complete published result rather than a half-finished write.",
      ],
    },
    {
      heading: "Operations: check the result and keep a recovery path",
      paragraphs: [
        "A successful job status tells you the code finished. Reconciliation checks whether the data agrees: compare source and target keys, counts, totals, and deletions at the same source position or completed time window. After our three changes, the current reporting table should contain orders 42 and 44, totaling 21.",
        "Monitor how far the dashboard is behind the source, and limit extraction concurrency so reporting does not slow checkout. Retain source positions and replayable input where policy permits. If the source keeps change logs for seven days and the pipeline falls eight days behind, the earliest required changes may already be gone.",
        "For a small source, start by checking whether full loads can meet the freshness and source-load limits. Use incremental extraction when rereading unchanged data becomes wasteful. Choose CDC when reliable change events, especially deletes, are needed; choose continuous processing when the required delay justifies its operating cost.",
      ],
      warning: "A saved cursor or streaming checkpoint cannot recreate expired source events. Alert before the source log's retention window is exhausted, and document how to rebuild from a new consistent snapshot if necessary.",
    },
  ],
  example: {
    title: "One update, one delete, one insert, and a safe retry",
    description: "Start with orders 42 = 10 and 43 = 8, and saved cursor 100. Apply the same three changes used throughout this lesson.",
    steps: [
      { label: "Read changes 101-103", detail: "Update order 42 to 15, delete order 43, and insert order 44 at 6." },
      { label: "Commit the result", detail: "Publish orders 42 = 15 and 44 = 6. Keep the latest applied position for each order, including deleted order 43." },
      { label: "Save cursor 103", detail: "Record the completed source position only after the output commit succeeds." },
      { label: "Handle a retry", detail: "If the cursor save failed, read 101-103 again. Ignore events already applied; the two current orders still total 21." },
    ],
    takeaway: "The target ends with two current orders totaling 21, including after a retry. The saved cursor controls where reading resumes; per-order positions make replay safe.",
  },
  selfTest: [
    { question: "A job runs every night and reads only orders changed since yesterday. Is it batch or incremental?", answer: "Both. It is a batch because each run processes a bounded input and finishes. It is incremental because that input contains changes rather than the whole table." },
    { question: "In our example, why would an updated_at extract leave order 43 in the dashboard?", answer: "Order 43 was physically deleted from the source. There is no remaining row for the timestamp query to find, so it cannot tell the reporting copy to remove it. A CDC delete event or another deletion-detection mechanism is needed." },
    { question: "Does using CDC require a continuously running streaming job?", answer: "No. CDC supplies change events. A scheduled batch can read a bounded range of those events, or a running pipeline can consume them continuously." },
    { question: "The output commit succeeds, but saving cursor 103 fails. What must the retry do?", answer: "Resume from cursor 100 and safely reapply or ignore changes 101-103. With per-order source-position checks, the target remains orders 42 = 15 and 44 = 6, totaling 21." },
    { question: "A seven-day source log no longer contains your saved position. Can the cursor recover the missing events?", answer: "No. The cursor identifies progress; it does not contain the source events. Use a supported retained copy, or rebuild from a new consistent snapshot and resume from its corresponding log position." },
  ],
};
