import { describe, expect, it } from 'vitest';
import { examples } from './data';

describe('curated exam data 2023-2025', () => {
  it('contains the 50 curated examples from 2023, 2024 and 2025 only', () => {
    expect(examples).toHaveLength(50);
    expect([...new Set(examples.map((item) => item.year))]).toEqual([2023, 2024, 2025]);
  });

  it('uses original multiple-choice options for every curated example', () => {
    expect(examples.every((item) => item.mode === 'multiple-choice')).toBe(true);
    expect(examples.every((item) => item.options.length >= 2 && Boolean(item.correctOption))).toBe(true);
  });

  it('links every item to an evidence page and stable section id', () => {
    expect(examples.every((item) => item.source.evidencePage)).toBe(true);
    expect(examples.every((item) => item.sectionId)).toBe(true);
  });
});
