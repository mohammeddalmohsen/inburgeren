import { describe, expect, it } from 'vitest';
import { examples } from './data';

describe('curated exam data', () => {
  it('contains all 90 curated examples', () => {
    expect(examples).toHaveLength(90);
  });

  it('has original multiple-choice options for 2020–2024 and explicit self-check for 2025', () => {
    const multipleChoice = examples.filter((item) => item.mode === 'multiple-choice');
    const selfCheck = examples.filter((item) => item.mode === 'self-check');
    expect(multipleChoice).toHaveLength(71);
    expect(selfCheck).toHaveLength(19);
    expect(selfCheck.every((item) => item.year === 2025)).toBe(true);
  });

  it('links every item to an evidence page', () => {
    expect(examples.every((item) => item.source.evidencePage)).toBe(true);
  });

  it('links every curated example to a stable exam section id', () => {
    expect(examples.every((item) => item.sectionId)).toBe(true);
    expect(examples.find((item) => item.year === 2020 && item.questionNo === 6)?.sectionId).toBe('2020-s2');
    expect(examples.find((item) => item.year === 2022 && item.questionNo === 17)?.sectionId).toBe('2022-s4');
  });
});
