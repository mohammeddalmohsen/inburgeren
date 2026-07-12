import { describe, expect, it } from 'vitest';
import { calculateExamSummary, emptyExamAnswerRecord, registerExamAttempt } from './examScoring';

describe('exam scoring', () => {
  it('does not count a corrected answer as first try', () => {
    const wrong = registerExamAttempt(emptyExamAnswerRecord('q1'), { selectedOption: 'A', correctOption: 'B' });
    const corrected = registerExamAttempt(wrong, { selectedOption: 'B', correctOption: 'B' });
    const summary = calculateExamSummary([corrected], 1);
    expect(corrected.firstTryCorrect).toBe(false);
    expect(summary.firstTryCorrect).toBe(0);
    expect(summary.correctedAfterWrong).toBe(1);
    expect(summary.scorePercent).toBe(0);
  });

  it('ignores duplicate submits after a question is solved', () => {
    const correct = registerExamAttempt(emptyExamAnswerRecord('q1'), { selectedOption: 'C', correctOption: 'C' });
    const duplicate = registerExamAttempt(correct, { selectedOption: 'C', correctOption: 'C' });
    expect(duplicate).toEqual(correct);
    expect(calculateExamSummary([duplicate], 1).firstTryCorrect).toBe(1);
  });

  it('does not include self-check questions in the automatic denominator', () => {
    const selfCheck = registerExamAttempt(emptyExamAnswerRecord('q2'), { draft: 'antwoord', selfCheck: true });
    const summary = calculateExamSummary([selfCheck], 1);
    expect(summary.selfCheckCount).toBe(1);
    expect(summary.automaticallyScoredQuestions).toBe(0);
    expect(summary.scorePercent).toBe(0);
  });
});
