export interface Source {
  id: string;
  label: string;
  url: string;
  harvested: boolean;
  harvestedAt: string | null;
  version: string | null;
  bizTopic?: boolean;
}

export interface SourcesData {
  lastUpdated: string;
  sections: Record<string, Source[]>;
}

export interface Topic {
  id: string;
  label: string;
  sourceId: string;
  transcriptRefs: string[];
  readingMinutes: number;
}

export interface Module {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  type: 'technical' | 'business';
  order: number;
  topics: Topic[];
}

export interface CurriculumData {
  levels: string[];
  levelColors: Record<string, string>;
  modules: Module[];
}

export interface KBEntry {
  sourceId: string;
  label: string;
  url: string;
  content: string;
  mode: 'lesson' | 'kb';
  level: string;
  harvestedAt: string;
  error?: string;
}

export interface KnowledgeBaseData {
  entries: Record<string, KBEntry>;
}

export interface TranscriptChunk {
  id: string;
  title: string;
  timestamp: string;
  rawContent: string;
  analysis?: {
    studyNotes: string;
    tips: string;
    curriculumMap: string[];
    docRefs: string[];
    analyzedAt: string;
  };
}

export interface Transcript {
  id: string;
  title: string;
  source: string;
  chunks: TranscriptChunk[];
}

export interface TranscriptsData {
  transcripts: Transcript[];
}

export interface Progress {
  understood: Record<string, boolean>;
  lastStudied: Record<string, string>;
  recentlyViewed: string[];
}

export interface AnalysisResult {
  studyNotes: string;
  tips: string;
  curriculumMap: string[];
  docRefs: string[];
  analyzedAt: string;
  raw: string;
}

export interface AnalysesData {
  analyses: Record<string, AnalysisResult>;
}
