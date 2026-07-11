import rawExams from '../data/exams.json';
import rawDocuments from '../data/documents.json';

export interface ExamOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface ExamQuestion {
  id: string;
  number: number;
  question: string;
  options: ExamOption[];
  correctOption: 'A' | 'B' | 'C' | 'D' | null;
  answer?: string;
  selfCheck?: boolean;
  explanation?: string;
  evidence?: string;
}

export interface ExamSection {
  id: string;
  title: string;
  text: string;
  pdfPageStart: number | null;
  pdfPages: number[];
  questions: ExamQuestion[];
}

export interface ExamModel {
  id: string;
  year: number;
  title: string;
  kind: 'official';
  status: 'complete' | 'partial';
  statusNote?: string;
  sourceUrl: string;
  answerSourceUrl: string;
  questionCount: number;
  officialQuestionCount?: number;
  sections: ExamSection[];
}

export interface SourceDocument {
  id: string;
  title: string;
  year: number | null;
  category: 'official-exam' | 'practice' | 'collection' | 'techniques';
  description: string;
  sourceUrl: string;
  answerUrl?: string;
  interactiveModelId?: string;
  status: 'complete' | 'partial' | 'document';
}

export const examModels = rawExams as ExamModel[];
export const sourceDocuments = rawDocuments as SourceDocument[];

export const examModelById = new Map(examModels.map((exam) => [exam.id, exam]));

export function findSectionForExample(year: number, title: string) {
  const model = examModels.find((exam) => exam.year === year);
  return model?.sections.find((section) => section.title === title) ?? null;
}
