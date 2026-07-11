import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, CircleAlert, FileQuestion, RotateCcw } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { SourceReader } from '../components/SourceReader';
import { examModelById, type ExamQuestion, type ExamSection } from '../lib/exams';

interface FlatQuestion {
  section: ExamSection;
  question: ExamQuestion;
}

type AnswerState = {
  selected: string;
  status: 'idle' | 'wrong' | 'correct' | 'revealed';
  wrongAttempts: number;
  draft: string;
};

const initialAnswer: AnswerState = { selected: '', status: 'idle', wrongAttempts: 0, draft: '' };

export function ExamPage() {
  const { modelId } = useParams();
  const model = modelId ? examModelById.get(modelId) : null;
  const [sectionId, setSectionId] = useState<string>('all');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<AnswerState>(initialAnswer);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [mobileTab, setMobileTab] = useState<'text' | 'question'>('text');

  const queue = useMemo<FlatQuestion[]>(() => {
    if (!model) return [];
    const sections = sectionId === 'all' ? model.sections : model.sections.filter((section) => section.id === sectionId);
    return sections.flatMap((section) => section.questions.map((question) => ({ section, question })));
  }, [model, sectionId]);

  if (!model) return <Navigate to="/models" replace />;

  const current = queue[index];

  const reset = (nextSectionId = sectionId) => {
    setSectionId(nextSectionId);
    setIndex(0);
    setAnswer(initialAnswer);
    setCorrectCount(0);
    setFinished(false);
    setMobileTab('text');
  };

  const submit = () => {
    if (!current) return;
    if (current.question.selfCheck || !current.question.correctOption) {
      if (!answer.draft.trim()) return;
      setAnswer((state) => ({ ...state, status: 'revealed' }));
      return;
    }
    if (!answer.selected) return;
    if (answer.selected !== current.question.correctOption) {
      setAnswer((state) => ({ ...state, status: 'wrong', selected: '', wrongAttempts: state.wrongAttempts + 1 }));
      return;
    }
    setAnswer((state) => ({ ...state, status: 'correct' }));
    setCorrectCount((value) => value + 1);
  };

  const next = () => {
    if (index + 1 >= queue.length) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setAnswer(initialAnswer);
    setMobileTab('text');
  };

  if (finished) {
    return (
      <section className="section shell checkpoint-page">
        <div className="summary-card summary-card--final">
          <span className="summary-icon"><CheckCircle2 /></span>
          <span className="section-kicker">انتهى النموذج</span>
          <h1>{model.title}</h1>
          <div className="summary-metrics">
            <div><strong>{queue.length}</strong><span>سؤالًا</span></div>
            <div><strong>{correctCount}</strong><span>إجابة صحيحة</span></div>
            <div><strong>{queue.length ? Math.round((correctCount / queue.length) * 100) : 0}%</strong><span>النتيجة</span></div>
          </div>
          <p>في الأسئلة ذات التقييم الذاتي لا تُحسب النتيجة تلقائيًا، لأن الاختيارات الكاملة غير موجودة في المصدر.</p>
          <div className="summary-actions">
            <button className="button button--primary" onClick={() => reset()}><RotateCcw size={17} /> إعادة النموذج</button>
            <Link className="button button--secondary" to="/models">العودة إلى النماذج</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!current) {
    return (
      <section className="section shell"><div className="empty-state"><FileQuestion /><h1>لا توجد أسئلة في هذا القسم</h1><Link to="/models">العودة</Link></div></section>
    );
  }

  const solved = answer.status === 'correct' || answer.status === 'revealed';
  const progress = ((index + 1) / queue.length) * 100;

  return (
    <section className="section shell exam-page">
      <div className="exam-heading">
        <div>
          <span className="section-kicker">تدريب نموذج كامل</span>
          <h1>{model.title}</h1>
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
      <div className="exam-counter">السؤال {index + 1} من {queue.length} · Vraag {current.question.number}</div>

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
                <div className="self-check-note"><FileQuestion size={20} /><p>اكتب جوابك بعد قراءة النص. لا توجد اختيارات كاملة في الملف المرفق، لذلك لا نختلق إجابات وهمية.</p></div>
                <textarea value={answer.draft} onChange={(event) => setAnswer((state) => ({ ...state, draft: event.target.value }))} disabled={solved} placeholder="اكتب الفكرة أو كلمات الدليل…" />
                {!solved && <button className="button button--primary" onClick={submit} disabled={!answer.draft.trim()}>إظهار الإجابة الموثقة</button>}
              </div>
            ) : (
              <fieldset className="exam-choices" disabled={solved}>
                <legend>اختر إجابة واحدة</legend>
                {current.question.options.map((option) => (
                  <label className={`choice${answer.selected === option.label ? ' is-selected' : ''}${answer.status === 'correct' && option.label === current.question.correctOption ? ' is-correct' : ''}`} key={option.label}>
                    <input type="radio" name={current.question.id} checked={answer.selected === option.label} onChange={() => setAnswer((state) => ({ ...state, selected: option.label, status: state.status === 'wrong' ? 'idle' : state.status }))} />
                    <span className="choice__letter">{option.label}</span><span lang="nl" dir="ltr">{option.text}</span>
                  </label>
                ))}
                {!solved && <button className="button button--primary submit-answer" type="button" disabled={!answer.selected} onClick={submit}>تثبيت الإجابة</button>}
              </fieldset>
            )}

            {answer.status === 'wrong' && <div className="feedback feedback--wrong" role="status"><CircleAlert size={24} /><div><strong>Niet goed.</strong><p>ارجع إلى النص وحاول مرة ثانية. لن يظهر الحل قبل الإجابة الصحيحة.</p></div></div>}

            {solved && (
              <div className="analysis-panel">
                {answer.status === 'correct' && <div className="feedback feedback--correct"><CheckCircle2 size={24} /><div><strong>Goed.</strong><p>اختيارك يطابق مفتاح الإجابة.</p></div></div>}
                <section className="answer-panel"><small>الإجابة المعتمدة</small><p lang="nl" dir="ltr">{current.question.answer ?? `${current.question.correctOption}. ${current.question.options.find((option) => option.label === current.question.correctOption)?.text ?? ''}`}</p></section>
                {current.question.evidence && <div className="evidence-box"><small>الدليل</small><p lang="nl" dir="ltr">{current.question.evidence}</p></div>}
                {current.question.explanation && <div className="arabic-explanation"><div><strong>الشرح</strong><p>{current.question.explanation}</p></div></div>}
                <button className="button button--primary next-question" onClick={next}>{index + 1 === queue.length ? 'إنهاء النموذج' : 'السؤال التالي'} <ArrowLeft size={17} /></button>
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
