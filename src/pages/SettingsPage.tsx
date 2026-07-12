import { Database, Download, HardDrive, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useProgress } from '../lib/ProgressContext';
import { useToast } from '../lib/ToastContext';

export function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { downloadBackup, restoreBackup, clearAll } = useProgress();
  const { showToast } = useToast();

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      await restoreBackup(file);
      showToast('تم استيراد التقدم بنجاح.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'تعذر استيراد الملف.', 'warning');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const clear = async () => {
    if (!window.confirm('هل تريد مسح المحاولات والمفضلة والكلمات والجلسات من هذا المتصفح؟')) return;
    await clearAll();
    showToast('تم مسح جميع البيانات المحلية.', 'success');
  };

  return (
    <section className="section shell settings-page">
      <div className="page-heading"><div><span className="section-kicker">البيانات والخصوصية</span><h1>الإعدادات</h1><p>لا يرسل الموقع نتائجك إلى خادم خارجي؛ كل شيء محفوظ محليًا في IndexedDB.</p></div></div>

      <div className="settings-grid">
        <section className="settings-card">
          <span className="settings-card__icon"><HardDrive /></span>
          <div><h2>نسخة احتياطية</h2><p>صدّر تقدمك إلى ملف JSON ثم استورده في جهاز أو متصفح آخر.</p></div>
          <div className="settings-actions">
            <button className="button button--primary" type="button" onClick={() => void downloadBackup()}><Download size={17} /> تصدير التقدم</button>
            <button className="button button--secondary" type="button" onClick={() => fileRef.current?.click()}><Upload size={17} /> استيراد ملف</button>
            <input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])} />
          </div>
        </section>

        <section className="settings-card">
          <span className="settings-card__icon"><ShieldCheck /></span>
          <div><h2>الخصوصية</h2><p>يُحفظ التقدم على هذا الجهاز فقط. مسح بيانات المتصفح قد يحذفه، لذلك استخدم التصدير دوريًا.</p></div>
          <ul className="plain-list"><li>لا يوجد حساب مستخدم.</li><li>لا توجد إعلانات أو أدوات تتبع داخل المشروع.</li><li>ملفات PDF الأصلية مرفقة داخل الموقع.</li></ul>
        </section>

        <section className="settings-card">
          <span className="settings-card__icon"><Database /></span>
          <div><h2>تقنية التطبيق</h2><p>مشروع PWA مبني بـ React وTypeScript وVite، ويعمل دون إنترنت بعد أول زيارة ناجحة للموقع المنشور.</p></div>
          <p className="technical-note">ملفات PDF الكبيرة تُحفظ دون إنترنت بعد فتحها أول مرة، ولا تُحمّل كلها تلقائيًا عند تثبيت التطبيق.</p>
          <p className="technical-note">التثبيت والعمل دون إنترنت يحتاجان HTTPS أو localhost. فتح index.html مباشرة من القرص لا يشغّل Service Worker.</p>
        </section>

        <section className="settings-card settings-card--danger">
          <span className="settings-card__icon"><Trash2 /></span>
          <div><h2>مسح البيانات</h2><p>يحذف المحاولات والمفضلة والمتقنة وقائمة المراجعة والكلمات والجلسات.</p></div>
          <button className="button button--danger" type="button" onClick={() => void clear()}><Trash2 size={17} /> مسح التقدم نهائيًا</button>
        </section>
      </div>
    </section>
  );
}
