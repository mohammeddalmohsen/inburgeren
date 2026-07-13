import { ArrowLeft, BookOpenText, Brain, CheckCircle2, Gamepad2, Layers3, SearchCheck, Sparkles } from 'lucide-react';
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
              تدريب موثق على Lezen B1 يركز على المهارة الأهم: أن تجد الفكرة نفسها عندما تظهر في النص بكلمات، وفي السؤال أو الجواب بكلمات أخرى.
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
            <span className="section-kicker">طريقة تعلّم عملية</span>
            <h2>تدرّب على المعنى كما يأتي في الامتحان</h2>
          </div>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-card__icon"><Brain /></span>
            <h3>المعنى قبل الكلمة</h3>
            <p>لا تبحث عن نفس الكلمة حرفيًا. تعلّم أن ترى أن عبارة مثل heel goed je best doen قد تعني في الجواب hard werken.</p>
          </article>
          <article className="feature-card">
            <span className="feature-card__icon"><SearchCheck /></span>
            <h3>سؤال ثم دليل</h3>
            <p>اقرأ السؤال والاختيارات لتعرف ما تبحث عنه، ثم ارجع إلى النص للعبارة التي تحمل نفس الفكرة لا نفس الشكل.</p>
          </article>
          <article className="feature-card">
            <span className="feature-card__icon"><Gamepad2 /></span>
            <h3>تكرار قصير يوميًا</h3>
            <p>المكتبة ولعبة المعنى تعرضان عبارة واحدة وثلاث اختيارات. عشر دقائق يوميًا تكفي لبناء حسّ إعادة الصياغة.</p>
          </article>
          <article className="feature-card">
            <span className="feature-card__icon"><Layers3 /></span>
            <h3>مراجعة الأخطاء</h3>
            <p>كل اختيار خاطئ يتحول إلى مراجعة، حتى ترى الأنماط التي تخدعك: مرادف، نفي، سبب ونتيجة، أو تلخيص.</p>
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
