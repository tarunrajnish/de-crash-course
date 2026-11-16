import type { Course } from "../content/types";

const STORAGE_KEY = "de-crash-course-progress";

function readVisited(): Set<string> {
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

/** Marks a topic as read. Progress is stored locally in this browser only; there is no account or server-side sync. */
export function markVisited(courseId: string, topicId: string): void {
  const visited = readVisited();
  visited.add(key(courseId, topicId));
  writeVisited(visited);
}

export function isVisited(courseId: string, topicId: string): boolean {
  return readVisited().has(key(courseId, topicId));
}

export interface CourseProgress {
  visited: number;
  total: number;
}

export function courseProgress(course: Course): CourseProgress {
  const visited = readVisited();
  const count = course.topics.filter((t) => visited.has(key(course.id, t.id))).length;
  return { visited: count, total: course.topics.length };
}

export function overallProgress(courses: Course[]): CourseProgress {
  const visited = readVisited();
  let count = 0;
  let total = 0;
  for (const course of courses) {
    total += course.topics.length;
    count += course.topics.filter((t) => visited.has(key(course.id, t.id))).length;
  }
  return { visited: count, total };
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}
