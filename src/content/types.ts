import type { GlossaryTerm } from "./glossary";

export interface ComparisonTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface ContentSection {
  heading: string;
  paragraphs: string[];
  table?: ComparisonTable;
  warning?: string;
}

export interface VideoLink {
  title: string;
  url: string;
}

export interface SelfTestQuestion {
  question: string;
  answer?: string;
}

export type WorkedExample = {
  title: string;
  description: string;
  takeaway: string;
} & (
  | { table: ComparisonTable; steps?: never }
  | { steps: { label: string; detail: string }[]; table?: never }
);

export interface Topic {
  id: string;
  title: string;
  shortDescription: string;
  glossary: GlossaryTerm[];
  animation?: string;
  animationCaption?: string;
  sections: ContentSection[];
  videos?: VideoLink[];
  example?: WorkedExample;
  selfTest: SelfTestQuestion[];
}

export interface Course {
  id: string;
  title: string;
  shortDescription: string;
  topics: Topic[];
}
