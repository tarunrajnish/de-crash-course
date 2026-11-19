import type { Topic } from "../types";

export const ragPipelineDataEngineering: Topic = {
  id: "rag-pipeline-data-engineering",
  glossary: ["RAG", "Chunk", "Embedding", "Context window", "Groundedness"],
  title: "The data engineering behind RAG pipelines",
  shortDescription: "Chunking, index freshness, and the new observability problem retrieval-augmented generation introduces.",
  sections: [
    {
      heading: "Chunking strategy",
      paragraphs: [
        "Retrieval-augmented generation retrieves relevant pieces of text and hands them to a language model as context, rather than relying only on what the model memorized during training. Those pieces come from splitting source documents into chunks before embedding, because embedding an entire long document into one vector loses most of its specific detail, and because a model's context window can only hold so much retrieved text.",
        "Chunk size is a genuine trade-off, not a tuning knob with one right answer. Chunks that are too small (a sentence or two) lose surrounding context, so a retrieved chunk might contain a pronoun or reference with no antecedent, confusing the model. Chunks that are too large dilute the embedding, averaging the semantic signal of several unrelated ideas into one vector, which hurts retrieval precision and wastes context-window budget on irrelevant text alongside the relevant part.",
        "Overlap between adjacent chunks (for example, repeating the last 50 tokens of one chunk at the start of the next) exists specifically to avoid cutting a relevant sentence or idea exactly at a chunk boundary, where neither chunk alone contains the complete thought a query is looking for.",
      ],
    },
    {
      heading: "Freshness of the retrieval index",
      paragraphs: [
        "A RAG system's retrieval index is a derived copy of the source documents, run through chunking and embedding. Like any derived table, it can lag behind its source: a policy document updated this morning is still represented by its pre-update chunks and embeddings in the index until a re-ingestion pipeline processes the change.",
        "This matters more in RAG than in most analytics pipelines because the consequence of staleness isn't a wrong number in a dashboard, it's a confidently-stated wrong answer generated from outdated context, with no obvious signal to the end user that anything is wrong. The retrieval pipeline needs the same change-data-capture discipline as any other derived dataset: detect source changes, re-chunk and re-embed only the affected documents, and update (or tombstone) the corresponding vectors.",
      ],
    },
    {
      heading: "The evaluation problem",
      paragraphs: [
        "Unlike a batch ETL job, a RAG pipeline doesn't fail loudly when retrieval quality degrades. The system still returns an answer; it's just built from the wrong (or missing) context, and a fluent-sounding wrong answer is harder to notice than a job that errors out or a null in a required column.",
        "This is a data-quality and observability problem applied to a new kind of pipeline: you need a way to measure whether the retrieved chunks were actually relevant to the query (retrieval precision/recall against a labeled evaluation set), and separately whether the final generated answer is grounded in the retrieved context rather than fabricated. Without both, a silent regression, for example caused by a chunking change, an embedding model swap, or a stale index, can ship and persist for weeks before anyone notices the answers have gotten worse.",
        "Treating this as a monitoring problem rather than a one-time eval means building a recurring evaluation set, tracking retrieval and groundedness metrics over time, and alerting on regressions the same way you'd alert on a broken upstream data pipeline.",
      ],
      warning:
        "A RAG system that passed its evaluation once at launch and is never re-evaluated will silently degrade as source documents change, the embedding model is updated, or the underlying LLM is swapped by a vendor. None of those produce an error; they produce subtly worse answers that nobody is watching for.",
    },
  ],
  example: {
    title: "Keep the answer-bearing sentence together",
    description: "Source: \"Refunds are accepted within 30 days with a receipt.\" The table shows two possible chunks returned to generation.",
    table: {
      headers: ["Chunking outcome", "Returned context", "Evidence available"],
      rows: [
        ["Boundary splits the rule", "Refunds are accepted ...", "Timing and condition missing"],
        ["Overlap retains the rule", "Refunds are accepted within 30 days with a receipt.", "Timing and receipt condition preserved"],
      ],
    },
    takeaway: "Overlap can preserve answer-bearing context. Compare configurations on labeled retrieval questions and check that generated claims stay supported by the returned chunks.",
  },
  selfTest: [
    {
      question: "Why does a RAG pipeline chunk documents instead of embedding each whole document as a single vector?",
      answer:
        "A single embedding for an entire long document averages together the semantic signal of many different ideas, losing the specific detail a query is looking for, and the model's context window can only hold a limited amount of retrieved text anyway, so smaller, targeted chunks retrieve more precisely and fit the context budget better.",
    },
    {
      question: "What problem does overlap between adjacent chunks solve?",
      answer:
        "It prevents a relevant sentence or idea from being split exactly at a chunk boundary, where neither chunk alone would contain the complete thought a query needs; repeating a bit of the end of one chunk at the start of the next preserves continuity across the cut.",
    },
    {
      question: "Why is index staleness more dangerous in a RAG system than in a typical analytics pipeline?",
      answer:
        "In analytics, staleness usually shows up as a visibly wrong or missing number. In RAG, a stale index still produces a fluent, confident-sounding answer built from outdated context, with no obvious signal to the user that the underlying information is out of date.",
    },
    {
      question: "Why doesn't a RAG pipeline 'fail loudly' when retrieval quality degrades, and what does that imply for how you operate it?",
      answer:
        "The system still generates an answer regardless of whether the retrieved context was actually relevant, so there's no error or crash to alert on. This implies you need ongoing evaluation, tracking retrieval precision/recall and answer groundedness over time against a labeled set, rather than a one-time launch eval, so regressions are caught the same way a broken pipeline would be.",
    },
    {
      question: "Name two distinct things a RAG evaluation should measure, and explain why one isn't enough.",
      answer:
        "Retrieval quality (were the retrieved chunks actually relevant to the query) and groundedness (is the generated answer actually supported by the retrieved context, rather than fabricated). A system can retrieve perfectly relevant chunks and still generate an answer that ignores them, or retrieve irrelevant chunks and still happen to generate a correct answer from the model's own knowledge; measuring only one hides failures in the other.",
    },
  ],
};
