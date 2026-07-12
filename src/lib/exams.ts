import rawExams from '../data/exams.json';
import rawDocuments from '../data/documents.json';
import {
  ExamModelsSchema,
  SourceDocumentsSchema,
  type ExamModel,
  type ExamQuestion,
  type ExamSection,
  type SourceDocument,
} from './schema';

const parsedExams = ExamModelsSchema.safeParse(rawExams);
const parsedDocuments = SourceDocumentsSchema.safeParse(rawDocuments);

function validateExamModels(models: ExamModel[]): string[] {
  const issues: string[] = [];
  const modelIds = new Set<string>();
  const documentUrls = new Set(parsedDocuments.success ? parsedDocuments.data.map((doc) => doc.sourceUrl) : []);
  const answerUrls = new Set(parsedDocuments.success ? parsedDocuments.data.map((doc) => doc.answerUrl).filter(Boolean) : []);

  for (const model of models) {
    if (modelIds.has(model.id)) issues.push(`Duplicate exam model id: ${model.id}`);
    modelIds.add(model.id);
    if (!documentUrls.has(model.sourceUrl)) issues.push(`Missing source document for ${model.id}: ${model.sourceUrl}`);
    if (!answerUrls.has(model.answerSourceUrl)) issues.push(`Missing answer document for ${model.id}: ${model.answerSourceUrl}`);
    if (model.status === 'partial' && !model.statusNote) issues.push(`Partial model needs statusNote: ${model.id}`);

    const questionNumbers = new Set<number>();
    const actualQuestionCount = model.sections.reduce((sum, section) => sum + section.questions.length, 0);
    if (actualQuestionCount !== model.questionCount) {
      issues.push(`questionCount mismatch in ${model.id}: expected ${model.questionCount}, got ${actualQuestionCount}`);
    }

    for (const section of model.sections) {
      if (!section.text && !section.pdfPages.length) issues.push(`Section has no text or PDF page: ${section.id}`);
      for (const question of section.questions) {
        if (questionNumbers.has(question.number)) issues.push(`Duplicate question number in ${model.id}: ${question.number}`);
        questionNumbers.add(question.number);
        const labels = question.options.map((option) => option.label);
        if (question.correctOption && !question.selfCheck && !labels.includes(question.correctOption)) {
          issues.push(`Correct option missing from options: ${question.id}`);
        }
      }
    }
  }
  return issues;
}

export const examDataIssues = [
  ...(parsedExams.success ? [] : parsedExams.error.issues.map((issue) => issue.message)),
  ...(parsedDocuments.success ? [] : parsedDocuments.error.issues.map((issue) => issue.message)),
  ...(parsedExams.success ? validateExamModels(parsedExams.data) : []),
];

if (import.meta.env.DEV && examDataIssues.length) {
  console.warn('Exam data validation issues', examDataIssues);
}

export const examDataError = examDataIssues.length
  ? 'تعذر التحقق من بعض بيانات النماذج. راجع ملف البيانات قبل التدريب.'
  : null;

function withEvidenceMetadata(models: ExamModel[]): ExamModel[] {
  return models.map((model) => ({
    ...model,
    sections: model.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => ({
        ...question,
        evidenceStatus: question.evidence ? 'documented' : 'answer-key-only',
        evidencePage: question.evidencePage ?? section.pdfPageStart ?? undefined,
        evidenceSource: question.evidenceSource ?? model.sourceUrl,
      })),
    })),
  }));
}

export const examModels: ExamModel[] = parsedExams.success ? withEvidenceMetadata(parsedExams.data) : [];
export const sourceDocuments: SourceDocument[] = parsedDocuments.success ? parsedDocuments.data : [];

export const examModelById = new Map(examModels.map((exam) => [exam.id, exam]));

export function normalizeTitle(title: string): string {
  return title
    .toLocaleLowerCase('nl')
    .replace(/\s*[:：]\s*/g, ' ')
    .replace(/\b(huis- en gedragsregels|een goed idee of niet)\b/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function findSectionForExample(year: number, title: string, sectionId?: string) {
  const model = examModels.find((exam) => exam.year === year);
  if (!model) return null;
  if (sectionId) return model.sections.find((section) => section.id === sectionId) ?? null;
  const exact = model.sections.filter((section) => section.title === title);
  if (exact.length === 1) return exact[0];
  const normalizedTitle = normalizeTitle(title);
  const normalized = model.sections.filter((section) => normalizeTitle(section.title) === normalizedTitle);
  return normalized.length === 1 ? normalized[0] : null;
}

export type { ExamModel, ExamQuestion, ExamSection, SourceDocument };
