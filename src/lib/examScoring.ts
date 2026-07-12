export type ExamAnswerStatus = 'idle' | 'wrong' | 'correct' | 'revealed';

export interface ExamAnswerRecord {
  questionId: string;
  selectedOption: string;
  wrongAttempts: number;
  firstTryCorrect: boolean;
  status: ExamAnswerStatus;
  draft?: string;
  selfCheck?: boolean;
}

export interface ExamSummary {
  totalQuestions: number;
  automaticallyScoredQuestions: number;
  firstTryCorrect: number;
  correctedAfterWrong: number;
  wrongAttempts: number;
  selfCheckCount: number;
  scorePercent: number;
}

export function registerExamAttempt(
  current: ExamAnswerRecord,
  attempt: {
    selectedOption?: string;
    draft?: string;
    correctOption?: string | null;
    selfCheck?: boolean;
  },
): ExamAnswerRecord {
  if (current.status === 'correct' || current.status === 'revealed') return current;
  if (attempt.selfCheck || !attempt.correctOption) {
    return {
      ...current,
      draft: attempt.draft ?? current.draft ?? '',
      selfCheck: true,
      status: 'revealed',
    };
  }
  if (!attempt.selectedOption) return current;
  if (attempt.selectedOption !== attempt.correctOption) {
    return {
      ...current,
      selectedOption: '',
      wrongAttempts: current.wrongAttempts + 1,
      firstTryCorrect: false,
      status: 'wrong',
    };
  }
  return {
    ...current,
    selectedOption: attempt.selectedOption,
    firstTryCorrect: current.wrongAttempts === 0,
    status: 'correct',
  };
}

export function calculateExamSummary(records: ExamAnswerRecord[], totalQuestions = records.length): ExamSummary {
  const automaticallyScored = records.filter((record) => !record.selfCheck);
  const selfCheckCount = records.filter((record) => record.selfCheck).length;
  const firstTryCorrect = automaticallyScored.filter((record) => record.firstTryCorrect).length;
  const correctedAfterWrong = automaticallyScored.filter(
    (record) => record.status === 'correct' && !record.firstTryCorrect && record.wrongAttempts > 0,
  ).length;
  const wrongAttempts = records.reduce((sum, record) => sum + record.wrongAttempts, 0);
  return {
    totalQuestions,
    automaticallyScoredQuestions: automaticallyScored.length,
    firstTryCorrect,
    correctedAfterWrong,
    wrongAttempts,
    selfCheckCount,
    scorePercent: automaticallyScored.length ? Math.round((firstTryCorrect / automaticallyScored.length) * 100) : 0,
  };
}

export function emptyExamAnswerRecord(questionId: string): ExamAnswerRecord {
  return {
    questionId,
    selectedOption: '',
    wrongAttempts: 0,
    firstTryCorrect: false,
    status: 'idle',
    draft: '',
  };
}
