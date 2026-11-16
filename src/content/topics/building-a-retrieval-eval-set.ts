import type { Topic } from "../types";

export const buildingARetrievalEvalSet: Topic = {
  id: "building-a-retrieval-eval-set",
  title: "Building a retrieval evaluation set",
  shortDescription: "The 30-50 question set with known answers that turns retrieval tuning from guessing into measurement.",
  sections: [
    {
      heading: "Why \"it feels better\" isn't an answer",
      paragraphs: [
        "Changing chunk size, swapping an embedding model, adding hybrid search, adding a reranker, each of these changes retrieval behavior, and each one is tempting to judge by trying a few queries and eyeballing whether the results look right. That approach doesn't scale past a handful of changes and can't tell you whether a change that fixed one query quietly broke three others.",
        "An evaluation set fixes this by replacing vibes with a number: a fixed list of representative questions, each with a known correct answer (or the specific source chunk that should be retrieved), run against the system the same way every time a change is made. The result is a score you can compare across configurations, instead of a subjective impression.",
        "This is the same discipline as a regression test suite in software, or a held-out validation set in classical machine learning: a fixed, repeatable check that catches both improvements and regressions a change introduces.",
      ],
    },
    {
      heading: "What goes into the set",
      paragraphs: [
        "A useful eval set (often 30-50 questions is enough to start seeing signal) should cover the actual range of how the system gets used: simple factual lookups, questions requiring synonyms or paraphrasing rather than exact-term matches, questions that depend on a specific detail buried in a long document, and a few questions the system genuinely should fail or decline, to check it doesn't fabricate an answer when it has no good source.",
        "Each question needs a labeled correct answer: either the specific chunk (or chunks) that should be retrieved, the exact source document and location, or a reference answer a human agrees is correct. Without that label there's nothing to score against, retrieval metrics only exist relative to a known-correct target.",
        "Writing these by hand from real information needs (not made up on the spot) produces a much more representative set than generating synthetic questions from the documents themselves, since synthetic questions tend to mirror the document's own phrasing too closely, making retrieval look artificially easy.",
      ],
      warning: "An eval set built entirely from questions an engineer invents while looking directly at the source documents tends to overestimate real-world performance, because real questions are phrased by people who haven't read the source and don't know its exact wording.",
    },
    {
      heading: "Metrics: recall, precision, and rank",
      paragraphs: [
        "Recall@k asks: across the top k retrieved chunks, was the correct chunk present at all? This is the most important single metric for a RAG system, because if the right chunk never gets retrieved, no downstream reranking or generation step can recover from that.",
        "Precision@k asks the inverse: of the top k retrieved chunks, how many were actually relevant? A system can have perfect recall and poor precision, burying the right chunk among many irrelevant ones, which wastes context-window budget and can distract the generation step even when the answer is technically present.",
        "Mean Reciprocal Rank (MRR) measures how high the first relevant result ranks, averaged across all questions, rewarding systems that put the right chunk at or near position one rather than merely somewhere in the top k. Tracking recall, precision, and MRR together, rather than any single number, is what lets a specific change (say, adding a reranker) show exactly what it improved and what it didn't.",
      ],
    },
  ],
  examplesToAttach: [
    "Your own 30-50 question evaluation set with labeled correct chunks or answers, covering factual, paraphrased, and deliberately-unanswerable questions.",
    "A before/after metrics table (recall@5, precision@5, MRR) comparing two retrieval configurations on the same eval set.",
  ],
  selfTest: [
    {
      question: "Why does an evaluation set matter more than trying a few queries and judging the results by eye?",
      answer:
        "Manual spot-checking doesn't scale past a handful of changes and can't reveal whether a change that improved one query silently broke others. A fixed evaluation set with known-correct answers turns retrieval quality into a repeatable number that can be directly compared across configurations, the same discipline as a regression test suite.",
    },
    {
      question: "Why does an eval set need a mix of factual, paraphrased, and deliberately-unanswerable questions, rather than just straightforward lookups?",
      answer:
        "Straightforward factual questions only test exact or near-exact matching, missing failure modes like synonym handling or burying the answer in a long document. Deliberately unanswerable questions check a separate, important failure mode: whether the system fabricates a confident answer when no good source actually exists, rather than correctly declining or flagging uncertainty.",
    },
    {
      question: "Why does recall@k matter more as a foundational metric than precision@k for a RAG system specifically?",
      answer:
        "If the correct chunk is never retrieved at all (low recall), no later step, reranking, or generation can recover from that; the information simply isn't available to use. Precision matters for efficiency and avoiding distraction, but a system can only be as good as what it manages to retrieve in the first place.",
    },
    {
      question: "Why might an eval set written entirely by an engineer staring directly at the source documents overestimate real-world retrieval performance?",
      answer:
        "Questions written while looking at the documents tend to echo the document's own phrasing and structure too closely, making retrieval look easier than it is for real users, who ask questions in their own words without having read the source material first.",
    },
    {
      question: "What does Mean Reciprocal Rank measure that recall@k alone doesn't?",
      answer:
        "Recall@k only checks whether the correct chunk appears anywhere in the top k results. MRR specifically rewards the correct chunk appearing near the very top of the ranking (position one is ideal), capturing ranking quality rather than just presence-or-absence within a cutoff.",
    },
  ],
};
