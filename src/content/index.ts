import type { Course } from "./types";
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

export const sparkCourse: Course = {
  id: "spark-delta-streaming",
  title: "Spark, Delta Lake & Structured Streaming",
  shortDescription: "Interview-ready depth on shuffles, joins, skew, Delta internals, and streaming semantics.",
  topics: [
    narrowVsWide,
    joinStrategies,
    partitioningFileSizing,
    skewAndSalting,
    predicatePartitionPruning,
    cachingVsCheckpointing,
    watermarksStateEviction,
    exactlyOnceIdempotency,
    deltaLogMerge,
    schemaEnforcementEvolution,
  ],
};

export const courses: Course[] = [sparkCourse];

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
