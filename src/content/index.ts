import type { Course } from "./types";
import { whatIsSpark } from "./topics/what-is-spark";
import { rddVsDataframe } from "./topics/rdd-vs-dataframe";
import { jobStageTask } from "./topics/job-stage-task";
import { whatIsDeltaLake } from "./topics/what-is-delta-lake";
import { acidOnADataLake } from "./topics/acid-on-a-data-lake";
import { narrowVsWide } from "./topics/narrow-vs-wide";
import { joinStrategies } from "./topics/join-strategies";
import { partitioningFileSizing } from "./topics/partitioning-file-sizing";
import { skewAndSalting } from "./topics/skew-and-salting";
import { predicatePartitionPruning } from "./topics/predicate-partition-pruning";
import { cachingVsCheckpointing } from "./topics/caching-vs-checkpointing";
import { watermarksStateEviction } from "./topics/watermarks-state-eviction";
import { exactlyOnceIdempotency } from "./topics/exactly-once-idempotency";
import { deltaLogMerge } from "./topics/delta-log-merge";
import { schemaEnforcementEvolution } from "./topics/schema-enforcement-evolution";
import { olapVsOltp } from "./topics/olap-vs-oltp";
import { starVsSnowflakeSchema } from "./topics/star-vs-snowflake-schema";
import { factVsDimensionTables } from "./topics/fact-vs-dimension-tables";
import { slowlyChangingDimensions } from "./topics/slowly-changing-dimensions";
import { columnarVsRowStorage } from "./topics/columnar-vs-row-storage";
import { dagsAndIdempotentDesign } from "./topics/dags-and-idempotent-design";
import { backfillsAndReprocessing } from "./topics/backfills-and-reprocessing";
import { schedulingVsEventDriven } from "./topics/scheduling-vs-event-driven";
import { orchestratorsAirflowDagsterPrefect } from "./topics/orchestrators-airflow-dagster-prefect";
import { dataContractsAndDependencies } from "./topics/data-contracts-and-dependencies";
import { dataObservabilityPillars } from "./topics/data-observability-pillars";
import { schemaRegistriesAndContracts } from "./topics/schema-registries-and-contracts";
import { assertionBasedTesting } from "./topics/assertion-based-testing";
import { anomalyDetectionInPipelines } from "./topics/anomaly-detection-in-pipelines";
import { lineageAndIncidentResponse } from "./topics/lineage-and-incident-response";
import { parquetInternals } from "./topics/parquet-internals";
import { lakehouseTableFormats } from "./topics/lakehouse-table-formats";
import { compactionAndSmallFiles } from "./topics/compaction-and-small-files";
import { lakehouseVsWarehouseVsLake } from "./topics/lakehouse-vs-warehouse-vs-lake";
import { catalogsAndInterop } from "./topics/catalogs-and-interop";
import { featureStores } from "./topics/feature-stores";
import { batchVsStreamingFeatures } from "./topics/batch-vs-streaming-features";
import { vectorEmbeddingsAndVectorStores } from "./topics/vector-embeddings-and-vector-stores";
import { ragPipelineDataEngineering } from "./topics/rag-pipeline-data-engineering";
import { dataEngineeringForFineTuning } from "./topics/data-engineering-for-fine-tuning";
import { textToSqlAndAgenticEtl } from "./topics/text-to-sql-and-agentic-etl";
import { semanticLayersForAi } from "./topics/semantic-layers-for-ai";
import { contextPipelinesForAgents } from "./topics/context-pipelines-for-agents";
import { governanceAndProvenanceForAi } from "./topics/governance-and-provenance-for-ai";
import { whereDataEngineeringIsHeading } from "./topics/where-data-engineering-is-heading";
import { parsingUnstructuredDocuments } from "./topics/parsing-unstructured-documents";
import { hybridSearchAndReranking } from "./topics/hybrid-search-and-reranking";
import { buildingARetrievalEvalSet } from "./topics/building-a-retrieval-eval-set";
import { exposingPipelinesAsAgentTools } from "./topics/exposing-pipelines-as-agent-tools";
import { agentLoopsAndToolCalling } from "./topics/agent-loops-and-tool-calling";
import { platformArchitectureAndIncrementalIngestion } from "./topics/platform-architecture-and-incremental-ingestion";
import { databricksSqlAndPyspark } from "./topics/databricks-sql-and-pyspark";
import { unityCatalogAndAccessControls } from "./topics/unity-catalog-and-access-controls";
import { performanceCostAndCapacity } from "./topics/performance-cost-and-capacity";
import { dataPipelineCicdAndPromotion } from "./topics/data-pipeline-cicd-and-promotion";
import { reusableAndTestedDataEngineering } from "./topics/reusable-and-tested-data-engineering";
import { productionSupportAndRootCauseAnalysis } from "./topics/production-support-and-root-cause-analysis";
import { dataProductOwnershipAndDelivery } from "./topics/data-product-ownership-and-delivery";

export const sparkDeltaBasicsCourse: Course = {
  id: "spark-delta-basics",
  title: "Spark & Delta Lake basics",
  shortDescription: "Distributed processing, Spark APIs, and Delta Lake transactions.",
  topics: [whatIsSpark, rddVsDataframe, jobStageTask, whatIsDeltaLake, acidOnADataLake],
};

export const transformationsJoinsCourse: Course = {
  id: "transformations-joins-skew",
  title: "Joins, partitioning & skew",
  shortDescription: "Transformations, shuffles, join strategies, and balanced partitions.",
  topics: [narrowVsWide, joinStrategies, partitioningFileSizing, skewAndSalting],
};

export const pushdownCachingCourse: Course = {
  id: "pushdown-and-caching",
  title: "Predicate pushdown & caching",
  shortDescription: "Skip unnecessary reads and reuse work with caching and checkpoints.",
  topics: [predicatePartitionPruning, cachingVsCheckpointing],
};

export const deltaStreamingInternalsCourse: Course = {
  id: "delta-streaming-internals",
  title: "Delta internals & streaming",
  shortDescription: "Watermarks, delivery guarantees, transaction logs, and schema evolution.",
  topics: [watermarksStateEviction, exactlyOnceIdempotency, deltaLogMerge, schemaEnforcementEvolution],
};

export const dataModelingWarehousingCourse: Course = {
  id: "data-modeling-warehousing",
  title: "Data modeling & warehousing",
  shortDescription: "Table grain, star schemas, dimensions, and analytical storage.",
  topics: [olapVsOltp, starVsSnowflakeSchema, factVsDimensionTables, slowlyChangingDimensions, columnarVsRowStorage],
};

export const orchestrationAndPipelinesCourse: Course = {
  id: "orchestration-and-pipelines",
  title: "Orchestration & pipeline design",
  shortDescription: "DAGs, safe retries, backfills, scheduling, and data contracts.",
  topics: [
    dagsAndIdempotentDesign,
    backfillsAndReprocessing,
    schedulingVsEventDriven,
    orchestratorsAirflowDagsterPrefect,
    dataContractsAndDependencies,
  ],
};

export const dataQualityObservabilityCourse: Course = {
  id: "data-quality-observability",
  title: "Data quality & observability",
  shortDescription: "Validation, freshness, anomaly detection, and incident lineage.",
  topics: [
    dataObservabilityPillars,
    schemaRegistriesAndContracts,
    assertionBasedTesting,
    anomalyDetectionInPipelines,
    lineageAndIncidentResponse,
  ],
};

export const lakehouseStorageFormatsCourse: Course = {
  id: "lakehouse-storage-formats",
  title: "Lakehouse storage & file formats",
  shortDescription: "Parquet, open table formats, compaction, and shared catalogs.",
  topics: [
    parquetInternals,
    lakehouseTableFormats,
    compactionAndSmallFiles,
    lakehouseVsWarehouseVsLake,
    catalogsAndInterop,
  ],
};

export const aiFeatureEmbeddingPipelinesCourse: Course = {
  id: "ai-feature-embedding-pipelines",
  title: "AI features & embeddings",
  shortDescription: "Feature stores, vector search, RAG pipelines, and training data.",
  topics: [
    featureStores,
    batchVsStreamingFeatures,
    vectorEmbeddingsAndVectorStores,
    ragPipelineDataEngineering,
    dataEngineeringForFineTuning,
  ],
};

export const aiDataEngineeringFrontierCourse: Course = {
  id: "ai-de-frontier",
  title: "AI agents & data engineering",
  shortDescription: "Agentic ETL, semantic layers, context pipelines, and AI governance.",
  topics: [
    textToSqlAndAgenticEtl,
    semanticLayersForAi,
    contextPipelinesForAgents,
    governanceAndProvenanceForAi,
    whereDataEngineeringIsHeading,
  ],
};

export const retrievalSystemsAndAgentToolsCourse: Course = {
  id: "retrieval-systems-and-agent-tools",
  title: "Retrieval & agent tooling",
  shortDescription: "Document parsing, hybrid search, retrieval evals, and MCP tools.",
  topics: [
    parsingUnstructuredDocuments,
    hybridSearchAndReranking,
    buildingARetrievalEvalSet,
    exposingPipelinesAsAgentTools,
    agentLoopsAndToolCalling,
  ],
};

export const databricksAndPlatformArchitectureCourse: Course = {
  id: "databricks-and-platform-architecture",
  title: "Databricks & architecture",
  shortDescription: "Batch and CDC pipelines, SQL, PySpark, access controls, and cost.",
  topics: [
    platformArchitectureAndIncrementalIngestion,
    databricksSqlAndPyspark,
    unityCatalogAndAccessControls,
    performanceCostAndCapacity,
  ],
};

export const productionEngineeringAndOwnershipCourse: Course = {
  id: "production-engineering-and-ownership",
  title: "Production & ownership",
  shortDescription: "CI/CD, testing, reusable frameworks, support, and technical leadership.",
  topics: [
    dataPipelineCicdAndPromotion,
    reusableAndTestedDataEngineering,
    productionSupportAndRootCauseAnalysis,
    dataProductOwnershipAndDelivery,
  ],
};

export const courses: Course[] = [
  sparkDeltaBasicsCourse,
  transformationsJoinsCourse,
  pushdownCachingCourse,
  deltaStreamingInternalsCourse,
  dataModelingWarehousingCourse,
  orchestrationAndPipelinesCourse,
  dataQualityObservabilityCourse,
  lakehouseStorageFormatsCourse,
  aiFeatureEmbeddingPipelinesCourse,
  aiDataEngineeringFrontierCourse,
  retrievalSystemsAndAgentToolsCourse,
  databricksAndPlatformArchitectureCourse,
  productionEngineeringAndOwnershipCourse,
];

export function findCourse(courseId: string): Course | undefined {
  return courses.find((c) => c.id === courseId);
}

export function findTopic(courseId: string, topicId: string): { course: Course; topic: Course["topics"][number] } | undefined {
  const course = findCourse(courseId);
  if (!course) return undefined;
  const topic = course.topics.find((t) => t.id === topicId);
  if (!topic) return undefined;
  return { course, topic };
}
