import type { Topic } from "../types";

export const textToSqlAndAgenticEtl: Topic = {
  id: "text-to-sql-and-agentic-etl",
  title: "Text-to-SQL and agentic ETL",
  shortDescription: "LLMs that write SQL and plan transformations still run entirely on top of your data engineering.",
  sections: [
    {
      heading: "What text-to-SQL actually does",
      paragraphs: [
        "A text-to-SQL system takes a natural-language question, looks at a description of the available tables and columns, and asks a language model to produce a SQL query that answers the question. The query then runs against the warehouse like any other query, and the result is returned to the user, often with the model summarizing it in prose.",
        "The model is not reasoning about your business from first principles. It is pattern-matching a question against whatever schema, column names, and sample values it was given in its prompt or retrieved from a catalog. Its output is only as good as that context.",
      ],
    },
    {
      heading: "Why this still depends on data engineering",
      paragraphs: [
        "A table named fct_orders with columns like order_id, customer_id, and order_status gives a model something to work with. A table named t3 with columns c1 through c9 does not, no matter how capable the model is. Text-to-SQL does not remove the need for clean, descriptive schemas; it raises the cost of not having them, because now a schema's shortcomings produce silently wrong answers instead of a confused analyst asking a colleague.",
        "The same is true of semantic documentation: column comments, table descriptions, and known join keys. A model given only raw DDL will guess at ambiguous columns, such as a status column with undocumented codes or two timestamp columns where it is unclear which one represents business time versus system time. Those are exactly the ambiguities a human analyst would ask about before writing the query; the model usually just picks one and moves on.",
      ],
    },
    {
      heading: "From a single query to agentic ETL",
      paragraphs: [
        "Agentic ETL extends the same idea from one query to a multi-step task. Instead of a human writing a fixed DAG of transformation steps, an agent is given a goal (for example, 'reconcile these two tables and produce a report of mismatches') and a set of tools: query execution, schema inspection, and sometimes the ability to write and run transformation code. The agent plans the steps, executes them, inspects intermediate results, and adjusts if a step fails or returns something unexpected.",
        "This trades a predetermined pipeline for one planned at runtime. It is useful for ad hoc or exploratory work where writing a fixed DAG for every variation would be wasteful. It is a poor fit for pipelines that need to run identically every day, where a fixed, version-controlled DAG with explicit tests remains the better tool, because an agent's plan can legitimately differ from one run to the next even with the same prompt.",
      ],
      warning:
        "An agent that silently falls back to a wrong join key when the intended one is ambiguous will produce a plausible, wrong result with no error, unlike a hardcoded pipeline that would fail a schema check instead.",
    },
  ],
  examplesToAttach: [
    "A text-to-SQL query that produced a wrong result because a column was ambiguously named, alongside the fix (renaming or documenting the column).",
    "A comparison of a fixed ETL DAG and an agent-planned equivalent for the same reconciliation task.",
  ],
  selfTest: [
    {
      question: "Why does text-to-SQL accuracy depend heavily on column and table naming?",
      answer:
        "The model has no access to your business logic beyond what is in its prompt or retrieved context. Descriptive names and documented semantics let it map a question to the right columns; cryptic names force it to guess, often producing a query that runs without error but answers the wrong question.",
    },
    {
      question: "Does text-to-SQL reduce the need for good data modeling? Why or why not?",
      answer:
        "No, it increases the cost of bad modeling. A human analyst facing an ambiguous schema usually asks a clarifying question. A model usually picks a plausible interpretation and produces a confident, wrong answer with no visible error.",
    },
    {
      question: "What is agentic ETL, and how does it differ from a traditional DAG-based pipeline?",
      answer:
        "Agentic ETL has an LLM agent plan and execute a sequence of data transformation steps toward a goal at runtime, inspecting results and adjusting as it goes, rather than a human authoring a fixed, predetermined sequence of steps ahead of time.",
    },
    {
      question: "When is agentic ETL a poor fit, and why?",
      answer:
        "For pipelines that must run identically and reliably every day, such as scheduled production reporting. A fixed, version-controlled DAG with explicit tests gives reproducible behavior; an agent's plan can vary run to run even for the same input, which is unacceptable when correctness and repeatability are requirements.",
    },
    {
      question: "An agent-generated query returns a result with no error, but the result is wrong. What's the likely failure mode?",
      answer:
        "The agent most likely resolved an ambiguity, such as a join key, a status code, or which of two timestamp columns to use, by picking a plausible default rather than flagging the ambiguity, since SQL execution succeeding does not mean the query's logic was correct.",
    },
  ],
};
