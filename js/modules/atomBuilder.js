// Interactive Bohr Model & Nuclear Atom Builder
import { ELEMENTS } from "../data/elements.js";
import { sounds } from "./audio.js";

export class AtomBuilder {
  constructor(canvas, infoPanel) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.infoPanel = infoPanel;

    this.protons = 6;  // Carbon by default
    this.neutrons = 6;
    this.electrons = 6;

    this.angle = 0;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.startLoop();
  }

  resize() {
    if (!this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = 320;
  }

  setParticles(p, n, e) {
    this.protons = Math.max(1, Math.min(20, p));
    this.neutrons = Math.max(0, Math.min(24, n));
    this.electrons = Math.max(0, Math.min(20, e));
    this.updateUI();
  }

  addProton() {
    if (this.protons < 20) {
      this.protons++;
      sounds.click();
      this.updateUI();
    }
  }
  removeProton() {
    if (this.protons > 1) {
      this.protons--;
      sounds.click();
      this.updateUI();
    }
  }

  addNeutron() {
    if (this.neutrons < 24) {
      this.neutrons++;
      sounds.click();
      this.updateUI();
    }
  }
  removeNeutron() {
    if (this.neutrons > 0) {
      this.neutrons--;
      sounds.click();
      this.updateUI();
    }
  }

  addElectron() {
    if (this.electrons < 20) {
      this.electrons++;
      sounds.click();
      this.updateUI();
    }
  }
  removeElectron() {
    if (this.electrons > 0) {
      this.electrons--;
      sounds.click();
      this.updateUI();
    }
  }

  getMatchedElement() {
    return ELEMENTS.find(el => el.number === this.protons) || {
      symbol: `E-${this.protons}`,
      nameAr: `عنصر ${this.protons}`,
      nameEn: `Element ${this.protons}`
    };
  }

  getStability() {
    // Basic nuclear stability heuristic for light elements (N/Z ratio roughly 1.0 to 1.3)
    if (this.protons === 1 && this.neutrons === 0) return { stable: true, descAr: "بروتيوم (مستقر)", descEn: "Protium (Stable)" };
    if (this.protons === 1 && this.neutrons === 1) return { stable: true, descAr: "ديوتيريوم (مستقر)", descEn: "Deuterium (Stable)" };
    if (this.protons === 1 && this.neutrons === 2) return { stable: false, descAr: "تريتيوم (نظير مشع)", descEn: "Tritium (Radioactive)" };

    const ratio = this.neutrons / this.protons;
    if (ratio >= 0.8 && ratio <= 1.35) {
      return { stable: true, descAr: "نواة مستقرة طبيعياً", descEn: "Stable Nucleus" };
    } else {
      return { stable: false, descAr: "نواة غير مستقرة (مشعة)", descEn: "Unstable (Radioactive)" };
    }
  }

  getCharge() {
    return this.protons - this.electrons;
  }

  getShellConfiguration() {
    // Shell capacities: K=2, L=8, M=8, N=2 (for Z <= 20)
    const shells = [];
    let rem = this.electrons;
    const caps = [2, 8, 8, 2];
    for (let c of caps) {
      if (rem > 0) {
        const take = Math.min(rem, c);
        shells.push(take);
        rem -= take;
      } else {
        break;
      }
    }
    return shells;
  }

  updateUI() {
    if (!this.infoPanel) return;
    const el = this.getMatchedElement();
    const stab = this.getStability();
    const charge = this.getCharge();
    const chargeStr = charge === 0 ? "ذرة متعادلة كهربائياً (0)" : (charge > 0 ? `أيون موجب (كاتيون +${charge})` : `أيون سالب (أنيون ${charge})`);
    const chargeClass = charge === 0 ? "text-emerald-400" : (charge > 0 ? "text-amber-400" : "text-cyan-400");
    const stabClass = stab.stable ? "text-emerald-400" : "text-rose-400";

    this.infoPanel.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div class="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
          <div class="text-xs text-slate-400">العنصر المتكون</div>
          <div class="text-xl font-bold text-cyan-300 font-mono">${el.symbol} (${el.nameAr})</div>
          <div class="text-xs text-slate-500">${el.nameEn}</div>
        </div>
        <div class="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
          <div class="text-xs text-slate-400">العدد الذري والكتلي</div>
          <div class="text-lg font-bold text-amber-300 font-mono">Z = ${this.protons} | A = ${this.protons + this.neutrons}</div>
          <div class="text-xs text-slate-500">الكتلة = ${this.protons + this.neutrons} a.m.u</div>
        </div>
        <div class="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
          <div class="text-xs text-slate-400">الشحنة الكهربائية</div>
          <div class="text-base font-bold ${chargeClass}">${chargeStr}</div>
          <div class="text-xs text-slate-500">p⁺: ${this.protons} | e⁻: ${this.electrons}</div>
        </div>
        <div class="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
          <div class="text-xs text-slate-400">استقرار النواة</div>
          <div class="text-base font-bold ${stabClass}">${stab.descAr}</div>
          <div class="text-xs text-slate-500">${stab.descEn}</div>
        </div>
      </div>
    `;
  }

  startLoop() {
    const loop = () => {
      this.angle += 0.02;
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    const shells = this.getShellConfiguration();
    const baseRadius = 45;
    const shellStep = 28;

    // Draw electron orbits (Bohr shells)
    shells.forEach((electronsInShell, idx) => {
      const r = baseRadius + idx * shellStep;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      this.ctx.strokeStyle = "rgba(79, 195, 247, 0.25)";
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([4, 4]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Draw electrons revolving
      const dir = idx % 2 === 0 ? 1 : -1;
      for (let i = 0; i < electronsInShell; i++) {
        const eAngle = this.angle * (1.2 / (idx + 1)) * dir + (i * (Math.PI * 2) / electronsInShell);
        const ex = cx + Math.cos(eAngle) * r;
        const ey = cy + Math.sin(eAngle) * r;

        // Electron glow
        this.ctx.save();
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = "#00E5FF";
        this.ctx.fillStyle = "#00E5FF";
        this.ctx.beginPath();
        this.ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    });

    // Draw Nucleus
    const totalNuclear = this.protons + this.neutrons;
    const nucRadius = Math.max(14, Math.min(28, Math.sqrt(totalNuclear) * 5));

    // Outer glow for nucleus
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, nucRadius + 4, 0, Math.PI * 2);
    this.ctx.fillStyle = "rgba(255, 87, 34, 0.15)";
    this.ctx.fill();

    // Draw protons & neutrons inside nucleus
    for (let i = 0; i < this.protons; i++) {
      const pAngle = (i / this.protons) * Math.PI * 2 + Math.sin(this.angle + i) * 0.2;
      const dist = (i % 2 === 0 ? 0.3 : 0.65) * nucRadius;
      const px = cx + Math.cos(pAngle) * dist;
      const py = cy + Math.sin(pAngle) * dist;

      this.ctx.fillStyle = "#FF5252"; // Red proton
      this.ctx.beginPath();
      this.ctx.arc(px, py, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }

    for (let j = 0; j < this.neutrons; j++) {
      const nAngle = (j / Math.max(1, this.neutrons)) * Math.PI * 2 + Math.cos(this.angle + j) * 0.2;
      const dist = (j % 2 === 0 ? 0.5 : 0.8) * nucRadius;
      const nx = cx + Math.cos(nAngle) * dist;
      const ny = cy + Math.sin(nAngle) * dist;

      this.ctx.fillStyle = "#B0BEC5"; // Gray neutron
      this.ctx.beginPath();
      this.ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }
}
