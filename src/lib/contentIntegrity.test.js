import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPageTitle } from './pageMeta.ts';
import { examModels, sourceDocuments } from './exams.ts';

describe('final content integrity', () => {
  it('keeps documentation scoped to 2023-2025 without legacy model claims', () => {
    const files = ['README_AR.md', 'CONTENT_STATUS_AR.md', 'CONTENT_EVIDENCE_COVERAGE_AR.md', 'AUDIT_FIXES_AR.md'];
    const text = files.map((file) => readFileSync(file, 'utf8')).join('\n');
    expect(text).not.toMatch(/2020|2021|2022|213 سؤال|90 مثال/);
    expect(text).toMatch(/2023/);
    expect(text).toMatch(/2024/);
    expect(text).toMatch(/2025/);
  });

  it('has every declared source PDF on disk', () => {
    for (const doc of sourceDocuments) {
      if (!doc.sourceUrl.endsWith('.pdf')) continue;
      expect(existsSync(join(process.cwd(), 'public-site', doc.sourceUrl.replace(/^\.\//, '')))).toBe(true);
    }
  });

  it('keeps declared question counts synchronized with data', () => {
    for (const model of examModels) {
      const count = model.sections.flatMap((section) => section.questions).length;
      expect(model.questionCount).toBe(count);
      expect(model.officialQuestionCount ?? model.questionCount).toBe(count);
    }
  });

  it('builds route metadata titles consistently', () => {
    expect(buildPageTitle('نموذج 2025')).toBe('NT2 Lezen B1 — نموذج 2025');
  });
});


describe('scoped public assets', () => {
  it('does not ship legacy or practice PDFs', () => {
    const sourceDir = join(process.cwd(), 'public-site', 'sources');
    const names = readdirSync(sourceDir);
    expect(names.some((name) => /2020|2021|2022|practice/i.test(name))).toBe(false);
    expect(names.sort()).toEqual([
      'answers-2023.pdf', 'answers-2024.pdf', 'answers-2025.pdf',
      'exam-2023.pdf', 'exam-2024.pdf', 'exam-2025-complete.pdf',
    ]);
  });
});
