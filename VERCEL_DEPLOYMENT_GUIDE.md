# 🚀 دليل نشر ورفع المنصة على Vercel بنقرة واحدة

تم تجهيز المشروع بالكامل ليعمل بسلاسة فائقة مع **Vercel** كنظام (Serverless Architecture)، مع تقديم الصفحات الثابتة عبر شبكة CDN العالمية ومعالجة واجهات الـ API وقاعدة بيانات **Supabase** بسرعة استجابة عالية.

---

## 📁 الملفات التي تم إعدادها لدعم Vercel:
- [`vercel.json`](file:///C:/Users/asf44/Documents/antigravity/quirky-einstein/vercel.json): ملف التوجيه والـ Rewrites التلقائي لمسارات `/api/*` و `/health`.
- [`api/index.js`](file:///C:/Users/asf44/Documents/antigravity/quirky-einstein/api/index.js): نقطة انطلاق دوال Vercel Serverless Functions.
- [`.vercelignore`](file:///C:/Users/asf44/Documents/antigravity/quirky-einstein/.vercelignore): استبعاد ملفات حزم AWS والملفات المؤقتة لتسريع النشر.

---

## 🛠️ خطوات النشر على Vercel (اختر الطريقة الأنسب لك):

### 🌟 الطريقة (1): النشر عبر GitHub ولوحة تحكم Vercel (الموصى بها والأسهل)

1. **ارفع المشروع إلى GitHub:**
   - افتح موجه الأوامر في مجلد المشروع وقم بعمل Commit & Push لمستودعك على GitHub:
   ```bash
   git add .
   git commit -m "feat: setup Supabase and Vercel configuration"
   git push
   ```

2. **الربط مع Vercel:**
   - ادخل على موقع [Vercel](https://vercel.com) وسجل الدخول بحساب GitHub الخاص بك.
   - اضغط على **`Add New...`** ➡️ **`Project`**.
   - اختر مستودع المشروع واضغط **`Import`**.

3. **إضافة متغيرات البيئة (Environment Variables) في Vercel:**
   قبل الضغط على Deploy، افتح قسم **Environment Variables** وأضف المتغيرات التالية:

   | Key (اسم المتغير) | Value (القيمة) |
   | :--- | :--- |
   | **`DATABASE_URL`** | `postgresql://postgres:Sayedaly%401420@db.htznmeemcenghbidxgxb.supabase.co:5432/postgres` |
   | **`PGHOST`** | `db.htznmeemcenghbidxgxb.supabase.co` |
   | **`PGPORT`** | `5432` |
   | **`PGDATABASE`** | `postgres` |
   | **`PGUSER`** | `postgres` |
   | **`PGPASSWORD`** | `Sayedaly@1420` |
   | **`PGSSL`** | `true` |
   | **`SUPABASE_PROJECT_REF`** | `htznmeemcenghbidxgxb` |
   | **`SUPABASE_URL`** | `https://htznmeemcenghbidxgxb.supabase.co` |
   | **`SUPABASE_ANON_KEY`** | `sb_publishable_y7PY0wd-ezxD72jPiiWBoA_KOJvpm8E` |

4. **النشر (Deploy):**
   - اضغط على زر **`Deploy`**.
   - في أقل من دقيقة ستحصل على رابط مباشر وسريع للمنصة (مثل `https://your-project.vercel.app`) محمي بشهادة SSL تلقائياً! 🎉

---

### 💻 الطريقة (2): النشر المباشر عبر Vercel CLI (من سطر الأوامر)

إذا كان لديك أداة `vercel` أو تريد النشر فوراً من جهازك:

1. افتح موجه الأوامر في مجلد المشروع ونفذ:
   ```bash
   npx vercel
   ```
2. اتبع التعليمات في الشاشة (اضغط Enter للموافقة على الخيارات الافتراضية).
3. للنشر المباشر إلى الإنتاج (Production):
   ```bash
   npx vercel --prod
   ```
4. توجه إلى لوحة تحكم المشروع في Vercel ➡️ **Settings** ➡️ **Environment Variables** وتأكد من إضافة متغيرات Supabase أعلاه.

---

## 🔐 حسابات الدخول المعتمدة للنظام على Vercel:

| الدور والصلاحية | اسم المستخدم (Username) | كلمة المرور (Password) |
| :--- | :--- | :--- |
| **👑 مدير النظام الرئيسي** | `admin` | `admin2026` |
| **👑 المشرف العام** | `dr_mubarak` | `pass1234` |
| **✍️ محرر المحتوى** | `editor` | `editor2026` |
| **✍️ فريق العمل** | `sara_q`, `eng_salim`, `fatima_m`, `fahad_r`, `m_issa`, `noura_j`, `k_dosari`, `researcher1` | `pass1234` / `123456` |
