// ChemCrafter - Core Application Controller
import { ELEMENTS, CATEGORIES } from "./data/elements.js";
import { REACTIONS } from "./data/reactions.js";
import { QUESTS } from "./data/quests.js";
import { EQUATION_CHALLENGES, CHEMISTRY_FLASH_QUIZZES } from "./data/quizzes.js";
import { sounds } from "./modules/audio.js";
import { ParticleEngine } from "./modules/particles.js";
import { AtomBuilder } from "./modules/atomBuilder.js";
import { db } from "./modules/supabase.js";

class ChemCrafterApp {
  constructor() {
    this.lang = localStorage.getItem("chemcrafter_lang") || "ar";
    this.player = this.loadPlayer();
    this.selectedCategory = "all";
    this.searchQuery = "";
    this.flaskElements = []; // Array of element IDs in flask
    this.activeTab = "lab";
    this.currentQuestIndex = 0;
    this.currentEqIndex = 0;
    this.currentEqUserCoeffs = [];

    this.particleEngine = null;
    this.atomBuilder = null;

    this.init();
  }

  loadPlayer() {
    const saved = localStorage.getItem("chemcrafter_player");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || "مكتشف الكيمياء",
          score: parsed.score || 0,
          discoveries: Array.isArray(parsed.discoveries) ? parsed.discoveries : [],
          completedQuests: Array.isArray(parsed.completedQuests) ? parsed.completedQuests : []
        };
      } catch (e) {}
    }
    return {
      name: "مكتشف الكيمياء",
      score: 0,
      discoveries: [],
      completedQuests: []
    };
  }

  savePlayer() {
    localStorage.setItem("chemcrafter_player", JSON.stringify(this.player));
    this.updateStatsUI();
  }

  init() {
    this.setupLanguage();
    this.setupDOM();
    this.initEngines();
    this.renderCategoryFilters();
    this.renderElementShelf();
    this.renderQuests();
    this.renderEquationBalancer();
    this.renderCodex();
    this.loadSupabaseData();
    this.updateStatsUI();
  }

  setupLanguage() {
    document.documentElement.lang = this.lang;
    document.documentElement.dir = this.lang === "ar" ? "rtl" : "ltr";
    const body = document.body;
    if (this.lang === "ar") {
      body.style.fontFamily = "'Cairo', sans-serif";
    } else {
      body.style.fontFamily = "'Outfit', sans-serif";
    }
  }

  toggleLanguage() {
    this.lang = this.lang === "ar" ? "en" : "ar";
    localStorage.setItem("chemcrafter_lang", this.lang);
    this.setupLanguage();
    this.updateAllTexts();
    this.renderCategoryFilters();
    this.renderElementShelf();
    this.renderQuests();
    this.renderEquationBalancer();
    this.renderCodex();
    if (this.atomBuilder) this.atomBuilder.updateUI();
  }

  initEngines() {
    const canvas = document.getElementById("reaction-canvas");
    if (canvas) {
      this.particleEngine = new ParticleEngine(canvas);
    }

    const atomCanvas = document.getElementById("atom-canvas");
    const atomInfo = document.getElementById("atom-info-panel");
    if (atomCanvas && atomInfo) {
      this.atomBuilder = new AtomBuilder(atomCanvas, atomInfo);
      this.setupAtomControls();
    }
  }

  setupDOM() {
    // Navigation tabs
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
        sounds.click();
      });
    });

    // Sound toggle
    const soundBtn = document.getElementById("sound-toggle-btn");
    if (soundBtn) {
      soundBtn.addEventListener("click", () => {
        const enabled = sounds.toggle();
        soundBtn.innerHTML = enabled ? "🔊" : "🔇";
        soundBtn.title = enabled ? "Sound ON" : "Sound OFF";
      });
      soundBtn.innerHTML = sounds.enabled ? "🔊" : "🔇";
    }

    // Language switch button
    const langBtn = document.getElementById("lang-toggle-btn");
    if (langBtn) {
      langBtn.addEventListener("click", () => {
        this.toggleLanguage();
        sounds.click();
      });
    }

    // Element search
    const searchInput = document.getElementById("element-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderElementShelf();
      });
    }

    // Reactor Trigger buttons
    const triggerHeat = document.getElementById("trigger-heat-btn");
    if (triggerHeat) {
      triggerHeat.addEventListener("click", () => this.triggerReaction("heat"));
    }
    const triggerWater = document.getElementById("trigger-water-btn");
    if (triggerWater) {
      triggerWater.addEventListener("click", () => this.triggerReaction("water"));
    }
    const clearFlaskBtn = document.getElementById("clear-flask-btn");
    if (clearFlaskBtn) {
      clearFlaskBtn.addEventListener("click", () => {
        this.clearFlask();
        sounds.click();
      });
    }

    // Player profile modal
    const profileBtn = document.getElementById("profile-edit-btn");
    if (profileBtn) {
      profileBtn.addEventListener("click", () => this.openProfileModal());
    }

    // Drag and drop for reaction flask
    const flask = document.getElementById("reaction-flask-zone");
    if (flask) {
      flask.addEventListener("dragover", (e) => {
        e.preventDefault();
        flask.classList.add("drag-over");
      });
      flask.addEventListener("dragleave", () => {
        flask.classList.remove("drag-over");
      });
      flask.addEventListener("drop", (e) => {
        e.preventDefault();
        flask.classList.remove("drag-over");
        const elemId = e.dataTransfer.getData("text/plain");
        if (elemId) {
          this.addElementToFlask(elemId);
        }
      });
    }

    // Community Note post submit
    const postNoteBtn = document.getElementById("submit-note-btn");
    if (postNoteBtn) {
      postNoteBtn.addEventListener("click", () => this.handlePostCommunityNote());
    }
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll(".nav-tab-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.tab === tabId);
    });
    document.querySelectorAll(".tab-content-panel").forEach(panel => {
      panel.classList.toggle("hidden", panel.id !== `tab-content-${tabId}`);
    });

    if (tabId === "atom" && this.atomBuilder) {
      setTimeout(() => {
        this.atomBuilder.resize();
        this.atomBuilder.updateUI();
      }, 50);
    }
    if (tabId === "leaderboard") {
      this.loadSupabaseData();
    }
  }

  renderCategoryFilters() {
    const container = document.getElementById("category-filters-container");
    if (!container) return;
    container.innerHTML = "";

    Object.entries(CATEGORIES).forEach(([key, cat]) => {
      const btn = document.createElement("button");
      btn.className = `px-3 py-1 text-xs rounded-lg font-semibold transition-all duration-200 border ${
        this.selectedCategory === key
          ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm shadow-cyan-500/30"
          : "bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-700/50"
      }`;
      btn.textContent = this.lang === "ar" ? cat.nameAr : cat.nameEn;
      btn.addEventListener("click", () => {
        this.selectedCategory = key;
        sounds.click();
        this.renderCategoryFilters();
        this.renderElementShelf();
      });
      container.appendChild(btn);
    });
  }

  renderElementShelf() {
    const shelf = document.getElementById("element-shelf-grid");
    if (!shelf) return;
    shelf.innerHTML = "";

    const filtered = ELEMENTS.filter(el => {
      const matchCat = this.selectedCategory === "all" || el.category === this.selectedCategory;
      const q = this.searchQuery;
      const matchSearch = !q ||
        el.symbol.toLowerCase().includes(q) ||
        el.nameAr.toLowerCase().includes(q) ||
        el.nameEn.toLowerCase().includes(q) ||
        String(el.number).includes(q);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      shelf.innerHTML = `<div class="col-span-full py-8 text-center text-slate-500 text-sm">
        ${this.lang === "ar" ? "لا توجد عناصر مطابقة للبحث" : "No matching elements found"}
      </div>`;
      return;
    }

    filtered.forEach(el => {
      const card = document.createElement("div");
      card.className = "element-card";
      card.draggable = true;
      card.dataset.elementId = el.id;

      card.innerHTML = `
        <span class="elem-number">${el.number}</span>
        <span class="elem-symbol" style="color: ${el.color}; text-shadow: 0 0 10px ${el.color}66;">${el.symbol}</span>
        <span class="elem-name text-slate-300">${this.lang === "ar" ? el.nameAr : el.nameEn}</span>
      `;

      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", el.id);
        sounds.click();
      });

      // Quick click to add to flask
      card.addEventListener("click", () => {
        this.addElementToFlask(el.id);
      });

      shelf.appendChild(card);
    });
  }

  addElementToFlask(elementId) {
    const elem = ELEMENTS.find(e => e.id === elementId);
    if (!elem) return;

    if (this.flaskElements.length >= 8) {
      this.showToast(
        this.lang === "ar" ? "الدورق ممتلئ! افرغ الوعاء أو ابدأ التفاعل." : "Flask is full! Clear or ignite reaction.",
        "warning"
      );
      return;
    }

    this.flaskElements.push(elementId);
    sounds.bubble();
    this.renderFlaskContents();

    // Check automatic reaction (catalyst = none)
    this.checkReaction("none", false);
  }

  removeElementFromFlask(index) {
    if (index >= 0 && index < this.flaskElements.length) {
      this.flaskElements.splice(index, 1);
      sounds.click();
      this.renderFlaskContents();
    }
  }

  clearFlask() {
    this.flaskElements = [];
    this.renderFlaskContents();
  }

  renderFlaskContents() {
    const container = document.getElementById("flask-items-display");
    const emptyHint = document.getElementById("flask-empty-hint");
    if (!container) return;

    container.innerHTML = "";

    if (this.flaskElements.length === 0) {
      if (emptyHint) emptyHint.classList.remove("hidden");
      return;
    }

    if (emptyHint) emptyHint.classList.add("hidden");

    this.flaskElements.forEach((elemId, idx) => {
      const el = ELEMENTS.find(e => e.id === elemId);
      if (!el) return;

      const badge = document.createElement("div");
      badge.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 shadow-md transform hover:scale-105 transition-all cursor-pointer";
      badge.innerHTML = `
        <span class="font-mono font-black text-base" style="color:${el.color};">${el.symbol}</span>
        <span class="text-xs text-slate-300 font-semibold">${this.lang === "ar" ? el.nameAr : el.nameEn}</span>
        <span class="text-rose-400 text-xs ml-1 hover:text-rose-300 font-bold">×</span>
      `;
      badge.addEventListener("click", () => {
        this.removeElementFromFlask(idx);
      });
      container.appendChild(badge);
    });
  }

  triggerReaction(catalystType = "heat") {
    sounds.whoosh();
    this.checkReaction(catalystType, true);
  }

  checkReaction(catalystType, userTriggered = false) {
    if (this.flaskElements.length === 0) {
      if (userTriggered) {
        this.showToast(this.lang === "ar" ? "أضف عناصر أولاً إلى دورق التفاعل!" : "Add elements to the flask first!", "info");
      }
      return;
    }

    // Count present elements
    const counts = {};
    this.flaskElements.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });

    // Find best matching reaction
    let matchedReaction = null;

    for (let rx of REACTIONS) {
      // Check catalyst requirement
      if (rx.catalyst !== "none" && rx.catalyst !== catalystType) {
        continue;
      }

      // Check if all required reactants exist in sufficient quantity
      let satisfies = true;
      for (let [reqElem, reqCount] of Object.entries(rx.requiredCounts)) {
        if (!counts[reqElem] || counts[reqElem] < reqCount) {
          satisfies = false;
          break;
        }
      }

      if (satisfies) {
        matchedReaction = rx;
        break;
      }
    }

    if (matchedReaction) {
      this.executeReaction(matchedReaction);
    } else if (userTriggered) {
      // Incompatible elements or missing thermal energy
      this.particleEngine.triggerReactionVisual({
        color: "#9E9E9E",
        particles: "smoke",
        flash: false,
        explosionLevel: 0
      });
      sounds.sizzle();
      this.showToast(
        this.lang === "ar" ? "لم يحدث تفاعل! تحقق من نسب العناصر أو جرب تحفيزاً مختلفاً." : "No reaction occurred! Check element ratios or catalyst.",
        "warning"
      );
    }
  }

  executeReaction(rx) {
    // 1. Play visual & audio effects
    this.particleEngine.triggerReactionVisual(rx.visualEffect);
    sounds.playEffect(rx.visualEffect.sound || "pop");

    // 2. Remove consumed elements from flask
    for (let [elem, count] of Object.entries(rx.requiredCounts)) {
      for (let i = 0; i < count; i++) {
        const idx = this.flaskElements.indexOf(elem);
        if (idx !== -1) {
          this.flaskElements.splice(idx, 1);
        }
      }
    }
    this.renderFlaskContents();

    // 3. Award points & register discovery
    const isNew = !this.player.discoveries.includes(rx.id);
    if (isNew) {
      this.player.discoveries.push(rx.id);
      this.player.score += rx.points;
      sounds.triumph();
    } else {
      this.player.score += Math.floor(rx.points * 0.25);
    }

    // 4. Check quest progression
    this.checkQuestCompletion(rx.id);

    // 5. Save & Sync
    this.savePlayer();
    this.renderCodex();
    db.submitScore(this.player.name, this.player.score, this.player.discoveries.length, this.player.completedQuests.length);

    // 6. Show Discovery Celebration Modal
    this.showDiscoveryModal(rx, isNew);
  }

  checkQuestCompletion(reactionId) {
    QUESTS.forEach(q => {
      if (q.targetReactionId === reactionId && !this.player.completedQuests.includes(q.id)) {
        this.player.completedQuests.push(q.id);
        this.player.score += q.rewardXP;
        this.showToast(
          (this.lang === "ar" ? "🎉 تم إكمال المهمة: " : "🎉 Quest Completed: ") + (this.lang === "ar" ? q.titleAr : q.titleEn),
          "success"
        );
        this.renderQuests();
      }
    });
  }

  showDiscoveryModal(rx, isNew) {
    const modal = document.getElementById("discovery-modal");
    if (!modal) return;

    document.getElementById("disc-modal-title").textContent = isNew
      ? (this.lang === "ar" ? "✨ اكتشاف كيميائي جديد! ✨" : "✨ New Chemical Discovery! ✨")
      : (this.lang === "ar" ? "⚗️ نجاح التفاعل الكيميائي" : "⚗️ Reaction Synthesized");

    document.getElementById("disc-product-name").textContent = this.lang === "ar" ? rx.productNameAr : rx.productNameEn;
    document.getElementById("disc-product-formula").textContent = rx.productFormula;
    document.getElementById("disc-equation").textContent = rx.formula;
    document.getElementById("disc-enthalpy").textContent = `${this.lang === "ar" ? (rx.enthalpy === "exothermic" ? "طارد للحرارة" : "ماص للحرارة") : rx.enthalpy.toUpperCase()} (${rx.deltaH})`;
    document.getElementById("disc-lore").textContent = this.lang === "ar" ? rx.descAr : rx.descEn;
    document.getElementById("disc-points").textContent = `+${rx.points} XP`;

    modal.classList.remove("hidden");
    const closeBtn = document.getElementById("disc-modal-close");
    closeBtn.onclick = () => {
      modal.classList.add("hidden");
      sounds.click();
    };
  }

  // Quests rendering
  renderQuests() {
    const list = document.getElementById("quests-list-container");
    if (!list) return;
    list.innerHTML = "";

    QUESTS.forEach((q) => {
      const isDone = this.player.completedQuests.includes(q.id);
      const card = document.createElement("div");
      card.className = `p-4 rounded-2xl border transition-all ${
        isDone
          ? "bg-emerald-950/20 border-emerald-500/40"
          : "bg-slate-900/70 border-slate-800 hover:border-cyan-500/40"
      }`;

      card.innerHTML = `
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <span class="inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
              isDone ? "bg-emerald-500/20 text-emerald-300" : "bg-cyan-500/20 text-cyan-300"
            }">
              ${this.lang === "ar" ? `المستوى ${q.level}` : `Level ${q.level}`}
            </span>
            <h4 class="text-base font-bold text-slate-100 mt-1">${this.lang === "ar" ? q.titleAr : q.titleEn}</h4>
          </div>
          <div class="text-right">
            <span class="text-xs font-mono font-bold text-amber-400">+${q.rewardXP} XP</span>
            <div class="text-lg">${isDone ? "✅" : "⏳"}</div>
          </div>
        </div>
        <p class="text-xs text-slate-400 mb-3 leading-relaxed">${this.lang === "ar" ? q.storyAr : q.storyEn}</p>
        <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <span class="text-cyan-400 font-mono font-bold">${this.lang === "ar" ? "الهدف: " : "Target: "}${q.targetFormula}</span>
          <span class="text-slate-500">${this.lang === "ar" ? "تلميح: " : "Hint: "}${this.lang === "ar" ? q.hintAr : q.hintEn}</span>
        </div>
      `;
      list.appendChild(card);
    });
  }

  // Equation Balancer Mode
  renderEquationBalancer() {
    const chal = EQUATION_CHALLENGES[this.currentEqIndex];
    if (!chal) return;

    const titleElem = document.getElementById("eq-challenge-title");
    const formulaContainer = document.getElementById("eq-interactive-formula");
    const atomCountContainer = document.getElementById("eq-atom-balance-report");
    const hintElem = document.getElementById("eq-hint-text");

    if (titleElem) titleElem.textContent = this.lang === "ar" ? chal.titleAr : chal.titleEn;
    if (hintElem) hintElem.textContent = this.lang === "ar" ? chal.hintAr : chal.hintEn;

    const totalTerms = chal.reactants.length + chal.products.length;
    if (this.currentEqUserCoeffs.length !== totalTerms) {
      this.currentEqUserCoeffs = new Array(totalTerms).fill(1);
    }

    if (formulaContainer) {
      formulaContainer.innerHTML = "";

      let termIdx = 0;

      // Reactants
      chal.reactants.forEach((r, i) => {
        const span = this.createTermWidget(termIdx, r.formula);
        formulaContainer.appendChild(span);
        termIdx++;

        if (i < chal.reactants.length - 1) {
          const plus = document.createElement("span");
          plus.className = "text-xl font-bold text-slate-400 px-1";
          plus.textContent = "+";
          formulaContainer.appendChild(plus);
        }
      });

      // Arrow
      const arrow = document.createElement("span");
      arrow.className = "text-2xl font-bold text-cyan-400 px-3 font-mono";
      arrow.textContent = "➔";
      formulaContainer.appendChild(arrow);

      // Products
      chal.products.forEach((p, i) => {
        const span = this.createTermWidget(termIdx, p.formula);
        formulaContainer.appendChild(span);
        termIdx++;

        if (i < chal.products.length - 1) {
          const plus = document.createElement("span");
          plus.className = "text-xl font-bold text-slate-400 px-1";
          plus.textContent = "+";
          formulaContainer.appendChild(plus);
        }
      });
    }

    this.checkEquationBalanceState(chal, atomCountContainer);

    // Next / Prev buttons
    const nextBtn = document.getElementById("eq-next-btn");
    const prevBtn = document.getElementById("eq-prev-btn");
    if (nextBtn) {
      nextBtn.onclick = () => {
        this.currentEqIndex = (this.currentEqIndex + 1) % EQUATION_CHALLENGES.length;
        this.currentEqUserCoeffs = [];
        sounds.click();
        this.renderEquationBalancer();
      };
    }
    if (prevBtn) {
      prevBtn.onclick = () => {
        this.currentEqIndex = (this.currentEqIndex - 1 + EQUATION_CHALLENGES.length) % EQUATION_CHALLENGES.length;
        this.currentEqUserCoeffs = [];
        sounds.click();
        this.renderEquationBalancer();
      };
    }
  }

  createTermWidget(termIdx, formula) {
    const wrap = document.createElement("div");
    wrap.className = "inline-flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700";

    const decBtn = document.createElement("button");
    decBtn.className = "w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold flex items-center justify-center text-sm";
    decBtn.textContent = "-";
    decBtn.onclick = () => {
      if (this.currentEqUserCoeffs[termIdx] > 1) {
        this.currentEqUserCoeffs[termIdx]--;
        sounds.click();
        this.renderEquationBalancer();
      }
    };

    const valSpan = document.createElement("span");
    valSpan.className = "font-mono font-bold text-lg text-amber-300 w-5 text-center";
    valSpan.textContent = this.currentEqUserCoeffs[termIdx];

    const incBtn = document.createElement("button");
    incBtn.className = "w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold flex items-center justify-center text-sm";
    incBtn.textContent = "+";
    incBtn.onclick = () => {
      if (this.currentEqUserCoeffs[termIdx] < 9) {
        this.currentEqUserCoeffs[termIdx]++;
        sounds.click();
        this.renderEquationBalancer();
      }
    };

    const formulaSpan = document.createElement("span");
    formulaSpan.className = "font-mono font-bold text-lg text-slate-100 ml-1";
    formulaSpan.textContent = formula;

    wrap.appendChild(decBtn);
    wrap.appendChild(valSpan);
    wrap.appendChild(incBtn);
    wrap.appendChild(formulaSpan);
    return wrap;
  }

  checkEquationBalanceState(chal, reportContainer) {
    if (!reportContainer) return;

    // Calculate left vs right atom tallies
    const leftAtoms = {};
    const rightAtoms = {};

    let termIdx = 0;
    chal.reactants.forEach(r => {
      const c = this.currentEqUserCoeffs[termIdx] || 1;
      for (let [atom, count] of Object.entries(r.elements)) {
        leftAtoms[atom] = (leftAtoms[atom] || 0) + count * c;
      }
      termIdx++;
    });

    chal.products.forEach(p => {
      const c = this.currentEqUserCoeffs[termIdx] || 1;
      for (let [atom, count] of Object.entries(p.elements)) {
        rightAtoms[atom] = (rightAtoms[atom] || 0) + count * c;
      }
      termIdx++;
    });

    const allAtoms = Array.from(new Set([...Object.keys(leftAtoms), ...Object.keys(rightAtoms)]));
    let isAllBalanced = true;

    let rowsHtml = allAtoms.map(atom => {
      const l = leftAtoms[atom] || 0;
      const r = rightAtoms[atom] || 0;
      const match = l === r;
      if (!match) isAllBalanced = false;
      return `
        <div class="flex items-center justify-between py-1.5 px-3 rounded-lg ${match ? "bg-emerald-950/30 text-emerald-300" : "bg-rose-950/30 text-rose-300"} text-xs font-mono">
          <span class="font-bold">${atom}</span>
          <span>${this.lang === "ar" ? "المتفاعلات: " : "Reactants: "}${l}</span>
          <span>${this.lang === "ar" ? "النواتج: " : "Products: "}${r}</span>
          <span>${match ? "✅" : "❌"}</span>
        </div>
      `;
    }).join("");

    reportContainer.innerHTML = rowsHtml;

    const statusBanner = document.getElementById("eq-status-banner");
    if (statusBanner) {
      if (isAllBalanced) {
        statusBanner.className = "p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-center font-bold text-sm";
        statusBanner.innerHTML = `🎉 ${this.lang === "ar" ? "المعادلة متزنة بالكامل! أحسنت يا كيميائي." : "Equation Perfectly Balanced! Outstanding work."}`;
      } else {
        statusBanner.className = "p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 text-center text-xs";
        statusBanner.innerHTML = `⚖️ ${this.lang === "ar" ? "قم بوزن المعاملات حتى تتساوى ذرات كل عنصر في الطرفين." : "Adjust the coefficients until all atoms match on both sides."}`;
      }
    }
  }

  // Atom builder controls
  setupAtomControls() {
    const bindBtn = (id, fn) => {
      const b = document.getElementById(id);
      if (b) b.onclick = fn;
    };
    bindBtn("atom-p-plus", () => this.atomBuilder.addProton());
    bindBtn("atom-p-minus", () => this.atomBuilder.removeProton());
    bindBtn("atom-n-plus", () => this.atomBuilder.addNeutron());
    bindBtn("atom-n-minus", () => this.atomBuilder.removeNeutron());
    bindBtn("atom-e-plus", () => this.atomBuilder.addElectron());
    bindBtn("atom-e-minus", () => this.atomBuilder.removeElectron());

    // Quick presets
    document.querySelectorAll(".atom-preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const p = parseInt(btn.dataset.p);
        const n = parseInt(btn.dataset.n);
        const e = parseInt(btn.dataset.e);
        this.atomBuilder.setParticles(p, n, e);
        sounds.spark();
      });
    });
  }

  // Discoveries Codex rendering
  renderCodex() {
    const grid = document.getElementById("codex-grid-container");
    if (!grid) return;
    grid.innerHTML = "";

    REACTIONS.forEach(rx => {
      const unlocked = this.player.discoveries.includes(rx.id);
      const card = document.createElement("div");
      card.className = `p-3.5 rounded-2xl border transition-all ${
        unlocked
          ? "bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-950/20"
          : "bg-slate-950/40 border-slate-800/80 opacity-60"
      }`;

      if (unlocked) {
        card.innerHTML = `
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-mono font-bold text-cyan-400">${rx.productFormula}</span>
            <span class="text-xs text-amber-400 font-mono">+${rx.points} XP</span>
          </div>
          <h4 class="text-sm font-bold text-slate-100 mb-1">${this.lang === "ar" ? rx.productNameAr : rx.productNameEn}</h4>
          <div class="text-[11px] font-mono text-slate-400 mb-2">${rx.formula}</div>
          <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">${this.lang === "ar" ? rx.descAr : rx.descEn}</p>
        `;
      } else {
        card.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <span class="text-lg">🔒</span>
            <span class="text-xs text-slate-600 font-mono">???</span>
          </div>
          <h4 class="text-sm font-bold text-slate-500 mb-1">${this.lang === "ar" ? "مركب مجهول" : "Undiscovered Compound"}</h4>
          <p class="text-[11px] text-slate-600">${this.lang === "ar" ? "اخلط العناصر في الدورق لاكتشافه!" : "Combine elements in the flask to unlock!"}</p>
        `;
      }
      grid.appendChild(card);
    });
  }

  // Supabase Data
  async loadSupabaseData() {
    const lbContainer = document.getElementById("leaderboard-tbody");
    if (lbContainer) {
      const data = await db.getLeaderboard();
      lbContainer.innerHTML = "";
      data.forEach((p, idx) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-800/60 hover:bg-slate-800/30 text-xs";
        const medal = idx === 0 ? "🥇" : (idx === 1 ? "🥈" : (idx === 2 ? "🥉" : `#${idx + 1}`));
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-bold">${medal}</td>
          <td class="py-2.5 px-3 font-semibold text-slate-200">${p.player_name}</td>
          <td class="py-2.5 px-3 font-mono font-bold text-amber-300">${p.score}</td>
          <td class="py-2.5 px-3 font-mono text-cyan-300">${p.discoveries_count || 0}</td>
          <td class="py-2.5 px-3 font-mono text-emerald-300">${p.quests_completed || 0}</td>
        `;
        lbContainer.appendChild(tr);
      });
    }

    const notesContainer = document.getElementById("community-notes-grid");
    if (notesContainer) {
      const notes = await db.getCommunityNotes();
      notesContainer.innerHTML = "";
      notes.forEach(n => {
        const card = document.createElement("div");
        card.className = "p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex flex-col justify-between";
        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-cyan-300">${n.author}</span>
              <span class="text-[10px] font-mono text-slate-500">${n.formula || ""}</span>
            </div>
            <h5 class="text-xs font-bold text-slate-200 mb-1">${n.title}</h5>
            <p class="text-xs text-slate-400 leading-relaxed">${n.content}</p>
          </div>
          <div class="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-slate-800/60">
            <button class="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors like-btn">
              ❤️ <span>${n.likes || 1}</span>
            </button>
          </div>
        `;
        const likeBtn = card.querySelector(".like-btn");
        if (likeBtn) {
          likeBtn.onclick = async () => {
            await db.likeNote(n.id, n.likes || 1);
            n.likes = (n.likes || 1) + 1;
            likeBtn.querySelector("span").textContent = n.likes;
            sounds.click();
          };
        }
        notesContainer.appendChild(card);
      });
    }
  }

  async handlePostCommunityNote() {
    const authorInput = document.getElementById("note-author-input");
    const formulaInput = document.getElementById("note-formula-input");
    const contentInput = document.getElementById("note-content-input");

    const author = authorInput ? authorInput.value.trim() : "";
    const formula = formulaInput ? formulaInput.value.trim() : "";
    const content = contentInput ? contentInput.value.trim() : "";

    if (!author || !content) {
      this.showToast(this.lang === "ar" ? "يرجى كتابة الاسم والملاحظة!" : "Please provide name and note content!", "warning");
      return;
    }

    const ok = await db.postCommunityNote(author, formula || "ملاحظة كيميائية", formula, content);
    if (ok) {
      sounds.triumph();
      this.showToast(this.lang === "ar" ? "تم نشر ملاحظتك في المختبر!" : "Note posted to the lab community!", "success");
      if (contentInput) contentInput.value = "";
      if (formulaInput) formulaInput.value = "";
      this.loadSupabaseData();
    } else {
      this.showToast(this.lang === "ar" ? "حدث خطأ أثناء النشر" : "Failed to post note", "error");
    }
  }

  updateStatsUI() {
    const scoreElem = document.getElementById("header-player-score");
    const discCountElem = document.getElementById("header-disc-count");
    const playerNameElem = document.getElementById("header-player-name");

    if (scoreElem) scoreElem.textContent = this.player.score;
    if (discCountElem) discCountElem.textContent = `${this.player.discoveries.length} / ${REACTIONS.length}`;
    if (playerNameElem) playerNameElem.textContent = this.player.name;
  }

  openProfileModal() {
    const name = prompt(
      this.lang === "ar" ? "أدخل اسمك في المختبر ولوحة الشرف:" : "Enter your lab player name:",
      this.player.name
    );
    if (name && name.trim() !== "") {
      this.player.name = name.trim();
      this.savePlayer();
      db.submitScore(this.player.name, this.player.score, this.player.discoveries.length, this.player.completedQuests.length);
      sounds.click();
      this.loadSupabaseData();
    }
  }

  showToast(message, type = "info") {
    let container = document.getElementById("toast-notifications-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-notifications-container";
      container.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    const borderCol = type === "success" ? "border-emerald-500 bg-emerald-950/90 text-emerald-200" :
                     (type === "warning" ? "border-amber-500 bg-amber-950/90 text-amber-200" : "border-cyan-500 bg-slate-900/90 text-cyan-200");
    toast.className = `px-4 py-2.5 rounded-xl border ${borderCol} shadow-xl backdrop-blur text-xs font-semibold transform transition-all duration-300 opacity-0 translate-y-2 pointer-events-auto`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove("opacity-0", "translate-y-2");
    }, 10);

    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  updateAllTexts() {
    // Dynamic text updates on language toggle
    document.querySelectorAll("[data-i18n-ar]").forEach(el => {
      const text = this.lang === "ar" ? el.dataset.i18nAr : el.dataset.i18nEn;
      if (text) el.textContent = text;
    });
  }
}

// Instantiate on load
window.addEventListener("DOMContentLoaded", () => {
  window.chemApp = new ChemCrafterApp();
});
