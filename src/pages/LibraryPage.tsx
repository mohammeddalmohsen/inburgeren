import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Filter, RotateCcw, Search, Shuffle, XCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { levelLabels, skillLabels, transformationTypes, years } from '../lib/data';
import { useProgress } from '../lib/ProgressContext';
import { usePageMeta } from '../lib/pageMeta';
import { normalizeText } from '../lib/search';
import { paraphrasePairs, type ParaphrasePair } from '../lib/paraphrasePairs';
import { useToast } from '../lib/ToastContext';

const PAGE_SIZE = 12;

interface PairFilters {
  query: string;
  year: string;
  level: string;
  skill: string;
  type: string;
  status: 'all' | 'favorite' | 'review' | 'mastered';
  sort: 'year-asc' | 'year-desc' | 'question' | 'title';
}

const defaultFilters: PairFilters = {
  query: '',
  year: '',
  level: '',
  skill: '',
  type: '',
  status: 'all',
  sort: 'year-asc',
};

function optionSeed(pair: ParaphrasePair) {
  return pair.id.split('').reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 7), pair.questionNo);
}

function makeOptions(pair: ParaphrasePair) {
  const seed = optionSeed(pair);
  const distractors = paraphrasePairs
    .filter((item) => item.id !== pair.id && item.right !== pair.right)
    .sort((a, b) => ((a.questionNo * 19 + seed) % 67) - ((b.questionNo * 19 + seed) % 67))
    .slice(0, 2)
    .map((item) => item.right);
  return [pair.right, ...distractors]
    .slice(0, 3)
    .sort((a, b) => ((a.length + seed) % 17) - ((b.length + seed) % 17));
}

function filterPairs(filters: PairFilters, progress: ReturnType<typeof useProgress>['progress']) {
  const tokens = normalizeText(filters.query).split(' ').filter(Boolean);
  const filtered = paraphrasePairs.filter((pair) => {
    const row = progress[pair.exampleId] ?? {};
    if (filters.year && String(pair.year) !== filters.year) return false;
    if (filters.level && pair.level !== filters.level) return false;
    if (filters.skill && pair.skill !== filters.skill) return false;
    if (filters.type && pair.transformationType !== filters.type) return false;
    if (filters.status !== 'all' && !row[filters.status]) return false;
    if (!tokens.length) return true;
    const haystack = normalizeText([pair.left, pair.right, pair.meaning, pair.explanation, pair.title, pair.transformationType].join(' '));
    return tokens.every((token) => haystack.includes(token));
  });

  return [...filtered].sort((a, b) => {
    if (filters.sort === 'year-desc') return b.year - a.year || a.questionNo - b.questionNo;
    if (filters.sort === 'question') return a.questionNo - b.questionNo || a.year - b.year;
    if (filters.sort === 'title') return a.title.localeCompare(b.title, 'nl') || a.questionNo - b.questionNo;
    return a.year - b.year || a.questionNo - b.questionNo;
  });
}

function LibraryQuizCard({ pair, forceOpen = false }: { pair: ParaphrasePair; forceOpen?: boolean }) {
  const { get, toggle, recordAnswer } = useProgress();
  const [selected, setSelected] = useState('');
  const [hadWrong, setHadWrong] = useState(false);
  const [showDetails, setShowDetails] = useState(forceOpen);
  const progress = get(pair.exampleId);
  const options = useMemo(() => makeOptions(pair), [pair]);
  const correct = selected === pair.right;

  useEffect(() => {
    setSelected('');
    setHadWrong(false);
    setShowDetails(forceOpen);
  }, [forceOpen, pair.id]);

  const choose = async (option: string) => {
    if (correct) return;
    const isCorrect = option === pair.right;
    setSelected(option);
    if (!isCorrect) setHadWrong(true);
    if (isCorrect) setShowDetails(true);
    await recordAnswer(pair.exampleId, { correct: isCorrect, firstTry: !hadWrong, hadWrong });
  };

  return (
    <article className="study-card library-quiz-card" id={`pair-${pair.id}`}>
      <header className="study-card__header">
        <div className="chip-row">
          <span className="chip chip--purple">{pair.year}</span>
          <span className="chip">Vraag {pair.questionNo}</span>
          <span className="chip">{levelLabels[pair.level]}</span>
          <span className="chip">{skillLabels[pair.skill]}</span>
        </div>
        <button
          className={`small-icon-button${progress.favorite ? ' is-active' : ''}`}
          type="button"
          onClick={() => void toggle(pair.exampleId, 'favorite')}
          aria-pressed={progress.favorite}
          title="المفضلة"
        >
          ★
        </button>
      </header>

      <section className="question-panel library-prompt">
        <small>في النص قد تأتي بهذا الشكل</small>
        <p lang="nl" dir="ltr">{pair.left}</p>
        <span>اختر الصياغة التي تحمل المعنى نفسه في السؤال أو الجواب.</span>
      </section>

      <div className="meaning-choice-panel">
        <div className="meaning-choice-panel__head">
          <strong>أي عبارة تقابلها؟</strong>
          <span>{selected ? (correct ? 'صحيح' : 'حاول مرة أخرى') : 'اختر من 3'}</span>
        </div>
        <div className="meaning-options">
          {options.map((option) => {
            const isSelected = selected === option;
            const isCorrect = option === pair.right;
            return (
              <button
                key={option}
                className={`meaning-option${isSelected ? ' is-selected' : ''}${correct && isCorrect ? ' is-correct' : ''}${isSelected && !isCorrect ? ' is-wrong' : ''}`}
                type="button"
                onClick={() => void choose(option)}
                disabled={correct}
              >
                <span lang="nl" dir="ltr">{option}</span>
              </button>
            );
          })}
        </div>

        {selected && !correct && (
          <div className="feedback feedback--wrong" role="status">
            <XCircle size={21} />
            <div><strong>ليست الأقرب</strong><p>ابحث عن نفس الفكرة، لا عن كلمة تشبهها فقط.</p></div>
          </div>
        )}
        {correct && (
          <div className="feedback feedback--correct" role="status">
            <CheckCircle2 size={21} />
            <div><strong>صحيح</strong><p>{pair.meaning}</p></div>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="reveal-stack">
          <section className="evidence-grid">
            <div className="evidence-box">
              <small>In de tekst</small>
              <p lang="nl" dir="ltr">{pair.left}</p>
            </div>
            <div className="evidence-box evidence-box--accent">
              <small>In het antwoord</small>
              <p lang="nl" dir="ltr">{pair.right}</p>
            </div>
          </section>
          <section className="arabic-explanation">
            <div><strong>المعنى</strong><p>{pair.meaning}</p></div>
            <div><strong>من أين جاءت؟</strong><p>{pair.title} · {pair.transformationType}</p></div>
          </section>
        </div>
      )}

      <footer className="study-card__footer">
        <button
          className={`learning-toggle${progress.mastered ? ' is-active is-mastered' : ''}`}
          type="button"
          onClick={() => void toggle(pair.exampleId, 'mastered')}
          aria-pressed={progress.mastered}
        >{progress.mastered ? 'متقنة' : 'تعلّمتها'}</button>
        <button
          className={`learning-toggle${progress.review ? ' is-active is-review' : ''}`}
          type="button"
          onClick={() => void toggle(pair.exampleId, 'review')}
          aria-pressed={progress.review}
        >{progress.review ? 'ضمن المراجعة' : 'تحتاج مراجعة'}</button>
      </footer>
    </article>
  );
}

export function LibraryPage() {
  usePageMeta('المكتبة');
  const [searchParams, setSearchParams] = useSearchParams();
  const { progress } = useProgress();
  const { showToast } = useToast();
  const [filters, setFilters] = useState<PairFilters>(() => ({
    ...defaultFilters,
    skill: searchParams.get('skill') ?? '',
    query: searchParams.get('q') ?? '',
  }));
  const [page, setPage] = useState(1);
  const [targetPair, setTargetPair] = useState(searchParams.get('pair') ?? '');

  const filtered = useMemo(() => filterPairs(filters, progress), [filters, progress]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (!targetPair) return;
    const index = filtered.findIndex((item) => item.id === targetPair);
    if (index >= 0) setPage(Math.floor(index / PAGE_SIZE) + 1);
  }, [filtered, targetPair]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.skill) params.set('skill', filters.skill);
    if (targetPair) params.set('pair', targetPair);
    setSearchParams(params, { replace: true });
  }, [filters.query, filters.skill, setSearchParams, targetPair]);

  const update = <K extends keyof PairFilters>(key: K, value: PairFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setFilters(defaultFilters);
    setPage(1);
    setTargetPair('');
    showToast('تمت إعادة الفلاتر.', 'info');
  };

  const random = () => {
    const pool = filtered.length ? filtered : paraphrasePairs;
    if (!filtered.length) {
      setFilters(defaultFilters);
      showToast('لم توجد نتائج؛ أزيلت الفلاتر واختيرت عبارة من المكتبة كاملة.', 'warning');
    }
    const item = pool[Math.floor(Math.random() * pool.length)];
    setTargetPair(item.id);
    const index = (filtered.length ? filtered : paraphrasePairs).findIndex((entry) => entry.id === item.id);
    setPage(Math.floor(index / PAGE_SIZE) + 1);
    window.setTimeout(() => document.getElementById(`pair-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
  };

  return (
    <section className="section shell library-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">مكتبة تفاعلية</span>
          <h1>تدريب إعادة الصياغة</h1>
          <p>كل بطاقة تعرض عبارة واحدة من النص وثلاثة اختيارات. الخيار الصحيح هو الصياغة المختلفة التي تحمل المعنى نفسه في السؤال أو الجواب.</p>
        </div>
        <div className="page-heading__actions">
          <button className="button button--secondary" type="button" onClick={random}><Shuffle size={17} /> عبارة عشوائية</button>
          <button className="button button--ghost" type="button" onClick={reset}><RotateCcw size={17} /> إعادة الضبط</button>
        </div>
      </div>

      <div className="filter-panel library-filters">
        <div className="search-control">
          <label htmlFor="library-search">البحث</label>
          <div className="search-control__input">
            <Search size={19} aria-hidden="true" />
            <input
              id="library-search"
              type="search"
              value={filters.query}
              onChange={(event) => update('query', event.target.value)}
              placeholder="مثال: hard werken، toestemming، النفي"
            />
          </div>
        </div>

        <div className="filter-grid">
          <label><span>السنة</span><select value={filters.year} onChange={(e) => update('year', e.target.value)}>
            <option value="">كل السنوات</option>{years.map((year) => <option key={year}>{year}</option>)}
          </select></label>
          <label><span>المستوى</span><select value={filters.level} onChange={(e) => update('level', e.target.value)}>
            <option value="">كل المستويات</option>{Object.entries(levelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label><span>المهارة</span><select value={filters.skill} onChange={(e) => update('skill', e.target.value)}>
            <option value="">كل المهارات</option>{Object.entries(skillLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label><span>نوع التحويل</span><select value={filters.type} onChange={(e) => update('type', e.target.value)}>
            <option value="">كل الأنواع</option>{transformationTypes.map((type) => <option key={type}>{type}</option>)}
          </select></label>
          <label><span>الحالة</span><select value={filters.status} onChange={(e) => update('status', e.target.value as PairFilters['status'])}>
            <option value="all">كل الحالات</option><option value="favorite">المفضلة فقط</option><option value="review">بحاجة إلى مراجعة</option><option value="mastered">المتقنة فقط</option>
          </select></label>
          <label><span>الترتيب</span><select value={filters.sort} onChange={(e) => update('sort', e.target.value as PairFilters['sort'])}>
            <option value="year-asc">الأقدم أولًا</option><option value="year-desc">الأحدث أولًا</option><option value="question">رقم السؤال</option><option value="title">عنوان النص</option>
          </select></label>
        </div>
        <div className="filter-panel__note"><Filter size={16} /> ليست قائمة كلمات عامة؛ هذه علاقات معنى مستنتجة من أسئلة النماذج.</div>
      </div>

      <div className="results-line" role="status" aria-live="polite">
        <span><strong>{filtered.length}</strong> علاقة معنى</span>
        {filters.query && <span className="query-pill">بحث: {filters.query}</span>}
      </div>

      {pageItems.length ? (
        <div className="study-list">
          {pageItems.map((pair) => <LibraryQuizCard key={pair.id} pair={pair} forceOpen={pair.id === targetPair} />)}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={34} />
          <h2>لا توجد نتائج مطابقة</h2>
          <p>غيّر كلمة البحث أو أزل بعض الفلاتر.</p>
          <button className="button button--primary" type="button" onClick={reset}>عرض جميع العبارات</button>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="pagination" aria-label="صفحات النتائج">
          <button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>السابق</button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
            <button key={number} aria-current={number === page ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button>
          ))}
          <button disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>التالي</button>
        </nav>
      )}
    </section>
  );
}
