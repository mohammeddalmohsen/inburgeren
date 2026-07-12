import { z } from 'zod';

export const SupportedYearSchema = z.union([z.literal(2023), z.literal(2024), z.literal(2025)]);

export const OptionSchema = z.object({
  label: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1),
});

export const EvidenceStatusSchema = z.enum(['documented', 'answer-key-only', 'missing-source']);

export const ExampleSchema = z.object({
  id: z.string().min(1),
  year: SupportedYearSchema,
  questionNo: z.number().int().positive(),
  sectionId: z.string().min(1).optional(),
  title: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  correctOption: z.enum(['A', 'B', 'C', 'D']).nullable(),
  options: z.array(OptionSchema),
  mode: z.enum(['multiple-choice', 'self-check']),
  evidence: z.string().min(1),
  pair: z.string().min(1),
  meaning: z.string().min(1),
  transformationType: z.string().min(1),
  skill: z.enum(['synonyms', 'negation', 'cause-effect', 'grammar-transform', 'inference-summary']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  explanation: z.string().min(1),
  source: z.object({
    label: z.string().min(1),
    url: z.string().min(1),
    evidencePage: z.number().int().positive().nullable(),
    questionPage: z.number().int().positive().nullable(),
  }),
});

export const ExamplesSchema = z.array(ExampleSchema).min(1);

export const ExamOptionSchema = OptionSchema;

export const ExamQuestionSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  question: z.string().min(1),
  options: z.array(ExamOptionSchema),
  correctOption: z.enum(['A', 'B', 'C', 'D']).nullable(),
  answer: z.string().min(1).optional(),
  selfCheck: z.boolean().optional(),
  explanation: z.string().min(1).optional(),
  evidence: z.string().min(1).optional(),
  evidenceStatus: EvidenceStatusSchema.optional(),
  evidenceText: z.string().min(1).optional(),
  evidencePage: z.number().int().positive().optional(),
  evidenceSource: z.string().min(1).optional(),
  sourceDocumentId: z.string().min(1).optional(),
  explanationAr: z.string().min(1).optional(),
  wrongOptionExplanations: z.record(z.enum(['A', 'B', 'C', 'D']), z.string().min(1)).optional(),
});

export const ExamSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  text: z.string(),
  pdfPageStart: z.number().int().positive().nullable(),
  pdfPages: z.array(z.number().int().positive()),
  questions: z.array(ExamQuestionSchema),
});

export const ExamModelSchema = z.object({
  id: z.string().min(1),
  year: SupportedYearSchema,
  title: z.string().min(1),
  kind: z.literal('official'),
  status: z.enum(['complete', 'partial']),
  statusNote: z.string().min(1).optional(),
  sourceUrl: z.string().min(1),
  answerSourceUrl: z.string().min(1),
  questionCount: z.number().int().positive(),
  officialQuestionCount: z.number().int().positive().optional(),
  sections: z.array(ExamSectionSchema).min(1),
});

export const ExamModelsSchema = z.array(ExamModelSchema).min(1);

export const SourceDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  year: SupportedYearSchema.nullable(),
  category: z.literal('official-exam'),
  description: z.string().min(1),
  sourceUrl: z.string().min(1),
  answerUrl: z.string().min(1).optional(),
  interactiveModelId: z.string().min(1).optional(),
  status: z.enum(['complete', 'partial', 'document']),
});

export const SourceDocumentsSchema = z.array(SourceDocumentSchema).min(1);

export type Example = z.infer<typeof ExampleSchema>;
export type Option = z.infer<typeof OptionSchema>;
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;
export type ExamOption = z.infer<typeof ExamOptionSchema>;
export type ExamQuestion = z.infer<typeof ExamQuestionSchema>;
export type ExamSection = z.infer<typeof ExamSectionSchema>;
export type ExamModel = z.infer<typeof ExamModelSchema>;
export type SourceDocument = z.infer<typeof SourceDocumentSchema>;
export type Skill = Example['skill'];
export type Level = Example['level'];
