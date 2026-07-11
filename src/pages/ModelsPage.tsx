import { ArrowLeft, BookOpenCheck, FileText, GraduationCap, LibraryBig, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { examModelById, sourceDocuments } from '../lib/exams';

const categoryLabels = {
  'official-exam': 'نماذج رسمية',
  practice: 'نماذج تدريبية حديثة',
  collection: 'مجموعات',
  techniques: 'تقنيات القراءة',
} as const;

const categoryIcons = {
  'official-exam': BookOpenCheck,
  practice: GraduationCap,
  collection: LibraryBig,
  techniques: Wrench,
} as const;

export function ModelsPage() {
  const groups = Object.entries(categoryLabels).map(([category, label]) => ({
    category: category as keyof typeof categoryLabels,
    label,
    documents: sourceDocuments.filter((doc) => doc.category === category),
  })).filter((group) => group.documents.length);

  return (
    <section className="section shell models-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">كل المواد في مكان واحد</span>
          <h1>النماذج وملفات القراءة</h1>
          <p>
            النماذج الرسمية 2020–2024 متاحة كتدريب تفاعلي كامل مع النص والأسئلة والاختيارات.
            نموذج 2025 الرسمي مُدرج بقدر المواد المرفقة، وتوجد أيضًا مجموعات تدريبية حديثة بصيغة PDF.
          </p>
        </div>
      </div>

      <div className="coverage-banner">
        <div><strong>178</strong><span>سؤالًا رسميًا كاملًا 2020–2024</span></div>
        <div><strong>19</strong><span>مسألة موثقة من 2025</span></div>
        <div><strong>3</strong><span>مجموعات تدريب حديثة 2025</span></div>
        <div><strong>النص ظاهر</strong><span>قبل الاختيار، وليس بعده</span></div>
      </div>

      {groups.map((group) => {
        const GroupIcon = categoryIcons[group.category];
        return (
          <section key={group.category} className="model-group">
            <div className="model-group__heading">
              <span className="feature-card__icon"><GroupIcon /></span>
              <div><h2>{group.label}</h2><p>{group.documents.length} ملف/نموذج</p></div>
            </div>
            <div className="model-grid">
              {group.documents.map((doc) => {
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
                        <span>{interactive.questionCount} سؤالًا مهيكلًا</span>
                      </div>
                    )}
                    <div className="model-card__actions">
                      {interactive && (
                        <Link className="button button--primary" to={`/models/${interactive.id}`}>
                          ابدأ التدريب <ArrowLeft size={17} />
                        </Link>
                      )}
                      <a className="button button--secondary" href={doc.sourceUrl} target="_blank" rel="noreferrer">فتح PDF</a>
                      {doc.answerUrl && <a className="text-link" href={doc.answerUrl} target="_blank" rel="noreferrer">مفتاح الإجابة</a>}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </section>
  );
}
