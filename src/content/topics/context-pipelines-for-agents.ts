import type { Topic } from "../types";

export const contextPipelinesForAgents: Topic = {
  id: "context-pipelines-for-agents",
  title: "Context pipelines: ETL for a new consumer",
  shortDescription: "Feeding an AI agent reliable, fresh context is the same extract-transform-load problem with a new destination.",
  sections: [
    {
      heading: "The problem: what does an agent actually see",
      paragraphs: [
        "An AI agent answering a question or taking an action does not see your whole data estate. It sees whatever text was placed into its context window: retrieved documents, tool schemas describing what it can call, rows returned from a prior query, or a system prompt describing available data. Everything the agent 'knows' at query time is whatever was extracted, shaped, and delivered into that context.",
        "If that context is stale, incomplete, or wrong, the agent's output is stale, incomplete, or wrong, with the same fluent confidence either way. An agent answering from a document retrieved six months ago has no built-in way to know the underlying data has since changed, unless the pipeline feeding it is built to prevent that.",
      ],
    },
    {
      heading: "This is extract, transform, load with a new destination",
      paragraphs: [
        "Classic ETL extracts data from a source of truth, transforms it into a shape a downstream consumer (a dashboard, a report, an application) can use, and loads it somewhere that consumer can read. A context pipeline for an agent extracts from a source of truth (a document store, a database, a knowledge base), transforms it into chunks, embeddings, or structured tool-call results, and loads it into whatever the agent reads at inference time: a vector index, a retrieval API, or a prompt template.",
        "Retrieval-augmented generation (RAG) is the transform-and-load step of this pipeline applied to unstructured text: chunking documents, embedding them, and indexing them for retrieval. The same engineering discipline that applies to a nightly batch job, idempotent runs, schema validation, monitoring for silent failures, applies to this pipeline too; an embedding index that silently stopped updating a month ago is no different in kind from a dashboard built on a table that silently stopped loading.",
      ],
    },
    {
      heading: "Freshness and tool schemas as data contracts",
      paragraphs: [
        "A tool schema given to an agent (a function name, parameters, and description) is a contract in the same sense that an API or a table schema is a contract: if it drifts from what the underlying system actually does, the agent will call it incorrectly with no runtime error, because the call itself may still succeed, it will just return the wrong thing or affect the wrong resource.",
        "Freshness matters more for agents than for most dashboards, because an agent may take an action, not just display a number. An agent that places a reorder based on a stale inventory count, or approves a request based on an outdated policy document, has caused a real-world effect that a stale dashboard number would not.",
      ],
      warning:
        "A retrieval index that updates daily but a policy document that changes hourly means an agent can act on guidance that was already superseded, with no indication in its context that anything is out of date.",
    },
  ],
  examplesToAttach: [
    "A diagram of a RAG pipeline (source, chunking/embedding, index, retrieval) labeled with its ETL equivalents.",
    "An incident where an agent acted on stale retrieved context, and the freshness-monitoring fix.",
  ],
  selfTest: [
    {
      question: "In what sense is a RAG pipeline the same kind of problem as a classic ETL pipeline?",
      answer:
        "Both extract from a source of truth, transform the data into a shape the consumer can use (chunks and embeddings versus aggregated tables), and load it into a place the consumer reads from at the moment it needs it (a vector index versus a BI tool). The consumer differs; the pipeline's structure and failure modes do not.",
    },
    {
      question: "Why is staleness in an agent's context arguably more dangerous than staleness in a dashboard?",
      answer:
        "A stale dashboard shows a human a wrong number, who may notice something looks off before acting on it. An agent can take an automated action, such as placing an order or approving a request, directly from stale context, producing a real-world effect with no human review in between.",
    },
    {
      question: "What engineering discipline from batch ETL applies directly to a context/retrieval pipeline?",
      answer:
        "Idempotent runs, schema and content validation, and monitoring for silent failures all apply unchanged. An embedding index that silently stopped refreshing is the same category of failure as a table that silently stopped loading.",
    },
    {
      question: "Why does a tool schema given to an agent function like a data contract?",
      answer:
        "If the schema's description drifts from what the tool actually does or returns, the agent will call it with no runtime error (the call still succeeds), but the agent will act on the wrong assumption about what that call means, the same way a consumer silently breaks when an API or table schema changes underneath it.",
    },
    {
      question: "Give a concrete failure mode caused by mismatched freshness between a retrieval index and its source.",
      answer:
        "An index of company policy documents refreshed daily, while the underlying policy changes hourly, means an agent can confidently cite and act on a policy that was already superseded, since nothing in its retrieved context signals that it's out of date.",
    },
  ],
};
