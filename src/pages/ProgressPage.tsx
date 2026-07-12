import { BarChart3, BookMarked, CircleCheckBig, RotateCcw, Star, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { examples, years } from '../lib/data';
import { deleteExamSession, getExamSessions, type ExamSessionRecord } from '../lib/db';
import { calculateExamSummary } from '../lib/examScoring';
import { examModels } from '../lib/exams';
import { useProgress } from '../lib/ProgressContext';
import { usePageMeta } from '../lib/pageMeta';

export function ProgressPage() {
  usePageMeta('التقدم');
  const { progress, sessions, ready, deleteTrainingResult } = useProgress();
  const [examSessions, setExamSessions] = useState<ExamSessionRecord[]>([]);
  const [expandedExamId, setExpandedExamId] = useState('');
  const [showAllTrainingSessions, setShowAllTrainingSessions] = useState(false);
  const [sessionSort, setSessionSort] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    getExamSessions().then(setExamSessions).catch(() => setExamSessions([]));
  }, []);

  const rows = Object.values(progress);
  const answered = rows.filter((row) => row.attempts > 0).length;
  const mastered = rows.filter((row) => row.mastered).length;
  const review = rows.filter((row) => row.review).length;
  const favorites = rows.filter((row) => row.favorite).length;
  const totalAttempts = rows.reduce((sum, row) => sum + row.attempts, 0);
  const wrongAttempts = rows.reduce((sum, row) => sum + row.wrongAttempts, 0);
  const firstTryCorrect = rows.reduce((sum, row) => sum + row.firstTryCorrect, 0);
  const accuracy = totalAttempts ? Math.round(((totalAttempts - wrongAttempts) / totalAttempts) * 100) : 0;

  const mistakeTypes = sessions
    .flatMap((session) => session.mistakeTypes)
    .reduce<Record<string, number>>((acc, type) => ({ ...acc, [type]: (acc[type] ?? 0) + 1 }), {});
  const topMistakes = Object.entries(mistakeTypes).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const unknownWords = rows.flatMap((row) => {
    const example = examples.find((item) => item.id === row.exampleId);
    return row.unknownWords.map((word) => ({ word, example }));
  });

  const supportedModelIds = useMemo(() => new Set(examModels.map((model) => model.id)), []);
  const completedExamSessions = useMemo(() => examSessions.filter((session) => supportedModelIds.has(session.modelId) && session.completed && !session.abandoned), [examSessions, supportedModelIds]);
  const examRows = completedExamSessions.map((session) => {
    const model = examModels.find((item) => item.id === session.modelId);
    const section = session.sectionId === 'all' ? null : model?.sections.find((item) => item.id === session.sectionId);
    const summary = calculateExamSummary(session.answers);
    return { session, model, section, summary };
  });
  const averageExamScore = examRows.length ? Math.round(examRows.reduce((sum, row) => sum + row.summary.scorePercent, 0) / examRows.length) : 0;
  const bestExamScore = examRows.length ? Math.max(...examRows.map((row) => row.summary.scorePercent)) : 0;
  const wrongByYear = examRows.reduce<Record<string, number>>((acc, row) => {
    const key = row.model ? String(row.model.year) : row.session.modelId;
    acc[key] = (acc[key] ?? 0) + row.summary.wrongAttempts;
    return acc;
  }, {});
  const worstYear = Object.entries(wrongByYear).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'لا يوجد';

  const removeExamSession = async (id: string) => {
    if (!window.confirm('هل تريد حذف هذه النتيجة من هذا الجهاز؟')) return;
    await deleteExamSession(id);
    setExamSessions((current) => current.filter((session) => session.id !== id));
  };

  const removeTrainingSession = async (id: string) => {
    if (!window.confirm('هل تريد حذف هذه الجلسة من السجل؟')) return;
    await deleteTrainingResult(id);
  };
  const sortedSessions = [...sessions].sort((a, b) => sessionSort === 'newest' ? b.completedAt - a.completedAt : a.completedAt - b.completedAt);
  const visibleSessions = showAllTrainingSessions ? sortedSessions : sortedSessions.slice(0, 8);

  if (!ready) return <section className="section shell"><div className="loading-card">جارٍ تحميل التقدم…</div></section>;

  return (
    <section className="section shell progress-page">
      <div className="page-heading">
        <div><span className="section-kicker">تحليل محلي</span><h1>تقدمك وأخطاؤك</h1><p>هذه الأرقام محفوظة في هذا المتصفح فقط. استخدم النسخة الاحتياطية عند تغيير الجهاز.</p></div>
        <Link className="button button--primary" to="/train">ابدأ جلسة جديدة</Link>
      </div>

      <div className="metric-grid">
        <Metric icon={<Target />} label="أُجيب عنها" value={answered} note={`من ${examples.length}`} />
        <Metric icon={<CircleCheckBig />} label="متقنة" value={mastered} note="بحسب تقييمك" />
        <Metric icon={<RotateCcw />} label="للمراجعة" value={review} note="تظهر أولًا في التدريب" />
        <Metric icon={<Star />} label="المفضلة" value={favorites} note="محفوظة للرجوع" />
        <Metric icon={<BarChart3 />} label="دقة المحاولات" value={`${accuracy}%`} note={`${wrongAttempts} خطأ من ${totalAttempts}`} />
        <Metric icon={<BookMarked />} label="من أول مرة" value={firstTryCorrect} note="إجابات صحيحة مباشرة" />
      </div>

      <div className="progress-layout">
        <section className="panel-card">
          <div className="panel-card__head"><div><span className="section-kicker">حسب النموذج</span><h2>التغطية السنوية</h2></div></div>
          <div className="year-bars">
            {years.map((year) => {
              const yearItems = examples.filter((example) => example.year === year);
              const done = yearItems.filter((example) => (progress[example.id]?.attempts ?? 0) > 0).length;
              const percent = Math.round((done / yearItems.length) * 100);
              return <div className="year-bar-row" key={year}><strong>{year}</strong><div><span style={{ width: `${percent}%` }} /></div><small>{done}/{yearItems.length}</small></div>;
            })}
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-card__head"><div><span className="section-kicker">أنماط متكررة</span><h2>أكثر أنواع الأخطاء</h2></div></div>
          {topMistakes.length ? <div className="rank-list">{topMistakes.map(([type, count], index) => <div key={type}><span>{index + 1}</span><p>{type}</p><strong>{count}</strong></div>)}</div> : <div className="panel-empty">أكمل جلسة تدريب حتى تظهر الأنماط هنا.</div>}
        </section>
      </div>

      <section className="panel-card">
        <div className="panel-card__head"><div><span className="section-kicker">النماذج الرسمية</span><h2>نتائج النماذج الكاملة</h2></div></div>
        <div className="metric-grid metric-grid--compact">
          <Metric icon={<BookMarked />} label="نماذج مكتملة" value={completedExamSessions.length} note="محفوظة محليًا" />
          <Metric icon={<BarChart3 />} label="متوسط النتيجة" value={`${averageExamScore}%`} note="دون self-check" />
          <Metric icon={<Target />} label="أفضل نتيجة" value={`${bestExamScore}%`} note="أفضل جلسة مكتملة" />
          <Metric icon={<RotateCcw />} label="أكثر سنة فيها أخطاء" value={worstYear} note="حسب المحاولات الخاطئة" />
        </div>
        {examRows.length ? (
          <div className="exam-result-list">
            {examRows.map(({ session, model, section, summary }) => (
              <article key={session.id} className="exam-result-card">
                <div>
                  <strong>{model?.title ?? session.modelId}</strong>
                  <span>{section?.title ?? 'النموذج كله'}</span>
                </div>
                <dl>
                  <div><dt>تاريخ البدء</dt><dd>{new Date(session.startedAt).toLocaleString('ar')}</dd></div>
                  <div><dt>تاريخ الإكمال</dt><dd>{session.completedAt ? new Date(session.completedAt).toLocaleString('ar') : 'غير مسجل'}</dd></div>
                  <div><dt>قابل للتقييم</dt><dd>{summary.automaticallyScoredQuestions}</dd></div>
                  <div><dt>من أول محاولة</dt><dd>{summary.firstTryCorrect}</dd></div>
                  <div><dt>بعد الخطأ</dt><dd>{summary.correctedAfterWrong}</dd></div>
                  <div><dt>محاولات خاطئة</dt><dd>{summary.wrongAttempts}</dd></div>
                  <div><dt>تقييم ذاتي</dt><dd>{summary.selfCheckCount}</dd></div>
                  <div><dt>النسبة</dt><dd>{summary.scorePercent}%</dd></div>
                </dl>
                {expandedExamId === session.id && (
                  <div className="exam-result-details">
                    {session.answers.map((answer) => <span key={answer.questionId}>{answer.questionId}: {answer.status} · أخطاء {answer.wrongAttempts}</span>)}
                  </div>
                )}
                <div className="summary-actions">
                  <button className="button button--secondary" type="button" onClick={() => setExpandedExamId(expandedExamId === session.id ? '' : session.id)}>عرض التفاصيل</button>
                  <button className="button button--danger" type="button" onClick={() => void removeExamSession(session.id)}>حذف هذه النتيجة</button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="panel-empty">أكمل نموذجًا رسميًا حتى تظهر النتائج هنا.</div>}
      </section>

      <div className="progress-layout">
        <section className="panel-card">
          <div className="panel-card__head"><div><span className="section-kicker">مفرداتك</span><h2>كلمات لم أفهمها</h2></div><Link className="text-link" to="/library">فتح المكتبة</Link></div>
          {unknownWords.length ? <div className="word-cloud-list">{unknownWords.map(({ word, example }, index) => <div key={`${word}-${index}`}><strong lang="nl" dir="ltr">{word}</strong><span>{example ? `${example.year} · Vraag ${example.questionNo}` : ''}</span></div>)}</div> : <div className="panel-empty">أضف الكلمات من بطاقات المكتبة أو بعد حل السؤال.</div>}
        </section>

        <section className="panel-card">
          <div className="panel-card__head">
            <div><span className="section-kicker">السجل</span><h2>الجلسات الأخيرة</h2></div>
            <label className="compact-select"><span>الترتيب</span><select value={sessionSort} onChange={(event) => setSessionSort(event.target.value as 'newest' | 'oldest')}><option value="newest">الأحدث</option><option value="oldest">الأقدم</option></select></label>
          </div>
          {sessions.length ? (
            <>
              <p className="list-count">عرض {visibleSessions.length} من {sessions.length}</p>
              <div className="session-list">{visibleSessions.map((session) => <article key={session.id}><div><strong>{new Date(session.completedAt).toLocaleDateString('ar')}</strong><span>{session.total} أسئلة</span></div><p>{session.correctFirstTry} من أول مرة</p><small>{session.wrongAttempts} محاولات خاطئة</small><button className="text-link" type="button" onClick={() => void removeTrainingSession(session.id)}>حذف</button></article>)}</div>
              {sessions.length > 8 && <button className="button button--secondary" type="button" onClick={() => setShowAllTrainingSessions((value) => !value)}>{showAllTrainingSessions ? 'عرض أقل' : 'عرض الكل'}</button>}
            </>
          ) : <div className="panel-empty">لا توجد جلسات محفوظة بعد.</div>}
        </section>
      </div>
    </section>
  );
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string | number; note: string }) {
  return <article className="metric-card"><span className="metric-card__icon">{icon}</span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}
