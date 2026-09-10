/* ==========================================================
   SERAJ AL-AHSA - DETAILED MASTER PLAN VIEW LAYER
   عرض وتفاعل دراسة متحف السيرة، فريق العمل، وحالات الاعتماد
   ========================================================== */

window.App = window.App || {};
var App = window.App;

App.DetailedPlanView = class {
  constructor() {
    this.container = document.getElementById("detailed-plan-content-area");
  }

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Render the currently active sub-tab
  // Render the currently active sub-tab (or locked gate if not authenticated)
  render(model) {
    if (!this.container) {
      this.container = document.getElementById("detailed-plan-content-area");
    }
    if (!this.container) return;

    // Security Gate: If user is not authenticated, do not show any project data
    if (!model || !model.isAuthenticated()) {
      this.container.innerHTML = this.renderLockedGate(model);
      this.updateActiveSubTabUI(null, model);
      return;
    }

    const activeTab = model.activeTab;
    let html = "";

    switch (activeTab) {
      case "team":
        html = this.renderTeamTab(model);
        break;
      case "identity":
        html = this.renderIdentityTab(model);
        break;
      case "artifacts":
        html = this.renderArtifactsTab(model);
        break;
      case "schools":
        html = this.renderSchoolsTab(model);
        break;
      case "hologram":
        html = this.renderHologramTab(model);
        break;
      case "vr":
        html = this.renderVRTab(model);
        break;
      case "location":
        html = this.renderLocationTab(model);
        break;
      case "finance":
        html = this.renderFinanceTab(model);
        break;
      case "store_refs":
        html = this.renderStoreRefsTab(model);
        break;
      case "tasks":
        html = this.renderTasksTab(model);
        break;
      case "decisions":
        html = this.renderDecisionsTab(model);
        break;
      case "export_tools":
        html = this.renderExportToolsTab(model);
        break;
      case "users":
        html = this.renderUsersTab(model);
        break;
      default:
        html = this.renderIdentityTab(model);
    }

    this.container.innerHTML = html;
    this.updateActiveSubTabUI(activeTab, model);
  }

  /* ---------------- LOCKED AUTHENTICATION GATEWAY ---------------- */
  renderLockedGate(model) {
    return `
      <div class="flex flex-col items-center justify-center py-12 px-4 animate-fadeIn">
        <div class="max-w-md w-full p-8 rounded-3xl bg-black/80 border border-gold/35 shadow-2xl backdrop-blur-2xl flex flex-col gap-6 text-center relative overflow-hidden">
          <div class="w-16 h-16 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold text-2xl mx-auto shadow-lg shadow-gold/10">
            <i class="fa-solid fa-lock"></i>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="text-xl font-black text-white">منطقة محمية لفريق العمل</h3>
            <p class="text-xs text-gray-400 leading-relaxed">
              يرجى تسجيل الدخول بحسابك المعتمد للاطلاع على بيانات وتفاصيل دراسة متحف السيرة ومصفوفة المهام والقرارات.
            </p>
          </div>

          <form id="form-gate-login" class="flex flex-col gap-4 text-xs text-right">
            <div id="gate-login-error" class="hidden p-3 rounded-xl bg-clay/20 border border-clay/40 text-clay text-xs font-bold text-center"></div>

            <div class="flex flex-col gap-1.5">
              <label class="font-bold text-gray-300">اسم المستخدم (Username):</label>
              <input type="text" id="gate-login-username" required placeholder="أدخل اسم المستخدم" class="bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-gold transition-all" />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-bold text-gray-300">كلمة المرور / الرمز السري:</label>
              <input type="password" id="gate-login-password" required placeholder="••••••••" class="bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-gold transition-all" />
            </div>

            <button type="submit" id="btn-gate-submit-login" class="w-full py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-white hover:to-gold text-black font-black text-xs shadow-lg shadow-gold/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1">
              <i class="fa-solid fa-right-to-bracket"></i>
              <span>تسجيل الدخول واستعراض المنظومة</span>
            </button>
          </form>
        </div>
      </div>
    `;
  }

  updateActiveSubTabUI(activeTab, model) {
    const subTabsBar = document.getElementById("plan-sub-tabs-bar");
    const categoriesBar = document.getElementById("plan-categories-bar");
    const isAuthenticated = Boolean(model && model.isAuthenticated());

    if (subTabsBar && subTabsBar.classList) {
      if (isAuthenticated) {
        subTabsBar.classList.remove("hidden");
        subTabsBar.classList.add("flex");
      } else {
        subTabsBar.classList.add("hidden");
        subTabsBar.classList.remove("flex");
      }
    }

    if (categoriesBar && categoriesBar.classList) {
      if (isAuthenticated) {
        categoriesBar.classList.remove("hidden");
        categoriesBar.classList.add("flex");
      } else {
        categoriesBar.classList.add("hidden");
        categoriesBar.classList.remove("flex");
      }
    }

    // Determine category of active tab
    const tabToCat = {
      identity: "vision",
      location: "vision",
      artifacts: "exhibits",
      schools: "exhibits",
      hologram: "exhibits",
      vr: "exhibits",
      finance: "operations",
      store_refs: "operations",
      team: "team_ops",
      tasks: "team_ops",
      decisions: "team_ops",
      export_tools: "team_ops",
      users: "team_ops"
    };

    const currentCat = tabToCat[activeTab] || "vision";

    // Highlight Category Pills
    document.querySelectorAll(".plan-category-pill").forEach(pill => {
      const cat = pill.getAttribute("data-plan-cat");
      if (cat === currentCat) {
        pill.classList.add("active", "border-gold", "text-gold", "bg-gold/15");
        pill.classList.remove("text-gray-400", "border-white/10", "bg-white/5");
      } else {
        pill.classList.remove("active", "border-gold", "text-gold", "bg-gold/15");
        pill.classList.add("text-gray-400", "border-white/10", "bg-white/5");
      }
    });

    // Show or hide admin-only users tab button
    const usersTabBtn = document.getElementById("tab-btn-users");
    if (usersTabBtn && usersTabBtn.classList) {
      if (model && model.isAdmin()) {
        usersTabBtn.classList.remove("hidden");
        usersTabBtn.classList.add("flex");
      } else {
        usersTabBtn.classList.add("hidden");
        usersTabBtn.classList.remove("flex");
      }
    }

    document.querySelectorAll(".plan-sub-tab-btn").forEach(btn => {
      const tab = btn.getAttribute("data-plan-tab");
      if (btn.classList) {
        if (tab === activeTab) {
          btn.classList.add("active", "border-gold", "text-gold", "bg-gold/15");
          btn.classList.remove("text-gray-400", "border-white/10", "bg-white/5");
        } else {
          btn.classList.remove("active", "border-gold", "text-gold", "bg-gold/15");
          btn.classList.add("text-gray-400", "border-white/10");
        }
      }
    });

    this.updateAuthBarUI(model);
  }

  updateAuthBarUI(model) {
    if (!model) return;

    const badgeContainer = document.getElementById("auth-role-badge");
    const nameContainer = document.getElementById("auth-user-name");
    const btnLogin = document.getElementById("btn-open-login-modal");
    const btnManageUsers = document.getElementById("btn-admin-manage-users");
    const btnLogout = document.getElementById("btn-auth-logout");

    const roleInfo = model.getRoleBadge() || { label: "زائر (استعراض فقط)", role: "viewer", icon: "fa-eye", color: "#8a9ba8" };

    if (badgeContainer) {
      if (badgeContainer.style) {
        badgeContainer.style.borderColor = (roleInfo.color || "#dfb15b") + "55";
        badgeContainer.style.backgroundColor = (roleInfo.color || "#dfb15b") + "22";
        badgeContainer.style.color = roleInfo.color || "#dfb15b";
      }
      badgeContainer.innerHTML = `<i class="fa-solid ${roleInfo.icon}"></i><span>${roleInfo.label}</span>`;
    }

    if (nameContainer && nameContainer.classList) {
      if (model.isAuthenticated() && model.currentUser) {
        nameContainer.textContent = `مرحباً، ${model.currentUser.name || model.currentUser.username}`;
        nameContainer.classList.remove("hidden");
      } else {
        nameContainer.textContent = "";
        nameContainer.classList.add("hidden");
      }
    }

    if (btnLogin && btnLogin.classList) {
      if (model.isAuthenticated()) {
        btnLogin.classList.add("hidden");
      } else {
        btnLogin.classList.remove("hidden");
      }
    }

    if (btnManageUsers && btnManageUsers.classList) {
      if (model.isAdmin()) {
        btnManageUsers.classList.remove("hidden");
        btnManageUsers.classList.add("flex");
      } else {
        btnManageUsers.classList.add("hidden");
        btnManageUsers.classList.remove("flex");
      }
    }

    const logoutBtns = document.querySelectorAll(".btn-global-logout, #btn-auth-logout, #btn-auth-logout-bar");
    logoutBtns.forEach(btn => {
      if (model.isAuthenticated()) {
        btn.classList.remove("hidden");
        btn.classList.add("flex");
      } else {
        btn.classList.add("hidden");
        btn.classList.remove("flex");
      }
    });
  }

  /* ---------------- 12. ADMIN USER MANAGEMENT TAB ---------------- */
  renderUsersTab(model) {
    if (!model.isAdmin()) {
      return `
        <div class="p-8 rounded-2xl bg-clay/10 border border-clay/30 text-center flex flex-col items-center gap-4 animate-fadeIn">
          <div class="w-16 h-16 rounded-2xl bg-clay/20 text-clay flex items-center justify-center text-2xl">
            <i class="fa-solid fa-lock"></i>
          </div>
          <h3 class="text-xl font-bold text-white">غير مصرح بالدخول</h3>
          <p class="text-xs text-gray-400 max-w-md">
            لوحة إدارة المستخدمين وصلاحيات الحسابات مخصصة فقط لمدير النظام الرئيسي (Admin).
          </p>
        </div>
      `;
    }

    return `
      <div class="flex flex-col gap-8 animate-fadeIn">
        <!-- Banner -->
        <div class="p-6 rounded-2xl bg-gradient-to-r from-gold/20 via-black/80 to-palm/15 border border-gold/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex flex-col gap-1.5 max-w-lg">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                <i class="fa-solid fa-crown text-gold"></i>
                لوحة تحكم مدير النظام (Admin Control Panel)
              </span>
            </div>
            <h3 class="text-2xl font-black text-white">إدارة حسابات المستخدمين وصلاحيات المنظومة</h3>
            <p class="text-xs text-gray-300 leading-relaxed">
              إضافة وتعديل وحذف مستخدمي المنظومة وتعيين الأدوار: إما <strong>محرر (Editor)</strong> للتعديل والحذف أو <strong>مدير (Admin)</strong> للتحكم الكامل.
            </p>
          </div>

          <button id="btn-open-add-user-modal" class="py-2.5 px-4 rounded-xl bg-gold text-black hover:bg-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/20 shrink-0">
            <i class="fa-solid fa-user-plus"></i>
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>

        <!-- Users Table Container -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-users text-gold text-sm"></i>
              <span>المستخدمون المسجلون في النظام</span>
            </h4>
            <button id="btn-refresh-users-list" class="text-xs text-gray-400 hover:text-gold flex items-center gap-1.5 transition-all">
              <i class="fa-solid fa-rotate"></i>
              <span>تحديث القائمة</span>
            </button>
          </div>

          <div id="users-list-table-container" class="min-h-[150px] flex items-center justify-center">
            <div class="text-xs text-gray-400 flex items-center gap-2">
              <i class="fa-solid fa-spinner fa-spin text-gold"></i>
              <span>جاري تحميل قائمة المستخدمين من السيرفر...</span>
            </div>
          </div>
        </div>

        <!-- Automated Backups & Disaster Recovery Container -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-5">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold text-palm uppercase tracking-wider flex items-center gap-1.5">
                  <i class="fa-solid fa-shield-halved"></i>
                  الأمان والنسخ الاحتياطي السحابي
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-palm/15 text-palm border border-palm/30">نشط (كل 24 ساعة)</span>
              </div>
              <h4 class="text-base font-black text-white">إدارة النسخ الاحتياطية واستعادة النظام (Disaster Recovery)</h4>
              <p class="text-xs text-gray-400 leading-relaxed mt-0.5">
                تأمين وحفظ كامل لقواعد بيانات الخطة والمستخدمين. يمكنك تنزيل النسخ الاحتياطية لجهازك أو استعادة النظام لأي نقطة سابقة.
              </p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button id="btn-create-manual-backup" class="py-2.5 px-4 rounded-xl bg-palm/20 hover:bg-palm text-palm hover:text-black border border-palm/40 text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
                <i class="fa-solid fa-camera"></i>
                <span>أخذ نسخة احتياطية الآن</span>
              </button>
              <button id="btn-refresh-backups-list" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 text-xs transition-all" title="تحديث قائمة النسخ">
                <i class="fa-solid fa-rotate"></i>
              </button>
            </div>
          </div>

          <div id="backups-list-table-container" class="min-h-[120px] flex items-center justify-center">
            <div class="text-xs text-gray-400 flex items-center gap-2">
              <i class="fa-solid fa-spinner fa-spin text-palm"></i>
              <span>جاري فحص وجلب النسخ الاحتياطية من السيرفر...</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderBackupsTableHtml(backups) {
    if (!backups || backups.length === 0) {
      return `<div class="p-8 text-center text-xs text-gray-400">لا توجد نسخ احتياطية مسجلة حتى الآن</div>`;
    }

    return `
      <div class="overflow-x-auto w-full">
        <table class="w-full text-right text-xs">
          <thead>
            <tr class="border-b border-white/10 text-gray-400 text-[11px] pb-2">
              <th class="py-3 px-4">اسم ملف النسخة</th>
              <th class="py-3 px-4">تاريخ ووقت النسخة</th>
              <th class="py-3 px-4">نوع النسخة</th>
              <th class="py-3 px-4">حجم الملف</th>
              <th class="py-3 px-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/6">
            ${backups.map(b => {
              const isAuto = b.type === 'auto_daily';
              const isPreRestore = b.type === 'pre_restore';
              const dateFormatted = new Date(b.timestamp).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' });
              return `
                <tr class="hover:bg-white/[0.02] transition-colors">
                  <td class="py-3.5 px-4 font-mono font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-file-shield text-palm text-sm"></i>
                    <span>${b.filename}</span>
                  </td>
                  <td class="py-3.5 px-4 text-gray-300 font-mono text-[11px]">${dateFormatted}</td>
                  <td class="py-3.5 px-4">
                    ${isAuto ? `
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-palm/15 text-palm border border-palm/30 inline-flex items-center gap-1">
                        <i class="fa-solid fa-clock"></i> آلية دورية
                      </span>
                    ` : isPreRestore ? `
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-clay/15 text-clay border border-clay/30 inline-flex items-center gap-1">
                        <i class="fa-solid fa-shield"></i> قبل الاسترجاع
                      </span>
                    ` : `
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold/15 text-gold border border-gold/30 inline-flex items-center gap-1">
                        <i class="fa-solid fa-user-check"></i> يدوية فورية
                      </span>
                    `}
                  </td>
                  <td class="py-3.5 px-4 font-mono text-gray-400 text-[11px]">${b.sizeKb || (b.size / 1024).toFixed(2)} KB</td>
                  <td class="py-3.5 px-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <a href="/api/backups/download?file=${encodeURIComponent(b.filename)}" target="_blank" download="${b.filename}" class="px-3 py-1 rounded-lg bg-white/5 hover:bg-gold hover:text-black text-gray-300 text-[11px] font-bold transition-all inline-flex items-center gap-1">
                        <i class="fa-solid fa-download"></i> تحميل
                      </a>
                      <button class="btn-restore-backup px-3 py-1 rounded-lg bg-palm/15 hover:bg-palm text-palm hover:text-black border border-palm/30 text-[11px] font-bold transition-all inline-flex items-center gap-1" data-filename="${b.filename}">
                        <i class="fa-solid fa-rotate-left"></i> استرجاع
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderUsersTableHtml(users, currentUsername) {
    if (!users || users.length === 0) {
      return `<div class="p-8 text-center text-xs text-gray-400">لا يوجد مستخدمون مسجلون</div>`;
    }

    return `
      <div class="overflow-x-auto w-full">
        <table class="w-full text-right text-xs">
          <thead>
            <tr class="border-b border-white/10 text-gray-400 text-[11px] pb-2">
              <th class="py-3 px-4">الاسم الكامل</th>
              <th class="py-3 px-4">اسم المستخدم</th>
              <th class="py-3 px-4">الدور والصلاحية</th>
              <th class="py-3 px-4">تاريخ الإنشاء</th>
              <th class="py-3 px-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/6">
            ${users.map(u => {
              const isAdmin = u.role === 'admin';
              const isCurrent = u.username.toLowerCase() === (currentUsername || '').toLowerCase();
              return `
                <tr class="hover:bg-white/[0.02] transition-colors">
                  <td class="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg ${isAdmin ? 'bg-gold text-black' : 'bg-laser/20 text-laser border border-laser/30'} flex items-center justify-center font-bold text-xs">
                      ${u.name.slice(0, 1)}
                    </div>
                    <span>${u.name}</span>
                    ${isCurrent ? `<span class="text-[9px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded font-normal">أنت</span>` : ''}
                  </td>
                  <td class="py-3.5 px-4 font-mono text-gray-300">${u.username}</td>
                  <td class="py-3.5 px-4">
                    ${isAdmin ? `
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gold/15 text-gold border border-gold/30 inline-flex items-center gap-1.5">
                        <i class="fa-solid fa-crown"></i> مدير النظام (Admin)
                      </span>
                    ` : `
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-laser/15 text-laser border border-laser/30 inline-flex items-center gap-1.5">
                        <i class="fa-solid fa-pen-to-square"></i> محرر (Editor)
                      </span>
                    `}
                  </td>
                  <td class="py-3.5 px-4 font-mono text-gray-400 text-[11px]">
                    ${u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-SA') : 'تأسيسي'}
                  </td>
                  <td class="py-3.5 px-4 text-center">
                    ${!isCurrent ? `
                      <button class="btn-delete-system-user px-3 py-1 rounded-lg bg-clay/15 hover:bg-clay text-clay hover:text-white border border-clay/30 text-[11px] font-bold transition-all" data-username="${u.username}">
                        <i class="fa-solid fa-trash me-1"></i> حذف
                      </button>
                    ` : `
                      <span class="text-gray-500 text-[10px] italic">الحساب الحالي</span>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Helper badge generator for Approval Status
  renderApprovalBadge(status = "معتمد") {
    if (status === "معتمد") {
      return `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-palm/15 text-palm border border-palm/30 inline-flex items-center gap-1"><i class="fa-solid fa-circle-check"></i>معتمد</span>`;
    } else if (status === "قيد المراجعة") {
      return `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gold/15 text-gold border border-gold/30 inline-flex items-center gap-1"><i class="fa-solid fa-hourglass-half"></i>قيد المراجعة</span>`;
    } else {
      return `<span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/10 text-gray-400 border border-white/15 inline-flex items-center gap-1"><i class="fa-solid fa-file-pen"></i>مسودة</span>`;
    }
  }

  // Helper badge generator for Assignee
  renderAssigneeBadge(assignee = "غير مسند") {
    const clean = (assignee || "").trim();
    if (!clean || clean === "غير مسند" || clean === "unassigned" || clean === "لم يحدد") {
      return `<span class="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-white/5 text-gray-400 border border-white/10 inline-flex items-center gap-1 max-w-[150px] truncate" title="غير مسند"><i class="fa-solid fa-user-slash text-gray-500 text-[9px]"></i>غير مسند</span>`;
    }
    return `<span class="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-black/60 text-gray-300 border border-white/10 inline-flex items-center gap-1 max-w-[150px] truncate" title="المسؤول: ${clean}"><i class="fa-solid fa-user-tag text-gold text-[9px]"></i>${clean}</span>`;
  }

    /* ---------------- 0. DEDICATED TEAM TAB (فريق العمل - مخصص للمدير فقط) ---------------- */
  renderTeamTab(model) {
    if (!model.isAdmin()) {
      return `
        <div class="p-12 text-center rounded-3xl bg-black/85 border border-gold/40 space-y-6 max-w-xl mx-auto shadow-2xl shadow-gold/10 animate-fadeIn my-8">
          <div class="w-20 h-20 mx-auto rounded-3xl bg-gold/20 border border-gold/40 text-gold flex items-center justify-center text-4xl shadow-xl shadow-gold/20">
            <i class="fa-solid fa-user-lock"></i>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-center gap-2">
              <span class="px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/40 text-xs font-black">Admin Access Required</span>
            </div>
            <h3 class="text-2xl font-black text-white">منطقة إدارة الفريق مخصصة لمدير النظام</h3>
            <p class="text-xs text-gray-300 leading-relaxed">
              سجل أعضاء الفريق وتوزيع المهام وتعديل الصلاحيات معتمدة ومحصورة حصرياً على من لديه صلاحية مدير النظام (Admin) في المنصة.
            </p>
          </div>
          <div class="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onclick="window.App && window.App.planController ? window.App.planController.openLoginModal() : document.getElementById('auth-login-modal').classList.remove('hidden')" class="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gold hover:bg-white text-black font-black text-xs transition-all shadow-xl shadow-gold/20 flex items-center justify-center gap-2 cursor-pointer">
              <i class="fa-solid fa-crown"></i>
              <span>تسجيل الدخول كمدير نظام 👑</span>
            </button>
            <a href="index.html" class="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/15 text-xs font-bold transition-all text-center">
              العودة للرئيسية
            </a>
          </div>
        </div>
      `;
    }

    const members = model.getTeamMembers();
    const approvalStats = model.getApprovalStats();
    const taskStats = model.getTaskStats();
    const isAdmin = Boolean(model && model.isAdmin());

    return `
      <div class="flex flex-col gap-8 animate-fadeIn">
        <!-- Team Overview Banner -->
        <div class="p-6 rounded-2xl bg-gradient-to-r from-gold/20 via-black/80 to-laser/15 border border-gold/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex flex-col gap-1.5 max-w-xl">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                <i class="fa-solid fa-users-gear"></i>
                فريق العمل المصرح والمعتمد
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-laser/15 text-laser border border-laser/30">${members.length} أعضاء معتمدين</span>
            </div>
            <h3 class="text-2xl font-black text-white">فريق عمل وتطوير منظومة متحف السيرة الأحسائية</h3>
            <p class="text-xs text-gray-300 leading-relaxed">
              الأعضاء المعتمدون الذين يملكون صلاحيات الدخول وإدارة وتعديل وحسم المهام والقرارات والمشاهد في المنظومة.
            </p>
          </div>

          <!-- Quick Metrics Grid & Admin Link -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div class="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col min-w-[120px]">
              <span class="text-[11px] text-gray-400">نسبة اعتماد المحتوى</span>
              <span class="text-base font-black text-palm font-mono">${approvalStats.percent}% (${approvalStats.approved}/${approvalStats.totalItems})</span>
            </div>
            <div class="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-col min-w-[120px]">
              <span class="text-[11px] text-gray-400">إنجاز المهام</span>
              <span class="text-base font-black text-gold font-mono">${taskStats.progressPercent}% (${taskStats.completed}/${taskStats.total})</span>
            </div>
            
            ${isAdmin ? `
              <a href="team-admin.html" class="py-3 px-4 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-white hover:to-gold text-black text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/20 shrink-0">
                <i class="fa-solid fa-crown"></i>
                <span>إدارة وصلاحيات الفريق 👑</span>
              </a>
            ` : `
              <div class="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs text-gray-400">
                <i class="fa-solid fa-lock text-gold"></i>
                <span>إدارة الفريق حصرية للمدير (Admin)</span>
              </div>
            `}
          </div>
        </div>

        <!-- Team Members Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${members.map(m => {
            const assignments = model.getAssignmentsForMember(m.name);
            return `
              <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-gold/40 transition-all flex flex-col justify-between gap-5 relative group shadow-lg">
                <div class="flex flex-col gap-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-xl flex items-center justify-center font-black text-black text-lg shadow-lg" style="background-color: ${m.avatarColor || '#dfb15b'};">
                        ${(m.name || m.username).slice(0, 2)}
                      </div>
                      <div>
                        <h4 class="text-base font-extrabold text-white">${m.name}</h4>
                        <span class="text-xs text-gold font-semibold block">${m.role}</span>
                      </div>
                    </div>

                    <span class="text-[10px] px-2 py-0.5 rounded-full font-mono text-gray-400 bg-black/40 border border-white/10">
                      @${m.username}
                    </span>
                  </div>

                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-white/5 border border-white/10 text-gray-300">
                      المسار: ${m.track}
                    </span>
                    <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-gold/15 text-gold border border-gold/30">
                      ${assignments.length} مهام ومسؤوليات مسندة
                    </span>
                  </div>

                  <p class="text-xs text-gray-400 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/6">${m.bio || 'عضو فريق العمل المعتمد في المنظومة'}</p>

                  <div class="flex flex-col gap-1 text-xs text-gray-400 pt-1">
                    <span class="flex items-center gap-1.5"><i class="fa-solid fa-envelope text-gold text-[10px]"></i>${m.email || `${m.username}@seraj-museum.sa`}</span>
                    <span class="flex items-center gap-1.5"><i class="fa-solid fa-phone text-laser text-[10px]"></i>${m.phone || '+966 50 000 0000'}</span>
                  </div>
                </div>

                <!-- Assigned Items Mini Inspector -->
                <div class="pt-3 border-t border-white/8 flex flex-col gap-2">
                  <span class="text-[11px] font-bold text-gray-300 flex items-center justify-between">
                    <span>المسؤوليات والمهام المسندة إليه:</span>
                    <span class="font-mono text-gold text-xs font-bold">${assignments.length}</span>
                  </span>

                  <div class="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar text-[11px]">
                    ${assignments.length === 0 ? `
                      <span class="text-gray-500 italic">لا توجد عناصر مسندة حالياً لهذا العضو</span>
                    ` : assignments.map(a => `
                      <div class="p-1.5 rounded-lg bg-black/50 border border-white/6 flex items-center justify-between gap-2">
                        <span class="text-gray-300 truncate max-w-[170px]" title="${a.title}">${a.title}</span>
                        <span class="text-[9px] px-1.5 py-0.2 rounded ${a.approvalStatus === 'معتمد' ? 'bg-palm/20 text-palm' : 'bg-gold/20 text-gold'} font-bold shrink-0">${a.approvalStatus}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /* ---------------- 1. CORE IDENTITY TAB ---------------- */
  renderIdentityTab(model) {
    const d = model.data;
    const canEdit = model.canEdit();

    return `
      <div class="flex flex-col gap-8 animate-fadeIn">
        <!-- Hero Header & Vision -->
        <div class="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-gold/15 via-black/80 to-gold/5 border border-gold/30 shadow-2xl relative overflow-hidden">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gold/20 border border-gold/50 flex items-center justify-center text-gold text-2xl shadow-lg shadow-gold/20">
                <i class="fa-solid fa-landmark-dome"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-gold uppercase tracking-wider">${d.metadata.locationAr}</span>
                  ${canEdit ? `<button id="btn-edit-metadata" class="text-gray-400 hover:text-gold text-xs p-1" title="تعديل بيانات العنوان والهوية"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
                </div>
                <h3 class="text-2xl font-black text-white">${d.metadata.titleAr}</h3>
                <span class="text-xs text-gray-400">${d.metadata.subtitleAr}</span>
              </div>
            </div>
            <div class="px-5 py-2.5 rounded-full bg-gold/20 border border-gold/40 text-gold text-sm font-extrabold flex items-center gap-2 shadow-inner">
              <i class="fa-solid fa-kaaba"></i>
              <span>الشعار: ${d.metadata.sloganAr}</span>
            </div>
          </div>

          <div class="relative group/vision mt-2">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-gold"><i class="fa-solid fa-eye me-1"></i>رؤية المشروع والتأسيس:</span>
                ${this.renderApprovalBadge(d.intro.approvalStatus || 'معتمد')}
                ${this.renderAssigneeBadge(d.intro.assignee || 'غير مسند')}
              </div>
              ${canEdit ? `<button id="btn-edit-vision" class="text-gray-400 hover:text-gold text-xs p-1 flex items-center gap-1"><i class="fa-solid fa-pen"></i><span>تعديل الرؤية</span></button>` : ''}
            </div>
            <p class="text-sm md:text-base text-gray-300 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/6">${d.intro.visionAr}</p>
          </div>
        </div>

        <!-- The 3 Axes Overview Table -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-layer-group text-gold"></i>
              <span>المحاور الثلاثة لمنظومة المتحف</span>
            </h4>
            <span class="text-xs text-gray-400">قابلة للتنفيذ المجمع أو المرحلي المستقل</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            ${d.identity.axesTable.map((ax, idx) => `
              <div class="p-6 rounded-xl bg-white/[0.03] border border-white/10 hover:border-gold/30 transition-all flex flex-col justify-between gap-4 relative group">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-mono font-black text-gold px-2.5 py-1 rounded bg-gold/10">0${idx+1}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] px-2.5 py-0.5 rounded-full ${ax.complexity.includes('مرتفع') ? 'bg-clay/20 text-clay border border-clay/30' : 'bg-palm/20 text-palm border border-palm/30'} font-semibold">تعقيد: ${ax.complexity}</span>
                    ${canEdit ? `<button class="btn-edit-axis text-gray-400 hover:text-gold text-xs p-1" data-axis-index="${idx}" title="تعديل مواصفات المحور"><i class="fa-solid fa-pen"></i></button>` : ''}
                  </div>
                </div>
                <div>
                  <h5 class="text-base font-extrabold text-white mb-2">${ax.axis}</h5>
                  <p class="text-xs text-gray-400 leading-relaxed">${ax.nature}</p>
                </div>
                <div class="pt-3 border-t border-white/6 flex items-center justify-between text-xs text-gray-300">
                  <span class="text-gray-500"><i class="fa-regular fa-clock me-1 text-gold"></i>المدة المقترحة:</span>
                  <span class="font-bold text-gold">${ax.duration}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Creative Identity Core: "From Hajar to Paradise" -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-gold/20 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h4 class="text-lg font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-feather-pointed text-gold"></i>
                <span>الهوية الإبداعية الجامعة: «${d.identity.theme}»</span>
              </h4>
              ${this.renderApprovalBadge(d.identity.approvalStatus || 'معتمد')}
              ${this.renderAssigneeBadge(d.identity.assignee || 'غير مسند')}
            </div>
            ${canEdit ? `
            <div class="flex items-center gap-2">
              <button id="btn-edit-identity-core" class="px-3 py-1 rounded-lg bg-gold/15 text-gold hover:bg-gold hover:text-black text-xs font-bold transition-all"><i class="fa-solid fa-pen me-1"></i>تعديل المفهوم</button>
              <button id="btn-add-identity-app" class="px-3 py-1 rounded-lg bg-white/5 border border-white/15 text-gray-300 hover:text-white text-xs font-bold transition-all"><i class="fa-solid fa-plus me-1"></i>إضافة تطبيق</button>
            </div>
            ` : ''}
          </div>
          <p class="text-xs md:text-sm text-gray-300 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/6">
            ${d.identity.conceptAr}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            ${d.identity.applicationAr.map((app, idx) => `
              <div class="p-4 rounded-xl bg-black/30 border border-white/6 flex flex-col justify-between gap-2 relative group hover:border-gold/30 transition-all">
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs font-bold text-gold flex items-center gap-1.5">
                      <i class="fa-solid fa-circle-check text-[10px]"></i>
                      ${app.title}
                    </span>
                    ${canEdit ? `
                    <div class="flex items-center gap-1">
                      <button class="btn-edit-identity-app text-gray-400 hover:text-gold text-xs p-1" data-index="${idx}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn-delete-identity-app text-gray-500 hover:text-clay text-xs p-1" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    ` : ''}
                  </div>
                  <p class="text-xs text-gray-400 leading-relaxed mb-2">${app.desc}</p>
                </div>
                <div class="pt-2 border-t border-white/6 flex items-center justify-between">
                  ${this.renderApprovalBadge(app.approvalStatus || 'معتمد')}
                  ${this.renderAssigneeBadge(app.assignee || 'غير مسند')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Goals Section (Approved vs Proposed) -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-bullseye text-gold"></i>
              <span>أهداف المشروع المعتمدة والمقترحة (${d.intro.goals.length} أهداف)</span>
            </h4>
            ${canEdit ? `
            <button id="btn-add-goal" class="px-4 py-2 rounded-lg bg-gold text-black text-xs font-bold flex items-center gap-2 hover:bg-white transition-all shadow-md shadow-gold/20">
              <i class="fa-solid fa-plus"></i>
              <span>إضافة هدف جديد</span>
            </button>
            ` : ''}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${d.intro.goals.map((g, i) => `
              <div class="p-4 rounded-xl bg-white/[0.02] border ${g.approvalStatus === 'معتمد' ? 'border-gold/30' : 'border-laser/30'} flex flex-col justify-between gap-3 group hover:border-gold/50 transition-all">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3">
                    <div class="w-7 h-7 rounded-lg ${g.approvalStatus === 'معتمد' ? 'bg-gold/20 text-gold' : 'bg-laser/20 text-laser'} flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                      ${i+1}
                    </div>
                    <div class="flex flex-col gap-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        ${this.renderApprovalBadge(g.approvalStatus || (g.type === 'approved' ? 'معتمد' : 'قيد المراجعة'))}
                        ${this.renderAssigneeBadge(g.assignee || 'غير مسند')}
                      </div>
                      <p class="text-xs text-gray-300 leading-relaxed mt-1">${g.textAr}</p>
                    </div>
                  </div>

                  ${canEdit ? `
                  <div class="flex items-center gap-1 shrink-0">
                    <button class="btn-edit-goal text-gray-400 hover:text-gold text-xs p-1" data-goal-id="${g.id}" title="تعديل الهدف"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-delete-goal text-gray-500 hover:text-clay text-xs p-1" data-goal-id="${g.id}" title="حذف الهدف"><i class="fa-solid fa-trash"></i></button>
                  </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /* ---------------- 2. AXIS 1: ARTIFACTS TAB ---------------- */
  renderArtifactsTab(model) {
    const arts = model.getArtifacts();
    const proposedTools = model.getProposedTools();
    const canEdit = model.canEdit();

    return `
      <div class="flex flex-col gap-8 animate-fadeIn">
        <!-- Toolbar -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/8">
          <div class="flex flex-col">
            <h4 class="text-lg font-black text-white flex items-center gap-2">
              <i class="fa-solid fa-jar text-gold"></i>
              <span>المحور الأول: قاعة السيرة والآثار الأحسائية (${arts.length} قطع)</span>
            </h4>
            <span class="text-xs text-gray-400">القطع والمسميات التاريخية الواردة في السيرة النبوية والموثقة بالحجم الحقيقي والتفاصيل</span>
          </div>
          ${canEdit ? `
          <button id="btn-add-artifact" class="px-4 py-2 rounded-lg bg-gold text-black text-xs font-bold flex items-center gap-2 hover:bg-white transition-all shadow-md shadow-gold/20">
            <i class="fa-solid fa-plus"></i>
            <span>إضافة قطعة جديدة</span>
          </button>
          ` : ''}
        </div>

        <!-- Artifacts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          ${arts.map(art => `
            <div class="p-6 rounded-2xl bg-white/[0.02] border ${art.approvalStatus === 'معتمد' ? 'border-gold shadow-lg shadow-gold/10' : 'border-white/10'} flex flex-col justify-between gap-4 relative group hover:border-gold/40 transition-all">
              <div>
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div class="flex items-center gap-2">
                    <span class="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold text-sm font-bold">
                      <i class="fa-solid fa-gem"></i>
                    </span>
                    <h5 class="text-base font-extrabold text-white">${art.name}</h5>
                  </div>
                  <div class="flex items-center gap-2">
                    ${this.renderApprovalBadge(art.approvalStatus || (art.status === 'موثق' ? 'معتمد' : 'قيد المراجعة'))}
                    ${this.renderAssigneeBadge(art.assignee || 'غير مسند')}
                    ${canEdit ? `
                    <button class="btn-edit-artifact text-gray-400 hover:text-gold text-xs p-1" data-art-id="${art.id}" title="تعديل"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-delete-artifact text-gray-500 hover:text-clay text-xs p-1" data-art-id="${art.id}" title="حذف"><i class="fa-solid fa-trash"></i></button>
                    ` : ''}
                  </div>
                </div>

                <div class="flex flex-col gap-2.5 text-xs text-gray-300">
                  <div class="bg-black/40 p-3 rounded-lg border border-white/6">
                    <span class="text-gold font-bold block mb-1"><i class="fa-solid fa-book-open me-1 text-[10px]"></i>التعريف والمصدر النصي:</span>
                    <p class="text-gray-300 leading-relaxed">${art.source}</p>
                    ${art.definition ? `<p class="text-gray-400 mt-1 italic">${art.definition}</p>` : ''}
                  </div>

                  <div class="bg-black/40 p-3 rounded-lg border border-white/6">
                    <span class="text-laser font-bold block mb-1"><i class="fa-solid fa-ruler-combined me-1 text-[10px]"></i>الوصف والمقاس المخصص للحرفي:</span>
                    <p class="text-gray-300 leading-relaxed">${art.specs || 'غير محدد'}</p>
                  </div>
                </div>
              </div>

              <div class="pt-3 border-t border-white/8 flex items-center justify-between text-xs text-gray-400">
                <span class="text-gray-500 font-semibold"><i class="fa-solid fa-eye me-1 text-gold"></i>طريقة العرض:</span>
                <span class="text-gray-300 font-medium">${art.displayMethod || 'عرض قياسي'}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Proposed Tools Section -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-toolbox text-gold"></i>
              <span>الأدوات والموسويات الإضافية المقترحة لقسم السيرة (${proposedTools.length} أدوات)</span>
            </h4>
            ${canEdit ? `
            <button id="btn-add-proposed-tool" class="px-3 py-1.5 rounded-lg bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-black text-xs font-bold transition-all">
              <i class="fa-solid fa-plus me-1"></i>إضافة أداة مقترحة
            </button>
            ` : ''}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${proposedTools.map((tool, idx) => `
              <div class="p-4 rounded-xl bg-black/40 border border-white/6 flex flex-col justify-between gap-3 group hover:border-gold/30 transition-all">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1.5">
                    <span class="text-xs font-bold text-white flex items-center gap-1.5">
                      <i class="fa-solid fa-check-circle text-palm text-[11px]"></i>
                      ${tool.name}
                    </span>
                    ${canEdit ? `
                    <div class="flex items-center gap-1">
                      <button class="btn-edit-proposed-tool text-gray-400 hover:text-gold text-xs p-1" data-index="${idx}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn-delete-proposed-tool text-gray-500 hover:text-clay text-xs p-1" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    ` : ''}
                  </div>
                  <p class="text-xs text-gray-400 leading-relaxed mb-2">${tool.desc}</p>
                </div>
                <div class="pt-2 border-t border-white/6 flex items-center justify-between">
                  ${this.renderApprovalBadge(tool.approvalStatus || 'قيد المراجعة')}
                  ${this.renderAssigneeBadge(tool.assignee || 'غير مسند')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /* ---------------- 3. AXIS 1: SHARIA SCHOOLS TAB ---------------- */
  renderSchoolsTab(model) {
    const d = (model && model.data && model.data.hall2_schools) ? model.data.hall2_schools : {};
    const foundingQuote = d.foundingQuote || { text: '', scholar: '', significance: '' };
    const allSchools = (model && typeof model.getSchools === 'function') ? model.getSchools() : [];
    const schools = (model && typeof model.getFilteredSchools === 'function') ? model.getFilteredSchools() : allSchools;
    const canEdit = model && typeof model.canEdit === 'function' ? model.canEdit() : false;
    const viewMode = (model && model.schoolViewMode) ? model.schoolViewMode : 'cards';
    const filterMazhab = (model && model.schoolFilterMazhab) ? model.schoolFilterMazhab : 'all';
    const searchQuery = (model && model.schoolSearchQuery) ? model.schoolSearchQuery : '';

    const totalCount = allSchools.length;
    const waqfCount = allSchools.filter(s => s && (s.waqfText || s.waqfImage)).length;
    const hanafiCount = allSchools.filter(s => s && s.mazhab && String(s.mazhab).includes('حنفي')).length;
    const malikiCount = allSchools.filter(s => s && s.mazhab && String(s.mazhab).includes('مالكي')).length;
    const otherCount = allSchools.filter(s => s && s.mazhab && (String(s.mazhab).includes('جامع') || String(s.mazhab).includes('شافعي') || String(s.mazhab).includes('حنبلي'))).length;

    // Helper for Mazhab badge styling
    const getMazhabBadgeClass = (mazhab) => {
      const m = String(mazhab || '');
      if (m.includes('حنفي')) return 'bg-laser/15 text-laser border border-laser/30';
      if (m.includes('مالكي')) return 'bg-palm/15 text-palm border border-palm/30';
      if (m.includes('شافعي')) return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
      if (m.includes('حنبلي')) return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      return 'bg-gold/15 text-gold border border-gold/30';
    };

    // Helper for Status badge styling
    const getStatusBadgeClass = (status) => {
      const st = String(status || '');
      if (st.includes('معمورة') || st.includes('مرممة') || st.includes('تحفيظ')) {
        return { cls: 'bg-palm/15 text-palm border-palm/30', icon: 'fa-circle-check' };
      }
      if (st.includes('مهجورة') || st.includes('فضاء') || st.includes('أرض')) {
        return { cls: 'bg-clay/15 text-clay border-clay/30', icon: 'fa-triangle-exclamation' };
      }
      return { cls: 'bg-gold/15 text-gold border border-gold/30', icon: 'fa-landmark' };
    };

    return `
      <div class="flex flex-col gap-8 animate-fadeIn">
        
        <!-- Founding Historical Quote -->
        <div class="p-6 rounded-3xl bg-gradient-to-r from-gold/20 via-black/80 to-gold/10 border border-gold/40 shadow-xl relative group overflow-hidden">
          <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold text-sm font-bold shadow-inner">
                <i class="fa-solid fa-quote-right"></i>
              </span>
              <span class="text-xs font-black text-gold uppercase tracking-wider">المقولة التأسيسية لمدخل قاعة المدارس والأسانيد</span>
              ${this.renderApprovalBadge(d.foundingQuote?.approvalStatus || 'معتمد')}
              ${this.renderAssigneeBadge(d.foundingQuote?.assignee || 'غير مسند')}
            </div>
            ${canEdit ? `
            <button id="btn-edit-founding-quote" class="text-gray-400 hover:text-gold text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-gold/30 flex items-center gap-1.5 transition-all cursor-pointer">
              <i class="fa-solid fa-pen text-[10px]"></i><span>تعديل المقولة</span>
            </button>
            ` : ''}
          </div>
          
          <blockquote class="text-sm md:text-base text-gray-100 font-semibold leading-relaxed mb-4 pr-4 border-r-2 border-gold/40 font-sans">
            ${d.foundingQuote?.text || ''}
          </blockquote>
          
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs">
            <span class="text-gold font-bold flex items-center gap-1.5">
              <i class="fa-solid fa-feather-pointed text-xs"></i>
              <span>${d.foundingQuote?.scholar || ''}</span>
            </span>
            <span class="text-gray-400 italic bg-black/40 px-3 py-1 rounded-lg border border-white/5">${d.foundingQuote?.significance || ''}</span>
          </div>
        </div>

        <!-- Section Header & Quick Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div class="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold text-lg shrink-0">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <span class="text-[11px] text-gray-400 block font-medium">إجمالي المدارس التاريخية</span>
              <strong class="text-lg font-black text-white font-mono">${totalCount} مدرسة</strong>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-black/40 border border-laser/30 flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-laser/15 border border-laser/30 flex items-center justify-center text-laser text-lg shrink-0">
              <i class="fa-solid fa-scroll"></i>
            </div>
            <div>
              <span class="text-[11px] text-gray-400 block font-medium">صكوك الوقفيات الموثقة</span>
              <strong class="text-lg font-black text-laser font-mono">${waqfCount} صكاً وقفياً</strong>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-palm/15 border border-palm/30 flex items-center justify-center text-palm text-lg shrink-0">
              <i class="fa-solid fa-scale-balanced"></i>
            </div>
            <div>
              <span class="text-[11px] text-gray-400 block font-medium">المدارس المالكية</span>
              <strong class="text-lg font-black text-palm font-mono">${malikiCount} مدرسة</strong>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-laser/15 border border-laser/30 flex items-center justify-center text-laser text-lg shrink-0">
              <i class="fa-solid fa-book-quran"></i>
            </div>
            <div>
              <span class="text-[11px] text-gray-400 block font-medium">المدارس الحنفية والمشتركة</span>
              <strong class="text-lg font-black text-white font-mono">${hanafiCount + otherCount} مدرسة</strong>
            </div>
          </div>
        </div>

        <!-- 14 Documented Historical Schools Section -->
        <div class="flex flex-col gap-5">
          
          <!-- Filter & View Mode Switcher Toolbar -->
          <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 shadow-lg">
            
            <!-- Left: Search & Mazhab Filter -->
            <div class="flex flex-wrap items-center gap-2.5 flex-1">
              <!-- Live Search Box -->
              <div class="relative flex-1 sm:max-w-xs min-w-[200px]">
                <i class="fa-solid fa-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                <input type="text" id="input-school-search" value="${this.escapeHtml(searchQuery)}"
                       placeholder="ابحث بالاسم، الواقف، الموقع، أو نص الوقفية..."
                       class="w-full bg-black/70 border border-white/15 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-gold transition-all" />
              </div>

              <!-- Mazhab Filter Dropdown -->
              <div class="flex items-center gap-2">
                <select id="filter-school-mazhab" class="bg-black/70 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-gold cursor-pointer transition-all">
                  <option value="all" ${filterMazhab === 'all' ? 'selected' : ''}>جميع المذاهب الفقهية (${totalCount})</option>
                  <option value="حنفي" ${filterMazhab === 'حنفي' ? 'selected' : ''}>المذهب الحنفي (${hanafiCount})</option>
                  <option value="مالكي" ${filterMazhab === 'مالكي' ? 'selected' : ''}>المذهب المالكي (${malikiCount})</option>
                  <option value="شافعي" ${filterMazhab === 'شافعي' ? 'selected' : ''}>المذهب الشافعي</option>
                  <option value="حنبلي" ${filterMazhab === 'حنبلي' ? 'selected' : ''}>المذهب الحنبلي</option>
                  <option value="جامع" ${filterMazhab === 'جامع' ? 'selected' : ''}>جامع للمذاهب</option>
                </select>
              </div>
            </div>

            <!-- Right: View Mode Toggle & Add Button -->
            <div class="flex items-center gap-3 shrink-0">
              
              <!-- View Mode Switcher -->
              <div class="flex items-center bg-black/60 p-1 rounded-xl border border-white/10">
                <button type="button" id="btn-school-view-cards"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'cards' ? 'bg-gold text-black shadow-md shadow-gold/20' : 'text-gray-400 hover:text-white'}"
                        title="عرض كبطاقات مفصلة مريحة للقراءة والنصوص الطويلة">
                  <i class="fa-solid fa-table-cells-large"></i>
                  <span class="hidden sm:inline">بطاقات توثيقية</span>
                </button>
                <button type="button" id="btn-school-view-table"
                        class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'table' ? 'bg-gold text-black shadow-md shadow-gold/20' : 'text-gray-400 hover:text-white'}"
                        title="عرض كجدول مقارن أفقي">
                  <i class="fa-solid fa-table-list"></i>
                  <span class="hidden sm:inline">جدول مقارن</span>
                </button>
              </div>

              ${canEdit ? `
              <button id="btn-add-school" class="px-4 py-2 rounded-xl bg-gold text-black text-xs font-black flex items-center gap-2 hover:bg-white transition-all shadow-md shadow-gold/20 cursor-pointer shrink-0">
                <i class="fa-solid fa-plus"></i>
                <span>إضافة مدرسة ووقفية 📜</span>
              </button>
              ` : ''}

            </div>

          </div>

          <!-- Empty State -->
          ${schools.length === 0 ? `
            <div class="p-12 text-center text-gray-400 rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
              <i class="fa-solid fa-school-circle-xmark text-4xl text-gray-600 mb-2 block"></i>
              <h5 class="text-base font-bold text-white">لا توجد مدارس مطابقة لبحثك</h5>
              <p class="text-xs text-gray-400">يرجى تعديل معايير البحث أو اختيار مذهب فقهي آخر.</p>
            </div>
          ` : ''}

          <!-- VIEW MODE 1: RICH DOCUMENTARY CARDS VIEW (DEFAULT & OPTIMAL FOR LONG TEXTS) -->
          ${viewMode === 'cards' && schools.length > 0 ? `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              ${schools.map(s => {
                const hasWaqf = Boolean(s.waqfText || s.waqfImage);
                const mazhabBadge = getMazhabBadgeClass(s.mazhab);
                const statusBadge = getStatusBadgeClass(s.status);

                return `
                  <div class="p-6 rounded-3xl bg-white/[0.02] hover:bg-white/[0.04] border ${hasWaqf ? 'border-gold/30 hover:border-gold/60' : 'border-white/10 hover:border-white/20'} transition-all duration-300 shadow-xl hover:shadow-2xl flex flex-col justify-between gap-5 relative group">
                    
                    <!-- Card Top Bar: Name, Mazhab, Year & Status -->
                    <div class="flex flex-col gap-3 pb-4 border-b border-white/8">
                      <div class="flex flex-wrap items-start justify-between gap-3">
                        <div class="flex items-center gap-3 flex-1 min-w-[200px]">
                          <div class="w-11 h-11 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold text-lg shrink-0 shadow-inner">
                            <i class="fa-solid fa-landmark"></i>
                          </div>
                          <div>
                            <h5 class="text-base sm:text-lg font-black text-white group-hover:text-gold transition-colors leading-snug">
                              ${s.name}
                            </h5>
                            <div class="flex items-center gap-2 mt-1 flex-wrap">
                              <span class="px-2.5 py-0.5 rounded-full font-bold text-[11px] ${mazhabBadge}">
                                <i class="fa-solid fa-book-quran me-1 text-[10px]"></i>${s.mazhab}
                              </span>
                              <span class="px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] bg-white/5 border border-white/15 text-gray-300">
                                <i class="fa-regular fa-calendar-days me-1 text-gold"></i>${s.year}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="px-3 py-1 rounded-xl font-bold text-xs border ${statusBadge.cls} flex items-center gap-1.5">
                            <i class="fa-solid ${statusBadge.icon} text-[10px]"></i>
                            <span>${s.status}</span>
                          </span>
                          ${this.renderApprovalBadge(s.approvalStatus || 'معتمد')}
                          ${this.renderAssigneeBadge(s.assignee || 'غير مسند')}
                        </div>
                      </div>
                    </div>

                    <!-- Card Body: Two Balanced, Spacious Columns (History + Waqf Deed) -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      
                      <!-- Box 1: الواقف والموقع والتوثيق التاريخي -->
                      <div class="p-4 rounded-2xl bg-black/40 border border-white/6 flex flex-col justify-between gap-3 shadow-inner">
                        <div class="space-y-2">
                          <span class="text-gold font-bold flex items-center gap-1.5 text-xs">
                            <i class="fa-solid fa-landmark-dome text-[11px]"></i>
                            <span>الواقف والموقع وأول مدرّس:</span>
                          </span>
                          <p class="text-gray-200 leading-relaxed text-xs sm:text-[13px] font-sans break-words">
                            ${s.founder || 'لم يتم تسجيل بيانات المؤسس بعد.'}
                          </p>
                        </div>

                        <div class="pt-2 border-t border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
                          <span><i class="fa-solid fa-location-dot text-laser me-1"></i>الأحساء التاريخية</span>
                          <span class="text-gray-400 font-mono">${s.year}</span>
                        </div>
                      </div>

                      <!-- Box 2: صك الوقفية والمخطوطة 📜 -->
                      <div class="p-4 rounded-2xl ${hasWaqf ? 'bg-gold/[0.04] border-gold/30' : 'bg-black/30 border-white/6'} border flex flex-col justify-between gap-3">
                        <div class="space-y-2">
                          <div class="flex items-center justify-between">
                            <span class="text-laser font-bold flex items-center gap-1.5 text-xs">
                              <i class="fa-solid fa-scroll text-[11px]"></i>
                              <span>صك الوقفية والمخطوطة:</span>
                            </span>
                            ${s.waqfImage ? '<span class="px-2 py-0.5 rounded bg-palm/15 text-palm text-[10px] font-bold border border-palm/30 flex items-center gap-1"><i class="fa-solid fa-image"></i><span>مخطوطة متوفرة</span></span>' : ''}
                          </div>

                          ${hasWaqf ? `
                            <p class="text-gray-300 leading-relaxed text-xs sm:text-[12px] line-clamp-3 bg-black/40 p-2.5 rounded-xl border border-white/5 font-sans">
                              ${s.waqfText || 'صك الوقفية معتمد وموثق.'}
                            </p>
                          ` : `
                            <div class="p-3 text-center text-gray-500 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-xs">
                              <i class="fa-regular fa-file-lines text-base mb-1 block opacity-60"></i>
                              <span>لا يوجد نص مفرغ للوقفية حالياً</span>
                            </div>
                          `}
                        </div>

                        <div class="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                          ${hasWaqf ? `
                            <button class="btn-view-waqf w-full py-2 px-3 rounded-xl bg-gold/20 hover:bg-gold hover:text-black text-gold border border-gold/40 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                    data-sch-id="${s.id}">
                              <i class="fa-solid fa-book-open"></i>
                              <span>عرض صك الوقفية والمخطوطة 📜</span>
                            </button>
                          ` : (canEdit ? `
                            <button class="btn-edit-school w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-gold/20 hover:text-gold text-gray-400 border border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    data-sch-id="${s.id}">
                              <i class="fa-solid fa-plus text-[10px]"></i>
                              <span>إرفاق نص الوقفية أو المخطوطة</span>
                            </button>
                          ` : '<span class="text-gray-500 text-xs text-center w-full block">—</span>')}
                        </div>
                      </div>

                    </div>

                    <!-- Card Actions Footer -->
                    <div class="pt-3 border-t border-white/8 flex items-center justify-between gap-2 text-xs">
                      <div class="flex items-center gap-2 text-gray-400 text-[11px]">
                        <i class="fa-solid fa-shield-halved text-gold"></i>
                        <span>سجل موثق بالدراسة التنفيذية لمتحف السيرة</span>
                      </div>

                      ${canEdit ? `
                      <div class="flex items-center gap-1.5">
                        <button class="btn-edit-school px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-gold hover:text-black text-gray-300 hover:border-gold border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                data-sch-id="${s.id}" title="تعديل المدرسة والوقفية">
                          <i class="fa-solid fa-pen text-[10px]"></i>
                          <span>تعديل</span>
                        </button>
                        <button class="btn-delete-school px-3 py-1.5 rounded-xl bg-white/5 hover:bg-clay hover:text-white text-gray-400 hover:border-clay border border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                data-sch-id="${s.id}" title="حذف المدرسة">
                          <i class="fa-solid fa-trash text-[10px]"></i>
                          <span>حذف</span>
                        </button>
                      </div>
                      ` : ''}
                    </div>

                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}

          <!-- VIEW MODE 2: ENHANCED WIDE RESPONSIVE TABLE VIEW -->
          ${viewMode === 'table' && schools.length > 0 ? `
            <div class="overflow-x-auto rounded-3xl border border-white/10 bg-black/40 shadow-2xl">
              <table class="w-full text-right text-xs border-collapse min-w-[1250px]">
                <thead class="bg-white/5 border-b border-white/10 text-gold font-bold">
                  <tr>
                    <th class="p-4 w-[240px]">المدرسة / الرباط</th>
                    <th class="p-4 w-[110px]">المذهب</th>
                    <th class="p-4 w-[100px]">سنة التأسيس</th>
                    <th class="p-4 min-w-[340px] max-w-[440px]">الواقف، الموقع، وأول مدرّس</th>
                    <th class="p-4 w-[180px]">صك الوقفية والمخطوطة 📜</th>
                    <th class="p-4 w-[160px]">الحالة اليوم</th>
                    <th class="p-4 w-[130px]">الاعتماد</th>
                    <th class="p-4 w-[130px]">المسؤول</th>
                    <th class="p-4 w-[110px] text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/6 text-gray-300">
                  ${schools.map(s => {
                    const hasWaqf = Boolean(s.waqfText || s.waqfImage);
                    const mazhabBadge = getMazhabBadgeClass(s.mazhab);
                    const statusBadge = getStatusBadgeClass(s.status);

                    return `
                      <tr class="hover:bg-white/[0.03] transition-colors">
                        <td class="p-4">
                          <div class="flex items-center gap-2.5">
                            <span class="w-7 h-7 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0 text-xs">
                              <i class="fa-solid fa-graduation-cap"></i>
                            </span>
                            <span class="font-black text-white text-sm leading-snug">${s.name}</span>
                          </div>
                        </td>
                        <td class="p-4 whitespace-nowrap">
                          <span class="px-2.5 py-1 rounded-full font-bold text-[10px] ${mazhabBadge}">
                            ${s.mazhab}
                          </span>
                        </td>
                        <td class="p-4 font-mono font-bold text-gray-300 whitespace-nowrap">${s.year}</td>
                        <td class="p-4">
                          <p class="text-gray-200 leading-relaxed text-xs break-words font-sans">
                            ${s.founder}
                          </p>
                        </td>
                        <td class="p-4 whitespace-nowrap">
                          ${hasWaqf ? `
                            <button class="btn-view-waqf px-3 py-1.5 rounded-xl bg-gold/15 hover:bg-gold hover:text-black text-gold text-[11px] font-black border border-gold/40 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                                    data-sch-id="${s.id}" title="عرض صك الوقفية والمخطوطة">
                              <i class="fa-solid fa-scroll text-laser"></i>
                              <span>صك الوقفية 📜</span>
                              ${s.waqfImage ? '<i class="fa-solid fa-image text-[9px] text-palm" title="صورة المخطوطة متوفرة"></i>' : ''}
                            </button>
                          ` : (canEdit ? `
                            <button class="btn-edit-school px-2.5 py-1 rounded-xl bg-white/5 hover:bg-gold/20 text-gray-400 hover:text-gold text-[10px] border border-white/10 flex items-center gap-1 transition-all cursor-pointer"
                                    data-sch-id="${s.id}">
                              <i class="fa-solid fa-plus text-[9px]"></i>
                              <span>إرفاق الوقفية</span>
                            </button>
                          ` : '<span class="text-gray-500 text-[10px]">لا توجد وقفية</span>')}
                        </td>
                        <td class="p-4 whitespace-nowrap">
                          <span class="px-2.5 py-1 rounded-xl text-[11px] font-bold border ${statusBadge.cls}">
                            ${s.status}
                          </span>
                        </td>
                        <td class="p-4 whitespace-nowrap">
                          ${this.renderApprovalBadge(s.approvalStatus || 'معتمد')}
                        </td>
                        <td class="p-4 whitespace-nowrap">
                          ${this.renderAssigneeBadge(s.assignee || 'غير مسند')}
                        </td>
                        <td class="p-4 text-center whitespace-nowrap">
                          ${canEdit ? `
                          <div class="flex items-center justify-center gap-1">
                            <button class="btn-edit-school w-7 h-7 rounded-lg bg-white/5 hover:bg-gold hover:text-black text-gray-300 flex items-center justify-center text-xs transition-all cursor-pointer"
                                    data-sch-id="${s.id}" title="تعديل المدرسة والوقفية">
                              <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn-delete-school w-7 h-7 rounded-lg bg-white/5 hover:bg-clay hover:text-white text-gray-400 flex items-center justify-center text-xs transition-all cursor-pointer"
                                    data-sch-id="${s.id}" title="حذف المدرسة">
                              <i class="fa-solid fa-trash"></i>
                            </button>
                          </div>
                          ` : '<span class="text-gray-600 text-xs">—</span>'}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

        </div>

        <!-- Visual Waqf Deeds & Manuscripts Showcase Cards -->
        <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-black/90 via-cardBg to-black/95 border border-gold/30 shadow-2xl space-y-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full bg-laser/15 text-laser border border-laser/30 text-[10px] font-black">
                  Waqf Deeds & Heritage Manuscripts
                </span>
              </div>
              <h4 class="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <i class="fa-solid fa-scroll text-gold"></i>
                <span>معرض وثائق وصكوك وقفيات المدارس الأحسائية</span>
              </h4>
              <p class="text-xs text-gray-400 leading-relaxed">استعراض المخطوطات الأصلية ونصوص الأوقاف المشروطة للإنفاق على العلم والعلماء والطلاب</p>
            </div>
            <span class="text-xs px-3.5 py-1.5 rounded-xl bg-gold/10 border border-gold/30 text-gold font-bold font-mono">
              ${allSchools.filter(s => s.waqfText || s.waqfImage).length} صكوك موثقة
            </span>
          </div>

          <!-- Waqf Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${allSchools.filter(s => s.waqfText || s.waqfImage).map(s => {
              const mazhabBadge = getMazhabBadgeClass(s.mazhab);

              return `
                <div class="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-gold/25 hover:border-gold/60 transition-all space-y-4 shadow-lg flex flex-col justify-between group">
                  
                  <div class="space-y-3">
                    <!-- Header: Name & Mazhab -->
                    <div class="flex items-center justify-between gap-2 pb-2 border-b border-white/5">
                      <h5 class="text-sm font-black text-white group-hover:text-gold transition-colors flex items-center gap-2">
                        <i class="fa-solid fa-graduation-cap text-gold"></i>
                        <span>${s.name}</span>
                      </h5>
                      <div class="flex items-center gap-1.5">
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${mazhabBadge}">
                          ${s.mazhab}
                        </span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 border border-white/15 text-gray-300 font-mono">
                          ${s.year}
                        </span>
                      </div>
                    </div>

                    <!-- Waqf Image Preview Thumbnail (if uploaded) -->
                    ${s.waqfImage ? `
                      <div class="relative w-full h-36 rounded-xl overflow-hidden border border-gold/30 bg-black/60 group/img cursor-pointer btn-view-waqf" data-sch-id="${s.id}">
                        <img src="${s.waqfImage}" alt="${s.name}" class="w-full h-full object-contain p-1 group-hover/img:scale-105 transition-transform duration-300">
                        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-[2px]">
                          <i class="fa-solid fa-magnifying-glass-plus text-base text-gold"></i>
                          <span>تكبير المخطوطة وقراءة الصك</span>
                        </div>
                      </div>
                    ` : `
                      <div class="w-full h-24 rounded-xl border border-dashed border-white/15 bg-black/30 flex flex-col items-center justify-center text-gray-500 gap-1.5 text-xs">
                        <i class="fa-regular fa-image text-lg"></i>
                        <span class="text-[10px]">لم يتم رفع صورة المخطوطة بعد</span>
                      </div>
                    `}

                    <!-- Waqf Deed Transcript Snippet -->
                    <div class="space-y-1.5">
                      <span class="text-[10px] font-bold text-gold flex items-center gap-1">
                        <i class="fa-solid fa-quote-right text-[9px]"></i>
                        <span>نص صك الوقفية المعتمد:</span>
                      </span>
                      <p class="text-[11px] text-gray-300 leading-relaxed line-clamp-4 bg-black/40 p-2.5 rounded-xl border border-white/5 font-sans">
                        ${s.waqfText || 'لا يوجد نص مكتوب للوقفية حالياً.'}
                      </p>
                    </div>
                  </div>

                  <!-- Footer: Actions -->
                  <div class="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <button class="btn-view-waqf px-3.5 py-1.5 rounded-xl bg-gold text-black font-black text-xs hover:bg-white transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                            data-sch-id="${s.id}">
                      <i class="fa-solid fa-book-open"></i>
                      <span>قراءة الصك كاملاً</span>
                    </button>

                    ${canEdit ? `
                    <button class="btn-edit-school px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            data-sch-id="${s.id}">
                      <i class="fa-solid fa-pen text-gold text-[10px]"></i>
                      <span>تعديل</span>
                    </button>
                    ` : ''}
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Scholars Network & Sheikh Al-Doghan Students -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Scholars Network -->
          <div class="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col justify-between gap-5 shadow-xl">
            <div class="space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-white/8">
                <div class="flex items-center gap-2.5">
                  <span class="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold text-sm">
                    <i class="fa-solid fa-network-wired"></i>
                  </span>
                  <div>
                    <h4 class="text-base font-black text-white">شبكة العلماء والمذاهب الوافدة</h4>
                    <span class="text-[10px] text-gray-400">ملتقى علمي جامع للمذاهب الأربعة</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  ${this.renderApprovalBadge(d.scholarsNetwork?.approvalStatus || 'معتمد')}
                  ${this.renderAssigneeBadge(d.scholarsNetwork?.assignee || 'غير مسند')}
                  ${canEdit ? `
                  <button id="btn-edit-scholars-summary" class="text-gray-400 hover:text-gold text-xs p-1 cursor-pointer" title="تعديل الشرح"><i class="fa-solid fa-pen"></i></button>
                  ` : ''}
                </div>
              </div>

              <p class="text-xs sm:text-[13px] text-gray-200 leading-relaxed font-sans bg-black/40 p-3.5 rounded-2xl border border-white/5">
                ${d.scholarsNetwork?.summary || ''}
              </p>
              
              <div class="space-y-2 pt-2 border-t border-white/6">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-gold flex items-center gap-1.5">
                    <i class="fa-solid fa-plane-arrival text-[11px]"></i>
                    <span>قائمة كبار العلماء الوافدين للأحساء:</span>
                  </span>
                  ${canEdit ? `
                  <button id="btn-add-visiting-scholar" class="text-xs text-laser hover:underline cursor-pointer font-bold"><i class="fa-solid fa-plus me-1"></i>إضافة عالم</button>
                  ` : ''}
                </div>
                <div class="flex flex-wrap gap-2">
                  ${(d.scholarsNetwork?.visitingScholars || []).map((v, idx) => `
                    <span class="px-3 py-1 rounded-xl bg-white/5 border border-white/10 hover:border-gold/30 text-xs text-gray-200 flex items-center gap-2 transition-colors">
                      <i class="fa-solid fa-user-tie text-[10px] text-gold"></i>
                      <span>${v}</span>
                      ${canEdit ? `<button class="btn-delete-visiting-scholar text-gray-500 hover:text-clay text-[10px] cursor-pointer" data-index="${idx}"><i class="fa-solid fa-xmark"></i></button>` : ''}
                    </span>
                  `).join('')}
                </div>
              </div>

              <div class="p-3.5 rounded-2xl bg-laser/10 border border-laser/30 flex flex-col gap-1">
                <span class="text-xs font-bold text-laser flex items-center gap-1.5">
                  <i class="fa-solid fa-lightbulb text-[11px]"></i>
                  <span>تجديد الفقه الشافعي والحركة العلمية:</span>
                </span>
                <p class="text-xs text-gray-200 leading-relaxed font-sans">${d.scholarsNetwork?.shafiiRevival || ''}</p>
              </div>
            </div>
          </div>

          <!-- Sheikh Al-Doghan Students Table -->
          <div class="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col justify-between gap-4 shadow-xl">
            <div class="space-y-3">
              <div class="flex items-center justify-between pb-3 border-b border-white/8">
                <div class="flex items-center gap-2.5">
                  <span class="w-9 h-9 rounded-xl bg-laser/15 border border-laser/30 flex items-center justify-center text-laser text-sm">
                    <i class="fa-solid fa-user-graduate"></i>
                  </span>
                  <div>
                    <h4 class="text-base font-black text-white">تلاميذ الشيخ أحمد بن عبدالله الدوغان</h4>
                    <span class="text-[10px] text-gray-400">تنوع المذاهب الفقهية تحت مظلة حلقة واحدة</span>
                  </div>
                </div>
                ${canEdit ? `
                <button id="btn-add-doghan-student" class="px-3 py-1.5 rounded-xl bg-laser/20 text-laser border border-laser/40 text-xs font-bold hover:bg-laser hover:text-black transition-all cursor-pointer">
                  <i class="fa-solid fa-plus me-1"></i>إضافة تلميذ
                </button>
                ` : ''}
              </div>

              <div class="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                <table class="w-full text-right text-xs">
                  <thead class="bg-white/5 border-b border-white/10 text-gold font-bold">
                    <tr>
                      <th class="p-3">اسم العالم / التلميذ</th>
                      <th class="p-3">المذهب الفقهي / التخصص</th>
                      <th class="p-3">الاعتماد</th>
                      <th class="p-3">المسؤول</th>
                      <th class="p-3 text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/6 text-gray-300">
                    ${(d.scholarsNetwork?.doghanStudents || []).map((st, idx) => `
                      <tr class="hover:bg-white/[0.03] transition-colors">
                        <td class="p-3 font-bold text-white whitespace-nowrap">
                          <div class="flex items-center gap-2">
                            <i class="fa-solid fa-user-check text-laser text-xs"></i>
                            <span>${st.name}</span>
                          </div>
                        </td>
                        <td class="p-3 whitespace-nowrap">
                          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getMazhabBadgeClass(st.mazhab)}">
                            ${st.mazhab}
                          </span>
                        </td>
                        <td class="p-3 whitespace-nowrap">${this.renderApprovalBadge(st.approvalStatus || 'معتمد')}</td>
                        <td class="p-3 whitespace-nowrap">${this.renderAssigneeBadge(st.assignee || 'غير مسند')}</td>
                        <td class="p-3 text-center whitespace-nowrap">
                          ${canEdit ? `
                          <button class="btn-edit-student text-gray-400 hover:text-gold p-1" data-index="${idx}"><i class="fa-solid fa-pen"></i></button>
                          <button class="btn-delete-student text-gray-500 hover:text-clay p-1 ms-1" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
                          ` : '<span class="text-gray-600 text-xs">—</span>'}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  renderHologramTab(model) {
    const h = model.data?.hologram || {};
    const specs = h.specs || { duration: "16–18 دقيقة", capacity: "60–80 مقعداً" };
    const historicalStories = h.historicalStories || [];
    const scenes = model.getScenes();
    const canEdit = model.canEdit();

    return `
      <div class="flex flex-col gap-8 animate-fadeIn">
        <!-- Hologram Overview Header -->
        <div class="p-6 rounded-2xl bg-gradient-to-r from-laser/15 via-black/70 to-gold/10 border border-laser/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-laser/20 border border-laser/40 flex items-center justify-center text-laser text-2xl shadow-lg shadow-laser/20">
              <i class="fa-solid fa-vr-cardboard"></i>
            </div>
            <div>
              <span class="text-xs font-bold text-laser uppercase tracking-wider">المحور الثاني: الإنتاج السينمائي والدرامي</span>
              <h3 class="text-xl font-black text-white">العرض السينمائي بتقنية الهولوجرام (Pepper's Ghost)</h3>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs"><i class="fa-regular fa-clock me-1 text-gold"></i>${specs.duration}</span>
            <span class="px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs"><i class="fa-solid fa-users me-1 text-laser"></i>${specs.capacity}</span>
            ${canEdit ? `
            <button id="btn-edit-hologram-specs" class="px-3 py-1.5 rounded-lg bg-laser/20 border border-laser/40 text-laser hover:bg-laser hover:text-black text-xs font-bold transition-all"><i class="fa-solid fa-pen"></i></button>
            ` : ''}
          </div>
        </div>

        <!-- 8 Detailed Scenes Breakdown -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-film text-gold"></i>
              <span>السيناريو الكامل وتفصيل المشاهد (${scenes.length} مشاهد)</span>
            </h4>
            ${canEdit ? `
            <button id="btn-add-scene" class="px-4 py-2 rounded-lg bg-gold text-black text-xs font-bold flex items-center gap-2 hover:bg-white transition-all shadow-md shadow-gold/20">
              <i class="fa-solid fa-plus"></i>
              <span>إضافة مشهد جديد</span>
            </button>
            ` : ''}
          </div>

          <div class="grid grid-cols-1 gap-5">
            ${scenes.map(s => `
              <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-gold/30 transition-all flex flex-col gap-4">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-white/6">
                  <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center font-mono font-bold text-gold text-sm">
                      0${s.num}
                    </span>
                    <h5 class="text-base font-extrabold text-white">المشهد ${s.num}: ${s.title}</h5>
                  </div>
                  <div class="flex items-center gap-2">
                    ${this.renderApprovalBadge(s.approvalStatus || 'معتمد')}
                    ${this.renderAssigneeBadge(s.assignee || 'غير مسند')}
                    <span class="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">
                      <i class="fa-regular fa-clock me-1 text-[10px]"></i>${s.duration}
                    </span>
                    ${canEdit ? `
                    <button class="btn-edit-scene text-gray-400 hover:text-gold text-xs p-1" data-scene-num="${s.num}" title="تعديل تفاصيل المشهد"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-delete-scene text-gray-500 hover:text-clay text-xs p-1" data-scene-num="${s.num}" title="حذف المشهد"><i class="fa-solid fa-trash"></i></button>
                    ` : ''}
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div class="p-3.5 rounded-xl bg-black/40 border border-white/6 flex flex-col gap-1.5">
                    <span class="text-laser font-bold flex items-center gap-1.5">
                      <i class="fa-solid fa-location-dot text-[10px]"></i>المكان والزمن:
                    </span>
                    <p class="text-gray-300">${s.setting}</p>
                    
                    <span class="text-laser font-bold mt-2 flex items-center gap-1.5">
                      <i class="fa-solid fa-eye text-[10px]"></i>الوصف البصري والتقني:
                    </span>
                    <p class="text-gray-300 leading-relaxed">${s.visualDesc}</p>
                  </div>

                  <div class="p-3.5 rounded-xl bg-black/40 border border-white/6 flex flex-col gap-1.5">
                    <span class="text-gold font-bold flex items-center gap-1.5">
                      <i class="fa-solid fa-microphone-lines text-[10px]"></i>الصوت والنص والحوار:
                    </span>
                    <p class="text-gray-300 leading-relaxed">${s.audioText}</p>

                    <span class="text-palm font-bold mt-2 flex items-center gap-1.5">
                      <i class="fa-solid fa-heart-pulse text-[10px]"></i>الغرض الدرامي والأثر:
                    </span>
                    <p class="text-gray-300 leading-relaxed">${s.dramaticPurpose}</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Documented Stories Reference Table -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-scroll text-gold"></i>
              <span>توثيق القصص التاريخية المعتمدة في العرض (${historicalStories.length} قصص)</span>
            </h4>
            ${canEdit ? `
            <button id="btn-add-historical-story" class="px-3 py-1.5 rounded-lg bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-black text-xs font-bold transition-all"><i class="fa-solid fa-plus me-1"></i>إضافة قصة تاريخية</button>
            ` : ''}
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-right text-xs">
              <thead class="text-gold font-bold border-b border-white/10 bg-white/5">
                <tr>
                  <th class="p-3">القصة / الحدث</th>
                  <th class="p-3">المصدر والتخريج</th>
                  <th class="p-3">الاعتماد</th>
                  <th class="p-3">المسؤول</th>
                  <th class="p-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/6 text-gray-300">
                ${historicalStories.map((st, idx) => `
                  <tr>
                    <td class="p-3 font-bold text-white whitespace-nowrap">${st.title}</td>
                    <td class="p-3 text-gray-300 leading-relaxed">${st.source}</td>
                    <td class="p-3 whitespace-nowrap">
                      ${this.renderApprovalBadge(st.approvalStatus || (st.verified ? 'معتمد' : 'قيد المراجعة'))}
                    </td>
                    <td class="p-3 whitespace-nowrap">
                      ${this.renderAssigneeBadge(st.assignee || 'غير مسند')}
                    </td>
                    <td class="p-3 text-center whitespace-nowrap">
                      ${canEdit ? `
                      <button class="btn-edit-story text-gray-400 hover:text-gold p-1" data-index="${idx}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn-delete-story text-gray-500 hover:text-clay p-1 ms-1" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
                      ` : '<span class="text-gray-600 text-xs">—</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /* ---------------- 5. AXIS 3: VIRTUAL REALITY (VR 4D) TAB ---------------- */
  renderVRTab(model) {
    const vr = model.data?.vrExperience || {};
    const canEdit = model.canEdit();

    return `
      <div class="flex flex-col gap-8 animate-fadeIn">
        <div class="p-6 rounded-2xl bg-gradient-to-r from-palm/15 via-black/70 to-gold/10 border border-palm/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-palm/20 border border-palm/40 flex items-center justify-center text-palm text-2xl shadow-lg shadow-palm/20">
              <i class="fa-solid fa-headset"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-palm uppercase tracking-wider">المحور الثالث: التجربة الفردية الغامرة</span>
                ${this.renderApprovalBadge(vr.approvalStatus || 'معتمد')}
                ${this.renderAssigneeBadge(vr.assignee || 'غير مسند')}
              </div>
              <h3 class="text-xl font-black text-white mt-0.5">كرسي حركي 4D وتجربة الواقع الافتراضي الفردية</h3>
            </div>
          </div>
          ${canEdit ? `
          <button id="btn-edit-vr-specs" class="px-4 py-2 rounded-xl bg-palm text-black text-xs font-bold flex items-center gap-2 hover:bg-white transition-all shadow-md shadow-palm/20">
            <i class="fa-solid fa-pen"></i>
            <span>تعديل مواصفات تجربة VR</span>
          </button>
          ` : ''}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
            <span class="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold text-lg">
              <i class="fa-solid fa-chair"></i>
            </span>
            <h4 class="text-base font-bold text-white">العتاد والأنظمة الحركية</h4>
            <p class="text-xs text-gray-300 leading-relaxed">${vr.hardware || 'كرسي حركي 4D + نظارة واقع افتراضي متقدمة'}</p>
          </div>

          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
            <span class="w-10 h-10 rounded-xl bg-laser/10 border border-laser/30 flex items-center justify-center text-laser text-lg">
              <i class="fa-solid fa-wind"></i>
            </span>
            <h4 class="text-base font-bold text-white">المؤثرات الحسية المتزامنة</h4>
            <p class="text-xs text-gray-300 leading-relaxed">${vr.sensoryEffects || 'اهتزاز، ميلان حركي، رذاذ ماء، نفحات هواء'}</p>
          </div>

          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
            <span class="w-10 h-10 rounded-xl bg-palm/10 border border-palm/30 flex items-center justify-center text-palm text-lg">
              <i class="fa-solid fa-truck-ramp-box"></i>
            </span>
            <h4 class="text-base font-bold text-white">القابلية للنقل والفعاليات</h4>
            <p class="text-xs text-gray-300 leading-relaxed">${vr.mobility || 'قاعدة متحركة متطورة تتيح النقل بين المهرجانات'}</p>
          </div>

          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
            <span class="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold text-lg">
              <i class="fa-solid fa-stopwatch"></i>
            </span>
            <h4 class="text-base font-bold text-white">المدة والسعة التشغيلية</h4>
            <p class="text-xs text-gray-300 leading-relaxed">${vr.capacity || '2-4 وحدات متزامنة'} — المدة: ${vr.duration || '5-8 دقائق'}</p>
          </div>

          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 md:col-span-2 flex flex-col gap-3">
            <span class="w-10 h-10 rounded-xl bg-laser/10 border border-laser/30 flex items-center justify-center text-laser text-lg">
              <i class="fa-solid fa-clapperboard"></i>
            </span>
            <h4 class="text-base font-bold text-white">مفهوم المحتوى والفيلم المستقل</h4>
            <p class="text-xs text-gray-300 leading-relaxed">${vr.sceneConcept || 'محتوى مستقل مخصص للـ VR'}</p>
          </div>
        </div>
      </div>
    `;
  }

  /* ---------------- 6. LOCATION & SPATIAL AREAS TAB ---------------- */
  renderLocationTab(model) {
    const locs = model.data?.locationAndAreas?.locations || [];
    const areas = model.data?.locationAndAreas?.areasTable || [];
    const canEdit = model.canEdit();

    return `
      <div class="flex flex-col gap-8 animate-fadeIn">
        <!-- 4 Locations Matrix -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-map-location-dot text-gold"></i>
              <span>مقارنة المقترحات الموقعية (${locs.length} مواقع)</span>
            </h4>
            ${canEdit ? `
            <button id="btn-add-location" class="px-4 py-2 rounded-lg bg-gold text-black text-xs font-bold flex items-center gap-2 hover:bg-white transition-all shadow-md shadow-gold/20">
              <i class="fa-solid fa-plus"></i>
              <span>إضافة موقع جديد</span>
            </button>
            ` : ''}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            ${locs.map(loc => `
              <div class="p-6 rounded-2xl bg-white/[0.02] border ${loc.id === 'loc_modern_kut' ? 'border-gold shadow-lg shadow-gold/10' : 'border-white/10'} flex flex-col justify-between gap-4 group hover:border-gold/40 transition-all">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <h5 class="text-base font-extrabold text-white">${loc.name}</h5>
                    <div class="flex items-center gap-2">
                      ${this.renderApprovalBadge(loc.approvalStatus || (loc.id === 'loc_modern_kut' ? 'معتمد' : 'قيد المراجعة'))}
                      ${this.renderAssigneeBadge(loc.assignee || 'غير مسند')}
                      ${canEdit ? `
                      <button class="btn-edit-location text-gray-400 hover:text-gold text-xs p-1" data-loc-id="${loc.id}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn-delete-location text-gray-500 hover:text-clay text-xs p-1" data-loc-id="${loc.id}"><i class="fa-solid fa-trash"></i></button>
                      ` : ''}
                    </div>
                  </div>
                  <p class="text-xs text-gray-400 mb-3">${loc.desc}</p>
                  
                  <div class="flex flex-col gap-2 text-xs">
                    <div class="p-2.5 rounded-lg bg-palm/10 border border-palm/20 text-gray-300">
                      <strong class="text-palm block mb-0.5"><i class="fa-solid fa-plus-circle me-1"></i>المميزات:</strong>
                      ${loc.pros}
                    </div>
                    <div class="p-2.5 rounded-lg bg-clay/10 border border-clay/20 text-gray-300">
                      <strong class="text-clay block mb-0.5"><i class="fa-solid fa-triangle-exclamation me-1"></i>التحديات:</strong>
                      ${loc.cons}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Areas Table -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-ruler-combined text-gold"></i>
              <span>جدول المساحات التقديرية وتوزيع الفراغات (${areas.length} فراغات)</span>
            </h4>
            ${canEdit ? `
            <button id="btn-add-area-item" class="px-3 py-1.5 rounded-lg bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-black text-xs font-bold transition-all"><i class="fa-solid fa-plus me-1"></i>إضافة فراغ</button>
            ` : ''}
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-right text-xs">
              <thead class="text-gold font-bold border-b border-white/10 bg-white/5">
                <tr>
                  <th class="p-3.5">الفراغ الوظيفي</th>
                  <th class="p-3.5">المساحة التقديرية</th>
                  <th class="p-3.5">المتطلبات الهندسية والملاحظات</th>
                  <th class="p-3.5">الاعتماد</th>
                  <th class="p-3.5">المسؤول</th>
                  <th class="p-3.5 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/6 text-gray-300">
                ${areas.map((a, idx) => `
                  <tr class="${a.space.includes('الإجمالي') ? 'bg-gold/10 font-bold text-white' : ''}">
                    <td class="p-3.5 font-bold">${a.space}</td>
                    <td class="p-3.5 font-mono text-gold whitespace-nowrap">${a.area}</td>
                    <td class="p-3.5 text-gray-400">${a.notes}</td>
                    <td class="p-3.5 whitespace-nowrap">${this.renderApprovalBadge(a.approvalStatus || 'معتمد')}</td>
                    <td class="p-3.5 whitespace-nowrap">${this.renderAssigneeBadge(a.assignee || 'غير مسند')}</td>
                    <td class="p-3.5 text-center whitespace-nowrap">
                      ${canEdit ? `
                      <button class="btn-edit-area-item text-gray-400 hover:text-gold p-1" data-index="${idx}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn-delete-area-item text-gray-500 hover:text-clay p-1 ms-1" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
                      ` : '<span class="text-gray-600 text-xs">—</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /* ---------------- 7. BUDGET & OPERATIONS TAB ---------------- */
  renderFinanceTab(model) {
    const b = model.data?.budget || { items: [], totalFullProject: "2,750,000 – 6,450,000 ريال سعودي", phase1Only: "900,000 – 2,100,000 ريال سعودي" };
    const op = model.data?.operations || { stages: [], ticketsModel: [], staffStructure: [], sustainabilityAndWaqf: [] };
    const budgetItems = b.items || [];
    const stages = op.stages || [];
    const tickets = op.ticketsModel || [];
    const staff = op.staffStructure || [];
    const waqf = op.sustainabilityAndWaqf || [];
    const canEdit = model.canEdit();

    return `
      <div class="flex flex-col gap-8 animate-fadeIn">
        <!-- Budget Capex Breakdown -->
        <div class="p-6 rounded-2xl bg-gradient-to-r from-gold/20 via-black/70 to-laser/10 border border-gold/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-gold uppercase tracking-wider">التصور المالي والموازنة التقديرية (Capex)</span>
              ${this.renderApprovalBadge(b.approvalStatus || 'معتمد')}
              ${this.renderAssigneeBadge(b.assignee || 'غير مسند')}
            </div>
            <h3 class="text-2xl font-black text-white mt-1">${b.totalFullProject}</h3>
          </div>
          <div class="flex items-center gap-3">
            <div class="p-3 rounded-xl bg-black/60 border border-gold/30 text-xs">
              <span class="text-gray-400 block mb-0.5">المرحلة الأولى Pilot:</span>
              <span class="font-extrabold text-gold text-sm">${b.phase1Only}</span>
            </div>
            ${canEdit ? `
            <button id="btn-edit-budget-totals" class="px-3 py-2 rounded-xl bg-gold/20 border border-gold/40 text-gold hover:bg-gold hover:text-black text-xs font-bold transition-all"><i class="fa-solid fa-pen"></i></button>
            ` : ''}
          </div>
        </div>

        <!-- Capex Items Table -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-coins text-gold"></i>
              <span>بنود الموازنة التقديرية (${budgetItems.length} بنود)</span>
            </h4>
            ${canEdit ? `
            <button id="btn-add-budget-item" class="px-3 py-1.5 rounded-lg bg-gold text-black text-xs font-bold flex items-center gap-1.5 hover:bg-white transition-all"><i class="fa-solid fa-plus"></i>إضافة بند مالي</button>
            ` : ''}
          </div>

          <div class="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
            <table class="w-full text-right text-xs">
              <thead class="bg-white/5 border-b border-white/10 text-gold font-bold">
                <tr>
                  <th class="p-3.5">البند الإنشائي / التقني</th>
                  <th class="p-3.5">نطاق التكلفة التقديرية</th>
                  <th class="p-3.5">يشمل</th>
                  <th class="p-3.5">الاعتماد</th>
                  <th class="p-3.5">المسؤول</th>
                  <th class="p-3.5 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/6 text-gray-300">
                ${budgetItems.map((item, idx) => `
                  <tr>
                    <td class="p-3.5 font-bold text-white">${item.item}</td>
                    <td class="p-3.5 font-mono text-gold whitespace-nowrap">${item.costRange}</td>
                    <td class="p-3.5 text-gray-300">${item.includes}</td>
                    <td class="p-3.5 whitespace-nowrap">${this.renderApprovalBadge(item.approvalStatus || 'معتمد')}</td>
                    <td class="p-3.5 whitespace-nowrap">${this.renderAssigneeBadge(item.assignee || 'غير مسند')}</td>
                    <td class="p-3.5 text-center whitespace-nowrap">
                      ${canEdit ? `
                      <button class="btn-edit-budget-item text-gray-400 hover:text-gold p-1" data-index="${idx}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn-delete-budget-item text-gray-500 hover:text-clay p-1 ms-1" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
                      ` : '<span class="text-gray-600 text-xs">—</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Operations & Stages -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <h4 class="text-base font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-bars-progress text-gold"></i>
                <span>مراحل التنفيذ الست (${stages.length} مراحل)</span>
              </h4>
              ${canEdit ? `
              <button id="btn-add-operation-stage" class="px-3 py-1.5 rounded-lg bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-black text-xs font-bold transition-all"><i class="fa-solid fa-plus me-1"></i>إضافة مرحلة</button>
              ` : ''}
            </div>
            <div class="flex flex-col gap-3">
              ${stages.map((stg, idx) => `
                <div class="p-3.5 rounded-xl bg-black/40 border border-white/6 flex flex-col gap-1 relative group hover:border-gold/30 transition-all">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-white text-xs">${stg.phase}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-[11px] font-mono text-gold px-2 py-0.5 rounded bg-gold/10">${stg.duration}</span>
                      ${canEdit ? `
                      <button class="btn-edit-op-stage text-gray-400 hover:text-gold text-xs p-1" data-index="${idx}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn-delete-op-stage text-gray-500 hover:text-clay text-xs p-1" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
                      ` : ''}
                    </div>
                  </div>
                  <p class="text-xs text-gray-400 mt-1">${stg.desc}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <h4 class="text-base font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-ticket text-gold"></i>
                <span>نموذج التذاكر والإيرادات (${tickets.length} فئات)</span>
              </h4>
              ${canEdit ? `
              <button id="btn-add-ticket-item" class="px-2.5 py-1 rounded-lg bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-black text-xs font-bold"><i class="fa-solid fa-plus me-1"></i>إضافة فئة</button>
              ` : ''}
            </div>
            <div class="flex flex-col gap-3">
              ${tickets.map((t, idx) => `
                <div class="p-3.5 rounded-xl bg-black/40 border border-white/6 flex items-center justify-between text-xs group hover:border-gold/30">
                  <div>
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="font-bold text-white">${t.category}</span>
                      ${this.renderApprovalBadge(t.approvalStatus || 'معتمد')}
                    </div>
                    <span class="text-[11px] text-gray-400">${t.notes}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-gold px-2.5 py-1 rounded bg-gold/10 whitespace-nowrap">${t.price}</span>
                    ${canEdit ? `
                    <button class="btn-edit-ticket text-gray-500 hover:text-gold text-xs p-1" data-index="${idx}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-delete-ticket text-gray-500 hover:text-clay text-xs p-1" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Waqf & Sustainability -->
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <h4 class="text-base font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-hand-holding-dollar text-gold"></i>
                <span>استدامة التمويل ونموذج الوقف العلمي (${waqf.length} ركائز)</span>
              </h4>
              ${canEdit ? `
              <button id="btn-add-waqf-pillar" class="px-2.5 py-1 rounded-lg bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-black text-xs font-bold"><i class="fa-solid fa-plus me-1"></i>إضافة ركيزة</button>
              ` : ''}
            </div>
            <div class="flex flex-col gap-3">
              ${waqf.map((w, idx) => `
                <div class="p-3.5 rounded-xl bg-black/40 border border-white/6 text-xs flex flex-col gap-1 group hover:border-gold/30">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-gold flex items-center gap-1.5">
                      <i class="fa-solid fa-mosque text-[10px]"></i>
                      ${w.pillar}
                    </span>
                    <div class="flex items-center gap-1">
                      ${this.renderApprovalBadge(w.approvalStatus || 'معتمد')}
                      ${canEdit ? `
                      <button class="btn-edit-waqf text-gray-400 hover:text-gold text-xs p-1" data-index="${idx}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn-delete-waqf text-gray-500 hover:text-clay text-xs p-1" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
                      ` : ''}
                    </div>
                  </div>
                  <p class="text-gray-400 leading-relaxed">${w.desc}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 6 Implementation Stages Timeline -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-timeline text-gold"></i>
              <span>مراحل التنفيذ والجدول الزمني (${stages.length} مراحل)</span>
            </h4>
            ${canEdit ? `
            <button id="btn-add-stage" class="px-3 py-1.5 rounded-lg bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-black text-xs font-bold"><i class="fa-solid fa-plus me-1"></i>إضافة مرحلة</button>
            ` : ''}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${stages.map((stg, i) => `
              <div class="p-4 rounded-xl bg-black/30 border border-white/6 flex flex-col justify-between gap-2 group hover:border-gold/30 transition-all">
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-mono font-bold text-gold">المرحلة ${i+1}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300 font-mono"><i class="fa-regular fa-clock me-1 text-gold"></i>${stg.duration}</span>
                      ${canEdit ? `
                      <button class="btn-edit-stage text-gray-400 hover:text-gold text-xs p-1" data-index="${i}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn-delete-stage text-gray-500 hover:text-clay text-xs p-1" data-index="${i}"><i class="fa-solid fa-trash"></i></button>
                      ` : ''}
                    </div>
                  </div>
                  <h5 class="text-xs font-bold text-white">${stg.phase}</h5>
                  <p class="text-xs text-gray-400 leading-relaxed mt-1 mb-2">${stg.desc}</p>
                </div>
                <div class="pt-2 border-t border-white/6 flex items-center justify-between">
                  ${this.renderApprovalBadge(stg.approvalStatus || 'معتمد')}
                  ${this.renderAssigneeBadge(stg.assignee || 'غير مسند')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /* ---------------- 8. SOUVENIR STORE & REFERENCES TAB ---------------- */
  renderStoreRefsTab(model) {
    const souv = model.data.souvenirs;
    const partners = model.data.partners;
    const refs = model.data.references;
    const canEdit = model.canEdit();

    return `
      <div class="flex flex-col gap-8 animate-fadeIn">
        <!-- Souvenir Products Grid -->
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-gift text-gold"></i>
              <span>المنتجات التذكارية المصغرة للمتجر والمتحف (${souv.length} منتجات)</span>
            </h4>
            ${canEdit ? `
            <button id="btn-add-souvenir" class="px-4 py-2 rounded-lg bg-gold text-black text-xs font-bold flex items-center gap-2 hover:bg-white transition-all shadow-md shadow-gold/20">
              <i class="fa-solid fa-plus"></i>
              <span>إضافة منتج تذكاري</span>
            </button>
            ` : ''}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${souv.map((s, idx) => `
              <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between gap-3 group hover:border-gold/30 transition-all">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1.5">
                    <h5 class="text-sm font-bold text-white">${s.name}</h5>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-mono font-bold text-gold px-2 py-0.5 rounded bg-gold/10">${s.price}</span>
                      ${canEdit ? `
                      <button class="btn-edit-souvenir text-gray-400 hover:text-gold text-xs p-1" data-index="${idx}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn-delete-souvenir text-gray-500 hover:text-clay text-xs p-1" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
                      ` : ''}
                    </div>
                  </div>
                  <p class="text-xs text-gray-400 leading-relaxed mb-2">${s.desc}</p>
                </div>
                <div class="pt-2 border-t border-white/6 flex items-center justify-between">
                  ${this.renderApprovalBadge(s.approvalStatus || 'معتمد')}
                  ${this.renderAssigneeBadge(s.assignee || 'غير مسند')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Strategic Partners Grid -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-handshake text-gold"></i>
              <span>الجهات والشركاء المقترح التنسيق معهم (${partners.length} جهات)</span>
            </h4>
            ${canEdit ? `
            <button id="btn-add-partner" class="px-3 py-1.5 rounded-lg bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-black text-xs font-bold transition-all"><i class="fa-solid fa-plus me-1"></i>إضافة جهة شريكة</button>
            ` : ''}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${partners.map((p, idx) => `
              <div class="p-4 rounded-xl bg-black/40 border border-white/6 flex flex-col justify-between gap-2 group hover:border-gold/30 transition-all">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="text-xs font-bold text-white flex items-center gap-1.5">
                      <i class="fa-solid fa-building-columns text-gold text-[11px]"></i>
                      ${p.name}
                    </span>
                    ${canEdit ? `
                    <div class="flex items-center gap-1">
                      <button class="btn-edit-partner text-gray-400 hover:text-gold text-xs p-1" data-index="${idx}"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn-delete-partner text-gray-500 hover:text-clay text-xs p-1" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    ` : ''}
                  </div>
                  <p class="text-xs text-gray-400 leading-relaxed mb-2">${p.role}</p>
                </div>
                <div class="pt-2 border-t border-white/6 flex items-center justify-between">
                  ${this.renderApprovalBadge(p.approvalStatus || 'معتمد')}
                  ${this.renderAssigneeBadge(p.assignee || 'غير مسند')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- References List -->
        <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-book-bookmark text-gold"></i>
              <span>قائمة المصادر والمراجع الموثقة (${refs.length} مراجع)</span>
            </h4>
            ${canEdit ? `
            <button id="btn-add-reference" class="px-3 py-1.5 rounded-lg bg-gold/15 text-gold border border-gold/30 hover:bg-gold hover:text-black text-xs font-bold transition-all"><i class="fa-solid fa-plus me-1"></i>إضافة مرجع موثق</button>
            ` : ''}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${refs.map((r, i) => `
              <div class="p-3.5 rounded-xl bg-black/30 border border-white/6 flex items-start justify-between gap-3 group hover:border-gold/30 transition-all">
                <div class="flex items-start gap-3">
                  <span class="w-6 h-6 rounded-full bg-gold/15 text-gold text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">${i+1}</span>
                  <div class="flex flex-col gap-1">
                    <strong class="text-xs text-white">${r.title}</strong>
                    <span class="text-[11px] text-gold">${r.author}</span>
                    <p class="text-[11px] text-gray-400 leading-relaxed">${r.notes}</p>
                    <div class="flex items-center gap-2 mt-1">
                      ${this.renderApprovalBadge(r.approvalStatus || 'معتمد')}
                      ${this.renderAssigneeBadge(r.assignee || 'غير مسند')}
                    </div>
                  </div>
                </div>
                ${canEdit ? `
                <div class="flex items-center gap-1 shrink-0">
                  <button class="btn-edit-reference text-gray-400 hover:text-gold text-xs p-1" data-index="${i}"><i class="fa-solid fa-pen"></i></button>
                  <button class="btn-delete-reference text-gray-500 hover:text-clay text-xs p-1" data-index="${i}"><i class="fa-solid fa-trash"></i></button>
                </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /* ---------------- 9. TEAM COLLABORATION & TASKS TAB ---------------- */
  renderTasksTab(model) {
    const stats = model.getTaskStats();
    const tasks = model.getFilteredTasks();
    const filterTrack = model.taskFilterTrack;
    const filterStatus = model.taskFilterStatus;
    const canEdit = model.canEdit();

    return `
      <div class="flex flex-col gap-6 animate-fadeIn">
        <!-- Team Stats Header & Progress -->
        <div class="p-6 rounded-2xl bg-gradient-to-r from-gold/20 via-black/80 to-laser/15 border border-gold/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex flex-col gap-1.5 max-w-md">
            <span class="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-users-gear"></i>
              غرفة العمل الجماعي وتوزيع المهام
            </span>
            <h3 class="text-xl font-black text-white">لوحة متابعة وإسناد مهام فريق العمل</h3>
            <p class="text-xs text-gray-300 leading-relaxed">
              توزيع وإدارة كافة المهام التنفيذية والشرعية والتقنية والمعمارية بين أعضاء الفريق ومتابعة الإنجاز لحظياً.
            </p>
          </div>

          <!-- Quick Progress Bar & Counters -->
          <div class="flex flex-col gap-3 w-full md:w-80 p-4 rounded-xl bg-black/60 border border-white/10">
            <div class="flex items-center justify-between text-xs font-bold">
              <span class="text-gray-300">نسبة الإنجاز الإجمالية</span>
              <span class="text-gold font-mono text-sm">${stats.progressPercent}% (${stats.completed}/${stats.total})</span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-gold to-palm transition-all duration-500 rounded-full" style="width: ${stats.progressPercent}%;"></div>
            </div>
            <div class="grid grid-cols-4 gap-1 text-center text-[10px] pt-1">
              <div class="p-1 rounded bg-palm/15 text-palm font-bold">${stats.completed} مكتمل</div>
              <div class="p-1 rounded bg-gold/15 text-gold font-bold">${stats.inProgress} جارٍ</div>
              <div class="p-1 rounded bg-laser/15 text-laser font-bold">${stats.review} مراجعة</div>
              <div class="p-1 rounded bg-white/10 text-gray-400 font-bold">${stats.notStarted} جديد</div>
            </div>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/8">
          <div class="flex flex-wrap items-center gap-2">
            <!-- Track Filter -->
            <select id="filter-task-track" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold">
              <option value="all" ${filterTrack === 'all' ? 'selected' : ''}>جميع المسارات التخصصية</option>
              <option value="شرعي وتاريخي" ${filterTrack === 'شرعي وتاريخي' ? 'selected' : ''}>شرعي وتاريخي</option>
              <option value="تصميم ومقتنيات" ${filterTrack === 'تصميم ومقتنيات' ? 'selected' : ''}>تصميم ومقتنيات</option>
              <option value="سينما وهولوجرام" ${filterTrack === 'سينما وهولوجرام' ? 'selected' : ''}>سينما وهولوجرام</option>
              <option value="موقع وتراخيص" ${filterTrack === 'موقع وتراخيص' ? 'selected' : ''}>موقع وتراخيص</option>
              <option value="تمويل واستدامة" ${filterTrack === 'تمويل واستدامة' ? 'selected' : ''}>تمويل واستدامة</option>
            </select>

            <!-- Status Filter -->
            <select id="filter-task-status" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold">
              <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>جميع الحالات</option>
              <option value="لم تبدأ" ${filterStatus === 'لم تبدأ' ? 'selected' : ''}>لم تبدأ</option>
              <option value="قيد التنفيذ" ${filterStatus === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
              <option value="للمراجعة" ${filterStatus === 'للمراجعة' ? 'selected' : ''}>للمراجعة</option>
              <option value="مكتمل" ${filterStatus === 'مكتمل' ? 'selected' : ''}>مكتمل</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            ${canEdit ? `
            <button id="btn-add-task" class="px-4 py-2 rounded-lg bg-gradient-to-r from-gold to-gold-dark text-black text-xs font-black flex items-center gap-2 hover:from-white hover:to-gold transition-all shadow-md shadow-gold/20">
              <i class="fa-solid fa-plus"></i>
              <span>إضافة مهمة جديدة</span>
            </button>
            ` : ''}
          </div>
        </div>

        <!-- Task Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${tasks.length === 0 ? `
            <div class="col-span-full p-12 rounded-2xl bg-white/[0.02] border border-white/8 text-center text-gray-400">
              <i class="fa-solid fa-list-check text-4xl text-gray-600 mb-3 block"></i>
              <span>لا توجد مهام مطابقة لخيارات التصفية المختارة</span>
            </div>
          ` : tasks.map(t => {
            const isCompleted = t.status === 'مكتمل';
            const isCritical = t.priority === 'حرجة';
            return `
              <div class="p-5 rounded-2xl bg-white/[0.02] border ${isCompleted ? 'border-palm/30 bg-palm/[0.02]' : (isCritical ? 'border-clay/40 shadow-sm' : 'border-white/10')} flex flex-col justify-between gap-4 relative group hover:border-gold/30 transition-all">
                <div class="flex flex-col gap-2.5">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                      t.track === 'شرعي وتاريخي' ? 'bg-laser/15 text-laser border border-laser/30' :
                      t.track === 'تصميم ومقتنيات' ? 'bg-gold/15 text-gold border border-gold/30' :
                      t.track === 'سينما وهولوجرام' ? 'bg-palm/15 text-palm border border-palm/30' :
                      'bg-white/10 text-gray-300 border border-white/20'
                    }">
                      ${t.track}
                    </span>

                    <div class="flex items-center gap-1.5">
                      ${this.renderApprovalBadge(t.approvalStatus || 'معتمد')}
                      <span class="text-[10px] px-2 py-0.5 rounded font-bold ${
                        t.priority === 'حرجة' ? 'bg-clay/20 text-clay border border-clay/30' :
                        t.priority === 'عالية' ? 'bg-gold/20 text-gold border border-gold/30' :
                        'bg-white/5 text-gray-400'
                      }">
                        ${t.priority}
                      </span>
                    </div>
                  </div>

                  <h5 class="text-sm font-extrabold text-white leading-snug group-hover:text-gold transition-colors">${t.title}</h5>
                  ${t.notes ? `<p class="text-xs text-gray-400 bg-black/40 p-2.5 rounded-lg border border-white/6 leading-relaxed">${t.notes}</p>` : ''}
                </div>

                <div class="pt-3 border-t border-white/8 flex flex-col gap-2.5 text-xs">
                  <div class="flex items-center justify-between text-gray-300">
                    <span class="text-gray-500"><i class="fa-solid fa-user-tag me-1 text-gold"></i>المسؤول:</span>
                    <span class="font-bold text-white">${t.assignee}</span>
                  </div>

                  <div class="flex items-center justify-between text-gray-300">
                    <span class="text-gray-500"><i class="fa-regular fa-calendar me-1 text-laser"></i>الموعد:</span>
                    <span class="font-mono text-gray-300 text-[11px]">${t.dueDate || 'مفتوح'}</span>
                  </div>

                  <!-- Quick Status Dropdown & Action Buttons -->
                  <div class="flex items-center justify-between gap-2 pt-2 border-t border-white/6">
                    <select class="task-status-select bg-black/70 border border-white/15 rounded px-2 py-1 text-[11px] font-bold outline-none ${
                      t.status === 'مكتمل' ? 'text-palm border-palm/40' :
                      t.status === 'قيد التنفيذ' ? 'text-gold border-gold/40' :
                      t.status === 'للمراجعة' ? 'text-laser border-laser/40' : 'text-gray-400'
                    }" data-task-id="${t.id}" ${canEdit ? '' : 'disabled pointer-events-none opacity-80'}>
                      <option value="لم تبدأ" ${t.status === 'لم تبدأ' ? 'selected' : ''}>لم تبدأ</option>
                      <option value="قيد التنفيذ" ${t.status === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
                      <option value="للمراجعة" ${t.status === 'للمراجعة' ? 'selected' : ''}>للمراجعة</option>
                      <option value="مكتمل" ${t.status === 'مكتمل' ? 'selected' : ''}>مكتمل</option>
                    </select>

                    ${canEdit ? `
                    <div class="flex items-center gap-1">
                      <button class="btn-edit-task text-gray-400 hover:text-gold p-1.5 text-xs" data-task-id="${t.id}" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn-delete-task text-gray-500 hover:text-clay p-1.5 text-xs" data-task-id="${t.id}" title="حذف"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /* ---------------- 10. PENDING DECISIONS (SECTION 11) TAB ---------------- */
  renderDecisionsTab(model) {
    const decisions = model.getPendingDecisions();
    const canEdit = model.canEdit();

    return `
      <div class="flex flex-col gap-6 animate-fadeIn">
        <div class="p-6 rounded-2xl bg-gradient-to-r from-clay/15 via-black/80 to-gold/15 border border-clay/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span class="text-xs font-bold text-clay uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-clipboard-question"></i>
              غرفة مراجعة وحسم القرارات المعلقة (القسم ١١)
            </span>
            <h3 class="text-xl font-black text-white mt-1">البنود المطلوب اعتمادها وحسمها من الإدارة والفريق</h3>
          </div>
          ${canEdit ? `
          <button id="btn-add-pending-decision" class="px-4 py-2 rounded-lg bg-clay text-white text-xs font-bold flex items-center gap-2 hover:bg-white hover:text-black transition-all shadow-md shadow-clay/20">
            <i class="fa-solid fa-plus"></i>
            <span>إضافة بند قرار جديد</span>
          </button>
          ` : ''}
        </div>

        <div class="grid grid-cols-1 gap-5">
          ${decisions.map(dec => `
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-gold/30 transition-all flex flex-col gap-4">
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span class="w-8 h-8 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center text-gold text-sm font-bold">
                    <i class="fa-solid fa-circle-question"></i>
                  </span>
                  <h5 class="text-base font-extrabold text-white">${dec.title}</h5>
                </div>
                <div class="flex items-center gap-2">
                  ${this.renderApprovalBadge(dec.approvalStatus || 'قيد المراجعة')}
                  ${this.renderAssigneeBadge(dec.assignee || 'غير مسند')}
                  ${canEdit ? `
                  <button class="btn-edit-decision-details text-gray-400 hover:text-gold text-xs p-1" data-decision-id="${dec.id}" title="تعديل السؤال والتوصية"><i class="fa-solid fa-pen"></i></button>
                  <button class="btn-delete-decision text-gray-500 hover:text-clay text-xs p-1" data-decision-id="${dec.id}" title="حذف القرار"><i class="fa-solid fa-trash"></i></button>
                  ` : ''}
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                <div class="p-4 rounded-xl bg-black/40 border border-white/6 flex flex-col gap-2">
                  <span class="text-clay font-bold block"><i class="fa-solid fa-circle-exclamation me-1"></i>المطلوب حسمه:</span>
                  <p class="text-gray-300 leading-relaxed">${dec.question}</p>
                  
                  <span class="text-palm font-bold block mt-1"><i class="fa-solid fa-lightbulb me-1"></i>التوصية العلمية / التنفيذية:</span>
                  <p class="text-gray-300 leading-relaxed">${dec.recommendation}</p>
                </div>

                <div class="p-4 rounded-xl bg-black/40 border border-white/6 flex flex-col justify-between gap-3">
                  <div class="flex flex-col gap-2">
                    <label class="text-gold font-bold text-xs"><i class="fa-solid fa-check-double me-1"></i>القرار المعتمد:</label>
                    <select class="decision-status-select bg-black border border-white/15 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold" data-decision-id="${dec.id}" ${canEdit ? '' : 'disabled pointer-events-none opacity-80'}>
                      ${dec.decisionOptions.map(opt => `
                        <option value="${opt}" ${dec.status === opt ? 'selected' : ''}>${opt}</option>
                      `).join('')}
                    </select>

                    <label class="text-gray-400 font-bold text-xs mt-1">ملاحظات وقرارات الفريق:</label>
                    <textarea class="decision-notes-input bg-black border border-white/15 rounded-lg p-2 text-xs text-white outline-none focus:border-gold resize-none h-16" placeholder="اكتب قرار وملاحظات الفريق هنا..." data-decision-id="${dec.id}" ${canEdit ? '' : 'readonly disabled opacity-80'}>${dec.teamNotes || ''}</textarea>
                  </div>

                  ${canEdit ? `
                  <button class="btn-save-decision self-end px-4 py-1.5 rounded-lg bg-gold/20 border border-gold/40 text-gold hover:bg-gold hover:text-black text-xs font-bold transition-all" data-decision-id="${dec.id}">
                    <i class="fa-solid fa-floppy-disk me-1"></i>حفظ القرار
                  </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ---------------- 11. EXPORT & COLLABORATION TOOLS TAB ---------------- */
  renderExportToolsTab(model) {
    const canEdit = model.canEdit();
    const isAdmin = model.isAdmin();

    return `
      <div class="flex flex-col gap-8 animate-fadeIn">
        <div class="p-6 rounded-2xl bg-gradient-to-r from-gold/15 via-black/80 to-laser/15 border border-gold/30 shadow-xl">
          <span class="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-2">
            <i class="fa-solid fa-share-nodes"></i>
            أدوات التصدير والمزامنة ومشاركة الفريق
          </span>
          <h3 class="text-xl font-black text-white mt-1">تصدير واستيراد وطباعة التقرير التنفيذي الشامل</h3>
          <p class="text-xs text-gray-300 leading-relaxed mt-1">
            كافة التعديلات التي تقوم بها تحفظ تلقائياً، ويمكنك تصديرها كملف Markdown أو مشاركتها كبيانات JSON مع الفريق.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <!-- Export Markdown Card -->
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-gold/40 transition-all flex flex-col justify-between gap-4">
            <div>
              <div class="w-12 h-12 rounded-xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center text-xl mb-3">
                <i class="fa-brands fa-markdown"></i>
              </div>
              <h4 class="text-base font-bold text-white mb-1">تصدير كملف Markdown تنفيذي (.md)</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                تحميل وثيقة الدراسة الشاملة منسقة بكافة الجداول والمشاهد والمهام ومسؤولي الفريق وحالات الاعتماد بصيغة Markdown.
              </p>
            </div>
            <button id="btn-export-markdown" class="w-full py-2.5 rounded-xl bg-gold text-black text-xs font-bold flex items-center justify-center gap-2 hover:bg-white transition-all shadow-md shadow-gold/10">
              <i class="fa-solid fa-download"></i>
              <span>تحميل التقرير (Markdown)</span>
            </button>
          </div>

          <!-- Export JSON State Card -->
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-laser/40 transition-all flex flex-col justify-between gap-4">
            <div>
              <div class="w-12 h-12 rounded-xl bg-laser/15 border border-laser/30 text-laser flex items-center justify-center text-xl mb-3">
                <i class="fa-solid fa-code"></i>
              </div>
              <h4 class="text-base font-bold text-white mb-1">تصدير بيانات الفريق (JSON)</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                حفظ نسخة كاملة من بيانات الفريق، المهام، وحالات الاعتماد بصيغة JSON لمزامنتها مع بقية أعضاء الفريق.
              </p>
            </div>
            <button id="btn-export-json" class="w-full py-2.5 rounded-xl bg-laser/20 border border-laser/40 text-laser text-xs font-bold flex items-center justify-center gap-2 hover:bg-laser hover:text-black transition-all">
              <i class="fa-solid fa-file-export"></i>
              <span>تصدير نسخة JSON</span>
            </button>
          </div>

          <!-- Import JSON State Card -->
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-palm/40 transition-all flex flex-col justify-between gap-4">
            <div>
              <div class="w-12 h-12 rounded-xl bg-palm/15 border border-palm/30 text-palm flex items-center justify-center text-xl mb-3">
                <i class="fa-solid fa-file-import"></i>
              </div>
              <h4 class="text-base font-bold text-white mb-1">استيراد ومزامنة بيانات JSON</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                رفع ملف JSON يحتوي على تعديلات ومراجعات أعضاء الفريق وتحديث المنظومة فورياً.
              </p>
            </div>
            ${canEdit ? `
            <div class="flex flex-col gap-2">
              <input type="file" id="file-import-json" accept=".json" class="hidden" />
              <button id="btn-trigger-import-json" class="w-full py-2.5 rounded-xl bg-palm/20 border border-palm/40 text-palm text-xs font-bold flex items-center justify-center gap-2 hover:bg-palm hover:text-black transition-all">
                <i class="fa-solid fa-upload"></i>
                <span>اختيار ملف JSON للرفع</span>
              </button>
            </div>
            ` : `
            <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-gray-500 font-bold">
              <i class="fa-solid fa-lock me-1"></i>الاستيراد متاح للمحررين والمشرفين فقط
            </div>
            `}
          </div>

          <!-- Print / PDF Master Report Card -->
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/40 transition-all flex flex-col justify-between gap-4">
            <div>
              <div class="w-12 h-12 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center text-xl mb-3">
                <i class="fa-solid fa-print"></i>
              </div>
              <h4 class="text-base font-bold text-white mb-1">طباعة التقرير التنفيذي الشامل (PDF)</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                فتح نافذة الطباعة الرسمية للوثيقة الكاملة بتنسيق احترافي جاهز للتقديم للجهات والمانحين.
              </p>
            </div>
            <button id="btn-print-master" class="w-full py-2.5 rounded-xl bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all">
              <i class="fa-solid fa-file-pdf"></i>
              <span>طباعة / حفظ كـ PDF</span>
            </button>
          </div>

          <!-- Reset Default Card -->
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-clay/30 hover:border-clay transition-all flex flex-col justify-between gap-4">
            <div>
              <div class="w-12 h-12 rounded-xl bg-clay/15 border border-clay/30 text-clay flex items-center justify-center text-xl mb-3">
                <i class="fa-solid fa-rotate-left"></i>
              </div>
              <h4 class="text-base font-bold text-white mb-1">استعادة مسودة العمل الأصلية</h4>
              <p class="text-xs text-gray-400 leading-relaxed">
                إعادة ضبط كافة البيانات والمهام للنسخة التأسيسية المعتمدة (أغسطس 2026).
              </p>
            </div>
            ${isAdmin ? `
            <button id="btn-reset-detailed-plan" class="w-full py-2.5 rounded-xl bg-clay/20 border border-clay/40 text-clay text-xs font-bold flex items-center justify-center gap-2 hover:bg-clay hover:text-white transition-all">
              <i class="fa-solid fa-arrows-rotate"></i>
              <span>استعادة النسخة الأصلية</span>
            </button>
            ` : `
            <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-gray-500 font-bold">
              <i class="fa-solid fa-lock me-1"></i>استعادة النسخة محصورة بمدير النظام
            </div>
            `}
          </div>
        </div>
      </div>
    `;
  }
};
