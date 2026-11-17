import type { Topic } from "../types";

export const unityCatalogAndAccessControls: Topic = {
  id: "unity-catalog-and-access-controls",
  title: "Governance, access controls, and Unity Catalog",
  shortDescription: "Least privilege, workload identities, governed storage, lineage, and the limits of catalog enforcement.",
  sections: [
    {
      heading: "Governance needs ownership and enforceable policies",
      paragraphs: [
        "Data governance connects accountable owners to classification, retention, permitted uses, quality expectations, and access reviews. A catalog makes assets discoverable; policies and operating practices determine whether those assets are used appropriately.",
        "Unity Catalog organizes tables in a catalog.schema.table namespace and provides governance capabilities including grants, lineage, and auditability. Assign ownership to durable groups, use service principals for automated workloads, and separate administrative identities from routine readers and writers.",
      ],
    },
    {
      heading: "Grant the smallest useful scope",
      paragraphs: [
        "A Unity Catalog table reader typically needs USE CATALOG on the parent catalog, USE SCHEMA on the parent schema, and SELECT on the table. Grant privileges to groups and workload identities through reviewed configuration. Check inherited grants and ownership as well as direct grants when investigating effective access.",
        "Restrict production writes to deployment and runtime identities. Use row filters, column masks, or governed views where supported to enforce restrictions such as region-specific access or sensitive-field protection. Verify policies using representative consumer identities and the actual compute and connector paths they use.",
        "Keep credentials in a supported secret-management system, restrict outbound connectivity where appropriate, and avoid logging credentials or personal data. Catalog privileges do not replace cloud IAM, network controls, encryption, or secret rotation.",
      ],
    },
    {
      heading: "Govern storage paths as well as table names",
      paragraphs: [
        "Managed tables let the platform manage table storage lifecycle; external tables retain a separate storage lifecycle. Unity Catalog storage credentials and external locations govern supported access to external storage. Choose ownership and deletion responsibilities explicitly for either model.",
        "A user with direct cloud-object permissions may be able to read files outside the catalog-governed path and bypass policies applied by the query engine. Review storage IAM and external-location permissions together with table grants, and avoid handing out broad storage credentials to consumers.",
      ],
      warning: "A masked table view does not protect an unmasked export, a copied development dataset, or raw files accessible through separate cloud credentials. Follow sensitive data across every access path.",
    },
    {
      heading: "Lineage and audit logs answer different questions",
      paragraphs: [
        "Lineage explains which sources and transformations produced an asset and which consumers may be affected by a change. Audit records help establish who accessed or changed resources and when. Use both during investigations, while checking coverage and retention rather than assuming every external system is captured automatically.",
        "Review group membership and unused privileges periodically. Exercise access revocation, retention deletion, and incident-response procedures. A governance policy becomes reliable when an owner can demonstrate that the controls work for actual production identities.",
      ],
    },
  ],
  examplesToAttach: [
    "A least-privilege access matrix for analysts, ingestion jobs, transformation jobs, and deployment identities.",
    "An access test showing a denied sensitive-column read and a storage-IAM check for possible catalog bypass.",
  ],
  selfTest: [
    { question: "What privileges does a typical Unity Catalog table reader need?", answer: "USE CATALOG, USE SCHEMA, and SELECT on the relevant objects, obtained directly or through applicable grants. Effective access also depends on the environment and access path." },
    { question: "Why prefer a service principal for scheduled jobs?", answer: "It gives the workload a stable, separately reviewable identity whose permissions and lifecycle are independent of an employee's personal account." },
    { question: "Can table-level masking protect files read with independent cloud credentials?", answer: "The query-engine policy may not apply to direct object-storage reads. Restrict storage IAM and govern alternative access paths as well." },
    { question: "How do lineage and audit records differ?", answer: "Lineage describes data dependencies and derivation. Audit records describe recorded access and administrative activity. Their coverage and retention must be checked separately." },
  ],
};
