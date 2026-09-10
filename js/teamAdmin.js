/* ==========================================================
   SERAJ AL-AHSA - TEAM & RBAC MANAGEMENT CONTROLLER
   إدارة ومراقبة فريق العمل وتوزيع وتعديل الصلاحيات للمدير العام فقط
   ========================================================== */

window.App = window.App || {};

App.TeamAdmin = class {
  constructor() {
    this.users = [
          {
                    "id": "usr_admin_1",
                    "username": "admin",
                    "name": "مدير النظام الرئيسي",
                    "password": "admin2026",
                    "role": "admin",
                    "specialty": "الإدارة العامة والحوكمة والصلاحيات",
                    "createdAt": "2026-08-28T12:00:00.000Z"
          },
          {
                    "id": "usr_dr_mubarak",
                    "username": "dr_mubarak",
                    "name": "د. عبد المحسن المبارك",
                    "password": "pass1234",
                    "role": "admin",
                    "specialty": "مدير المشروع والمشرف العام",
                    "createdAt": "2026-08-28T12:00:00.000Z"
          },
          {
                    "id": "usr_editor_1",
                    "username": "editor",
                    "name": "محرر ومسؤول المحتوى والمهام",
                    "password": "editor2026",
                    "role": "editor",
                    "specialty": "إعداد المحتوى والمشاهد والمقتنيات",
                    "createdAt": "2026-08-28T12:00:00.000Z"
          },
          {
                    "id": "usr_researcher_1",
                    "username": "researcher1",
                    "name": "د. خالد الأحسائي",
                    "password": "123456",
                    "role": "editor",
                    "specialty": "بحوث السيرة النبوية وتاريخ الأحساء والمسار الشرعي",
                    "createdAt": "2026-08-28T12:00:00.000Z"
          },
          {
                    "id": "usr_sara_q",
                    "username": "sara_q",
                    "name": "أ. سارة القحطاني",
                    "password": "pass1234",
                    "role": "editor",
                    "specialty": "رئيسة قسم المحتوى والبحث التاريخي",
                    "createdAt": "2026-08-28T12:00:00.000Z"
          },
          {
                    "id": "usr_eng_salim",
                    "username": "eng_salim",
                    "name": "م. عبد العزيز السليم",
                    "password": "pass1234",
                    "role": "editor",
                    "specialty": "مدير التقنية والتجهيزات المتنقلة والهندسة",
                    "createdAt": "2026-08-28T12:00:00.000Z"
          },
          {
                    "id": "usr_fatima_m",
                    "username": "fatima_m",
                    "name": "أ. فاطمة الملا",
                    "password": "pass1234",
                    "role": "editor",
                    "specialty": "مديرة الاتصال والبرامج وتجربة الزائر",
                    "createdAt": "2026-08-28T12:00:00.000Z"
          },
          {
                    "id": "usr_fahad_r",
                    "username": "fahad_r",
                    "name": "م. فهد الراشد",
                    "password": "pass1234",
                    "role": "editor",
                    "specialty": "مهندس التصميم الإنشائي والديكور والعمليات",
                    "createdAt": "2026-08-28T12:00:00.000Z"
          },
          {
                    "id": "usr_m_issa",
                    "username": "m_issa",
                    "name": "أ. محمد العيسى",
                    "password": "pass1234",
                    "role": "editor",
                    "specialty": "مدير العمليات واللوجستيات والميدان والشراكات",
                    "createdAt": "2026-08-28T12:00:00.000Z"
          },
          {
                    "id": "usr_noura_j",
                    "username": "noura_j",
                    "name": "أ. نورة الجبر",
                    "password": "pass1234",
                    "role": "editor",
                    "specialty": "أخصائية البرامج التعليمية وتجربة الزائر والاتصال",
                    "createdAt": "2026-08-28T12:00:00.000Z"
          },
          {
                    "id": "usr_k_dosari",
                    "username": "k_dosari",
                    "name": "أ. خالد الدوسري",
                    "password": "pass1234",
                    "role": "editor",
                    "specialty": "المسؤول المالي وإدارة المخاطر والسلامة",
                    "createdAt": "2026-08-28T12:00:00.000Z"
          }
];
    this.currentFilterRole = "all";
    this.searchQuery = "";
    this.editingUser = null;
  }

  async init() {
    // 1. Strict RBAC Check: Ensure user is logged in as Admin
    if (!window.App.authGuard || !window.App.authGuard.isAuthenticated()) {
      if (window.App.authGuard) window.App.authGuard.enforceGate();
      return;
    }

    if (!window.App.authGuard.isAdmin()) {
      this.renderAccessDenied();
      return;
    }

    this.renderAdminHeader();
    this.bindEvents();
    await this.loadUsers();
  }

  renderAccessDenied() {
    const mainContent = document.getElementById("admin-main-content");
    const deniedBanner = document.getElementById("access-denied-container");
    if (mainContent) mainContent.classList.add("hidden");
    if (deniedBanner) {
      deniedBanner.classList.remove("hidden");
      deniedBanner.classList.add("flex");
    }
  }

  renderAdminHeader() {
    const currentUser = window.App.authGuard.getUser();
    const nameSpan = document.getElementById("admin-user-name");
    if (nameSpan && currentUser) {
      nameSpan.textContent = currentUser.name || currentUser.username || "مدير النظام";
    }
  }

  async loadUsers() {
    const tbody = document.getElementById("users-table-body");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-gray-400">
            <i class="fa-solid fa-spinner fa-spin text-lg text-gold mb-2 block"></i>
            <span>جاري تحميل بيانات وصلاحيات الفريق...</span>
          </td>
        </tr>
      `;
    }

    const currentUser = window.App.authGuard.getUser();
    try {
      const token = currentUser ? currentUser.token : "";
      const res = await fetch("/api/users", {
        headers: { "Authorization": "Bearer " + token }
      });
      const data = await res.json();
      if (res.ok && data.status === "success" && Array.isArray(data.users)) {
        this.users = data.users;
        localStorage.setItem("seraj_users_list_v1", JSON.stringify(this.users));
      } else {
        throw new Error(data.message || "Failed to fetch from server");
      }
    } catch (e) {
      console.warn("⚠️ Server users API offline or error, reading local store:", e);
      const saved = localStorage.getItem("seraj_users_list_v1");
      if (saved) {
        try { this.users = JSON.parse(saved); } catch (_) {}
      }
      if (!this.users || this.users.length === 0) {
        this.users = [
          { id: "usr_admin_1", username: "admin", name: "مدير النظام الرئيسي", role: "admin", specialty: "إدارة وتنسيق المشروع العام", createdAt: "2026-08-28T12:00:00.000Z" },
          { id: "usr_editor_1", username: "editor", name: "محرر ومسؤول المحتوى", role: "editor", specialty: "إعداد المحتوى والمشاهد والمقتنيات", createdAt: "2026-08-28T12:00:00.000Z" },
          { id: "usr_researcher_1", username: "researcher1", name: "د. خالد الأحسائي", role: "editor", specialty: "بحوث السيرة النبوية وتاريخ الأحساء", createdAt: "2026-08-28T12:00:00.000Z" }
        ];
      }
    }

    this.updateStats();
    this.renderUsersTable();
  }

  updateStats() {
    const total = this.users.length;
    const admins = this.users.filter(u => u.role === "admin").length;
    const editors = this.users.filter(u => u.role === "editor").length;
    const viewers = this.users.filter(u => u.role === "viewer").length;

    const elTotal = document.getElementById("stat-total-users");
    const elAdmins = document.getElementById("stat-admin-users");
    const elEditors = document.getElementById("stat-editor-users");
    const elViewers = document.getElementById("stat-viewer-users");

    if (elTotal) elTotal.textContent = total;
    if (elAdmins) elAdmins.textContent = admins;
    if (elEditors) elEditors.textContent = editors;
    if (elViewers) elViewers.textContent = viewers;

    const countAll = document.getElementById("count-all");
    const countAdmin = document.getElementById("count-admin");
    const countEditor = document.getElementById("count-editor");
    const countViewer = document.getElementById("count-viewer");

    if (countAll) countAll.textContent = total;
    if (countAdmin) countAdmin.textContent = admins;
    if (countEditor) countEditor.textContent = editors;
    if (countViewer) countViewer.textContent = viewers;
  }

  getFilteredUsers() {
    return this.users.filter(u => {
      // Role Filter
      if (this.currentFilterRole !== "all" && u.role !== this.currentFilterRole) {
        return false;
      }
      // Search Filter
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchName = (u.name || "").toLowerCase().includes(q);
        const matchUser = (u.username || "").toLowerCase().includes(q);
        const matchSpec = (u.specialty || "").toLowerCase().includes(q);
        return matchName || matchUser || matchSpec;
      }
      return true;
    });
  }

  renderUsersTable() {
    const tbody = document.getElementById("users-table-body");
    if (!tbody) return;

    const filtered = this.getFilteredUsers();
    const currentUser = window.App.authGuard.getUser();

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-gray-400">
            <i class="fa-solid fa-user-xmark text-2xl text-gray-600 mb-2 block"></i>
            <span>لا يوجد أعضاء يطابقون خيارات البحث أو التصفية الحالية.</span>
          </td>
        </tr>
      `;
      return;
    }

    let html = "";
    filtered.forEach(u => {
      const isSelf = Boolean(currentUser && currentUser.username.toLowerCase() === u.username.toLowerCase());
      
      let roleBadge = "";
      if (u.role === "admin") {
        roleBadge = `<span class="px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold font-bold text-[11px] flex items-center gap-1.5 w-fit"><i class="fa-solid fa-crown"></i><span>مدير النظام (Admin)</span></span>`;
      } else if (u.role === "editor") {
        roleBadge = `<span class="px-2.5 py-1 rounded-full bg-palm/15 border border-palm/30 text-palm font-bold text-[11px] flex items-center gap-1.5 w-fit"><i class="fa-solid fa-user-pen"></i><span>محرر ومسؤول (Editor)</span></span>`;
      } else {
        roleBadge = `<span class="px-2.5 py-1 rounded-full bg-laser/15 border border-laser/30 text-laser font-bold text-[11px] flex items-center gap-1.5 w-fit"><i class="fa-solid fa-eye"></i><span>استعراض فقط (Viewer)</span></span>`;
      }

      const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : "مسجل مسبقاً";
      const specialtyStr = u.specialty || "عضو فريق المنظومة";

      html += `
        <tr class="hover:bg-white/[0.02] transition-colors">
          <td class="p-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-xs">
                ${(u.name || u.username).substring(0, 1)}
              </div>
              <div class="flex flex-col">
                <span class="font-black text-white text-xs flex items-center gap-1.5">
                  ${u.name || u.username}
                  ${isSelf ? '<span class="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-gray-300 font-normal">(أنت)</span>' : ''}
                </span>
              </div>
            </div>
          </td>
          <td class="p-4">
            <code class="font-mono text-xs text-gray-300 bg-black/40 px-2 py-1 rounded border border-white/10">${u.username}</code>
          </td>
          <td class="p-4 text-gray-300">
            ${specialtyStr}
          </td>
          <td class="p-4">
            ${roleBadge}
          </td>
          <td class="p-4 text-gray-400 font-mono text-[11px]">
            ${dateStr}
          </td>
          <td class="p-4 text-center">
            <div class="flex items-center justify-center gap-2">
              <button class="btn-edit-user p-2 rounded-xl bg-white/5 hover:bg-gold hover:text-black border border-white/10 text-gray-300 text-xs font-bold transition-all" data-username="${u.username}" title="تعديل العضو والصلاحيات">
                <i class="fa-solid fa-user-pen"></i>
                <span class="mr-1 hidden md:inline">تعديل</span>
              </button>
              
              ${!isSelf ? `
                <button class="btn-delete-user p-2 rounded-xl bg-white/5 hover:bg-clay hover:text-white border border-white/10 text-gray-400 text-xs font-bold transition-all" data-username="${u.username}" data-name="${u.name || u.username}" title="حذف العضو من النظام">
                  <i class="fa-solid fa-trash-can"></i>
                  <span class="mr-1 hidden md:inline">حذف</span>
                </button>
              ` : `
                <span class="text-[10px] text-gray-500 italic px-2">حسابك الحالي</span>
              `}
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    this.bindTableEvents();
  }

  bindEvents() {
    // 1. Search filter
    const searchInput = document.getElementById("filter-user-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderUsersTable();
      });
    }

    // 2. Role filter buttons
    document.querySelectorAll(".filter-role-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-role-btn").forEach(b => {
          b.classList.remove("active", "border-gold", "text-gold", "bg-gold/15");
          b.classList.add("text-gray-400", "border-white/10");
        });
        btn.classList.add("active", "border-gold", "text-gold", "bg-gold/15");
        btn.classList.remove("text-gray-400", "border-white/10");

        this.currentFilterRole = btn.getAttribute("data-role") || "all";
        this.renderUsersTable();
      });
    });

    // 3. Open Add Member Modal
    const btnOpenAdd = document.getElementById("btn-open-add-member");
    if (btnOpenAdd) {
      btnOpenAdd.addEventListener("click", () => this.openUserModal(null));
    }

    // 4. Close Modal buttons
    const btnCloseModal = document.getElementById("btn-close-user-modal");
    const btnCancelModal = document.getElementById("btn-cancel-user-modal");
    const userModal = document.getElementById("user-modal");

    const closeModal = () => {
      if (userModal) {
        userModal.classList.add("hidden");
        userModal.classList.remove("flex");
      }
    };

    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener("click", closeModal);
    if (userModal) {
      userModal.addEventListener("click", (e) => {
        if (e.target === userModal) closeModal();
      });
    }

    // 5. Submit Add/Edit Form
    const formUser = document.getElementById("form-user-manage");
    if (formUser) {
      formUser.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleSaveUser();
      });
    }
  }

  bindTableEvents() {
    // Edit buttons
    document.querySelectorAll(".btn-edit-user").forEach(btn => {
      btn.addEventListener("click", () => {
        const username = btn.getAttribute("data-username");
        const user = this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (user) this.openUserModal(user);
      });
    });

    // Delete buttons
    document.querySelectorAll(".btn-delete-user").forEach(btn => {
      btn.addEventListener("click", () => {
        const username = btn.getAttribute("data-username");
        const name = btn.getAttribute("data-name");
        this.handleDeleteUser(username, name);
      });
    });
  }

  openUserModal(user = null) {
    this.editingUser = user;
    const modal = document.getElementById("user-modal");
    const title = document.getElementById("user-modal-title");
    const errBox = document.getElementById("user-modal-error");
    const originalUserInput = document.getElementById("user-edit-original-username");
    const passHint = document.getElementById("password-hint");
    const passInput = document.getElementById("input-user-password");
    const nameInput = document.getElementById("input-user-name");
    const usernameInput = document.getElementById("input-user-username");
    const specInput = document.getElementById("input-user-specialty");
    const roleSelect = document.getElementById("select-user-role");

    if (errBox) errBox.classList.add("hidden");

    if (user) {
      // Editing Mode
      if (title) title.innerHTML = `<i class="fa-solid fa-user-pen text-gold"></i><span>تعديل بيانات وصلاحيات (${user.name || user.username})</span>`;
      if (originalUserInput) originalUserInput.value = user.username;
      if (nameInput) nameInput.value = user.name || "";
      if (usernameInput) {
        usernameInput.value = user.username;
        usernameInput.readOnly = true;
        usernameInput.classList.add("opacity-60", "cursor-not-allowed");
      }
      if (specInput) specInput.value = user.specialty || "";
      if (roleSelect) roleSelect.value = user.role || "editor";
      if (passInput) {
        passInput.value = "";
        passInput.required = false;
      }
      if (passHint) passHint.classList.remove("hidden");
    } else {
      // Creating New Mode
      if (title) title.innerHTML = `<i class="fa-solid fa-user-plus text-gold"></i><span>إضافة عضو فريق جديد</span>`;
      if (originalUserInput) originalUserInput.value = "";
      if (nameInput) nameInput.value = "";
      if (usernameInput) {
        usernameInput.value = "";
        usernameInput.readOnly = false;
        usernameInput.classList.remove("opacity-60", "cursor-not-allowed");
      }
      if (specInput) specInput.value = "";
      if (roleSelect) roleSelect.value = "editor";
      if (passInput) {
        passInput.value = "";
        passInput.required = true;
      }
      if (passHint) passHint.classList.add("hidden");
    }

    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      if (nameInput) nameInput.focus();
    }
  }

  async handleSaveUser() {
    const originalUsername = document.getElementById("user-edit-original-username")?.value;
    const name = document.getElementById("input-user-name")?.value.trim();
    const username = document.getElementById("input-user-username")?.value.trim();
    const password = document.getElementById("input-user-password")?.value.trim();
    const specialty = document.getElementById("input-user-specialty")?.value.trim();
    const role = document.getElementById("select-user-role")?.value;
    const errBox = document.getElementById("user-modal-error");
    const btnSubmit = document.getElementById("btn-submit-user-manage");
    const modal = document.getElementById("user-modal");

    if (!name || !username || !role) {
      if (errBox) {
        errBox.textContent = "يرجى تعبئة كافة الحقول المطلوبة.";
        errBox.classList.remove("hidden");
      }
      return;
    }

    if (!originalUsername && !password) {
      if (errBox) {
        errBox.textContent = "كلمة المرور مطلوبة للعضو الجديد.";
        errBox.classList.remove("hidden");
      }
      return;
    }

    if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>جاري الحفظ...</span>`;

    const currentUser = window.App.authGuard.getUser();
    const token = currentUser ? currentUser.token : "";

    const payload = {
      username,
      name,
      role,
      specialty: specialty || "عضو فريق",
      password: password || undefined
    };

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.status !== "success") {
        throw new Error(data.message || "فشل حفظ المستخدم");
      }
    } catch (e) {
      console.warn("⚠️ Server API failed, saving to local state:", e.message);
      // Fallback local update
      const existingIdx = this.users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
      if (existingIdx >= 0) {
        this.users[existingIdx].name = name;
        this.users[existingIdx].role = role;
        this.users[existingIdx].specialty = specialty || "عضو فريق";
        this.users[existingIdx].updatedAt = new Date().toISOString();
      } else {
        this.users.push({
          id: "usr_" + Date.now(),
          username,
          name,
          role,
          specialty: specialty || "عضو فريق",
          createdAt: new Date().toISOString()
        });
      }
      localStorage.setItem("seraj_users_list_v1", JSON.stringify(this.users));
    }

    if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-check"></i><span>حفظ المستخدم</span>`;

    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }

    await this.loadUsers();
  }

  async handleDeleteUser(username, name) {
    const currentUser = window.App.authGuard.getUser();
    if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
      if (typeof alert === "function") alert("لا يمكنك حذف حسابك الحالي المسجل به.");
      return;
    }

    const adminCount = this.users.filter(u => u.role === "admin").length;
    const targetUser = this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (targetUser && targetUser.role === "admin" && adminCount <= 1) {
      if (typeof alert === "function") alert("لا يمكن حذف آخر مدير نظام متبقي في المنصة.");
      return;
    }

    const reassignChoice = typeof confirm === "function" ? confirm(`هل تريد إعادة إسناد المهام والمخرجات الخاصة بالعضو (${name || username}) إلى مدير النظام أو تفريغها؟\n\n- اضغط (OK / موافق) لتحويل مهامه إلى "غير مسند" وتنظيفها.\n- اضغط (Cancel / إلغاء) للإلغاء.`) : true;
    if (!reassignChoice) return;

    try {
      const token = currentUser ? currentUser.token : "";
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ username, reassignTo: null })
      });
      const data = await res.json();
      if (!res.ok || data.status !== "success") {
        throw new Error(data.message || "فشل حذف المستخدم");
      }
      if (typeof alert === "function") {
        alert(`✅ تم حذف العضو (${name || username}) وتحديث مصفوفة المهام والأقسام بنجاح!`);
      }
    } catch (e) {
      console.warn("⚠️ Server API failed, deleting locally:", e.message);
      this.users = this.users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
      localStorage.setItem("seraj_users_list_v1", JSON.stringify(this.users));
    }

    await this.loadUsers();
  }

  async syncAssignments() {
    const currentUser = window.App.authGuard.getUser();
    const token = currentUser ? currentUser.token : "";
    try {
      const res = await fetch("/api/users/sync-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        }
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        if (typeof alert === "function") {
          alert("✅ تم فحص وتنظيف مصفوفة المهام والأقسام بنجاح وإزالة كافة أسماء الأعضاء المحذوفين!");
        }
      }
    } catch (e) {
      console.warn("Sync failed:", e);
    }
  }
};

// Bootstrap when loaded on team-admin.html
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("team-admin-page-root")) {
    window.App.teamAdmin = new App.TeamAdmin();
    window.App.teamAdmin.init();
  }
});
