/* ==========================================================
   MUSEUM MASTER PLAN - COMPREHENSIVE CONTROLLER & BOOTSTRAPPER
   مشروع متحف السيرة الأحسائية، فريق العمل، وإسناد المسؤوليات والاعتماد
   ========================================================== */

window.App = window.App || {};
var App = window.App;

App.DetailedPlanController = class {
  constructor(modelInstance, viewInstance) {
    this.model = modelInstance;
    this.view = viewInstance;
    this.audioCtx = null;
    this.isAudioActive = true;
    this.activeModalType = null;
    this.activeModalItemId = null;
    this.activeModalIndex = null;
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

  init() {
    try { this.initAudio(); } catch (e) { console.warn("Audio init warning:", e); }
    try { this.bindAudioToggle(); } catch (e) { console.warn("Audio toggle warning:", e); }
    try { this.bindNavigationTabs(); } catch (e) { console.warn("Tabs bind warning:", e); }
    try { this.bindModalControls(); } catch (e) { console.warn("Modal controls warning:", e); }
    try { this.bindAuthControls(); } catch (e) { console.warn("Auth controls warning:", e); }
    
    // Initial Render from local cache
    try {
      this.view.render(this.model);
      this.bindContentEvents();
    } catch (e) {
      console.error("View initial render error:", e);
    }

    if (this.model.activeTab === "users" && this.model.isAdmin()) {
      try { this.loadAndRenderUsersTable(); } catch (_) {}
    }

    // Fetch and sync latest state from central server database
    if (this.model && typeof this.model.fetchFromServer === "function") {
      this.model.fetchFromServer(() => {
        try {
          this.view.render(this.model);
          this.bindContentEvents();
        } catch (e) {
          console.error("View re-render after fetch error:", e);
        }
      });
    }
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  playChime(freq = 587.33) {
    if (!this.isAudioActive || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.4);
    } catch (e) {
      // Audio playback failed silently
    }
  }

  bindAudioToggle() {
    const btnToggle = document.getElementById("btn-toggle-audio");
    const waves = document.getElementById("audio-waves-indicator");
    if (!btnToggle) return;

    btnToggle.addEventListener("click", () => {
      this.isAudioActive = !this.isAudioActive;
      const icon = btnToggle.querySelector("i");
      if (this.isAudioActive) {
        if (icon) icon.className = "fas fa-volume-high";
        if (waves) waves.classList.remove("opacity-30");
        this.playChime(659.25);
      } else {
        if (icon) icon.className = "fas fa-volume-mute";
        if (waves) waves.classList.add("opacity-30");
      }
    });
  }

  switchTab(tabName) {
    if (!this.model) return;
    if (!this.model.isAuthenticated()) {
      this.openLoginModal();
      return;
    }
    this.model.activeTab = tabName;
    this.playChime(523.25);
    this.view.render(this.model);
    this.bindContentEvents();

    if (tabName === "users" && this.model.isAdmin()) {
      this.loadAndRenderUsersTable();
    }
  }

  bindNavigationTabs() {
    document.querySelectorAll(".plan-sub-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-plan-tab");
        if (tab) this.switchTab(tab);
      });
    });
  }

  /* ---------------- AUTHENTICATION & USER MANAGEMENT CONTROLS ---------------- */
  openLoginModal() {
    const modalLogin = document.getElementById("auth-login-modal");
    const loginError = document.getElementById("login-error-msg");
    if (loginError) loginError.classList.add("hidden");
    if (modalLogin) {
      modalLogin.classList.remove("hidden");
      modalLogin.classList.add("flex");
      const uInput = document.getElementById("login-username");
      if (uInput && typeof uInput.focus === "function") uInput.focus();
    }
  }

  closeLoginModal() {
    const modalLogin = document.getElementById("auth-login-modal");
    if (modalLogin) {
      modalLogin.classList.add("hidden");
      modalLogin.classList.remove("flex");
    }
  }

  bindAuthControls() {
    // 1. Open Login Modal
    const btnOpenLogin = document.getElementById("btn-open-login-modal");
    const modalLogin = document.getElementById("auth-login-modal");
    const btnCloseLogin = document.getElementById("btn-close-login-modal");
    const btnCancelLogin = document.getElementById("btn-cancel-login");
    const formLogin = document.getElementById("form-auth-login");
    const loginError = document.getElementById("login-error-msg");

    if (btnOpenLogin) {
      btnOpenLogin.addEventListener("click", () => this.openLoginModal());
    }

    if (btnCloseLogin) btnCloseLogin.addEventListener("click", () => this.closeLoginModal());
    if (btnCancelLogin) btnCancelLogin.addEventListener("click", () => this.closeLoginModal());
    if (modalLogin) {
      modalLogin.addEventListener("click", (e) => {
        if (e.target === modalLogin) this.closeLoginModal();
      });
    }

    // 2. Submit Login
    if (formLogin) {
      formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;
        const btnSubmit = document.getElementById("btn-submit-login");

        if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>جاري الدخول...</span>`;

        const res = await this.model.login(username, password);

        if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i><span>دخول</span>`;

        if (res.success) {
          this.playChime(880);
          this.closeLoginModal();
          formLogin.reset();
          // Direct redirect to index.html as requested
          window.location.href = "index.html";
        } else {
          if (loginError) {
            loginError.textContent = res.message || "اسم المستخدم أو كلمة المرور غير صحيحة";
            loginError.classList.remove("hidden");
          }
        }
      });
    }

    // 3. Logout
    const btnLogout = document.getElementById("btn-auth-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        if (confirm("هل تريد بالتأكيد تسجيل الخروج والعودة للصفحة الرئيسية؟")) {
          this.model.logout();
          if (window.App && window.App.authGuard) {
            window.App.authGuard.logout();
          } else {
            window.location.href = "index.html";
          }
        }
      });
    }

    // 4. Admin Manage Users button in toolbar
    const btnManageUsers = document.getElementById("btn-admin-manage-users");
    if (btnManageUsers) {
      btnManageUsers.addEventListener("click", () => {
        if (this.model.isAdmin()) {
          this.model.activeTab = "users";
          this.view.render(this.model);
          this.bindContentEvents();
          this.loadAndRenderUsersTable();
        }
      });
    }

    // 5. Admin: Create User Modal
    const modalUser = document.getElementById("admin-user-modal");
    const btnCloseUserModal = document.getElementById("btn-close-user-modal");
    const btnCancelUserModal = document.getElementById("btn-cancel-user-modal");
    const formUser = document.getElementById("form-admin-user");
    const userModalError = document.getElementById("user-modal-error");

    const closeUserModal = () => {
      if (modalUser) {
        modalUser.classList.add("hidden");
        modalUser.classList.remove("flex");
      }
    };

    if (btnCloseUserModal) btnCloseUserModal.addEventListener("click", closeUserModal);
    if (btnCancelUserModal) btnCancelUserModal.addEventListener("click", closeUserModal);
    if (modalUser) {
      modalUser.addEventListener("click", (e) => {
        if (e.target === modalUser) closeUserModal();
      });
    }

    if (formUser) {
      formUser.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("user-input-name").value;
        const username = document.getElementById("user-input-username").value;
        const password = document.getElementById("user-input-password").value;
        const role = document.getElementById("user-input-role").value;
        const btnSave = document.getElementById("btn-save-user-submit");

        if (btnSave) btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>جاري الحفظ...</span>`;

        try {
          await this.model.saveUser({ name, username, password, role });
          this.playChime(880);
          closeUserModal();
          formUser.reset();
          this.loadAndRenderUsersTable();
        } catch (err) {
          if (userModalError) {
            userModalError.textContent = err.message || "حدث خطأ أثناء حفظ المستخدم";
            userModalError.classList.remove("hidden");
          }
        } finally {
          if (btnSave) btnSave.innerHTML = `<i class="fa-solid fa-check"></i><span>حفظ المستخدم</span>`;
        }
      });
    }
  }

  async loadAndRenderUsersTable() {
    const tableContainer = document.getElementById("users-list-table-container");
    if (!tableContainer || !this.model.isAdmin()) return;

    try {
      tableContainer.innerHTML = `<div class="text-xs text-gray-400 p-6 flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin text-gold"></i><span>جاري جلب المستخدمين...</span></div>`;
      const users = await this.model.fetchUsersList();
      tableContainer.innerHTML = this.view.renderUsersTableHtml(users, this.model.currentUser?.username);
      this.bindUsersTableEvents();
    } catch (e) {
      tableContainer.innerHTML = `<div class="p-6 rounded-xl bg-clay/10 text-clay text-xs font-bold border border-clay/30">تعذر تحميل المستخدمين: ${e.message}</div>`;
    }
  }

  bindUsersTableEvents() {
    // Open add user modal
    const btnOpenAddUser = document.getElementById("btn-open-add-user-modal");
    const modalUser = document.getElementById("admin-user-modal");
    if (btnOpenAddUser && modalUser) {
      btnOpenAddUser.addEventListener("click", () => {
        const title = document.getElementById("user-modal-title");
        const form = document.getElementById("form-admin-user");
        const err = document.getElementById("user-modal-error");
        if (err) err.classList.add("hidden");
        if (form) form.reset();
        if (title) title.innerHTML = `<i class="fa-solid fa-user-plus text-gold"></i><span>إضافة مستخدم جديد للنظام</span>`;
        modalUser.classList.remove("hidden");
        modalUser.classList.add("flex");
      });
    }

    // Refresh users list
    const btnRefresh = document.getElementById("btn-refresh-users-list");
    if (btnRefresh) {
      btnRefresh.addEventListener("click", () => this.loadAndRenderUsersTable());
    }

    // Delete user button
    document.querySelectorAll(".btn-delete-system-user").forEach(btn => {
      btn.addEventListener("click", async () => {
        const username = btn.getAttribute("data-username");
        if (!username) return;
        if (confirm(`هل أنت متأكد من رغبتك في حذف المستخدم (${username})؟`)) {
          try {
            await this.model.deleteUser(username);
            this.playChime(440);
            this.loadAndRenderUsersTable();
          } catch (e) {
            alert("خطأ: " + e.message);
          }
        }
      });
    });

    // Also render backups table
    this.loadAndRenderBackupsTable();
  }

  async loadAndRenderBackupsTable() {
    const tableContainer = document.getElementById("backups-list-table-container");
    if (!tableContainer || !this.model.isAdmin()) return;

    try {
      tableContainer.innerHTML = `<div class="text-xs text-gray-400 p-6 flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin text-palm"></i><span>جاري جلب النسخ الاحتياطية...</span></div>`;
      const backups = await this.model.fetchBackupsList();
      tableContainer.innerHTML = this.view.renderBackupsTableHtml(backups);
      this.bindBackupsEvents();
    } catch (e) {
      tableContainer.innerHTML = `<div class="p-6 rounded-xl bg-clay/10 text-clay text-xs font-bold border border-clay/30">تعذر تحميل النسخ الاحتياطية: ${e.message}</div>`;
    }
  }

  bindBackupsEvents() {
    // Create manual backup button
    const btnCreate = document.getElementById("btn-create-manual-backup");
    if (btnCreate) {
      btnCreate.addEventListener("click", async () => {
        const note = prompt("أدخل ملاحظة أو وصفاً لهذه النسخة الاحتياطية (اختياري):", "نسخة يدوية مأخوذة بواسطة المشرف");
        if (note === null) return; // Cancelled
        
        btnCreate.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>جاري الأخذ...</span>`;
        try {
          const res = await this.model.createBackupSnapshot(note);
          this.playChime(880);
          alert(res.message || "تم أخذ النسخة الاحتياطية بنجاح");
          this.loadAndRenderBackupsTable();
        } catch (e) {
          alert("خطأ: " + e.message);
        } finally {
          btnCreate.innerHTML = `<i class="fa-solid fa-camera"></i><span>أخذ نسخة احتياطية الآن</span>`;
        }
      });
    }

    // Refresh backups list button
    const btnRefresh = document.getElementById("btn-refresh-backups-list");
    if (btnRefresh) {
      btnRefresh.addEventListener("click", () => this.loadAndRenderBackupsTable());
    }

    // Restore backup buttons
    document.querySelectorAll(".btn-restore-backup").forEach(btn => {
      btn.addEventListener("click", async () => {
        const filename = btn.getAttribute("data-filename");
        if (!filename) return;

        const confirmed = confirm(`⚠️ تنبيه أمان: هل أنت متأكد تماماً من رغبتك في استرجاع النظام من النسخة الاحتياطية (${filename})؟\n\n(سيتم أخذ نسخة أمان احتياطية تلقائياً قبل الاسترجاع لحماية حالتك الحالية)`);
        if (!confirmed) return;

        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
        try {
          const res = await this.model.restoreFromBackup(filename);
          this.playChime(880);
          alert(res.message || "تم استرجاع النظام بنجاح من النسخة الاحتياطية!");
          this.view.render(this.model);
          this.bindContentEvents();
        } catch (e) {
          alert("خطأ أثناء الاسترجاع: " + e.message);
          btn.innerHTML = `<i class="fa-solid fa-rotate-left"></i> استرجاع`;
        }
      });
    });
  }

  bindModalControls() {
    const btnCloseModal = document.getElementById("btn-close-modal");
    const btnCancelModal = document.getElementById("btn-cancel-modal");
    const btnSaveModal = document.getElementById("btn-save-modal");
    const modalOverlay = document.getElementById("detailed-plan-modal");

    if (btnCloseModal) btnCloseModal.addEventListener("click", () => this.closeModal());
    if (btnCancelModal) btnCancelModal.addEventListener("click", () => this.closeModal());
    if (modalOverlay) {
      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) this.closeModal();
      });
    }
    if (btnSaveModal) btnSaveModal.addEventListener("click", () => this.handleSaveModal());
  }

  // Dynamic Team Member Options Generator
  renderMemberSelectOptions(selectedAssignee = "") {
    const members = this.model.getTeamMembers();
    let options = `<option value="غير مسند" ${!selectedAssignee || selectedAssignee === 'غير مسند' ? 'selected' : ''}>غير مسند</option>`;
    
    // Preserve existing assignee if not in default list
    if (selectedAssignee && selectedAssignee !== "غير مسند") {
      const exists = members.some(m => m.name === selectedAssignee || m.username === selectedAssignee);
      if (!exists) {
        options += `<option value="${selectedAssignee}" selected>${selectedAssignee} (المسند حالياً)</option>`;
      }
    }

    members.forEach(m => {
      const labelRole = m.track || m.specialty || m.role || "عضو فريق";
      const isSelected = selectedAssignee === m.name || selectedAssignee === m.username;
      options += `<option value="${m.name}" ${isSelected ? 'selected' : ''}>${m.name} (${labelRole})</option>`;
    });
    return options;
  }

  // Dynamic Approval Status Options Generator
  renderApprovalSelectOptions(selectedStatus = "معتمد") {
    return `
      <option value="معتمد" ${selectedStatus === 'معتمد' ? 'selected' : ''}>معتمد ✅</option>
      <option value="قيد المراجعة" ${selectedStatus === 'قيد المراجعة' ? 'selected' : ''}>قيد المراجعة ⏳</option>
      <option value="مسودة" ${selectedStatus === 'مسودة' ? 'selected' : ''}>مسودة 📝</option>
    `;
  }

  bindContentEvents() {
    const contentArea = document.getElementById("detailed-plan-content-area");
    if (!contentArea) return;

    /* ================= AUTH GATE LOGIN SUBMIT ================= */
    const formGate = document.getElementById("form-gate-login");
    const gateError = document.getElementById("gate-login-error");
    if (formGate) {
      formGate.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("gate-login-username")?.value;
        const password = document.getElementById("gate-login-password")?.value;
        const btnSubmit = document.getElementById("btn-gate-submit-login");

        if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>جاري التحقق والدخول...</span>`;

        const res = await this.model.login(username, password);

        if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i><span>تسجيل الدخول واستعراض المنظومة</span>`;

        if (res.success) {
          this.playChime(880);
          this.view.render(this.model);
          this.bindContentEvents();
        } else {
          if (gateError) {
            gateError.textContent = res.message || "اسم المستخدم أو كلمة المرور غير صحيحة";
            gateError.classList.remove("hidden");
          }
        }
      });
    }

    /* ================= 0. TEAM MEMBERS ACTIONS ================= */
    const btnAddMember = document.getElementById("btn-add-team-member");
    if (btnAddMember) {
      btnAddMember.addEventListener("click", () => this.openTeamMemberModal());
    }

    contentArea.querySelectorAll(".btn-edit-member").forEach(btn => {
      btn.addEventListener("click", () => {
        const memId = btn.getAttribute("data-member-id");
        const mem = this.model.getTeamMembers().find(m => m.id === memId);
        if (mem) this.openTeamMemberModal(mem);
      });
    });

    contentArea.querySelectorAll(".btn-delete-member").forEach(btn => {
      btn.addEventListener("click", () => {
        const memId = btn.getAttribute("data-member-id");
        if (confirm("هل تريد حذف هذا العضو من الفريق؟")) {
          this.model.deleteTeamMember(memId);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    /* ================= 1. IDENTITY & GOALS ================= */
    const btnEditMeta = document.getElementById("btn-edit-metadata");
    if (btnEditMeta) {
      btnEditMeta.addEventListener("click", () => this.openMetadataModal());
    }

    const btnEditVision = document.getElementById("btn-edit-vision");
    if (btnEditVision) {
      btnEditVision.addEventListener("click", () => this.openVisionModal());
    }

    const btnAddGoal = document.getElementById("btn-add-goal");
    if (btnAddGoal) {
      btnAddGoal.addEventListener("click", () => this.openGoalModal());
    }

    contentArea.querySelectorAll(".btn-edit-goal").forEach(btn => {
      btn.addEventListener("click", () => {
        const goalId = btn.getAttribute("data-goal-id");
        const g = this.model.getGoals().find(item => item.id === goalId);
        if (g) this.openGoalModal(g);
      });
    });

    contentArea.querySelectorAll(".btn-delete-goal").forEach(btn => {
      btn.addEventListener("click", () => {
        const goalId = btn.getAttribute("data-goal-id");
        if (confirm("هل تريد حذف هذا الهدف؟")) {
          this.model.deleteGoal(goalId);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    const btnEditIdentCore = document.getElementById("btn-edit-identity-core");
    if (btnEditIdentCore) {
      btnEditIdentCore.addEventListener("click", () => this.openIdentityCoreModal());
    }

    const btnAddIdentApp = document.getElementById("btn-add-identity-app");
    if (btnAddIdentApp) {
      btnAddIdentApp.addEventListener("click", () => this.openIdentityAppModal());
    }

    contentArea.querySelectorAll(".btn-edit-identity-app").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const app = this.model.data.identity.applicationAr[idx];
        if (app) this.openIdentityAppModal(app, idx);
      });
    });

    contentArea.querySelectorAll(".btn-delete-identity-app").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("هل تريد حذف هذا التطبيق للهوية؟")) {
          this.model.deleteIdentityApp(idx);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    contentArea.querySelectorAll(".btn-edit-axis").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-axis-index"), 10);
        const ax = this.model.data.identity.axesTable[idx];
        if (ax) this.openAxisModal(ax, idx);
      });
    });

    /* ================= 2. ARTIFACTS & PROPOSED TOOLS ================= */
    const btnAddArtifact = document.getElementById("btn-add-artifact");
    if (btnAddArtifact) {
      btnAddArtifact.addEventListener("click", () => this.openArtifactModal());
    }

    contentArea.querySelectorAll(".btn-edit-artifact").forEach(btn => {
      btn.addEventListener("click", () => {
        const artId = btn.getAttribute("data-art-id");
        const art = this.model.getArtifacts().find(a => a.id === artId);
        if (art) this.openArtifactModal(art);
      });
    });

    contentArea.querySelectorAll(".btn-delete-artifact").forEach(btn => {
      btn.addEventListener("click", () => {
        const artId = btn.getAttribute("data-art-id");
        if (confirm("هل أنت متأكد من حذف هذه القطعة من العرض؟")) {
          this.model.deleteArtifact(artId);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    const btnAddProposedTool = document.getElementById("btn-add-proposed-tool");
    if (btnAddProposedTool) {
      btnAddProposedTool.addEventListener("click", () => this.openProposedToolModal());
    }

    contentArea.querySelectorAll(".btn-edit-proposed-tool").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const tool = this.model.getProposedTools()[idx];
        if (tool) this.openProposedToolModal(tool, idx);
      });
    });

    contentArea.querySelectorAll(".btn-delete-proposed-tool").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("هل تريد حذف هذه الأداة المقترحة؟")) {
          this.model.deleteProposedTool(idx);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    /* ================= 3. SCHOOLS & SCHOLARS ================= */
    const btnEditQuote = document.getElementById("btn-edit-founding-quote");
    if (btnEditQuote) {
      btnEditQuote.addEventListener("click", () => this.openQuoteModal());
    }

    const btnAddSchool = document.getElementById("btn-add-school");
    if (btnAddSchool) {
      btnAddSchool.addEventListener("click", () => this.openSchoolModal());
    }

    const inputSchoolSearch = document.getElementById("input-school-search");
    if (inputSchoolSearch) {
      inputSchoolSearch.addEventListener("input", (e) => {
        this.model.schoolSearchQuery = e.target.value;
        this.view.render(this.model);
        this.bindContentEvents();
        const refreshedInput = document.getElementById("input-school-search");
        if (refreshedInput) {
          refreshedInput.focus();
          const len = refreshedInput.value.length;
          refreshedInput.setSelectionRange(len, len);
        }
      });
    }

    const filterSchoolMazhab = document.getElementById("filter-school-mazhab");
    if (filterSchoolMazhab) {
      filterSchoolMazhab.addEventListener("change", (e) => {
        this.model.schoolFilterMazhab = e.target.value;
        this.view.render(this.model);
        this.bindContentEvents();
      });
    }

    const btnSchoolViewCards = document.getElementById("btn-school-view-cards");
    if (btnSchoolViewCards) {
      btnSchoolViewCards.addEventListener("click", () => {
        this.model.schoolViewMode = "cards";
        this.view.render(this.model);
        this.bindContentEvents();
      });
    }

    const btnSchoolViewTable = document.getElementById("btn-school-view-table");
    if (btnSchoolViewTable) {
      btnSchoolViewTable.addEventListener("click", () => {
        this.model.schoolViewMode = "table";
        this.view.render(this.model);
        this.bindContentEvents();
      });
    }

    
    contentArea.querySelectorAll(".btn-view-waqf").forEach(btn => {
      btn.addEventListener("click", () => {
        const schId = btn.getAttribute("data-sch-id");
        const sch = this.model.getSchools().find(s => s.id === schId);
        if (sch) this.openWaqfViewerModal(sch);
      });
    });

    contentArea.querySelectorAll(".btn-edit-school").forEach(btn => {
      btn.addEventListener("click", () => {
        const schId = btn.getAttribute("data-sch-id");
        const sch = this.model.getSchools().find(s => s.id === schId);
        if (sch) this.openSchoolModal(sch);
      });
    });

    contentArea.querySelectorAll(".btn-delete-school").forEach(btn => {
      btn.addEventListener("click", () => {
        const schId = btn.getAttribute("data-sch-id");
        if (confirm("هل أنت متأكد من حذف هذه المدرسة؟")) {
          this.model.deleteSchool(schId);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    const btnEditSchSummary = document.getElementById("btn-edit-scholars-summary");
    if (btnEditSchSummary) {
      btnEditSchSummary.addEventListener("click", () => this.openScholarsSummaryModal());
    }

    const btnAddVisitScholar = document.getElementById("btn-add-visiting-scholar");
    if (btnAddVisitScholar) {
      btnAddVisitScholar.addEventListener("click", () => {
        const name = prompt("أدخل اسم العالم الوافد للأحساء:");
        if (name && name.trim()) {
          this.model.addVisitingScholar(name.trim());
          this.playChime(659.25);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    }

    contentArea.querySelectorAll(".btn-delete-visiting-scholar").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        this.model.deleteVisitingScholar(idx);
        this.playChime(440);
        this.view.render(this.model);
        this.bindContentEvents();
      });
    });

    const btnAddStudent = document.getElementById("btn-add-doghan-student");
    if (btnAddStudent) {
      btnAddStudent.addEventListener("click", () => this.openStudentModal());
    }

    contentArea.querySelectorAll(".btn-edit-student").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const st = this.model.data.hall2_schools.scholarsNetwork.doghanStudents[idx];
        if (st) this.openStudentModal(st, idx);
      });
    });

    contentArea.querySelectorAll(".btn-delete-student").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("هل تريد حذف هذا التلميذ من الشجرة؟")) {
          this.model.deleteDoghanStudent(idx);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    const btnAddExhibitComp = document.getElementById("btn-add-exhibit-comp");
    if (btnAddExhibitComp) {
      btnAddExhibitComp.addEventListener("click", () => this.openExhibitCompModal());
    }

    contentArea.querySelectorAll(".btn-edit-exhibit-comp").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const comp = this.model.data.hall2_schools.exhibitComponents[idx];
        if (comp) this.openExhibitCompModal(comp, idx);
      });
    });

    contentArea.querySelectorAll(".btn-delete-exhibit-comp").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("هل تريد حذف هذا الركن؟")) {
          this.model.deleteExhibitComponent(idx);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    /* ================= 4. HOLOGRAM & SCENES ================= */
    const btnEditHoloSpecs = document.getElementById("btn-edit-hologram-specs");
    if (btnEditHoloSpecs) {
      btnEditHoloSpecs.addEventListener("click", () => this.openHologramSpecsModal());
    }

    const btnAddHistStory = document.getElementById("btn-add-historical-story");
    if (btnAddHistStory) {
      btnAddHistStory.addEventListener("click", () => this.openHistoricalStoryModal());
    }

    contentArea.querySelectorAll(".btn-edit-story").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const story = this.model.data.hologram.historicalStories[idx];
        if (story) this.openHistoricalStoryModal(story, idx);
      });
    });

    contentArea.querySelectorAll(".btn-delete-story").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("هل تريد حذف هذه القصة؟")) {
          this.model.deleteHistoricalStory(idx);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    const btnAddScene = document.getElementById("btn-add-scene");
    if (btnAddScene) {
      btnAddScene.addEventListener("click", () => this.openSceneModal());
    }

    contentArea.querySelectorAll(".btn-edit-scene").forEach(btn => {
      btn.addEventListener("click", () => {
        const sceneNum = parseInt(btn.getAttribute("data-scene-num"), 10);
        this.openSceneModal(sceneNum);
      });
    });

    contentArea.querySelectorAll(".btn-delete-scene").forEach(btn => {
      btn.addEventListener("click", () => {
        const sceneNum = parseInt(btn.getAttribute("data-scene-num"), 10);
        if (confirm(`هل تريد حذف المشهد رقم ${sceneNum}؟`)) {
          this.model.deleteScene(sceneNum);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    /* ================= 5. VR EXPERIENCE ================= */
    const btnEditVR = document.getElementById("btn-edit-vr-specs");
    if (btnEditVR) {
      btnEditVR.addEventListener("click", () => this.openVRModal());
    }

    /* ================= 6. LOCATION & AREAS ================= */
    const btnAddLocation = document.getElementById("btn-add-location");
    if (btnAddLocation) {
      btnAddLocation.addEventListener("click", () => this.openLocationModal());
    }

    contentArea.querySelectorAll(".btn-edit-location").forEach(btn => {
      btn.addEventListener("click", () => {
        const locId = btn.getAttribute("data-loc-id");
        const loc = this.model.data.locationAndAreas.locations.find(l => l.id === locId);
        if (loc) this.openLocationModal(loc);
      });
    });

    contentArea.querySelectorAll(".btn-delete-location").forEach(btn => {
      btn.addEventListener("click", () => {
        const locId = btn.getAttribute("data-loc-id");
        if (confirm("هل تريد حذف هذا الموقع المقترح؟")) {
          this.model.deleteLocation(locId);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    const btnAddArea = document.getElementById("btn-add-area-item");
    if (btnAddArea) {
      btnAddArea.addEventListener("click", () => this.openAreaModal());
    }

    contentArea.querySelectorAll(".btn-edit-area-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const item = this.model.data.locationAndAreas.areasTable[idx];
        if (item) this.openAreaModal(item, idx);
      });
    });

    contentArea.querySelectorAll(".btn-delete-area-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("هل تريد حذف هذا الفراغ؟")) {
          this.model.deleteAreaItem(idx);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    /* ================= 7. FINANCE & OPERATIONS ================= */
    const btnEditBudgetTotals = document.getElementById("btn-edit-budget-totals");
    if (btnEditBudgetTotals) {
      btnEditBudgetTotals.addEventListener("click", () => this.openBudgetTotalsModal());
    }

    const btnAddBudgetItem = document.getElementById("btn-add-budget-item");
    if (btnAddBudgetItem) {
      btnAddBudgetItem.addEventListener("click", () => this.openBudgetItemModal());
    }

    contentArea.querySelectorAll(".btn-edit-budget-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const item = this.model.data.budget.items[idx];
        if (item) this.openBudgetItemModal(item, idx);
      });
    });

    contentArea.querySelectorAll(".btn-delete-budget-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("هل تريد حذف هذا البند المالي؟")) {
          this.model.deleteBudgetItem(idx);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    const btnAddTicket = document.getElementById("btn-add-ticket-item");
    if (btnAddTicket) {
      btnAddTicket.addEventListener("click", () => this.openTicketModal());
    }

    contentArea.querySelectorAll(".btn-edit-ticket").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const t = this.model.data.operations.ticketsModel[idx];
        if (t) this.openTicketModal(t, idx);
      });
    });

    contentArea.querySelectorAll(".btn-delete-ticket").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("هل تريد حذف فئة التذكرة هذه؟")) {
          this.model.deleteTicketItem(idx);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    const btnAddWaqf = document.getElementById("btn-add-waqf-pillar");
    if (btnAddWaqf) {
      btnAddWaqf.addEventListener("click", () => this.openWaqfModal());
    }

    contentArea.querySelectorAll(".btn-edit-waqf").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const w = this.model.data.operations.sustainabilityAndWaqf[idx];
        if (w) this.openWaqfModal(w, idx);
      });
    });

    contentArea.querySelectorAll(".btn-delete-waqf").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("هل تريد حذف هذه الركيزة الوقفية؟")) {
          this.model.deleteWaqfPillar(idx);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    const btnAddStage = document.getElementById("btn-add-stage");
    if (btnAddStage) {
      btnAddStage.addEventListener("click", () => this.openStageModal());
    }

    contentArea.querySelectorAll(".btn-edit-stage").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const stg = this.model.data.operations.stages[idx];
        if (stg) this.openStageModal(stg, idx);
      });
    });

    contentArea.querySelectorAll(".btn-delete-stage").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("هل تريد حذف هذه المرحلة؟")) {
          this.model.deleteStage(idx);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    /* ================= 8. SOUVENIRS, PARTNERS & REFS ================= */
    const btnAddSouv = document.getElementById("btn-add-souvenir");
    if (btnAddSouv) {
      btnAddSouv.addEventListener("click", () => this.openSouvenirModal());
    }

    contentArea.querySelectorAll(".btn-edit-souvenir").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const s = this.model.data.souvenirs[idx];
        if (s) this.openSouvenirModal(s, idx);
      });
    });

    contentArea.querySelectorAll(".btn-delete-souvenir").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("هل تريد حذف هذا المنتج التذكاري؟")) {
          this.model.deleteSouvenir(idx);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    const btnAddPartner = document.getElementById("btn-add-partner");
    if (btnAddPartner) {
      btnAddPartner.addEventListener("click", () => this.openPartnerModal());
    }

    contentArea.querySelectorAll(".btn-edit-partner").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const p = this.model.data.partners[idx];
        if (p) this.openPartnerModal(p, idx);
      });
    });

    contentArea.querySelectorAll(".btn-delete-partner").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("هل تريد حذف هذه الجهة الشريكة؟")) {
          this.model.deletePartner(idx);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    const btnAddRef = document.getElementById("btn-add-reference");
    if (btnAddRef) {
      btnAddRef.addEventListener("click", () => this.openReferenceModal());
    }

    contentArea.querySelectorAll(".btn-edit-reference").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        const r = this.model.data.references[idx];
        if (r) this.openReferenceModal(r, idx);
      });
    });

    contentArea.querySelectorAll(".btn-delete-reference").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("هل تريد حذف هذا المرجع؟")) {
          this.model.deleteReference(idx);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    /* ================= 9. TASKS ACTIONS ================= */
    const filterTrack = document.getElementById("filter-task-track");
    if (filterTrack) {
      filterTrack.addEventListener("change", (e) => {
        this.model.taskFilterTrack = e.target.value;
        this.view.render(this.model);
        this.bindContentEvents();
      });
    }

    const filterStatus = document.getElementById("filter-task-status");
    if (filterStatus) {
      filterStatus.addEventListener("change", (e) => {
        this.model.taskFilterStatus = e.target.value;
        this.view.render(this.model);
        this.bindContentEvents();
      });
    }

    const btnAddTask = document.getElementById("btn-add-task");
    if (btnAddTask) {
      btnAddTask.addEventListener("click", () => this.openTaskModal());
    }

    contentArea.querySelectorAll(".task-status-select").forEach(sel => {
      sel.addEventListener("change", (e) => {
        const taskId = sel.getAttribute("data-task-id");
        this.model.updateTask(taskId, { status: e.target.value });
        this.playChime(659.25);
        this.view.render(this.model);
        this.bindContentEvents();
      });
    });

    contentArea.querySelectorAll(".btn-edit-task").forEach(btn => {
      btn.addEventListener("click", () => {
        const taskId = btn.getAttribute("data-task-id");
        const task = this.model.getTasks().find(t => t.id === taskId);
        if (task) this.openTaskModal(task);
      });
    });

    contentArea.querySelectorAll(".btn-delete-task").forEach(btn => {
      btn.addEventListener("click", () => {
        const taskId = btn.getAttribute("data-task-id");
        if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
          this.model.deleteTask(taskId);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    /* ================= 10. DECISIONS ACTIONS ================= */
    const btnAddPendingDec = document.getElementById("btn-add-pending-decision");
    if (btnAddPendingDec) {
      btnAddPendingDec.addEventListener("click", () => this.openDecisionDetailsModal());
    }

    contentArea.querySelectorAll(".btn-edit-decision-details").forEach(btn => {
      btn.addEventListener("click", () => {
        const decId = btn.getAttribute("data-decision-id");
        const dec = this.model.getPendingDecisions().find(d => d.id === decId);
        if (dec) this.openDecisionDetailsModal(dec);
      });
    });

    contentArea.querySelectorAll(".btn-delete-decision").forEach(btn => {
      btn.addEventListener("click", () => {
        const decId = btn.getAttribute("data-decision-id");
        if (confirm("هل تريد حذف هذا القرار المعلق؟")) {
          this.model.deletePendingDecision(decId);
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    });

    contentArea.querySelectorAll(".btn-save-decision").forEach(btn => {
      btn.addEventListener("click", () => {
        const decId = btn.getAttribute("data-decision-id");
        const card = btn.closest(".p-6");
        const sel = card.querySelector(`.decision-status-select[data-decision-id="${decId}"]`);
        const txt = card.querySelector(`.decision-notes-input[data-decision-id="${decId}"]`);
        
        const statusVal = sel ? sel.value : null;
        const notesVal = txt ? txt.value : null;

        this.model.updateDecision(decId, statusVal, notesVal);
        this.playChime(783.99);
        
        btn.innerHTML = `<i class="fa-solid fa-check me-1"></i>تم الحفظ`;
        btn.classList.add("bg-palm", "text-black");
        setTimeout(() => {
          this.view.render(this.model);
          this.bindContentEvents();
        }, 800);
      });
    });

    /* ================= 11. EXPORT & TOOLS ================= */
    const btnExportMd = document.getElementById("btn-export-markdown");
    if (btnExportMd) {
      btnExportMd.addEventListener("click", () => this.handleExportMarkdown());
    }

    const btnExportJson = document.getElementById("btn-export-json");
    if (btnExportJson) {
      btnExportJson.addEventListener("click", () => this.handleExportJSON());
    }

    const btnTriggerImport = document.getElementById("btn-trigger-import-json");
    const fileImport = document.getElementById("file-import-json");
    if (btnTriggerImport && fileImport) {
      btnTriggerImport.addEventListener("click", () => fileImport.click());
      fileImport.addEventListener("change", (e) => this.handleImportJSON(e.target.files[0]));
    }

    const btnPrintMaster = document.getElementById("btn-print-master");
    if (btnPrintMaster) {
      btnPrintMaster.addEventListener("click", () => window.print());
    }

    const btnReset = document.getElementById("btn-reset-detailed-plan");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        if (confirm("هل تريد استعادة النسخة التأسيسية وإلغاء كافة التعديلات المحفوظة محلياً؟")) {
          this.model.resetToDefault();
          this.playChime(440);
          this.view.render(this.model);
          this.bindContentEvents();
        }
      });
    }
  }

  /* ================= MODAL OPENERS FOR EVERY DOMAIN ================= */

  showModal(titleHtml, bodyHtml, modalType, itemId = null, index = null) {
    if (modalType !== 'waqf_viewer' && !this.model.canEdit()) {
      alert("🔒 عذراً، حسابك بصلاحية استعراض فقط ولا يمكنك التعديل.");
      return;
    }
    this.activeModalType = modalType;
    this.activeModalItemId = itemId;
    this.activeModalIndex = index;

    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const modalOverlay = document.getElementById("detailed-plan-modal");

    modalTitle.innerHTML = titleHtml;
    modalBody.innerHTML = bodyHtml;

    modalOverlay.classList.remove("hidden");
    modalOverlay.classList.add("flex");
  }

  closeModal() {
    const modalOverlay = document.getElementById("detailed-plan-modal");
    if (modalOverlay) {
      modalOverlay.classList.add("hidden");
      modalOverlay.classList.remove("flex");
    }
    this.activeModalType = null;
    this.activeModalItemId = null;
    this.activeModalIndex = null;
  }

  /* --- 0. TEAM MEMBER MODAL --- */
  openTeamMemberModal(member = null) {
    if (!this.model.isAdmin()) {
      alert("🔒 عذراً، إدارة أعضاء الفريق محصورة بمدير النظام (Admin).");
      return;
    }
    this.showModal(
      `<i class="fa-solid fa-user-plus text-gold"></i><span>${member ? 'تعديل بيانات العضو' : 'إضافة عضو جديد للفريق'}</span>`,
      `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">اسم العضو:</label>
            <input type="text" id="m-mem-name" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${member ? member.name : ''}" placeholder="د. / م. / أ." required />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">المسمى والمسؤولية:</label>
            <input type="text" id="m-mem-role" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${member ? member.role : ''}" placeholder="رئيس المسار / مهندس / باحث" required />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">المسار التخصصي:</label>
            <select id="m-mem-track" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
              <option value="شرعي وتاريخي" ${member && member.track === 'شرعي وتاريخي' ? 'selected' : ''}>شرعي وتاريخي</option>
              <option value="تصميم ومقتنيات" ${member && member.track === 'تصميم ومقتنيات' ? 'selected' : ''}>تصميم ومقتنيات</option>
              <option value="سينما وهولوجرام" ${member && member.track === 'سينما وهولوجرام' ? 'selected' : ''}>سينما وهولوجرام</option>
              <option value="موقع وتراخيص" ${member && member.track === 'موقع وتراخيص' ? 'selected' : ''}>موقع وتراخيص</option>
              <option value="تمويل واستدامة" ${member && member.track === 'تمويل واستدامة' ? 'selected' : ''}>تمويل واستدامة</option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">لون التمييز (Avatar):</label>
            <input type="color" id="m-mem-color" class="bg-black/60 border border-white/15 rounded-lg h-9 w-full cursor-pointer px-1 py-1" value="${member ? member.avatarColor : '#dfb15b'}" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">البريد الإلكتروني:</label>
            <input type="email" id="m-mem-email" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${member ? member.email : ''}" placeholder="name@alahsa-museum.sa" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">رقم الهاتف / التواصل:</label>
            <input type="text" id="m-mem-phone" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${member ? member.phone : ''}" placeholder="+966 50..." />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">نبذة عن الخبرات والمهام:</label>
          <textarea id="m-mem-bio" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-gold h-20 resize-none leading-relaxed">${member ? member.bio : ''}</textarea>
        </div>
      `,
      "team_member",
      member ? member.id : null
    );
  }

  /* --- 1. METADATA & GOALS MODALS --- */
  openMetadataModal() {
    const m = this.model.data.metadata;
    this.showModal(
      `<i class="fa-solid fa-pen-to-square text-gold"></i><span>تعديل بيانات العنوان والهوية</span>`,
      `
        <div class="flex flex-col gap-3">
          <label class="font-bold text-white">العنوان الرئيسي:</label>
          <input type="text" id="m-meta-title" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${m.titleAr}" required />
          
          <label class="font-bold text-white">العنوان الفرعي:</label>
          <input type="text" id="m-meta-subtitle" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${m.subtitleAr}" />

          <label class="font-bold text-white">الموقع الجغرافي:</label>
          <input type="text" id="m-meta-location" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${m.locationAr}" />

          <label class="font-bold text-white">الشعار المعتمد:</label>
          <input type="text" id="m-meta-slogan" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${m.sloganAr}" />
        </div>
      `,
      "metadata"
    );
  }

  openVisionModal() {
    const v = this.model.data.intro.visionAr;
    const st = this.model.data.intro.approvalStatus || "معتمد";
    const asg = this.model.data.intro.assignee || "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-eye text-gold"></i><span>تعديل رؤية المشروع</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-vision-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول من الفريق:</label>
              <select id="m-vision-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">نص الرؤية والتأسيس:</label>
          <textarea id="m-vision-text" class="bg-black/60 border border-white/15 rounded-lg p-3 text-white outline-none focus:border-gold h-32 resize-none leading-relaxed" required>${v}</textarea>
        </div>
      `,
      "vision"
    );
  }

  openGoalModal(goal = null) {
    const st = goal ? (goal.approvalStatus || "معتمد") : "معتمد";
    const asg = goal ? (goal.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-bullseye text-gold"></i><span>${goal ? 'تعديل الهدف' : 'إضافة هدف جديد'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="font-bold text-white">تصنيف الهدف:</label>
              <select id="m-goal-type" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                <option value="approved" ${goal && goal.type === 'approved' ? 'selected' : ''}>هدف أساسي</option>
                <option value="proposed" ${!goal || goal.type === 'proposed' ? 'selected' : ''}>مقترح إضافي</option>
              </select>
            </div>
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-goal-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول:</label>
              <select id="m-goal-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">نص الهدف:</label>
          <textarea id="m-goal-text" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-gold h-24 resize-none leading-relaxed" required>${goal ? goal.textAr : ''}</textarea>
        </div>
      `,
      "goal",
      goal ? goal.id : null
    );
  }

  openIdentityCoreModal() {
    const idn = this.model.data.identity;
    const st = idn.approvalStatus || "معتمد";
    const asg = idn.assignee || "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-feather-pointed text-gold"></i><span>تعديل مفهوم الهوية الإبداعية</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-idcore-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول:</label>
              <select id="m-idcore-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">عنوان الهوية:</label>
          <input type="text" id="m-identity-theme" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${idn.theme}" required />

          <label class="font-bold text-white">الشرح والتأصيل الرمزي والمفهوم الإبداعي:</label>
          <textarea id="m-identity-concept" class="bg-black/60 border border-white/15 rounded-lg p-3 text-white outline-none focus:border-gold h-28 resize-none leading-relaxed" required>${idn.conceptAr}</textarea>
        </div>
      `,
      "identity_core"
    );
  }

  openIdentityAppModal(app = null, index = null) {
    const st = app ? (app.approvalStatus || "معتمد") : "معتمد";
    const asg = app ? (app.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-circle-check text-gold"></i><span>${app ? 'تعديل تطبيق الهوية' : 'إضافة تطبيق للهوية'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-app-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول من الفريق:</label>
              <select id="m-app-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">عنوان التطبيق:</label>
          <input type="text" id="m-app-title" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${app ? app.title : ''}" required />

          <label class="font-bold text-white">شرح التطبيق:</label>
          <textarea id="m-app-desc" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-gold h-24 resize-none leading-relaxed" required>${app ? app.desc : ''}</textarea>
        </div>
      `,
      "identity_app",
      null,
      index
    );
  }

  openAxisModal(axis, index) {
    this.showModal(
      `<i class="fa-solid fa-layer-group text-gold"></i><span>تعديل مواصفات ${axis.axis}</span>`,
      `
        <div class="flex flex-col gap-3">
          <label class="font-bold text-white">اسم المحور:</label>
          <input type="text" id="m-axis-name" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${axis.axis}" required />

          <label class="font-bold text-white">طبيعة التجربة والتجول:</label>
          <textarea id="m-axis-nature" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-gold h-20 resize-none" required>${axis.nature}</textarea>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">المدة المقترحة:</label>
              <input type="text" id="m-axis-duration" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${axis.duration}" />
            </div>
            <div>
              <label class="font-bold text-white">مستوى التعقيد:</label>
              <input type="text" id="m-axis-complexity" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${axis.complexity}" />
            </div>
          </div>
        </div>
      `,
      "axis",
      null,
      index
    );
  }

  /* --- 2. ARTIFACTS & PROPOSED TOOLS MODALS --- */
  openArtifactModal(art = null) {
    const st = art ? (art.approvalStatus || (art.status === 'موثق' ? 'معتمد' : 'قيد المراجعة')) : "معتمد";
    const asg = art ? (art.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-jar text-gold"></i><span>${art ? 'تعديل قطعة متحفية' : 'إضافة قطعة جديدة'}</span>`,
      `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">اسم القطعة:</label>
            <input type="text" id="m-art-name" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${art ? art.name : ''}" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">حالة التوثيق التاريخي:</label>
            <input type="text" id="m-art-status" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${art ? art.status : 'موثق'}" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">حالة الاعتماد:</label>
            <select id="m-art-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
              ${this.renderApprovalSelectOptions(st)}
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">المسؤول من الفريق:</label>
            <select id="m-art-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
              ${this.renderMemberSelectOptions(asg)}
            </select>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">التعريف والمصدر النصي:</label>
          <textarea id="m-art-source" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-16 resize-none">${art ? art.source : ''}</textarea>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">الوصف والمقاس التقريبي المقترح للحرفي:</label>
          <textarea id="m-art-specs" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-16 resize-none">${art ? art.specs : ''}</textarea>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">طريقة العرض في القاعة:</label>
          <input type="text" id="m-art-display" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${art ? art.displayMethod : ''}" />
        </div>
      `,
      "artifact",
      art ? art.id : null
    );
  }

  openProposedToolModal(tool = null, index = null) {
    const st = tool ? (tool.approvalStatus || "قيد المراجعة") : "قيد المراجعة";
    const asg = tool ? (tool.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-toolbox text-gold"></i><span>${tool ? 'تعديل الأداة المقترحة' : 'إضافة أداة مقترحة'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-ptool-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول من الفريق:</label>
              <select id="m-ptool-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">اسم الأداة:</label>
          <input type="text" id="m-ptool-name" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${tool ? tool.name : ''}" required />

          <label class="font-bold text-white">الوصف والربط بالسيرة والبيئة الأحسائية:</label>
          <textarea id="m-ptool-desc" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-gold h-24 resize-none leading-relaxed" required>${tool ? tool.desc : ''}</textarea>
        </div>
      `,
      "proposed_tool",
      null,
      index
    );
  }

  /* --- 3. SCHOOLS & SCHOLARS MODALS --- */
  openQuoteModal() {
    const q = this.model.data.hall2_schools.foundingQuote;
    const st = q.approvalStatus || "معتمد";
    const asg = q.assignee || "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-quote-right text-gold"></i><span>تعديل المقولة التأسيسية للمدارس</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-quote-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول:</label>
              <select id="m-quote-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">القائل والمصدر:</label>
          <input type="text" id="m-quote-scholar" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${q.scholar}" required />

          <label class="font-bold text-white">نص المقولة:</label>
          <textarea id="m-quote-text" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-gold h-24 resize-none leading-relaxed" required>${q.text}</textarea>

          <label class="font-bold text-white">الدلالة والأهمية:</label>
          <input type="text" id="m-quote-sig" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${q.significance}" />
        </div>
      `,
      "founding_quote"
    );
  }


  openWaqfViewerModal(sch) {
    if (!sch) return;

    this.showModal(
      `<i class="fa-solid fa-scroll text-gold"></i><span>صك وقفية: ${sch.name} (${sch.year})</span>`,
      `
        <div class="space-y-6">
          
          <!-- Header Info Badge -->
          <div class="flex items-center justify-between p-3.5 rounded-2xl bg-gold/10 border border-gold/30 text-xs">
            <div>
              <span class="text-gold font-bold block text-sm">${sch.name}</span>
              <span class="text-gray-400 text-[11px]">${sch.founder}</span>
            </div>
            <div class="text-left space-y-1">
              <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-white/10 text-laser border border-laser/30 block text-center">
                ${sch.mazhab}
              </span>
              <span class="text-[10px] text-gray-400 font-mono block text-center">${sch.year}</span>
            </div>
          </div>

          <!-- Waqf Manuscript Image (HD Preview) -->
          ${sch.waqfImage ? `
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-300 font-bold flex items-center gap-1.5">
                  <i class="fa-solid fa-image text-gold"></i>
                  <span>صورة المخطوطة وصك الوقفية الأصلي:</span>
                </span>
                <a href="${sch.waqfImage}" target="_blank" download="waqf_${sch.id}.svg" class="text-laser text-[11px] font-bold hover:underline flex items-center gap-1">
                  <i class="fa-solid fa-download"></i>
                  <span>تنزيل المخطوطة</span>
                </a>
              </div>
              <div class="w-full max-h-[380px] rounded-2xl overflow-hidden border-2 border-gold/40 bg-black/80 flex items-center justify-center p-3 shadow-2xl">
                <img src="${sch.waqfImage}" alt="${sch.name}" class="max-h-[360px] w-auto object-contain rounded-xl" />
              </div>
            </div>
          ` : `
            <div class="p-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/15 text-center text-xs text-gray-400 space-y-2">
              <i class="fa-regular fa-image text-2xl text-gold/40 block"></i>
              <span>لم يتم إرفاق صورة للمخطوطة بعد، يمكنك رفع صورة بالضغط على تعديل الوقفية.</span>
            </div>
          `}

          <!-- Complete Transcribed Waqf Text -->
          <div class="space-y-2 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <div class="flex items-center justify-between">
              <h5 class="text-xs font-black text-gold flex items-center gap-2">
                <i class="fa-solid fa-feather-pointed"></i>
                <span>نص صك الوقفية وشروط الواقف الموثقة:</span>
              </h5>
              <button type="button" id="btn-copy-waqf-transcript" class="px-3 py-1 rounded-lg bg-white/10 hover:bg-gold hover:text-black text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer">
                <i class="fa-solid fa-copy"></i>
                <span>نسخ النص</span>
              </button>
            </div>
            <p id="waqf-full-transcript-text" class="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans whitespace-pre-line bg-black/50 p-4 rounded-xl border border-white/5">
              ${sch.waqfText || 'لا يوجد نص مكتوب للوقفية.'}
            </p>
          </div>

          <!-- Actions -->
          ${this.model.canEdit() ? `
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" id="btn-edit-waqf-direct" class="px-5 py-2.5 rounded-xl bg-gold hover:bg-white text-black font-black text-xs transition-all shadow-lg shadow-gold/20 flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-pen"></i>
              <span>تعديل بيانات وصورة الوقفية ✍️</span>
            </button>
          </div>
          ` : ''}

        </div>
      `,
      "waqf_viewer",
      sch.id
    );

    setTimeout(() => {
      const btnCopy = document.getElementById("btn-copy-waqf-transcript");
      if (btnCopy) {
        btnCopy.addEventListener("click", () => {
          const text = document.getElementById("waqf-full-transcript-text")?.textContent || "";
          navigator.clipboard.writeText(text.trim()).then(() => {
            btnCopy.innerHTML = '<i class="fa-solid fa-check text-palm"></i><span>تم النسخ!</span>';
            setTimeout(() => {
              btnCopy.innerHTML = '<i class="fa-solid fa-copy"></i><span>نسخ النص</span>';
            }, 2000);
          });
        });
      }

      const btnEditDirect = document.getElementById("btn-edit-waqf-direct");
      if (btnEditDirect && this.model.canEdit()) {
        btnEditDirect.addEventListener("click", () => {
          this.closeModal();
          this.openSchoolModal(sch);
        });
      }
    }, 50);
  }

  openSchoolModal(sch = null) {
    const st = sch ? (sch.approvalStatus || "معتمد") : "معتمد";
    const asg = sch ? (sch.assignee || "غير مسند") : "غير مسند";
    const waqfImage = sch ? (sch.waqfImage || "") : "";

    this.showModal(
      `<i class="fa-solid fa-graduation-cap text-gold"></i><span>${sch ? 'تعديل مدرسة وصك الوقفية' : 'إضافة مدرسة وصك الوقفية'}</span>`,
      `
        <div class="space-y-4">
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="font-bold text-white text-xs">اسم المدرسة / الرباط: *</label>
              <input type="text" id="m-sch-name" class="bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-gold" placeholder="اسم المدرسة..." required />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="font-bold text-white text-xs">المذهب:</label>
              <input type="text" id="m-sch-mazhab" class="bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-gold" placeholder="المذهب الفقهي..." />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="font-bold text-white text-xs">سنة التأسيس:</label>
              <input type="text" id="m-sch-year" class="bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-gold" placeholder="مثال: 979هـ" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="font-bold text-white text-xs">الحالة اليوم:</label>
              <input type="text" id="m-sch-status" class="bg-black/60 border border-white/15 rounded-xl px-3.5 py-2 text-white text-xs outline-none focus:border-gold" placeholder="معمورة بالأنشطة..." />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white text-xs">الواقف والموقع وأول مدرّس:</label>
            <textarea id="m-sch-founder" class="bg-black/60 border border-white/15 rounded-xl p-2.5 text-white text-xs outline-none focus:border-gold h-16 resize-none" placeholder="الواقف والموقع وأول مدرس..."></textarea>
          </div>

          <!-- WAQF DEED DOCUMENT & TRANSCRIPT SECTION -->
          <div class="p-4 rounded-2xl bg-gold/10 border border-gold/30 space-y-3.5">
            <div class="flex items-center justify-between">
              <label class="font-black text-gold text-xs flex items-center gap-2">
                <i class="fa-solid fa-scroll text-sm"></i>
                <span>بيانات صك الوقفية والمخطوطة التراثية 📜</span>
              </label>
              <span class="text-[10px] text-gray-400">وثيقة الحبس والشروط المعتمدة</span>
            </div>

            <!-- Waqf Deed Full Text (No size restriction) -->
            <div class="flex flex-col gap-1.5">
              <label class="font-bold text-gray-300 text-[11px]">نص صك الوقفية وشروط الواقف والإنفاق (يقبل النصوص الطويلة والتفريغ الكامل):</label>
              <textarea id="m-sch-waqf-text" rows="5" placeholder="اكتب أو الصق نص صك الوقفية كاملاً وشروط الواقف والإنفاق على الطلاب والمدرسين والمكتبة..."
                        class="bg-black/60 border border-white/15 rounded-xl p-3 text-white text-xs leading-relaxed outline-none focus:border-gold resize-y min-h-[100px]"></textarea>
            </div>

            <!-- Waqf Image Upload & URL input -->
            <div class="space-y-2 pt-1 border-t border-gold/20">
              <label class="font-bold text-gray-300 text-[11px]">تحميل أو رابط صورة صك الوقفية / المخطوطة الأصلية:</label>
              
              <div id="m-sch-waqf-upload-status" class="hidden text-xs py-1 text-gray-300"></div>
              <div class="flex flex-col sm:flex-row items-center gap-2">
                <!-- Local File Picker -->
                <label class="w-full sm:w-auto px-4 py-2 rounded-xl bg-gold/20 hover:bg-gold hover:text-black text-gold border border-gold/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                  <i class="fa-solid fa-cloud-arrow-up"></i>
                  <span>رفع صورة من الجهاز 📁</span>
                  <input type="file" id="m-sch-waqf-file" accept="image/*" class="hidden" />
                </label>

                <!-- URL input -->
                <input type="text" id="m-sch-waqf-image" placeholder="أو الصق رابط صورة الوقفية (URL)..."
                       class="flex-1 w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-gold"
                       value="${this.escapeHtml(waqfImage)}" />
              </div>

              <!-- Live Preview Box -->
              <div id="m-sch-waqf-preview-box" class="pt-2 ${waqfImage ? 'flex' : 'hidden'} items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/10">
                <img id="m-sch-waqf-preview-img" src="${waqfImage}" alt="معاينة الوقفية" class="w-16 h-16 object-contain rounded-lg border border-gold/30 bg-black/50" />
                <div class="flex-1 space-y-1">
                  <span class="text-[11px] font-bold text-white block">تم تحديد صورة الوقفية</span>
                  <span class="text-[10px] text-gray-400 block">ستظهر المخطوطة في صفحة المدارس والمعرض</span>
                </div>
                <button type="button" id="btn-remove-sch-waqf-img" class="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs transition-all" title="إزالة الصورة">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>

            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/10">
            <div class="flex flex-col gap-1.5">
              <label class="font-bold text-white text-xs">حالة الاعتماد:</label>
              <select id="m-sch-approval" class="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="font-bold text-white text-xs">المسؤول من الفريق:</label>
              <select id="m-sch-assignee" class="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

        </div>
      `,
      "school",
      sch ? sch.id : null
    );

    // Populate all DOM values directly to prevent any HTML escaping/truncation issues
    setTimeout(() => {
      const elName = document.getElementById("m-sch-name");
      const elMazhab = document.getElementById("m-sch-mazhab");
      const elYear = document.getElementById("m-sch-year");
      const elStatus = document.getElementById("m-sch-status");
      const elFounder = document.getElementById("m-sch-founder");
      const elWaqfText = document.getElementById("m-sch-waqf-text");
      const elWaqfImg = document.getElementById("m-sch-waqf-image");

      if (elName) elName.value = sch ? (sch.name || "") : "";
      if (elMazhab) elMazhab.value = sch ? (sch.mazhab || "حنفي") : "حنفي";
      if (elYear) elYear.value = sch ? (sch.year || "") : "";
      if (elStatus) elStatus.value = sch ? (sch.status || "معمورة بالأنشطة") : "معمورة بالأنشطة";
      if (elFounder) elFounder.value = sch ? (sch.founder || "") : "";
      if (elWaqfText) elWaqfText.value = sch ? (sch.waqfText || "") : "";
      if (elWaqfImg) elWaqfImg.value = sch ? (sch.waqfImage || "") : "";

      const fileInput = document.getElementById("m-sch-waqf-file");
      const urlInput = document.getElementById("m-sch-waqf-image");
      const previewBox = document.getElementById("m-sch-waqf-preview-box");
      const previewImg = document.getElementById("m-sch-waqf-preview-img");
      const btnRemoveImg = document.getElementById("btn-remove-sch-waqf-img");

      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const uploadStatusBox = document.getElementById("m-sch-waqf-upload-status");
          if (uploadStatusBox) {
            uploadStatusBox.classList.remove("hidden");
            uploadStatusBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gold"></i><span>جاري رفع وحفظ الملف على السيرفر...</span>';
          }

          const reader = new FileReader();
          reader.onload = async (loadEvt) => {
            const dataUrl = loadEvt.target.result;
            
            if (previewImg) previewImg.src = dataUrl;
            if (previewBox) {
              previewBox.classList.remove("hidden");
              previewBox.classList.add("flex");
            }

            try {
              const res = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  filename: file.name,
                  dataUrl: dataUrl
                })
              });
              const data = await res.json();
              if (res.ok && data.status === "success" && data.url) {
                if (urlInput) urlInput.value = data.url;
                if (previewImg) previewImg.src = data.url;
                if (uploadStatusBox) {
                  uploadStatusBox.innerHTML = '<span class="text-palm font-bold flex items-center gap-1"><i class="fa-solid fa-check-circle"></i><span>تم رفع وحفظ المخطوطة بنجاح على السيرفر!</span></span>';
                }
              } else {
                throw new Error(data.message || "Upload failed");
              }
            } catch (err) {
              console.warn("Server upload fallback to data URL:", err);
              if (urlInput) urlInput.value = dataUrl;
              if (uploadStatusBox) {
                uploadStatusBox.innerHTML = '<span class="text-gold text-[10px] flex items-center gap-1"><i class="fa-solid fa-info-circle"></i><span>تم حفظ الصورة محلياً بنجاح.</span></span>';
              }
            }
          };
          reader.readAsDataURL(file);
        });
      }

      if (urlInput) {
        urlInput.addEventListener("input", (e) => {
          const val = e.target.value.trim();
          if (val) {
            if (previewImg) previewImg.src = val;
            if (previewBox) {
              previewBox.classList.remove("hidden");
              previewBox.classList.add("flex");
            }
          } else {
            if (previewBox) {
              previewBox.classList.add("hidden");
              previewBox.classList.remove("flex");
            }
          }
        });
      }

      if (btnRemoveImg) {
        btnRemoveImg.addEventListener("click", () => {
          if (urlInput) urlInput.value = "";
          if (fileInput) fileInput.value = "";
          if (previewBox) {
            previewBox.classList.add("hidden");
            previewBox.classList.remove("flex");
          }
        });
      }
    }, 20);
  }

  openScholarsSummaryModal() {
    const net = this.model.data.hall2_schools?.scholarsNetwork || {};
    const st = net.approvalStatus || "معتمد";
    const asg = net.assignee || "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-network-wired text-gold"></i><span>تعديل شرح شبكة العلماء</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white text-xs">حالة الاعتماد:</label>
              <select id="m-schnet-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white text-xs">المسؤول:</label>
              <select id="m-schnet-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white text-xs">ملخص شبكة العلماء والمذاهب الوافدة:</label>
          <textarea id="m-sch-summary" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white text-xs outline-none focus:border-gold h-24 resize-y leading-relaxed" placeholder="ملخص شبكة العلماء..."></textarea>

          <label class="font-bold text-white text-xs">تجديد الفقه الشافعي ومدرسة الدوغان:</label>
          <textarea id="m-sch-shafii" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white text-xs outline-none focus:border-gold h-20 resize-y leading-relaxed" placeholder="تجديد الفقه الشافعي..."></textarea>
        </div>
      `,
      "scholars_summary"
    );

    setTimeout(() => {
      const elSummary = document.getElementById("m-sch-summary");
      const elShafii = document.getElementById("m-sch-shafii");
      if (elSummary) elSummary.value = net.summary || "";
      if (elShafii) elShafii.value = net.shafiiRevival || "";
    }, 20);
  }

  openStudentModal(st = null, index = null) {
    const appr = st ? (st.approvalStatus || "معتمد") : "معتمد";
    const asg = st ? (st.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-user-graduate text-gold"></i><span>${st ? 'تعديل تلميذ' : 'إضافة تلميذ جديد'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-st-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(appr)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول:</label>
              <select id="m-st-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">اسم العالم / التلميذ:</label>
          <input type="text" id="m-st-name" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${st ? st.name : ''}" required />

          <label class="font-bold text-white">المذهب الفقهي / التخصص:</label>
          <input type="text" id="m-st-mazhab" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${st ? st.mazhab : 'شافعي'}" required />
        </div>
      `,
      "student",
      null,
      index
    );
  }

  openExhibitCompModal(comp = null, index = null) {
    const st = comp ? (comp.approvalStatus || "معتمد") : "معتمد";
    const asg = comp ? (comp.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-cubes text-gold"></i><span>${comp ? 'تعديل ركن العرض' : 'إضافة ركن عرض'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-comp-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول من الفريق:</label>
              <select id="m-comp-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">اسم الركن المعماري / الفني:</label>
          <input type="text" id="m-comp-name" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${comp ? comp.name : ''}" required />

          <label class="font-bold text-white">الوصف والأنظمة التقنية:</label>
          <textarea id="m-comp-desc" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-gold h-24 resize-none leading-relaxed" required>${comp ? comp.desc : ''}</textarea>
        </div>
      `,
      "exhibit_comp",
      null,
      index
    );
  }

  /* --- 4. HOLOGRAM & SCENES MODALS --- */
  openHologramSpecsModal() {
    const sp = this.model.data.hologram.specs;
    this.showModal(
      `<i class="fa-solid fa-film text-gold"></i><span>تعديل مواصفات قاعة الهولوجرام</span>`,
      `
        <div class="flex flex-col gap-3">
          <label class="font-bold text-white">طبيعة العرض والتقنية:</label>
          <input type="text" id="m-hspec-nature" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${sp.nature}" required />

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="font-bold text-white">المدة الإجمالية:</label>
              <input type="text" id="m-hspec-duration" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${sp.duration}" />
            </div>
            <div>
              <label class="font-bold text-white">التكرار الدوري:</label>
              <input type="text" id="m-hspec-freq" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${sp.frequency}" />
            </div>
            <div>
              <label class="font-bold text-white">سعة المقاعد:</label>
              <input type="text" id="m-hspec-cap" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${sp.capacity}" />
            </div>
          </div>
        </div>
      `,
      "hologram_specs"
    );
  }

  openHistoricalStoryModal(story = null, index = null) {
    const st = story ? (story.approvalStatus || (story.verified ? 'معتمد' : 'قيد المراجعة')) : "معتمد";
    const asg = story ? (story.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-scroll text-gold"></i><span>${story ? 'تعديل قصة تاريخية' : 'إضافة قصة تاريخية'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-story-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول من الفريق:</label>
              <select id="m-story-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">عنوان القصة / الحدث:</label>
          <input type="text" id="m-story-title" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${story ? story.title : ''}" required />

          <label class="font-bold text-white">المصدر التاريخي والتخريج:</label>
          <textarea id="m-story-source" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-gold h-16 resize-none" required>${story ? story.source : ''}</textarea>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">التوثيق العلمي:</label>
              <select id="m-story-verified" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                <option value="true" ${!story || story.verified ? 'selected' : ''}>موثق علمياً</option>
                <option value="false" ${story && !story.verified ? 'selected' : ''}>مقترح / تحت البحث</option>
              </select>
            </div>
            <div>
              <label class="font-bold text-white">الملاحظات العلمية:</label>
              <input type="text" id="m-story-notes" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${story ? story.notes : ''}" />
            </div>
          </div>
        </div>
      `,
      "story",
      null,
      index
    );
  }

  openSceneModal(sceneNum = null) {
    let scene = null;
    if (sceneNum) {
      scene = this.model.getScenes().find(s => s.num === sceneNum);
    }
    const st = scene ? (scene.approvalStatus || "معتمد") : "معتمد";
    const asg = scene ? (scene.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-film text-gold"></i><span>${scene ? `تعديل المشهد ${scene.num}: ${scene.title}` : 'إضافة مشهد جديد'}</span>`,
      `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">عنوان المشهد:</label>
            <input type="text" id="m-sc-title" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${scene ? scene.title : ''}" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">المدة المقترحة:</label>
            <input type="text" id="m-sc-duration" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${scene ? scene.duration : '120 ثانية'}" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">حالة الاعتماد:</label>
            <select id="m-sc-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
              ${this.renderApprovalSelectOptions(st)}
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">المسؤول من الفريق:</label>
            <select id="m-sc-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
              ${this.renderMemberSelectOptions(asg)}
            </select>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">المكان والزمن:</label>
          <input type="text" id="m-sc-setting" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${scene ? scene.setting : ''}" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">الوصف البصري والتقني:</label>
          <textarea id="m-sc-visual" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-16 resize-none">${scene ? scene.visualDesc : ''}</textarea>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">الصوت والنص والحوار:</label>
          <textarea id="m-sc-audio" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-16 resize-none">${scene ? scene.audioText : ''}</textarea>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">الغرض الدرامي والأثر:</label>
          <textarea id="m-sc-dramatic" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-14 resize-none">${scene ? scene.dramaticPurpose : ''}</textarea>
        </div>
      `,
      "scene",
      sceneNum
    );
  }

  /* --- 5. VR MODAL --- */
  openVRModal() {
    const vr = this.model.data.vrExperience;
    const st = vr.approvalStatus || "معتمد";
    const asg = vr.assignee || "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-headset text-gold"></i><span>تعديل مواصفات تجربة الواقع الافتراضي VR</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-vr-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول:</label>
              <select id="m-vr-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">العتاد والأنظمة الحركية:</label>
          <input type="text" id="m-vr-hw" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${vr.hardware}" required />

          <label class="font-bold text-white">المؤثرات الحسية المتزامنة:</label>
          <input type="text" id="m-vr-sensory" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${vr.sensoryEffects}" required />

          <label class="font-bold text-white">المرونة وقابلية النقل للفعاليات:</label>
          <input type="text" id="m-vr-mobility" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${vr.mobility}" />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">السعة والوحدات:</label>
              <input type="text" id="m-vr-cap" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${vr.capacity}" />
            </div>
            <div>
              <label class="font-bold text-white">المدة الزمنية:</label>
              <input type="text" id="m-vr-dur" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${vr.duration}" />
            </div>
          </div>

          <label class="font-bold text-white">مفهوم المحتوى والفيلم المستقل:</label>
          <textarea id="m-vr-concept" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-gold h-20 resize-none">${vr.sceneConcept}</textarea>
        </div>
      `,
      "vr"
    );
  }

  /* --- 6. LOCATION & AREAS MODALS --- */
  openLocationModal(loc = null) {
    const st = loc ? (loc.approvalStatus || (loc.id === 'loc_modern_kut' ? 'معتمد' : 'قيد المراجعة')) : "قيد المراجعة";
    const asg = loc ? (loc.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-map-location-dot text-gold"></i><span>${loc ? 'تعديل الموقع' : 'إضافة موقع جديد'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">اسم الموقع:</label>
              <input type="text" id="m-loc-name" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${loc ? loc.name : ''}" required />
            </div>
            <div>
              <label class="font-bold text-white">التقييم / التوصية:</label>
              <input type="text" id="m-loc-score" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${loc ? loc.score : ''}" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-loc-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول من الفريق:</label>
              <select id="m-loc-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">الوصف العام:</label>
          <textarea id="m-loc-desc" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-14 resize-none">${loc ? loc.desc : ''}</textarea>

          <label class="font-bold text-white">المميزات (Pros):</label>
          <textarea id="m-loc-pros" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-14 resize-none">${loc ? loc.pros : ''}</textarea>

          <label class="font-bold text-white">التحديات (Cons):</label>
          <textarea id="m-loc-cons" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-14 resize-none">${loc ? loc.cons : ''}</textarea>
        </div>
      `,
      "location",
      loc ? loc.id : null
    );
  }

  openAreaModal(item = null, index = null) {
    const st = item ? (item.approvalStatus || "معتمد") : "معتمد";
    const asg = item ? (item.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-ruler-combined text-gold"></i><span>${item ? 'تعديل الفراغ' : 'إضافة فراغ جديد'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-area-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول:</label>
              <select id="m-area-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">اسم الفراغ الوظيفي:</label>
          <input type="text" id="m-area-space" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${item ? item.space : ''}" required />

          <label class="font-bold text-white">المساحة التقديرية (م²):</label>
          <input type="text" id="m-area-size" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${item ? item.area : ''}" required />

          <label class="font-bold text-white">المتطلبات الهندسية والملاحظات:</label>
          <textarea id="m-area-notes" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-20 resize-none">${item ? item.notes : ''}</textarea>
        </div>
      `,
      "area_item",
      null,
      index
    );
  }

  /* --- 7. BUDGET & OPERATIONS MODALS --- */
  openBudgetTotalsModal() {
    const b = this.model.data.budget;
    const st = b.approvalStatus || "معتمد";
    const asg = b.assignee || "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-calculator text-gold"></i><span>تعديل إجمالي الموازنة التقديرية</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-btotal-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول:</label>
              <select id="m-btotal-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">إجمالي المشروع كاملاً (المحاور الثلاثة):</label>
          <input type="text" id="m-btotal-full" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${b.totalFullProject}" required />

          <label class="font-bold text-white">المرحلة الأولى (المتحف الدائم فقط Pilot):</label>
          <input type="text" id="m-btotal-phase1" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${b.phase1Only}" required />
        </div>
      `,
      "budget_totals"
    );
  }

  openBudgetItemModal(item = null, index = null) {
    const st = item ? (item.approvalStatus || "معتمد") : "معتمد";
    const asg = item ? (item.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-coins text-gold"></i><span>${item ? 'تعديل بند مالي' : 'إضافة بند مالي جديد'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-bitem-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول:</label>
              <select id="m-bitem-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">البند الإنشائي / التقني:</label>
          <input type="text" id="m-bitem-name" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${item ? item.item : ''}" required />

          <label class="font-bold text-white">نطاق التكلفة التقديرية:</label>
          <input type="text" id="m-bitem-cost" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${item ? item.costRange : ''}" required />

          <label class="font-bold text-white">تفاصيل البند وما يشمله:</label>
          <textarea id="m-bitem-includes" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-20 resize-none">${item ? item.includes : ''}</textarea>
        </div>
      `,
      "budget_item",
      null,
      index
    );
  }

  openTicketModal(ticket = null, index = null) {
    const st = ticket ? (ticket.approvalStatus || "معتمد") : "معتمد";
    const asg = ticket ? (ticket.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-ticket text-gold"></i><span>${ticket ? 'تعديل فئة التذكرة' : 'إضافة فئة تذكرة'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-tkt-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول:</label>
              <select id="m-tkt-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">اسم الفئة / الخدمة:</label>
          <input type="text" id="m-tkt-cat" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${ticket ? ticket.category : ''}" required />

          <label class="font-bold text-white">السعر المقترح:</label>
          <input type="text" id="m-tkt-price" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${ticket ? ticket.price : ''}" required />

          <label class="font-bold text-white">الملاحظات التشغيلية:</label>
          <textarea id="m-tkt-notes" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-16 resize-none">${ticket ? ticket.notes : ''}</textarea>
        </div>
      `,
      "ticket",
      null,
      index
    );
  }

  openWaqfModal(pillar = null, index = null) {
    const st = pillar ? (pillar.approvalStatus || "معتمد") : "معتمد";
    const asg = pillar ? (pillar.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-mosque text-gold"></i><span>${pillar ? 'تعديل ركيزة الوقف' : 'إضافة ركيزة وقفية'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-wq-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول:</label>
              <select id="m-wq-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">عنوان الركيزة / المسار:</label>
          <input type="text" id="m-wq-title" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${pillar ? pillar.pillar : ''}" required />

          <label class="font-bold text-white">تفاصيل النموذج وآلية التنفيذ:</label>
          <textarea id="m-wq-desc" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-gold h-24 resize-none leading-relaxed" required>${pillar ? pillar.desc : ''}</textarea>
        </div>
      `,
      "waqf",
      null,
      index
    );
  }

  openStageModal(stage = null, index = null) {
    const st = stage ? (stage.approvalStatus || "معتمد") : "معتمد";
    const asg = stage ? (stage.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-timeline text-gold"></i><span>${stage ? 'تعديل المرحلة التنفيذية' : 'إضافة مرحلة جديدة'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-stg-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول:</label>
              <select id="m-stg-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">اسم المرحلة:</label>
              <input type="text" id="m-stg-phase" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${stage ? stage.phase : ''}" required />
            </div>
            <div>
              <label class="font-bold text-white">المدة الزمنية المتوقعة:</label>
              <input type="text" id="m-stg-dur" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${stage ? stage.duration : ''}" required />
            </div>
          </div>

          <label class="font-bold text-white">شرح مخرجات المرحلة:</label>
          <textarea id="m-stg-desc" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-20 resize-none">${stage ? stage.desc : ''}</textarea>
        </div>
      `,
      "stage",
      null,
      index
    );
  }

  /* --- 8. SOUVENIR, PARTNER & REF MODALS --- */
  openSouvenirModal(souv = null, index = null) {
    const st = souv ? (souv.approvalStatus || "معتمد") : "معتمد";
    const asg = souv ? (souv.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-gift text-gold"></i><span>${souv ? 'تعديل منتج تذكاري' : 'إضافة منتج تذكاري'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-souv-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول من الفريق:</label>
              <select id="m-souv-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">اسم المنتج:</label>
              <input type="text" id="m-souv-name" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${souv ? souv.name : ''}" required />
            </div>
            <div>
              <label class="font-bold text-white">السعر المستهدف:</label>
              <input type="text" id="m-souv-price" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${souv ? souv.price : ''}" />
            </div>
          </div>

          <label class="font-bold text-white">الوصف وتفاصيل الإنتاج الحرفي:</label>
          <textarea id="m-souv-desc" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-20 resize-none">${souv ? souv.desc : ''}</textarea>
        </div>
      `,
      "souvenir",
      null,
      index
    );
  }

  openPartnerModal(partner = null, index = null) {
    const st = partner ? (partner.approvalStatus || "معتمد") : "معتمد";
    const asg = partner ? (partner.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-handshake text-gold"></i><span>${partner ? 'تعديل جهة شريكة' : 'إضافة جهة شريكة'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-prt-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول من الفريق:</label>
              <select id="m-prt-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">اسم الجهة المؤسسية:</label>
          <input type="text" id="m-prt-name" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${partner ? partner.name : ''}" required />

          <label class="font-bold text-white">نطاق التنسيق والشراكة:</label>
          <textarea id="m-prt-role" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-20 resize-none" required>${partner ? partner.role : ''}</textarea>
        </div>
      `,
      "partner",
      null,
      index
    );
  }

  openReferenceModal(ref = null, index = null) {
    const st = ref ? (ref.approvalStatus || "معتمد") : "معتمد";
    const asg = ref ? (ref.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-book-bookmark text-gold"></i><span>${ref ? 'تعديل مرجع موثق' : 'إضافة مرجع موثق'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-ref-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول:</label>
              <select id="m-ref-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">عنوان الكتاب / الوثيقة:</label>
          <input type="text" id="m-ref-title" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${ref ? ref.title : ''}" required />

          <label class="font-bold text-white">المؤلف / الباحث:</label>
          <input type="text" id="m-ref-author" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${ref ? ref.author : ''}" />

          <label class="font-bold text-white">الملاحظات وأرقام الصفحات / الأحاديث:</label>
          <textarea id="m-ref-notes" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-18 resize-none">${ref ? ref.notes : ''}</textarea>
        </div>
      `,
      "reference",
      null,
      index
    );
  }

  /* --- 9. TASKS MODAL --- */
  openTaskModal(task = null) {
    const asg = task ? (task.assignee || "غير مسند") : "غير مسند";
    const appr = task ? (task.approvalStatus || "معتمد") : "معتمد";

    this.showModal(
      `<i class="fa-solid fa-list-check text-gold"></i><span>${task ? 'تعديل مهمة' : 'إضافة مهمة جديدة'}</span>`,
      `
        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">عنوان المهمة:</label>
          <input type="text" id="m-task-title" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${task ? task.title : ''}" placeholder="أدخل عنوان المهمة..." required />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">المسار التخصصي:</label>
            <select id="m-task-track" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
              <option value="شرعي وتاريخي" ${task && task.track === 'شرعي وتاريخي' ? 'selected' : ''}>شرعي وتاريخي</option>
              <option value="تصميم ومقتنيات" ${task && task.track === 'تصميم ومقتنيات' ? 'selected' : ''}>تصميم ومقتنيات</option>
              <option value="سينما وهولوجرام" ${task && task.track === 'سينما وهولوجرام' ? 'selected' : ''}>سينما وهولوجرام</option>
              <option value="موقع وتراخيص" ${task && task.track === 'موقع وتراخيص' ? 'selected' : ''}>موقع وتراخيص</option>
              <option value="تمويل واستدامة" ${task && task.track === 'تمويل واستدامة' ? 'selected' : ''}>تمويل واستدامة</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">المسؤول من الفريق:</label>
            <select id="m-task-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
              ${this.renderMemberSelectOptions(asg)}
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">الاعتماد:</label>
            <select id="m-task-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
              ${this.renderApprovalSelectOptions(appr)}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">الأولوية:</label>
            <select id="m-task-priority" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
              <option value="حرجة" ${task && task.priority === 'حرجة' ? 'selected' : ''}>حرجة</option>
              <option value="عالية" ${task && task.priority === 'عالية' ? 'selected' : ''}>عالية</option>
              <option value="متوسطة" ${task && task.priority === 'متوسطة' ? 'selected' : ''}>متوسطة</option>
              <option value="منخفضة" ${task && task.priority === 'منخفضة' ? 'selected' : ''}>منخفضة</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">الحالة:</label>
            <select id="m-task-status" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
              <option value="لم تبدأ" ${task && task.status === 'لم تبدأ' ? 'selected' : ''}>لم تبدأ</option>
              <option value="قيد التنفيذ" ${task && task.status === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
              <option value="للمراجعة" ${task && task.status === 'للمراجعة' ? 'selected' : ''}>للمراجعة</option>
              <option value="مكتمل" ${task && task.status === 'مكتمل' ? 'selected' : ''}>مكتمل</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="font-bold text-white">الموعد المستهدف:</label>
            <input type="date" id="m-task-due" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${task ? task.dueDate : new Date().toISOString().split('T')[0]}" />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">الملاحظات والتفاصيل:</label>
          <textarea id="m-task-notes" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-gold h-20 resize-none">${task ? task.notes : ''}</textarea>
        </div>
      `,
      "task",
      task ? task.id : null
    );
  }

  /* --- 10. DECISIONS MODAL --- */
  openDecisionDetailsModal(dec = null) {
    const st = dec ? (dec.approvalStatus || "قيد المراجعة") : "قيد المراجعة";
    const asg = dec ? (dec.assignee || "غير مسند") : "غير مسند";

    this.showModal(
      `<i class="fa-solid fa-clipboard-question text-gold"></i><span>${dec ? 'تعديل بند القرار المعلق' : 'إضافة بند قرار معلق'}</span>`,
      `
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">حالة الاعتماد:</label>
              <select id="m-dec-approval" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderApprovalSelectOptions(st)}
              </select>
            </div>
            <div>
              <label class="font-bold text-white">المسؤول من الفريق:</label>
              <select id="m-dec-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold">
                ${this.renderMemberSelectOptions(asg)}
              </select>
            </div>
          </div>

          <label class="font-bold text-white">عنوان البند / الاستفسار:</label>
          <input type="text" id="m-dec-title" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${dec ? dec.title : ''}" required />

          <label class="font-bold text-white">المطلوب حسمه بالتفصيل:</label>
          <textarea id="m-dec-q" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-gold h-18 resize-none" required>${dec ? dec.question : ''}</textarea>

          <label class="font-bold text-white">التوصية العلمية أو التنفيذية:</label>
          <textarea id="m-dec-rec" class="bg-black/60 border border-white/15 rounded-lg p-2.5 text-white outline-none focus:border-gold h-18 resize-none" required>${dec ? dec.recommendation : ''}</textarea>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="font-bold text-white">القرار المعتمد حالياً:</label>
              <input type="text" id="m-dec-status" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${dec ? dec.status : 'قيد الدراسة'}" />
            </div>
            <div>
              <label class="font-bold text-white">خيارات القرار (مفصولة بفاصلة):</label>
              <input type="text" id="m-dec-opts" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${dec && dec.decisionOptions ? dec.decisionOptions.join('، ') : 'اعتماد، استبعاد، قيد الدراسة'}" />
            </div>
          </div>
        </div>
      `,
      "decision_details",
      dec ? dec.id : null
    );
  }

  /* ================= SAVE MODAL DISPATCHER ================= */
  async handleSaveModal() {
    if (!this.model.canEdit()) {
      alert("🔒 عذراً، حسابك بصلاحية استعراض فقط ولا يمكنك حفظ التعديلات.");
      this.closeModal();
      return;
    }

    const btnSave = document.getElementById("btn-save-modal");
    if (btnSave) btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>جاري الحفظ...</span>';
    const type = this.activeModalType;

    if (type === "team_member") {
      if (!this.model.isAdmin()) {
        alert("🔒 عذراً، إدارة أعضاء الفريق محصورة بمدير النظام (Admin).");
        this.closeModal();
        return;
      }
      const name = document.getElementById("m-mem-name").value.trim();
      const role = document.getElementById("m-mem-role").value.trim();
      if (!name || !role) { alert("يرجى إدخال اسم العضو والمسمى الوظيفي"); return; }
      
      const memberData = {
        name,
        role,
        track: document.getElementById("m-mem-track").value,
        avatarColor: document.getElementById("m-mem-color").value,
        email: document.getElementById("m-mem-email").value.trim(),
        phone: document.getElementById("m-mem-phone").value.trim(),
        bio: document.getElementById("m-mem-bio").value.trim()
      };

      if (this.activeModalItemId) {
        this.model.updateTeamMember(this.activeModalItemId, memberData);
      } else {
        this.model.addTeamMember(memberData);
      }
    } else if (type === "metadata") {
      this.model.updateMetadata({
        titleAr: document.getElementById("m-meta-title").value.trim(),
        subtitleAr: document.getElementById("m-meta-subtitle").value.trim(),
        locationAr: document.getElementById("m-meta-location").value.trim(),
        sloganAr: document.getElementById("m-meta-slogan").value.trim()
      });
    } else if (type === "vision") {
      const v = document.getElementById("m-vision-text").value.trim();
      const appr = document.getElementById("m-vision-approval").value;
      const asg = document.getElementById("m-vision-assignee").value;
      this.model.updateVision(v, appr, asg);
    } else if (type === "goal") {
      const gType = document.getElementById("m-goal-type").value;
      const gText = document.getElementById("m-goal-text").value.trim();
      const appr = document.getElementById("m-goal-approval").value;
      const asg = document.getElementById("m-goal-assignee").value;
      if (!gText) { alert("يرجى إدخال نص الهدف"); return; }
      if (this.activeModalItemId) {
        this.model.updateGoal(this.activeModalItemId, { type: gType, textAr: gText, approvalStatus: appr, assignee: asg });
      } else {
        this.model.addGoal({ type: gType, textAr: gText, approvalStatus: appr, assignee: asg });
      }
    } else if (type === "identity_core") {
      const theme = document.getElementById("m-identity-theme").value.trim();
      const concept = document.getElementById("m-identity-concept").value.trim();
      const appr = document.getElementById("m-idcore-approval").value;
      const asg = document.getElementById("m-idcore-assignee").value;
      this.model.updateIdentityCore(theme, concept, appr, asg);
    } else if (type === "identity_app") {
      const title = document.getElementById("m-app-title").value.trim();
      const desc = document.getElementById("m-app-desc").value.trim();
      const appr = document.getElementById("m-app-approval").value;
      const asg = document.getElementById("m-app-assignee").value;
      if (this.activeModalIndex !== null) {
        this.model.updateIdentityApp(this.activeModalIndex, title, desc, appr, asg);
      } else {
        this.model.addIdentityApp({ title, desc, approvalStatus: appr, assignee: asg });
      }
    } else if (type === "axis") {
      const updates = {
        axis: document.getElementById("m-axis-name").value.trim(),
        nature: document.getElementById("m-axis-nature").value.trim(),
        duration: document.getElementById("m-axis-duration").value.trim(),
        complexity: document.getElementById("m-axis-complexity").value.trim()
      };
      this.model.updateAxisItem(this.activeModalIndex, updates);
    } else if (type === "artifact") {
      const name = document.getElementById("m-art-name").value.trim();
      if (!name) { alert("يرجى إدخال اسم القطعة"); return; }
      const artData = {
        name,
        status: document.getElementById("m-art-status").value.trim(),
        approvalStatus: document.getElementById("m-art-approval").value,
        assignee: document.getElementById("m-art-assignee").value,
        source: document.getElementById("m-art-source").value.trim(),
        specs: document.getElementById("m-art-specs").value.trim(),
        displayMethod: document.getElementById("m-art-display").value.trim()
      };
      if (this.activeModalItemId) {
        this.model.updateArtifact(this.activeModalItemId, artData);
      } else {
        this.model.addArtifact(artData);
      }
    } else if (type === "proposed_tool") {
      const tool = {
        name: document.getElementById("m-ptool-name").value.trim(),
        desc: document.getElementById("m-ptool-desc").value.trim(),
        approvalStatus: document.getElementById("m-ptool-approval").value,
        assignee: document.getElementById("m-ptool-assignee").value
      };
      if (this.activeModalIndex !== null) {
        this.model.updateProposedTool(this.activeModalIndex, tool);
      } else {
        this.model.addProposedTool(tool);
      }
    } else if (type === "founding_quote") {
      const scholar = document.getElementById("m-quote-scholar").value.trim();
      const text = document.getElementById("m-quote-text").value.trim();
      const sig = document.getElementById("m-quote-sig").value.trim();
      const appr = document.getElementById("m-quote-approval").value;
      const asg = document.getElementById("m-quote-assignee").value;
      this.model.updateFoundingQuote(scholar, text, sig, appr, asg);
    } else if (type === "school") {
      const name = document.getElementById("m-sch-name").value.trim();
      if (!name) { alert("يرجى إدخال اسم المدرسة"); return; }
      const schData = {
        name,
        mazhab: document.getElementById("m-sch-mazhab").value.trim(),
        year: document.getElementById("m-sch-year").value.trim(),
        status: document.getElementById("m-sch-status").value.trim(),
        founder: document.getElementById("m-sch-founder").value.trim(),
        waqfText: document.getElementById("m-sch-waqf-text") ? document.getElementById("m-sch-waqf-text").value.trim() : "",
        waqfImage: document.getElementById("m-sch-waqf-image") ? document.getElementById("m-sch-waqf-image").value.trim() : "",
        approvalStatus: document.getElementById("m-sch-approval").value,
        assignee: document.getElementById("m-sch-assignee").value
      };
      if (this.activeModalItemId) {
        this.model.updateSchool(this.activeModalItemId, schData);
      } else {
        this.model.addSchool(schData);
      }
    } else if (type === "scholars_summary") {
      const summary = document.getElementById("m-sch-summary").value.trim();
      const shafii = document.getElementById("m-sch-shafii").value.trim();
      const appr = document.getElementById("m-schnet-approval").value;
      const asg = document.getElementById("m-schnet-assignee").value;
      this.model.updateScholarsSummary(summary, shafii, appr, asg);
    } else if (type === "student") {
      const student = {
        name: document.getElementById("m-st-name").value.trim(),
        mazhab: document.getElementById("m-st-mazhab").value.trim(),
        approvalStatus: document.getElementById("m-st-approval").value,
        assignee: document.getElementById("m-st-assignee").value
      };
      if (this.activeModalIndex !== null) {
        this.model.updateDoghanStudent(this.activeModalIndex, student);
      } else {
        this.model.addDoghanStudent(student);
      }
    } else if (type === "exhibit_comp") {
      const comp = {
        name: document.getElementById("m-comp-name").value.trim(),
        desc: document.getElementById("m-comp-desc").value.trim(),
        approvalStatus: document.getElementById("m-comp-approval").value,
        assignee: document.getElementById("m-comp-assignee").value
      };
      if (this.activeModalIndex !== null) {
        this.model.updateExhibitComponent(this.activeModalIndex, comp);
      } else {
        this.model.addExhibitComponent(comp);
      }
    } else if (type === "hologram_specs") {
      this.model.updateHologramSpecs({
        nature: document.getElementById("m-hspec-nature").value.trim(),
        duration: document.getElementById("m-hspec-duration").value.trim(),
        frequency: document.getElementById("m-hspec-freq").value.trim(),
        capacity: document.getElementById("m-hspec-cap").value.trim()
      });
    } else if (type === "story") {
      const story = {
        title: document.getElementById("m-story-title").value.trim(),
        source: document.getElementById("m-story-source").value.trim(),
        verified: document.getElementById("m-story-verified").value === "true",
        notes: document.getElementById("m-story-notes").value.trim(),
        approvalStatus: document.getElementById("m-story-approval").value,
        assignee: document.getElementById("m-story-assignee").value
      };
      if (this.activeModalIndex !== null) {
        this.model.updateHistoricalStory(this.activeModalIndex, story);
      } else {
        this.model.addHistoricalStory(story);
      }
    } else if (type === "scene") {
      const sceneData = {
        title: document.getElementById("m-sc-title").value.trim(),
        duration: document.getElementById("m-sc-duration").value.trim(),
        setting: document.getElementById("m-sc-setting").value.trim(),
        visualDesc: document.getElementById("m-sc-visual").value.trim(),
        audioText: document.getElementById("m-sc-audio").value.trim(),
        dramaticPurpose: document.getElementById("m-sc-dramatic").value.trim(),
        approvalStatus: document.getElementById("m-sc-approval").value,
        assignee: document.getElementById("m-sc-assignee").value
      };
      if (this.activeModalItemId) {
        this.model.updateScene(this.activeModalItemId, sceneData);
      } else {
        this.model.addScene(sceneData);
      }
    } else if (type === "vr") {
      this.model.updateVRExperience({
        hardware: document.getElementById("m-vr-hw").value.trim(),
        sensoryEffects: document.getElementById("m-vr-sensory").value.trim(),
        mobility: document.getElementById("m-vr-mobility").value.trim(),
        capacity: document.getElementById("m-vr-cap").value.trim(),
        duration: document.getElementById("m-vr-dur").value.trim(),
        sceneConcept: document.getElementById("m-vr-concept").value.trim(),
        approvalStatus: document.getElementById("m-vr-approval").value,
        assignee: document.getElementById("m-vr-assignee").value
      });
    } else if (type === "location") {
      const locData = {
        name: document.getElementById("m-loc-name").value.trim(),
        score: document.getElementById("m-loc-score").value.trim(),
        desc: document.getElementById("m-loc-desc").value.trim(),
        pros: document.getElementById("m-loc-pros").value.trim(),
        cons: document.getElementById("m-loc-cons").value.trim(),
        approvalStatus: document.getElementById("m-loc-approval").value,
        assignee: document.getElementById("m-loc-assignee").value
      };
      if (this.activeModalItemId) {
        this.model.updateLocation(this.activeModalItemId, locData);
      } else {
        this.model.addLocation(locData);
      }
    } else if (type === "area_item") {
      const item = {
        space: document.getElementById("m-area-space").value.trim(),
        area: document.getElementById("m-area-size").value.trim(),
        notes: document.getElementById("m-area-notes").value.trim(),
        approvalStatus: document.getElementById("m-area-approval").value,
        assignee: document.getElementById("m-area-assignee").value
      };
      if (this.activeModalIndex !== null) {
        this.model.updateAreaItem(this.activeModalIndex, item);
      } else {
        this.model.addAreaItem(item);
      }
    } else if (type === "budget_totals") {
      const full = document.getElementById("m-btotal-full").value.trim();
      const p1 = document.getElementById("m-btotal-phase1").value.trim();
      const appr = document.getElementById("m-btotal-approval").value;
      const asg = document.getElementById("m-btotal-assignee").value;
      this.model.updateBudgetTotals(full, p1, appr, asg);
    } else if (type === "budget_item") {
      const item = {
        item: document.getElementById("m-bitem-name").value.trim(),
        costRange: document.getElementById("m-bitem-cost").value.trim(),
        includes: document.getElementById("m-bitem-includes").value.trim(),
        approvalStatus: document.getElementById("m-bitem-approval").value,
        assignee: document.getElementById("m-bitem-assignee").value
      };
      if (this.activeModalIndex !== null) {
        this.model.updateBudgetItem(this.activeModalIndex, item);
      } else {
        this.model.addBudgetItem(item);
      }
    } else if (type === "ticket") {
      const ticket = {
        category: document.getElementById("m-tkt-cat").value.trim(),
        price: document.getElementById("m-tkt-price").value.trim(),
        notes: document.getElementById("m-tkt-notes").value.trim(),
        approvalStatus: document.getElementById("m-tkt-approval").value,
        assignee: document.getElementById("m-tkt-assignee").value
      };
      if (this.activeModalIndex !== null) {
        this.model.updateTicketItem(this.activeModalIndex, ticket);
      } else {
        this.model.addTicketItem(ticket);
      }
    } else if (type === "waqf") {
      const pillar = {
        pillar: document.getElementById("m-wq-title").value.trim(),
        desc: document.getElementById("m-wq-desc").value.trim(),
        approvalStatus: document.getElementById("m-wq-approval").value,
        assignee: document.getElementById("m-wq-assignee").value
      };
      if (this.activeModalIndex !== null) {
        this.model.updateWaqfPillar(this.activeModalIndex, pillar);
      } else {
        this.model.addWaqfPillar(pillar);
      }
    } else if (type === "stage") {
      const stage = {
        phase: document.getElementById("m-stg-phase").value.trim(),
        duration: document.getElementById("m-stg-dur").value.trim(),
        desc: document.getElementById("m-stg-desc").value.trim(),
        approvalStatus: document.getElementById("m-stg-approval").value,
        assignee: document.getElementById("m-stg-assignee").value
      };
      if (this.activeModalIndex !== null) {
        this.model.updateStage(this.activeModalIndex, stage);
      } else {
        this.model.addStage(stage);
      }
    } else if (type === "souvenir") {
      const souv = {
        name: document.getElementById("m-souv-name").value.trim(),
        price: document.getElementById("m-souv-price").value.trim(),
        desc: document.getElementById("m-souv-desc").value.trim(),
        approvalStatus: document.getElementById("m-souv-approval").value,
        assignee: document.getElementById("m-souv-assignee").value
      };
      if (this.activeModalIndex !== null) {
        this.model.updateSouvenir(this.activeModalIndex, souv);
      } else {
        this.model.addSouvenir(souv);
      }
    } else if (type === "partner") {
      const partner = {
        name: document.getElementById("m-prt-name").value.trim(),
        role: document.getElementById("m-prt-role").value.trim(),
        approvalStatus: document.getElementById("m-prt-approval").value,
        assignee: document.getElementById("m-prt-assignee").value
      };
      if (this.activeModalIndex !== null) {
        this.model.updatePartner(this.activeModalIndex, partner);
      } else {
        this.model.addPartner(partner);
      }
    } else if (type === "reference") {
      const ref = {
        title: document.getElementById("m-ref-title").value.trim(),
        author: document.getElementById("m-ref-author").value.trim(),
        notes: document.getElementById("m-ref-notes").value.trim(),
        approvalStatus: document.getElementById("m-ref-approval").value,
        assignee: document.getElementById("m-ref-assignee").value
      };
      if (this.activeModalIndex !== null) {
        this.model.updateReference(this.activeModalIndex, ref);
      } else {
        this.model.addReference(ref);
      }
    } else if (type === "task") {
      const title = document.getElementById("m-task-title").value.trim();
      if (!title) { alert("يرجى إدخال عنوان المهمة"); return; }
      const taskData = {
        title,
        track: document.getElementById("m-task-track").value,
        assignee: document.getElementById("m-task-assignee").value,
        approvalStatus: document.getElementById("m-task-approval").value,
        priority: document.getElementById("m-task-priority").value,
        status: document.getElementById("m-task-status").value,
        dueDate: document.getElementById("m-task-due").value,
        notes: document.getElementById("m-task-notes").value.trim()
      };
      if (this.activeModalItemId) {
        this.model.updateTask(this.activeModalItemId, taskData);
      } else {
        this.model.addTask(taskData);
      }
    } else if (type === "decision_details") {
      const title = document.getElementById("m-dec-title").value.trim();
      if (!title) { alert("يرجى إدخال عنوان القرار"); return; }
      const rawOpts = document.getElementById("m-dec-opts").value.split(/[,،]/).map(o => o.trim()).filter(Boolean);
      const decData = {
        title,
        question: document.getElementById("m-dec-q").value.trim(),
        recommendation: document.getElementById("m-dec-rec").value.trim(),
        status: document.getElementById("m-dec-status").value.trim(),
        approvalStatus: document.getElementById("m-dec-approval").value,
        assignee: document.getElementById("m-dec-assignee").value,
        decisionOptions: rawOpts.length > 0 ? rawOpts : ["اعتماد", "استبعاد", "قيد الدراسة"]
      };
      if (this.activeModalItemId) {
        const item = this.model.getPendingDecisions().find(d => d.id === this.activeModalItemId);
        if (item) Object.assign(item, decData);
        this.model.saveToStorage();
      } else {
        this.model.addPendingDecision(decData);
      }
    }

    this.playChime(659.25);
    this.closeModal();
    this.view.render(this.model);
    this.bindContentEvents();
  }

  /* ================= DOWNLOAD & IMPORT HELPERS ================= */
  downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }


  async saveNow() {
    const btn = document.getElementById("btn-save-detailed-plan-cloud");
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>جاري الحفظ والتثبيت...</span>';
    }
    this.model.saveToStorage();
    await this.model.saveToServer();
    this.playChime(880);
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-circle-check text-black"></i><span>تم الحفظ والتثبيت بالسيرفر! ✅</span>';
      setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i><span>حفظ وتثبيت التعديلات 💾</span>';
      }, 3000);
    }
  }

  handleExportMarkdown() {
    const md = this.model.generateExecutiveMarkdown();
    this.downloadFile("متحف_السيرة_الأحسائية_الدراسة_التنفيذية.md", md, "text/markdown;charset=utf-8");
    this.playChime(880);
  }

  handleExportJSON() {
    const jsonStr = this.model.exportJSON();
    this.downloadFile("متحف_السيرة_الأحسائية_بيانات_الفريق.json", jsonStr, "application/json;charset=utf-8");
    this.playChime(880);
  }

  handleImportJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const success = this.model.importJSON(content);
      if (success) {
        this.playChime(880);
        alert("تم استيراد بيانات وتعديلات الفريق بنجاح!");
        this.view.render(this.model);
        this.bindContentEvents();
      } else {
        alert("خطأ: تعذر قراءة ملف JSON أو أن بنية الملف غير متطابقة.");
      }
    };
    reader.readAsText(file);
  }
};

// Bootstrap when loaded on museum-plan.html
const bootstrapDetailedPlan = () => {
  if (document.getElementById("detailed-plan-page-root")) {
    if (window.App && window.App.planController) return; // already initialized
    try {
      const planModel = new App.DetailedPlanModel();
      const planView = new App.DetailedPlanView();
      const planController = new App.DetailedPlanController(planModel, planView);
      planController.init();

      window.App.planModel = planModel;
      window.App.planView = planView;
      window.App.planController = planController;
      console.log("✅ [DetailedPlan] Controller initialized and rendered successfully.");
    } catch (err) {
      console.error("❌ Failed to initialize DetailedPlan:", err);
    }
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapDetailedPlan);
  window.addEventListener("load", bootstrapDetailedPlan);
} else {
  bootstrapDetailedPlan();
}
