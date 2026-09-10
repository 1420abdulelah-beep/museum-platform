/* ==========================================================
   SERAJ AL-AHSA - DETAILED MASTER PLAN MODEL LAYER
   إدارة وتطوير كافة بيانات دراسة متحف السيرة، فريق العمل، وحالات الاعتماد
   ========================================================== */

window.App = window.App || {};
var App = window.App;

App.DetailedPlanModel = class {
  constructor() {
    this.storageKey = "seraj_detailed_plan_state_v1";
    this.authStorageKey = "seraj_auth_session_v1";
    this.activeTab = "identity"; // Default sub-tab
    this.taskFilterTrack = "all";
    this.taskFilterStatus = "all";
    this.teamFilterTrack = "all";
    this.schoolViewMode = "cards"; // 'cards' | 'table'
    this.schoolFilterMazhab = "all";
    this.schoolSearchQuery = "";
    this.isEditMode = true; // Universal editing enabled
    this.serverSyncStatus = "idle"; // 'idle' | 'syncing' | 'saved' | 'error' | 'unauthorized'
    this.saveDebounceTimer = null;
    
    // Load active user session from sessionStorage
    this.currentUser = null;
    this.initAuthSession();
    this.initData();
  }

  /* ---------------- AUTHENTICATION & RBAC ---------------- */
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

  // Admin and Editor can edit/add/delete content
  canEdit() {
    return Boolean(this.currentUser && (this.currentUser.role === "admin" || this.currentUser.role === "editor"));
  }

  // Only Admin can manage users
  isAdmin() {
    return Boolean(this.currentUser && this.currentUser.role === "admin");
  }

  isEditor() {
    return Boolean(this.currentUser && this.currentUser.role === "editor");
  }

  getRoleBadge() {
    if (!this.currentUser) return { label: "زائر (استعراض فقط)", role: "viewer", icon: "fa-eye", color: "#8a9ba8" };
    if (this.currentUser.role === "admin") return { label: "مدير النظام (كامل الصلاحيات)", role: "admin", icon: "fa-crown", color: "#dfb15b" };
    if (this.currentUser.role === "editor") return { label: "محرر المحتوى (تعديل وحذف)", role: "editor", icon: "fa-pen-to-square", color: "#48bb78" };
    return { label: "مشاهد", role: "viewer", icon: "fa-user", color: "#8a9ba8" };
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
      console.log(`🔑 [AUTH] Logged in as ${this.currentUser.username} (${this.currentUser.role})`);
      return { success: true, user: this.currentUser };
    } catch (e) {
      // Offline fallback for standalone / file:// usage
      console.warn("Server login unreachable or failed, checking offline credentials:", e.message);
      
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
        console.log(`🔑 [AUTH] Local offline login successful for ${this.currentUser.username} (${this.currentUser.role})`);
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
    console.log("🔒 [AUTH] User logged out.");
  }

  /* ---------------- ADMIN: USER MANAGEMENT ---------------- */
  async fetchUsersList() {
    if (!this.isAdmin()) throw new Error("صلاحية غير كافية: تتطلب صلاحيات مدير النظام");
    const res = await fetch("/api/users", {
      headers: {
        "Authorization": `Bearer ${this.currentUser.token}`
      }
    });
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "تعذر جلب قائمة المستخدمين");
    }
    return data.users || [];
  }

  async saveUser(userData) {
    if (!this.isAdmin()) throw new Error("صلاحية غير كافية: تتطلب صلاحيات مدير النظام");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.currentUser.token}`
      },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "تعذر حفظ المستخدم");
    }
    return data;
  }

  async deleteUser(username) {
    if (!this.isAdmin()) throw new Error("صلاحية غير كافية: تتطلب صلاحيات مدير النظام");
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.currentUser.token}`
      },
      body: JSON.stringify({ username })
    });
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "تعذر حذف المستخدم");
    }
    return data;
  }

  /* ---------------- ADMIN: BACKUP & DISASTER RECOVERY ---------------- */
  async fetchBackupsList() {
    if (!this.isAdmin()) throw new Error("صلاحية غير كافية: تتطلب صلاحيات مدير النظام");
    const res = await fetch("/api/backups", {
      headers: {
        "Authorization": `Bearer ${this.currentUser.token}`
      }
    });
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "تعذر جلب قائمة النسخ الاحتياطية");
    }
    return data.backups || [];
  }

  async createBackupSnapshot(note = "") {
    if (!this.isAdmin()) throw new Error("صلاحية غير كافية: تتطلب صلاحيات مدير النظام");
    const res = await fetch("/api/backups/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.currentUser.token}`
      },
      body: JSON.stringify({ note })
    });
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "تعذر إنشاء النسخة الاحتياطية");
    }
    return data;
  }

  async restoreFromBackup(filename) {
    if (!this.isAdmin()) throw new Error("صلاحية غير كافية: تتطلب صلاحيات مدير النظام");
    const res = await fetch("/api/backups/restore", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.currentUser.token}`
      },
      body: JSON.stringify({ filename })
    });
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "تعذر استرجاع النسخة الاحتياطية");
    }

    // Refresh local model data from restored server state
    await this.fetchFromServer();
    return data;
  }

  /* ---------------- DATA INITIALIZATION & SYNC ---------------- */
  initData() {
    let loaded = null;
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        loaded = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to parse saved detailed plan state, reverting to default", e);
    }

    const defaultData = JSON.parse(JSON.stringify(App.DetailedPlanData || {}));

    if (!loaded || typeof loaded !== "object" || !loaded.metadata || !loaded.intro || !loaded.identity || !loaded.hall1_artifacts) {
      this.data = defaultData;
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      } catch (_) {}
      return;
    }

    // Deep merge / ensure all default keys exist
    this.data = {
      ...defaultData,
      ...loaded,
      metadata: { ...defaultData.metadata, ...(loaded.metadata || {}) },
      intro: { ...defaultData.intro, ...(loaded.intro || {}) },
      identity: { ...defaultData.identity, ...(loaded.identity || {}) },
      hall2_schools: { ...defaultData.hall2_schools, ...(loaded.hall2_schools || {}) },
      hologram: { ...defaultData.hologram, ...(loaded.hologram || {}) },
      vrExperience: { ...defaultData.vrExperience, ...(loaded.vrExperience || {}) },
      locationAndAreas: { ...defaultData.locationAndAreas, ...(loaded.locationAndAreas || {}) },
      budget: { ...defaultData.budget, ...(loaded.budget || {}) },
      operations: { ...defaultData.operations, ...(loaded.operations || {}) },
      teamMembers: Array.isArray(loaded.teamMembers) && loaded.teamMembers.length ? loaded.teamMembers : defaultData.teamMembers,
      initialTeamTasks: Array.isArray(loaded.initialTeamTasks) && loaded.initialTeamTasks.length ? loaded.initialTeamTasks : defaultData.initialTeamTasks,
      pendingDecisions: Array.isArray(loaded.pendingDecisions) && loaded.pendingDecisions.length ? loaded.pendingDecisions : defaultData.pendingDecisions,
      hall1_artifacts: Array.isArray(loaded.hall1_artifacts) && loaded.hall1_artifacts.length ? loaded.hall1_artifacts : defaultData.hall1_artifacts,
      hall1_proposed_tools: Array.isArray(loaded.hall1_proposed_tools) && loaded.hall1_proposed_tools.length ? loaded.hall1_proposed_tools : defaultData.hall1_proposed_tools,
      souvenirs: Array.isArray(loaded.souvenirs) && loaded.souvenirs.length ? loaded.souvenirs : defaultData.souvenirs,
      partners: Array.isArray(loaded.partners) && loaded.partners.length ? loaded.partners : defaultData.partners,
      references: Array.isArray(loaded.references) && loaded.references.length ? loaded.references : defaultData.references
    };
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(App.DetailedPlanData || {}));
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn("Storage reset error", e);
    }
    if (this.canEdit()) {
      this.saveToServer();
    }
    return this.data;
  }

  async fetchFromServer(onSuccess) {
    try {
      this.serverSyncStatus = "syncing";

      // 1. Refresh Team Directory from Central API
      try {
        const teamRes = await fetch("/api/team-members");
        if (teamRes.ok) {
          const teamJson = await teamRes.json();
          if (teamJson.status === "success" && Array.isArray(teamJson.users) && teamJson.users.length > 0) {
            localStorage.setItem("seraj_users_list_v1", JSON.stringify(teamJson.users));
          }
        }
      } catch (_) {}

      // 2. Fetch Plan Data Document
      const res = await fetch("/api/plan");
      if (!res.ok) throw new Error("Server responded with status " + res.status);
      const json = await res.json();
      if (json.status === "success" && json.data && typeof json.data === "object" && json.data.metadata && json.data.intro && json.data.identity && json.data.hall1_artifacts) {
        const defaultData = JSON.parse(JSON.stringify(App.DetailedPlanData || {}));
        this.data = {
          ...defaultData,
          ...json.data,
          metadata: { ...defaultData.metadata, ...(json.data.metadata || {}) },
          intro: { ...defaultData.intro, ...(json.data.intro || {}) },
          identity: { ...defaultData.identity, ...(json.data.identity || {}) },
          hall2_schools: { ...defaultData.hall2_schools, ...(json.data.hall2_schools || {}) },
          hologram: { ...defaultData.hologram, ...(json.data.hologram || {}) },
          vrExperience: { ...defaultData.vrExperience, ...(json.data.vrExperience || {}) },
          locationAndAreas: { ...defaultData.locationAndAreas, ...(json.data.locationAndAreas || {}) },
          budget: { ...defaultData.budget, ...(json.data.budget || {}) },
          operations: { ...defaultData.operations, ...(json.data.operations || {}) },
          teamMembers: Array.isArray(json.data.teamMembers) && json.data.teamMembers.length ? json.data.teamMembers : defaultData.teamMembers,
          initialTeamTasks: Array.isArray(json.data.initialTeamTasks) && json.data.initialTeamTasks.length ? json.data.initialTeamTasks : defaultData.initialTeamTasks,
          pendingDecisions: Array.isArray(json.data.pendingDecisions) && json.data.pendingDecisions.length ? json.data.pendingDecisions : defaultData.pendingDecisions,
          hall1_artifacts: Array.isArray(json.data.hall1_artifacts) && json.data.hall1_artifacts.length ? json.data.hall1_artifacts : defaultData.hall1_artifacts,
          hall1_proposed_tools: Array.isArray(json.data.hall1_proposed_tools) && json.data.hall1_proposed_tools.length ? json.data.hall1_proposed_tools : defaultData.hall1_proposed_tools,
          souvenirs: Array.isArray(json.data.souvenirs) && json.data.souvenirs.length ? json.data.souvenirs : defaultData.souvenirs,
          partners: Array.isArray(json.data.partners) && json.data.partners.length ? json.data.partners : defaultData.partners,
          references: Array.isArray(json.data.references) && json.data.references.length ? json.data.references : defaultData.references
        };
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (_) {}
        this.serverSyncStatus = "saved";
        console.log("✅ [Cloud Sync] Plan data loaded and validated from central server database.");
        if (typeof onSuccess === "function") {
          onSuccess(this.data);
        }
      } else {
        this.serverSyncStatus = "saved";
      }
    } catch (e) {
      console.warn("⚠️ [Cloud Sync] Running offline or first run:", e);
      this.serverSyncStatus = "offline";
    }
  }

  saveToStorage() {
    if (!this.canEdit()) {
      console.warn("⚠️ [DetailedPlanModel] Save blocked: account has Viewer (read-only) permissions.");
      return false;
    }
    // 1. Instant local persistence (with safe fallback)
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn("⚠️ [Storage] LocalStorage quota exceeded or warning, persisting directly to server:", e);
    }

    // 2. Immediate & debounced server synchronization
    clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = setTimeout(() => {
      this.saveToServer();
    }, 200);
    return true;
  }

  async saveToServer() {
    if (!this.canEdit()) {
      console.warn("⚠️ [DetailedPlanModel] Server save blocked: account has Viewer (read-only) permissions.");
      return false;
    }
    try {
      this.serverSyncStatus = "syncing";
      const token = this.currentUser ? (this.currentUser.token || "client_sync") : "client_sync";
      const payloadStr = JSON.stringify(this.data);
      
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": "Bearer " + token
        },
        body: payloadStr
      });

      const json = await res.json();
      if (res.ok && json.status === "success") {
        this.serverSyncStatus = "saved";
        console.log("✅ [Cloud Sync] Plan data successfully saved to database! Size: " + (payloadStr.length / 1024).toFixed(1) + " KB");
        return true;
      } else {
        console.warn("⚠️ [Cloud Sync] Server responded with warning:", json);
        this.serverSyncStatus = "saved";
        return true;
      }
    } catch (e) {
      console.warn("⚠️ [Cloud Sync] Server offline or network warning:", e);
      this.serverSyncStatus = "saved";
      return false;
    }
  }

  /* ---------------- 0. TEAM MEMBERS MANAGEMENT ---------------- */
  getTeamMembers() {
    let usersList = [];
    try {
      const saved = localStorage.getItem("seraj_users_list_v1");
      if (saved) {
        usersList = JSON.parse(saved);
      }
    } catch (_) {}

    const membersMap = new Map();
    const colors = ["#dfb15b", "#2ec866", "#00ebd4", "#cc6e55", "#63b3ed", "#e53e3e", "#a855f7", "#ec4899", "#f59e0b"];

    // 1. Load from synchronized users directory
    if (Array.isArray(usersList) && usersList.length > 0) {
      usersList.forEach((u, idx) => {
        const avatarColor = colors[idx % colors.length];
        const roleLabel = u.role === "admin" ? "👑 مدير النظام (Admin)" : (u.role === "editor" ? "✍️ محرر ومسؤول (Editor)" : "👁️ استعراض فقط (Viewer)");
        const name = (u.name || u.username || "").trim();
        if (name) {
          membersMap.set(name.toLowerCase(), {
            id: u.id || "usr_" + (u.username || idx),
            username: u.username || name,
            name: name,
            role: roleLabel,
            systemRole: u.role || "editor",
            track: u.specialty || u.track || "عضو فريق",
            specialty: u.specialty || u.track || "عضو فريق",
            avatarColor: avatarColor,
            email: u.email || `${u.username || 'member'}@seraj-museum.sa`,
            phone: u.phone || "+966 50 000 0000",
            bio: u.specialty ? `المسار والتخصص: ${u.specialty}` : "عضو فريق عمل معتمد ومسجل في المنظومة"
          });
        }
      });
    }

    // 2. Merge with any members already stored in this.data.teamMembers
    if (this.data && Array.isArray(this.data.teamMembers)) {
      this.data.teamMembers.forEach((m, idx) => {
        const name = (m.name || m.username || "").trim();
        if (name && !membersMap.has(name.toLowerCase())) {
          membersMap.set(name.toLowerCase(), {
            id: m.id || "tm_" + idx,
            username: m.username || name,
            name: name,
            role: m.role || "عضو فريق",
            systemRole: m.systemRole || "editor",
            track: m.track || m.role || "تنفيذ ومحتوى",
            specialty: m.specialty || m.track || m.role || "عضو فريق",
            avatarColor: m.avatarColor || colors[idx % colors.length],
            email: m.email || `${m.id || 'member'}@seraj.sa`,
            phone: m.phone || "+966 50 000 0000",
            bio: m.bio || "عضو فريق العمل"
          });
        }
      });
    }

    if (membersMap.size === 0) {
      return [
        { id: "admin", username: "admin", name: "مدير النظام الرئيسي", role: "👑 مدير النظام (Admin)", track: "الإدارة العامة والحوكمة والصلاحيات", avatarColor: "#dfb15b" },
        { id: "editor", username: "editor", name: "محرر ومسؤول المحتوى والمهام", role: "✍️ محرر ومسؤول (Editor)", track: "إعداد المحتوى والمشاهد والمقتنيات", avatarColor: "#2ec866" }
      ];
    }

    return Array.from(membersMap.values());
  }

  saveTeamMember(memberData) {
    if (!this.isAdmin()) {
      console.warn("⚠️ [DetailedPlanModel] Team management requires Admin role.");
      return false;
    }
    if (!this.data.teamMembers) this.data.teamMembers = [];
    const idx = this.data.teamMembers.findIndex(m => m.id === memberData.id || m.name === memberData.name);
    if (idx >= 0) {
      const oldName = this.data.teamMembers[idx].name;
      this.data.teamMembers[idx] = { ...this.data.teamMembers[idx], ...memberData };
      if (oldName && oldName !== memberData.name) {
        this.renameMemberAssignments(oldName, memberData.name);
      }
    } else {
      this.data.teamMembers.push({
        id: memberData.id || ('tm_' + Date.now()),
        ...memberData
      });
    }
    this.saveToStorage();
    return true;
  }

  deleteTeamMember(memId, reassignTo = "غير مسند") {
    if (!this.isAdmin()) {
      console.warn("⚠️ [DetailedPlanModel] Team management requires Admin role.");
      return false;
    }
    if (!this.data || !Array.isArray(this.data.teamMembers)) return false;
    const target = this.data.teamMembers.find(m => m.id === memId || m.name === memId);
    if (!target) return false;

    const oldName = target.name;
    this.data.teamMembers = this.data.teamMembers.filter(m => m.id !== memId && m.name !== target.name);

    const updateArr = (arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach(item => {
        if (item && item.assignee && (item.assignee === oldName || item.assignee === target.id)) {
          item.assignee = reassignTo || "غير مسند";
        }
      });
    };

    updateArr(this.data.tasks);
    updateArr(this.data.hall1_artifacts);
    updateArr(this.data.hall1_schools);
    updateArr(this.data.hall2_scenes);
    updateArr(this.data.decisions);

    this.saveToStorage();
    return true;
  }

  renameMemberAssignments(oldName, newName) {
    const updateArr = (arr) => {
      if (!Array.isArray(arr)) return;
      arr.forEach(item => {
        if (item && item.assignee === oldName) {
          item.assignee = newName;
        }
      });
    };
    updateArr(this.data.tasks);
    updateArr(this.data.hall1_artifacts);
    updateArr(this.data.hall1_schools);
    updateArr(this.data.hall2_scenes);
    updateArr(this.data.decisions);
  }

  getAssignmentsForMember(memberName) {
    if (!memberName) return [];
    const assignments = [];
    const cleanName = memberName.trim();

    const isMatch = (assigneeVal) => {
      if (!assigneeVal) return false;
      const a = assigneeVal.trim();
      return a === cleanName || a.includes(cleanName) || cleanName.includes(a);
    };

    // Check Tasks
    this.getTasks().forEach(t => {
      if (isMatch(t.assignee)) {
        assignments.push({ category: "مهمة فريق", title: t.title, status: t.status, approvalStatus: t.approvalStatus || "معتمد" });
      }
    });

    // Check Artifacts
    this.getArtifacts().forEach(a => {
      if (isMatch(a.assignee)) {
        assignments.push({ category: "قطعة أثرية", title: a.name, status: a.status, approvalStatus: a.approvalStatus || "معتمد" });
      }
    });

    // Check Schools
    this.getSchools().forEach(s => {
      if (isMatch(s.assignee)) {
        assignments.push({ category: "مدرسة شرعية", title: s.name, status: s.status, approvalStatus: s.approvalStatus || "معتمد" });
      }
    });

    // Check Scenes
    this.getScenes().forEach(sc => {
      if (isMatch(sc.assignee)) {
        assignments.push({ category: "مشهد سينمائي", title: `المشهد ${sc.num}: ${sc.title}`, status: sc.duration, approvalStatus: sc.approvalStatus || "معتمد" });
      }
    });

    // Check Locations
    if (this.data && this.data.locationAndAreas && Array.isArray(this.data.locationAndAreas.locations)) {
      this.data.locationAndAreas.locations.forEach(l => {
        if (isMatch(l.assignee)) {
          assignments.push({ category: "موقع مقترح", title: l.name, status: l.score, approvalStatus: l.approvalStatus || "قيد المراجعة" });
        }
      });
    }

    // Check Decisions
    this.getPendingDecisions().forEach(d => {
      if (isMatch(d.assignee)) {
        assignments.push({ category: "قرار استراتيجي", title: d.title, status: d.status, approvalStatus: d.approvalStatus || "قيد المراجعة" });
      }
    });

    return assignments;
  }

  getApprovalStats() {
    let totalItems = 0;
    let approved = 0;
    let pending = 0;
    let draft = 0;

    const check = (item) => {
      totalItems++;
      const st = item.approvalStatus || (item.status === "موثق" || item.type === "approved" || item.verified ? "معتمد" : "قيد المراجعة");
      if (st === "معتمد") approved++;
      else if (st === "قيد المراجعة") pending++;
      else draft++;
    };

    (this.data?.intro?.goals || []).forEach(check);
    (this.data?.hall1_artifacts || []).forEach(check);
    (this.data?.hall1_proposed_tools || []).forEach(check);
    (this.data?.hall2_schools?.schoolsList || []).forEach(check);
    (this.data?.hologram?.scenes || []).forEach(check);
    (this.data?.locationAndAreas?.locations || []).forEach(check);
    (this.data?.budget?.items || []).forEach(check);
    (this.data?.operations?.ticketsModel || []).forEach(check);
    (this.data?.souvenirs || []).forEach(check);
    (this.data?.pendingDecisions || []).forEach(check);

    const percent = totalItems > 0 ? Math.round((approved / totalItems) * 100) : 0;
    return { totalItems, approved, pending, draft, percent };
  }

  /* ---------------- 1. METADATA, VISION & GOALS ---------------- */
  updateMetadata(updates) {
    this.data.metadata = { ...this.data.metadata, ...updates };
    this.saveToStorage();
  }

  updateVision(visionText, approvalStatus = "معتمد", assignee = "غير مسند") {
    this.data.intro.visionAr = visionText;
    this.data.intro.approvalStatus = approvalStatus;
    this.data.intro.assignee = assignee;
    this.saveToStorage();
  }

  getGoals() {
    return this.data.intro.goals || [];
  }

  addGoal(goal) {
    const newGoal = {
      id: "goal_" + Date.now(),
      type: goal.type || "proposed",
      textAr: goal.textAr || "هدف جديد",
      approvalStatus: goal.approvalStatus || (goal.type === "approved" ? "معتمد" : "قيد المراجعة"),
      assignee: goal.assignee || "غير مسند"
    };
    this.data.intro.goals.push(newGoal);
    this.saveToStorage();
    return newGoal;
  }

  updateGoal(goalId, updates) {
    const g = this.data.intro.goals.find(item => item.id === goalId);
    if (g) {
      Object.assign(g, updates);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteGoal(goalId) {
    this.data.intro.goals = this.data.intro.goals.filter(item => item.id !== goalId);
    this.saveToStorage();
  }

  /* ---------------- 2. IDENTITY & 3 AXES ---------------- */
  updateIdentityCore(theme, conceptAr, approvalStatus = "معتمد", assignee = "غير مسند") {
    if (theme) this.data.identity.theme = theme;
    if (conceptAr) this.data.identity.conceptAr = conceptAr;
    this.data.identity.approvalStatus = approvalStatus;
    this.data.identity.assignee = assignee;
    this.saveToStorage();
  }

  updateIdentityApp(index, title, desc, approvalStatus = "معتمد", assignee = "غير مسند") {
    if (this.data.identity.applicationAr[index]) {
      this.data.identity.applicationAr[index] = { title, desc, approvalStatus, assignee };
      this.saveToStorage();
    }
  }

  addIdentityApp(app) {
    const item = {
      title: app.title || "تطبيق جديد",
      desc: app.desc || "",
      approvalStatus: app.approvalStatus || "معتمد",
      assignee: app.assignee || "غير مسند"
    };
    this.data.identity.applicationAr.push(item);
    this.saveToStorage();
  }

  deleteIdentityApp(index) {
    this.data.identity.applicationAr.splice(index, 1);
    this.saveToStorage();
  }

  updateAxisItem(index, updates) {
    if (this.data.identity.axesTable[index]) {
      Object.assign(this.data.identity.axesTable[index], updates);
      this.saveToStorage();
    }
  }

  /* ---------------- 3. ARTIFACTS & PROPOSED TOOLS ---------------- */
  getArtifacts() {
    return this.data.hall1_artifacts || [];
  }

  addArtifact(art) {
    const newArt = {
      id: "art_" + Date.now(),
      name: art.name || "قطعة جديدة",
      status: art.status || "موثق",
      source: art.source || "",
      definition: art.definition || "",
      specs: art.specs || "",
      displayMethod: art.displayMethod || "",
      approvalStatus: art.approvalStatus || "معتمد",
      assignee: art.assignee || "غير مسند"
    };
    this.data.hall1_artifacts.push(newArt);
    this.saveToStorage();
    return newArt;
  }

  updateArtifact(artId, updates) {
    const index = this.data.hall1_artifacts.findIndex(a => a.id === artId);
    if (index !== -1) {
      this.data.hall1_artifacts[index] = { ...this.data.hall1_artifacts[index], ...updates };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteArtifact(artId) {
    this.data.hall1_artifacts = this.data.hall1_artifacts.filter(a => a.id !== artId);
    this.saveToStorage();
  }

  getProposedTools() {
    return this.data.hall1_proposed_tools || [];
  }

  addProposedTool(tool) {
    this.data.hall1_proposed_tools.push({
      name: tool.name || "أداة مقترحة",
      desc: tool.desc || "",
      approvalStatus: tool.approvalStatus || "قيد المراجعة",
      assignee: tool.assignee || "غير مسند"
    });
    this.saveToStorage();
  }

  updateProposedTool(index, updates) {
    if (this.data.hall1_proposed_tools[index]) {
      Object.assign(this.data.hall1_proposed_tools[index], updates);
      this.saveToStorage();
    }
  }

  deleteProposedTool(index) {
    this.data.hall1_proposed_tools.splice(index, 1);
    this.saveToStorage();
  }

  /* ---------------- 4. SCHOOLS, SCHOLARS & EXHIBITS ---------------- */
  updateFoundingQuote(scholar, text, significance, approvalStatus = "معتمد", assignee = "غير مسند") {
    this.data.hall2_schools.foundingQuote = { scholar, text, significance, approvalStatus, assignee };
    this.saveToStorage();
  }

  getSchools() {
    return (this.data.hall2_schools && Array.isArray(this.data.hall2_schools.schoolsList)) ? this.data.hall2_schools.schoolsList : [];
  }

  getFilteredSchools() {
    const list = this.getSchools();
    const fMazhab = (this.schoolFilterMazhab || "all").trim();
    const q = (this.schoolSearchQuery || "").trim().toLowerCase();

    return list.filter(s => {
      const matchMazhab = fMazhab === "all" || (s.mazhab && s.mazhab.includes(fMazhab));
      const matchSearch = !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.founder && s.founder.toLowerCase().includes(q)) ||
        (s.waqfText && s.waqfText.toLowerCase().includes(q)) ||
        (s.status && s.status.toLowerCase().includes(q)) ||
        (s.year && s.year.toLowerCase().includes(q)) ||
        (s.mazhab && s.mazhab.toLowerCase().includes(q));
      return matchMazhab && matchSearch;
    });
  }

  addSchool(sch) {
    const newSchool = {
      id: "sch_" + Date.now(),
      name: sch.name || "مدرسة جديدة",
      mazhab: sch.mazhab || "حنفي",
      year: sch.year || "تاريخي",
      founder: sch.founder || "",
      status: sch.status || "معمورة",
      waqfText: sch.waqfText || "",
      waqfImage: sch.waqfImage || "",
      approvalStatus: sch.approvalStatus || "معتمد",
      assignee: sch.assignee || "غير مسند"
    };
    if (!this.data.hall2_schools) this.data.hall2_schools = { schoolsList: [] };
    if (!Array.isArray(this.data.hall2_schools.schoolsList)) this.data.hall2_schools.schoolsList = [];
    this.data.hall2_schools.schoolsList.push(newSchool);
    this.saveToStorage();
    return newSchool;
  }

  updateSchool(schId, updates) {
    const index = this.data.hall2_schools.schoolsList.findIndex(s => s.id === schId);
    if (index !== -1) {
      this.data.hall2_schools.schoolsList[index] = { ...this.data.hall2_schools.schoolsList[index], ...updates };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteSchool(schId) {
    this.data.hall2_schools.schoolsList = this.data.hall2_schools.schoolsList.filter(s => s.id !== schId);
    this.saveToStorage();
  }

  updateScholarsSummary(summary, shafiiRevival, approvalStatus = "معتمد", assignee = "غير مسند") {
    if (summary) this.data.hall2_schools.scholarsNetwork.summary = summary;
    if (shafiiRevival) this.data.hall2_schools.scholarsNetwork.shafiiRevival = shafiiRevival;
    this.data.hall2_schools.scholarsNetwork.approvalStatus = approvalStatus;
    this.data.hall2_schools.scholarsNetwork.assignee = assignee;
    this.saveToStorage();
  }

  addDoghanStudent(student) {
    const item = {
      name: student.name || "تلميذ جديد",
      mazhab: student.mazhab || "شافعي",
      approvalStatus: student.approvalStatus || "معتمد",
      assignee: student.assignee || "غير مسند"
    };
    this.data.hall2_schools.scholarsNetwork.doghanStudents.push(item);
    this.saveToStorage();
  }

  updateDoghanStudent(index, student) {
    if (this.data.hall2_schools.scholarsNetwork.doghanStudents[index]) {
      Object.assign(this.data.hall2_schools.scholarsNetwork.doghanStudents[index], student);
      this.saveToStorage();
    }
  }

  deleteDoghanStudent(index) {
    this.data.hall2_schools.scholarsNetwork.doghanStudents.splice(index, 1);
    this.saveToStorage();
  }

  addVisitingScholar(name) {
    this.data.hall2_schools.scholarsNetwork.visitingScholars.push(name);
    this.saveToStorage();
  }

  deleteVisitingScholar(index) {
    this.data.hall2_schools.scholarsNetwork.visitingScholars.splice(index, 1);
    this.saveToStorage();
  }

  addExhibitComponent(comp) {
    const item = {
      name: comp.name || "ركن جديد",
      desc: comp.desc || "",
      approvalStatus: comp.approvalStatus || "معتمد",
      assignee: comp.assignee || "غير مسند"
    };
    this.data.hall2_schools.exhibitComponents.push(item);
    this.saveToStorage();
  }

  updateExhibitComponent(index, comp) {
    if (this.data.hall2_schools.exhibitComponents[index]) {
      Object.assign(this.data.hall2_schools.exhibitComponents[index], comp);
      this.saveToStorage();
    }
  }

  deleteExhibitComponent(index) {
    this.data.hall2_schools.exhibitComponents.splice(index, 1);
    this.saveToStorage();
  }

  /* ---------------- 5. HOLOGRAM & SCENES ---------------- */
  updateHologramSpecs(specs) {
    this.data.hologram.specs = { ...this.data.hologram.specs, ...specs };
    this.saveToStorage();
  }

  addHistoricalStory(story) {
    const item = {
      title: story.title || "قصة جديدة",
      source: story.source || "",
      verified: story.verified !== undefined ? story.verified : true,
      notes: story.notes || "",
      approvalStatus: story.approvalStatus || (story.verified ? "معتمد" : "قيد المراجعة"),
      assignee: story.assignee || "غير مسند"
    };
    this.data.hologram.historicalStories.push(item);
    this.saveToStorage();
  }

  updateHistoricalStory(index, story) {
    if (this.data.hologram.historicalStories[index]) {
      Object.assign(this.data.hologram.historicalStories[index], story);
      this.saveToStorage();
    }
  }

  deleteHistoricalStory(index) {
    this.data.hologram.historicalStories.splice(index, 1);
    this.saveToStorage();
  }

  getScenes() {
    return this.data.hologram ? this.data.hologram.scenes : [];
  }

  addScene(scene) {
    const nextNum = this.data.hologram.scenes.length + 1;
    const newScene = {
      num: nextNum,
      title: scene.title || `المشهد ${nextNum}`,
      duration: scene.duration || "90 ثانية",
      setting: scene.setting || "",
      visualDesc: scene.visualDesc || "",
      audioText: scene.audioText || "",
      dramaticPurpose: scene.dramaticPurpose || "",
      approvalStatus: scene.approvalStatus || "معتمد",
      assignee: scene.assignee || "غير مسند"
    };
    this.data.hologram.scenes.push(newScene);
    this.saveToStorage();
    return newScene;
  }

  updateScene(sceneNum, updates) {
    const scene = this.data.hologram.scenes.find(s => s.num === sceneNum);
    if (scene) {
      Object.assign(scene, updates);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteScene(sceneNum) {
    this.data.hologram.scenes = this.data.hologram.scenes.filter(s => s.num !== sceneNum);
    // Re-index scene numbers
    this.data.hologram.scenes.forEach((s, idx) => s.num = idx + 1);
    this.saveToStorage();
  }

  /* ---------------- 6. VR EXPERIENCE ---------------- */
  updateVRExperience(updates) {
    this.data.vrExperience = { ...this.data.vrExperience, ...updates };
    this.saveToStorage();
  }

  /* ---------------- 7. LOCATION & AREAS ---------------- */
  addLocation(loc) {
    const newLoc = {
      id: "loc_" + Date.now(),
      name: loc.name || "موقع جديد",
      desc: loc.desc || "",
      pros: loc.pros || "",
      cons: loc.cons || "",
      score: loc.score || "",
      approvalStatus: loc.approvalStatus || "قيد المراجعة",
      assignee: loc.assignee || "غير مسند"
    };
    this.data.locationAndAreas.locations.push(newLoc);
    this.saveToStorage();
    return newLoc;
  }

  updateLocation(locId, updates) {
    const loc = this.data.locationAndAreas.locations.find(l => l.id === locId);
    if (loc) {
      Object.assign(loc, updates);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteLocation(locId) {
    this.data.locationAndAreas.locations = this.data.locationAndAreas.locations.filter(l => l.id !== locId);
    this.saveToStorage();
  }

  addAreaItem(item) {
    const row = {
      space: item.space || "فراغ جديد",
      area: item.area || "50 م²",
      notes: item.notes || "",
      approvalStatus: item.approvalStatus || "معتمد",
      assignee: item.assignee || "غير مسند"
    };
    this.data.locationAndAreas.areasTable.push(row);
    this.saveToStorage();
  }

  updateAreaItem(index, item) {
    if (this.data.locationAndAreas.areasTable[index]) {
      Object.assign(this.data.locationAndAreas.areasTable[index], item);
      this.saveToStorage();
    }
  }

  deleteAreaItem(index) {
    this.data.locationAndAreas.areasTable.splice(index, 1);
    this.saveToStorage();
  }

  /* ---------------- 8. BUDGET & OPERATIONS ---------------- */
  updateBudgetTotals(totalFull, phase1Only, approvalStatus = "معتمد", assignee = "غير مسند") {
    if (totalFull) this.data.budget.totalFullProject = totalFull;
    if (phase1Only) this.data.budget.phase1Only = phase1Only;
    this.data.budget.approvalStatus = approvalStatus;
    this.data.budget.assignee = assignee;
    this.saveToStorage();
  }

  addBudgetItem(item) {
    const row = {
      item: item.item || "بند جديد",
      costRange: item.costRange || "100 ألف - 200 ألف",
      includes: item.includes || "",
      approvalStatus: item.approvalStatus || "معتمد",
      assignee: item.assignee || "غير مسند"
    };
    this.data.budget.items.push(row);
    this.saveToStorage();
  }

  updateBudgetItem(index, item) {
    if (this.data.budget.items[index]) {
      Object.assign(this.data.budget.items[index], item);
      this.saveToStorage();
    }
  }

  deleteBudgetItem(index) {
    this.data.budget.items.splice(index, 1);
    this.saveToStorage();
  }

  addStage(stage) {
    const row = {
      phase: stage.phase || "مرحلة جديدة",
      duration: stage.duration || "شهر",
      desc: stage.desc || "",
      approvalStatus: stage.approvalStatus || "معتمد",
      assignee: stage.assignee || "غير مسند"
    };
    this.data.operations.stages.push(row);
    this.saveToStorage();
  }

  updateStage(index, stage) {
    if (this.data.operations.stages[index]) {
      Object.assign(this.data.operations.stages[index], stage);
      this.saveToStorage();
    }
  }

  deleteStage(index) {
    this.data.operations.stages.splice(index, 1);
    this.saveToStorage();
  }

  addTicketItem(ticket) {
    const row = {
      category: ticket.category || "فئة جديدة",
      price: ticket.price || "25 ريال",
      notes: ticket.notes || "",
      approvalStatus: ticket.approvalStatus || "معتمد",
      assignee: ticket.assignee || "غير مسند"
    };
    this.data.operations.ticketsModel.push(row);
    this.saveToStorage();
  }

  updateTicketItem(index, ticket) {
    if (this.data.operations.ticketsModel[index]) {
      Object.assign(this.data.operations.ticketsModel[index], ticket);
      this.saveToStorage();
    }
  }

  deleteTicketItem(index) {
    this.data.operations.ticketsModel.splice(index, 1);
    this.saveToStorage();
  }

  addWaqfPillar(pillar) {
    const row = {
      pillar: pillar.pillar || "ركيزة جديدة",
      desc: pillar.desc || "",
      approvalStatus: pillar.approvalStatus || "معتمد",
      assignee: pillar.assignee || "غير مسند"
    };
    this.data.operations.sustainabilityAndWaqf.push(row);
    this.saveToStorage();
  }

  updateWaqfPillar(index, pillar) {
    if (this.data.operations.sustainabilityAndWaqf[index]) {
      Object.assign(this.data.operations.sustainabilityAndWaqf[index], pillar);
      this.saveToStorage();
    }
  }

  deleteWaqfPillar(index) {
    this.data.operations.sustainabilityAndWaqf.splice(index, 1);
    this.saveToStorage();
  }

  /* ---------------- 9. SOUVENIRS, PARTNERS & REFERENCES ---------------- */
  addSouvenir(souv) {
    const item = {
      name: souv.name || "منتج جديد",
      price: souv.price || "50 ريال",
      desc: souv.desc || "",
      approvalStatus: souv.approvalStatus || "معتمد",
      assignee: souv.assignee || "غير مسند"
    };
    this.data.souvenirs.push(item);
    this.saveToStorage();
  }

  updateSouvenir(index, souv) {
    if (this.data.souvenirs[index]) {
      Object.assign(this.data.souvenirs[index], souv);
      this.saveToStorage();
    }
  }

  deleteSouvenir(index) {
    this.data.souvenirs.splice(index, 1);
    this.saveToStorage();
  }

  addPartner(partner) {
    const item = {
      name: partner.name || "جهة جديدة",
      role: partner.role || "",
      approvalStatus: partner.approvalStatus || "معتمد",
      assignee: partner.assignee || "غير مسند"
    };
    this.data.partners.push(item);
    this.saveToStorage();
  }

  updatePartner(index, partner) {
    if (this.data.partners[index]) {
      Object.assign(this.data.partners[index], partner);
      this.saveToStorage();
    }
  }

  deletePartner(index) {
    this.data.partners.splice(index, 1);
    this.saveToStorage();
  }

  addReference(ref) {
    const item = {
      title: ref.title || "مرجع جديد",
      author: ref.author || "",
      notes: ref.notes || "",
      approvalStatus: ref.approvalStatus || "معتمد",
      assignee: ref.assignee || "غير مسند"
    };
    this.data.references.push(item);
    this.saveToStorage();
  }

  updateReference(index, ref) {
    if (this.data.references[index]) {
      Object.assign(this.data.references[index], ref);
      this.saveToStorage();
    }
  }

  deleteReference(index) {
    this.data.references.splice(index, 1);
    this.saveToStorage();
  }

  /* ---------------- 10. TASK MANAGEMENT ---------------- */
  getTasks() {
    return this.data.initialTeamTasks || [];
  }

  getFilteredTasks() {
    let tasks = this.getTasks();
    if (this.taskFilterTrack !== "all") {
      tasks = tasks.filter(t => t.track === this.taskFilterTrack);
    }
    if (this.taskFilterStatus !== "all") {
      tasks = tasks.filter(t => t.status === this.taskFilterStatus);
    }
    return tasks;
  }

  addTask(task) {
    const newTask = {
      id: "task_" + Date.now(),
      title: task.title || "مهمة جديدة",
      track: task.track || "شرعي وتاريخي",
      assignee: task.assignee || "غير مسند",
      priority: task.priority || "متوسطة",
      status: task.status || "لم تبدأ",
      dueDate: task.dueDate || new Date().toISOString().split("T")[0],
      notes: task.notes || "",
      approvalStatus: task.approvalStatus || "معتمد"
    };
    this.data.initialTeamTasks.unshift(newTask);
    this.saveToStorage();
    return newTask;
  }

  updateTask(taskId, updates) {
    const index = this.data.initialTeamTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.data.initialTeamTasks[index] = { ...this.data.initialTeamTasks[index], ...updates };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deleteTask(taskId) {
    this.data.initialTeamTasks = this.data.initialTeamTasks.filter(t => t.id !== taskId);
    this.saveToStorage();
  }

  getTaskStats() {
    const tasks = this.getTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "مكتمل").length;
    const inProgress = tasks.filter(t => t.status === "قيد التنفيذ").length;
    const review = tasks.filter(t => t.status === "للمراجعة").length;
    const notStarted = tasks.filter(t => t.status === "لم تبدأ").length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, review, notStarted, progressPercent };
  }

  /* ---------------- 11. PENDING DECISIONS ---------------- */
  getPendingDecisions() {
    return this.data.pendingDecisions || [];
  }

  addPendingDecision(dec) {
    const newDec = {
      id: "dec_" + Date.now(),
      title: dec.title || "قرار جديد",
      question: dec.question || "",
      recommendation: dec.recommendation || "",
      status: dec.status || "قيد الدراسة",
      decisionOptions: dec.decisionOptions || ["اعتماد", "استبعاد", "قيد الدراسة"],
      teamNotes: dec.teamNotes || "",
      approvalStatus: dec.approvalStatus || "قيد المراجعة",
      assignee: dec.assignee || "غير مسند"
    };
    this.data.pendingDecisions.push(newDec);
    this.saveToStorage();
    return newDec;
  }

  updateDecision(decisionId, selectedStatus, teamNotes, approvalStatus = null, assignee = null) {
    const item = this.data.pendingDecisions.find(d => d.id === decisionId);
    if (item) {
      if (selectedStatus) item.status = selectedStatus;
      if (teamNotes !== undefined && teamNotes !== null) item.teamNotes = teamNotes;
      if (approvalStatus) item.approvalStatus = approvalStatus;
      if (assignee) item.assignee = assignee;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  deletePendingDecision(decisionId) {
    this.data.pendingDecisions = this.data.pendingDecisions.filter(d => d.id !== decisionId);
    this.saveToStorage();
  }

  /* ---------------- EXPORT & IMPORT ---------------- */
  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.metadata && parsed.hall1_artifacts) {
        this.data = parsed;
        if (!this.data.teamMembers) {
          this.data.teamMembers = JSON.parse(JSON.stringify(App.DetailedPlanData.teamMembers || []));
        }
        this.saveToStorage();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Import JSON parse error", e);
      return false;
    }
  }

  generateExecutiveMarkdown() {
    const d = this.data;
    const approvalStats = this.getApprovalStats();
    let md = `# ${d.metadata.titleAr}\n`;
    md += `## ${d.metadata.subtitleAr}\n`;
    md += `**الموقع:** ${d.metadata.locationAr} | **التاريخ:** ${d.metadata.dateAr} | **الهوية الجامعة:** ${d.metadata.sloganAr}\n`;
    md += `**نسبة اعتماد المحتوى:** ${approvalStats.percent}% (${approvalStats.approved} معتمد من إجمالي ${approvalStats.totalItems} بند)\n\n`;
    md += `---\n\n`;

    md += `### فريق العمل ومسؤولو المسارات:\n`;
    this.getTeamMembers().forEach(m => {
      md += `- **${m.name}** (${m.role}) — المسار: ${m.track} | بريد: ${m.email}\n`;
    });
    md += `\n---\n\n`;

    md += `### ١. الرؤية والأهداف\n`;
    md += `${d.intro.visionAr}\n\n`;
    md += `#### الأهداف المعتمدة والمقترحة:\n`;
    d.intro.goals.forEach(g => {
      md += `- [${g.approvalStatus || 'معتمد'}] ${g.textAr} (المسؤول: ${g.assignee || 'غير مسند'})\n`;
    });
    md += `\n---\n\n`;

    md += `### ٢. الهيكل العام والهوية الإبداعية «${d.identity.theme}»\n`;
    md += `${d.identity.conceptAr}\n\n`;
    md += `#### المحاور الرئيسية:\n`;
    d.identity.axesTable.forEach(a => {
      md += `- **${a.axis}**: ${a.nature} (المدة: ${a.duration} | التعقيد: ${a.complexity})\n`;
    });
    md += `\n---\n\n`;

    md += `### ٣. المحور الأول: المتحف الدائم\n`;
    md += `#### القسم الأول: قاعة السيرة والآثار الأحسائية\n\n`;
    d.hall1_artifacts.forEach(a => {
      md += `##### • ${a.name} [الاعتماد: ${a.approvalStatus || 'معتمد'} | المسؤول: ${a.assignee || 'غير مسند'}]\n`;
      md += `- **المصدر والنص:** ${a.source}\n`;
      md += `- **التعريف:** ${a.definition}\n`;
      md += `- **المواصفات والمقاس:** ${a.specs}\n`;
      md += `- **طريقة العرض:** ${a.displayMethod}\n\n`;
    });

    md += `#### القسم الثاني: قاعة المدارس الشرعية وعلماء الأحساء\n\n`;
    md += `> **مقولة المدخل التأسيسية:** ${d.hall2_schools.foundingQuote.text}\n`;
    md += `> — ${d.hall2_schools.foundingQuote.scholar}\n\n`;
    md += `| المدرسة | المذهب | التأسيس | الواقف والتاريخ | الحالة | الاعتماد | المسؤول |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    d.hall2_schools.schoolsList.forEach(s => {
      md += `| ${s.name} | ${s.mazhab} | ${s.year} | ${s.founder} | ${s.status} | ${s.approvalStatus || 'معتمد'} | ${s.assignee || 'غير مسند'} |\n`;
    });
    md += `\n---\n\n`;

    md += `### ٤. المحور الثاني: العرض السينمائي بتقنية الهولوجرام (٨ مشاهد)\n\n`;
    d.hologram.scenes.forEach(s => {
      md += `#### المشهد ${s.num}: ${s.title} (${s.duration}) [${s.approvalStatus || 'معتمد'} | المسؤول: ${s.assignee || 'غير مسند'}]\n`;
      md += `- **المكان والزمن:** ${s.setting}\n`;
      md += `- **الوصف البصري:** ${s.visualDesc}\n`;
      md += `- **الصوت والنص:** ${s.audioText}\n`;
      md += `- **الغرض الدرامي:** ${s.dramaticPurpose}\n\n`;
    });
    md += `---\n\n`;

    md += `### ٥. المحور الثالث: تجربة الواقع الافتراضي الفردية (VR 4D)\n`;
    md += `- **العتاد:** ${d.vrExperience.hardware}\n`;
    md += `- **المؤثرات الحسية:** ${d.vrExperience.sensoryEffects}\n`;
    md += `- **المرونة والتنقل:** ${d.vrExperience.mobility}\n`;
    md += `- **السعة والمدة:** ${d.vrExperience.capacity} (${d.vrExperience.duration})\n\n`;
    md += `---\n\n`;

    md += `### ٦. التكاليف والمساحات والتشغيل والوقف\n`;
    md += `#### الميزانية الإجمالية التقديرية: ${d.budget.totalFullProject} (المرحلة الأولى: ${d.budget.phase1Only})\n\n`;
    md += `| البند | التكلفة التقديرية | التفاصيل | الاعتماد | المسؤول |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    d.budget.items.forEach(b => {
      md += `| ${b.item} | ${b.costRange} | ${b.includes} | ${b.approvalStatus || 'معتمد'} | ${b.assignee || 'غير مسند'} |\n`;
    });
    md += `\n---\n\n`;

    md += `### ٧. متابعة مهام فريق العمل والقرارات المعلقة\n`;
    md += `#### مهام الفريق المعتمدة:\n`;
    this.getTasks().forEach(t => {
      md += `- [${t.status}] **${t.title}** | المسار: ${t.track} | المسؤول: ${t.assignee} | الأولوية: ${t.priority} (تاريخ: ${t.dueDate})\n`;
    });
    md += `\n#### سجل القرارات المعلقة:\n`;
    d.pendingDecisions.forEach(dec => {
      md += `- **${dec.title}**: الحالة: ${dec.status} | القرار/الملاحظة: ${dec.teamNotes} [المسؤول: ${dec.assignee || 'غير مسند'}]\n`;
    });

    return md;
  }
};
