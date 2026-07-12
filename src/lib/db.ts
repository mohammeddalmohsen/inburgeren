import { openDB, type DBSchema } from 'idb';

export interface ProgressRecord {
  exampleId: string;
  attempts: number;
  wrongAttempts: number;
  correctCompletions: number;
  firstTryCorrect: number;
  favorite: boolean;
  review: boolean;
  mastered: boolean;
  opened: boolean;
  unknownWords: string[];
  lastSeen: number;
}

export interface SessionRecord {
  id: string;
  startedAt: number;
  completedAt: number;
  total: number;
  correctFirstTry: number;
  wrongAttempts: number;
  exampleIds: string[];
  mistakeTypes: string[];
}

export interface ExamSessionQuestionRecord {
  questionId: string;
  selectedOption: string;
  wrongAttempts: number;
  firstTryCorrect: boolean;
  status: 'idle' | 'wrong' | 'correct' | 'revealed';
  draft?: string;
  selfCheck?: boolean;
}

export interface ExamSessionRecord {
  id: string;
  sessionKey: string;
  modelId: string;
  sectionId: string;
  startedAt: number;
  updatedAt: number;
  currentIndex: number;
  answers: ExamSessionQuestionRecord[];
  firstTryCorrect: number;
  wrongAttempts: number;
  selfCheckCount: number;
  completed: boolean;
  completedAt?: number;
}

interface MetaRecord {
  key: string;
  value: unknown;
}

interface Nt2Database extends DBSchema {
  progress: {
    key: string;
    value: ProgressRecord;
  };
  sessions: {
    key: string;
    value: SessionRecord;
    indexes: { 'by-completed': number };
  };
  examSessions: {
    key: string;
    value: ExamSessionRecord;
    indexes: { 'by-updated': number; 'by-model-section': string };
  };
  meta: {
    key: string;
    value: MetaRecord;
  };
}

let dbPromise: Promise<import('idb').IDBPDatabase<Nt2Database>> | null = null;

function getDb() {
  dbPromise ??= openDB<Nt2Database>('nt2-lezen-modern-v3', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('progress', { keyPath: 'exampleId' });
        const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
        sessions.createIndex('by-completed', 'completedAt');
        db.createObjectStore('meta', { keyPath: 'key' });
      }
      if (oldVersion < 2) {
        const examSessions = db.createObjectStore('examSessions', { keyPath: 'id' });
        examSessions.createIndex('by-updated', 'updatedAt');
        examSessions.createIndex('by-model-section', 'sessionKey');
      }
    },
  });
  return dbPromise;
}

export const emptyProgress = (exampleId: string): ProgressRecord => ({
  exampleId,
  attempts: 0,
  wrongAttempts: 0,
  correctCompletions: 0,
  firstTryCorrect: 0,
  favorite: false,
  review: false,
  mastered: false,
  opened: false,
  unknownWords: [],
  lastSeen: 0,
});

export async function getAllProgress(): Promise<Record<string, ProgressRecord>> {
  const db = await getDb();
  const rows = await db.getAll('progress');
  return Object.fromEntries(rows.map((row) => [row.exampleId, row]));
}

export async function putProgress(record: ProgressRecord): Promise<void> {
  const db = await getDb();
  await db.put('progress', record);
}

export async function putSession(record: SessionRecord): Promise<void> {
  const db = await getDb();
  await db.put('sessions', record);
}

export async function getSessions(): Promise<SessionRecord[]> {
  const db = await getDb();
  return (await db.getAllFromIndex('sessions', 'by-completed')).reverse();
}

export async function putExamSession(record: ExamSessionRecord): Promise<void> {
  const db = await getDb();
  await db.put('examSessions', { ...record, sessionKey: `${record.modelId}|${record.sectionId}|${record.completed}` });
}

export async function getExamSession(id: string): Promise<ExamSessionRecord | undefined> {
  const db = await getDb();
  return db.get('examSessions', id);
}

export async function getIncompleteExamSession(modelId: string, sectionId: string): Promise<ExamSessionRecord | undefined> {
  const db = await getDb();
  const rows = await db.getAllFromIndex('examSessions', 'by-model-section', `${modelId}|${sectionId}|false`);
  return rows.sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

export async function getExamSessions(): Promise<ExamSessionRecord[]> {
  const db = await getDb();
  return (await db.getAllFromIndex('examSessions', 'by-updated')).reverse();
}

export interface ExportSnapshot {
  version: 4;
  exportedAt: number;
  progress: ProgressRecord[];
  sessions: SessionRecord[];
  examSessions: ExamSessionRecord[];
}

export async function exportSnapshot(): Promise<ExportSnapshot> {
  const db = await getDb();
  return {
    version: 4,
    exportedAt: Date.now(),
    progress: await db.getAll('progress'),
    sessions: await db.getAll('sessions'),
    examSessions: await db.getAll('examSessions'),
  };
}

export function migrateSnapshot(snapshot: ExportSnapshot | (Omit<ExportSnapshot, 'version' | 'examSessions'> & { version: 3 })): ExportSnapshot {
  if (![3, 4].includes(snapshot.version) || !Array.isArray(snapshot.progress) || !Array.isArray(snapshot.sessions)) {
    throw new Error('ملف النسخة الاحتياطية غير صالح.');
  }
  return {
    version: 4,
    exportedAt: snapshot.exportedAt,
    progress: snapshot.progress,
    sessions: snapshot.sessions,
    examSessions: 'examSessions' in snapshot && Array.isArray(snapshot.examSessions) ? snapshot.examSessions : [],
  };
}

export async function importSnapshot(snapshot: ExportSnapshot | (Omit<ExportSnapshot, 'version' | 'examSessions'> & { version: 3 })): Promise<void> {
  const migrated = migrateSnapshot(snapshot);
  const db = await getDb();
  const tx = db.transaction(['progress', 'sessions', 'examSessions'], 'readwrite');
  await Promise.all([
    tx.objectStore('progress').clear(),
    tx.objectStore('sessions').clear(),
    tx.objectStore('examSessions').clear(),
  ]);
  for (const row of migrated.progress) await tx.objectStore('progress').put(row);
  for (const row of migrated.sessions) await tx.objectStore('sessions').put(row);
  for (const row of migrated.examSessions) await tx.objectStore('examSessions').put(row);
  await tx.done;
}

export async function clearDatabase(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['progress', 'sessions', 'examSessions', 'meta'], 'readwrite');
  await Promise.all([
    tx.objectStore('progress').clear(),
    tx.objectStore('sessions').clear(),
    tx.objectStore('examSessions').clear(),
    tx.objectStore('meta').clear(),
  ]);
  await tx.done;
}
