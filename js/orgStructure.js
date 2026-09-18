/* ==========================================================
   SERAJ AL-AHSA - ORGANIZATIONAL STRUCTURE CONTROLLER & VIEW
   الهيكل التنظيمي المعتمد لمشروع "سراج الأحساء" (مرحلة التنفيذ والتشغيل)
   مرن، قابل للتعديل الفوري، ومتزامن سحابياً
   ========================================================== */

window.App = window.App || {};

(function() {
  const DEFAULT_BASELINE = {
    updatedAt: "2026-09-18T18:30:00.000Z",
    strategicNote: "هذه الهيكلة الإدارية مخصصة حصراً لـ مرحلة تنفيذ المشروع، وتُعتبر مهامها ولجانها منتهية بانتهاء اكتمال التنفيذ. بعد ذلك، تنتقل الإدارة إلى هيكل تنظيمي جديد يُعنى بالتشغيل والمتابعة، وتكون رئاسته ومرجعيته المباشرة تحت الجهة المشرفة العليا للمشروع وهي (مجلس وقف العلم).",
    tiers: [
      {
        id: "tier_governance",
        number: 1,
        name: "أولاً: النطاق الإشرافي والتشريعي (مستوى الحوكمة)",
        badge: "سلطة الحوكمة والاعتماد",
        color: "gold",
        icon: "fa-landmark",
        description: "المستوى الأعلى للمساءلة والتشريع والاعتمادات الاستراتيجية والمالية.",
        roles: [
          {
            id: "role_gov_waqf",
            title: "الجهة المشرفة العليا",
            holder: "مجلس وقف العلم",
            tierId: "tier_governance",
            subgroup: "",
            status: "active",
            statusLabel: "جهة عليا مشرفة",
            description: "تتولى مراجعة العناوين الرئيسية للمشروع، وإصدار الاعتماد المبدئي للرؤية، والموافقة على الميزانية التقديرية العامة، وتؤول إليها إدارة المشروع بالكامل بعد اكتمال التنفيذ.",
            priority: "critical",
            icon: "fa-building-columns"
          },
          {
            id: "role_gov_board",
            title: "مجلس الإدارة المستقل",
            holder: "مجلس الإدارة",
            tierId: "tier_governance",
            subgroup: "",
            status: "active",
            statusLabel: "سلطة تشريعية",
            description: "يمثل السلطة التشريعية والاعتماد النهائي للمشروع في مرحلة التنفيذ. يختص باعتماد سقف الصلاحيات المالية للإدارة التنفيذية، وتوقيع العقود، واعتماد القرارات الاستراتيجية.",
            priority: "critical",
            icon: "fa-scale-balanced"
          }
        ]
      },
      {
        id: "tier_leadership",
        number: 2,
        name: "ثانياً: النطاق القيادي والتنفيذي (مرحلة التنفيذ)",
        badge: "القيادة والتنفيذ المباشر",
        color: "palm",
        icon: "fa-sitemap",
        description: "القيادة الميدانية المباشرة والإدارة التنفيذية والتقنية للمشروع.",
        roles: [
          {
            id: "role_lead_project_head",
            title: "رئيس المشروع والإدارة التقنية",
            holder: "عبدالإله العصفور",
            username: "admin",
            tierId: "tier_leadership",
            subgroup: "",
            status: "active",
            statusLabel: "معتمد",
            description: "يتولى القيادة العامة لمرحلة التنفيذ، وإدارة وتطوير الجوانب التقنية والتطبيقات، والإشراف الاستراتيجي المشترك على صناعة المحتوى.",
            priority: "critical",
            icon: "fa-laptop-code"
          },
          {
            id: "role_lead_ceo",
            title: "المدير التنفيذي",
            holder: "ثامر الجعفري",
            username: "Thamer",
            tierId: "tier_leadership",
            subgroup: "",
            status: "active",
            statusLabel: "معتمد",
            description: "يتولى إدارة التنفيذ التشغيلي، صياغة العقود لرفعها لمجلس الإدارة، إصدار أوامر الصرف المالي، والإشراف الاستراتيجي المشترك على الشركة الخارجية لصناعة المحتوى.",
            priority: "critical",
            icon: "fa-user-tie"
          }
        ]
      },
      {
        id: "tier_specialized_ops",
        number: 3,
        name: "ثالثاً: النطاق التشغيلي المتخصص (مرحلة التنفيذ والمتابعة)",
        badge: "التشغيل التخصصي والمحتوى",
        color: "laser",
        icon: "fa-gears",
        description: "الإدارات التخصصية، التدقيق العلمي، العمليات المالية، الاتصال وصناعة المحتوى.",
        roles: [
          {
            id: "role_ops_science_head",
            title: "رئيس الجهة العلمية",
            holder: "شاغر",
            tierId: "tier_specialized_ops",
            subgroup: "الجهة العلمية",
            status: "vacant",
            statusLabel: "شاغر",
            description: "يتولى القيادة والاعتماد المرجعي الدقيق لكافة مخرجات المشروع، وضمان جودة المحتوى العلمي.",
            priority: "high",
            icon: "fa-book-quran"
          },
          {
            id: "role_ops_science_advisor",
            title: "المستشار العلمي",
            holder: "أحمد الدوغان",
            username: "Ahmed",
            tierId: "tier_specialized_ops",
            subgroup: "الجهة العلمية",
            status: "active",
            statusLabel: "معتمد",
            description: "يقدم الاستشارات والتوجيه للمفاصل العلمية الرئيسية للمشروع.",
            priority: "high",
            icon: "fa-graduation-cap"
          },
          {
            id: "role_ops_finance",
            title: "إدارة المالية والمتابعة",
            holder: "أنس الدوغان",
            username: "Anas",
            tierId: "tier_specialized_ops",
            subgroup: "",
            status: "active",
            statusLabel: "معتمد",
            description: "تختص بالمراقبة، تقييد العمليات المحاسبية، ضبط الإيرادات والمصروفات، وتنفيذ الحوالات المالية (بناءً على أوامر الصرف).",
            priority: "high",
            icon: "fa-coins"
          },
          {
            id: "role_ops_media",
            title: "الإدارة الإعلامية والشراكات",
            holder: "السيد عبدالرحمن",
            username: "abdulrahman",
            tierId: "tier_specialized_ops",
            subgroup: "",
            status: "active",
            statusLabel: "معتمد",
            description: "يتولى التحدث الرسمي باسم المشروع، عرضه على الجهات، وإدارة العلاقات العامة.",
            priority: "high",
            icon: "fa-bullhorn"
          },
          {
            id: "role_ops_sponsors",
            title: "إدارة علاقات الداعمين والمشاركين",
            holder: "شاغر",
            tierId: "tier_specialized_ops",
            subgroup: "",
            status: "vacant",
            statusLabel: "شاغر",
            description: "تتولى المتابعة اليومية مع الرعاة والداعمين، وإدارة تجربة المشاركين في المشروع.",
            priority: "medium",
            icon: "fa-handshake-angle"
          },
          {
            id: "role_ops_coordination",
            title: "إدارة التنسيق والتواصل",
            holder: "السيد أسامة",
            username: "Osamah",
            tierId: "tier_specialized_ops",
            subgroup: "",
            status: "active",
            statusLabel: "معتمد",
            description: "تتولى تنظيم الاجتماعات، التنسيق الداخلي بين الإدارات، وجدولة الأعمال.",
            priority: "medium",
            icon: "fa-calendar-check"
          },
          {
            id: "role_ops_content_company",
            title: "صناعة المحتوى",
            holder: "شركة خارجية",
            tierId: "tier_specialized_ops",
            subgroup: "",
            status: "external",
            statusLabel: "شركة خارجية",
            description: "تتولى الإنتاج الفني وتصميم المحتوى بناءً على اعتمادات (الرئيس، المدير التنفيذي، والجهة العلمية).",
            priority: "high",
            icon: "fa-clapperboard"
          }
        ]
      },
      {
        id: "tier_post_execution",
        number: 4,
        name: "رابعاً: نطاق التشغيل والمتابعة (مرحلة ما بعد اكتمال التنفيذ)",
        badge: "التشغيل والاستدامة الدائمة",
        color: "clay",
        icon: "fa-clock-rotate-left",
        supervisorNote: "تنتقل مرجعية هذه المرحلة مباشرة تحت إشراف (مجلس وقف العلم)",
        description: "مرحلة الانتقال المؤسسي بعد اكتمال التنفيذ وتتولى استدامة المعرض والتشغيل والصيانة.",
        roles: [
          {
            id: "role_post_leadership",
            title: "رئاسة المشروع بعد اكتمال تنفيذه",
            holder: "شاغر",
            tierId: "tier_post_execution",
            subgroup: "",
            status: "vacant",
            statusLabel: "شاغر",
            description: "القيادة التشغيلية والمؤسسية للمشروع تحت الإشراف المباشر لمجلس وقف العلم بعد انتهاء مرحلة التنفيذ.",
            priority: "high",
            icon: "fa-user-clock"
          },
          {
            id: "role_post_maintenance",
            title: "إدارة التشغيل والصيانة بعد اكتمال المشروع",
            holder: "شاغر",
            tierId: "tier_post_execution",
            subgroup: "",
            status: "vacant",
            statusLabel: "شاغر",
            description: "إدارة التشغيل الميداني الدوري، الصيانة الفنية للتقنيات والأنظمة الهندسية ومرافق الزوار المستمرة.",
            priority: "medium",
            icon: "fa-wrench"
          }
        ]
      }
    ]
  };

  class OrgStructureManager {
    constructor() {
      this.storageKey = "seraj_org_structure_v2";
      this.data = JSON.parse(JSON.stringify(DEFAULT_BASELINE));
      this.activeTierFilter = "all";
      this.searchQuery = "";
      this.viewMode = "cards"; // 'cards' or 'tree'
      this.isLoaded = false;
      this.editingRole = null;
      this.initPromise = null;
    }

    async init() {
      if (this.initPromise) return this.initPromise;
      this.initPromise = this._loadData();
      return this.initPromise;
    }

    async _loadData() {
      // 1. Try Cache First
      try {
        const cached = localStorage.getItem(this.storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.tiers) && parsed.tiers.length > 0) {
            this.data = parsed;
          }
        }
      } catch (_) {}

      // 2. Try Server API
      try {
        const res = await fetch("/api/org-structure");
        if (res.ok) {
          const json = await res.json();
          if (json.status === "success" && json.data && Array.isArray(json.data.tiers)) {
            this.data = json.data;
            try {
              localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            } catch (_) {}
          }
        }
      } catch (err) {
        console.warn("[OrgStructure] Running in offline/cache mode:", err.message);
      }

      this.isLoaded = true;
      return this.data;
    }

    async save() {
      this.data.updatedAt = new Date().toISOString();
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      } catch (_) {}

      // Send to server
      try {
        const token = (window.App && window.App.authGuard && window.App.authGuard.getUser()) ? window.App.authGuard.getUser().token : "";
        const res = await fetch("/api/org-structure", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify(this.data)
        });
        if (res.ok) {
          this.showToast("تم حفظ وتحديث الهيكل التنظيمي بنجاح 💾", "success");
        }
      } catch (e) {
        this.showToast("تم الحفظ محلياً في المتصفح ⚡", "info");
      }
    }

    getStats() {
      let total = 0;
      let active = 0;
      let vacant = 0;
      let external = 0;

      this.data.tiers.forEach(tier => {
        (tier.roles || []).forEach(r => {
          total++;
          if (r.status === "vacant" || (r.holder && r.holder.includes("شاغر"))) {
            vacant++;
          } else if (r.status === "external" || (r.holder && r.holder.includes("خارجية"))) {
            external++;
          } else {
            active++;
          }
        });
      });

      return { total, active, vacant, external };
    }

    getAllRoles() {
      const list = [];
      this.data.tiers.forEach(t => {
        (t.roles || []).forEach(r => {
          list.push({ ...r, tierName: t.name, tierColor: t.color });
        });
      });
      return list;
    }

    findRole(roleId) {
      for (const tier of this.data.tiers) {
        const role = (tier.roles || []).find(r => r.id === roleId);
        if (role) return { role, tier };
      }
      return null;
    }

    canEdit() {
      if (!window.App || !window.App.authGuard) return true;
      const user = window.App.authGuard.getUser();
      if (!user) return false;
      return user.role === "admin" || user.role === "editor";
    }

    isAdmin() {
      if (!window.App || !window.App.authGuard) return true;
      return window.App.authGuard.isAdmin();
    }

    // Live Render inside any container
    render(container, options = {}) {
      if (!container) return;
      if (typeof container === "string") {
        container = document.getElementById(container);
      }
      if (!container) return;

      const stats = this.getStats();
      const canEdit = this.canEdit();
      const compact = options.compact || false;

      let html = `
        <div class="org-structure-container flex flex-col gap-6 animate-fadeIn" id="org-structure-root">
          
          <!-- Top Header & Actions Bar -->
          <div class="p-6 rounded-3xl bg-gradient-to-r from-gold/15 via-black/80 to-palm/15 border border-gold/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div class="flex flex-col gap-2 max-w-2xl">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/40 text-xs font-black flex items-center gap-1.5">
                  <i class="fa-solid fa-sitemap"></i>
                  <span>الهيكل الإداري المعتمد 🏛️</span>
                </span>
                <span class="text-xs text-gray-400">سراج الأحساء • مرحلة التنفيذ والتشغيل</span>
                ${canEdit ? `<span class="text-[10px] px-2 py-0.5 rounded bg-palm/15 text-palm border border-palm/30">وضع التحرير مفعّل ✏️</span>` : ''}
              </div>
              <h3 class="text-2xl sm:text-3xl font-black text-white">
                الهيكل التنظيمي المعتمد لمشروع «سراج الأحساء»
              </h3>
              <p class="text-xs text-gray-300 leading-relaxed">
                منظومة الحوكمة والإدارة التشغيلية والتنفيذية المعتمدة للمشروع عبر النطاقات الأربعة مع توزيع الصلاحيات والمسؤوليات والمرجعيات.
              </p>
            </div>

            <!-- Right Header Controls -->
            <div class="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-start md:justify-end">
              ${canEdit ? `
                <button onclick="window.App.OrgStructure.openRoleModal()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-white hover:to-gold text-black text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-gold/20 cursor-pointer">
                  <i class="fa-solid fa-user-plus text-sm"></i>
                  <span>إضافة منصب أو جهة جديدة</span>
                </button>
                <button onclick="window.App.OrgStructure.openStrategicNoteModal()" class="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 hover:border-gold text-gray-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer" title="تعديل الملاحظة الاستراتيجية">
                  <i class="fa-solid fa-pen-to-square text-gold"></i>
                  <span>تعديل الملاحظة</span>
                </button>
                <button onclick="window.App.OrgStructure.resetToBaseline()" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-clay text-gray-400 hover:text-clay text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer" title="إعادة الضبط للمسودة الأساسية المعتمدة">
                  <i class="fa-solid fa-rotate-left"></i>
                  <span>استعادة الأساس</span>
                </button>
              ` : `
                <div class="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 flex items-center gap-2">
                  <i class="fa-solid fa-eye text-gold"></i>
                  <span>عرض معتمد للمنظومة</span>
                </div>
              `}
              <button onclick="window.print()" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white text-gray-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer" title="طباعة الهيكل">
                <i class="fa-solid fa-print text-gray-400"></i>
                <span>طباعة</span>
              </button>
            </div>
          </div>

          <!-- Strategic Note Banner -->
          <div class="p-5 rounded-2xl bg-black/80 border-r-4 border-gold border-t border-b border-l border-gold/30 shadow-xl flex flex-col sm:flex-row items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-gold/20 text-gold border border-gold/40 flex items-center justify-center text-lg shrink-0 mt-0.5">
              <i class="fa-solid fa-compass"></i>
            </div>
            <div class="flex flex-col gap-1 flex-1">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-black text-gold flex items-center gap-2">
                  <span>ملاحظة استراتيجية معتمدة:</span>
                  <span class="text-[11px] px-2 py-0.5 rounded bg-gold/15 text-gold border border-gold/30 font-medium">مرحلة تنفيذ المشروع</span>
                </h4>
                ${canEdit ? `
                  <button onclick="window.App.OrgStructure.openStrategicNoteModal()" class="text-xs text-gray-400 hover:text-gold flex items-center gap-1 cursor-pointer">
                    <i class="fa-solid fa-pen text-[10px]"></i>
                    <span>تحرير</span>
                  </button>
                ` : ''}
              </div>
              <p id="org-strategic-note-text" class="text-xs sm:text-[13px] text-gray-200 leading-relaxed font-medium">
                ${this.data.strategicNote}
              </p>
            </div>
          </div>

          <!-- Quick Metrics Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div class="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between shadow-lg">
              <div class="flex flex-col">
                <span class="text-[11px] text-gray-400 font-semibold">إجمالي المناصب والإدارات</span>
                <strong class="text-2xl font-black text-white font-mono">${stats.total}</strong>
              </div>
              <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gold text-lg">
                <i class="fa-solid fa-network-wired"></i>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-black/60 border border-palm/30 flex items-center justify-between shadow-lg">
              <div class="flex flex-col">
                <span class="text-[11px] text-palm font-semibold">المناصب المعتمدة (مُعيّنة)</span>
                <strong class="text-2xl font-black text-palm font-mono">${stats.active}</strong>
              </div>
              <div class="w-10 h-10 rounded-xl bg-palm/15 border border-palm/30 flex items-center justify-center text-palm text-lg">
                <i class="fa-solid fa-user-check"></i>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-black/60 border border-clay/40 flex items-center justify-between shadow-lg">
              <div class="flex flex-col">
                <span class="text-[11px] text-clay font-semibold">المناصب الشاغرة (قيد التعيين)</span>
                <strong class="text-2xl font-black text-clay font-mono">${stats.vacant}</strong>
              </div>
              <div class="w-10 h-10 rounded-xl bg-clay/15 border border-clay/30 flex items-center justify-center text-clay text-lg">
                <i class="fa-solid fa-user-clock"></i>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-black/60 border border-laser/30 flex items-center justify-between shadow-lg">
              <div class="flex flex-col">
                <span class="text-[11px] text-laser font-semibold">الجهات والشركات الخارجية</span>
                <strong class="text-2xl font-black text-laser font-mono">${stats.external}</strong>
              </div>
              <div class="w-10 h-10 rounded-xl bg-laser/15 border border-laser/30 flex items-center justify-center text-laser text-lg">
                <i class="fa-solid fa-handshake"></i>
              </div>
            </div>
          </div>

          <!-- Controls, Search & Filter Bar -->
          <div class="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div class="relative flex-1 max-w-md">
              <i class="fa-solid fa-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
              <input type="text" id="org-search-input" value="${this.searchQuery}" oninput="window.App.OrgStructure.handleSearch(this.value)" placeholder="بحث بالمنصب أو الاسم أو المهام أو الإدارة..." class="w-full pr-10 pl-4 py-2.5 rounded-xl bg-black/80 border border-white/15 text-xs text-white outline-none focus:border-gold transition-all" />
            </div>

            <!-- Tier Filter Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              <button onclick="window.App.OrgStructure.setTierFilter('all')" class="org-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${this.activeTierFilter === 'all' ? 'bg-gold text-black font-black' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}">
                الكل (${stats.total})
              </button>
              <button onclick="window.App.OrgStructure.setTierFilter('tier_governance')" class="org-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${this.activeTierFilter === 'tier_governance' ? 'bg-gold text-black font-black' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}">
                ١. الحوكمة
              </button>
              <button onclick="window.App.OrgStructure.setTierFilter('tier_leadership')" class="org-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${this.activeTierFilter === 'tier_leadership' ? 'bg-palm text-black font-black' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}">
                ٢. القيادة والتنفيذ
              </button>
              <button onclick="window.App.OrgStructure.setTierFilter('tier_specialized_ops')" class="org-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${this.activeTierFilter === 'tier_specialized_ops' ? 'bg-laser text-black font-black' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}">
                ٣. التشغيل المتخصص
              </button>
              <button onclick="window.App.OrgStructure.setTierFilter('tier_post_execution')" class="org-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${this.activeTierFilter === 'tier_post_execution' ? 'bg-clay text-white font-black' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}">
                ٤. ما بعد التنفيذ
              </button>
              <button onclick="window.App.OrgStructure.setTierFilter('vacant')" class="org-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${this.activeTierFilter === 'vacant' ? 'bg-orange-500 text-black font-black' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}">
                الشواغر (${stats.vacant})
              </button>
            </div>
          </div>

          <!-- Tiers Sections Container -->
          <div class="flex flex-col gap-8">
            ${this.renderTiersHTML(canEdit)}
          </div>

        </div>
      `;

      container.innerHTML = html;
      this.bindModals();
    }

    renderTiersHTML(canEdit) {
      const q = (this.searchQuery || "").trim().toLowerCase();

      return this.data.tiers.map(tier => {
        if (this.activeTierFilter !== "all" && this.activeTierFilter !== "vacant" && this.activeTierFilter !== tier.id) {
          return "";
        }

        let roles = tier.roles || [];
        if (this.activeTierFilter === "vacant") {
          roles = roles.filter(r => r.status === "vacant" || (r.holder && r.holder.includes("شاغر")));
        }

        if (q) {
          roles = roles.filter(r => 
            (r.title && r.title.toLowerCase().includes(q)) ||
            (r.holder && r.holder.toLowerCase().includes(q)) ||
            (r.description && r.description.toLowerCase().includes(q)) ||
            (r.subgroup && r.subgroup.toLowerCase().includes(q))
          );
        }

        if (roles.length === 0 && (q || this.activeTierFilter === "vacant")) {
          return "";
        }

        const colorClasses = {
          gold: {
            border: "border-gold/30",
            badge: "bg-gold/15 text-gold border-gold/40",
            headerBg: "bg-gold/10",
            iconColor: "text-gold"
          },
          palm: {
            border: "border-palm/30",
            badge: "bg-palm/15 text-palm border-palm/40",
            headerBg: "bg-palm/10",
            iconColor: "text-palm"
          },
          laser: {
            border: "border-laser/30",
            badge: "bg-laser/15 text-laser border-laser/40",
            headerBg: "bg-laser/10",
            iconColor: "text-laser"
          },
          clay: {
            border: "border-clay/30",
            badge: "bg-clay/15 text-clay border-clay/40",
            headerBg: "bg-clay/10",
            iconColor: "text-clay"
          }
        }[tier.color] || {
          border: "border-white/10",
          badge: "bg-white/10 text-white border-white/20",
          headerBg: "bg-white/5",
          iconColor: "text-gold"
        };

        return `
          <div class="tier-card rounded-3xl bg-black/60 border ${colorClasses.border} shadow-2xl overflow-hidden" data-tier-id="${tier.id}">
            
            <!-- Tier Header Banner -->
            <div class="p-5 ${colorClasses.headerBg} border-b ${colorClasses.border} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-2xl bg-black/60 border ${colorClasses.border} flex items-center justify-center ${colorClasses.iconColor} text-xl shadow-md">
                  <i class="fa-solid ${tier.icon || 'fa-sitemap'}"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="text-base sm:text-lg font-black text-white">${tier.name}</h4>
                    <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${colorClasses.badge}">
                      ${tier.badge || 'نطاق إداري'}
                    </span>
                  </div>
                  <p class="text-xs text-gray-300 mt-0.5">${tier.description || ''}</p>
                </div>
              </div>

              ${tier.supervisorNote ? `
                <div class="px-3.5 py-1.5 rounded-xl bg-gold/15 border border-gold/30 text-gold text-xs font-bold flex items-center gap-1.5 shrink-0">
                  <i class="fa-solid fa-crown"></i>
                  <span>${tier.supervisorNote}</span>
                </div>
              ` : ''}

              ${canEdit ? `
                <button onclick="window.App.OrgStructure.openRoleModal(null, '${tier.id}')" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer">
                  <i class="fa-solid fa-plus text-[11px]"></i>
                  <span>إضافة منصب هنا</span>
                </button>
              ` : ''}
            </div>

            <!-- Tier Roles Grid -->
            <div class="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${roles.map(role => this.renderRoleCardHTML(role, tier, canEdit)).join('')}
            </div>

          </div>
        `;
      }).join('');
    }

    renderRoleCardHTML(role, tier, canEdit) {
      const isVacant = role.status === "vacant" || (role.holder && role.holder.includes("شاغر"));
      const isExternal = role.status === "external" || (role.holder && role.holder.includes("خارجية"));

      let statusBadge = "";
      if (isVacant) {
        statusBadge = `
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-clay/15 text-clay border border-clay/40 flex items-center gap-1">
            <i class="fa-solid fa-user-plus text-[9px]"></i>
            <span>منصب شاغر</span>
          </span>
        `;
      } else if (isExternal) {
        statusBadge = `
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-laser/15 text-laser border border-laser/40 flex items-center gap-1">
            <i class="fa-solid fa-building text-[9px]"></i>
            <span>جهة / شركة خارجية</span>
          </span>
        `;
      } else {
        statusBadge = `
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-palm/15 text-palm border border-palm/40 flex items-center gap-1">
            <i class="fa-solid fa-check text-[9px]"></i>
            <span>${role.statusLabel || 'معتمد ومُعيّن'}</span>
          </span>
        `;
      }

      return `
        <div class="role-card p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border ${isVacant ? 'border-dashed border-clay/50 bg-clay/[0.02]' : 'border-white/10'} hover:border-gold/50 transition-all flex flex-col justify-between gap-4 group relative shadow-md">
          
          <div class="flex flex-col gap-3">
            
            <!-- Card Header -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-xl bg-black/60 border border-white/15 flex items-center justify-center text-gold text-base group-hover:border-gold/50 transition-all">
                  <i class="fa-solid ${role.icon || 'fa-user-tie'}"></i>
                </div>
                <div>
                  <h5 class="text-sm font-black text-white leading-tight">${role.title}</h5>
                  ${role.subgroup ? `<span class="text-[10px] text-gray-400 font-semibold block mt-0.5">📂 ${role.subgroup}</span>` : ''}
                </div>
              </div>

              ${statusBadge}
            </div>

            <!-- Role Holder -->
            <div class="p-3 rounded-xl ${isVacant ? 'bg-clay/10 border border-clay/20' : 'bg-black/60 border border-white/8'} flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400 font-medium">المسؤول / الجهة:</span>
                <strong class="text-xs sm:text-sm font-black ${isVacant ? 'text-clay italic' : 'text-gold'}">
                  ${role.holder}
                </strong>
              </div>
              
              ${isVacant && canEdit ? `
                <button onclick="window.App.OrgStructure.quickAssignPrompt('${role.id}')" class="text-[11px] px-2.5 py-1 rounded-lg bg-clay text-white hover:bg-white hover:text-black font-black transition-all cursor-pointer">
                  تعيين مسؤول ✍️
                </button>
              ` : ''}
            </div>

            <!-- Description / Duties -->
            <div class="text-xs text-gray-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
              <span class="text-[10px] text-gray-400 font-bold block mb-1">المهام والصلاحيات المعتمدة:</span>
              <p class="text-[11px] leading-relaxed">${role.description}</p>
            </div>

          </div>

          <!-- Card Actions Footer -->
          ${canEdit ? `
            <div class="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5">
                <button onclick="window.App.OrgStructure.openRoleModal('${role.id}')" class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-gold hover:text-black text-gray-300 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer" title="تعديل المنصب">
                  <i class="fa-solid fa-pen-to-square"></i>
                  <span>تعديل</span>
                </button>
                <button onclick="window.App.OrgStructure.toggleVacant('${role.id}')" class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer" title="تبديل شاغر / معتمد">
                  <i class="fa-solid fa-arrows-rotate text-[10px]"></i>
                  <span>${isVacant ? 'تفعيل' : 'جعله شاغراً'}</span>
                </button>
              </div>

              <button onclick="window.App.OrgStructure.deleteRole('${role.id}')" class="p-1.5 rounded-lg hover:bg-clay/20 text-gray-500 hover:text-clay transition-all cursor-pointer" title="حذف المنصب من الهيكل">
                <i class="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          ` : ''}

        </div>
      `;
    }

    handleSearch(val) {
      this.searchQuery = val;
      const root = document.getElementById("org-structure-root");
      if (root) {
        this.render(root.parentElement);
      }
    }

    setTierFilter(filter) {
      this.activeTierFilter = filter;
      const root = document.getElementById("org-structure-root");
      if (root) {
        this.render(root.parentElement);
      }
    }

    // Quick Action: Toggle Vacant / Active
    async toggleVacant(roleId) {
      const found = this.findRole(roleId);
      if (!found) return;

      const { role } = found;
      if (role.status === "vacant" || role.holder.includes("شاغر")) {
        const newHolder = prompt("اكتب اسم الشخص أو المسؤول لتعيينه في منصب (" + role.title + "):", "");
        if (!newHolder) return;
        role.holder = newHolder.trim();
        role.status = "active";
        role.statusLabel = "معتمد";
      } else {
        if (!confirm("هل أنت متأكد من تحويل منصب (" + role.title + ") إلى شاغر؟")) return;
        role.holder = "شاغر";
        role.status = "vacant";
        role.statusLabel = "شاغر";
      }

      await this.save();
      const root = document.getElementById("org-structure-root");
      if (root) this.render(root.parentElement);
    }

    async quickAssignPrompt(roleId) {
      const found = this.findRole(roleId);
      if (!found) return;
      const { role } = found;
      const newHolder = prompt("أدخل اسم المسؤول المعين في منصب (" + role.title + "):", "");
      if (newHolder && newHolder.trim()) {
        role.holder = newHolder.trim();
        role.status = "active";
        role.statusLabel = "معتمد";
        await this.save();
        const root = document.getElementById("org-structure-root");
        if (root) this.render(root.parentElement);
      }
    }

    async deleteRole(roleId) {
      const found = this.findRole(roleId);
      if (!found) return;
      const { role, tier } = found;

      if (!confirm(`هل أنت متأكد من حذف منصب «${role.title}» نهائياً من الهيكل؟`)) {
        return;
      }

      tier.roles = tier.roles.filter(r => r.id !== roleId);
      await this.save();
      this.showToast("تم حذف المنصب بنجاح 🗑️", "info");
      const root = document.getElementById("org-structure-root");
      if (root) this.render(root.parentElement);
    }

    async resetToBaseline() {
      if (!confirm("هل ترغب في إعادة ضبط كامل الهيكل التنظيمي إلى المسودة المعتمدة الأساسية؟")) {
        return;
      }
      this.data = JSON.parse(JSON.stringify(DEFAULT_BASELINE));
      await this.save();
      this.showToast("تم استعادة الهيكل الأساسي بنجاح 🔄", "success");
      const root = document.getElementById("org-structure-root");
      if (root) this.render(root.parentElement);
    }

    // Modal: Open Role Editor (Create or Edit)
    openRoleModal(roleId = null, defaultTierId = "tier_leadership") {
      let role = null;
      let targetTierId = defaultTierId;

      if (roleId) {
        const found = this.findRole(roleId);
        if (found) {
          role = found.role;
          targetTierId = found.tier.id;
        }
      }

      this.editingRole = role;

      const modal = document.getElementById("org-role-modal");
      if (!modal) {
        this.injectRoleModal();
      }

      const modalEl = document.getElementById("org-role-modal");
      const titleEl = document.getElementById("org-modal-title");
      const inputTitle = document.getElementById("org-input-title");
      const inputHolder = document.getElementById("org-input-holder");
      const selectTier = document.getElementById("org-select-tier");
      const inputSubgroup = document.getElementById("org-input-subgroup");
      const selectStatus = document.getElementById("org-select-status");
      const inputIcon = document.getElementById("org-input-icon");
      const inputDesc = document.getElementById("org-input-desc");

      if (role) {
        titleEl.textContent = "تعديل منصب: " + role.title;
        inputTitle.value = role.title || "";
        inputHolder.value = role.holder || "";
        selectTier.value = targetTierId;
        inputSubgroup.value = role.subgroup || "";
        selectStatus.value = role.status || "active";
        inputIcon.value = role.icon || "fa-user-tie";
        inputDesc.value = role.description || "";
      } else {
        titleEl.textContent = "إضافة منصب أو إدارة جديدة للهيكل";
        inputTitle.value = "";
        inputHolder.value = "";
        selectTier.value = targetTierId;
        inputSubgroup.value = "";
        selectStatus.value = "active";
        inputIcon.value = "fa-user-tie";
        inputDesc.value = "";
      }

      modalEl.classList.remove("hidden");
      modalEl.classList.add("flex");
    }

    closeRoleModal() {
      const modalEl = document.getElementById("org-role-modal");
      if (modalEl) {
        modalEl.classList.add("hidden");
        modalEl.classList.remove("flex");
      }
      this.editingRole = null;
    }

    async handleRoleModalSubmit(e) {
      if (e) e.preventDefault();

      const inputTitle = document.getElementById("org-input-title").value.trim();
      const inputHolder = document.getElementById("org-input-holder").value.trim();
      const targetTierId = document.getElementById("org-select-tier").value;
      const inputSubgroup = document.getElementById("org-input-subgroup").value.trim();
      const status = document.getElementById("org-select-status").value;
      const icon = document.getElementById("org-input-icon").value.trim() || "fa-user-tie";
      const desc = document.getElementById("org-input-desc").value.trim();

      if (!inputTitle || !inputHolder) {
        alert("يرجى ملء مسمى المنصب واسم المسؤول/الجهة");
        return;
      }

      let statusLabel = "معتمد";
      if (status === "vacant" || inputHolder.includes("شاغر")) statusLabel = "شاغر";
      else if (status === "external" || inputHolder.includes("خارجية")) statusLabel = "شركة خارجية";

      if (this.editingRole) {
        // Edit existing role
        const oldFound = this.findRole(this.editingRole.id);
        if (oldFound) {
          // Check if tier changed
          if (oldFound.tier.id !== targetTierId) {
            oldFound.tier.roles = oldFound.tier.roles.filter(r => r.id !== this.editingRole.id);
            const newTier = this.data.tiers.find(t => t.id === targetTierId);
            if (newTier) {
              newTier.roles = newTier.roles || [];
              newTier.roles.push(this.editingRole);
            }
          }

          this.editingRole.title = inputTitle;
          this.editingRole.holder = inputHolder;
          this.editingRole.tierId = targetTierId;
          this.editingRole.subgroup = inputSubgroup;
          this.editingRole.status = status;
          this.editingRole.statusLabel = statusLabel;
          this.editingRole.icon = icon;
          this.editingRole.description = desc;
        }
      } else {
        // Add new role
        const newRole = {
          id: "role_" + Date.now(),
          title: inputTitle,
          holder: inputHolder,
          tierId: targetTierId,
          subgroup: inputSubgroup,
          status: status,
          statusLabel: statusLabel,
          icon: icon,
          description: desc,
          priority: "high"
        };

        const targetTier = this.data.tiers.find(t => t.id === targetTierId);
        if (targetTier) {
          targetTier.roles = targetTier.roles || [];
          targetTier.roles.push(newRole);
        }
      }

      this.closeRoleModal();
      await this.save();
      this.showToast("تم حفظ المنصب بنجاح ✅", "success");

      const root = document.getElementById("org-structure-root");
      if (root) this.render(root.parentElement);
    }

    // Modal: Strategic Note
    openStrategicNoteModal() {
      let modal = document.getElementById("org-note-modal");
      if (!modal) {
        this.injectNoteModal();
      }
      modal = document.getElementById("org-note-modal");
      const textarea = document.getElementById("org-input-strategic-note");
      if (textarea) textarea.value = this.data.strategicNote;

      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }

    closeStrategicNoteModal() {
      const modal = document.getElementById("org-note-modal");
      if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
      }
    }

    async saveStrategicNote(e) {
      if (e) e.preventDefault();
      const textarea = document.getElementById("org-input-strategic-note");
      if (textarea && textarea.value.trim()) {
        this.data.strategicNote = textarea.value.trim();
        this.closeStrategicNoteModal();
        await this.save();
        this.showToast("تم تحديث الملاحظة الاستراتيجية بنجاح 📋", "success");
        const root = document.getElementById("org-structure-root");
        if (root) this.render(root.parentElement);
      }
    }

    bindModals() {
      if (!document.getElementById("org-role-modal")) {
        this.injectRoleModal();
      }
      if (!document.getElementById("org-note-modal")) {
        this.injectNoteModal();
      }
    }

    injectRoleModal() {
      if (document.getElementById("org-role-modal")) return;

      const modalHtml = `
        <div id="org-role-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md hidden items-center justify-center p-4">
          <div class="bg-[#0b0e1b] border border-gold/40 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative animate-fadeIn flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 id="org-modal-title" class="text-base font-black text-white flex items-center gap-2">
                <i class="fa-solid fa-sitemap text-gold"></i>
                <span>إدارة المنصب</span>
              </h3>
              <button onclick="window.App.OrgStructure.closeRoleModal()" class="w-8 h-8 rounded-full bg-white/5 hover:bg-clay text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onsubmit="window.App.OrgStructure.handleRoleModalSubmit(event)" class="flex flex-col gap-4 text-xs">
              
              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-gray-300">المسمى الوظيفي / الدور التنظيمي:</label>
                <input type="text" id="org-input-title" required placeholder="مثال: المستشار العلمي، إدارة المالية، رئيس المشروع" class="bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-gold transition-all" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label class="font-bold text-gray-300">اسم المسؤول أو الشخص أو الجهة:</label>
                  <input type="text" id="org-input-holder" required placeholder="مثال: أحمد الدوغان أو (شاغر) أو شركة خارجية" class="bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-gold transition-all" />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="font-bold text-gray-300">حالة المنصب:</label>
                  <select id="org-select-status" class="bg-black/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-gold transition-all">
                    <option value="active">معتمد ومُعيّن ✅</option>
                    <option value="vacant">شاغر (قيد الترشيح) ⏳</option>
                    <option value="external">جهة أو شركة خارجية 🏢</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label class="font-bold text-gray-300">النطاق الإداري التابع له:</label>
                  <select id="org-select-tier" class="bg-black/80 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-gold transition-all">
                    <option value="tier_governance">١. النطاق الإشرافي والتشريعي (مستوى الحوكمة)</option>
                    <option value="tier_leadership">٢. النطاق القيادي والتنفيذي (مرحلة التنفيذ)</option>
                    <option value="tier_specialized_ops">٣. النطاق التشغيلي المتخصص (مرحلة التنفيذ والمتابعة)</option>
                    <option value="tier_post_execution">٤. نطاق التشغيل والمتابعة (ما بعد اكتمال التنفيذ)</option>
                  </select>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="font-bold text-gray-300">المجموعة الفرعية (اختياري):</label>
                  <input type="text" id="org-input-subgroup" placeholder="مثال: الجهة العلمية، لجنة الصرف" class="bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-gold transition-all" />
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-gray-300">رمز الأيقونة (FontAwesome Icon):</label>
                <input type="text" id="org-input-icon" value="fa-user-tie" placeholder="fa-user-tie, fa-landmark, fa-laptop-code..." class="bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-gold transition-all font-mono" />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-gray-300">المهام والصلاحيات المعتمدة:</label>
                <textarea id="org-input-desc" rows="3" placeholder="اكتب وصفاً دقيقاً للمسؤوليات الموكلة لهذا المنصب..." class="bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-gold transition-all leading-relaxed"></textarea>
              </div>

              <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button type="button" onclick="window.App.OrgStructure.closeRoleModal()" class="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-bold cursor-pointer">إلغاء</button>
                <button type="submit" class="px-6 py-2.5 rounded-xl bg-gold text-black hover:bg-white text-xs font-black shadow-md shadow-gold/20 flex items-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-check"></i>
                  <span>حفظ المنصب</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML("beforeend", modalHtml);
    }

    injectNoteModal() {
      if (document.getElementById("org-note-modal")) return;

      const modalHtml = `
        <div id="org-note-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md hidden items-center justify-center p-4">
          <div class="bg-[#0b0e1b] border border-gold/40 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative animate-fadeIn flex flex-col gap-5">
            
            <div class="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 class="text-base font-black text-white flex items-center gap-2">
                <i class="fa-solid fa-compass text-gold"></i>
                <span>تعديل الملاحظة الاستراتيجية</span>
              </h3>
              <button onclick="window.App.OrgStructure.closeStrategicNoteModal()" class="w-8 h-8 rounded-full bg-white/5 hover:bg-clay text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onsubmit="window.App.OrgStructure.saveStrategicNote(event)" class="flex flex-col gap-4 text-xs">
              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-gray-300">نص الملاحظة الاستراتيجية لمرحلة التنفيذ وانتقال الإدارة:</label>
                <textarea id="org-input-strategic-note" rows="5" required class="bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-gold transition-all leading-relaxed"></textarea>
              </div>

              <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button type="button" onclick="window.App.OrgStructure.closeStrategicNoteModal()" class="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-bold cursor-pointer">إلغاء</button>
                <button type="submit" class="px-6 py-2.5 rounded-xl bg-gold text-black hover:bg-white text-xs font-black shadow-md shadow-gold/20 flex items-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-check"></i>
                  <span>حفظ الملاحظة</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      `;
      document.body.insertAdjacentHTML("beforeend", modalHtml);
    }

    showToast(msg, type = "info") {
      const toast = document.createElement("div");
      toast.className = `fixed bottom-6 left-6 z-50 px-5 py-3 rounded-2xl bg-black/90 border border-gold/40 text-white text-xs font-black shadow-2xl flex items-center gap-2.5 animate-fadeIn`;
      toast.innerHTML = `<i class="fa-solid fa-circle-check text-gold text-sm"></i><span>${msg}</span>`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.4s ease";
        setTimeout(() => toast.remove(), 400);
      }, 3200);
    }
  }

  window.App.OrgStructure = new OrgStructureManager();
})();
