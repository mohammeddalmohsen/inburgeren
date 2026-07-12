import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  GraduationCap,
  Lightbulb,
  ListChecks,
  RotateCcw,
  SearchCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SourceLink } from '../components/SourceLink';
import { SourceReader } from '../components/SourceReader';
import { examples, levelLabels, skillLabels, years } from '../lib/data';
import { useProgress } from '../lib/ProgressContext';
import { usePageMeta } from '../lib/pageMeta';
import type { Example } from '../lib/schema';
import { createSessionQueue } from '../lib/search';
import { useToast } from '../lib/ToastContext';
import {
  abandonTrainingSession,
  getActiveTrainingSession,
  putTrainingSession,
  type SessionRecord,
  type TrainingSessionRecord,
} from '../lib/db';
import { examModels, findSectionForExample } from '../lib/exams';

interface Setup {
  count: number;
  year: string;
  level: string;
  skill: string;
  mode: string;
  reviewFirst: boolean;
}

interface Result {
  exampleId: string;
  wrongAttempts: number;
  firstTry: boolean;
  type: string;
}

const defaultSetup: Setup = {
  count: 5,
  year: '',
  level: '',
  skill: '',
  mode: '',
  reviewFirst: true,
};

export function TrainingPage() {
  usePageMeta('جلسة التدريب');
  const [setup, setSetup] = useState<Setup>(defaultSetup);
  const [queue, setQueue] = useState<Example[]>([]);
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [checkpoint, setCheckpoint] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [trainingSession, setTrainingSession] = useState<TrainingSessionRecord | null>(null);
  const [pendingTrainingSession, setPendingTrainingSession] = useState<TrainingSessionRecord | null>(null);
  const { progress, saveSession } = useProgress();
  const { showToast } = useToast();

  const pool = useMemo(() => examples.filter((example) => {
    if (setup.year && String(example.year) !== setup.year) return false;
    if (setup.level && example.level !== setup.level) return false;
    if (setup.skill && example.skill !== setup.skill) return false;
    if (setup.mode && example.mode !== setup.mode) return false;
    return true;
  }), [setup]);

  useEffect(() => {
    const supportedIds = new Set(examples.map((example) => example.id));
    getActiveTrainingSession()
      .then(async (saved) => {
        if (saved && saved.questionIds.some((id) => !supportedIds.has(id))) {
          await abandonTrainingSession(saved);
          setPendingTrainingSession(null);
          showToast('أُرشفت جلسة قديمة لأنها لا تنتمي إلى نطاق 2023–2025.', 'info');
          return;
        }
        setPendingTrainingSession(saved ?? null);
      })
      .catch(() => showToast('تعذر قراءة جلسة التدريب المحفوظة من IndexedDB.', 'warning'));
  }, [showToast]);

  const persistTrainingSession = async (patch: Partial<TrainingSessionRecord>) => {
    if (!trainingSession) return;
    const next = { ...trainingSession, ...patch, updatedAt: Date.now() };
    setTrainingSession(next);
    await putTrainingSession(next);
  };

  const start = async () => {
    if (!pool.length) {
      showToast('لا توجد أسئلة بهذه الفلاتر.', 'warning');
      return;
    }
    if (pendingTrainingSession) {
      if (!window.confirm('توجد جلسة تدريب غير مكتملة. هل تريد أرشفتها وبدء جلسة جديدة؟')) return;
      await abandonTrainingSession(pendingTrainingSession);
      setPendingTrainingSession(null);
    }
    const reviewItems = pool.filter((example) => progress[example.id]?.review);
    const regularItems = pool.filter((example) => !progress[example.id]?.review);
    const chosen = setup.reviewFirst
      ? [...createSessionQueue(reviewItems, setup.count), ...createSessionQueue(regularItems, setup.count)]
      : createSessionQueue(pool, setup.count);
    const unique = [...new Map(chosen.map((item) => [item.id, item])).values()].slice(0, setup.count);
    if (unique.length < setup.count) {
      const remaining = createSessionQueue(pool.filter((item) => !unique.some((chosenItem) => chosenItem.id === item.id)), setup.count - unique.length);
      unique.push(...remaining);
    }
    const now = Date.now();
    const record: TrainingSessionRecord = {
      id: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      questionIds: unique.map((item) => item.id),
      currentIndex: 0,
      answers: [],
      wrongAttempts: {},
      startedAt: now,
      updatedAt: now,
      completed: false,
      reviewShown: false,
    };
    await putTrainingSession(record);
    setTrainingSession(record);
    setQueue(unique);
    setIndex(0);
    setResults([]);
    setStartedAt(now);
    setCheckpoint(null);
    setFinished(false);
  };

  const resumePending = () => {
    if (!pendingTrainingSession) return;
    const byId = new Map(examples.map((example) => [example.id, example]));
    const restoredQueue = pendingTrainingSession.questionIds.map((id) => byId.get(id)).filter((item): item is Example => Boolean(item));
    setTrainingSession(pendingTrainingSession);
    setQueue(restoredQueue);
    setIndex(Math.min(pendingTrainingSession.currentIndex, Math.max(restoredQueue.length - 1, 0)));
    setStartedAt(pendingTrainingSession.startedAt);
    setResults(pendingTrainingSession.answers.map((answer) => ({
      exampleId: answer.exampleId,
      wrongAttempts: answer.wrongAttempts,
      firstTry: answer.firstTry,
      type: byId.get(answer.exampleId)?.transformationType ?? 'غير مصنف',
    })));
    setPendingTrainingSession(null);
    setFinished(false);
    setCheckpoint(null);
  };

  const registerResult = (result: Result) => {
    setResults((current) => [...current.filter((item) => item.exampleId !== result.exampleId), result]);
    void persistTrainingSession({
      answers: [
        ...(trainingSession?.answers.filter((item) => item.exampleId !== result.exampleId) ?? []),
        {
          exampleId: result.exampleId,
          status: 'correct',
          wrongAttempts: result.wrongAttempts,
          firstTry: result.firstTry,
          unknownWords: [],
        },
      ],
      wrongAttempts: {
        ...(trainingSession?.wrongAttempts ?? {}),
        [result.exampleId]: result.wrongAttempts,
      },
    });
  };

  const next = async () => {
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      const record: SessionRecord = {
        id: crypto.randomUUID(),
        startedAt,
        completedAt: Date.now(),
        total: queue.length,
        correctFirstTry: results.filter((item) => item.firstTry).length,
        wrongAttempts: results.reduce((sum, item) => sum + item.wrongAttempts, 0),
        exampleIds: queue.map((item) => item.id),
        mistakeTypes: results.filter((item) => item.wrongAttempts > 0).map((item) => item.type),
      };
      await saveSession(record);
      await persistTrainingSession({ completed: true, currentIndex: index, reviewShown: true });
      setFinished(true);
      return;
    }
    setIndex(nextIndex);
    await persistTrainingSession({ currentIndex: nextIndex, reviewShown: nextIndex % 5 === 0 });
    if (nextIndex % 5 === 0) setCheckpoint(nextIndex);
  };

  const reset = () => {
    setQueue([]);
    setIndex(0);
    setResults([]);
    setCheckpoint(null);
    setFinished(false);
    setTrainingSession(null);
  };

  if (!queue.length) {
    return <TrainingSetup setup={setup} setSetup={setSetup} poolCount={pool.length} start={start} pending={pendingTrainingSession} resume={resumePending} />;
  }

  if (finished) {
    return <SessionSummary queue={queue} results={results} reset={reset} />;
  }

  if (checkpoint !== null) {
    const segment = results.slice(Math.max(0, checkpoint - 5), checkpoint);
    return (
      <CheckpointSummary
        number={checkpoint}
        segment={segment}
        onContinue={() => setCheckpoint(null)}
        onEnd={reset}
      />
    );
  }

  const current = queue[index];
  const sourceSection = findSectionForExample(current.year, current.title, current.sectionId);
  const sourceModel = examModels.find((model) => model.year === current.year);
  return (
    <section className="training-page section shell">
      <div className="training-topline">
        <div>
          <span className="section-kicker">جلسة تدريب</span>
          <h1>السؤال {index + 1} من {queue.length}</h1>
        </div>
        <button className="button button--ghost" type="button" onClick={reset}>إنهاء الجلسة</button>
      </div>
      <div className="session-progress" aria-label={`${index + 1} من ${queue.length}`}>
        <span style={{ width: `${((index + 1) / queue.length) * 100}%` }} />
      </div>
      <div className="training-reading-note">
        اقرأ النص أولًا ثم أجب. الدليل المحدد والحل لا يظهران قبل الإجابة الصحيحة.
      </div>
      <div className="training-workspace">
        <SourceReader
          section={sourceSection}
          sourceUrl={sourceModel?.sourceUrl ?? current.source.url}
          title={current.title}
        />
        <TrainingQuestion key={current.id} example={current} onComplete={registerResult} onNext={() => void next()} />
      </div>
    </section>
  );
}

function TrainingSetup({
  setup,
  setSetup,
  poolCount,
  start,
  pending,
  resume,
}: {
  setup: Setup;
  setSetup: React.Dispatch<React.SetStateAction<Setup>>;
  poolCount: number;
  start: () => Promise<void>;
  pending: TrainingSessionRecord | null;
  resume: () => void;
}) {
  const update = <K extends keyof Setup>(key: K, value: Setup[K]) => setSetup((current) => ({ ...current, [key]: value }));
  return (
    <section className="section shell training-setup">
      <div className="page-heading">
        <div>
          <span className="section-kicker">سؤال واحد في كل مرة</span>
          <h1>ابدأ جلسة تدريب</h1>
          <p>في أسئلة الاختيار لا يظهر الدليل أو الجواب قبل الإجابة الصحيحة. عند الخطأ تبقى في السؤال نفسه.</p>
        </div>
      </div>

      <div className="setup-layout">
        <div className="setup-card">
          <div className="setup-grid">
            <label><span>عدد الأسئلة</span><select value={setup.count} onChange={(e) => update('count', Number(e.target.value))}>
              <option value={5}>5 أسئلة</option><option value={10}>10 أسئلة</option><option value={15}>15 سؤالًا</option>
            </select></label>
            <label><span>السنة</span><select value={setup.year} onChange={(e) => update('year', e.target.value)}>
              <option value="">كل السنوات</option>{years.map((year) => <option key={year}>{year}</option>)}
            </select></label>
            <label><span>المستوى</span><select value={setup.level} onChange={(e) => update('level', e.target.value)}>
              <option value="">كل المستويات</option>{Object.entries(levelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
            <label><span>المهارة</span><select value={setup.skill} onChange={(e) => update('skill', e.target.value)}>
              <option value="">كل المهارات</option>{Object.entries(skillLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
            <label><span>نوع السؤال</span><select value={setup.mode} onChange={(e) => update('mode', e.target.value)}>
              <option value="">الكل</option><option value="multiple-choice">اختيارات أصلية</option><option value="self-check">تقييم ذاتي</option>
            </select></label>
          </div>
          <label className="check-row">
            <input type="checkbox" checked={setup.reviewFirst} onChange={(e) => update('reviewFirst', e.target.checked)} />
            <span><strong>ابدأ بأسئلة المراجعة</strong><small>تُعطى الأولوية للأسئلة التي أخطأت فيها سابقًا.</small></span>
          </label>
          {pending && (
            <div className="resume-session-card">
              <strong>توجد جلسة غير مكتملة</strong>
              <span>{pending.questionIds.length} أسئلة · بدأت {new Date(pending.startedAt).toLocaleDateString('ar')}</span>
              <div>
                <button className="button button--primary" type="button" onClick={resume}>متابعة الجلسة</button>
                <button className="button button--secondary" type="button" onClick={() => void start()}>بدء جلسة جديدة</button>
              </div>
            </div>
          )}
          <button className="button button--primary button--large setup-start" type="button" onClick={() => void start()} disabled={!poolCount}>
            <GraduationCap size={19} /> ابدأ من بين {poolCount} مثالًا
          </button>
        </div>

        <aside className="method-card">
          <h2>طريقة الجلسة</h2>
          <ol>
            <li><span>1</span><p>اقرأ السؤال وحدد المطلوب.</p></li>
            <li><span>2</span><p>اختر الإجابة دون رؤية الدليل.</p></li>
            <li><span>3</span><p>عند الخطأ: <strong>Niet goed</strong> ثم محاولة جديدة لنفس السؤال.</p></li>
            <li><span>4</span><p>عند الصواب: <strong>Goed</strong> ثم يظهر الدليل والشرح.</p></li>
            <li><span>5</span><p>بعد كل خمسة أسئلة تحصل على مراجعة قصيرة.</p></li>
          </ol>
        </aside>
      </div>
    </section>
  );
}

function TrainingQuestion({
  example,
  onComplete,
  onNext,
}: {
  example: Example;
  onComplete: (result: Result) => void;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState<'idle' | 'wrong' | 'correct' | 'revealed'>('idle');
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [draft, setDraft] = useState('');
  const [unknownWord, setUnknownWord] = useState('');
  const { recordAnswer, addUnknownWord } = useProgress();
  const { showToast } = useToast();

  const submitChoice = async () => {
    if (!selected || !example.correctOption) return;
    const correct = selected === example.correctOption;
    if (!correct) {
      const nextWrong = wrongAttempts + 1;
      setWrongAttempts(nextWrong);
      setStatus('wrong');
      setSelected('');
      await recordAnswer(example.id, { correct: false, firstTry: false, hadWrong: true });
      return;
    }
    setStatus('correct');
    await recordAnswer(example.id, { correct: true, firstTry: wrongAttempts === 0, hadWrong: wrongAttempts > 0 });
    onComplete({ exampleId: example.id, wrongAttempts, firstTry: wrongAttempts === 0, type: example.transformationType });
  };

  const revealSelfCheck = () => {
    if (!draft.trim()) {
      showToast('اكتب كلمات البحث أو فكرتك أولًا حتى تكون هناك محاولة حقيقية.', 'warning');
      return;
    }
    setStatus('revealed');
  };

  const rateSelfCheck = async (found: boolean) => {
    await recordAnswer(example.id, { correct: found, firstTry: found, hadWrong: !found });
    onComplete({ exampleId: example.id, wrongAttempts: found ? 0 : 1, firstTry: found, type: example.transformationType });
    setStatus('correct');
  };

  const saveWord = async () => {
    if (!unknownWord.trim()) return;
    await addUnknownWord(example.id, unknownWord);
    setUnknownWord('');
    showToast('حُفظت الكلمة للمراجعة.', 'success');
  };

  const solved = status === 'correct';
  const showAnalysis = status === 'correct' || status === 'revealed';

  return (
    <article className="training-card">
      <header className="training-card__header">
        <div className="chip-row">
          <span className="chip chip--purple">{example.year}</span>
          <span className="chip">Vraag {example.questionNo}</span>
          <span className="chip">{example.transformationType}</span>
        </div>
        <span className={`mode-badge mode-badge--${example.mode}`}>{example.mode === 'multiple-choice' ? 'اختيارات أصلية' : 'تقييم ذاتي'}</span>
      </header>

      <div className="training-title">
        <small lang="nl">Tekst</small>
        <h2 lang="nl" dir="ltr">{example.title}</h2>
      </div>
      <section className="training-question-text">
        <small>السؤال</small>
        <p lang="nl" dir="ltr">{example.question}</p>
      </section>

      {example.mode === 'multiple-choice' ? (
        <div className="choice-area">
          <fieldset disabled={solved}>
            <legend>اختر إجابة واحدة</legend>
            {example.options.map((option) => (
              <label key={option.label} className={`choice${selected === option.label ? ' is-selected' : ''}${solved && option.label === example.correctOption ? ' is-correct' : ''}`}>
                <input type="radio" name={`answer-${example.id}`} value={option.label} checked={selected === option.label} onChange={() => { setSelected(option.label); if (status === 'wrong') setStatus('idle'); }} />
                <span className="choice__letter">{option.label}</span>
                <span lang="nl" dir="ltr">{option.text}</span>
              </label>
            ))}
          </fieldset>
          {!solved && <button className="button button--primary submit-answer" type="button" disabled={!selected} onClick={() => void submitChoice()}>تثبيت الإجابة</button>}
        </div>
      ) : (
        <div className="self-check-area">
          <div className="self-check-note"><SearchCheck size={20} /><p>هذا السؤال لا يحتوي اختيارات قابلة للتقييم الآلي في قاعدة البيانات؛ لذلك يستخدم تقييمًا ذاتيًا صريحًا.</p></div>
          <label htmlFor={`draft-${example.id}`}>اكتب كلمات البحث أو الجواب المتوقع</label>
          <textarea id={`draft-${example.id}`} value={draft} onChange={(e) => setDraft(e.target.value)} disabled={showAnalysis} placeholder="اكتب ما وجدته في النص أو ما تتوقعه…" />
          {!showAnalysis && <button className="button button--primary" type="button" onClick={revealSelfCheck}>قارن مع الإجابة المعتمدة</button>}
        </div>
      )}

      {status === 'wrong' && (
        <div className="feedback feedback--wrong" role="status" aria-live="polite">
          <CircleAlert size={25} />
          <div><strong>Niet goed.</strong><p>هذا الاختيار لا يطابق مفتاح الإجابة الرسمي. لا يظهر الحل الآن؛ حاول مرة ثانية في السؤال نفسه.</p></div>
        </div>
      )}

      {wrongAttempts > 0 && !showAnalysis && (
        <div className="hint-box"><Lightbulb size={19} /><p>تلميح دون كشف الحل: نوع التحويل هو <strong>{example.transformationType}</strong>. قارن الفكرة والفاعل والنفي والنتيجة.</p></div>
      )}

      {showAnalysis && (
        <div className="analysis-panel">
          {status === 'correct' && <div className="feedback feedback--correct" role="status"><CheckCircle2 size={25} /><div><strong>Goed.</strong><p>يوجد دليل واضح من المصدر، لذلك تظهر الإجابة الآن.</p></div></div>}
          <section className="answer-panel"><small>الإجابة المعتمدة</small><p lang="nl" dir="ltr">{example.answer}</p></section>
          <div className="evidence-grid">
            <div className="evidence-box"><small>الدليل الدقيق</small><p lang="nl" dir="ltr">{example.evidence}</p></div>
            <div className="evidence-box evidence-box--accent"><small>كلمات مختلفة، معنى واحد</small><p lang="nl" dir="ltr">{example.pair}</p></div>
          </div>
          <div className="arabic-explanation"><div><strong>الشرح بالعربية</strong><p>{example.explanation}</p></div><div><strong>المعنى</strong><p>{example.meaning}</p></div></div>
          <div className="analysis-tools">
            <SourceLink example={example} />
            <div className="unknown-word-entry"><label htmlFor={`train-word-${example.id}`}>كلمة لم أفهمها</label><div><input id={`train-word-${example.id}`} value={unknownWord} onChange={(e) => setUnknownWord(e.target.value)} lang="nl" dir="ltr" /><button className="button button--secondary" type="button" onClick={() => void saveWord()}>حفظ</button></div></div>
          </div>

          {example.mode === 'self-check' && status === 'revealed' && (
            <div className="self-rating">
              <p>هل كان معنى محاولتك مطابقًا قبل رؤية الإجابة؟</p>
              <button className="button button--success" type="button" onClick={() => void rateSelfCheck(true)}>نعم، وجدتها</button>
              <button className="button button--warning" type="button" onClick={() => void rateSelfCheck(false)}>لا، أحتاج مراجعة</button>
            </div>
          )}

          {solved && <button className="button button--primary next-question" type="button" onClick={onNext}>السؤال التالي <ArrowLeft size={18} /></button>}
        </div>
      )}
    </article>
  );
}

function CheckpointSummary({ number, segment, onContinue, onEnd }: { number: number; segment: Result[]; onContinue: () => void; onEnd: () => void }) {
  const mistakes = segment.filter((item) => item.wrongAttempts > 0);
  const counts = mistakes.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.type]: (acc[item.type] ?? 0) + 1 }), {});
  return (
    <section className="section shell checkpoint-page">
      <div className="summary-card">
        <span className="summary-icon"><ListChecks /></span>
        <span className="section-kicker">مراجعة بعد خمسة أسئلة</span>
        <h1>أكملت {number} أسئلة</h1>
        <div className="summary-metrics"><div><strong>{segment.filter((item) => item.firstTry).length}</strong><span>صحيحة من أول مرة</span></div><div><strong>{segment.reduce((sum, item) => sum + item.wrongAttempts, 0)}</strong><span>محاولات خاطئة</span></div></div>
        {mistakes.length ? <div className="mistake-summary"><h2>أنواع تحتاج انتباهًا</h2>{Object.entries(counts).map(([type, count]) => <p key={type}><span>{type}</span><strong>{count}</strong></p>)}</div> : <p className="all-good">Goed! لم تسجل أخطاء في هذه المجموعة.</p>}
        <div className="summary-actions"><button className="button button--primary" onClick={onContinue}>متابعة الجلسة</button><button className="button button--ghost" onClick={onEnd}>إنهاء الآن</button></div>
      </div>
    </section>
  );
}

function SessionSummary({ queue, results, reset }: { queue: Example[]; results: Result[]; reset: () => void }) {
  const wrong = results.reduce((sum, item) => sum + item.wrongAttempts, 0);
  const firstTry = results.filter((item) => item.firstTry).length;
  const mistakeIds = results.filter((item) => item.wrongAttempts > 0).map((item) => item.exampleId);
  return (
    <section className="section shell checkpoint-page">
      <div className="summary-card summary-card--final">
        <span className="summary-icon"><CheckCircle2 /></span>
        <span className="section-kicker">انتهت الجلسة</span>
        <h1>أكملت {queue.length} أسئلة</h1>
        <div className="summary-metrics"><div><strong>{firstTry}</strong><span>من أول مرة</span></div><div><strong>{wrong}</strong><span>محاولات خاطئة</span></div><div><strong>{mistakeIds.length}</strong><span>أسئلة للمراجعة</span></div></div>
        <p>تم حفظ النتائج محليًا. ستظهر الأخطاء ضمن صفحة التقدم وقائمة المراجعة.</p>
        <div className="summary-actions"><button className="button button--primary" onClick={reset}><RotateCcw size={17} /> جلسة جديدة</button><Link className="button button--secondary" to="/progress">عرض التقدم</Link></div>
      </div>
    </section>
  );
}
