import { useMemo, useState } from 'react';
import { ExternalLink, FileText, Maximize2, ScrollText } from 'lucide-react';
import type { ExamSection } from '../lib/exams';

interface SourceReaderProps {
  section: ExamSection | null;
  sourceUrl: string;
  title: string;
  compact?: boolean;
}

export function SourceReader({ section, sourceUrl, title, compact = false }: SourceReaderProps) {
  const [mode, setMode] = useState<'text' | 'pdf'>('text');
  const page = section?.pdfPageStart ?? 1;
  const pdfUrl = useMemo(() => `${sourceUrl}#page=${page}&view=FitH`, [sourceUrl, page]);

  return (
    <aside className={`source-reader${compact ? ' source-reader--compact' : ''}`} aria-label="نص السؤال">
      <header className="source-reader__header">
        <div>
          <span className="section-kicker">النص المطلوب</span>
          <h2 lang="nl" dir="ltr">{title}</h2>
        </div>
        <div className="source-reader__actions">
          <div className="reader-toggle" role="group" aria-label="طريقة عرض النص">
            <button type="button" className={mode === 'text' ? 'is-active' : ''} onClick={() => setMode('text')}>
              <ScrollText size={16} /> نص
            </button>
            <button type="button" className={mode === 'pdf' ? 'is-active' : ''} onClick={() => setMode('pdf')}>
              <FileText size={16} /> PDF
            </button>
          </div>
          <a className="icon-button icon-button--small" href={pdfUrl} target="_blank" rel="noreferrer" title="فتح الملف في نافذة جديدة">
            <Maximize2 size={17} /><span>فتح</span>
          </a>
        </div>
      </header>

      {mode === 'text' ? (
        <div className="source-reader__text" lang="nl" dir="ltr" tabIndex={0}>
          {section?.text ? section.text.split(/\n{2,}/).map((paragraph, index) => (
            <p key={`${section.id}-${index}`}>{paragraph}</p>
          )) : (
            <div className="reader-fallback">
              <ExternalLink size={20} />
              <p>لا يوجد نص مستخرج لهذه المادة. افتح ملف PDF لقراءته.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="source-reader__pdf">
          <iframe key={pdfUrl} src={pdfUrl} title={`PDF: ${title}`} loading="lazy" />
          <a className="pdf-fallback" href={pdfUrl} target="_blank" rel="noreferrer">
            إذا لم يظهر PDF على هاتفك، اضغط هنا لفتحه في نافذة جديدة.
          </a>
        </div>
      )}
    </aside>
  );
}
