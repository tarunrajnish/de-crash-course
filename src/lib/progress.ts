import type { Course } from "../content/types";
import { canonicalCourseId, courseAliases } from "../content";
import { estimatedReadingMinutes } from "./readingTime";

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
  remainingMinutes: number;
  totalMinutes: number;
}

export function courseProgress(course: Course): CourseProgress {
  return overallProgress([course]);
}

export function overallProgress(courses: Course[]): CourseProgress {
  const visited = readVisited();
  let count = 0;
  let total = 0;
  let remainingMinutes = 0;
  let totalMinutes = 0;
  for (const course of courses) {
    total += course.topics.length;
    for (const topic of course.topics) {
      const minutes = estimatedReadingMinutes(topic);
      totalMinutes += minutes;
      if (hasVisited(visited, course.id, topic.id)) count++;
      else remainingMinutes += minutes;
    }
  }
  return { visited: count, total, remainingMinutes, totalMinutes };
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}
