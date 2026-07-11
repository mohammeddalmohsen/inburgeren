import { describe, expect, it } from 'vitest';
import { examModels } from './exams';

describe('exam model data', () => {
  it('contains the official years 2020 through 2025', () => {
    expect(examModels.map((model) => model.year)).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
  });

  it('contains every official question for 2020 through 2024', () => {
    const complete = examModels.filter((model) => model.status === 'complete');
    expect(complete.reduce((sum, model) => sum + model.questionCount, 0)).toBe(178);
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
});
