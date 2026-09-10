/* ==========================================================
   PROJECT DEFINITION REPORT (PDR) - MODEL LAYER
   إدارة حالة بيانات مشروع تقرير تعريف المشروع PDR واستوديو إنجاز المخرجات
   ========================================================== */

window.App = window.App || {};
var App = window.App;

App.PdrModel = class {
  constructor() {
    this.storageKey = "pdr_project_definition_state_v2";
    this.authStorageKey = "seraj_auth_session_v1";
    
    this.activeView = "matrix"; // 'matrix' | 'detailed' | 'kanban' | 'charts' | 'report' | 'studio'
    this.selectedSectionId = "sec_1"; // Default selected section
    
    // Studio State
    this.selectedStudioSectionId = "sec_1";
    this.selectedStudioItemId = "sec1_item1";
    this.studioMode = "editor"; // 'editor' | 'preview'
    this.filterTaskType = "all";
    this.filterStudioAssignee = "all";
    this.filterStudioSection = "all";
    
    // Filters & Search
    this.filterSection = "all";
    this.filterAssignee = "all";
    this.filterStatus = "all";
    this.searchQuery = "";
    
    this.serverSyncStatus = "idle"; // 'idle' | 'syncing' | 'saved' | 'error'
    this.saveDebounceTimer = null;
    
    // Authentication & Session
    this.currentUser = null;
    this.initAuthSession();
    
    // Load dataset
    this.data = null;
    this.initData();
  }

  /* ---------------- AUTHENTICATION ---------------- */
  initAuthSession() {
    try {
      const savedAuth = localStorage.getItem("seraj_unified_auth_session_v1") ||
                        sessionStorage.getItem("seraj_unified_auth_session_v1") ||
                        sessionStorage.getItem(this.authStorageKey);
      if (savedAuth) {
        this.currentUser = JSON.parse(savedAuth);
      }
    } catch (e) {
      console.warn("Failed to load auth session:", e);
      this.currentUser = null;
    }
  }

  isAuthenticated() {
    return Boolean(this.currentUser && this.currentUser.token);
  }

  canEdit() {
    if (!this.currentUser) return false;
    return Boolean(this.currentUser.role === "admin" || this.currentUser.role === "editor");
  }

  isAdmin() {
    return Boolean(this.currentUser && this.currentUser.role === "admin");
  }

  getRoleBadge() {
    if (!this.currentUser) return { label: "استعراض فقط (زائر)", role: "viewer", icon: "fa-eye", color: "#8a9ba8" };
    if (this.currentUser.role === "admin") return { label: "مدير النظام (Admin)", role: "admin", icon: "fa-crown", color: "#dfb15b" };
    if (this.currentUser.role === "editor") return { label: "محرر ومسؤول مهام (Editor)", role: "editor", icon: "fa-pen-to-square", color: "#2ec866" };
    return { label: "استعراض فقط (Viewer)", role: "viewer", icon: "fa-eye", color: "#8a9ba8" };
  }

  async login(username, password) {
    const cleanUser = (username || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUser, password: cleanPass })
      });
      const data = await res.json();
      if (!res.ok || data.status !== "success") {
        throw new Error(data.message || "اسم المستخدم أو كلمة المرور غير صحيحة");
      }

      this.currentUser = {
        ...data.user,
        token: data.token
      };
      sessionStorage.setItem(this.authStorageKey, JSON.stringify(this.currentUser));
      localStorage.setItem("seraj_unified_auth_session_v1", JSON.stringify(this.currentUser));
      sessionStorage.setItem("seraj_unified_auth_session_v1", JSON.stringify(this.currentUser));
      if (window.App && window.App.authGuard) {
        window.App.authGuard.syncSessionAcrossStorage(this.currentUser);
      }
      return { success: true, user: this.currentUser };
    } catch (e) {
      console.warn("PDR login server unreachable, trying offline credentials:", e.message);
      const offlineUsers = [
        { username: "admin", name: "مدير النظام الرئيسي", role: "admin", password: "admin2026" },
        { username: "editor", name: "محرر المحتوى والمهام", role: "editor", password: "editor2026" },
        { username: "researcher1", name: "د. خالد الأحسائي", role: "editor", password: "pass1234" }
      ];
      const matched = offlineUsers.find(u => u.username.toLowerCase() === cleanUser && u.password === cleanPass);
      if (matched) {
        this.currentUser = {
          id: "usr_local_" + matched.username,
          username: matched.username,
          name: matched.name,
          role: matched.role,
          token: "local_tok_" + Date.now()
        };
        sessionStorage.setItem(this.authStorageKey, JSON.stringify(this.currentUser));
        localStorage.setItem("seraj_unified_auth_session_v1", JSON.stringify(this.currentUser));
        sessionStorage.setItem("seraj_unified_auth_session_v1", JSON.stringify(this.currentUser));
        if (window.App && window.App.authGuard) {
          window.App.authGuard.syncSessionAcrossStorage(this.currentUser);
        }
        return { success: true, user: this.currentUser };
      }
      return { success: false, message: e.message || "اسم المستخدم أو كلمة المرور غير صحيحة" };
    }
  }

  logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem(this.authStorageKey);
      sessionStorage.removeItem(this.authStorageKey);
      localStorage.removeItem("seraj_unified_auth_session_v1");
      sessionStorage.removeItem("seraj_unified_auth_session_v1");
      localStorage.removeItem("seraj_detailed_plan_auth_v1");
      sessionStorage.removeItem("seraj_detailed_plan_auth_v1");
      localStorage.removeItem("pdr_auth_user");
      sessionStorage.removeItem("pdr_auth_user");
    } catch (_) {}
    if (window.App && window.App.authGuard) {
      window.App.authGuard.clearSessionAcrossStorage();
    }
  }

  /* ---------------- DATA INITIALIZATION & SYNC ---------------- */
  initData() {
    try {
      const cached = localStorage.getItem(this.storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
          // Auto-merge any newly added sections (like Section 17)
          if (App.PdrData && Array.isArray(App.PdrData.sections)) {
            App.PdrData.sections.forEach(defSec => {
              const exists = parsed.sections.find(s => s.id === defSec.id);
              if (!exists) {
                parsed.sections.push(JSON.parse(JSON.stringify(defSec)));
              }
            });
            parsed.sections.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
          }
          this.data = parsed;
          this.saveToLocalStorage();
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to parse cached PDR data:", e);
    }

    this.data = JSON.parse(JSON.stringify(App.PdrData || {}));
  }

  async fetchFromServer(callback) {
    try {
      this.serverSyncStatus = "syncing";

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

      // 2. Fetch PDR Data
      const res = await fetch("/api/pdr");
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.status === "success" && responseData.data && Array.isArray(responseData.data.sections) && responseData.data.sections.length > 0) {
          const srvData = responseData.data;
          // Merge any missing default sections (like Section 17)
          if (App.PdrData && Array.isArray(App.PdrData.sections)) {
            App.PdrData.sections.forEach(defSec => {
              const exists = srvData.sections.find(s => s.id === defSec.id);
              if (!exists) {
                srvData.sections.push(JSON.parse(JSON.stringify(defSec)));
              }
            });
            srvData.sections.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
          }
          this.data = srvData;
          this.cleanOrphanedAssignments();
          this.saveToLocalStorage();
          this.serverSyncStatus = "saved";
          console.log("📥 [PDR] Loaded state from central server successfully.");
        }
      }
    } catch (e) {
      console.warn("⚠️ PDR offline or server sync failed:", e);
      this.serverSyncStatus = "offline";
    }
    this.cleanOrphanedAssignments();
    if (typeof callback === "function") callback(this.data);
  }

  saveToLocalStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.error("Failed to save PDR to LocalStorage:", e);
    }
  }

  saveAndSync() {
    if (!this.canEdit()) return;
    this.saveToLocalStorage();
    this.debouncedServerSync();
  }

  debouncedServerSync() {
    this.serverSyncStatus = "syncing";
    if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);

    this.saveDebounceTimer = setTimeout(() => {
      this.syncToServer();
    }, 600);
  }

  async syncToServer() {
    try {
      const headers = { "Content-Type": "application/json" };
      if (this.currentUser && this.currentUser.token) {
        headers["Authorization"] = "Bearer " + this.currentUser.token;
      }

      const res = await fetch("/api/pdr", {
        method: "POST",
        headers,
        body: JSON.stringify(this.data)
      });

      if (res.ok) {
        this.serverSyncStatus = "saved";
        console.log("☁️ [PDR] State synced to server.");
      } else {
        this.serverSyncStatus = "error";
      }
    } catch (e) {
      console.warn("Error syncing PDR to server:", e);
      this.serverSyncStatus = "error";
    }
  }

  resetToDefaults() {
    if (!this.isAdmin()) return;
    this.data = JSON.parse(JSON.stringify(App.PdrData));
    this.saveAndSync();
  }

  /* ---------------- TASK TYPE HELPERS ---------------- */
  getTaskTypeInfo(taskType) {
    const types = {
      historical_research: {
        id: "historical_research",
        nameAr: "محتوى وبحث تاريخي وشرعي",
        icon: "fa-book-quran",
        color: "#dfb15b",
        badgeBg: "bg-gold/15 text-gold border-gold/30",
        desc: "صياغة المادة التاريخية، تخريج الأحاديث، وتصميم السيناريو الصوتي والمرئي"
      },
      technical_specs: {
        id: "technical_specs",
        nameAr: "مواصفات هندسية وتقنية وتصميم",
        icon: "fa-microchip",
        color: "#00ebd4",
        badgeBg: "bg-laser/15 text-laser border-laser/30",
        desc: "أبعاد وتجهيزات المقطورة، شاشات 270°، الهولوجرام، والأنظمة التفاعلية"
      },
      strategic_charter: {
        id: "strategic_charter",
        nameAr: "مواثيق استراتيجية وحوكمة",
        icon: "fa-chess-king",
        color: "#a78bfa",
        badgeBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        desc: "الرؤية، الأهداف، لوائح اللجان، مصفوفات SWOT/PESTEL، والهيكل الإداري"
      },
      operations_logistics: {
        id: "operations_logistics",
        nameAr: "عمليات ميدانية ومسار ومخاطر",
        icon: "fa-truck-fast",
        color: "#2ec866",
        badgeBg: "bg-palm/15 text-palm border-palm/30",
        desc: "خطة خط السير للـ 20 مدينة، التراخيص الحكومية، وإدارة المخاطر والطوارئ"
      },
      education_experience: {
        id: "education_experience",
        nameAr: "برامج تعليمية وتجربة زائر و KPIs",
        icon: "fa-graduation-cap",
        color: "#f6ad55",
        badgeBg: "bg-orange-500/15 text-orange-400 border-orange-500/30",
        desc: "الحقائب المدرسية، المسابقات، مسارات الفئات، ومؤشرات الأداء"
      },
      financial_sustainability: {
        id: "financial_sustainability",
        nameAr: "استدامة مالية ورعاية وشراكات",
        icon: "fa-handshake-angle",
        color: "#cc6e55",
        badgeBg: "bg-clay/15 text-clay border-clay/30",
        desc: "باقات الرعاية، تنويع الإيرادات، خطط الاستثمار، والشراكات المؤسسية"
      }
    };
    return types[taskType] || {
      id: "general_task",
      nameAr: "مخرج عام للمشروع",
      icon: "fa-file-lines",
      color: "#94a3b8",
      badgeBg: "bg-white/10 text-gray-300 border-white/15",
      desc: "مخرج وبند تنفيذي عام"
    };
  }

  /* ---------------- LOOKUPS & STATS ---------------- */
  getTeamMembers() {
    let usersList = [];
    try {
      const saved = localStorage.getItem("seraj_users_list_v1");
      if (saved) usersList = JSON.parse(saved);
    } catch (_) {}

    const membersMap = new Map();

    // 1. Load from synchronized users directory
    if (Array.isArray(usersList) && usersList.length > 0) {
      usersList.forEach((u, idx) => {
        const name = (u.name || u.username || "").trim();
        const roleLabel = u.specialty || u.track || (u.role === "admin" ? "مدير النظام (Admin)" : "محرر ومسؤول مهام (Editor)");
        if (name) {
          membersMap.set(name.toLowerCase(), {
            id: u.username || u.id || ("usr_" + idx),
            username: u.username || name,
            name: name,
            role: roleLabel,
            specialty: roleLabel,
            department: u.role === "admin" ? "الإدارة العامة والحوكمة" : "فريق التنفيذ والمحتوى",
            avatar: u.role === "admin" ? "👑" : "👨‍💼",
            email: `${u.username || 'member'}@seraj.sa`,
            systemRole: u.role || "editor",
            status: "active"
          });
        }
      });
    }

    // 2. Merge with any members in document data
    if (this.data && Array.isArray(this.data.teamMembers)) {
      this.data.teamMembers.forEach((tm, idx) => {
        const name = (tm.name || tm.username || tm.id || "").trim();
        if (name && !membersMap.has(name.toLowerCase())) {
          membersMap.set(name.toLowerCase(), {
            id: tm.id || ("tm_" + idx),
            username: tm.username || tm.id || name,
            name: name,
            role: tm.role || "عضو فريق",
            specialty: tm.specialty || tm.role || "عضو فريق",
            department: tm.department || "فريق العمل",
            avatar: tm.avatar || "👤",
            email: tm.email || `${tm.id || 'member'}@seraj.sa`,
            systemRole: tm.systemRole || "editor",
            status: tm.status || "active"
          });
        }
      });
    }

    if (membersMap.size === 0) {
      return [
        { id: "admin", username: "admin", name: "مدير النظام الرئيسي", role: "مدير النظام (Admin)", department: "الإدارة العامة", avatar: "👑", status: "active" },
        { id: "editor", username: "editor", name: "محرر ومسؤول المحتوى والمهام", role: "محرر ومسؤول مهام (Editor)", department: "إدارة المحتوى", avatar: "✍️", status: "active" }
      ];
    }

    return Array.from(membersMap.values());
  }

  getTeamMember(id) {
    const cleanId = (id || "").toString().trim();
    if (!cleanId || cleanId === "unassigned" || cleanId === "غير مسند" || cleanId === "لم يحدد") {
      return { id: "unassigned", name: "غير مسند", role: "غير مسند", avatar: "👤" };
    }

    const list = this.getTeamMembers();
    
    // Direct match by ID or username
    let found = list.find(tm => tm.id === cleanId || tm.username === cleanId);
    if (found) return found;

    // Match by exact Name
    found = list.find(tm => tm.name && tm.name.trim() === cleanId);
    if (found) return found;

    // Match by partial name if reasonable
    found = list.find(tm => tm.name && (tm.name.includes(cleanId) || cleanId.includes(tm.name)));
    if (found) return found;

    // Deleted or non-existent member -> Return Unassigned cleanly
    return {
      id: "unassigned",
      name: "غير مسند",
      role: "غير مسند",
      avatar: "👤"
    };
  }

  // Delete team member with automatic cascade reassignment
  deleteTeamMember(memId, reassignToId = "unassigned") {
    if (!this.isAdmin()) return;
    if (!this.data || !Array.isArray(this.data.teamMembers)) return;
    
    const targetMember = this.getTeamMember(memId);
    const targetIds = [memId, targetMember.name, targetMember.username, targetMember.id].filter(Boolean);

    // Remove from teamMembers array
    this.data.teamMembers = this.data.teamMembers.filter(m => !targetIds.includes(m.id) && !targetIds.includes(m.name));

    // Cascade update all sections and sub-items
    if (Array.isArray(this.data.sections)) {
      this.data.sections.forEach(sec => {
        if (sec.ownerId && targetIds.includes(sec.ownerId)) {
          sec.ownerId = reassignToId || "unassigned";
        }
        if (Array.isArray(sec.items)) {
          sec.items.forEach(item => {
            if (item.assignedTo && targetIds.includes(item.assignedTo)) {
              item.assignedTo = reassignToId || "unassigned";
            }
          });
        }
      });
    }

    this.saveData();
    if (typeof this.saveToServer === "function") {
      this.saveToServer();
    }
  }

  // Self-healing: Purge any orphaned member assignments that are not in active team
  cleanOrphanedAssignments() {
    if (!this.data || !Array.isArray(this.data.sections)) return;
    const activeMembers = this.getTeamMembers();
    const validIdentifiers = new Set(["unassigned", "غير مسند", "لم يحدد", ""]);
    activeMembers.forEach(m => {
      if (m.id) validIdentifiers.add(m.id.toString().trim());
      if (m.username) validIdentifiers.add(m.username.toString().trim());
      if (m.name) validIdentifiers.add(m.name.toString().trim());
    });

    let modified = false;
    this.data.sections.forEach(sec => {
      if (sec.ownerId && !validIdentifiers.has(sec.ownerId.toString().trim())) {
        console.log(`🧹 [PDR Model] Purging orphaned ownerId '${sec.ownerId}' in section ${sec.number}`);
        sec.ownerId = "unassigned";
        modified = true;
      }
      if (Array.isArray(sec.items)) {
        sec.items.forEach(item => {
          if (item.assignedTo && !validIdentifiers.has(item.assignedTo.toString().trim())) {
            console.log(`🧹 [PDR Model] Purging orphaned assignedTo '${item.assignedTo}' in item ${item.id}`);
            item.assignedTo = "unassigned";
            modified = true;
          }
        });
      }
    });

    if (modified) {
      this.saveData();
      if (typeof this.saveToServer === "function") {
        this.saveToServer();
      }
    }
  }

  getSection(id) {
    if (!this.data || !this.data.sections) return null;
    return this.data.sections.find(s => s.id === id);
  }

  getSectionByNumber(num) {
    if (!this.data || !this.data.sections) return null;
    return this.data.sections.find(s => s.number === num);
  }

  getItem(sectionId, itemId) {
    const sec = this.getSection(sectionId);
    if (!sec || !sec.items) return null;
    return sec.items.find(i => i.id === itemId);
  }

  calculateSectionStats(sectionId) {
    const sec = this.getSection(sectionId);
    if (!sec || !sec.items || sec.items.length === 0) {
      return { total: 0, approved: 0, inProgress: 0, review: 0, blocked: 0, progress: 0 };
    }

    const total = sec.items.length;
    let approved = 0;
    let inProgress = 0;
    let review = 0;
    let blocked = 0;
    let progressSum = 0;

    sec.items.forEach(item => {
      progressSum += (Number(item.progress) || 0);
      if (item.status === "approved") approved++;
      else if (item.status === "in_progress") inProgress++;
      else if (item.status === "review") review++;
      else if (item.status === "blocked") blocked++;
    });

    const progress = Math.round(progressSum / total);
    return { total, approved, inProgress, review, blocked, progress };
  }

  calculateGlobalStats() {
    if (!this.data || !this.data.sections) {
      return { totalItems: 0, approvedItems: 0, inProgressItems: 0, reviewItems: 0, blockedItems: 0, overallProgress: 0, criticalCount: 0, sectionsCount: 16 };
    }

    let totalItems = 0;
    let approvedItems = 0;
    let inProgressItems = 0;
    let reviewItems = 0;
    let blockedItems = 0;
    let progressSum = 0;
    let criticalCount = 0;

    this.data.sections.forEach(sec => {
      if (sec.items) {
        sec.items.forEach(item => {
          totalItems++;
          progressSum += (Number(item.progress) || 0);
          if (item.status === "approved") approvedItems++;
          else if (item.status === "in_progress") inProgressItems++;
          else if (item.status === "review") reviewItems++;
          else if (item.status === "blocked") blockedItems++;
          if (item.priority === "critical") criticalCount++;
        });
      }
    });

    const overallProgress = totalItems > 0 ? Math.round(progressSum / totalItems) : 0;
    return {
      totalItems,
      approvedItems,
      inProgressItems,
      reviewItems,
      blockedItems,
      overallProgress,
      criticalCount,
      sectionsCount: this.data.sections.length,
      teamCount: this.data.teamMembers ? this.data.teamMembers.length : 0
    };
  }

  /* ---------------- STUDIO DELIVERABLES & WORKBENCH OPERATIONS ---------------- */
  selectStudioItem(sectionId, itemId) {
    this.selectedStudioSectionId = sectionId;
    this.selectedStudioItemId = itemId;
  }

  getStudioSelectedData() {
    const sec = this.getSection(this.selectedStudioSectionId) || (this.data.sections ? this.data.sections[0] : null);
    if (!sec) return null;

    let item = (sec.items || []).find(i => i.id === this.selectedStudioItemId);
    if (!item && sec.items && sec.items.length > 0) {
      item = sec.items[0];
      this.selectedStudioItemId = item.id;
    }

    const typeInfo = this.getTaskTypeInfo(item ? item.taskType : "");
    const assignee = item ? this.getTeamMember(item.assignedTo) : null;
    const owner = this.getTeamMember(sec.ownerId);

    return {
      section: sec,
      item,
      typeInfo,
      assignee,
      owner
    };
  }

  getStudioFilteredItems() {
    if (!this.data || !this.data.sections) return [];

    let list = [];
    const query = (this.searchQuery || "").trim().toLowerCase();

    this.data.sections.forEach(sec => {
      if (this.filterStudioSection !== "all" && sec.id !== this.filterStudioSection) return;

      (sec.items || []).forEach(item => {
        if (this.filterTaskType !== "all" && item.taskType !== this.filterTaskType) return;
        if (this.filterStudioAssignee !== "all" && item.assignedTo !== this.filterStudioAssignee) return;
        if (this.filterStatus !== "all" && item.status !== this.filterStatus) return;

        if (query) {
          const matchTitle = (item.title || "").toLowerCase().includes(query);
          const matchDesc = (item.description || "").toLowerCase().includes(query);
          const matchDeliverables = (item.deliverables || "").toLowerCase().includes(query);
          const matchSec = (sec.titleAr || "").toLowerCase().includes(query);
          if (!matchTitle && !matchDesc && !matchDeliverables && !matchSec) return;
        }

        list.push({
          ...item,
          sectionId: sec.id,
          sectionNumber: sec.number,
          sectionTitleAr: sec.titleAr,
          sectionColor: sec.badgeColor,
          typeInfo: this.getTaskTypeInfo(item.taskType)
        });
      });
    });

    return list;
  }

  updateDeliverableWork(sectionId, itemId, updates) {
    if (!this.canEdit()) return false;
    const item = this.getItem(sectionId, itemId);
    if (!item) return false;

    Object.assign(item, updates);

    // Auto-update progress if all checklist items are completed
    if (Array.isArray(item.deliverableChecklist) && item.deliverableChecklist.length > 0) {
      const completedCount = item.deliverableChecklist.filter(c => c.completed).length;
      const calcProgress = Math.round((completedCount / item.deliverableChecklist.length) * 100);
      if (updates.progress === undefined) {
        item.progress = calcProgress;
        if (calcProgress === 100) item.status = "approved";
      }
    }

    this.saveAndSync();
    return true;
  }

  toggleChecklistItem(sectionId, itemId, checkId) {
    if (!this.canEdit()) return false;
    const item = this.getItem(sectionId, itemId);
    if (!item || !Array.isArray(item.deliverableChecklist)) return false;

    const target = item.deliverableChecklist.find(c => c.id === checkId);
    if (!target) return false;

    target.completed = !target.completed;

    // Recalculate progress
    const completedCount = item.deliverableChecklist.filter(c => c.completed).length;
    item.progress = Math.round((completedCount / item.deliverableChecklist.length) * 100);
    if (item.progress === 100) {
      item.status = "approved";
    } else if (item.status === "approved" && item.progress < 100) {
      item.status = "in_progress";
    }

    this.saveAndSync();
    return true;
  }

  addChecklistItem(sectionId, itemId, text) {
    if (!this.canEdit()) return false;
    const item = this.getItem(sectionId, itemId);
    if (!item) return false;

    if (!Array.isArray(item.deliverableChecklist)) item.deliverableChecklist = [];
    const newCheck = {
      id: "chk_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      text: text.trim(),
      completed: false
    };

    item.deliverableChecklist.push(newCheck);

    // Recalculate progress
    const completedCount = item.deliverableChecklist.filter(c => c.completed).length;
    item.progress = Math.round((completedCount / item.deliverableChecklist.length) * 100);

    this.saveAndSync();
    return newCheck;
  }

  deleteChecklistItem(sectionId, itemId, checkId) {
    if (!this.canEdit()) return false;
    const item = this.getItem(sectionId, itemId);
    if (!item || !Array.isArray(item.deliverableChecklist)) return false;

    const idx = item.deliverableChecklist.findIndex(c => c.id === checkId);
    if (idx === -1) return false;

    item.deliverableChecklist.splice(idx, 1);

    if (item.deliverableChecklist.length > 0) {
      const completedCount = item.deliverableChecklist.filter(c => c.completed).length;
      item.progress = Math.round((completedCount / item.deliverableChecklist.length) * 100);
    }

    this.saveAndSync();
    return true;
  }

  addWorkNote(sectionId, itemId, text, authorName) {
    if (!this.canEdit()) return false;
    const item = this.getItem(sectionId, itemId);
    if (!item) return false;

    if (!Array.isArray(item.workNotes)) item.workNotes = [];
    const author = authorName || (this.currentUser ? this.currentUser.name : "عضو الفريق");

    const noteObj = {
      id: "note_" + Date.now(),
      author,
      text: text.trim(),
      date: new Date().toISOString().split("T")[0]
    };

    item.workNotes.unshift(noteObj);
    this.saveAndSync();
    return noteObj;
  }

  editWorkNote(sectionId, itemId, noteIndex, newText) {
    if (!this.canEdit()) return false;
    const item = this.getItem(sectionId, itemId);
    if (!item || !Array.isArray(item.workNotes)) return false;
    const idx = Number(noteIndex);
    if (idx >= 0 && idx < item.workNotes.length) {
      item.workNotes[idx].text = newText.trim();
      item.workNotes[idx].editedAt = new Date().toISOString().split("T")[0];
      this.saveAndSync();
      return true;
    }
    return false;
  }

  deleteWorkNote(sectionId, itemId, noteIndex) {
    if (!this.canEdit()) return false;
    const item = this.getItem(sectionId, itemId);
    if (!item || !Array.isArray(item.workNotes)) return false;
    const idx = Number(noteIndex);
    if (idx >= 0 && idx < item.workNotes.length) {
      item.workNotes.splice(idx, 1);
      this.saveAndSync();
      return true;
    }
    return false;
  }

  approveAndFinalizeDeliverable(sectionId, itemId) {
    if (!this.canEdit()) return false;
    const item = this.getItem(sectionId, itemId);
    if (!item) return false;

    item.status = "approved";
    item.progress = 100;
    if (Array.isArray(item.deliverableChecklist)) {
      item.deliverableChecklist.forEach(c => c.completed = true);
    }

    this.addWorkNote(sectionId, itemId, "تم اعتماد وتدقيق المخرج رسمياً بنجاح بنسبة إنجاز 100%.", this.currentUser ? this.currentUser.name : "المشرف العام");
    this.saveAndSync();
    return true;
  }

  /* ---------------- GENERAL CRUD OPERATIONS ---------------- */
  updateSectionOverview(sectionId, updatedFields) {
    if (!this.canEdit()) return false;
    const sec = this.getSection(sectionId);
    if (!sec) return false;
    Object.assign(sec, updatedFields);
    this.saveAndSync();
    return true;
  }

  updateSectionItem(sectionId, itemId, updatedFields) {
    if (!this.canEdit()) return false;
    const item = this.getItem(sectionId, itemId);
    if (!item) return false;

    Object.assign(item, updatedFields);

    if (Number(item.progress) === 100 && item.status !== "approved") {
      item.status = "approved";
    }

    this.saveAndSync();
    return true;
  }

  addSectionItem(sectionId, newItem) {
    if (!this.canEdit()) return false;
    const sec = this.getSection(sectionId);
    if (!sec) return false;

    if (!sec.items) sec.items = [];
    const itemObj = {
      id: "item_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      title: newItem.title || "بند جديد",
      description: newItem.description || "",
      assignedTo: newItem.assignedTo || "tm_1",
      status: newItem.status || "in_progress",
      progress: Number(newItem.progress) || 0,
      priority: newItem.priority || "medium",
      dueDate: newItem.dueDate || new Date().toISOString().split("T")[0],
      deliverables: newItem.deliverables || "وثيقة المخرج التنفيذي",
      taskType: newItem.taskType || "strategic_charter",
      deliverableContent: newItem.deliverableContent || "اكتب هنا تفاصيل ومحتوى المخرج التنفيذي الفعلي...",
      deliverableChecklist: [
        { id: "c_" + Date.now() + "_1", text: "جمع البيانات والاشتراطات", completed: false },
        { id: "c_" + Date.now() + "_2", text: "صياغة المخرج والتدقيق الميداني", completed: false },
        { id: "c_" + Date.now() + "_3", text: "الاعتماد النهائي للمخرج", completed: false }
      ],
      workNotes: []
    };

    sec.items.push(itemObj);
    this.saveAndSync();
    return itemObj;
  }

  deleteSectionItem(sectionId, itemId) {
    if (!this.canEdit()) return false;
    const sec = this.getSection(sectionId);
    if (!sec || !sec.items) return false;

    const index = sec.items.findIndex(i => i.id === itemId);
    if (index === -1) return false;

    sec.items.splice(index, 1);
    this.saveAndSync();
    return true;
  }

  assignTeamMember(sectionId, itemId, memberId) {
    if (!this.canEdit()) return false;
    return this.updateSectionItem(sectionId, itemId, { assignedTo: memberId });
  }

  updateItemStatus(sectionId, itemId, status) {
    if (!this.canEdit()) return false;
    const updates = { status };
    if (status === "approved") {
      updates.progress = 100;
      const item = this.getItem(sectionId, itemId);
      if (item && Array.isArray(item.deliverableChecklist)) {
        item.deliverableChecklist.forEach(c => c.completed = true);
      }
    }
    return this.updateSectionItem(sectionId, itemId, updates);
  }

  updateItemProgress(sectionId, itemId, progressVal) {
    if (!this.canEdit()) return false;
    const progress = Math.max(0, Math.min(100, Number(progressVal)));
    const updates = { progress };
    if (progress === 100) updates.status = "approved";
    else if (progress > 0 && progress < 100) {
      const item = this.getItem(sectionId, itemId);
      if (item && item.status === "approved") {
        updates.status = "in_progress";
      }
    }
    return this.updateSectionItem(sectionId, itemId, updates);
  }

  addTeamMember(member) {
    if (!this.isAdmin()) return null;
    if (!this.data.teamMembers) this.data.teamMembers = [];
    const newMember = {
      id: "tm_" + Date.now(),
      name: member.name || "عضو جديد",
      role: member.role || "أخصائي تنفيذ ومحتوى",
      department: member.department || "الفريق التنفيذي",
      email: member.email || "",
      avatar: member.avatar || "👤",
      status: "active"
    };
    this.data.teamMembers.push(newMember);
    this.saveAndSync();
    return newMember;
  }

  /* ---------------- FILTERING ---------------- */
  getFilteredItems() {
    if (!this.data || !this.data.sections) return [];

    let results = [];
    const query = (this.searchQuery || "").trim().toLowerCase();

    this.data.sections.forEach(sec => {
      if (this.filterSection !== "all" && sec.id !== this.filterSection) return;
      if (!sec.items) return;

      sec.items.forEach(item => {
        if (this.filterAssignee !== "all" && item.assignedTo !== this.filterAssignee) return;
        if (this.filterStatus !== "all" && item.status !== this.filterStatus) return;

        if (query) {
          const matchTitle = (item.title || "").toLowerCase().includes(query);
          const matchDesc = (item.description || "").toLowerCase().includes(query);
          const matchDeliverables = (item.deliverables || "").toLowerCase().includes(query);
          const matchSecTitle = (sec.titleAr || "").toLowerCase().includes(query);
          const assignee = this.getTeamMember(item.assignedTo);
          const matchAssignee = assignee && (assignee.name.toLowerCase().includes(query) || assignee.role.toLowerCase().includes(query));

          if (!matchTitle && !matchDesc && !matchDeliverables && !matchSecTitle && !matchAssignee) {
            return;
          }
        }

        results.push({
          ...item,
          sectionId: sec.id,
          sectionNumber: sec.number,
          sectionTitleAr: sec.titleAr,
          sectionCode: sec.code,
          sectionColor: sec.badgeColor,
          typeInfo: this.getTaskTypeInfo(item.taskType)
        });
      });
    });

    return results;
  }

  /* ---------------- EXECUTIVE PRESENTATION METHODS ---------------- */
  getExecutiveData() {
    return this.data;
  }

  getCustomExecutiveSlides() {
    if (!this.data) return [];
    if (!Array.isArray(this.data.customExecutiveSlides)) {
      this.data.customExecutiveSlides = [];
    }
    return this.data.customExecutiveSlides;
  }

  saveCustomExecutiveSlide(slide) {
    if (!this.isAdmin()) {
      console.warn("Unauthorized: Only Admin can save custom executive slides.");
      return null;
    }
    if (!this.data) return null;
    if (!Array.isArray(this.data.customExecutiveSlides)) {
      this.data.customExecutiveSlides = [];
    }
    
    if (!slide.id) {
      slide.id = "exec_slide_" + Date.now();
    }
    
    const existingIdx = this.data.customExecutiveSlides.findIndex(s => s.id === slide.id);
    if (existingIdx >= 0) {
      this.data.customExecutiveSlides[existingIdx] = { ...this.data.customExecutiveSlides[existingIdx], ...slide };
    } else {
      this.data.customExecutiveSlides.push(slide);
    }
    
    this.saveAndSync();
    return slide;
  }

  deleteCustomExecutiveSlide(slideId) {
    if (!this.isAdmin()) {
      console.warn("Unauthorized: Only Admin can delete custom executive slides.");
      return false;
    }
    if (!this.data || !Array.isArray(this.data.customExecutiveSlides)) return false;
    const initialLen = this.data.customExecutiveSlides.length;
    this.data.customExecutiveSlides = this.data.customExecutiveSlides.filter(s => s.id !== slideId);
    if (this.data.customExecutiveSlides.length !== initialLen) {
      this.saveAndSync();
      return true;
    }
    return false;
  }

  updateSectionExecutiveData(secId, updateData) {
    if (!this.isAdmin()) {
      console.warn("Unauthorized: Only Admin can update section executive data.");
      return false;
    }
    if (!this.data || !Array.isArray(this.data.sections)) return false;
    const sec = this.data.sections.find(s => s.id === secId);
    if (!sec) return false;
    
    if (updateData.titleAr) sec.titleAr = updateData.titleAr;
    if (updateData.titleEn) sec.titleEn = updateData.titleEn;
    if (updateData.descriptionAr) sec.descriptionAr = updateData.descriptionAr;
    if (updateData.icon) sec.icon = updateData.icon;
    if (updateData.badgeColor) sec.badgeColor = updateData.badgeColor;
    if (updateData.executiveSummary) sec.executiveSummary = updateData.executiveSummary;
    if (Array.isArray(updateData.items)) sec.items = updateData.items;

    this.saveAndSync();
    return true;
  }

  addDeliverableToSection(secId, item) {
    if (!this.isAdmin()) {
      console.warn("Unauthorized: Only Admin can add deliverables to section.");
      return null;
    }
    if (!this.data || !Array.isArray(this.data.sections)) return null;
    const sec = this.data.sections.find(s => s.id === secId);
    if (!sec) return null;
    if (!Array.isArray(sec.items)) sec.items = [];

    const newItem = {
      id: item.id || `${secId}_item_${Date.now()}`,
      title: item.title || "مخرج تنفيذي جديد",
      text: item.text || item.title || "مخرج تنفيذي جديد",
      description: item.description || "",
      deliverableContent: item.deliverableContent || item.description || "",
      deliverables: item.deliverables || item.deliverableContent || "",
      status: item.status || "approved",
      progress: Number(item.progress) || 100,
      priority: item.priority || "high",
      taskType: item.taskType || "strategic_charter",
      assignedTo: item.assignedTo || "admin",
      milestoneDate: item.milestoneDate || "2026-Q4",
      kpiTarget: item.kpiTarget || "إنجاز واعتماد بنسبة 100%",
      notes: item.notes || ""
    };

    sec.items.push(newItem);
    this.saveAndSync();
    return newItem;
  }

  deleteDeliverableFromSection(secId, itemId) {
    if (!this.isAdmin()) {
      console.warn("Unauthorized: Only Admin can delete deliverables from section.");
      return false;
    }
    if (!this.data || !Array.isArray(this.data.sections)) return false;
    const sec = this.data.sections.find(s => s.id === secId);
    if (!sec || !Array.isArray(sec.items)) return false;

    const len = sec.items.length;
    sec.items = sec.items.filter(it => it.id !== itemId);
    if (sec.items.length !== len) {
      this.saveAndSync();
      return true;
    }
    return false;
  }
};
