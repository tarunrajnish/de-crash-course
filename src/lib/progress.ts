import type { Course } from "../content/types";
import { canonicalCourseId, courseAliases } from "../content";

const STORAGE_KEY = "de-crash-course-progress";

function readVisited(): Set<string> {
  if (import.meta.env.SSR) return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function writeVisited(visited: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited]));
}

function key(courseId: string, topicId: string): string {
  return `${courseId}/${topicId}`;
}

function hasVisited(visited: Set<string>, courseId: string, topicId: string): boolean {
  const canonicalId = canonicalCourseId(courseId);
  return visited.has(key(canonicalId, topicId))
    || courseAliases.some(alias => alias.courseId === canonicalId
      && alias.topicIds.includes(topicId) && visited.has(key(alias.id, topicId)));
}

/** Marks a topic as read. Progress is stored locally in this browser only; there is no account or server-side sync. */
export function markVisited(courseId: string, topicId: string): void {
  if (import.meta.env.SSR) return;
  const visited = readVisited();
  visited.add(key(canonicalCourseId(courseId), topicId));
  writeVisited(visited);
}

export function isVisited(courseId: string, topicId: string): boolean {
  return hasVisited(readVisited(), courseId, topicId);
}

export interface CourseProgress {
  visited: number;
  total: number;
}

export function courseProgress(course: Course): CourseProgress {
  const visited = readVisited();
  const count = course.topics.filter((t) => hasVisited(visited, course.id, t.id)).length;
  return { visited: count, total: course.topics.length };
}

export function overallProgress(courses: Course[]): CourseProgress {
  const visited = readVisited();
  let count = 0;
  let total = 0;
  for (const course of courses) {
    total += course.topics.length;
    count += course.topics.filter((t) => hasVisited(visited, course.id, t.id)).length;
  }
  return { visited: count, total };
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}
