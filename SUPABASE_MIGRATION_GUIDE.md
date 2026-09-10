# ⚡ دليل اكتمال النقل والربط مع Supabase (قاعدة البيانات + الأكواد)

تم بنجاح نقل وربط مشروع **منصة متحف السيرة التفاعلي** بالكامل إلى **Supabase PostgreSQL**، مع هجرة كافة البيانات والمستخدمين والخطط والـ PDR وسجلات النظام.

---

## 📊 ملخص حالة الهجرة إلى Supabase

| العنصر | الحالة | التفاصيل |
| :--- | :--- | :--- |
| **حالة الاتصال بـ Supabase** | ✅ متصل ويعمل بنجاح | زمن الاستجابة: ~400ms (PostgreSQL 17.6) |
| **جدول المستخدمين (`users`)** | ✅ تم النقل بالكامل | **11 مستخدم** بكامل الصلاحيات وكلمات المرور |
| **بيانات خطة المتحف (`museum_plan`)** | ✅ تم النقل بالكامل | كافة المحطات، المشاهد، المقتنيات، والمهام |
| **بيانات وثيقة الـ PDR (`pdr_data`)** | ✅ تم النقل بالكامل | الأقسام، الميزانيات، وفريق العمل |
| **ملاحظات المنصة (`platform_notes`)** | ✅ تم النقل بالكامل | بطاقات كانبان والملاحظات التفاعلية |
| **طلبات واستفسارات الزوار (`leads`)** | ✅ تم النقل بالكامل | جهات الاتصال والاستفسارات |
| **النسخ الاحتياطية (`system_backups`)** | ✅ تم النقل بالكامل | تم إنشاء نسخة تأسيسية أولى على Supabase |

---

## 🔑 بيانات الاعتماد والاتصال بـ Supabase الخاصة بمشروعك

تم حفظ وتفعيل هذه الإعدادات تلقائياً داخل ملف `.env`:

```env
# رابط الاتصال المباشر (Direct Connection)
DATABASE_URL=postgresql://postgres:Sayedaly%401420@db.htznmeemcenghbidxgxb.supabase.co:5432/postgres

# المتغيرات المنفصلة (PG Standard)
PGHOST=db.htznmeemcenghbidxgxb.supabase.co
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=Sayedaly@1420
PGSSL=true

# معلومات مشروع Supabase
SUPABASE_PROJECT_REF=htznmeemcenghbidxgxb
SUPABASE_URL=https://htznmeemcenghbidxgxb.supabase.co
SUPABASE_ANON_KEY=sb_publishable_y7PY0wd-ezxD72jPiiWBoA_KOJvpm8E
```

> 💡 **ملاحظة أمان وتقنية:** تم ترميز علامة `@` داخل كلمة المرور في رابط `DATABASE_URL` إلى `%40` لضمان عدم حدوث أي تعارض في مكتبات الاتصال، وتعمل المتغيرات المنفصلة بكلمة المرور الأصلية مباشرة وبكفاءة قصوى.

---

## 🚀 تشغيل المنصة محلياً (Local Development)

لتشغيل الخادم وربطه مباشرة مع قاعدة بيانات Supabase السحابية:

```bash
# تشغيل الخادم على المنفذ 8080
npm start
```
ثم افتح المتصفح على:
`http://localhost:8080`

---

## 🛠️ أوامر المزامنة والفحص السريع (CLI Scripts)

تمت إضافة أوامر سريعة في `package.json`:

1. **فحص اتصال قاعدة البيانات وطبقة البيانات:**
   ```bash
   npm run test:supabase
   ```
2. **إعادة تشغيل الهجرة ومزامنة أي بيانات جديدة:**
   ```bash
   npm run migrate:supabase
   ```

---

## 🌐 خيارات نشر واستضافة الأكواد (Code Hosting) خارج AWS

بما أن قاعدة البيانات الآن مستضافة على Supabase السحابية، يمكنك تشغيل ونشر كود خادم الـ Node.js والواجهات بسهولة فائقة عبر أي من الخيارات التالية:

### الخيار (1): النشر على Render.com (الأسهل والأسرع - مجاني)
1. قم برفع المشروع على حسابك في GitHub.
2. ادخل على [Render.com](https://render.com) واختر **New Web Service**.
3. اختر مستودع الـ GitHub الخاص بالمشروع.
4. في خانة **Build Command** اكتب: `npm install`
5. في خانة **Start Command** اكتب: `npm start`
6. في قسم **Environment Variables** أضف المتغيرات من ملف `.env` (خاصة `DATABASE_URL` و `PGSSL=true` و `PGPASSWORD`).
7. اضغط **Deploy**، وسيعمل موقعك مباشرة مع رابط مجاني سريع ومحمي بشهادة SSL!

### الخيار (2): النشر على Railway.app أو Fly.io
- يتم التعرف على `server.js` و `package.json` تلقائياً دون أي إعدادات إضافية، يكفي إضافة متغيرات الـ `.env` في لوحة التحكم.

### الخيار (3): الاستمرار على AWS Elastic Beanstalk (مع قاعدة بيانات Supabase)
- يمكنك الاستمرار برفع `deploy.zip` إلى AWS Elastic Beanstalk، وتحديث **Environment properties** فقط لتشير إلى Supabase بدلاً من RDS!

---

## 🔐 حسابات الدخول المعتمدة للنظام

| الدور والصلاحية | اسم المستخدم (Username) | كلمة المرور (Password) | الصلاحيات |
| :--- | :--- | :--- | :--- |
| **👑 مدير النظام الرئيسي** | `admin` | `admin2026` | كامل الصلاحيات الإدارية، إدارة المستخدمين، إدارة واستعادة النسخ الاحتياطية |
| **👑 المشرف العام** | `dr_mubarak` | `pass1234` | صلاحيات المشرف العام والإدارة |
| **✍️ محرر المحتوى** | `editor` | `editor2026` | تعديل الخطط والمشاهد والمهام |
| **✍️ فريق العمل والباحثين** | `sara_q`, `eng_salim`, `fatima_m`, `fahad_r`, `m_issa`, `noura_j`, `k_dosari`, `researcher1` | `pass1234` / `123456` | إسناد وتعديل المهام والأنشطة |

---

## 🗄️ إدارة قاعدة البيانات عبر لوحة تحكم Supabase

يمكنك فتح لوحة تحكم Supabase الخاصة بك عبر الرابط:
👉 **[https://supabase.com/dashboard/project/htznmeemcenghbidxgxb](https://supabase.com/dashboard/project/htznmeemcenghbidxgxb)**

1. **Table Editor:** لاستعراض وتعديل الجداول (`users`, `platform_data`, `leads`, `system_backups`) مباشرة بواجهة تفاعلية.
2. **SQL Editor:** لتنفيذ أي استعلامات SQL مخصصة (الملف `supabase_schema.sql` متوفر أيضاً كمرجع كامل).
3. **Database Backups:** لإدارة النسخ الاحتياطية التلقائية التي يوفرها Supabase.
