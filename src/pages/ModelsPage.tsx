import { ArrowLeft, BookOpenCheck, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { publicAssetUrl } from '../lib/assetUrl';
import { examModelById, examModels, sourceDocuments } from '../lib/exams';
import { examples } from '../lib/data';
import { paraphrasePairs } from '../lib/paraphrasePairs';
import { usePageMeta } from '../lib/pageMeta';

export function ModelsPage() {
  usePageMeta('النماذج');

  // تعرض صفحة النماذج الامتحانات الرسمية فقط. المواد الإضافية أو المستندات
  // المضافة بالخطأ لا تدخل هذه الصفحة حتى لو بقيت في مكتبة المصادر.
  const officialDocuments = sourceDocuments.filter((doc) => doc.category === 'official-exam');
  const officialQuestions = examModels.reduce((sum, model) => sum + model.questionCount, 0);

  return (
    <section className="section shell models-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">النماذج الرسمية الحديثة</span>
          <h1>نماذج Lezen الرسمية</h1>
          <p>
            النماذج الرسمية 2023 و2024 و2025 متاحة كتدريب تفاعلي كامل من حيث النص والسؤال والاختيارات ومفتاح الإجابة الرسمي. لا تُضاف معلومات من خارج ملفات المصدر.
          </p>
        </div>
      </div>

      <div className="coverage-banner">
        <div><strong>{officialQuestions}</strong><span>سؤالًا رسميًا في 3 نماذج</span></div>
        <div><strong>35/35</strong><span>لكل سنة: 2023 و2024 و2025</span></div>
        <div><strong>{examples.length}</strong><span>مثالًا في مكتبة إعادة الصياغة</span></div>
        <div><strong>{paraphrasePairs.length}</strong><span>علاقة لغوية في لعبة المعنى</span></div>
      </div>

      <section className="model-group">
        <div className="model-group__heading">
          <span className="feature-card__icon"><BookOpenCheck /></span>
          <div><h2>النماذج الرسمية</h2><p>{officialDocuments.length} نماذج</p></div>
        </div>

        <div className="model-grid">
          {officialDocuments.map((doc) => {
            const interactive = doc.interactiveModelId ? examModelById.get(doc.interactiveModelId) : null;
            return (
              <article className="model-card" key={doc.id}>
                <div className="model-card__top">
                  <div className="chip-row">
                    {doc.year && <span className="chip chip--purple">{doc.year}</span>}
                    <span className={`status-pill status-pill--${doc.status === 'complete' ? 'success' : doc.status === 'partial' ? 'warning' : 'neutral'}`}>
                      {doc.status === 'complete' ? 'كامل' : doc.status === 'partial' ? 'جزئي موثق' : 'PDF'}
                    </span>
                  </div>
                  <FileText size={22} />
                </div>
                <h3>{doc.title}</h3>
                <p>{doc.description}</p>
                {interactive && (
                  <div className="model-card__facts">
                    <span>{interactive.sections.length} نصوص</span>
                    <span>{interactive.questionCount} سؤالًا موجودًا</span>
                    <span>{interactive.officialQuestionCount ?? interactive.questionCount} العدد الرسمي</span>
                    <span>{Math.max(0, (interactive.officialQuestionCount ?? interactive.questionCount) - interactive.questionCount)} ناقص</span>
                    <span>{interactive.sourceUrl ? 'ملف النص موجود' : 'ملف النص غير موجود'}</span>
                    <span>{interactive.answerSourceUrl ? 'مفتاح الإجابة موجود' : 'مفتاح الإجابة غير موجود'}</span>
                    <span>{interactive.status === 'partial' ? `${interactive.questionCount} من ${interactive.officialQuestionCount ?? interactive.questionCount} سؤالًا مهيكلًا` : 'ملف الأسئلة مهيكل'}</span>
                  </div>
                )}
                <div className="model-card__actions">
                  {interactive && (
                    <Link className="button button--primary" to={`/models/${interactive.id}`}>
                      ابدأ التدريب <ArrowLeft size={17} />
                    </Link>
                  )}
                  <a className="button button--secondary" href={publicAssetUrl(doc.sourceUrl)} target="_blank" rel="noreferrer">فتح PDF</a>
                  {doc.answerUrl && <a className="text-link" href={publicAssetUrl(doc.answerUrl)} target="_blank" rel="noreferrer">مفتاح الإجابة</a>}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
