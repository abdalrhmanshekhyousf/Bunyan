# Data Analytics

**من الفكرة إلى نظام متكامل.** تطبيق ويب يحوّل وصفاً نصياً لنظام برمجي، مكتوباً بالعربية أو الإنجليزية، إلى:

- تحليل متطلبات: الفاعلون والكيانات والمتطلبات الوظيفية وغير الوظيفية وقواعد العمل
- 11 مخطط UML (حالات الاستخدام، الأصناف، التسلسل، النشاط، الحالة، الكيانات والعلاقات، وغيرها)
- تصميم قاعدة بيانات مع شيفرة SQL جاهزة
- تقرير شامل يُصدَّر PDF

ويمكن **تثبيته من المتصفح** كتطبيق مستقل على الحاسوب أو الجوال (PWA)، من زر «تثبيت التطبيق» في الشريط العلوي، أو من قائمة المتصفح. وتُفتح واجهته دون اتصال.

الموقع المنشور: https://bunyan-b69ea.web.app

## التقنيات

| الجزء             | التقنية                                                 |
| ----------------- | ------------------------------------------------------- |
| الواجهة           | React 19، Vite، Tailwind CSS v4، Motion، Lucide         |
| التوجيه والنماذج  | React Router، React Hook Form، Zod                      |
| الترجمة           | i18next (العربية والإنجليزية، مع RTL)                   |
| الخلفية           | Firebase: Authentication وFirestore وHosting وApp Check |
| الذكاء الاصطناعي  | Firebase AI Logic مع Gemini (لا مفتاح Gemini في الكود)  |
| المخططات والتقرير | Mermaid، والطباعة إلى PDF من المتصفح                    |
| الاختبار          | Vitest، وPlaywright، واختبارات قواعد الأمان عبر REST    |

## التثبيت والتشغيل

المتطلبات: Node.js 20 أو أحدث، ومشروع Firebase.

```bash
git clone https://github.com/abdalrhmanshekhyousf/Bunyan.git
cd Bunyan
npm install
cp .env.example .env.local   # ثم املأ القيم (انظر الجدول التالي)
npm run dev -- --port 5199
```

افتح http://localhost:5199

### متغيّرات البيئة (`.env.local`)

| المتغيّر                     | الوصف                                                             |
| --------------------------- | ----------------------------------------------------------------- |
| `VITE_FIREBASE_*`           | إعدادات تطبيق الويب من Firebase Console ← Project settings        |
| `VITE_RECAPTCHA_SITE_KEY`   | مفتاح reCAPTCHA Enterprise المسجّل في App Check             |
| `VITE_APPCHECK_DEBUG_TOKEN` | للتطوير المحلي: رمز debug يُسجَّل في App Check ← Manage debug tokens |
| `VITE_GEMINI_MODEL`         | اسم النموذج (الافتراضي `gemini-3.6-flash`)                        |
| `VITE_USE_EMULATORS`        | `true` لتشغيل التطبيق على محاكيات Firebase المحلية                |

### إعداد مشروع Firebase

1. فعّل **Authentication** بطريقتي البريد وكلمة المرور، وGoogle.
2. أنشئ قاعدة **Firestore**، وانشر القواعد والفهارس:
   ```bash
   npx firebase deploy --only firestore
   ```
3. فعّل **AI Logic** مع Gemini Developer API.
4. فعّل **App Check** بمزوّد reCAPTCHA Enterprise (لا v3: الكود يستعمل ReCaptchaEnterpriseProvider)، وافرضه على AI Logic (وعلى Firestore في الإنتاج).
5. عيّن أول مدير يدوياً كما في [docs/admin.md](docs/admin.md).

## الأوامر

| الأمر                                              | الوظيفة                                                                                                                           |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                                      | خادم التطوير                                                                                                                      |
| `npm run build`                                    | بناء نسخة الإنتاج في `dist/`                                                                                                      |
| `npm run lint`                                     | فحص الشيفرة بـ oxlint                                                                                                             |
| `npm run format`                                   | تنسيق الشيفرة بـ Prettier                                                                                                         |
| `npm test`                                         | اختبارات الوحدات (المحوّلات إلى Mermaid وSQL، ومخطط التحليل)                                                                       |
| `npm run test:rules`                               | اختبار قواعد الأمان على Firestore الحقيقي، ثم حذف البيانات التجريبية. ولاختبار صلاحيات المدير مرّر `ADMIN_EMAIL` و`ADMIN_PASSWORD` |
| `npm run test:e2e`                                 | اختبار المسار الكامل بـ Playwright: تسجيل ← مشروع ← تحليل ← مخططات ← PDF ← تعديل ← مشاركة ← حذف                                   |
| `node scripts/responsive-check.mjs <dir> [ar\|en]` | فحص التجاوب (390 و768 و1280px) والأزرار بلا اسم                                                                                   |
| `node scripts/pwa-check.mjs <url>`                 | فحص قابلية التثبيت من المتصفح والعمل دون اتصال (على نسخة الإنتاج: `npm run preview -- --port 5200`)                             |

اختبارا `test:e2e` و`responsive-check` يحتاجان خادم التطوير على المنفذ 5199. وينشئ كل منهما حساباً تجريبياً ثم يحذفه.

تمرّ `dev` و`build` و`preview` و`test` عبر [scripts/run.mjs](scripts/run.mjs)، الذي يوحّد حرف القرص على ويندوز؛ فتشغيل `npx vite` أو `npx vitest` مباشرةً من طرفية VS Code (`c:\...`) قد يحمّل React أو Vitest مرتين.

## النشر

```bash
npm run build
npx firebase deploy --only hosting
```

الاستضافة على Firebase Hosting، وكل المسارات تُوجَّه إلى `index.html` (انظر `firebase.json`).

## بنية المشروع

```
src/
  app/          الموجّه والمزوّدات (الدخول، الحركة، الإشعارات)
  pages/        الصفحات (تُحمَّل عند الطلب ما عدا الرئيسية)
  features/
    auth/       التسجيل والدخول ومستند المستخدم
    projects/   المشاريع والمشاركة والأمثلة
    analysis/   التحليل الذكي: التعليمات، والمخطط، والتحقق، والإصدارات، والحصة اليومية
    diagrams/   توليد المخططات وعرضها وتنزيلها
    database/   تصميم الجداول وتوليد SQL
    report/     التقرير الشامل وتصديره PDF
    admin/      لوحة المدير: الإحصاءات والمستخدمون والقوالب
  components/   مكوّنات الواجهة والتخطيط والحركة
  utils/        المحوّلات: toMermaid وtoSQL وtoTables
  locales/      ملفات الترجمة ar وen
scripts/        اختبارات Playwright وقواعد الأمان
tests/          اختبارات Vitest
docs/           توثيق إضافي
firestore.rules قواعد الأمان
```

## الأمان والحدود

- قواعد Firestore تحصر المشروع في مالكه، إلا إذا فعّل المالك رابط المشاركة فيصير قراءة فقط لأي مستخدم مسجّل. ولا يستطيع أي مستخدم ترقية نفسه إلى مدير.
- لكل مستخدم حدّ يومي من التحليلات (10 افتراضياً، ويُغيَّر من Console بالحقل `dailyAnalyses` في المستند `settings/limits`). يُحسب اليوم من وقت الخادم فلا يمكن تزويره.
- App Check يمنع استدعاء Gemini من خارج التطبيق.
- الخطة المجانية لـ Gemini محدودة بعدد من الطلبات يومياً لكل مشروع. وحين تنفد تظهر للمستخدم رسالة واضحة.
