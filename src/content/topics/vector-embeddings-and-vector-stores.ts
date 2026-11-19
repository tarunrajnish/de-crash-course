import type { Topic } from "../types";

export const vectorEmbeddingsAndVectorStores: Topic = {
  id: "vector-embeddings-and-vector-stores",
  glossary: ["Embedding", "Vector store", "ANN", "HNSW", "Cosine similarity"],
  title: "Vector embeddings and vector stores",
  shortDescription: "Dense vectors that capture semantic similarity, and the approximate-search infrastructure built to query them at scale.",
  sections: [
    {
      heading: "What an embedding actually is",
      paragraphs: [
        "An embedding is a fixed-length vector of floating-point numbers, typically a few hundred to a few thousand dimensions, produced by a model that maps some input (text, an image, audio) into a space where geometric distance corresponds to semantic similarity.",
        "Two sentences with similar meaning end up as vectors that are close together (by cosine similarity or Euclidean distance), even if they share almost no words in common. That's the property traditional keyword indexes can't give you: a search for \"cheap flights to Tokyo\" can match a document that says \"affordable airfare to Japan\" because the embeddings are close, not because any token matches.",
        "Critically, an embedding is only comparable to other embeddings produced by the same model and the same version of it. Two vectors produced by different embedding models, or different versions of the same model, are not guaranteed to share a coordinate system, and comparing them directly produces meaningless distances.",
      ],
    },
    {
      heading: "Why vector databases exist: approximate nearest neighbor search",
      paragraphs: [
        "A traditional index (a B-tree, a hash index) answers exact-match or range queries efficiently. Similarity search asks a fundamentally different question: given a query vector, find the k vectors in the collection closest to it. A brute-force answer means computing a distance to every stored vector, which doesn't scale past a few hundred thousand vectors at acceptable latency.",
        "Vector databases instead build an approximate nearest neighbor (ANN) index, trading a small amount of recall for a large speedup. Two common index families are HNSW (Hierarchical Navigable Small World), a graph structure where search walks progressively finer layers toward the query point, and IVF (Inverted File Index), which clusters vectors into partitions and only searches the handful of partitions closest to the query.",
        "This is why a vector store is a genuinely different piece of infrastructure, not just a database with a new column type: it needs index-build jobs, tunable recall/latency trade-off parameters (like HNSW's `ef_search`), and its own strategy for handling inserts and deletes without rebuilding the entire index.",
      ],
      table: {
        caption: "Exact vs. approximate search",
        headers: ["", "Exact (brute-force) search", "ANN index (HNSW / IVF)"],
        rows: [
          ["Guarantee", "Always returns the true top-k", "Returns the true top-k with high but not 100% probability"],
          ["Query cost", "Linear in collection size", "Sub-linear, roughly logarithmic for HNSW"],
          ["Build cost", "None", "Index-build time, grows with collection size and parameters"],
          ["Typical use", "Small collections, offline evaluation", "Production retrieval at scale"],
        ],
      },
    },
    {
      heading: "The data engineering problem: embeddings are derived data",
      paragraphs: [
        "An embedding is not a primary source of truth; it's a derived artifact of the source text (or image, etc.) run through a specific model. That means it inherits all the usual derived-data problems: it goes stale when the source changes, and it needs to be reproducible if the derivation pipeline changes.",
        "Re-embedding cost is the sharpest version of this. If a team upgrades from one embedding model to a newer, better one, every vector in the store was produced by the old model and is no longer comparable to vectors produced by the new one for new queries. The entire collection, which can be hundreds of millions of chunks for a large document set, has to be re-embedded and re-indexed before the new model can be used in production. This is a real, often underestimated compute and time cost, not a config change.",
        "Keeping embeddings in sync with their source is the other half: if a source document is edited or deleted, its stale embedding sitting in the vector index will keep getting retrieved and presented as current, unless there's a pipeline that detects the change and re-embeds (or tombstones) the corresponding vector.",
      ],
      warning:
        "Teams sometimes treat an embedding model swap as a drop-in upgrade, deploy it, and get worse retrieval quality in production than before, because queries are now embedded with the new model while the stored document vectors are still from the old one. Mixing embedding model versions in the same similarity search silently produces nonsense distances.",
    },
  ],
  example: {
    title: "Find vectors that no longer match their source",
    description: "Treat each indexed chunk as derived data tied to a document version and embedding-model version.",
    table: {
      headers: ["Source document", "Active index entry", "Required action"],
      rows: [
        ["Policy v3", "Policy v2", "Re-embed v3 and replace active v2 chunks"],
        ["Guide v1", "Guide v1", "Keep the current entry"],
        ["FAQ deleted", "FAQ v4 still present", "Delete or tombstone its indexed chunks"],
      ],
    },
    takeaway: "A healthy similarity index can still return obsolete evidence. Propagate source updates and deletes, and rebuild consistently when the embedding model changes.",
  },
  selfTest: [
    {
      question: "Why can't you directly compare an embedding produced by model A to one produced by model B?",
      answer:
        "Each embedding model defines its own coordinate space during training; there's no guarantee two different models (or even two versions of the same model) place semantically similar inputs at comparable distances from each other. Mixing them produces distances with no meaningful interpretation.",
    },
    {
      question: "Why does similarity search need a different kind of index than a B-tree or hash index?",
      answer:
        "Those indexes answer exact-match or range queries. Similarity search asks for the k closest vectors to a query vector by distance, which brute force would require comparing against every stored vector. B-trees and hash indexes have no notion of geometric distance to exploit.",
    },
    {
      question: "What's the fundamental trade-off an ANN index like HNSW or IVF makes?",
      answer:
        "It trades perfect recall for speed: it returns an approximation of the true top-k nearest neighbors, correct with high probability but not guaranteed, in exchange for sub-linear query time instead of scanning the whole collection.",
    },
    {
      question: "A team upgrades their embedding model and deploys it, encoding new queries with the new model but leaving the existing vector index untouched. What goes wrong?",
      answer:
        "Query vectors are now produced by the new model while stored document vectors are still from the old model. Comparing embeddings across model versions produces meaningless distances, so retrieval quality degrades even though the new model is individually better. The whole collection needs re-embedding and re-indexing before the new model can be used.",
    },
    {
      question: "Why is an embedding described as 'derived data,' and what operational problem does that framing highlight?",
      answer:
        "An embedding is computed from a source document via a model; it is not itself a source of truth. Like any derived table, it goes stale when the source changes and must be reproducible from the source and a recorded model version. The operational problem is keeping the embedding in sync with edits or deletions to its source, and knowing which model version produced each stored vector.",
    },
  ],
};
