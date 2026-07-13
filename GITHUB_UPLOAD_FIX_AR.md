# سبب خطأ GitHub Actions وطريقة إصلاحه

الخطأ:

`Cannot find module 'pdfjs-dist'`

سببه أن مستودع GitHub يحتوي ملفًا قديمًا:

`src/components/PdfCanvasViewer.tsx`

هذا الملف ليس جزءًا من النسخة الحالية، لكنه بقي في GitHub لأن رفع الملفات الجديدة لا يحذف الملفات القديمة تلقائيًا.

## الحل الصحيح

احذف الملف التالي من المستودع:

`src/components/PdfCanvasViewer.tsx`

وتأكد أيضًا أنه لا يوجد أي استيراد له في الملفات الأخرى.

## حماية إضافية

تم تحديث `tsconfig.app.json` ليستبعد هذا الملف القديم إذا بقي بالخطأ:

`exclude: ["src/components/PdfCanvasViewer.tsx"]`

لكن الحذف من GitHub هو الحل الأنظف.

## الملف الذي يجب رفعه للموقع المنشور

إذا كنت ترفع ملفات GitHub Pages الجاهزة، استخدم ملف `Deploy` وليس `Source`.

أما إذا كان GitHub Actions يبني المشروع من المصدر، فارفع محتوى ملف `Source` مع حذف الملفات القديمة التي لم تعد موجودة في الحزمة.
