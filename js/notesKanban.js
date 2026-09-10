/* ==========================================================
   SERAJ AL-AHSA - PLATFORM NOTES KANBAN BOARD CONTROLLER
   لوحة كانبان المركزية لملاحظات ومقترحات وتدقيق جودة المنصة
   ========================================================== */

window.App = window.App || {};

App.NotesKanban = class {
  constructor() {
    this.notes = [];
    this.searchQuery = "";
    this.filterCategory = "all";
    this.filterPriority = "all";
    this.filterAssignee = "all";
    this.filterTargetPage = "all";
    this.selectedNoteId = null;
    this.editingNoteId = null;
    this.currentUser = null;

    this.categories = [
      { id: "all", name: "كافة المجالات" },
      { id: "وثيقة PDR", name: "وثيقة PDR" },
      { id: "محتوى وتاريخ", name: "محتوى وتاريخ" },
      { id: "هندسة وتقنية", name: "هندسة وتقنية" },
      { id: "إنتاج وسائط", name: "إنتاج وسائط" },
      { id: "عمليات ومسار", name: "عمليات ومسار" },
      { id: "استدامة واستثمار", name: "استدامة واستثمار" },
      { id: "حوكمة وصلاحيات", name: "حوكمة وصلاحيات" },
      { id: "تطوير المنصة", name: "تطوير المنصة" },
      { id: "عام", name: "عام ومقترحات" }
    ];

    this.priorities = [
      { id: "critical", name: "حرجة للغاية 🔴", badgeBg: "bg-red-500/20 text-red-400 border-red-500/40" },
      { id: "high", name: "أولوية عالية 🟠", badgeBg: "bg-orange-500/20 text-orange-400 border-orange-500/40" },
      { id: "medium", name: "أولوية متوسطة 🟡", badgeBg: "bg-gold/20 text-gold border-gold/40" },
      { id: "low", name: "أولوية منخفضة 🟢", badgeBg: "bg-palm/20 text-palm border-palm/40" }
    ];

    this.columns = [
      { id: "inbox", title: "💡 أفكار وملاحظات جديدة", color: "#dfb15b", border: "border-gold/40", bg: "bg-gold/5", desc: "الملاحظات والمقترحات المسجلة حديثاً" },
      { id: "in_progress", title: "⏳ قيد المعالجة والتنفيذ", color: "#38bdf8", border: "border-sky-400/40", bg: "bg-sky-500/5", desc: "الملاحظات التي يجري العمل عليها حالياً" },
      { id: "review", title: "🔍 بانتظار الفحص والتدقيق", color: "#00ebd4", border: "border-laser/40", bg: "bg-laser/5", desc: "تم تطبيق التعديلات وبانتظار اعتماد المشرف" },
      { id: "resolved", title: "✅ تمت المعالجة والاعتماد", color: "#2ec866", border: "border-palm/40", bg: "bg-palm/5", desc: "ملاحظات مكتملة وموثقة في المنظومة" },
      { id: "deferred", title: "⏸️ مؤجلة / للأرشيف", color: "#cc6e55", border: "border-clay/40", bg: "bg-clay/5", desc: "أفكار مؤجلة للمراحل القادمة" }
    ];
  }

  async init() {
    this.initAuthSession();
    this.bindEvents();
    await this.loadNotes();
  }

  initAuthSession() {
    try {
      const savedAuth = localStorage.getItem("seraj_unified_auth_session_v1") ||
                        sessionStorage.getItem("seraj_unified_auth_session_v1");
      if (savedAuth) {
        this.currentUser = JSON.parse(savedAuth);
      }
    } catch (_) {
      this.currentUser = null;
    }
  }

  isAdmin() {
    return Boolean(this.currentUser && this.currentUser.role === "admin");
  }

  canEdit() {
    return Boolean(this.currentUser && (this.currentUser.role === "admin" || this.currentUser.role === "editor"));
  }

  getTeamMembers() {
    let usersList = [];
    try {
      const saved = localStorage.getItem("seraj_users_list_v1");
      if (saved) usersList = JSON.parse(saved);
    } catch (_) {}

    if (usersList && Array.isArray(usersList) && usersList.length > 0) {
      return usersList.map(u => ({
        id: u.username || u.id,
        name: u.name || u.username,
        role: u.specialty || (u.role === "admin" ? "مدير النظام" : "محرر ومسؤول مهام"),
        avatar: u.role === "admin" ? "👑" : "👨‍💼"
      }));
    }

    return [
      { id: "admin", name: "مدير النظام الرئيسي", role: "مدير النظام", avatar: "👑" },
      { id: "dr_mubarak", name: "د. عبد المحسن المبارك", role: "المشرف العام ومدير المشروع", avatar: "👨‍💼" },
      { id: "sara_q", name: "أ. سارة القحطاني", role: "رئيسة قسم المحتوى والبحث التاريخي", avatar: "👩‍🏫" },
      { id: "eng_salim", name: "م. عبد العزيز السليم", role: "مدير التقنية والتجهيزات المتنقلة", avatar: "👨‍💻" },
      { id: "researcher1", name: "د. خالد الأحسائي", role: "رئيس المسار الشرعي والتوثيق", avatar: "👨‍🏫" },
      { id: "fatima_m", name: "أ. فاطمة الملا", role: "مديرة الاتصال والبرامج وتجربة الزائر", avatar: "👩‍💼" },
      { id: "fahad_r", name: "م. فهد الراشد", role: "مهندس التصميم الإنشائي والعمليات", avatar: "👷‍♂️" },
      { id: "m_issa", name: "أ. محمد العيسى", role: "مدير العمليات واللوجستيات والميدان", avatar: "🚚" },
      { id: "noura_j", name: "أ. نورة الجبر", role: "أخصائية البرامج التعليمية وتجربة الزائر", avatar: "👩‍🔬" },
      { id: "k_dosari", name: "أ. خالد الدوسري", role: "المسؤول المالي وإدارة المخاطر", avatar: "📊" }
    ];
  }

  async loadNotes() {
    try {
      // 1. Refresh Team Directory
      try {
        const teamRes = await fetch("/api/team-members");
        if (teamRes.ok) {
          const teamJson = await teamRes.json();
          if (teamJson.status === "success" && Array.isArray(teamJson.users) && teamJson.users.length > 0) {
            localStorage.setItem("seraj_users_list_v1", JSON.stringify(teamJson.users));
          }
        }
      } catch (_) {}

      // 2. Fetch Notes
      const res = await fetch("/api/notes");
      const data = await res.json();
      if (res.ok && data.status === "success" && Array.isArray(data.notes)) {
        this.notes = data.notes;
        localStorage.setItem("seraj_platform_notes_v1", JSON.stringify(this.notes));
      } else {
        throw new Error("Failed to fetch from server");
      }
    } catch (e) {
      console.warn("⚠️ API offline, reading local storage:", e);
      const saved = localStorage.getItem("seraj_platform_notes_v1");
      if (saved) {
        try { this.notes = JSON.parse(saved); } catch (_) {}
      }
    }

    this.render();
  }

  async saveAndSync() {
    if (!this.canEdit()) {
      console.warn("🔒 [NotesKanban] Save blocked: account is in Viewer (read-only) mode.");
      return;
    }
    localStorage.setItem("seraj_platform_notes_v1", JSON.stringify(this.notes));
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (this.currentUser ? this.currentUser.token : "")
        },
        body: JSON.stringify(this.notes)
      });
    } catch (e) {
      console.warn("Sync notes with server warning:", e);
    }
  }

  getFilteredNotes() {
    return this.notes.filter(note => {
      // Search
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const inTitle = (note.title || "").toLowerCase().includes(q);
        const inDesc = (note.description || "").toLowerCase().includes(q);
        const inAuthor = (note.author || "").toLowerCase().includes(q);
        const inAssignee = (note.assignee || "").toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inAuthor && !inAssignee) return false;
      }
      // Category
      if (this.filterCategory !== "all" && note.category !== this.filterCategory) {
        return false;
      }
      // Priority
      if (this.filterPriority !== "all" && note.priority !== this.filterPriority) {
        return false;
      }
      // Assignee
      if (this.filterAssignee !== "all" && note.assignee !== this.filterAssignee) {
        return false;
      }
      // Target Page
      if (this.filterTargetPage !== "all" && note.targetPage !== this.filterTargetPage) {
        return false;
      }
      return true;
    });
  }

  render() {
    this.renderStats();
    this.renderFilterDropdowns();
    this.renderKanbanColumns();
  }

  renderStats() {
    const total = this.notes.length;
    const inbox = this.notes.filter(n => n.status === "inbox").length;
    const inProgress = this.notes.filter(n => n.status === "in_progress").length;
    const review = this.notes.filter(n => n.status === "review").length;
    const resolved = this.notes.filter(n => n.status === "resolved").length;
    const deferred = this.notes.filter(n => n.status === "deferred").length;

    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };

    setVal("stat-total-notes", total);
    setVal("stat-inbox-notes", inbox);
    setVal("stat-in-progress-notes", inProgress);
    setVal("stat-review-notes", review);
    setVal("stat-resolved-notes", resolved);
    setVal("stat-deferred-notes", deferred);
  }

  renderFilterDropdowns() {
    const catSelect = document.getElementById("select-filter-category");
    if (catSelect && catSelect.children.length <= 1) {
      catSelect.innerHTML = this.categories.map(c => `
        <option value="${c.id}" ${this.filterCategory === c.id ? 'selected' : ''}>${c.name}</option>
      `).join('');
    }

    const team = this.getTeamMembers();
    const assSelect = document.getElementById("select-filter-assignee");
    if (assSelect && assSelect.children.length <= 1) {
      assSelect.innerHTML = `<option value="all">كافة المسؤولين</option>` + team.map(tm => `
        <option value="${tm.name}" ${this.filterAssignee === tm.name ? 'selected' : ''}>${tm.name} (${tm.role})</option>
      `).join('');
    }
  }

  renderKanbanColumns() {
    const container = document.getElementById("notes-kanban-grid");
    if (!container) return;

    const filtered = this.getFilteredNotes();

    container.innerHTML = this.columns.map(col => {
      const colNotes = filtered.filter(n => n.status === col.id);

      return `
        <div class="rounded-3xl bg-black/50 border ${col.border} flex flex-col min-h-[580px] shadow-xl overflow-hidden transition-all duration-300">
          
          <!-- Column Header -->
          <div class="p-4 ${col.bg} border-b ${col.border} flex items-center justify-between">
            <div class="space-y-0.5">
              <h4 class="text-sm font-black text-white flex items-center gap-2">
                <span>${col.title}</span>
              </h4>
              <p class="text-[10px] text-gray-400">${col.desc}</p>
            </div>
            <span class="w-7 h-7 rounded-xl bg-white/10 text-white font-mono font-bold text-xs flex items-center justify-center border border-white/10">
              ${colNotes.length}
            </span>
          </div>

          <!-- Column Droppable Cards Area -->
          <div class="p-3.5 space-y-3.5 flex-1 overflow-y-auto max-h-[750px] custom-scrollbar" data-column-status="${col.id}">
            ${colNotes.length === 0 ? `
              <div class="p-8 text-center text-xs text-gray-500 border-2 border-dashed border-white/10 rounded-2xl my-6 flex flex-col items-center gap-2">
                <i class="fa-regular fa-clipboard text-xl text-gray-600"></i>
                <span>لا توجد ملاحظات في هذه المرحلة</span>
              </div>
            ` : colNotes.map(note => this.renderNoteCard(note)).join('')}
          </div>

          <!-- Quick Add Button at bottom of column -->
          ${this.canEdit() ? `
          <div class="p-3 border-t border-white/5 ${col.bg}">
            <button class="btn-quick-add-to-col w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer"
                    data-status-target="${col.id}">
              <i class="fa-solid fa-plus text-[10px] text-gold"></i>
              <span>إضافة ملاحظة هنا</span>
            </button>
          </div>
          ` : ''}

        </div>
      `;
    }).join('');

    this.bindCardEvents();
  }

  renderNoteCard(note) {
    const prioInfo = this.priorities.find(p => p.id === note.priority) || this.priorities[2];
    const commentCount = (note.comments || []).length;

    return `
      <div class="note-card p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-gold/50 transition-all space-y-3 shadow-lg group relative cursor-pointer"
           data-note-id="${note.id}">
        
        <!-- Header Tags: Category & Priority -->
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-gold/10 text-gold border border-gold/30 truncate max-w-[130px]">
            ${note.category || 'عام'}
          </span>
          <span class="px-2 py-0.5 rounded-md text-[9px] font-black border ${prioInfo.badgeBg}">
            ${prioInfo.name.split(' ')[0]} ${prioInfo.name.split(' ')[1] || ''}
          </span>
        </div>

        <!-- Title & Description -->
        <div class="space-y-1.5">
          <h5 class="text-xs font-bold text-white group-hover:text-gold transition-colors leading-snug">
            ${note.title}
          </h5>
          <p class="text-[11px] text-gray-400 line-clamp-3 leading-relaxed">
            ${note.description}
          </p>
        </div>

        <!-- Target Page Badge & Date -->
        <div class="flex items-center justify-between text-[10px] text-gray-400 pt-1">
          <span class="flex items-center gap-1 text-laser">
            <i class="fa-solid fa-link text-[9px]"></i>
            <span class="font-bold">${note.targetPage || 'عام'}</span>
          </span>
          <span class="font-mono text-[9px] text-gray-500">
            ${(note.createdAt || '').slice(0, 10)}
          </span>
        </div>

        <!-- Card Footer: Assignee, Comments, Quick Shift -->
        <div class="pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
          
          <!-- Assignee & Author Avatars -->
          <div class="flex items-center gap-1.5" title="المسؤول: ${note.assignee || 'غير محدد'}">
            <span class="text-base">${note.assigneeAvatar || '👤'}</span>
            <span class="text-[10px] font-semibold text-gray-300 truncate max-w-[90px]">${note.assignee || 'غير مسند'}</span>
          </div>

          <!-- Action Buttons: Comments & Status Mover -->
          <div class="flex items-center gap-1.5">
            ${commentCount > 0 ? `
              <span class="px-2 py-0.5 rounded-full bg-white/10 text-gray-300 text-[10px] font-bold flex items-center gap-1" title="${commentCount} تعليق">
                <i class="fa-regular fa-comment text-[9px]"></i>
                <span class="font-mono">${commentCount}</span>
              </span>
            ` : ''}

            ${this.canEdit() ? `
            <button class="btn-open-move-menu w-6 h-6 rounded-lg bg-white/5 hover:bg-gold hover:text-black text-gray-300 flex items-center justify-center text-[10px] transition-all"
                    data-note-id="${note.id}" title="نقل إلى المرحلة التالية">
              <i class="fa-solid fa-arrow-right-arrow-left"></i>
            </button>
            ` : ''}
          </div>

        </div>

      </div>
    `;
  }

  bindEvents() {
    const searchInput = document.getElementById("input-search-notes");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.renderKanbanColumns();
      });
    }

    const catSelect = document.getElementById("select-filter-category");
    if (catSelect) {
      catSelect.addEventListener("change", (e) => {
        this.filterCategory = e.target.value;
        this.renderKanbanColumns();
      });
    }

    const prioSelect = document.getElementById("select-filter-priority");
    if (prioSelect) {
      prioSelect.addEventListener("change", (e) => {
        this.filterPriority = e.target.value;
        this.renderKanbanColumns();
      });
    }

    const assSelect = document.getElementById("select-filter-assignee");
    if (assSelect) {
      assSelect.addEventListener("change", (e) => {
        this.filterAssignee = e.target.value;
        this.renderKanbanColumns();
      });
    }

    const pageSelect = document.getElementById("select-filter-page");
    if (pageSelect) {
      pageSelect.addEventListener("change", (e) => {
        this.filterTargetPage = e.target.value;
        this.renderKanbanColumns();
      });
    }

    const btnReset = document.getElementById("btn-reset-notes-filters");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        this.searchQuery = "";
        this.filterCategory = "all";
        this.filterPriority = "all";
        this.filterAssignee = "all";
        this.filterTargetPage = "all";
        if (searchInput) searchInput.value = "";
        if (catSelect) catSelect.value = "all";
        if (prioSelect) prioSelect.value = "all";
        if (assSelect) assSelect.value = "all";
        if (pageSelect) pageSelect.value = "all";
        this.renderKanbanColumns();
      });
    }

    const btnOpenNew = document.getElementById("btn-open-create-note-modal");
    if (btnOpenNew) {
      if (!this.canEdit()) {
        btnOpenNew.style.display = "none";
      } else {
        btnOpenNew.addEventListener("click", () => {
          this.openNoteModal(null, "inbox");
        });
      }
    }

    const formSaveNote = document.getElementById("form-save-note");
    if (formSaveNote) {
      formSaveNote.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSaveNote();
      });
    }

    document.querySelectorAll(".btn-close-note-modal").forEach(btn => {
      btn.addEventListener("click", () => {
        const modal = document.getElementById("note-editor-modal");
        if (modal) modal.classList.add("hidden");
        const detailsModal = document.getElementById("note-details-modal");
        if (detailsModal) detailsModal.classList.add("hidden");
      });
    });

    const btnPrint = document.getElementById("btn-print-notes-report");
    if (btnPrint) {
      btnPrint.addEventListener("click", () => {
        window.print();
      });
    }

    const formComment = document.getElementById("form-add-comment");
    if (formComment) {
      if (!this.canEdit()) {
        formComment.style.display = "none";
      } else {
        formComment.addEventListener("submit", (e) => {
          e.preventDefault();
          this.handleAddComment();
        });
      }
    }
  }

  bindCardEvents() {
    document.querySelectorAll(".note-card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".btn-open-move-menu")) return;
        const noteId = card.getAttribute("data-note-id");
        this.openNoteDetailsModal(noteId);
      });
    });

    document.querySelectorAll(".btn-quick-add-to-col").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!this.canEdit()) return;
        const status = btn.getAttribute("data-status-target");
        this.openNoteModal(null, status);
      });
    });

    document.querySelectorAll(".btn-open-move-menu").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!this.canEdit()) return;
        const noteId = btn.getAttribute("data-note-id");
        this.promptMoveNote(noteId);
      });
    });
  }

  promptMoveNote(noteId) {
    if (!this.canEdit()) return;
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;

    const nextStatuses = {
      "inbox": "in_progress",
      "in_progress": "review",
      "review": "resolved",
      "resolved": "deferred",
      "deferred": "inbox"
    };

    const nextStatus = nextStatuses[note.status] || "in_progress";
    note.status = nextStatus;
    this.saveAndSync();
    this.render();
  }

  openNoteModal(noteId = null, defaultStatus = "inbox") {
    if (!this.canEdit()) {
      alert("🔒 عذراً، حسابك بصلاحية استعراض فقط ولا يمكنك إضافة أو تعديل الملاحظات.");
      return;
    }
    this.editingNoteId = noteId;
    const modal = document.getElementById("note-editor-modal");
    const titleEl = document.getElementById("modal-note-editor-title");
    
    const inputTitle = document.getElementById("input-note-title");
    const inputDesc = document.getElementById("input-note-desc");
    const selectCat = document.getElementById("input-note-category");
    const selectPrio = document.getElementById("input-note-priority");
    const selectPage = document.getElementById("input-note-page");
    const selectAssignee = document.getElementById("input-note-assignee");
    const selectStatus = document.getElementById("input-note-status");

    const team = this.getTeamMembers();
    if (selectAssignee) {
      selectAssignee.innerHTML = `<option value="غير مسند">غير مسند (عام)</option>` + team.map(tm => `
        <option value="${tm.name}">${tm.name} (${tm.role})</option>
      `).join('');
    }

    if (noteId) {
      const note = this.notes.find(n => n.id === noteId);
      if (titleEl) titleEl.textContent = "تعديل الملاحظة والمقترح";
      if (inputTitle) inputTitle.value = note.title || "";
      if (inputDesc) inputDesc.value = note.description || "";
      if (selectCat) selectCat.value = note.category || "عام";
      if (selectPrio) selectPrio.value = note.priority || "medium";
      if (selectPage) selectPage.value = note.targetPage || "وثيقة PDR";
      if (selectAssignee) selectAssignee.value = note.assignee || "غير مسند";
      if (selectStatus) selectStatus.value = note.status || defaultStatus;
    } else {
      if (titleEl) titleEl.textContent = "إضافة ملاحظة أو مقترح جديد";
      if (inputTitle) inputTitle.value = "";
      if (inputDesc) inputDesc.value = "";
      if (selectCat) selectCat.value = "وثيقة PDR";
      if (selectPrio) selectPrio.value = "medium";
      if (selectPage) selectPage.value = "pdr.html";
      if (selectAssignee) selectAssignee.value = team[0] ? team[0].name : "غير مسند";
      if (selectStatus) selectStatus.value = defaultStatus;
    }

    if (modal) modal.classList.remove("hidden");
  }

  handleSaveNote() {
    if (!this.canEdit()) {
      alert("🔒 عذراً، حسابك بصلاحية استعراض فقط ولا يمكنك حفظ التعديلات.");
      return;
    }

    const inputTitle = document.getElementById("input-note-title");
    const inputDesc = document.getElementById("input-note-desc");
    const selectCat = document.getElementById("input-note-category");
    const selectPrio = document.getElementById("input-note-priority");
    const selectPage = document.getElementById("input-note-page");
    const selectAssignee = document.getElementById("input-note-assignee");
    const selectStatus = document.getElementById("input-note-status");

    const title = inputTitle ? inputTitle.value.trim() : "";
    const description = inputDesc ? inputDesc.value.trim() : "";
    const category = selectCat ? selectCat.value : "عام";
    const priority = selectPrio ? selectPrio.value : "medium";
    const targetPage = selectPage ? selectPage.value : "pdr.html";
    const assignee = selectAssignee ? selectAssignee.value : "غير مسند";
    const status = selectStatus ? selectStatus.value : "inbox";

    if (!title) {
      alert("يرجى كتابة عنوان الملاحظة.");
      return;
    }

    const team = this.getTeamMembers();
    const assigneeObj = team.find(t => t.name === assignee);

    if (this.editingNoteId) {
      const note = this.notes.find(n => n.id === this.editingNoteId);
      if (note) {
        note.title = title;
        note.description = description;
        note.category = category;
        note.priority = priority;
        note.targetPage = targetPage;
        note.assignee = assignee;
        note.assigneeAvatar = assigneeObj ? assigneeObj.avatar : "👤";
        note.status = status;
        note.updatedAt = new Date().toISOString();
      }
    } else {
      const newNote = {
        id: "note_" + Date.now(),
        title,
        description,
        category,
        priority,
        targetPage,
        author: this.currentUser ? this.currentUser.name : "عضو الفريق",
        authorAvatar: this.currentUser && this.currentUser.role === "admin" ? "👑" : "👨‍💼",
        assignee,
        assigneeAvatar: assigneeObj ? assigneeObj.avatar : "👤",
        status,
        createdAt: new Date().toISOString(),
        tags: [category],
        comments: []
      };
      this.notes.unshift(newNote);
    }

    this.saveAndSync();
    this.render();

    const modal = document.getElementById("note-editor-modal");
    if (modal) modal.classList.add("hidden");
  }

  openNoteDetailsModal(noteId) {
    this.selectedNoteId = noteId;
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;

    const modal = document.getElementById("note-details-modal");
    const prioInfo = this.priorities.find(p => p.id === note.priority) || this.priorities[2];
    const colInfo = this.columns.find(c => c.id === note.status) || this.columns[0];
    const canEdit = this.canEdit();

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setText("details-note-title", note.title);
    setText("details-note-desc", note.description || "لا يوجد وصف إضافي.");
    setText("details-note-category", note.category);
    setText("details-note-target-page", note.targetPage);
    setText("details-note-author", note.author || "فريق المنصة");
    setText("details-note-assignee", note.assignee || "غير مسند");
    setText("details-note-created", (note.createdAt || '').slice(0, 10));
    setText("details-note-status-badge", colInfo.title);

    const prioBadge = document.getElementById("details-note-prio-badge");
    if (prioBadge) {
      prioBadge.textContent = prioInfo.name;
      prioBadge.className = `px-3 py-1 rounded-full text-xs font-black border ${prioInfo.badgeBg}`;
    }

    this.renderCommentsList(note);

    const btnEdit = document.getElementById("btn-edit-note-from-details");
    if (btnEdit) {
      btnEdit.style.display = canEdit ? "inline-flex" : "none";
      btnEdit.onclick = () => {
        if (!this.canEdit()) return;
        if (modal) modal.classList.add("hidden");
        this.openNoteModal(note.id);
      };
    }

    const btnDelete = document.getElementById("btn-delete-note-from-details");
    if (btnDelete) {
      btnDelete.style.display = canEdit ? "inline-flex" : "none";
      btnDelete.onclick = () => {
        if (!this.canEdit()) return;
        if (confirm("هل أنت متأكد من حذف هذه الملاحظة؟")) {
          this.notes = this.notes.filter(n => n.id !== note.id);
          this.saveAndSync();
          this.render();
          if (modal) modal.classList.add("hidden");
        }
      };
    }

    const selectStatus = document.getElementById("details-select-status");
    if (selectStatus) {
      selectStatus.disabled = !canEdit;
      selectStatus.innerHTML = this.columns.map(c => `
        <option value="${c.id}" ${note.status === c.id ? 'selected' : ''}>${c.title}</option>
      `).join('');

      selectStatus.onchange = (e) => {
        if (!this.canEdit()) return;
        note.status = e.target.value;
        this.saveAndSync();
        this.render();
        const newCol = this.columns.find(c => c.id === note.status);
        if (newCol) setText("details-note-status-badge", newCol.title);
      };
    }

    const formComment = document.getElementById("form-add-comment");
    if (formComment) {
      formComment.style.display = canEdit ? "block" : "none";
    }

    if (modal) modal.classList.remove("hidden");
  }

  renderCommentsList(note) {
    const listEl = document.getElementById("details-comments-list");
    if (!listEl) return;

    const comments = note.comments || [];
    if (comments.length === 0) {
      listEl.innerHTML = `<div class="p-4 text-center text-xs text-gray-500">لا توجد مناقشات بعد.</div>`;
      return;
    }

    const isAdminUser = this.isAdmin();
    const canEdit = this.canEdit();

    listEl.innerHTML = comments.map((c, idx) => {
      const canManage = canEdit && (isAdminUser || (this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'editor' || this.currentUser.name === c.author)));
      return `
      <div class="p-3 rounded-xl bg-black/40 border border-white/5 text-xs space-y-1 group transition-all hover:border-gold/30">
        <div class="flex items-center justify-between text-[11px] text-gray-400">
          <div class="flex items-center gap-1.5 font-bold text-gold">
            <span>${c.avatar || '👤'}</span>
            <span>${c.author || 'عضو الفريق'}</span>
            ${c.editedAt ? `<span class="text-[9px] text-gray-500 font-mono font-normal">(معدل)</span>` : ''}
          </div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-[10px] text-gray-500">${c.date || ''}</span>
            ${canManage ? `
              <div class="flex items-center gap-1">
                <button class="btn-edit-note-comment p-1 rounded hover:bg-gold/20 text-gray-400 hover:text-gold transition-all cursor-pointer"
                        data-comment-idx="${idx}" title="تعديل التعليق">
                  <i class="fa-solid fa-pen-to-square text-[10px]"></i>
                </button>
                <button class="btn-delete-note-comment p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                        data-comment-idx="${idx}" title="حذف التعليق">
                  <i class="fa-solid fa-trash text-[10px]"></i>
                </button>
              </div>
            ` : ''}
          </div>
        </div>
        <p class="text-gray-200 text-xs leading-relaxed pt-1">${c.text}</p>
      </div>
      `;
    }).join('');

    // Bind edit/delete comments events
    if (canEdit) {
      listEl.querySelectorAll(".btn-edit-note-comment").forEach(btn => {
        btn.addEventListener("click", () => {
          if (!this.canEdit()) return;
          const cIdx = Number(btn.getAttribute("data-comment-idx"));
          if (note.comments && note.comments[cIdx]) {
            const currentText = note.comments[cIdx].text || "";
            const updated = prompt("تعديل نص التعليق:", currentText);
            if (updated !== null && updated.trim() !== "") {
              note.comments[cIdx].text = updated.trim();
              note.comments[cIdx].editedAt = new Date().toISOString();
              this.saveAndSync();
              this.renderCommentsList(note);
            }
          }
        });
      });

      listEl.querySelectorAll(".btn-delete-note-comment").forEach(btn => {
        btn.addEventListener("click", () => {
          if (!this.canEdit()) return;
          const cIdx = Number(btn.getAttribute("data-comment-idx"));
          if (note.comments && note.comments[cIdx]) {
            if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
              note.comments.splice(cIdx, 1);
              this.saveAndSync();
              this.renderCommentsList(note);
              this.renderKanbanColumns();
            }
          }
        });
      });
    }
  }

  handleAddComment() {
    if (!this.canEdit()) {
      alert("🔒 عذراً، حسابك بصلاحية استعراض فقط ولا يمكنك إضافة تعليق.");
      return;
    }
    const input = document.getElementById("input-new-comment-text");
    if (!input || !input.value.trim() || !this.selectedNoteId) return;

    const note = this.notes.find(n => n.id === this.selectedNoteId);
    if (!note) return;

    note.comments = note.comments || [];
    const newComm = {
      id: "c_" + Date.now(),
      author: this.currentUser ? this.currentUser.name : "عضو الفريق",
      avatar: this.currentUser && this.currentUser.role === "admin" ? "👑" : "👨‍💼",
      text: input.value.trim(),
      date: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    note.comments.push(newComm);
    input.value = "";

    this.saveAndSync();
    this.renderCommentsList(note);
    this.renderKanbanColumns();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("notes-kanban-page-root")) {
    App.notesKanban = new App.NotesKanban();
    App.notesKanban.init();
  }
});
