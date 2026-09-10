/* ==========================================
   SERAJ AL-AHSA - MVC CONTROLLER LAYER
   التحكم في الستوري بورد والتفاعل
   ========================================== */

window.App = window.App || {};

App.Controller = class {
  constructor(modelInstance, domViewInstance, audioViewInstance, canvasViewInstance, detailedPlanModelInstance, detailedPlanViewInstance) {
    this.model = modelInstance;
    this.domView = domViewInstance;
    this.audioView = audioViewInstance;
    this.canvasView = canvasViewInstance;
    this.detailedPlanModel = detailedPlanModelInstance || (App.DetailedPlanModel ? new App.DetailedPlanModel() : null);
    this.detailedPlanView = detailedPlanViewInstance || (App.DetailedPlanView ? new App.DetailedPlanView() : null);
    
    this.activeStoryTab = "scenario";
    this.activeModalType = null;
    this.activeModalItemId = null;
  }

  // Bind event listeners to UI elements
  init() {
    this.bindLanguageToggle();
    this.bindNavigationLinks();
    this.bindMapNodes();
    this.bindStationButtons();
    this.bindAudioToggle();
    this.bindStoryTabs();
    this.bindImageLightbox();
    
    // Bind Station 7 email export action
    const sendBtn = document.getElementById("st7-btn-send");
    if (sendBtn) {
      sendBtn.addEventListener("click", () => this.handleEmailExport());
    }

    // Initialize Detailed Master Plan and Team Hub if present on page
    this.initDetailedPlan();

    // Initial Storyboard Render
    this.switchStation(1);
  }

  // Bind full-screen image lightbox modal
  bindImageLightbox() {
    const imgWrapper = document.getElementById("story-image-wrapper");
    const lightboxModal = document.getElementById("image-lightbox-modal");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxTitle = document.getElementById("lightbox-title");
    const lightboxDesc = document.getElementById("lightbox-desc");
    const closeLightboxBtn = document.getElementById("btn-close-lightbox");

    if (imgWrapper && lightboxModal) {
      imgWrapper.addEventListener("click", () => {
        const station = this.model.stations[this.model.currentStation];
        const lang = this.model.currentLanguage;
        if (station && station.image) {
          lightboxImg.src = station.image;
          lightboxTitle.textContent = station.title[lang];
          lightboxDesc.textContent = station.tagline[lang];
          lightboxModal.classList.remove("hidden");
        }
      });
    }

    if (closeLightboxBtn && lightboxModal) {
      closeLightboxBtn.addEventListener("click", () => {
        lightboxModal.classList.add("hidden");
      });
      lightboxModal.addEventListener("click", (e) => {
        if (e.target === lightboxModal) {
          lightboxModal.classList.add("hidden");
        }
      });
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !lightboxModal.classList.contains("hidden")) {
          lightboxModal.classList.add("hidden");
        }
      });
    }
  }

  // Bind click events on storyboard 4 tabs
  bindStoryTabs() {
    const tabs = ["scenario", "tech", "plan", "finance"];
    tabs.forEach(tabKey => {
      const btn = document.getElementById(`tab-btn-${tabKey}`);
      if (btn) {
        btn.addEventListener("click", () => {
          this.activeStoryTab = tabKey;
          this.domView.switchStoryTab(tabKey);
        });
      }
    });
  }

  // Bind language switch button click
  bindLanguageToggle() {
    const btnLang = document.getElementById("btn-lang-toggle");
    if (btnLang) {
      btnLang.addEventListener("click", () => {
        this.model.toggleLanguage();
        this.domView.updateTranslations(this.model);
        this.switchStation(this.model.currentStation);
      });
    }
  }

  // Bind top navbar link anchors highlights
  bindNavigationLinks() {
    const links = document.querySelectorAll(".nav-link");
    links.forEach(link => {
      link.addEventListener("click", () => {
        links.forEach(l => l.classList.remove("active"));
        link.classList.add("active");
      });
    });
  }

  // Bind interactive SVG map nodes selection click
  bindMapNodes() {
    const nodes = document.querySelectorAll(".map-node");
    nodes.forEach(node => {
      node.addEventListener("click", () => {
        const station = parseInt(node.getAttribute("data-station"));
        this.switchStation(station);
      });
    });
  }

  // Bind sidebar station list selection click
  bindStationButtons() {
    const btns = document.querySelectorAll(".station-btn");
    btns.forEach(btn => {
      btn.addEventListener("click", () => {
        const station = parseInt(btn.getAttribute("data-station"));
        this.switchStation(station);
      });
    });
  }

  // Bind click on Web Audio sound toggle button
  bindAudioToggle() {
    const audioBtn = document.getElementById("btn-toggle-audio");
    if (!audioBtn) return;

    audioBtn.addEventListener("click", () => {
      const isPlaying = this.audioView.toggleAudioEngine();
      const waves = document.getElementById("global-audio-waves");
      
      if (isPlaying) {
        audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        audioBtn.style.color = "var(--laser)";
        audioBtn.style.borderColor = "var(--laser)";
        if (waves) waves.classList.add("playing");
      } else {
        audioBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        audioBtn.style.color = "var(--gold)";
        audioBtn.style.borderColor = "var(--gold)";
        if (waves) waves.classList.remove("playing");
      }
    });
  }

  // Handle active station swapping
  switchStation(stationNum) {
    this.model.setStation(stationNum);
    this.domView.updateActiveStationUI(stationNum);
    this.domView.renderStationStoryboard(stationNum, this.model);
    this.domView.switchStoryTab(this.activeStoryTab || "scenario");

    // Optional audio chime on station switch
    if (this.audioView && typeof this.audioView.playChime === "function") {
      this.audioView.playChime(350 + stationNum * 50);
    }
  }

  // E-mail booklet pdf packet distribution (Station 7)
  handleEmailExport() {
    const emailInput = document.getElementById("st7-email");
    const emailVal = emailInput ? emailInput.value.trim() : "";
    if (emailVal && emailVal.includes("@")) {
      if (this.audioView && typeof this.audioView.playChime === "function") {
        this.audioView.playChime(880);
      }
      const success = document.getElementById("st7-success-msg");
      if (success) {
        success.classList.remove("hidden");
        success.textContent = this.model.getTranslations().successMsg;
      }

      // Persist lead to central server
      try {
        fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailVal, station: 7, type: "manuscript_export" })
        }).catch(err => console.warn("Could not save lead to server", err));
      } catch (e) {
        console.warn("Error sending lead:", e);
      }
    }
  }


  /* ==========================================
     DETAILED MASTER PLAN & TEAM HUB CONTROLLER
     ========================================== */

  initDetailedPlan() {
    if (!document.getElementById("detailed-plan-content-area")) return;

    // 1. Bind Sub-navigation tabs
    document.querySelectorAll(".plan-sub-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-plan-tab");
        this.detailedPlanModel.activeTab = tab;
        this.detailedPlanView.render(this.detailedPlanModel);
        this.bindDetailedPlanContentEvents();
      });
    });

    // 2. Bind Modal Close & Save buttons
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

    // 3. Initial Render & bind from local cache
    this.detailedPlanView.render(this.detailedPlanModel);
    this.bindDetailedPlanContentEvents();

    // 4. Fetch and sync latest state from central server database
    if (this.detailedPlanModel && typeof this.detailedPlanModel.fetchFromServer === "function") {
      this.detailedPlanModel.fetchFromServer(() => {
        this.detailedPlanView.render(this.detailedPlanModel);
        this.bindDetailedPlanContentEvents();
      });
    }
  }

  // Bind reactive events inside dynamic content area
  bindDetailedPlanContentEvents() {
    const contentArea = document.getElementById("detailed-plan-content-area");
    if (!contentArea) return;

    /* --- TASKS FILTERS & ACTIONS --- */
    const filterTrack = document.getElementById("filter-task-track");
    if (filterTrack) {
      filterTrack.addEventListener("change", (e) => {
        this.detailedPlanModel.taskFilterTrack = e.target.value;
        this.detailedPlanView.render(this.detailedPlanModel);
        this.bindDetailedPlanContentEvents();
      });
    }

    const filterStatus = document.getElementById("filter-task-status");
    if (filterStatus) {
      filterStatus.addEventListener("change", (e) => {
        this.detailedPlanModel.taskFilterStatus = e.target.value;
        this.detailedPlanView.render(this.detailedPlanModel);
        this.bindDetailedPlanContentEvents();
      });
    }

    const btnAddTask = document.getElementById("btn-add-task");
    if (btnAddTask) {
      btnAddTask.addEventListener("click", () => this.openTaskModal());
    }

    contentArea.querySelectorAll(".task-status-select").forEach(sel => {
      sel.addEventListener("change", (e) => {
        const taskId = sel.getAttribute("data-task-id");
        this.detailedPlanModel.updateTask(taskId, { status: e.target.value });
        this.audioView.playChime(659.25);
        this.detailedPlanView.render(this.detailedPlanModel);
        this.bindDetailedPlanContentEvents();
      });
    });

    contentArea.querySelectorAll(".btn-edit-task").forEach(btn => {
      btn.addEventListener("click", () => {
        const taskId = btn.getAttribute("data-task-id");
        const task = this.detailedPlanModel.getTasks().find(t => t.id === taskId);
        if (task) this.openTaskModal(task);
      });
    });

    contentArea.querySelectorAll(".btn-delete-task").forEach(btn => {
      btn.addEventListener("click", () => {
        const taskId = btn.getAttribute("data-task-id");
        if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
          this.detailedPlanModel.deleteTask(taskId);
          this.detailedPlanView.render(this.detailedPlanModel);
          this.bindDetailedPlanContentEvents();
        }
      });
    });

    /* --- ARTIFACTS ACTIONS --- */
    const btnAddArtifact = document.getElementById("btn-add-artifact");
    if (btnAddArtifact) {
      btnAddArtifact.addEventListener("click", () => this.openArtifactModal());
    }

    contentArea.querySelectorAll(".btn-edit-artifact").forEach(btn => {
      btn.addEventListener("click", () => {
        const artId = btn.getAttribute("data-art-id");
        const art = this.detailedPlanModel.getArtifacts().find(a => a.id === artId);
        if (art) this.openArtifactModal(art);
      });
    });

    contentArea.querySelectorAll(".btn-delete-artifact").forEach(btn => {
      btn.addEventListener("click", () => {
        const artId = btn.getAttribute("data-art-id");
        if (confirm("هل أنت متأكد من حذف هذه القطعة من العرض؟")) {
          this.detailedPlanModel.deleteArtifact(artId);
          this.detailedPlanView.render(this.detailedPlanModel);
          this.bindDetailedPlanContentEvents();
        }
      });
    });

    /* --- SCHOOLS ACTIONS --- */
    const btnAddSchool = document.getElementById("btn-add-school");
    if (btnAddSchool) {
      btnAddSchool.addEventListener("click", () => this.openSchoolModal());
    }

    contentArea.querySelectorAll(".btn-edit-school").forEach(btn => {
      btn.addEventListener("click", () => {
        const schId = btn.getAttribute("data-sch-id");
        const sch = this.detailedPlanModel.getSchools().find(s => s.id === schId);
        if (sch) this.openSchoolModal(sch);
      });
    });

    contentArea.querySelectorAll(".btn-delete-school").forEach(btn => {
      btn.addEventListener("click", () => {
        const schId = btn.getAttribute("data-sch-id");
        if (confirm("هل أنت متأكد من حذف هذه المدرسة؟")) {
          this.detailedPlanModel.deleteSchool(schId);
          this.detailedPlanView.render(this.detailedPlanModel);
          this.bindDetailedPlanContentEvents();
        }
      });
    });

    /* --- SCENES ACTIONS --- */
    contentArea.querySelectorAll(".btn-edit-scene").forEach(btn => {
      btn.addEventListener("click", () => {
        const sceneNum = parseInt(btn.getAttribute("data-scene-num"), 10);
        this.openSceneModal(sceneNum);
      });
    });

    /* --- PENDING DECISIONS ACTIONS --- */
    contentArea.querySelectorAll(".btn-save-decision").forEach(btn => {
      btn.addEventListener("click", () => {
        const decId = btn.getAttribute("data-decision-id");
        const card = btn.closest(".p-6");
        const sel = card.querySelector(`.decision-status-select[data-decision-id="${decId}"]`);
        const txt = card.querySelector(`.decision-notes-input[data-decision-id="${decId}"]`);
        
        const statusVal = sel ? sel.value : null;
        const notesVal = txt ? txt.value : null;

        this.detailedPlanModel.updateDecision(decId, statusVal, notesVal);
        this.audioView.playChime(783.99);
        
        btn.innerHTML = `<i class="fa-solid fa-check me-1"></i>تم الحفظ`;
        btn.classList.add("bg-palm", "text-black");
        setTimeout(() => {
          this.detailedPlanView.render(this.detailedPlanModel);
          this.bindDetailedPlanContentEvents();
        }, 800);
      });
    });

    /* --- EXPORT & TOOLS ACTIONS --- */
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
          this.detailedPlanModel.resetToDefault();
          this.audioView.playChime(440);
          this.detailedPlanView.render(this.detailedPlanModel);
          this.bindDetailedPlanContentEvents();
        }
      });
    }
  }

  /* --- MODAL OPENERS & HANDLERS --- */

  openTaskModal(task = null) {
    this.activeModalType = "task";
    this.activeModalItemId = task ? task.id : null;

    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const modalOverlay = document.getElementById("detailed-plan-modal");

    modalTitle.innerHTML = `<i class="fa-solid fa-list-check text-gold"></i><span>${task ? 'تعديل مهمة' : 'إضافة مهمة جديدة'}</span>`;
    
    modalBody.innerHTML = `
      <div class="flex flex-col gap-1.5">
        <label class="font-bold text-white">عنوان المهمة:</label>
        <input type="text" id="m-task-title" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${task ? task.title : ''}" placeholder="أدخل عنوان المهمة..." required />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <label class="font-bold text-white">المسؤول (Assignee):</label>
          <input type="text" id="m-task-assignee" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${task ? task.assignee : ''}" placeholder="اسم العضو أو الفريق المسؤول" />
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
    `;

    modalOverlay.classList.remove("hidden");
    modalOverlay.classList.add("flex");
  }

  openArtifactModal(art = null) {
    this.activeModalType = "artifact";
    this.activeModalItemId = art ? art.id : null;

    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const modalOverlay = document.getElementById("detailed-plan-modal");

    modalTitle.innerHTML = `<i class="fa-solid fa-jar text-gold"></i><span>${art ? 'تعديل قطعة متحفية' : 'إضافة قطعة جديدة'}</span>`;
    
    modalBody.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">اسم القطعة:</label>
          <input type="text" id="m-art-name" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${art ? art.name : ''}" required />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">حالة التوثيق:</label>
          <input type="text" id="m-art-status" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${art ? art.status : 'موثق'}" />
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
    `;

    modalOverlay.classList.remove("hidden");
    modalOverlay.classList.add("flex");
  }

  openSchoolModal(sch = null) {
    this.activeModalType = "school";
    this.activeModalItemId = sch ? sch.id : null;

    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const modalOverlay = document.getElementById("detailed-plan-modal");

    modalTitle.innerHTML = `<i class="fa-solid fa-graduation-cap text-gold"></i><span>${sch ? 'تعديل مدرسة شرعية' : 'إضافة مدرسة شرعية'}</span>`;
    
    modalBody.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="flex flex-col gap-1.5 sm:col-span-2">
          <label class="font-bold text-white">اسم المدرسة / الرباط:</label>
          <input type="text" id="m-sch-name" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${sch ? sch.name : ''}" required />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">المذهب:</label>
          <input type="text" id="m-sch-mazhab" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${sch ? sch.mazhab : 'حنفي'}" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">سنة التأسيس:</label>
          <input type="text" id="m-sch-year" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${sch ? sch.year : ''}" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">الحالة اليوم:</label>
          <input type="text" id="m-sch-status" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${sch ? sch.status : 'معمورة بالأنشطة'}" />
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="font-bold text-white">الواقف والموقع وأول مدرّس:</label>
        <textarea id="m-sch-founder" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-16 resize-none">${sch ? sch.founder : ''}</textarea>
      </div>
    `;

    modalOverlay.classList.remove("hidden");
    modalOverlay.classList.add("flex");
  }

  openSceneModal(sceneNum) {
    this.activeModalType = "scene";
    this.activeModalItemId = sceneNum;

    const scene = this.detailedPlanModel.getScenes().find(s => s.num === sceneNum);
    if (!scene) return;

    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");
    const modalOverlay = document.getElementById("detailed-plan-modal");

    modalTitle.innerHTML = `<i class="fa-solid fa-film text-gold"></i><span>تعديل المشهد ${scene.num}: ${scene.title}</span>`;
    
    modalBody.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">عنوان المشهد:</label>
          <input type="text" id="m-sc-title" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${scene.title}" required />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="font-bold text-white">المدة المقترحة:</label>
          <input type="text" id="m-sc-duration" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${scene.duration}" />
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="font-bold text-white">المكان والزمن:</label>
        <input type="text" id="m-sc-setting" class="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white outline-none focus:border-gold" value="${scene.setting}" />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="font-bold text-white">الوصف البصري والتقني:</label>
        <textarea id="m-sc-visual" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-16 resize-none">${scene.visualDesc}</textarea>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="font-bold text-white">الصوت والنص والحوار:</label>
        <textarea id="m-sc-audio" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-16 resize-none">${scene.audioText}</textarea>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="font-bold text-white">الغرض الدرامي:</label>
        <textarea id="m-sc-dramatic" class="bg-black/60 border border-white/15 rounded-lg p-2 text-white outline-none focus:border-gold h-14 resize-none">${scene.dramaticPurpose}</textarea>
      </div>
    `;

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
  }

  handleSaveModal() {
    if (this.activeModalType === "task") {
      const title = document.getElementById("m-task-title").value.trim();
      if (!title) { alert("يرجى إدخال عنوان المهمة"); return; }

      const taskData = {
        title: title,
        track: document.getElementById("m-task-track").value,
        assignee: document.getElementById("m-task-assignee").value.trim() || "غير مسند",
        priority: document.getElementById("m-task-priority").value,
        status: document.getElementById("m-task-status").value,
        dueDate: document.getElementById("m-task-due").value,
        notes: document.getElementById("m-task-notes").value.trim()
      };

      if (this.activeModalItemId) {
        this.detailedPlanModel.updateTask(this.activeModalItemId, taskData);
      } else {
        this.detailedPlanModel.addTask(taskData);
      }
    } else if (this.activeModalType === "artifact") {
      const name = document.getElementById("m-art-name").value.trim();
      if (!name) { alert("يرجى إدخال اسم القطعة"); return; }

      const artData = {
        name: name,
        status: document.getElementById("m-art-status").value.trim(),
        source: document.getElementById("m-art-source").value.trim(),
        specs: document.getElementById("m-art-specs").value.trim(),
        displayMethod: document.getElementById("m-art-display").value.trim()
      };

      if (this.activeModalItemId) {
        this.detailedPlanModel.updateArtifact(this.activeModalItemId, artData);
      } else {
        this.detailedPlanModel.addArtifact(artData);
      }
    } else if (this.activeModalType === "school") {
      const name = document.getElementById("m-sch-name").value.trim();
      if (!name) { alert("يرجى إدخال اسم المدرسة"); return; }

      const schData = {
        name: name,
        mazhab: document.getElementById("m-sch-mazhab").value.trim(),
        year: document.getElementById("m-sch-year").value.trim(),
        status: document.getElementById("m-sch-status").value.trim(),
        founder: document.getElementById("m-sch-founder").value.trim()
      };

      if (this.activeModalItemId) {
        this.detailedPlanModel.updateSchool(this.activeModalItemId, schData);
      } else {
        this.detailedPlanModel.addSchool(schData);
      }
    } else if (this.activeModalType === "scene") {
      const sceneData = {
        title: document.getElementById("m-sc-title").value.trim(),
        duration: document.getElementById("m-sc-duration").value.trim(),
        setting: document.getElementById("m-sc-setting").value.trim(),
        visualDesc: document.getElementById("m-sc-visual").value.trim(),
        audioText: document.getElementById("m-sc-audio").value.trim(),
        dramaticPurpose: document.getElementById("m-sc-dramatic").value.trim()
      };

      this.detailedPlanModel.updateScene(this.activeModalItemId, sceneData);
    }

    this.audioView.playChime(659.25);
    this.closeModal();
    this.detailedPlanView.render(this.detailedPlanModel);
    this.bindDetailedPlanContentEvents();
  }

  /* --- DOWNLOAD & IMPORT HELPERS --- */

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

  handleExportMarkdown() {
    const md = this.detailedPlanModel.generateExecutiveMarkdown();
    this.downloadFile("متحف_السيرة_الأحسائية_الدراسة_التنفيذية.md", md, "text/markdown;charset=utf-8");
    this.audioView.playChime(880);
  }

  handleExportJSON() {
    const jsonStr = this.detailedPlanModel.exportJSON();
    this.downloadFile("متحف_السيرة_الأحسائية_بيانات_الفريق.json", jsonStr, "application/json;charset=utf-8");
    this.audioView.playChime(880);
  }

  handleImportJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const success = this.detailedPlanModel.importJSON(content);
      if (success) {
        this.audioView.playChime(880);
        alert("تم استيراد بيانات وتعديلات الفريق بنجاح!");
        this.detailedPlanView.render(this.detailedPlanModel);
        this.bindDetailedPlanContentEvents();
      } else {
        alert("خطأ: تعذر قراءة ملف JSON أو أن بنية الملف غير متطابقة.");
      }
    };
    reader.readAsText(file);
  }
};
