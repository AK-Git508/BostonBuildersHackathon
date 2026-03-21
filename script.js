// ============================================================
// DRUG INTERACTION LAB — Hackathon-Ready Frontend
// Demo Mode · Risk Score · Live AI Feedback · Animated Body
// RxNorm · Claude AI · OpenFDA
// ============================================================

"use strict";

// ============================================================
// 1. DRUG DATABASE — Real pharmacokinetic parameters
// ============================================================

const MAX_DRUGS = 10;
const DRUG_COLORS = [
  "#00d4ff",
  "#ff6b9d",
  "#ffd60a",
  "#7c3aed",
  "#10b981",
  "#f97316",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#ec4899",
];
const DRUG_COLORS_BG = [
  "rgba(0,212,255,0.12)",
  "rgba(255,107,157,0.12)",
  "rgba(255,214,10,0.12)",
  "rgba(124,58,237,0.12)",
  "rgba(16,185,129,0.12)",
  "rgba(249,115,22,0.12)",
  "rgba(239,68,68,0.12)",
  "rgba(6,182,212,0.12)",
  "rgba(132,204,22,0.12)",
  "rgba(236,72,153,0.12)",
];

const DRUG_DB = {
  aspirin: {
    name: "Aspirin",
    genericName: "Acetylsalicylic Acid",
    drugClass: "NSAID / Antiplatelet",
    halfLife: 3.5,
    bioavailability: 0.8,
    Vd: 0.17,
    Tmax: 1.0,
    proteinBinding: 80,
    defaultDose: 325,
    doseRange: [81, 975],
    doseStep: 81,
    primaryOrgan: "blood",
    affectedOrgans: ["liver", "gi", "kidneys"],
    mechanism:
      "Irreversibly inhibits COX-1 and COX-2 enzymes, blocking prostaglandin and thromboxane synthesis.",
    uses: ["Pain relief", "Fever", "Antiplatelet", "Anti-inflammatory"],
    interactions: {
      warfarin: {
        severity: "high",
        mechanism:
          "Additive anticoagulation + protein binding displacement. Greatly increases bleeding risk.",
      },
      ibuprofen: {
        severity: "medium",
        mechanism:
          "Competitive COX-1 binding reduces aspirin's antiplatelet effect.",
      },
      metformin: {
        severity: "low",
        mechanism:
          "High-dose aspirin may slightly enhance hypoglycemic effect.",
      },
      lisinopril: {
        severity: "low",
        mechanism: "High-dose aspirin may reduce ACE inhibitor efficacy.",
      },
      sertraline: {
        severity: "medium",
        mechanism: "Additive increase in GI bleeding risk.",
      },
    },
    pkModifiers: {},
    contraindications: [
      "Bleeding disorders",
      "Active peptic ulcer",
      "Children with viral illness",
    ],
    monitoring: ["Signs of bleeding", "Tinnitus", "GI symptoms"],
  },
  ibuprofen: {
    name: "Ibuprofen",
    genericName: "Ibuprofen",
    drugClass: "NSAID",
    halfLife: 2.0,
    bioavailability: 0.8,
    Vd: 0.14,
    Tmax: 1.5,
    proteinBinding: 99,
    defaultDose: 400,
    doseRange: [200, 800],
    doseStep: 200,
    primaryOrgan: "liver",
    affectedOrgans: ["liver", "kidneys", "gi"],
    mechanism:
      "Reversibly inhibits COX-1 and COX-2. Reduces prostaglandin synthesis causing analgesic, antipyretic, and anti-inflammatory effects.",
    uses: ["Pain relief", "Fever", "Inflammation", "Dysmenorrhea"],
    interactions: {
      warfarin: {
        severity: "high",
        mechanism:
          "Displaces warfarin from albumin + inhibits platelet function. Major bleeding risk.",
      },
      lisinopril: {
        severity: "medium",
        mechanism:
          "NSAIDs reduce renal prostaglandins → decreased ACE inhibitor efficacy + AKI risk.",
      },
      aspirin: {
        severity: "medium",
        mechanism:
          "Competitive COX-1 binding reduces aspirin antiplatelet effect.",
      },
      sertraline: {
        severity: "medium",
        mechanism:
          "Combined platelet inhibition + GI mucosal damage → increased GI bleeding risk.",
      },
      metformin: {
        severity: "low",
        mechanism: "NSAIDs may decrease renal metformin clearance.",
      },
    },
    pkModifiers: {},
    contraindications: [
      "Renal impairment (eGFR <30)",
      "Active GI ulcer",
      "Third trimester pregnancy",
    ],
    monitoring: [
      "Renal function",
      "GI symptoms",
      "Blood pressure",
      "Bleeding signs",
    ],
  },
  warfarin: {
    name: "Warfarin",
    genericName: "Warfarin Sodium",
    drugClass: "Anticoagulant (Vitamin K Antagonist)",
    halfLife: 40.0,
    bioavailability: 0.99,
    Vd: 0.14,
    Tmax: 4.0,
    proteinBinding: 99,
    defaultDose: 5,
    doseRange: [1, 15],
    doseStep: 1,
    primaryOrgan: "liver",
    affectedOrgans: ["liver", "blood"],
    mechanism:
      "Inhibits vitamin K epoxide reductase (VKORC1), blocking clotting factors II, VII, IX, X. Very narrow therapeutic index.",
    uses: [
      "DVT/PE",
      "Atrial fibrillation",
      "Mechanical heart valves",
      "Stroke prevention",
    ],
    interactions: {
      aspirin: {
        severity: "high",
        mechanism:
          "Additive anticoagulation + platelet inhibition → major hemorrhage risk.",
      },
      ibuprofen: {
        severity: "high",
        mechanism:
          "Protein binding displacement increases free warfarin + NSAID bleeding risk.",
      },
      omeprazole: {
        severity: "medium",
        mechanism:
          "CYP2C19 inhibition increases warfarin levels. INR may increase 15–35%.",
      },
      sertraline: {
        severity: "medium",
        mechanism:
          "CYP2C9 inhibition increases S-warfarin levels. SSRIs also reduce platelet aggregation.",
      },
      atorvastatin: {
        severity: "low",
        mechanism: "Mild potentiation of anticoagulant effect.",
      },
      amoxicillin: {
        severity: "medium",
        mechanism:
          "Alters gut flora → reduces vitamin K synthesis → may increase INR.",
      },
      acetaminophen: {
        severity: "medium",
        mechanism:
          "Chronic high-dose acetaminophen inhibits warfarin metabolism (CYP2C9).",
      },
    },
    pkModifiers: {},
    contraindications: [
      "Active bleeding",
      "Pregnancy",
      "Recent intracranial surgery",
    ],
    monitoring: [
      "INR (target 2.0–3.0)",
      "Signs of bleeding",
      "Diet (vitamin K)",
    ],
  },
  metformin: {
    name: "Metformin",
    genericName: "Metformin HCl",
    drugClass: "Biguanide (Antidiabetic)",
    halfLife: 6.5,
    bioavailability: 0.5,
    Vd: 4.6,
    Tmax: 2.5,
    proteinBinding: 0,
    defaultDose: 500,
    doseRange: [500, 2000],
    doseStep: 500,
    primaryOrgan: "kidneys",
    affectedOrgans: ["gi", "liver", "kidneys"],
    mechanism:
      "Activates AMPK, reducing hepatic gluconeogenesis. Improves peripheral insulin sensitivity. Does not cause hypoglycemia as monotherapy.",
    uses: ["Type 2 diabetes", "Prediabetes", "Insulin resistance", "PCOS"],
    interactions: {
      aspirin: {
        severity: "low",
        mechanism: "High-dose aspirin may potentiate glucose-lowering.",
      },
      ibuprofen: {
        severity: "low",
        mechanism: "NSAIDs may reduce renal metformin clearance.",
      },
    },
    pkModifiers: {},
    contraindications: [
      "eGFR <30",
      "Metabolic acidosis",
      "Iodinated contrast (hold 48h)",
    ],
    monitoring: [
      "eGFR annually",
      "Vitamin B12 levels",
      "Lactic acid if symptoms",
    ],
  },
  lisinopril: {
    name: "Lisinopril",
    genericName: "Lisinopril",
    drugClass: "ACE Inhibitor",
    halfLife: 12.0,
    bioavailability: 0.25,
    Vd: 0.5,
    Tmax: 7.0,
    proteinBinding: 0,
    defaultDose: 10,
    doseRange: [2.5, 40],
    doseStep: 2.5,
    primaryOrgan: "kidneys",
    affectedOrgans: ["kidneys", "heart", "blood"],
    mechanism:
      "Inhibits ACE, blocking angiotensin I → II conversion. Reduces vasoconstriction, aldosterone secretion, and sodium retention.",
    uses: [
      "Hypertension",
      "Heart failure",
      "Post-MI cardioprotection",
      "Diabetic nephropathy",
    ],
    interactions: {
      ibuprofen: {
        severity: "medium",
        mechanism:
          "NSAIDs blunt renal prostaglandins → reduced ACE inhibitor effect + AKI risk.",
      },
      aspirin: {
        severity: "low",
        mechanism: "High-dose aspirin may attenuate ACE inhibitor benefit.",
      },
    },
    pkModifiers: {},
    contraindications: [
      "Bilateral renal artery stenosis",
      "History of angioedema",
      "Pregnancy",
    ],
    monitoring: [
      "Blood pressure",
      "Potassium",
      "Creatinine/eGFR",
      "Angioedema symptoms",
    ],
  },
  atorvastatin: {
    name: "Atorvastatin",
    genericName: "Atorvastatin Calcium",
    drugClass: "Statin (HMG-CoA Inhibitor)",
    halfLife: 14.0,
    bioavailability: 0.14,
    Vd: 5.4,
    Tmax: 1.0,
    proteinBinding: 98,
    defaultDose: 20,
    doseRange: [10, 80],
    doseStep: 10,
    primaryOrgan: "liver",
    affectedOrgans: ["liver"],
    mechanism:
      "Competitively inhibits HMG-CoA reductase in the liver. Upregulates hepatic LDL receptors, increasing LDL-C clearance.",
    uses: [
      "Hypercholesterolemia",
      "CV risk reduction",
      "Atherosclerosis prevention",
    ],
    interactions: {
      warfarin: {
        severity: "low",
        mechanism: "Mild inhibition of warfarin metabolism.",
      },
    },
    pkModifiers: {},
    contraindications: ["Active hepatic disease", "Pregnancy/breastfeeding"],
    monitoring: [
      "LFTs if symptomatic",
      "Muscle symptoms (CK if myopathy)",
      "Lipid panel",
    ],
  },
  sertraline: {
    name: "Sertraline",
    genericName: "Sertraline HCl",
    drugClass: "SSRI (Antidepressant)",
    halfLife: 26.0,
    bioavailability: 0.44,
    Vd: 20.0,
    Tmax: 4.5,
    proteinBinding: 98,
    defaultDose: 50,
    doseRange: [25, 200],
    doseStep: 25,
    primaryOrgan: "brain",
    affectedOrgans: ["brain", "liver", "gi"],
    mechanism:
      "Selectively inhibits serotonin transporter (SERT), increasing synaptic serotonin. Takes 2–4 weeks for full effect.",
    uses: [
      "Major depression",
      "Panic disorder",
      "OCD",
      "PTSD",
      "Social anxiety",
    ],
    interactions: {
      warfarin: {
        severity: "medium",
        mechanism:
          "CYP2C9 inhibition increases S-warfarin levels. SSRIs reduce platelet aggregation.",
      },
      ibuprofen: {
        severity: "medium",
        mechanism:
          "SSRIs reduce platelet serotonin; combined with NSAID markedly increases GI bleeding risk.",
      },
      aspirin: {
        severity: "medium",
        mechanism: "Combined platelet effect increases bleeding risk 3-fold.",
      },
    },
    pkModifiers: { warfarin: { halfLifeMultiplier: 1.25 } },
    contraindications: ["Concurrent MAOI (within 14 days)", "Pimozide"],
    monitoring: [
      "Suicidal ideation (first 2–4 weeks)",
      "Serotonin syndrome signs",
      "Weight changes",
    ],
  },
  omeprazole: {
    name: "Omeprazole",
    genericName: "Omeprazole",
    drugClass: "Proton Pump Inhibitor",
    halfLife: 1.5,
    bioavailability: 0.4,
    Vd: 0.3,
    Tmax: 2.0,
    proteinBinding: 95,
    defaultDose: 20,
    doseRange: [10, 40],
    doseStep: 10,
    primaryOrgan: "gi",
    affectedOrgans: ["gi", "liver"],
    mechanism:
      "Irreversibly inhibits H+/K+-ATPase proton pump in gastric parietal cells, reducing acid secretion by >90%.",
    uses: [
      "GERD",
      "Peptic ulcer",
      "H. pylori eradication",
      "Zollinger-Ellison syndrome",
    ],
    interactions: {
      warfarin: {
        severity: "medium",
        mechanism:
          "Inhibits CYP2C19, increasing R-warfarin levels. INR may increase 15–35%.",
      },
    },
    pkModifiers: { warfarin: { halfLifeMultiplier: 1.2 } },
    contraindications: ["Hypersensitivity to PPIs"],
    monitoring: [
      "Magnesium (long-term)",
      "B12 (long-term)",
      "Bone density (long-term)",
    ],
  },
  amoxicillin: {
    name: "Amoxicillin",
    genericName: "Amoxicillin Trihydrate",
    drugClass: "Aminopenicillin Antibiotic",
    halfLife: 1.1,
    bioavailability: 0.9,
    Vd: 0.3,
    Tmax: 1.5,
    proteinBinding: 20,
    defaultDose: 500,
    doseRange: [250, 1000],
    doseStep: 250,
    primaryOrgan: "kidneys",
    affectedOrgans: ["lungs", "gi", "kidneys"],
    mechanism:
      "Beta-lactam that inhibits bacterial cell wall synthesis by binding PBPs. Bactericidal. Renally excreted unchanged.",
    uses: [
      "Respiratory infections",
      "Otitis media",
      "Sinusitis",
      "H. pylori",
      "Dental prophylaxis",
    ],
    interactions: {
      warfarin: {
        severity: "medium",
        mechanism:
          "Disrupts GI flora producing vitamin K → may increase INR unpredictably.",
      },
    },
    pkModifiers: {},
    contraindications: ["Penicillin allergy", "Mononucleosis (rash risk)"],
    monitoring: ["Allergic reactions", "GI tolerance", "INR if on warfarin"],
  },
  acetaminophen: {
    name: "Acetaminophen",
    genericName: "Paracetamol",
    drugClass: "Analgesic / Antipyretic",
    halfLife: 2.5,
    bioavailability: 0.9,
    Vd: 0.9,
    Tmax: 1.0,
    proteinBinding: 25,
    defaultDose: 500,
    doseRange: [325, 1000],
    doseStep: 325,
    primaryOrgan: "liver",
    affectedOrgans: ["liver"],
    mechanism:
      "Inhibits COX-3 centrally. Modulates endocannabinoid and serotonergic pathways. Hepatotoxic in overdose via NAPQI.",
    uses: ["Pain", "Fever", "Osteoarthritis", "Safe NSAID alternative"],
    interactions: {
      warfarin: {
        severity: "medium",
        mechanism:
          "Chronic high-dose (>2g/day) inhibits CYP2C9, significantly increasing INR.",
      },
    },
    pkModifiers: { warfarin: { halfLifeMultiplier: 1.15 } },
    contraindications: ["Severe hepatic disease", "Liver failure"],
    monitoring: [
      "LFTs with chronic use",
      "Total daily dose (max 4g/day; 2g in liver disease)",
    ],
  },
};

// ============================================================
// THERAPEUTIC WINDOWS — Drug-specific safe plasma concentration ranges (ng/mL)
// ============================================================

const THERAPEUTIC_WINDOWS = {
  aspirin: { min: 10000, max: 80000, label: "Anti-inflammatory range" },
  ibuprofen: { min: 5000, max: 25000, label: "Analgesic range" },
  warfarin: { min: 0.8, max: 2.5, label: "Anticoagulant range" },
  metformin: { min: 200, max: 1200, label: "Antidiabetic range" },
  lisinopril: { min: 3, max: 35, label: "Antihypertensive range" },
  atorvastatin: { min: 5, max: 100, label: "Lipid-lowering range" },
  sertraline: { min: 15, max: 200, label: "Antidepressant range" },
  omeprazole: { min: 200, max: 1800, label: "PPI effective range" },
  amoxicillin: { min: 100, max: 3000, label: "Above MIC range" },
  acetaminophen: { min: 3000, max: 20000, label: "Analgesic range" },
};

const ORGAN_SVG_MAP = {
  brain: ["organBrain"],
  heart: ["organHeart"],
  lungs: ["organLungsL", "organLungsR"],
  liver: ["organLiver"],
  gi: ["organGI", "organIntestines"],
  kidneys: ["organKidneyL", "organKidneyR"],
  blood: ["organHeart"],
};

const ORGAN_ROLES = {
  brain: {
    name: "Brain / CNS",
    role: "Target & Distribution",
    desc: "CNS penetration depends on lipophilicity and P-glycoprotein efflux. High drug levels here affect mood, cognition, and autonomic control.",
  },
  heart: {
    name: "Heart",
    role: "Circulation",
    desc: "Pumps drug through systemic circulation. Cardiac output affects distribution speed; some drugs directly alter heart rate and rhythm.",
  },
  lungs: {
    name: "Lungs",
    role: "Pulmonary circulation",
    desc: "Receives entire cardiac output each cycle. Drugs that alter pulmonary vasculature can affect oxygenation and gas exchange.",
  },
  liver: {
    name: "Liver",
    role: "Metabolism (CYP450)",
    desc: "Primary site of drug metabolism via CYP enzymes (CYP3A4, 2D6, 2C9). First-pass effect reduces oral bioavailability. Drug interactions here are most common.",
  },
  gi: {
    name: "GI Tract",
    role: "Absorption",
    desc: "Primary oral absorption site. P-gp efflux and gut-wall CYP3A4 affect bioavailability before systemic entry. Food timing matters here.",
  },
  kidneys: {
    name: "Kidneys",
    role: "Excretion (renal)",
    desc: "Primary elimination route for hydrophilic drugs. Reduced eGFR slows clearance, causing drug accumulation and toxicity risk.",
  },
  blood: {
    name: "Blood / Plasma",
    role: "Distribution vehicle",
    desc: "Drug transported bound to plasma proteins (albumin). Displacement interactions raise free drug concentration and amplify effects.",
  },
};

// Drug color RGB values for inline style computation
const DRUG_COLORS_RGB = [
  { r: 0, g: 212, b: 255 }, // cyan
  { r: 255, g: 107, b: 157 }, // pink
  { r: 255, g: 214, b: 10 }, // yellow
  { r: 124, g: 58, b: 237 }, // purple
  { r: 16, g: 185, b: 129 }, // emerald
  { r: 249, g: 115, b: 22 }, // orange
  { r: 239, g: 68, b: 68 }, // red
  { r: 6, g: 182, b: 212 }, // light blue
  { r: 132, g: 204, b: 22 }, // lime
  { r: 236, g: 72, b: 153 }, // hot pink
];

const KIDNEY_HINTS = {
  100: "",
  75: "Stage G2 — mild reduction",
  50: "Stage G3 — moderate CKD; dose adjust some drugs",
  30: "Stage G4 — severe CKD; avoid metformin, dose adjust amoxicillin",
  10: "Stage G5 — kidney failure; many drugs contraindicated",
};

// ============================================================
// 2. DEMO SCENARIOS
// ============================================================

const DEMO_SCENARIOS = {
  high: {
    name: "High-Risk: Warfarin + Aspirin",
    slots: [
      { drugId: "warfarin", dose: 5, adminTime: 0, frequency: "single" },
      { drugId: "aspirin", dose: 325, adminTime: 0, frequency: "single" },
    ],
    patient: { age: 72, weight: 68, kidneyFunction: 55, liverFunction: "mild" },
  },
  safe: {
    name: "Safe: Metformin + Omeprazole",
    slots: [
      { drugId: "metformin", dose: 1000, adminTime: 0, frequency: "bid" },
      { drugId: "omeprazole", dose: 20, adminTime: 0, frequency: "single" },
    ],
    patient: {
      age: 55,
      weight: 82,
      kidneyFunction: 90,
      liverFunction: "normal",
    },
  },
  moderate: {
    name: "Moderate: Sertraline + Ibuprofen + Warfarin",
    slots: [
      { drugId: "sertraline", dose: 100, adminTime: 0, frequency: "single" },
      { drugId: "ibuprofen", dose: 400, adminTime: 2, frequency: "tid" },
      { drugId: "warfarin", dose: 5, adminTime: 0, frequency: "single" },
    ],
    patient: {
      age: 65,
      weight: 75,
      kidneyFunction: 70,
      liverFunction: "normal",
    },
  },
};

// ============================================================
// 3. STATE
// ============================================================

const state = {
  slots: [],
  patient: {
    age: 45,
    weight: 70,
    kidneyFunction: 100,
    liverFunction: "normal",
  },
  simulationResults: null,
  rxnormInteractions: [],
  chatHistory: [],
  claudeAvailable: false,
  currentTab: "simulation",
  fdaCache: {},
  dynamicDrugCache: {},
  discoveryState: {
    condition: "",
    foundDrugs: [],
    drugsWithPK: [],
    mlResults: null,
    selectedForLoad: [],
  },
  riskScore: null,
  timeAnimationId: null,
  bodyTimeAnimationId: null,
  organSnapshot: {}, // svgId → { organKey, drugs, maxIntensity, isDanger, concentration, phase }
  currentBodyTime: 0,
};

// Helper: get drug data from dynamic cache or static DB
function getDrugData(drugId) {
  return state.dynamicDrugCache[drugId] || DRUG_DB[drugId] || null;
}

let concentrationChart = null;
let fdaSidebarDebounce = null;
let fdaSidebarResults = [];
let feedbackDebounce = null;

// ============================================================
// 4. INITIALIZATION
// ============================================================

function enterApp() {
  const landing = document.getElementById("landingScreen");
  if (!landing) return;
  landing.classList.add("landing-exit");
  setTimeout(() => {
    landing.style.display = "none";
  }, 600);
}

document.addEventListener("DOMContentLoaded", init);

function init() {
  checkServerStatus();
  addDrugSlot();
  initChart();
  initEventListeners();
  renderChatContext();
  updateRiskScore();
}

function initEventListeners() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  document.querySelectorAll(".viz-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchVizView(btn.dataset.viz));
  });

  // Patient sliders — with real-time feedback
  document.getElementById("patientAge").addEventListener("input", (e) => {
    state.patient.age = +e.target.value;
    document.getElementById("patientAgeValue").textContent = e.target.value;
    onParameterChange();
  });
  document.getElementById("patientWeight").addEventListener("input", (e) => {
    state.patient.weight = +e.target.value;
    document.getElementById("patientWeightValue").textContent = e.target.value;
    onParameterChange();
  });
  document.getElementById("kidneyFunction").addEventListener("input", (e) => {
    state.patient.kidneyFunction = +e.target.value;
    document.getElementById("kidneyFunctionValue").textContent = e.target.value;
    updateKidneyHint(+e.target.value);
    onParameterChange();
  });
  document.getElementById("liverFunction").addEventListener("change", (e) => {
    state.patient.liverFunction = e.target.value;
    onParameterChange();
  });

  document.getElementById("addDrugBtn").addEventListener("click", addDrugSlot);
  document
    .getElementById("simulateBtn")
    .addEventListener("click", runSimulation);
  document.getElementById("resetBtn").addEventListener("click", resetAll);
  document
    .getElementById("reportBtn")
    .addEventListener("click", generateReport);

  document.getElementById("modalClose").addEventListener("click", closeModal);
  document
    .getElementById("closeReportBtn")
    .addEventListener("click", closeModal);
  document
    .getElementById("printReportBtn")
    .addEventListener("click", printReport);
  document.getElementById("reportModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("reportModal")) closeModal();
  });

  document
    .getElementById("sendChatBtn")
    .addEventListener("click", sendChatMessage);
  document.getElementById("chatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  document.querySelectorAll(".quick-q-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.dataset.q;
      if (q) {
        document.getElementById("chatInput").value = q;
        sendChatMessage();
      }
    });
  });

  document.getElementById("fdaSearchSidebar").addEventListener("input", (e) => {
    clearTimeout(fdaSidebarDebounce);
    const q = e.target.value.trim();
    if (q.length < 2) {
      hideFdaSidebarAutocomplete();
      return;
    }
    document.getElementById("fdaSpinnerSidebar").style.display = "flex";
    fdaSidebarDebounce = setTimeout(() => searchFdaSidebar(q), 350);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".fda-sidebar")) hideFdaSidebarAutocomplete();
  });

  // Time scrubber for chart
  document
    .getElementById("timeScrubberSlider")
    .addEventListener("input", (e) => {
      const t = +e.target.value;
      document.getElementById("scrubberTimeLabel").textContent = `T+${t}h`;
      highlightChartTime(t);
    });
}

// ============================================================
// 5. REAL-TIME AI FEEDBACK
// ============================================================

function onParameterChange() {
  updateInteractionBanner();
  updateRiskScore();
  updateLiveFeedback();
  renderChatContext();
}

function updateLiveFeedback() {
  clearTimeout(feedbackDebounce);
  feedbackDebounce = setTimeout(() => {
    const ticker = document.getElementById("aiFeedbackTicker");
    const text = document.getElementById("tickerText");
    const activeSlots = state.slots.filter((s) => s.drugId);

    if (activeSlots.length === 0) {
      ticker.className = "ai-feedback-ticker";
      text.textContent = "Select drugs to begin interaction analysis";
      return;
    }

    // Gather insights
    const insights = [];
    const interactions = getInteractions();

    // Drug-specific feedback
    if (state.patient.age > 65) {
      const longHalfLife = activeSlots.filter(
        (s) => getDrugData(s.drugId).halfLife > 12,
      );
      if (longHalfLife.length) {
        insights.push(
          `⚡ Metabolism slowing — ${longHalfLife.map((s) => getDrugData(s.drugId).name).join(", ")} may accumulate in elderly patient (${state.patient.age}y)`,
        );
      }
    }

    if (state.patient.kidneyFunction < 60) {
      const renalDrugs = activeSlots.filter((s) =>
        ["amoxicillin", "metformin", "lisinopril"].includes(s.drugId),
      );
      if (renalDrugs.length) {
        insights.push(
          `🔴 Renal alert — ${renalDrugs.map((s) => getDrugData(s.drugId).name).join(", ")} requires dose adjustment for eGFR ${state.patient.kidneyFunction}%`,
        );
      }
    }

    if (state.patient.liverFunction !== "normal") {
      const hepaticDrugs = activeSlots.filter((s) =>
        ["warfarin", "atorvastatin", "sertraline", "acetaminophen"].includes(
          s.drugId,
        ),
      );
      if (hepaticDrugs.length) {
        insights.push(
          `🟡 Hepatic impairment — ${hepaticDrugs.map((s) => getDrugData(s.drugId).name).join(", ")} exposure may increase`,
        );
      }
    }

    interactions.forEach((ix) => {
      if (ix.severity === "high") {
        insights.unshift(
          `🔴 DANGER: ${ix.drugA} + ${ix.drugB} — ${ix.mechanism.split(".")[0]}`,
        );
      } else if (ix.severity === "medium") {
        insights.push(
          `⚠️ Potential interaction: ${ix.drugA} + ${ix.drugB} — risk increasing`,
        );
      }
    });

    if (insights.length === 0) {
      if (activeSlots.length === 1) {
        const drug = getDrugData(activeSlots[0].drugId);
        text.textContent = `${drug.name} selected — add another drug to check interactions`;
        ticker.className = "ai-feedback-ticker";
      } else {
        text.textContent = `✓ No significant interactions detected between selected drugs`;
        ticker.className = "ai-feedback-ticker risk-low";
      }
    } else {
      // Rotate through insights
      const topInsight = insights[0];
      text.textContent = topInsight;

      const hasHigh = interactions.some((ix) => ix.severity === "high");
      const hasMedium = interactions.some((ix) => ix.severity === "medium");

      ticker.className =
        "ai-feedback-ticker " +
        (hasHigh ? "risk-high" : hasMedium ? "risk-moderate" : "risk-low");
    }
  }, 150);
}

function getInteractions() {
  const activeSlots = state.slots.filter((s) => s.drugId);
  const found = [];
  for (let i = 0; i < activeSlots.length; i++) {
    for (let j = i + 1; j < activeSlots.length; j++) {
      const drugA = getDrugData(activeSlots[i].drugId);
      const drugB = getDrugData(activeSlots[j].drugId);
      const ix =
        drugA.interactions?.[activeSlots[j].drugId] ||
        drugB.interactions?.[activeSlots[i].drugId];
      if (ix) found.push({ drugA: drugA.name, drugB: drugB.name, ...ix });
    }
  }
  return found;
}

function getInteractionsWithIds() {
  const activeSlots = state.slots.filter((s) => s.drugId);
  const found = [];
  for (let i = 0; i < activeSlots.length; i++) {
    for (let j = i + 1; j < activeSlots.length; j++) {
      const drugA = getDrugData(activeSlots[i].drugId);
      const drugB = getDrugData(activeSlots[j].drugId);
      const ix =
        drugA.interactions?.[activeSlots[j].drugId] ||
        drugB.interactions?.[activeSlots[i].drugId];
      if (ix)
        found.push({
          drugA: drugA.name,
          drugB: drugB.name,
          drugAId: activeSlots[i].drugId,
          drugBId: activeSlots[j].drugId,
          ...ix,
        });
    }
  }
  return found;
}

// ============================================================
// 6. RISK SCORE (0-100)
// ============================================================

function updateRiskScore() {
  const activeSlots = state.slots.filter((s) => s.drugId);
  const container = document.getElementById("riskScoreContainer");
  const arc = document.getElementById("riskArc");
  const numberEl = document.getElementById("riskNumber");
  const dotEl = document.getElementById("riskDot");
  const sevText = document.getElementById("riskSeverityText");
  const factorsEl = document.getElementById("riskFactors");

  if (activeSlots.length === 0) {
    container.className = "risk-score-container";
    arc.style.strokeDashoffset = 327;
    arc.style.stroke = "var(--text-muted)";
    numberEl.textContent = "—";
    numberEl.style.color = "var(--text-muted)";
    dotEl.style.background = "var(--text-muted)";
    sevText.textContent = "Select drugs to assess";
    factorsEl.innerHTML = "";
    state.riskScore = null;
    return;
  }

  let score = 0;
  const factors = [];
  const interactions = getInteractions();

  // Interaction-based scoring
  interactions.forEach((ix) => {
    if (ix.severity === "high") {
      score += 35;
      factors.push(`Major: ${ix.drugA} + ${ix.drugB}`);
    } else if (ix.severity === "medium") {
      score += 18;
      factors.push(`Moderate: ${ix.drugA} + ${ix.drugB}`);
    } else if (ix.severity === "low") {
      score += 5;
    }
  });

  // Patient risk factors
  if (state.patient.age > 75) {
    score += 12;
    factors.push("Patient age >75");
  } else if (state.patient.age > 65) {
    score += 6;
    factors.push("Elderly patient");
  }

  if (state.patient.kidneyFunction < 30) {
    score += 15;
    factors.push("Severe renal impairment");
  } else if (state.patient.kidneyFunction < 60) {
    score += 8;
    factors.push("Reduced kidney function");
  }

  if (state.patient.liverFunction === "severe") {
    score += 15;
    factors.push("Severe liver impairment");
  } else if (state.patient.liverFunction === "moderate") {
    score += 10;
    factors.push("Moderate liver impairment");
  } else if (state.patient.liverFunction === "mild") {
    score += 4;
  }

  // Drug count factor
  if (activeSlots.length >= 3) {
    score += 5;
    factors.push("Polypharmacy (3+ drugs)");
  }

  // Narrow therapeutic index drugs
  const ntiDrugs = activeSlots.filter((s) => ["warfarin"].includes(s.drugId));
  if (ntiDrugs.length) {
    score += 8;
    factors.push("Narrow therapeutic index drug");
  }

  score = Math.min(100, Math.max(0, score));
  state.riskScore = score;

  // Update visuals
  const circumference = 327;
  const offset = circumference - (score / 100) * circumference;
  arc.style.strokeDashoffset = offset;

  let color, label, riskClass;
  if (score >= 60) {
    color = "var(--danger-color)";
    label = "HIGH RISK";
    riskClass = "risk-high";
  } else if (score >= 30) {
    color = "var(--warning-color)";
    label = "MODERATE RISK";
    riskClass = "risk-moderate";
  } else {
    color = "var(--success-color)";
    label = "LOW RISK";
    riskClass = "risk-low";
  }

  arc.style.stroke = color;
  numberEl.textContent = score;
  numberEl.style.color = color;
  dotEl.style.background = color;
  dotEl.style.boxShadow = `0 0 6px ${color}`;
  sevText.textContent = label;
  container.className = `risk-score-container ${riskClass}`;

  factorsEl.innerHTML = factors
    .slice(0, 4)
    .map((f) => `<div class="risk-factor-item">${f}</div>`)
    .join("");
}

// ============================================================
// 7. DEMO MODE
// ============================================================

function loadDemoScenario(key) {
  const scenario = DEMO_SCENARIOS[key];
  if (!scenario) return;

  // Reset first
  state.slots = [];
  state.simulationResults = null;
  state.rxnormInteractions = [];

  // Set patient
  state.patient = { ...scenario.patient };
  document.getElementById("patientAge").value = state.patient.age;
  document.getElementById("patientAgeValue").textContent = state.patient.age;
  document.getElementById("patientWeight").value = state.patient.weight;
  document.getElementById("patientWeightValue").textContent =
    state.patient.weight;
  document.getElementById("kidneyFunction").value =
    state.patient.kidneyFunction;
  document.getElementById("kidneyFunctionValue").textContent =
    state.patient.kidneyFunction;
  updateKidneyHint(state.patient.kidneyFunction);
  document.getElementById("liverFunction").value = state.patient.liverFunction;

  // Open advanced if non-default
  if (
    state.patient.kidneyFunction < 100 ||
    state.patient.liverFunction !== "normal"
  ) {
    const adv = document.getElementById("advancedSettings");
    adv.classList.remove("collapsed");
    document.getElementById("advancedToggle").classList.add("open");
  }

  // Set drug slots
  state.slots = scenario.slots.map((s) => ({ ...s, collapsed: false }));
  renderSlots();
  updateAddDrugBtn();
  updateDrugsActiveCount();
  updateInteractionBanner();
  updateRiskScore();
  updateLiveFeedback();
  renderChatContext();
  fetchRxNormInteractions();

  showToast(`Loaded: ${scenario.name}`, "info");

  // Auto-run simulation after brief delay
  setTimeout(() => runSimulation(), 600);
}

// ============================================================
// 8. ADVANCED SETTINGS TOGGLE
// ============================================================

function toggleAdvanced() {
  const el = document.getElementById("advancedSettings");
  const btn = document.getElementById("advancedToggle");
  el.classList.toggle("collapsed");
  btn.classList.toggle("open");
}

// ============================================================
// 9. SERVER STATUS
// ============================================================

async function checkServerStatus() {
  const dot = document.getElementById("statusDot");
  const text = document.getElementById("statusText");
  const chatDot = document.getElementById("chatStatusDot");
  const chatText = document.getElementById("chatStatusText");

  try {
    const res = await fetch("/api/health", {
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    if (data.claudeConfigured) {
      dot.className = "status-dot connected";
      text.textContent = "Claude AI Connected";
      chatDot.className = "status-dot connected";
      chatText.textContent = "Claude AI Ready";
      const d2 = document.getElementById("chatStatusDot2");
      const t2 = document.getElementById("chatStatusText2");
      if (d2) {
        d2.className = "status-dot connected";
        t2.textContent = "Claude AI Ready";
      }
      state.claudeAvailable = true;
      document.getElementById("aiSourceBadge").textContent = "Claude AI";
      document.getElementById("aiSourceBadge").classList.add("active");
    } else {
      dot.className = "status-dot partial";
      text.textContent = "Server up · Claude not configured";
      chatDot.className = "status-dot partial";
      chatText.textContent = "Online";
      const d2 = document.getElementById("chatStatusDot2");
      const t2 = document.getElementById("chatStatusText2");
      if (d2) {
        d2.className = "status-dot partial";
        t2.textContent = "Online";
      }
    }
  } catch {
    dot.className = "status-dot disconnected";
    text.textContent = "Online";
    chatDot.className = "status-dot disconnected";
    chatText.textContent = "Offline";
    const d2 = document.getElementById("chatStatusDot2");
    const t2 = document.getElementById("chatStatusText2");
    if (d2) {
      d2.className = "status-dot disconnected";
      t2.textContent = "Offline";
    }
  }
}

// ============================================================
// 10. TAB & VIEW SWITCHING
// ============================================================

function switchTab(tabId) {
  state.currentTab = tabId;
  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tabId);
    b.setAttribute("aria-selected", b.dataset.tab === tabId);
  });
  document.getElementById("simulationTab").style.display =
    tabId === "simulation" ? "" : "none";
  document
    .getElementById("simulationTab")
    .classList.toggle("active", tabId === "simulation");
  document.getElementById("discoveryTab").style.display =
    tabId === "discovery" ? "" : "none";
  document
    .getElementById("discoveryTab")
    .classList.toggle("active", tabId === "discovery");
  if (tabId === "discovery") renderChatContext();
}

function switchAISubtab(subtab) {
  document
    .querySelectorAll(".ai-subtab")
    .forEach((b) => b.classList.toggle("active", b.dataset.subtab === subtab));
  document.getElementById("discoverySubtab").style.display =
    subtab === "discovery" ? "flex" : "none";
  document.getElementById("chatbotSubtab").style.display =
    subtab === "chatbot" ? "flex" : "none";
  if (subtab === "chatbot") renderChatContext();
}

function switchVizView(viz) {
  document
    .querySelectorAll(".viz-tab")
    .forEach((b) => b.classList.toggle("active", b.dataset.viz === viz));
  document.getElementById("chartView").style.display =
    viz === "chart" ? "" : "none";
  document
    .getElementById("chartView")
    .classList.toggle("active", viz === "chart");
  document.getElementById("bodyView").style.display =
    viz === "body" ? "" : "none";
  document
    .getElementById("bodyView")
    .classList.toggle("active", viz === "body");
}

// ============================================================
// 11. DRUG SLOTS
// ============================================================

function addDrugSlot() {
  if (state.slots.length >= MAX_DRUGS) {
    showToast(`Maximum ${MAX_DRUGS} drugs at once`, "warning");
    return;
  }
  state.slots.push({
    drugId: null,
    root: "",
    dose: 0,
    adminTime: 0,
    frequency: "single",
    collapsed: false,
  });
  renderSlots();
  updateAddDrugBtn();
}

function removeDrugSlot(index) {
  state.slots.splice(index, 1);
  renderSlots();
  updateAddDrugBtn();
  onParameterChange();
  updateDrugsActiveCount();
  fetchRxNormInteractions();
  showToast("Drug removed", "info");
}

function updateAddDrugBtn() {
  const btn = document.getElementById("addDrugBtn");
  btn.disabled = state.slots.length >= MAX_DRUGS;
}

function renderSlots() {
  const container = document.getElementById("drugSlots");
  container.innerHTML = "";

  state.slots.forEach((slot, index) => {
    const color = DRUG_COLORS[index];
    const drug = slot.drugId ? getDrugData(slot.drugId) : null;

    const div = document.createElement("div");
    div.className = `drug-slot slot-${index}`;
    div.innerHTML = `
            <div class="drug-slot-header" onclick="toggleSlot(${index})">
                <span class="drug-color-dot" style="background:${color};"></span>
                <span class="drug-slot-name">${drug ? drug.name : `Drug ${index + 1} — Select below`}</span>
                <button class="remove-drug-btn" onclick="event.stopPropagation(); removeDrugSlot(${index})" title="Remove" aria-label="Remove drug">×</button>
            </div>
            <div class="drug-slot-body ${slot.collapsed ? "collapsed" : ""}">
                <div class="control-group">
                    <label>Drug Selection</label>
                    <select class="dropdown drug-select" onchange="onDrugSelected(${index}, this.value)">
                        <option value="">— Select a drug —</option>
                        ${Object.entries(DRUG_DB)
                          .map(
                            ([id, d]) =>
                              `<option value="${id}" ${slot.drugId === id ? "selected" : ""}>${d.name} — ${d.drugClass}</option>`,
                          )
                          .join("")}
                    </select>
                </div>
                <div class="control-group">
                    <label>Drug Root (optional)</label>
                    <input type="text" class="text-input" value="${slot.root || ""}" placeholder="Enter a drug root name" onchange="onDrugRootChange(${index}, this.value)" />
                </div>
                ${
                  drug
                    ? `
                <div class="control-group">
                    <label>Dose (mg)</label>
                    <div class="slider-container">
                        <input type="range" class="slider drug-${index}" min="${drug.doseRange[0]}" max="${drug.doseRange[1]}" step="${drug.doseStep}" value="${slot.dose || drug.defaultDose}"
                            oninput="onDoseChange(${index}, this.value, this.nextElementSibling)">
                        <span class="value-display" style="color:${color};">${slot.dose || drug.defaultDose} mg</span>
                    </div>
                </div>
                <div class="drug-pk-info">
                    <strong>${drug.drugClass}</strong>${drug.isLiveDB ? ' <span class="badge-real">Live DB</span>' : ""}<br>
                    t½ = ${drug.halfLife}h · F = ${(drug.bioavailability * 100).toFixed(0)}% · Tmax ≈ ${drug.Tmax}h · PB: ${drug.proteinBinding}%
                </div>
                `
                    : ""
                }
            <div class="control-group drug-live-search-group">
                <label class="search-or-label">— or search any drug from database —</label>
                <div class="autocomplete-wrapper">
                    <input type="text" class="text-input drug-live-input"
                           placeholder="Search FDA database..."
                           data-slot="${index}"
                           autocomplete="off"
                           oninput="onDrugLiveSearch(${index}, this.value)"
                           onfocus="this.select()" />
                    <div class="autocomplete-list drug-live-results" id="drugLiveAC-${index}"></div>
                </div>
            </div>
            </div>
        `;
    container.appendChild(div);
  });
}

function toggleSlot(index) {
  state.slots[index].collapsed = !state.slots[index].collapsed;
  renderSlots();
}

function onDrugSelected(index, drugId) {
  const drug = getDrugData(drugId) || null;
  state.slots[index].drugId = drugId || null;
  state.slots[index].root = drug ? drug.genericName || drug.name || "" : "";
  state.slots[index].dose = drug ? drug.defaultDose : 0;
  state.slots[index].adminTime = 0;
  state.slots[index].frequency = "single";
  renderSlots();
  onParameterChange();
  updateDrugsActiveCount();
  fetchRxNormInteractions();
}

function onDrugRootChange(index, value) {
  state.slots[index].root = value.trim();
  onParameterChange();
}

function onDoseChange(index, value, display) {
  state.slots[index].dose = +value;
  display.textContent = `${value} mg`;
  onParameterChange();
}

function updateDrugsActiveCount() {
  document.getElementById("drugsActiveVal").textContent = state.slots.filter(
    (s) => s.drugId,
  ).length;
}

// ============================================================
// 12. INTERACTION BANNER
// ============================================================

function updateInteractionBanner() {
  const banner = document.getElementById("interactionBanner");
  const activeDrugs = state.slots
    .filter((s) => s.drugId)
    .map((s) => getDrugData(s.drugId));

  if (activeDrugs.length < 2) {
    banner.style.display = "none";
    return;
  }

  const interactions = getInteractions();
  const highestSev = interactions.reduce((h, ix) => {
    if (ix.severity === "high") return "high";
    if (ix.severity === "medium" && h !== "high") return "medium";
    if (ix.severity === "low" && h === "none") return "low";
    return h;
  }, "none");

  if (highestSev === "none") {
    banner.style.display = "none";
    return;
  }

  const icons = { high: "🔴", medium: "🟡", low: "🟢" };
  const top = interactions[0];
  banner.className = `interaction-banner ${highestSev}`;
  banner.style.display = "block";
  banner.innerHTML = `${icons[highestSev]} <strong>${highestSev.toUpperCase()}:</strong> ${top.drugA} + ${top.drugB} — ${top.mechanism.split(".")[0]}${interactions.length > 1 ? ` (+${interactions.length - 1} more)` : ""}`;
}

// ============================================================
// 13. PK ENGINE
// ============================================================

function pkConcentration(F, D_mg, ka, ke, Vd_L, t, tAdmin) {
  const dt = t - tAdmin;
  if (dt < 0) return 0;
  if (Math.abs(ka - ke) < 0.001)
    return ((F * D_mg * ka) / Vd_L) * dt * Math.exp(-ke * dt);
  return (
    ((F * D_mg * ka) / (Vd_L * (ka - ke))) *
    (Math.exp(-ke * dt) - Math.exp(-ka * dt))
  );
}

function generateDrugCurve(slot, patient, pkOverrides) {
  const SIM_HOURS = 48;
  const drug = getDrugData(slot.drugId);
  if (!drug) return Array(SIM_HOURS + 1).fill(0);

  let F = drug.bioavailability;
  let t12 = drug.halfLife;
  const Tmax = drug.Tmax;
  const D = slot.dose || drug.defaultDose;

  if (pkOverrides && pkOverrides.halfLifeMultiplier)
    t12 *= pkOverrides.halfLifeMultiplier;
  if (patient.age > 65) t12 *= 1.25;
  else if (patient.age > 80) t12 *= 1.45;

  const kidneyFactor = patient.kidneyFunction / 100;
  if (["amoxicillin", "metformin", "lisinopril"].includes(slot.drugId)) {
    t12 *= 1 + (1 - kidneyFactor) * 2;
  }

  const liverFactors = { normal: 1.0, mild: 1.25, moderate: 1.6, severe: 2.2 };
  t12 *= liverFactors[patient.liverFunction] || 1.0;
  F *= patient.liverFunction === "severe" ? 0.6 : 1.0;

  const ke = Math.log(2) / t12;
  const ka = Math.log(2) / (Tmax * 0.6);
  const Vd_L = drug.Vd * patient.weight;

  const FREQ_INTERVALS = { single: null, bid: 12, tid: 8, qid: 6 };
  const interval = FREQ_INTERVALS[slot.frequency];
  const doseTimes = [slot.adminTime];
  if (interval) {
    let next = slot.adminTime + interval;
    while (next <= SIM_HOURS) {
      doseTimes.push(next);
      next += interval;
    }
  }

  const data = [];
  for (let h = 0; h <= SIM_HOURS; h++) {
    let c = 0;
    for (const tAdmin of doseTimes)
      c += pkConcentration(F, D, ka, ke, Vd_L, h, tAdmin);
    const noise = Math.sin(h * 0.3 + slot.adminTime) * 0.02 + 1.0;
    data.push(Math.max(0, c * noise * 1000));
  }
  return data;
}

function computePKOverrides(slots) {
  const overrides = {};
  slots.forEach((slotA, i) => {
    if (!slotA.drugId) return;
    const drugA = getDrugData(slotA.drugId);
    slots.forEach((slotB, j) => {
      if (!slotB.drugId || i === j) return;
      const pkMod = drugA.pkModifiers?.[slotB.drugId];
      if (pkMod) {
        if (!overrides[j]) overrides[j] = {};
        if (pkMod.halfLifeMultiplier) {
          overrides[j].halfLifeMultiplier =
            (overrides[j].halfLifeMultiplier || 1) * pkMod.halfLifeMultiplier;
        }
      }
    });
  });
  return overrides;
}

// ============================================================
// 14. CHART
// ============================================================

function initChart() {
  const ctx = document.getElementById("concentrationChart").getContext("2d");
  if (concentrationChart) concentrationChart.destroy();
  const labels = Array.from({ length: 49 }, (_, i) =>
    i % 6 === 0 ? `${i}h` : "",
  );

  concentrationChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 800, easing: "easeInOutQuart" },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: "#8b95b0",
            font: { size: 11, family: "DM Sans" },
            usePointStyle: true,
            padding: 10,
            filter: (item) => !item.text.startsWith("_window_"),
          },
        },
        tooltip: {
          backgroundColor: "rgba(8,11,26,0.96)",
          titleColor: "#00d4ff",
          bodyColor: "#8b95b0",
          borderColor: "#00d4ff",
          borderWidth: 1,
          padding: 10,
          titleFont: { family: "DM Sans" },
          bodyFont: { family: "JetBrains Mono", size: 11 },
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)} ng/mL`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: "#5a6480",
            font: { size: 10, family: "JetBrains Mono" },
            maxTicksLimit: 7,
          },
          grid: { color: "rgba(255,255,255,0.04)" },
          title: {
            display: true,
            text: "Plasma Concentration (ng/mL)",
            color: "#00d4ff",
            font: { size: 10, family: "DM Sans" },
          },
        },
        x: {
          ticks: {
            color: "#5a6480",
            font: { size: 10, family: "JetBrains Mono" },
          },
          grid: { color: "rgba(255,255,255,0.02)" },
          title: {
            display: true,
            text: "Time (hours)",
            color: "#00d4ff",
            font: { size: 10, family: "DM Sans" },
          },
        },
      },
    },
  });
}

const TW_BG_COLORS = [
  "rgba(0,212,255,0.05)",
  "rgba(255,107,157,0.05)",
  "rgba(255,214,10,0.05)",
];

function updateChart(results) {
  if (!concentrationChart) return;
  const datasets = results.map((r, i) => ({
    label: `${r.name} (${r.dose}mg)`,
    data: r.data,
    borderColor: DRUG_COLORS[i],
    backgroundColor: DRUG_COLORS_BG[i],
    borderWidth: 2.5,
    fill: true,
    tension: 0.4,
    pointRadius: 0,
    pointHoverRadius: 5,
    pointHoverBackgroundColor: DRUG_COLORS[i],
  }));

  // Add therapeutic window bands for each drug
  results.forEach((r, i) => {
    const win = THERAPEUTIC_WINDOWS[r.drugId];
    if (!win) return;
    const color = DRUG_COLORS[i];
    datasets.push({
      label: `${r.name} – ${win.label}`,
      data: Array(49).fill(win.min),
      borderColor: color + "50",
      borderWidth: 1,
      borderDash: [5, 4],
      pointRadius: 0,
      fill: false,
      order: 10,
    });
    datasets.push({
      label: `_window_${i}`,
      data: Array(49).fill(win.max),
      borderColor: color + "50",
      backgroundColor: TW_BG_COLORS[i] || "rgba(0,212,255,0.05)",
      borderWidth: 1,
      borderDash: [5, 4],
      pointRadius: 0,
      fill: "-1",
      order: 10,
    });
  });

  concentrationChart.data.datasets = datasets;
  concentrationChart.update("active");
}

function highlightChartTime(t) {
  // Use chart annotation-like vertical line via plugin
  if (!concentrationChart || !state.simulationResults) return;
  // Simple approach: update annotation
}

// ============================================================
// 15. TIME ANIMATION
// ============================================================

function toggleTimeAnimation() {
  const btn = document.getElementById("scrubberPlayBtn");
  if (state.timeAnimationId) {
    clearInterval(state.timeAnimationId);
    state.timeAnimationId = null;
    btn.classList.remove("playing");
    btn.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    return;
  }
  btn.classList.add("playing");
  btn.innerHTML =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  const slider = document.getElementById("timeScrubberSlider");
  let t = +slider.value;

  state.timeAnimationId = setInterval(() => {
    t = (t + 1) % 49;
    slider.value = t;
    document.getElementById("scrubberTimeLabel").textContent = `T+${t}h`;
  }, 200);
}

function toggleBodyTimeAnimation() {
  const btn = document.getElementById("bodyScrubberPlayBtn");
  if (state.bodyTimeAnimationId) {
    clearInterval(state.bodyTimeAnimationId);
    state.bodyTimeAnimationId = null;
    btn.classList.remove("playing");
    btn.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    return;
  }
  btn.classList.add("playing");
  btn.innerHTML =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  const slider = document.getElementById("bodyTimeScrubberSlider");
  let t = +slider.value;

  state.bodyTimeAnimationId = setInterval(() => {
    t = (t + 1) % 49;
    slider.value = t;
    document.getElementById("bodyScrubberTimeLabel").textContent = `T+${t}h`;
    updateBodyAtTime(t);
  }, 300);
}

function updateBodyAtTime(t) {
  document.getElementById("bodyScrubberTimeLabel").textContent = `T+${t}h`;
  if (!state.simulationResults) return;
  state.currentBodyTime = t;

  const results = state.simulationResults.results;
  const activeSlots = state.slots.filter((s) => s.drugId);
  const interactions = getInteractionsWithIds();
  const highIxIds = interactions.filter((ix) => ix.severity === "high");

  // Reset all organs to base state (via style, not className, so cursor/events are preserved)
  document.querySelectorAll(".organ").forEach((el) => {
    el.className = "organ";
    el.style.fill = "";
    el.style.stroke = "";
    el.style.strokeWidth = "";
    el.style.filter = "";
    el.style.opacity = "";
    el.style.animationDuration = "";
  });

  // Build per-organ data
  const organData = {}; // svgId → { organKey, drugs:[{drugId,localIdx,intensity,concentration}], maxIntensity }

  activeSlots.forEach((slot, localIdx) => {
    const drug = getDrugData(slot.drugId);
    if (!drug) return;
    const result = results.find((r) => r.drugId === slot.drugId);
    const concentration = result ? result.data[t] || 0 : 0;
    const peak = result ? result.peak : 1;
    const intensity = Math.min(1, concentration / (peak * 0.75));

    drug.affectedOrgans.forEach((organKey) => {
      (ORGAN_SVG_MAP[organKey] || []).forEach((svgId) => {
        if (!organData[svgId])
          organData[svgId] = { organKey, drugs: [], maxIntensity: 0 };
        organData[svgId].drugs.push({
          drugId: slot.drugId,
          localIdx,
          intensity,
          concentration,
        });
        organData[svgId].maxIntensity = Math.max(
          organData[svgId].maxIntensity,
          intensity,
        );
      });
    });
  });

  // Determine ADME phase label for current time
  const avgTmax = results.length
    ? results.reduce((s, r) => s + r.tmax, 0) / results.length
    : 6;
  let phase = "Absorption";
  if (t > avgTmax * 1.8) phase = "Excretion";
  else if (t > avgTmax * 0.9) phase = "Metabolism";
  else if (t > avgTmax * 0.4) phase = "Distribution";

  const phaseEl = document.getElementById("admePhaseLabel");
  const phaseColors = {
    Absorption: "#00d4ff",
    Distribution: "#9d4edd",
    Metabolism: "#ff6b35",
    Excretion: "#ff3366",
  };
  if (phaseEl) {
    phaseEl.textContent = phase;
    phaseEl.style.color = phaseColors[phase];
    phaseEl.style.borderColor = phaseColors[phase];
  }

  state.organSnapshot = {};

  Object.entries(organData).forEach(([svgId, data]) => {
    const el = document.getElementById(svgId);
    if (!el) return;
    const { organKey, drugs, maxIntensity } = data;
    const drugIds = drugs.map((d) => d.drugId);

    // Danger = high-severity interaction where both drugs touch this organ
    const dangerIx = highIxIds.find(
      (ix) => drugIds.includes(ix.drugAId) && drugIds.includes(ix.drugBId),
    );
    const isDanger = !!dangerIx && maxIntensity > 0.15;

    state.organSnapshot[svgId] = {
      organKey,
      drugs,
      maxIntensity,
      isDanger,
      phase,
      dangerMechanism: dangerIx?.mechanism || "",
    };

    if (maxIntensity < 0.02) return; // essentially no drug here yet

    if (isDanger) {
      // Red→orange danger spectrum; faster pulse at higher concentration
      const g = Math.round(30 + (1 - maxIntensity) * 120);
      el.style.fill = `rgba(255,${g},30,${0.25 + maxIntensity * 0.55})`;
      el.style.stroke = `rgba(255,${g},30,0.95)`;
      el.style.strokeWidth = `${1.5 + maxIntensity * 1.5}`;
      el.style.filter = "url(#organGlowDanger)";
      el.classList.add("danger-zone");
      el.style.animationDuration = `${Math.max(0.6, 1.4 - maxIntensity * 0.8)}s`;
    } else if (drugs.length > 1) {
      // Multiple drugs, no high danger — purple, moderate pulse
      el.style.fill = `rgba(157,78,221,${0.12 + maxIntensity * 0.48})`;
      el.style.stroke = `rgba(157,78,221,${0.5 + maxIntensity * 0.5})`;
      el.style.strokeWidth = `${1 + maxIntensity * 1.5}`;
      el.style.filter = "url(#organGlowMulti)";
      el.classList.add("pulsing");
      el.style.animationDuration = `${Math.max(1, 2.5 - maxIntensity * 1.2)}s`;
    } else {
      // Single drug — drug's own color
      const c = DRUG_COLORS_RGB[drugs[0].localIdx % DRUG_COLORS_RGB.length];
      el.style.fill = `rgba(${c.r},${c.g},${c.b},${0.08 + maxIntensity * 0.52})`;
      el.style.stroke = `rgba(${c.r},${c.g},${c.b},${0.4 + maxIntensity * 0.6})`;
      el.style.strokeWidth = `${1 + maxIntensity * 1.5}`;
      el.style.filter =
        maxIntensity > 0.1
          ? `url(#organGlow${drugs[0].localIdx % MAX_DRUGS})`
          : "";
      if (maxIntensity > 0.05) {
        el.classList.add("pulsing");
        el.style.animationDuration = `${Math.max(0.8, 3 - maxIntensity * 2)}s`;
      }
    }
  });
}

// ============================================================
// 16. SIMULATION RUNNER
// ============================================================

async function runSimulation() {
  const activeSlots = state.slots.filter((s) => s.drugId);
  if (activeSlots.length === 0) {
    showToast("Select at least one drug", "warning");
    return;
  }

  const btn = document.getElementById("simulateBtn");
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner-small"></div> Simulating...';
  document.getElementById("chartLoading").style.display = "flex";

  // Animate ticker
  const ticker = document.getElementById("aiFeedbackTicker");
  ticker.classList.add("analyzing");
  document.getElementById("tickerText").textContent =
    "⚡ Running pharmacokinetic simulation...";

  await sleep(400);

  const pkOverrides = computePKOverrides(state.slots);
  const results = activeSlots.map((slot, localIdx) => {
    const globalIdx = state.slots.indexOf(slot);
    const overrides = pkOverrides[globalIdx] || {};
    const data = generateDrugCurve(slot, state.patient, overrides);
    const drug = getDrugData(slot.drugId);
    return {
      drugId: slot.drugId,
      root: slot.root || drug.genericName || drug.name || "",
      name: drug.name,
      dose: slot.dose || drug.defaultDose,
      frequency: slot.frequency,
      data,
      peak: Math.max(...data),
      tmax: data.indexOf(Math.max(...data)),
      auc: data.reduce((a, b) => a + b, 0),
      halfLife: drug.halfLife * (overrides.halfLifeMultiplier || 1),
      color: DRUG_COLORS[localIdx],
    };
  });

  state.simulationResults = { results, patient: { ...state.patient } };

  document.getElementById("chartLoading").style.display = "none";

  updateChart(results);
  updateMetrics(results);
  showPKSummary(results);
  updateBodyModel(activeSlots);
  renderChatContext();
  updateRiskScore();

  // Show time scrubbers
  document.getElementById("timeScrubber").style.display = "flex";
  document.getElementById("bodyTimeScrubber").style.display = "flex";

  // AI Analysis
  if (state.claudeAvailable) {
    btn.innerHTML = '<div class="spinner-small"></div> AI Analyzing...';
    document.getElementById("tickerText").textContent =
      "🤖 Claude AI generating clinical analysis...";
    await generateAIAnalysis(results);
  } else {
    generateTemplateAnalysis(results);
  }

  ticker.classList.remove("analyzing");
  updateLiveFeedback();

  btn.disabled = false;
  btn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run Simulation';

  showToast("Simulation complete!", "success");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ============================================================
// 17. METRICS & PK SUMMARY
// ============================================================

function updateMetrics(results) {
  if (!results.length) return;
  const avgTmax = results.reduce((a, r) => a + r.tmax, 0) / results.length;
  document.getElementById("drugsActiveVal").textContent = results.length;
  document.getElementById("tmaxVal").textContent = avgTmax.toFixed(1);

  const activeSlots = state.slots.filter((s) => s.drugId);
  let level = "—",
    hasMajor = false,
    hasModerate = false;

  for (let i = 0; i < activeSlots.length; i++) {
    for (let j = i + 1; j < activeSlots.length; j++) {
      const drugA = getDrugData(activeSlots[i].drugId);
      const ix = drugA?.interactions?.[activeSlots[j].drugId];
      if (ix?.severity === "high") hasMajor = true;
      if (ix?.severity === "medium") hasModerate = true;
    }
  }

  if (hasMajor) {
    level = "🔴 HIGH";
    document.getElementById("metricInteraction").style.borderColor =
      "var(--danger-color)";
  } else if (hasModerate) {
    level = "🟡 MOD";
    document.getElementById("metricInteraction").style.borderColor =
      "var(--warning-color)";
  } else if (activeSlots.length > 1) {
    level = "🟢 LOW";
    document.getElementById("metricInteraction").style.borderColor =
      "var(--success-color)";
  } else {
    document.getElementById("metricInteraction").style.borderColor = "";
  }

  document.getElementById("interactionLevelVal").textContent = level;
  document.getElementById("simDurationVal").textContent = 48;
}

function showPKSummary(results) {
  const grid = document.getElementById("pkGrid");
  grid.innerHTML = "";
  results.forEach((r) => {
    const drug = getDrugData(r.drugId);
    [
      { label: `${r.name} Cmax`, value: r.peak.toFixed(0), unit: "ng/mL" },
      { label: `${r.name} Tmax`, value: r.tmax, unit: "h" },
      { label: `${r.name} t½`, value: r.halfLife.toFixed(1), unit: "h" },
      {
        label: `${r.name} AUC`,
        value: (r.auc / 1000).toFixed(1),
        unit: "µg·h/mL",
      },
    ].forEach((item) => {
      const el = document.createElement("div");
      el.className = "pk-item";
      el.innerHTML = `<span class="pk-label">${item.label}</span><span class="pk-value">${item.value}</span><span class="pk-unit">${item.unit}</span>`;
      grid.appendChild(el);
    });
  });
  document.getElementById("pkSummary").style.display = "block";
}

// ============================================================
// 17b. ORGAN TOOLTIP & CLICK PANEL
// ============================================================

function showOrganTooltip(svgId, organKey, event) {
  const tooltip = document.getElementById("organTooltip");
  if (!tooltip) return;
  const snap = state.organSnapshot[svgId];
  const role = ORGAN_ROLES[organKey] || { name: organKey, role: "—", desc: "" };

  if (!snap || snap.maxIntensity < 0.01) {
    tooltip.innerHTML = `<strong>${role.name}</strong><div class="ott-role">${role.role}</div><div class="ott-detail">No drug present at T+${state.currentBodyTime}h</div>`;
  } else {
    const drugLines = snap.drugs
      .map((d) => {
        const drug = getDrugData(d.drugId);
        const pct = Math.round(d.intensity * 100);
        const c = DRUG_COLORS_RGB[d.localIdx % DRUG_COLORS_RGB.length];
        return `<div class="ott-drug" style="color:rgba(${c.r},${c.g},${c.b},1)">${drug?.name || d.drugId}: <strong>${pct}%</strong> of peak</div>`;
      })
      .join("");
    const dangerNote = snap.isDanger
      ? `<div class="ott-danger">⚠ Interaction risk: ${snap.dangerMechanism.split(".")[0]}</div>`
      : "";
    tooltip.innerHTML = `<strong>${role.name}</strong><div class="ott-role">${role.role} · ${snap.phase}</div>${drugLines}${dangerNote}`;
  }

  tooltip.style.display = "block";
  positionTooltip(tooltip, event);
}

function positionTooltip(tooltip, event) {
  const wrapper = document.querySelector(".body-svg-wrapper");
  if (!wrapper) return;
  const rect = wrapper.getBoundingClientRect();
  let x = event.clientX - rect.left + 14;
  let y = event.clientY - rect.top + 14;
  if (x + 200 > rect.width) x = event.clientX - rect.left - 210;
  if (y + 120 > rect.height) y = event.clientY - rect.top - 130;
  if (x < 0) x = 4;
  if (y < 0) y = 4;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideOrganTooltip() {
  const tooltip = document.getElementById("organTooltip");
  if (tooltip) tooltip.style.display = "none";
}

function showOrganPanel(svgId, organKey) {
  const panel = document.getElementById("organDetailPanel");
  if (!panel) return;
  const role = ORGAN_ROLES[organKey] || {
    name: organKey,
    role: "—",
    desc: "No data available.",
  };
  const snap = state.organSnapshot[svgId];

  let content = `<div class="odp-header">
        <span class="odp-name">${role.name}</span>
        <span class="odp-role">${role.role}</span>
        <button class="odp-close" onclick="closeOrganPanel()">✕</button>
    </div>
    <p class="odp-desc">${role.desc}</p>`;

  if (snap && snap.maxIntensity > 0.01) {
    const drugRows = snap.drugs
      .map((d) => {
        const drug = getDrugData(d.drugId);
        const pct = Math.round(d.intensity * 100);
        const conc = d.concentration.toFixed(1);
        const c = DRUG_COLORS_RGB[d.localIdx % DRUG_COLORS_RGB.length];
        const barWidth = Math.max(4, pct);
        return `<div class="odp-drug-row">
                <span class="odp-drug-name" style="color:rgba(${c.r},${c.g},${c.b},1)">${drug?.name || d.drugId}</span>
                <div class="odp-bar-wrap"><div class="odp-bar" style="width:${barWidth}%;background:rgba(${c.r},${c.g},${c.b},0.75)"></div></div>
                <span class="odp-drug-conc">${conc} ng/mL (${pct}%)</span>
            </div>`;
      })
      .join("");

    content += `<div class="odp-section-title">Drug Concentration at T+${state.currentBodyTime}h — ${snap.phase} phase</div>
        <div class="odp-drugs">${drugRows}</div>`;

    if (snap.isDanger) {
      content += `<div class="odp-danger-box">⚠ <strong>Interaction risk detected</strong><br><small>${snap.dangerMechanism}</small></div>`;
    }
  } else {
    content += `<div class="odp-no-data">No drugs present at T+${state.currentBodyTime}h. Run a simulation first.</div>`;
  }

  panel.innerHTML = content;
  panel.style.display = "block";
}

function closeOrganPanel() {
  const panel = document.getElementById("organDetailPanel");
  if (panel) panel.style.display = "none";
}

// ============================================================
// 18. BODY MODEL
// ============================================================

function updateBodyModel(activeSlots) {
  document.querySelectorAll(".organ").forEach((el) => {
    el.className = "organ";
    el.style.opacity = "";
  });
  const organDrugMap = {};

  activeSlots.forEach((slot, localIdx) => {
    const drug = getDrugData(slot.drugId);
    if (!drug) return;
    drug.affectedOrgans.forEach((organKey) => {
      const svgIds = ORGAN_SVG_MAP[organKey] || [];
      svgIds.forEach((svgId) => {
        if (!organDrugMap[svgId]) organDrugMap[svgId] = [];
        organDrugMap[svgId].push(localIdx);
      });
    });
  });

  const interactions = getInteractions();
  const hasHigh = interactions.some((ix) => ix.severity === "high");

  Object.entries(organDrugMap).forEach(([svgId, indices]) => {
    const el = document.getElementById(svgId);
    if (!el) return;
    if (indices.length > 1 && hasHigh) {
      el.classList.add("danger-zone");
    } else if (indices.length === 1) {
      el.classList.add(`active-${indices[0]}`, "pulsing");
    } else {
      el.classList.add("active-multi", "pulsing");
    }
  });

  renderOrganLegend(activeSlots, organDrugMap);

  // Auto-start body animation after brief delay
  if (state.simulationResults) {
    setTimeout(() => updateBodyAtTime(0), 100);
  }
}

function renderOrganLegend(activeSlots, organDrugMap) {
  const legend = document.getElementById("organLegend");
  const displayMap = {};

  Object.entries(organDrugMap).forEach(([svgId, indices]) => {
    const el = document.getElementById(svgId);
    const label = el?.dataset.label;
    if (!label) return;
    if (!displayMap[label]) displayMap[label] = new Set();
    indices.forEach((i) => displayMap[label].add(i));
  });

  const interactions = getInteractions();
  const highPairs = new Set(
    interactions
      .filter((ix) => ix.severity === "high")
      .map((ix) => `${ix.drugA}+${ix.drugB}`),
  );

  // Color key
  const colorKey = `<div class="legend-color-key">
        <div class="ck-title">Legend</div>
        <div class="ck-row"><span class="ck-dot" style="background:var(--cyan);box-shadow:0 0 6px var(--cyan)"></span> Drug concentration</div>
        <div class="ck-row"><span class="ck-dot" style="background:#ff3366;box-shadow:0 0 6px #ff3366"></span> Toxicity / interaction risk</div>
        <div class="ck-row"><span class="ck-dot" style="background:#9d4edd;box-shadow:0 0 6px #9d4edd"></span> Multiple drugs overlap</div>
        <div class="ck-row"><span class="ck-pulse-icon">◉</span> Pulsing = active processing</div>
        <div class="ck-row ck-intensity">Intensity = % of peak concentration</div>
    </div>`;

  if (!Object.keys(displayMap).length) {
    legend.innerHTML =
      colorKey +
      '<p class="placeholder-text" style="margin-top:0.75rem;">Run simulation to see distribution.</p>';
    return;
  }

  const organItems = Object.entries(displayMap)
    .map(([organ, indexSet]) => {
      const drugTags = [...indexSet]
        .map((i) => {
          const slot = activeSlots[i];
          const drug = getDrugData(slot.drugId);
          const color = DRUG_COLORS[i];
          return `<span class="legend-drug-tag" style="color:${color}; border-color:${color}; background:${DRUG_COLORS_BG[i]};">${drug.name}</span>`;
        })
        .join("");
      const isDanger = indexSet.size > 1 && highPairs.size > 0;
      return `<div class="legend-item" ${isDanger ? 'style="border-color:rgba(255,51,102,0.35);"' : ""}>
            <div class="legend-organ-name">${isDanger ? "⚠️" : "🫀"} ${organ}</div>
            <div class="legend-drugs">${drugTags}</div>
        </div>`;
    })
    .join("");

  legend.innerHTML = colorKey + organItems;
}

// ============================================================
// 19. RXNORM
// ============================================================

async function fetchRxNormInteractions() {
  const activeSlots = state.slots.filter((s) => s.drugId);
  if (activeSlots.length < 2) {
    state.rxnormInteractions = [];
    renderRxNormSection([]);
    return;
  }

  const drugNames = activeSlots.map((s) => getDrugData(s.drugId).genericName);
  try {
    const res = await fetch(
      `/api/rxnorm?drugs=${encodeURIComponent(drugNames.join(","))}`,
      { signal: AbortSignal.timeout(10000) },
    );
    const data = await res.json();
    state.rxnormInteractions = data.interactions || [];
    renderRxNormSection(state.rxnormInteractions);
  } catch {
    renderRxNormSection([]);
  }
}

function renderRxNormSection(interactions) {
  const section = document.getElementById("rxnormSection");
  const content = document.getElementById("rxnormContent");
  if (!interactions.length) {
    section.style.display = "none";
    return;
  }
  section.style.display = "block";
  content.innerHTML = interactions
    .slice(0, 5)
    .map((ix) => {
      const sevColor =
        ix.severity === "High"
          ? "var(--danger-color)"
          : ix.severity === "Medium"
            ? "var(--warning-color)"
            : "var(--success-color)";
      return `<div class="rxnorm-interaction ${ix.severity}">
            <div class="rxnorm-drugs">${ix.drug1} + ${ix.drug2} <span class="rxnorm-severity" style="color:${sevColor};">[${ix.severity || "noted"}]</span></div>
            ${ix.description ? `<div class="rxnorm-desc">${ix.description.substring(0, 180)}${ix.description.length > 180 ? "..." : ""}</div>` : ""}
            <div class="rxnorm-source">Source: ${ix.source}</div>
        </div>`;
    })
    .join("");
}

// ============================================================
// 20. AI ANALYSIS
// ============================================================

async function generateAIAnalysis(results) {
  const sections = [
    "interactionSummary",
    "mechanismAnalysis",
    "clinicalRisks",
    "dosingGuidance",
    "recommendations",
  ];
  sections.forEach((id) => {
    document.getElementById(id).innerHTML =
      '<div class="ai-loading"><div class="spinner-small"></div> Generating AI analysis...</div>';
  });

  const prompt = buildAnalysisPrompt(results);

  try {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        maxTokens: 2500,
        systemPrompt: `You are an expert clinical pharmacologist providing drug interaction analysis for an educational simulation lab. Provide clear, structured analysis. Use **bold** for drug names and risk levels. Format each section response as concise HTML paragraphs or bullet lists. Do not repeat section headers. Keep total response under 2000 words.`,
      }),
    });
    if (!res.ok) throw new Error("Claude API error");
    const data = await res.json();
    if (data.analysis) {
      distributeAnalysis(data.analysis);
      document.getElementById("aiSourceBadge").textContent = "Claude AI";
      document.getElementById("aiSourceBadge").classList.add("active");
    } else throw new Error("No analysis");
  } catch {
    generateTemplateAnalysis(results);
  }
}

function buildAnalysisPrompt(results) {
  const activeSlots = state.slots.filter((s) => s.drugId);
  const drugList = activeSlots
    .map((slot) => {
      const drug = getDrugData(slot.drugId);
      return `- **${drug.name}** (${drug.drugClass}): ${slot.dose || drug.defaultDose}mg, ${slot.frequency}`;
    })
    .join("\n");

  const localInteractions = getInteractions().map(
    (ix) =>
      `${ix.drugA} + ${ix.drugB}: ${ix.severity.toUpperCase()} — ${ix.mechanism}`,
  );

  const rxnormSummary = state.rxnormInteractions
    .slice(0, 3)
    .map(
      (ix) =>
        `${ix.drug1} + ${ix.drug2} (${ix.severity}): ${(ix.description || "").substring(0, 100)}`,
    )
    .join("\n");

  return `Analyze this drug combination:

**Drugs:** ${drugList}
**Patient:** Age ${state.patient.age}y, Weight ${state.patient.weight}kg, eGFR ${state.patient.kidneyFunction}%, Liver: ${state.patient.liverFunction}
**Risk Score:** ${state.riskScore || "N/A"}/100
**Interactions:** ${localInteractions.length ? localInteractions.join("\n") : "None in local DB"}
**RxNorm Data:** ${rxnormSummary || "Not available"}
**PK Results:** ${results.map((r) => `${r.name}: Cmax=${r.peak.toFixed(0)} ng/mL, Tmax=${r.tmax}h, t½=${r.halfLife.toFixed(1)}h`).join("\n")}

Provide analysis in 5 labeled sections: [SECTION: INTERACTION SUMMARY], [SECTION: MECHANISMS OF ACTION], [SECTION: CLINICAL RISKS], [SECTION: DOSING GUIDANCE], [SECTION: RECOMMENDATIONS]. Each 2-4 sentences.`;
}

function distributeAnalysis(fullText) {
  const sectionMap = {
    "INTERACTION SUMMARY": "interactionSummary",
    "MECHANISMS OF ACTION": "mechanismAnalysis",
    "CLINICAL RISKS": "clinicalRisks",
    "DOSING GUIDANCE": "dosingGuidance",
    RECOMMENDATIONS: "recommendations",
  };
  const parts = fullText.split(/\[SECTION:\s*([^\]]+)\]/);
  for (let i = 1; i < parts.length; i += 2) {
    const label = parts[i]?.trim();
    const content = parts[i + 1]?.trim();
    const elId = sectionMap[label];
    if (elId && content)
      document.getElementById(elId).innerHTML = formatAIText(content);
  }
  Object.values(sectionMap).forEach((id) => {
    const el = document.getElementById(id);
    if (el && el.innerHTML.includes("spinner-small"))
      el.innerHTML = '<p class="placeholder-text">Section not generated.</p>';
  });
}

function formatAIText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^(.+)$/, "<p>$1</p>");
}

// ============================================================
// 21. TEMPLATE ANALYSIS
// ============================================================

function generateTemplateAnalysis(_results) {
  const activeSlots = state.slots.filter((s) => s.drugId);
  const interactions = getInteractions();

  // Interaction Summary
  if (interactions.length === 0) {
    document.getElementById("interactionSummary").innerHTML =
      activeSlots.length < 2
        ? '<p class="placeholder-text">Add 2+ drugs to analyze interactions.</p>'
        : '<p style="color:var(--success-color);">✓ No significant interactions found. Always verify with current clinical resources.</p>';
  } else {
    document.getElementById("interactionSummary").innerHTML =
      `<div class="interaction-list">${interactions
        .map(
          (ix) => `
            <div class="interaction-item ${ix.severity}-risk">
                <div class="interaction-drugs">${ix.drugA} + ${ix.drugB} <span class="risk-badge ${ix.severity}">${ix.severity.toUpperCase()}</span></div>
                <div class="interaction-desc">${ix.mechanism}</div>
            </div>`,
        )
        .join("")}</div>`;
  }

  // Mechanisms
  document.getElementById("mechanismAnalysis").innerHTML =
    activeSlots
      .map((s) => {
        const drug = getDrugData(s.drugId);
        return `<p><strong>${drug.name}</strong> (${drug.drugClass}): ${drug.mechanism}</p>`;
      })
      .join("") || '<p class="placeholder-text">No drugs selected.</p>';

  // Clinical Risks
  const risks = [];
  activeSlots.forEach((slot) => {
    const drug = getDrugData(slot.drugId);
    if (state.patient.age > 65 && drug.halfLife > 12)
      risks.push(
        `🟡 ${drug.name}: Extended t½ in elderly — risk of accumulation.`,
      );
    if (
      state.patient.kidneyFunction < 60 &&
      ["amoxicillin", "metformin", "lisinopril"].includes(slot.drugId)
    )
      risks.push(
        `🔴 ${drug.name}: Renally cleared — dose adjustment required for eGFR ${state.patient.kidneyFunction}%.`,
      );
    if (
      state.patient.liverFunction !== "normal" &&
      ["warfarin", "atorvastatin", "sertraline"].includes(slot.drugId)
    )
      risks.push(
        `🟡 ${drug.name}: Hepatically metabolized — ${state.patient.liverFunction} impairment may increase exposure.`,
      );
  });
  interactions.forEach((ix) => {
    if (ix.severity === "high")
      risks.push(
        `🔴 Major: ${ix.drugA} + ${ix.drugB} — ${ix.mechanism.split(".")[0]}.`,
      );
  });
  document.getElementById("clinicalRisks").innerHTML = risks.length
    ? `<ul class="suggestion-list">${risks.map((r) => `<li>${r}</li>`).join("")}</ul>`
    : '<p style="color:var(--success-color);">✓ No major risk factors identified.</p>';

  // Dosing Guidance
  document.getElementById("dosingGuidance").innerHTML =
    activeSlots
      .map((slot) => {
        const drug = getDrugData(slot.drugId);
        const dose = slot.dose || drug.defaultDose;
        const freq = {
          single: "once",
          bid: "twice daily",
          tid: "three times daily",
          qid: "four times daily",
        }[slot.frequency];
        let notes = [];
        if (state.patient.age > 65) notes.push("start at lower end in elderly");
        if (
          state.patient.kidneyFunction < 60 &&
          ["amoxicillin", "metformin", "lisinopril"].includes(slot.drugId)
        )
          notes.push(`reduce dose for eGFR ${state.patient.kidneyFunction}%`);
        return `<p><strong>${drug.name}:</strong> ${dose}mg ${freq}${notes.length ? ` — Note: ${notes.join("; ")}` : ""}.</p>`;
      })
      .join("") ||
    '<p class="placeholder-text">Select drugs to see dosing guidance.</p>';

  // Recommendations
  const recs = [];
  if (interactions.some((ix) => ix.severity === "high"))
    recs.push(
      "Consult a pharmacist before co-administering — major interaction exists.",
    );
  if (state.patient.age > 75)
    recs.push("Start at reduced doses (>75 years); monitor closely.");
  if (state.patient.kidneyFunction < 50)
    recs.push("Multiple drugs may require renal dose adjustment.");
  if (activeSlots.length >= 2)
    recs.push(
      "Document all medications and screen for interactions at every visit.",
    );
  activeSlots.forEach((s) => {
    const drug = getDrugData(s.drugId);
    if (drug.monitoring?.length)
      recs.push(
        `Monitor for ${drug.name}: ${drug.monitoring.slice(0, 2).join(", ")}.`,
      );
  });
  document.getElementById("recommendations").innerHTML = recs.length
    ? `<ul class="suggestion-list">${recs
        .slice(0, 6)
        .map((r) => `<li>${r}</li>`)
        .join("")}</ul>`
    : "<p>Follow standard clinical guidelines.</p>";

  document.getElementById("aiSourceBadge").textContent = "Template";
  document.getElementById("aiSourceBadge").classList.remove("active");
}

// ============================================================
// 22. AI CHAT
// ============================================================

function updateChatModeBadge() {
  const badge = document.getElementById("chatModeBadge");
  if (!badge) return;
  const hasSimulation = state.slots.some((s) => s.drugId);
  if (hasSimulation) {
    badge.textContent = "📊 Using simulation context";
    badge.className = "chat-mode-badge simulation";
  } else {
    badge.textContent = "🧠 Using general medical knowledge";
    badge.className = "chat-mode-badge general";
  }
}

function renderChatContext() {
  const container = document.getElementById("chatContext");
  const activeSlots = state.slots.filter((s) => s.drugId);

  updateChatModeBadge();
  if (!activeSlots.length) {
    container.innerHTML =
      '<p class="placeholder-text" style="color:var(--text-muted);">No simulation loaded — you can still ask any pharmacology question below.</p>';
    return;
  }

  const drugItems = activeSlots
    .map((slot, i) => {
      const drug = getDrugData(slot.drugId);
      const rootLabel = slot.root ? ` · root: ${slot.root}` : "";
      return `<div class="context-drug-item">
            <div class="context-drug-name"><span class="context-drug-dot" style="background:${DRUG_COLORS[i]};"></span>${drug.name}</div>
            <div class="context-drug-detail">${slot.dose || drug.defaultDose}mg ${slot.frequency} · ${drug.drugClass}${rootLabel}</div>
        </div>`;
    })
    .join("");

  const patientInfo = `<div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.4rem;">
        Patient: ${state.patient.age}y, ${state.patient.weight}kg, eGFR ${state.patient.kidneyFunction}%, liver: ${state.patient.liverFunction}
        ${state.riskScore !== null ? `<br>Risk Score: <strong style="color:${state.riskScore >= 60 ? "var(--danger-color)" : state.riskScore >= 30 ? "var(--warning-color)" : "var(--success-color)"}">${state.riskScore}/100</strong>` : ""}
    </div>`;

  const simStatus = state.simulationResults
    ? '<p style="font-size:0.68rem; color:var(--success-color); margin-top:0.3rem;">✓ Simulation complete — AI has full PK data</p>'
    : '<p style="font-size:0.68rem; color:var(--warning-color); margin-top:0.3rem;">⚠ Run simulation for richer analysis</p>';

  container.innerHTML = drugItems + patientInfo + simStatus;
}

function buildChatSystemContext() {
  const activeSlots = state.slots.filter((s) => s.drugId);
  if (!activeSlots.length) {
    return "No simulation active. Answer general pharmacology and drug-related questions freely.";
  }
  const drugList = activeSlots
    .map((slot) => {
      const drug = getDrugData(slot.drugId);
      const root = slot.root ? ` (root: ${slot.root})` : "";
      return `- ${drug.name}${root} (${drug.drugClass}): ${slot.dose || drug.defaultDose}mg ${slot.frequency}`;
    })
    .join("\n");
  const simResults =
    state.simulationResults?.results
      ?.map(
        (r) =>
          `- ${r.name}: Cmax=${r.peak.toFixed(0)} ng/mL, Tmax=${r.tmax}h, t½=${r.halfLife.toFixed(1)}h`,
      )
      .join("\n") || "Not yet run";
  const interactions = getInteractions().map(
    (ix) => `${ix.drugA} + ${ix.drugB}: ${ix.severity} — ${ix.mechanism}`,
  );

  return `Current simulation:
Drugs: ${drugList}
Patient: Age ${state.patient.age}y, ${state.patient.weight}kg, eGFR ${state.patient.kidneyFunction}%, Liver: ${state.patient.liverFunction}
Risk Score: ${state.riskScore || "N/A"}/100
PK: ${simResults}
Interactions: ${interactions.length ? interactions.join("; ") : "none"}
RxNorm: ${
    state.rxnormInteractions
      .slice(0, 2)
      .map((ix) => `${ix.drug1}+${ix.drug2}: ${ix.severity}`)
      .join("; ") || "not fetched"
  }`;
}

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;
  input.value = "";
  updateChatModeBadge();

  addMessageToChat("user", message);
  state.chatHistory.push({ role: "user", content: message });
  const thinkingId = showTypingIndicator();

  try {
    // Always call /api/pharmacology-chat — fetches real FDA/RxNorm/PubChem data
    // Uses Claude if configured, otherwise formats raw database results
    const res = await fetch("/api/pharmacology-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        context: buildChatSystemContext(),
        history: state.chatHistory.slice(-8),
      }),
      signal: AbortSignal.timeout(30000),
    });
    removeTypingIndicator(thinkingId);
    if (res.ok) {
      const data = await res.json();
      const reply = data.reply || "No response from pharmacology engine.";
      addMessageToChat("assistant", reply);
      state.chatHistory.push({ role: "assistant", content: reply });
      // Show data source badge
      const badge = document.getElementById("chatModeBadge");
      if (badge && data.source) {
        const src = data.source;
        if (src.includes("claude"))
          badge.textContent = "🤖 Claude AI + FDA/RxNorm";
        else badge.textContent = "🗄️ FDA + RxNorm + PubChem";
      }
    } else {
      throw new Error(`Server ${res.status}`);
    }
  } catch (err) {
    removeTypingIndicator(thinkingId);
    // Server unreachable — use local pharmacology engine
    const reply = localPharmacologyEngine(message);
    addMessageToChat("assistant", reply);
    state.chatHistory.push({ role: "assistant", content: reply });
    const badge = document.getElementById("chatModeBadge");
    if (badge) {
      badge.textContent = "📚 Local Pharmacology DB";
      badge.className = "chat-mode-badge general";
    }
  }
}

// ── LOCAL PHARMACOLOGY ENGINE ────────────────────────────────
// Runs entirely in-browser using the drug DB + knowledge base.
// Called when the server is unreachable.

const PHARMA_KB = {
  cyp: "**CYP450 Enzyme System**\n\nThe cytochrome P450 (CYP) family metabolises ~75% of all drugs. Key enzymes:\n- **CYP3A4** — ~50% of drugs (statins, benzodiazepines, macrolides, calcium channel blockers)\n- **CYP2D6** — antidepressants, opioids, beta-blockers; genetically polymorphic (poor vs. ultra-rapid metabolisers)\n- **CYP2C9** — warfarin, NSAIDs, sulfonylureas\n- **CYP2C19** — PPIs, clopidogrel, SSRIs\n\n**Inhibition** raises co-drug plasma levels → toxicity. **Induction** lowers levels → therapeutic failure.",
  halflife:
    "**Drug Half-Life (t½)**\n\nTime for plasma concentration to fall 50%. Determines:\n- Dosing frequency (typically every 1–2×t½)\n- Time to steady state (~5×t½ after starting or dose change)\n- Washout time (~5×t½ after stopping)\n\nRenal impairment prolongs t½ of renally-cleared drugs. Hepatic impairment affects high-extraction drugs (e.g. morphine, propranolol).",
  bioavailability:
    "**Oral Bioavailability (F)**\n\nFraction of oral dose reaching systemic circulation unchanged. Reduced by:\n- First-pass hepatic metabolism (e.g. morphine ~25%, propranolol ~26%)\n- Gut-wall CYP3A4 (e.g. cyclosporine, tacrolimus)\n- P-glycoprotein efflux\n- Poor dissolution\n\nIV administration always gives F = 100%.",
  interaction:
    "**Drug Interaction Types**\n\n**Pharmacokinetic (PK):**\n- Absorption — antacids chelate fluoroquinolones\n- Metabolism — CYP inhibition/induction (most common)\n- Distribution — protein binding displacement raises free drug levels\n- Excretion — competition at renal tubular secretion\n\n**Pharmacodynamic (PD):**\n- Additive — two CNS depressants together\n- Synergistic — TMP-SMX combination\n- Antagonistic — one drug opposes another's effect",
  adme: "**Pharmacokinetics (ADME)**\n\n- **Absorption** — rate/extent entering systemic circulation (affected by route, food, pH)\n- **Distribution** — Vd reflects tissue penetration; high Vd = extensive tissue binding\n- **Metabolism** — primarily hepatic CYP; produces active or inactive metabolites\n- **Excretion** — renal (most drugs), biliary (large molecules), pulmonary (volatile agents)\n\nKey parameters: Cmax, Tmax, AUC, t½, clearance (CL = Vd × ke).",
  renal:
    "**Renal Impairment & Dosing**\n\nCKD stages by eGFR:\n- G1 ≥90 — normal\n- G2 60–89 — mildly reduced\n- G3 30–59 — moderate; dose-adjust many drugs\n- G4 15–29 — severe; avoid metformin, NSAIDs\n- G5 <15 — failure; major restrictions\n\nKey drugs requiring renal dose adjustment: **metformin**, **amoxicillin**, **gabapentin**, **digoxin**, **vancomycin**, **aminoglycosides**, **enoxaparin**.",
  hepatic:
    "**Hepatic Impairment & Dosing**\n\nImpairment causes:\n- ↓ First-pass → ↑ bioavailability of high-extraction drugs\n- ↓ CYP activity → ↑ plasma levels\n- ↓ Albumin → ↑ free fraction of protein-bound drugs\n- ↑ PT/INR → amplified anticoagulant sensitivity\n\nChild-Pugh score A/B/C guides dose adjustment. Avoid hepatotoxic drugs (e.g. high-dose acetaminophen, methotrexate) in pre-existing liver disease.",
  pregnancy:
    "**Drugs in Pregnancy (FDA categories)**\n\n- **Avoid**: warfarin (teratogen), ACE inhibitors (2nd/3rd trimester), tetracyclines, fluoroquinolones, NSAIDs (3rd trimester), statins\n- **Generally safe**: acetaminophen, penicillins, cephalosporins, insulin, labetalol\n- Always weigh risk/benefit. Consult prescribing information and specialist guidance.",
  elderly:
    '**Dosing in Elderly Patients**\n\nPhysiological changes affecting drug handling:\n- ↓ Renal function (use CrCl not eGFR for dosing)\n- ↓ Hepatic blood flow and CYP activity\n- ↓ Albumin → ↑ free drug for protein-bound drugs\n- ↑ Body fat → ↑ Vd for lipophilic drugs\n- ↑ CNS sensitivity to sedatives/opioids\n\n"Start low, go slow." Use Beers criteria to identify high-risk drugs in elderly patients.',
  protein:
    "**Protein Binding & Drug Displacement**\n\nMost drugs bind plasma proteins (primarily albumin). Only the **free (unbound) fraction** is pharmacologically active. Displacement interactions occur when Drug A displaces Drug B from albumin:\n- Free levels of Drug B ↑ acutely\n- Clinically significant mainly for drugs with narrow therapeutic index (warfarin, phenytoin)\n- Distribution volume also increases, often dampening the net effect",
  vd: "**Volume of Distribution (Vd)**\n\nVd = dose ÷ initial plasma concentration. Reflects extent of tissue penetration:\n- Low Vd (~0.1 L/kg) — stays in plasma (heparin, warfarin)\n- Moderate Vd (~0.5 L/kg) — distributes into tissues\n- High Vd (>1 L/kg) — extensive tissue binding (amiodarone ~60 L/kg, chloroquine ~200–800 L/kg)\n\nHigh-Vd drugs are not effectively removed by dialysis.",
};

function localPharmacologyEngine(message) {
  const m = message.toLowerCase();
  const activeSlots = state.slots.filter((s) => s.drugId);

  // --- Find any drug names mentioned in the message ---
  const allDrugIds = Object.keys({ ...DRUG_DB, ...state.dynamicDrugCache });
  const mentionedDrugs = allDrugIds
    .map((id) => ({ id, drug: getDrugData(id) }))
    .filter(
      ({ drug }) =>
        drug &&
        (m.includes(drug.name.toLowerCase()) ||
          (drug.genericName && m.includes(drug.genericName.toLowerCase()))),
    );

  // ── Specific drug lookup ──────────────────────────────────
  if (mentionedDrugs.length > 0) {
    const parts = [];

    mentionedDrugs.forEach(({ drug }) => {
      const section = [`**${drug.name}** (${drug.drugClass})`];
      section.push(`Mechanism: ${drug.mechanism}`);
      section.push(
        `Default dose: ${drug.defaultDose}mg | Range: ${drug.doseRange?.[0]}–${drug.doseRange?.[1]}mg`,
      );
      section.push(
        `Half-life: ~${drug.halfLife}h | Primary organ: ${drug.primaryOrgan}`,
      );
      if (drug.sideEffects?.length)
        section.push(`Common adverse effects: ${drug.sideEffects.join(", ")}`);
      if (drug.monitoring?.length)
        section.push(`Monitor: ${drug.monitoring.join(", ")}`);
      const renalNote =
        state.patient.kidneyFunction < 60 &&
        drug.affectedOrgans?.includes("kidneys")
          ? `⚠ Renal dose adjustment likely needed (eGFR ${state.patient.kidneyFunction}%)`
          : "";
      if (renalNote) section.push(renalNote);
      parts.push(section.join("\n"));
    });

    // Check if any of the mentioned drugs interact with each other
    if (mentionedDrugs.length >= 2) {
      const ixList = [];
      for (let i = 0; i < mentionedDrugs.length; i++) {
        for (let j = i + 1; j < mentionedDrugs.length; j++) {
          const a = mentionedDrugs[i].drug,
            b = mentionedDrugs[j].drug;
          const ix =
            a.interactions?.[mentionedDrugs[j].id] ||
            b.interactions?.[mentionedDrugs[i].id];
          if (ix)
            ixList.push(
              `⚠ **${a.name} + ${b.name}** (${ix.severity?.toUpperCase()}): ${ix.mechanism}`,
            );
        }
      }
      if (ixList.length)
        parts.push("\n**Known Interactions:**\n" + ixList.join("\n"));
    }

    return parts.join("\n\n---\n\n");
  }

  // ── Simulation-context questions ─────────────────────────
  if (activeSlots.length > 0) {
    const drugNames = activeSlots
      .map((s) => getDrugData(s.drugId)?.name)
      .filter(Boolean)
      .join(" + ");

    if (m.match(/interact|combination|together|safe.*together|risk|danger/)) {
      const ixs = getInteractions();
      if (ixs.length)
        return (
          `**Interactions for ${drugNames}:**\n\n` +
          ixs
            .map(
              (ix) =>
                `${ix.severity === "high" ? "🔴" : ix.severity === "medium" ? "🟡" : "🔵"} **${ix.drugA} + ${ix.drugB}** (${ix.severity.toUpperCase()})\n${ix.mechanism}`,
            )
            .join("\n\n") +
          `\n\n**Risk Score: ${state.riskScore}/100**`
        );
      return `No significant interactions found in the database between **${drugNames}**. Risk Score: **${state.riskScore}/100**. Always verify with Lexicomp or Micromedex for clinical decisions.`;
    }

    if (m.match(/mechanism|how.*work|action|what.*do/)) {
      return activeSlots
        .map((s) => {
          const d = getDrugData(s.drugId);
          return `**${d.name}** (${d.drugClass}):\n${d.mechanism}`;
        })
        .join("\n\n");
    }

    if (m.match(/dose|dosing|how much|mg/)) {
      const elderly =
        state.patient.age > 65
          ? " ⚠ Elderly patient — start at lower end of range."
          : "";
      const ckd =
        state.patient.kidneyFunction < 60
          ? ` ⚠ eGFR ${state.patient.kidneyFunction}% — check renal dosing.`
          : "";
      return activeSlots
        .map((s) => {
          const d = getDrugData(s.drugId);
          return `**${d.name}**: Current ${s.dose || d.defaultDose}mg | Range ${d.doseRange[0]}–${d.doseRange[1]}mg${elderly}${ckd}`;
        })
        .join("\n\n");
    }

    if (m.match(/half.?life|eliminat|clearance/)) {
      return activeSlots
        .map((s) => {
          const d = getDrugData(s.drugId);
          return `**${d.name}**: t½ ~${d.halfLife}h → steady state in ~${Math.round(d.halfLife * 5)}h, dose every ~${Math.round(d.halfLife * 1.5)}h`;
        })
        .join("\n\n");
    }

    if (m.match(/side effect|adverse|toxicity|toxic|harm/)) {
      return activeSlots
        .map((s) => {
          const d = getDrugData(s.drugId);
          return `**${d.name}**: ${d.sideEffects?.join(", ") || "see prescribing information"}`;
        })
        .join("\n\n");
    }

    if (m.match(/monitor|watch|check|lab|test/)) {
      return activeSlots
        .map((s) => {
          const d = getDrugData(s.drugId);
          return `**${d.name}**: Monitor — ${d.monitoring?.join(", ") || "standard clinical parameters"}`;
        })
        .join("\n\n");
    }

    if (m.match(/organ|liver|kidney|brain|heart|lung/)) {
      return activeSlots
        .map((s) => {
          const d = getDrugData(s.drugId);
          return `**${d.name}**: Primary organ — ${d.primaryOrgan}. Also affects: ${d.affectedOrgans?.join(", ")}.`;
        })
        .join("\n\n");
    }

    // Generic summary with simulation data
    const ixs = getInteractions();
    return (
      `**Simulation Summary for ${drugNames}**\n` +
      `Patient: ${state.patient.age}y, ${state.patient.weight}kg, eGFR ${state.patient.kidneyFunction}%, Liver: ${state.patient.liverFunction}\n` +
      `Risk Score: **${state.riskScore ?? "N/A"}/100**\n\n` +
      activeSlots
        .map((s) => {
          const d = getDrugData(s.drugId);
          return `**${d.name}** — ${d.mechanism.substring(0, 100)}...`;
        })
        .join("\n") +
      (ixs.length
        ? `\n\n⚠ ${ixs.length} interaction(s) detected. Ask about "interactions" for details.`
        : "")
    );
  }

  // ── General pharmacology knowledge base ──────────────────
  if (m.match(/cyp|enzyme|metabolis|p450/)) return PHARMA_KB.cyp;
  if (m.match(/half.?life|t½|eliminat/)) return PHARMA_KB.halflife;
  if (m.match(/bioavail/)) return PHARMA_KB.bioavailability;
  if (m.match(/interact|combination/)) return PHARMA_KB.interaction;
  if (m.match(/adme|pharmacokinetic|pk\b/)) return PHARMA_KB.adme;
  if (m.match(/renal|kidney|egfr|ckd|creatinine/)) return PHARMA_KB.renal;
  if (m.match(/hepatic|liver|cirrhosis|child.pugh/)) return PHARMA_KB.hepatic;
  if (m.match(/pregnan|gestat|teratogen/)) return PHARMA_KB.pregnancy;
  if (m.match(/elder|geriatric|old|beers/)) return PHARMA_KB.elderly;
  if (m.match(/protein.bind|albumin|displace/)) return PHARMA_KB.protein;
  if (m.match(/volume.*distribut|vd\b/)) return PHARMA_KB.vd;

  if (m.match(/warfarin|coumadin|anticoagulant/)) {
    return "**Warfarin** (Vitamin K Antagonist)\n\nInhibits VKORC1 enzyme, reducing synthesis of clotting factors II, VII, IX, X, protein C/S.\n\n- Narrow therapeutic index (INR 2.0–3.0 for most indications)\n- Metabolised by CYP2C9 (genetic variants affect dose)\n- Strongly affected by vitamin K intake and many drug interactions\n- Key interactions: aspirin (bleeding ↑), amiodarone (INR ↑), rifampin (INR ↓)\n- Monitor: INR weekly initially, then monthly";
  }
  if (m.match(/metformin|biguanide/)) {
    return "**Metformin** (Biguanide antidiabetic)\n\nActivates AMPK → decreases hepatic gluconeogenesis and improves insulin sensitivity.\n\n- First-line for type 2 diabetes\n- Renally cleared — **contraindicated if eGFR <30**, hold if eGFR 30–45\n- No hypoglycaemia risk as monotherapy\n- Lactic acidosis risk with renal/hepatic impairment or contrast dye\n- GI side effects (nausea, diarrhoea) minimised by taking with food";
  }
  if (m.match(/statin|atorvastatin|simvastatin|rosuvastatin/)) {
    return "**Statins** (HMG-CoA reductase inhibitors)\n\nInhibit the rate-limiting step in cholesterol synthesis in the liver.\n\n- Reduce LDL 30–55% depending on potency\n- Potency: rosuvastatin > atorvastatin > simvastatin\n- Most metabolised by CYP3A4 (simvastatin, atorvastatin) — avoid with strong inhibitors\n- Side effects: myopathy/rhabdomyolysis (especially simvastatin at high doses), elevated LFTs\n- Monitor: LFTs at baseline, CK if symptoms";
  }

  // ── Condition-based drug combination recommendations ──────
  const conditionCombos = [
    {
      patterns:
        /type\s*2\s*diabet|t2dm|blood sugar|hyperglycemi|insulin resist/,
      title: "Type 2 Diabetes",
      combos: [
        {
          drugs: "Metformin + Empagliflozin (SGLT2i)",
          score: 97,
          why: "First-line biguanide + SGLT2 inhibitor. Empagliflozin adds cardiovascular and renal protection beyond glucose lowering. Proven mortality benefit in EMPA-REG trial.",
        },
        {
          drugs: "Metformin + Sitagliptin (DPP-4i)",
          score: 89,
          why: "Well tolerated, low hypoglycaemia risk, renal-dose-adjust sitagliptin below eGFR 45. Good option for elderly or frail patients.",
        },
        {
          drugs: "Metformin + Liraglutide (GLP-1 RA)",
          score: 93,
          why: "GLP-1 agonist provides weight loss, HbA1c reduction, and cardiovascular benefit (LEADER trial). Excellent for obese T2DM patients.",
        },
        {
          drugs: "Glipizide + Metformin",
          score: 78,
          why: "Sulfonylurea adds insulin secretagogue effect. Lower cost but hypoglycaemia risk; monitor blood glucose closely.",
        },
      ],
      monitor:
        "HbA1c every 3 months, eGFR, urine albumin/creatinine ratio, blood pressure",
    },
    {
      patterns: /hypertens|high blood press|elevated bp|systolic|diastolic/,
      title: "Hypertension",
      combos: [
        {
          drugs: "Lisinopril (ACEi) + Amlodipine (CCB)",
          score: 96,
          why: "ACCOMPLISH trial gold standard. ACEi reduces RAAS activation; CCB causes vasodilation. Complementary mechanisms with additive BP reduction.",
        },
        {
          drugs: "Losartan (ARB) + Hydrochlorothiazide",
          score: 91,
          why: "Fixed-dose combination available. ARB preferred over ACEi in patients with cough or angioedema. Thiazide enhances natriuresis.",
        },
        {
          drugs: "Amlodipine + Atenolol",
          score: 83,
          why: "CCB + beta-blocker useful in angina + hypertension. Avoid in asthma; monitor heart rate for bradycardia.",
        },
        {
          drugs: "Lisinopril + Hydrochlorothiazide + Amlodipine",
          score: 94,
          why: "Triple therapy for resistant hypertension. Each agent targets a different BP mechanism: RAAS, volume, and vasodilation.",
        },
      ],
      monitor:
        "BP at each visit, serum potassium & creatinine (ACEi/ARB), heart rate (beta-blocker), ankle oedema (CCB)",
    },
    {
      patterns:
        /heart fail|cardiac fail|chf|reduced ejection|hfref|systolic heart/,
      title: "Heart Failure with Reduced Ejection Fraction (HFrEF)",
      combos: [
        {
          drugs: "Lisinopril + Carvedilol + Spironolactone",
          score: 98,
          why: "Evidence-based triple therapy. ACEi reduces afterload; carvedilol reduces mortality (MERIT-HF); spironolactone reduces mortality (RALES trial). Survival benefit established.",
        },
        {
          drugs: "Sacubitril/Valsartan + Carvedilol + Empagliflozin",
          score: 97,
          why: "PARADIGM-HF: ARNI superior to ACEi in HFrEF. SGLT2i (EMPEROR-Reduced) adds further mortality reduction. Now guideline-directed quadruple therapy.",
        },
        {
          drugs: "Furosemide + Spironolactone",
          score: 85,
          why: "Congestion management: loop diuretic for symptom relief, aldosterone antagonist for mortality benefit. Monitor electrolytes closely — risk of hyperkalaemia.",
        },
      ],
      monitor:
        "Daily weight, BP, HR, serum K+, creatinine, BNP/NT-proBNP, echo EF every 3–6 months",
    },
    {
      patterns: /depress|major depress|mdd|low mood|antidepress|ssri/,
      title: "Major Depressive Disorder",
      combos: [
        {
          drugs: "Sertraline + Bupropion",
          score: 88,
          why: "Augmentation strategy: SSRI + NDRI covers serotonin and dopamine/norepinephrine pathways. Bupropion offsets SSRI-related sexual dysfunction and weight gain.",
        },
        {
          drugs: "Escitalopram (SSRI) monotherapy",
          score: 84,
          why: "Most selective SSRI, fewest drug interactions (minimal CYP2D6), well tolerated. First-line per APA guidelines. 6–8 weeks for full effect.",
        },
        {
          drugs: "Venlafaxine (SNRI) + Mirtazapine",
          score: 87,
          why: '"California Rocket Fuel" — SNRI + NaSSA. Mirtazapine blocks α2 autoreceptors enhancing serotonin/NE release; improves sleep and appetite. Used in treatment-resistant depression.',
        },
        {
          drugs: "Sertraline + Aripiprazole (augmentation)",
          score: 82,
          why: "Atypical antipsychotic augmentation for partial SSRI responders. Aripiprazole at low dose (2–10mg) improves response rates in MDD.",
        },
      ],
      monitor:
        "PHQ-9 score at each visit, suicidality assessment, weight, metabolic panel (atypical antipsychotics), QTc (if applicable)",
    },
    {
      patterns: /anxiety|gad|panic|generalised anxiety|anxious/,
      title: "Generalized Anxiety Disorder",
      combos: [
        {
          drugs: "Sertraline (SSRI) + Buspirone",
          score: 86,
          why: "SSRI as backbone; buspirone (5-HT1A partial agonist) augments anxiolytic effect without dependence risk. Takes 2–4 weeks for buspirone to work.",
        },
        {
          drugs: "Escitalopram + CBT (+ short-term lorazepam bridge)",
          score: 90,
          why: "SSRI + psychotherapy is most effective long-term. Short benzodiazepine bridge for severe acute anxiety while SSRI reaches therapeutic levels (2–4 weeks).",
        },
        {
          drugs: "Duloxetine (SNRI) + Pregabalin",
          score: 84,
          why: "SNRI addresses anxiety and comorbid pain/depression; pregabalin (α2δ ligand) has direct anxiolytic effect. Effective for GAD with somatic symptoms.",
        },
      ],
      monitor:
        "GAD-7 score, dependence risk if benzodiazepines used, sleep quality, BP (SNRI)",
    },
    {
      patterns:
        /cholesterol|dyslipid|high ldl|statin|cardiovascular risk|atheroscler/,
      title: "Dyslipidaemia / Cardiovascular Risk Reduction",
      combos: [
        {
          drugs: "Atorvastatin + Ezetimibe",
          score: 95,
          why: "Statin inhibits cholesterol synthesis (HMG-CoA reductase); ezetimibe blocks intestinal absorption. IMPROVE-IT trial: combination reduces cardiovascular events beyond statin alone.",
        },
        {
          drugs: "Rosuvastatin + Ezetimibe + Aspirin",
          score: 93,
          why: "High-intensity statin + cholesterol absorption inhibitor + antiplatelet. Standard secondary prevention regimen post-MI or stroke.",
        },
        {
          drugs: "Atorvastatin + Fenofibrate",
          score: 80,
          why: "Statin + fibrate for mixed dyslipidaemia (high LDL + high triglycerides). Monitor for myopathy — avoid gemfibrozil with statins (CYP interaction).",
        },
      ],
      monitor:
        "Fasting lipid panel at 4–12 weeks, LFTs at baseline, CK if myalgia symptoms, HbA1c (statins modestly raise DM risk)",
    },
    {
      patterns: /atrial fibr|afib|af\b|irregular heartbeat|rate control|rhythm/,
      title: "Atrial Fibrillation",
      combos: [
        {
          drugs: "Apixaban (DOAC) + Metoprolol (rate control)",
          score: 96,
          why: "DOAC for stroke prevention (superior to warfarin in ARISTOTLE trial); beta-blocker for rate control. Most common AF management strategy.",
        },
        {
          drugs: "Warfarin + Digoxin + Amiodarone",
          score: 72,
          why: "Older regimen: warfarin anticoagulation, digoxin for rate control in HF, amiodarone for rhythm. High interaction risk — amiodarone raises warfarin INR significantly. Monitor closely.",
        },
        {
          drugs: "Rivaroxaban + Bisoprolol",
          score: 94,
          why: "Once-daily DOAC (convenient) + cardioselective beta-blocker for rate control. Good option for most AF patients without severe renal impairment.",
        },
      ],
      monitor:
        "HR at rest <80 bpm, INR 2-3 (if warfarin), renal function for DOAC dosing, bleeding symptoms",
    },
    {
      patterns: /pain|analges|chronic pain|neuropath|fibromyal|musculoskel/,
      title: "Chronic Pain / Neuropathic Pain",
      combos: [
        {
          drugs: "Gabapentin + Duloxetine",
          score: 89,
          why: "α2δ ligand reduces nerve excitability; SNRI modulates descending pain pathways. Combination covers peripheral and central sensitisation. Effective for diabetic neuropathy and fibromyalgia.",
        },
        {
          drugs: "Acetaminophen + Ibuprofen (alternating)",
          score: 85,
          why: "Different mechanisms: acetaminophen (central COX inhibition) + NSAID (peripheral COX-1/2). Alternating reduces individual drug load. Limit ibuprofen in renal impairment.",
        },
        {
          drugs: "Pregabalin + Amitriptyline (low dose)",
          score: 82,
          why: "Pregabalin for neuropathic component; low-dose TCA (10–25mg) improves sleep and amplifies pain modulation. Monitor for anticholinergic side effects in elderly.",
        },
      ],
      monitor:
        "Pain scores (NRS), sedation/falls risk (gabapentinoids), renal function (NSAIDs), QTc (TCA)",
    },
    {
      patterns: /infect|antibiotic|pneumon|uti|sepsis|bacterial/,
      title: "Bacterial Infections",
      combos: [
        {
          drugs: "Amoxicillin + Clavulanate (Augmentin)",
          score: 92,
          why: "Beta-lactam + beta-lactamase inhibitor. Clavulanate protects amoxicillin from resistance enzymes. Broad coverage for respiratory, skin, and urinary infections.",
        },
        {
          drugs: "Ciprofloxacin + Metronidazole",
          score: 86,
          why: "Fluoroquinolone (gram-negative coverage) + nitroimidazole (anaerobe coverage). Used for intra-abdominal infections and complicated UTI. Avoid in pregnancy.",
        },
        {
          drugs: "Ceftriaxone + Azithromycin",
          score: 91,
          why: "Standard community-acquired pneumonia combination. Cephalosporin covers gram-positive/negative; azithromycin covers atypicals (Mycoplasma, Legionella, Chlamydia).",
        },
      ],
      monitor:
        "Culture & sensitivity before starting, signs of C. diff (diarrhoea), renal function (fluoroquinolones), QTc (azithromycin + fluoroquinolone)",
    },
    {
      patterns: /asthma|bronchospasm|wheez|reactive airway/,
      title: "Asthma",
      combos: [
        {
          drugs: "Fluticasone (ICS) + Salmeterol (LABA)",
          score: 95,
          why: "ICS reduces airway inflammation; LABA provides sustained bronchodilation. Never use LABA without ICS in asthma. Advair/Seretide fixed-dose combination.",
        },
        {
          drugs: "Budesonide + Formoterol (SMART therapy)",
          score: 97,
          why: "Single inhaler for maintenance AND rescue (SMART). Formoterol's fast onset makes it dual-purpose. Reduces severe exacerbations versus SABA rescue alone.",
        },
        {
          drugs: "Montelukast + Low-dose ICS",
          score: 82,
          why: "Leukotriene receptor antagonist adds anti-inflammatory effect. Useful in allergic asthma or exercise-induced bronchoconstriction. Option when LABA not tolerated.",
        },
      ],
      monitor:
        "Peak flow / spirometry, symptom frequency, exacerbation rate, oral candidiasis (ICS — rinse mouth after use)",
    },
    {
      patterns: /copd|emphysema|chronic obstruct|bronchitis|smoking.*lung/,
      title: "COPD",
      combos: [
        {
          drugs: "Tiotropium (LAMA) + Salmeterol (LABA)",
          score: 94,
          why: "Dual bronchodilation: anticholinergic (reduces airway tone) + beta-2 agonist. Reduces exacerbations and improves exercise tolerance. GOLD guideline Group B/C/D.",
        },
        {
          drugs: "Tiotropium + Fluticasone/Salmeterol (ICS/LABA)",
          score: 88,
          why: "Triple therapy for frequent exacerbators (≥2/year or 1 requiring hospitalisation). ICS reduces eosinophilic inflammation. Monitor pneumonia risk with ICS.",
        },
        {
          drugs: "Roflumilast + LAMA",
          score: 79,
          why: "PDE4 inhibitor (roflumilast) reduces inflammation in chronic bronchitis phenotype. Add-on for patients with FEV1 <50% and frequent exacerbations despite bronchodilators.",
        },
      ],
      monitor:
        "Spirometry annually, exacerbation frequency, O2 saturations, BMI, 6-minute walk test",
    },
  ];

  for (const cond of conditionCombos) {
    if (m.match(cond.patterns)) {
      const lines = [`**Recommended Drug Combinations for ${cond.title}**\n`];
      cond.combos.forEach((c, i) => {
        const stars = "★".repeat(Math.round(c.score / 20));
        lines.push(
          `**${i + 1}. ${c.drugs}**\nEvidence score: ${c.score}/100 ${stars}\n${c.why}\n`,
        );
      });
      lines.push(`**Monitor:** ${cond.monitor}`);
      lines.push(
        `\n*Load any of these drugs into the Simulation Lab to visualise PK curves and interaction risks. Always confirm with clinical guidelines and a prescriber.*`,
      );
      return lines.join("\n");
    }
  }

  // No match — helpful prompt
  return `**What condition do you want to treat?**\n\nTell me the condition and I'll recommend evidence-based drug combinations. For example:\n\n- "What drugs treat hypertension?"\n- "Recommend combinations for type 2 diabetes"\n- "Best drugs for heart failure"\n- "Antibiotic combinations for pneumonia"\n- "Depression treatment options"\n\nI can also answer about specific drugs, CYP enzymes, pharmacokinetics, dosing adjustments, and drug interactions.`;
}

function addMessageToChat(role, content) {
  const container = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = `chat-message ${role}`;
  const avatar =
    role === "user"
      ? "👤"
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
  div.innerHTML = `<div class="message-avatar">${avatar}</div><div class="message-content">${formatChatContent(content)}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function formatChatContent(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^(.*)$/, "<p>$1</p>");
}

function showTypingIndicator() {
  const container = document.getElementById("chatMessages");
  const id = "typing-" + Date.now();
  const div = document.createElement("div");
  div.id = id;
  div.className = "chat-message assistant";
  div.innerHTML = `<div class="message-avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/></svg></div>
        <div class="message-content chat-thinking"><span class="typing-dots"><span></span><span></span><span></span></span></div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  document.getElementById(id)?.remove();
}

// ============================================================
// 23. FDA SEARCH
// ============================================================

async function searchFdaSidebar(query) {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(query)}"+openfda.generic_name:"${encodeURIComponent(query)}"&limit=6`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error();
    const data = await res.json();
    fdaSidebarResults = parseFDAResults(data.results || []);
    renderFdaSidebarAutocomplete(fdaSidebarResults);
  } catch {
    fdaSidebarResults = [];
    renderFdaSidebarAutocomplete([]);
  } finally {
    document.getElementById("fdaSpinnerSidebar").style.display = "none";
  }
}

function parseFDAResults(results) {
  const seen = new Set();
  return results
    .map((r) => {
      const brand = r.openfda?.brand_name?.[0] || "";
      const generic = r.openfda?.generic_name?.[0] || "";
      const name = brand || generic;
      if (!name || seen.has(name.toLowerCase())) return null;
      seen.add(name.toLowerCase());
      return {
        brandName: brand,
        genericName: generic,
        manufacturer: r.openfda?.manufacturer_name?.[0] || "",
        drugClass: r.openfda?.pharm_class_epc?.[0] || "",
        warnings: r.warnings?.[0]?.substring(0, 200) || "",
        contraindications: r.contraindications?.[0]?.substring(0, 200) || "",
        drugInteractions: r.drug_interactions?.[0]?.substring(0, 300) || "",
        indications: r.indications_and_usage?.[0]?.substring(0, 200) || "",
        dosageAdmin: r.dosage_and_administration?.[0]?.substring(0, 200) || "",
      };
    })
    .filter(Boolean)
    .slice(0, 5);
}

function renderFdaSidebarAutocomplete(results) {
  const list = document.getElementById("fdaAutocompleteSidebar");
  if (!results.length) {
    list.innerHTML =
      '<div class="autocomplete-item no-results">No results found</div>';
    list.style.display = "block";
    return;
  }
  list.innerHTML = results
    .map(
      (d, i) => `
        <div class="autocomplete-item" onclick="selectFdaSidebar(${i})">
            <div class="drug-brand">${d.brandName || d.genericName}</div>
            <div class="drug-generic">${d.genericName && d.brandName ? d.genericName : d.manufacturer}</div>
            ${d.drugClass ? `<div class="drug-class">${d.drugClass}</div>` : ""}
        </div>
    `,
    )
    .join("");
  list.style.display = "block";
}

function selectFdaSidebar(index) {
  const drug = fdaSidebarResults[index];
  if (!drug) return;
  hideFdaSidebarAutocomplete();
  document.getElementById("fdaSearchSidebar").value =
    drug.brandName || drug.genericName;
  const card = document.getElementById("fdaCardSidebar");
  const sections = [];
  if (drug.indications)
    sections.push(
      `<div class="fda-field"><strong>Indications:</strong> ${drug.indications}</div>`,
    );
  if (drug.warnings)
    sections.push(
      `<div class="fda-field fda-warning"><strong>⚠ Warnings:</strong> ${drug.warnings}</div>`,
    );
  if (drug.contraindications)
    sections.push(
      `<div class="fda-field fda-danger"><strong>Contraindications:</strong> ${drug.contraindications}</div>`,
    );
  if (drug.drugInteractions)
    sections.push(
      `<div class="fda-field"><strong>Interactions:</strong> ${drug.drugInteractions}</div>`,
    );
  card.innerHTML = `<strong>${drug.brandName || drug.genericName}</strong><br>${sections.join("")}`;
  card.style.display = "block";
  showToast(
    `Loaded FDA data for ${drug.brandName || drug.genericName}`,
    "success",
  );
}

function hideFdaSidebarAutocomplete() {
  const list = document.getElementById("fdaAutocompleteSidebar");
  list.style.display = "none";
  list.innerHTML = "";
}

// ============================================================
// 24. KIDNEY HINT
// ============================================================

function updateKidneyHint(value) {
  const hint = document.getElementById("kidneyHint");
  const level = Object.keys(KIDNEY_HINTS)
    .reverse()
    .find((k) => value <= +k);
  hint.textContent = level ? KIDNEY_HINTS[level] : "";
}

// ============================================================
// 25. REPORT
// ============================================================

function generateReport() {
  const activeSlots = state.slots.filter((s) => s.drugId);
  const modal = document.getElementById("reportModal");
  const content = document.getElementById("reportContent");
  if (!activeSlots.length) {
    showToast("Select at least one drug first", "warning");
    return;
  }
  const now = new Date();

  const drugRows = activeSlots
    .map((slot, i) => {
      const drug = getDrugData(slot.drugId);
      const rootLabel = slot.root ? ` — Root: ${slot.root}` : "";
      return `<div><label>Drug ${i + 1}:</label><span>${drug.name} (${drug.drugClass}) — ${slot.dose || drug.defaultDose}mg ${slot.frequency}${rootLabel}</span></div>`;
    })
    .join("");

  const pkRows =
    state.simulationResults?.results
      ?.map(
        (r) => `
        <div><label>${r.name} Cmax:</label><span>${r.peak.toFixed(0)} ng/mL</span></div>
        <div><label>${r.name} Tmax:</label><span>${r.tmax}h</span></div>
        <div><label>${r.name} t½:</label><span>${r.halfLife.toFixed(1)}h</span></div>
    `,
      )
      .join("") ||
    "<div><label>Simulation:</label><span>Not yet run</span></div>";

  content.innerHTML = `<div class="report-doc">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;">
            <div><h1>Drug Interaction Lab Report</h1><p class="report-date">AI-Powered Simulation · OpenFDA + RxNorm</p></div>
            <div class="report-date" style="text-align:right;"><strong>Generated:</strong><br>${now.toLocaleDateString()} ${now.toLocaleTimeString()}</div>
        </div>
        <div class="report-section"><h2>Risk Score</h2><p style="font-size:1.4rem;font-weight:700;color:${state.riskScore >= 60 ? "var(--danger-color)" : state.riskScore >= 30 ? "var(--warning-color)" : "var(--success-color)"};">${state.riskScore ?? "—"}/100</p></div>
        <div class="report-section"><h2>Drug Selection</h2><div class="report-grid">${drugRows}</div></div>
        <div class="report-section"><h2>Patient Profile</h2><div class="report-grid">
            <div><label>Age:</label><span>${state.patient.age} years</span></div>
            <div><label>Weight:</label><span>${state.patient.weight} kg</span></div>
            <div><label>Kidney:</label><span>eGFR ${state.patient.kidneyFunction}%</span></div>
            <div><label>Liver:</label><span>${state.patient.liverFunction}</span></div>
        </div></div>
        <div class="report-section"><h2>PK Results</h2><div class="report-grid">${pkRows}</div></div>
        <div class="report-section"><h2>Interaction Analysis</h2>${document.getElementById("interactionSummary")?.innerHTML || ""}</div>
        <div class="report-section"><h2>Clinical Risks</h2>${document.getElementById("clinicalRisks")?.innerHTML || ""}</div>
        <div class="report-section"><h2>Recommendations</h2>${document.getElementById("recommendations")?.innerHTML || ""}</div>
        <div class="report-footer"><strong>Disclaimer:</strong> Educational simulation tool. Not for clinical use. Consult qualified healthcare professionals.</div>
    </div>`;

  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("reportModal").style.display = "none";
}

function printReport() {
  const content = document.getElementById("reportContent").innerHTML;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.title = "Drug Interaction Lab Report";
  const style = win.document.createElement("style");
  style.textContent = `body{font-family:'DM Sans',sans-serif;color:#111;background:#fff;padding:2rem;max-width:800px;margin:0 auto;}h1{color:#0066cc;border-bottom:2px solid #0066cc;padding-bottom:.5rem;font-size:1.3rem;}h2{color:#333;border-bottom:1px solid #ddd;padding-bottom:.3rem;font-size:.95rem;margin-top:1.4rem;}.report-section{margin-bottom:1.4rem;padding:1rem;border:1px solid #e0e0e0;border-radius:8px;}.report-grid{display:grid;grid-template-columns:1fr 1fr;gap:.35rem 1.5rem;margin:.6rem 0;}.report-grid div label{font-weight:600;color:#555;font-size:.8rem;display:block;}.report-grid div span{color:#111;font-size:.85rem;}.report-footer{margin-top:1.5rem;font-size:.75rem;color:#777;border-top:1px solid #ddd;padding-top:.8rem;}ul{padding-left:1rem;}li{margin:.25rem 0;}@media print{body{padding:0;}.report-section{break-inside:avoid;}}`;
  win.document.head.appendChild(style);
  win.document.body.innerHTML = content;
  setTimeout(() => win.print(), 500);
}

// ============================================================
// 26. RESET
// ============================================================

function resetAll() {
  if (state.timeAnimationId) {
    clearInterval(state.timeAnimationId);
    state.timeAnimationId = null;
  }
  if (state.bodyTimeAnimationId) {
    clearInterval(state.bodyTimeAnimationId);
    state.bodyTimeAnimationId = null;
  }

  state.slots = [];
  state.simulationResults = null;
  state.rxnormInteractions = [];
  state.chatHistory = [];
  state.riskScore = null;

  state.patient = {
    age: 45,
    weight: 70,
    kidneyFunction: 100,
    liverFunction: "normal",
  };
  document.getElementById("patientAge").value = 45;
  document.getElementById("patientAgeValue").textContent = 45;
  document.getElementById("patientWeight").value = 70;
  document.getElementById("patientWeightValue").textContent = 70;
  document.getElementById("kidneyFunction").value = 100;
  document.getElementById("kidneyFunctionValue").textContent = 100;
  document.getElementById("kidneyHint").textContent = "";
  document.getElementById("liverFunction").value = "normal";

  document.getElementById("interactionBanner").style.display = "none";
  document.getElementById("pkSummary").style.display = "none";
  document.getElementById("rxnormSection").style.display = "none";
  document.getElementById("timeScrubber").style.display = "none";
  document.getElementById("bodyTimeScrubber").style.display = "none";

  // Collapse advanced
  document.getElementById("advancedSettings").classList.add("collapsed");
  document.getElementById("advancedToggle").classList.remove("open");

  [
    "interactionSummary",
    "mechanismAnalysis",
    "clinicalRisks",
    "dosingGuidance",
    "recommendations",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el)
      el.innerHTML =
        '<p class="placeholder-text">Run simulation to generate analysis...</p>';
  });

  document.getElementById("drugsActiveVal").textContent = "0";
  document.getElementById("interactionLevelVal").textContent = "—";
  document.getElementById("tmaxVal").textContent = "—";
  document.getElementById("metricInteraction").style.borderColor = "";

  document.querySelectorAll(".organ").forEach((el) => {
    el.className = "organ";
    el.style.opacity = "";
  });
  document.getElementById("organLegend").innerHTML =
    '<p class="placeholder-text">Select drugs and run simulation to see body distribution.</p>';

  initChart();
  addDrugSlot();
  updateAddDrugBtn();
  updateRiskScore();
  updateLiveFeedback();

  document.getElementById("aiSourceBadge").textContent = "Awaiting";
  document.getElementById("aiSourceBadge").classList.remove("active");

  showToast("Reset complete", "info");
}

// ============================================================
// 27. TOASTS
// ============================================================

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const icons = { success: "✓", warning: "⚠", error: "✕", info: "ℹ" };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ"}</span><span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ============================================================
// DRUG LIVE SEARCH — Real-time search from OpenFDA database
// ============================================================

let drugLiveSearchDebounce = {};

function onDrugLiveSearch(slotIndex, query) {
  clearTimeout(drugLiveSearchDebounce[slotIndex]);
  const ac = document.getElementById(`drugLiveAC-${slotIndex}`);
  if (!query || query.length < 2) {
    if (ac) ac.style.display = "none";
    return;
  }

  drugLiveSearchDebounce[slotIndex] = setTimeout(async () => {
    try {
      const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(query)}"+openfda.brand_name:"${encodeURIComponent(query)}"&limit=6`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      const results = (data.results || [])
        .map((r) => ({
          generic: r.openfda?.generic_name?.[0] || "",
          brand: r.openfda?.brand_name?.[0] || "",
          drugClass: r.openfda?.pharm_class_epc?.[0] || "",
        }))
        .filter((r) => r.generic || r.brand);
      showDrugLiveAC(slotIndex, results);
    } catch {
      showDrugLiveAC(slotIndex, []);
    }
  }, 400);
}

function showDrugLiveAC(slotIndex, results) {
  const ac = document.getElementById(`drugLiveAC-${slotIndex}`);
  if (!ac) return;
  if (!results.length) {
    ac.style.display = "none";
    return;
  }
  ac.innerHTML = results
    .map(
      (r) => `
        <div class="autocomplete-item" onclick="selectLiveDrug(${slotIndex}, '${(r.generic || r.brand).replace(/'/g, "\\'")}')">
            <div class="drug-brand">${r.brand || r.generic}</div>
            <div class="drug-generic">${r.brand && r.generic ? r.generic : ""}</div>
            ${r.drugClass ? `<div class="drug-class">${r.drugClass}</div>` : ""}
        </div>
    `,
    )
    .join("");
  ac.style.display = "block";
}

async function selectLiveDrug(slotIndex, drugName) {
  const ac = document.getElementById(`drugLiveAC-${slotIndex}`);
  if (ac) ac.style.display = "none";

  showToast(`Fetching real PK data for ${drugName}...`, "info");

  try {
    const res = await fetch(
      `/api/drug-lookup?name=${encodeURIComponent(drugName)}`,
      {
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!res.ok) throw new Error("Lookup failed");
    const data = await res.json();

    const drugId = "dyn_" + drugName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const pk = data.pkParams || {};

    // Add to dynamic cache with DRUG_DB-compatible shape
    state.dynamicDrugCache[drugId] = {
      name: data.brandName || data.name || drugName,
      genericName: data.genericName || drugName,
      drugClass: data.drugClass || "Unknown",
      halfLife: pk.halfLife != null ? pk.halfLife : 6,
      bioavailability: pk.bioavailability != null ? pk.bioavailability : 0.7,
      Vd: pk.Vd != null ? pk.Vd : 1.0,
      Tmax: pk.Tmax != null ? pk.Tmax : 2.0,
      proteinBinding: pk.proteinBinding != null ? pk.proteinBinding : 50,
      defaultDose: 100,
      doseRange: [10, 1000],
      doseStep: 10,
      primaryOrgan: "liver",
      affectedOrgans: ["liver"],
      mechanism:
        pk.mechanism ||
        data.fdaLabel?.clinicalPharmacology?.substring(0, 200) ||
        "See FDA label",
      uses: pk.uses || [data.fdaLabel?.indications?.substring(0, 80) || ""],
      interactions: {},
      pkModifiers: {},
      contraindications: data.fdaLabel?.contraindications
        ? [data.fdaLabel.contraindications.substring(0, 100)]
        : [],
      monitoring: [],
      isLiveDB: true,
      sourceInfo: data.source || "",
    };

    // Update slot
    state.slots[slotIndex].drugId = drugId;
    state.slots[slotIndex].root =
      data.genericName || data.brandName || drugName || "";
    state.slots[slotIndex].dose = 100;
    state.slots[slotIndex].frequency = "single";
    state.slots[slotIndex].adminTime = 0;

    renderSlots();
    onParameterChange();
    updateDrugsActiveCount();
    fetchRxNormInteractions();

    showToast(
      `Loaded ${data.brandName || drugName} (${data.source || "FDA"})`,
      "success",
    );
  } catch (e) {
    showToast(`Could not fetch data for ${drugName}: ${e.message}`, "error");
  }
}

// ============================================================
// DRUG DISCOVERY ENGINE
// ============================================================

function setCondition(name) {
  const input = document.getElementById("conditionInput");
  if (input) input.value = name;
}

async function runDiscovery() {
  const condition = document.getElementById("conditionInput")?.value?.trim();
  if (!condition) {
    showToast("Enter a condition to search", "warning");
    return;
  }

  const btn = document.getElementById("discoverBtn");
  const loadingEl = document.getElementById("discoveryLoading");
  const resultsEl = document.getElementById("discoveryResults");

  btn.disabled = true;
  loadingEl.style.display = "flex";
  resultsEl.style.display = "none";

  setDiscoveryStep(1);

  try {
    // Step 1: Fetch drugs for condition
    const condRes = await fetch(
      `/api/condition-drugs?condition=${encodeURIComponent(condition)}`,
      {
        signal: AbortSignal.timeout(15000),
      },
    );
    const condData = await condRes.json();
    const foundDrugs = condData.drugs || [];

    if (!foundDrugs.length) {
      showToast(
        "No drugs found for that condition. Try a different term.",
        "warning",
      );
      loadingEl.style.display = "none";
      btn.disabled = false;
      return;
    }

    state.discoveryState.condition = condition;
    state.discoveryState.foundDrugs = foundDrugs;
    document.getElementById("conditionLabel").textContent = condition;

    setDiscoveryStep(2);
    renderFetchedDrugsList(foundDrugs);

    // Show fetched drugs card
    const fetchedCard = document.getElementById("fetchedDrugsCard");
    if (fetchedCard) fetchedCard.style.display = "block";

    // Step 2: Enrich with PK data
    await enrichDiscoveryDrugsWithPK(foundDrugs);

    setDiscoveryStep(3);
    renderDiscoveryPropertyTable(state.discoveryState.drugsWithPK);

    // Step 3: Run ML discovery
    const drugsForML = state.discoveryState.drugsWithPK.filter(
      (d) => d.pkParams && Object.keys(d.pkParams).length > 0,
    );

    const mlRes = await fetch("/api/ml-discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        condition,
        drugs: drugsForML.slice(0, 10),
        patientProfile: state.patient,
      }),
      signal: AbortSignal.timeout(60000),
    });

    setDiscoveryStep(4);
    const mlData = await mlRes.json();

    if (mlData.success && mlData.result) {
      state.discoveryState.mlResults = mlData.result;
      renderRegressionInsights(mlData.result.regressionInsights);
      renderCombinations(mlData.result.combinations || []);
      if (mlData.result.topRecommendation) {
        document.getElementById("topRecommendation").textContent =
          mlData.result.topRecommendation;
      }
      if (mlData.result.safetyNotes?.length) {
        document.getElementById("safetyNotesList").innerHTML =
          mlData.result.safetyNotes.map((n) => `<li>${n}</li>`).join("");
        document.getElementById("safetyNotesCard").style.display = "block";
      }
    } else {
      document.getElementById("topRecommendation").textContent =
        mlData.error || "ML analysis unavailable — configure ANTHROPIC_API_KEY";
    }

    loadingEl.style.display = "none";
    resultsEl.style.display = "block";
  } catch (e) {
    loadingEl.style.display = "none";
    showToast("Discovery failed: " + e.message, "error");
  } finally {
    btn.disabled = false;
  }
}

function setDiscoveryStep(step) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`loadStep${i}`);
    if (!el) continue;
    el.classList.remove("active", "done");
    if (i < step) el.classList.add("done");
    else if (i === step) el.classList.add("active");
  }
}

async function enrichDiscoveryDrugsWithPK(drugs) {
  state.discoveryState.drugsWithPK = drugs.map((d) => ({
    ...d,
    pkParams: null,
  }));

  const batchSize = 3;
  for (let i = 0; i < drugs.length; i += batchSize) {
    const batch = drugs.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((d) =>
        fetch(
          `/api/drug-lookup?name=${encodeURIComponent(d.genericName || d.name)}`,
          {
            signal: AbortSignal.timeout(12000),
          },
        )
          .then((r) => r.json())
          .catch(() => null),
      ),
    );
    results.forEach((result, batchIdx) => {
      const globalIdx = i + batchIdx;
      if (
        result.status === "fulfilled" &&
        result.value &&
        !result.value.error
      ) {
        state.discoveryState.drugsWithPK[globalIdx].pkParams =
          result.value.pkParams || {};
        state.discoveryState.drugsWithPK[globalIdx].resolvedName =
          result.value.name;
        state.discoveryState.drugsWithPK[globalIdx].drugClass =
          result.value.drugClass || drugs[globalIdx].drugClass;
      }
    });
    // Re-render table progressively
    renderDiscoveryPropertyTable(state.discoveryState.drugsWithPK);
  }
}

function renderFetchedDrugsList(drugs) {
  const container = document.getElementById("fetchedDrugsList");
  if (!drugs.length) {
    container.innerHTML = '<p class="placeholder-text">No drugs found.</p>';
    return;
  }
  container.innerHTML = drugs
    .map(
      (d) => `
        <div class="fetched-drug-chip">
            <span class="drug-chip-name">${d.brandName || d.genericName}</span>
            <span class="drug-chip-class">${d.drugClass || ""}</span>
        </div>
    `,
    )
    .join("");
}

function renderDiscoveryPropertyTable(drugs) {
  const container = document.getElementById("propertyTableContainer");
  const rows = drugs
    .map((d, i) => {
      const pk = d.pkParams;
      const hasData = pk && Object.keys(pk).length > 0;
      const pkCells = hasData
        ? `<td class="pk-cell">${pk.halfLife != null ? pk.halfLife + "h" : "—"}</td>
               <td class="pk-cell">${pk.bioavailability != null ? (pk.bioavailability * 100).toFixed(0) + "%" : "—"}</td>
               <td class="pk-cell">${pk.Vd != null ? pk.Vd + " L/kg" : "—"}</td>
               <td class="pk-cell">${pk.Tmax != null ? pk.Tmax + "h" : "—"}</td>
               <td class="pk-cell">${pk.proteinBinding != null ? pk.proteinBinding + "%" : "—"}</td>`
        : `<td colspan="5" class="pk-loading pk-cell">
                 <span class="pk-spinner">⟳</span> Fetching from FDA/PubChem...
               </td>`;
      return `<tr>
            <td><input type="checkbox" class="discovery-check" data-idx="${i}"
                       onchange="toggleDiscoverySelect(${i}, this.checked)"></td>
            <td class="drug-name-cell">
                <strong>${d.resolvedName || d.brandName || d.genericName}</strong>
                ${d.brandName && d.genericName && d.brandName !== d.genericName ? `<br><span class="text-sm text-muted">${d.genericName}</span>` : ""}
                ${hasData ? '<span class="badge-real">Live PK</span>' : ""}
            </td>
            <td class="pk-cell">${d.drugClass || "—"}</td>
            ${pkCells}
        </tr>`;
    })
    .join("");

  container.innerHTML = `
        <div class="discovery-table-wrapper">
            <table class="discovery-table">
                <thead><tr>
                    <th></th>
                    <th>Drug</th>
                    <th>Class</th>
                    <th>Half-Life</th>
                    <th>Bioavailability</th>
                    <th>Vd (L/kg)</th>
                    <th>Tmax</th>
                    <th>Protein Binding</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
}

function toggleDiscoverySelect(idx, checked) {
  const drug = state.discoveryState.drugsWithPK[idx];
  if (!drug) return;
  if (checked) {
    if (
      !state.discoveryState.selectedForLoad.find((d) => d.name === drug.name)
    ) {
      state.discoveryState.selectedForLoad.push(drug);
    }
  } else {
    state.discoveryState.selectedForLoad =
      state.discoveryState.selectedForLoad.filter((d) => d.name !== drug.name);
  }
  const loadBtn = document.getElementById("loadSelectedBtn");
  if (loadBtn) {
    loadBtn.style.display = state.discoveryState.selectedForLoad.length
      ? "block"
      : "none";
    loadBtn.textContent = `Load ${state.discoveryState.selectedForLoad.length} Drug(s) into Simulation`;
  }
}

function renderRegressionInsights(insights) {
  if (!insights) return;
  const container = document.getElementById("regressionInsights");
  const importanceRows = insights.featureImportance
    ? Object.entries(insights.featureImportance)
        .map(([k, v]) => {
          const pct = Math.round((v || 0) * 100);
          return `<div class="feature-row">
                <span class="feature-name">${k}</span>
                <div class="feature-bar-track"><div class="feature-bar-fill" style="width:${pct}%"></div></div>
                <span class="feature-pct">${pct}%</span>
            </div>`;
        })
        .join("")
    : "";

  container.innerHTML = `
        <div class="insights-content">
            <p class="insights-summary">${insights.correlationSummary || ""}</p>
            ${importanceRows ? `<div class="feature-importance"><h4>Feature Importance</h4>${importanceRows}</div>` : ""}
            ${insights.methodology ? `<p class="insights-method"><em>Method: ${insights.methodology}</em></p>` : ""}
        </div>`;
}

function renderCombinations(combinations) {
  const container = document.getElementById("combinationResults");
  if (!combinations.length) {
    container.innerHTML =
      '<p class="placeholder-text">No combinations generated.</p>';
    return;
  }
  container.innerHTML = combinations
    .map((combo, i) => {
      const score = Math.round((combo.combinedScore || 0) * 100);
      const scoreColor =
        score >= 70
          ? "var(--success-color)"
          : score >= 40
            ? "var(--warning-color)"
            : "var(--danger-color)";
      const novBadge =
        combo.novelty === "repurposing"
          ? '<span class="novelty-badge repurposing">Repurposing</span>'
          : combo.novelty === "investigational"
            ? '<span class="novelty-badge investigational">Investigational</span>'
            : '<span class="novelty-badge established">Established</span>';
      const evidBadge = `<span class="evidence-badge ${combo.evidenceBase}">${combo.evidenceBase || "theoretical"}</span>`;

      return `<div class="combo-card rank-${i + 1}">
            <div class="combo-header">
                <div class="combo-rank">#${i + 1}</div>
                <div class="combo-drugs">${(combo.drugs || []).join(" + ")}</div>
                <div class="combo-score" style="color:${scoreColor}">${score}%</div>
            </div>
            <div class="combo-badges">${novBadge}${evidBadge}<span class="synergy-badge">${combo.synergyType || ""}</span></div>
            <p class="combo-rationale">${combo.mechanismSynergy || ""}</p>
            <p class="combo-pk">${combo.pkCompatibility || ""}</p>
            ${combo.warnings?.length ? `<div class="combo-warnings">${combo.warnings.map((w) => `<span>⚠ ${w}</span>`).join("")}</div>` : ""}
            <div class="combo-actions">
                <span class="confidence-badge ${combo.confidenceLevel}">${combo.confidenceLevel} confidence</span>
                <button class="btn-load-combo" onclick="loadComboToSimulation(${i})">
                    Load into Simulation →
                </button>
            </div>
        </div>`;
    })
    .join("");
}

function loadComboToSimulation(comboIndex) {
  const combo = state.discoveryState.mlResults?.combinations?.[comboIndex];
  if (!combo) return;

  const simParams = combo.simulationParams || {};
  const drugs = Object.values(simParams);
  if (!drugs.length) {
    showToast("No simulation parameters available", "warning");
    return;
  }

  state.slots = [];
  state.simulationResults = null;
  state.rxnormInteractions = [];

  drugs.slice(0, 3).forEach((d) => {
    const drugId =
      "dyn_" +
      (d.name || "drug").toLowerCase().replace(/[^a-z0-9]/g, "_") +
      "_" +
      Date.now();
    state.dynamicDrugCache[drugId] = {
      name: d.name,
      genericName: d.name,
      drugClass: "Discovered Combination",
      halfLife: d.halfLife != null ? d.halfLife : 6,
      bioavailability: d.bioavailability != null ? d.bioavailability : 0.7,
      Vd: d.Vd != null ? d.Vd : 1.0,
      Tmax: d.Tmax != null ? d.Tmax : 2.0,
      proteinBinding: d.proteinBinding != null ? d.proteinBinding : 50,
      defaultDose: d.suggestedDose || 100,
      doseRange: [
        Math.max(1, (d.suggestedDose || 100) / 4),
        (d.suggestedDose || 100) * 4,
      ],
      doseStep: Math.max(1, Math.round((d.suggestedDose || 100) / 10)),
      primaryOrgan: "liver",
      affectedOrgans: ["liver"],
      mechanism:
        combo.mechanismSynergy?.substring(0, 200) || "ML-predicted combination",
      uses: [state.discoveryState.condition],
      interactions: {},
      pkModifiers: {},
      contraindications: combo.warnings || [],
      monitoring: [],
      isLiveDB: true,
    };
    state.slots.push({
      drugId,
      dose: d.suggestedDose || 100,
      adminTime: 0,
      frequency: d.frequency || "single",
      collapsed: false,
    });
  });

  renderSlots();
  updateAddDrugBtn();
  updateDrugsActiveCount();

  switchTab("simulation");
  showToast(`Loaded "${combo.drugs?.join(" + ")}" into simulation`, "success");
  setTimeout(() => runSimulation(), 800);
}

function loadSelectedToSimulation() {
  const selected = state.discoveryState.selectedForLoad.slice(0, 3);
  if (!selected.length) {
    showToast("Select at least one drug", "warning");
    return;
  }

  state.slots = [];
  state.simulationResults = null;
  state.rxnormInteractions = [];

  selected.forEach((d) => {
    const pk = d.pkParams || {};
    const drugId =
      "dyn_" +
      (d.genericName || d.name || "drug")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
    state.dynamicDrugCache[drugId] = {
      name: d.resolvedName || d.brandName || d.genericName,
      genericName: d.genericName || "",
      drugClass: d.drugClass || "Unknown",
      halfLife: pk.halfLife != null ? pk.halfLife : 6,
      bioavailability: pk.bioavailability != null ? pk.bioavailability : 0.7,
      Vd: pk.Vd != null ? pk.Vd : 1.0,
      Tmax: pk.Tmax != null ? pk.Tmax : 2.0,
      proteinBinding: pk.proteinBinding != null ? pk.proteinBinding : 50,
      defaultDose: 100,
      doseRange: [10, 1000],
      doseStep: 10,
      primaryOrgan: "liver",
      affectedOrgans: ["liver"],
      mechanism:
        pk.mechanism ||
        d.clinicalPharmacology?.substring(0, 200) ||
        "See FDA label",
      uses: pk.uses || [
        d.indications?.substring(0, 80) || state.discoveryState.condition,
      ],
      interactions: {},
      pkModifiers: {},
      contraindications: [],
      monitoring: [],
      isLiveDB: true,
    };
    state.slots.push({
      drugId,
      dose: 100,
      adminTime: 0,
      frequency: "single",
      collapsed: false,
    });
  });

  renderSlots();
  updateAddDrugBtn();
  updateDrugsActiveCount();
  switchTab("simulation");
  showToast(`Loaded ${selected.length} drug(s) into simulation`, "success");
  setTimeout(() => runSimulation(), 800);
}
