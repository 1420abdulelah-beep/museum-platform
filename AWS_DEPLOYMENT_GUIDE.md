# 🚀 دليل تشغيل وربط المنصة مع AWS RDS PostgreSQL & Elastic Beanstalk

تم تجهيز هذا المشروع بالكامل ليعمل بشكل مباشر ومثالي مع قواعد بيانات **PostgreSQL** المدارة عبر **Amazon RDS / Aurora** أو بيئة **AWS Elastic Beanstalk (Node.js Platform)**، مع نظام هجرة بيانات تلقائي (Auto-Migration) وحماية تامة للبيانات ونظام صلاحيات متقدم.

---

## 📁 حزمة النشر الجاهزة:
📍 **مسار الملف الجاهز للرفع الفوري:**
```text
C:\Users\asf44\Documents\antigravity\quirky-einstein\deploy.zip
```
*(تم بناؤه وتجهيزه وتضمين محرك PostgreSQL الجديد `db.js` وخالٍ من أي تعارضات)*.

---

## 🗄️ خطوات إنشاء وربط قاعدة بيانات PostgreSQL على AWS RDS

استناداً إلى شاشة **Aurora and RDS Dashboard** الظاهرة لديك في حساب AWS:

```
+------------------------------------+------------------------------------+
| Create with express configuration  |   Create with full configuration   |
| (Aurora PostgreSQL Serverless)     |   (Amazon RDS for PostgreSQL)      |
| [ 🚀 Create ]                      |   [ ⚙️ Create ]                     |
+------------------------------------+------------------------------------+
```

### الخيار (1): الإنشاء السريع (Aurora Serverless) - الأسهل والأسرع
1. اضغط على الزر البرتقالي **Create** تحت خانة **"Create with express configuration in seconds"**.
2. سيقوم AWS تلقائياً بإنشاء قاعدة بيانات Aurora متوافقة مع PostgreSQL جاهزة في دقائق.
3. احفظ **اسم المستخدم (Master username)** و **كلمة المرور (Master password)** التي يولدها لك.

---

### الخيار (2): الإنشاء المخصص (Amazon RDS for PostgreSQL) - للتحكم الكامل
1. اضغط على الزر **Create** تحت خانة **"Create with full configuration"**.
2. **Choose a database creation method:** اختر **Standard create**.
3. **Engine options:** اختر **PostgreSQL**.
4. **Templates:**
   - اختر **Free tier** (إذا كنت تريد الاستفادة من الطبقة المجانية 750 ساعة شهرياً مع db.t3.micro / db.t4g.micro).
   - أو **Production** للمشاريع الإنتاجية الكبرى.
5. **Settings:**
   - **DB instance identifier:** اكتب اسماً للقاعدة (مثلاً: `museum-db`).
   - **Master username:** اتركه `postgres`.
   - **Master password:** أدخل كلمة مرور قوية واحفظها (مثلاً: `MuseumAdminPass2026!`).
6. **Connectivity:**
   - **Public access:** اختر **Yes** (إذا كنت تريد إمكانية الاتصال بالقاعدة من جهازك أو من أدوات خارجية مثل DBeaver/pgAdmin)، أو **No** إذا كان السيرفر في نفس الـ VPC.
   - **VPC security group:** تأكد من أن مجموعة الأمان تسمح بمرور بروتوكول PostgreSQL على المنفذ **`5432`** (Port 5432).
7. اضغط **Create database** وانتظر 3-5 دقائق حتى تصبح الحالة باللون الأخضر (**Available**).

---

## 🔗 استخراج رابط الاتصال (Endpoint)

1. ادخل على اسم قاعدة البيانات المنشأة `museum-db`.
2. في تبويب **Connectivity & security**، انسخ الـ **Endpoint** (سيكون شبيهاً بـ):
   ```text
   museum-db.c7xxxxxx.us-east-1.rds.amazonaws.com
   ```

---

## ⚡ ربط قاعدة البيانات بتطبيق Elastic Beanstalk

1. توجه إلى لوحة تحكم **AWS Elastic Beanstalk**.
2. افتح بيئة التطبيق (Environment) الخاصة بك (مثلاً: `museum-project-env`).
3. من القائمة الجانبية، اضغط على **Configuration**.
4. في قسم **Updates, monitoring, and logging** (أو **Software**)، اضغط على **Edit**.
5. انزل إلى قسم **Environment properties** وأضف المتغيرات التالية:

| Name (اسم المتغير) | Value (القيمة) |
| :--- | :--- |
| **`DATABASE_URL`** | `postgres://postgres:YourPassword@your-endpoint.rds.amazonaws.com:5432/postgres` |
| **`PGSSL`** | `true` |
| **`NODE_ENV`** | `production` |

> 💡 **ملاحظة:** يمكنك بدلاً من `DATABASE_URL` وضع المتغيرات منفصلة:
> - `PGHOST`: الـ Endpoint المنسوخ من RDS
> - `PGPORT`: `5432`
> - `PGDATABASE`: `postgres`
> - `PGUSER`: `postgres`
> - `PGPASSWORD`: كلمة المرور الخاصة بك
> - `PGSSL`: `true`

6. اضغط **Apply**.
7. سيعيد الخادم تشغيل نفسه تلقائياً، وسيقوم بالاتصال بقاعدة بيانات PostgreSQL، وإنشاء الجداول الأربعة تلقائياً، واستيراد كافة بيانات المتحف والمستخدمين والخطط والـ PDR الحالية فوراً! 🎉

---

## 🔐 حسابات الدخول الافتراضية للنظام

| الدور والصلاحية | اسم المستخدم (Username) | كلمة المرور (Password) | الإمكانيات |
| :--- | :--- | :--- | :--- |
| **👑 مدير النظام (Admin)** | `admin` | `admin2026` | كامل الصلاحيات + إدارة وإضافة المستخدمين + إدارة النسخ الاحتياطية واستعادة النظام. |
| **✍️ محرر المحتوى (Editor)** | `editor` | `editor2026` | تعديل وإضافة وحذف المهام، الخطط، الميزانيات، وحالات الاعتماد. |
| **👁️ الزائر (Viewer)** | *بدون تسجيل* | *تصفح فقط* | استعراض ومحاكاة كافة المحطات والمخططات دون إمكانية التعديل. |

---

## 🛡️ مميزات الهجرة والتشغيل المزدوج المدمجة

1. **🌱 الهجرة التلقائية للبيانات (Auto-Migration & Seeding):**
   - بمجرد اتصال السيرفر بقاعدة بيانات PostgreSQL لأول مرة، يقوم الخادم بإنشاء جداول `users`, `platform_data`, `leads`, `system_backups` تلقائياً واستيراد كافة بياناتك الحالية.
2. **🔄 التشغيل المزدوج الآمن (Resilient Dual Engine):**
   - إذا تم توفير إعدادات Postgres سيعمل التطبيق عليها بالكامل.
   - إذا لم يتم توفيرها (أثناء التطوير المحلي بدون إنترنت)، سيعمل التطبيق تلقائياً على ملفات الـ JSON دون أي توقف أو أخطاء.
3. **📊 فحص حالة قاعدة البيانات المباشر:**
   - يمكنك فحص اتصال قاعدة البيانات في أي وقت عبر مسار `/health`؛ حيث سيعرض حالة المحرك وزمن استجابة الـ Ping بالمللي ثانية.

---

## 💻 التحديث المستقبلي للمشروع
عند إجراء أي تعديلات مستقبلية في الكود، يكفي تشغيل السكريبت:
```powershell
.\build-zip.ps1
```
ثم الذهاب إلى لوحة تحكم البيئة في AWS Elastic Beanstalk والضغط على **Upload and deploy** واختيار ملف `deploy.zip` الجديد! 🚀
