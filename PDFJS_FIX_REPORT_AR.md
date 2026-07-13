# تقرير إصلاح عارض PDF.js

## السبب الجذري

كان مشروع GitHub يفشل لأن ملف `PdfCanvasViewer.tsx` كان يعتمد على `pdfjs-dist` دون أن تكون الحزمة والـlockfile متزامنين في بيئة `npm ci`. كذلك كانت النسخة الحالية تستثني الملف من TypeScript وتعرض PDF عبر `object/iframe`، وهذا لا يحل المشكلة الأصلية ولا يضمن عرض الملف داخل الموقع على الهاتف.

## الإصلاحات المنفذة

- تثبيت `pdfjs-dist` بإصدار ثابت: `6.1.200`.
- تحديث `package-lock.json` حتى ينجح `npm ci` من نسخة نظيفة.
- إزالة استثناء `PdfCanvasViewer.tsx` من `tsconfig.app.json`.
- إنشاء عارض PDF.js حقيقي يعتمد على `canvas`.
- تحميل worker محليًا عبر Vite:
  `pdfjs-dist/build/pdf.worker.min.mjs?url`
- ربط العارض في صفحة PDF الكبيرة وداخل صندوق قراءة النص.
- إضافة رسائل خطأ واضحة وزر إعادة المحاولة ورابط الملف الأصلي بدل الصفحة البيضاء.
- ضبط رقم الصفحة حتى لا يخرج عن حدود الملف.
- تنظيف `renderTask` و`loadingTask` وموارد PDF عند تغيير الصفحة أو الخروج.
- إضافة اختبارات للـworker المحلي وتصحيح رقم الصفحة وإلغاء الرسم.
- تحديث علامة الإصدار الظاهرة إلى:
  `v18 - package-lock متوافق مع npm 10`
- تصحيح إدخالات `@emnapi/core` و`@emnapi/runtime` داخل `package-lock.json` إلى `1.11.2` لأن GitHub Actions كان يتوقع هذا الإصدار أثناء `npm ci`.
- إعادة توليد `package-lock.json` باستخدام npm `10.9.8` مثل GitHub Actions، مما أضاف إدخالات top-level المطلوبة:
  `node_modules/@emnapi/core`
  و
  `node_modules/@emnapi/runtime`.

## نتائج التحقق

- `npm ci --no-audit --no-fund`: نجح من نسخة نظيفة.
- `npm run check`: نجح.
- TypeScript strict: نجح دون `TS2307` أو `TS7006`.
- Vitest: 10 ملفات اختبار، 43 اختبارًا ناجحًا.
- `npm run build`: نجح.
- ملف worker الناتج:
  `dist/assets/pdf.worker.min-DEtVeC4l.mjs`
- لا توجد ملفات source map في ناتج `dist/assets`.

## ملاحظة Git

المجلد الحالي نسخة مصدر مستخرجة وليس مستودع Git عاملًا داخل هذه البيئة، كما أن أمر `git` غير متاح في PATH. لذلك لم يتم إنشاء فرع محلي أو Pull Request من هنا. عند رفع الملفات إلى GitHub، ارفع محتوى ZIP المصدر كاملًا مع `package-lock.json` حتى لا يبقى ملف قديم في المستودع.
