import type { Topic } from "../types";

export const productionSupportAndRootCauseAnalysis: Topic = {
  id: "production-support-and-root-cause-analysis",
  glossary: ["SLO", "SLI", "Root-cause analysis", "Runbook", "Reconciliation"],
  title: "Production support, troubleshooting, and root-cause analysis",
  shortDescription: "Turning freshness and quality alerts into bounded investigations, safe recovery, and durable preventive changes.",
  sections: [
    {
      heading: "Monitor what consumers depend on",
      paragraphs: [
        "A successful job status measures execution. A data-product service-level indicator measures whether consumers received usable data: freshness, completeness, correctness, or availability. Define an SLO such as 'validated orders through 06:00 UTC are published by 07:00 UTC on 99% of days' and specify how it is measured.",
        "Track source lag, ingestion offsets, rejected records, row counts, quality checks, task duration, retries, resource saturation, and cost. Correlate logs and metrics using dataset, logical interval, run ID, source position, and code revision. Keep sensitive payloads out of logs.",
      ],
    },
    {
      heading: "Triage impact and contain the failure",
      paragraphs: [
        "Identify affected consumers, the last known good output, and whether bad data is still being published. Assign an incident owner and communication channel. Quarantine suspect partitions or pause publication when continuing would expand the impact, and communicate the freshness or correctness limitation.",
        "Check recent deployments, source changes, access changes, and infrastructure failures. Follow lineage upstream to locate the first incorrect boundary. Distinguish missing input, wrong transformations, failed writes, and stale serving caches before choosing a recovery action.",
      ],
    },
    {
      heading: "Use hypotheses and preserve evidence",
      paragraphs: [
        "Write a falsifiable hypothesis: 'the new dimension load introduced duplicate active keys.' Compare key counts and effective-date ranges before and after the relevant source or code version. Preserve query plans, metrics, and table versions so a rerun does not erase the evidence needed to explain the failure.",
        "For a slowdown, compare stage durations, scanned bytes, shuffle, spill, skew, source throughput, and queue time. Change one suspected cause at a time where feasible. Record which observation supports or rejects each explanation.",
      ],
    },
    {
      heading: "Recover, reconcile, and prevent recurrence",
      paragraphs: [
        "Replay or repair the smallest affected range using tested idempotent paths. Reconcile counts, business totals, keys, and downstream freshness before declaring recovery. Confirm affected consumers have refreshed, since correcting an upstream table does not automatically repair an exported report.",
        "A blameless root-cause analysis records the timeline, trigger, contributing conditions, detection gap, impact, and recovery. Assign concrete follow-ups with owners and dates, such as a contract check, safer publication boundary, or actionable alert. Update the runbook and exercise it with another engineer.",
      ],
      warning: "Repeatedly rerunning a job without checking its write semantics can duplicate records and destroy useful evidence. Establish the affected range and a safe retry strategy first.",
    },
  ],
  example: {
    title: "Trace a revenue spike before rerunning anything",
    description: "An illustrative incident: revenue doubles after a customer-dimension release, while order count stays unchanged.",
    table: {
      headers: ["Time (UTC)", "Evidence", "Action"],
      rows: [
        ["09:00", "New dimension version deployed", "Record the code and table versions"],
        ["09:05", "Revenue check fails; orders unchanged", "Pause downstream publication"],
        ["09:08", "Two active rows for customer C7", "Quarantine the bad dimension version"],
        ["09:20", "Dimension repaired; totals reconcile", "Replay affected outputs and resume"],
      ],
    },
    takeaway: "Rerunning the revenue join against the same duplicate keys would reproduce the error. Repair the first bad dependency, then validate downstream recovery.",
  },
  selfTest: [
    { question: "How can every job be green while a freshness SLO fails?", answer: "Jobs may process stale or incomplete source input, publish to the wrong destination, or leave consumers reading an old output. Measure the consumer-visible data boundary." },
    { question: "What is the first goal during a bad-data incident?", answer: "Establish impact and contain further publication of incorrect data, while assigning ownership and preserving evidence for diagnosis." },
    { question: "When is an upstream repair insufficient to close an incident?", answer: "When downstream tables, caches, exports, or reports still contain affected results. Validate and refresh the full impacted consumer path." },
  ],
};
