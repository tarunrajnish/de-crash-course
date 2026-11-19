import type { Topic } from "../types";

export const dataProductOwnershipAndDelivery: Topic = {
  id: "data-product-ownership-and-delivery",
  glossary: ["Data product", "Acceptance criteria", "SLO", "Architectural decision", "Data contract"],
  title: "Data-product ownership and pragmatic technical leadership",
  shortDescription: "Owning source-to-consumer outcomes, negotiating contracts across teams, and delivering in safe, measurable increments.",
  sections: [
    {
      heading: "Define the product's promise and accountable owner",
      paragraphs: [
        "A reliable data product has named consumers, a documented grain and meaning, a supported interface, quality and freshness objectives, an access policy, and a support owner. End-to-end ownership includes discovery, design, delivery, operation, cost, and eventual deprecation.",
        "Agree acceptance criteria with consumers before building: which decisions depend on the data, which totals must reconcile, how late updates behave, and what happens during an outage. A table becomes useful when consumers can depend on its semantics and operational contract.",
      ],
    },
    {
      heading: "Make cross-team dependencies explicit",
      paragraphs: [
        "Agree producer and consumer responsibilities for schema changes, source availability, deletion requests, incident notification, and backfills. Record contact groups and escalation paths. Coordinate breaking changes through versioned contracts and a migration window with measurable completion criteria.",
        "Use short design reviews to expose disagreements about ownership, identifiers, event time, and business definitions. Record consequential architectural decisions with constraints, alternatives, evidence, expected cost, and conditions for revisiting them. Include platform, security, source-system, and consuming teams when their boundaries are affected.",
      ],
    },
    {
      heading: "Choose a safe delivery slice",
      paragraphs: [
        "Deliver a small source-to-consumer path with explicit limitations and measurable acceptance criteria. For example, a daily validated orders table may satisfy an initial reporting need while a later release adds CDC after a low-latency requirement is demonstrated.",
        "Classify risks by impact and reversibility. Access restrictions, protection of sensitive data, and prevention of irreversible corruption belong in the first release. Broader automation or a generalized framework can wait when a supported manual step is adequate. Track deferred work with an owner and a review trigger.",
        "When a deadline conflicts with scope, negotiate coverage, freshness, or rollout size explicitly. Use a staged rollout, limited consumers, or a shadow output to reduce risk. Communicate residual limitations and recovery arrangements before consumers depend on the result.",
      ],
    },
    {
      heading: "Demonstrate ownership in an interview",
      paragraphs: [
        "Explain the consumer need, your responsibility, the constraints, the alternatives considered, and the outcome. Use evidence such as reconciled totals, a reduction in failed runs, cost per successful load, or recovery time. Distinguish your contribution from the team's work and include a decision you revised after feedback.",
        "Describe how another engineer can operate the system: runbooks, service identities, reviewed code, dashboards, and a clear escalation path. A sustainable handover includes a recovery exercise and consumer acceptance, with ownership remaining explicit after launch.",
      ],
      warning: "An undocumented compromise can become a permanent consumer assumption. Record limitations such as missing deletes or delayed corrections in the contract and revisit them before expanding usage.",
    },
  ],
  example: {
    title: "A tiny orders data-product contract",
    description: "A finance team needs yesterday's order lines for its morning revenue report. These agreements make the first release usable and supportable.",
    table: {
      headers: ["Decision", "Agreed value"],
      rows: [
        ["Consumer and grain", "Finance report; one row per order line"],
        ["Freshness SLO", "Previous day published by 06:15 UTC"],
        ["Quality gate", "Unique order_line_id; totals reconcile to source"],
        ["Owner", "Orders data team; on-call group handles incidents"],
        ["Change policy", "Publish v2 alongside v1 until consumers migrate"],
      ],
    },
    takeaway: "A daily batch is a valid first release when it meets the agreed deadline. Real-time CDC can wait for a demonstrated consumer need.",
  },
  selfTest: [
    { question: "What does end-to-end ownership include after a successful launch?", answer: "Monitoring, support, incident recovery, consumer communication, cost management, contract evolution, and eventual deprecation, with named responsibility throughout." },
    { question: "How do you handle a producer's breaking schema change?", answer: "Agree a compatible transition or versioned contract, assess downstream impact, assign migration owners, validate outputs, and retire the old interface after consumers have moved." },
    { question: "How do you balance engineering rigor with a tight deadline?", answer: "Protect high-impact correctness and security boundaries, reduce scope or freshness requirements with consumers, stage the rollout, and assign explicit owners and review triggers to deferred work." },
    { question: "What makes an ownership interview example credible?", answer: "A specific consumer problem, clear personal responsibility, explicit trade-offs, cross-team decisions, measurable outcomes, and evidence that the system remained operable after delivery." },
  ],
};
