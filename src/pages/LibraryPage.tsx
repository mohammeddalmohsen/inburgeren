import { useEffect, useMemo, useState } from 'react';
import { Filter, RotateCcw, Search, Shuffle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { StudyCard } from '../components/StudyCard';
import { examples, levelLabels, skillLabels, transformationTypes, years } from '../lib/data';
import { useProgress } from '../lib/ProgressContext';
import { filterExamples, type ExampleFilters } from '../lib/search';
import { useToast } from '../lib/ToastContext';

const PAGE_SIZE = 10;
const defaultFilters: ExampleFilters = {
  query: '',
  scope: 'all',
  year: '',
  level: '',
  skill: '',
  type: '',
  mode: '',
  status: 'all',
  sort: 'year-asc',
};

export function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { progress } = useProgress();
  const { showToast } = useToast();
  const [filters, setFilters] = useState<ExampleFilters>(() => ({
    ...defaultFilters,
    skill: searchParams.get('skill') ?? '',
    query: searchParams.get('q') ?? '',
  }));
  const [page, setPage] = useState(1);
  const [targetExample, setTargetExample] = useState(searchParams.get('example') ?? '');

  const filtered = useMemo(() => filterExamples(examples, filters, progress), [filters, progress]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (!targetExample) return;
    const index = filtered.findIndex((item) => item.id === targetExample);
    if (index >= 0) setPage(Math.floor(index / PAGE_SIZE) + 1);
  }, [filtered, targetExample]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.skill) params.set('skill', filters.skill);
    if (targetExample) params.set('example', targetExample);
    setSearchParams(params, { replace: true });
  }, [filters.query, filters.skill, setSearchParams, targetExample]);

  const update = <K extends keyof ExampleFilters>(key: K, value: ExampleFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setFilters(defaultFilters);
    setPage(1);
    setTargetExample('');
    showToast('تمت إعادة الفلاتر.', 'info');
  };

  const random = () => {
    const pool = filtered.length ? filtered : examples;
    if (!filtered.length) {
      setFilters(defaultFilters);
      showToast('لم توجد نتائج؛ أزيلت الفلاتر واختير مثال من المكتبة كاملة.', 'warning');
    }
    const item = pool[Math.floor(Math.random() * pool.length)];
    setTargetExample(item.id);
    const index = (filtered.length ? filtered : examples).findIndex((entry) => entry.id === item.id);
    setPage(Math.floor(index / PAGE_SIZE) + 1);
    window.setTimeout(() => document.getElementById(`example-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
  };

  return (
    <section className="section shell library-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">مكتبة موثقة</span>
          <h1>أمثلة إعادة الصياغة</h1>
          <p>الجواب والدليل مخفيان افتراضيًا. ابحث في المجال الذي تختاره ثم اكشف المثال بعد أن تفكر.</p>
        </div>
        <div className="page-heading__actions">
          <button className="button button--secondary" type="button" onClick={random}><Shuffle size={17} /> مثال عشوائي</button>
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
              placeholder="مثال: hard werken، toestemming، النفي…"
            />
          </div>
        </div>

        <div className="filter-grid">
          <label><span>مجال البحث</span><select value={filters.scope} onChange={(e) => update('scope', e.target.value as ExampleFilters['scope'])}>
            <option value="all">جميع الحقول</option>
            <option value="question">السؤال والعنوان</option>
            <option value="evidence">الدليل والرابط المعنوي</option>
            <option value="meaning">المعنى والشرح العربي</option>
          </select></label>
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
          <label><span>نوع التدريب</span><select value={filters.mode} onChange={(e) => update('mode', e.target.value)}>
            <option value="">الكل</option><option value="multiple-choice">اختيارات أصلية</option><option value="self-check">تقييم ذاتي</option>
          </select></label>
          <label><span>الحالة</span><select value={filters.status} onChange={(e) => update('status', e.target.value as ExampleFilters['status'])}>
            <option value="all">كل الحالات</option><option value="favorite">المفضلة فقط</option><option value="review">بحاجة إلى مراجعة</option><option value="mastered">المتقنة فقط</option>
          </select></label>
          <label><span>الترتيب</span><select value={filters.sort} onChange={(e) => update('sort', e.target.value as ExampleFilters['sort'])}>
            <option value="year-asc">الأقدم أولًا</option><option value="year-desc">الأحدث أولًا</option><option value="question">رقم السؤال</option><option value="title">عنوان النص</option>
          </select></label>
        </div>
        <div className="filter-panel__note"><Filter size={16} /> فلتر الحالة واحد فقط؛ لا يمكن تشغيل «متقنة» و«مراجعة» معًا.</div>
      </div>

      <div className="results-line" role="status" aria-live="polite">
        <span><strong>{filtered.length}</strong> نتيجة</span>
        {filters.query && <span className="query-pill">بحث: {filters.query}</span>}
      </div>

      {pageItems.length ? (
        <div className="study-list">
          {pageItems.map((example) => <StudyCard key={example.id} example={example} forceOpen={example.id === targetExample} />)}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={34} />
          <h2>لا توجد نتائج مطابقة</h2>
          <p>غيّر كلمة البحث أو أزل بعض الفلاتر.</p>
          <button className="button button--primary" type="button" onClick={reset}>عرض جميع الأمثلة</button>
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
