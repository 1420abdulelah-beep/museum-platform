/* ==========================================================
   PROJECT DEFINITION REPORT (PDR) - CONTROLLER LAYER
   متحكم العمليات وتفاعل المستخدم واستوديو إنجاز المخرجات والمزامنة الفورية
   ========================================================== */

window.App = window.App || {};
var App = window.App;

App.PdrController = class {
  constructor(modelInstance, viewInstance) {
    this.model = modelInstance;
    this.view = viewInstance;
    this.audioCtx = null;
    this.isAudioActive = true;
    this.activeModalType = null; // 'edit_item' | 'add_item' | 'team_mgmt' | 'auth_login'
    this.currentEditingSectionId = null;
    this.currentEditingItemId = null;
  }

  init() {
    this.initAudio();
    this.bindAudioToggle();
    this.bindNavTabs();
    this.bindSearchAndFilters();
    this.bindModalControls();
    this.bindAuthControls();

    // Initial render from local cache
    this.view.render(this.model);
    this.bindDynamicContentEvents();

    // Sync with central server
    if (this.model && typeof this.model.fetchFromServer === "function") {
      this.model.fetchFromServer(() => {
        this.view.render(this.model);
        this.bindDynamicContentEvents();
      });
    }
  }

  /* ---------------- AUDIO FEEDBACK ---------------- */
  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("Web Audio API not available", e);
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
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    } catch (e) {
      // Silent catch
    }
  }

  bindAudioToggle() {
    const btnToggle = document.getElementById("btn-toggle-audio");
    if (!btnToggle) return;

    btnToggle.addEventListener("click", () => {
      this.isAudioActive = !this.isAudioActive;
      const icon = btnToggle.querySelector("i");
      if (this.isAudioActive) {
        if (icon) icon.className = "fas fa-volume-high";
        this.playChime(659.25);
      } else {
        if (icon) icon.className = "fas fa-volume-mute";
      }
    });
  }

  /* ---------------- TOP NAVIGATION TABS & VIEW SWITCHES ---------------- */
  bindNavTabs() {
    document.querySelectorAll(".pdr-view-nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetView = btn.getAttribute("data-pdr-view");
        if (targetView && this.model.activeView !== targetView) {
          this.model.activeView = targetView;
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(523.25);
        }
      });
    });

    // Delegated click handlers for view switches
    document.addEventListener("click", (e) => {
      // 1. Switch to Studio button
      const switchStudio = e.target.closest(".btn-switch-to-studio");
      if (switchStudio) {
        this.model.activeView = "studio";
        this.view.render(this.model);
        this.bindDynamicContentEvents();
        this.playChime(659.25);
        return;
      }

      // 2. Switch to Detailed button
      const switchDetailed = e.target.closest(".btn-switch-to-detailed");
      if (switchDetailed) {
        this.model.activeView = "detailed";
        this.view.render(this.model);
        this.bindDynamicContentEvents();
        this.playChime(659.25);
        return;
      }

      // 3. Switch to Kanban button
      const switchKanban = e.target.closest(".btn-switch-to-kanban");
      if (switchKanban) {
        this.model.activeView = "kanban";
        this.view.render(this.model);
        this.bindDynamicContentEvents();
        this.playChime(659.25);
        return;
      }

      // 4. Open Item directly in Studio
      const openItemStudio = e.target.closest(".btn-open-item-in-studio, .btn-open-section-in-studio");
      if (openItemStudio) {
        const secId = openItemStudio.getAttribute("data-section-id");
        const itemId = openItemStudio.getAttribute("data-item-id");
        if (secId) {
          this.model.selectedStudioSectionId = secId;
          if (itemId) {
            this.model.selectedStudioItemId = itemId;
          } else {
            const sec = this.model.getSection(secId);
            if (sec && sec.items && sec.items.length > 0) {
              this.model.selectedStudioItemId = sec.items[0].id;
            }
          }
          this.model.activeView = "studio";
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(783.99);
        }
        return;
      }

      // 5. Matrix Card click
      const matrixCard = e.target.closest(".pdr-matrix-card");
      if (matrixCard && !e.target.closest("button") && !e.target.closest("select")) {
        const secId = matrixCard.getAttribute("data-section-id");
        if (secId) {
          this.model.selectedSectionId = secId;
          this.model.filterSection = secId;
          this.model.activeView = "detailed";
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(587.33);

          const targetSecCard = document.getElementById("section-card-" + secId);
          if (targetSecCard) {
            targetSecCard.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
        return;
      }
    });
  }

  /* ---------------- SEARCH & FILTERS ---------------- */
  bindSearchAndFilters() {
    document.addEventListener("input", (e) => {
      if (e.target && (e.target.id === "pdr-search-input" || e.target.id === "studio-search-input")) {
        this.model.searchQuery = e.target.value;
        this.view.render(this.model);
        this.bindDynamicContentEvents();
      }
    });

    document.addEventListener("change", (e) => {
      if (e.target && e.target.id === "pdr-filter-section") {
        this.model.filterSection = e.target.value;
        this.view.render(this.model);
        this.bindDynamicContentEvents();
      } else if (e.target && e.target.id === "pdr-filter-assignee") {
        this.model.filterAssignee = e.target.value;
        this.view.render(this.model);
        this.bindDynamicContentEvents();
      } else if (e.target && e.target.id === "pdr-filter-status") {
        this.model.filterStatus = e.target.value;
        this.view.render(this.model);
        this.bindDynamicContentEvents();
      } else if (e.target && e.target.id === "studio-filter-tasktype") {
        this.model.filterTaskType = e.target.value;
        this.view.render(this.model);
        this.bindDynamicContentEvents();
      } else if (e.target && e.target.id === "studio-filter-section") {
        this.model.filterStudioSection = e.target.value;
        this.view.render(this.model);
        this.bindDynamicContentEvents();
      } else if (e.target && e.target.id === "studio-filter-assignee") {
        this.model.filterStudioAssignee = e.target.value;
        this.view.render(this.model);
        this.bindDynamicContentEvents();
      }
    });
  }

  /* ---------------- DYNAMIC CONTENT & STUDIO EVENTS ---------------- */
  bindDynamicContentEvents() {
    // 1. Studio Item Card Selection (in Sidebar Navigator)
    document.querySelectorAll(".studio-item-card").forEach(card => {
      card.addEventListener("click", () => {
        const secId = card.getAttribute("data-section-id");
        const itemId = card.getAttribute("data-item-id");
        if (secId && itemId) {
          this.model.selectStudioItem(secId, itemId);
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(659.25);
        }
      });
    });

    // 2. Studio Mode Switcher (Editor vs Official Preview)
    document.querySelectorAll(".studio-tab-mode").forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-studio-mode");
        if (mode && this.model.studioMode !== mode) {
          this.model.studioMode = mode;
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(587.33);
        }
      });
    });

    // 3. Deliverable Content Input (Debounced Auto-save)
    const deliverableContentInput = document.getElementById("studio-deliverable-content");
    const deliverableNameInput = document.getElementById("studio-deliverable-name");

    if (deliverableContentInput) {
      deliverableContentInput.addEventListener("input", (e) => {
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        if (secId && itemId) {
          this.model.updateDeliverableWork(secId, itemId, {
            deliverableContent: e.target.value
          });
        }
      });
    }

    if (deliverableNameInput) {
      deliverableNameInput.addEventListener("input", (e) => {
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        if (secId && itemId) {
          this.model.updateDeliverableWork(secId, itemId, {
            deliverables: e.target.value
          });
        }
      });
    }

    
    // 3.5. Specialized Toolboxes Live Input Auto-Save
    document.querySelectorAll(".studio-spec-field").forEach(input => {
      input.addEventListener("input", (e) => {
        const key = e.target.getAttribute("data-spec-key");
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        const item = this.model.getItem(secId, itemId);
        if (item && key) {
          item.specializedData = item.specializedData || {};
          item.specializedData[key] = e.target.value;
          this.model.saveAndSync();
        }
      });
    });

    // 4. Checklist Item Toggle
    document.querySelectorAll(".studio-check-toggle").forEach(chk => {
      chk.addEventListener("change", (e) => {
        const checkId = e.target.getAttribute("data-check-id");
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        if (secId && itemId && checkId) {
          this.model.toggleChecklistItem(secId, itemId, checkId);
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(e.target.checked ? 783.99 : 523.25);
          this.showToastNotification("تم تحديث قائمة التحقق وتحديث نسبة الإنجاز");
        }
      });
    });

    // 5. Add New Checklist Item
    const btnAddCheck = document.getElementById("btn-add-check-item");
    const inputNewCheck = document.getElementById("input-new-check-text");
    if (btnAddCheck && inputNewCheck) {
      const handleAddCheck = () => {
        const val = inputNewCheck.value.trim();
        if (!val) return;
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        if (secId && itemId) {
          this.model.addChecklistItem(secId, itemId, val);
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(659.25);
          this.showToastNotification("تمت إضافة معيار تحقق جديد");
        }
      };

      btnAddCheck.addEventListener("click", handleAddCheck);
      inputNewCheck.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleAddCheck();
        }
      });
    }

    // 6. Delete Checklist Item
    document.querySelectorAll(".btn-delete-checklist-item").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const checkId = btn.getAttribute("data-check-id");
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        if (secId && itemId && checkId) {
          this.model.deleteChecklistItem(secId, itemId, checkId);
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(440.0);
        }
      });
    });

    // 7. Add Work Note / Audit Feedback
    const btnSubmitNote = document.getElementById("btn-submit-work-note");
    const inputNewNote = document.getElementById("input-new-work-note");
    if (btnSubmitNote && inputNewNote) {
      const handleAddNote = () => {
        const val = inputNewNote.value.trim();
        if (!val) return;
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        if (secId && itemId) {
          this.model.addWorkNote(secId, itemId, val);
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(659.25);
          this.showToastNotification("تم تسجيل ملاحظة العمل والتدقيق بنجاح");
        }
      };

      btnSubmitNote.addEventListener("click", handleAddNote);
      inputNewNote.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleAddNote();
        }
      });
    }

    // 7.1 Edit Work Note
    document.querySelectorAll(".btn-edit-work-note").forEach(btn => {
      btn.addEventListener("click", () => {
        const noteIdx = btn.getAttribute("data-note-idx");
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        if (!secId || !itemId || noteIdx === null) return;

        const item = this.model.getItem(secId, itemId);
        if (!item || !Array.isArray(item.workNotes) || !item.workNotes[noteIdx]) return;

        const currentText = item.workNotes[noteIdx].text || "";
        const updated = prompt("تعديل نص الملاحظة:", currentText);
        if (updated !== null && updated.trim() !== "") {
          this.model.editWorkNote(secId, itemId, noteIdx, updated.trim());
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(659.25);
          this.showToastNotification("تم تعديل الملاحظة بنجاح");
        }
      });
    });

    // 7.2 Delete Work Note
    document.querySelectorAll(".btn-delete-work-note").forEach(btn => {
      btn.addEventListener("click", () => {
        const noteIdx = btn.getAttribute("data-note-idx");
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        if (!secId || !itemId || noteIdx === null) return;

        const item = this.model.getItem(secId, itemId);
        if (!item || !Array.isArray(item.workNotes) || !item.workNotes[noteIdx]) return;

        const note = item.workNotes[noteIdx];
        if (confirm(`هل أنت متأكد من حذف ملاحظة (${note.author}) من سجل الملاحظات؟`)) {
          this.model.deleteWorkNote(secId, itemId, noteIdx);
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(440.0);
          this.showToastNotification("تم حذف الملاحظة من السجل بنجاح");
        }
      });
    });

    // 8. Immediate 100% Approval Button
    const btnApproveNow = document.getElementById("btn-studio-approve-now");
    if (btnApproveNow) {
      btnApproveNow.addEventListener("click", () => {
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        if (secId && itemId) {
          this.model.approveAndFinalizeDeliverable(secId, itemId);
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(880.0);
          this.showToastNotification("🎉 تم اعتماد المخرج وترقيته إلى 100% بنجاح!");
        }
      });
    }

    // 9. Manual Save Button in Studio
    const btnSaveStudio = document.getElementById("btn-save-studio-work");
    if (btnSaveStudio) {
      btnSaveStudio.addEventListener("click", () => {
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        const contentVal = document.getElementById("studio-deliverable-content")?.value || "";
        const nameVal = document.getElementById("studio-deliverable-name")?.value || "";

        if (secId && itemId) {
          this.model.updateDeliverableWork(secId, itemId, {
            deliverableContent: contentVal,
            deliverables: nameVal
          });
          this.playChime(783.99);
          this.showToastNotification("✅ تم حفظ وتأكيد المخرج ومزامنته فورياً مع السيرفر");
        }
      });
    }

    // 10. Studio Active Assignee Change
    const activeAssigneeSelect = document.getElementById("studio-active-assignee");
    if (activeAssigneeSelect) {
      activeAssigneeSelect.addEventListener("change", (e) => {
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        if (secId && itemId) {
          this.model.assignTeamMember(secId, itemId, e.target.value);
          this.playChime(659.25);
          this.showToastNotification("تم تغيير وتعيين المسؤول عن المخرج");
        }
      });
    }

    // 11. Studio Active Status Change
    const activeStatusSelect = document.getElementById("studio-active-status");
    if (activeStatusSelect) {
      activeStatusSelect.addEventListener("change", (e) => {
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        if (secId && itemId) {
          this.model.updateItemStatus(secId, itemId, e.target.value);
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(e.target.value === "approved" ? 783.99 : 523.25);
          this.showToastNotification("تم تحديث حالة العمل للمخرج");
        }
      });
    }

    // 12. Studio Active Progress Slider
    const activeProgressSlider = document.getElementById("studio-active-progress");
    const activeProgressVal = document.getElementById("studio-active-progress-val");
    if (activeProgressSlider) {
      activeProgressSlider.addEventListener("input", (e) => {
        if (activeProgressVal) activeProgressVal.textContent = e.target.value + "%";
      });
      activeProgressSlider.addEventListener("change", (e) => {
        const secId = this.model.selectedStudioSectionId;
        const itemId = this.model.selectedStudioItemId;
        if (secId && itemId) {
          this.model.updateItemProgress(secId, itemId, Number(e.target.value));
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(659.25);
        }
      });
    }

    // 13. Print Active Deliverable
    const btnPrintActive = document.getElementById("btn-print-active-deliverable");
    if (btnPrintActive) {
      btnPrintActive.addEventListener("click", () => {
        window.print();
      });
    }

    // 14. Copy Deliverable Text
    const btnCopyText = document.getElementById("btn-copy-deliverable-text");
    if (btnCopyText) {
      btnCopyText.addEventListener("click", () => {
        const selectedData = this.model.getStudioSelectedData();
        if (selectedData && selectedData.item) {
          const text = (selectedData.item.title || "") + "\n\n" + (selectedData.item.deliverableContent || "");
          navigator.clipboard.writeText(text).then(() => {
            this.showToastNotification("📋 تم نسخ نص المخرج إلى الحافظة");
            this.playChime(783.99);
          });
        }
      });
    }

    // 15. Inline Detailed Table Controls
    document.querySelectorAll(".pdr-item-assignee-select").forEach(select => {
      select.addEventListener("change", (e) => {
        const secId = e.target.getAttribute("data-section-id");
        const itemId = e.target.getAttribute("data-item-id");
        if (secId && itemId) {
          this.model.assignTeamMember(secId, itemId, e.target.value);
          this.view.renderHeaderStats(this.model);
          this.playChime(659.25);
          this.showToastNotification("تم تحديث مسؤول البند بنجاح");
        }
      });
    });

    document.querySelectorAll(".pdr-item-status-select, .pdr-kanban-status-change").forEach(select => {
      select.addEventListener("change", (e) => {
        const secId = e.target.getAttribute("data-section-id");
        const itemId = e.target.getAttribute("data-item-id");
        if (secId && itemId) {
          this.model.updateItemStatus(secId, itemId, e.target.value);
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(e.target.value === "approved" ? 783.99 : 523.25);
          this.showToastNotification("تم تحديث حالة البند ومزامنة المؤشرات");
        }
      });
    });

    document.querySelectorAll(".pdr-item-progress-slider").forEach(slider => {
      slider.addEventListener("input", (e) => {
        const span = e.target.parentElement?.querySelector("span.font-mono");
        if (span) span.textContent = e.target.value + "%";
      });
      slider.addEventListener("change", (e) => {
        const secId = e.target.getAttribute("data-section-id");
        const itemId = e.target.getAttribute("data-item-id");
        if (secId && itemId) {
          this.model.updateItemProgress(secId, itemId, Number(e.target.value));
          this.view.renderHeaderStats(this.model);
          this.playChime(659.25);
        }
      });
    });

    document.querySelectorAll(".btn-delete-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const secId = btn.getAttribute("data-section-id");
        const itemId = btn.getAttribute("data-item-id");
        if (!secId || !itemId) return;

        if (confirm("هل أنت متأكد من حذف هذا البند من وثيقة المشروع؟")) {
          this.model.deleteSectionItem(secId, itemId);
          this.view.render(this.model);
          this.bindDynamicContentEvents();
          this.playChime(440.0);
          this.showToastNotification("تم حذف البند بنجاح");
        }
      });
    });

    document.querySelectorAll(".btn-add-item-to-section").forEach(btn => {
      btn.addEventListener("click", () => {
        const secId = btn.getAttribute("data-section-id");
        if (secId) this.openAddItemModal(secId);
      });
    });

    document.querySelectorAll(".btn-edit-pdr-section, .pdr-section-lead-pill").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const secId = btn.getAttribute("data-section-id");
        if (secId) this.openEditSectionModal(secId);
      });
    });

    document.querySelectorAll(".btn-edit-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const secId = btn.getAttribute("data-section-id");
        const itemId = btn.getAttribute("data-item-id");
        if (secId && itemId) this.openEditItemModal(secId, itemId);
      });
    });

    const btnPrintPdr = document.getElementById("btn-print-pdr-report");
    if (btnPrintPdr) {
      btnPrintPdr.addEventListener("click", () => window.print());
    }

    const btnAddMember = document.getElementById("btn-open-add-member-modal");
    if (btnAddMember) {
      btnAddMember.addEventListener("click", () => this.openTeamModal());
    }
  }

  /* ---------------- MODAL CONTROLS & FORMS ---------------- */
  bindModalControls() {
    const modalBackdrop = document.getElementById("pdr-modal-backdrop");
    const btnCloseModal = document.getElementById("btn-close-pdr-modal");

    if (modalBackdrop) modalBackdrop.addEventListener("click", () => this.closeModal());
    if (btnCloseModal) btnCloseModal.addEventListener("click", () => this.closeModal());

    window.addEventListener("keydown", (e) => {
      const modalRoot = document.getElementById("pdr-modal-root");
      if (e.key === "Escape" && modalRoot && !modalRoot.classList.contains("hidden")) {
        this.closeModal();
      }
    });

    const modalForm = document.getElementById("pdr-modal-form");
    if (modalForm) {
      modalForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleModalFormSubmit();
      });
    }
  }

  openAddItemModal(sectionId) {
    if (!this.model.canEdit()) {
      this.showToastNotification("🔒 عذراً، حسابك في وضع الاستعراض فقط ولا يملك صلاحية التعديل");
      return;
    }
    this.activeModalType = "add_item";
    this.currentEditingSectionId = sectionId;
    this.currentEditingItemId = null;

    const sec = this.model.getSection(sectionId);
    const modalTitle = document.getElementById("pdr-modal-title");
    const modalBody = document.getElementById("pdr-modal-form-fields");
    const modalRoot = document.getElementById("pdr-modal-root");
    const teamMembers = this.model.getTeamMembers();

    if (modalTitle) modalTitle.textContent = "إضافة بند ومخرج جديد إلى: قسم " + (sec ? sec.number + ' - ' + sec.titleAr : '');

    if (modalBody) {
      modalBody.innerHTML = `
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-300 mb-1.5">عنوان البند / المخرج</label>
            <input type="text" id="modal-field-title" required placeholder="مثال: إعداد وثيقة تصاريح المرور والدفاع المدني"
                   class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-gold focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-300 mb-1.5">الوصف التفصيلي والمهام</label>
            <textarea id="modal-field-desc" rows="3" placeholder="اشرح بالتفصيل نطاق العمل المطلوب والاشتراطات..."
                      class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-gold focus:outline-none"></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-300 mb-1.5">نوع المهمة / التصنيف</label>
              <select id="modal-field-tasktype" class="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-white/15 text-white text-sm focus:border-gold focus:outline-none">
                <option value="historical_research">📚 محتوى وبحث تاريخي وشرعي</option>
                <option value="technical_specs">💻 مواصفات هندسية وتقنية</option>
                <option value="strategic_charter" selected>🏛️ مواثيق استراتيجية وحوكمة</option>
                <option value="operations_logistics">🚚 عمليات ميدانية ومسار ومخاطر</option>
                <option value="education_experience">🎓 برامج تعليمية وتجربة زائر</option>
                <option value="financial_sustainability">🤝 استدامة مالية ورعايات</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-300 mb-1.5">المسؤول عن الإنجاز</label>
              <select id="modal-field-assignee" class="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-white/15 text-white text-sm focus:border-gold focus:outline-none">
                ${teamMembers.map(tm => `<option value="${tm.id}">${tm.name} (${tm.role})</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-300 mb-1.5">حالة العمل</label>
              <select id="modal-field-status" class="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-white/15 text-white text-sm focus:border-gold focus:outline-none">
                <option value="in_progress" selected>⏳ قيد الإعداد والتطوير</option>
                <option value="review">🔍 بانتظار المراجعة</option>
                <option value="approved">✅ معتمد ومكتمل</option>
                <option value="blocked">⏸️ متوقف / مؤجل</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-300 mb-1.5">المخرج الملموس / اسم الملف</label>
              <input type="text" id="modal-field-deliverable" placeholder="مثال: وثيقة خطة السلامة المعتمدة"
                     class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-gold focus:outline-none">
            </div>
          </div>
        </div>
      `;
    }

    if (modalRoot) modalRoot.classList.remove("hidden");
    this.playChime(587.33);
  }

  openEditItemModal(sectionId, itemId) {
    if (!this.model.canEdit()) {
      this.showToastNotification("🔒 عذراً، حسابك في وضع الاستعراض فقط ولا يملك صلاحية التعديل");
      return;
    }
    this.activeModalType = "edit_item";
    this.currentEditingSectionId = sectionId;
    this.currentEditingItemId = itemId;

    const item = this.model.getItem(sectionId, itemId);
    if (!item) return;

    const modalTitle = document.getElementById("pdr-modal-title");
    const modalBody = document.getElementById("pdr-modal-form-fields");
    const modalRoot = document.getElementById("pdr-modal-root");
    const teamMembers = this.model.getTeamMembers();

    if (modalTitle) modalTitle.textContent = "تعديل البند: " + item.title;

    if (modalBody) {
      modalBody.innerHTML = `
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-300 mb-1.5">عنوان البند / المخرج</label>
            <input type="text" id="modal-field-title" required value="${item.title || ''}"
                   class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-gold focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-300 mb-1.5">الوصف التفصيلي والمهام</label>
            <textarea id="modal-field-desc" rows="3"
                      class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-gold focus:outline-none">${item.description || ''}</textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-300 mb-1.5">المسؤول عن الإنجاز</label>
              <select id="modal-field-assignee" class="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-white/15 text-white text-sm focus:border-gold focus:outline-none">
                ${teamMembers.map(tm => `
                  <option value="${tm.id}" ${item.assignedTo === tm.id ? 'selected' : ''}>${tm.name} (${tm.role})</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-300 mb-1.5">حالة العمل</label>
              <select id="modal-field-status" class="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-white/15 text-white text-sm focus:border-gold focus:outline-none">
                <option value="in_progress" ${item.status === 'in_progress' ? 'selected' : ''}>⏳ قيد الإعداد والتطوير</option>
                <option value="review" ${item.status === 'review' ? 'selected' : ''}>🔍 بانتظار المراجعة</option>
                <option value="approved" ${item.status === 'approved' ? 'selected' : ''}>✅ معتمد ومكتمل</option>
                <option value="blocked" ${item.status === 'blocked' ? 'selected' : ''}>⏸️ متوقف / مؤجل</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-300 mb-1.5">نسبة الإنجاز (0 - 100%)</label>
              <input type="number" id="modal-field-progress" min="0" max="100" value="${item.progress || 0}"
                     class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-gold focus:outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-300 mb-1.5">المخرج الملموس</label>
              <input type="text" id="modal-field-deliverable" value="${item.deliverables || ''}"
                     class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-gold focus:outline-none">
            </div>
          </div>
        </div>
      `;
    }

    if (modalRoot) modalRoot.classList.remove("hidden");
    this.playChime(587.33);
  }

  openTeamModal() {
    if (!this.model.isAdmin()) {
      this.showToastNotification("🔒 إدارة الفريق وسجل الأعضاء متاح لمدير النظام (Admin) فقط");
      return;
    }
    this.activeModalType = "team_mgmt";
    this.currentEditingSectionId = null;
    this.currentEditingItemId = null;

    const modalTitle = document.getElementById("pdr-modal-title");
    const modalBody = document.getElementById("pdr-modal-form-fields");
    const modalRoot = document.getElementById("pdr-modal-root");
    const teamMembers = this.model.getTeamMembers();

    if (modalTitle) modalTitle.textContent = "إدارة وسجل فريق عمل مشروع PDR";

    if (modalBody) {
      modalBody.innerHTML = `
        <div class="space-y-6">
          <div class="space-y-3">
            <h5 class="text-xs font-bold text-gold">الأعضاء الحاليون (${teamMembers.length} أعضاء):</h5>
            <div class="max-h-60 overflow-y-auto space-y-2 pr-1">
              ${teamMembers.map(tm => `
                <div class="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-xs">
                  <div class="flex items-center gap-2.5">
                    <span class="text-lg">${tm.avatar}</span>
                    <div>
                      <div class="font-bold text-white">${tm.name}</div>
                      <div class="text-[11px] text-gray-400">${tm.role} • ${tm.department}</div>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] bg-palm/15 text-palm border border-palm/30">نشط</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="pt-4 border-t border-white/10 space-y-3">
            <h5 class="text-xs font-bold text-white flex items-center gap-1.5">
              <i class="fa-solid fa-user-plus text-laser"></i>
              <span>إضافة عضو جديد للفريق</span>
            </h5>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] text-gray-400 mb-1">الاسم الكامل</label>
                <input type="text" id="new-member-name" placeholder="مثال: م. راشد العبدلي"
                       class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-gold focus:outline-none">
              </div>
              <div>
                <label class="block text-[11px] text-gray-400 mb-1">المسمى الوظيفي / الدور</label>
                <input type="text" id="new-member-role" placeholder="مثال: مهندس برمجيات وتطبيقات"
                       class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-gold focus:outline-none">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] text-gray-400 mb-1">الإدارة أو القسم</label>
                <input type="text" id="new-member-dept" placeholder="مثال: الإدارة التقنية"
                       class="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:border-gold focus:outline-none">
              </div>
              <div>
                <label class="block text-[11px] text-gray-400 mb-1">الرمز التعبيري</label>
                <select id="new-member-avatar" class="w-full px-3 py-2 rounded-xl bg-darkBg border border-white/15 text-white text-xs focus:border-gold focus:outline-none">
                  <option value="👨‍💼">👨‍💼 مدير / مشرف</option>
                  <option value="👩‍💼">👩‍💼 مديرة / أخصائية</option>
                  <option value="👨‍💻">👨‍💻 مهندس تقني</option>
                  <option value="👩‍🏫">👩‍🏫 باحثة / معلمة</option>
                  <option value="👷‍♂️">👷‍♂️ مهندس ميداني</option>
                  <option value="🚚">🚚 لوجستيات وميدان</option>
                  <option value="📊">📊 مالي وتخطيط</option>
                  <option value="🎨">🎨 مصمم هوية</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (modalRoot) modalRoot.classList.remove("hidden");
    this.playChime(587.33);
  }

  openEditSectionModal(sectionId) {
    if (!this.model.canEdit()) {
      this.showToastNotification("🔒 عذراً، حسابك في وضع الاستعراض فقط ولا يملك صلاحية التعديل");
      return;
    }
    this.activeModalType = "edit_section";
    this.currentEditingSectionId = sectionId;
    this.currentEditingItemId = null;

    const sec = this.model.getSection(sectionId);
    if (!sec) return;

    const modalTitle = document.getElementById("pdr-modal-title");
    const modalBody = document.getElementById("pdr-modal-form-fields");
    const modalRoot = document.getElementById("pdr-modal-root");
    const teamMembers = this.model.getTeamMembers();

    if (modalTitle) {
      modalTitle.innerHTML = `
        <div class="flex items-center gap-2.5">
          <span class="w-7 h-7 rounded-xl bg-gold/20 text-gold text-xs font-black flex items-center justify-center border border-gold/40 shadow-sm">${sec.number}</span>
          <span class="text-white font-black">تعديل بيانات ومشرف القسم: ${sec.titleAr}</span>
        </div>
      `;
    }

    if (modalBody) {
      modalBody.innerHTML = `
        <div class="space-y-4">
          
          <!-- Section Lead / Supervisor Assignment -->
          <div class="p-4 rounded-2xl bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-gold/35 space-y-2">
            <label class="block text-xs font-black text-gold flex items-center gap-2">
              <i class="fa-solid fa-user-tie text-sm"></i>
              <span>مشرف القسم المسؤول (Section Supervisor / Lead)</span>
            </label>
            <select id="modal-field-sec-owner" class="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-gold/40 text-white text-sm focus:border-gold focus:outline-none font-bold">
              <option value="unassigned" ${sec.ownerId === 'unassigned' || !sec.ownerId ? 'selected' : ''}>👤 غير مسند (بدون مشرف)</option>
              ${teamMembers.map(tm => `
                <option value="${tm.id}" ${sec.ownerId === tm.id ? 'selected' : ''}>${tm.avatar || '👤'} ${tm.name} (${tm.role || tm.department || ''})</option>
              `).join('')}
            </select>
            <p class="text-[11px] text-gray-300">يملك مشرف القسم الصلاحية لمتابعة واعتماد مخرجات وبنود هذا القسم في وثيقة PDR.</p>
          </div>

          <!-- Section Titles (Arabic & English) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-300 mb-1.5">عنوان القسم بالعربية</label>
              <input type="text" id="modal-field-sec-titlear" required value="${sec.titleAr || ''}"
                     class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-gold focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-300 mb-1.5">عنوان القسم بالإنجليزية (English)</label>
              <input type="text" id="modal-field-sec-titleen" value="${sec.titleEn || ''}" placeholder="e.g. Project Definition"
                     class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-gold focus:outline-none font-mono">
            </div>
          </div>

          <!-- Lead Department / Track -->
          <div>
            <label class="block text-xs font-bold text-gray-300 mb-1.5">الإدارة أو المسار المسؤول</label>
            <input type="text" id="modal-field-sec-dept" value="${sec.leadDepartment || ''}" placeholder="مثال: إدارة التخطيط والتطوير / المسار الشرعي والبحثي"
                   class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-gold focus:outline-none">
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-bold text-gray-300 mb-1.5">الوصف العام ونطاق عمل القسم</label>
            <textarea id="modal-field-sec-desc" rows="3" placeholder="اكتب وصفاً دقيقاً لنطاق ومخرجات هذا القسم..."
                      class="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-gold focus:outline-none leading-relaxed">${sec.descriptionAr || ''}</textarea>
          </div>

        </div>
      `;
    }

    if (modalRoot) modalRoot.classList.remove("hidden");
    this.playChime(587.33);
  }

  handleModalFormSubmit() {
    if (this.activeModalType === "edit_section" && this.currentEditingSectionId) {
      const titleAr = document.getElementById("modal-field-sec-titlear")?.value;
      const titleEn = document.getElementById("modal-field-sec-titleen")?.value;
      const leadDepartment = document.getElementById("modal-field-sec-dept")?.value;
      const ownerId = document.getElementById("modal-field-sec-owner")?.value;
      const descriptionAr = document.getElementById("modal-field-sec-desc")?.value;

      if (!titleAr) return;

      this.model.updateSectionOverview(this.currentEditingSectionId, {
        titleAr,
        titleEn,
        leadDepartment,
        ownerId,
        descriptionAr
      });

      this.closeModal();
      this.view.render(this.model);
      this.bindDynamicContentEvents();
      this.playChime(783.99);
      this.showToastNotification("تم حفظ وتحديث بيانات ومشرف القسم بنجاح");
      return;
    } else if (this.activeModalType === "add_item" && this.currentEditingSectionId) {
      const title = document.getElementById("modal-field-title")?.value;
      const desc = document.getElementById("modal-field-desc")?.value;
      const taskType = document.getElementById("modal-field-tasktype")?.value || "strategic_charter";
      const assignee = document.getElementById("modal-field-assignee")?.value;
      const status = document.getElementById("modal-field-status")?.value;
      const deliverables = document.getElementById("modal-field-deliverable")?.value;

      if (!title) return;

      this.model.addSectionItem(this.currentEditingSectionId, {
        title,
        description: desc,
        taskType,
        assignedTo: assignee,
        status,
        deliverables
      });

      this.closeModal();
      this.view.render(this.model);
      this.bindDynamicContentEvents();
      this.playChime(783.99);
      this.showToastNotification("تمت إضافة البند والمخرج الجديد بنجاح");
    } else if (this.activeModalType === "edit_item" && this.currentEditingSectionId && this.currentEditingItemId) {
      const title = document.getElementById("modal-field-title")?.value;
      const desc = document.getElementById("modal-field-desc")?.value;
      const assignee = document.getElementById("modal-field-assignee")?.value;
      const status = document.getElementById("modal-field-status")?.value;
      const progress = Number(document.getElementById("modal-field-progress")?.value) || 0;
      const deliverables = document.getElementById("modal-field-deliverable")?.value;

      this.model.updateSectionItem(this.currentEditingSectionId, this.currentEditingItemId, {
        title,
        description: desc,
        assignedTo: assignee,
        status,
        progress,
        deliverables
      });

      this.closeModal();
      this.view.render(this.model);
      this.bindDynamicContentEvents();
      this.playChime(783.99);
      this.showToastNotification("تم حفظ وتحديث البند بنجاح");
    } else if (this.activeModalType === "team_mgmt") {
      const name = document.getElementById("new-member-name")?.value;
      const role = document.getElementById("new-member-role")?.value;
      const dept = document.getElementById("new-member-dept")?.value;
      const avatar = document.getElementById("new-member-avatar")?.value;

      if (name) {
        this.model.addTeamMember({ name, role, department: dept, avatar });
        this.closeModal();
        this.view.render(this.model);
        this.bindDynamicContentEvents();
        this.playChime(783.99);
        this.showToastNotification("تمت إضافة عضو جديد لفريق العمل");
      }
    }
  }

  closeModal() {
    const modalRoot = document.getElementById("pdr-modal-root");
    if (modalRoot) modalRoot.classList.add("hidden");
    this.activeModalType = null;
  }

  /* ---------------- AUTH CONTROLS ---------------- */
  bindAuthControls() {
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
  }

  /* ---------------- TOAST NOTIFICATION ---------------- */
  showToastNotification(message) {
    let toast = document.getElementById("pdr-live-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "pdr-live-toast";
      toast.className = "fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-black/90 border border-gold/50 text-gold text-xs font-black shadow-2xl backdrop-blur-md transition-all duration-300 pointer-events-none opacity-0 translate-y-4";
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<i class="fa-solid fa-bell mr-1 text-laser"></i> ${message}`;
    toast.classList.remove("opacity-0", "translate-y-4");
    toast.classList.add("opacity-100", "translate-y-0");

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove("opacity-100", "translate-y-0");
      toast.classList.add("opacity-0", "translate-y-4");
    }, 2800);
  }
};
