import type { Topic } from "../types";

export const schemaRegistriesAndContracts: Topic = {
  id: "schema-registries-and-contracts",
  glossary: ["Schema registry", "Backward compatibility", "Forward compatibility", "Full compatibility", "Avro"],
  title: "Schema registries and data contracts",
  shortDescription: "How a central schema authority and compatibility rules stop a producer's change from silently breaking every consumer.",
  sections: [
    {
      heading: "What a schema registry actually does",
      paragraphs: [
        "A schema registry (Confluent Schema Registry is the canonical example for Kafka, but table-schema equivalents exist for warehouses and lakehouses) is a central service that stores every version of every schema used by a topic or table, and enforces compatibility rules before a new version is accepted.",
        "A producer serializing a record doesn't embed the full schema in every message; it registers the schema once and includes a small schema ID in each message. Consumers look up that ID to get the exact writer schema, which keeps messages small and gives every consumer an authoritative definition of what the fields mean, instead of inferring types from whatever bytes happen to show up.",
      ],
    },
    {
      heading: "Compatibility modes",
      paragraphs: [
        "Backward compatibility means a new reader schema can read data written with the previous writer schema. This supports upgrading consumers before producers. For Avro records, adding a field with a default lets a new reader fill that field when reading older data; removing a field lets a new reader ignore that field in older records.",
        "Forward compatibility means the previous reader schema can read data written with the new writer schema. This supports upgrading producers before consumers. For Avro records, old readers ignore newly added fields, while removing a field requires a default in the old reader schema. Full compatibility requires both directions. Exact allowed changes depend on the serialization format, and transitive modes check additional historical versions.",
      ],
      table: {
        caption: "Compatibility modes and what they allow",
        headers: ["Mode", "Guarantees", "Producer can", "Typical use"],
        rows: [
          ["Backward compatibility", "New readers can read old data", "Avro: add a field with a default or remove a field", "Consumers upgrade before producers"],
          ["Forward compatibility", "Old readers can read new data", "Avro: add a field or remove one whose old reader has a default", "Producers upgrade before consumers"],
          ["Full compatibility", "Both directions hold", "Only changes satisfying both for the format in use", "Either side can upgrade first for the checked versions"],
        ],
      },
    },
    {
      heading: "What actually breaks, and why coordination fails",
      paragraphs: [
        "Two classic incidents are an incompatible field type change and removing a field that an older reader still requires without a default. Whether a change fails backward, forward, or both compatibility checks depends on the writer and reader schemas and the serialization format. A consumer using an incompatible schema can fail to deserialize a record or misinterpret it if validation is bypassed.",
        "These changes almost never ship intentionally against a known contract; they ship because the producer team didn't know who the consumers were, or assumed a staging-environment test covered every downstream dependency. A registry with enforcement turned on rejects the incompatible schema at registration time, which converts a production incident discovered hours later into a build failure discovered in minutes.",
      ],
      warning:
        "A registry set to compatibility NONE, or run in permissive mode during an early project phase and never tightened, provides none of this protection; it stores schemas but doesn't stop a breaking one from being registered.",
    },
    {
      heading: "Contracts beyond the registry",
      paragraphs: [
        "A schema registry enforces structural compatibility: types, field presence, nullability. A data contract is a broader, often human-negotiated agreement that also covers semantics: what a field means, its valid range, its update cadence, and who to notify before a breaking change. A field can pass every registry check and still violate the contract, for example a status column that keeps its string type but silently adds a new enum value nothing downstream expects.",
        "In practice, mature teams pair the two: the registry is the automated enforcement layer for structure, and the contract is the documented, often contractually or organizationally binding agreement for everything structure alone can't capture.",
      ],
    },
  ],
  example: {
    title: "Check new Avro readers against old records",
    description: "Compatibility mode is BACKWARD. Old records have order_id and amount but no currency field.",
    table: {
      headers: ["Proposed reader change", "Reading old data", "Result"],
      rows: [
        ["Add currency with default USD", "Reader fills the missing field with USD", "Pass"],
        ["Add currency without a default", "Reader cannot fill the missing field", "Reject"],
        ["Remove an old legacy_note field", "Reader ignores the writer's extra field", "Pass"],
      ],
    },
    takeaway: "These are Avro reader/writer-resolution examples. Forward compatibility checks the opposite direction: old readers consuming data written with the new schema.",
  },
  selfTest: [
    {
      question: "A producer wants to remove a field that consumers never read. Under backward compatibility, is this safe?",
      answer:
        "For Avro, removal is backward-compatible because the new reader can ignore the old writer's extra field. Backward compatibility checks new readers against old data. Old readers consuming new data is the forward direction; they need a default for a removed field even if application code never uses that field. Validate the rules for the actual serialization format before deploying.",
    },
    {
      question: "Why does full compatibility restrict producers more than backward-only compatibility?",
      answer:
        "Full compatibility requires both backward and forward compatibility to hold simultaneously, so a change must be safe no matter which side (producer or consumer) upgrades first. Backward-only compatibility only needs to satisfy one direction, allowing a wider set of changes.",
    },
    {
      question: "A field changes from int to string and the registry has compatibility set to NONE. What happens?",
      answer:
        "The registry stores the new schema without checking it against prior versions, so the incompatible change is accepted. Consumers still running the old schema will fail to deserialize the field correctly, or silently misinterpret it, and this surfaces as a production incident rather than a blocked registration.",
    },
    {
      question: "Why does a schema registry include a schema ID in each message instead of the full schema?",
      answer:
        "Embedding the full schema in every message would bloat message size. Registering the schema once and referencing it by ID keeps messages compact while still giving every consumer a way to look up the exact writer schema used.",
    },
    {
      question: "Give an example of a change that passes every schema registry compatibility check but still breaks a contract.",
      answer:
        "Adding a new valid value to an existing string enum-like column. The type and nullability are unchanged, so the registry accepts it, but a downstream consumer with hardcoded logic over the old set of values (for example a case statement) doesn't know how to handle the new value.",
    },
    {
      question: "Why is enforcing compatibility at registration time better than catching the break with data observability later?",
      answer:
        "Registration-time enforcement rejects the incompatible schema before any message using it is ever produced, turning the problem into a build or deploy failure discovered immediately. Observability only detects the effects after bad data has already been produced and often already consumed downstream.",
    },
  ],
};
