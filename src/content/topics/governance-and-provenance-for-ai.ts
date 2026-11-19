import type { Topic } from "../types";

export const governanceAndProvenanceForAi: Topic = {
  id: "governance-and-provenance-for-ai",
  glossary: ["Provenance", "Lineage", "RAG", "Fine-tuning"],
  title: "Governance and provenance, extended to model outputs",
  shortDescription: "Classic lineage answers what fed a table. AI systems also need what fed this specific answer.",
  sections: [
    {
      heading: "What classic data lineage answers",
      paragraphs: [
        "Data lineage traditionally tracks table-to-table and column-to-column dependencies: this report's revenue figure was built from this aggregation, which was built from this cleaned table, which was built from this raw source. It answers 'what fed this number' after the fact, and 'what breaks if I change this upstream table' before making a change.",
        "This matters for debugging bad numbers, for impact analysis before schema changes, and increasingly for regulatory requirements that ask an organization to demonstrate where a reported figure came from.",
      ],
    },
    {
      heading: "The new question: what fed this model's output",
      paragraphs: [
        "An AI system introduces a question classic lineage was not built to answer: not just which tables fed a dashboard, but which documents, training examples, or retrieved context fed a specific generated answer. This matters for compliance (can you show a regulator what data informed a decision an AI system made), for debugging (why did the model produce this specific wrong answer), and for a right-to-be-forgotten request (if a person's data was used to train or fine-tune a model, can it meaningfully be removed from that model's behavior, not just from a source table).",
        "The right-to-be-forgotten case is genuinely harder than it is for a conventional database. Deleting a row from a source table is straightforward. Removing that row's influence from a model already trained on it, without retraining, is an open problem; this is a real limitation of current AI systems, not a solved detail, and provenance tracking at least makes it possible to know which models would need to be retrained or evaluated when a deletion request comes in.",
      ],
      warning:
        "Deleting a user's row from the source table does not remove its influence from a model that was already trained or fine-tuned on it; provenance tracking tells you which models are affected, it does not remove the data from them.",
    },
    {
      heading: "Extending lineage practically",
      paragraphs: [
        "For a RAG-based system, this extension is tractable today: log which documents or chunks were retrieved and included in the context for each generated response, the same way you'd log which rows fed a report. That log is what lets you answer 'what informed this specific answer' for any given output.",
        "For a fine-tuned or trained model, provenance is coarser: you can and should track which datasets and which versions of those datasets went into a training run, so that a later deletion or audit request at least identifies which models were built on affected data, even though removing that influence surgically is not yet a solved problem.",
      ],
    },
  ],
  selfTest: [
    {
      question: "What question does classic table-to-table data lineage answer, and what question does it not answer for AI systems?",
      answer:
        "It answers which upstream tables and columns fed a given number or report. It does not answer which specific documents, training examples, or retrieved context fed a specific AI-generated output, which is a distinct, finer-grained question.",
    },
    {
      question: "Why is a right-to-be-forgotten request harder to fulfill for a trained model than for a database row?",
      answer:
        "Deleting a row from a source table is straightforward. Removing that row's influence from a model already trained or fine-tuned on it, without retraining the model, is not currently a solved problem; provenance tracking can tell you which models are affected, but it cannot by itself remove the influence.",
    },
    {
      question: "For a RAG-based system, how would you implement practical provenance tracking?",
      answer:
        "Log which documents or chunks were retrieved and placed into the context for each generated response, the same way a lineage system logs which source rows fed a report, so any given output can be traced back to the specific context that produced it.",
    },
    {
      question: "What is the practical limit of provenance tracking for a fine-tuned model, as opposed to a RAG system?",
      answer:
        "You can track which datasets and dataset versions went into a training run, which tells you which models are affected by a later data change or deletion request, but you generally cannot surgically remove one data point's influence from an already-trained model without retraining it.",
    },
    {
      question: "Why does provenance for AI outputs matter for regulatory compliance specifically?",
      answer:
        "Regulations increasingly require an organization to demonstrate what data informed a reported figure or an automated decision. For AI-generated outputs, that requires tracing not just source tables but the specific context or training data behind a given answer, which classic table lineage alone does not capture.",
    },
  ],
};
