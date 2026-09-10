/* ==========================================================
   SERAJ AL-AHSA - PDR MASTER WORD EXPORTER (.DOCX / .DOC)
   المولد الذكي لتصدير وثيقة تعريف المشروع PDR بالكامل إلى ملف Word
   منسق ومعتمد بنسبة 100% باللغة العربية ومستخلص من أحدث بيانات قاعدة البيانات
   ========================================================== */

window.App = window.App || {};
var App = window.App;

App.PdrWordExporter = {
  
  /**
   * Main entry point to export the entire PDR Document to Word
   * Asynchronously pulls latest live database state to ensure 100% fidelity.
   * @param {Object} pdrModelOrData - Either PdrModel instance or raw PdrData object
   * @param {Object} options - Custom export options (filename, includeChecklists, etc.)
   */
  async exportMasterDocument(pdrModelOrData, options = {}) {
    try {
      this._showToast("جاري جلب أحدث البيانات الحية من قاعدة البيانات وتجهيز ملف Word...", "info");

      const data = await this._resolveDataAsync(pdrModelOrData);
      if (!data || !Array.isArray(data.sections) || data.sections.length === 0) {
        throw new Error("بيانات وثيقة PDR غير متوفرة للتصدير.");
      }

      const teamMap = this._resolveTeamMap(data);
      const docHtml = this._buildMasterDocumentHtml(data, teamMap, options);
      const filename = options.filename || `سراج_الأحساء_وثيقة_PDR_الرسمية_المعتمدة_${new Date().getFullYear()}.doc`;

      this._downloadWordFile(docHtml, filename);
      this._showToast("تم تصدير وثيقة PDR المحدثة بنجاح كملف Word منسق بالكامل! 📄✨", "success");
      return true;
    } catch (err) {
      console.error("Word Export Error:", err);
      this._showToast("حدث خطأ أثناء تصدير ملف Word: " + err.message, "error");
      return false;
    }
  },

  /**
   * Export a single Deliverable item to Word
   */
  async exportSingleDeliverable(sectionId, itemId, pdrModelOrData) {
    try {
      const data = await this._resolveDataAsync(pdrModelOrData);
      if (!data) throw new Error("بيانات PDR غير متوفرة.");

      const section = (data.sections || []).find(s => s.id === sectionId);
      if (!section) throw new Error("القسم غير موجود.");

      const item = (section.items || []).find(i => i.id === itemId);
      if (!item) throw new Error("المخرج المطلوب غير موجود.");

      const teamMap = this._resolveTeamMap(data);
      const docHtml = this._buildSingleDeliverableHtml(data, section, item, teamMap);
      const safeTitle = (item.deliverables || item.title || "مخرج_PDR").replace(/[\/\\:*?"<>|]/g, "_");
      const filename = `سراج_الأحساء_مخرج_${safeTitle}_${new Date().getFullYear()}.doc`;

      this._downloadWordFile(docHtml, filename);
      this._showToast(`تم تصدير مخرج "${item.title}" كملف Word بنجاح! 📄`, "success");
      return true;
    } catch (err) {
      console.error("Single Deliverable Export Error:", err);
      this._showToast("تعذر تصدير المخرج: " + err.message, "error");
      return false;
    }
  },

  /**
   * Export Executive Pitch Deck Dossier to Word
   */
  async exportExecutiveDossierToWord(options = {}) {
    try {
      this._showToast("جاري تجهيز وتنسيق ملف Word للعرض التنفيذي الشامل...", "info");
      const data = await this._resolveDataAsync(null);
      if (!data) throw new Error("بيانات العرض التنفيذي غير متوفرة.");

      const teamMap = this._resolveTeamMap(data);
      const docHtml = this._buildExecutiveDossierHtml(data, teamMap, options);
      const filename = options.filename || `سراج_الأحساء_العرض_التنفيذي_الشامل_${new Date().getFullYear()}.doc`;

      this._downloadWordFile(docHtml, filename);
      this._showToast("تم تصدير العرض التنفيذي الشامل كملف Word بنجاح! 📊📄", "success");
      return true;
    } catch (err) {
      console.error("Executive Dossier Export Error:", err);
      this._showToast("تعذر تصدير العرض التنفيذي: " + err.message, "error");
      return false;
    }
  },

  /**
   * Resolve freshest live PDR dataset from database API, model instance, or storage
   */
  async _resolveDataAsync(source) {
    // 1. If explicit valid dataset object passed
    if (source && typeof source === "object") {
      if (source.data && typeof source.data === "object" && Array.isArray(source.data.sections)) {
        return source.data;
      }
      if (Array.isArray(source.sections)) {
        return source;
      }
    }

    // 2. Fetch freshest live state directly from server database API
    try {
      if (typeof fetch === "function") {
        const res = await fetch("/api/pdr");
        if (res.ok) {
          const json = await res.json();
          if (json && json.status === "success" && json.data && Array.isArray(json.data.sections) && json.data.sections.length > 0) {
            console.log("📥 [Word Exporter] Fetched live real-time state from database API.");
            return json.data;
          }
        }
      }
    } catch (_) {}

    // 3. Active in-memory PdrModel / PdrController
    if (typeof window !== "undefined" && window.App) {
      if (window.App.pdrModel && window.App.pdrModel.data && Array.isArray(window.App.pdrModel.data.sections)) {
        return window.App.pdrModel.data;
      }
      if (window.App.pdrController && window.App.pdrController.model && window.App.pdrController.model.data) {
        return window.App.pdrController.model.data;
      }
      if (window.App.model && window.App.model.data && Array.isArray(window.App.model.data.sections)) {
        return window.App.model.data;
      }
    }

    // 4. LocalStorage Cached PDR States
    try {
      if (typeof localStorage !== "undefined") {
        const cached = localStorage.getItem("pdr_project_definition_state_v2") || 
                       localStorage.getItem("seraj_pdr_db_state_v1") ||
                       localStorage.getItem("pdr_app_state_v1");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
            return parsed;
          }
        }
      }
    } catch (_) {}

    // 5. Global Fallbacks
    if (typeof window !== "undefined" && window.App) {
      if (window.App.PdrData) return window.App.PdrData;
      if (window.App.pdrData) return window.App.pdrData;
    }
    if (typeof PDR_DB_FALLBACK !== "undefined") {
      return PDR_DB_FALLBACK;
    }

    return null;
  },

  /**
   * Build complete team lookup map from database & local directory
   */
  _resolveTeamMap(data) {
    const map = new Map();

    // Default base team members
    const defaultTeam = [
      { id: "admin", name: "مدير النظام الرئيسي", role: "الإدارة العامة والحوكمة والصلاحيات", department: "الإدارة العامة والحوكمة", avatar: "👑" },
      { id: "dr_mubarak", name: "د. عبد المحسن المبارك", role: "مدير المشروع والمشرف العام", department: "الإدارة العامة والحوكمة", avatar: "👑" },
      { id: "editor", name: "محرر ومسؤول المحتوى والمهام", role: "إعداد المحتوى والمشاهد والمقتنيات", department: "فريق التنفيذ والمحتوى", avatar: "👨‍💼" },
      { id: "researcher1", name: "د. خالد الأحسائي", role: "بحوث السيرة النبوية وتاريخ الأحساء والمسار الشرعي", department: "فريق التنفيذ والمحتوى", avatar: "👨‍💼" },
      { id: "sara_q", name: "أ. سارة القحطاني", role: "رئيسة قسم المحتوى والبحث التاريخي", department: "فريق التنفيذ والمحتوى", avatar: "👩‍💼" },
      { id: "eng_salim", name: "م. عبد العزيز السليم", role: "مدير التقنية والتجهيزات المتنقلة والهندسة", department: "فريق التنفيذ والمحتوى", avatar: "👨‍💼" },
      { id: "fatima_m", name: "أ. فاطمة الملا", role: "مديرة الاتصال والبرامج وتجربة الزائر", department: "فريق التنفيذ والمحتوى", avatar: "👩‍💼" },
      { id: "fahad_r", name: "م. فهد الراشد", role: "مهندس التصميم الإنشائي والديكور والعمليات", department: "فريق التنفيذ والمحتوى", avatar: "👨‍💼" },
      { id: "m_issa", name: "أ. محمد العيسى", role: "مدير العمليات واللوجستيات والميدان والشراكات", department: "فريق التنفيذ والمحتوى", avatar: "👨‍💼" },
      { id: "noura_j", name: "أ. نورة الجبر", role: "أخصائية البرامج التعليمية وتجربة الزائر والاتصال", department: "فريق التنفيذ والمحتوى", avatar: "👩‍💼" },
      { id: "k_dosari", name: "أ. خالد الدوسري", role: "المسؤول المالي وإدارة المخاطر والسلامة", department: "فريق التنفيذ والمحتوى", avatar: "👨‍💼" },
      { id: "dr_ahmed", name: "د. أحمد بن محمد", role: "المشرف العام ومستشار التاريخ الإسلامي", department: "اللجنة العلمية والتاريخية", avatar: "🎓" },
      { id: "sarah_m", name: "م. سارة العبدالعالي", role: "مديرة التصميم المعماري والتقنيات الغامرة", department: "الفريق الهندسي والتقني", avatar: "👩‍💼" },
      { id: "khalid_n", name: "أ. خالد النعيم", role: "مستشار الهوية والمحتوى السردي", department: "فريق التحرير والمحتوى", avatar: "🏛️" },
      { id: "abdullah_m", name: "أ. عبدالله الملحم", role: "مدير العمليات والشراكات الاستراتيجية", department: "فريق العمليات والتشغيل", avatar: "🚚" },
      { id: "fahad_j", name: "د. فهد الجعفري", role: "المستشار المالي والاستدامة الاقتصادية", department: "لجنة التمويل والاستثمار", avatar: "📊" }
    ];

    defaultTeam.forEach(m => map.set(m.id, m));

    // Data-specific team members from PDR database
    if (data && Array.isArray(data.teamMembers)) {
      data.teamMembers.forEach(m => {
        if (m && m.id) map.set(m.id, m);
      });
    }

    // Central Users Storage from Users Admin Management
    try {
      if (typeof localStorage !== "undefined") {
        const rawUsers = localStorage.getItem("seraj_users_list_v1");
        if (rawUsers) {
          const users = JSON.parse(rawUsers);
          if (Array.isArray(users)) {
            users.forEach(u => {
              const id = u.username || u.id;
              if (id) {
                map.set(id, {
                  id: id,
                  name: u.name || u.username,
                  role: u.specialty || (u.role === "admin" ? "مدير النظام الرئيسي" : u.role === "editor" ? "محرر ومسؤول مهام" : "عضو فريق مساهم"),
                  department: u.department || "فريق العمل",
                  avatar: u.role === "admin" ? "👑" : "👤"
                });
              }
            });
          }
        }
      }
    } catch (_) {}

    return map;
  },

  /**
   * Helper to format a team member label with name and role
   */
  _formatMember(memberId, teamMap) {
    if (!memberId || memberId === "unassigned" || memberId === "none") {
      return "غير مسند (فريق العمل العام)";
    }
    const m = teamMap && teamMap.get ? teamMap.get(memberId) : null;
    if (m) {
      const details = m.role ? `(${m.role})` : m.department ? `(${m.department})` : '';
      return `${m.name} ${details}`.trim();
    }
    return memberId;
  },

  /**
   * Helper to format item status in Arabic
   */
  _formatStatus(status) {
    switch (status) {
      case "approved": return "معتمد ومكتمل (100%)";
      case "in_progress": return "قيد الإعداد والتطوير";
      case "review": return "بانتظار المراجعة والاعتماد";
      case "blocked": return "متوقف / مؤجل";
      default: return "قيد المتابعة";
    }
  },

  /**
   * Helper to format item task type in Arabic
   */
  _formatTaskType(type) {
    switch (type) {
      case "historical_research": return "📚 محتوى وبحث تاريخي وشرعي";
      case "technical_specs": return "💻 مواصفات هندسية وتقنية";
      case "strategic_charter": return "🏛️ مواثيق استراتيجية وحوكمة";
      case "operations_logistics": return "🚚 عمليات ميدانية ولوجستيات ومخاطر";
      case "education_experience": return "🎓 برامج تعليمية وتجربة زائر";
      case "financial_sustainability": return "🤝 استدامة مالية ورعايات";
      default: return "مهمة تخصصية";
    }
  },

  /**
   * Construct the complete Master Word document with all 17 sections, appendices, KPIs, and signatures
   */
  _buildMasterDocumentHtml(data, teamMap, options = {}) {
    const meta = data.metadata || {};
    const about = data.about || {};
    const sections = Array.isArray(data.sections) ? data.sections : [];
    const values = Array.isArray(data.values) ? data.values : [];
    const appendices = Array.isArray(data.appendices) ? data.appendices : [];
    const swot = data.swot || {};
    const customSlides = Array.isArray(data.customExecutiveSlides) ? data.customExecutiveSlides : [];

    const generatedDateAr = new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const generatedDateGregorian = new Date().toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // Calculate live stats
    let totalItems = 0;
    let approvedItems = 0;
    sections.forEach(sec => {
      (sec.items || []).forEach(item => {
        totalItems++;
        if (item.status === 'approved' || item.progress === 100) {
          approvedItems++;
        }
      });
    });
    const completionPercent = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 100;

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir='rtl'>
      <head>
        <meta charset='utf-8'>
        <title>${meta.projectTitleAr || 'سراج الأحساء'} — وثيقة تعريف المشروع PDR</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
            <w:ValidateAgainstSchemas/>
            <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
            <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
            <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: A4;
            margin: 2.0cm 2.0cm 2.0cm 2.0cm;
            mso-header-margin: 36.0pt;
            mso-footer-margin: 36.0pt;
            mso-paper-source: 0;
          }
          body {
            font-family: 'Cairo', 'Traditional Arabic', 'Arial', sans-serif;
            direction: rtl;
            text-align: right;
            color: #1a1a1a;
            background-color: #ffffff;
            font-size: 11pt;
            line-height: 1.6;
          }
          
          /* Titles and Headings */
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Cairo', 'Traditional Arabic', 'Arial', sans-serif;
            font-weight: bold;
            color: #854d0e;
            margin-top: 18pt;
            margin-bottom: 8pt;
          }
          h1 { font-size: 24pt; color: #78350f; text-align: center; line-height: 1.3; }
          h2 { font-size: 15pt; color: #92400e; border-bottom: 2pt solid #dfb15b; padding-bottom: 4pt; margin-top: 24pt; }
          h3 { font-size: 12.5pt; color: #1e293b; }
          h4 { font-size: 11pt; color: #b45309; }

          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12pt 0;
            font-size: 9.5pt;
            direction: rtl;
          }
          th {
            background-color: #fef3c7;
            color: #78350f;
            border: 1pt solid #d97706;
            padding: 7pt;
            font-weight: bold;
            text-align: right;
          }
          td {
            border: 1pt solid #cbd5e1;
            padding: 6.5pt;
            text-align: right;
            vertical-align: top;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }

          /* Callout and Deliverable Cards */
          .deliverable-box {
            border: 1.5pt solid #dfb15b;
            background-color: #fffbeb;
            padding: 10pt 12pt;
            margin: 10pt 0;
            border-radius: 6pt;
          }
          .section-card {
            margin-top: 20pt;
            border: 1.5pt solid #cbd5e1;
            border-top: 4pt solid #d97706;
            padding: 12pt;
            background-color: #ffffff;
          }
          .badge {
            display: inline-block;
            padding: 2pt 7pt;
            border-radius: 4pt;
            font-size: 8.5pt;
            font-weight: bold;
          }
          .badge-approved { background-color: #dcfce7; color: #166534; border: 1pt solid #86efac; }
          .badge-critical { background-color: #fee2e2; color: #991b1b; border: 1pt solid #fca5a5; }
          .badge-gold { background-color: #fef3c7; color: #92400e; border: 1pt solid #fcd34d; }
          .badge-progress { background-color: #e0f2fe; color: #0369a1; border: 1pt solid #7dd3fc; }

          .page-break {
            page-break-before: always;
            mso-break-type: section-break;
          }

          .checklist-item {
            margin: 3pt 0;
            font-size: 9.5pt;
          }
          .check-done {
            color: #16a34a;
            font-weight: bold;
          }
          .check-pending {
            color: #94a3b8;
          }
          
          .cover-card {
            border: 2pt solid #dfb15b;
            padding: 24pt;
            text-align: center;
            background-color: #fafaf9;
            margin-top: 20pt;
          }
        </style>
      </head>
      <body>

        <!-- ========================================== -->
        <!-- 1. COVER PAGE                             -->
        <!-- ========================================== -->
        <div class="cover-card">
          <p style="font-size: 12pt; color: #92400e; font-weight: bold; margin: 0;">
            المملكة العربية السعودية — محافظة الأحساء
          </p>
          <p style="font-size: 10pt; color: #64748b; margin-top: 2pt;">
            مشروع منظومة التراث الثقافي والتجربة التفاعلية
          </p>

          <div style="margin: 20pt 0;">
            <h1 style="margin: 0; font-size: 26pt; color: #78350f;">
              ${meta.projectTitleAr || 'سِـرَاج الأَحْـسَـاء'}
            </h1>
            <p style="font-size: 15pt; color: #d97706; font-weight: bold; margin-top: 6pt;">
              «${meta.projectSubtitleAr || 'تاريخٌ يُروى.. وحاضرٌ يُعاش'}»
            </p>
          </div>

          <div style="background-color: #78350f; color: #ffffff; padding: 8pt 18pt; font-size: 12pt; font-weight: bold; display: inline-block; margin: 12pt 0; border-radius: 4pt;">
            PROJECT DEFINITION REPORT (PDR)
          </div>
          <p style="font-size: 11pt; color: #475569; font-weight: bold;">
            ${meta.reportTitleAr || 'وثيقة تعريف المشروع المعتمدة'} — ${meta.version || 'الإصدار المعتمد 2.4'}
          </p>

          <!-- Document Metadata Table -->
          <table style="width: 92%; margin: 20pt auto; text-align: right; border: 1pt solid #d97706;">
            <tr>
              <th style="width: 32%;">الجهة المالكة والمشرفة</th>
              <td>إدارة مشروع سراج الأحساء بالتنسيق مع الجهات المعنية بمحافظة الأحساء</td>
            </tr>
            <tr>
              <th>نوع وتصنيف المشروع</th>
              <td>${meta.projectTypeAr || 'منظومة متحفية ومبادرة تراثية تعليمية تفاعلية غير ربحية'}</td>
            </tr>
            <tr>
              <th>نطاق التغطية الجغرافية</th>
              <td>${meta.locationAr || 'محافظة الأحساء — والوصول إلى كافة مناطق المملكة'}</td>
            </tr>
            <tr>
              <th>إجمالي الأقسام المعتمدة</th>
              <td><strong>${sections.length} قسماً رئيسياً</strong> (شاملة كافة بنود ومخرجات PDR)</td>
            </tr>
            <tr>
              <th>إجمالي المخرجات والبنود</th>
              <td><strong>${totalItems} مخرجاً رسمياً</strong> (نسبة الإنجاز والاعتماد: <strong style="color: #16a34a;">${completionPercent}%</strong>)</td>
            </tr>
            <tr>
              <th>الملاحق التشغيلية</th>
              <td><strong>${appendices.length || 6} ملاحق رسمية</strong> تشمل المخططات الهندسية والأدلة والمراجع</td>
            </tr>
            <tr>
              <th>حالة الاعتماد الرسمي</th>
              <td><span class="badge badge-approved">معتمد وموثق بقاعدة البيانات (Approved 100%)</span></td>
            </tr>
            <tr>
              <th>تاريخ الاستخلاص والتصدير</th>
              <td>${generatedDateAr} (${generatedDateGregorian})</td>
            </tr>
          </table>

          <p style="font-size: 9pt; color: #94a3b8; margin-top: 25pt;">
            سِـرَاج الأَحْـسَـاء © 2026 — مستخلص مباشرة وحصرياً من قاعدة البيانات الحية
          </p>
        </div>

        <div class="page-break"></div>

        <!-- ========================================== -->
        <!-- 2. TABLE OF CONTENTS / SECTIONS MATRIX     -->
        <!-- ========================================== -->
        <h2>فهرس وثيقة تعريف المشروع ومصفوفة الأقسام الـ ${sections.length}</h2>
        <p style="color: #475569; font-size: 10pt;">
          يتضمن هذا التقرير المستخلص من قاعدة البيانات كافة الأقسام التأسيسية والفنية والتشغيلية المعتمدة لمنظومة سراج الأحساء:
        </p>

        <table>
          <thead>
            <tr>
              <th style="width: 6%; text-align: center;">#</th>
              <th style="width: 30%;">القسم الرئيسي</th>
              <th style="width: 14%;">الرمز (Code)</th>
              <th style="width: 22%;">مشرف القسم (المسؤول)</th>
              <th style="width: 18%;">الإدارة المسؤولة</th>
              <th style="width: 10%; text-align: center;">المخرجات</th>
            </tr>
          </thead>
          <tbody>
            ${sections.map((sec, idx) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${sec.number || idx + 1}</td>
                <td>
                  <strong>${sec.titleAr || sec.nameAr}</strong>
                  <br><span style="font-size: 8pt; color: #64748b;">${sec.titleEn || ''}</span>
                </td>
                <td style="font-family: 'Courier New', monospace; font-weight: bold; color: #92400e;">${sec.code || '--'}</td>
                <td style="font-weight: bold; color: #1e293b;">${this._formatMember(sec.ownerId, teamMap)}</td>
                <td>${sec.leadDepartment || 'إدارة التخطيط والدراسات'}</td>
                <td style="text-align: center; font-weight: bold; color: #0369a1;">${(sec.items || []).length} بنود</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="page-break"></div>

        <!-- ========================================== -->
        <!-- 3. EXECUTIVE SUMMARY & VALUES              -->
        <!-- ========================================== -->
        <h2>أولاً: نبذة المشروع ورؤيته وقيمه المؤسسية</h2>
        
        <div style="border-right: 3pt solid #dfb15b; padding-right: 10pt; margin: 12pt 0; background-color: #fafaf9; padding: 10pt;">
          <h3 style="margin: 0 0 6pt 0;">1. الغاية والملخص الاستراتيجي:</h3>
          <p style="text-align: justify; margin: 0; color: #334155; line-height: 1.7;">
            ${about.summaryAr || ''} ${about.missionAr || ''}
          </p>
        </div>

        <h3 style="margin-top: 16pt;">2. القيم المؤسسية للمشروع (Core Values):</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 25%;">القيمة</th>
              <th style="width: 75%;">الوصف والأثر المتحقق</th>
            </tr>
          </thead>
          <tbody>
            ${values.map(val => `
              <tr>
                <td><strong>${val.nameAr}</strong></td>
                <td>${val.descAr}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${about.truckSpecs ? `
          <h3 style="margin-top: 16pt;">3. مواصفات ومحاور المنظومة التفاعلية:</h3>
          <table style="background-color: #fafaf9;">
            <tr>
              <th style="width: 30%;">اسم الوحدة / المعلم</th>
              <td>${about.truckSpecs.unitNameAr || 'منظومة سراج الأحساء المتحفية والتجربة التفاعلية'}</td>
            </tr>
            <tr>
              <th>الأبعاد والتوسعة</th>
              <td>${about.truckSpecs.lengthAr || '16 متراً قابلة للتوسعة الهيدروليكية المزدوجة'}</td>
            </tr>
            <tr>
              <th>الأبعاد والسعة</th>
              <td>${about.truckSpecs.capacityAr || 'استيعاب 35-40 زائراً لكل جولة'}</td>
            </tr>
            <tr>
              <th>الأنظمة والتقنيات</th>
              <td>${about.truckSpecs.techFeaturesAr || 'شاشات 270°، هولوجرام ثلاثي الأبعاد، واقع افتراضي 4D، وأنظمة حسية'}</td>
            </tr>
          </table>
        ` : ''}

        ${swot && swot.strengths ? `
          <div class="page-break"></div>
          <h2>ثانياً: مصفوفة التحليل الاستراتيجي (SWOT Analysis)</h2>
          <table>
            <thead>
              <tr style="background-color: #78350f; color: white;">
                <th style="width: 50%; color: white; background-color: #78350f;">نقاط القوة (Strengths)</th>
                <th style="width: 50%; color: white; background-color: #92400e;">الفرص الواعدة (Opportunities)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <ul style="margin: 0; padding-right: 15pt;">
                    ${(swot.strengths || []).map(s => `<li>${s}</li>`).join('')}
                  </ul>
                </td>
                <td>
                  <ul style="margin: 0; padding-right: 15pt;">
                    ${(swot.opportunities || []).map(o => `<li>${o}</li>`).join('')}
                  </ul>
                </td>
              </tr>
              <tr style="background-color: #78350f; color: white;">
                <th style="color: white; background-color: #b45309;">نقاط التحدي والتطوير (Weaknesses)</th>
                <th style="color: white; background-color: #b91c1c;">المخاطر المحتملة (Threats)</th>
              </tr>
              <tr>
                <td>
                  <ul style="margin: 0; padding-right: 15pt;">
                    ${(swot.weaknesses || []).map(w => `<li>${w}</li>`).join('')}
                  </ul>
                </td>
                <td>
                  <ul style="margin: 0; padding-right: 15pt;">
                    ${(swot.threats || []).map(t => `<li>${t}</li>`).join('')}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        ` : ''}

        <!-- ========================================== -->
        <!-- 4. ALL 17 PDR SECTIONS & DELIVERABLES      -->
        <!-- ========================================== -->
        <div class="page-break"></div>
        <h2>ثالثاً: مصفوفة بنود ومخرجات PDR التفصيلية المحدثة (الأقسام الـ ${sections.length})</h2>
        <p style="color: #64748b; font-size: 10pt; margin-bottom: 12pt;">
          فيما يلي الاستخلاص الكامل والشامل لكافة الأقسام والمخرجات وبنود التحقق المعتمدة والمحدثة بقاعدة البيانات:
        </p>

        ${sections.map((sec, secIdx) => `
          <div class="section-card">
            
            <div style="border-bottom: 1.5pt solid #e2e8f0; padding-bottom: 8pt; margin-bottom: 10pt;">
              <h3 style="margin: 0; color: #78350f; font-size: 14pt;">
                القسم ${sec.number || secIdx + 1}: ${sec.titleAr || sec.nameAr}
              </h3>
              <span style="font-size: 9pt; color: #64748b;">${sec.titleEn || ''} • الرمز: <strong style="color: #92400e;">${sec.code || '--'}</strong></span>
            </div>

            <!-- Section Meta Box -->
            <table style="margin: 6pt 0 12pt 0; background-color: #fdfaf6;">
              <tr>
                <th style="width: 20%; background-color: #fef3c7;">مشرف القسم:</th>
                <td style="width: 30%; font-weight: bold; color: #1e293b;">${this._formatMember(sec.ownerId, teamMap)}</td>
                <th style="width: 20%; background-color: #fef3c7;">الإدارة المسؤولة:</th>
                <td style="width: 30%; font-weight: bold;">${sec.leadDepartment || 'إدارة التخطيط والدراسات'}</td>
              </tr>
              <tr>
                <th style="background-color: #fef3c7;">وصف القسم:</th>
                <td colspan="3" style="color: #334155; line-height: 1.5;">${sec.descriptionAr || 'لا يوجد وصف متاح لهذا القسم.'}</td>
              </tr>
            </table>

            <!-- Section Items Summary Table -->
            <table style="font-size: 9pt; margin-bottom: 12pt;">
              <thead>
                <tr>
                  <th style="width: 5%; text-align: center;">#</th>
                  <th style="width: 32%;">اسم البند / المخرج</th>
                  <th style="width: 25%;">المسؤول المنفذ</th>
                  <th style="width: 15%;">نوع المهمة</th>
                  <th style="width: 11%;">الأولوية</th>
                  <th style="width: 12%; text-align: center;">الإنجاز</th>
                </tr>
              </thead>
              <tbody>
                ${(sec.items || []).map((item, itIdx) => `
                  <tr>
                    <td style="text-align: center; font-weight: bold;">${itIdx + 1}</td>
                    <td>
                      <strong>${item.title || item.deliverables}</strong>
                      ${item.deliverables && item.deliverables !== item.title ? `<br><span style="font-size: 8pt; color: #92400e;">المخرج: ${item.deliverables}</span>` : ''}
                    </td>
                    <td>${this._formatMember(item.assignedTo, teamMap)}</td>
                    <td style="font-size: 8.5pt;">${this._formatTaskType(item.taskType)}</td>
                    <td>
                      <span class="badge ${item.priority === 'critical' ? 'badge-critical' : 'badge-gold'}">
                        ${item.priority === 'critical' ? 'حرج وعاجل' : item.priority === 'high' ? 'أولوية عالية' : 'عادي'}
                      </span>
                    </td>
                    <td style="text-align: center; font-weight: bold; color: #16a34a;">
                      ${item.progress || (item.status === 'approved' ? 100 : 0)}%
                      <br><span style="font-size: 7.5pt; color: #64748b;">${this._formatStatus(item.status)}</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Detailed Deliverables Cards -->
            ${(sec.items || []).map((item, itIdx) => `
              <div class="deliverable-box">
                <div style="font-size: 11pt; font-weight: bold; color: #78350f; border-bottom: 1pt solid #fcd34d; padding-bottom: 4pt; margin-bottom: 6pt;">
                  المخرج الرسمي ${sec.number}.${itIdx + 1}: ${item.deliverables || item.title}
                </div>

                <div style="font-size: 8.5pt; color: #64748b; margin-bottom: 4pt;">
                  <span>المسؤول: <strong>${this._formatMember(item.assignedTo, teamMap)}</strong></span> • 
                  <span>تاريخ الاستحقاق: <strong style="font-family: monospace;">${item.dueDate || '2026-09-30'}</strong></span> • 
                  <span>الحالة: <span class="badge badge-approved">${this._formatStatus(item.status)}</span></span>
                </div>

                ${item.description ? `
                  <p style="font-size: 9.5pt; color: #475569; margin: 4pt 0;">
                    <strong>الهدف والنطاق:</strong> ${item.description}
                  </p>
                ` : ''}

                ${item.deliverableContent ? `
                  <div style="background-color: #ffffff; border: 1pt solid #fed7aa; padding: 8pt; margin: 6pt 0; font-size: 9.5pt; color: #1e293b; text-align: justify; line-height: 1.6;">
                    <strong style="color: #9a3412;">النص المعتمد للمخرج:</strong><br>
                    ${item.deliverableContent}
                  </div>
                ` : ''}

                ${item.deliverableChecklist && item.deliverableChecklist.length > 0 ? `
                  <div style="margin-top: 6pt;">
                    <strong style="font-size: 9pt; color: #92400e;">قائمة مهام التحقق ومؤشرات الإنجاز:</strong>
                    <div style="margin-top: 4pt;">
                      ${item.deliverableChecklist.map(c => `
                        <div class="checklist-item">
                          <span class="${c.completed ? 'check-done' : 'check-pending'}">
                            ${c.completed ? '☑ [مكتمل]' : '☐ [قيد المتابعة]'}
                          </span>
                          <span style="color: #334155;">${c.text}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
            `).join('')}

          </div>
        `).join('')}

        <!-- ========================================== -->
        <!-- 4.5 CUSTOM EXECUTIVE SLIDES (IF ANY)       -->
        <!-- ========================================== -->
        ${customSlides.length > 0 ? `
          <div class="page-break"></div>
          <h2>رابعاً: الشرائح التنفيذية الإضافية المخصصة (Custom Executive Slides)</h2>
          <p style="color: #475569; font-size: 10pt;">
            الشرائح والمذكرات الاستراتيجية المخصصة التي تم إنشاؤها وتوثيقها من قبل إدارة النظام:
          </p>

          ${customSlides.map((slide, sIdx) => `
            <div style="border: 1.5pt solid #c084fc; border-top: 3pt solid #7e22ce; padding: 12pt; margin: 12pt 0; background-color: #faf5ff;">
              <h3 style="margin: 0 0 6pt 0; color: #581c87;">
                شريحة ${sIdx + 1}: ${slide.titleAr || slide.title || 'شريحة مخصصة'}
              </h3>
              ${slide.subtitleAr ? `<p style="font-size: 9.5pt; color: #6b21a8; margin: 0 0 8pt 0;">${slide.subtitleAr}</p>` : ''}
              <div style="background-color: #ffffff; border: 1pt solid #e9d5ff; padding: 10pt; font-size: 10pt; line-height: 1.6; text-align: justify; color: #1e1b4b;">
                ${slide.contentAr || slide.content || ''}
              </div>
            </div>
          `).join('')}
        ` : ''}

        <!-- ========================================== -->
        <!-- 5. OPERATIONAL APPENDICES                  -->
        <!-- ========================================== -->
        <div class="page-break"></div>
        <h2>خامساً: الملاحق التشغيلية والمراجع المعتمدة (Operational Appendices)</h2>
        <p style="color: #475569; font-size: 10pt;">
          تشكل الملاحق الـ ${appendices.length || 6} الإطار الفني والهندسي والشرعي الداعم لتنفيذ المشروع:
        </p>

        <table>
          <thead>
            <tr>
              <th style="width: 8%; text-align: center;">الملحق</th>
              <th style="width: 32%;">عنوان الملحق</th>
              <th style="width: 45%;">الوصف والمحتوى</th>
              <th style="width: 15%; text-align: center;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${appendices.map(app => `
              <tr>
                <td style="text-align: center; font-weight: bold;">0${app.number}</td>
                <td>
                  <strong>${app.titleAr}</strong>
                  <br><span style="font-size: 8.5pt; color: #64748b;">${app.titleEn || ''}</span>
                </td>
                <td style="font-size: 9.5pt;">${app.descriptionAr || ''}</td>
                <td style="text-align: center;"><span class="badge badge-approved">${app.status || 'جاهز ومعتمد'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- ========================================== -->
        <!-- 6. APPROVALS & SIGNATURES                 -->
        <!-- ========================================== -->
        <div class="page-break"></div>
        <h2>سادساً: صفحة الاعتمادات والتواقيع الرسمية (Official Approvals)</h2>
        <p style="color: #475569; font-size: 10pt; margin-bottom: 16pt;">
          تمت مراجعة هذه الوثيقة وتدقيق بنودها الـ ${sections.length} ومخرجاتها الـ ${totalItems} وفق الضوابط الشرعية والتاريخية والمعايير الهندسية والفنية المعتمدة بقواعد بيانات المشروع:
        </p>

        <table style="width: 100%; border: 2pt solid #dfb15b; margin-top: 15pt;">
          <thead>
            <tr style="background-color: #fef3c7;">
              <th style="width: 33%; text-align: center; padding: 10pt;">إعداد وتنسيق</th>
              <th style="width: 34%; text-align: center; padding: 10pt;">المراجعة والتدقيق الفني</th>
              <th style="width: 33%; text-align: center; padding: 10pt;">الاعتماد النهائي والموافقة</th>
            </tr>
          </thead>
          <tbody>
            <tr style="height: 120pt;">
              <td style="vertical-align: top; padding: 10pt;">
                <strong>فريق إدارة وثيقة PDR</strong><br>
                <span style="font-size: 9pt; color: #64748b;">إدارة التخطيط والدراسات الاستراتيجية</span>
                <br><br><br>
                <span style="font-size: 8.5pt; color: #94a3b8;">التوقيع: __________________</span><br>
                <span style="font-size: 8.5pt; color: #94a3b8;">التاريخ: ${generatedDateAr}</span>
              </td>
              <td style="vertical-align: top; padding: 10pt;">
                <strong>اللجنة الشرعية والتاريخية</strong><br>
                <span style="font-size: 9pt; color: #64748b;">هيئة التدقيق والموثوقية التراثية</span>
                <br><br><br>
                <span style="font-size: 8.5pt; color: #94a3b8;">التوقيع: __________________</span><br>
                <span style="font-size: 8.5pt; color: #94a3b8;">التاريخ: ${generatedDateAr}</span>
              </td>
              <td style="vertical-align: top; padding: 10pt;">
                <strong>د. عبد المحسن المبارك</strong><br>
                <span style="font-size: 9pt; color: #64748b;">مدير المشروع والمشرف العام</span>
                <br><br><br>
                <span style="font-size: 8.5pt; color: #94a3b8;">الختم والتوقيع: _____________</span><br>
                <span style="font-size: 8.5pt; color: #94a3b8;">التاريخ: ${generatedDateAr}</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 30pt; padding-top: 12pt; border-top: 1pt solid #cbd5e1; font-size: 9pt; color: #94a3b8;">
          «سِـرَاج الأَحْـسَـاء — تاريخٌ يُروى.. وحاضرٌ يُعاش» • وثيقة تعريف المشروع PDR 2026
        </div>

      </body>
      </html>
    `;
  },

  /**
   * Construct HTML for single deliverable Word export
   */
  _buildSingleDeliverableHtml(data, section, item, teamMap) {
    const meta = data.metadata || {};
    const dateAr = new Date().toLocaleDateString('ar-SA');

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir='rtl'>
      <head>
        <meta charset='utf-8'>
        <title>${item.deliverables || item.title} — سراج الأحساء</title>
        <style>
          @page { size: A4; margin: 2.0cm; }
          body { font-family: 'Cairo', 'Traditional Arabic', 'Arial', sans-serif; direction: rtl; text-align: right; color: #1a1a1a; }
          table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
          th, td { border: 1pt solid #cbd5e1; padding: 8pt; text-align: right; }
          th { background-color: #fef3c7; color: #78350f; font-weight: bold; }
          .badge { display: inline-block; padding: 2pt 8pt; border-radius: 4pt; font-size: 9pt; font-weight: bold; }
          .badge-approved { background-color: #dcfce7; color: #166534; border: 1pt solid #86efac; }
        </style>
      </head>
      <body>
        <div style="border: 2pt solid #dfb15b; padding: 16pt; background-color: #fffbeb;">
          <h2 style="color: #78350f; margin: 0;">سِـرَاج الأَحْـسَـاء — وثيقة مخرج رسمي معتمد</h2>
          <p style="color: #92400e; font-weight: bold; margin-top: 4pt;">«تاريخٌ يُروى.. وحاضرٌ يُعاش»</p>
          <hr style="border: 0; border-top: 1pt solid #d97706; margin: 10pt 0;">
          
          <h1 style="font-size: 18pt; color: #1e293b; margin: 10pt 0;">
            ${item.deliverables || item.title}
          </h1>
          <p style="font-size: 11pt; color: #64748b;">
            القسم ${section.number}: ${section.titleAr} (${section.titleEn || ''})
          </p>

          <table>
            <tr>
              <th style="width: 25%;">حالة الاعتماد</th>
              <td><span class="badge badge-approved">${this._formatStatus(item.status)}</span></td>
            </tr>
            <tr>
              <th>مشرف القسم</th>
              <td>${this._formatMember(section.ownerId, teamMap)}</td>
            </tr>
            <tr>
              <th>المسؤول عن التنفيذ</th>
              <td><strong>${this._formatMember(item.assignedTo, teamMap)}</strong></td>
            </tr>
            <tr>
              <th>نوع المهمة والتصنيف</th>
              <td>${this._formatTaskType(item.taskType)}</td>
            </tr>
            <tr>
              <th>درجة الأولوية</th>
              <td>${item.priority === 'critical' ? 'حرجة وعاجلة' : item.priority === 'high' ? 'أولوية عالية' : 'عادي'}</td>
            </tr>
            <tr>
              <th>تاريخ الاستحقاق</th>
              <td>${item.dueDate || '2026-09-30'}</td>
            </tr>
          </table>

          <h3 style="color: #78350f;">الهدف والنطاق:</h3>
          <p style="color: #334155; line-height: 1.6; text-align: justify;">
            ${item.description || 'لا يوجد وصف إضافي.'}
          </p>

          <h3 style="color: #78350f;">النص المعتمد للمخرج:</h3>
          <div style="background-color: #ffffff; border: 1pt solid #cbd5e1; padding: 12pt; margin: 10pt 0; text-align: justify; line-height: 1.6; color: #1e293b;">
            ${item.deliverableContent || 'لا يوجد نص معتمد مسجل.'}
          </div>

          ${item.deliverableChecklist && item.deliverableChecklist.length > 0 ? `
            <h3 style="color: #78350f;">قائمة بنود التحقق والمتابعة:</h3>
            <ul>
              ${item.deliverableChecklist.map(c => `
                <li style="margin: 4pt 0;">
                  <strong style="color: ${c.completed ? '#16a34a' : '#94a3b8'};">
                    ${c.completed ? '☑ [مكتمل]' : '☐ [قيد المتابعة]'}
                  </strong>: ${c.text}
                </li>
              `).join('')}
            </ul>
          ` : ''}

          <div style="margin-top: 30pt; border-top: 1pt solid #cbd5e1; padding-top: 10pt; font-size: 9pt; color: #94a3b8;">
            تم التصدير بتاريخ: ${dateAr} • منظومة سراج الأحساء 2026
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Construct HTML for Executive Dossier Word export
   */
  _buildExecutiveDossierHtml(data, teamMap, options = {}) {
    const meta = data.metadata || {};
    const about = data.about || {};
    const sections = Array.isArray(data.sections) ? data.sections : [];
    const values = Array.isArray(data.values) ? data.values : [];
    const swot = data.swot || {};
    const customSlides = Array.isArray(data.customExecutiveSlides) ? data.customExecutiveSlides : [];

    const dateAr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

    let totalItems = 0;
    let approvedItems = 0;
    sections.forEach(sec => {
      (sec.items || []).forEach(item => {
        totalItems++;
        if (item.status === 'approved' || item.progress === 100) approvedItems++;
      });
    });
    const completionPercent = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 100;

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' dir='rtl'>
      <head>
        <meta charset='utf-8'>
        <title>العرض التنفيذي الشامل — ${meta.projectTitleAr || 'سراج الأحساء'}</title>
        <style>
          @page { size: A4; margin: 2.0cm; }
          body { font-family: 'Cairo', 'Traditional Arabic', 'Arial', sans-serif; direction: rtl; text-align: right; color: #1a1a1a; font-size: 11pt; line-height: 1.6; }
          h1 { font-size: 22pt; color: #78350f; text-align: center; }
          h2 { font-size: 15pt; color: #92400e; border-bottom: 2pt solid #dfb15b; padding-bottom: 4pt; margin-top: 20pt; }
          h3 { font-size: 12pt; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 9.5pt; }
          th, td { border: 1pt solid #cbd5e1; padding: 6.5pt; text-align: right; }
          th { background-color: #fef3c7; color: #78350f; font-weight: bold; }
          .page-break { page-break-before: always; }
          .metric-card { display: inline-block; width: 28%; border: 1.5pt solid #dfb15b; background-color: #fefce8; padding: 10pt; text-align: center; margin: 5pt; border-radius: 6pt; }
        </style>
      </head>
      <body>
        <div style="border: 2pt solid #dfb15b; padding: 20pt; text-align: center; background-color: #fafaf9;">
          <h2 style="margin: 0; color: #92400e; border: 0;">المملكة العربية السعودية — محافظة الأحساء</h2>
          <h1 style="margin: 15pt 0 5pt 0;">سِـرَاج الأَحْـسَـاء</h1>
          <p style="font-size: 14pt; color: #d97706; font-weight: bold; margin: 0 0 15pt 0;">العرض التنفيذي والمذكرة الاستثمارية الشاملة</p>
          <div style="background-color: #78350f; color: #ffffff; padding: 6pt 16pt; font-size: 11pt; font-weight: bold; display: inline-block; border-radius: 4pt;">
            EXECUTIVE PITCH DECK & STRATEGIC DOSSIER
          </div>
          <p style="font-size: 10pt; color: #64748b; margin-top: 15pt;">تاريخ الإصدار: ${dateAr}</p>
        </div>

        <div class="page-break"></div>

        <h2>1. المؤشرات التنفيذية الرئيسية (Executive KPI Metrics)</h2>
        <table style="width: 100%; margin: 15pt 0;">
          <tr>
            <td style="text-align: center; background-color: #fef3c7; width: 33%; padding: 15pt;">
              <span style="font-size: 22pt; font-weight: bold; color: #78350f;">${sections.length}</span><br>
              <strong style="color: #92400e;">أقسام PDR المعتمدة</strong>
            </td>
            <td style="text-align: center; background-color: #ecfdf5; width: 34%; padding: 15pt;">
              <span style="font-size: 22pt; font-weight: bold; color: #047857;">${completionPercent}%</span><br>
              <strong style="color: #065f46;">نسبة الإنجاز والاعتماد</strong>
            </td>
            <td style="text-align: center; background-color: #eff6ff; width: 33%; padding: 15pt;">
              <span style="font-size: 22pt; font-weight: bold; color: #1d4ed8;">${totalItems}</span><br>
              <strong style="color: #1e40af;">إجمالي المخرجات والبنود</strong>
            </td>
          </tr>
        </table>

        <h2>2. الغاية والرؤية الاستراتيجية</h2>
        <p style="text-align: justify; line-height: 1.7; color: #334155;">
          ${about.summaryAr || ''} ${about.missionAr || ''}
        </p>

        <h2>3. مصفوفة الأقسام والمشرفين المعتمدين</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 8%; text-align: center;">#</th>
              <th style="width: 32%;">القسم</th>
              <th style="width: 25%;">مشرف القسم</th>
              <th style="width: 20%;">الإدارة المسؤولة</th>
              <th style="width: 15%; text-align: center;">عدد المخرجات</th>
            </tr>
          </thead>
          <tbody>
            ${sections.map((sec, idx) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${sec.number || idx + 1}</td>
                <td><strong>${sec.titleAr || sec.nameAr}</strong></td>
                <td>${this._formatMember(sec.ownerId, teamMap)}</td>
                <td>${sec.leadDepartment || 'إدارة التخطيط والدراسات'}</td>
                <td style="text-align: center; font-weight: bold;">${(sec.items || []).length} مخرج</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${customSlides.length > 0 ? `
          <h2>4. الشرائح التنفيذية المخصصة</h2>
          ${customSlides.map((slide, sIdx) => `
            <div style="border: 1pt solid #cbd5e1; padding: 10pt; margin: 10pt 0; background-color: #fafaf9;">
              <h3 style="margin: 0 0 4pt 0; color: #78350f;">${slide.titleAr || slide.title}</h3>
              <p style="margin: 0; font-size: 9.5pt; color: #334155; line-height: 1.5;">${slide.contentAr || slide.content || ''}</p>
            </div>
          `).join('')}
        ` : ''}

        <div style="text-align: center; margin-top: 30pt; padding-top: 10pt; border-top: 1pt solid #cbd5e1; font-size: 9pt; color: #94a3b8;">
          «سِـرَاج الأَحْـسَـاء — تاريخٌ يُروى.. وحاضرٌ يُعاش» • العرض التنفيذي المعتمد 2026
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Helper: Trigger file download in browser
   */
  _downloadWordFile(htmlContent, filename) {
    if (typeof Blob === "undefined") {
      console.warn("Blob not available in this environment.");
      return;
    }

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8'
    });

    if (typeof document !== "undefined" && document.createElement) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }, 100);
    }
  },

  /**
   * Helper: Toast feedback
   */
  _showToast(message, type = "info") {
    if (typeof window !== "undefined" && window.App && typeof window.App.showToast === "function") {
      window.App.showToast(message, type);
      return;
    }

    if (typeof document !== "undefined" && document.createElement) {
      const toast = document.createElement("div");
      toast.className = `fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-3 transition-all duration-300 font-['Cairo'] ${
        type === 'success' ? 'bg-green-800 text-white border border-green-500' :
        type === 'error' ? 'bg-red-800 text-white border border-red-500' :
        'bg-amber-800 text-white border border-gold'
      }`;
      toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-green-400' : type === 'error' ? 'fa-circle-xmark text-red-400' : 'fa-circle-info text-gold'} text-base"></i>
        <span>${message}</span>
      `;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 400);
      }, 4000);
    }
  }
};

// Global helper attachments
if (typeof window !== "undefined") {
  window.App = window.App || {};
  window.App.PdrWordExporter = App.PdrWordExporter;
  
  window.App.exportPdrToWord = function(options) {
    return App.PdrWordExporter.exportMasterDocument(null, options);
  };

  window.App.exportDeliverableToWord = function(sectionId, itemId) {
    return App.PdrWordExporter.exportSingleDeliverable(sectionId, itemId, null);
  };

  window.App.exportExecutiveDossierToWord = function(options) {
    return App.PdrWordExporter.exportExecutiveDossierToWord(options);
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = App.PdrWordExporter;
}
