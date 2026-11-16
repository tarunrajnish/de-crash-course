import type { Topic } from "../types";

export const factVsDimensionTables: Topic = {
  id: "fact-vs-dimension-tables",
  title: "Fact tables, dimension tables, and grain",
  shortDescription: "The two table types every warehouse schema is built from, and the one decision that determines everything else.",
  sections: [
    {
      heading: "Fact tables",
      paragraphs: [
        "A fact table holds the measurements: the numeric events a business wants to analyze, such as an order line, a page view, or a payment. Each row is typically a single occurrence of that event, plus foreign keys pointing to the dimensions that describe it.",
        "Fact tables are usually the largest tables in a warehouse by row count, since they grow with business activity, and are append-mostly: new rows arrive constantly, existing rows rarely change.",
      ],
    },
    {
      heading: "Dimension tables",
      paragraphs: [
        "A dimension table holds the descriptive context around a fact: who the customer was, what the product was, what date it happened on. These are the \"who, what, where, when\" that let a fact be sliced and filtered.",
        "Dimension tables are much smaller by row count than facts and change far less often, though some dimensions (like a customer's address) do change over time, which is what slowly changing dimensions exist to handle.",
      ],
    },
    {
      heading: "Grain is the first decision, not the last",
      paragraphs: [
        "Grain is the precise definition of what one row in the fact table represents: one order, one order line, one page view. Every other design decision, including which dimensions can attach and what aggregations are valid, follows from that one definition.",
        "Mixing grains in one fact table, for example some rows representing an order and others representing an order line, breaks aggregations silently: summing a measure across mixed grains double-counts or undercounts depending on which rows happen to be present.",
      ],
      warning: "A fact table with an unstated or inconsistent grain produces aggregates that are wrong in ways that don't show up until someone checks the totals by hand.",
    },
    {
      heading: "A worked example",
      paragraphs: [
        "An orders fact table at order-line grain has one row per (order, product) pair, with foreign keys to a customer dimension, a product dimension, and a date dimension, plus measures like quantity and line amount.",
        "Summing line amount across all rows for a customer gives their total spend correctly, because every row represents the same thing: one order line. If a few rows instead represented whole orders (with a pre-summed total), that same sum would double-count the lines inside those orders.",
      ],
    },
  ],
  selfTest: [
    {
      question: "What does \"grain\" mean for a fact table?",
      answer:
        "The precise definition of what a single row represents, for example one order line versus one whole order. It determines which dimensions and aggregations are valid for that table.",
    },
    {
      question: "Why is mixing grains in one fact table dangerous?",
      answer:
        "Aggregating a measure across rows that represent different things (for example some rows per order-line, others per whole order) silently double-counts or undercounts, since the same column no longer means the same thing in every row.",
    },
    {
      question: "Why are dimension tables usually much smaller than fact tables?",
      answer:
        "Dimensions describe the relatively stable context around events (customers, products, dates), while facts record every occurrence of an event itself, which accumulates continuously as the business operates.",
    },
  ],
};
