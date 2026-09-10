/* ==========================================================
   SERAJ AL-AHSA - UNIFIED PLATFORM SECURITY & AUTH GUARD
   نظام حماية مركزي موحد يمنع أي دخول لكامل المنصة دون صلاحية
   ========================================================== */

window.App = window.App || {};

(function() {
  const AUTH_STORAGE_KEY = "seraj_unified_auth_session_v1";

  class AuthGuard {
    constructor() {
      this.storageKey = AUTH_STORAGE_KEY;
      this.currentUser = this.loadSession();
      this.offlineUsers = [
        {
                "username": "admin",
                "name": "بوعبدالله",
                "role": "admin",
                "password": "admin2026"
        },
        {
                "username": "Osamah",
                "name": "أسامة السيد",
                "role": "editor",
                "password": "123456"
        },
        {
                "username": "abdulrahman",
                "name": "عبدالرحمن السيد",
                "role": "editor",
                "password": "123456"
        },
        {
                "username": "Thamer",
                "name": "ثامر",
                "role": "editor",
                "password": "123456"
        },
        {
                "username": "Anas",
                "name": "أنس",
                "role": "editor",
                "password": "123456"
        },
        {
                "username": "BuOmer",
                "name": "بوعمر",
                "role": "editor",
                "password": "123456"
        },
        {
                "username": "Ahmed",
                "name": "الضياء",
                "role": "editor",
                "password": "123456"
        },
        {
                "username": "Designer",
                "name": "مصمم",
                "role": "viewer",
                "password": "123456"
        }
];
    }

    loadSession() {
      try {
        const saved = localStorage.getItem(this.storageKey) || 
                      sessionStorage.getItem(this.storageKey) ||
                      sessionStorage.getItem("seraj_detailed_plan_auth_v1") ||
                      sessionStorage.getItem("pdr_auth_user");
        if (saved) {
          const user = JSON.parse(saved);
          if (user && user.username) {
            this.syncSessionAcrossStorage(user);
            return user;
          }
        }
      } catch (e) {
        console.warn("Session parse warning:", e);
      }
      return null;
    }

    syncSessionAcrossStorage(user) {
      if (!user) return;
      const str = JSON.stringify(user);
      try {
        localStorage.setItem(this.storageKey, str);
        sessionStorage.setItem(this.storageKey, str);
        sessionStorage.setItem("seraj_detailed_plan_auth_v1", str);
        sessionStorage.setItem("pdr_auth_user", str);
      } catch (_) {}
    }

    clearSessionAcrossStorage() {
      try {
        localStorage.removeItem(this.storageKey);
        sessionStorage.removeItem(this.storageKey);
        localStorage.removeItem("seraj_detailed_plan_auth_v1");
        sessionStorage.removeItem("seraj_detailed_plan_auth_v1");
        localStorage.removeItem("pdr_auth_user");
        sessionStorage.removeItem("pdr_auth_user");
      } catch (_) {}
      this.currentUser = null;
    }

    async syncTeamDirectory() {
      try {
        const res = await fetch("/api/team-members");
        if (res.ok) {
          const data = await res.json();
          if (data.status === "success" && Array.isArray(data.users) && data.users.length > 0) {
            localStorage.setItem("seraj_users_list_v1", JSON.stringify(data.users));
          }
        }
      } catch (_) {}
    }

    isAuthenticated() {
      return Boolean(this.currentUser && this.currentUser.username);
    }

    isAdmin() {
      return Boolean(this.currentUser && this.currentUser.role === "admin");
    }

    canEdit() {
      return Boolean(this.currentUser && (this.currentUser.role === "admin" || this.currentUser.role === "editor"));
    }

    isViewer() {
      return Boolean(this.currentUser && this.currentUser.role === "viewer");
    }

    getUser() {
      return this.currentUser;
    }

    async login(username, password) {
      const cleanUser = (username || "").trim().toLowerCase();
      const cleanPass = (password || "").trim();

      if (!cleanUser || !cleanPass) {
        return { success: false, message: "يرجى إدخال اسم المستخدم وكلمة المرور." };
      }

      // 1. Try Live Server API
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: cleanUser, password: cleanPass })
        });
        const data = await res.json();
        if (res.ok && data.status === "success" && data.user) {
          this.currentUser = {
            ...data.user,
            token: data.token || "srv_tok_" + Date.now()
          };
          this.syncSessionAcrossStorage(this.currentUser);
          this.syncTeamDirectory();
          return { success: true, user: this.currentUser };
        }
      } catch (err) {
        console.log("Server login offline, verifying credentials locally.");
      }

      // 2. Offline Credential Verification
      const matched = this.offlineUsers.find(u => u.username.toLowerCase() === cleanUser && u.password === cleanPass);
      if (matched) {
        this.currentUser = {
          id: "usr_" + matched.username,
          username: matched.username,
          name: matched.name,
          role: matched.role,
          token: "loc_tok_" + Date.now()
        };
        this.syncSessionAcrossStorage(this.currentUser);
        this.syncTeamDirectory();
        return { success: true, user: this.currentUser };
      }

      return { success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة، يرجى المحاولة مجدداً." };
    }

    logout() {
      this.clearSessionAcrossStorage();
      window.location.href = "index.html";
    }

    /* Enforce Platform-wide Lock on any Page */
    enforceGate() {
      const overlayId = "platform-global-auth-gate";
      let overlay = document.getElementById(overlayId);

      if (this.isAuthenticated()) {
        if (overlay) {
          overlay.remove();
        }
        if (document.documentElement) document.documentElement.classList.remove("overflow-hidden");
        if (document.body) document.body.classList.remove("overflow-hidden");
        this.injectHeaderAuthBadge();
        this.syncTeamDirectory();
        return;
      }

      // If not authenticated, lock entire UI
      if (document.documentElement) document.documentElement.classList.add("overflow-hidden");
      if (document.body) document.body.classList.add("overflow-hidden");

      if (!overlay && document.body) {
        overlay = document.createElement("div");
        overlay.id = overlayId;
        overlay.className = "fixed inset-0 z-[99999] bg-[#04050a]/95 backdrop-blur-3xl flex items-center justify-center p-4 overflow-y-auto";
        overlay.innerHTML = `
          <div class="max-w-md w-full p-8 rounded-3xl bg-[#0a0d1a] border border-gold/40 shadow-2xl backdrop-blur-2xl flex flex-col gap-6 text-center relative overflow-hidden my-auto animate-fadeIn">
            <div class="w-16 h-16 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold text-2xl mx-auto shadow-lg shadow-gold/15">
              <i class="fa-solid fa-feather-pointed"></i>
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] font-black">
                  سِـرَاج الأَحْـسَـاء 🌟
                </span>
              </div>
              <h2 class="text-xl font-black text-white">منصة سراج الأحساء — تسجيل الدخول</h2>
              <p class="text-xs text-gray-400 leading-relaxed">
                الوصول إلى هذه المنصة مقتصر على أعضاء الفريق والمشرفين المصرح لهم فقط. يرجى إدخال بيانات حسابك المعتمد.
              </p>
            </div>

            <form id="global-gate-login-form" class="flex flex-col gap-4 text-xs text-right">
              <div id="global-gate-login-error" class="hidden p-3 rounded-xl bg-clay/20 border border-clay/40 text-clay text-xs font-black text-center"></div>

              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-gray-300">اسم المستخدم (Username):</label>
                <input type="text" id="global-gate-username" required placeholder="أدخل اسم المستخدم" class="bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-gold transition-all" autocomplete="username" />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="font-bold text-gray-300">كلمة المرور / الرمز السري:</label>
                <input type="password" id="global-gate-password" required placeholder="••••••••" class="bg-black/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-gold transition-all" autocomplete="current-password" />
              </div>

              <button type="submit" id="btn-global-gate-submit" class="w-full py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dark hover:from-white hover:to-gold text-black font-black text-xs shadow-lg shadow-gold/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-1">
                <i class="fa-solid fa-lock-open"></i>
                <span>تسجيل الدخول وفتح المنصة</span>
              </button>
            </form>

            <div class="pt-2 border-t border-white/10 text-[11px] text-gray-500">
              منظومة سراج الأحساء © 2026
            </div>
          </div>
        `;
        document.body.appendChild(overlay);

        const form = document.getElementById("global-gate-login-form");
        const errorBox = document.getElementById("global-gate-login-error");
        const btnSubmit = document.getElementById("btn-global-gate-submit");

        if (form) {
          form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const u = document.getElementById("global-gate-username")?.value;
            const p = document.getElementById("global-gate-password")?.value;

            if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>جاري التحقق...</span>`;
            if (errorBox) errorBox.classList.add("hidden");

            const res = await this.login(u, p);

            if (res.success) {
              if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>تم الدخول بنجاح</span>`;
              setTimeout(() => {
                overlay.remove();
                if (document.documentElement) document.documentElement.classList.remove("overflow-hidden");
                if (document.body) document.body.classList.remove("overflow-hidden");
                this.injectHeaderAuthBadge();
                window.location.href = "index.html";
              }, 350);
            } else {
              if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-lock-open"></i><span>تسجيل الدخول وفتح المنصة</span>`;
              if (errorBox) {
                errorBox.textContent = res.message || "اسم المستخدم أو كلمة المرور غير صحيحة";
                errorBox.classList.remove("hidden");
              }
            }
          });
        }
      }
    }

    injectHeaderAuthBadge() {
      const user = this.currentUser;
      if (!user) return;

      const headerLogoutBtns = document.querySelectorAll(".btn-global-logout, #btn-auth-logout");
      headerLogoutBtns.forEach(btn => {
        btn.classList.remove("hidden");
        btn.classList.add("flex");
        btn.onclick = () => {
          if (confirm("هل تريد تسجيل الخروج وإقفال المنصة؟")) {
            this.logout();
          }
        };
      });
    }
  }

  // Instantiate singleton
  App.authGuard = new AuthGuard();

  // Auto-enforce on load
  const runGuard = () => {
    if (typeof document !== "undefined") {
      App.authGuard.enforceGate();
    }
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runGuard);
    } else {
      runGuard();
    }
  }
})();
