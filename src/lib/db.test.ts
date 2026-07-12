import { describe, expect, it } from 'vitest';
import { migrateSnapshot } from './db';

describe('backup migration', () => {
  it('migrates version 3 backups by adding empty exam sessions', () => {
    const migrated = migrateSnapshot({
      version: 3,
      exportedAt: 123,
      progress: [],
      sessions: [],
    });

    expect(migrated.version).toBe(4);
    expect(migrated.examSessions).toEqual([]);
  });

  it('keeps version 4 exam sessions during import preparation', () => {
    const migrated = migrateSnapshot({
      version: 4,
      exportedAt: 123,
      progress: [],
      sessions: [],
      examSessions: [{
        id: 'exam-session-1',
        sessionKey: 'official-2025|all|false',
        modelId: 'official-2025',
        sectionId: 'all',
        startedAt: 1,
        updatedAt: 2,
        currentIndex: 0,
        answers: [],
        firstTryCorrect: 0,
        wrongAttempts: 0,
        selfCheckCount: 0,
        completed: false,
      }],
    });

    expect(migrated.examSessions).toHaveLength(1);
  });
});
