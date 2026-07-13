import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Check, CheckCircle2, EyeOff, RotateCcw, Share2, Star, XCircle } from 'lucide-react';
import type { Example } from '../lib/schema';
import { levelLabels, skillLabels } from '../lib/data';
import { paraphrasePairs, type ParaphrasePair } from '../lib/paraphrasePairs';
import { useProgress } from '../lib/ProgressContext';
import { useToast } from '../lib/ToastContext';
import { SourceLink } from './SourceLink';

function optionSeed(pair: ParaphrasePair) {
  return pair.id.split('').reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 5), pair.questionNo);
}

function pickPrimaryPair(example: Example) {
  const pairs = paraphrasePairs.filter((pair) => pair.exampleId === example.id);
  return pairs.find((pair) => example.evidence.toLocaleLowerCase('nl').includes(pair.left.toLocaleLowerCase('nl')))
    ?? pairs[0]
    ?? {
      id: `${example.id}--fallback`,
      exampleId: example.id,
      left: example.evidence,
      right: example.answer,
      meaning: example.meaning,
      explanation: example.explanation,
      year: example.year,
      questionNo: example.questionNo,
      title: example.title,
      transformationType: example.transformationType,
      skill: example.skill,
      level: example.level,
    };
}

function makeMeaningOptions(pair: ParaphrasePair) {
  const seed = optionSeed(pair);
  const distractors = paraphrasePairs
    .filter((item) => item.id !== pair.id && item.right.trim() && item.right !== pair.right)
    .sort((a, b) => ((a.questionNo * 17 + seed) % 53) - ((b.questionNo * 17 + seed) % 53))
    .slice(0, 2)
    .map((item) => item.right);
  return [pair.right, ...distractors]
    .slice(0, 3)
    .sort((a, b) => ((a.length + seed) % 13) - ((b.length + seed) % 13));
}

export function StudyCard({ example, forceOpen = false }: { example: Example; forceOpen?: boolean }) {
  const [selected, setSelected] = useState('');
  const [hadWrong, setHadWrong] = useState(false);
  const [revealed, setRevealed] = useState(forceOpen);
  const [word, setWord] = useState('');
  const cardRef = useRef<HTMLElement>(null);
  const { get, toggle, markOpened, recordAnswer, addUnknownWord } = useProgress();
  const { showToast } = useToast();
  const progress = get(example.id);
  const primaryPair = useMemo(() => pickPrimaryPair(example), [example]);
  const options = useMemo(() => makeMeaningOptions(primaryPair), [primaryPair]);
  const answered = selected.length > 0;
  const correct = selected === primaryPair.right;

  useEffect(() => {
    setSelected('');
    setHadWrong(false);
    setRevealed(forceOpen);
  }, [example.id, forceOpen]);

  useEffect(() => {
    if (!forceOpen) return;
    setRevealed(true);
    window.setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
  }, [forceOpen]);

  const choose = async (option: string) => {
    if (correct) return;
    setSelected(option);
    const isCorrect = option === primaryPair.right;
    if (!isCorrect) setHadWrong(true);
    if (isCorrect) setRevealed(true);
    await recordAnswer(example.id, { correct: isCorrect, firstTry: !hadWrong, hadWrong });
  };

  const revealDetails = async () => {
    setRevealed(true);
    await markOpened(example.id);
  };

  const share = async () => {
    const base = window.location.protocol === 'file:'
      ? window.location.href.split('#')[0]
      : `${window.location.origin}${window.location.pathname}`;
    const url = `${base}#/library?example=${encodeURIComponent(example.id)}`;
    const payload = { title: `${example.year} · Vraag ${example.questionNo}`, text: example.question, url };
    try {
      if (navigator.share) await navigator.share(payload);
      else await navigator.clipboard.writeText(url);
      showToast(window.location.protocol === 'file:' ? 'نُسخ رابط محلي؛ يصبح قابلًا للمشاركة بعد نشر الموقع.' : 'تم تجهيز رابط نظيف لهذا المثال.', 'success');
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') showToast('تعذّر نسخ الرابط في هذا المتصفح.', 'warning');
    }
  };

  const saveWord = async () => {
    if (!word.trim()) return;
    await addUnknownWord(example.id, word);
    setWord('');
    showToast('أضيفت الكلمة إلى قائمة الكلمات غير المفهومة.', 'success');
  };

  return (
    <article className="study-card" id={`example-${example.id}`} ref={cardRef}>
      <header className="study-card__header">
        <div className="chip-row">
          <span className="chip chip--purple">{example.year}</span>
          <span className="chip">Vraag {example.questionNo}</span>
          <span className="chip">{levelLabels[example.level]}</span>
          <span className="chip">{skillLabels[example.skill]}</span>
        </div>
        <div className="card-action-row">
          <button
            className={`small-icon-button${progress.favorite ? ' is-active' : ''}`}
            type="button"
            onClick={() => void toggle(example.id, 'favorite')}
            aria-pressed={progress.favorite}
            title="المفضلة"
          ><Star size={18} /></button>
          <button className="small-icon-button" type="button" onClick={() => void share()} title="مشاركة المثال">
            <Share2 size={18} />
          </button>
        </div>
      </header>

      <div className="study-card__title-row">
        <div>
          <small lang="nl">Parafrase uit het examen</small>
          <h3 lang="nl" dir="ltr">{example.title}</h3>
        </div>
        <span className={`mode-badge mode-badge--${example.mode}`}>
          {example.mode === 'multiple-choice' ? 'اختيارات أصلية' : 'تقييم ذاتي'}
        </span>
      </div>

      <section className="question-panel library-prompt">
        <small>في النص قد تأتي بهذا الشكل</small>
        <p lang="nl" dir="ltr">{primaryPair.left}</p>
        <span>اختر العبارة التي تحمل المعنى نفسه في السؤال أو الجواب.</span>
      </section>

      <div className="meaning-choice-panel">
        <div className="meaning-choice-panel__head">
          <strong>ما العبارة الأقرب؟</strong>
          <span>{answered ? (correct ? 'صحيح' : 'جرّب مرة أخرى') : '3 اختيارات'}</span>
        </div>
        <div className="meaning-options">
          {options.map((option) => {
            const isSelected = selected === option;
            const isCorrect = option === primaryPair.right;
            const showCorrect = correct && isCorrect;
            return (
              <button
                key={option}
                className={`meaning-option${isSelected ? ' is-selected' : ''}${showCorrect ? ' is-correct' : ''}${isSelected && !isCorrect ? ' is-wrong' : ''}`}
                type="button"
                onClick={() => void choose(option)}
                disabled={correct}
              >
                <span lang="nl" dir="ltr">{option}</span>
              </button>
            );
          })}
        </div>

        {answered && !correct && (
          <div className="feedback feedback--wrong" role="status">
            <XCircle size={21} />
            <div><strong>ليست الأقرب</strong><p>الكلمات قد تبدو قريبة، لكن المطلوب هو المعنى نفسه. اختر مرة أخرى.</p></div>
          </div>
        )}
        {correct && (
          <div className="feedback feedback--correct" role="status">
            <CheckCircle2 size={21} />
            <div><strong>صحيح</strong><p>{example.meaning}</p></div>
          </div>
        )}
      </div>

      {revealed ? (
        <div className="reveal-stack">
          <section className="question-panel">
            <small>السؤال الأصلي</small>
            <p lang="nl" dir="ltr">{example.question}</p>
          </section>

          <section className="answer-panel">
            <small>الإجابة المعتمدة</small>
            <p lang="nl" dir="ltr">{example.answer}</p>
          </section>

          {example.options.length > 0 && (
            <section className="option-review">
              <h4>الاختيارات الأصلية</h4>
              <div className="option-review__list">
                {example.options.map((option) => {
                  const correct = option.label === example.correctOption;
                  return (
                    <div key={option.label} className={`review-option${correct ? ' is-correct' : ''}`}>
                      <span>{option.label}</span>
                      <p lang="nl" dir="ltr">{option.text}</p>
                      <small>{correct ? 'الإجابة الرسمية' : 'غير مطابق لمفتاح الإجابة الرسمي'}</small>
                    </div>
                  );
                })}
              </div>
              <p className="honesty-note">لا يضيف الموقع سببًا مخترعًا لكل مشتّت؛ الدليل أدناه هو المرجع للحكم.</p>
            </section>
          )}

          <section className="evidence-grid">
            <div className="evidence-box">
              <small>الدليل من النص</small>
              <p lang="nl" dir="ltr">{example.evidence}</p>
            </div>
            <div className="evidence-box evidence-box--accent">
              <small>الرابط المعنوي</small>
              <p lang="nl" dir="ltr">{primaryPair.left} ↔ {primaryPair.right}</p>
            </div>
          </section>

          <section className="arabic-explanation">
            <div><strong>المعنى بالعربية</strong><p>{example.meaning}</p></div>
            <div><strong>كيف وجدت الإجابة؟</strong><p>{example.explanation}</p></div>
          </section>

          <div className="source-and-word">
            <SourceLink example={example} />
            <div className="unknown-word-entry">
              <label htmlFor={`word-${example.id}`}>كلمة لم أفهمها</label>
              <div>
                <input
                  id={`word-${example.id}`}
                  value={word}
                  onChange={(event) => setWord(event.target.value)}
                  placeholder="اكتب الكلمة الهولندية"
                  lang="nl"
                  dir="ltr"
                />
                <button className="button button--secondary" type="button" onClick={() => void saveWord()}>
                  حفظ
                </button>
              </div>
            </div>
          </div>

          <button className="collapse-button" type="button" onClick={() => setRevealed(false)}>
            <EyeOff size={16} /> إخفاء الجواب مرة أخرى
          </button>
        </div>
      ) : (
        <div className="hidden-answer-panel hidden-answer-panel--compact">
          <div>
            <strong>التفاصيل مخفية</strong>
            <p>اختر العبارة الصحيحة أولًا. يمكنك كشف التفاصيل إذا كنت تراجع فقط.</p>
          </div>
          <button className="button button--secondary" type="button" onClick={() => void revealDetails()}>
            كشف الشرح
          </button>
        </div>
      )}

      <footer className="study-card__footer">
        <button
          className={`learning-toggle${progress.mastered ? ' is-active is-mastered' : ''}`}
          type="button"
          onClick={() => void toggle(example.id, 'mastered')}
          aria-pressed={progress.mastered}
        ><Check size={17} /> {progress.mastered ? 'متقنة' : 'تعلّمتها'}</button>
        <button
          className={`learning-toggle${progress.review ? ' is-active is-review' : ''}`}
          type="button"
          onClick={() => void toggle(example.id, 'review')}
          aria-pressed={progress.review}
        ><RotateCcw size={17} /> {progress.review ? 'ضمن المراجعة' : 'تحتاج مراجعة'}</button>
        <button
          className={`learning-toggle${progress.favorite ? ' is-active' : ''}`}
          type="button"
          onClick={() => void toggle(example.id, 'favorite')}
          aria-pressed={progress.favorite}
        ><Bookmark size={17} /> {progress.favorite ? 'محفوظة' : 'حفظ'}</button>
      </footer>
    </article>
  );
}
