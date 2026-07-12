import { ExternalLink, ShieldCheck } from 'lucide-react';
import { publicAssetUrl } from '../lib/assetUrl';
import { sourceDocuments } from '../lib/exams';

export function SourcesPage() {
  return (
    <section className="section shell sources-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">شفافية المحتوى</span>
          <h1>المصادر وحقوق الاستخدام</h1>
          <p>هذا الموقع أداة تدريب غير رسمية لقراءة NT2 B1. الملفات الأصلية والامتحانات ومفاتيح الإجابة تعود لأصحابها، ويجب على المستخدم التحقق من شروط إعادة النشر والاستخدام من المصدر الرسمي.</p>
        </div>
      </div>

      <section className="panel-card">
        <div className="panel-card__head">
          <div><span className="section-kicker">تنبيه</span><h2>ليست جهة رسمية</h2></div>
          <ShieldCheck aria-hidden="true" />
        </div>
        <p className="technical-note">لا تضيف هذه النسخة ادعاءات قانونية. وجود ملف PDF داخل المشروع لا يعني تلقائيًا أن إعادة نشره مسموحة في كل سياق.</p>
      </section>

      <div className="source-rights-list">
        {sourceDocuments.map((doc) => (
          <article className="source-rights-card" key={doc.id}>
            <div>
              <span className="chip">{doc.year ?? 'عام'}</span>
              <span className={`mode-badge mode-badge--${doc.status === 'complete' ? 'multiple-choice' : 'self-check'}`}>{doc.status === 'complete' ? 'تفاعلي كامل' : doc.status === 'partial' ? 'جزئي' : 'وثيقة'}</span>
            </div>
            <h2>{doc.title}</h2>
            <p>{doc.description}</p>
            <a className="text-link" href={publicAssetUrl(doc.sourceUrl)} target="_blank" rel="noreferrer"><ExternalLink size={16} /> فتح المصدر المرفق</a>
          </article>
        ))}
      </div>
    </section>
  );
}
