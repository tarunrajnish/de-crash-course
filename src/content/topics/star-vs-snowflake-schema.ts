import type { Topic } from "../types";

export const starVsSnowflakeSchema: Topic = {
  id: "star-vs-snowflake-schema",
  title: "Star schema vs. snowflake schema",
  shortDescription: "The two standard shapes for arranging facts and dimensions, and the normalization trade between them.",
  sections: [
    {
      heading: "Star schema",
      paragraphs: [
        "A star schema has one fact table in the center, directly joined to a set of denormalized dimension tables around it. Each dimension is flat: a product dimension holds the category and brand name directly, rather than pointing to separate category and brand tables.",
        "This shape gets its name from the join diagram: one fact table with dimension tables radiating out from it in a single layer, like points of a star.",
      ],
    },
    {
      heading: "Snowflake schema",
      paragraphs: [
        "A snowflake schema normalizes the dimensions themselves: the product dimension points to a separate category dimension, which might point to a separate department dimension, instead of storing the category and department directly on each product row.",
        "This removes redundant storage (a category's name is stored once in its own table instead of repeated on every product row), at the cost of more joins to answer the same question.",
      ],
      table: {
        caption: "Star vs. snowflake",
        headers: ["", "Star", "Snowflake"],
        rows: [
          ["Dimension shape", "Flat, denormalized", "Normalized into sub-dimensions"],
          ["Joins per query", "Fewer", "More"],
          ["Storage redundancy", "More (repeated attribute values)", "Less"],
          ["Typical choice", "Most analytical warehouses", "Very large, slow-changing dimensions"],
        ],
      },
    },
    {
      heading: "Why star usually wins in practice",
      paragraphs: [
        "Storage is cheap relative to query complexity for most modern warehouses, so the redundancy a star schema accepts rarely matters, while the extra joins a snowflake schema requires directly slow down every analytical query.",
        "Star schema is the default recommendation for most warehouses today; snowflaking is reserved for cases where a dimension is extremely large and the storage savings from normalizing it meaningfully matter.",
      ],
    },
  ],
  selfTest: [
    {
      question: "What's the core structural difference between a star and a snowflake schema?",
      answer:
        "A star schema keeps each dimension flat and denormalized, joined directly to the fact table. A snowflake schema normalizes dimensions into further sub-dimension tables, trading storage redundancy for additional joins.",
    },
    {
      question: "Why does star schema usually win over snowflake in modern warehouses?",
      answer:
        "Storage is cheap relative to compute and query latency, so the redundancy a star schema accepts rarely matters, while the extra joins a snowflake schema needs slow down every query that touches a normalized dimension.",
    },
  ],
};
