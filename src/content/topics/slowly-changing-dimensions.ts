import type { Topic } from "../types";

export const slowlyChangingDimensions: Topic = {
  id: "slowly-changing-dimensions",
  glossary: ["SCD", "SCD type 1", "SCD type 2", "Effective-date range", "Natural key"],
  title: "Slowly changing dimensions (SCD types 0, 1, and 2)",
  shortDescription: "A customer moves, a product gets renamed: the three standard answers to 'what do we do about it.'",
  sections: [
    {
      heading: "The problem",
      paragraphs: [
        "A dimension attribute (a customer's address, a product's category) can change after it's first recorded. The question an SCD type answers is: when that happens, does the warehouse overwrite the old value, or keep both the old and new value visible?",
        "The choice has real analytical consequences. If a customer moves region and historical orders are re-attributed to their new region, a regional sales trend over time quietly rewrites history that was true at the time each order happened.",
      ],
    },
    {
      heading: "Type 0: never change",
      paragraphs: [
        "The attribute is fixed once recorded and never updated, even if the real-world value changes. This is rare and reserved for attributes that are meant to represent a point-in-time fact permanently, such as the original signup channel.",
      ],
    },
    {
      heading: "Type 1: overwrite",
      paragraphs: [
        "The old value is simply replaced with the new one. There is no history: every historical fact joined to this dimension now reflects the current value, not the value at the time the fact occurred.",
        "This is the right choice when history doesn't matter for that attribute, for example correcting a typo in a customer's name, where there's no analytical value in preserving the misspelled version.",
      ],
    },
    {
      heading: "Type 2: add a new row",
      paragraphs: [
        "A new row is inserted for the changed record, with effective-date (and often end-date) columns marking which row was active when. The old row is kept, typically marked as no longer current, rather than overwritten.",
        "This preserves history: a fact that occurred before the change still joins to the dimension row that was true at that time, as long as the join uses the effective-date range rather than just the natural key.",
      ],
      table: {
        caption: "SCD types compared",
        headers: ["Type", "History preserved", "Typical use"],
        rows: [
          ["0", "N/A, value frozen forever", "A fact meant to be permanent, like original signup channel"],
          ["1", "No, old value is lost", "Corrections, typos, attributes where history is irrelevant"],
          ["2", "Yes, via new rows with effective dates", "Attributes where historical accuracy matters (region, tier, category)"],
        ],
      },
    },
    {
      heading: "The join mistake that breaks type 2",
      paragraphs: [
        "Joining facts to a type 2 dimension on the natural key alone (customer_id, with no effective-date filter) returns every historical version of that customer as separate matching rows, duplicating every fact that customer touched once per version of their dimension row.",
        "The correct join also filters on the effective-date range, so each fact matches exactly the one dimension row that was active when the fact occurred.",
      ],
      warning: "Forgetting the effective-date filter on a type 2 dimension join silently multiplies fact rows once per historical version of the matched dimension record.",
    },
  ],
  selfTest: [
    {
      question: "A customer's address changes and you want historical orders to still show their old address at the time. Which SCD type, and why?",
      answer: "Type 2. It preserves the old dimension row with an effective-date range, so a fact joined using that range still resolves to the address that was true when the order happened.",
    },
    {
      question: "Why is type 1 wrong for a customer's sales region if you run region-over-time trend reports?",
      answer: "Type 1 overwrites the old region, so every historical order immediately reflects the customer's current region instead of the region they were actually in at order time, distorting any historical regional trend.",
    },
    {
      question: "A type 2 dimension join on customer_id alone, with no effective-date filter, returns 3 rows for one order that should match exactly one customer. What happened?",
      answer: "The customer has had 3 historical versions recorded (3 rows sharing that customer_id in the dimension), and without an effective-date filter the join matches the order to all of them instead of just the one active at order time.",
    },
  ],
};
