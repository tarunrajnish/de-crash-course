import type { Topic } from "../types";

export const hybridSearchAndReranking: Topic = {
  id: "hybrid-search-and-reranking",
  title: "Hybrid search and reranking",
  shortDescription: "Why pure cosine similarity misses exact matches, and the two-stage retrieve-then-rerank pattern that fixes it.",
  sections: [
    {
      heading: "Where pure vector search falls short",
      paragraphs: [
        "Dense vector search finds semantically similar chunks even when the wording differs completely, which is exactly what makes it powerful. But that same property is a weakness for queries that depend on an exact token: a product code, an error message, a person's name, or a specific API method name.",
        "An embedding model trained on general semantic similarity has no special incentive to preserve exact-string distinctions. A query for \"error code E4521\" can retrieve chunks about unrelated error codes that are semantically similar in surrounding phrasing, while the one chunk containing the literal exact string \"E4521\" doesn't necessarily rank at the top, because the model is matching meaning, not characters.",
        "Keyword (lexical) search, the kind built on an inverted index like BM25, is the inverse: it's excellent at exact and near-exact term matches but blind to synonyms and paraphrasing. Neither approach alone covers both cases well.",
      ],
    },
    {
      heading: "Hybrid search: running both and fusing the results",
      paragraphs: [
        "Hybrid search runs a vector similarity query and a keyword query against the same chunk collection in parallel, then combines the two ranked lists into one. A common fusion method is Reciprocal Rank Fusion (RRF), which scores each result by the inverse of its rank in each list, so a chunk that ranks highly in either search contributes strongly to the final score, without needing the two systems' raw scores (which live on different scales) to be directly comparable.",
        "This is additive, not a trade-off: a hybrid system keeps vector search's ability to match on meaning while recovering keyword search's reliability on exact terms, codes, and names, at the cost of running and maintaining two indexes instead of one.",
      ],
      table: {
        caption: "Vector vs. keyword vs. hybrid",
        headers: ["", "Vector (dense)", "Keyword (BM25)", "Hybrid"],
        rows: [
          ["Catches paraphrasing / synonyms", "Yes", "No", "Yes"],
          ["Catches exact codes, names, IDs", "Unreliable", "Yes", "Yes"],
          ["Index types needed", "ANN index", "Inverted index", "Both"],
          ["Typical fusion", "N/A", "N/A", "Reciprocal Rank Fusion"],
        ],
      },
    },
    {
      heading: "Reranking: a second, more expensive pass",
      paragraphs: [
        "Both vector and keyword retrieval are built for speed at scale: they narrow millions of chunks down to a shortlist (say, the top 50) using cheap approximate methods. A reranker takes that shortlist and re-scores it with a much more expensive but more accurate model, typically a cross-encoder that looks at the query and each candidate chunk together, rather than comparing independently-computed vectors.",
        "A cross-encoder can't run against millions of chunks directly (the cost scales with every query-chunk pair it has to jointly score), which is exactly why it only runs on the pre-filtered shortlist from the first stage. The two-stage pattern, cheap broad retrieval followed by expensive precise reranking, is standard because it gets both speed and accuracy instead of having to pick one.",
        "Reranking consistently improves ordering within the shortlist, surfacing the most genuinely relevant chunks at the very top, which matters more than it sounds: most downstream context budgets only use the top handful of results, so getting the top 3-5 right is worth more than getting the top 50 roughly right.",
      ],
      warning: "Adding a reranker without first measuring retrieval with an evaluation set is a common mistake: a reranker can only reorder what the first-stage retrieval already found, so if the right chunk never makes the shortlist, no amount of reranking recovers it.",
    },
  ],
  examplesToAttach: [
    "A query that fails under pure vector search (an exact code or name) and succeeds once keyword search is added to the mix.",
    "A before/after ranking of the same shortlist with and without a reranker, for one query from your own evaluation set.",
  ],
  selfTest: [
    {
      question: "Why can a pure vector search system fail on a query for a specific error code or product ID, even though it handles paraphrased questions well?",
      answer:
        "An embedding model is trained to capture semantic similarity, not exact-string matching, so it has no special incentive to preserve a specific code or name as distinct from similar-sounding text. A chunk with semantically similar surrounding phrasing can rank above the one chunk that actually contains the exact literal string being searched for.",
    },
    {
      question: "What does Reciprocal Rank Fusion solve, and why not just average the raw scores from a vector search and a keyword search?",
      answer:
        "Vector similarity scores and keyword (BM25) scores live on different, incomparable scales, so averaging them directly isn't meaningful. RRF instead scores each result by the inverse of its rank within each list, letting a chunk that ranks well in either search contribute strongly to the combined ranking without needing the underlying scores to be comparable.",
    },
    {
      question: "Why does a reranker use a cross-encoder instead of just computing embeddings and comparing them, like the first retrieval stage does?",
      answer:
        "A cross-encoder looks at the query and a candidate chunk together as a joint input, which produces a more accurate relevance judgment than comparing two independently-computed vectors, but it's far more expensive per comparison. That cost is exactly why it only runs on a small pre-filtered shortlist rather than the full collection.",
    },
    {
      question: "Why can't a reranker fix a retrieval system where the genuinely relevant chunk never makes it into the first-stage shortlist?",
      answer:
        "A reranker only re-scores and reorders the candidates it's given; it never sees chunks outside that shortlist. If the first-stage retrieval (vector, keyword, or hybrid) fails to surface the relevant chunk among its top candidates, reranking has nothing to promote, since it only reorders, it doesn't discover.",
    },
  ],
};
