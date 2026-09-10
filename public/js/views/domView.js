/* ==========================================
   SERAJ AL-AHSA - MVC DOM VIEW LAYER
   عرض الستوري بورد البصري والتصور السينمائي
   ========================================== */

window.App = window.App || {};

App.DomView = class {
  constructor() {
    this.btnLang = document.getElementById("btn-lang-toggle");
    this.currentStationNum = document.getElementById("current-station-num");
    this.currentStationName = document.getElementById("current-station-name");
    this.currentStationTagline = document.getElementById("current-station-tagline");
    
    this.sensoryMatrixContainer = document.getElementById("sensory-matrix-container");
    this.storyConceptImage = document.getElementById("story-concept-image");
    this.storyImageStationLabel = document.getElementById("story-image-station-label");
    this.storyImageCaptionTitle = document.getElementById("story-image-caption-title");
    this.storyImageCaptionSub = document.getElementById("story-image-caption-sub");
    
    this.storyScenarioText = document.getElementById("story-scenario-text");
    this.storyHighlightsContainer = document.getElementById("story-highlights-container");
    this.storyTechContainer = document.getElementById("story-tech-container");
    this.storyPlanContainer = document.getElementById("story-plan-container");
    this.storyFinanceContainer = document.getElementById("story-finance-container");
    this.hudOverlaySt7 = document.getElementById("hud-overlay-st7");
    this.st7SuccessMsg = document.getElementById("st7-success-msg");
  }

  // Update layout text translations based on language
  updateTranslations(modelInstance) {
    const lang = modelInstance.currentLanguage;
    const trans = modelInstance.translations[lang];
    
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    
    if (this.btnLang) {
      this.btnLang.querySelector(".lang-text").textContent = modelInstance.translations[lang === "ar" ? "en" : "ar"].langLabel;
    }

    const elements = document.querySelectorAll("[data-ar][data-en]");
    elements.forEach(el => {
      el.textContent = el.getAttribute(`data-${lang}`);
    });
    
    const emailInput = document.getElementById("st7-email");
    if (emailInput) {
      emailInput.placeholder = trans.emailPlaceholder;
    }
  }

  // Update active navigation buttons and maps node classes
  updateActiveStationUI(stationNum) {
    document.querySelectorAll(".map-node").forEach(node => {
      node.classList.remove("active");
      if (parseInt(node.getAttribute("data-station")) === stationNum) {
        node.classList.add("active");
      }
    });

    document.querySelectorAll(".station-btn").forEach(btn => {
      btn.classList.remove("active");
      if (parseInt(btn.getAttribute("data-station")) === stationNum) {
        btn.classList.add("active");
      }
    });

    // Update SVG connection line progress
    const activeFlow = document.getElementById("map-active-flow");
    if (activeFlow) {
      const dashLength = 1000;
      const progress = (stationNum - 1) / 6;
      const offset = dashLength - (progress * dashLength);
      activeFlow.style.strokeDashoffset = offset;
    }

    if (this.currentStationNum) {
      this.currentStationNum.textContent = stationNum.toString().padStart(2, "0");
    }
  }

  // Render comprehensive storyboard for current station
  renderStationStoryboard(stationNum, modelInstance) {
    const lang = modelInstance.currentLanguage;
    const trans = modelInstance.getTranslations();
    const station = modelInstance.stations[stationNum];

    // Header & Tagline
    if (this.currentStationName) this.currentStationName.textContent = station.title[lang];
    if (this.currentStationTagline) this.currentStationTagline.textContent = station.tagline[lang];

    // Concept Art Visual Image & Badges
    if (this.storyConceptImage && station.image) {
      this.storyConceptImage.src = station.image;
      this.storyConceptImage.alt = station.imageAlt ? station.imageAlt[lang] : station.title[lang];
    }
    if (this.storyImageStationLabel) {
      this.storyImageStationLabel.textContent = `STATION ${stationNum.toString().padStart(2, "0")} CONCEPT ART`;
    }
    if (this.storyImageCaptionTitle) {
      this.storyImageCaptionTitle.textContent = station.title[lang];
    }
    if (this.storyImageCaptionSub) {
      this.storyImageCaptionSub.textContent = station.tagline[lang];
    }

    // 1. Render Sensory Blueprint Matrix
    if (this.sensoryMatrixContainer) {
      const rating = station.sensesRating;
      this.sensoryMatrixContainer.innerHTML = `
        <div class="p-2.5 rounded-lg bg-white/[0.03] border border-white/6 flex flex-col items-center">
          <i class="fa-solid fa-eye text-gold text-xs mb-1"></i>
          <span class="text-[10px] text-gray-400 font-bold">${trans.visualSens}</span>
          <span class="text-xs font-black text-white mt-0.5">${rating.visual}</span>
        </div>
        <div class="p-2.5 rounded-lg bg-white/[0.03] border border-white/6 flex flex-col items-center">
          <i class="fa-solid fa-volume-high text-laser text-xs mb-1"></i>
          <span class="text-[10px] text-gray-400 font-bold">${trans.auditorySens}</span>
          <span class="text-xs font-black text-white mt-0.5">${rating.sound.split(" ")[0]}</span>
        </div>
        <div class="p-2.5 rounded-lg bg-white/[0.03] border border-white/6 flex flex-col items-center">
          <i class="fa-solid fa-wind text-palm text-xs mb-1"></i>
          <span class="text-[10px] text-gray-400 font-bold">${trans.olfactorySens}</span>
          <span class="text-xs font-black text-white mt-0.5">${rating.smell.split(" ")[0]}</span>
        </div>
        <div class="p-2.5 rounded-lg bg-white/[0.03] border border-white/6 flex flex-col items-center">
          <i class="fa-solid fa-hand-pointer text-clay text-xs mb-1"></i>
          <span class="text-[10px] text-gray-400 font-bold">${trans.tactileSens}</span>
          <span class="text-xs font-black text-white mt-0.5">${rating.touch.split(" ")[0]}</span>
        </div>
        <div class="p-2.5 rounded-lg bg-white/[0.03] border border-white/6 flex flex-col items-center">
          <i class="fa-solid fa-arrows-to-dot text-gold text-xs mb-1"></i>
          <span class="text-[10px] text-gray-400 font-bold">${trans.hapticSens}</span>
          <span class="text-xs font-black text-white mt-0.5">${rating.haptic.split(" ")[0]}</span>
        </div>
        <div class="p-2.5 rounded-lg bg-white/[0.03] border border-white/6 flex flex-col items-center">
          <i class="fa-solid fa-id-card text-laser text-xs mb-1"></i>
          <span class="text-[10px] text-gray-400 font-bold">${trans.digitalSens}</span>
          <span class="text-xs font-black text-white mt-0.5">${rating.digital.split(" ")[0]}</span>
        </div>
      `;
    }

    // 2. Render Tab 1: Scenario & Key Highlights
    if (this.storyScenarioText) {
      this.storyScenarioText.textContent = station.scenario[lang];
    }
    if (this.storyHighlightsContainer) {
      let highlightsHTML = "";
      station.keyHighlights[lang].forEach(item => {
        highlightsHTML += `
          <div class="p-3 rounded-xl bg-white/[0.02] border border-white/6 flex items-start gap-2.5">
            <span class="w-2 h-2 rounded-full bg-gold shrink-0 mt-1.5 shadow-[0_0_6px_#dfb15b]"></span>
            <span class="text-xs text-gray-300 font-medium leading-relaxed">${item}</span>
          </div>
        `;
      });
      this.storyHighlightsContainer.innerHTML = highlightsHTML;
    }

    // Show/Hide Station 7 RFID Portal
    if (this.hudOverlaySt7) {
      if (stationNum === 7) {
        this.hudOverlaySt7.classList.remove("hidden");
      } else {
        this.hudOverlaySt7.classList.add("hidden");
      }
    }

    // 3. Render Tab 2: Technical Specs
    if (this.storyTechContainer) {
      const techPoints = station.tech[lang].split("\n");
      let techHTML = "";
      techPoints.forEach(point => {
        const cleanPoint = point.replace("• ", "").trim();
        if (cleanPoint) {
          let icon = "fa-cogs";
          if (cleanPoint.toLowerCase().includes("laser") || cleanPoint.includes("ليزر")) icon = "fa-bolt-lightning";
          else if (cleanPoint.toLowerCase().includes("led") || cleanPoint.includes("شاشات")) icon = "fa-desktop";
          else if (cleanPoint.toLowerCase().includes("lidar") || cleanPoint.includes("مستشعر")) icon = "fa-radar";
          else if (cleanPoint.toLowerCase().includes("audio") || cleanPoint.includes("صوت")) icon = "fa-volume-high";
          else if (cleanPoint.toLowerCase().includes("scent") || cleanPoint.includes("عطر")) icon = "fa-wind";
          else if (cleanPoint.toLowerCase().includes("rfid") || cleanPoint.includes("بطاق") || cleanPoint.includes("سوار")) icon = "fa-id-card";
          else if (cleanPoint.toLowerCase().includes("cloud") || cleanPoint.includes("سحاب")) icon = "fa-cloud";
          else if (cleanPoint.toLowerCase().includes("unreal") || cleanPoint.includes("شخصي")) icon = "fa-gamepad";
          else if (cleanPoint.toLowerCase().includes("dome") || cleanPoint.includes("قبة") || cleanPoint.includes("قبابي")) icon = "fa-circle-dot";

          techHTML += `
            <div class="p-4 rounded-xl bg-white/[0.02] border border-white/6 hover:border-gold/30 hover:bg-white/[0.04] transition-all flex items-start gap-3.5 shadow-sm">
              <div class="w-9 h-9 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold text-sm shrink-0 mt-0.5">
                <i class="fa-solid ${icon}"></i>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-black text-gold">${cleanPoint.split(" ")[0]} ${cleanPoint.split(" ")[1] || ""}</span>
                <span class="text-xs text-gray-300 leading-relaxed">${cleanPoint}</span>
              </div>
            </div>
          `;
        }
      });
      this.storyTechContainer.innerHTML = techHTML;
    }

    // 4. Render Tab 3: Construction Plan & Phases
    if (this.storyPlanContainer) {
      const planText = station.plan[lang];
      const lines = planText.split("\n");
      let mainTitle = lines[0].replace(":", "").trim();
      
      let cardsHTML = "";
      let timelineHTML = "";
      let inTimeline = false;
      let timelineTitle = "";

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.includes("خطوات التنفيذ") || line.includes("Construction Milestones") || line.includes("Deployment Phases") || line.includes("Steps of Implementation")) {
          inTimeline = true;
          timelineTitle = line.replace(/^[•-]\s*/, "").replace(":", "").trim();
          continue;
        }

        if (inTimeline) {
          const match = line.match(/^(\d+)\.\s*(.*)/);
          if (match) {
            const num = match[1];
            const desc = match[2];
            timelineHTML += `
              <div class="flex items-start gap-4 relative">
                <div class="flex flex-col items-center">
                  <span class="flex items-center justify-center w-6 h-6 rounded-full bg-gold/10 text-gold border border-gold/30 text-[10px] font-black z-10 shrink-0 shadow-sm">${num}</span>
                  ${i < lines.length - 1 ? '<span class="w-[1.5px] bg-gold/15 flex-grow my-1.5 min-h-[22px]"></span>' : ''}
                </div>
                <p class="text-xs text-gray-300 leading-relaxed mt-0.5">${desc}</p>
              </div>`;
          }
        } else {
          if (line.startsWith("•") || line.startsWith("-")) {
            const cleanLine = line.replace(/^[•-]\s*/, "");
            const colonIdx = cleanLine.indexOf(":");
            
            if (colonIdx !== -1) {
              const cardTitle = cleanLine.substring(0, colonIdx).trim();
              const cardDesc = cleanLine.substring(colonIdx + 1).trim();
              
              cardsHTML += `
                <div class="p-4 rounded-xl bg-white/[0.02] border border-white/6 hover:border-gold/25 hover:bg-white/[0.04] transition-all flex flex-col gap-2 shadow-sm">
                  <div class="flex items-center gap-2.5 text-gold font-bold text-xs">
                    <i class="fa-solid fa-file-signature text-sm"></i>
                    <span>${cardTitle}</span>
                  </div>
                  <p class="text-xs text-gray-400 leading-relaxed">${cardDesc}</p>
                </div>`;
            } else {
              cardsHTML += `
                <div class="p-4 rounded-xl bg-white/[0.01] border border-white/5 md:col-span-2 shadow-sm">
                  <p class="text-xs text-gray-400 leading-relaxed">${cleanLine}</p>
                </div>`;
            }
          }
        }
      }

      let finalPlanHTML = `
        <div class="flex flex-col gap-5">
          <h3 class="text-sm font-extrabold text-gold border-b border-white/10 pb-3 flex items-center gap-2.5">
            <i class="fa-solid fa-file-lines text-base"></i>
            <span>${mainTitle}</span>
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${cardsHTML}
          </div>
      `;

      if (timelineHTML) {
        finalPlanHTML += `
          <div class="mt-2 p-5 rounded-xl bg-gold/[0.03] border border-gold/15 flex flex-col gap-4">
            <h4 class="text-xs font-black text-gold flex items-center gap-2">
              <i class="fa-solid fa-route"></i>
              <span>${timelineTitle}</span>
            </h4>
            <div class="flex flex-col gap-3">
              ${timelineHTML}
            </div>
          </div>
        `;
      }

      finalPlanHTML += `</div>`;
      this.storyPlanContainer.innerHTML = finalPlanHTML;
    }

    // 5. Render Tab 4: Budget & Timeline
    if (this.storyFinanceContainer) {
      const finance = station.finance;
      let totalSum = 0;
      let tableRowsHTML = "";

      finance.items.forEach((item) => {
        totalSum += item.cost;
        const formattedCost = item.cost.toLocaleString(lang === "ar" ? "ar-SA" : "en-US");
        tableRowsHTML += `
          <tr class="border-b border-white/6 hover:bg-white/[0.02] transition-colors">
            <td class="px-4 py-3.5 text-xs text-gray-300 font-medium">${item.label[lang]}</td>
            <td class="px-4 py-3.5 text-xs text-gold font-bold text-end shrink-0 whitespace-nowrap">${formattedCost} ${trans.currency}</td>
          </tr>
        `;
      });

      const formattedTotal = totalSum.toLocaleString(lang === "ar" ? "ar-SA" : "en-US");
      const formattedDuration = finance.duration[lang];

      this.storyFinanceContainer.innerHTML = `
        <div class="flex flex-col gap-5">
          <div class="border-b border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 class="text-sm font-extrabold text-gold flex items-center gap-2.5">
              <i class="fa-solid fa-calculator text-base"></i>
              <span>${trans.financeLbl} — ${station.title[lang]}</span>
            </h3>
          </div>

          <div class="p-4 rounded-xl bg-gold/[0.03] border border-gold/15 flex items-center gap-3.5 shadow-sm">
            <div class="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold text-lg shrink-0">
              <i class="fa-regular fa-calendar-check"></i>
            </div>
            <div class="flex flex-col gap-0.5">
              <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${trans.durationLbl}</span>
              <span class="text-sm text-white font-extrabold">${formattedDuration}</span>
            </div>
          </div>

          <div class="overflow-x-auto rounded-xl border border-white/8 bg-black/20">
            <table class="w-full text-start border-collapse">
              <thead>
                <tr class="border-b border-white/10 bg-white/[0.02]">
                  <th class="px-4 py-3 text-start text-[10px] font-bold text-gray-400 uppercase tracking-wider">${trans.costLbl}</th>
                  <th class="px-4 py-3 text-end text-[10px] font-bold text-gray-400 uppercase tracking-wider">${trans.costValLbl}</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHTML}
              </tbody>
              <tfoot>
                <tr class="bg-gold/[0.02] border-t border-gold/30">
                  <td class="px-4 py-4 text-xs font-bold text-white">${trans.totalLbl}</td>
                  <td class="px-4 py-4 text-sm font-black text-gold text-end whitespace-nowrap">${formattedTotal} ${trans.currency}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;
    }
  }

  // Switch active storyboard tab panel
  switchStoryTab(tabName) {
    const panels = {
      scenario: document.getElementById("panel-scenario"),
      tech: document.getElementById("panel-tech"),
      plan: document.getElementById("panel-plan"),
      finance: document.getElementById("panel-finance")
    };

    const buttons = {
      scenario: document.getElementById("tab-btn-scenario"),
      tech: document.getElementById("tab-btn-tech"),
      plan: document.getElementById("tab-btn-plan"),
      finance: document.getElementById("tab-btn-finance")
    };

    // Reset buttons
    const inactiveBtnClass = "story-tab flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all";
    const activeBtnClass = "story-tab active flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-gold/40 text-gold bg-gold/15 transition-all shadow-sm";

    Object.keys(panels).forEach(key => {
      if (panels[key]) panels[key].classList.add("hidden");
      if (buttons[key]) buttons[key].className = inactiveBtnClass;
    });

    if (panels[tabName]) panels[tabName].classList.remove("hidden");
    if (buttons[tabName]) buttons[tabName].className = activeBtnClass;
  }
};
