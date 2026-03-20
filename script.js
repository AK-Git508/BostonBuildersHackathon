// ============================================================
// DRUG INTERACTION LAB — Complete Frontend Logic
// Real PK engine · Multi-drug chart · Body model
// RxNorm integration · Claude AI · OpenFDA
// ============================================================

'use strict';

// ============================================================
// 1. DRUG DATABASE — Real pharmacokinetic parameters
// ============================================================

const DRUG_COLORS = ['#00d4ff', '#ff6b9d', '#ffd60a'];
const DRUG_COLORS_BG = ['rgba(0,212,255,0.12)', 'rgba(255,107,157,0.12)', 'rgba(255,214,10,0.12)'];

const DRUG_DB = {
    aspirin: {
        name: 'Aspirin',
        genericName: 'Acetylsalicylic Acid',
        drugClass: 'NSAID / Antiplatelet',
        halfLife: 3.5,          // hours (salicylate t1/2 at analgesic doses)
        bioavailability: 0.80,  // fraction
        Vd: 0.17,               // L/kg
        Tmax: 1.0,              // hours to peak
        proteinBinding: 80,     // %
        defaultDose: 325,       // mg
        doseRange: [81, 975],
        doseStep: 81,
        primaryOrgan: 'blood',
        affectedOrgans: ['liver', 'gi', 'kidneys'],
        mechanism: 'Irreversibly inhibits COX-1 and COX-2 enzymes, blocking prostaglandin and thromboxane synthesis. At low doses (81 mg), primarily antiplatelet via COX-1 inhibition. At higher doses, analgesic and antipyretic via COX-2 inhibition.',
        uses: ['Pain relief', 'Fever', 'Antiplatelet (cardioprotection)', 'Anti-inflammatory'],
        interactions: {
            warfarin:     { severity: 'high',   mechanism: 'Additive anticoagulation + protein binding displacement. Greatly increases bleeding risk.' },
            ibuprofen:    { severity: 'medium', mechanism: 'Competitive COX-1 binding reduces aspirin\'s antiplatelet effect. Take aspirin 30 min before ibuprofen.' },
            metformin:    { severity: 'low',    mechanism: 'High-dose aspirin may slightly enhance hypoglycemic effect.' },
            lisinopril:   { severity: 'low',    mechanism: 'High-dose aspirin may reduce ACE inhibitor efficacy via prostaglandin inhibition.' },
            sertraline:   { severity: 'medium', mechanism: 'Additive increase in GI bleeding risk via combined effect on platelets and GI mucosa.' },
        },
        pkModifiers: {},  // how this drug modifies others' PK
        contraindications: ['Bleeding disorders', 'Active peptic ulcer', 'Children with viral illness (Reye syndrome risk)'],
        monitoring: ['Signs of bleeding', 'Tinnitus (salicylate toxicity)', 'GI symptoms']
    },

    ibuprofen: {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        drugClass: 'NSAID (Non-Steroidal Anti-Inflammatory)',
        halfLife: 2.0,
        bioavailability: 0.80,
        Vd: 0.14,
        Tmax: 1.5,
        proteinBinding: 99,
        defaultDose: 400,
        doseRange: [200, 800],
        doseStep: 200,
        primaryOrgan: 'liver',
        affectedOrgans: ['liver', 'kidneys', 'gi'],
        mechanism: 'Reversibly inhibits COX-1 and COX-2. Reduces prostaglandin synthesis causing analgesic, antipyretic, and anti-inflammatory effects. High protein binding means it can displace other highly protein-bound drugs.',
        uses: ['Pain relief', 'Fever', 'Inflammation', 'Dysmenorrhea'],
        interactions: {
            warfarin:   { severity: 'high',   mechanism: 'Displaces warfarin from albumin (increases free warfarin) + inhibits platelet function. Major bleeding risk.' },
            lisinopril: { severity: 'medium', mechanism: 'NSAIDs reduce renal prostaglandins → decreased ACE inhibitor efficacy + risk of acute kidney injury.' },
            aspirin:    { severity: 'medium', mechanism: 'Competitive COX-1 binding reduces aspirin antiplatelet effect. Take aspirin before ibuprofen if both needed.' },
            sertraline: { severity: 'medium', mechanism: 'Combined platelet inhibition and GI mucosal damage → increased GI bleeding risk.' },
            metformin:  { severity: 'low',    mechanism: 'NSAIDs may decrease renal metformin clearance; monitor for lactic acidosis in renal impairment.' },
        },
        pkModifiers: {},
        contraindications: ['Renal impairment (eGFR <30)', 'Active GI ulcer', 'Third trimester pregnancy', 'Asthma triggered by aspirin'],
        monitoring: ['Renal function', 'GI symptoms', 'Blood pressure', 'Signs of bleeding']
    },

    warfarin: {
        name: 'Warfarin',
        genericName: 'Warfarin Sodium',
        drugClass: 'Vitamin K Antagonist (Anticoagulant)',
        halfLife: 40.0,         // hours (range 20–60h)
        bioavailability: 0.99,
        Vd: 0.14,
        Tmax: 4.0,
        proteinBinding: 99,
        defaultDose: 5,
        doseRange: [1, 15],
        doseStep: 1,
        primaryOrgan: 'liver',
        affectedOrgans: ['liver', 'blood'],
        mechanism: 'Inhibits vitamin K epoxide reductase (VKORC1), blocking regeneration of active vitamin K. This prevents carboxylation of clotting factors II, VII, IX, X and proteins C and S. Has a very narrow therapeutic index.',
        uses: ['Venous thromboembolism (DVT/PE)', 'Atrial fibrillation', 'Mechanical heart valves', 'Stroke prevention'],
        interactions: {
            aspirin:       { severity: 'high',   mechanism: 'Additive anticoagulation + aspirin inhibits platelets → major hemorrhage risk. Avoid unless specifically indicated.' },
            ibuprofen:     { severity: 'high',   mechanism: 'Protein binding displacement increases free warfarin + NSAID-related bleeding risk + GI ulceration.' },
            omeprazole:    { severity: 'medium', mechanism: 'Omeprazole inhibits CYP2C19, increasing warfarin (S-warfarin) plasma levels. INR may increase 15–35%.' },
            sertraline:    { severity: 'medium', mechanism: 'CYP2C9 inhibition increases S-warfarin levels. Monitor INR when starting/stopping SSRI.' },
            atorvastatin:  { severity: 'low',    mechanism: 'Mild potentiation of anticoagulant effect; monitor INR when initiating statin therapy.' },
            amoxicillin:   { severity: 'medium', mechanism: 'Alters gut flora → reduces vitamin K synthesis → may increase INR. Monitor closely.' },
            acetaminophen: { severity: 'medium', mechanism: 'Chronic high-dose acetaminophen inhibits warfarin metabolism (CYP2C9). INR may rise significantly.' },
        },
        pkModifiers: {},
        contraindications: ['Active bleeding', 'Pregnancy (teratogenic, category X)', 'Recent intracranial surgery', 'Severe hepatic disease'],
        monitoring: ['INR (target 2.0–3.0 typically)', 'Signs of bleeding', 'Diet (vitamin K intake)']
    },

    metformin: {
        name: 'Metformin',
        genericName: 'Metformin HCl',
        drugClass: 'Biguanide (Antidiabetic)',
        halfLife: 6.5,
        bioavailability: 0.50,
        Vd: 4.6,
        Tmax: 2.5,
        proteinBinding: 0,
        defaultDose: 500,
        doseRange: [500, 2000],
        doseStep: 500,
        primaryOrgan: 'kidneys',
        affectedOrgans: ['gi', 'liver', 'kidneys'],
        mechanism: 'Activates AMP-activated protein kinase (AMPK), reducing hepatic gluconeogenesis. Also improves peripheral insulin sensitivity and reduces GI glucose absorption. Unlike sulfonylureas, does not cause hypoglycemia as monotherapy.',
        uses: ['Type 2 diabetes mellitus', 'Prediabetes', 'Insulin resistance', 'PCOS'],
        interactions: {
            aspirin:    { severity: 'low',    mechanism: 'High-dose aspirin may slightly potentiate glucose-lowering effect. Monitor blood glucose.' },
            ibuprofen:  { severity: 'low',    mechanism: 'NSAIDs may reduce renal metformin clearance. Risk increases in renal impairment.' },
        },
        pkModifiers: {},
        contraindications: ['eGFR <30 mL/min', 'Acute or chronic metabolic acidosis', 'Iodinated contrast (hold 48h)', 'Hepatic impairment'],
        monitoring: ['eGFR (at least annually)', 'Vitamin B12 levels (long-term use)', 'Lactic acid if symptoms']
    },

    lisinopril: {
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        drugClass: 'ACE Inhibitor (Antihypertensive)',
        halfLife: 12.0,
        bioavailability: 0.25,
        Vd: 0.5,
        Tmax: 7.0,
        proteinBinding: 0,
        defaultDose: 10,
        doseRange: [2.5, 40],
        doseStep: 2.5,
        primaryOrgan: 'kidneys',
        affectedOrgans: ['kidneys', 'heart', 'blood'],
        mechanism: 'Inhibits angiotensin-converting enzyme (ACE), blocking conversion of angiotensin I to angiotensin II. Reduces vasoconstriction, aldosterone secretion, and sodium retention → lowers blood pressure. Also reduces cardiac preload and afterload (heart failure benefit).',
        uses: ['Hypertension', 'Heart failure (reduced EF)', 'Post-MI cardioprotection', 'Diabetic nephropathy'],
        interactions: {
            ibuprofen:  { severity: 'medium', mechanism: 'NSAIDs blunt renal prostaglandin synthesis → reduced ACE inhibitor antihypertensive effect + risk of acute kidney injury (triple whammy with diuretics).' },
            aspirin:    { severity: 'low',    mechanism: 'High-dose aspirin may reduce vasodilatory prostaglandins and attenuate ACE inhibitor benefit.' },
        },
        pkModifiers: {},
        contraindications: ['Bilateral renal artery stenosis', 'History of angioedema', 'Pregnancy (all trimesters)', 'Concurrent ARB + aliskiren use'],
        monitoring: ['Blood pressure', 'Serum potassium', 'Serum creatinine and eGFR', 'Symptoms of angioedema']
    },

    atorvastatin: {
        name: 'Atorvastatin',
        genericName: 'Atorvastatin Calcium',
        drugClass: 'Statin (HMG-CoA Reductase Inhibitor)',
        halfLife: 14.0,
        bioavailability: 0.14,  // extensive first-pass metabolism
        Vd: 5.4,
        Tmax: 1.0,
        proteinBinding: 98,
        defaultDose: 20,
        doseRange: [10, 80],
        doseStep: 10,
        primaryOrgan: 'liver',
        affectedOrgans: ['liver'],
        mechanism: 'Competitively inhibits HMG-CoA reductase, the rate-limiting enzyme in cholesterol biosynthesis in the liver. This upregulates hepatic LDL receptors, increasing clearance of LDL-C from the blood. Also has pleiotropic anti-inflammatory effects on endothelium.',
        uses: ['Hypercholesterolemia', 'Cardiovascular risk reduction', 'Atherosclerosis prevention', 'Post-ACS therapy'],
        interactions: {
            warfarin:  { severity: 'low',    mechanism: 'Mild inhibition of warfarin metabolism. Check INR when starting atorvastatin.' },
        },
        pkModifiers: {},
        contraindications: ['Active hepatic disease', 'Pregnancy and breastfeeding', 'Unexplained persistent LFT elevation'],
        monitoring: ['LFTs (if symptomatic)', 'Muscle symptoms (CK if myopathy suspected)', 'Lipid panel']
    },

    sertraline: {
        name: 'Sertraline',
        genericName: 'Sertraline HCl',
        drugClass: 'SSRI (Selective Serotonin Reuptake Inhibitor)',
        halfLife: 26.0,
        bioavailability: 0.44,
        Vd: 20.0,
        Tmax: 4.5,
        proteinBinding: 98,
        defaultDose: 50,
        doseRange: [25, 200],
        doseStep: 25,
        primaryOrgan: 'brain',
        affectedOrgans: ['brain', 'liver', 'gi'],
        mechanism: 'Selectively inhibits the serotonin transporter (SERT), increasing synaptic serotonin availability. Unlike older antidepressants, has minimal effect on norepinephrine, dopamine, histamine, or acetylcholine receptors. Takes 2–4 weeks for full therapeutic effect.',
        uses: ['Major depressive disorder', 'Panic disorder', 'OCD', 'PTSD', 'Social anxiety disorder', 'Premenstrual dysphoric disorder'],
        interactions: {
            warfarin:   { severity: 'medium', mechanism: 'Sertraline inhibits CYP2C9, increasing S-warfarin levels. SSRIs also reduce platelet aggregation. Monitor INR.' },
            ibuprofen:  { severity: 'medium', mechanism: 'SSRIs reduce platelet serotonin (needed for aggregation); combined with NSAID markedly increases GI bleeding risk.' },
            aspirin:    { severity: 'medium', mechanism: 'Same platelet effect as with ibuprofen; combined use increases GI and systemic bleeding risk 3-fold.' },
        },
        pkModifiers: {
            warfarin: { halfLifeMultiplier: 1.25 },   // CYP2C9 inhibition increases warfarin t1/2
        },
        contraindications: ['Concurrent MAOI use (within 14 days)', 'Pimozide', 'Disulfiram (liquid formulation only)'],
        monitoring: ['Suicidal ideation (esp. first 2–4 weeks)', 'Serotonin syndrome signs', 'Weight and appetite changes']
    },

    omeprazole: {
        name: 'Omeprazole',
        genericName: 'Omeprazole',
        drugClass: 'Proton Pump Inhibitor (PPI)',
        halfLife: 1.5,
        bioavailability: 0.40,
        Vd: 0.3,
        Tmax: 2.0,
        proteinBinding: 95,
        defaultDose: 20,
        doseRange: [10, 40],
        doseStep: 10,
        primaryOrgan: 'gi',
        affectedOrgans: ['gi', 'liver'],
        mechanism: 'Irreversibly inhibits the H+/K+-ATPase (proton pump) in gastric parietal cells, reducing basal and stimulated gastric acid secretion by >90%. Bioavailability increases with repeated dosing (saturates first-pass metabolism). Effect outlasts the short plasma half-life due to covalent binding.',
        uses: ['GERD', 'Peptic ulcer disease', 'H. pylori eradication (as part of triple therapy)', 'Zollinger-Ellison syndrome', 'GI protection with NSAIDs'],
        interactions: {
            warfarin:  { severity: 'medium', mechanism: 'Inhibits CYP2C19, one pathway of warfarin (R-warfarin) metabolism. May increase INR by 15–35% in susceptible patients.' },
        },
        pkModifiers: {
            warfarin: { halfLifeMultiplier: 1.2 },   // CYP2C19 inhibition
        },
        contraindications: ['Hypersensitivity to PPIs or benzimidazoles'],
        monitoring: ['Magnesium levels (long-term use)', 'B12 levels (long-term use)', 'Bone density (long-term use)']
    },

    amoxicillin: {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin Trihydrate',
        drugClass: 'Aminopenicillin Antibiotic',
        halfLife: 1.1,
        bioavailability: 0.90,
        Vd: 0.3,
        Tmax: 1.5,
        proteinBinding: 20,
        defaultDose: 500,
        doseRange: [250, 1000],
        doseStep: 250,
        primaryOrgan: 'kidneys',
        affectedOrgans: ['lungs', 'gi', 'kidneys'],
        mechanism: 'Beta-lactam antibiotic that inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins (PBPs), preventing peptidoglycan cross-linking. This is bactericidal. Excreted unchanged in urine — dose adjustment needed in renal impairment.',
        uses: ['Respiratory tract infections', 'Otitis media', 'Sinusitis', 'H. pylori (combination)', 'Dental prophylaxis', 'Skin infections'],
        interactions: {
            warfarin: { severity: 'medium', mechanism: 'Disrupts GI flora that produce vitamin K → may increase INR. Effect is variable and unpredictable. Monitor INR during courses.' },
        },
        pkModifiers: {},
        contraindications: ['Penicillin allergy (IgE-mediated)', 'Mononucleosis (risk of rash)'],
        monitoring: ['Allergic reactions (esp. first dose)', 'GI tolerance', 'INR if on warfarin']
    },

    acetaminophen: {
        name: 'Acetaminophen',
        genericName: 'Paracetamol (Acetaminophen)',
        drugClass: 'Analgesic / Antipyretic',
        halfLife: 2.5,
        bioavailability: 0.90,
        Vd: 0.9,
        Tmax: 1.0,
        proteinBinding: 25,
        defaultDose: 500,
        doseRange: [325, 1000],
        doseStep: 325,
        primaryOrgan: 'liver',
        affectedOrgans: ['liver'],
        mechanism: 'Inhibits COX-3 (central nervous system) and modulates the endocannabinoid system and descending serotonergic pathways. Unlike NSAIDs, has no significant peripheral anti-inflammatory effect and does not inhibit platelet aggregation. Hepatotoxic in overdose via NAPQI accumulation.',
        uses: ['Mild-to-moderate pain', 'Fever', 'Osteoarthritis (first-line)', 'Safe alternative to NSAIDs in many patients'],
        interactions: {
            warfarin: { severity: 'medium', mechanism: 'Chronic high-dose use (>2 g/day) inhibits warfarin metabolism (CYP2C9). Can significantly increase INR. Avoid regular high doses in anticoagulated patients.' },
        },
        pkModifiers: {
            warfarin: { halfLifeMultiplier: 1.15 },  // mild CYP2C9 inhibition at high doses
        },
        contraindications: ['Severe hepatic disease', 'Known liver failure'],
        monitoring: ['LFTs with chronic use', 'Total daily dose (max 4 g/day; 2 g/day in liver disease or alcohol use)']
    }
};

// Organ → organ IDs in SVG
const ORGAN_SVG_MAP = {
    brain:   ['organBrain'],
    heart:   ['organHeart'],
    lungs:   ['organLungsL', 'organLungsR'],
    liver:   ['organLiver'],
    gi:      ['organGI', 'organIntestines'],
    kidneys: ['organKidneyL', 'organKidneyR'],
    blood:   ['organHeart']   // represent blood via heart glow
};

// Kidney function thresholds (eGFR %)
const KIDNEY_HINTS = {
    100: '',
    75: 'Stage G2 — mild reduction',
    50: 'Stage G3 — moderate CKD; dose adjust some drugs',
    30: 'Stage G4 — severe CKD; avoid metformin, dose adjust amoxicillin',
    10: 'Stage G5 — kidney failure; many drugs contraindicated'
};

// ============================================================
// 2. STATE
// ============================================================

const state = {
    slots: [],              // { drugId, dose, adminTime, frequency, collapsed }
    patient: {
        age: 45,
        weight: 70,
        kidneyFunction: 100,
        liverFunction: 'normal'
    },
    simulationResults: null,
    rxnormInteractions: [],
    chatHistory: [],        // { role: 'user'|'assistant', content: string }
    claudeAvailable: false,
    currentTab: 'simulation',
    fdaCache: {}
};

// ============================================================
// 3. CHART INSTANCE
// ============================================================

let concentrationChart = null;
let fdaSidebarDebounce = null;
let fdaSidebarResults = [];

// ============================================================
// 4. INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', init);

function init() {
    checkServerStatus();
    addDrugSlot();          // Start with one empty slot
    initChart();
    initEventListeners();
    renderChatContext();
}

function initEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Viz toggle
    document.querySelectorAll('.viz-tab').forEach(btn => {
        btn.addEventListener('click', () => switchVizView(btn.dataset.viz));
    });

    // Patient sliders
    document.getElementById('patientAge').addEventListener('input', e => {
        state.patient.age = +e.target.value;
        document.getElementById('patientAgeValue').textContent = e.target.value;
        updateInteractionBanner();
    });
    document.getElementById('patientWeight').addEventListener('input', e => {
        state.patient.weight = +e.target.value;
        document.getElementById('patientWeightValue').textContent = e.target.value;
    });
    document.getElementById('kidneyFunction').addEventListener('input', e => {
        state.patient.kidneyFunction = +e.target.value;
        document.getElementById('kidneyFunctionValue').textContent = e.target.value;
        updateKidneyHint(+e.target.value);
    });
    document.getElementById('liverFunction').addEventListener('change', e => {
        state.patient.liverFunction = e.target.value;
    });

    // Buttons
    document.getElementById('addDrugBtn').addEventListener('click', addDrugSlot);
    document.getElementById('simulateBtn').addEventListener('click', runSimulation);
    document.getElementById('resetBtn').addEventListener('click', resetAll);
    document.getElementById('reportBtn').addEventListener('click', generateReport);

    // Report modal
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('closeReportBtn').addEventListener('click', closeModal);
    document.getElementById('printReportBtn').addEventListener('click', printReport);
    document.getElementById('reportModal').addEventListener('click', e => {
        if (e.target === document.getElementById('reportModal')) closeModal();
    });

    // AI Chat
    document.getElementById('sendChatBtn').addEventListener('click', sendChatMessage);
    document.getElementById('chatInput').addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
    });

    // Quick question buttons
    document.querySelectorAll('.quick-q-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const q = btn.dataset.q;
            if (q) {
                document.getElementById('chatInput').value = q;
                sendChatMessage();
            }
        });
    });

    // FDA sidebar search
    document.getElementById('fdaSearchSidebar').addEventListener('input', e => {
        clearTimeout(fdaSidebarDebounce);
        const q = e.target.value.trim();
        if (q.length < 2) {
            hideFdaSidebarAutocomplete();
            return;
        }
        document.getElementById('fdaSpinnerSidebar').style.display = 'flex';
        fdaSidebarDebounce = setTimeout(() => searchFdaSidebar(q), 350);
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.fda-sidebar')) hideFdaSidebarAutocomplete();
    });
}

// ============================================================
// 5. SERVER STATUS CHECK
// ============================================================

async function checkServerStatus() {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    const chatDot = document.getElementById('chatStatusDot');
    const chatText = document.getElementById('chatStatusText');

    try {
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(4000) });
        const data = await res.json();

        if (data.claudeConfigured) {
            dot.className = 'status-dot connected';
            text.textContent = 'Claude AI Connected';
            chatDot.className = 'status-dot connected';
            chatText.textContent = 'Claude AI Ready';
            state.claudeAvailable = true;
            document.getElementById('aiSourceBadge').textContent = 'Claude AI';
            document.getElementById('aiSourceBadge').classList.add('active');
        } else {
            dot.className = 'status-dot partial';
            text.textContent = 'Server up · Claude not configured';
            chatDot.className = 'status-dot partial';
            chatText.textContent = 'Template mode — Claude not configured';
        }
    } catch {
        dot.className = 'status-dot disconnected';
        text.textContent = 'Offline — Template mode';
        chatDot.className = 'status-dot disconnected';
        chatText.textContent = 'Offline';
    }
}

// ============================================================
// 6. TAB SWITCHING
// ============================================================

function switchTab(tabId) {
    state.currentTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tabId);
        b.setAttribute('aria-selected', b.dataset.tab === tabId);
    });
    document.getElementById('simulationTab').style.display = tabId === 'simulation' ? '' : 'none';
    document.getElementById('simulationTab').classList.toggle('active', tabId === 'simulation');
    document.getElementById('aiChatTab').style.display = tabId === 'ai-chat' ? '' : 'none';
    document.getElementById('aiChatTab').classList.toggle('active', tabId === 'ai-chat');

    if (tabId === 'ai-chat') renderChatContext();
}

function switchVizView(viz) {
    document.querySelectorAll('.viz-tab').forEach(b => b.classList.toggle('active', b.dataset.viz === viz));
    document.getElementById('chartView').style.display = viz === 'chart' ? '' : 'none';
    document.getElementById('chartView').classList.toggle('active', viz === 'chart');
    document.getElementById('bodyView').style.display = viz === 'body' ? '' : 'none';
    document.getElementById('bodyView').classList.toggle('active', viz === 'body');
}

// ============================================================
// 7. DRUG SLOT MANAGEMENT
// ============================================================

function addDrugSlot() {
    if (state.slots.length >= 3) {
        showToast('Maximum 3 drugs at once', 'warning');
        return;
    }
    state.slots.push({ drugId: null, dose: 0, adminTime: 0, frequency: 'single', collapsed: false });
    renderSlots();
    updateAddDrugBtn();
}

function removeDrugSlot(index) {
    state.slots.splice(index, 1);
    renderSlots();
    updateAddDrugBtn();
    updateInteractionBanner();
    renderChatContext();
    updateDrugsActiveCount();
    showToast('Drug removed', 'info');
}

function updateAddDrugBtn() {
    const btn = document.getElementById('addDrugBtn');
    btn.disabled = state.slots.length >= 3;
    btn.title = state.slots.length >= 3 ? 'Maximum 3 drugs' : 'Add drug slot (max 3)';
}

function renderSlots() {
    const container = document.getElementById('drugSlots');
    container.innerHTML = '';

    state.slots.forEach((slot, index) => {
        const color = DRUG_COLORS[index];
        const drug = slot.drugId ? DRUG_DB[slot.drugId] : null;

        const div = document.createElement('div');
        div.className = `drug-slot slot-${index}`;
        div.innerHTML = `
            <div class="drug-slot-header" onclick="toggleSlot(${index})">
                <span class="drug-color-dot" style="background:${color};"></span>
                <span class="drug-slot-name">${drug ? drug.name : `Drug ${index + 1} — Select below`}</span>
                <button class="remove-drug-btn" onclick="event.stopPropagation(); removeDrugSlot(${index})" title="Remove this drug" aria-label="Remove drug ${index + 1}">×</button>
            </div>
            <div class="drug-slot-body ${slot.collapsed ? 'collapsed' : ''}">
                <div class="control-group">
                    <label>Drug Selection</label>
                    <select class="dropdown drug-select" onchange="onDrugSelected(${index}, this.value)" aria-label="Select drug ${index + 1}">
                        <option value="">— Select a drug —</option>
                        ${Object.entries(DRUG_DB).map(([id, d]) =>
                            `<option value="${id}" ${slot.drugId === id ? 'selected' : ''}>${d.name} — ${d.drugClass}</option>`
                        ).join('')}
                    </select>
                </div>

                ${drug ? `
                <div class="control-group">
                    <label>Dose (mg)</label>
                    <div class="slider-container">
                        <input type="range" class="slider drug-${index}" min="${drug.doseRange[0]}" max="${drug.doseRange[1]}" step="${drug.doseStep}" value="${slot.dose || drug.defaultDose}"
                            oninput="onDoseChange(${index}, this.value, this.nextElementSibling)"
                            aria-label="Dose for drug ${index + 1}">
                        <span class="value-display" style="color:${color};">${slot.dose || drug.defaultDose} mg</span>
                    </div>
                </div>

                <div class="control-group">
                    <label>First Dose At (hours into simulation)</label>
                    <div class="slider-container">
                        <input type="range" class="slider drug-${index}" min="0" max="24" step="1" value="${slot.adminTime}"
                            oninput="onAdminTimeChange(${index}, this.value, this.nextElementSibling)"
                            aria-label="Administration time for drug ${index + 1}">
                        <span class="value-display" style="color:${color};">T+${slot.adminTime}h</span>
                    </div>
                </div>

                <div class="control-group">
                    <label>Dosing Frequency</label>
                    <select class="dropdown" onchange="onFrequencyChange(${index}, this.value)" aria-label="Frequency for drug ${index + 1}">
                        <option value="single" ${slot.frequency === 'single' ? 'selected' : ''}>Single dose</option>
                        <option value="bid" ${slot.frequency === 'bid' ? 'selected' : ''}>BID — every 12h</option>
                        <option value="tid" ${slot.frequency === 'tid' ? 'selected' : ''}>TID — every 8h</option>
                        <option value="qid" ${slot.frequency === 'qid' ? 'selected' : ''}>QID — every 6h</option>
                    </select>
                </div>

                <div style="font-size:0.75rem; color:var(--text-muted); line-height:1.5; background:var(--bg-card); padding:0.5rem; border-radius:6px;">
                    <strong style="color:var(--text-secondary);">${drug.drugClass}</strong><br>
                    t½ = ${drug.halfLife}h · F = ${(drug.bioavailability*100).toFixed(0)}% · Tmax ≈ ${drug.Tmax}h<br>
                    Protein binding: ${drug.proteinBinding}%
                </div>
                ` : ''}
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
    const drug = DRUG_DB[drugId] || null;
    state.slots[index].drugId = drugId || null;
    state.slots[index].dose = drug ? drug.defaultDose : 0;
    state.slots[index].adminTime = 0;
    state.slots[index].frequency = 'single';
    renderSlots();
    updateInteractionBanner();
    updateDrugsActiveCount();
    renderChatContext();
    fetchRxNormInteractions();
}

function onDoseChange(index, value, display) {
    state.slots[index].dose = +value;
    display.textContent = `${value} mg`;
}

function onAdminTimeChange(index, value, display) {
    state.slots[index].adminTime = +value;
    display.textContent = `T+${value}h`;
}

function onFrequencyChange(index, value) {
    state.slots[index].frequency = value;
}

function updateDrugsActiveCount() {
    const count = state.slots.filter(s => s.drugId).length;
    document.getElementById('drugsActiveVal').textContent = count;
}

// ============================================================
// 8. QUICK INTERACTION BANNER (real-time, before simulation)
// ============================================================

function updateInteractionBanner() {
    const banner = document.getElementById('interactionBanner');
    const activeDrugs = state.slots.filter(s => s.drugId).map(s => DRUG_DB[s.drugId]);

    if (activeDrugs.length < 2) {
        banner.style.display = 'none';
        return;
    }

    // Find highest severity interaction in local DB
    let highestSev = 'none';
    const foundInteractions = [];

    const activeFiltered = state.slots.filter(s => s.drugId);
    for (let i = 0; i < activeDrugs.length; i++) {
        for (let j = i + 1; j < activeDrugs.length; j++) {
            const drugA = activeDrugs[i];
            const drugB = activeDrugs[j];
            const idA = activeFiltered[i].drugId;
            const idB = activeFiltered[j].drugId;
            const interaction = drugA.interactions?.[idB] || drugB.interactions?.[idA] || null;

            if (interaction) {
                foundInteractions.push({ drugA: drugA.name, drugB: drugB.name, ...interaction });
                if (interaction.severity === 'high') highestSev = 'high';
                else if (interaction.severity === 'medium' && highestSev !== 'high') highestSev = 'medium';
                else if (interaction.severity === 'low' && highestSev === 'none') highestSev = 'low';
            }
        }
    }

    if (highestSev === 'none') {
        banner.style.display = 'none';
        return;
    }

    const icons = { high: '🔴', medium: '🟡', low: '🟢' };
    const topIx = foundInteractions[0];
    banner.className = `interaction-banner ${highestSev}`;
    banner.style.display = 'block';
    banner.innerHTML = `${icons[highestSev]} <strong>${highestSev.toUpperCase()} INTERACTION:</strong>
        ${topIx.drugA} + ${topIx.drugB} — ${topIx.mechanism.split('.')[0]}.
        ${foundInteractions.length > 1 ? `(+${foundInteractions.length - 1} more)` : ''}`;
}

// ============================================================
// 9. PHARMACOKINETIC ENGINE — 1-Compartment Model
// ============================================================

/**
 * One-compartment first-order absorption PK model.
 * C(t) = (F * D * ka) / (Vd * (ka - ke)) * (e^(-ke*t) - e^(-ka*t))
 * For t >= adminTime.
 */
function pkConcentration(F, D_mg, ka, ke, Vd_L, t, tAdmin) {
    const dt = t - tAdmin;
    if (dt < 0) return 0;
    if (Math.abs(ka - ke) < 0.001) {
        // ka ≈ ke: use limit form
        return (F * D_mg * ka / Vd_L) * dt * Math.exp(-ke * dt);
    }
    return (F * D_mg * ka) / (Vd_L * (ka - ke)) * (Math.exp(-ke * dt) - Math.exp(-ka * dt));
}

/**
 * Generate concentration data for one drug slot over SIM_HOURS.
 * Returns array of concentrations indexed by hour (0 to SIM_HOURS).
 */
function generateDrugCurve(slot, patient, pkOverrides) {
    const SIM_HOURS = 48;
    const drug = DRUG_DB[slot.drugId];
    if (!drug) return Array(SIM_HOURS + 1).fill(0);

    // Base PK params
    let t12 = drug.halfLife;
    let F = drug.bioavailability;
    const D = slot.dose || drug.defaultDose;
    const Tmax = drug.Tmax;

    // Apply PK overrides from interacting drugs
    if (pkOverrides && pkOverrides.halfLifeMultiplier) {
        t12 *= pkOverrides.halfLifeMultiplier;
    }

    // Patient adjustments
    if (patient.age > 65) t12 *= 1.25;
    else if (patient.age > 80) t12 *= 1.45;

    const kidneyFactor = patient.kidneyFunction / 100;
    // Renally cleared drugs have extended half-life with renal impairment
    const renallyCleared = ['amoxicillin', 'metformin', 'lisinopril'];
    if (renallyCleared.includes(slot.drugId)) {
        t12 *= (1 + (1 - kidneyFactor) * 2);
    }

    const liverFactors = { normal: 1.0, mild: 1.25, moderate: 1.6, severe: 2.2 };
    t12 *= (liverFactors[patient.liverFunction] || 1.0);
    F *= (patient.liverFunction === 'severe' ? 0.6 : 1.0);

    const ke = Math.log(2) / t12;              // elimination constant (1/h)
    const ka = Math.log(2) / (Tmax * 0.6);    // absorption constant (faster than t½)
    const Vd_L = drug.Vd * patient.weight;

    // Dose schedule
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

    // Sum contribution of all doses at each time point
    const data = [];
    for (let h = 0; h <= SIM_HOURS; h++) {
        let c = 0;
        for (const tAdmin of doseTimes) {
            c += pkConcentration(F, D, ka, ke, Vd_L, h, tAdmin);
        }
        // Convert ng/mL → keep as ng/mL (units consistent)
        // Add slight variability for realism
        const noise = (Math.sin(h * 0.3 + slot.adminTime) * 0.02 + 1.0);
        data.push(Math.max(0, c * noise * 1000)); // *1000 to convert mg/L → ng/mL scale
    }

    return data;
}

/**
 * Compute PK interaction overrides between active drugs.
 * Returns map: drugIndex → { halfLifeMultiplier, ... }
 */
function computePKOverrides(slots) {
    const overrides = {};

    slots.forEach((slotA, i) => {
        if (!slotA.drugId) return;
        const drugA = DRUG_DB[slotA.drugId];

        slots.forEach((slotB, j) => {
            if (!slotB.drugId || i === j) return;
            // drugA affects drugB's PK
            const pkMod = drugA.pkModifiers?.[slotB.drugId];
            if (pkMod) {
                if (!overrides[j]) overrides[j] = {};
                if (pkMod.halfLifeMultiplier) {
                    overrides[j].halfLifeMultiplier = (overrides[j].halfLifeMultiplier || 1) * pkMod.halfLifeMultiplier;
                }
            }
        });
    });

    return overrides;
}

// ============================================================
// 10. CHART
// ============================================================

function initChart() {
    const ctx = document.getElementById('concentrationChart').getContext('2d');
    if (concentrationChart) concentrationChart.destroy();

    const labels = Array.from({ length: 49 }, (_, i) => i % 6 === 0 ? `${i}h` : '');

    concentrationChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            animation: { duration: 600 },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        font: { size: 11 },
                        usePointStyle: true,
                        padding: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10,14,39,0.96)',
                    titleColor: '#00d4ff',
                    bodyColor: '#94a3b8',
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)} ng/mL`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 8 },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    title: { display: true, text: 'Plasma Concentration (ng/mL)', color: '#00d4ff', font: { size: 10 } }
                },
                x: {
                    ticks: { color: '#94a3b8', font: { size: 10 } },
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    title: { display: true, text: 'Time (hours)', color: '#00d4ff', font: { size: 10 } }
                }
            }
        }
    });
}

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

    concentrationChart.data.datasets = datasets;
    concentrationChart.update('active');
}

// ============================================================
// 11. SIMULATION RUNNER
// ============================================================

async function runSimulation() {
    const activeSlots = state.slots.filter(s => s.drugId);
    if (activeSlots.length === 0) {
        showToast('Select at least one drug to simulate', 'warning');
        return;
    }

    const btn = document.getElementById('simulateBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Simulating...';
    document.getElementById('chartLoading').style.display = 'flex';

    await sleep(300); // brief visual delay for effect

    // Compute PK interaction overrides
    const pkOverrides = computePKOverrides(state.slots);

    // Generate curves for each active drug
    const results = activeSlots.map((slot, localIdx) => {
        const globalIdx = state.slots.indexOf(slot);
        const overrides = pkOverrides[globalIdx] || {};
        const data = generateDrugCurve(slot, state.patient, overrides);
        const drug = DRUG_DB[slot.drugId];
        return {
            drugId: slot.drugId,
            name: drug.name,
            dose: slot.dose || drug.defaultDose,
            frequency: slot.frequency,
            data,
            peak: Math.max(...data),
            tmax: data.indexOf(Math.max(...data)),
            auc: data.reduce((a, b) => a + b, 0),
            halfLife: drug.halfLife * (overrides.halfLifeMultiplier || 1),
            color: DRUG_COLORS[localIdx]
        };
    });

    state.simulationResults = { results, patient: { ...state.patient } };

    document.getElementById('chartLoading').style.display = 'none';

    updateChart(results);
    updateMetrics(results);
    showPKSummary(results);
    updateBodyModel(activeSlots);
    renderChatContext();

    // Generate AI analysis
    if (state.claudeAvailable) {
        btn.innerHTML = '<span class="btn-icon">🤖</span> AI Analyzing...';
        await generateAIAnalysis(results);
    } else {
        generateTemplateAnalysis(results);
    }

    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">▶</span> Run Simulation';

    showToast('Simulation complete!', 'success');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// 12. METRICS & PK SUMMARY
// ============================================================

function updateMetrics(results) {
    if (!results.length) return;

    const avgTmax = results.reduce((a, r) => a + r.tmax, 0) / results.length;

    document.getElementById('drugsActiveVal').textContent = results.length;
    document.getElementById('tmaxVal').textContent = avgTmax.toFixed(1);

    // Interaction level from local DB
    const activeSlots = state.slots.filter(s => s.drugId);
    let level = '—';
    let hasMajor = false;
    let hasModerate = false;

    for (let i = 0; i < activeSlots.length; i++) {
        for (let j = i + 1; j < activeSlots.length; j++) {
            const drugA = DRUG_DB[activeSlots[i].drugId];
            const ix = drugA?.interactions?.[activeSlots[j].drugId];
            if (ix?.severity === 'high') hasMajor = true;
            if (ix?.severity === 'medium') hasModerate = true;
        }
    }

    if (hasMajor) { level = '🔴 HIGH'; document.getElementById('metricInteraction').style.borderColor = 'var(--danger-color)'; }
    else if (hasModerate) { level = '🟡 MODERATE'; document.getElementById('metricInteraction').style.borderColor = 'var(--warning-color)'; }
    else if (activeSlots.length > 1) { level = '🟢 LOW'; document.getElementById('metricInteraction').style.borderColor = 'var(--success-color)'; }
    else { document.getElementById('metricInteraction').style.borderColor = ''; }

    document.getElementById('interactionLevelVal').textContent = level;
    document.getElementById('simDurationVal').textContent = 48;
}

function showPKSummary(results) {
    const grid = document.getElementById('pkGrid');
    grid.innerHTML = '';

    results.forEach(r => {
        const drug = DRUG_DB[r.drugId];
        const items = [
            { label: `${r.name} — Cmax`, value: r.peak.toFixed(0), unit: 'ng/mL' },
            { label: `${r.name} — Tmax`, value: r.tmax, unit: 'h' },
            { label: `${r.name} — t½`, value: r.halfLife.toFixed(1), unit: 'h' },
            { label: `${r.name} — AUC`, value: (r.auc / 1000).toFixed(1), unit: 'µg·h/mL' },
            { label: `${r.name} — F`, value: (drug.bioavailability * 100).toFixed(0), unit: '%' },
            { label: `${r.name} — Steady-state`, value: (r.halfLife * 5 / 24).toFixed(1), unit: 'days' },
        ];

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'pk-item';
            el.innerHTML = `<span class="pk-label">${item.label}</span><span class="pk-value">${item.value}</span><span class="pk-unit">${item.unit}</span>`;
            grid.appendChild(el);
        });
    });

    document.getElementById('pkSummary').style.display = 'block';
}

// ============================================================
// 13. BODY MODEL
// ============================================================

function updateBodyModel(activeSlots) {
    // Reset all organs
    document.querySelectorAll('.organ').forEach(el => {
        el.className = 'organ';
    });

    const organDrugMap = {};  // organId → [slotIndex, ...]

    activeSlots.forEach((slot, localIdx) => {
        const drug = DRUG_DB[slot.drugId];
        if (!drug) return;

        drug.affectedOrgans.forEach(organKey => {
            const svgIds = ORGAN_SVG_MAP[organKey] || [];
            svgIds.forEach(svgId => {
                if (!organDrugMap[svgId]) organDrugMap[svgId] = [];
                organDrugMap[svgId].push(localIdx);
            });
        });
    });

    // Apply classes
    Object.entries(organDrugMap).forEach(([svgId, indices]) => {
        const el = document.getElementById(svgId);
        if (!el) return;
        if (indices.length === 1) {
            el.classList.add(`active-${indices[0]}`, 'pulsing');
        } else {
            el.classList.add('active-multi', 'pulsing');
        }
    });

    // Legend
    renderOrganLegend(activeSlots, organDrugMap);
}

function renderOrganLegend(activeSlots, organDrugMap) {
    const legend = document.getElementById('organLegend');

    // Build organ → drugs map
    const displayMap = {};
    Object.entries(organDrugMap).forEach(([svgId, indices]) => {
        // Get human-readable organ name
        const el = document.getElementById(svgId);
        const label = el?.dataset.label;
        if (!label) return;
        if (!displayMap[label]) displayMap[label] = new Set();
        indices.forEach(i => displayMap[label].add(i));
    });

    if (!Object.keys(displayMap).length) {
        legend.innerHTML = '<p class="placeholder-text">Run simulation to see body distribution.</p>';
        return;
    }

    legend.innerHTML = Object.entries(displayMap).map(([organ, indexSet]) => {
        const drugTags = [...indexSet].map(i => {
            const slot = activeSlots[i];
            const drug = DRUG_DB[slot.drugId];
            const color = DRUG_COLORS[i];
            return `<span class="legend-drug-tag" style="color:${color}; border-color:${color}; background:${DRUG_COLORS_BG[i]};">
                ${drug.name}
            </span>`;
        }).join('');

        return `<div class="legend-item">
            <div class="legend-organ-name">🫀 ${organ}</div>
            <div class="legend-drugs">${drugTags}</div>
        </div>`;
    }).join('');
}

// ============================================================
// 14. RXNORM — Real drug interaction data from NLM
// ============================================================

async function fetchRxNormInteractions() {
    const activeSlots = state.slots.filter(s => s.drugId);
    if (activeSlots.length < 2) {
        state.rxnormInteractions = [];
        renderRxNormSection([]);
        return;
    }

    const drugNames = activeSlots.map(s => DRUG_DB[s.drugId].genericName);

    try {
        const res = await fetch(`/api/rxnorm?drugs=${encodeURIComponent(drugNames.join(','))}`, {
            signal: AbortSignal.timeout(10000)
        });
        const data = await res.json();
        state.rxnormInteractions = data.interactions || [];
        renderRxNormSection(state.rxnormInteractions);
    } catch (err) {
        console.warn('RxNorm fetch error:', err.message);
        renderRxNormSection([]);
    }
}

function renderRxNormSection(interactions) {
    const section = document.getElementById('rxnormSection');
    const content = document.getElementById('rxnormContent');

    if (!interactions.length) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    const html = interactions.slice(0, 5).map(ix => {
        const sevColor = ix.severity === 'High' ? 'var(--danger-color)' :
                         ix.severity === 'Medium' ? 'var(--warning-color)' : 'var(--success-color)';
        return `<div class="rxnorm-interaction ${ix.severity}">
            <div class="rxnorm-drugs">
                ${ix.drug1} + ${ix.drug2}
                <span class="rxnorm-severity" style="color:${sevColor};">[${ix.severity || 'noted'}]</span>
            </div>
            ${ix.description ? `<div class="rxnorm-desc">${ix.description.substring(0, 180)}${ix.description.length > 180 ? '...' : ''}</div>` : ''}
            <div class="rxnorm-source">Source: ${ix.source}</div>
        </div>`;
    }).join('');

    content.innerHTML = html;
}

// ============================================================
// 15. AI ANALYSIS ENGINE
// ============================================================

async function generateAIAnalysis(results) {
    const sections = ['interactionSummary', 'mechanismAnalysis', 'clinicalRisks', 'dosingGuidance', 'recommendations'];
    sections.forEach(id => {
        document.getElementById(id).innerHTML = '<div class="ai-loading"><div class="spinner-small"></div> Generating AI analysis...</div>';
    });

    const prompt = buildAnalysisPrompt(results);

    try {
        const res = await fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                maxTokens: 2500,
                systemPrompt: `You are an expert clinical pharmacologist providing drug interaction analysis for an educational simulation lab.
Provide clear, structured analysis. Use **bold** for drug names and risk levels.
Format each section response as concise HTML paragraphs or bullet lists.
Do not repeat section headers — the UI provides them.
Keep total response under 2000 words, be specific and educational.`
            })
        });

        if (!res.ok) throw new Error('Claude API error');
        const data = await res.json();

        if (data.analysis) {
            distributeAnalysis(data.analysis);
            document.getElementById('aiSourceBadge').textContent = 'Claude AI';
            document.getElementById('aiSourceBadge').classList.add('active');
        } else {
            throw new Error('No analysis returned');
        }
    } catch (err) {
        console.warn('Claude error, falling back to template:', err.message);
        generateTemplateAnalysis(results);
    }
}

function buildAnalysisPrompt(results) {
    const activeSlots = state.slots.filter(s => s.drugId);
    const drugList = activeSlots.map((slot) => {
        const drug = DRUG_DB[slot.drugId];
        return `- **${drug.name}** (${drug.drugClass}): ${slot.dose || drug.defaultDose}mg, ${slot.frequency}, T+${slot.adminTime}h`;
    }).join('\n');

    const localInteractions = [];
    for (let i = 0; i < activeSlots.length; i++) {
        for (let j = i + 1; j < activeSlots.length; j++) {
            const drugA = DRUG_DB[activeSlots[i].drugId];
            const ix = drugA.interactions?.[activeSlots[j].drugId];
            if (ix) {
                localInteractions.push(`${drugA.name} + ${DRUG_DB[activeSlots[j].drugId].name}: ${ix.severity.toUpperCase()} — ${ix.mechanism}`);
            }
        }
    }

    const rxnormSummary = state.rxnormInteractions.slice(0, 3)
        .map(ix => `${ix.drug1} + ${ix.drug2} (${ix.severity}): ${(ix.description || '').substring(0, 100)}`)
        .join('\n');

    return `Analyze this drug combination from the simulation lab:

**Drugs Selected:**
${drugList}

**Patient Profile:**
- Age: ${state.patient.age} years
- Weight: ${state.patient.weight} kg
- Kidney Function: ${state.patient.kidneyFunction}% (eGFR equivalent)
- Liver Function: ${state.patient.liverFunction}

**Known Interactions (local DB):**
${localInteractions.length ? localInteractions.join('\n') : 'No known interactions in local database'}

**RxNorm/NLM Data:**
${rxnormSummary || 'Not available for this combination'}

**Simulation Results:**
${results.map(r => `${r.name}: Cmax = ${r.peak.toFixed(0)} ng/mL, Tmax = ${r.tmax}h, t½ = ${r.halfLife.toFixed(1)}h`).join('\n')}

Provide analysis in exactly these 5 labeled sections. Keep each section 2-4 sentences max.

[SECTION: INTERACTION SUMMARY]
Summarize the key drug-drug interactions and their overall risk level. Mention specific mechanisms briefly.

[SECTION: MECHANISMS OF ACTION]
Explain how each drug works and how their mechanisms interact or conflict.

[SECTION: CLINICAL RISKS]
List the most important clinical risks for this patient given their profile.

[SECTION: DOSING GUIDANCE]
Comment on appropriateness of current doses. Note any dose adjustments needed for patient profile.

[SECTION: RECOMMENDATIONS]
Provide 3-5 specific clinical recommendations for monitoring or management.`;
}

function distributeAnalysis(fullText) {
    const sectionMap = {
        'INTERACTION SUMMARY': 'interactionSummary',
        'MECHANISMS OF ACTION': 'mechanismAnalysis',
        'CLINICAL RISKS': 'clinicalRisks',
        'DOSING GUIDANCE': 'dosingGuidance',
        'RECOMMENDATIONS': 'recommendations'
    };

    const parts = fullText.split(/\[SECTION:\s*([^\]]+)\]/);

    // parts[0] = text before first section, parts[1] = first label, parts[2] = first content, etc.
    for (let i = 1; i < parts.length; i += 2) {
        const label = parts[i]?.trim();
        const content = parts[i + 1]?.trim();
        const elId = sectionMap[label];
        if (elId && content) {
            document.getElementById(elId).innerHTML = formatAIText(content);
        }
    }

    // Fill any unsupported sections with placeholder
    Object.values(sectionMap).forEach(id => {
        const el = document.getElementById(id);
        if (el && el.innerHTML.includes('spinner-small')) {
            el.innerHTML = '<p class="placeholder-text">Section not generated by this analysis.</p>';
        }
    });
}

function formatAIText(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n{2,}/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(.+)$/, '<p>$1</p>');
}

// ============================================================
// 16. TEMPLATE ANALYSIS (fallback when Claude not available)
// ============================================================

function generateTemplateAnalysis(_results) {
    const activeSlots = state.slots.filter(s => s.drugId);

    // Interaction Summary
    const interactions = [];
    for (let i = 0; i < activeSlots.length; i++) {
        for (let j = i + 1; j < activeSlots.length; j++) {
            const drugA = DRUG_DB[activeSlots[i].drugId];
            const drugB = DRUG_DB[activeSlots[j].drugId];
            const ix = drugA.interactions?.[activeSlots[j].drugId] || drugB.interactions?.[activeSlots[i].drugId];
            if (ix) interactions.push({ drugA: drugA.name, drugB: drugB.name, ...ix });
        }
    }

    if (interactions.length === 0) {
        document.getElementById('interactionSummary').innerHTML =
            activeSlots.length < 2
                ? '<p class="placeholder-text">Add 2+ drugs to analyze interactions.</p>'
                : '<p style="color:var(--success-color);">✓ No significant interactions found between these drugs in the local database. Always verify with current clinical resources.</p>';
    } else {
        const html = `<div class="interaction-list">${interactions.map(ix => `
            <div class="interaction-item ${ix.severity}-risk">
                <div class="interaction-drugs">${ix.drugA} + ${ix.drugB} <span class="risk-badge ${ix.severity}">${ix.severity.toUpperCase()}</span></div>
                <div class="interaction-desc">${ix.mechanism}</div>
            </div>`).join('')}</div>`;
        document.getElementById('interactionSummary').innerHTML = html;
    }

    // Mechanisms of Action
    const mechs = activeSlots.map(slot => {
        const drug = DRUG_DB[slot.drugId];
        return `<p><strong>${drug.name}</strong> (${drug.drugClass}): ${drug.mechanism}</p>`;
    }).join('');
    document.getElementById('mechanismAnalysis').innerHTML = mechs || '<p class="placeholder-text">No drugs selected.</p>';

    // Clinical Risks
    const risks = [];
    activeSlots.forEach(slot => {
        const drug = DRUG_DB[slot.drugId];
        if (state.patient.age > 65 && drug.halfLife > 12) {
            risks.push(`🟡 ${drug.name}: Extended t½ in elderly (${state.patient.age}y) — risk of accumulation. Consider dose reduction.`);
        }
        if (state.patient.kidneyFunction < 60 && ['amoxicillin', 'metformin', 'lisinopril'].includes(slot.drugId)) {
            risks.push(`🔴 ${drug.name}: Renally cleared — dose adjustment required for eGFR ${state.patient.kidneyFunction}%.`);
        }
        if (state.patient.liverFunction !== 'normal' && ['warfarin', 'atorvastatin', 'sertraline'].includes(slot.drugId)) {
            risks.push(`🟡 ${drug.name}: Hepatically metabolized — ${state.patient.liverFunction} liver impairment may increase exposure.`);
        }
        if (drug.proteinBinding > 95 && interactions.some(ix => ix.drugA === drug.name || ix.drugB === drug.name)) {
            risks.push(`🟡 ${drug.name}: High protein binding (${drug.proteinBinding}%) — displacement interactions possible.`);
        }
    });

    interactions.forEach(ix => {
        if (ix.severity === 'high') risks.push(`🔴 Major interaction: ${ix.drugA} + ${ix.drugB} — ${ix.mechanism.split('.')[0]}.`);
    });

    document.getElementById('clinicalRisks').innerHTML = risks.length
        ? `<ul class="suggestion-list">${risks.map(r => `<li>${r}</li>`).join('')}</ul>`
        : '<p style="color:var(--success-color);">✓ No major risk factors identified for current patient profile.</p>';

    // Dosing Guidance
    const dosings = activeSlots.map(slot => {
        const drug = DRUG_DB[slot.drugId];
        const dose = slot.dose || drug.defaultDose;
        const freqLabel = { single: 'once', bid: 'twice daily', tid: 'three times daily', qid: 'four times daily' }[slot.frequency];
        let notes = [];
        if (state.patient.age > 65) notes.push(`start at lower end of range in elderly`);
        if (state.patient.kidneyFunction < 60 && ['amoxicillin', 'metformin', 'lisinopril'].includes(slot.drugId)) {
            notes.push(`reduce dose for eGFR ${state.patient.kidneyFunction}%`);
        }
        return `<p><strong>${drug.name}:</strong> ${dose}mg ${freqLabel}${notes.length ? ` — Note: ${notes.join('; ')}` : ''}.</p>`;
    }).join('');

    document.getElementById('dosingGuidance').innerHTML = dosings || '<p class="placeholder-text">Select drugs to see dosing guidance.</p>';

    // Recommendations
    const recs = [];
    if (interactions.some(ix => ix.severity === 'high')) recs.push('Consult a pharmacist or clinician before co-administering these drugs — a major interaction exists.');
    if (state.patient.age > 75) recs.push('Start at reduced doses in this patient (>75 years); monitor closely for adverse effects.');
    if (state.patient.kidneyFunction < 50) recs.push('Multiple drugs may require renal dose adjustment — calculate creatinine clearance before prescribing.');
    if (activeSlots.length >= 2) recs.push('Document all medications in patient record and screen for interactions at every visit.');
    activeSlots.forEach(slot => {
        const drug = DRUG_DB[slot.drugId];
        if (drug.monitoring?.length) {
            recs.push(`Monitor for ${drug.name}: ${drug.monitoring.slice(0, 2).join(', ')}.`);
        }
    });

    document.getElementById('recommendations').innerHTML = recs.length
        ? `<ul class="suggestion-list">${recs.slice(0, 6).map(r => `<li>${r}</li>`).join('')}</ul>`
        : '<p>Follow standard clinical guidelines and monitor per drug-specific recommendations.</p>';

    document.getElementById('aiSourceBadge').textContent = 'Template';
    document.getElementById('aiSourceBadge').classList.remove('active');
}

// ============================================================
// 17. AI CHAT TAB
// ============================================================

function renderChatContext() {
    const container = document.getElementById('chatContext');
    const activeSlots = state.slots.filter(s => s.drugId);

    if (!activeSlots.length) {
        container.innerHTML = '<p class="placeholder-text">No drugs selected. Go to Simulation Lab first.</p>';
        return;
    }

    const drugItems = activeSlots.map((slot, i) => {
        const drug = DRUG_DB[slot.drugId];
        const color = DRUG_COLORS[i];
        return `<div class="context-drug-item">
            <div class="context-drug-name">
                <span class="context-drug-dot" style="background:${color};"></span>
                ${drug.name}
            </div>
            <div class="context-drug-detail">${slot.dose || drug.defaultDose}mg ${slot.frequency} · ${drug.drugClass}</div>
        </div>`;
    }).join('');

    const patientInfo = `<div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.5rem;">
        Patient: ${state.patient.age}y, ${state.patient.weight}kg,
        eGFR ${state.patient.kidneyFunction}%, liver: ${state.patient.liverFunction}
    </div>`;

    const simStatus = state.simulationResults
        ? '<p style="font-size:0.72rem; color:var(--success-color); margin-top:0.4rem;">✓ Simulation complete — AI has full PK data</p>'
        : '<p style="font-size:0.72rem; color:var(--warning-color); margin-top:0.4rem;">⚠ Run simulation first for richer analysis</p>';

    container.innerHTML = drugItems + patientInfo + simStatus;
}

function buildChatSystemContext() {
    const activeSlots = state.slots.filter(s => s.drugId);
    if (!activeSlots.length) return '';

    const drugList = activeSlots.map(slot => {
        const drug = DRUG_DB[slot.drugId];
        return `- ${drug.name} (${drug.drugClass}): ${slot.dose || drug.defaultDose}mg ${slot.frequency}`;
    }).join('\n');

    const simResults = state.simulationResults?.results?.map(r =>
        `- ${r.name}: Cmax=${r.peak.toFixed(0)} ng/mL, Tmax=${r.tmax}h, t½=${r.halfLife.toFixed(1)}h`
    ).join('\n') || 'Simulation not yet run';

    const interactions = [];
    for (let i = 0; i < activeSlots.length; i++) {
        for (let j = i + 1; j < activeSlots.length; j++) {
            const drugA = DRUG_DB[activeSlots[i].drugId];
            const ix = drugA.interactions?.[activeSlots[j].drugId];
            if (ix) interactions.push(`${drugA.name} + ${DRUG_DB[activeSlots[j].drugId].name}: ${ix.severity} — ${ix.mechanism}`);
        }
    }

    return `Current simulation context:
Drugs: ${drugList}
Patient: Age ${state.patient.age}y, Weight ${state.patient.weight}kg, eGFR ${state.patient.kidneyFunction}%, Liver: ${state.patient.liverFunction}
PK Results: ${simResults}
Known interactions: ${interactions.length ? interactions.join('; ') : 'none in local DB'}
RxNorm data: ${state.rxnormInteractions.slice(0, 2).map(ix => `${ix.drug1}+${ix.drug2}: ${ix.severity}`).join('; ') || 'not fetched'}`;
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    input.style.height = 'auto';

    addMessageToChat('user', message);

    // Add to history
    state.chatHistory.push({ role: 'user', content: message });

    // Show typing indicator
    const thinkingId = showTypingIndicator();

    if (!state.claudeAvailable) {
        await sleep(800);
        removeTypingIndicator(thinkingId);
        const templateReply = generateTemplateChatReply(message);
        addMessageToChat('assistant', templateReply);
        state.chatHistory.push({ role: 'assistant', content: templateReply });
        return;
    }

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: state.chatHistory.slice(-10), // keep last 10 exchanges
                systemContext: buildChatSystemContext()
            }),
            signal: AbortSignal.timeout(30000)
        });

        if (!res.ok) throw new Error('Chat API error');
        const data = await res.json();

        removeTypingIndicator(thinkingId);

        if (data.reply) {
            addMessageToChat('assistant', data.reply);
            state.chatHistory.push({ role: 'assistant', content: data.reply });
        } else {
            throw new Error('Empty reply');
        }

    } catch (err) {
        console.error('Chat error:', err);
        removeTypingIndicator(thinkingId);
        const fallback = generateTemplateChatReply(message);
        addMessageToChat('assistant', fallback);
        state.chatHistory.push({ role: 'assistant', content: fallback });
    }
}

function generateTemplateChatReply(message) {
    const msg = message.toLowerCase();
    const activeSlots = state.slots.filter(s => s.drugId);

    if (!activeSlots.length) {
        return 'I don\'t see any drugs selected in the Simulation Lab yet. Please go to the **Simulation Lab** tab, select 2–3 drugs, and optionally run the simulation — then I\'ll be able to give you specific, relevant answers.';
    }

    const drugNames = activeSlots.map(s => DRUG_DB[s.drugId].name).join(' and ');

    if (msg.includes('risk') || msg.includes('danger') || msg.includes('safe')) {
        const interactions = [];
        for (let i = 0; i < activeSlots.length; i++) {
            for (let j = i + 1; j < activeSlots.length; j++) {
                const drugA = DRUG_DB[activeSlots[i].drugId];
                const ix = drugA.interactions?.[activeSlots[j].drugId];
                if (ix) interactions.push(`**${drugA.name} + ${DRUG_DB[activeSlots[j].drugId].name}**: ${ix.severity.toUpperCase()} — ${ix.mechanism}`);
            }
        }
        return interactions.length
            ? `Here are the key risks for **${drugNames}**:\n\n${interactions.join('\n\n')}\n\nAlways consult a pharmacist or physician before co-administering these drugs.`
            : `For **${drugNames}**, no significant interactions are recorded in my local database. This doesn't mean the combination is completely without risk — please verify with a current interaction checker such as Lexicomp or Micromedex.`;
    }

    if (msg.includes('mechanism') || msg.includes('work') || msg.includes('action')) {
        return activeSlots.map(s => {
            const drug = DRUG_DB[s.drugId];
            return `**${drug.name}** (${drug.drugClass}): ${drug.mechanism}`;
        }).join('\n\n');
    }

    if (msg.includes('monitor') || msg.includes('check') || msg.includes('watch')) {
        return activeSlots.map(s => {
            const drug = DRUG_DB[s.drugId];
            return `**${drug.name}**: Monitor — ${drug.monitoring?.join(', ') || 'routine clinical parameters'}`;
        }).join('\n\n');
    }

    if (msg.includes('dose') || msg.includes('dosing') || msg.includes('mg')) {
        return activeSlots.map(s => {
            const drug = DRUG_DB[s.drugId];
            const dose = s.dose || drug.defaultDose;
            return `**${drug.name}**: Current simulation dose is ${dose}mg. Typical range is ${drug.doseRange[0]}–${drug.doseRange[1]}mg. ${state.patient.age > 65 ? 'For this elderly patient, consider starting at the lower end of the range.' : ''}`;
        }).join('\n\n');
    }

    if (msg.includes('alternative') || msg.includes('instead') || msg.includes('replace')) {
        return `To suggest alternatives to **${drugNames}**, I'd need to know the therapeutic goal. Each drug has specific indications — for example, if you're looking to avoid a high-risk combination like **Warfarin + NSAIDs**, acetaminophen is generally safer for pain management in anticoagulated patients (at doses ≤2g/day).`;
    }

    // Default response
    return `That's a good question about **${drugNames}**. To get the most detailed and accurate answer, I'd recommend:\n\n1. Running the **simulation first** using the Simulation Lab tab\n2. Enabling Claude AI by setting up your ANTHROPIC_API_KEY\n\nIn the meantime, here's what I know: ${activeSlots.map(s => `**${DRUG_DB[s.drugId].name}** — ${DRUG_DB[s.drugId].mechanism.substring(0, 100)}...`).join(' ')}`;
}

function addMessageToChat(role, content) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-message ${role}`;
    div.innerHTML = `
        <div class="message-avatar">${role === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content">${formatChatContent(content)}</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function formatChatContent(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(.*)$/, '<p>$1</p>');
}

function showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'chat-message assistant';
    div.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content chat-thinking">
            <span class="typing-dots">
                <span></span><span></span><span></span>
            </span>
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    document.getElementById(id)?.remove();
}

// ============================================================
// 18. OPENFDA SIDEBAR SEARCH
// ============================================================

async function searchFdaSidebar(query) {
    try {
        const encoded = encodeURIComponent(query);
        const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encoded}"+openfda.generic_name:"${encoded}"&limit=6`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error('FDA API error');
        const data = await res.json();
        fdaSidebarResults = parseFDAResults(data.results || []);
        renderFdaSidebarAutocomplete(fdaSidebarResults);
    } catch {
        fdaSidebarResults = [];
        renderFdaSidebarAutocomplete([]);
    } finally {
        document.getElementById('fdaSpinnerSidebar').style.display = 'none';
    }
}

function parseFDAResults(results) {
    const seen = new Set();
    return results.map(r => {
        const brand = r.openfda?.brand_name?.[0] || '';
        const generic = r.openfda?.generic_name?.[0] || '';
        const name = brand || generic;
        if (!name || seen.has(name.toLowerCase())) return null;
        seen.add(name.toLowerCase());
        return {
            brandName: brand,
            genericName: generic,
            manufacturer: r.openfda?.manufacturer_name?.[0] || '',
            drugClass: r.openfda?.pharm_class_epc?.[0] || '',
            warnings: r.warnings?.[0]?.substring(0, 200) || '',
            contraindications: r.contraindications?.[0]?.substring(0, 200) || '',
            drugInteractions: r.drug_interactions?.[0]?.substring(0, 300) || '',
            indications: r.indications_and_usage?.[0]?.substring(0, 200) || '',
            dosageAdmin: r.dosage_and_administration?.[0]?.substring(0, 200) || ''
        };
    }).filter(Boolean).slice(0, 5);
}

function renderFdaSidebarAutocomplete(results) {
    const list = document.getElementById('fdaAutocompleteSidebar');
    if (!results.length) {
        list.innerHTML = '<div class="autocomplete-item no-results">No results found</div>';
        list.style.display = 'block';
        return;
    }
    list.innerHTML = results.map((d, i) => `
        <div class="autocomplete-item" onclick="selectFdaSidebar(${i})">
            <div class="drug-brand">${d.brandName || d.genericName}</div>
            <div class="drug-generic">${d.genericName && d.brandName ? d.genericName : d.manufacturer}</div>
            ${d.drugClass ? `<div class="drug-class">${d.drugClass}</div>` : ''}
        </div>
    `).join('');
    list.style.display = 'block';
}

function selectFdaSidebar(index) {
    const drug = fdaSidebarResults[index];
    if (!drug) return;

    hideFdaSidebarAutocomplete();
    document.getElementById('fdaSearchSidebar').value = drug.brandName || drug.genericName;

    const card = document.getElementById('fdaCardSidebar');
    const sections = [];
    if (drug.indications) sections.push(`<div class="fda-field"><strong>Indications:</strong> ${drug.indications}</div>`);
    if (drug.warnings) sections.push(`<div class="fda-field fda-warning"><strong>⚠ Warnings:</strong> ${drug.warnings}</div>`);
    if (drug.contraindications) sections.push(`<div class="fda-field fda-danger"><strong>Contraindications:</strong> ${drug.contraindications}</div>`);
    if (drug.drugInteractions) sections.push(`<div class="fda-field"><strong>Interactions:</strong> ${drug.drugInteractions}</div>`);
    if (drug.dosageAdmin) sections.push(`<div class="fda-field"><strong>Dosage:</strong> ${drug.dosageAdmin}</div>`);

    card.innerHTML = `<strong>${drug.brandName || drug.genericName}</strong><br>${sections.join('')}`;
    card.style.display = 'block';

    showToast(`Loaded FDA data for ${drug.brandName || drug.genericName}`, 'success');
}

function hideFdaSidebarAutocomplete() {
    const list = document.getElementById('fdaAutocompleteSidebar');
    list.style.display = 'none';
    list.innerHTML = '';
}

// ============================================================
// 19. KIDNEY HINT
// ============================================================

function updateKidneyHint(value) {
    const hint = document.getElementById('kidneyHint');
    const level = Object.keys(KIDNEY_HINTS).reverse().find(k => value <= +k);
    hint.textContent = level ? KIDNEY_HINTS[level] : '';
}

// ============================================================
// 20. REPORT GENERATION
// ============================================================

function generateReport() {
    const activeSlots = state.slots.filter(s => s.drugId);
    const modal = document.getElementById('reportModal');
    const content = document.getElementById('reportContent');
    const now = new Date();

    if (!activeSlots.length) {
        showToast('Select at least one drug before generating a report', 'warning');
        return;
    }

    const drugRows = activeSlots.map((slot, i) => {
        const drug = DRUG_DB[slot.drugId];
        return `<div><label>Drug ${i + 1}:</label><span>${drug.name} (${drug.drugClass}) — ${slot.dose || drug.defaultDose}mg ${slot.frequency}</span></div>`;
    }).join('');

    const pkRows = state.simulationResults?.results?.map(r => `
        <div><label>${r.name} Cmax:</label><span>${r.peak.toFixed(0)} ng/mL</span></div>
        <div><label>${r.name} Tmax:</label><span>${r.tmax}h</span></div>
        <div><label>${r.name} t½:</label><span>${r.halfLife.toFixed(1)}h</span></div>
    `).join('') || '<div><label>Simulation:</label><span>Not yet run</span></div>';

    const interactionHtml = document.getElementById('interactionSummary')?.innerHTML || '';
    const risksHtml = document.getElementById('clinicalRisks')?.innerHTML || '';
    const dosingHtml = document.getElementById('dosingGuidance')?.innerHTML || '';
    const recsHtml = document.getElementById('recommendations')?.innerHTML || '';

    const rxnormHtml = state.rxnormInteractions.length
        ? state.rxnormInteractions.slice(0, 3).map(ix =>
            `<p><strong>${ix.drug1} + ${ix.drug2}</strong> [${ix.severity}]: ${(ix.description || '').substring(0, 150)}</p>`
        ).join('')
        : '<p>RxNorm data not fetched for this combination.</p>';

    content.innerHTML = `
        <div class="report-doc">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.2rem;">
                <div>
                    <h1>🔬 Drug Interaction Lab Report</h1>
                    <p class="report-date">AI-Powered Simulation · OpenFDA + RxNorm Data</p>
                </div>
                <div class="report-date" style="text-align:right;">
                    <strong>Generated:</strong><br>
                    ${now.toLocaleDateString()} ${now.toLocaleTimeString()}
                </div>
            </div>

            <div class="report-section">
                <h2>Drug Selection</h2>
                <div class="report-grid">${drugRows}</div>
            </div>

            <div class="report-section">
                <h2>Patient Profile</h2>
                <div class="report-grid">
                    <div><label>Age:</label><span>${state.patient.age} years</span></div>
                    <div><label>Weight:</label><span>${state.patient.weight} kg</span></div>
                    <div><label>Kidney Function:</label><span>${state.patient.kidneyFunction}% (eGFR equivalent)</span></div>
                    <div><label>Liver Function:</label><span>${state.patient.liverFunction}</span></div>
                </div>
            </div>

            <div class="report-section">
                <h2>Pharmacokinetic Results</h2>
                <div class="report-grid">${pkRows}</div>
            </div>

            <div class="report-section">
                <h2>Interaction Analysis</h2>
                ${interactionHtml}
            </div>

            <div class="report-section">
                <h2>RxNorm/NLM Interaction Data</h2>
                ${rxnormHtml}
            </div>

            <div class="report-section">
                <h2>Clinical Risks</h2>
                ${risksHtml}
            </div>

            <div class="report-section">
                <h2>Dosing Guidance</h2>
                ${dosingHtml}
            </div>

            <div class="report-section">
                <h2>Recommendations</h2>
                ${recsHtml}
            </div>

            <div class="report-footer">
                <strong>Disclaimer:</strong> This report is generated by an educational drug simulation tool.
                All data is for learning purposes only. Clinical decisions must be made by qualified healthcare
                professionals using validated clinical data sources. Drug interaction data sourced from RxNorm (NLM)
                and OpenFDA public APIs.
            </div>
        </div>`;

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('reportModal').style.display = 'none';
}

function printReport() {
    const content = document.getElementById('reportContent').innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;

    const printCSS = `
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #fff; padding: 2rem; max-width: 800px; margin: 0 auto; }
        h1 { color: #0066cc; border-bottom: 2px solid #0066cc; padding-bottom: 0.5rem; font-size: 1.4rem; }
        h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 0.3rem; font-size: 1rem; margin-top: 1.5rem; }
        .report-section { margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #e0e0e0; border-radius: 8px; }
        .report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem 2rem; margin: 0.8rem 0; }
        .report-grid div label { font-weight: 600; color: #555; font-size: 0.82rem; display: block; }
        .report-grid div span { color: #111; font-size: 0.88rem; }
        .report-footer { margin-top: 2rem; font-size: 0.78rem; color: #777; border-top: 1px solid #ddd; padding-top: 1rem; }
        ul { padding-left: 1.2rem; } li { margin: 0.3rem 0; } p { margin: 0.4rem 0; }
        strong { font-weight: 700; }
        .suggestion-list { list-style: none; padding-left: 1rem; }
        .suggestion-list li::before { content: "→ "; color: #0066cc; }
        @media print { body { padding: 0; } .report-section { break-inside: avoid; page-break-inside: avoid; } }
    `;
    win.document.title = 'Drug Interaction Lab Report';
    const styleEl = win.document.createElement('style');
    styleEl.textContent = printCSS;
    win.document.head.appendChild(styleEl);
    win.document.body.innerHTML = content;
    setTimeout(() => win.print(), 500);
}

// ============================================================
// 21. RESET
// ============================================================

function resetAll() {
    state.slots = [];
    state.simulationResults = null;
    state.rxnormInteractions = [];
    state.chatHistory = [];

    // Reset patient
    state.patient = { age: 45, weight: 70, kidneyFunction: 100, liverFunction: 'normal' };
    document.getElementById('patientAge').value = 45;
    document.getElementById('patientAgeValue').textContent = 45;
    document.getElementById('patientWeight').value = 70;
    document.getElementById('patientWeightValue').textContent = 70;
    document.getElementById('kidneyFunction').value = 100;
    document.getElementById('kidneyFunctionValue').textContent = 100;
    document.getElementById('kidneyHint').textContent = '';
    document.getElementById('liverFunction').value = 'normal';

    // Reset UI
    document.getElementById('interactionBanner').style.display = 'none';
    document.getElementById('pkSummary').style.display = 'none';
    document.getElementById('rxnormSection').style.display = 'none';

    ['interactionSummary', 'mechanismAnalysis', 'clinicalRisks', 'dosingGuidance', 'recommendations'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<p class="placeholder-text">Run simulation to generate analysis...</p>';
    });

    document.getElementById('drugsActiveVal').textContent = '0';
    document.getElementById('interactionLevelVal').textContent = '—';
    document.getElementById('tmaxVal').textContent = '—';
    document.getElementById('metricInteraction').style.borderColor = '';

    document.querySelectorAll('.organ').forEach(el => { el.className = 'organ'; });
    document.getElementById('organLegend').innerHTML = '<p class="placeholder-text">Select drugs and run simulation to see body distribution.</p>';

    initChart();
    addDrugSlot();
    renderChatContext();
    updateAddDrugBtn();

    document.getElementById('aiSourceBadge').textContent = 'Awaiting';
    document.getElementById('aiSourceBadge').classList.remove('active');

    showToast('Reset complete', 'info');
}

// ============================================================
// 22. TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✓', warning: '⚠', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}
