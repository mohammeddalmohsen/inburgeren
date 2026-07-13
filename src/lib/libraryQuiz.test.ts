import { describe, expect, it } from 'vitest';
import { paraphrasePairs } from './paraphrasePairs';

describe('library quiz content', () => {
  it('uses separated paraphrase sides for quiz prompts and answers', () => {
    const example = paraphrasePairs.find((pair) => pair.left === 'heel goed je best doen');
    expect(example?.right).toBe('hard werken');
    expect(example?.right).not.toContain('↔');
  });

  it('does not expose combined pair strings as answer options', () => {
    expect(paraphrasePairs.every((pair) => !pair.left.includes('↔') && !pair.right.includes('↔'))).toBe(true);
  });
});
