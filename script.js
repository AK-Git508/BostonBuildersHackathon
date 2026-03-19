// ========================================
// DRUG SIMULATION ENGINE
// Complete JavaScript Logic
// ========================================

// ========================================
// STATE MANAGEMENT
// ========================================

const state = {
    molecularSize: 350,
    solubility: 60,
    toxicity: 15,
    patientAge: 45,
    targetOrgan: 'liver',
    patientName: '',
    patientWeight: 70,
    conditions: [],
    allergies: [],
    selectedDrugId: null,
    currentMeds: [],
    history: [],
    simulationData: [],
    isSimulating: false,
    interactionRiskScore: 0,
    interactionRiskLevel: 'low',
    existingConditions: [],
    currentMedications: [],
    fdaSelectedDrug: null,  // Real drug data from OpenFDA
    claudeAvailable: false,
    lastSimulationResults: null
};

// ========================================
// LOCAL DRUG DATABASE
// ========================================

const DRUG_DATABASE = [
    {
        id: 'amoxicillin',
        name: 'Amoxicillin',
        class: 'Penicillin Antibiotic',
        commonUses: ['Bacterial infections', 'Otitis media', 'Sinusitis', 'Pneumonia'],
        allergies: ['penicillin'],
        contraindications: ['mononucleosis', 'penicillin allergy'],
        interactions: {
            warfarin: 'medium',
            methotrexate: 'high',
            oral_contraceptives: 'low'
        },
        precautions: [
            'May increase INR when given with warfarin — monitor INR closely',
            'Monitor renal function in patients with kidney impairment',
            'May reduce effectiveness of oral contraceptives'
        ],
        alternatives: ['Azithromycin', 'Doxycycline', 'Clarithromycin']
    },
    {
        id: 'ibuprofen',
        name: 'Ibuprofen',
        class: 'NSAID',
        commonUses: ['Pain relief', 'Fever', 'Inflammation', 'Dysmenorrhea'],
        allergies: ['nsaids', 'aspirin'],
        contraindications: ['peptic ulcer disease', 'renal impairment', 'asthma', 'heart-disease'],
        interactions: {
            warfarin: 'high',
            lisinopril: 'medium',
            lithium: 'medium',
            aspirin: 'medium',
            metformin: 'low'
        },
        precautions: [
            'Take with food to reduce GI irritation',
            'Avoid in patients with renal or hepatic impairment',
            'May mask fever as a sign of infection'
        ],
        alternatives: ['Acetaminophen', 'Naproxen', 'Celecoxib']
    },
    {
        id: 'warfarin',
        name: 'Warfarin',
        class: 'Anticoagulant (Vitamin K Antagonist)',
        commonUses: ['Venous thromboembolism', 'Atrial fibrillation', 'Mechanical heart valves'],
        allergies: [],
        contraindications: ['bleeding disorders', 'pregnancy', 'recent surgery'],
        interactions: {
            aspirin: 'high',
            ibuprofen: 'high',
            amoxicillin: 'medium',
            sertraline: 'medium',
            atorvastatin: 'low'
        },
        precautions: [
            'Requires routine INR monitoring (target 2.0–3.0 for most indications)',
            'Many drug-drug and drug-food interactions — review every new medication',
            'Avoid large changes in dietary vitamin K intake'
        ],
        alternatives: ['Apixaban', 'Rivaroxaban', 'Dabigatran']
    },
    {
        id: 'metformin',
        name: 'Metformin',
        class: 'Biguanide (Antidiabetic)',
        commonUses: ['Type 2 diabetes mellitus', 'Insulin resistance', 'PCOS'],
        allergies: [],
        contraindications: ['renal impairment', 'acute cardiac failure', 'lactic acidosis', 'kidney-disease'],
        interactions: {
            cimetidine: 'medium',
            contrast_dye: 'high',
            alcohol: 'medium'
        },
        precautions: [
            'Hold 48h before and after iodinated contrast imaging',
            'Risk of lactic acidosis in renal impairment — monitor eGFR',
            'May cause GI side effects (nausea, diarrhea) — take with meals'
        ],
        alternatives: ['Glipizide', 'Sitagliptin', 'Empagliflozin']
    },
    {
        id: 'lisinopril',
        name: 'Lisinopril',
        class: 'ACE Inhibitor',
        commonUses: ['Hypertension', 'Heart failure', 'Post-MI cardioprotection'],
        allergies: [],
        contraindications: ['pregnancy', 'angioedema history', 'bilateral renal artery stenosis'],
        interactions: {
            potassium_supplements: 'high',
            ibuprofen: 'medium',
            spironolactone: 'medium',
            warfarin: 'low'
        },
        precautions: [
            'Monitor serum potassium and creatinine after initiation',
            'Contraindicated in pregnancy (category D) — teratogenic',
            'Discontinue if angioedema occurs — can be life-threatening'
        ],
        alternatives: ['Losartan', 'Enalapril', 'Valsartan']
    },
    {
        id: 'atorvastatin',
        name: 'Atorvastatin',
        class: 'HMG-CoA Reductase Inhibitor (Statin)',
        commonUses: ['Hypercholesterolemia', 'Cardiovascular risk reduction', 'Atherosclerosis'],
        allergies: [],
        contraindications: ['liver-disease', 'pregnancy', 'active hepatic disease'],
        interactions: {
            warfarin: 'low',
            clarithromycin: 'high',
            gemfibrozil: 'high'
        },
        precautions: [
            'Monitor LFTs at baseline; recheck if symptoms of liver disease develop',
            'Myopathy risk increases with concurrent CYP3A4 inhibitors',
            'Avoid grapefruit juice (inhibits CYP3A4 metabolism)'
        ],
        alternatives: ['Rosuvastatin', 'Pravastatin', 'Simvastatin']
    },
    {
        id: 'sertraline',
        name: 'Sertraline',
        class: 'SSRI Antidepressant',
        commonUses: ['Major depressive disorder', 'OCD', 'Panic disorder', 'PTSD', 'Social anxiety'],
        allergies: [],
        contraindications: ['MAO inhibitor use within 14 days'],
        interactions: {
            warfarin: 'medium',
            tramadol: 'high',
            lithium: 'medium',
            triptans: 'medium'
        },
        precautions: [
            'Monitor for suicidal ideation, especially in young adults, during initial therapy',
            'Serotonin syndrome risk with concurrent serotonergic agents',
            'Taper dose when discontinuing to avoid discontinuation syndrome'
        ],
        alternatives: ['Escitalopram', 'Fluoxetine', 'Venlafaxine']
    },
    {
        id: 'omeprazole',
        name: 'Omeprazole',
        class: 'Proton Pump Inhibitor (PPI)',
        commonUses: ['GERD', 'Peptic ulcer disease', 'H. pylori eradication', 'Zollinger-Ellison syndrome'],
        allergies: [],
        contraindications: ['hypersensitivity to PPIs'],
        interactions: {
            clopidogrel: 'medium',
            methotrexate: 'medium',
            warfarin: 'low'
        },
        precautions: [
            'Long-term use associated with hypomagnesemia and vitamin B12 deficiency',
            'May reduce clopidogrel effectiveness (CYP2C19 inhibition)',
            'Reassess need periodically — avoid unnecessary long-term use'
        ],
        alternatives: ['Pantoprazole', 'Lansoprazole', 'Esomeprazole']
    }
];

const CONDITION_OPTIONS = [
    'Hypertension',
    'Diabetes',
    'Chronic kidney disease',
    'Liver disease',
    'Asthma',
    'Bleeding disorder',
    'Peptic ulcer disease',
    'Pregnancy',
    'Heart failure',
    'Atrial fibrillation',
    'Osteoporosis',
    'Depression'
];

const ALLERGY_OPTIONS = [
    'Penicillin',
    'NSAIDs',
    'Sulfa drugs',
    'Cephalosporins',
    'Latex',
    'Eggs',
    'Peanuts',
    'Contrast dye'
];

// Chart Instance
let concentrationChart = null;

// Autocomplete debounce timer
let searchDebounceTimer = null;

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    initializePrescriptionControls();
    initializeChart();
    updateAllOutputs();
    checkServerStatus();
});

function initializeEventListeners() {
    // Sliders
    document.getElementById('molecularSize').addEventListener('input', handleSliderChange);
    document.getElementById('solubility').addEventListener('input', handleSliderChange);
    document.getElementById('toxicity').addEventListener('input', handleSliderChange);
    document.getElementById('patientAge').addEventListener('input', handleSliderChange);
    document.getElementById('patientWeight').addEventListener('input', handleWeightChange);
    document.getElementById('targetOrgan').addEventListener('change', handleOrganChange);

    // Condition / medication multi-selects (top panel)
    document.getElementById('conditionSelect').addEventListener('change', handleConditionChange);
    document.getElementById('medicationSelect').addEventListener('change', handleMedicationChange);

    // Patient profile
    document.getElementById('patientName').addEventListener('input', handlePatientName);
    document.getElementById('patientConditions').addEventListener('change', handleConditionsChange);
    document.getElementById('patientAllergies').addEventListener('change', handleAllergiesChange);
    document.getElementById('drugSelector').addEventListener('change', handleDrugSelection);

    // Buttons
    document.getElementById('simulateBtn').addEventListener('click', runSimulation);
    document.getElementById('resetBtn').addEventListener('click', resetParameters);
    document.getElementById('autoGenerateBtn').addEventListener('click', autoGenerateParameters);
    document.getElementById('addMedicationBtn').addEventListener('click', addMedicationToProfile);
    document.getElementById('evaluateBtn').addEventListener('click', () => evaluatePrescriptionSafety(true));
    document.getElementById('reportBtn').addEventListener('click', generateReport);

    // Real-time safety evaluation on profile changes
    document.getElementById('patientWeight').addEventListener('input', () => evaluatePrescriptionSafety(false));
    document.getElementById('patientConditions').addEventListener('change', () => evaluatePrescriptionSafety(false));
    document.getElementById('patientAllergies').addEventListener('change', () => evaluatePrescriptionSafety(false));
    document.getElementById('drugSelector').addEventListener('change', () => evaluatePrescriptionSafety(false));
    document.getElementById('patientAge').addEventListener('input', () => evaluatePrescriptionSafety(false));

    // Real-time risk updates
    document.getElementById('molecularSize').addEventListener('input', updateAllOutputs);
    document.getElementById('solubility').addEventListener('input', updateAllOutputs);
    document.getElementById('toxicity').addEventListener('input', updateAllOutputs);
    document.getElementById('patientAge').addEventListener('input', updateAllOutputs);

    // FDA Drug Autocomplete
    document.getElementById('fdaDrugSearch').addEventListener('input', handleFdaSearchInput);
    document.getElementById('fdaDrugSearch').addEventListener('keydown', handleAutocompleteKeydown);

    // Close autocomplete on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-wrapper')) {
            closeDrugAutocomplete();
        }
    });

    // Report modal
    document.getElementById('modalClose').addEventListener('click', closeReportModal);
    document.getElementById('closeReportBtn').addEventListener('click', closeReportModal);
    document.getElementById('printReportBtn').addEventListener('click', printReport);
    document.getElementById('reportModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('reportModal')) closeReportModal();
    });
}

// ========================================
// SERVER STATUS CHECK
// ========================================

async function checkServerStatus() {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');

    try {
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
        const data = await res.json();

        if (data.claudeConfigured) {
            dot.className = 'status-dot connected';
            text.textContent = 'Claude AI Connected';
            state.claudeAvailable = true;
            document.getElementById('aiSourceBadge').textContent = 'Claude AI';
            document.getElementById('aiSourceBadge').classList.add('active');
        } else {
            dot.className = 'status-dot partial';
            text.textContent = 'Server up · Claude not configured';
            state.claudeAvailable = false;
        }
    } catch {
        dot.className = 'status-dot disconnected';
        text.textContent = 'Offline mode · Template analysis';
        state.claudeAvailable = false;
    }
}

// ========================================
// OPENFDA INTEGRATION
// ========================================

let autocompleteResults = [];
let activeAutocompleteIndex = -1;

function handleFdaSearchInput(e) {
    const query = e.target.value.trim();
    clearTimeout(searchDebounceTimer);

    if (query.length < 2) {
        closeDrugAutocomplete();
        return;
    }

    document.getElementById('searchSpinner').style.display = 'flex';

    searchDebounceTimer = setTimeout(async () => {
        const results = await searchDrugsFromFDA(query);
        document.getElementById('searchSpinner').style.display = 'none';
        renderDrugAutocomplete(results);
    }, 350);
}

async function searchDrugsFromFDA(query) {
    try {
        const encoded = encodeURIComponent(query);
        // Search by brand name first, fallback to generic name
        const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encoded}"+openfda.generic_name:"${encoded}"&limit=8`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });

        if (!res.ok) {
            // Try a broader search
            const fallbackUrl = `https://api.fda.gov/drug/label.json?search=(openfda.brand_name:${encoded}+openfda.generic_name:${encoded})&limit=8`;
            const fallbackRes = await fetch(fallbackUrl, { signal: AbortSignal.timeout(5000) });
            if (!fallbackRes.ok) return [];
            const fallbackData = await fallbackRes.json();
            return parseFDAResults(fallbackData.results || []);
        }

        const data = await res.json();
        return parseFDAResults(data.results || []);
    } catch (err) {
        console.warn('OpenFDA search error:', err.message);
        return [];
    }
}

function parseFDAResults(results) {
    const seen = new Set();
    return results
        .map(r => {
            const brandName = r.openfda?.brand_name?.[0] || '';
            const genericName = r.openfda?.generic_name?.[0] || '';
            const name = brandName || genericName;
            if (!name || seen.has(name.toLowerCase())) return null;
            seen.add(name.toLowerCase());

            return {
                brandName,
                genericName,
                manufacturer: r.openfda?.manufacturer_name?.[0] || 'Unknown',
                drugClass: r.openfda?.pharm_class_epc?.[0] || '',
                drugInteractions: truncate(r.drug_interactions?.[0] || '', 600),
                adverseReactions: truncate(r.adverse_reactions?.[0] || '', 500),
                contraindications: truncate(r.contraindications?.[0] || '', 500),
                warnings: truncate(r.warnings?.[0] || '', 400),
                dosageAdmin: truncate(r.dosage_and_administration?.[0] || '', 300),
                indications: truncate(r.indications_and_usage?.[0] || '', 300)
            };
        })
        .filter(Boolean)
        .slice(0, 6);
}

function truncate(text, maxLen) {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
}

function renderDrugAutocomplete(results) {
    const list = document.getElementById('fdaAutocomplete');
    autocompleteResults = results;
    activeAutocompleteIndex = -1;

    if (results.length === 0) {
        list.innerHTML = '<div class="autocomplete-item no-results">No results found in FDA database</div>';
        list.style.display = 'block';
        return;
    }

    list.innerHTML = results.map((drug, i) => `
        <div class="autocomplete-item" data-index="${i}" onclick="selectFDADrug(${i})">
            <div class="drug-brand">${drug.brandName || drug.genericName}</div>
            <div class="drug-generic">${drug.genericName && drug.brandName ? drug.genericName : drug.manufacturer}</div>
            ${drug.drugClass ? `<div class="drug-class">${drug.drugClass}</div>` : ''}
        </div>
    `).join('');

    list.style.display = 'block';
}

function handleAutocompleteKeydown(e) {
    const list = document.getElementById('fdaAutocomplete');
    const items = list.querySelectorAll('.autocomplete-item:not(.no-results)');

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeAutocompleteIndex = Math.min(activeAutocompleteIndex + 1, items.length - 1);
        updateAutocompleteHighlight(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeAutocompleteIndex = Math.max(activeAutocompleteIndex - 1, -1);
        updateAutocompleteHighlight(items);
    } else if (e.key === 'Enter' && activeAutocompleteIndex >= 0) {
        e.preventDefault();
        selectFDADrug(activeAutocompleteIndex);
    } else if (e.key === 'Escape') {
        closeDrugAutocomplete();
    }
}

function updateAutocompleteHighlight(items) {
    items.forEach((item, i) => {
        item.classList.toggle('active', i === activeAutocompleteIndex);
    });
}

function selectFDADrug(index) {
    const drug = autocompleteResults[index];
    if (!drug) return;

    state.fdaSelectedDrug = drug;
    document.getElementById('fdaDrugSearch').value = drug.brandName || drug.genericName;
    closeDrugAutocomplete();
    renderFDADrugCard(drug);
    showToast(`Loaded FDA data for ${drug.brandName || drug.genericName}`, 'success');
}

function closeDrugAutocomplete() {
    const list = document.getElementById('fdaAutocomplete');
    list.style.display = 'none';
    list.innerHTML = '';
    autocompleteResults = [];
    activeAutocompleteIndex = -1;
    document.getElementById('searchSpinner').style.display = 'none';
}

function renderFDADrugCard(drug) {
    const card = document.getElementById('fdaDrugInfoCard');
    const titleEl = document.getElementById('fdaDrugName');
    const detailsEl = document.getElementById('fdaDrugDetails');

    titleEl.textContent = drug.brandName || drug.genericName;

    const sections = [];

    if (drug.genericName && drug.brandName) {
        sections.push(`<div class="fda-field"><strong>Generic Name:</strong> ${drug.genericName}</div>`);
    }
    if (drug.manufacturer && drug.manufacturer !== 'Unknown') {
        sections.push(`<div class="fda-field"><strong>Manufacturer:</strong> ${drug.manufacturer}</div>`);
    }
    if (drug.drugClass) {
        sections.push(`<div class="fda-field"><strong>Drug Class:</strong> ${drug.drugClass}</div>`);
    }
    if (drug.indications) {
        sections.push(`<div class="fda-field"><strong>Indications:</strong> ${drug.indications}</div>`);
    }
    if (drug.warnings) {
        sections.push(`<div class="fda-field fda-warning"><strong>⚠ Warnings:</strong> ${drug.warnings}</div>`);
    }
    if (drug.contraindications) {
        sections.push(`<div class="fda-field fda-danger"><strong>✕ Contraindications:</strong> ${drug.contraindications}</div>`);
    }
    if (drug.adverseReactions) {
        sections.push(`<div class="fda-field"><strong>Adverse Reactions:</strong> ${drug.adverseReactions}</div>`);
    }
    if (drug.drugInteractions) {
        sections.push(`<div class="fda-field fda-interaction"><strong>Drug Interactions:</strong> ${drug.drugInteractions}</div>`);
    }
    if (drug.dosageAdmin) {
        sections.push(`<div class="fda-field"><strong>Dosage:</strong> ${drug.dosageAdmin}</div>`);
    }

    detailsEl.innerHTML = sections.length ? sections.join('') : '<div class="fda-field">Limited data available.</div>';
    card.style.display = 'block';
}

// ========================================
// CLAUDE AI INTEGRATION
// ========================================

async function callClaudeAPI(prompt) {
    if (!state.claudeAvailable) return null;

    try {
        const res = await fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!res.ok) {
            const err = await res.json();
            console.warn('Claude API error:', err.error);
            return null;
        }

        const data = await res.json();
        return data.analysis;
    } catch (err) {
        console.warn('Claude API unavailable:', err.message);
        return null;
    }
}

function buildClaudePrompt() {
    const absorption = calculateAbsorption(state.molecularSize, state.solubility);
    const halfLife = calculateHalfLife(state.molecularSize, state.toxicity, state.patientAge, state.targetOrgan);
    const bioavailability = Math.round((state.solubility / 100) * (1 - state.toxicity / 100) * 100);

    const currentMedNames = state.currentMeds
        .map(id => DRUG_DATABASE.find(d => d.id === id)?.name)
        .filter(Boolean)
        .join(', ');

    const fdaInfo = state.fdaSelectedDrug
        ? `\nFDA Data for ${state.fdaSelectedDrug.brandName || state.fdaSelectedDrug.genericName}:
- Indications: ${state.fdaSelectedDrug.indications || 'N/A'}
- Key Warnings: ${state.fdaSelectedDrug.warnings || 'N/A'}
- Adverse Reactions: ${state.fdaSelectedDrug.adverseReactions || 'N/A'}
- Drug Interactions: ${state.fdaSelectedDrug.drugInteractions || 'N/A'}`
        : '';

    return `Analyze this drug profile from a clinical pharmacology perspective:

**Drug Parameters:**
- Molecular Weight: ${state.molecularSize} Da
- Aqueous Solubility: ${state.solubility}%
- Toxicity Index: ${state.toxicity}%
- Target Organ: ${state.targetOrgan}
- Estimated Half-Life: ${halfLife.toFixed(1)} hours
- Peak Time: ${absorption.time.toFixed(1)} hours
- Bioavailability: ${bioavailability}%

**Patient Profile:**
- Age: ${state.patientAge} years
- Weight: ${state.patientWeight} kg
- Conditions: ${state.conditions.join(', ') || 'None reported'}
- Allergies: ${state.allergies.join(', ') || 'None reported'}
- Active Medications: ${currentMedNames || 'None'}
${fdaInfo}

Provide a clinical analysis covering:
1. **Pharmacokinetic Behavior** — absorption, distribution, and elimination profile
2. **Clinical Risk Assessment** — key safety concerns and contraindications
3. **Drug Interactions** — potential interactions with active medications
4. **Optimization Recommendations** — suggestions to improve therapeutic index
5. **Dosing Guidance** — recommended dosing frequency and schedule

Keep responses evidence-based, specific, and concise (under 600 words total).`;
}

function formatClaudeResponse(text) {
    // Convert markdown bold to HTML
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^(\d+)\.\s+\*\*(.+?)\*\*\s*—\s*/gm, '<br><strong>$1. $2</strong> — ')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
}

// ========================================
// SLIDER & INPUT HANDLERS
// ========================================

function handleSliderChange(e) {
    const id = e.target.id;
    const value = parseInt(e.target.value);

    if (id === 'molecularSize') state.molecularSize = value;
    else if (id === 'solubility') state.solubility = value;
    else if (id === 'toxicity') state.toxicity = value;
    else if (id === 'patientAge') state.patientAge = value;

    document.getElementById(`${id}Value`).textContent = value;
}

function handleOrganChange(e) {
    state.targetOrgan = e.target.value;
    updateInteractionAnalysis();
}

function handleConditionChange(e) {
    state.existingConditions = Array.from(e.target.selectedOptions).map(opt => opt.value);
    updateConditionTags();
    updateInteractionAnalysis();
}

function handleMedicationChange(e) {
    state.currentMedications = Array.from(e.target.selectedOptions).map(opt => opt.value);
    updateMedicationTags();
    updateInteractionAnalysis();
}

function handlePatientName(e) {
    state.patientName = e.target.value;
}

function handleWeightChange(e) {
    const value = parseInt(e.target.value, 10);
    state.patientWeight = value;
    document.getElementById('patientWeightValue').textContent = value;
}

function handleConditionsChange(e) {
    state.conditions = Array.from(e.target.selectedOptions).map(opt => opt.value);
}

function handleAllergiesChange(e) {
    state.allergies = Array.from(e.target.selectedOptions).map(opt => opt.value);
}

function handleDrugSelection(e) {
    state.selectedDrugId = e.target.value || null;
}

// ========================================
// CONDITION & MEDICATION TAGS
// ========================================

const conditionNames = {
    'diabetes': 'Diabetes', 'hypertension': 'Hypertension', 'heart-disease': 'Heart Disease',
    'liver-disease': 'Liver Disease', 'kidney-disease': 'Kidney Disease', 'asthma': 'Asthma',
    'depression': 'Depression', 'anxiety': 'Anxiety', 'arthritis': 'Arthritis',
    'migraine': 'Migraine', 'epilepsy': 'Epilepsy', 'thyroid': 'Thyroid Disorder', 'obesity': 'Obesity'
};

const medicationNames = {
    'aspirin': 'Aspirin', 'ibuprofen': 'Ibuprofen', 'acetaminophen': 'Acetaminophen',
    'warfarin': 'Warfarin', 'lisinopril': 'Lisinopril', 'metformin': 'Metformin',
    'atorvastatin': 'Atorvastatin', 'omeprazole': 'Omeprazole', 'albuterol': 'Albuterol',
    'sertraline': 'Sertraline', 'amlodipine': 'Amlodipine', 'furosemide': 'Furosemide',
    'prednisone': 'Prednisone', 'levothyroxine': 'Levothyroxine', 'gabapentin': 'Gabapentin'
};

function updateConditionTags() {
    const container = document.getElementById('conditionTags');
    if (state.existingConditions.length === 0) {
        container.innerHTML = '<span class="tag-placeholder">Select conditions...</span>';
        return;
    }
    container.innerHTML = state.existingConditions.map(c =>
        `<span class="tag">${conditionNames[c] || c} <span class="tag-remove" onclick="removeCondition('${c}')">×</span></span>`
    ).join('');
}

function updateMedicationTags() {
    const container = document.getElementById('medicationTags');
    if (state.currentMedications.length === 0) {
        container.innerHTML = '<span class="tag-placeholder">Select medications...</span>';
        return;
    }
    container.innerHTML = state.currentMedications.map(m =>
        `<span class="tag">${medicationNames[m] || m} <span class="tag-remove" onclick="removeMedication('${m}')">×</span></span>`
    ).join('');
}

function removeCondition(condition) {
    state.existingConditions = state.existingConditions.filter(c => c !== condition);
    const opt = document.getElementById('conditionSelect').querySelector(`option[value="${condition}"]`);
    if (opt) opt.selected = false;
    updateConditionTags();
    updateInteractionAnalysis();
}

function removeMedication(medication) {
    state.currentMedications = state.currentMedications.filter(m => m !== medication);
    const opt = document.getElementById('medicationSelect').querySelector(`option[value="${medication}"]`);
    if (opt) opt.selected = false;
    updateMedicationTags();
    updateInteractionAnalysis();
}

// ========================================
// CHART INITIALIZATION
// ========================================

function initializeChart() {
    const ctx = document.getElementById('concentrationChart').getContext('2d');

    if (concentrationChart) {
        concentrationChart.destroy();
    }

    concentrationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: generateTimeLabels(24),
            datasets: [
                {
                    label: 'Drug Concentration (ng/mL)',
                    data: Array(25).fill(0),
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#00d4ff',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointHoverRadius: 6
                },
                {
                    label: 'Therapeutic Window',
                    data: Array(25).fill(null),
                    borderColor: 'rgba(0, 255, 136, 0.5)',
                    backgroundColor: 'rgba(0, 255, 136, 0.06)',
                    borderWidth: 1.5,
                    borderDash: [6, 4],
                    fill: false,
                    pointRadius: 0,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    labels: {
                        color: '#b0b3c0',
                        font: { size: 11 },
                        usePointStyle: true,
                        padding: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 39, 0.95)',
                    titleColor: '#00d4ff',
                    bodyColor: '#b0b3c0',
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: (ctx) => {
                            if (ctx.datasetIndex === 0) return `Concentration: ${ctx.parsed.y?.toFixed(1)} ng/mL`;
                            if (ctx.datasetIndex === 1 && ctx.parsed.y) return `Therapeutic: ${ctx.parsed.y.toFixed(1)} ng/mL`;
                            return null;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#b0b3c0', font: { size: 11 } },
                    grid: { color: 'rgba(45, 55, 72, 0.4)' },
                    title: { display: true, text: 'Concentration (ng/mL)', color: '#00d4ff', font: { size: 11 } }
                },
                x: {
                    ticks: { color: '#b0b3c0', font: { size: 11 } },
                    grid: { color: 'rgba(45, 55, 72, 0.25)' },
                    title: { display: true, text: 'Time (hours)', color: '#00d4ff', font: { size: 11 } }
                }
            }
        }
    });
}

function generateTimeLabels(hours) {
    return Array.from({ length: hours + 1 }, (_, i) => `${i}h`);
}

// ========================================
// PRESCRIPTION CONTROLS
// ========================================

function initializePrescriptionControls() {
    const conditionSelect = document.getElementById('patientConditions');
    CONDITION_OPTIONS.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        conditionSelect.appendChild(opt);
    });

    const allergySelect = document.getElementById('patientAllergies');
    ALLERGY_OPTIONS.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        allergySelect.appendChild(opt);
    });

    const drugSelector = document.getElementById('drugSelector');
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select from local database...';
    placeholder.disabled = true;
    placeholder.selected = true;
    drugSelector.appendChild(placeholder);

    DRUG_DATABASE.forEach(drug => {
        const opt = document.createElement('option');
        opt.value = drug.id;
        opt.textContent = `${drug.name} (${drug.class})`;
        drugSelector.appendChild(opt);
    });

    loadHistory();
    renderCurrentMeds();
    evaluatePrescriptionSafety();
}

function getDrugById(id) {
    return DRUG_DATABASE.find(d => d.id === id) || null;
}

function addMedicationToProfile() {
    const drugId = state.selectedDrugId;
    if (!drugId) {
        showToast('Please select a medication first.', 'warning');
        return;
    }
    if (state.currentMeds.includes(drugId)) {
        showToast(`${getDrugById(drugId)?.name} is already in active medications.`, 'info');
        return;
    }
    state.currentMeds.push(drugId);
    renderCurrentMeds();
    evaluatePrescriptionSafety(false);
    updateInteractionAnalysis();
    showToast(`${getDrugById(drugId)?.name} added to active medications.`, 'success');
}

function removeMedicationFromProfile(drugId) {
    state.currentMeds = state.currentMeds.filter(id => id !== drugId);
    renderCurrentMeds();
    evaluatePrescriptionSafety(false);
    updateInteractionAnalysis();
}

function renderCurrentMeds() {
    const container = document.getElementById('currentMedsList');
    container.innerHTML = '';

    if (state.currentMeds.length === 0) {
        container.innerHTML = '<span style="color: var(--text-muted); font-size: 0.88rem;">No active medications selected.</span>';
        return;
    }

    state.currentMeds.forEach(drugId => {
        const drug = getDrugById(drugId);
        if (!drug) return;
        const pill = document.createElement('div');
        pill.className = 'pill';
        pill.innerHTML = `<span>${drug.name}</span><button type="button" aria-label="Remove ${drug.name}" title="Remove">&times;</button>`;
        pill.querySelector('button').addEventListener('click', () => removeMedicationFromProfile(drugId));
        container.appendChild(pill);
    });
}

// ========================================
// PRESCRIPTION SAFETY EVALUATION
// ========================================

function evaluatePrescriptionSafety(saveHistory = false) {
    const selectedDrug = getDrugById(state.selectedDrugId);
    const currentDrugList = state.currentMeds.map(getDrugById).filter(Boolean);
    const riskEntries = [];
    let overallSeverity = 'low';

    if (selectedDrug) {
        // Allergy check
        const allergyMatch = state.allergies.some(allergy =>
            selectedDrug.allergies?.some(da => da.toLowerCase() === allergy.toLowerCase())
        );
        if (allergyMatch) {
            overallSeverity = 'high';
            riskEntries.push({
                severity: 'high',
                message: `Allergy alert: Patient has ${state.allergies.join(', ')} allergy. ${selectedDrug.name} is contraindicated.`,
                why: `Administration may trigger severe hypersensitivity or anaphylaxis.`
            });
        }

        // Condition contraindication check
        state.conditions.forEach(condition => {
            const isContraindicated = selectedDrug.contraindications?.some(c =>
                c.toLowerCase().replace(/-/g, ' ') === condition.toLowerCase().replace(/-/g, ' ') ||
                condition.toLowerCase().includes(c.toLowerCase())
            );
            if (isContraindicated) {
                overallSeverity = 'high';
                riskEntries.push({
                    severity: 'high',
                    message: `${selectedDrug.name} is contraindicated with ${condition}.`,
                    why: `Risk of serious adverse events or disease exacerbation.`
                });
            }
        });

        // Drug-drug interaction check
        currentDrugList.forEach(otherDrug => {
            const severity = getInteractionSeverity(selectedDrug, otherDrug);
            if (severity) {
                if (severity === 'high') overallSeverity = 'high';
                else if (severity === 'medium' && overallSeverity !== 'high') overallSeverity = 'medium';
                riskEntries.push({
                    severity,
                    message: `${selectedDrug.name} ↔ ${otherDrug.name}: ${severity.toUpperCase()} interaction risk.`,
                    why: 'Concurrent use may alter therapeutic levels or increase adverse effect risk.'
                });
            }
        });
    }

    // Weight guidance
    if (state.patientWeight < 50) {
        if (overallSeverity !== 'high') overallSeverity = 'medium';
        riskEntries.push({
            severity: 'medium',
            message: 'Low body weight (<50 kg): dose adjustment likely needed.',
            why: 'Reduced body mass increases drug concentration per unit volume.'
        });
    }

    // Age guidance
    if (state.patientAge > 75) {
        if (overallSeverity !== 'high') overallSeverity = 'medium';
        riskEntries.push({
            severity: 'medium',
            message: 'Advanced age (>75 yrs): reduced renal/hepatic clearance expected.',
            why: 'Physiologic decline in metabolism requires conservative dosing.'
        });
    }

    // Build output HTML
    const badge = `<span class="risk-badge ${overallSeverity}">${overallSeverity.toUpperCase()} RISK</span>`;
    const lines = [];

    if (!selectedDrug) {
        lines.push('<p class="placeholder-text">Select a medication above to evaluate safety.</p>');
    } else {
        lines.push(`<p><strong>Medication:</strong> ${selectedDrug.name} (${selectedDrug.class})</p>`);
        if (selectedDrug.commonUses?.length) {
            lines.push(`<p><strong>Uses:</strong> ${selectedDrug.commonUses.join(' · ')}</p>`);
        }
        lines.push(`<p><strong>Overall Risk:</strong> ${badge}</p>`);

        if (riskEntries.length === 0) {
            lines.push('<p style="color: var(--success-color);">✓ No significant interactions or contraindications detected. Monitor clinically.</p>');
        } else {
            lines.push('<ul class="suggestion-list">');
            riskEntries.slice(0, 5).forEach(entry => {
                const color = entry.severity === 'high' ? 'var(--danger-color)' : entry.severity === 'medium' ? 'var(--warning-color)' : 'inherit';
                lines.push(`<li style="color:${color};"><strong>${entry.message}</strong><br><em style="color:var(--text-muted);">${entry.why}</em></li>`);
            });
            lines.push('</ul>');
        }

        if (selectedDrug.alternatives?.length) {
            lines.push(`<p><strong>Alternatives:</strong> ${selectedDrug.alternatives.join(', ')}</p>`);
        }
        if (selectedDrug.precautions?.length) {
            lines.push(`<p><strong>Precautions:</strong></p><ul class="suggestion-list">${selectedDrug.precautions.slice(0, 3).map(p => `<li>${p}</li>`).join('')}</ul>`);
        }
    }

    document.getElementById('prescriptionSafety').innerHTML = lines.join('');

    // Visual warning on selector
    const selector = document.getElementById('drugSelector');
    selector.classList.toggle('input-warning', overallSeverity === 'high');

    // Save to history
    if (saveHistory && state.patientName.trim() && selectedDrug) {
        saveHistoryRecord({
            timestamp: new Date().toISOString(),
            patientName: state.patientName.trim(),
            age: state.patientAge,
            weight: state.patientWeight,
            conditions: state.conditions.slice(),
            allergies: state.allergies.slice(),
            medication: selectedDrug.name,
            risk: overallSeverity,
            notes: riskEntries.map(r => r.message)
        });
        showToast(`Safety check saved for ${state.patientName.trim()}`, 'success');
    }
}

function getInteractionSeverity(drugA, drugB) {
    const sev = drugA.interactions?.[drugB.id] || drugB.interactions?.[drugA.id];
    if (!sev) return null;
    if (['high', 'medium', 'low'].includes(sev)) return sev;
    const s = sev.toLowerCase();
    if (s.includes('high')) return 'high';
    if (s.includes('med') || s.includes('mod')) return 'medium';
    return 'low';
}

// ========================================
// DRUG INTERACTION ANALYSIS (Active Meds)
// ========================================

function updateInteractionAnalysis() {
    const meds = state.currentMeds.map(getDrugById).filter(Boolean);

    if (meds.length < 2) {
        state.interactionRiskScore = 0;
        state.interactionRiskLevel = 'low';
        document.getElementById('riskScoreValue').textContent = 'None';
        document.getElementById('riskMeterFill').style.width = '0%';
        document.getElementById('riskMeterFill').className = 'risk-meter-fill';
        document.getElementById('interactionRiskScore').className = 'interaction-risk-score';
        document.getElementById('interactionAnalysis').innerHTML =
            `<p class="placeholder-text">${meds.length === 0 ? 'Add medications to analyze interactions.' : 'Add at least 2 medications to check interactions.'}</p>`;
        return;
    }

    let maxRisk = 0;
    let riskLevel = 'low';
    const interactions = [];

    for (let i = 0; i < meds.length; i++) {
        for (let j = i + 1; j < meds.length; j++) {
            const sev = getInteractionSeverity(meds[i], meds[j]);
            if (sev) {
                interactions.push({ drug1: meds[i].name, drug2: meds[j].name, severity: sev });
                if (sev === 'high') { maxRisk = Math.max(maxRisk, 95); riskLevel = 'high'; }
                else if (sev === 'medium') { maxRisk = Math.max(maxRisk, 60); if (riskLevel !== 'high') riskLevel = 'medium'; }
                else { maxRisk = Math.max(maxRisk, 30); }
            }
        }
    }

    state.interactionRiskScore = maxRisk;
    state.interactionRiskLevel = riskLevel;

    const fill = document.getElementById('riskMeterFill');
    fill.style.width = maxRisk + '%';
    fill.className = `risk-meter-fill ${riskLevel}`;

    const scoreEl = document.getElementById('riskScoreValue');
    scoreEl.textContent = riskLevel.toUpperCase();
    scoreEl.style.color = riskLevel === 'high' ? 'var(--danger-color)' : riskLevel === 'medium' ? 'var(--warning-color)' : 'var(--success-color)';

    const scoreContainer = document.getElementById('interactionRiskScore');
    scoreContainer.className = `interaction-risk-score ${riskLevel}-risk`;

    if (interactions.length === 0) {
        document.getElementById('interactionAnalysis').innerHTML =
            '<p style="color:var(--success-color);">✓ No known interactions detected between active medications.</p>';
    } else {
        const sevIcon = { high: '🔴', medium: '🟡', low: '🟢' };
        const html = `<ul class="suggestion-list">${interactions.map(ix =>
            `<li>${sevIcon[ix.severity]} <strong>${ix.drug1} + ${ix.drug2}</strong> — ${ix.severity.toUpperCase()} risk</li>`
        ).join('')}</ul>`;
        document.getElementById('interactionAnalysis').innerHTML = html;
    }
}

// ========================================
// HISTORY MANAGEMENT
// ========================================

function saveHistoryRecord(record) {
    state.history.unshift(record);
    if (state.history.length > 20) state.history = state.history.slice(0, 20);
    localStorage.setItem('drugSimulationHistory', JSON.stringify(state.history));
    renderHistoryLog();
}

function loadHistory() {
    try {
        const stored = localStorage.getItem('drugSimulationHistory');
        state.history = stored ? JSON.parse(stored) : [];
    } catch {
        state.history = [];
    }
    renderHistoryLog();
}

function renderHistoryLog() {
    const container = document.getElementById('historyLog');
    if (!container) return;

    if (!state.history.length) {
        container.innerHTML = '<p class="placeholder-text">No checks recorded yet. Run an interaction check to create a patient record.</p>';
        return;
    }

    const rows = state.history.slice(0, 8).map(r => {
        const date = new Date(r.timestamp);
        return `
            <div class="history-row">
                <div><strong>${r.patientName}</strong><br><span style="color:var(--text-muted);font-size:0.8rem;">${formatTimestamp(date)}</span></div>
                <div style="font-size:0.9rem;">${r.medication}</div>
                <div><span class="risk-badge ${r.risk}">${r.risk.toUpperCase()}</span></div>
            </div>`;
    }).join('');

    container.innerHTML = `
        <div class="history-header"><div>Patient</div><div>Medication</div><div>Risk</div></div>
        ${rows}`;
}

function formatTimestamp(date) {
    return date.toLocaleString(undefined, {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ========================================
// SIMULATION ENGINE
// ========================================

async function runSimulation() {
    const btn = document.getElementById('simulateBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Simulating...';

    document.getElementById('chartLoading').style.display = 'flex';

    await new Promise(r => setTimeout(r, 400)); // brief visual delay

    state.isSimulating = true;

    const concentrationData = generateConcentrationCurve(
        state.molecularSize, state.solubility, state.toxicity,
        state.patientAge, state.targetOrgan
    );
    state.simulationData = concentrationData;

    // Compute therapeutic window upper bound (70% of peak)
    const peak = Math.max(...concentrationData);
    const therapeuticMax = Array(concentrationData.length).fill(peak * 0.7);

    updateChart(concentrationData, therapeuticMax);
    updateAnalytics(concentrationData);

    document.getElementById('chartLoading').style.display = 'none';

    // Generate AI analysis
    if (state.claudeAvailable) {
        btn.innerHTML = '<span class="btn-icon">🤖</span> Generating AI Analysis...';
        await generateAIAnalysis();
    } else {
        generateAIAnalysis();
    }

    evaluatePrescriptionSafety(false);
    updateInteractionAnalysis();

    state.isSimulating = false;
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">▶</span> Run Simulation';

    showPKSummary(concentrationData);
    showToast('Simulation complete!', 'success');
}

function generateConcentrationCurve(molecularSize, solubility, toxicity, age, organ) {
    const concentrationData = [];
    const absorption = calculateAbsorption(molecularSize, solubility);
    const halfLife = calculateHalfLife(molecularSize, toxicity, age, organ);
    const peakTime = absorption.time;
    const peakConcentration = 100 - (toxicity * 0.5) + (solubility * 0.3);
    const eliminationConstant = Math.log(2) / halfLife;

    for (let t = 0; t <= 24; t++) {
        let concentration = 0;

        if (t < peakTime) {
            const absRate = 0.3 / peakTime;
            concentration = peakConcentration * (1 - Math.exp(-absRate * t));
        } else {
            concentration = peakConcentration * Math.exp(-eliminationConstant * (t - peakTime));
        }

        // Subtle realistic variation
        concentration += Math.sin(t * 0.4) * 1.5;
        concentration = Math.max(0, Math.min(concentration, 150));
        concentrationData.push(parseFloat(concentration.toFixed(2)));
    }

    return concentrationData;
}

function calculateAbsorption(molecularSize, solubility) {
    const baseAbsorption = 2 + (1000 - molecularSize) / 500;
    const adjustedAbsorption = baseAbsorption * (solubility / 50);
    return {
        rate: Math.min(0.8, adjustedAbsorption / 100),
        time: Math.max(1, Math.min(4, baseAbsorption - (solubility / 100)))
    };
}

function calculateHalfLife(molecularSize, toxicity, age, organ) {
    let halfLife = 4 + (molecularSize / 200);
    halfLife *= (1 - toxicity / 100);

    if (age > 65) halfLife *= 1.3;
    else if (age < 25) halfLife *= 0.9;

    const organFactors = {
        liver: 1.0, brain: 1.2, heart: 0.9,
        kidney: 0.8, lungs: 1.1, intestines: 0.7
    };
    halfLife *= (organFactors[organ] || 1.0);

    return Math.max(2, halfLife);
}

// ========================================
// CHART & ANALYTICS
// ========================================

function updateChart(data, therapMax) {
    if (!concentrationChart) return;
    concentrationChart.data.datasets[0].data = data;
    // Show therapeutic window midline
    concentrationChart.data.datasets[1].data = therapMax;
    concentrationChart.update('active');
}

function updateAnalytics(concentrationData) {
    const peak = Math.max(...concentrationData);
    document.getElementById('peakConcentration').textContent = peak.toFixed(1);

    const halfLifeVal = calculateHalfLife(state.molecularSize, state.toxicity, state.patientAge, state.targetOrgan);
    document.getElementById('halfLife').textContent = halfLifeVal.toFixed(1);

    const auc = concentrationData.reduce((a, b) => a + b, 0);
    const bioavailability = Math.round((auc / (100 * 24)) * 100);
    document.getElementById('bioavailability').textContent = bioavailability;

    const absorption = calculateAbsorption(state.molecularSize, state.solubility);
    document.getElementById('absorptionTime').textContent = absorption.time.toFixed(1);

    let effectiveness = Math.round(bioavailability * (state.solubility / 100) * (1 - state.toxicity / 100) * 100);
    effectiveness = Math.min(100, Math.max(0, effectiveness));
    document.getElementById('effectivenessBar').style.width = effectiveness + '%';
    document.getElementById('effectivenessValue').textContent = effectiveness + '%';

    updateRiskIndicator();
}

function updateRiskIndicator() {
    let riskScore = state.toxicity + (state.molecularSize / 50) - (state.solubility / 2) + ((85 - state.patientAge) / 5);

    let riskLevel, riskText;
    if (riskScore < 20) { riskLevel = 'low'; riskText = '🟢 Low Risk'; }
    else if (riskScore < 40) { riskLevel = 'medium'; riskText = '🟡 Medium Risk'; }
    else { riskLevel = 'high'; riskText = '🔴 High Risk'; }

    const indicator = document.getElementById('riskIndicator');
    indicator.className = 'risk-indicator ' + riskLevel;
    indicator.innerHTML = `<span class="risk-label">${riskText}</span>`;
}

function updateAllOutputs() {
    if (!state.isSimulating) {
        updateRiskIndicator();
    }
}

function showPKSummary(data) {
    const summary = document.getElementById('pkSummary');
    const grid = document.getElementById('pkGrid');
    const halfLife = calculateHalfLife(state.molecularSize, state.toxicity, state.patientAge, state.targetOrgan);
    const absorption = calculateAbsorption(state.molecularSize, state.solubility);
    const peak = Math.max(...data);
    const auc = data.reduce((a, b) => a + b, 0);

    const items = [
        { label: 'AUC₀₋₂₄', value: auc.toFixed(0), unit: 'ng·h/mL' },
        { label: 'T_max', value: absorption.time.toFixed(1), unit: 'h' },
        { label: 'C_max', value: peak.toFixed(1), unit: 'ng/mL' },
        { label: 't₁/₂', value: halfLife.toFixed(1), unit: 'h' },
        { label: 'Steady-state', value: (halfLife * 5 / 24).toFixed(1), unit: 'days' },
        { label: 'Vd (est.)', value: ((state.molecularSize / 10) + 30).toFixed(0), unit: 'L/kg' }
    ];

    grid.innerHTML = items.map(i => `
        <div class="pk-item">
            <span class="pk-label">${i.label}</span>
            <span class="pk-value">${i.value}</span>
            <span class="pk-unit">${i.unit}</span>
        </div>`).join('');

    summary.style.display = 'block';
}

// ========================================
// AI ANALYSIS ENGINE
// ========================================

async function generateAIAnalysis() {
    if (state.claudeAvailable) {
        await generateClaudeAnalysis();
    } else {
        generateTemplateAnalysis();
    }
}

async function generateClaudeAnalysis() {
    const prompt = buildClaudePrompt();

    // Show loading in all analysis sections
    const sections = ['aiPrediction', 'aiRisks', 'aiSuggestions', 'aiDosing'];
    sections.forEach(id => {
        document.getElementById(id).innerHTML = '<div class="ai-loading"><div class="spinner-small"></div> Generating AI analysis...</div>';
    });

    const analysis = await callClaudeAPI(prompt);

    if (analysis) {
        // Parse Claude's structured response into sections
        const formatted = formatClaudeResponse(analysis);
        document.getElementById('aiPrediction').innerHTML = `<p>${formatted}</p>`;

        // Generate remaining sections with template (Claude gave full analysis above)
        generateOptimizationSuggestions();
        generateDosingRecommendations();
        generateRiskAnalysis();
        generatePersonalizedRecommendations();

        document.getElementById('aiSourceBadge').textContent = 'Claude AI';
        document.getElementById('aiSourceBadge').className = 'ai-source-badge active';
    } else {
        // Fall back to template
        generateTemplateAnalysis();
    }
}

function generateTemplateAnalysis() {
    generateDrugBehaviorPrediction();
    generateRiskAnalysis();
    generateOptimizationSuggestions();
    generateDosingRecommendations();
    generateInteractionAnalysis();
    generatePersonalizedRecommendations();
    document.getElementById('aiSourceBadge').textContent = 'Template';
    document.getElementById('aiSourceBadge').className = 'ai-source-badge';
}

function generateDrugBehaviorPrediction() {
    const absorption = calculateAbsorption(state.molecularSize, state.solubility);
    const halfLife = calculateHalfLife(state.molecularSize, state.toxicity, state.patientAge, state.targetOrgan);

    const organDesc = {
        liver: 'hepatic system',
        brain: 'blood-brain barrier and CNS',
        heart: 'cardiac system',
        kidney: 'renal system',
        lungs: 'pulmonary system',
        intestines: 'gastrointestinal tract'
    };

    const fdaContext = state.fdaSelectedDrug
        ? `<p><strong>FDA Data Note:</strong> ${state.fdaSelectedDrug.brandName || state.fdaSelectedDrug.genericName} — ${state.fdaSelectedDrug.indications || 'Indications not available from FDA.'}</p>`
        : '';

    const html = `
        ${fdaContext}
        <p>Peak plasma concentration expected at <strong>${absorption.time.toFixed(1)}h</strong> post-administration.
        Estimated half-life: <strong>${halfLife.toFixed(1)}h</strong> → ${halfLife > 6 ? 'sustained' : 'shorter-duration'} action.</p>
        <p>Molecular weight of <strong>${state.molecularSize} Da</strong> ${state.molecularSize < 500 ? 'supports good oral bioavailability' : 'may limit oral absorption'}.
        Solubility at <strong>${state.solubility}%</strong>: ${state.solubility > 70 ? 'excellent dissolution' : state.solubility > 40 ? 'moderate dissolution' : 'poor aqueous dissolution — formulation may be required'}.</p>
        <p>Primary accumulation in the <strong>${organDesc[state.targetOrgan] || state.targetOrgan}</strong>.
        Dosing frequency: ${halfLife < 4 ? 'QID (~every 6h)' : halfLife < 8 ? 'BID (~every 12h)' : 'QD (once daily)'}.</p>`;

    document.getElementById('aiPrediction').innerHTML = html;
}

function generateRiskAnalysis() {
    const risks = [];

    if (state.toxicity > 30) risks.push('🔴 High toxicity — monitor hepatic and renal function closely');
    else if (state.toxicity > 20) risks.push('🟡 Moderate toxicity — routine LFT/renal monitoring recommended');

    if (state.molecularSize > 700) risks.push('🟡 Large molecular weight limits tissue penetration and renal clearance');
    if (state.solubility < 30) risks.push('🔴 Poor solubility — variable bioavailability expected; consider salt form or nanoformulation');
    if (state.patientAge > 65) risks.push('🟡 Elderly patient — reduced metabolism; start low and titrate slowly');
    if (state.targetOrgan === 'brain') risks.push('🟡 CNS target — monitor for neurological effects (drowsiness, coordination, cognition)');
    if (state.targetOrgan === 'liver') risks.push('🟡 Hepatic target — contraindicated in significant liver disease; baseline LFTs recommended');
    if (state.patientWeight < 55) risks.push('🟡 Low body weight — standard doses may result in supratherapeutic levels');

    // Add FDA warnings if available
    if (state.fdaSelectedDrug?.warnings) {
        risks.push(`📋 FDA Warning: ${state.fdaSelectedDrug.warnings.substring(0, 120)}...`);
    }

    const html = risks.length
        ? `<ul class="suggestion-list">${risks.map(r => `<li>${r}</li>`).join('')}</ul>`
        : '<p style="color:var(--success-color);">✓ Current parameters indicate a favorable safety profile with no major concerns.</p>';

    document.getElementById('aiRisks').innerHTML = html;
}

function generateOptimizationSuggestions() {
    const suggestions = [];

    if (state.molecularSize > 500) suggestions.push('Reduce molecular size (aim <500 Da) to improve oral bioavailability and BBB permeability (Rule of 5)');
    if (state.solubility < 50) suggestions.push('Increase solubility via salt formation, amorphous dispersion, or lipid formulation');
    if (state.toxicity > 20) suggestions.push('Reduce off-target binding through selective structural modification or prodrug strategy');
    if (state.molecularSize < 200) suggestions.push('Add structural complexity to improve target selectivity and reduce rapid renal clearance');
    if (state.solubility > 80) suggestions.push('✓ Excellent solubility profile — maintain current scaffold');
    if (state.toxicity < 10) suggestions.push('✓ Favorable safety window — focus on maximizing therapeutic potency');

    if (state.fdaSelectedDrug?.drugInteractions) {
        suggestions.push(`Consider drug interaction profile from FDA: review CYP450 metabolism pathway`);
    }

    const items = suggestions.slice(0, 5).map(s => `<li>${s}</li>`).join('');
    document.getElementById('aiSuggestions').innerHTML = `<ul class="suggestion-list">${items}</ul>`;
}

function generateDosingRecommendations() {
    const absorption = calculateAbsorption(state.molecularSize, state.solubility);
    const halfLife = calculateHalfLife(state.molecularSize, state.toxicity, state.patientAge, state.targetOrgan);
    const bioavailability = Math.round((state.solubility / 100) * (1 - state.toxicity / 100) * 100);

    let schedule, interval;
    if (halfLife < 4) { schedule = 'QID (every 6h)'; interval = '6 hours'; }
    else if (halfLife < 8) { schedule = 'BID (every 12h)'; interval = '12 hours'; }
    else { schedule = 'QD (once daily)'; interval = '24 hours'; }

    const baseDose = 100 - (state.toxicity * 0.5);
    const ageAdj = state.patientAge > 65 ? 0.75 : state.patientAge < 25 ? 1.1 : 1.0;
    const weightAdj = state.patientWeight / 70;
    const recommendedDose = Math.round(baseDose * ageAdj * Math.min(1.3, Math.max(0.7, weightAdj)));

    const fdaDosing = state.fdaSelectedDrug?.dosageAdmin
        ? `<p><strong>FDA-Sourced Dosing:</strong> ${state.fdaSelectedDrug.dosageAdmin}</p>`
        : '';

    const html = `
        ${fdaDosing}
        <p><strong>Calculated Schedule:</strong> ${schedule}</p>
        <p><strong>Dosage Interval:</strong> Every ${interval}</p>
        <p><strong>Estimated Dose:</strong> ${recommendedDose} mg${state.patientAge > 65 ? ' (25% reduction for age)' : ''}</p>
        <p><strong>Time to Peak:</strong> ${absorption.time.toFixed(1)}h — administer ${absorption.time < 2 ? 'on empty stomach' : 'with food'}</p>
        <p><strong>Bioavailability:</strong> ${bioavailability}% expected systemic exposure</p>
        <p><strong>Steady-State:</strong> ~${(halfLife * 5 / 24).toFixed(1)} days (${(halfLife * 5).toFixed(0)}h)</p>`;

    document.getElementById('aiDosing').innerHTML = html;
}

function generateInteractionAnalysis() {
    updateInteractionAnalysis();
}

function generatePersonalizedRecommendations() {
    const recs = [];

    if (state.patientAge > 65) {
        recs.push('Start at 50–75% of standard dose; titrate slowly based on tolerance and labs');
        recs.push('Increase monitoring frequency for adverse effects and drug accumulation');
    }
    if (state.patientWeight < 55) {
        recs.push('Weight-based dosing strongly advised — standard doses may be too high');
    }
    if (state.conditions.includes('Chronic kidney disease')) {
        recs.push('Renal dose adjustment required — calculate eGFR and apply CKD dosing guidelines');
    }
    if (state.conditions.includes('Liver disease')) {
        recs.push('Hepatic impairment — use Child-Pugh scoring to guide dose reduction');
    }
    if (state.targetOrgan === 'brain') {
        recs.push('Monitor for CNS effects: drowsiness, dizziness, coordination changes, and cognitive shifts');
    }
    if (state.currentMeds.length >= 3) {
        recs.push('Polypharmacy (≥3 drugs) — comprehensive pharmacist medication review recommended');
    }
    if (state.allergies.length > 0) {
        recs.push(`Document allergy profile (${state.allergies.join(', ')}) in patient chart before prescribing`);
    }

    // FDA adverse reaction context
    if (state.fdaSelectedDrug?.adverseReactions) {
        recs.push(`Monitor for FDA-documented reactions: ${state.fdaSelectedDrug.adverseReactions.substring(0, 100)}...`);
    }

    if (recs.length === 0) {
        recs.push('No special adjustments required based on current profile');
        recs.push('Follow standard dosing guidelines and routine monitoring parameters');
    }

    document.getElementById('personalizedRecommendations').innerHTML =
        `<ul class="suggestion-list">${recs.map(r => `<li>${r}</li>`).join('')}</ul>`;
}

// ========================================
// AUTO-GENERATE PARAMETERS
// ========================================

function autoGenerateParameters() {
    const desired = document.getElementById('desiredOutcome').value.toLowerCase().trim();
    if (!desired) {
        showToast('Enter a desired outcome first (e.g., "low side effect headache drug")', 'warning');
        return;
    }

    let mw = 350, sol = 60, tox = 15, organ = 'liver';

    const rules = [
        { match: 'headache|migraine', mw: -80, organ: 'brain' },
        { match: 'pain|analgesic', mw: -50 },
        { match: 'fever|antipyretic', sol: +15, organ: 'liver' },
        { match: 'infection|antibiotic', sol: +20, tox: +5 },
        { match: 'inflammation|anti-inflammatory', tox: +10, sol: +10 },
        { match: 'cancer|oncology|chemotherapy', tox: +20, mw: +150 },
        { match: 'low side effect|gentle|minimal', tox: -15, sol: +10 },
        { match: 'high potency|strong|potent', sol: +10, mw: -50 },
        { match: 'rapid|fast|quick', sol: +25, tox: -5, mw: -100 },
        { match: 'sustained|slow release|long acting', mw: +200, sol: -10 },
        { match: 'heart|cardiac|cardio', organ: 'heart', mw: -50 },
        { match: 'kidney|renal', organ: 'kidney', mw: -80 },
        { match: 'lung|pulmonary|respiratory', organ: 'lungs', sol: +10 },
        { match: 'gut|bowel|intestin|gastrointestinal', organ: 'intestines', sol: +15 },
        { match: 'brain|neuro|cns|mental', organ: 'brain', mw: -100 },
        { match: 'liver|hepat', organ: 'liver' },
        { match: 'elderly|older|geriatric', tox: -10, sol: +5 },
        { match: 'child|pediatric', mw: -100, tox: -10 }
    ];

    rules.forEach(rule => {
        const rx = new RegExp(rule.match, 'i');
        if (rx.test(desired)) {
            if (rule.mw) mw += rule.mw;
            if (rule.sol) sol += rule.sol;
            if (rule.tox) tox += rule.tox;
            if (rule.organ) organ = rule.organ;
        }
    });

    mw = Math.max(100, Math.min(1000, mw));
    sol = Math.max(10, Math.min(100, sol));
    tox = Math.max(5, Math.min(50, tox));

    // Apply to UI
    ['molecularSize', 'solubility', 'toxicity'].forEach(id => {
        const val = id === 'molecularSize' ? mw : id === 'solubility' ? sol : tox;
        document.getElementById(id).value = val;
        document.getElementById(`${id}Value`).textContent = val;
    });
    document.getElementById('targetOrgan').value = organ;

    state.molecularSize = mw;
    state.solubility = sol;
    state.toxicity = tox;
    state.targetOrgan = organ;

    updateAllOutputs();
    showToast(`Parameters generated for "${desired}". Click Run Simulation!`, 'success');
}

// ========================================
// REPORT GENERATION
// ========================================

function generateReport() {
    const modal = document.getElementById('reportModal');
    const content = document.getElementById('reportContent');

    const now = new Date();
    const absorption = calculateAbsorption(state.molecularSize, state.solubility);
    const halfLife = calculateHalfLife(state.molecularSize, state.toxicity, state.patientAge, state.targetOrgan);
    const bioavailability = Math.round((state.solubility / 100) * (1 - state.toxicity / 100) * 100);
    const currentMedNames = state.currentMeds.map(id => getDrugById(id)?.name).filter(Boolean).join(', ');

    const riskScore = state.toxicity + (state.molecularSize / 50) - (state.solubility / 2) + ((85 - state.patientAge) / 5);
    const riskLevel = riskScore < 20 ? 'LOW' : riskScore < 40 ? 'MEDIUM' : 'HIGH';
    const riskColor = riskLevel === 'LOW' ? '#00ff88' : riskLevel === 'MEDIUM' ? '#ffd60a' : '#ff006e';

    content.innerHTML = `
        <div class="report-doc">
            <div class="report-header">
                <div>
                    <h1>⚗️ Drug Simulation Report</h1>
                    <p>AI-Powered Drug Discovery & Simulation Engine</p>
                </div>
                <div class="report-date">
                    <strong>Generated:</strong><br>
                    ${now.toLocaleDateString()} ${now.toLocaleTimeString()}
                </div>
            </div>

            <div class="report-section">
                <h2>Patient Profile</h2>
                <div class="report-grid">
                    <div><label>Patient Name:</label><span>${state.patientName || '—'}</span></div>
                    <div><label>Age:</label><span>${state.patientAge} years</span></div>
                    <div><label>Weight:</label><span>${state.patientWeight} kg</span></div>
                    <div><label>Conditions:</label><span>${state.conditions.join(', ') || 'None'}</span></div>
                    <div><label>Allergies:</label><span>${state.allergies.join(', ') || 'None'}</span></div>
                    <div><label>Active Medications:</label><span>${currentMedNames || 'None'}</span></div>
                </div>
            </div>

            <div class="report-section">
                <h2>Drug Parameters</h2>
                <div class="report-grid">
                    <div><label>Molecular Weight:</label><span>${state.molecularSize} Da</span></div>
                    <div><label>Solubility:</label><span>${state.solubility}%</span></div>
                    <div><label>Toxicity Index:</label><span>${state.toxicity}%</span></div>
                    <div><label>Target Organ:</label><span>${state.targetOrgan}</span></div>
                </div>
            </div>

            <div class="report-section">
                <h2>Pharmacokinetic Results</h2>
                <div class="report-grid">
                    <div><label>Estimated Half-Life:</label><span>${halfLife.toFixed(1)} hours</span></div>
                    <div><label>Time to Peak (T_max):</label><span>${absorption.time.toFixed(1)} hours</span></div>
                    <div><label>Bioavailability:</label><span>${bioavailability}%</span></div>
                    <div><label>Absorption Rate:</label><span>${(absorption.rate * 100).toFixed(1)}%/h</span></div>
                    <div><label>Steady-State:</label><span>~${(halfLife * 5 / 24).toFixed(1)} days</span></div>
                    <div><label>Side Effect Risk:</label><span style="color:${riskColor}; font-weight:700;">${riskLevel}</span></div>
                </div>
            </div>

            ${state.fdaSelectedDrug ? `
            <div class="report-section">
                <h2>FDA Drug Data — ${state.fdaSelectedDrug.brandName || state.fdaSelectedDrug.genericName}</h2>
                ${state.fdaSelectedDrug.indications ? `<p><strong>Indications:</strong> ${state.fdaSelectedDrug.indications}</p>` : ''}
                ${state.fdaSelectedDrug.warnings ? `<p><strong>Warnings:</strong> ${state.fdaSelectedDrug.warnings}</p>` : ''}
                ${state.fdaSelectedDrug.adverseReactions ? `<p><strong>Adverse Reactions:</strong> ${state.fdaSelectedDrug.adverseReactions}</p>` : ''}
                ${state.fdaSelectedDrug.drugInteractions ? `<p><strong>Drug Interactions:</strong> ${state.fdaSelectedDrug.drugInteractions}</p>` : ''}
            </div>` : ''}

            <div class="report-section">
                <h2>AI-Generated Analysis</h2>
                <div class="report-analysis">
                    ${document.getElementById('aiPrediction').innerHTML}
                </div>
            </div>

            <div class="report-section">
                <h2>Safety Assessment</h2>
                <div class="report-analysis">
                    ${document.getElementById('prescriptionSafety').innerHTML}
                </div>
            </div>

            <div class="report-section">
                <h2>Dosing Recommendations</h2>
                <div class="report-analysis">
                    ${document.getElementById('aiDosing').innerHTML}
                </div>
            </div>

            <div class="report-footer">
                <p><strong>Disclaimer:</strong> This report is generated by an AI simulation engine for educational and research purposes only.
                Clinical decisions must be made by qualified healthcare professionals using validated clinical data sources.
                FDA data sourced from OpenFDA public API.</p>
            </div>
        </div>`;

    modal.style.display = 'flex';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

function printReport() {
    const content = document.getElementById('reportContent').innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;

    const style = `
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #fff; padding: 2rem; }
        h1 { color: #0066cc; border-bottom: 2px solid #0066cc; padding-bottom: 0.5rem; }
        h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 0.3rem; margin-top: 1.5rem; }
        .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
        .report-date { text-align: right; font-size: 0.9rem; color: #555; }
        .report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 2rem; margin: 0.8rem 0; }
        .report-grid div label { font-weight: 600; color: #555; font-size: 0.85rem; display: block; }
        .report-grid div span { color: #111; }
        .report-section { margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #e0e0e0; border-radius: 6px; }
        .report-footer { margin-top: 2rem; font-size: 0.8rem; color: #777; border-top: 1px solid #ddd; padding-top: 1rem; }
        .risk-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; }
        .risk-badge.low { background: #e6fff2; color: #00a855; }
        .risk-badge.medium { background: #fff9e6; color: #cc8800; }
        .risk-badge.high { background: #ffe6ee; color: #cc0044; }
        ul { padding-left: 1.2rem; } li { margin: 0.3rem 0; } p { margin: 0.5rem 0; }
        @media print { body { padding: 0; } .report-section { break-inside: avoid; } }
    `;

    const styleEl = win.document.createElement('style');
    styleEl.textContent = style;
    win.document.head.appendChild(styleEl);
    win.document.title = 'Drug Simulation Report';
    win.document.body.innerHTML = content;

    setTimeout(() => win.print(), 400);
}

// ========================================
// RESET
// ========================================

function resetParameters() {
    const defaults = { molecularSize: 350, solubility: 60, toxicity: 15, patientAge: 45, targetOrgan: 'liver' };

    Object.assign(state, {
        ...defaults,
        patientName: '', patientWeight: 70, conditions: [], allergies: [],
        selectedDrugId: null, currentMeds: [], simulationData: [],
        existingConditions: [], currentMedications: [], fdaSelectedDrug: null,
        interactionRiskScore: 0, interactionRiskLevel: 'low'
    });

    ['molecularSize', 'solubility', 'toxicity', 'patientAge'].forEach(id => {
        document.getElementById(id).value = defaults[id];
        document.getElementById(`${id}Value`).textContent = defaults[id];
    });
    document.getElementById('patientWeight').value = 70;
    document.getElementById('patientWeightValue').textContent = 70;
    document.getElementById('targetOrgan').value = defaults.targetOrgan;
    document.getElementById('patientName').value = '';
    document.getElementById('desiredOutcome').value = '';
    document.getElementById('fdaDrugSearch').value = '';

    Array.from(document.getElementById('patientConditions').options).forEach(o => o.selected = false);
    Array.from(document.getElementById('patientAllergies').options).forEach(o => o.selected = false);
    document.getElementById('drugSelector').selectedIndex = 0;
    document.getElementById('fdaDrugInfoCard').style.display = 'none';
    document.getElementById('pkSummary').style.display = 'none';

    updateConditionTags();
    updateMedicationTags();

    // Reset analysis sections
    document.getElementById('aiPrediction').innerHTML = '<p class="placeholder-text">Adjust parameters and run simulation to generate AI analysis...</p>';
    document.getElementById('aiRisks').innerHTML = '<p class="placeholder-text">Select parameters to analyze potential risks...</p>';
    document.getElementById('aiSuggestions').innerHTML = '<ul class="suggestion-list"><li>Run simulation to receive personalized recommendations</li></ul>';
    document.getElementById('aiDosing').innerHTML = '<p class="placeholder-text">Calculate dosing regimens once simulation runs...</p>';
    document.getElementById('personalizedRecommendations').innerHTML = '<ul class="suggestion-list"><li>Complete patient profile to receive personalized safety recommendations</li></ul>';

    // Reset metrics
    document.getElementById('effectivenessBar').style.width = '0%';
    document.getElementById('effectivenessValue').textContent = '0%';
    ['peakConcentration', 'halfLife', 'bioavailability', 'absorptionTime'].forEach(id => {
        document.getElementById(id).textContent = '—';
    });

    initializeChart();
    renderCurrentMeds();
    evaluatePrescriptionSafety();
    updateInteractionAnalysis();
    updateRiskIndicator();

    showToast('Parameters reset to defaults.', 'info');
}

// ========================================
// TOAST NOTIFICATIONS
// ========================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: '✓', warning: '⚠', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${message}</span>`;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add('show'));

    // Auto-remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}
