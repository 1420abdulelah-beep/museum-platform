/* ==========================================================
   PROJECT DEFINITION REPORT (PDR) - VIEW LAYER
   واجهة العرض التفاعلية الشاملة لمنظومة سراج الأحساء واستوديو إنجاز المخرجات
   ========================================================== */

window.App = window.App || {};
var App = window.App;

App.PdrView = class {
  constructor() {
    this.container = document.getElementById("pdr-content-area");
  }

  render(model) {
    if (!this.container) return;

    const activeView = model.activeView;
    let contentHtml = "";

    // Render Stats Bar at Top
    this.renderHeaderStats(model);

    switch (activeView) {
      case "matrix":
        contentHtml = this.renderMatrixView(model);
        break;
      case "detailed":
        contentHtml = this.renderDetailedView(model);
        break;
      case "studio":
        contentHtml = this.renderStudioView(model);
        break;
      case "kanban":
        contentHtml = this.renderKanbanView(model);
        break;
      case "charts":
        contentHtml = this.renderChartsView(model);
        break;
      case "report":
        contentHtml = this.renderReportView(model);
        break;
      default:
        contentHtml = this.renderMatrixView(model);
    }

    this.container.innerHTML = contentHtml;
    this.updateViewTabsUI(activeView, model);
  }

  /* ---------------- HEADER STATS & ACTIVE TABS ---------------- */
  renderHeaderStats(model) {
    const stats = model.calculateGlobalStats();
    
    const elTotal = document.getElementById("stat-total-items");
    const elApproved = document.getElementById("stat-approved-items");
    const elInProgress = document.getElementById("stat-inprogress-items");
    const elReview = document.getElementById("stat-review-items");
    const elProgress = document.getElementById("stat-overall-progress");
    const elProgressBar = document.getElementById("stat-overall-progress-bar");
    const elSyncBadge = document.getElementById("server-sync-indicator");

    if (elTotal) elTotal.textContent = stats.totalItems;
    if (elApproved) elApproved.textContent = stats.approvedItems;
    if (elInProgress) elInProgress.textContent = stats.inProgressItems;
    if (elReview) elReview.textContent = stats.reviewItems;
    if (elProgress) elProgress.textContent = `${stats.overallProgress}%`;
    if (elProgressBar) elProgressBar.style.width = `${stats.overallProgress}%`;

    if (elSyncBadge) {
      if (model.serverSyncStatus === "saved") {
        elSyncBadge.className = "flex items-center gap-1.5 px-3 py-1 rounded-full bg-palm/15 border border-palm/30 text-palm text-xs font-bold";
        elSyncBadge.innerHTML = `<i class="fa-solid fa-cloud-check text-xs"></i><span>متزامن مع السيرفر</span>`;
      } else if (model.serverSyncStatus === "syncing") {
        elSyncBadge.className = "flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-bold animate-pulse";
        elSyncBadge.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin text-xs"></i><span>جاري الحفظ...</span>`;
      } else if (model.serverSyncStatus === "error") {
        elSyncBadge.className = "flex items-center gap-1.5 px-3 py-1 rounded-full bg-clay/15 border border-clay/30 text-clay text-xs font-bold";
        elSyncBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-xs"></i><span>حفظ محلي (أوفلاين)</span>`;
      } else {
        elSyncBadge.className = "flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold";
        elSyncBadge.innerHTML = `<i class="fa-solid fa-circle-dot text-xs text-palm"></i><span>جاهز للعمل</span>`;
      }
    }

    // Role badge
    const roleBadge = document.getElementById("auth-role-badge");
    if (roleBadge) {
      const info = model.getRoleBadge();
      roleBadge.style.color = info.color;
      roleBadge.style.borderColor = info.color + "55";
      roleBadge.style.backgroundColor = info.color + "15";
      roleBadge.innerHTML = `<i class="fa-solid ${info.icon}"></i><span>${info.label}</span>`;
    }
  }

  updateViewTabsUI(activeView, model) {
    document.querySelectorAll(".pdr-view-nav-btn").forEach(btn => {
      const view = btn.getAttribute("data-pdr-view");
      if (view === activeView) {
        btn.classList.add("active", "border-gold", "text-gold", "bg-gold/15", "shadow-lg", "shadow-gold/10");
        btn.classList.remove("text-gray-400", "border-white/10", "bg-white/5");
      } else {
        btn.classList.remove("active", "border-gold", "text-gold", "bg-gold/15", "shadow-lg", "shadow-gold/10");
        btn.classList.add("text-gray-400", "border-white/10", "bg-white/5");
      }
    });
  }

  /* ---------------- VIEW 1: MATRIX VIEW (4x4 GRID LIKE INFOGRAPHIC) ---------------- */
  renderMatrixView(model) {
    const sections = model.data.sections || [];
    const values = model.data.values || [];
    const appendices = model.data.appendices || [];
    const about = model.data.about || {};

    let gridHtml = `
      <div class="space-y-10 animate-fade-in">
        
        <!-- Banner Intro & Truck Mobile Unit Highlight -->
        <div class="p-6 sm:p-8 rounded-3xl bg-[radial-gradient(ellipse_at_top_right,rgba(223,177,91,0.18)_0%,rgba(8,10,19,0.95)_75%)] border border-gold/30 shadow-2xl relative overflow-hidden">
          <div class="absolute -top-10 -left-10 w-80 h-80 bg-laser/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div class="space-y-3 max-w-3xl">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/40 text-xs font-black flex items-center gap-1.5">
                  <i class="fa-solid fa-truck-moving"></i>
                  <span>المركز المتنقل لتجربة تاريخ الأحساء في صدر الإسلام</span>
                </span>
                <span class="text-xs text-gray-400">وثيقة تعريف المشروع الرسمية — PROJECT DEFINITION REPORT (PDR)</span>
              </div>
              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                مصفوفة أقسام المشروع الـ 17 واستوديو إنجاز الفريق
              </h2>
              <p class="text-sm text-gray-300 leading-relaxed">
                ${about.summaryAr || "مبادرة ثقافية غير ربحية تهدف إلى تقديم تجربة تاريخية متنقلة تفاعلية توثق تاريخ الأحساء في صدر الإسلام وتصل إلى جميع مناطق المملكة."}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3 shrink-0">
              <button class="btn-switch-to-studio px-5 py-2.5 rounded-2xl bg-gold text-black font-black text-sm hover:bg-white transition-all shadow-xl shadow-gold/20 flex items-center gap-2">
                <i class="fa-solid fa-laptop-code"></i>
                <span>استوديو إنجاز المخرجات وبيئة العمل ⚡</span>
              </button>
              <button class="btn-switch-to-detailed px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 transition-all flex items-center gap-2">
                <i class="fa-solid fa-list-check text-laser"></i>
                <span>العرض التفصيلي</span>
              </button>
            </div>
          </div>

          <!-- Quick Truck Pod Feature Badges -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
            <div class="flex items-center gap-2.5 text-gray-300">
              <div class="w-7 h-7 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0">
                <i class="fa-solid fa-truck"></i>
              </div>
              <span>مقطورة 16م بتوسعة هيدروليكية</span>
            </div>
            <div class="flex items-center gap-2.5 text-gray-300">
              <div class="w-7 h-7 rounded-lg bg-laser/15 text-laser flex items-center justify-center shrink-0">
                <i class="fa-solid fa-users"></i>
              </div>
              <span>استيعاب 35-40 زائراً بالجولة</span>
            </div>
            <div class="flex items-center gap-2.5 text-gray-300">
              <div class="w-7 h-7 rounded-lg bg-palm/15 text-palm flex items-center justify-center shrink-0">
                <i class="fa-solid fa-vr-cardboard"></i>
              </div>
              <span>شاشات 270° وهولوجرام 4D</span>
            </div>
            <div class="flex items-center gap-2.5 text-gray-300">
              <div class="w-7 h-7 rounded-lg bg-clay/15 text-clay flex items-center justify-center shrink-0">
                <i class="fa-solid fa-map-pin"></i>
              </div>
              <span>تغطية 20 مدينة بالمملكة</span>
            </div>
          </div>
        </div>

        <!-- The 16 Core PDR Sections in 4x4 Grid matching Infographic -->
        <div>
          <div class="flex items-center justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center font-black">
                <i class="fa-solid fa-border-all"></i>
              </div>
              <div>
                <h3 class="text-xl font-black text-white">أقسام ومخرجات المشروع الأساسية (${sections.length} قسماً)</h3>
                <p class="text-xs text-gray-400">انقر على أي قسم لفتح بيئة العمل التفاعلية وصياغة وإنجاز المخرج ومتابعة نسب التحقق</p>
              </div>
            </div>
            <span class="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 font-bold hidden sm:inline-block">
              مطابق لمصفوفة وثيقة PDR المعتمدة
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
    `;

    // Render each of the 16 sections
    sections.forEach(sec => {
      const stats = model.calculateSectionStats(sec.id);
      const owner = model.getTeamMember(sec.ownerId);

      let statusColor = "text-gold";
      let statusBg = "bg-gold/15 border-gold/30";
      let statusText = "قيد التطوير";

      if (stats.progress === 100) {
        statusColor = "text-palm";
        statusBg = "bg-palm/15 border-palm/30";
        statusText = "معتمد ومكتمل";
      } else if (stats.progress >= 70) {
        statusColor = "text-laser";
        statusBg = "bg-laser/15 border-laser/30";
        statusText = "متقدم بالإنجاز";
      }

      gridHtml += `
        <div class="pdr-matrix-card group relative p-5 rounded-2xl bg-black/55 border border-white/10 hover:border-gold/60 hover:bg-black/80 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-gold/10 flex flex-col justify-between cursor-pointer"
             data-section-id="${sec.id}" title="انقر لفتح قسم ${sec.titleAr}">
          
          <!-- Card Top: Number & Icon & Status -->
          <div>
            <div class="flex items-start justify-between gap-3 mb-3.5">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-xl bg-gradient-to-br from-gold/30 to-gold-dark/20 border border-gold/50 text-gold font-black text-sm flex items-center justify-center shadow-md">
                  ${sec.number}
                </span>
                <h4 class="text-base font-black text-white group-hover:text-gold transition-colors">
                  ${sec.titleAr}
                </h4>
              </div>
              <div class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-gray-300 flex items-center justify-center text-sm group-hover:bg-gold group-hover:text-black group-hover:border-gold transition-all shrink-0">
                <i class="fa-solid ${sec.icon}"></i>
              </div>
            </div>

            <p class="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">
              ${sec.descriptionAr}
            </p>

            <!-- Sub-items List Preview -->
            <div class="space-y-1.5 mb-4 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
              ${(sec.items || []).slice(0, 3).map(item => {
                const typeInfo = model.getTaskTypeInfo(item.taskType);
                return `
                  <div class="flex items-center justify-between gap-2 text-[11px] ${item.status === 'approved' ? 'text-gray-300' : 'text-gray-400'}">
                    <span class="flex items-center gap-1.5 truncate">
                      <i class="fa-solid ${item.status === 'approved' ? 'fa-check text-palm' : 'fa-circle-dot text-gold/60'} text-[9px]"></i>
                      <span class="truncate">${item.title}</span>
                    </span>
                    <span class="text-[10px] font-mono text-gray-500 shrink-0">${item.progress}%</span>
                  </div>
                `;
              }).join('')}
              ${(sec.items && sec.items.length > 3) ? `
                <div class="text-[10px] text-gold/80 font-bold pt-1 text-center">
                  + ${sec.items.length - 3} بنود ومخرجات إضافية...
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Card Bottom: Owner & Actions -->
          <div class="pt-3 border-t border-white/10 space-y-2.5">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5 text-gray-300">
                <span class="text-sm">${owner ? owner.avatar : '👤'}</span>
                <span class="text-[11px] font-semibold truncate max-w-[120px]">${owner ? owner.name : 'غير مسند'}</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBg} ${statusColor}">
                ${stats.progress}%
              </span>
            </div>

            <!-- Progress Bar -->
            <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-gold to-laser rounded-full transition-all duration-500"
                   style="width: ${stats.progress}%;"></div>
            </div>

            <div class="flex items-center justify-between pt-1">
              <span class="text-[10px] text-gray-500">${stats.approved} من ${stats.total} منجز</span>
              <button class="btn-open-section-in-studio px-2.5 py-1 rounded-lg bg-gold/15 hover:bg-gold hover:text-black text-gold text-[11px] font-black transition-all flex items-center gap-1"
                      data-section-id="${sec.id}" title="فتح بيئة العمل الخاصة بهذا القسم">
                <i class="fa-solid fa-laptop-code text-[10px]"></i>
                <span>بيئة العمل ⚡</span>
              </button>
            </div>
          </div>

        </div>
      `;
    });

    gridHtml += `
          </div>
        </div>

        <!-- Lower Section 1: Appendices (الملاحق الستة) -->
        <div class="p-6 sm:p-8 rounded-3xl bg-black/60 border border-white/10 space-y-6">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-laser/15 text-laser flex items-center justify-center text-lg">
                <i class="fa-solid fa-folder-open"></i>
              </div>
              <div>
                <h3 class="text-xl font-black text-white">ملاحق المشروع والملفات الميدانية (Appendices)</h3>
                <p class="text-xs text-gray-400">الرسوم الهندسية، الهوية البصرية، المصادر التاريخية، وخرائط المسار الميداني للشاحنة</p>
              </div>
            </div>
            <span class="badge bg-laser/15 text-laser border border-laser/30 text-xs px-3 py-1">6 ملاحق تشغيلية</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${appendices.map(app => `
              <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-laser/50 transition-all flex flex-col justify-between gap-3 group">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-xl bg-laser/10 border border-laser/30 text-laser flex items-center justify-center text-base shrink-0 group-hover:bg-laser group-hover:text-black transition-all">
                    <i class="fa-solid ${app.icon}"></i>
                  </div>
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] font-black text-gold">ملحق ${app.number}</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full bg-palm/15 text-palm border border-palm/30">${app.status}</span>
                    </div>
                    <h4 class="text-sm font-bold text-white">${app.titleAr}</h4>
                    <p class="text-xs text-gray-400 leading-relaxed">${app.descriptionAr}</p>
                  </div>
                </div>
                <div class="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                  <span class="text-[11px] text-laser font-semibold">${app.titleEn}</span>
                  <button class="btn-switch-to-studio text-gold hover:text-white font-bold text-xs flex items-center gap-1">
                    <span>بيئة الإنجاز</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Lower Section 2: Core Values (قيمنا) -->
        <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-darkerBg via-black/80 to-darkerBg border border-gold/20 space-y-6">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-lg">
              <i class="fa-solid fa-gem"></i>
            </div>
            <div>
              <h3 class="text-xl font-black text-white">قيمنا المؤسسية (Our Values)</h3>
              <p class="text-xs text-gray-400">المبادئ الستة التي تشكل ثقافة العمل في منظومة «سِـرَاج الأَحْـسَـاء»</p>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            ${values.map(val => `
              <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-gold/50 transition-all text-center space-y-2 group">
                <div class="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-xl shadow-lg transition-transform group-hover:scale-110"
                     style="background-color: ${val.color}22; color: ${val.color}; border: 1px solid ${val.color}44;">
                  <i class="fa-solid ${val.icon}"></i>
                </div>
                <h4 class="text-sm font-black text-white">${val.nameAr}</h4>
                <p class="text-[11px] text-gray-400 leading-snug">${val.descAr}</p>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    return gridHtml;
  }

  /* ---------------- VIEW 2: DETAILED VIEW (WORKROOM & ASSIGNMENTS) ---------------- */
  renderDetailedView(model) {
    const sections = model.data.sections || [];
    const teamMembers = model.getTeamMembers ? model.getTeamMembers() : (model.data.teamMembers || []);

    let html = `
      <div class="space-y-8 animate-fade-in">
        
        <!-- Filter & Search Bar Header -->
        <div class="p-5 rounded-2xl bg-black/70 border border-white/15 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          <!-- Search Input -->
          <div class="relative flex-1">
            <i class="fa-solid fa-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input type="text" id="pdr-search-input" value="${model.searchQuery || ''}"
                   placeholder="ابحث في كافة الأقسام، المخرجات، البنود، أو المسؤولين..."
                   class="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-gold focus:outline-none placeholder-gray-500">
          </div>

          <!-- Filter Dropdowns -->
          <div class="flex items-center gap-2 flex-wrap">
            
            <!-- Section Filter -->
            <select id="pdr-filter-section" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-gray-200 focus:border-gold focus:outline-none">
              <option value="all" ${model.filterSection === 'all' ? 'selected' : ''}>جميع الأقسام الـ ${sections.length}</option>
              ${sections.map(s => `
                <option value="${s.id}" ${model.filterSection === s.id ? 'selected' : ''}>قسم ${s.number}: ${s.titleAr}</option>
              `).join('')}
            </select>

            <!-- Assignee Filter -->
            <select id="pdr-filter-assignee" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-gray-200 focus:border-gold focus:outline-none">
              <option value="all" ${model.filterAssignee === 'all' ? 'selected' : ''}>كافة أعضاء الفريق</option>
              ${teamMembers.map(tm => `
                <option value="${tm.id}" ${model.filterAssignee === tm.id ? 'selected' : ''}>${tm.name} (${tm.role})</option>
              `).join('')}
            </select>

            <!-- Status Filter -->
            <select id="pdr-filter-status" class="px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-gray-200 focus:border-gold focus:outline-none">
              <option value="all" ${model.filterStatus === 'all' ? 'selected' : ''}>كافة الحالات</option>
              <option value="approved" ${model.filterStatus === 'approved' ? 'selected' : ''}>✅ معتمد ومكتمل</option>
              <option value="in_progress" ${model.filterStatus === 'in_progress' ? 'selected' : ''}>⏳ قيد العمل</option>
              <option value="review" ${model.filterStatus === 'review' ? 'selected' : ''}>🔍 بانتظار المراجعة</option>
              <option value="blocked" ${model.filterStatus === 'blocked' ? 'selected' : ''}>⏸️ متوقف / مؤجل</option>
            </select>

            ${model.isAdmin() ? `
            <button id="btn-open-add-member-modal" class="px-3 py-2.5 rounded-xl bg-gold/20 hover:bg-gold hover:text-black text-gold text-xs font-bold border border-gold/40 transition-all flex items-center gap-1.5" title="إدارة وسجل فريق العمل (مدير النظام)">
              <i class="fa-solid fa-users-gear text-gold"></i>
              <span>إدارة الفريق 👑</span>
            </button>
          ` : ''}
          </div>
        </div>

        <!-- Sections Deep Accordion / Cards List -->
        <div class="space-y-6">
    `;

    const sectionsToShow = model.filterSection === "all" 
      ? sections 
      : sections.filter(s => s.id === model.filterSection);

    if (sectionsToShow.length === 0) {
      html += `
        <div class="p-12 text-center rounded-2xl bg-black/40 border border-white/10 text-gray-400 space-y-3">
          <i class="fa-solid fa-folder-open text-4xl text-gold/40"></i>
          <p class="text-sm">لا توجد بنود مطابقة لخيارات الفلترة أو البحث الحالية.</p>
        </div>
      `;
    }

    sectionsToShow.forEach(sec => {
      const stats = model.calculateSectionStats(sec.id);
      const owner = model.getTeamMember(sec.ownerId);
      const isSelected = sec.id === model.selectedSectionId;

      const items = (sec.items || []).filter(item => {
        if (model.filterAssignee !== "all" && item.assignedTo !== model.filterAssignee) return false;
        if (model.filterStatus !== "all" && item.status !== model.filterStatus) return false;
        if (model.searchQuery) {
          const q = model.searchQuery.toLowerCase();
          const matchTitle = (item.title || "").toLowerCase().includes(q);
          const matchDesc = (item.description || "").toLowerCase().includes(q);
          const matchDeliverables = (item.deliverables || "").toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchDeliverables) return false;
        }
        return true;
      });

      html += `
        <div class="pdr-section-detail-card rounded-3xl bg-black/65 border ${isSelected ? 'border-gold/60 shadow-xl shadow-gold/10' : 'border-white/15'} overflow-hidden transition-all duration-300"
             id="section-card-${sec.id}">
          
          <!-- Section Master Header -->
          <div class="p-5 sm:p-6 bg-gradient-to-r from-white/[0.03] to-transparent border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div class="flex items-start gap-4">
              <span class="w-10 h-10 rounded-2xl bg-gold/20 border border-gold/40 text-gold font-black text-base flex items-center justify-center shadow-lg shrink-0">
                ${sec.number}
              </span>
              <div class="space-y-1">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h3 class="text-lg sm:text-xl font-black text-white">${sec.titleAr}</h3>
                  <span class="text-xs text-gray-400 font-mono">(${sec.titleEn})</span>
                  <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-laser font-bold">
                    ${sec.leadDepartment || 'إدارة المشروع'}
                  </span>
                </div>
                <p class="text-xs text-gray-300 leading-relaxed">${sec.descriptionAr}</p>
              </div>
            </div>

            <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 flex-wrap">
              
              <!-- Section Lead Pill (Interactive & Editable) -->
              <div class="pdr-section-lead-pill flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-gold/60 hover:bg-gold/10 text-xs text-gray-300 cursor-pointer transition-all duration-200 group"
                   data-section-id="${sec.id}" title="انقر لتعديل مشرف القسم وبياناته">
                <span class="text-base">${owner ? owner.avatar : '👤'}</span>
                <div class="flex flex-col text-right">
                  <div class="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span>مشرف القسم:</span>
                    <i class="fa-solid fa-pen text-[8px] text-gold opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </div>
                  <span class="font-bold text-[11px] text-white group-hover:text-gold transition-colors">${owner ? owner.name : 'غير مسند'}</span>
                </div>
              </div>

              <!-- Progress Badge -->
              <div class="flex flex-col items-end gap-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400">${stats.approved}/${stats.total} منجز</span>
                  <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-gold/20 text-gold border border-gold/40">
                    ${stats.progress}%
                  </span>
                </div>
                <div class="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-gold rounded-full transition-all duration-500" style="width: ${stats.progress}%;"></div>
                </div>
              </div>

              ${model.canEdit() ? `
              <!-- Action: Edit Section Button -->
              <button class="btn-edit-pdr-section px-3 py-2 rounded-xl bg-white/5 hover:bg-gold/20 hover:border-gold/50 text-gold text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      data-section-id="${sec.id}" title="تعديل اسم ووصف ومشرف هذا القسم">
                <i class="fa-solid fa-pen-to-square"></i>
                <span class="hidden sm:inline">تعديل القسم</span>
              </button>

              <!-- Action: Add Item Button -->
              <button class="btn-add-item-to-section px-3.5 py-2 rounded-xl bg-gold/15 hover:bg-gold hover:text-black text-gold text-xs font-bold border border-gold/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      data-section-id="${sec.id}" title="إضافة مخرج جديد لهذا القسم">
                <i class="fa-solid fa-plus"></i>
                <span class="hidden sm:inline">إضافة بند</span>
              </button>
              ` : ''}

            </div>
          </div>

          <!-- Sub-items List -->
          <div class="p-5 sm:p-6 space-y-4">
            ${items.length === 0 ? `
              <div class="p-6 text-center text-xs text-gray-400 border border-dashed border-white/10 rounded-2xl">
                لا توجد بنود تطابق شروط الفلترة في هذا القسم.
              </div>
            ` : items.map(item => {
              const assignee = model.getTeamMember(item.assignedTo);
              const typeInfo = model.getTaskTypeInfo(item.taskType);
              
              let statusBadge = "bg-gold/15 text-gold border-gold/30";
              let statusIcon = "fa-spinner fa-spin";
              let statusLabel = "قيد الإعداد";

              if (item.status === "approved") {
                statusBadge = "bg-palm/15 text-palm border-palm/30";
                statusIcon = "fa-check";
                statusLabel = "معتمد ومكتمل";
              } else if (item.status === "review") {
                statusBadge = "bg-laser/15 text-laser border-laser/30";
                statusIcon = "fa-magnifying-glass";
                statusLabel = "بانتظار المراجعة";
              } else if (item.status === "blocked") {
                statusBadge = "bg-clay/15 text-clay border-clay/30";
                statusIcon = "fa-pause";
                statusLabel = "متوقف / مؤجل";
              }

              return `
                <div class="p-4 sm:p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 group"
                     id="item-row-${item.id}">
                  
                  <!-- Item Content & Title -->
                  <div class="space-y-2 flex-1">
                    <div class="flex items-center gap-2.5 flex-wrap">
                      <span class="text-sm font-black text-white group-hover:text-gold transition-colors">
                        ${item.title}
                      </span>
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeInfo.badgeBg} flex items-center gap-1">
                        <i class="fa-solid ${typeInfo.icon} text-[9px]"></i>
                        <span>${typeInfo.nameAr}</span>
                      </span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge} flex items-center gap-1">
                        <i class="fa-solid ${statusIcon} text-[9px]"></i>
                        <span>${statusLabel}</span>
                      </span>
                    </div>

                    <p class="text-xs text-gray-300 leading-relaxed">
                      ${item.description}
                    </p>

                    ${item.deliverables ? `
                      <div class="flex items-center gap-1.5 text-[11px] text-gray-400 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 w-fit">
                        <i class="fa-solid fa-file-lines text-gold/80"></i>
                        <span class="font-semibold text-gray-300">المخرج الرسمي:</span>
                        <span>${item.deliverables}</span>
                      </div>
                    ` : ''}
                  </div>

                  <!-- Controls & Assignment Right Side -->
                  <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                    
                    <!-- Direct Open Studio Button -->
                    <button class="btn-open-item-in-studio px-3.5 py-2 rounded-xl bg-gold/20 hover:bg-gold hover:text-black text-gold border border-gold/40 text-xs font-black transition-all flex items-center gap-1.5 shadow-md"
                            data-section-id="${sec.id}" data-item-id="${item.id}" title="فتح بيئة العمل وعرض تفاصيل هذا المخرج">
                      <i class="fa-solid ${model.canEdit() ? 'fa-laptop-code' : 'fa-eye'} text-xs"></i>
                      <span>${model.canEdit() ? 'إنجاز المخرج ⚡' : 'استعراض المخرج 👁️'}</span>
                    </button>

                    <!-- Quick Assign Dropdown -->
                    <div class="flex items-center gap-1.5 bg-black/60 px-2.5 py-1.5 rounded-xl border border-white/10">
                      <span class="text-xs">${assignee ? assignee.avatar : '👤'}</span>
                      <select class="pdr-item-assignee-select bg-transparent text-xs text-gray-200 focus:outline-none ${model.canEdit() ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}"
                              ${model.canEdit() ? '' : 'disabled'}
                              data-section-id="${sec.id}" data-item-id="${item.id}">
                        ${teamMembers.map(tm => `
                          <option value="${tm.id}" ${item.assignedTo === tm.id ? 'selected' : ''}>${tm.name}</option>
                        `).join('')}
                      </select>
                    </div>

                    <!-- Progress Slider with Live % -->
                    <div class="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10">
                      <span class="text-[10px] text-gray-400">الإنجاز:</span>
                      <input type="range" min="0" max="100" step="5" value="${item.progress || 0}"
                             class="pdr-item-progress-slider w-20 sm:w-24 h-1.5 bg-white/20 rounded-lg appearance-none ${model.canEdit() ? 'cursor-pointer accent-gold' : 'cursor-not-allowed accent-gray-500 opacity-75'}"
                             ${model.canEdit() ? '' : 'disabled'}
                             data-section-id="${sec.id}" data-item-id="${item.id}">
                      <span class="text-xs font-mono font-bold text-gold w-8 text-left">${item.progress || 0}%</span>
                    </div>

                    ${model.canEdit() ? `
                    <!-- Edit and Delete Modal Buttons -->
                    <div class="flex items-center gap-1.5">
                      <button class="btn-edit-item w-8 h-8 rounded-lg bg-white/5 hover:bg-gold hover:text-black text-gray-300 flex items-center justify-center transition-all"
                              data-section-id="${sec.id}" data-item-id="${item.id}" title="تعديل تفاصيل البند">
                        <i class="fa-solid fa-pen-to-square text-xs"></i>
                      </button>
                      <button class="btn-delete-item w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500 hover:text-white text-gray-400 flex items-center justify-center transition-all"
                              data-section-id="${sec.id}" data-item-id="${item.id}" title="حذف هذا البند">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                    ` : ''}

                  </div>

                </div>
              `;
            }).join('')}
          </div>

        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /* ---------------- VIEW 3: DELIVERABLE EXECUTION STUDIO & WORKBENCH (NEW CORE FEATURE) ---------------- */
  renderStudioView(model) {
    const selectedData = model.getStudioSelectedData();
    const studioItems = model.getStudioFilteredItems();
    const teamMembers = model.getTeamMembers ? model.getTeamMembers() : (model.data.teamMembers || []);
    const sections = model.data.sections || [];

    if (!selectedData || !selectedData.item) {
      return `
        <div class="p-12 text-center rounded-3xl bg-black/60 border border-white/10 space-y-4">
          <i class="fa-solid fa-laptop-code text-5xl text-gold/40"></i>
          <h3 class="text-lg font-black text-white">لا توجد مخرجات محددة للعمل عليها</h3>
          <p class="text-xs text-gray-400">يرجى اختيار قسم أو بند لبدء العمل في الاستوديو</p>
        </div>
      `;
    }

    const { section: sec, item, typeInfo, assignee, owner } = selectedData;
    const isApproved = item.status === "approved";
    const checklist = Array.isArray(item.deliverableChecklist) ? item.deliverableChecklist : [];
    const workNotes = Array.isArray(item.workNotes) ? item.workNotes : [];

    const completedCheckCount = checklist.filter(c => c.completed).length;

    let html = `
      <div class="space-y-6 animate-fade-in">
        
        <!-- Studio Filter & Navigation Header -->
        <div class="p-5 rounded-3xl bg-black/80 border border-gold/30 shadow-2xl space-y-4">
          
          <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold/30 to-gold-dark/20 border border-gold/40 text-gold text-2xl flex items-center justify-center shadow-lg shadow-gold/10 shrink-0">
                <i class="fa-solid fa-laptop-code"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-xl font-black text-white">استوديو إنجاز المخرجات وبيئة العمل التفاعلية</h3>
                  <span class="px-2.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/40 text-[10px] font-black">Live Studio 2.0</span>
                </div>
                <p class="text-xs text-gray-400 mt-0.5">صياغة وإنجاز المخرجات الفعلية لأقسام المشروع الـ ${sections.length} والاطلاع على المنجز المعتمد وفق تصنيف المهمة</p>
              </div>
            </div>

            <!-- Quick Studio Metrics -->
            <div class="flex items-center gap-3 flex-wrap">
              <div class="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span class="text-gray-400">المخرجات المتاحة:</span>
                <span class="font-bold text-white mr-1">${studioItems.length}</span>
              </div>
              <div class="px-3.5 py-1.5 rounded-xl bg-palm/15 border border-palm/30 text-palm text-xs font-bold flex items-center gap-1.5">
                <i class="fa-solid fa-circle-check"></i>
                <span>مكتمل ومعتمد: ${model.calculateGlobalStats().approvedItems}</span>
              </div>
            </div>
          </div>

          <!-- Filter Pills Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
            
            <!-- Filter: Task Type -->
            <div>
              <label class="block text-[11px] font-bold text-gray-400 mb-1">نوع ومجال المهمة:</label>
              <select id="studio-filter-tasktype" class="w-full px-3 py-2 rounded-xl bg-darkBg border border-white/15 text-gray-200 text-xs focus:border-gold focus:outline-none">
                <option value="all" ${model.filterTaskType === 'all' ? 'selected' : ''}>كافة أنواع المهام الـ 6</option>
                <option value="historical_research" ${model.filterTaskType === 'historical_research' ? 'selected' : ''}>📚 محتوى وبحث تاريخي وشرعي</option>
                <option value="technical_specs" ${model.filterTaskType === 'technical_specs' ? 'selected' : ''}>💻 مواصفات هندسية وتقنية</option>
                <option value="strategic_charter" ${model.filterTaskType === 'strategic_charter' ? 'selected' : ''}>🏛️ مواثيق استراتيجية وحوكمة</option>
                <option value="operations_logistics" ${model.filterTaskType === 'operations_logistics' ? 'selected' : ''}>🚚 عمليات ميدانية ومسار ومخاطر</option>
                <option value="education_experience" ${model.filterTaskType === 'education_experience' ? 'selected' : ''}>🎓 برامج تعليمية وزوار و KPIs</option>
                <option value="financial_sustainability" ${model.filterTaskType === 'financial_sustainability' ? 'selected' : ''}>🤝 استدامة مالية ورعايات</option>
              </select>
            </div>

            <!-- Filter: Section -->
            <div>
              <label class="block text-[11px] font-bold text-gray-400 mb-1">القسم المستهدف:</label>
              <select id="studio-filter-section" class="w-full px-3 py-2 rounded-xl bg-darkBg border border-white/15 text-gray-200 text-xs focus:border-gold focus:outline-none">
                <option value="all" ${model.filterStudioSection === 'all' ? 'selected' : ''}>جميع الأقسام الـ ${sections.length}</option>
                ${sections.map(s => `
                  <option value="${s.id}" ${model.filterStudioSection === s.id ? 'selected' : ''}>قسم ${s.number}: ${s.titleAr}</option>
                `).join('')}
              </select>
            </div>

            <!-- Filter: Assignee -->
            <div>
              <label class="block text-[11px] font-bold text-gray-400 mb-1">المسؤول عن الإنجاز:</label>
              <select id="studio-filter-assignee" class="w-full px-3 py-2 rounded-xl bg-darkBg border border-white/15 text-gray-200 text-xs focus:border-gold focus:outline-none">
                <option value="all" ${model.filterStudioAssignee === 'all' ? 'selected' : ''}>كافة أعضاء الفريق</option>
                ${teamMembers.map(tm => `
                  <option value="${tm.id}" ${model.filterStudioAssignee === tm.id ? 'selected' : ''}>${tm.name} (${tm.role})</option>
                `).join('')}
              </select>
            </div>

            <!-- Search Inside Studio -->
            <div>
              <label class="block text-[11px] font-bold text-gray-400 mb-1">بحث سريع:</label>
              <div class="relative">
                <input type="text" id="studio-search-input" value="${model.searchQuery || ''}"
                       placeholder="ابحث في نص المخرج أو العنوان..."
                       class="w-full pr-8 pl-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-gold focus:outline-none placeholder-gray-500">
                <i class="fa-solid fa-magnifying-glass absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
              </div>
            </div>

          </div>
        </div>

        <!-- Main Studio Split Layout: 1/3 Navigator + 2/3 Active Workbench -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Column 1 (Left Navigator - 4 Cols) -->
          <div class="lg:col-span-4 rounded-3xl bg-black/65 border border-white/15 p-4 space-y-3 max-h-[850px] overflow-y-auto">
            <div class="flex items-center justify-between px-2 pb-2 border-b border-white/10 text-xs">
              <span class="font-bold text-gray-300">سجل مخرجات الأقسام (${studioItems.length})</span>
              <span class="text-[10px] text-gold font-bold">انقر للتفعيل</span>
            </div>

            <div class="space-y-2">
              ${studioItems.length === 0 ? `
                <div class="p-6 text-center text-xs text-gray-500 border border-dashed border-white/10 rounded-2xl">
                  لا توجد مخرجات مطابقة للفلاتر
                </div>
              ` : studioItems.map(stItem => {
                const isActive = stItem.id === item.id;
                const tm = model.getTeamMember(stItem.assignedTo);
                return `
                  <div class="studio-item-card p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border text-xs space-y-2
                              ${isActive ? 'bg-gold/10 border-gold shadow-lg shadow-gold/10' : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'}"
                       data-section-id="${stItem.sectionId}" data-item-id="${stItem.id}">
                    
                    <div class="flex items-start justify-between gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-black bg-white/5 border border-white/10 text-gold truncate">
                        قسم ${stItem.sectionNumber}: ${stItem.sectionTitleAr}
                      </span>
                      <span class="px-2 py-0.5 rounded-full text-[9px] font-bold border ${stItem.typeInfo.badgeBg}">
                        ${stItem.typeInfo.nameAr.split(' ')[0]}
                      </span>
                    </div>

                    <h5 class="text-xs font-bold text-white ${isActive ? 'text-gold' : ''} leading-snug">
                      ${stItem.title}
                    </h5>

                    <!-- Mini Progress & Assignee -->
                    <div class="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-white/5">
                      <span class="flex items-center gap-1 truncate">
                        <span>${tm ? tm.avatar : '👤'}</span>
                        <span class="truncate max-w-[100px]">${tm ? tm.name : 'غير مسند'}</span>
                      </span>
                      <span class="font-mono font-bold ${stItem.status === 'approved' ? 'text-palm' : 'text-gold'}">
                        ${stItem.progress}%
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Column 2 (Right Interactive Workbench - 8 Cols) -->
          <div class="lg:col-span-8 space-y-6">
            
            <!-- Workbench Card Container -->
            <div class="p-6 sm:p-8 rounded-3xl bg-black/75 border border-gold/40 shadow-2xl shadow-gold/10 space-y-6">
              
              <!-- Top Metadata & Control Bar -->
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/15">
                
                <div class="space-y-1.5 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-2.5 py-0.5 rounded-lg bg-gold/20 text-gold border border-gold/40 text-xs font-black">
                      قسم ${sec.number}: ${sec.titleAr}
                    </span>
                    <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold border ${typeInfo.badgeBg} flex items-center gap-1">
                      <i class="fa-solid ${typeInfo.icon}"></i>
                      <span>${typeInfo.nameAr}</span>
                    </span>
                    <span class="px-2 py-0.5 rounded-md text-xs font-mono font-bold ${isApproved ? 'bg-palm/20 text-palm border border-palm/40' : 'bg-gold/20 text-gold border border-gold/40'}">
                      ${isApproved ? '✅ معتمد رسمياً' : '⏳ قيد الإنجاز'}
                    </span>
                  </div>
                  <h2 class="text-xl sm:text-2xl font-black text-white leading-tight">
                    ${item.title}
                  </h2>
                </div>

                <!-- Mode Switcher & Export Actions -->
                <div class="flex items-center gap-2 flex-wrap shrink-0">
                  <div class="flex items-center p-1 rounded-2xl bg-white/5 border border-white/15 text-xs font-bold">
                    <button class="studio-tab-mode px-3 py-1.5 rounded-xl transition-all ${model.studioMode === 'editor' ? 'bg-gold text-black font-black shadow-md' : 'text-gray-400 hover:text-white'}"
                            data-studio-mode="editor">
                      <i class="fa-solid fa-pen-nib mr-1"></i>
                      <span>بيئة التحرير والإنجاز</span>
                    </button>
                    <button class="studio-tab-mode px-3 py-1.5 rounded-xl transition-all ${model.studioMode === 'preview' ? 'bg-gold text-black font-black shadow-md' : 'text-gray-400 hover:text-white'}"
                            data-studio-mode="preview">
                      <i class="fa-solid fa-eye mr-1"></i>
                      <span>معاينة المخرج المعتمد 👁️</span>
                    </button>
                  </div>
                </div>

              </div>

              <!-- Quick Control Row: Assignee & Progress -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 text-xs">
                
                <!-- Assignee -->
                <div class="flex items-center gap-2">
                  <span class="text-gray-400">المسؤول:</span>
                  <select id="studio-active-assignee" class="bg-black/60 px-2.5 py-1.5 rounded-xl border border-white/15 text-white font-semibold focus:outline-none flex-1 ${model.canEdit() ? '' : 'cursor-not-allowed opacity-75'}" ${model.canEdit() ? '' : 'disabled'}>
                    ${teamMembers.map(tm => `
                      <option value="${tm.id}" ${item.assignedTo === tm.id ? 'selected' : ''}>${tm.name}</option>
                    `).join('')}
                  </select>
                </div>

                <!-- Status -->
                <div class="flex items-center gap-2">
                  <span class="text-gray-400">الحالة:</span>
                  <select id="studio-active-status" class="bg-black/60 px-2.5 py-1.5 rounded-xl border border-white/15 text-white font-semibold focus:outline-none flex-1 ${model.canEdit() ? '' : 'cursor-not-allowed opacity-75'}" ${model.canEdit() ? '' : 'disabled'}>
                    <option value="in_progress" ${item.status === 'in_progress' ? 'selected' : ''}>⏳ قيد العمل</option>
                    <option value="review" ${item.status === 'review' ? 'selected' : ''}>🔍 للمراجعة</option>
                    <option value="approved" ${item.status === 'approved' ? 'selected' : ''}>✅ معتمد ومكتمل</option>
                    <option value="blocked" ${item.status === 'blocked' ? 'selected' : ''}>⏸️ متوقف</option>
                  </select>
                </div>

                <!-- Progress & Complete All Button -->
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 flex-1">
                    <span class="text-gray-400">الإنجاز:</span>
                    <input type="range" min="0" max="100" step="5" value="${item.progress || 0}" id="studio-active-progress"
                           class="w-full h-1.5 bg-white/20 rounded-lg appearance-none ${model.canEdit() ? 'cursor-pointer accent-gold' : 'cursor-not-allowed accent-gray-500 opacity-75'}" ${model.canEdit() ? '' : 'disabled'}>
                    <span id="studio-active-progress-val" class="font-mono font-bold text-gold text-xs">${item.progress || 0}%</span>
                  </div>
                  ${!isApproved && model.canEdit() ? `
                    <button id="btn-studio-approve-now" class="px-3 py-1.5 rounded-xl bg-palm hover:bg-white text-black font-black text-[11px] transition-all shrink-0 flex items-center gap-1 shadow-md shadow-palm/20"
                            title="اعتماد المخرج بنسبة 100% فورياً">
                      <i class="fa-solid fa-check-double"></i>
                      <span>اعتماد 100%</span>
                    </button>
                  ` : ''}
                </div>

              </div>

              <!-- ================= MODE 1: WORKBENCH EDITOR ================= -->
              ${model.studioMode === 'editor' ? `
                <div class="space-y-6">
                  
                  ${!model.canEdit() ? `
                    <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2">
                        <i class="fa-solid fa-lock text-sm"></i>
                        <span>وضع الاستعراض فقط (Viewer) — تصفح واستعراض المخرجات بدون إمكانية التعديل</span>
                      </div>
                      <span class="px-2.5 py-0.5 rounded-lg bg-white/10 text-[10px] text-gray-300 font-normal">استعراض محمي</span>
                    </div>
                  ` : ''}

                  <!-- 1. Deliverable Output Title & Main Content Area -->
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-black text-gold flex items-center gap-1.5">
                        <i class="fa-solid fa-file-pen"></i>
                        <span>المحتوى والمنجز الفعلي للمخرج (Deliverable Body & Outputs):</span>
                      </label>
                      <span class="text-[10px] text-gray-500 font-mono" id="studio-word-count">${model.canEdit() ? 'تحديث فوري تلقائي' : 'وضع القراءة فقط'}</span>
                    </div>

                    <div class="space-y-2">
                      <input type="text" id="studio-deliverable-name" value="${item.deliverables || ''}"
                             placeholder="اسم المخرج الملموس (مثال: وثيقة المراسلات النبوية وتخريجها)"
                             ${model.canEdit() ? '' : 'disabled readonly'}
                             class="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 text-white font-bold text-sm focus:border-gold focus:outline-none ${model.canEdit() ? '' : 'cursor-not-allowed opacity-80'}">
                      
                      <textarea id="studio-deliverable-content" rows="6"
                                placeholder="اكتب وصغ هنا المحتوى الفعلي، المنهجية، تفاصيل المخرج، البيانات، والمخرجات المكتملة..."
                                ${model.canEdit() ? '' : 'disabled readonly'}
                                class="w-full p-4 rounded-2xl bg-white/5 border border-white/15 text-white text-xs leading-relaxed focus:border-gold focus:outline-none font-['Cairo'] ${model.canEdit() ? '' : 'cursor-not-allowed opacity-80'}">${item.deliverableContent || ''}</textarea>
                    </div>
                  </div>

                  <!-- 2. Task-Type Specialized Engine Tools (Specialized per Type) -->
                  ${this.renderSpecializedToolbox(typeInfo.id, item, sec, model.canEdit())}

                  <!-- 3. Interactive Actionable Checklist -->
                  <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3.5">
                    <div class="flex items-center justify-between">
                      <h4 class="text-xs font-black text-white flex items-center gap-2">
                        <i class="fa-solid fa-list-check text-laser"></i>
                        <span>قائمة خطوات ومعايير التحقق الميداني (${completedCheckCount}/${checklist.length}):</span>
                      </h4>
                      <span class="text-[10px] text-gray-400">${model.canEdit() ? 'تحديث القائمة يُحدّث نسبة الإنجاز تلقائياً' : 'وضع العرض'}</span>
                    </div>

                    <!-- Checklist Items List -->
                    <div class="space-y-2" id="studio-checklist-container">
                      ${checklist.length === 0 ? `
                        <div class="p-3 text-center text-xs text-gray-500">لا توجد خطوات مدخلة حالياً</div>
                      ` : checklist.map(chk => `
                        <div class="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 transition-all text-xs">
                          <label class="flex items-center gap-2.5 ${model.canEdit() ? 'cursor-pointer' : 'cursor-not-allowed'} flex-1">
                            <input type="checkbox" class="studio-check-toggle w-4 h-4 rounded border-gray-600 text-gold focus:ring-gold accent-gold ${model.canEdit() ? '' : 'cursor-not-allowed'}"
                                   ${model.canEdit() ? '' : 'disabled'}
                                   data-check-id="${chk.id}" ${chk.completed ? 'checked' : ''}>
                            <span class="${chk.completed ? 'line-through text-gray-500 font-normal' : 'text-gray-200 font-semibold'}">${chk.text}</span>
                          </label>
                          ${model.canEdit() ? `
                          <button class="btn-delete-checklist-item text-gray-500 hover:text-red-400 transition-colors p-1"
                                  data-check-id="${chk.id}" title="حذف الخطوة">
                            <i class="fa-solid fa-xmark text-xs"></i>
                          </button>
                          ` : ''}
                        </div>
                      `).join('')}
                    </div>

                    ${model.canEdit() ? `
                    <!-- Add New Check Form -->
                    <div class="flex items-center gap-2 pt-2 border-t border-white/5">
                      <input type="text" id="input-new-check-text" placeholder="إضافة خطوة إنجاز جديدة..."
                             class="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-gold focus:outline-none">
                      <button id="btn-add-check-item" class="px-4 py-2 rounded-xl bg-gold text-black font-black text-xs hover:bg-white transition-all flex items-center gap-1">
                        <i class="fa-solid fa-plus"></i>
                        <span>إضافة</span>
                      </button>
                    </div>
                    ` : ''}
                  </div>

                  <!-- 4. Collaborative Audit Notes & Feedback Log -->
                  <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3.5">
                    <h4 class="text-xs font-black text-white flex items-center gap-2">
                      <i class="fa-solid fa-comments text-gold"></i>
                      <span>سجل ملاحظات العمل والتدقيق والاعتماد (${workNotes.length}):</span>
                    </h4>

                    <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                      ${workNotes.length === 0 ? `
                        <div class="p-3 text-center text-xs text-gray-500">لا توجد ملاحظات سابقة.</div>
                      ` : workNotes.map((n, idx) => {
                        const canManage = model.canEdit() && (model.isAdmin() || (model.currentUser && (model.currentUser.role === 'admin' || model.currentUser.role === 'editor' || model.currentUser.name === n.author)));
                        return `
                        <div class="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs space-y-1.5 group transition-all hover:border-gold/30">
                          <div class="flex items-center justify-between text-[10px] text-gray-400">
                            <div class="flex items-center gap-1.5">
                              <span class="font-bold text-gold">${n.author}</span>
                              ${n.editedAt ? `<span class="text-[9px] text-gray-500 font-mono">(معدل: ${n.editedAt})</span>` : ''}
                            </div>
                            <div class="flex items-center gap-2">
                              <span class="font-mono">${n.date}</span>
                              ${canManage ? `
                                <div class="flex items-center gap-1">
                                  <button class="btn-edit-work-note p-1 rounded hover:bg-gold/20 text-gray-400 hover:text-gold transition-all cursor-pointer"
                                          data-note-idx="${idx}" title="تعديل الملاحظة">
                                    <i class="fa-solid fa-pen-to-square text-[11px]"></i>
                                  </button>
                                  <button class="btn-delete-work-note p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                                          data-note-idx="${idx}" title="حذف الملاحظة">
                                    <i class="fa-solid fa-trash text-[11px]"></i>
                                  </button>
                                </div>
                              ` : ''}
                            </div>
                          </div>
                          <p class="text-gray-300 text-[11px] leading-relaxed note-content-text">${n.text}</p>
                        </div>
                        `;
                      }).join('')}
                    </div>

                    ${model.canEdit() ? `
                    <!-- Add Note Input -->
                    <div class="flex items-center gap-2 pt-2 border-t border-white/5">
                      <input type="text" id="input-new-work-note" placeholder="أضف ملاحظة تدقيق أو اعتماد على هذا المخرج..."
                             class="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:border-gold focus:outline-none">
                      <button id="btn-submit-work-note" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-gold hover:text-black text-white font-bold text-xs transition-all flex items-center gap-1">
                        <i class="fa-solid fa-paper-plane"></i>
                        <span>إرسال</span>
                      </button>
                    </div>
                    ` : ''}
                  </div>

                  ${model.canEdit() ? `
                  <!-- Save Button Bar -->
                  <div class="flex items-center justify-between pt-4 border-t border-white/10">
                    <span class="text-[11px] text-gray-400 flex items-center gap-1.5">
                      <i class="fa-solid fa-shield-check text-palm"></i>
                      <span>يتم الحفظ التلقائي مع السيرفر وقاعدة البيانات</span>
                    </span>

                    <div class="flex items-center gap-3">
                      <button id="btn-save-studio-work" class="px-6 py-2.5 rounded-xl bg-gold hover:bg-white text-black font-black text-xs transition-all shadow-lg shadow-gold/20 flex items-center gap-2">
                        <i class="fa-solid fa-floppy-disk"></i>
                        <span>حفظ التعديلات الفورية</span>
                      </button>
                    </div>
                  </div>
                  ` : ''}

                </div>
              ` : `
                <!-- ================= MODE 2: OFFICIAL DELIVERABLE INSPECTOR / PREVIEW ================= -->
                <div class="space-y-6">
                  
                  <!-- Action Toolbar -->
                  <div class="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 no-print">
                    <span class="text-xs text-gray-300 flex items-center gap-2">
                      <i class="fa-solid fa-stamp text-gold"></i>
                      <span>المعاينة الفورية للمخرج كوثيقة رسمية معتمدة</span>
                    </span>
                    
                    <div class="flex items-center gap-2 flex-wrap">
                      <button onclick="window.App && window.App.exportDeliverableToWord ? window.App.exportDeliverableToWord('${sec.id}', '${item.id}') : null" class="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md border border-blue-400/30 cursor-pointer" title="تصدير هذا المخرج كملف Word (.doc)">
                        <i class="fa-solid fa-file-word"></i>
                        <span>تصدير Word 📄</span>
                      </button>
                      <button id="btn-print-active-deliverable" class="px-4 py-2 rounded-xl bg-gold hover:bg-white text-black font-black text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer">
                        <i class="fa-solid fa-print"></i>
                        <span>طباعة الوثيقة الرسمية</span>
                      </button>
                      <button id="btn-copy-deliverable-text" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer">
                        <i class="fa-solid fa-copy"></i>
                        <span>نسخ النص</span>
                      </button>
                    </div>
                  </div>

                  <!-- Rendered Official Document Card -->
                  <div class="p-8 sm:p-10 rounded-3xl bg-white text-gray-900 border-2 border-gold shadow-2xl space-y-6 relative overflow-hidden font-['Cairo']" id="official-deliverable-sheet">
                    
                    <!-- Top Ribbon Seal -->
                    <div class="flex items-center justify-between border-b-2 border-gold/40 pb-4">
                      <div class="space-y-1">
                        <div class="text-[11px] font-black text-amber-800 tracking-wider">مشروع سِـرَاج الأَحْـسَـاء — تاريخٌ يُروى وحاضرٌ يُعاش</div>
                        <h3 class="text-xl sm:text-2xl font-black text-gray-900">${item.deliverables || item.title}</h3>
                        <div class="text-xs text-gray-500 font-bold">وثيقة مخرج رسمي معتمد • قسم ${sec.number}: ${sec.titleAr}</div>
                      </div>
                      
                      <!-- Formal Seal Badge -->
                      <div class="w-16 h-16 rounded-full border-2 border-dashed border-amber-600 bg-amber-50 flex flex-col items-center justify-center text-amber-800 shrink-0 text-center p-1">
                        <i class="fa-solid fa-award text-base"></i>
                        <span class="text-[8px] font-black leading-tight">معتمد رسمياً<br>2026</span>
                      </div>
                    </div>

                    <!-- Metadata Table -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                      <div>
                        <span class="text-gray-500 block text-[10px]">نوع المهمة:</span>
                        <span class="font-bold text-gray-900">${typeInfo.nameAr}</span>
                      </div>
                      <div>
                        <span class="text-gray-500 block text-[10px]">المسؤول عن الإنجاز:</span>
                        <span class="font-bold text-gray-900">${assignee ? assignee.name : 'فريق العمل'}</span>
                      </div>
                      <div>
                        <span class="text-gray-500 block text-[10px]">نسبة الإنجاز:</span>
                        <span class="font-bold text-amber-800 text-sm font-mono">${item.progress}%</span>
                      </div>
                      <div>
                        <span class="text-gray-500 block text-[10px]">تاريخ الاعتماد:</span>
                        <span class="font-bold text-gray-900 font-mono">${item.dueDate || '2026-10-01'}</span>
                      </div>
                    </div>

                    <!-- Main Content Text -->
                    <div class="space-y-3">
                      <h4 class="text-sm font-black text-amber-900 border-r-4 border-gold pr-2">نص ومنجز المخرج التنفيذي:</h4>
                      <div class="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs leading-relaxed text-gray-800 whitespace-pre-line">
                        ${item.deliverableContent || 'المحتوى قيد الصياغة والتطوير...'}
                      </div>
                    </div>

                    <!-- Checklist Verification Report -->
                    ${checklist.length > 0 ? `
                      <div class="space-y-2">
                        <h4 class="text-xs font-black text-amber-900 border-r-4 border-gold pr-2">سجل معايير التحقق والاستلام الميداني:</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          ${checklist.map(chk => `
                            <div class="p-2 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-2">
                              <i class="fa-solid ${chk.completed ? 'fa-check text-green-600' : 'fa-clock text-amber-600'} text-xs"></i>
                              <span class="${chk.completed ? 'text-gray-800 font-semibold' : 'text-gray-500'}">${chk.text}</span>
                            </div>
                          `).join('')}
                        </div>
                      </div>
                    ` : ''}

                    <!-- Formal Signatures Footer -->
                    <div class="grid grid-cols-2 gap-6 pt-6 border-t-2 border-gold/40 text-xs">
                      <div>
                        <span class="text-gray-500 block text-[10px]">إعداد ومراجعة:</span>
                        <div class="font-bold text-gray-900 mt-1">${assignee ? assignee.name : 'عضو الفريق التنفيذي'}</div>
                        <div class="text-[10px] text-gray-500">${assignee ? assignee.role : ''}</div>
                      </div>
                      <div class="text-left">
                        <span class="text-gray-500 block text-[10px]">الاعتماد والمصادقة:</span>
                        <div class="font-bold text-gray-900 mt-1">${owner ? owner.name : 'د. عبد المحسن المبارك'}</div>
                        <div class="text-[10px] text-gray-500">المشرف العام على المشروع</div>
                      </div>
                    </div>

                  </div>

                </div>
              `}

            </div>

          </div>

        </div>

      </div>
    `;

    return html;
  }

  /* ---------------- TASK-TYPE SPECIALIZED INTERACTIVE TOOLBOX ---------------- */
  renderSpecializedToolbox(typeId, item, sec, canEdit = true) {
    const spec = item.specializedData || {};
    const lockAttr = canEdit ? '' : 'disabled readonly';
    const lockClass = canEdit ? '' : 'cursor-not-allowed opacity-80';

    switch (typeId) {
      case "historical_research":
        return `
          <div class="p-5 rounded-2xl bg-gold/10 border border-gold/40 space-y-4 shadow-lg shadow-gold/5">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <h5 class="text-xs font-black text-gold flex items-center gap-2">
                <i class="fa-solid fa-book-quran text-sm"></i>
                <span>أدوات التدقيق التاريخي وتخريج الأحاديث والسيناريو ${canEdit ? '(قابلة للتعديل ✏️)' : '(استعراض فقط 👁️)'}:</span>
              </h5>
              <span class="text-[10px] px-2.5 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/40 font-mono font-bold">دارة الملك عبد العزيز • هيئة التراث</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="space-y-1.5 p-3 rounded-xl bg-black/50 border border-white/10">
                <label class="text-gold font-bold block text-[11px]">المراجع والمصادر التراثية المحكمة:</label>
                <textarea rows="2" class="studio-spec-field w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs leading-relaxed focus:border-gold focus:outline-none ${lockClass}"
                          ${lockAttr}
                          data-spec-key="references" placeholder="اكتب المراجع والمصادر...\nمثال: صحيح البخاري (3887)، تاريخ الطبري، معجم البلدان لياقوت الحموي.">${spec.references || 'صحيح البخاري (3887)، تاريخ الطبري، معجم البلدان لياقوت الحموي، ووثائق أبحاث مسجد جواثى.'}</textarea>
              </div>
              <div class="space-y-1.5 p-3 rounded-xl bg-black/50 border border-white/10">
                <label class="text-laser font-bold block text-[11px]">السيناريو الصوتي والتوقيت والمؤثرات:</label>
                <textarea rows="2" class="studio-spec-field w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs leading-relaxed focus:border-laser focus:outline-none ${lockClass}"
                          ${lockAttr}
                          data-spec-key="narrationScript" placeholder="اكتب تفاصيل السيناريو والتوقيت...\nمثال: نص تمثيلي مدته 3:45 دقائق مع مؤثرات الرياح والعيون.">${spec.narrationScript || 'نص تمثيلي مدته 3:45 دقائق مع مؤثرات الرياح والعيون والخطبة ومزامنة الإضاءة 270°.'}</textarea>
              </div>
            </div>
          </div>
        `;

      case "technical_specs":
        return `
          <div class="p-5 rounded-2xl bg-laser/10 border border-laser/40 space-y-4 shadow-lg shadow-laser/5">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <h5 class="text-xs font-black text-laser flex items-center gap-2">
                <i class="fa-solid fa-microchip text-sm"></i>
                <span>حاسبة أبعاد المقطورة وتجهيزات العرض ${canEdit ? '(قابلة للتعديل ✏️)' : '(استعراض فقط 👁️)'}:</span>
              </h5>
              <span class="text-[10px] px-2.5 py-0.5 rounded-full bg-laser/20 text-laser border border-laser/40 font-mono font-bold">SASO • ISO 9001</span>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div class="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label class="text-gray-400 block text-[10px]">طول الشاحنة:</label>
                <input type="text" class="studio-spec-field w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white font-bold text-xs text-center focus:border-laser focus:outline-none ${lockClass}"
                       ${lockAttr}
                       data-spec-key="truckLength" value="${spec.truckLength || '16.2 متراً'}">
              </div>
              <div class="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label class="text-gray-400 block text-[10px]">العرض بالتوسعة:</label>
                <input type="text" class="studio-spec-field w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white font-bold text-xs text-center focus:border-laser focus:outline-none ${lockClass}"
                       ${lockAttr}
                       data-spec-key="expansionWidth" value="${spec.expansionWidth || '4.8 متراً'}">
              </div>
              <div class="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label class="text-gray-400 block text-[10px]">دقة الشاشات:</label>
                <input type="text" class="studio-spec-field w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-laser font-bold text-xs text-center focus:border-laser focus:outline-none ${lockClass}"
                       ${lockAttr}
                       data-spec-key="screenResolution" value="${spec.screenResolution || '4K UltraHD'}">
              </div>
              <div class="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label class="text-gray-400 block text-[10px]">نظام الصوت:</label>
                <input type="text" class="studio-spec-field w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-palm font-bold text-xs text-center focus:border-laser focus:outline-none ${lockClass}"
                       ${lockAttr}
                       data-spec-key="audioSystem" value="${spec.audioSystem || '7.1 محيطي'}">
              </div>
            </div>
          </div>
        `;

      case "strategic_charter":
        return `
          <div class="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/40 space-y-4 shadow-lg shadow-purple-500/5">
            <h5 class="text-xs font-black text-purple-400 flex items-center gap-2">
              <i class="fa-solid fa-chess-king text-sm"></i>
              <span>مصفوفة الحوكمة والركائز الاستراتيجية ${canEdit ? '(قابلة للتعديل ✏️)' : '(استعراض فقط 👁️)'}:</span>
            </h5>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div class="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label class="text-purple-300 font-bold block text-[11px]">الركيزة الأولى:</label>
                <input type="text" class="studio-spec-field w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:border-purple-400 focus:outline-none ${lockClass}"
                       ${lockAttr}
                       data-spec-key="pillar1" value="${spec.pillar1 || 'الأصالة التوثيقية والشرعية'}">
              </div>
              <div class="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label class="text-purple-300 font-bold block text-[11px]">الركيزة الثانية:</label>
                <input type="text" class="studio-spec-field w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:border-purple-400 focus:outline-none ${lockClass}"
                       ${lockAttr}
                       data-spec-key="pillar2" value="${spec.pillar2 || 'الإبهار والابتكار التفاعلي'}">
              </div>
              <div class="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label class="text-purple-300 font-bold block text-[11px]">الركيزة الثالثة:</label>
                <input type="text" class="studio-spec-field w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:border-purple-400 focus:outline-none ${lockClass}"
                       ${lockAttr}
                       data-spec-key="pillar3" value="${spec.pillar3 || 'الشمولية والاستدامة الوطنية'}">
              </div>
            </div>
          </div>
        `;

      case "operations_logistics":
        return `
          <div class="p-5 rounded-2xl bg-palm/10 border border-palm/40 space-y-4 shadow-lg shadow-palm/5">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <h5 class="text-xs font-black text-palm flex items-center gap-2">
                <i class="fa-solid fa-truck-fast text-sm"></i>
                <span>مخطط خط سير الـ 20 مدينة وإجراءات الطوارئ ${canEdit ? '(قابلة للتعديل ✏️)' : '(استعراض فقط 👁️)'}:</span>
              </h5>
              <span class="text-[10px] px-2.5 py-0.5 rounded-full bg-palm/20 text-palm border border-palm/40 font-mono font-bold">20 محطة وطنية</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="space-y-1.5 p-3 rounded-xl bg-black/50 border border-white/10">
                <label class="text-palm font-bold block text-[11px]">المحطات المنجزة والمجدولة:</label>
                <textarea rows="2" class="studio-spec-field w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs leading-relaxed focus:border-palm focus:outline-none ${lockClass}"
                          ${lockAttr}
                          data-spec-key="completedStations" placeholder="اكتب المدن والمحطات...\nمثال: الأحساء (الهفوف/المبرز)، الدمام، الخبر، الرياض، الخرج.">${spec.completedStations || 'الأحساء (الهفوف/المبرز)، الدمام، الخبر، الرياض، الخرج (16 محطة مجدولة).'}</textarea>
              </div>
              <div class="space-y-1.5 p-3 rounded-xl bg-black/50 border border-white/10">
                <label class="text-gold font-bold block text-[11px]">بروتوكول السلامة وإجراءات الطوارئ:</label>
                <textarea rows="2" class="studio-spec-field w-full p-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs leading-relaxed focus:border-gold focus:outline-none ${lockClass}"
                          ${lockAttr}
                          data-spec-key="safetyProtocol" placeholder="اكتب إجراءات السلامة...\nمثال: زمن الإخلاء 45 ثانية، جهاز AED، مسعف مرافق.">${spec.safetyProtocol || 'زمن الإخلاء 45 ثانية، جهاز AED، مسعف مرافق، وفحص يومي لأنظمة الإطفاء.'}</textarea>
              </div>
            </div>
          </div>
        `;

      case "education_experience":
        return `
          <div class="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/40 space-y-4 shadow-lg shadow-orange-500/5">
            <h5 class="text-xs font-black text-orange-400 flex items-center gap-2">
              <i class="fa-solid fa-graduation-cap text-sm"></i>
              <span>مؤشرات أداء التجربة والأنشطة المدرسية الحية ${canEdit ? '(قابلة للتعديل ✏️)' : '(استعراض فقط 👁️)'}:</span>
            </h5>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
              <div class="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label class="text-gray-400 block text-[10px]">نسبة رضا الزوار:</label>
                <input type="text" class="studio-spec-field w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-orange-300 font-bold text-xs text-center focus:border-orange-400 focus:outline-none ${lockClass}"
                       ${lockAttr}
                       data-spec-key="visitorSatisfaction" value="${spec.visitorSatisfaction || '94.6%'}">
              </div>
              <div class="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label class="text-gray-400 block text-[10px]">عدد المدارس المشاركة:</label>
                <input type="text" class="studio-spec-field w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-orange-300 font-bold text-xs text-center focus:border-orange-400 focus:outline-none ${lockClass}"
                       ${lockAttr}
                       data-spec-key="participatingSchools" value="${spec.participatingSchools || '280 مدرسة'}">
              </div>
              <div class="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label class="text-gray-400 block text-[10px]">الاستيعاب المعرفي:</label>
                <input type="text" class="studio-spec-field w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-palm font-bold text-xs text-center focus:border-orange-400 focus:outline-none ${lockClass}"
                       ${lockAttr}
                       data-spec-key="knowledgeRetention" value="${spec.knowledgeRetention || '88%'}">
              </div>
            </div>
          </div>
        `;

      case "financial_sustainability":
        return `
          <div class="p-5 rounded-2xl bg-clay/10 border border-clay/40 space-y-4 shadow-lg shadow-clay/5">
            <h5 class="text-xs font-black text-clay flex items-center gap-2">
              <i class="fa-solid fa-handshake-angle text-sm"></i>
              <span>باقات الرعايات الاستراتيجية وتنويع الموارد ${canEdit ? '(قابلة للتعديل ✏️)' : '(استعراض فقط 👁️)'}:</span>
            </h5>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
              <div class="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label class="text-gold font-bold block text-[10px]">الراعي الماسي:</label>
                <input type="text" class="studio-spec-field w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white font-bold text-xs text-center focus:border-gold focus:outline-none ${lockClass}"
                       ${lockAttr}
                       data-spec-key="diamondSponsor" value="${spec.diamondSponsor || '500,000 ر.س'}">
              </div>
              <div class="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label class="text-gray-300 font-bold block text-[10px]">الراعي البلاتيني:</label>
                <input type="text" class="studio-spec-field w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white font-bold text-xs text-center focus:border-gold focus:outline-none ${lockClass}"
                       ${lockAttr}
                       data-spec-key="platinumSponsor" value="${spec.platinumSponsor || '250,000 ر.س'}">
              </div>
              <div class="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1">
                <label class="text-orange-400 font-bold block text-[10px]">الشريك الثقافي:</label>
                <input type="text" class="studio-spec-field w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white font-bold text-xs text-center focus:border-gold focus:outline-none ${lockClass}"
                       ${lockAttr}
                       data-spec-key="culturalPartner" value="${spec.culturalPartner || '100,000 ر.س'}">
              </div>
            </div>
          </div>
        `;

      default:
        return "";
    }
  }

  /* ---------------- VIEW 4: KANBAN BOARD VIEW ---------------- */
  renderKanbanView(model) {
    const items = model.getFilteredItems();

    const columns = [
      { id: "in_progress", title: "⏳ قيد الإعداد والتطوير", color: "#dfb15b", border: "border-gold/30", bg: "bg-gold/5" },
      { id: "review", title: "🔍 بانتظار المراجعة والتدقيق", color: "#00ebd4", border: "border-laser/30", bg: "bg-laser/5" },
      { id: "approved", title: "✅ مكتمل ومعتمد رسمياً", color: "#2ec866", border: "border-palm/30", bg: "bg-palm/5" },
      { id: "blocked", title: "⏸️ متوقف / مؤجل", color: "#cc6e55", border: "border-clay/30", bg: "bg-clay/5" }
    ];

    let html = `
      <div class="space-y-6 animate-fade-in">
        
        <!-- Kanban Header with Quick Stats -->
        <div class="p-6 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-xl font-black text-white flex items-center gap-2">
              <i class="fa-solid fa-table-columns text-laser"></i>
              <span>لوحة كانبان لمتابعة مخرجات أقسام المشروع الـ ${model.data.sections.length}</span>
            </h3>
            <p class="text-xs text-gray-400 mt-1">تتبع كافة بنود ومخرجات وثيقة PDR عبر مراحل العمل مع إمكانية تحديث الحالة فوراً</p>
          </div>

          <div class="flex items-center gap-3">
            <button class="btn-switch-to-studio px-4 py-2 rounded-xl bg-gold text-black font-black text-xs hover:bg-white transition-all shadow-md flex items-center gap-1.5">
              <i class="fa-solid fa-laptop-code"></i>
              <span>فتح الاستوديو ⚡</span>
            </button>
            <span class="text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold">
              إجمالي البنود: ${items.length}
            </span>
          </div>
        </div>

        <!-- 4 Columns Kanban Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
    `;

    columns.forEach(col => {
      const colItems = items.filter(i => i.status === col.id);

      html += `
        <div class="rounded-2xl bg-black/50 border ${col.border} overflow-hidden flex flex-col min-h-[500px]">
          
          <!-- Column Header -->
          <div class="p-4 ${col.bg} border-b ${col.border} flex items-center justify-between">
            <h4 class="text-sm font-black text-white flex items-center gap-2">
              <span>${col.title}</span>
            </h4>
            <span class="w-6 h-6 rounded-full bg-white/10 text-white font-mono font-bold text-xs flex items-center justify-center">
              ${colItems.length}
            </span>
          </div>

          <!-- Column Cards Container -->
          <div class="p-3.5 space-y-3.5 flex-1 overflow-y-auto max-h-[700px]">
            ${colItems.length === 0 ? `
              <div class="p-6 text-center text-xs text-gray-500 border border-dashed border-white/10 rounded-xl my-4">
                لا توجد بنود في هذه المرحلة حالياً
              </div>
            ` : colItems.map(item => {
              const assignee = model.getTeamMember(item.assignedTo);
              const typeInfo = model.getTaskTypeInfo(item.taskType);
              return `
                <div class="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-gold/40 transition-all space-y-3 shadow-md group">
                  
                  <!-- Card Header: Section Badge & Priority -->
                  <div class="flex items-center justify-between gap-2">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-white/5 text-gold border border-gold/30 truncate max-w-[130px]">
                      #${item.sectionNumber} ${item.sectionTitleAr}
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-bold border ${typeInfo.badgeBg}">
                      ${typeInfo.nameAr.split(' ')[0]}
                    </span>
                  </div>

                  <!-- Card Title & Description -->
                  <div class="space-y-1">
                    <h5 class="text-xs font-bold text-white group-hover:text-gold transition-colors leading-snug">
                      ${item.title}
                    </h5>
                    <p class="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                      ${item.description}
                    </p>
                  </div>

                  <!-- Card Progress Bar -->
                  <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-gold to-laser rounded-full" style="width: ${item.progress}%;"></div>
                  </div>

                  <!-- Card Footer: Assignee & Action Buttons -->
                  <div class="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5 text-gray-300 text-xs">
                      <span class="text-sm">${assignee ? assignee.avatar : '👤'}</span>
                      <span class="text-[10px] font-semibold truncate max-w-[80px]">${assignee ? assignee.name : 'غير مسند'}</span>
                    </div>

                    <button class="btn-open-item-in-studio px-2.5 py-1 rounded-lg bg-gold/15 hover:bg-gold hover:text-black text-gold text-[10px] font-black transition-all flex items-center gap-1"
                            data-section-id="${item.sectionId}" data-item-id="${item.id}">
                      <i class="fa-solid fa-laptop-code"></i>
                      <span>إنجاز ⚡</span>
                    </button>
                  </div>

                </div>
              `;
            }).join('')}
          </div>

        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /* ---------------- VIEW 5: CHARTS & SPECIALIZED MATRICES ---------------- */
  renderChartsView(model) {
    const kpis = (model.data.sections.find(s => s.id === "sec_14") || {}).items || [];
    const orgItems = (model.data.sections.find(s => s.id === "sec_12") || {}).items || [];
    const roadmap = (model.data.sections.find(s => s.id === "sec_15") || {}).items || [];

    let html = `
      <div class="space-y-10 animate-fade-in">
        
        <!-- Header -->
        <div class="p-6 rounded-2xl bg-black/60 border border-white/10">
          <h3 class="text-xl font-black text-white flex items-center gap-2">
            <i class="fa-solid fa-chart-pie text-laser"></i>
            <span>التحليلات والمخططات التفاعلية المتقدمة (Specialized PDR Visualizers)</span>
          </h3>
          <p class="text-xs text-gray-400 mt-1">مصفوفات SWOT، PESTEL، الهيكل التنظيمي، إدارة المخاطر، عدادات مؤشرات الأداء KPIs، وخارطة الطريق</p>
        </div>

        <!-- 1. Interactive SWOT Matrix -->
        <div class="p-6 rounded-3xl bg-black/70 border border-white/15 space-y-4">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center font-black text-sm">5</span>
            <h4 class="text-lg font-black text-white">مصفوفة تحليل البيئة الداخلية والخارجية (SWOT Analysis Matrix)</h4>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-5 rounded-2xl bg-palm/10 border border-palm/30 space-y-2.5">
              <h5 class="text-sm font-black text-palm flex items-center gap-2">
                <i class="fa-solid fa-shield-halved"></i>
                <span>نقاط القوة (Strengths)</span>
              </h5>
              <ul class="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                <li>مرونة المركز المتنقل والقدرة على الوصول إلى 20 مدينة بكافة مناطق المملكة.</li>
                <li>عمق التوثيق التاريخي والشرعي المعتمد للأحساء في صدر الإسلام ومسجد جواثى.</li>
                <li>تكامل وسائط العرض الغامرة 270° مع الهولوجرام والواقع الافتراضي 4D.</li>
              </ul>
            </div>

            <div class="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-2.5">
              <h5 class="text-sm font-black text-orange-400 flex items-center gap-2">
                <i class="fa-solid fa-circle-exclamation"></i>
                <span>نقاط الضعف (Weaknesses)</span>
              </h5>
              <ul class="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                <li>الطاقة الاستيعابية اللحظية المحدودة للمركز (35-40 زائراً لكل جولة 15 دقيقة).</li>
                <li>الحاجة إلى صيانة دورية متقدمة للمولدات والأنظمة الهيدروليكية للشاحنة.</li>
                <li>الاعتماد على الظروف الجوية الميدانية في الساحات المفتوحة.</li>
              </ul>
            </div>

            <div class="p-5 rounded-2xl bg-laser/10 border border-laser/30 space-y-2.5">
              <h5 class="text-sm font-black text-laser flex items-center gap-2">
                <i class="fa-solid fa-arrow-trend-up"></i>
                <span>الفرص (Opportunities)</span>
              </h5>
              <ul class="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                <li>الدعم الوطني الكبير للمبادرات الثقافية ضمن برامج رؤية السعودية 2030.</li>
                <li>التوسع في الشراكات المدرسية مع إدارات التعليم لاستضافة الرحلات الصباحية.</li>
                <li>إمكانية إضافة شاحنات إضافية للأسطول لتغطية متزامنة لعدة مناطق.</li>
              </ul>
            </div>

            <div class="p-5 rounded-2xl bg-clay/10 border border-clay/30 space-y-2.5">
              <h5 class="text-sm font-black text-clay flex items-center gap-2">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>التهديدات (Threats)</span>
              </h5>
              <ul class="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                <li>التقلبات المناخية الشديدة (العواصف الرملية أو درجات الحرارة المرتفعة صيفاً).</li>
                <li>تأخر إجراءات تصاريح السير وحجز المواقع بين الأمانات وإدارات المرور.</li>
                <li>تقلبات تمويل الرعايات والمنح الثقافية غير الربحية.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 2. Live KPI Counters Dashboard (Section 14) -->
        <div class="p-6 rounded-3xl bg-black/70 border border-white/15 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center font-black text-sm">14</span>
              <h4 class="text-lg font-black text-white">لوحة قياس مؤشرات الأداء الحية (KPIs Live Dashboard)</h4>
            </div>
            <span class="text-xs text-laser font-bold">تحديث مستمر 2026</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            ${kpis.map(k => `
              <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-2">
                <div class="text-[10px] text-gray-400 font-bold leading-tight">${k.title}</div>
                <div class="text-xl sm:text-2xl font-black bg-gradient-to-r from-white to-gold bg-clip-text text-fill-transparent">
                  ${k.currentVal !== undefined ? k.currentVal.toLocaleString() : (k.progress + '%')}
                </div>
                <div class="text-[10px] text-gray-500 font-mono">المستهدف: ${k.targetVal !== undefined ? k.targetVal.toLocaleString() : '100%'} ${k.unit || ''}</div>
                <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-gold rounded-full" style="width: ${k.progress}%;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 3. Administrative Organizational Chart (Section 12) -->
        <div class="p-6 rounded-3xl bg-black/70 border border-white/15 space-y-5">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center font-black text-sm">12</span>
            <h4 class="text-lg font-black text-white">الهيكل الإداري وفريق العمل التنفيذي (Organizational Chart)</h4>
          </div>

          <!-- Top Executive Level -->
          <div class="flex justify-center">
            <div class="p-4 rounded-2xl bg-gold/20 border-2 border-gold text-center space-y-1 shadow-xl shadow-gold/10 max-w-xs w-full">
              <span class="text-2xl">👨‍💼</span>
              <h5 class="text-sm font-black text-white">المدير التنفيذي والمشرف العام</h5>
              <p class="text-xs text-gold font-bold">د. عبد المحسن المبارك</p>
              <span class="text-[10px] text-gray-300">القيادة العامة ومتابعة الأهداف</span>
            </div>
          </div>

          <div class="w-0.5 h-6 bg-gold/50 mx-auto"></div>

          <!-- Department Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${orgItems.slice(1).map(org => {
              const tm = model.getTeamMember(org.assignedTo);
              return `
                <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-1.5 hover:border-gold/50 transition-all">
                  <span class="text-lg">${tm ? tm.avatar : '👤'}</span>
                  <h6 class="text-xs font-bold text-white">${org.title}</h6>
                  <p class="text-[11px] text-gold font-semibold">${tm ? tm.name : 'مسؤول القسم'}</p>
                  <p class="text-[10px] text-gray-400 line-clamp-1">${org.description}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 4. Interactive Roadmap Timeline (Section 15) -->
        <div class="p-6 rounded-3xl bg-black/70 border border-white/15 space-y-5">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center font-black text-sm">15</span>
            <h4 class="text-lg font-black text-white">خارطة طريق المشروع (Roadmap 2024 - 2027)</h4>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${roadmap.map((phase, idx) => `
              <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 relative overflow-hidden group hover:border-gold/50 transition-all">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-1 rounded-lg text-xs font-black bg-gold/15 text-gold border border-gold/30">
                    مرحلة ${idx + 1}
                  </span>
                  <span class="text-xs font-mono font-bold ${phase.status === 'approved' ? 'text-palm' : 'text-laser'}">
                    ${phase.status === 'approved' ? '✅ منجزة' : '⏳ قيد التنفيذ'}
                  </span>
                </div>
                <h5 class="text-sm font-bold text-white leading-snug">${phase.title}</h5>
                <p class="text-xs text-gray-400 leading-relaxed">${phase.description}</p>
                <div class="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                  <span>تاريخ الاستحقاق:</span>
                  <span class="font-mono text-gray-300 font-bold">${phase.dueDate || '2026'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 5. Interactive Legal & Regulatory Compliance Matrix (Section 17) -->
        <div class="p-6 rounded-3xl bg-black/70 border border-white/15 space-y-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center font-black text-sm">17</span>
              <h4 class="text-lg font-black text-white">مصفوفة الملكية والامتثال القانوني والتراخيص الحكومية (Legal & Compliance Matrix)</h4>
            </div>
            <span class="text-xs px-3 py-1 rounded-full bg-laser/15 text-laser border border-laser/30 font-bold">الحوكمة والامتثال 2026</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Pillar 1: Legal Entity -->
            <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 hover:border-gold/50 transition-all flex flex-col justify-between">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="w-9 h-9 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-bold">
                    <i class="fa-solid fa-landmark"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-palm/15 text-palm border border-palm/30">مدروس نظامياً</span>
                </div>
                <h5 class="text-sm font-black text-white">التكييف القانوني للكيان</h5>
                <p class="text-xs text-gray-400 leading-relaxed">
                  تحديد الشكل النظامي: مؤسسة وقفية أهلية (الهيئة العامة للأوقاف) أو جمعية أهلية غير ربحية لضمان الحوكمة واستدامة التمويل.
                </p>
              </div>
              <div class="pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span class="text-gray-400">المخرج:</span>
                <span class="text-gold font-bold">وثيقة التكييف والتسجيل</span>
              </div>
            </div>

            <!-- Pillar 2: Government Permits -->
            <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 hover:border-gold/50 transition-all flex flex-col justify-between">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="w-9 h-9 rounded-xl bg-laser/15 text-laser flex items-center justify-center font-bold">
                    <i class="fa-solid fa-file-shield"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-laser/15 text-laser border border-laser/30">قيد الاستخراج</span>
                </div>
                <h5 class="text-sm font-black text-white">التراخيص والتصاريح الحكومية</h5>
                <p class="text-xs text-gray-400 leading-relaxed">
                  حصر وتكامل تراخيص: هيئة التراث، الدفاع المدني، وزارة السياحة، إشغال المواقع البلدية مع أمانة الأحساء، وتصاريح النقل.
                </p>
              </div>
              <div class="pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span class="text-gray-400">المخرج:</span>
                <span class="text-laser font-bold">مصفوفة التراخيص المعتمدة</span>
              </div>
            </div>

            <!-- Pillar 3: Site & Land -->
            <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 hover:border-gold/50 transition-all flex flex-col justify-between">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="w-9 h-9 rounded-xl bg-clay/15 text-clay flex items-center justify-center font-bold">
                    <i class="fa-solid fa-map-location-dot"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">متابعة التخصيص</span>
                </div>
                <h5 class="text-sm font-black text-white">الوضع القانوني للأرض والموقع</h5>
                <p class="text-xs text-gray-400 leading-relaxed">
                  تأمين وثائق الحيازة والتخصيص المؤقت للساحات والمواقع الحيوية بالتنسيق مع أمانة الأحساء وهيئة تطوير المنطقة الشرقية.
                </p>
              </div>
              <div class="pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span class="text-gray-400">المخرج:</span>
                <span class="text-amber-400 font-bold">خطاب طلب التخصيص والحيازة</span>
              </div>
            </div>

            <!-- Pillar 4: Safety & Accessibility -->
            <div class="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 hover:border-gold/50 transition-all flex flex-col justify-between">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="w-9 h-9 rounded-xl bg-palm/15 text-palm flex items-center justify-center font-bold">
                    <i class="fa-solid fa-wheelchair"></i>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-palm/15 text-palm border border-palm/30">كود البناء السعودي</span>
                </div>
                <h5 class="text-sm font-black text-white">السلامة والإتاحة الشاملة</h5>
                <p class="text-xs text-gray-400 leading-relaxed">
                  أنظمة السلامة والإنذار ومكافحة الحريق بالدفاع المدني، ومنحدرات ومصاعد ومسارات الوصول الشامل لذوي الإعاقة.
                </p>
              </div>
              <div class="pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                <span class="text-gray-400">المخرج:</span>
                <span class="text-palm font-bold">تقرير مطابقة السلامة والوصول</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    `;

    return html;
  }

  /* ---------------- VIEW 6: PRINTABLE REPORT VIEW ---------------- */
  renderReportView(model) {
    const meta = model.data.metadata || {};
    const about = model.data.about || {};
    const sections = model.data.sections || [];
    const values = model.data.values || [];
    const stats = model.calculateGlobalStats();

    let html = `
      <div class="space-y-6 animate-fade-in">
        
        <!-- Action bar for print & export -->
        <div class="p-4 rounded-2xl bg-black/80 border border-white/15 flex items-center justify-between gap-4 flex-wrap no-print">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-print text-gold"></i>
            <span class="text-sm font-bold text-white">معاينة وثيقة المشروع الرسمية PDR للطباعة والتصدير</span>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <button onclick="window.App && window.App.exportPdrToWord ? window.App.exportPdrToWord() : null" class="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-white hover:to-blue-200 hover:text-black text-white font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-blue-900/30 border border-blue-400/30 cursor-pointer" title="تصدير وثيقة PDR بالكامل كملف Word منسق">
              <i class="fa-solid fa-file-word"></i>
              <span>تصدير وثيقة Word (.doc) 📄</span>
            </button>
            <button id="btn-print-pdr-report" class="px-5 py-2 rounded-xl bg-gold hover:bg-white text-black font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-gold/20 cursor-pointer">
              <i class="fa-solid fa-print"></i>
              <span>طباعة / حفظ كـ PDF</span>
            </button>
          </div>
        </div>

        <!-- The Printable Document Body (A4 Styled Heritage Layout) -->
        <div class="p-8 sm:p-12 rounded-3xl bg-white text-gray-900 shadow-2xl border border-gold/30 max-w-4xl mx-auto space-y-8 font-['Cairo']" id="printable-pdr-document">
          
          <!-- Official Document Header -->
          <div class="flex items-center justify-between border-b-2 border-gold/40 pb-6">
            <div class="space-y-1">
              <div class="text-xs font-black text-amber-800 tracking-wider">المملكة العربية السعودية — محافظة الأحساء</div>
              <h1 class="text-2xl sm:text-3xl font-black text-gray-900">سِـرَاج الأَحْـسَـاء</h1>
              <h2 class="text-sm font-bold text-amber-700">تاريخٌ يُروى.. وحاضرٌ يُعاش</h2>
            </div>
            <div class="text-left space-y-1 text-xs text-gray-600">
              <div class="font-bold text-gray-900">PROJECT DEFINITION REPORT (PDR)</div>
              <div>وثيقة تعريف المشروع المعتمدة</div>
              <div class="font-mono text-gray-500">${new Date().toLocaleDateString('ar-SA')}</div>
            </div>
          </div>

          <!-- Document Meta Summary Bar -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs">
            <div>
              <span class="text-gray-500 block">نوع المبادرة:</span>
              <span class="font-bold text-gray-900">${meta.projectTypeAr || 'ثقافية تراثية متنقلة'}</span>
            </div>
            <div>
              <span class="text-gray-500 block">نطاق التغطية:</span>
              <span class="font-bold text-gray-900">20 مدينة ومحافظة بالمملكة</span>
            </div>
            <div>
              <span class="text-gray-500 block">نسبة الإنجاز العامة:</span>
              <span class="font-bold text-amber-800 text-sm font-mono">${stats.overallProgress}%</span>
            </div>
            <div>
              <span class="text-gray-500 block">حالة الاعتماد:</span>
              <span class="font-bold text-green-700">معتمد رسمياً (Approved)</span>
            </div>
          </div>

          <!-- Executive Summary Section -->
          <div class="space-y-3">
            <h3 class="text-base font-black text-amber-900 border-r-4 border-gold pr-2">أولاً: نبذة وفكرة المشروع</h3>
            <p class="text-xs text-gray-700 leading-relaxed text-justify">
              ${about.summaryAr || ''} ${about.missionAr || ''}
            </p>
          </div>

          <!-- The Core Sections Matrix Summary Table -->
          <div class="space-y-4">
            <h3 class="text-base font-black text-amber-900 border-r-4 border-gold pr-2">ثانياً: فهرس مصفوفة أقسام ومخرجات المشروع الـ ${sections.length}</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-right border-collapse border border-gray-300">
                <thead>
                  <tr class="bg-amber-100/70 text-gray-900 border-b border-gray-300">
                    <th class="p-2 border-l border-gray-300 w-12 text-center">#</th>
                    <th class="p-2 border-l border-gray-300">القسم الرئيسي والمخرج</th>
                    <th class="p-2 border-l border-gray-300">الإدارة المسؤولة</th>
                    <th class="p-2 border-l border-gray-300 w-24 text-center">عدد البنود</th>
                    <th class="p-2 border-l border-gray-300 w-28 text-center">حالة الإنجاز</th>
                  </tr>
                </thead>
                <tbody>
                  ${sections.map(s => {
                    const st = model.calculateSectionStats(s.id);
                    return `
                      <tr class="border-b border-gray-200 hover:bg-amber-50/50">
                        <td class="p-2 border-l border-gray-200 text-center font-bold font-mono">${s.number}</td>
                        <td class="p-2 border-l border-gray-200 font-bold">${s.titleAr} <span class="text-gray-500 font-normal">(${s.titleEn})</span></td>
                        <td class="p-2 border-l border-gray-200">${s.leadDepartment || 'إدارة المشروع'}</td>
                        <td class="p-2 border-l border-gray-200 text-center font-mono">${st.total}</td>
                        <td class="p-2 border-l border-gray-200 text-center font-mono font-bold ${st.progress === 100 ? 'text-green-700' : 'text-amber-700'}">
                          ${st.progress}% (${st.approved}/${st.total})
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Document Signatures Footer -->
          <div class="grid grid-cols-2 gap-8 pt-8 border-t-2 border-gold/40 text-xs">
            <div class="space-y-1">
              <span class="text-gray-500 block">إعداد وتنسيق:</span>
              <div class="font-bold text-gray-900">فريق إدارة وثيقة المشروع PDR</div>
              <div class="text-[10px] text-gray-500">مشروع سِـرَاج الأَحْـسَـاء 2026</div>
            </div>
            <div class="text-left space-y-1">
              <span class="text-gray-500 block">الاعتماد النهائي:</span>
              <div class="font-bold text-gray-900">د. عبد المحسن المبارك</div>
              <div class="text-[10px] text-gray-500">مدير المشروع والمشرف العام</div>
            </div>
          </div>

        </div>

      </div>
    `;

    return html;
  }
};
