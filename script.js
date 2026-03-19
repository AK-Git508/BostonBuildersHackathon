// ========================================
// GENERATIVE AI DRUG SIMULATION ENGINE
// JavaScript Logic & Simulation Engine
// ========================================

// State Management
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
    isSimulating: false
};

// Minimal drug database with real-world examples (for illustration)
const DRUG_DATABASE = [
    {
        id: 'amoxicillin',
        name: 'Amoxicillin',
        class: 'Penicillin antibiotic',
        commonUses: ['Bacterial infections', 'Otitis media', 'Sinusitis'],
        allergies: ['penicillin'],
        contraindications: ['mononucleosis', 'penicillin allergy'],
        interactions: {
            warfarin: 'medium',
            methotrexate: 'high',
            oral_contraceptives: 'low'
        },
        precautions: [
            'May increase INR when given with warfarin',
            'Monitor renal function in patients with kidney impairment'
        ],
        alternatives: ['Azithromycin', 'Doxycycline']
    },
    {
        id: 'ibuprofen',
        name: 'Ibuprofen',
        class: 'NSAID',
        commonUses: ['Pain relief', 'Fever', 'Inflammation'],
        allergies: ['nsaids'],
        contraindications: ['peptic ulcer disease', 'renal impairment', 'asthma'],
        interactions: {
            warfarin: 'high',
            lisinopril: 'medium',
            lithium: 'medium',
            aspirin: 'medium'
        },
        precautions: [
            'May increase risk of gastrointestinal bleeding',
            'Use with caution in patients with hypertension or renal disease'
        ],
        alternatives: ['Acetaminophen', 'Naproxen']
    },
    {
        id: 'warfarin',
        name: 'Warfarin',
        class: 'Anticoagulant (Vitamin K antagonist)',
        commonUses: ['Venous thromboembolism', 'Atrial fibrillation', 'Mechanical valves'],
        allergies: [],
        contraindications: ['bleeding disorders', 'pregnancy'],
        interactions: {
            aspirin: 'high',
            ibuprofen: 'high',
            amoxicillin: 'medium',
            vitamin_k_rich_foods: 'low'
        },
        precautions: [
            'Requires INR monitoring',
            'Many drug-drug interactions; review every new medication'
        ],
        alternatives: ['Apixaban', 'Rivaroxaban']
    },
    {
        id: 'metformin',
        name: 'Metformin',
        class: 'Biguanide',
        commonUses: ['Type 2 diabetes mellitus'],
        allergies: [],
        contraindications: ['renal impairment', 'acute cardiac failure', 'lactic acidosis'],
        interactions: {
            cimetidine: 'medium',
            contrast_dye: 'high'
        },
        precautions: [
            'May cause lactic acidosis in renal impairment',
            'Hold before imaging with iodinated contrast agents'
        ],
        alternatives: ['Glipizide', 'Pioglitazone']
    },
    {
        id: 'lisinopril',
        name: 'Lisinopril',
        class: 'ACE inhibitor',
        commonUses: ['Hypertension', 'Heart failure'],
        allergies: [],
        contraindications: ['pregnancy', 'angioedema history'],
        interactions: {
            potassium_supplements: 'high',
            ibuprofen: 'medium',
            spironolactone: 'medium'
        },
        precautions: [
            'Monitor potassium and renal function',
            'Avoid during pregnancy'
        ],
        alternatives: ['Losartan', 'Enalapril']
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
    'Pregnancy'
];

const ALLERGY_OPTIONS = [
    'Penicillin',
    'NSAIDs',
    'Sulfa drugs',
    'Latex',
    'Eggs',
    'Peanuts'
];

// Chart Instance
let concentrationChart = null;

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    initializePrescriptionControls();
    initializeChart();
    updateAllOutputs();
});

function initializeEventListeners() {
    // Sliders
    document.getElementById('molecularSize').addEventListener('input', handleSliderChange);
    document.getElementById('solubility').addEventListener('input', handleSliderChange);
    document.getElementById('toxicity').addEventListener('input', handleSliderChange);
    document.getElementById('patientAge').addEventListener('input', handleSliderChange);
    document.getElementById('targetOrgan').addEventListener('change', handleOrganChange);

    // Buttons
    document.getElementById('simulateBtn').addEventListener('click', runSimulation);
    document.getElementById('resetBtn').addEventListener('click', resetParameters);
    document.getElementById('autoGenerateBtn').addEventListener('click', autoGenerateParameters);

    document.getElementById('patientName').addEventListener('input', handlePatientName);
    document.getElementById('patientWeight').addEventListener('input', handleWeightChange);
    document.getElementById('patientConditions').addEventListener('change', handleConditionsChange);
    document.getElementById('patientAllergies').addEventListener('change', handleAllergiesChange);
    document.getElementById('drugSelector').addEventListener('change', handleDrugSelection);
    document.getElementById('addMedicationBtn').addEventListener('click', addMedicationToProfile);
    document.getElementById('evaluateBtn').addEventListener('click', () => evaluatePrescriptionSafety(true));

    // Real-time safety feedback
    document.getElementById('patientWeight').addEventListener('input', () => evaluatePrescriptionSafety(false));
    document.getElementById('patientConditions').addEventListener('change', () => evaluatePrescriptionSafety(false));
    document.getElementById('patientAllergies').addEventListener('change', () => evaluatePrescriptionSafety(false));
    document.getElementById('drugSelector').addEventListener('change', () => evaluatePrescriptionSafety(false));

    // Add real-time updates
    document.getElementById('molecularSize').addEventListener('input', updateAllOutputs);
    document.getElementById('solubility').addEventListener('input', updateAllOutputs);
    document.getElementById('toxicity').addEventListener('input', updateAllOutputs);
    document.getElementById('patientAge').addEventListener('input', updateAllOutputs);
    document.getElementById('patientAge').addEventListener('input', () => evaluatePrescriptionSafety(false));
}

function handleSliderChange(e) {
    const id = e.target.id;
    const value = e.target.value;
    
    // Update state
    if (id === 'molecularSize') state.molecularSize = parseInt(value);
    else if (id === 'solubility') state.solubility = parseInt(value);
    else if (id === 'toxicity') state.toxicity = parseInt(value);
    else if (id === 'patientAge') state.patientAge = parseInt(value);

    // Update display
    document.getElementById(`${id}Value`).textContent = value;
}

function handleOrganChange(e) {
    state.targetOrgan = e.target.value;
}

// ========================================
// CHART INITIALIZATION
// ========================================

function initializeChart() {
    const ctx = document.getElementById('concentrationChart').getContext('2d');
    
    concentrationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: generateTimeLabels(24),
            datasets: [{
                label: 'Drug Concentration (ng/mL)',
                data: Array(24).fill(0),
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#00d4ff',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                hoverBorderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#b0b3c0',
                        font: { size: 12, weight: 'bold' },
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 39, 0.9)',
                    titleColor: '#00d4ff',
                    bodyColor: '#b0b3c0',
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return 'Concentration: ' + context.parsed.y.toFixed(1) + ' ng/mL';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#b0b3c0',
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(45, 55, 72, 0.5)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Concentration (ng/mL)',
                        color: '#00d4ff',
                        font: { size: 12, weight: 'bold' }
                    }
                },
                x: {
                    ticks: {
                        color: '#b0b3c0',
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(45, 55, 72, 0.3)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Time (hours)',
                        color: '#00d4ff',
                        font: { size: 12, weight: 'bold' }
                    }
                }
            }
        }
    });
}

function initializePrescriptionControls() {
    // Populate condition and allergy selectors
    const conditionSelect = document.getElementById('patientConditions');
    CONDITION_OPTIONS.forEach(condition => {
        const option = document.createElement('option');
        option.value = condition;
        option.textContent = condition;
        conditionSelect.appendChild(option);
    });

    const allergySelect = document.getElementById('patientAllergies');
    ALLERGY_OPTIONS.forEach(allergy => {
        const option = document.createElement('option');
        option.value = allergy;
        option.textContent = allergy;
        allergySelect.appendChild(option);
    });

    // Populate drug selector
    const drugSelector = document.getElementById('drugSelector');
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Select a medication...';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    drugSelector.appendChild(placeholderOption);

    DRUG_DATABASE.forEach(drug => {
        const option = document.createElement('option');
        option.value = drug.id;
        option.textContent = `${drug.name} (${drug.class})`;
        drugSelector.appendChild(option);
    });

    loadHistory();
    renderCurrentMeds();
    evaluatePrescriptionSafety();
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
    state.selectedDrugId = e.target.value;
}

function getDrugById(id) {
    return DRUG_DATABASE.find(d => d.id === id) || null;
}

function addMedicationToProfile() {
    const drugId = state.selectedDrugId;
    if (!drugId) {
        alert('Please select a medication to add.');
        return;
    }

    if (state.currentMeds.includes(drugId)) {
        return;
    }

    state.currentMeds.push(drugId);
    renderCurrentMeds();
    evaluatePrescriptionSafety();
}

function removeMedicationFromProfile(drugId) {
    state.currentMeds = state.currentMeds.filter(id => id !== drugId);
    renderCurrentMeds();
    evaluatePrescriptionSafety();
}

function renderCurrentMeds() {
    const container = document.getElementById('currentMedsList');
    container.innerHTML = '';

    if (state.currentMeds.length === 0) {
        container.innerHTML = '<span style="color: var(--text-muted);">No active medications selected.</span>';
        return;
    }

    state.currentMeds.forEach(drugId => {
        const drug = getDrugById(drugId);
        if (!drug) return;

        const pill = document.createElement('div');
        pill.className = 'pill';
        pill.innerHTML = `${drug.name} <button type="button" aria-label="Remove ${drug.name}">&times;</button>`;
        pill.querySelector('button').addEventListener('click', () => removeMedicationFromProfile(drugId));
        container.appendChild(pill);
    });
}

function evaluatePrescriptionSafety(saveHistory = false) {
    const selectedDrug = getDrugById(state.selectedDrugId);
    const currentDrugList = state.currentMeds.map(getDrugById).filter(Boolean);

    const riskEntries = [];
    let overallSeverity = 'low';

    // Allergy checks
    if (selectedDrug) {
        const allergyMatch = state.allergies.some(allergy =>
            selectedDrug.allergies.some(drugAllergy =>
                drugAllergy.toLowerCase() === allergy.toLowerCase()
            )
        );

        if (allergyMatch) {
            overallSeverity = 'high';
            riskEntries.push({
                severity: 'high',
                message: `Patient allergy detected: ${state.allergies.join(', ')}. ${selectedDrug.name} is contraindicated for this allergy.`,
                why: `Because the patient has a known allergy, administration of ${selectedDrug.name} may trigger a severe hypersensitivity reaction.`
            });
        }
    }

    // Condition contradictions
    if (selectedDrug) {
        state.conditions.forEach(condition => {
            const normalizedCondition = condition.toLowerCase();
            const contraindicated = selectedDrug.contraindications.some(c => c.toLowerCase() === normalizedCondition);
            if (contraindicated) {
                overallSeverity = 'high';
                riskEntries.push({
                    severity: 'high',
                    message: `${selectedDrug.name} is contraindicated in patients with ${condition}.`,
                    why: `${selectedDrug.name} can worsen ${condition} or increase the risk of serious complications when used in this setting.`
                });
            }
        });
    }

    // Interaction checks between selected drug and current meds
    if (selectedDrug) {
        currentDrugList.forEach(otherDrug => {
            const severity = getInteractionSeverity(selectedDrug, otherDrug);
            if (severity) {
                if (severity === 'high') overallSeverity = 'high';
                else if (severity === 'medium' && overallSeverity !== 'high') overallSeverity = 'medium';
                riskEntries.push({
                    severity,
                    message: `${selectedDrug.name} has a ${severity} interaction with ${otherDrug.name}.`,
                    why: `Concurrent use may increase risk of adverse effects or alter therapeutic levels of either drug.`
                });
            }
        });
    }

    // Weight / age based guidance
    if (state.patientWeight < 50) {
        overallSeverity = overallSeverity === 'high' ? 'high' : 'medium';
        riskEntries.push({
            severity: 'medium',
            message: 'Patient weight is below average (<50kg) which may affect dosing.',
            why: 'Lower body mass can increase drug exposure, requiring careful dose adjustment.'
        });
    }

    if (state.patientAge > 75) {
        overallSeverity = overallSeverity === 'high' ? 'high' : 'medium';
        riskEntries.push({
            severity: 'medium',
            message: 'Advanced age (>75 yrs) may increase risk of side effects.',
            why: 'Older adults often have reduced renal/hepatic clearance and are more sensitive to medications.'
        });
    }

    // Build output
    const badge = `<span class="risk-badge ${overallSeverity}">${overallSeverity.toUpperCase()} RISK</span>`;
    const summaryLines = [];

    if (!selectedDrug) {
        summaryLines.push('<p>Please select a medication to analyze.</p>');
    } else {
        summaryLines.push(`<p><strong>Medication:</strong> ${selectedDrug.name} (${selectedDrug.class})</p>`);
        if (selectedDrug.commonUses?.length) {
            summaryLines.push(`<p><strong>Common Uses:</strong> ${selectedDrug.commonUses.join(', ')}</p>`);
        }
        summaryLines.push(`<p><strong>Risk Level:</strong> ${badge}</p>`);
        if (riskEntries.length === 0) {
            summaryLines.push('<p>No significant interactions or contraindications detected. Continue to monitor clinically.</p>');
        } else {
            summaryLines.push('<ul class="suggestion-list">');
            riskEntries.slice(0, 5).forEach(entry => {
                summaryLines.push(`<li><strong>${entry.message}</strong><br><em>Why:</em> ${entry.why}</li>`);
            });
            summaryLines.push('</ul>');
        }
        if (selectedDrug.alternatives?.length) {
            summaryLines.push(`<p><strong>Suggested alternatives:</strong> ${selectedDrug.alternatives.join(', ')}</p>`);
        }
        const precautions = selectedDrug.precautions || [];
        if (precautions.length) {
            summaryLines.push(`<p><strong>Suggested precautions:</strong></p><ul class="suggestion-list">${precautions.slice(0, 3).map(p => `<li>${p}</li>`).join('')}</ul>`);
        }
    }

    document.getElementById('prescriptionSafety').innerHTML = summaryLines.join('');

    // Visual validation: highlight the drug selector when high risk is detected
    const drugSelector = document.getElementById('drugSelector');
    if (overallSeverity === 'high') {
        drugSelector.classList.add('input-warning');
    } else {
        drugSelector.classList.remove('input-warning');
    }

    // Store in history only when explicitly requested (via button click)
    if (saveHistory && state.patientName.trim() && selectedDrug) {
        const record = {
            timestamp: new Date().toISOString(),
            patientName: state.patientName.trim(),
            age: state.patientAge,
            weight: state.patientWeight,
            conditions: state.conditions.slice(),
            allergies: state.allergies.slice(),
            medication: selectedDrug.name,
            risk: overallSeverity,
            notes: riskEntries.map(r => r.message)
        };
        saveHistoryRecord(record);
    }
}

function getInteractionSeverity(drugA, drugB) {
    const keyA = drugB.id;
    const keyB = drugA.id;

    // Check both directions for stored interactions
    const severityA = drugA.interactions?.[keyA] || null;
    const severityB = drugB.interactions?.[keyB] || null;
    const severity = severityA || severityB;

    if (!severity) return null;

    if (['high', 'medium', 'low'].includes(severity)) {
        return severity;
    }

    // Normalize non-standard names
    if (typeof severity === 'string') {
        const s = severity.toLowerCase();
        if (s.includes('high')) return 'high';
        if (s.includes('medium') || s.includes('mod')) return 'medium';
        return 'low';
    }

    return null;
}

function saveHistoryRecord(record) {
    const maxRecords = 20;
    state.history.unshift(record);
    if (state.history.length > maxRecords) {
        state.history = state.history.slice(0, maxRecords);
    }
    localStorage.setItem('drugSimulationHistory', JSON.stringify(state.history));
    renderHistoryLog();
}

function loadHistory() {
    const stored = localStorage.getItem('drugSimulationHistory');
    if (!stored) {
        state.history = [];
        return;
    }
    try {
        state.history = JSON.parse(stored) || [];
    } catch (e) {
        state.history = [];
    }
    renderHistoryLog();
}

function renderHistoryLog() {
    const container = document.getElementById('historyLog');
    if (!container) return;

    if (!state.history.length) {
        container.innerHTML = '<p>No checks recorded yet. Run an interaction check to create a patient record.</p>';
        return;
    }

    const rows = state.history.slice(0, 8).map(record => {
        const date = new Date(record.timestamp);
        return `
            <div class="history-row">
                <div><strong>${record.patientName}</strong> <br><span style="color: var(--text-muted); font-size:0.85rem;">${formatTimestamp(date)}</span></div>
                <div>${record.medication}</div>
                <div><span class="risk-badge ${record.risk}">${record.risk.toUpperCase()}</span></div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="history-header">
            <div>Patient</div>
            <div>Medication</div>
            <div>Risk</div>
        </div>
        ${rows}
    `;
}

function formatTimestamp(date) {
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateTimeLabels(hours) {
    const labels = [];
    for (let i = 0; i <= hours; i++) {
        labels.push(i + 'h');
    }
    return labels;
}

// ========================================
// DRUG SIMULATION ENGINE
// ========================================

function runSimulation() {
    state.isSimulating = true;
    
    // Generate concentration curve
    const concentrationData = generateConcentrationCurve(
        state.molecularSize,
        state.solubility,
        state.toxicity,
        state.patientAge,
        state.targetOrgan
    );

    state.simulationData = concentrationData;

    // Update chart
    updateChart(concentrationData);

    // Update analytics
    updateAnalytics(concentrationData);

    // Generate AI analysis
    generateAIAnalysis();

    // Also refresh the prescription safety view based on latest patient/drug data
    evaluatePrescriptionSafety(false);

    state.isSimulating = false;
}

function generateConcentrationCurve(molecularSize, solubility, toxicity, age, organ) {
    const hours = 24;
    const concentrationData = [];

    // Calculate pharmacokinetic parameters
    const absorption = calculateAbsorption(molecularSize, solubility);
    const halfLife = calculateHalfLife(molecularSize, toxicity, age, organ);
    const peakTime = absorption.time;
    const peakConcentration = 100 - (toxicity * 0.5) + (solubility * 0.3);

    // Generate concentration curve using modified one-compartment model
    for (let t = 0; t <= hours; t++) {
        let concentration = 0;

        if (t < peakTime) {
            // Absorption phase
            const absorptionRate = 0.3 / peakTime;
            concentration = peakConcentration * (1 - Math.exp(-absorptionRate * t));
        } else {
            // Elimination phase
            const eliminationConstant = Math.log(2) / halfLife;
            concentration = peakConcentration * Math.exp(-eliminationConstant * (t - peakTime));
        }

        // Add some realistic variation
        concentration += (Math.sin(t * 0.3) * 2);
        concentration = Math.max(0, Math.min(concentration, 100));

        concentrationData.push(parseFloat(concentration.toFixed(2)));
    }

    return concentrationData;
}

function calculateAbsorption(molecularSize, solubility) {
    // Smaller molecules absorb faster, higher solubility improves absorption
    const baseAbsorption = 2 + (1000 - molecularSize) / 500;
    const adjustedAbsorption = baseAbsorption * (solubility / 50);
    
    return {
        rate: Math.min(0.8, adjustedAbsorption / 100),
        time: Math.max(1, Math.min(3, baseAbsorption - (solubility / 100)))
    };
}

function calculateHalfLife(molecularSize, toxicity, age, organ) {
    // Molecular size affects half-life (larger = longer)
    let halfLife = 4 + (molecularSize / 200);
    
    // Toxicity affects metabolism
    halfLife *= (1 - toxicity / 100);
    
    // Age affects metabolism
    if (age > 65) {
        halfLife *= 1.3;
    } else if (age < 25) {
        halfLife *= 0.9;
    }

    // Organ-specific metabolism
    const organFactors = {
        'liver': 1.0,
        'brain': 1.2,
        'heart': 0.9,
        'kidney': 0.8,
        'lungs': 1.1,
        'intestines': 0.7
    };

    halfLife *= (organFactors[organ] || 1.0);

    return Math.max(2, halfLife);
}

// ========================================
// ANALYTICS & METRICS
// ========================================

function updateChart(data) {
    if (concentrationChart) {
        concentrationChart.data.datasets[0].data = data;
        concentrationChart.update('none');
    }
}

function updateAnalytics(concentrationData) {
    // Peak concentration
    const peakConcentration = Math.max(...concentrationData);
    document.getElementById('peakConcentration').textContent = peakConcentration.toFixed(1);

    // Half-life calculation
    const halfLifeValue = calculateHalfLife(state.molecularSize, state.toxicity, state.patientAge, state.targetOrgan);
    document.getElementById('halfLife').textContent = halfLifeValue.toFixed(1) + ' hrs';

    // Bioavailability (area under curve / max possible)
    const auc = concentrationData.reduce((a, b) => a + b, 0);
    const maxAuc = 100 * 24;
    const bioavailability = Math.round((auc / maxAuc) * 100);
    document.getElementById('bioavailability').textContent = bioavailability + '%';

    // Absorption time
    const absorption = calculateAbsorption(state.molecularSize, state.solubility);
    document.getElementById('absorptionTime').textContent = absorption.time.toFixed(1) + ' hrs';

    // Effectiveness
    let effectiveness = Math.round(bioavailability * (state.solubility / 100) * (1 - state.toxicity / 100) * 100);
    effectiveness = Math.min(100, Math.max(0, effectiveness));
    
    const effectivenessBar = document.getElementById('effectivenessBar');
    effectivenessBar.style.width = effectiveness + '%';
    document.getElementById('effectivenessValue').textContent = effectiveness + '%';

    // Risk assessment
    updateRiskIndicator();
}

function updateRiskIndicator() {
    // Calculate risk based on toxicity and other factors
    let riskScore = state.toxicity + (state.molecularSize / 50);
    riskScore -= (state.solubility / 2);
    riskScore += ((85 - state.patientAge) / 5);

    let riskLevel, riskText;

    if (riskScore < 20) {
        riskLevel = 'low';
        riskText = '🟢 Low Risk';
    } else if (riskScore < 40) {
        riskLevel = 'medium';
        riskText = '🟡 Medium Risk';
    } else {
        riskLevel = 'high';
        riskText = '🔴 High Risk';
    }

    const indicator = document.getElementById('riskIndicator');
    indicator.className = 'risk-indicator ' + riskLevel;
    indicator.innerHTML = `<span class="risk-label">${riskText}</span>`;
}

function updateAllOutputs() {
    if (!state.isSimulating) {
        updateRiskIndicator();
    }
}

// ========================================
// AI ANALYSIS ENGINE
// ========================================

function generateAIAnalysis() {
    generateDrugBehaviorPrediction();
    generateRiskAnalysis();
    generateOptimizationSuggestions();
    generateDosingRecommendations();
}

function generateDrugBehaviorPrediction() {
    const absorption = calculateAbsorption(state.molecularSize, state.solubility);
    const halfLife = calculateHalfLife(state.molecularSize, state.toxicity, state.patientAge, state.targetOrgan);
    const organNames = {
        'liver': 'hepatic system (liver)',
        'brain': 'blood-brain barrier',
        'heart': 'cardiac system',
        'kidney': 'renal system (kidneys)',
        'lungs': 'pulmonary system',
        'intestines': 'gastrointestinal tract'
    };

    const prediction = `
        <p>Based on the current parameters, this drug exhibits rapid absorption with an estimated peak concentration within <strong>${absorption.time.toFixed(1)} hours</strong> of administration. The drug has a half-life of approximately <strong>${halfLife.toFixed(1)} hours</strong>, suggesting ${halfLife > 6 ? 'sustained' : 'shorter-duration'} therapeutic activity.</p>
        
        <p>The molecular size of <strong>${state.molecularSize} Da</strong> indicates ${state.molecularSize < 400 ? 'good oral bioavailability and efficient tissue penetration' : 'potential absorption limitations requiring optimization'}. With a solubility level of <strong>${state.solubility}%</strong>, the drug demonstrates ${state.solubility > 70 ? 'excellent water solubility for rapid dissolution' : state.solubility > 40 ? 'moderate solubility' : 'limited aqueous solubility'}.</p>
        
        <p>In a ${state.patientAge}-year-old patient, the drug will predominantly accumulate in the <strong>${organNames[state.targetOrgan] || state.targetOrgan}</strong>. The pharmacokinetic profile suggests ${halfLife * 2 < 24 ? 'multiple daily dosing may be required' : 'once or twice daily dosing is likely sufficient'} for therapeutic efficacy.</p>
    `;

    document.getElementById('aiPrediction').innerHTML = prediction;
}

function generateRiskAnalysis() {
    const riskFactors = [];

    if (state.toxicity > 30) {
        riskFactors.push('<li>High toxicity level detected - careful monitoring required for hepatotoxicity and renal function</li>');
    }

    if (state.molecularSize > 700) {
        riskFactors.push('<li>Large molecular size may limit blood-brain barrier penetration and renal clearance</li>');
    }

    if (state.solubility < 30) {
        riskFactors.push('<li>Low solubility may result in incomplete absorption and variable bioavailability</li>');
    }

    if (state.patientAge > 65) {
        riskFactors.push('<li>Elderly patient profile requires dose adjustment due to reduced metabolic capacity</li>');
    }

    if (state.targetOrgan === 'brain') {
        riskFactors.push('<li>CNS-active compound - monitor for neurological side effects including dizziness and headache</li>');
    }

    if (state.targetOrgan === 'liver') {
        riskFactors.push('<li>Hepatic metabolism - contraindicated in patients with liver disease</li>');
    }

    const riskHTML = riskFactors.length > 0 
        ? `<ul class="suggestion-list">${riskFactors.join('')}</ul>`
        : '<p>Current parameters indicate a favorable safety profile with minimal identified risks.</p>';

    document.getElementById('aiRisks').innerHTML = riskHTML;
}

function generateOptimizationSuggestions() {
    const suggestions = [];

    if (state.molecularSize > 500) {
        suggestions.push('Reduce molecular size through structural modifications to improve oral bioavailability and tissue penetration');
    }

    if (state.solubility < 50) {
        suggestions.push('Enhance solubility by incorporating hydrophilic functional groups or converting to salt formulation');
    }

    if (state.toxicity > 20) {
        suggestions.push('Reduce toxicity through chemical modification to minimize off-target binding and metabolic stress');
    }

    if (state.molecularSize < 200) {
        suggestions.push('Consider increasing molecular complexity to improve target selectivity and reduce off-target effects');
    }

    if (state.solubility > 80) {
        suggestions.push('Drug exhibits excellent solubility - maintain current structural framework');
    }

    const suggestionItems = suggestions
        .slice(0, 4)
        .map(s => `<li>${s}</li>`)
        .join('');

    document.getElementById('aiSuggestions').innerHTML = `<ul class="suggestion-list">${suggestionItems}</ul>`;
}

function generateDosingRecommendations() {
    const absorption = calculateAbsorption(state.molecularSize, state.solubility);
    const halfLife = calculateHalfLife(state.molecularSize, state.toxicity, state.patientAge, state.targetOrgan);
    const bioavailability = Math.round((state.solubility / 100) * (1 - state.toxicity / 100) * 100);
    
    let dosageInterval, doseName;

    if (halfLife < 4) {
        dosageInterval = '4-6 hours';
        doseName = 'Four times daily (QID)';
    } else if (halfLife < 8) {
        dosageInterval = '8-12 hours';
        doseName = 'Two times daily (BID)';
    } else {
        dosageInterval = '24 hours';
        doseName = 'Once daily (QD)';
    }

    const baselineDose = 100 - (state.toxicity * 0.5);
    let ageAdjustment = 1.0;

    if (state.patientAge > 65) {
        ageAdjustment = 0.75;
    } else if (state.patientAge < 25) {
        ageAdjustment = 1.1;
    }

    const recommendedDose = Math.round(baselineDose * ageAdjustment);

    const dosingHTML = `
        <p><strong>Recommended Dosing Schedule:</strong> ${doseName}</p>
        <p><strong>Dosage Interval:</strong> ${dosageInterval}</p>
        <p><strong>Recommended Dose:</strong> ${recommendedDose} mg ${doseName === 'Once daily (QD)' ? 'daily' : 'per dose'}</p>
        <p><strong>Time to Peak:</strong> ${absorption.time.toFixed(1)} hours (administer before meals for optimal absorption)</p>
        <p><strong>Bioavailability:</strong> ${bioavailability}% (expected systemic exposure)</p>
        <p><strong>Steady-state Achievement:</strong> Approximately ${(halfLife * 5).toFixed(0)} hours (${(halfLife * 5 / 24).toFixed(1)} days)</p>
    `;

    document.getElementById('aiDosing').innerHTML = dosingHTML;
}

// ========================================
// AUTO-GENERATE PARAMETERS
// ========================================

function autoGenerateParameters() {
    const desiredOutcome = document.getElementById('desiredOutcome').value.toLowerCase();

    if (!desiredOutcome.trim()) {
        alert('Please enter a desired outcome (e.g., "low side effect headache drug")');
        return;
    }

    // Parse desired outcome and adjust parameters
    let newMolecularSize = 350;
    let newSolubility = 60;
    let newToxicity = 15;
    let newOrgan = 'brain';

    // Keyword-based parameter adjustment
    const outcomeAnalysis = {
        'low': { toxicity: -10, solubility: 10 },
        'high': { toxicity: 10, solubility: -10 },
        'headache': { molecularSize: -100, organ: 'brain' },
        'pain': { molecularSize: 0, organ: 'nervous'},
        'fever': { solubility: 15, organ: 'liver' },
        'infection': { solubility: 20, toxicity: 5 },
        'inflammation': { toxicity: 10, solubility: 10, molecularSize: -50 },
        'cancer': { toxicity: 20, solubility: 5, molecularSize: 100 },
        'side effect': { toxicity: -15, solubility: 10 },
        'efficient': { solubility: 20, molecularSize: -50 },
        'rapid': { solubility: 25, toxicity: -5 },
        'slow': { molecularSize: 150, toxicity: 5 },
        'gentle': { toxicity: -20, solubility: 15 }
    };

    // Apply keyword matches
    for (const [keyword, adjustments] of Object.entries(outcomeAnalysis)) {
        if (desiredOutcome.includes(keyword)) {
            if (adjustments.molecularSize) newMolecularSize += adjustments.molecularSize;
            if (adjustments.solubility) newSolubility += adjustments.solubility;
            if (adjustments.toxicity) newToxicity += adjustments.toxicity;
            if (adjustments.organ) newOrgan = adjustments.organ;
        }
    }

    // Clamp values to valid ranges
    newMolecularSize = Math.max(100, Math.min(1000, newMolecularSize));
    newSolubility = Math.max(10, Math.min(100, newSolubility));
    newToxicity = Math.max(5, Math.min(50, newToxicity));

    // Set organ if detected
    if (desiredOutcome.includes('brain')) newOrgan = 'brain';
    else if (desiredOutcome.includes('heart')) newOrgan = 'heart';
    else if (desiredOutcome.includes('kidney')) newOrgan = 'kidney';
    else if (desiredOutcome.includes('liver')) newOrgan = 'liver';
    else if (desiredOutcome.includes('lung')) newOrgan = 'lungs';
    else if (desiredOutcome.includes('intestine') || desiredOutcome.includes('gut')) newOrgan = 'intestines';

    // Update UI
    document.getElementById('molecularSize').value = newMolecularSize;
    document.getElementById('molecularSizeValue').textContent = newMolecularSize;
    state.molecularSize = newMolecularSize;

    document.getElementById('solubility').value = newSolubility;
    document.getElementById('solubilityValue').textContent = newSolubility;
    state.solubility = newSolubility;

    document.getElementById('toxicity').value = newToxicity;
    document.getElementById('toxicityValue').textContent = newToxicity;
    state.toxicity = newToxicity;

    document.getElementById('targetOrgan').value = newOrgan;
    state.targetOrgan = newOrgan;

    // Auto-run simulation
    updateAllOutputs();
    
    // Show confirmation
    const message = `Parameters auto-generated based on "${desiredOutcome}". Ready to simulate!`;
    console.log(message);
}

// ========================================
// RESET FUNCTIONALITY
// ========================================

function resetParameters() {
    // Reset to default values
    const defaults = {
        molecularSize: 350,
        solubility: 60,
        toxicity: 15,
        patientAge: 45,
        targetOrgan: 'liver'
    };

    // Reset patient profile
    state.patientName = '';
    state.patientWeight = 70;
    state.conditions = [];
    state.allergies = [];
    state.selectedDrugId = null;
    state.currentMeds = [];

    // Update sliders
    document.getElementById('molecularSize').value = defaults.molecularSize;
    document.getElementById('molecularSizeValue').textContent = defaults.molecularSize;

    document.getElementById('solubility').value = defaults.solubility;
    document.getElementById('solubilityValue').textContent = defaults.solubility;

    document.getElementById('toxicity').value = defaults.toxicity;
    document.getElementById('toxicityValue').textContent = defaults.toxicity;

    document.getElementById('patientAge').value = defaults.patientAge;
    document.getElementById('patientAgeValue').textContent = defaults.patientAge;

    document.getElementById('patientName').value = '';
    document.getElementById('patientWeight').value = state.patientWeight;
    document.getElementById('patientWeightValue').textContent = state.patientWeight;
    const conditionsSelect = document.getElementById('patientConditions');
    Array.from(conditionsSelect.options).forEach(o => (o.selected = false));
    const allergiesSelect = document.getElementById('patientAllergies');
    Array.from(allergiesSelect.options).forEach(o => (o.selected = false));
    document.getElementById('drugSelector').selectedIndex = 0;

    document.getElementById('targetOrgan').value = defaults.targetOrgan;
    document.getElementById('desiredOutcome').value = '';

    // Update state
    state.molecularSize = defaults.molecularSize;
    state.solubility = defaults.solubility;
    state.toxicity = defaults.toxicity;
    state.patientAge = defaults.patientAge;
    state.targetOrgan = defaults.targetOrgan;

    // Reset outputs
    initializeChart();
    
    // Reset AI analysis
    document.getElementById('aiPrediction').innerHTML = '<p>Adjust parameters and run simulation to generate AI analysis...</p>';
    document.getElementById('aiRisks').innerHTML = '<p>Select parameters to analyze potential risks...</p>';
    document.getElementById('aiSuggestions').innerHTML = '<ul class="suggestion-list"><li>Run simulation to receive personalized recommendations</li></ul>';
    document.getElementById('aiDosing').innerHTML = '<p>Calculate dosing regimens once simulation runs...</p>';

    // Reset metrics
    document.getElementById('effectivenessBar').style.width = '0%';
    document.getElementById('effectivenessValue').textContent = '0%';
    document.getElementById('peakConcentration').textContent = '0.0';
    document.getElementById('halfLife').textContent = '0.0 hrs';
    document.getElementById('bioavailability').textContent = '0%';
    document.getElementById('absorptionTime').textContent = '0.0 hrs';

    renderCurrentMeds();
    evaluatePrescriptionSafety();

    updateRiskIndicator();
}
