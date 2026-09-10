/* ==========================================================
   SERAJ AL-AHSA PLATFORM - OMNI-NAVIGATOR & UNIFIED QUICK HUB
   دليل المنصة الشامل، البحث الفوري، وشريط الوصول السريع العائم
   ========================================================== */

(function() {
  window.App = window.App || {};

  // Comprehensive Platform Directory for Search & Instant Jump
  const PLATFORM_DIRECTORY = [
    // 🌟 Section 1: Visual Storyboard & Experience Flow (سراج الأحساء)
    {
      id: "sim-intro",
      page: "index.html",
      hash: "#section-intro",
      category: "simulator",
      categoryName: "الستوري بورد والتجربة 🎬",
      categoryIcon: "fa-clapperboard",
      categoryColor: "#dfb15b",
      title: "المقدمة والسيناريو التنفيذي",
      desc: "نظرة عامة على الستوري بورد البصري والرحلة الغامرة وتاريخ الأحساء في صدر الإسلام",
      keywords: ["مقدمة", "رؤية", "سراج الأحساء", "الحواس", "سيناريو", "ستوري بورد", "intro", "storyboard"]
    },
    {
      id: "sim-map",
      page: "index.html",
      hash: "#section-map",
      category: "simulator",
      categoryName: "الستوري بورد والتجربة 🎬",
      categoryIcon: "fa-clapperboard",
      categoryColor: "#dfb15b",
      title: "خريطة رحلة الحواس السبعة التفاعلية",
      desc: "خريطة بصرية تفاعلية توضح تسلسل المحطات السبعة والأنظمة الحسية",
      keywords: ["خريطة", "مسار", "محطات", "رحلة", "تفاعلية", "map", "flow"]
    },
    {
      id: "sim-history",
      page: "index.html",
      hash: "#section-history",
      category: "simulator",
      categoryName: "الستوري بورد والتجربة 🎬",
      categoryIcon: "fa-clapperboard",
      categoryColor: "#dfb15b",
      title: "المحطات التاريخية الثمانية للأحساء",
      desc: "التسلسل الزمني: هجر قبل الإسلام، الأسواق، السيرة، الرسالة، جواثى، الراشدين، والإرث",
      keywords: ["تاريخ", "هجر", "جواثى", "المنذر", "عبدالقيس", "تاريخية", "محطات", "history", "timeline"]
    },
    {
      id: "sim-st1",
      page: "index.html",
      hash: "#section-simulator",
      station: 1,
      category: "simulator",
      categoryName: "الستوري بورد والتجربة 🎬",
      categoryIcon: "fa-clapperboard",
      categoryColor: "#dfb15b",
      title: "المحطة 01: ساحة الوصول والتهيئة الاستراتيجية",
      desc: "شلال مائي ليزري ذكي، إضاءة غامرة، صوت استقبال ترحيبي",
      keywords: ["ساحة الوصول", "شلال", "مائي", "ليزر", "محطة 1", "station 1", "arrival"]
    },
    {
      id: "sim-st2",
      page: "index.html",
      hash: "#section-simulator",
      station: 2,
      category: "simulator",
      categoryName: "الستوري بورد والتجربة 🎬",
      categoryIcon: "fa-clapperboard",
      categoryColor: "#dfb15b",
      title: "المحطة 02: ممر رحلة الزمن (أعماق هجر)",
      desc: "أرضية LED تفاعلية مع حساسات LiDAR ومؤثرات رمال صوتية",
      keywords: ["ممر الزمن", "أرضية", "ليد", "ليدار", "محطة 2", "station 2", "time corridor"]
    },
    {
      id: "sim-st3",
      page: "index.html",
      hash: "#section-simulator",
      station: 3,
      category: "simulator",
      categoryName: "الستوري بورد والتجربة 🎬",
      categoryIcon: "fa-clapperboard",
      categoryColor: "#dfb15b",
      title: "المحطة 03: جناح عصر الرسالة (التحول العظيم)",
      desc: "هولوغرام ثلاثي الأبعاد وصوت بؤري موجه يروي وصول كتاب النبوة",
      keywords: ["عصر الرسالة", "هولوغرام", "كتاب النبوة", "صوت بؤري", "محطة 3", "station 3", "message"]
    },
    {
      id: "sim-st4",
      page: "index.html",
      hash: "#section-simulator",
      station: 4,
      category: "simulator",
      categoryName: "الستوري بورد والتجربة 🎬",
      categoryIcon: "fa-clapperboard",
      categoryColor: "#dfb15b",
      title: "المحطة 04: جناح جواثى والعهد الراشدي",
      desc: "شاشات OLED شفافة ورائحة الطين المعطر والبخور الذكي",
      keywords: ["جواثى", "شاشات شفافة", "رائحة", "طين", "بخور", "محطة 4", "station 4", "jawatha"]
    },
    {
      id: "sim-st5",
      page: "index.html",
      hash: "#section-simulator",
      station: 5,
      category: "simulator",
      categoryName: "الستوري بورد والتجربة 🎬",
      categoryIcon: "fa-clapperboard",
      categoryColor: "#dfb15b",
      title: "المحطة 05: واحة الأحساء الحية المفتوحة",
      desc: "صوت توليدي مستمر ورذاذ مناخي ذكي يحاكي نخيل وعيون الأحساء",
      keywords: ["الواحة", "رذاذ", "مناخي", "صوت توليدي", "نخيل", "محطة 5", "station 5", "oasis"]
    },
    {
      id: "sim-st6",
      page: "index.html",
      hash: "#section-simulator",
      station: 6,
      category: "simulator",
      categoryName: "الستوري بورد والتجربة 🎬",
      categoryIcon: "fa-clapperboard",
      categoryColor: "#dfb15b",
      title: "المحطة 06: السينما الدائرية والـ 4D",
      desc: "عرض قبابي 360 درجة واهتزازات مقاعد حركية تحاكي وفادة عبد القيس",
      keywords: ["سينما", "قبابية", "4d", "اهتزاز", "360", "محطة 6", "station 6", "dome cinema"]
    },
    {
      id: "sim-st7",
      page: "index.html",
      hash: "#section-simulator",
      station: 7,
      category: "simulator",
      categoryName: "الستوري بورد والتجربة 🎬",
      categoryIcon: "fa-clapperboard",
      categoryColor: "#dfb15b",
      title: "المحطة 07: مركز المعرفة واستدامة الأثر",
      desc: "طاولات لمس ذكية وسحابة أرشفة لتصدير باقة الأحساء التاريخية للبريد",
      keywords: ["مركز المعرفة", "طاولات ذكية", "سوار", "تصدير", "محطة 7", "station 7", "knowledge"]
    },

    // 🏛️ Section 2: Museum Master Plan (دراسة وتصور متحف السيرة)
    {
      id: "plan-identity",
      page: "museum-plan.html",
      planTab: "identity",
      category: "museum",
      categoryName: "دراسة وتصميم المتحف",
      categoryIcon: "fa-landmark-dome",
      categoryColor: "#dfb15b",
      title: "الهوية والرؤية والأهداف الاستراتيجية",
      desc: "فلسفة شعار «تاريخٌ يُروى.. وحاضرٌ يُعاش»، المستهدفات الجماهيرية، والركائز الـ 5",
      keywords: ["الهوية", "الرؤية", "الأهداف", "الشعار", "تاريخ يروى وحاضر يعاش", "سراج الأحساء", "identity", "vision"]
    },
    {
      id: "plan-location",
      page: "museum-plan.html",
      planTab: "location",
      category: "museum",
      categoryName: "دراسة وتصميم المتحف",
      categoryIcon: "fa-landmark-dome",
      categoryColor: "#dfb15b",
      title: "الموقع الميداني والمساحات والقدرة الاستيعابية",
      desc: "توزيع الأجنحة، مساحات العرض، وتدفق الزوار اليومي بالمتحف",
      keywords: ["الموقع", "المساحات", "القدرة الاستيعابية", "تدفق الزوار", "location", "spaces"]
    },
    {
      id: "plan-artifacts",
      page: "museum-plan.html",
      planTab: "artifacts",
      category: "museum",
      categoryName: "دراسة وتصميم المتحف",
      categoryIcon: "fa-landmark-dome",
      categoryColor: "#dfb15b",
      title: "المحور ١: السيرة النبوية والمقتنيات والآثار",
      desc: "تجسيد قلال هجر، الثوب الظهراني، تمر البرني، الدباء والحنتم، ودروع وفد عبدالقيس",
      keywords: ["مقتنيات", "آثار", "قلال هجر", "برني", "ثوب ظهراني", "حنتم", "المحور 1", "artifacts"]
    },
    {
      id: "plan-schools",
      page: "museum-plan.html",
      planTab: "schools",
      category: "museum",
      categoryName: "دراسة وتصميم المتحف",
      categoryIcon: "fa-landmark-dome",
      categoryColor: "#dfb15b",
      title: "المحور ١: المدارس الفقهية والأسانيد الحديثية الأحسائية",
      desc: "أسانيد أهل الأحساء، شيوخ الحديث، وتاريخ المدارس العلمية العريقة",
      keywords: ["مدارس", "أسانيد", "حديث", "فقه", "علماء الأحساء", "schools", "chains"]
    },
    {
      id: "plan-hologram",
      page: "museum-plan.html",
      planTab: "hologram",
      category: "museum",
      categoryName: "دراسة وتصميم المتحف",
      categoryIcon: "fa-landmark-dome",
      categoryColor: "#dfb15b",
      title: "المحور ٢: عروض الهولوجرام والمشاهد التاريخية",
      desc: "مشاهد هولوجرام تفاعلية لوفد عبد القيس، الجمعة الثانية بجواثى، وثبات الجارود",
      keywords: ["هولوجرام", "مشاهد", "وفد عبدالقيس", "مسجد جواثى", "الجارود", "المحور 2", "hologram"]
    },
    {
      id: "plan-vr",
      page: "museum-plan.html",
      planTab: "vr",
      category: "museum",
      categoryName: "دراسة وتصميم المتحف",
      categoryIcon: "fa-landmark-dome",
      categoryColor: "#dfb15b",
      title: "المحور ٣: الواقع الافتراضي والـ VR الغامر",
      desc: "تجارب نظارات الواقع الافتراضي لمحاكاة أسواق هجر القديمة وميناء العقير",
      keywords: ["واقع افتراضي", "vr", "نظارات", "ميناء العقير", "المشقر", "المحور 3", "virtual reality"]
    },
    {
      id: "plan-finance",
      page: "museum-plan.html",
      planTab: "finance",
      category: "museum",
      categoryName: "دراسة وتصميم المتحف",
      categoryIcon: "fa-landmark-dome",
      categoryColor: "#dfb15b",
      title: "الميزانيات التقديرية ونموذج التشغيل والاستدامة والوقف",
      desc: "تكاليف التأسيس، العائد الاستثماري، ونموذج الوقف والأثر المجتمعي المستدام",
      keywords: ["ميزانية", "تكلفة", "تشغيل", "وقف", "استدامة", "مالية", "finance", "budget"]
    },
    {
      id: "plan-store",
      page: "museum-plan.html",
      planTab: "store_refs",
      category: "museum",
      categoryName: "دراسة وتصميم المتحف",
      categoryIcon: "fa-landmark-dome",
      categoryColor: "#dfb15b",
      title: "المتجر التذكاري والمصادر والمراجع العلمية",
      desc: "المنتجات الثقافية والهدايا التذكارية وقائمة المصادر التاريخية المعتمدة",
      keywords: ["متجر", "هدايا", "مراجع", "مصادر", "أبحاث", "store", "references"]
    },
    {
      id: "plan-team",
      page: "museum-plan.html",
      planTab: "team",
      category: "museum",
      categoryName: "غرفة عمل الفريق والقيادة",
      categoryIcon: "fa-users-gear",
      categoryColor: "#00ebd4",
      title: "فريق العمل وتوزيع المسؤوليات التخصصية",
      desc: "قائمة الكوادر الإشرافية والبحثية والهندسية المكلفة بمشروع المتحف",
      keywords: ["فريق العمل", "أعضاء", "مسؤوليات", "كوادر", "team", "members"]
    },
    {
      id: "plan-tasks",
      page: "museum-plan.html",
      planTab: "tasks",
      category: "museum",
      categoryName: "غرفة عمل الفريق والقيادة",
      categoryIcon: "fa-users-gear",
      categoryColor: "#00ebd4",
      title: "مصفوفة مهام ومسؤوليات الفريق المعتمدة",
      desc: "جدول المهام التخصصية مع نسب الإنجاز، المسؤولين، وتواريخ التسليم",
      keywords: ["مهام", "مصفوفة المهام", "إنجاز", "مسؤوليات", "tasks", "matrix"]
    },
    {
      id: "plan-decisions",
      page: "museum-plan.html",
      planTab: "decisions",
      category: "museum",
      categoryName: "غرفة عمل الفريق والقيادة",
      categoryIcon: "fa-users-gear",
      categoryColor: "#00ebd4",
      title: "مصفوفة القرارات الاستراتيجية الـ 11 المعلقة",
      desc: "القرارات المعمارية، التقنية، والتشغيلية التي تنتظر اعتماد القيادة",
      keywords: ["قرارات", "معلقة", "استراتيجية", "اعتماد", "decisions", "matrix"]
    },
    {
      id: "plan-export",
      page: "museum-plan.html",
      planTab: "export_tools",
      category: "museum",
      categoryName: "غرفة عمل الفريق والقيادة",
      categoryIcon: "fa-users-gear",
      categoryColor: "#00ebd4",
      title: "أدوات التصدير والمشاركة والطباعة",
      desc: "تصدير دراسة المتحف بصيغة Markdown أو طباعة التقرير الكامل",
      keywords: ["تصدير", "طباعة", "مشاركة", "تقرير", "export", "print"]
    },
    {
      id: "plan-users",
      page: "museum-plan.html",
      planTab: "users",
      category: "museum",
      categoryName: "غرفة عمل الفريق والقيادة",
      categoryIcon: "fa-users-gear",
      categoryColor: "#00ebd4",
      title: "إدارة المستخدمين والصلاحيات 👑",
      desc: "لوحة التحكم السريعة لإدارة أعضاء المنظومة وتحديد الأدوار",
      keywords: ["مستخدمين", "صلاحيات", "أدوار", "مدير", "users", "admin"]
    },

    // 📊 Section 3: Project Definition Report (PDR وثيقة تعريف المشروع)
    {
      id: "pdr-matrix",
      page: "pdr.html",
      pdrView: "matrix",
      category: "pdr",
      categoryName: "وثيقة تعريف المشروع PDR",
      categoryIcon: "fa-diagram-project",
      categoryColor: "#2ec866",
      title: "مصفوفة الأقسام الـ 16 الرئيسية (PDR Grid)",
      desc: "استعراض الأقسام الستة عشر للمركز المتنقل مع الملاحق التشغيلية",
      keywords: ["مصفوفة", "16 قسم", "pdr", "أقسام", "matrix", "grid"]
    },
    {
      id: "pdr-detailed",
      page: "pdr.html",
      pdrView: "detailed",
      category: "pdr",
      categoryName: "وثيقة تعريف المشروع PDR",
      categoryIcon: "fa-diagram-project",
      categoryColor: "#2ec866",
      title: "غرفة العمل وتفاصيل بنود PDR والتعيين",
      desc: "تصفح بنود الأقسام الـ 16 وإسناد المسؤوليات وتحديث الحالات الحية",
      keywords: ["غرفة العمل", "بنود", "تعيين", "مسؤولين", "تفاصيل", "detailed", "items"]
    },
    {
      id: "pdr-kanban",
      page: "pdr.html",
      pdrView: "kanban",
      category: "pdr",
      categoryName: "وثيقة تعريف المشروع PDR",
      categoryIcon: "fa-diagram-project",
      categoryColor: "#2ec866",
      title: "لوحة كانبان الإنجاز التفاعلية (Kanban)",
      desc: "متابعة تدفق البنود: قيد العمل، للمراجعة، والمكتمل والمعتمد مع السحب والإفلات",
      keywords: ["كانبان", "kanban", "لوحة", "متابعة", "سحب وإفلات", "إنجاز"]
    },
    {
      id: "pdr-charts",
      page: "pdr.html",
      pdrView: "charts",
      category: "pdr",
      categoryName: "وثيقة تعريف المشروع PDR",
      categoryIcon: "fa-diagram-project",
      categoryColor: "#2ec866",
      title: "التحليلات والمخططات الاستراتيجية (SWOT & KPIs)",
      desc: "مصفوفة نقاط القوة والضعف والفرص والمخاطر ومؤشرات الأداء الرئيسية",
      keywords: ["تحليلات", "مخططات", "swot", "kpi", "مؤشرات", "رسوم بيانية", "charts"]
    },
    {
      id: "pdr-report",
      page: "pdr.html",
      pdrView: "report",
      category: "pdr",
      categoryName: "وثيقة تعريف المشروع PDR",
      categoryIcon: "fa-diagram-project",
      categoryColor: "#2ec866",
      title: "التقرير التنفيذي الشامل للطباعة والتصدير",
      desc: "تقرير متكامل بصيغة موجهة للطباعة والعرض على أصحاب المصلحة واللجان",
      keywords: ["تقرير تنفيذي", "طباعة", "تصدير", "بي دي اف", "report", "executive"]
    },
    {
      id: "pdr-word-export",
      page: "pdr.html",
      pdrView: "report",
      category: "pdr",
      categoryName: "وثيقة تعريف المشروع PDR",
      categoryIcon: "fa-file-word",
      categoryColor: "#2563eb",
      title: "تصدير وثيقة PDR كملف Word منسق (.doc) 📄✨",
      desc: "تحميل الوثيقة الكاملة بجميع أقسامها الـ 17 وبنودها ومخرجاتها بصيغة مايكروسوفت وورد",
      keywords: ["word", "وورد", "تصدير", "doc", "docx", "تحميل", "تقرير وورد", "export"]
    },

    
    // 📋 Section 3.5: Notes Kanban Board (لوحة ملاحظات وتدقيق المنصة)
    {
      id: "notes-kanban-board",
      page: "notes-kanban.html",
      category: "notes",
      categoryName: "ملاحظات وتدقيق المنصة",
      categoryIcon: "fa-clipboard-check",
      categoryColor: "#00ebd4",
      title: "لوحة كانبان لملاحظات وتدقيق جودة المنصة 📝",
      desc: "رصد وتتبع الملاحظات والمقترحات والتدقيق الفني والتاريخي لفرق العمل عبر 5 مراحل",
      keywords: ["ملاحظات", "تدقيق", "كانبان", "مقترحات", "جودة", "notes", "feedback", "kanban"]
    },

    // 👑 Section 4: Team Administration (لوحة تحكم الفريق)
    {
      id: "admin-users-mgmt",
      page: "team-admin.html",
      category: "admin",
      categoryName: "إدارة الصلاحيات والحوكمة",
      categoryIcon: "fa-shield-halved",
      categoryColor: "#cc6e55",
      title: "لوحة الإدارة المركزية للأعضاء والصلاحيات 👑",
      desc: "إضافة أعضاء جدد، تعيين الأدوار (مدير/محرر/مستعرض)، وتعديل كلمات المرور",
      keywords: ["إدارة الفريق", "صلاحيات", "أدمن", "حسابات", "أعضاء", "admin", "rbac"]
    },

    // 📊 Section 5: Executive Pitch Deck & PDF Generator
    {
      id: "exec-pitch-deck",
      action: "executive_generator",
      category: "executive",
      categoryName: "العروض التنفيذية والـ PDF",
      categoryIcon: "fa-file-invoice-dollar",
      categoryColor: "#dfb15b",
      title: "المولد الفوري للعروض التنفيذية و PDF (Pitch Deck Generator) 📊✨",
      desc: "توليد ملفات استثمارية 16:9 ووثائق A4 رسمية جاهزة للتصدير كـ PDF والعرض على أصحاب المعالي والمستثمرين",
      keywords: ["عرض تقديمي", "استثمار", "pitch deck", "pdf", "تقرير تنفيذي", "تصدير", "مجلس إدارة", "رعايات", "وزارة", "executive", "deck", "مولد"]
    }
  ];

  class PlatformNavigator {
    constructor() {
      this.directory = PLATFORM_DIRECTORY;
      this.isOpen = false;
      this.activeCategoryFilter = "all";
      this.searchQuery = "";
      this.currentPage = this.detectCurrentPage();
    }

    detectCurrentPage() {
      const path = window.location.pathname.toLowerCase();
      if (path.includes("museum-plan")) return "museum-plan.html";
      if (path.includes("pdr")) return "pdr.html";
      if (path.includes("notes-kanban")) return "notes-kanban.html";
      if (path.includes("team-admin")) return "team-admin.html";
      return "index.html";
    }

    init() {
      this.injectModalHtml();
      this.injectFloatingDockHtml();
      this.bindEvents();
      this.handleDeepLinks();
      this.renderDirectory();
    }

    injectModalHtml() {
      if (document.getElementById("omni-navigator-modal")) return;

      const modalHtml = `
        <div id="omni-navigator-modal" class="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl hidden items-center justify-center p-4 transition-all duration-300 animate-fadeIn">
          <div class="relative w-full max-w-4xl bg-[#090c17] border border-gold/40 rounded-3xl shadow-2xl shadow-gold/15 flex flex-col max-h-[90vh] overflow-hidden">
            
            <!-- Header Bar -->
            <div class="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-black/50">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold text-xl shadow-lg shadow-gold/10">
                  <i class="fa-solid fa-feather-pointed"></i>
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <h3 class="text-base sm:text-lg font-black bg-gradient-to-r from-white via-gold to-gold-dark bg-clip-text text-fill-transparent">
                      سِـرَاج الأَحْـسَـاء — دليل المنصة والبحث السريع
                    </h3>
                    <span class="px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 text-[10px] font-black hidden sm:inline">
                      Quick Navigator ⚡
                    </span>
                  </div>
                  <span class="text-xs text-gray-400">
                    تنقل فوري وسلس بين كافة أركان ومحاور سراج الأحساء والمتحف ووثيقة PDR
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-gray-400 font-mono">
                  <span>ESC للخروج</span>
                </div>
                <button id="btn-close-omni-navigator" class="w-9 h-9 rounded-full bg-white/5 hover:bg-clay text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer" title="إغلاق">
                  <i class="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>

            <!-- Live Search Box -->
            <div class="p-4 sm:p-5 border-b border-white/10 bg-black/30">
              <div class="relative">
                <i class="fa-solid fa-magnifying-glass absolute right-4 top-1/2 -translate-y-1/2 text-gold text-sm pointer-events-none"></i>
                <input 
                  type="text" 
                  id="omni-search-input" 
                  placeholder="ابحث عن أي قسم، محطة حسية، هولوجرام، مقتنى، قرار، أو مصفوفة PDR..." 
                  class="w-full bg-white/5 border border-white/15 focus:border-gold rounded-2xl pr-11 pl-10 py-3 text-xs sm:text-sm text-white placeholder:text-gray-500 outline-none transition-all shadow-inner"
                  autocomplete="off"
                />
                <button id="btn-clear-omni-search" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs hidden cursor-pointer">
                  <i class="fa-solid fa-circle-xmark"></i>
                </button>
              </div>

              <!-- Quick Filter Chips -->
              <div class="flex items-center gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar text-xs">
                <button class="omni-filter-chip active px-3.5 py-1.5 rounded-xl border border-gold bg-gold/15 text-gold font-bold transition-all shrink-0 cursor-pointer" data-filter="all">
                  <i class="fa-solid fa-border-all ml-1.5"></i>
                  <span>كافة الأقسام (الكل)</span>
                </button>
                <button class="omni-filter-chip px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white font-bold transition-all shrink-0 cursor-pointer" data-filter="simulator">
                  <i class="fa-solid fa-clapperboard text-gold ml-1.5"></i>
                  <span>الستوري بورد والتجربة 🎬</span>
                </button>
                <button class="omni-filter-chip px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white font-bold transition-all shrink-0 cursor-pointer" data-filter="museum">
                  <i class="fa-solid fa-landmark-dome text-gold ml-1.5"></i>
                  <span>دراسة وتصميم المتحف</span>
                </button>
                <button class="omni-filter-chip px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white font-bold transition-all shrink-0 cursor-pointer" data-filter="pdr">
                  <i class="fa-solid fa-diagram-project text-laser ml-1.5"></i>
                  <span>وثيقة PDR وغرفة الإنجاز</span>
                </button>
                <button class="omni-filter-chip px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white font-bold transition-all shrink-0 cursor-pointer" data-filter="admin">
                  <i class="fa-solid fa-users-gear text-clay ml-1.5"></i>
                  <span>الفريق والصلاحيات 👑</span>
                </button>
              </div>
            </div>

            <!-- Results Grid Container -->
            <div id="omni-results-container" class="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[55vh] scroll-smooth">
              <!-- Rendered Dynamically -->
            </div>

            <!-- Footer Stats & Hint -->
            <div class="p-4 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-palm animate-pulse"></span>
                <span>المنصة متزامنة بالكامل وتتيح القفز المباشر لكافة الأقسام والمحاور</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="font-mono text-gold font-bold" id="omni-matches-count">-- نتيجة</span>
                <span>•</span>
                <span class="text-gray-400">اختصار الفتح: <strong class="text-white font-mono">Ctrl + K</strong></span>
              </div>
            </div>

          </div>
        </div>
      `;

      document.body.insertAdjacentHTML("beforeend", modalHtml);
    }

    injectFloatingDockHtml() {
      if (document.getElementById("platform-floating-dock")) return;

      const isSim = this.currentPage === "index.html";
      const isMuseum = this.currentPage === "museum-plan.html";
      const isPdr = this.currentPage === "pdr.html";
      const isNotes = this.currentPage === "notes-kanban.html";
      const isAdmin = this.currentPage === "team-admin.html";

      const dockHtml = `
        <div id="platform-floating-dock" class="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-xl border border-gold/30 rounded-full px-4 py-2.5 shadow-2xl shadow-gold/15 flex items-center gap-2 sm:gap-3 transition-all duration-300 hover:scale-[1.02] hover:border-gold/60">
          
          <!-- Quick Jump Hub Trigger -->
          <button id="dock-btn-navigator" class="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-gold to-gold-dark hover:from-white hover:to-gold text-black font-black text-xs flex items-center gap-1.5 shadow-md shadow-gold/20 transition-all cursor-pointer" title="فتح دليل المنصة الشامل (Ctrl+K)">
            <i class="fa-solid fa-bolt"></i>
            <span class="hidden sm:inline">دليل المنصة ⚡</span>
          </button>

          <div class="w-[1px] h-5 bg-white/15 mx-0.5"></div>

          <!-- 1. Storyboard Link -->
          <a href="index.html" class="dock-link px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${isSim ? 'bg-gold/20 text-gold border border-gold/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}" title="الستوري بورد والتجربة">
            <i class="fa-solid fa-clapperboard"></i>
            <span class="hidden md:inline">الستوري بورد</span>
          </a>

          <!-- 2. Master Plan Link -->
          <a href="museum-plan.html" class="dock-link px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${isMuseum ? 'bg-gold/20 text-gold border border-gold/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}" title="دراسة المتحف">
            <i class="fa-solid fa-landmark-dome"></i>
            <span class="hidden md:inline">المتحف</span>
          </a>

          <!-- 3. PDR Link -->
          <a href="pdr.html" class="dock-link px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${isPdr ? 'bg-gold/20 text-gold border border-gold/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}" title="وثيقة PDR وغرفة الإنجاز">
            <i class="fa-solid fa-diagram-project"></i>
            <span class="hidden md:inline">وثيقة PDR</span>
          </a>

          
          <!-- 3.5. Notes Kanban Link -->
          <a href="notes-kanban.html" class="dock-link px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${isNotes ? 'bg-gold/20 text-gold border border-gold/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}" title="لوحة ملاحظات وتدقيق المنصة">
            <i class="fa-solid fa-clipboard-check"></i>
            <span class="hidden md:inline">الملاحظات 📋</span>
          </a>

          <!-- Executive Pitch Deck & PDF Generator Trigger -->
          <button onclick="window.App && window.App.openExecutiveGenerator ? window.App.openExecutiveGenerator() : null" class="btn-open-executive-generator px-3 py-1.5 rounded-full text-xs font-black bg-gold/15 text-gold border border-gold/40 hover:bg-gold hover:text-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-gold/10" title="المولد الفوري للتقارير والعروض التنفيذية و PDF">
            <i class="fa-solid fa-file-invoice-dollar"></i>
            <span class="hidden lg:inline">العرض التنفيذي 📊</span>
          </button>

          <!-- 4. Admin Link (Only for Authorized Admins) -->
          ${(window.App && window.App.authGuard && window.App.authGuard.isAdmin()) ? `
            <a href="team-admin.html" class="dock-link px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${isAdmin ? 'bg-gold/20 text-gold border border-gold/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}" title="إدارة الفريق والصلاحيات">
              <i class="fa-solid fa-users-gear"></i>
              <span class="hidden md:inline">الفريق 👑</span>
            </a>
          ` : ''}

          <div class="w-[1px] h-5 bg-white/15 mx-0.5 hidden sm:block"></div>

          <!-- Scroll to top button -->
          <button id="dock-btn-scroll-top" class="w-7 h-7 rounded-full bg-white/5 hover:bg-gold hover:text-black text-gray-400 flex items-center justify-center text-xs transition-all cursor-pointer hidden sm:flex" title="العودة لأعلى الصفحة">
            <i class="fa-solid fa-arrow-up"></i>
          </button>
        </div>
      `;

      document.body.insertAdjacentHTML("beforeend", dockHtml);
    }

    bindEvents() {
      // 1. Open / Close Modal
      const modal = document.getElementById("omni-navigator-modal");
      const btnClose = document.getElementById("btn-close-omni-navigator");
      const dockBtn = document.getElementById("dock-btn-navigator");

      if (dockBtn) {
        dockBtn.addEventListener("click", () => this.open());
      }

      if (btnClose) {
        btnClose.addEventListener("click", () => this.close());
      }

      if (modal) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) this.close();
        });
      }

      // 2. Global Hotkey: Ctrl+K / Cmd+K
      document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          this.toggle();
        } else if (e.key === "Escape" && this.isOpen) {
          this.close();
        }
      });

      // 3. Search Input
      const searchInput = document.getElementById("omni-search-input");
      const btnClear = document.getElementById("btn-clear-omni-search");

      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          this.searchQuery = e.target.value.trim().toLowerCase();
          if (btnClear) {
            if (this.searchQuery.length > 0) btnClear.classList.remove("hidden");
            else btnClear.classList.add("hidden");
          }
          this.renderDirectory();
        });
      }

      if (btnClear) {
        btnClear.addEventListener("click", () => {
          if (searchInput) {
            searchInput.value = "";
            this.searchQuery = "";
            btnClear.classList.add("hidden");
            searchInput.focus();
            this.renderDirectory();
          }
        });
      }

      // 4. Category Filter Chips
      document.querySelectorAll(".omni-filter-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          document.querySelectorAll(".omni-filter-chip").forEach(c => {
            c.classList.remove("active", "border-gold", "bg-gold/15", "text-gold");
            c.classList.add("border-white/10", "bg-white/5", "text-gray-300");
          });
          chip.classList.add("active", "border-gold", "bg-gold/15", "text-gold");
          chip.classList.remove("border-white/10", "bg-white/5", "text-gray-300");

          this.activeCategoryFilter = chip.getAttribute("data-filter") || "all";
          this.renderDirectory();
        });
      });

      // 5. Scroll to Top
      const btnTop = document.getElementById("dock-btn-scroll-top");
      if (btnTop) {
        btnTop.addEventListener("click", () => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }

      // 6. Bind any external header buttons marked with class .btn-open-omni-navigator
      document.querySelectorAll(".btn-open-omni-navigator").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          this.open();
        });
      });
    }

    open() {
      const modal = document.getElementById("omni-navigator-modal");
      if (!modal) return;
      this.isOpen = true;
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      const searchInput = document.getElementById("omni-search-input");
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 80);
      }
      this.renderDirectory();
    }

    close() {
      const modal = document.getElementById("omni-navigator-modal");
      if (!modal) return;
      this.isOpen = false;
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }

    toggle() {
      if (this.isOpen) this.close();
      else this.open();
    }

    renderDirectory() {
      const container = document.getElementById("omni-results-container");
      const countEl = document.getElementById("omni-matches-count");
      if (!container) return;

      let items = this.directory;

      // Filter by Category
      if (this.activeCategoryFilter !== "all") {
        items = items.filter(item => item.category === this.activeCategoryFilter);
      }

      // Filter by Search Query
      if (this.searchQuery.length > 0) {
        const q = this.searchQuery;
        items = items.filter(item => {
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.desc.toLowerCase().includes(q);
          const matchCat = item.categoryName.toLowerCase().includes(q);
          const matchKeywords = Array.isArray(item.keywords) && item.keywords.some(k => k.toLowerCase().includes(q));
          return matchTitle || matchDesc || matchCat || matchKeywords;
        });
      }

      if (countEl) {
        countEl.textContent = `${items.length} نتيجة متاحة`;
      }

      if (items.length === 0) {
        container.innerHTML = `
          <div class="text-center py-12 flex flex-col items-center gap-3">
            <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 text-2xl">
              <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <span class="text-base font-bold text-gray-300">لم يتم العثور على نتائج مطابقة لـ "${this.searchQuery}"</span>
            <span class="text-xs text-gray-500">جرب البحث بكلمات أخرى مثل: هولوجرام، مقتنيات، محطة، كانبان، ميزانية، أو قرارات</span>
          </div>
        `;
        return;
      }

      // Group items by category
      const groups = {};
      items.forEach(item => {
        if (!groups[item.categoryName]) {
          groups[item.categoryName] = {
            name: item.categoryName,
            icon: item.categoryIcon,
            color: item.categoryColor,
            items: []
          };
        }
        groups[item.categoryName].items.push(item);
      });

      let html = "";
      Object.values(groups).forEach(grp => {
        html += `
          <div class="flex flex-col gap-2.5">
            <div class="flex items-center gap-2 text-xs font-black text-gray-400 border-b border-white/5 pb-1 px-1">
              <i class="fa-solid ${grp.icon}" style="color: ${grp.color};"></i>
              <span class="text-white">${grp.name}</span>
              <span class="text-[10px] text-gray-500">(${grp.items.length})</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        `;

        grp.items.forEach(item => {
          const isCurrentTarget = this.isCurrentDestination(item);
          html += `
            <div 
              class="omni-nav-item p-3.5 rounded-2xl bg-white/[0.03] border ${isCurrentTarget ? 'border-gold/50 bg-gold/5' : 'border-white/8 hover:border-gold/40 hover:bg-white/[0.06]'} transition-all cursor-pointer flex flex-col justify-between gap-2 group"
              onclick="App.platformNavigator.jumpTo('${item.id}')"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-gold group-hover:bg-gold group-hover:text-black transition-all">
                    <i class="fa-solid fa-arrow-left"></i>
                  </span>
                  <strong class="text-xs sm:text-sm font-black text-white group-hover:text-gold transition-colors line-clamp-1">
                    ${item.title}
                  </strong>
                </div>
                ${isCurrentTarget ? '<span class="px-2 py-0.5 rounded text-[9px] font-black bg-gold/20 text-gold border border-gold/40 shrink-0">أنت هنا</span>' : ''}
              </div>

              <p class="text-[11px] text-gray-400 line-clamp-2 leading-relaxed pr-8">
                ${item.desc}
              </p>

              <div class="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-white/5 pr-8">
                <span class="font-mono">${item.page}</span>
                <span class="text-gold font-semibold group-hover:underline flex items-center gap-1">
                  <span>انتقال سريع</span>
                  <i class="fa-solid fa-chevron-left text-[8px]"></i>
                </span>
              </div>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    }

    isCurrentDestination(item) {
      if (this.currentPage !== item.page) return false;
      if (item.planTab && window.App && window.App.planModel) {
        return window.App.planModel.activeTab === item.planTab;
      }
      if (item.pdrView && window.App && window.App.pdrModel) {
        return window.App.pdrModel.activeView === item.pdrView;
      }
      if (item.station && window.App && window.App.model) {
        return window.App.model.currentStation === item.station;
      }
      return false;
    }

    jumpTo(itemId) {
      const item = this.directory.find(i => i.id === itemId);
      if (!item) return;

      this.close();

      if (item.action === "executive_generator") {
        if (window.App && window.App.openExecutiveGenerator) {
          window.App.openExecutiveGenerator();
        }
        return;
      }

      // Check if we are already on the same page
      if (this.currentPage === item.page) {
        if (item.planTab && window.App && window.App.planController) {
          window.App.planController.switchTab(item.planTab);
          window.location.hash = item.planTab;
          return;
        }

        if (item.pdrView && window.App && window.App.pdrController) {
          window.App.pdrController.switchView(item.pdrView);
          window.location.hash = item.pdrView;
          return;
        }

        if (item.station && window.App && window.App.controller) {
          window.App.controller.switchStation(item.station);
          const simEl = document.getElementById("section-simulator");
          if (simEl) simEl.scrollIntoView({ behavior: "smooth" });
          return;
        }

        if (item.hash) {
          const targetEl = document.querySelector(item.hash);
          if (targetEl) targetEl.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        // Navigate to the target page with query params or hash
        let url = item.page;
        if (item.planTab) {
          url += `#tab=${item.planTab}`;
        } else if (item.pdrView) {
          url += `#view=${item.pdrView}`;
        } else if (item.station) {
          url += `?st=${item.station}#section-simulator`;
        } else if (item.hash) {
          url += item.hash;
        }
        window.location.href = url;
      }
    }

    handleDeepLinks() {
      // 1. Check Query Params (e.g. ?st=3)
      const urlParams = new URLSearchParams(window.location.search);
      const stParam = urlParams.get("st");
      if (stParam && this.currentPage === "index.html") {
        const stNum = parseInt(stParam, 10);
        if (stNum >= 1 && stNum <= 7) {
          setTimeout(() => {
            if (window.App && window.App.controller) {
              window.App.controller.switchStation(stNum);
            }
          }, 300);
        }
      }

      // 2. Check Hash (e.g. #tab=hologram or #view=kanban)
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        if (hash.startsWith("tab=") && this.currentPage === "museum-plan.html") {
          const tabName = hash.replace("tab=", "");
          setTimeout(() => {
            if (window.App && window.App.planController) {
              window.App.planController.switchTab(tabName);
            }
          }, 300);
        } else if (hash.startsWith("view=") && this.currentPage === "pdr.html") {
          const viewName = hash.replace("view=", "");
          setTimeout(() => {
            if (window.App && window.App.pdrController) {
              window.App.pdrController.switchView(viewName);
            }
          }, 300);
        } else if (this.currentPage === "museum-plan.html" && ["identity","artifacts","schools","hologram","vr","location","finance","store_refs","team","tasks","decisions","export_tools","users"].includes(hash)) {
          setTimeout(() => {
            if (window.App && window.App.planController) {
              window.App.planController.switchTab(hash);
            }
          }, 300);
        } else if (this.currentPage === "pdr.html" && ["matrix","detailed","kanban","charts","report"].includes(hash)) {
          setTimeout(() => {
            if (window.App && window.App.pdrController) {
              window.App.pdrController.switchView(hash);
            }
          }, 300);
        }
      }
    }
  }

  /* ==========================================================
     SMART HEADER AUTO-HIDE & MANUAL VISIBILITY CONTROLLER
     إمكانية إخفاء وإظهار القائمة العلوية تلقائياً أو يدوياً
     ========================================================== */
  class HeaderNavVisibilityManager {
    constructor() {
      this.header = document.querySelector('header');
      this.lastScrollY = window.scrollY || 0;
      this.isManuallyHidden = false;
      this.isScrolling = false;
    }

    init() {
      if (!this.header) return;
      this.header.classList.add('transition-transform', 'duration-300', 'ease-in-out');
      this.injectTogglePill();
      this.bindEvents();
    }

    injectTogglePill() {
      if (document.getElementById('btn-header-visibility-toggle')) return;

      const btn = document.createElement('button');
      btn.id = 'btn-header-visibility-toggle';
      btn.className = 'fixed top-2 left-1/2 -translate-x-1/2 z-50 py-1.5 px-4 rounded-full bg-black/90 border border-gold/50 text-gold text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 cursor-pointer transition-all duration-300 hidden opacity-95 hover:opacity-100 hover:scale-105';
      btn.innerHTML = `<i class="fa-solid fa-chevron-down text-xs text-laser" id="header-toggle-icon"></i><span id="header-toggle-text">إظهار القائمة العلوية</span>`;
      btn.title = "إظهار القائمة العلوية";

      btn.addEventListener('click', () => {
        this.isManuallyHidden = !this.isManuallyHidden;
        this.updateHeaderState(this.isManuallyHidden);
      });

      document.body.appendChild(btn);
    }

    updateHeaderState(hidden) {
      if (!this.header) return;
      const icon = document.getElementById('header-toggle-icon');
      const text = document.getElementById('header-toggle-text');
      const btn = document.getElementById('btn-header-visibility-toggle');

      if (hidden) {
        this.header.classList.add('-translate-y-full', 'pointer-events-none');
        if (btn) {
          btn.classList.remove('hidden');
          btn.classList.add('flex');
        }
        if (icon) icon.className = 'fa-solid fa-chevron-down text-xs text-laser';
        if (text) text.textContent = 'إظهار القائمة العلوية';
      } else {
        this.header.classList.remove('-translate-y-full', 'pointer-events-none');
        if (btn) {
          btn.classList.add('hidden');
          btn.classList.remove('flex');
        }
        if (icon) icon.className = 'fa-solid fa-chevron-up text-xs text-gold';
        if (text) text.textContent = 'إخفاء القائمة';
      }
    }

    bindEvents() {
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('scroll', () => {
          if (this.isManuallyHidden) return;
          const currentY = window.scrollY || 0;

          if (currentY > 90 && currentY > this.lastScrollY + 12) {
            // Scrolling down -> hide header
            this.updateHeaderState(true);
          } else if (currentY < this.lastScrollY - 8 || currentY <= 30) {
            // Scrolling up or near top -> show header
            this.updateHeaderState(false);
          }
          this.lastScrollY = currentY;
        }, { passive: true });
      }
    }
  }

  // Initialize on DOM Ready
  window.App.PlatformNavigator = PlatformNavigator;
  window.App.platformNavigator = new PlatformNavigator();
  window.App.headerVisibility = new HeaderNavVisibilityManager();

  const bootNav = () => {
    window.App.platformNavigator.init();
    window.App.headerVisibility.init();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootNav);
  } else {
    bootNav();
  }
})();
