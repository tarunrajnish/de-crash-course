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

export interface Topic {
  id: string;
  title: string;
  shortDescription: string;
  animation?: string;
  animationCaption?: string;
  sections: ContentSection[];
  videos?: VideoLink[];
  examplesToAttach?: string[];
  selfTest: SelfTestQuestion[];
}

export interface Course {
  id: string;
  title: string;
  shortDescription: string;
  topics: Topic[];
}
