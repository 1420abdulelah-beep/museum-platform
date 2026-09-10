/* ==========================================================================
   SERAJ AL-AHSA — COMPREHENSIVE EXECUTIVE REPORT & PITCH DECK ENGINE
   مولد العروض التنفيذية الشاملة - يعكس 100% من وثيقة PDR وقاعدة البيانات
   خاصية التحرير، التعديل، إضافة الشرائح، وحذف الشرائح محصورة حصرياً لمدير النظام (Admin)
   ========================================================================== */

(function() {
  'use strict';

  window.App = window.App || {};

  class ExecutiveReportGenerator {
    constructor() {
      this.currentMode = 'pitch_deck'; // 'pitch_deck' | 'master_dossier' | 'pdr_technical'
      this.currentTheme = 'dark_gold'; // 'dark_gold' | 'clean_white'
      this.currentSlideIndex = 0;
      this.targetAudience = 'الجهات الحكومية، الشركاء، والمستثمرون الاستراتيجيون';
      this.isFullscreen = false;
      this.slides = [];
      this.isModalOpen = false;

      this.init();
    }

    init() {
      this.ensureModalMarkup();
      this.bindGlobalTriggers();
      this.bindKeyboardShortcuts();
    }

    // Determine strictly whether current user is Administrator
    isAdmin() {
      // 1. Check AuthGuard instance
      if (window.App && window.App.authGuard && typeof window.App.authGuard.isAdmin === 'function') {
        if (window.App.authGuard.isAdmin()) return true;
      }
      // 2. Check PdrModel instance
      if (window.App && window.App.pdrModel && typeof window.App.pdrModel.isAdmin === 'function') {
        if (window.App.pdrModel.isAdmin()) return true;
      }
      // 3. Check DetailedPlanModel instance
      if (window.App && window.App.planModel && typeof window.App.planModel.isAdmin === 'function') {
        if (window.App.planModel.isAdmin()) return true;
      }
      // 4. Check unified session storage
      try {
        const raw = localStorage.getItem("seraj_unified_auth_session_v1") || 
                    sessionStorage.getItem("seraj_unified_auth_session_v1") ||
                    sessionStorage.getItem("seraj_detailed_plan_auth_v1") ||
                    sessionStorage.getItem("seraj_auth_session_v1") ||
                    sessionStorage.getItem("pdr_auth_user");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.role === "admin" || parsed.username === "admin" || parsed.isAdmin === true)) {
            return true;
          }
        }
      } catch (_) {}

      return false;
    }

    // Safely collect latest live data from across the platform and models
    getAggregatedData() {
      // 1. Detailed Master Plan Data
      let planData = (window.App && window.App.planModel && window.App.planModel.data);
      if (!planData) {
        try {
          const savedPlan = localStorage.getItem('seraj_detailed_plan_state_v1');
          if (savedPlan) planData = JSON.parse(savedPlan);
        } catch (_) {}
      }
      if (!planData) {
        planData = (window.App && window.App.DetailedPlanData) || {};
      }

      // 2. PDR Data (Active PdrModel / Model instance -> LocalStorage -> Global Dataset)
      let pdrData = (window.App && window.App.pdrModel && window.App.pdrModel.data)
        || (window.App && window.App.model && window.App.model.data);
      if (!pdrData) {
        try {
          const savedPdr = localStorage.getItem('pdr_project_definition_state_v2') || localStorage.getItem('pdr_app_state_v1');
          if (savedPdr) pdrData = JSON.parse(savedPdr);
        } catch (_) {}
      }
      if (!pdrData) {
        pdrData = (window.App && window.App.pdrData) || {};
      }

      // 3. Dynamic Live Stats Calculation
      let pdrStats = { total: 17, approved: 17, inProgress: 0, overallProgress: 100 };
      if (window.App && window.App.pdrModel && typeof window.App.pdrModel.calculateGlobalStats === 'function') {
        pdrStats = window.App.pdrModel.calculateGlobalStats();
      } else if (pdrData && pdrData.sections && Array.isArray(pdrData.sections)) {
        let totalItems = 0;
        let approvedItems = 0;
        let inProgressItems = 0;
        pdrData.sections.forEach(sec => {
          if (Array.isArray(sec.items)) {
            sec.items.forEach(it => {
              totalItems++;
              if (it.status === 'approved' || it.status === 'completed' || it.isDone) approvedItems++;
              else if (it.status === 'in_progress') inProgressItems++;
            });
          }
        });
        const progressPct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 100;
        pdrStats = {
          total: totalItems || pdrData.sections.length,
          approved: approvedItems || pdrData.sections.length,
          inProgress: inProgressItems,
          overallProgress: progressPct
        };
      }

      return {
        plan: planData,
        pdr: pdrData,
        pdrStats: pdrStats,
        generatedDate: new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }),
        generatedDateGregorian: new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
      };
    }

    // Save and sync with backend and localStorage (Admin only)
    saveModelChanges(toastMsg) {
      if (!this.isAdmin()) {
        this.showToast('⚠️ خاصية حفظ التعديلات محصورة حصرياً لمدير النظام (Admin)');
        return;
      }

      if (window.App && window.App.pdrModel && typeof window.App.pdrModel.saveAndSync === 'function') {
        window.App.pdrModel.saveAndSync();
      } else {
        const data = this.getAggregatedData().pdr;
        try {
          localStorage.setItem('pdr_project_definition_state_v2', JSON.stringify(data));
          fetch('/api/pdr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).catch(err => console.warn('PDR sync failed:', err));
        } catch (e) {
          console.error(e);
        }
      }
      this.showToast(toastMsg || '✅ تم حفظ التعديلات ومزامنتها بنجاح');
      this.renderCurrentView();
    }

    showToast(message) {
      let toast = document.getElementById('exec-toast-notification');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'exec-toast-notification';
        toast.style.zIndex = '999999';
        toast.className = 'fixed bottom-6 left-6 px-5 py-3 rounded-2xl bg-black/95 border border-gold text-gold font-bold text-xs shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-none flex items-center gap-2.5';
        document.body.appendChild(toast);
      }
      toast.innerHTML = `<i class="fa-solid fa-shield-halved text-base text-gold"></i> <span>${message}</span>`;
      toast.classList.remove('translate-y-10', 'opacity-0', 'pointer-events-none');
      setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0', 'pointer-events-none');
      }, 3500);
    }

    // Build or ensure the Generator Modal container is ready in DOM
    ensureModalMarkup() {
      const oldModal = document.getElementById('executive-generator-modal');
      if (oldModal) oldModal.remove();

      const oldEditSlide = document.getElementById('exec-edit-slide-modal');
      if (oldEditSlide) oldEditSlide.remove();

      const oldEditItem = document.getElementById('exec-edit-item-modal');
      if (oldEditItem) oldEditItem.remove();

      const oldAddCustom = document.getElementById('exec-add-custom-slide-modal');
      if (oldAddCustom) oldAddCustom.remove();

      const userIsAdmin = this.isAdmin();

      const modalHtml = `
        <!-- MAIN PRESENTATION MODAL -->
        <div id="executive-generator-modal" style="display: none; z-index: 10000;" class="fixed inset-0 items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-4 overflow-y-auto no-print">
          <div class="relative w-full max-w-7xl max-h-[96vh] flex flex-col rounded-3xl bg-[#080a13] border border-gold/40 shadow-2xl overflow-hidden font-['Cairo']">
            
            <!-- Modal Header Bar -->
            <header class="px-5 py-3 bg-black/95 border-b border-gold/25 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold/30 to-gold-dark/20 border border-gold/50 flex items-center justify-center text-gold text-lg shadow-md shadow-gold/20 shrink-0">
                  <i class="fa-solid fa-file-invoice-dollar"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="text-base sm:text-lg font-black bg-gradient-to-r from-white via-gold to-gold-dark bg-clip-text text-transparent">
                      العرض التنفيذي الشامل لوثيقة PDR
                    </h2>
                    ${userIsAdmin ? `
                      <span class="px-2.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/40 text-[10px] font-black flex items-center gap-1 shadow-sm">
                        <i class="fa-solid fa-crown text-[10px]"></i>
                        <span>صلاحية مدير النظام (Admin)</span>
                      </span>
                    ` : `
                      <span class="px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/15 text-[10px] font-bold flex items-center gap-1">
                        <i class="fa-solid fa-lock text-[10px]"></i>
                        <span>وضع الاستعراض الرسمي</span>
                      </span>
                    `}
                  </div>
                  <p class="text-[11px] text-gray-400">سراج الأحساء — مذكرات استثمارية وشرائح تنفيذية تفاعلية موجهة للجهات الحكومية والشركاء</p>
                </div>
              </div>

              <!-- Top Action Controls -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Admin Only Action Buttons -->
                ${userIsAdmin ? `
                  <!-- Add Custom Slide Button -->
                  <button onclick="window.App && window.App.executiveReportGenerator ? window.App.executiveReportGenerator.openAddCustomSlideModal() : null" class="px-3.5 py-2 rounded-xl bg-gold/20 hover:bg-gold text-gold hover:text-black border border-gold/50 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-gold/10" title="إضافة شريحة مخصصة جديدة للعرض">
                    <i class="fa-solid fa-plus-circle text-sm"></i>
                    <span>إضافة شريحة ➕</span>
                  </button>

                  <!-- Edit Current Slide Button -->
                  <button onclick="window.App && window.App.executiveReportGenerator ? window.App.executiveReportGenerator.openEditSlideModalCurrent() : null" class="px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-400/50 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm" title="تعديل الشريحة المعروضة حالياً">
                    <i class="fa-solid fa-pen-to-square text-sm"></i>
                    <span>تعديل الشريحة ✏️</span>
                  </button>

                  <!-- Delete Current Slide Button -->
                  <button onclick="window.App && window.App.executiveReportGenerator ? window.App.executiveReportGenerator.deleteCurrentSlide() : null" class="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/50 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm" title="حذف الشريحة المعروضة حالياً">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                    <span>حذف الشريحة 🗑️</span>
                  </button>

                  <!-- Cloud Sync Button -->
                  <button onclick="window.App && window.App.executiveReportGenerator ? window.App.executiveReportGenerator.saveModelChanges('☁️ تم حفظ التغييرات ومزامنتها سحابياً') : null" class="px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer" title="حفظ فوري ومزامنة مع الخادم">
                    <i class="fa-solid fa-cloud-arrow-up"></i>
                    <span class="hidden sm:inline">حفظ وتزامن</span>
                  </button>
                ` : ''}

                <!-- Direct Print / Save PDF -->
                <button onclick="window.App && window.App.executiveReportGenerator ? window.App.executiveReportGenerator.exportPdf() : null" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-white hover:to-gold text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-gold/25 transition-all cursor-pointer" title="طباعة أو تصدير PDF مباشر">
                  <i class="fa-solid fa-file-pdf"></i>
                  <span>تصدير PDF</span>
                </button>

                <!-- Word Export Button -->
                <button onclick="window.App && window.App.exportPdrToWord ? window.App.exportPdrToWord() : null" class="px-3 py-2 rounded-xl bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-400/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm" title="تصدير كملف Word (.doc)">
                  <i class="fa-solid fa-file-word"></i>
                  <span class="hidden sm:inline">Word (.doc)</span>
                </button>

                <!-- Standalone HTML Deck Download -->
                <button onclick="window.App && window.App.executiveReportGenerator ? window.App.executiveReportGenerator.downloadStandaloneDeck() : null" class="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/15 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer" title="تنزيل ملف HTML مستقل يعمل بدون إنترنت">
                  <i class="fa-solid fa-download text-gold"></i>
                  <span class="hidden sm:inline">تنزيل Deck</span>
                </button>

                <!-- Fullscreen Toggle for Slides -->
                <button onclick="window.App && window.App.executiveReportGenerator ? window.App.executiveReportGenerator.toggleFullscreen() : null" class="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 text-xs font-bold transition-all cursor-pointer" title="وضع ملء الشاشة">
                  <i class="fa-solid fa-expand"></i>
                </button>

                <!-- Close Modal -->
                <button onclick="window.App && window.App.executiveReportGenerator ? window.App.executiveReportGenerator.close() : null" class="w-9 h-9 rounded-xl bg-white/5 hover:bg-red-900/40 text-gray-300 hover:text-white border border-white/15 flex items-center justify-center transition-all cursor-pointer" title="إغلاق النافذة">
                  <i class="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </header>

            <!-- Mode & Customization Toolbar -->
            <div class="px-5 py-2 bg-[#0d1020] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              
              <!-- Report Type Tabs -->
              <div class="flex items-center gap-1.5 bg-black/50 p-1 rounded-2xl border border-white/10">
                <button class="exec-mode-pill active px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-gold text-black shadow-sm" data-mode="pitch_deck">
                  <i class="fa-solid fa-presentation-screen"></i>
                  <span>عرض الشرائح التنفيذي (Pitch Deck 16:9)</span>
                </button>
                <button class="exec-mode-pill px-3.5 py-1.5 rounded-xl font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer" data-mode="master_dossier">
                  <i class="fa-solid fa-landmark-dome"></i>
                  <span>الملف التنفيذي الشامل (A4 Dossier)</span>
                </button>
                <button class="exec-mode-pill px-3.5 py-1.5 rounded-xl font-bold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer" data-mode="pdr_technical">
                  <i class="fa-solid fa-diagram-project"></i>
                  <span>الملخص الفني لوثيقة PDR (17 قسماً)</span>
                </button>
              </div>

              <!-- Theme & Target Customizer -->
              <div class="flex items-center gap-3 flex-wrap">
                <!-- Theme Switcher -->
                <div class="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button class="exec-theme-pill active px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gold/20 text-gold border border-gold/30 cursor-pointer" data-theme="dark_gold" title="السمة التراثية الداكنة">
                    <i class="fa-solid fa-moon text-gold"></i>
                    <span>تراثي داكن</span>
                  </button>
                  <button class="exec-theme-pill px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-400 hover:text-white cursor-pointer" data-theme="clean_white" title="السمة البيضاء للطباعة">
                    <i class="fa-solid fa-sun text-amber-500"></i>
                    <span>أبيض للطباعة</span>
                  </button>
                </div>

                <!-- Target Audience Editor -->
                <div class="flex items-center gap-2">
                  <span class="text-gray-400 text-[11px] hidden sm:inline">الجهة الموجه إليها:</span>
                  <input type="text" id="exec-target-audience-input" class="bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-gold font-bold focus:border-gold focus:outline-none w-48 sm:w-60" value="الجهات الحكومية، الشركاء، والمستثمرون الاستراتيجيون" placeholder="أدخل اسم الجهة...">
                </div>
              </div>

            </div>

            <!-- Slide Navigation Bar (Visible in pitch_deck mode) -->
            <div id="exec-slides-nav-bar" class="px-5 py-2.5 bg-black/75 border-b border-gold/20 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div class="flex items-center gap-2">
                <button onclick="window.App && window.App.executiveReportGenerator ? window.App.executiveReportGenerator.prevSlide() : null" class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-gold hover:text-black border border-white/10 font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-arrow-right"></i>
                  <span>السابقة</span>
                </button>
                <button onclick="window.App && window.App.executiveReportGenerator ? window.App.executiveReportGenerator.nextSlide() : null" class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-gold hover:text-black border border-white/10 font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                  <span>التالية</span>
                  <i class="fa-solid fa-arrow-left"></i>
                </button>
                <span id="exec-slide-counter-badge" class="px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold font-mono font-bold text-[11px]">
                  شريحة 1 من 22
                </span>
              </div>

              <!-- Quick Slide Select Pills -->
              <div id="exec-slides-thumbnails-container" class="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-xl">
                <!-- Injected dynamically -->
              </div>
            </div>

            <!-- Main Render Area / Preview Container -->
            <div id="exec-preview-viewport" class="flex-grow p-3 sm:p-6 overflow-y-auto bg-gradient-to-b from-[#080a13] to-[#04050a] flex justify-center items-start">
              <div id="exec-render-content" class="w-full transition-all duration-300">
                <!-- Content injected dynamically -->
              </div>
            </div>

            <!-- Modal Footer Status -->
            <footer class="px-5 py-2.5 bg-black/95 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 shrink-0">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-shield-halved text-gold"></i>
                <span id="exec-footer-status-text">يعكس 100% من وثيقة PDR (17 قسماً + اللوحات الاستراتيجية والمخرجات) • متزامن مع الخادم</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="hidden md:inline font-mono text-gray-500">[← / →] للتنقل • [Esc] للإغلاق</span>
                <span class="text-gold font-bold">«تاريخٌ يُروى.. وحاضرٌ يُعاش»</span>
              </div>
            </footer>

          </div>
        </div>

        <!-- DIALOG 1: Slide Editor Modal (Admin Protected) -->
        <div id="exec-edit-slide-modal" style="display: none; z-index: 20000;" class="fixed inset-0 items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div class="bg-[#0d1020] border-2 border-gold/60 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-right font-['Cairo'] relative">
            <div class="flex items-center justify-between border-b border-white/15 pb-3">
              <h3 class="text-base font-black text-gold flex items-center gap-2">
                <i class="fa-solid fa-sliders text-lg"></i>
                <span>تعديل بيانات الشريحة التنفيذية (Admin)</span>
              </h3>
              <button onclick="window.App.executiveReportGenerator.closeSubModals()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-red-600 text-gray-300 hover:text-white flex items-center justify-center cursor-pointer transition-all">
                <i class="fa-solid fa-xmark text-base"></i>
              </button>
            </div>
            
            <input type="hidden" id="exec-edit-slide-id">
            <input type="hidden" id="exec-edit-slide-type">

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-gray-200 font-bold mb-1">عنوان الشريحة (بالعربية):</label>
                <input type="text" id="exec-edit-slide-title-ar" class="w-full bg-black/70 border border-white/25 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-gold focus:outline-none">
              </div>
              <div>
                <label class="block text-gray-200 font-bold mb-1">العنوان بالإنجليزية (أو التصنيف):</label>
                <input type="text" id="exec-edit-slide-title-en" class="w-full bg-black/70 border border-white/25 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-gold focus:outline-none">
              </div>
              <div>
                <label class="block text-gray-200 font-bold mb-1">الملخص التنفيذي للشريحة / الوصف:</label>
                <textarea id="exec-edit-slide-summary" rows="4" class="w-full bg-black/70 border border-white/25 rounded-xl px-3.5 py-2.5 text-white focus:border-gold focus:outline-none leading-relaxed"></textarea>
              </div>
              <div>
                <label class="block text-gray-200 font-bold mb-1">الأيقونة (FontAwesome Class):</label>
                <input type="text" id="exec-edit-slide-icon" placeholder="fa-solid fa-folder-tree" class="w-full bg-black/70 border border-white/25 rounded-xl px-3.5 py-2 text-white focus:border-gold focus:outline-none font-mono">
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-4 border-t border-white/15">
              <button onclick="window.App.executiveReportGenerator.closeSubModals()" class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold cursor-pointer">
                إلغاء
              </button>
              <button onclick="window.App.executiveReportGenerator.saveSlideModalChanges()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-white hover:to-gold text-black font-black text-xs cursor-pointer shadow-lg shadow-gold/25">
                حفظ التعديل والمزامنة 💾
              </button>
            </div>
          </div>
        </div>

        <!-- DIALOG 2: Item / Deliverable Editor Modal (Admin Protected) -->
        <div id="exec-edit-item-modal" style="display: none; z-index: 20000;" class="fixed inset-0 items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div class="bg-[#0d1020] border-2 border-emerald-500/60 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-right font-['Cairo'] relative">
            <div class="flex items-center justify-between border-b border-white/15 pb-3">
              <h3 class="text-base font-black text-emerald-400 flex items-center gap-2">
                <i class="fa-solid fa-file-circle-plus text-lg"></i>
                <span id="exec-edit-item-modal-title">إضافة / تعديل مخرج تنفيذي (Admin)</span>
              </h3>
              <button onclick="window.App.executiveReportGenerator.closeSubModals()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-red-600 text-gray-300 hover:text-white flex items-center justify-center cursor-pointer transition-all">
                <i class="fa-solid fa-xmark text-base"></i>
              </button>
            </div>
            
            <input type="hidden" id="exec-edit-item-sec-id">
            <input type="hidden" id="exec-edit-item-id">

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-gray-200 font-bold mb-1">عنوان المخرج / البند:</label>
                <input type="text" id="exec-edit-item-title" class="w-full bg-black/70 border border-white/25 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-emerald-400 focus:outline-none" placeholder="مثال: ميثاق الاستدامة والتأثير الثقافي">
              </div>
              <div>
                <label class="block text-gray-200 font-bold mb-1">محتوى وتفاصيل المخرج التنفيذي:</label>
                <textarea id="exec-edit-item-deliverable" rows="3" class="w-full bg-black/70 border border-white/25 rounded-xl px-3.5 py-2.5 text-white focus:border-emerald-400 focus:outline-none leading-relaxed" placeholder="أدخل الوصف التفصيلي أو مخرجات هذا البند..."></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-gray-200 font-bold mb-1">الإدارة / المسؤول:</label>
                  <input type="text" id="exec-edit-item-assignee" class="w-full bg-black/70 border border-white/25 rounded-xl px-3.5 py-2 text-white focus:border-emerald-400 focus:outline-none" placeholder="اللجنة التاريخية / الهندسة">
                </div>
                <div>
                  <label class="block text-gray-200 font-bold mb-1">نسبة الإنجاز (%):</label>
                  <input type="number" min="0" max="100" id="exec-edit-item-progress" class="w-full bg-black/70 border border-white/25 rounded-xl px-3.5 py-2 text-white focus:border-emerald-400 focus:outline-none font-mono font-bold" value="100">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-gray-200 font-bold mb-1">حالة الاعتماد:</label>
                  <select id="exec-edit-item-status" class="w-full bg-black/70 border border-white/25 rounded-xl px-3.5 py-2 text-white focus:border-emerald-400 focus:outline-none font-bold">
                    <option value="approved">معتمد ومنجز (Approved)</option>
                    <option value="in_progress">قيد الإعداد (In Progress)</option>
                    <option value="review">تحت المراجعة (In Review)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-gray-200 font-bold mb-1">المرحلة الزمنية:</label>
                  <input type="text" id="exec-edit-item-milestone" class="w-full bg-black/70 border border-white/25 rounded-xl px-3.5 py-2 text-white focus:border-emerald-400 focus:outline-none" placeholder="2026-Q4 / المرحلة الأولى">
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-4 border-t border-white/15">
              <button onclick="window.App.executiveReportGenerator.closeSubModals()" class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold cursor-pointer">
                إلغاء
              </button>
              <button onclick="window.App.executiveReportGenerator.saveItemModalChanges()" class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-lg shadow-emerald-900/40">
                حفظ وإضافة إلى القسم 💾
              </button>
            </div>
          </div>
        </div>

        <!-- DIALOG 3: Add Custom Slide Modal (Admin Protected) -->
        <div id="exec-add-custom-slide-modal" style="display: none; z-index: 20000;" class="fixed inset-0 items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div class="bg-[#0d1020] border-2 border-gold/60 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-right font-['Cairo'] relative">
            <div class="flex items-center justify-between border-b border-white/15 pb-3">
              <h3 class="text-base font-black text-gold flex items-center gap-2">
                <i class="fa-solid fa-plus-circle text-lg"></i>
                <span>إنشاء شريحة مخصصة جديدة للعرض (Admin)</span>
              </h3>
              <button onclick="window.App.executiveReportGenerator.closeSubModals()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-red-600 text-gray-300 hover:text-white flex items-center justify-center cursor-pointer transition-all">
                <i class="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block text-gray-200 font-bold mb-1">عنوان الشريحة الرئيسي:</label>
                <input type="text" id="exec-custom-title" class="w-full bg-black/70 border border-white/25 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-gold focus:outline-none" placeholder="مثال: الخطة الاستثمارية والشركاء المستهدفون">
              </div>
              <div>
                <label class="block text-gray-200 font-bold mb-1">التصنيف / المحور:</label>
                <input type="text" id="exec-custom-category" class="w-full bg-black/70 border border-white/25 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-gold focus:outline-none" placeholder="مثال: الاستثمار والشراكات">
              </div>
              <div>
                <label class="block text-gray-200 font-bold mb-1">النص والمحتوى التنفيذي الرئيسي:</label>
                <textarea id="exec-custom-content" rows="4" class="w-full bg-black/70 border border-white/25 rounded-xl px-3.5 py-2.5 text-white focus:border-gold focus:outline-none leading-relaxed" placeholder="اكتب تفاصيل الشريحة، النقاط الرئيسية، أو المقترح الاستثماري..."></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-gray-200 font-bold mb-1">الأيقونة (FontAwesome):</label>
                  <input type="text" id="exec-custom-icon" class="w-full bg-black/70 border border-white/25 rounded-xl px-3 py-2 text-white focus:border-gold focus:outline-none font-mono" value="fa-solid fa-star">
                </div>
                <div>
                  <label class="block text-gray-200 font-bold mb-1">المستهدف الرقمي / KPI (اختياري):</label>
                  <input type="text" id="exec-custom-kpi" class="w-full bg-black/70 border border-white/25 rounded-xl px-3 py-2 text-white focus:border-gold focus:outline-none" placeholder="مثال: 50 مليون ريال">
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-4 border-t border-white/15">
              <button onclick="window.App.executiveReportGenerator.closeSubModals()" class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold cursor-pointer">
                إلغاء
              </button>
              <button onclick="window.App.executiveReportGenerator.saveNewCustomSlide()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-white hover:to-gold text-black font-black text-xs cursor-pointer shadow-lg shadow-gold/25">
                إضافة الشريحة للعرض 🚀
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      this.bindModalEvents();
    }

    bindGlobalTriggers() {
      document.querySelectorAll('.btn-open-executive-generator').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.open();
        });
      });
    }

    bindKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        if (!this.isModalOpen) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.nextSlide();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.prevSlide();
        } else if (e.key === 'Escape') {
          const modals = ['exec-edit-slide-modal', 'exec-edit-item-modal', 'exec-add-custom-slide-modal'];
          const openSub = modals.find(m => {
            const el = document.getElementById(m);
            return el && el.style.display !== 'none';
          });
          if (openSub) {
            this.closeSubModals();
          } else {
            this.close();
          }
        }
      });
    }

    bindModalEvents() {
      // Mode pills
      document.querySelectorAll('.exec-mode-pill').forEach(btn => {
        btn.onclick = (e) => {
          document.querySelectorAll('.exec-mode-pill').forEach(b => {
            b.classList.remove('active', 'bg-gold', 'text-black', 'shadow-sm');
            b.classList.add('text-gray-300');
          });
          const target = e.currentTarget;
          target.classList.add('active', 'bg-gold', 'text-black', 'shadow-sm');
          target.classList.remove('text-gray-300');
          this.currentMode = target.dataset.mode;
          this.renderCurrentView();
        };
      });

      // Theme pills
      document.querySelectorAll('.exec-theme-pill').forEach(btn => {
        btn.onclick = (e) => {
          document.querySelectorAll('.exec-theme-pill').forEach(b => {
            b.classList.remove('active', 'bg-gold/20', 'text-gold', 'border', 'border-gold/30');
            b.classList.add('text-gray-400');
          });
          const target = e.currentTarget;
          target.classList.add('active', 'bg-gold/20', 'text-gold', 'border', 'border-gold/30');
          target.classList.remove('text-gray-400');
          this.currentTheme = target.dataset.theme;
          this.renderCurrentView();
        };
      });

      // Target Audience input
      const targetInput = document.getElementById('exec-target-audience-input');
      if (targetInput) {
        targetInput.oninput = (e) => {
          this.targetAudience = e.target.value;
          this.renderCurrentView();
        };
      }
    }

    open(mode, target) {
      this.ensureModalMarkup();
      if (mode) this.currentMode = mode;
      if (target) this.targetAudience = target;
      const modal = document.getElementById('executive-generator-modal');
      if (modal) {
        modal.style.display = 'flex';
        this.isModalOpen = true;
        this.renderCurrentView();
      }
    }

    close() {
      const modal = document.getElementById('executive-generator-modal');
      if (modal) {
        modal.style.display = 'none';
        this.isModalOpen = false;
      }
      this.closeSubModals();
    }

    closeSubModals() {
      ['exec-edit-slide-modal', 'exec-edit-item-modal', 'exec-add-custom-slide-modal'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    }

    toggleFullscreen() {
      const modalBox = document.querySelector('#executive-generator-modal > div');
      if (!this.isFullscreen) {
        if (modalBox && modalBox.requestFullscreen) modalBox.requestFullscreen();
        this.isFullscreen = true;
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        this.isFullscreen = false;
      }
    }

    nextSlide() {
      if (this.currentSlideIndex < this.slides.length - 1) {
        this.currentSlideIndex++;
        this.renderPitchDeckSlide();
      }
    }

    prevSlide() {
      if (this.currentSlideIndex > 0) {
        this.currentSlideIndex--;
        this.renderPitchDeckSlide();
      }
    }

    goToSlide(index) {
      if (index >= 0 && index < this.slides.length) {
        this.currentSlideIndex = index;
        this.renderPitchDeckSlide();
      }
    }

    renderCurrentView() {
      const navBar = document.getElementById('exec-slides-nav-bar');
      const container = document.getElementById('exec-render-content');
      if (!container) return;

      if (this.currentMode === 'pitch_deck') {
        if (navBar) navBar.classList.remove('hidden');
        this.buildPitchDeckSlides();
        this.renderPitchDeckSlide();
      } else if (this.currentMode === 'master_dossier') {
        if (navBar) navBar.classList.add('hidden');
        container.innerHTML = this.buildMasterDossierHtml();
      } else if (this.currentMode === 'pdr_technical') {
        if (navBar) navBar.classList.add('hidden');
        container.innerHTML = this.buildPdrTechnicalHtml();
      }
    }

    // =========================================================================
    // 1. PITCH DECK BUILDER (16:9 Dynamic Slides Covering 100% of PDR)
    // =========================================================================
    buildPitchDeckSlides() {
      const data = this.getAggregatedData();
      const pdr = data.pdr || {};
      const sections = Array.isArray(pdr.sections) ? pdr.sections : [];
      const values = Array.isArray(pdr.values) ? pdr.values : [];
      const teamMembers = Array.isArray(pdr.teamMembers) ? pdr.teamMembers : [];
      const customSlides = Array.isArray(pdr.customExecutiveSlides) ? pdr.customExecutiveSlides : [];
      const themeClass = this.currentTheme === 'clean_white' ? 'theme-exec-white' : 'theme-exec-dark';
      const target = this.targetAudience;
      const userIsAdmin = this.isAdmin();

      this.slides = [];

      // -------------------------------------------------------------
      // SLIDE 1: Cover Slide (الغلاف التنفيذي)
      // -------------------------------------------------------------
      this.slides.push({
        id: 'cover_slide',
        type: 'cover',
        title: 'غلاف العرض التنفيذي',
        category: 'المقدمة الرسمية',
        html: `
          <div class="slide-card ${themeClass} p-6 sm:p-12 rounded-3xl border flex flex-col justify-between min-h-[540px] relative overflow-hidden">
            <div class="absolute -top-24 -left-24 w-96 h-96 bg-gold/15 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <!-- Top Row -->
            <div class="flex items-center justify-between border-b border-gold/30 pb-4 relative z-10">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold/30 to-gold-dark/20 border border-gold/40 flex items-center justify-center text-gold text-xl shadow-lg shadow-gold/10 shrink-0">
                  <i class="fa-solid fa-feather-pointed"></i>
                </div>
                <div>
                  <span class="text-xs font-bold text-gray-400 block">المملكة العربية السعودية — محافظة الأحساء</span>
                  <strong class="text-sm text-gold tracking-wide">ملف العرض الاستثماري والحكومي المعتمد 2026</strong>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 text-xs font-bold">UNESCO World Heritage Site</span>
                <span class="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">PDR Database Ready 100%</span>
              </div>
            </div>

            <!-- Main Title Hero -->
            <div class="py-8 text-center space-y-4 relative z-10">
              <div class="inline-block px-4 py-1.5 rounded-full bg-gold/15 text-gold border border-gold/40 text-xs font-black mb-2">
                منظومة متحفية وتجربة تفاعلية غامرة • وثيقة تعريف المشروع PDR
              </div>
              <h1 class="text-4xl sm:text-6xl font-black text-white leading-tight">
                سِـرَاج الأَحْـسَـاء
              </h1>
              <h2 class="text-xl sm:text-2xl font-serif text-gold font-bold">
                «تاريخٌ يُروى.. وحاضرٌ يُعاش»
              </h2>
              <p class="text-xs sm:text-sm text-gray-300 max-w-3xl mx-auto leading-relaxed">
                بوابة هجر في صدر الإسلام، توثيق إرث المدارس الشرعية، ومختبر تجسيد رحلة الحواس السبعة بتقنيات الهولوجرام والواقع الافتراضي 4D.
              </p>
            </div>

            <!-- Slide Footer -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10 text-xs text-gray-400 relative z-10">
              <div class="flex items-center gap-2">
                <span class="font-bold text-white">مُعَدّ ومُوجّه إلى:</span>
                <span class="px-3 py-1 rounded-xl bg-white/10 text-gold font-bold border border-gold/30">${target}</span>
              </div>
              <div class="flex items-center gap-4">
                <span>تاريخ الإصدار: <strong class="text-white font-mono">${data.generatedDate}</strong></span>
                <span class="text-gold font-black">نسخة الاعتماد الرسمية</span>
              </div>
            </div>
          </div>
        `
      });

      // -------------------------------------------------------------
      // SLIDE 2: Executive Dashboard & Strategic KPIs (لوحة المؤشرات العامة)
      // -------------------------------------------------------------
      this.slides.push({
        id: 'dashboard_slide',
        type: 'dashboard',
        title: 'لوحة المؤشرات الاستراتيجية ونطاق PDR',
        category: 'المؤشرات العامة',
        html: `
          <div class="slide-card ${themeClass} p-6 sm:p-12 rounded-3xl border flex flex-col justify-between min-h-[540px]">
            <div class="flex items-center justify-between border-b border-gold/30 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-gold">02 / المؤشرات الكلية</span>
                <h3 class="text-lg font-black text-white">نطاق وثيقة PDR الشاملة وجاهزية المخرجات</h3>
              </div>
              <span class="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                نسبة الإنجاز الكلي: ${data.pdrStats.overallProgress}%
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
              <div class="p-5 rounded-2xl bg-black/40 border border-gold/30 space-y-2 text-center">
                <div class="text-3xl font-black text-gold font-mono">${sections.length || 17}</div>
                <div class="text-xs font-bold text-white">قسماً رئيساً معتمداً</div>
                <p class="text-[10px] text-gray-400">شاملة كافة محاور الهوية والتشغيل والمالية</p>
              </div>
              <div class="p-5 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-2 text-center">
                <div class="text-3xl font-black text-emerald-400 font-mono">${data.pdrStats.total || 95}+</div>
                <div class="text-xs font-bold text-white">مخرجاً تنفيذياً تفصيلياً</div>
                <p class="text-[10px] text-gray-400">مواثيق، تصاميم، سيناريوهات، وأطر عمل</p>
              </div>
              <div class="p-5 rounded-2xl bg-black/40 border border-blue-500/30 space-y-2 text-center">
                <div class="text-3xl font-black text-blue-400 font-mono">3</div>
                <div class="text-xs font-bold text-white">محاور تجربة متكاملة</div>
                <p class="text-[10px] text-gray-400">متحف دائم • سينما هولوجرام • واقع 4D</p>
              </div>
              <div class="p-5 rounded-2xl bg-black/40 border border-purple-500/30 space-y-2 text-center">
                <div class="text-3xl font-black text-purple-400 font-mono">250,000+</div>
                <div class="text-xs font-bold text-white">زائر مستهدف سنوياً</div>
                <p class="text-[10px] text-gray-400">سياحة ثقافية، باحثون، ووفود دولية</p>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-gold/10 border border-gold/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-300">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-chart-line text-gold text-lg"></i>
                <span><strong>الأثر الاقتصادي والاجتماعي:</strong> توليد وظائف متخصصة، تنشيط واحة الأحساء كوجهة عالمية، واستدامة وقفية معرفية.</span>
              </div>
              <span class="px-3 py-1 rounded-xl bg-gold text-black font-black text-[11px] shrink-0">جاهز للاستثمار</span>
            </div>
          </div>
        `
      });

      // -------------------------------------------------------------
      // SLIDE 3: Core Values & Strategic Vision (قيم المشروع والرؤية)
      // -------------------------------------------------------------
      this.slides.push({
        id: 'values_slide',
        type: 'values',
        title: 'الرؤية والرسالة والقيم الجوهرية',
        category: 'الهوية والقيم',
        html: `
          <div class="slide-card ${themeClass} p-6 sm:p-12 rounded-3xl border flex flex-col justify-between min-h-[540px]">
            <div class="flex items-center justify-between border-b border-gold/30 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-gold">03 / الهوية والقيم</span>
                <h3 class="text-lg font-black text-white">القيم الجوهرية الست المؤسسة لمنظومة سراج الأحساء</h3>
              </div>
              <span class="text-xs text-gray-400">وثيقة PDR • الرؤية المؤسسية</span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6 text-xs">
              ${values.map((v, i) => `
                <div class="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-2 hover:border-gold/50 transition-all">
                  <div class="flex items-center justify-between">
                    <div class="w-9 h-9 rounded-xl bg-gold/20 text-gold flex items-center justify-center text-sm font-black">
                      <i class="fa-solid ${v.icon || 'fa-certificate'}"></i>
                    </div>
                    <span class="text-[10px] font-mono text-gray-500 font-bold">0${i+1}</span>
                  </div>
                  <h4 class="text-sm font-black text-gold">${v.title || v.name || 'قيمة استراتيجية'}</h4>
                  <p class="text-[11px] text-gray-300 leading-relaxed">${v.description || v.desc || ''}</p>
                </div>
              `).join('')}
            </div>

            <div class="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-gray-400">
              <span>«تجسيد هجر في صدر الإسلام برؤية معاصرة وتقنيات عالمية»</span>
              <span class="text-gold font-bold font-mono">Vision 2030 Aligned</span>
            </div>
          </div>
        `
      });

      // -------------------------------------------------------------
      // SLIDES 4 TO 20: ALL 17 PDR SECTIONS DYNAMICALLY FROM DATABASE
      // -------------------------------------------------------------
      sections.forEach((sec, sIdx) => {
        const slideNumber = sIdx + 4;
        const slidePad = String(slideNumber).padStart(2, '0');
        const items = Array.isArray(sec.items) ? sec.items : [];
        const secIcon = sec.icon || 'fa-folder-tree';
        const secTitleAr = sec.titleAr || sec.nameAr || 'قسم وثيقة PDR';
        const secTitleEn = sec.titleEn || sec.nameEn || 'PDR Section';
        const secSummary = sec.executiveSummary || sec.descriptionAr || sec.description || 'مخرجات وبنود هذا القسم معتمدة وموثقة بالكامل ضمن دراسة المشروع.';

        this.slides.push({
          id: sec.id,
          type: 'pdr_section',
          sectionIndex: sIdx,
          title: secTitleAr,
          category: `القسم ${sec.number || sIdx + 1} من وثيقة PDR`,
          html: `
            <div class="slide-card ${themeClass} p-6 sm:p-10 rounded-3xl border flex flex-col justify-between min-h-[540px] relative">
              
              <!-- Top Header with Always-Visible Action Buttons for Admin -->
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gold/30 pb-3">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold/30 to-gold-dark/20 border border-gold/40 flex items-center justify-center text-gold text-lg font-black shrink-0">
                    <i class="fa-solid ${secIcon}"></i>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-mono font-bold text-gold">${slidePad} / القسم ${sec.number || sIdx + 1}</span>
                      <span class="px-2 py-0.5 rounded-full bg-white/10 text-gray-300 text-[10px] font-mono">${secTitleEn}</span>
                    </div>
                    <h3 class="text-lg sm:text-xl font-black text-white">${secTitleAr}</h3>
                  </div>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    ${items.length} مخرجات معتمدة
                  </span>
                  
                  <!-- Admin Only Direct Buttons -->
                  ${userIsAdmin ? `
                    <button onclick="window.App.executiveReportGenerator.openEditSlideModal('${sec.id}', 'pdr_section')" class="px-3 py-1.5 rounded-xl bg-gold/20 hover:bg-gold text-gold hover:text-black border border-gold/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm" title="تعديل عنوان ووصف القسم">
                      <i class="fa-solid fa-pen"></i>
                      <span>تعديل القسم</span>
                    </button>

                    <button onclick="window.App.executiveReportGenerator.openAddItemModal('${sec.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm" title="إضافة مخرج أو بند تنفيذي لهذا القسم">
                      <i class="fa-solid fa-plus"></i>
                      <span>إضافة مخرج</span>
                    </button>
                  ` : ''}
                </div>
              </div>

              <!-- Executive Summary Paragraph -->
              <div class="my-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 leading-relaxed">
                <strong class="text-gold ml-1">الملخص التنفيذي للقسم:</strong>
                <span>${secSummary}</span>
              </div>

              <!-- Deliverable Items Grid (Cards with Edit & Delete Buttons for Admin) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 my-2 max-h-[300px] overflow-y-auto pr-1">
                ${items.map((it, itemIdx) => `
                  <div class="p-3.5 rounded-2xl bg-black/50 border border-white/10 hover:border-gold/40 transition-all flex flex-col justify-between space-y-2 relative group">
                    <div>
                      <div class="flex items-center justify-between text-[11px] mb-1.5">
                        <span class="font-mono text-gray-500 font-bold">#0${itemIdx+1}</span>
                        <div class="flex items-center gap-1">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ${it.status === 'approved' ? 'معتمد 100%' : (it.status || 'منجز')}
                          </span>
                        </div>
                      </div>
                      <h4 class="text-xs font-black text-white line-clamp-1 group-hover:text-gold transition-colors">
                        ${it.title || it.text || 'مخرج تنفيذي'}
                      </h4>
                      <p class="text-[11px] text-gray-300 line-clamp-2 leading-relaxed mt-1">
                        ${it.deliverableContent || it.deliverables || it.description || it.text || 'المخرج معتمد وموثق.'}
                      </p>
                    </div>

                    <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
                      <span>مسؤول: <strong class="text-gold">${it.assignedTo || it.lead || 'إدارة المشروع'}</strong></span>
                      <span class="font-mono text-emerald-400 font-bold">${it.progress || 100}%</span>
                    </div>

                    <!-- Card Actions (Admin Only) -->
                    ${userIsAdmin ? `
                      <div class="absolute top-2 left-2 flex items-center gap-1 bg-black/90 p-1 rounded-xl border border-gold/40 shadow-lg opacity-80 group-hover:opacity-100 transition-all">
                        <button onclick="window.App.executiveReportGenerator.openEditItemModal('${sec.id}', '${it.id}')" class="w-6 h-6 rounded-lg bg-gold/25 hover:bg-gold text-gold hover:text-black flex items-center justify-center text-[10px] cursor-pointer" title="تعديل هذا المخرج">
                          <i class="fa-solid fa-pen"></i>
                        </button>
                        <button onclick="window.App.executiveReportGenerator.deleteDeliverableItem('${sec.id}', '${it.id}')" class="w-6 h-6 rounded-lg bg-red-900/40 hover:bg-red-600 text-red-200 hover:text-white flex items-center justify-center text-[10px] cursor-pointer" title="حذف هذا المخرج">
                          <i class="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>

              <!-- Footer Section Info -->
              <div class="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2">
                <div class="flex items-center gap-3">
                  <span>الإدارة المشرفة: <strong class="text-white">${sec.leadDepartment || 'لجنة المشروع المشتركة'}</strong></span>
                  <span>الموقع: <strong class="text-gold">واحة الأحساء</strong></span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[11px] text-gray-500 font-mono">Section Code: ${sec.id}</span>
                  <span class="text-gold font-bold font-mono">Status: Active & Verified</span>
                </div>
              </div>

            </div>
          `
        });
      });

      // -------------------------------------------------------------
      // SLIDE: Mobile Truck Specs & Logistics (شاحنة المعرض المتنقل)
      // -------------------------------------------------------------
      this.slides.push({
        id: 'mobile_truck_slide',
        type: 'mobile_truck',
        title: 'شاحنة المعرض التفاعلي المتنقل',
        category: 'الوصول والانتشار',
        html: `
          <div class="slide-card ${themeClass} p-6 sm:p-12 rounded-3xl border flex flex-col justify-between min-h-[540px]">
            <div class="flex items-center justify-between border-b border-gold/30 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-gold">المعرض المتنقل</span>
                <h3 class="text-lg font-black text-white">شاحنة «سراج الأحساء» التفاعلية المتنقلة للمدارس والفعاليات</h3>
              </div>
              <span class="px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold border border-gold/30">Mobile Outreach Truck</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 my-6 text-xs">
              <div class="p-5 rounded-2xl bg-black/40 border border-gold/30 space-y-3">
                <div class="w-10 h-10 rounded-xl bg-gold/20 text-gold flex items-center justify-center text-lg font-black">
                  <i class="fa-solid fa-truck-ramp-box"></i>
                </div>
                <h4 class="text-base font-black text-gold">المواصفات الفنية للشاحنة</h4>
                <ul class="space-y-1.5 text-gray-300 text-[11px]">
                  <li>• طول الحاوية الهيدروليكية: 13.6 متراً مع توسعة جانبية مزدوجة.</li>
                  <li>• مولد طاقة فائق الهدوء + منظومة تكييف مناخي عالية الكفاءة.</li>
                  <li>• شبكة اتصالات 5G وربط سحابي مباشر مع مركز العمليات.</li>
                </ul>
              </div>

              <div class="p-5 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-black">
                  <i class="fa-solid fa-vr-cardboard"></i>
                </div>
                <h4 class="text-base font-black text-emerald-400">التجهيزات الغامرة بالداخل</h4>
                <ul class="space-y-1.5 text-gray-300 text-[11px]">
                  <li>• 8 كراسي سينما 4D VR حركية مع مؤثرات رياح ورذاذ.</li>
                  <li>• هرم هولوجرام لعرض مقتنيات هجر النادرة ونماذج الأواني.</li>
                  <li>• شاشات لمس تفاعلية لاستعراض شجرة أسانيد علماء الأحساء.</li>
                </ul>
              </div>

              <div class="p-5 rounded-2xl bg-black/40 border border-blue-500/30 space-y-3">
                <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-lg font-black">
                  <i class="fa-solid fa-route"></i>
                </div>
                <h4 class="text-base font-black text-blue-400">خطة الجولات والوصول</h4>
                <ul class="space-y-1.5 text-gray-300 text-[11px]">
                  <li>• زيارة أكثر من 120 مدرسة وجامعة سنوياً في المنطقة الشرقية.</li>
                  <li>• المشاركة في المهرجانات الوطنية والمواسم السياحية الكبرى.</li>
                  <li>• تغطية المناطق النائية والوصول لـ 75,000 مستفيد سنوياً.</li>
                </ul>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-gray-300">
              <span>تسهم الشاحنة في مضاعفة أثر المشروع الثقافي ورفع الوعي المجتمعي قبل وأثناء تشغيل المعرض الدائم.</span>
              <span class="text-gold font-bold font-mono">High Community Outreach</span>
            </div>
          </div>
        `
      });

      // -------------------------------------------------------------
      // SLIDE: Team & Advisory Board (فريق العمل والاستشارات)
      // -------------------------------------------------------------
      this.slides.push({
        id: 'team_slide',
        type: 'team',
        title: 'الهيكل الإداري وفريق القيادة والاستشارات',
        category: 'الحوكمة وفريق العمل',
        html: `
          <div class="slide-card ${themeClass} p-6 sm:p-10 rounded-3xl border flex flex-col justify-between min-h-[540px]">
            <div class="flex items-center justify-between border-b border-gold/30 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-gold">فريق العمل والحوكمة</span>
                <h3 class="text-lg font-black text-white">نخبة الكفاءات واللجان الاستشارية المشرفة على المشروع</h3>
              </div>
              <span class="px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold border border-gold/30">
                ${teamMembers.length} قيادياً وخبيراً
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 my-4 max-h-[320px] overflow-y-auto pr-1 text-xs">
              ${teamMembers.map(m => `
                <div class="p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-gold/40 transition-all space-y-1.5">
                  <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-gold-dark/20 text-gold flex items-center justify-center font-bold text-xs shrink-0 border border-gold/30">
                      ${(m.nameAr || m.name || 'ف').charAt(0)}
                    </div>
                    <div>
                      <h4 class="text-xs font-black text-white line-clamp-1">${m.nameAr || m.name || 'عضو الفريق'}</h4>
                      <span class="text-[10px] text-gold font-bold block line-clamp-1">${m.roleAr || m.role || 'مستشار'}</span>
                    </div>
                  </div>
                  <p class="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">${m.bio || m.department || 'إدارة التخطيط والتطوير'}</p>
                </div>
              `).join('')}
            </div>

            <div class="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-gray-400">
              <span>إشراف أكاديمي وشرعي وتاريخي محكّم يضمن أصالة المحتوى ودقة المخرجات.</span>
              <span class="text-gold font-bold font-mono">Multi-Disciplinary Board</span>
            </div>
          </div>
        `
      });

      // -------------------------------------------------------------
      // CUSTOM SLIDES (Created dynamically by Admin)
      // -------------------------------------------------------------
      customSlides.forEach((cs, cIdx) => {
        this.slides.push({
          id: cs.id,
          type: 'custom',
          customIndex: cIdx,
          title: cs.title || 'شريحة مخصصة',
          category: cs.category || 'شريحة مخصصة',
          html: `
            <div class="slide-card ${themeClass} p-6 sm:p-12 rounded-3xl border flex flex-col justify-between min-h-[540px] relative">
              <div class="flex items-center justify-between border-b border-gold/30 pb-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-gold/20 text-gold flex items-center justify-center text-lg font-black shrink-0">
                    <i class="fa-solid ${cs.icon || 'fa-star'}"></i>
                  </div>
                  <div>
                    <span class="text-xs font-black text-gold block">${cs.category || 'شريحة مخصصة'}</span>
                    <h3 class="text-lg sm:text-xl font-black text-white">${cs.title || 'عنوان الشريحة المخصصة'}</h3>
                  </div>
                </div>
                
                ${userIsAdmin ? `
                  <div class="flex items-center gap-2">
                    <button onclick="window.App.executiveReportGenerator.openEditSlideModal('${cs.id}', 'custom')" class="px-3.5 py-1.5 rounded-xl bg-gold/20 hover:bg-gold text-gold hover:text-black border border-gold/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                      <i class="fa-solid fa-pen"></i> <span>تعديل</span>
                    </button>
                    <button onclick="window.App.executiveReportGenerator.deleteCustomSlide('${cs.id}')" class="px-3.5 py-1.5 rounded-xl bg-red-900/40 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                      <i class="fa-solid fa-trash"></i> <span>حذف</span>
                    </button>
                  </div>
                ` : ''}
              </div>

              <div class="my-6 p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                <p class="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                  ${cs.content || cs.summary || 'محتوى الشريحة المخصصة...'}
                </p>
                ${cs.kpi ? `
                  <div class="p-4 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-between text-xs">
                    <span class="text-gray-300 font-bold">المستهدف الرقمي / القيمة المقدرة:</span>
                    <strong class="text-gold text-sm font-mono">${cs.kpi}</strong>
                  </div>
                ` : ''}
              </div>

              <div class="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                <span>تم الإنشاء بواسطة فريق إعداد العرض التنفيذي</span>
                <span class="text-gold font-bold font-mono">Custom Presentation Item</span>
              </div>
            </div>
          `
        });
      });

      // -------------------------------------------------------------
      // SLIDE: Closing & Partnership Call to Action (ختام العرض ودعوة الشراكة)
      // -------------------------------------------------------------
      this.slides.push({
        id: 'closing_slide',
        type: 'closing',
        title: 'ختام العرض وفرص الشراكة والرعاية',
        category: 'الخاتمة والشراكات',
        html: `
          <div class="slide-card ${themeClass} p-6 sm:p-12 rounded-3xl border flex flex-col justify-between min-h-[540px] text-center relative overflow-hidden">
            <div class="absolute -top-20 -left-20 w-80 h-80 bg-gold/15 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

            <div class="space-y-4 max-w-2xl mx-auto relative z-10 my-auto">
              <div class="w-16 h-16 rounded-3xl bg-gradient-to-br from-gold to-gold-dark text-black flex items-center justify-center font-black text-2xl mx-auto shadow-xl shadow-gold/30">
                <i class="fa-solid fa-handshake"></i>
              </div>
              <h3 class="text-2xl sm:text-3xl font-black text-white">
                معاً نُحيي إرث هجر... وننطلق به إلى العالم
              </h3>
              <p class="text-base sm:text-lg font-serif text-gold font-bold">
                «وما هجر إلا طرف من أطراف الجنة، وصدق رسول الله ﷺ»
              </p>
              <p class="text-xs sm:text-sm text-gray-300 leading-relaxed">
                ندعوكم للمشاركة في رعاية وتأسيس هذا المعلم الثقافي والمعرفي الرائد في محافظة الأحساء، ليكون وجهة ملهمة تعتز بماضينا وتصنع مستقبلاً سياحياً مستداماً.
              </p>
            </div>

            <!-- Partnership Box -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 max-w-3xl mx-auto w-full relative z-10 text-xs">
              <div class="p-4 rounded-2xl bg-black/60 border border-gold/30">
                <strong class="text-gold block mb-1">الرعاية والتسمية الرسمية</strong>
                <span class="text-gray-300 text-[11px]">أجنحة المعرض وقاعة الهولوجرام التفاعلية</span>
              </div>
              <div class="p-4 rounded-2xl bg-black/60 border border-emerald-500/30">
                <strong class="text-emerald-400 block mb-1">الشراكة التقنية والحلول</strong>
                <span class="text-gray-300 text-[11px]">حلول الـ 4D VR والأنظمة الذكية وإنترنت الأشياء</span>
              </div>
              <div class="p-4 rounded-2xl bg-black/60 border border-blue-500/30">
                <strong class="text-blue-400 block mb-1">الصندوق الوقفي المستدام</strong>
                <span class="text-gray-300 text-[11px]">أوقاف المخطوطات والمنح البحثية العلمية</span>
              </div>
            </div>

            <!-- Slide Footer -->
            <div class="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 relative z-10 gap-2">
              <span>فريق تطوير منظومة سراج الأحساء © 2026</span>
              <span class="text-gold font-black">جاهزون لتوقيع مذكرات التفاهم وانطلاق المرحلة التنفيذية 🚀</span>
            </div>
          </div>
        `
      });

      // Update thumbnails container
      const thumbsContainer = document.getElementById('exec-slides-thumbnails-container');
      if (thumbsContainer) {
        thumbsContainer.innerHTML = this.slides.map((s, idx) => `
          <button onclick="window.App.executiveReportGenerator.goToSlide(${idx})" class="exec-thumb-pill px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all shrink-0 cursor-pointer ${idx === this.currentSlideIndex ? 'bg-gold text-black' : 'bg-white/5 text-gray-400 hover:text-white'}" title="${s.title}">
            ${idx + 1}
          </button>
        `).join('');
      }
    }

    renderPitchDeckSlide() {
      const container = document.getElementById('exec-render-content');
      const counter = document.getElementById('exec-slide-counter-badge');
      if (!container || !this.slides[this.currentSlideIndex]) return;

      const currentSlide = this.slides[this.currentSlideIndex];
      const userIsAdmin = this.isAdmin();

      if (counter) {
        counter.textContent = `شريحة ${this.currentSlideIndex + 1} من ${this.slides.length}`;
      }

      // Update thumbnails active state
      document.querySelectorAll('.exec-thumb-pill').forEach((btn, idx) => {
        if (idx === this.currentSlideIndex) {
          btn.classList.add('bg-gold', 'text-black');
          btn.classList.remove('bg-white/5', 'text-gray-400');
        } else {
          btn.classList.remove('bg-gold', 'text-black');
          btn.classList.add('bg-white/5', 'text-gray-400');
        }
      });

      // Action Bar displayed directly above each slide (Admin Only)
      const slideActionBarHtml = userIsAdmin ? `
        <div class="slide-action-toolbar mb-4 px-4 py-2.5 rounded-2xl bg-black/80 border border-gold/40 flex flex-wrap items-center justify-between gap-2 text-xs shadow-lg">
          <div class="flex items-center gap-2">
            <span class="text-gold font-bold flex items-center gap-1.5">
              <i class="fa-solid fa-crown text-gold"></i>
              <span>لوحة تحكم المدير (${this.currentSlideIndex + 1}/${this.slides.length}):</span>
            </span>
            <span class="text-white font-bold truncate max-w-xs">${currentSlide.title}</span>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <!-- Edit Slide Button -->
            <button onclick="window.App.executiveReportGenerator.openEditSlideModalCurrent()" class="px-3.5 py-1.5 rounded-xl bg-gold/20 hover:bg-gold text-gold hover:text-black border border-gold/40 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm" title="تعديل عنوان ومحتوى هذه الشريحة">
              <i class="fa-solid fa-pen"></i>
              <span>تعديل الشريحة</span>
            </button>

            <!-- Add Deliverable Button (if section) -->
            ${currentSlide.type === 'pdr_section' ? `
              <button onclick="window.App.executiveReportGenerator.openAddItemModalCurrent()" class="px-3.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm" title="إضافة مخرج أو بند جديد لهذا القسم">
                <i class="fa-solid fa-plus"></i>
                <span>إضافة مخرج للقسم</span>
              </button>
            ` : ''}

            <!-- Add New Slide Button -->
            <button onclick="window.App.executiveReportGenerator.openAddCustomSlideModal()" class="px-3.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-400/40 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm" title="إضافة شريحة مخصصة جديدة للعرض">
              <i class="fa-solid fa-plus-circle"></i>
              <span>إضافة شريحة ➕</span>
            </button>

            <!-- Delete Current Slide Button -->
            <button onclick="window.App.executiveReportGenerator.deleteCurrentSlide()" class="px-3.5 py-1.5 rounded-xl bg-red-900/40 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/40 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm" title="حذف هذه الشريحة">
              <i class="fa-solid fa-trash-can"></i>
              <span>حذف الشريحة 🗑️</span>
            </button>
          </div>
        </div>
      ` : '';

      container.innerHTML = `
        <div class="pitch-deck-slide-wrapper animate-fade-in max-w-5xl mx-auto">
          ${slideActionBarHtml}
          ${currentSlide.html}
        </div>
      `;
    }

    // =========================================================================
    // MODAL ACTIONS: ADMIN PROTECTED (EDIT, ADD, DELETE)
    // =========================================================================
    openEditSlideModalCurrent() {
      if (!this.isAdmin()) {
        this.showToast('⚠️ خاصية التعديل متاحة فقط لمدير النظام (Admin)');
        return;
      }
      const currentSlide = this.slides[this.currentSlideIndex];
      if (!currentSlide) return;
      this.openEditSlideModal(currentSlide.id, currentSlide.type);
    }

    openAddItemModalCurrent() {
      if (!this.isAdmin()) {
        this.showToast('⚠️ خاصية إضافة مخرجات متاحة فقط لمدير النظام (Admin)');
        return;
      }
      const currentSlide = this.slides[this.currentSlideIndex];
      if (!currentSlide || currentSlide.type !== 'pdr_section') return;
      this.openAddItemModal(currentSlide.id);
    }

    deleteCurrentSlide() {
      if (!this.isAdmin()) {
        this.showToast('⚠️ خاصية حذف الشرائح متاحة فقط لمدير النظام (Admin)');
        return;
      }

      const currentSlide = this.slides[this.currentSlideIndex];
      if (!currentSlide) return;

      const slideTitle = currentSlide.title || `شريحة ${this.currentSlideIndex + 1}`;
      if (!confirm(`هل أنت متأكد من رغبتك في حذف الشريحة «${slideTitle}» من العرض؟`)) {
        return;
      }

      const data = this.getAggregatedData().pdr;

      if (currentSlide.type === 'custom') {
        if (Array.isArray(data.customExecutiveSlides)) {
          data.customExecutiveSlides = data.customExecutiveSlides.filter(s => s.id !== currentSlide.id);
        }
      } else if (currentSlide.type === 'pdr_section') {
        if (Array.isArray(data.sections)) {
          data.sections = data.sections.filter(s => s.id !== currentSlide.id);
        }
      } else {
        this.showToast('ℹ️ لا يمكن حذف الشرائح الرئيسية النظامية');
        return;
      }

      if (this.currentSlideIndex > 0) {
        this.currentSlideIndex--;
      }
      this.saveModelChanges(`🗑️ تم حذف الشريحة «${slideTitle}» بنجاح`);
    }

    openEditSlideModal(slideId, type) {
      if (!this.isAdmin()) {
        this.showToast('⚠️ خاصية التعديل متاحة فقط لمدير النظام (Admin)');
        return;
      }

      const data = this.getAggregatedData();
      const modal = document.getElementById('exec-edit-slide-modal');
      const idInput = document.getElementById('exec-edit-slide-id');
      const typeInput = document.getElementById('exec-edit-slide-type');
      const titleArInput = document.getElementById('exec-edit-slide-title-ar');
      const titleEnInput = document.getElementById('exec-edit-slide-title-en');
      const summaryInput = document.getElementById('exec-edit-slide-summary');
      const iconInput = document.getElementById('exec-edit-slide-icon');

      if (!modal) return;

      idInput.value = slideId;
      typeInput.value = type;

      if (type === 'pdr_section') {
        const sec = (data.pdr.sections || []).find(s => s.id === slideId);
        if (sec) {
          titleArInput.value = sec.titleAr || '';
          titleEnInput.value = sec.titleEn || '';
          summaryInput.value = sec.executiveSummary || sec.descriptionAr || '';
          iconInput.value = sec.icon || 'fa-solid fa-folder-tree';
        }
      } else if (type === 'custom') {
        const cs = (data.pdr.customExecutiveSlides || []).find(s => s.id === slideId);
        if (cs) {
          titleArInput.value = cs.title || '';
          titleEnInput.value = cs.category || '';
          summaryInput.value = cs.content || cs.summary || '';
          iconInput.value = cs.icon || 'fa-solid fa-star';
        }
      } else {
        const currentSlide = this.slides[this.currentSlideIndex];
        titleArInput.value = (currentSlide && currentSlide.title) || '';
        titleEnInput.value = (currentSlide && currentSlide.category) || '';
        summaryInput.value = '';
        iconInput.value = 'fa-solid fa-layer-group';
      }

      this.closeSubModals();
      modal.style.display = 'flex';
    }

    saveSlideModalChanges() {
      if (!this.isAdmin()) {
        this.showToast('⚠️ خاصية التعديل متاحة فقط لمدير النظام (Admin)');
        return;
      }

      const id = document.getElementById('exec-edit-slide-id').value;
      const type = document.getElementById('exec-edit-slide-type').value;
      const titleAr = document.getElementById('exec-edit-slide-title-ar').value.trim();
      const titleEn = document.getElementById('exec-edit-slide-title-en').value.trim();
      const summary = document.getElementById('exec-edit-slide-summary').value.trim();
      const icon = document.getElementById('exec-edit-slide-icon').value.trim();

      const data = this.getAggregatedData().pdr;

      if (type === 'pdr_section') {
        const sec = (data.sections || []).find(s => s.id === id);
        if (sec) {
          if (titleAr) sec.titleAr = titleAr;
          if (titleEn) sec.titleEn = titleEn;
          sec.executiveSummary = summary;
          if (icon) sec.icon = icon;
        }
      } else if (type === 'custom') {
        const cs = (data.customExecutiveSlides || []).find(s => s.id === id);
        if (cs) {
          if (titleAr) cs.title = titleAr;
          if (titleEn) cs.category = titleEn;
          cs.content = summary;
          if (icon) cs.icon = icon;
        }
      }

      this.closeSubModals();
      this.saveModelChanges('✅ تم تعديل بيانات الشريحة ومزامنتها');
    }

    openAddItemModal(secId) {
      if (!this.isAdmin()) {
        this.showToast('⚠️ خاصية الإضافة متاحة فقط لمدير النظام (Admin)');
        return;
      }

      const modal = document.getElementById('exec-edit-item-modal');
      if (!modal) return;

      document.getElementById('exec-edit-item-modal-title').textContent = 'إضافة مخرج تنفيذي جديد للقسم (Admin)';
      document.getElementById('exec-edit-item-sec-id').value = secId;
      document.getElementById('exec-edit-item-id').value = '';
      document.getElementById('exec-edit-item-title').value = '';
      document.getElementById('exec-edit-item-deliverable').value = '';
      document.getElementById('exec-edit-item-assignee').value = 'اللجنة التاريخية';
      document.getElementById('exec-edit-item-progress').value = '100';
      document.getElementById('exec-edit-item-status').value = 'approved';
      document.getElementById('exec-edit-item-milestone').value = '2026-Q4';

      this.closeSubModals();
      modal.style.display = 'flex';
    }

    openEditItemModal(secId, itemId) {
      if (!this.isAdmin()) {
        this.showToast('⚠️ خاصية التعديل متاحة فقط لمدير النظام (Admin)');
        return;
      }

      const data = this.getAggregatedData();
      const sec = (data.pdr.sections || []).find(s => s.id === secId);
      if (!sec) return;
      const item = (sec.items || []).find(it => it.id === itemId);
      if (!item) return;

      const modal = document.getElementById('exec-edit-item-modal');
      if (!modal) return;

      document.getElementById('exec-edit-item-modal-title').textContent = 'تعديل بيانات المخرج التنفيذي (Admin)';
      document.getElementById('exec-edit-item-sec-id').value = secId;
      document.getElementById('exec-edit-item-id').value = itemId;
      document.getElementById('exec-edit-item-title').value = item.title || item.text || '';
      document.getElementById('exec-edit-item-deliverable').value = item.deliverableContent || item.deliverables || item.description || '';
      document.getElementById('exec-edit-item-assignee').value = item.assignedTo || item.lead || '';
      document.getElementById('exec-edit-item-progress').value = item.progress || 100;
      document.getElementById('exec-edit-item-status').value = item.status || 'approved';
      document.getElementById('exec-edit-item-milestone').value = item.milestoneDate || '2026-Q4';

      this.closeSubModals();
      modal.style.display = 'flex';
    }

    saveItemModalChanges() {
      if (!this.isAdmin()) {
        this.showToast('⚠️ خاصية الحفظ متاحة فقط لمدير النظام (Admin)');
        return;
      }

      const secId = document.getElementById('exec-edit-item-sec-id').value;
      const itemId = document.getElementById('exec-edit-item-id').value;
      const title = document.getElementById('exec-edit-item-title').value.trim() || 'مخرج تنفيذي جديد';
      const deliverable = document.getElementById('exec-edit-item-deliverable').value.trim() || title;
      const assignee = document.getElementById('exec-edit-item-assignee').value.trim() || 'إدارة المشروع';
      const progress = Number(document.getElementById('exec-edit-item-progress').value) || 100;
      const status = document.getElementById('exec-edit-item-status').value || 'approved';
      const milestone = document.getElementById('exec-edit-item-milestone').value.trim() || '2026-Q4';

      const data = this.getAggregatedData().pdr;
      const sec = (data.sections || []).find(s => s.id === secId);
      if (sec) {
        if (!Array.isArray(sec.items)) sec.items = [];
        if (itemId) {
          // Edit existing item
          const item = sec.items.find(it => it.id === itemId);
          if (item) {
            item.title = title;
            item.text = title;
            item.deliverableContent = deliverable;
            item.deliverables = deliverable;
            item.assignedTo = assignee;
            item.progress = progress;
            item.status = status;
            item.milestoneDate = milestone;
          }
        } else {
          // Add new item
          const newItem = {
            id: `${secId}_item_${Date.now()}`,
            title: title,
            text: title,
            deliverableContent: deliverable,
            deliverables: deliverable,
            assignedTo: assignee,
            progress: progress,
            status: status,
            milestoneDate: milestone,
            taskType: 'strategic_charter'
          };
          sec.items.push(newItem);
        }
      }

      this.closeSubModals();
      this.saveModelChanges('✅ تم حفظ بيانات المخرج ومزامنتها');
    }

    deleteDeliverableItem(secId, itemId) {
      if (!this.isAdmin()) {
        this.showToast('⚠️ خاصية الحذف متاحة فقط لمدير النظام (Admin)');
        return;
      }

      if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المخرج من القسم؟')) return;
      const data = this.getAggregatedData().pdr;
      const sec = (data.sections || []).find(s => s.id === secId);
      if (sec && Array.isArray(sec.items)) {
        sec.items = sec.items.filter(it => it.id !== itemId);
        this.saveModelChanges('🗑️ تم حذف المخرج بنجاح');
      }
    }

    openAddCustomSlideModal() {
      if (!this.isAdmin()) {
        this.showToast('⚠️ خاصية إضافة الشرائح متاحة فقط لمدير النظام (Admin)');
        return;
      }

      const modal = document.getElementById('exec-add-custom-slide-modal');
      if (!modal) {
        this.ensureModalMarkup();
      }
      const m = document.getElementById('exec-add-custom-slide-modal');
      document.getElementById('exec-custom-title').value = '';
      document.getElementById('exec-custom-category').value = 'مقترح استثماري مخصص';
      document.getElementById('exec-custom-content').value = '';
      document.getElementById('exec-custom-icon').value = 'fa-solid fa-star';
      document.getElementById('exec-custom-kpi').value = '';

      this.closeSubModals();
      if (m) m.style.display = 'flex';
    }

    saveNewCustomSlide() {
      if (!this.isAdmin()) {
        this.showToast('⚠️ خاصية إضافة الشرائح متاحة فقط لمدير النظام (Admin)');
        return;
      }

      const title = document.getElementById('exec-custom-title').value.trim();
      const category = document.getElementById('exec-custom-category').value.trim() || 'شريحة مخصصة';
      const content = document.getElementById('exec-custom-content').value.trim();
      const icon = document.getElementById('exec-custom-icon').value.trim() || 'fa-solid fa-star';
      const kpi = document.getElementById('exec-custom-kpi').value.trim();

      if (!title || !content) {
        alert('يرجى كتابة عنوان الشريحة ومحتواها التنفيذي');
        return;
      }

      const data = this.getAggregatedData().pdr;
      if (!Array.isArray(data.customExecutiveSlides)) {
        data.customExecutiveSlides = [];
      }

      const newSlide = {
        id: 'custom_slide_' + Date.now(),
        title: title,
        category: category,
        content: content,
        summary: content,
        icon: icon,
        kpi: kpi
      };

      data.customExecutiveSlides.push(newSlide);
      this.closeSubModals();

      // Go to new slide
      this.buildPitchDeckSlides();
      this.currentSlideIndex = Math.max(0, this.slides.length - 2); // Put right before closing slide
      this.saveModelChanges('🎉 تم إضافة الشريحة المخصصة الجديدة بنجاح');
    }

    deleteCustomSlide(slideId) {
      if (!this.isAdmin()) {
        this.showToast('⚠️ خاصية حذف الشرائح متاحة فقط لمدير النظام (Admin)');
        return;
      }

      if (!confirm('هل أنت متأكد من حذف هذه الشريحة المخصصة؟')) return;
      const data = this.getAggregatedData().pdr;
      if (Array.isArray(data.customExecutiveSlides)) {
        data.customExecutiveSlides = data.customExecutiveSlides.filter(s => s.id !== slideId);
        if (this.currentSlideIndex > 0) this.currentSlideIndex--;
        this.saveModelChanges('🗑️ تم حذف الشريحة المخصصة');
      }
    }

    // =========================================================================
    // 2. MASTER DOSSIER (A4 Document with 100% PDR Sections)
    // =========================================================================
    buildMasterDossierHtml() {
      const data = this.getAggregatedData();
      const themeClass = this.currentTheme === 'clean_white' ? 'theme-exec-white' : 'theme-exec-dark';
      const target = this.targetAudience;
      const sections = data.pdr.sections || [];

      return `
        <div class="master-dossier-document ${themeClass} p-8 sm:p-14 rounded-3xl border max-w-5xl mx-auto space-y-8 font-['Cairo'] shadow-2xl">
          
          <!-- Official Header -->
          <div class="flex items-center justify-between border-b-2 border-gold pb-6">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/30 to-gold-dark/20 border border-gold/40 flex items-center justify-center text-gold text-2xl shadow-lg shadow-gold/10 shrink-0">
                <i class="fa-solid fa-feather-pointed"></i>
              </div>
              <div class="space-y-1">
                <div class="text-xs font-black text-gold tracking-wider">المملكة العربية السعودية — محافظة الأحساء</div>
                <h1 class="text-2xl sm:text-3xl font-black text-white">مشروع منظومة «سِـرَاج الأَحْـسَـاء»</h1>
                <h2 class="text-sm font-bold text-gold">الملف التنفيذي الشامل لوثيقة تعريف المشروع PDR (17 قسماً معتمداً)</h2>
              </div>
            </div>
            <div class="text-left space-y-1 text-xs text-gray-300">
              <div class="font-bold text-white font-mono">EXECUTIVE MASTER DOSSIER</div>
              <div class="text-gold font-mono font-bold">«تاريخٌ يُروى.. وحاضرٌ يُعاش»</div>
              <div class="font-mono text-gray-400">${data.generatedDate}</div>
            </div>
          </div>

          <!-- Document Meta Bar -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-black/40 border border-gold/30 text-xs">
            <div>
              <span class="text-gray-400 block text-[11px]">الجهة الموجه إليها:</span>
              <strong class="text-gold font-bold">${target}</strong>
            </div>
            <div>
              <span class="text-gray-400 block text-[11px]">أقسام وثيقة PDR:</span>
              <strong class="text-white font-bold">${sections.length} قسماً معتمداً بالكامل</strong>
            </div>
            <div>
              <span class="text-gray-400 block text-[11px]">الموقع المقترح:</span>
              <strong class="text-white font-bold">واحة الأحساء (اليونسكو)</strong>
            </div>
            <div>
              <span class="text-gray-400 block text-[11px]">حالة الاعتماد:</span>
              <strong class="text-emerald-400 font-bold">معتمد للدراسة والتنفيذ 100%</strong>
            </div>
          </div>

          <!-- Section 1: Executive Summary -->
          <div class="space-y-3">
            <h3 class="text-base font-black text-gold border-r-4 border-gold pr-2.5">أولاً: الملخص التنفيذي والغاية الاستراتيجية</h3>
            <p class="text-xs text-gray-300 leading-relaxed text-justify">
              يهدف مشروع <strong>«سراج الأحساء»</strong> إلى تأسيس معلم حضاري وثقافي رائد في محافظة الأحساء، يربط بين نصوص السيرة النبوية الشريفة ومكانة "هجر" التاريخية، وإبراز الإرث العلمي والشرعي المتفرد لمدارس الأحساء وأربطتها عبر العصور. يقوم المشروع على منظومة هجينة تجمع بين المتحف الدائم، سينما الهولوجرام التجسيمية، ومختبر تجسيد رحلة الحواس السبعة بالواقع الافتراضي 4D، مما يوفر تجربة سياحية ومعرفية واستثمارية مستدامة تواكب مستهدفات رؤية 2030.
            </p>
          </div>

          <!-- Section 2: All 17 PDR Sections Breakdown -->
          <div class="space-y-4">
            <h3 class="text-base font-black text-gold border-r-4 border-gold pr-2.5">ثانياً: تفصيل مخرجات الأقسام الـ 17 المعتمدة لوثيقة PDR</h3>
            <div class="space-y-3">
              ${sections.map((sec, idx) => `
                <div class="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs">
                  <div class="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <strong class="text-gold font-bold text-sm">
                      ${sec.number || idx + 1}. ${sec.titleAr || sec.nameAr} 
                      <span class="text-gray-400 font-normal text-xs">(${sec.titleEn || ''})</span>
                    </strong>
                    <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      ${(sec.items || []).length} مخرجات
                    </span>
                  </div>
                  <p class="text-gray-300 text-[11px] leading-relaxed">${sec.executiveSummary || sec.descriptionAr || ''}</p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1.5">
                    ${(sec.items || []).map(it => `
                      <div class="p-2 rounded-lg bg-black/50 border border-white/5 text-[10px]">
                        <strong class="text-white block truncate">• ${it.title || it.text}</strong>
                        <span class="text-gray-400 block truncate">${it.deliverableContent || it.deliverables || 'مخرج معتمد'}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Approvals & Signatures -->
          <div class="grid grid-cols-2 gap-8 pt-8 border-t-2 border-gold text-xs">
            <div class="space-y-4">
              <div class="font-bold text-white">إعداد واعتماد إدارة المشروع:</div>
              <div class="space-y-1 text-gray-400">
                <div>الاسم: <strong>فريق تطوير منظومة سراج الأحساء</strong></div>
                <div>الصفة: <strong>إدارة التخطيط والدراسات الاستراتيجية</strong></div>
                <div class="pt-2 text-gold font-serif">«تاريخٌ يُروى.. وحاضرٌ يُعاش»</div>
              </div>
            </div>
            <div class="space-y-4 text-left">
              <div class="font-bold text-white">الاعتماد النهائي والموافقة:</div>
              <div class="space-y-1 text-gray-400">
                <div>الجهة: <strong>مجلس الإدارة والشركاء الاستراتيجيون</strong></div>
                <div>الختم الرسمي والتوقيع: ____________________</div>
                <div class="pt-2 font-mono text-gray-500">${data.generatedDate}</div>
              </div>
            </div>
          </div>

        </div>
      `;
    }

    // =========================================================================
    // 3. TECHNICAL PDR BRIEF (17 Sections Matrix & Deliverables)
    // =========================================================================
    buildPdrTechnicalHtml() {
      const data = this.getAggregatedData();
      const themeClass = this.currentTheme === 'clean_white' ? 'theme-exec-white' : 'theme-exec-dark';
      const sections = data.pdr.sections || [];

      return `
        <div class="pdr-technical-document ${themeClass} p-8 sm:p-12 rounded-3xl border max-w-5xl mx-auto space-y-6 font-['Cairo'] shadow-2xl">
          
          <div class="flex items-center justify-between border-b-2 border-gold pb-4">
            <div>
              <span class="text-xs font-mono font-bold text-gold">PROJECT DEFINITION REPORT (PDR) — TECHNICAL BRIEF</span>
              <h2 class="text-xl sm:text-2xl font-black text-white">مصفوفة المواصفات والمخرجات للأقسام الـ 17</h2>
            </div>
            <div class="text-left font-mono text-xs">
              <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                Overall Progress: ${data.pdrStats.overallProgress}%
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-black/40 border border-white/10 text-xs">
            <div>
              <span class="text-gray-400 block text-[11px]">إجمالي الأقسام:</span>
              <strong class="text-white font-mono text-sm">${sections.length} قسماً معتمداً</strong>
            </div>
            <div>
              <span class="text-gray-400 block text-[11px]">المخرجات المنفذة:</span>
              <strong class="text-emerald-400 font-mono text-sm">${data.pdrStats.total || 95} مخرجاً تنفيذياً</strong>
            </div>
            <div>
              <span class="text-gray-400 block text-[11px]">تاريخ المزامنة:</span>
              <strong class="text-gold font-mono text-sm">${data.generatedDate}</strong>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-sm font-black text-gold">فهرس الأقسام الـ 17 وحالة البنود التنفيذية</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-right border-collapse border border-white/15">
                <thead>
                  <tr class="bg-black/60 text-gold border-b border-white/20">
                    <th class="p-2.5 border-l border-white/15 text-center w-12">#</th>
                    <th class="p-2.5 border-l border-white/15">القسم الرئيسي والمخرج</th>
                    <th class="p-2.5 border-l border-white/15">عدد المخرجات</th>
                    <th class="p-2.5 border-l border-white/15">الإدارة المشرفة</th>
                    <th class="p-2.5 border-l border-white/15 text-center w-28">الحالة</th>
                  </tr>
                </thead>
                <tbody class="text-gray-300">
                  ${sections.map((s, idx) => `
                    <tr class="border-b border-white/10 hover:bg-white/5">
                      <td class="p-2.5 border-l border-white/15 text-center font-mono font-bold">${s.number || idx + 1}</td>
                      <td class="p-2.5 border-l border-white/15 font-bold">
                        ${s.titleAr || s.nameAr} 
                        <span class="text-gray-400 font-normal text-[11px]">(${s.titleEn || ''})</span>
                      </td>
                      <td class="p-2.5 border-l border-white/15 font-mono text-gold font-bold">${(s.items || []).length} مخرجات</td>
                      <td class="p-2.5 border-l border-white/15 text-[11px]">${s.leadDepartment || 'إدارة المشروع'}</td>
                      <td class="p-2.5 border-l border-white/15 text-center font-bold text-emerald-400">معتمد 100%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      `;
    }

    // =========================================================================
    // 4. INSTANT PDF EXPORT & PRINT LOGIC
    // =========================================================================
    exportPdf() {
      let printContainer = document.getElementById('exec-print-target-wrapper');
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'exec-print-target-wrapper';
        document.body.appendChild(printContainer);
      }

      this.buildPitchDeckSlides();
      const themeClass = this.currentTheme === 'clean_white' ? 'theme-exec-white' : 'theme-exec-dark';

      if (this.currentMode === 'pitch_deck') {
        printContainer.innerHTML = `
          <div class="print-slides-deck-container font-['Cairo']">
            ${this.slides.map((s, idx) => `
              <div class="print-slide-page-item ${themeClass}" style="page-break-after: always; break-after: page; padding: 24px; min-height: 98vh; display: flex; flex-direction: column; justify-content: center;">
                <div class="text-[10px] text-gray-500 font-mono mb-2 flex justify-between border-b pb-1">
                  <span>سراج الأحساء • ملف العرض الاستثماري والتنفيذي الشامل</span>
                  <span>شريحة ${idx + 1} من ${this.slides.length}</span>
                </div>
                ${s.html}
              </div>
            `).join('')}
          </div>
        `;
      } else if (this.currentMode === 'master_dossier') {
        printContainer.innerHTML = `
          <div class="print-dossier-container font-['Cairo'] p-4">
            ${this.buildMasterDossierHtml()}
          </div>
        `;
      } else {
        printContainer.innerHTML = `
          <div class="print-pdr-container font-['Cairo'] p-4">
            ${this.buildPdrTechnicalHtml()}
          </div>
        `;
      }

      document.body.classList.add('exec-printing-active');
      const originalTitle = document.title;
      document.title = `سراج_الأحساء_العرض_التنفيذي_${this.currentMode}_2026`;

      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.body.classList.remove('exec-printing-active');
          document.title = originalTitle;
          if (printContainer) printContainer.innerHTML = '';
        }, 1000);
      }, 250);
    }

    // =========================================================================
    // 5. STANDALONE HTML DECK DOWNLOAD
    // =========================================================================
    downloadStandaloneDeck() {
      this.buildPitchDeckSlides();

      const standaloneHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>سراج الأحساء — ملف العرض التنفيذي الشامل | Executive Pitch Deck</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Cairo', sans-serif; background: #080a13; color: #e2e8f0; margin: 0; padding: 0; }
    .gold-color { color: #dfb15b; }
    .border-gold { border-color: #dfb15b; }
    .bg-gold { background-color: #dfb15b; }
    .theme-exec-dark { background: #080a13; color: #f8fafc; border-color: rgba(223, 177, 91, 0.35); }
    .theme-exec-white { background: #ffffff; color: #0f172a; border-color: #e2e8f0; }
    .theme-exec-white h1, .theme-exec-white h2, .theme-exec-white h3, .theme-exec-white h4, .theme-exec-white strong { color: #0f172a !important; }
    .theme-exec-white p, .theme-exec-white span, .theme-exec-white li { color: #334155 !important; }
    @media print {
      .no-print { display: none !important; }
      .slide-page { page-break-after: always; break-after: page; min-height: 98vh; display: flex; flex-direction: column; justify-content: center; }
    }
  </style>
</head>
<body class="p-4 sm:p-8">
  <div class="max-w-5xl mx-auto space-y-6">
    <header class="p-4 rounded-2xl bg-black/80 border border-gold/30 flex items-center justify-between no-print">
      <div class="flex items-center gap-2">
        <span class="text-gold font-bold">سراج الأحساء • العرض التنفيذي الشامل المستقل (17 قسماً)</span>
      </div>
      <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-gold text-black font-black text-xs cursor-pointer">
        <i class="fa-solid fa-print"></i> طباعة / حفظ كـ PDF
      </button>
    </header>

    <div class="space-y-12">
      ${this.slides.map((s, idx) => `
        <div class="slide-page space-y-2">
          <div class="text-xs text-gray-500 font-mono text-left">شريحة ${idx + 1} / ${this.slides.length}</div>
          ${s.html}
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `سراج_الأحساء_Pitch_Deck_PDR_${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
    }
  }

  // Auto initialize on DOM Ready and attach to window.App and global shortcuts
  function bootGenerator() {
    if (!window.App.executiveReportGenerator) {
      window.App.ExecutiveReportGenerator = ExecutiveReportGenerator;
      window.App.executiveReportGenerator = new ExecutiveReportGenerator();
      window.App.openExecutiveGenerator = function(mode, target) {
        if (window.App.executiveReportGenerator) {
          if (target) window.App.executiveReportGenerator.targetAudience = target;
          window.App.executiveReportGenerator.open(mode);
        }
      };

      // Global window aliases
      window.execOpenAddSlide = () => window.App.executiveReportGenerator.openAddCustomSlideModal();
      window.execDeleteCurrentSlide = () => window.App.executiveReportGenerator.deleteCurrentSlide();
      window.execEditCurrentSlide = () => window.App.executiveReportGenerator.openEditSlideModalCurrent();
      window.execSaveSlide = () => window.App.executiveReportGenerator.saveSlideModalChanges();
      window.execSaveItem = () => window.App.executiveReportGenerator.saveItemModalChanges();
      window.execSaveCustomSlide = () => window.App.executiveReportGenerator.saveNewCustomSlide();
      window.execCloseSubModals = () => window.App.executiveReportGenerator.closeSubModals();

      console.log('⚡ Executive Report & Pitch Deck Engine (Admin-Restricted Access) initialized successfully.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootGenerator);
  } else {
    bootGenerator();
  }

})();
