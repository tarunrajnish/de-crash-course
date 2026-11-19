import type { Topic } from "../types";

export const schemaEnforcementEvolution: Topic = {
  id: "schema-enforcement-evolution",
  glossary: ["Schema enforcement", "Schema evolution", "mergeSchema", "overwriteSchema"],
  title: "Schema enforcement vs. schema evolution",
  shortDescription: "Delta's default safety behavior, and the two explicit ways to opt out of it per write.",
  sections: [
    {
      heading: "Enforcement is the default",
      paragraphs: [
        "Schema enforcement rejects any write whose schema doesn't match the target table's schema: a missing column, an extra column, or a type mismatch all cause the write to fail rather than silently coercing or dropping data.",
        "This is what stops an upstream mistake, such as a producer accidentally sending a renamed or mistyped column, from quietly corrupting a production table. The failure happens at write time, loudly, instead of showing up later as bad data in a downstream report.",
      ],
    },
    {
      heading: "Two explicit ways to opt out",
      paragraphs: [
        "mergeSchema permits additive schema evolution: a write can introduce new columns that the target table doesn't yet have, and Delta adds them to the schema rather than rejecting the write.",
        "overwriteSchema replaces the table's schema outright with whatever the incoming write defines. This is meant for a deliberate full redefinition of a table, not routine evolution, since it can silently drop columns that aren't in the new write.",
      ],
      table: {
        caption: "Enforcement opt-outs",
        headers: ["Option", "Effect", "Typical use"],
        rows: [
          ["(default, neither set)", "Reject any schema mismatch", "Every production write, by default"],
          ["mergeSchema = true", "Add new columns found in the write", "A new field was added upstream and should flow through"],
          ["overwriteSchema = true", "Replace the table's schema entirely", "A deliberate, full redefinition of the table's structure"],
        ],
      },
    },
    {
      heading: "Why enforcement should stay on",
      paragraphs: [
        "Enforcement with evolution flags used explicitly per write, rather than globally disabling enforcement, keeps the safe default intact while still allowing legitimate schema changes to go through on purpose. A global disable removes the protection for every write to the table, not just the one that needed an exception.",
      ],
      warning: "Disabling enforcement globally to unblock one write removes the safety net for every other write to that table.",
    },
  ],
  example: {
    title: "Adding a column differs from replacing a schema",
    description: "Existing nullable columns: order_id, amount, currency. Incoming data contains order_id, amount, coupon instead.",
    table: {
      headers: ["Write choice", "Resulting schema", "Effect"],
      rows: [
        ["Default append", "Unchanged", "Reject the new coupon column"],
        ["Append with mergeSchema", "order_id, amount, currency, coupon", "Keep currency; incoming rows have NULL currency"],
        ["Overwrite with overwriteSchema", "order_id, amount, coupon", "Replace data and schema; currency disappears"],
      ],
    },
    takeaway: "Allowing an additive column and replacing an entire table schema are different operations. Choose the write mode and evolution option together, then validate consumers.",
  },
  selfTest: [
    {
      question: "A write adds a new column that the target Delta table doesn't have. What happens by default, and what flag changes that?",
      answer: "By default the write is rejected, since the column doesn't match the existing schema. Setting mergeSchema to true allows the new column to be added additively.",
    },
    {
      question: "When is overwriteSchema appropriate, and why is it riskier than mergeSchema?",
      answer: "It's appropriate for a deliberate, full redefinition of a table's structure. It's riskier because it replaces the schema outright and can silently drop columns that exist in the table but not in the new write.",
    },
    {
      question: "Why shouldn't schema enforcement be disabled globally just to allow one evolving write through?",
      answer: "A global disable removes the protection for every write to that table, not only the one that needed to evolve the schema, leaving the table exposed to any future mistyped or malformed write.",
    },
  ],
};
