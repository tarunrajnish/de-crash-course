import type { Topic } from "../types";

export const lineageAndIncidentResponse: Topic = {
  id: "lineage-and-incident-response",
  title: "Lineage and incident response",
  shortDescription: "How data lineage turns \"which dashboard is wrong\" into \"which upstream job caused it,\" and what it costs to not have it.",
  sections: [
    {
      heading: "Table-level versus column-level lineage",
      paragraphs: [
        "Table-level lineage records which tables feed which other tables: table B was built by a job that read table A. It's cheap to generate (often just by parsing job configs or query logs for source and destination table names) and answers a coarse question: what tables are upstream of this one.",
        "Column-level lineage tracks the same relationship at the level of individual columns: which specific upstream columns, through which specific transformation, produced this specific output column. It requires parsing the actual transformation logic (SQL, dbt models, Spark code), not just job metadata, which makes it far more expensive to build and keep accurate, but it answers the question incident response actually needs: not just \"which tables could be involved\" but \"which exact upstream field produced this exact wrong number.\"",
      ],
    },
    {
      heading: "The two different questions in an incident",
      paragraphs: [
        "\"Which dashboard is wrong\" is a symptom-level question: an analyst or stakeholder notices a number that doesn't look right. Answering it requires nothing more than comparing the number against expectations or a prior period, and it tells you nothing about the cause.",
        "\"Which upstream job caused it\" is the root-cause question, and it's a different kind of search entirely: starting from the wrong number, walk the lineage graph backward through every transformation and table that fed it, checking each one against its own expected behavior, until you find the first point where the data diverged from correct. Without lineage, this walk is done by asking around, grepping SQL repositories, and guessing, which turns a mechanical graph traversal into an improvised, hours-long investigation.",
      ],
    },
    {
      heading: "Using lineage during an active incident",
      paragraphs: [
        "A practical playbook: identify the first table or dashboard where the bad value is visible, use column-level lineage to find its immediate upstream dependencies, check whether each of those is itself correct (using whatever observability signals exist: freshness, volume, distribution), and recurse into whichever dependency is the first one found to be wrong.",
        "This converts an investigation that could touch dozens of tables into a bounded search along a known graph, and it stops the common wrong pattern of re-running the most downstream job repeatedly in the hope that trying again fixes an upstream problem it has no control over.",
      ],
      warning:
        "Without lineage, the default incident response is often to re-run or roll back the last job that touched the dashboard, which does nothing if the actual fault is three jobs upstream, and burns the time that should have gone into finding the real cause.",
    },
    {
      heading: "What lineage costs to maintain, and where it comes from",
      paragraphs: [
        "Lineage isn't free: it needs to be either parsed automatically from transformation code (the only approach that scales and stays accurate as pipelines change) or maintained by hand (which drifts out of date almost immediately and becomes actively misleading). Most production lineage tools (OpenLineage, dbt's own DAG, warehouse-native lineage in Snowflake or BigQuery) generate it automatically from query or model metadata rather than relying on manual documentation.",
        "The payoff scales with pipeline complexity: a two-table pipeline doesn't need a lineage tool, a human can hold the whole graph in their head. A few hundred dbt models feeding a few dozen dashboards is exactly the scale where an undocumented mental map stops being reliable, and an automatically generated lineage graph becomes the difference between a ten-minute root-cause and a half-day one.",
      ],
    },
  ],
  videos: [{ title: "What is Data Lineage? (OpenLineage)", url: "https://www.youtube.com/watch?v=0PwkCWopbas" }],
  examplesToAttach: [
    "A lineage graph (from dbt docs, OpenLineage, or a warehouse-native lineage view) showing the upstream path into one of your production tables.",
    "A postmortem or incident timeline showing how long it took to trace a bad number to its root cause, with or without lineage tooling available.",
  ],
  selfTest: [
    {
      question: "Why does column-level lineage answer an incident response question that table-level lineage can't?",
      answer:
        "Table-level lineage only shows which tables are upstream of another, which can include many columns unrelated to the bad value. Column-level lineage traces the exact transformation path for a single output column, letting you narrow directly to the specific upstream fields that could have produced it.",
    },
    {
      question: "What is the practical difference between \"which dashboard is wrong\" and \"which upstream job caused it\"?",
      answer:
        "The first is a symptom-level observation, typically made by comparing a number against expectations, and requires no investigation. The second is the root-cause question, requiring a backward walk through the lineage graph checking each upstream dependency until the first point of divergence is found.",
    },
    {
      question: "Without a lineage tool, what's the common but ineffective incident response pattern, and why does it fail?",
      answer:
        "Re-running or rolling back the most downstream job that touches the bad dashboard. It fails when the actual fault lives several jobs upstream, since re-running a correct downstream job against still-bad upstream data reproduces the same wrong result.",
    },
    {
      question: "Why is manually maintained lineage documentation considered worse than no lineage documentation by some teams?",
      answer:
        "Manual documentation drifts out of date as pipelines change, but still looks authoritative, so an investigator following it can be actively misled toward a wrong or outdated upstream path, which is worse than knowing no documented lineage exists and verifying everything directly.",
    },
    {
      question: "At what point does a team's pipeline complexity justify investing in automated lineage tooling?",
      answer:
        "Once the pipeline graph is too large for anyone to reliably hold in their head, typically once there are enough models and dashboards (hundreds of models, dozens of consuming dashboards, for example) that an undocumented mental map of dependencies becomes unreliable and investigations start taking hours instead of minutes.",
    },
    {
      question: "How does column-level lineage get generated in practice, as opposed to table-level lineage?",
      answer:
        "Table-level lineage can be derived from job metadata alone (source and destination table names). Column-level lineage requires parsing the actual transformation logic, such as SQL or dbt model code, to determine which specific upstream columns map into each specific output column.",
    },
  ],
};
