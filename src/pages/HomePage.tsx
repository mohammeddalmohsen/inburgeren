import { ArrowLeft, BookOpenText, Brain, CheckCircle2, Gamepad2, Layers3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { examples, skillLabels } from '../lib/data';
import { useProgress } from '../lib/ProgressContext';
import { paraphrasePairs } from '../lib/paraphrasePairs';
import { examModels } from '../lib/exams';
import { usePageMeta } from '../lib/pageMeta';

export function HomePage() {
  usePageMeta('الرئيسية');
  const { progress, ready } = useProgress();
  const rows = Object.values(progress);
  const mastered = rows.filter((row) => row.mastered).length;
  const review = rows.filter((row) => row.review).length;
  const answered = rows.filter((row) => row.attempts > 0).length;
  const officialQuestions = examModels.reduce((sum, model) => sum + model.questionCount, 0);

  return (
    <>
      <section className="hero-modern">
        <div className="hero-modern__glow" aria-hidden="true" />
        <div className="shell hero-modern__grid">
          <div className="hero-modern__copy">
            <span className="eyebrow"><Sparkles size={15} /> Staatsexamen NT2 · Programma I</span>
            <h1>افهم المعنى، لا تطارد الكلمة نفسها.</h1>
            <p>
              تدريب موثق على Lezen B1: النص موجود داخل الجلسة، ثم يظهر السؤال والاختيارات حيث تتوفر رسميًا. لا يظهر الدليل المحدد أو الحل قبل المحاولة، وتُسجَّل الأخطاء للمراجعة.
            </p>
            <div className="hero-modern__actions">
              <Link className="button button--primary button--large" to="/train">
                ابدأ جلسة من 5 أسئلة <ArrowLeft size={18} aria-hidden="true" />
              </Link>
              <Link className="button button--secondary button--large" to="/models">
                افتح النماذج
              </Link>
              <Link className="button button--light button--large" to="/phrases">
                <Gamepad2 size={18} aria-hidden="true" /> لعبة العبارات
              </Link>
            </div>
            <div className="hero-modern__metrics" aria-label="ملخص المحتوى">
              <div><strong>{officialQuestions}</strong><span>سؤالًا رسميًا مهيكلًا</span></div>
              <div><strong>2023–2025</strong><span>3 نماذج رسمية كاملة</span></div>
              <div><strong>{paraphrasePairs.length}</strong><span>علاقة لغوية للتدريب اليومي</span></div>
            </div>
          </div>

          <div className="hero-demo-card" aria-label="مثال على إعادة الصياغة">
            <div className="hero-demo-card__head">
              <span>Parafrase</span>
              <span className="status-pill status-pill--success">معنى واحد</span>
            </div>
            <div className="language-quote">
              <small>In de tekst</small>
              <p lang="nl" dir="ltr">heel goed je best doen</p>
            </div>
            <div className="meaning-equals">≈</div>
            <div className="language-quote language-quote--accent">
              <small>In het antwoord</small>
              <p lang="nl" dir="ltr">hard werken</p>
            </div>
            <div className="hero-demo-card__note">
              <CheckCircle2 size={20} aria-hidden="true" />
              <span>الكلمات مختلفة، لكن المعنى: يبذل جهدًا كبيرًا.</span>
            </div>
            <Link className="hero-demo-card__link" to="/phrases">تعلّم جميع العبارات كلعبة يومية <ArrowLeft size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div>
            <span className="section-kicker">طريق واضح</span>
            <h2>تدرّب بالطريقة التي يحتاجها الامتحان</h2>
          </div>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-card__icon"><Brain /></span>
            <h3>محاولة قبل الحل</h3>
            <p>يُخفى الجواب والدليل بالكامل. عند الخطأ يظهر Niet goed، وتبقى في السؤال نفسه حتى تحاول مرة أخرى.</p>
          </article>
          <article className="feature-card">
            <span className="feature-card__icon"><BookOpenText /></span>
            <h3>السؤال أولًا والبحث الذكي</h3>
            <p>ابدأ بالسؤال والاختيارات، وحدد كلمة البحث، ثم اقرأ الجزء المرتبط بالسؤال. لا تحتاج إلى قراءة النص كلمةً كلمة.</p>
          </article>
          <article className="feature-card">
            <span className="feature-card__icon"><Layers3 /></span>
            <h3>مراجعة دورية</h3>
            <p>في الجلسات الأطول تظهر وقفة بعد كل خمسة أسئلة، وتعرض الأخطاء وأنواع التحويل التي تحتاج إلى انتباه.</p>
          </article>
        </div>
      </section>

      <section className="section section--soft">
        <div className="shell">
          <div className="section-heading section-heading--split">
            <div>
              <span className="section-kicker">تقدمك على هذا الجهاز</span>
              <h2>{ready ? 'لوحة مختصرة' : 'جارٍ تحميل التقدم…'}</h2>
            </div>
            <Link className="text-link" to="/progress">التفاصيل <ArrowLeft size={16} /></Link>
          </div>
          <div className="dashboard-metrics">
            <article><span>أُجيب عنها</span><strong>{answered}</strong><small>من {examples.length}</small></article>
            <article><span>متقنة</span><strong>{mastered}</strong><small>حدّدتها بنفسك</small></article>
            <article><span>تحتاج مراجعة</span><strong>{review}</strong><small>تظهر أولًا في التدريب</small></article>
          </div>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div>
            <span className="section-kicker">المهارات</span>
            <h2>اختر نوع الفخ الذي تريد فهمه</h2>
          </div>
        </div>
        <div className="skill-grid">
          {Object.entries(skillLabels).map(([skill, label]) => {
            const count = examples.filter((example) => example.skill === skill).length;
            return (
              <Link key={skill} className="skill-card" to={`/library?skill=${skill}`}>
                <span>{label}</span><strong>{count}</strong><small>مثالًا</small>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
