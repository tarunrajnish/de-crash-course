import type { ComparisonTable, Topic } from "../content/types";

export const READING_TIME_DESCRIPTION =
  "Estimated at 200 words/minute, rounded up per topic. Includes written lessons and self-tests; excludes videos and practice time. Opened topics count as read.";

function tableText(table?: ComparisonTable): string[] {
  return table ? [table.caption ?? "", ...table.headers, ...table.rows.flat()] : [];
}

export function estimatedReadingMinutes(topic: Topic): number {
  const example = topic.example;
  const text = [
    topic.title,
    topic.shortDescription,
    ...topic.sections.flatMap(section => [
      section.heading,
      ...section.paragraphs,
      section.warning ?? "",
      ...tableText(section.table),
    ]),
    ...(example ? [
      example.title,
      example.description,
      example.takeaway,
      ...tableText(example.table),
      ...(example.steps?.flatMap(step => [step.label, step.detail]) ?? []),
    ] : []),
    ...topic.selfTest.flatMap(question => [question.question, question.answer ?? ""]),
  ].join(" ");
  return Math.ceil((text.match(/\S+/g)?.length ?? 0) / 200);
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  return remainder ? `${hours} h ${remainder} min` : `${hours} h`;
}

export function readingTimeLabel(remainingMinutes: number, totalMinutes: number): string {
  return `Est. ${formatMinutes(remainingMinutes)} remaining / ${formatMinutes(totalMinutes)} total`;
}
