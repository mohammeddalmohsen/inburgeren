import { ExternalLink } from 'lucide-react';
import type { Example } from '../lib/schema';
import { publicAssetUrl } from '../lib/assetUrl';

export function SourceLink({ example, compact = false }: { example: Example; compact?: boolean }) {
  const page = example.source.evidencePage;
  const href = publicAssetUrl(example.source.url);
  return (
    <a
      className={compact ? 'source-link source-link--compact' : 'source-link'}
      href={href}
      target="_blank"
      rel="noreferrer"
      title={page ? `فتح ملف المصدر، ثم انتقل إلى صفحة الدليل ${page}` : 'فتح ملف المصدر'}
    >
      <ExternalLink size={16} aria-hidden="true" />
      <span>{page ? `المصدر · الصفحة ${page}` : 'فتح المصدر'}</span>
    </a>
  );
}
