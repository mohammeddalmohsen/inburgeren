import { describe, expect, it } from 'vitest';
import { ExamModelsSchema } from './schema';
import { examModels, findSectionForExample, normalizeTitle, sourceDocuments } from './exams';

describe('exam model data', () => {
  it('contains the official years 2020 through 2025', () => {
    expect(examModels.map((model) => model.year)).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
  });

  it('contains every official question for 2020 through 2025', () => {
    const complete = examModels.filter((model) => model.status === 'complete');
    expect(complete.reduce((sum, model) => sum + model.questionCount, 0)).toBe(213);
  });

  it('keeps every complete-model answer inside its displayed options', () => {
    for (const model of examModels.filter((item) => item.status === 'complete')) {
      for (const section of model.sections) {
        expect(section.text.length).toBeGreaterThan(100);
        for (const question of section.questions) {
          expect(question.options.map((option) => option.label)).toContain(question.correctOption);
        }
      }
    }
  });

  it('links known shortened training titles to the correct full source sections', () => {
    expect(findSectionForExample(2020, 'Gebruik van schoolcomputers', '2020-s2')?.title).toBe('Gebruik van schoolcomputers : huis- en gedragsregels');
    expect(findSectionForExample(2022, 'Zelf je rooster maken', '2022-s4')?.title).toBe('Zelf je rooster maken: een goed idee of niet?');
  });

  it('does not choose a section when normalized matching is ambiguous', () => {
    const normalized = normalizeTitle('Zelf je rooster maken: een goed idee of niet?');
    expect(normalized).toBe(normalizeTitle('Zelf je rooster maken'));
    expect(findSectionForExample(2099, 'Zelf je rooster maken')).toBeNull();
  });

  it('has unique question ids and numbers inside every model', () => {
    const ids = new Set<string>();
    for (const model of examModels) {
      const numbers = new Set<number>();
      for (const section of model.sections) {
        for (const question of section.questions) {
          expect(ids.has(question.id)).toBe(false);
          ids.add(question.id);
          expect(numbers.has(question.number)).toBe(false);
          numbers.add(question.number);
          if (question.correctOption && !question.selfCheck) {
            expect(question.options.map((option) => option.label)).toContain(question.correctOption);
          }
        }
      }
    }
  });

  it('marks 2025 as complete with 35 structured official questions', () => {
    const model2025 = examModels.find((model) => model.year === 2025);
    expect(model2025?.status).toBe('complete');
    expect(model2025?.sections).toHaveLength(6);
    expect(model2025?.questionCount).toBe(35);
    expect(model2025?.officialQuestionCount).toBe(35);
    expect(model2025?.sections.flatMap((section) => section.questions)).toHaveLength(35);
  });

  it('matches the complete official 2025 answer key', () => {
    const model2025 = examModels.find((model) => model.year === 2025);
    const expected = ['C', 'A', 'C', 'A', 'C', 'A', 'C', 'A', 'C', 'C', 'A', 'A', 'A', 'C', 'A', 'C', 'A', 'B', 'B', 'B', 'B', 'C', 'B', 'C', 'C', 'B', 'B', 'B', 'C', 'A', 'C', 'B', 'C', 'A', 'B'];
    const actual = model2025?.sections.flatMap((section) => section.questions).sort((a, b) => a.number - b.number).map((question) => question.correctOption);
    expect(actual).toEqual(expected);
  });

  it('never exposes an empty evidence box state', () => {
    for (const model of examModels) {
      for (const section of model.sections) {
        for (const question of section.questions) {
          expect(question.evidenceStatus === 'documented' || question.evidenceStatus === 'answer-key-only').toBe(true);
          if (question.evidenceStatus === 'documented') expect(question.evidence?.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('keeps PDF source links relative and present in the document list', () => {
    const urls = new Set(sourceDocuments.map((document) => document.sourceUrl));
    for (const model of examModels) {
      expect(model.sourceUrl.startsWith('./sources/')).toBe(true);
      expect(model.answerSourceUrl.startsWith('./sources/')).toBe(true);
      expect(urls.has(model.sourceUrl)).toBe(true);
    }
  });

  it('keeps the models page source list limited to official exams and excludes reading-technique material', () => {
    const official = sourceDocuments.filter((document) => document.category === 'official-exam');
    expect(official).toHaveLength(6);
    for (const document of sourceDocuments) {
      const searchable = `${document.id} ${document.title} ${document.description}`.toLocaleLowerCase();
      expect(searchable).not.toMatch(/technieken|techniques|تقنيات القراءة/);
    }
  });

  it('rejects a broken exam model with Zod', () => {
    const result = ExamModelsSchema.safeParse([{ id: 'broken', sections: [] }]);
    expect(result.success).toBe(false);
  });
});
