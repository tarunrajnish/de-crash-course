import type { Topic } from "../types";

export const dataPipelineCicdAndPromotion: Topic = {
  id: "data-pipeline-cicd-and-promotion",
  title: "Pipeline CI/CD, deployment, and environment promotion",
  shortDescription: "Promoting the same versioned artifact through development, staging, and production with tested data migrations and recovery plans.",
  sections: [
    {
      heading: "A release includes more than transformation code",
      paragraphs: [
        "Version source code, SQL, job definitions, dependency locks, infrastructure configuration, and data-contract changes together where practical. CI should check formatting and linting, types where available, unit tests, contract compatibility, and deployable configuration before a change merges.",
        "Build an identifiable artifact tied to a code revision, such as a Python wheel plus job configuration. Promote that same artifact through environments. Rebuilding separately in production with floating dependencies creates a different release from the one staging exercised.",
      ],
    },
    {
      heading: "Separate configuration, identities, and data",
      paragraphs: [
        "Parameterize catalogs, schemas, storage locations, compute settings, and checkpoint paths. Supply secrets through the platform's supported secret or identity mechanism. Development and staging identities should be unable to write production outputs, even if a parameter is entered incorrectly.",
        "For Databricks, bundles and deployment tooling can version job and pipeline resources with environment targets. Validate the target configuration, deploy to an isolated test location, execute a smoke run, and verify outputs using the intended runtime identity before production approval.",
        "Use synthetic or appropriately de-identified data outside production. Keep streaming checkpoints isolated by environment and query; a shared checkpoint can mix processing state across deployments and invalidate recovery assumptions.",
      ],
    },
    {
      heading: "Roll out compatible data changes",
      paragraphs: [
        "Use an expand-and-contract migration for breaking interfaces: add a compatible column or versioned output, backfill it, reconcile results, migrate consumers, and remove the old contract after an agreed window. Coordinate source schemas, transformation code, and downstream models explicitly.",
        "Shadow a changed pipeline into separate outputs and compare keys, counts, totals, null rates, and representative records before switching consumers. Prevent concurrent old and new writers from mutating the same target unless that concurrency is deliberately supported.",
      ],
    },
    {
      heading: "Code rollback and data recovery are separate procedures",
      paragraphs: [
        "A deployment rollback restores an earlier executable or configuration. It does not undo rows already written, external actions, schema changes, or streaming state changes. Define a data repair plan with retained inputs, compatible checkpoints, and a tested replay boundary.",
        "Record the release revision, source range, output versions, and validation results. After deployment, monitor freshness, quality, duration, and cost against the prior baseline, and assign an owner who can pause publication or recover data if those checks fail.",
      ],
      warning: "Restoring one Delta table version is not a coordinated rollback of every downstream table or external system. Reconcile the full affected dependency path before reopening consumption.",
    },
  ],
  examplesToAttach: [
    "A CI pipeline and deployment manifest showing one artifact promoted across isolated environment targets.",
    "An expand-and-contract rollout plan with consumer sign-off, comparison checks, and separate code and data recovery steps.",
  ],
  selfTest: [
    { question: "Why promote the same build artifact across environments?", answer: "It preserves the tested code and dependency set. Environment-specific configuration changes, while the executable remains traceable to the same release." },
    { question: "Why are separate checkpoint paths required across environments?", answer: "Checkpoints hold source progress and sometimes state. Sharing them can make one environment consume or alter another environment's processing state." },
    { question: "Does redeploying yesterday's code undo a bad load?", answer: "No. Existing writes and downstream effects persist. Recovery needs an explicit restore or repair procedure and validation across affected consumers." },
    { question: "How do you remove a column used by multiple teams safely?", answer: "Introduce a compatible replacement or new contract version, migrate and validate consumers, agree a deprecation window, then remove the old field after confirming usage has ended." },
  ],
};
