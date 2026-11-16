import type { Topic } from "../types";

export const schemaRegistriesAndContracts: Topic = {
  id: "schema-registries-and-contracts",
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
        "Backward compatibility means a new schema version can be read using the previous schema. This is the mode that protects existing consumers: a producer can add an optional field or remove a field that had a default, and consumers running the old schema keep working unchanged.",
        "Forward compatibility means data written with the new schema can be read using the next schema a consumer might adopt, even before that consumer upgrades. Full compatibility requires both directions simultaneously, which is the strictest and safest mode but also the most restrictive on what producers are allowed to change.",
      ],
      table: {
        caption: "Compatibility modes and what they allow",
        headers: ["Mode", "Guarantees", "Producer can", "Typical use"],
        rows: [
          ["Backward", "New schema readable with old schema", "Add optional field, remove field with default", "Consumers upgrade after producers"],
          ["Forward", "Old schema readable with new schema", "Remove optional field, add field with default", "Producers upgrade after consumers"],
          ["Full", "Both directions hold", "Only changes satisfying both", "Independent, uncoordinated upgrades on either side"],
        ],
      },
    },
    {
      heading: "What actually breaks, and why coordination fails",
      paragraphs: [
        "The two classic incidents are a field type change (an int that becomes a string, or vice versa) and a field removal without a default. Both are backward-incompatible: a consumer holding the old schema either fails to deserialize the new message or silently reads garbage, depending on the serialization format and how strict its error handling is.",
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
  examplesToAttach: [
    "A schema registry error from a blocked incompatible schema registration, showing which compatibility rule it violated.",
    "A data contract document or YAML definition from your own pipeline, showing owner, SLA, and schema fields.",
  ],
  selfTest: [
    {
      question: "A producer wants to remove a field that consumers never read. Under backward compatibility, is this safe?",
      answer:
        "Only if the field has a default value in the schema used to read it. Backward compatibility means new data must be readable with the old schema, so removing a field is safe for new-schema writers, but whether old consumers can later read data written without that field (forward direction) depends on the default being present.",
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
