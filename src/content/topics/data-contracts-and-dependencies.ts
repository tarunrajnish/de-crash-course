import type { Topic } from "../types";

export const dataContractsAndDependencies: Topic = {
  id: "data-contracts-and-dependencies",
  glossary: ["Data contract", "Schema drift", "Schema registry", "Contract testing"],
  title: "Data contracts and pipeline dependencies",
  shortDescription: "The agreement that makes a dataset safe to depend on, and what happens to downstream pipelines without one.",
  sections: [
    {
      heading: "What a data contract is",
      paragraphs: [
        "A data contract is an explicit agreement between the producer of a dataset and its consumers, covering both schema (field names, types, nullability) and semantics (what a field actually means: is amount pre-tax or post-tax, is status an enum with a fixed set of values, can a row be updated in place or is it append-only).",
        "The point is to make dependencies between teams explicit instead of implicit. Without a contract, a consumer's pipeline depends on the producer's table continuing to look exactly the way it happened to look on the day the consumer wrote their query, which is an assumption nobody agreed to and nobody is obligated to preserve.",
      ],
    },
    {
      heading: "Why dependencies break without one",
      paragraphs: [
        "Silent schema drift is the most common failure: a producer team renames a column, changes a type (int to string, or widening precision on a decimal), or redefines what a status value means, with no coordination, because from their side it's an internal change to their own table.",
        "Downstream, a consumer's DAG either fails outright (a column it selects no longer exists, loud and fast to diagnose) or, worse, keeps running and silently produces wrong results (a status value's meaning changed but the column still exists with the same name and type, so nothing errors, the numbers are just wrong from that point forward).",
      ],
      warning:
        "The silent case is the expensive one: a renamed enum value or a redefined unit (cents vs dollars) can run clean through a pipeline for weeks before a downstream metric looks implausible enough for someone to investigate, by which point every report built on it since the change is also wrong.",
    },
    {
      heading: "How contracts are enforced in practice",
      paragraphs: [
        "A schema registry (common in streaming systems, e.g. for Avro or Protobuf payloads on a Kafka topic) enforces compatibility rules at write time: a schema change has to be declared backward- or forward-compatible with existing consumers, or the registry rejects it outright, before it ever reaches a downstream pipeline.",
        "CI checks on the producer's pull request are the batch-pipeline equivalent: a schema diff check that runs against the producer's PR, comparing the proposed table schema to the one currently in production and flagging (or blocking) changes that break the documented contract, catches the issue before it ships rather than after a downstream pipeline fails in production.",
      ],
    },
    {
      heading: "Contract testing",
      paragraphs: [
        "Contract testing goes one step further than a schema diff: the consumer publishes an explicit expectation (this field must exist, must be non-null, must be one of these enum values), and that expectation is run against the producer's actual output as part of the producer's own CI, not discovered after the fact in the consumer's pipeline.",
        "This flips the failure point from 'consumer's production pipeline breaks days or weeks later' to 'producer's PR fails CI before merge', which is a large difference in cost: the person who made the breaking change is the one who sees the failure, with full context, instead of an on-call engineer on an unrelated team debugging it downstream.",
      ],
    },
  ],
  example: {
    title: "Validate meaning as well as column names",
    description: "A consumer expects order_total in dollars. Review each proposed producer change before release.",
    table: {
      headers: ["Producer change", "Consumer impact", "Contract decision"],
      rows: [
        ["Rename order_total to amount", "Existing SELECT order_total fails", "Block until a compatible migration exists"],
        ["Keep order_total but send cents", "Queries run; totals become 100x larger", "Block the semantic change"],
        ["Add optional coupon_code", "Existing required fields still behave the same", "Allow if the agreed compatibility policy permits"],
      ],
    },
    takeaway: "A structural compatibility check can catch the rename. Units, meanings, and change ownership must also be part of the contract.",
  },
  selfTest: [
    {
      question: "What two things does a data contract cover, beyond just column names and types?",
      answer:
        "Schema (names, types, nullability) and semantics: what each field actually means, such as units, whether a status is a fixed enum, and whether rows are append-only or updatable in place.",
    },
    {
      question: "Why is silent schema drift more dangerous than a schema change that breaks a query outright?",
      answer:
        "A broken query fails loudly and gets fixed immediately. A semantic change that doesn't change the column's name or type (for example, redefining what a status value means, or changing a unit) runs through the pipeline without error, producing quietly wrong results that can go unnoticed for weeks.",
    },
    {
      question: "What does a schema registry enforce, and at what point in the data flow?",
      answer:
        "It enforces compatibility rules (backward or forward compatibility with existing consumers) at write time, before a message is published to a stream, rejecting incompatible schema changes before they ever reach downstream consumers.",
    },
    {
      question: "How does a CI schema-diff check on a producer's PR change where a breaking change is caught?",
      answer:
        "It catches the breaking change at the producer's pull request, before the change merges and ships, instead of after it ships when a downstream consumer's pipeline fails or silently produces wrong data in production.",
    },
    {
      question: "What's the distinguishing feature of contract testing compared to a generic schema diff check?",
      answer:
        "The consumer explicitly publishes their own expectations (specific fields, nullability, allowed values) and those are run against the producer's actual output in the producer's CI, rather than the producer only checking their schema against its own prior version with no visibility into what consumers actually rely on.",
    },
    {
      question: "Why does contract testing shift the cost of a breaking change toward the person who introduced it?",
      answer:
        "The failure surfaces as a CI failure on the producer's own pull request, visible to the person making the change with full context of what they changed, instead of surfacing later as a production incident that an unrelated downstream team has to diagnose from scratch.",
    },
  ],
};
