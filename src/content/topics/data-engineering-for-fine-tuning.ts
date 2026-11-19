import type { Topic } from "../types";

export const dataEngineeringForFineTuning: Topic = {
  id: "data-engineering-for-fine-tuning",
  glossary: ["Fine-tuning", "Deduplication", "MinHash", "LSH", "Decontamination", "Data mix"],
  title: "Data engineering for fine-tuning datasets",
  shortDescription: "Deduplication, decontamination, and source mixing: the same lineage and versioning problems, applied to training data.",
  sections: [
    {
      heading: "Deduplication at scale",
      paragraphs: [
        "A fine-tuning or pretraining corpus assembled from scraped web pages, internal documents, and licensed datasets will contain exact and near-duplicate text, often far more than teams expect. The same article gets mirrored across sites, the same boilerplate appears in thousands of documents, and internal wikis accumulate copy-pasted sections.",
        "Exact duplicates are cheap to find (hash each document and drop repeats), but near-duplicates, two documents that differ by a few words or formatting, are the harder and more impactful case. Left in the corpus, they bias the model toward over-weighting whatever content happened to be duplicated, and in the worst case let the model memorize and regurgitate a duplicated passage verbatim rather than learning a general pattern from it.",
        "At the scale of a large corpus, exact hashing doesn't catch near-duplicates, so teams use approximate techniques like MinHash with locality-sensitive hashing (LSH) to find documents that are highly similar without doing an all-pairs comparison, which would be computationally infeasible past a few million documents.",
      ],
    },
    {
      heading: "Decontamination",
      paragraphs: [
        "Decontamination means ensuring that none of your evaluation or test data (or data that's suspiciously similar to it) has leaked into the training set. If a benchmark question, or a near-paraphrase of it, appears in training data, a model's strong score on that benchmark reflects memorization rather than the capability the benchmark is meant to measure.",
        "This is a direct training-data analogue of the same leakage concept that shows up in point-in-time correctness for feature stores: data that shouldn't have been visible at decision time (here, eval time) ends up influencing the outcome anyway. The fix is the same shape, too: explicit lineage tracking of which documents came from where, cross-referenced against a fixed, versioned list of eval sets, with near-duplicate detection run between the two, not just exact string matching.",
        "Decontamination has to run before training, not after, because by the time you've trained on contaminated data there is no way to selectively \"un-train\" the model on it. Catching it requires the same scale techniques as deduplication (MinHash/LSH-style similarity search between the training corpus and every eval set the model will ever be scored against).",
      ],
      warning:
        "A model that benchmarks suspiciously well on a widely-used public eval, better than much larger models, is a signal worth investigating rather than celebrating. It's exactly the pattern you'd see if that eval set, or close paraphrases of its questions, leaked into training data scraped from the public web.",
    },
    {
      heading: "Mixing and weighting across sources",
      paragraphs: [
        "A training set is rarely one source; it's a mixture of web text, code, books, internal documents, and licensed or synthetic data, combined in specific proportions (the \"data mix\"). The proportions matter: over-weighting one source skews the model's behavior toward that source's style and content, and under-weighting a source the model needs (domain-specific internal documents, for a company's internal model) leaves it weak exactly where it needs to be strong.",
        "Getting the mix right is an iterative, measured process, not a one-time decision: teams track what fraction of tokens came from each source, how that fraction changed between training runs, and how downstream eval metrics shifted in response, which only works if the pipeline records that lineage rather than producing one opaque merged file.",
      ],
    },
    {
      heading: "Why this is a data engineering problem, not just an ML problem",
      paragraphs: [
        "Deduplication, decontamination, and mixing are all instances of problems data engineers already solve for analytics data: deduplication is just dedup, decontamination is lineage tracking applied to a leakage concern, and mixing is just dataset versioning plus weighted sampling across sources.",
        "What's different is scale and consequence: a dedup bug in an analytics table produces a wrong aggregate you can recompute. A dedup or decontamination bug in a training corpus is baked into model weights after a training run that can cost from thousands to millions of dollars in compute, and the only fix is re-running that training on a corrected dataset, which is why lineage and versioning discipline matters even more here than in a typical warehouse pipeline.",
      ],
    },
  ],
  example: {
    title: "Keep repeats and benchmarks out of training",
    description: "These candidate decisions illustrate separate near-duplicate and evaluation-contamination checks.",
    table: {
      headers: ["ID / split", "Text", "Decision"],
      rows: [
        ["A / training", "Refunds are allowed within 30 days.", "Keep"],
        ["B / training", "Refunds allowed within 30 days!", "Near-duplicate of A: remove"],
        ["C / evaluation", "What is the refund window?", "Keep in held-out evaluation"],
        ["D / proposed training", "What is the refund window?", "Matches evaluation C: exclude"],
      ],
    },
    takeaway: "MinHash/LSH can propose near-duplicate candidates for validation. Cross-check training candidates against held-out evaluation data before training starts.",
  },
  selfTest: [
    {
      question: "Why isn't exact-hash deduplication enough for a large training corpus?",
      answer:
        "Exact hashing only catches identical documents. Most duplication in scraped or aggregated corpora is near-duplication, documents that differ by a few words, formatting, or boilerplate, which exact hashes won't match but which still bias the model toward over-represented content.",
    },
    {
      question: "What is decontamination, and why must it happen before training rather than after?",
      answer:
        "Decontamination is verifying that no evaluation or test data (or close paraphrases of it) leaked into the training set. It must happen before training because once a model has trained on contaminated data, there's no way to selectively remove that influence afterward; the only fix is retraining on a corrected dataset.",
    },
    {
      question: "A model scores unexpectedly well on a public benchmark compared to similarly-sized models. What should you suspect, and how would you check?",
      answer:
        "Benchmark contamination: the eval set, or paraphrases of its questions, may have leaked into the training corpus (plausible if the corpus includes general web scrapes). You'd check with near-duplicate similarity search (e.g., MinHash/LSH) between the training corpus and the benchmark's actual question set, not just exact string matching.",
    },
    {
      question: "How is decontamination conceptually similar to point-in-time correctness in a feature store?",
      answer:
        "Both are leakage problems: point-in-time correctness prevents a model from training on feature values that wouldn't have been known yet at prediction time; decontamination prevents a model from training on data that's supposed to be reserved for evaluating it. In both cases, information that shouldn't be visible at decision time leaks in and makes performance look better than it really is.",
    },
    {
      question: "Why does getting the training data mix wrong matter, and why is it an iterative process rather than a single decision?",
      answer:
        "Over- or under-weighting a source skews model behavior toward or away from that source's content and style, and the right proportions aren't knowable in advance. Teams track token fractions per source across runs and compare them against downstream eval shifts, adjusting the mix based on measured outcomes, which requires the pipeline to preserve per-source lineage rather than merging everything into one opaque file.",
    },
    {
      question: "Why does the same class of bug (dedup, lineage) carry more consequence in a training pipeline than in an analytics pipeline?",
      answer:
        "An analytics bug produces a wrong aggregate that can simply be recomputed once fixed. A dedup or decontamination bug in a training corpus gets baked into model weights by a training run that may cost significant compute, so correcting it means re-running that expensive training on a fixed dataset, not just rerunning a cheap query.",
    },
  ],
};
