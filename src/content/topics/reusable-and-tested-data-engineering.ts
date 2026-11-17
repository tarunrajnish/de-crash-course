import type { Topic } from "../types";

export const reusableAndTestedDataEngineering: Topic = {
  id: "reusable-and-tested-data-engineering",
  title: "Reusable frameworks, coding standards, and automated testing",
  shortDescription: "Sharing reliable ingestion mechanics while keeping business rules explicit and testing the failure paths that matter.",
  sections: [
    {
      heading: "Separate transformation logic from side effects",
      paragraphs: [
        "A transformation should accept data and explicit parameters and return a result that can be inspected. Keep reading sources, managing credentials, writing targets, and sending notifications at defined boundaries. This makes business rules testable without launching an entire production workflow.",
        "Use consistent naming, explicit schemas, documented output grain, pinned dependencies, and reviewable modules or SQL files. Apply formatters, linters, and automated checks in CI. Avoid hidden notebook state and environment-dependent defaults that change the meaning of the same source revision.",
      ],
    },
    {
      heading: "Extract repeated mechanics after understanding the variation",
      paragraphs: [
        "Useful shared components include bounded retries, structured run logging, schema validation, checkpoint handling, and publication checks. Give them small interfaces with explicit configuration and ownership. Keep domain-specific joins, business keys, deletion policies, and reconciliation rules visible in the pipeline using them.",
        "A configuration-driven ingestion framework can reduce repeated source setup, but configuration becomes a programming interface as it grows. Validate it early, version it, provide actionable errors, and support a clear escape hatch. A generic framework that hides every write behind one function makes incident diagnosis harder.",
      ],
      warning: "Retry only failures known to be transient and safe to repeat, using bounded attempts and backoff. Retrying invalid schemas or non-idempotent writes can prolong an incident or corrupt output.",
    },
    {
      heading: "Test logic, integration, and recovery at different boundaries",
      paragraphs: [
        "Unit-test SQL and PySpark transformations with small fixtures covering nulls, duplicates, empty input, boundary timestamps, late arrivals, and source-version ties. Assert schema and record values at the intended grain; do not rely on incidental row ordering.",
        "Integration tests exercise actual engine and storage semantics in isolated schemas: Delta merges, permission checks, schema evolution, and checkpoint recovery. Contract tests check that producer changes remain compatible with consumers. Production data assertions validate the records that arrived in each real run.",
        "Add failure-injection tests around publication boundaries. Run the same batch twice, simulate a crash after a write but before cursor advancement, and verify that the recovered result matches one successful run. Use representative performance tests for scale-sensitive changes, with an explicit budget for running them.",
      ],
    },
  ],
  examplesToAttach: [
    "A reusable ingestion component with validated configuration, structured errors, and a documented extension point.",
    "A test suite showing fixture-based transformation tests and an integration test for a safely retried write.",
  ],
  selfTest: [
    { question: "Which concerns are good candidates for a shared pipeline framework?", answer: "Repeated mechanics such as validation, run logging, safe retries, and publication checks. Keep varying business semantics explicit rather than hiding them behind generic defaults." },
    { question: "Why do passing fixture tests leave integration risks?", answer: "Fixtures do not reproduce runtime permissions, transactional storage behavior, connector compatibility, or checkpoint recovery. Those need tests at the actual system boundaries." },
    { question: "What should a retry recovery test verify?", answer: "That injected failure and replay produce the same schema and records as one complete run, without duplicates, skipped data, or repeated external side effects." },
  ],
};
