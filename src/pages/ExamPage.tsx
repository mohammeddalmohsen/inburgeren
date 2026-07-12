import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, CircleAlert, FileQuestion, RotateCcw } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { SourceReader } from '../components/SourceReader';
import { publicAssetUrl } from '../lib/assetUrl';
import { abandonExamSession, getIncompleteExamSession, putExamSession, type ExamSessionRecord } from '../lib/db';
import { calculateExamSummary, emptyExamAnswerRecord, registerExamAttempt, type ExamAnswerRecord } from '../lib/examScoring';
import { examDataError, examModelById, type ExamQuestion, type ExamSection } from '../lib/exams';

interface FlatQuestion {
  section: ExamSection;
  question: ExamQuestion;
}

function createSession(modelId: string, sectionId: string): ExamSessionRecord {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    sessionKey: `${modelId}|${sectionId}|false`,
    modelId,
    sectionId,
    startedAt: now,
    updatedAt: now,
    currentIndex: 0,
    answers: [],
    firstTryCorrect: 0,
    wrongAttempts: 0,
    selfCheckCount: 0,
    completed: false,
  };
}

function answerFor(session: ExamSessionRecord | null, questionId: string): ExamAnswerRecord {
  return session?.answers.find((answer) => answer.questionId === questionId) ?? emptyExamAnswerRecord(questionId);
}

export function ExamPage() {
  const { modelId } = useParams();
  const model = modelId ? examModelById.get(modelId) : null;
  const [sectionId, setSectionId] = useState<string>('all');
  const [session, setSession] = useState<ExamSessionRecord | null>(null);
  const [pendingSession, setPendingSession] = useState<ExamSessionRecord | null>(null);
  const [selected, setSelected] = useState('');
  const [draft, setDraft] = useState('');
  const [finished, setFinished] = useState(false);
  const [mobileTab, setMobileTab] = useState<'text' | 'question'>('text');
  const [loadingSession, setLoadingSession] = useState(true);
  const [storageError, setStorageError] = useState('');

  const queue = useMemo<FlatQuestion[]>(() => {
    if (!model) return [];
    const sections = sectionId === 'all' ? model.sections : model.sections.filter((section) => section.id === sectionId);
    return sections.flatMap((section) => section.questions.map((question) => ({ section, question })));
  }, [model, sectionId]);

  useEffect(() => {
    if (!model) return;
    setLoadingSession(true);
    setStorageError('');
    getIncompleteExamSession(model.id, sectionId)
      .then((saved) => {
        setPendingSession(saved ?? null);
        setSession(saved ? null : createSession(model.id, sectionId));
        setFinished(false);
      })
      .catch(() => {
        setStorageError('تعذر فتح IndexedDB. ستعمل الجلسة مؤقتًا، لكن الاستعادة بعد التحديث قد لا تعمل.');
        setPendingSession(null);
        setSession(createSession(model.id, sectionId));
      })
      .finally(() => setLoadingSession(false));
  }, [model, sectionId]);

  useEffect(() => {
    if (!session || session.completed) return;
    putExamSession(session).catch(() => setStorageError('فشل حفظ جلسة النموذج محليًا. جرّب تحديث الصفحة أو السماح بتخزين بيانات الموقع.'));
  }, [session]);

  const current = queue[session?.currentIndex ?? 0];
  const answer = current ? answerFor(session, current.question.id) : emptyExamAnswerRecord('');

  useEffect(() => {
    setSelected(answer.selectedOption);
    setDraft(answer.draft ?? '');
  }, [answer.questionId, answer.selectedOption, answer.draft]);

  if (!model) return <Navigate to="/models" replace />;

  const replaceAnswer = (record: ExamAnswerRecord, completed = false) => {
    setSession((currentSession) => {
      if (!currentSession) return currentSession;
      const answers = [...currentSession.answers.filter((item) => item.questionId !== record.questionId), record];
      const summary = calculateExamSummary(answers, queue.length);
      return {
        ...currentSession,
        answers,
        updatedAt: Date.now(),
        firstTryCorrect: summary.firstTryCorrect,
        wrongAttempts: summary.wrongAttempts,
        selfCheckCount: summary.selfCheckCount,
        completed,
        completedAt: completed ? Date.now() : currentSession.completedAt,
      };
    });
  };

  const startNew = async () => {
    if (pendingSession && !window.confirm('توجد جلسة غير مكتملة لهذا القسم. هل تريد بدء جلسة جديدة بدلًا منها؟')) return;
    if (pendingSession) await abandonExamSession(pendingSession);
    setPendingSession(null);
    setSession(createSession(model.id, sectionId));
    setFinished(false);
  };

  const resume = () => {
    if (!pendingSession) return;
    setSession(pendingSession);
    setPendingSession(null);
    setFinished(false);
  };

  const reset = (nextSectionId = sectionId) => {
    if (nextSectionId !== sectionId) {
      setSectionId(nextSectionId);
      setMobileTab('text');
      return;
    }
    void startNew();
    setMobileTab('text');
  };

  const submit = () => {
    if (!current || !session) return;
    const previous = answerFor(session, current.question.id);
    if (previous.status === 'correct' || previous.status === 'revealed') return;
    if (current.question.selfCheck || !current.question.correctOption) {
      if (!draft.trim()) return;
      replaceAnswer(registerExamAttempt(previous, { draft, selfCheck: true, correctOption: null }));
      return;
    }
    if (!selected) return;
    const nextAnswer = registerExamAttempt(previous, { selectedOption: selected, correctOption: current.question.correctOption });
    replaceAnswer(nextAnswer);
  };

  const next = () => {
    if (!session) return;
    if (session.currentIndex + 1 >= queue.length) {
      const completed = { ...session, completed: true, completedAt: Date.now(), updatedAt: Date.now() };
      setSession(completed);
      void putExamSession(completed);
      setFinished(true);
      return;
    }
    setSession((currentSession) => currentSession ? { ...currentSession, currentIndex: currentSession.currentIndex + 1, updatedAt: Date.now() } : currentSession);
    setMobileTab('text');
  };

  if (loadingSession) {
    return <section className="section shell"><div className="empty-state"><FileQuestion /><h1>جارٍ تحميل الجلسة…</h1></div></section>;
  }

  if (pendingSession) {
    return (
      <section className="section shell checkpoint-page">
        <div className="summary-card">
          <span className="summary-icon"><FileQuestion /></span>
          <span className="section-kicker">جلسة محفوظة</span>
          <h1>لديك جلسة غير مكتملة</h1>
          <p>يمكنك متابعة النموذج من السؤال {pendingSession.currentIndex + 1} أو بدء جلسة جديدة لهذا القسم.</p>
          <div className="summary-actions">
            <button className="button button--primary" type="button" onClick={resume}>متابعة الجلسة</button>
            <button className="button button--ghost" type="button" onClick={() => void startNew()}>بدء جلسة جديدة</button>
          </div>
        </div>
      </section>
    );
  }

  if (finished || session?.completed) {
    const summary = calculateExamSummary(session?.answers ?? [], queue.length);
    return (
      <section className="section shell checkpoint-page">
        <div className="summary-card summary-card--final">
          <span className="summary-icon"><CheckCircle2 /></span>
          <span className="section-kicker">انتهى النموذج</span>
          <h1>{model.title}</h1>
          <div className="summary-metrics summary-metrics--wide">
            <div><strong>{summary.automaticallyScoredQuestions}</strong><span>سؤالًا قابلًا للتقييم</span></div>
            <div><strong>{summary.firstTryCorrect}</strong><span>صحيحة من أول محاولة</span></div>
            <div><strong>{summary.correctedAfterWrong}</strong><span>صُححت بعد الخطأ</span></div>
            <div><strong>{summary.wrongAttempts}</strong><span>محاولات خاطئة</span></div>
            <div><strong>{summary.selfCheckCount}</strong><span>أسئلة تقييم ذاتي</span></div>
            <div><strong>{summary.scorePercent}%</strong><span>النسبة المعتمدة</span></div>
          </div>
          <p>النسبة تعتمد على الإجابات الصحيحة من أول محاولة فقط. أسئلة التقييم الذاتي لا تدخل في المقام الآلي.</p>
          <div className="summary-actions">
            <button className="button button--primary" onClick={() => reset()}><RotateCcw size={17} /> إعادة النموذج</button>
            <Link className="button button--secondary" to="/models">العودة إلى النماذج</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!current || !session) {
    return (
      <section className="section shell"><div className="empty-state"><FileQuestion /><h1>لا توجد أسئلة في هذا القسم</h1><p>غيّر القسم أو عد إلى صفحة النماذج.</p><Link to="/models">العودة</Link></div></section>
    );
  }

  const solved = answer.status === 'correct' || answer.status === 'revealed';
  const progress = ((session.currentIndex + 1) / queue.length) * 100;
  const answerText = current.question.answer ?? `${current.question.correctOption}. ${current.question.options.find((option) => option.label === current.question.correctOption)?.text ?? ''}`;
  const pdfPage = current.question.evidencePage ?? current.section.pdfPageStart ?? 1;
  const sourceHref = publicAssetUrl(model.sourceUrl);

  return (
    <section className="section shell exam-page">
      <div className="exam-heading">
        <div>
          <span className="section-kicker">تدريب نموذج تفاعلي</span>
          <h1>{model.title}</h1>
          {examDataError && <p className="partial-note partial-note--danger">{examDataError}</p>}
          {storageError && <p className="partial-note partial-note--danger">{storageError}</p>}
          {model.status === 'partial' && <p className="partial-note">{model.statusNote}</p>}
        </div>
        <div className="exam-heading__controls">
          <label><span>القسم</span><select value={sectionId} onChange={(event) => reset(event.target.value)}>
            <option value="all">النموذج كله</option>
            {model.sections.map((section) => <option value={section.id} key={section.id}>{section.title}</option>)}
          </select></label>
          <Link className="button button--ghost" to="/models">إنهاء</Link>
        </div>
      </div>

      <div className="session-progress"><span style={{ width: `${progress}%` }} /></div>
      <div className="exam-counter">السؤال {session.currentIndex + 1} من {queue.length} · Vraag {current.question.number}</div>

      <div className="mobile-reader-tabs" role="tablist" aria-label="التبديل بين النص والسؤال">
        <button className={mobileTab === 'text' ? 'is-active' : ''} onClick={() => setMobileTab('text')}>النص</button>
        <button className={mobileTab === 'question' ? 'is-active' : ''} onClick={() => setMobileTab('question')}>السؤال</button>
      </div>

      <div className="exam-workspace">
        <div className={mobileTab === 'text' ? 'workspace-pane is-mobile-active' : 'workspace-pane'}>
          <SourceReader section={current.section} sourceUrl={model.sourceUrl} title={current.section.title} />
          <button className="button button--primary mobile-continue" onClick={() => setMobileTab('question')}>انتقل إلى السؤال <ArrowLeft size={17} /></button>
        </div>

        <div className={mobileTab === 'question' ? 'workspace-pane is-mobile-active' : 'workspace-pane'}>
          <article className="exam-question-card">
            <div className="chip-row"><span className="chip chip--purple">{model.year}</span><span className="chip">Vraag {current.question.number}</span></div>
            <h2 lang="nl" dir="ltr">{current.question.question}</h2>

            {current.question.selfCheck || !current.question.correctOption ? (
              <div className="self-check-area">
                <div className="self-check-note"><FileQuestion size={20} /><p>اكتب جوابك بعد قراءة النص. هذا السؤال لا يحتوي اختيارات قابلة للتقييم الآلي في قاعدة البيانات.</p></div>
                <textarea value={draft} onChange={(event) => setDraft(event.target.value)} disabled={solved} placeholder="اكتب الفكرة أو كلمات الدليل…" />
                {!solved && <button className="button button--primary" onClick={submit} disabled={!draft.trim()}>إظهار الإجابة الموثقة</button>}
              </div>
            ) : (
              <fieldset className="exam-choices" disabled={solved}>
                <legend>اختر إجابة واحدة</legend>
                {current.question.options.map((option) => (
                  <label className={`choice${selected === option.label ? ' is-selected' : ''}${answer.status === 'correct' && option.label === current.question.correctOption ? ' is-correct' : ''}`} key={option.label}>
                    <input type="radio" name={current.question.id} checked={selected === option.label} onChange={() => setSelected(option.label)} />
                    <span className="choice__letter">{option.label}</span><span lang="nl" dir="ltr">{option.text}</span>
                  </label>
                ))}
                {!solved && <button className="button button--primary submit-answer" type="button" disabled={!selected} onClick={submit}>تثبيت الإجابة</button>}
              </fieldset>
            )}

            {answer.status === 'wrong' && <div className="feedback feedback--wrong" role="status"><CircleAlert size={24} /><div><strong>Niet goed.</strong><p>ارجع إلى النص وحاول مرة ثانية. لن يظهر الحل قبل الإجابة الصحيحة.</p></div></div>}

            {solved && (
              <div className="analysis-panel">
                {answer.status === 'correct' && <div className="feedback feedback--correct"><CheckCircle2 size={24} /><div><strong>Goed.</strong><p>اختيارك يطابق مفتاح الإجابة الرسمي.</p></div></div>}
                <section className="answer-panel"><small>الإجابة المعتمدة</small><p lang="nl" dir="ltr">{answerText}</p></section>
                {current.question.evidence ? (
                  <div className="evidence-box"><small>الدليل · صفحة {current.question.evidencePage ?? pdfPage}</small><p lang="nl" dir="ltr">{current.question.evidence}</p><a className="text-link" href={sourceHref} target="_blank" rel="noreferrer">فتح PDF ثم الانتقال للصفحة {current.question.evidencePage ?? pdfPage}</a></div>
                ) : (
                  <div className="evidence-box evidence-box--muted"><small>حالة الدليل</small><p>الإجابة مطابقة لمفتاح الإجابة الرسمي، لكن موضع الدليل التفصيلي لم يُوثق بعد.</p><a className="text-link" href={sourceHref} target="_blank" rel="noreferrer">فتح PDF للمراجعة، الصفحة التقريبية {pdfPage}</a></div>
                )}
                {(current.question.explanationAr ?? current.question.explanation) && <div className="arabic-explanation"><div><strong>الشرح</strong><p>{current.question.explanationAr ?? current.question.explanation}</p></div></div>}
                {current.question.wrongOptionExplanations && (
                  <div className="wrong-options-panel">
                    <strong>تحليل الاختيارات</strong>
                    {Object.entries(current.question.wrongOptionExplanations).map(([label, text]) => <p key={label}><span>{label}</span>{text}</p>)}
                  </div>
                )}
                <button className="button button--primary next-question" onClick={next}>{session.currentIndex + 1 === queue.length ? 'إنهاء النموذج' : 'السؤال التالي'} <ArrowLeft size={17} /></button>
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
