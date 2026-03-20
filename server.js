// ============================================================
// DRUG INTERACTION LAB — Backend Server
// Express + Claude AI + RxNorm NLM Drug Interactions
// ============================================================

require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ============================================================
// HELPER: HTTPS GET with JSON parse
// ============================================================

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: { 'User-Agent': 'DrugInteractionLab/1.0' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('Invalid JSON from API')); }
            });
        });
        req.on('error', reject);
        req.setTimeout(8000, () => { req.destroy(); reject(new Error('Request timeout')); });
    });
}

// ============================================================
// POST /api/claude — Single-turn AI analysis (simulation)
// ============================================================

app.post('/api/claude', async (req, res) => {
    try {
        const { prompt, systemPrompt, maxTokens } = req.body;

        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured. Add it to .env' });
        }

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: maxTokens || 2048,
            system: systemPrompt || `You are an expert clinical pharmacologist specializing in drug interactions and pharmacokinetics.
Provide concise, evidence-based analysis. Use **bold** for key terms and risk levels.
Structure responses with clear sections. Be specific, practical, and accessible to healthcare students.`,
            messages: [{ role: 'user', content: prompt }]
        });

        res.json({ analysis: response.content[0].text, usage: response.usage });

    } catch (error) {
        console.error('Claude API error:', error.message);
        res.status(500).json({ error: error.message || 'AI analysis failed' });
    }
});

// ============================================================
// POST /api/chat — Multi-turn AI chat for the AI Chat tab
// ============================================================

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, systemContext } = req.body;

        if (!messages || !messages.length) {
            return res.status(400).json({ error: 'Messages array is required' });
        }
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
        }

        const systemPrompt = `You are an expert clinical pharmacologist and drug safety specialist assisting with a drug interaction simulation lab.
You provide evidence-based, educational information about drug interactions, pharmacokinetics, dosing, and patient safety.
${systemContext ? `\nCurrent simulation context:\n${systemContext}` : ''}

Guidelines:
- Be clear, accurate, and educational
- Always mention relevant safety considerations when discussing drug combinations
- Use plain language accessible to healthcare students while remaining scientifically accurate
- Cite mechanisms of interaction when known (e.g., CYP enzyme inhibition, protein binding displacement)
- Format responses with **bold** for drug names and key risks
- Keep responses concise but complete (under 300 words unless more detail is needed)
- Always recommend professional medical consultation for clinical decisions`;

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: systemPrompt,
            messages
        });

        res.json({ reply: response.content[0].text, usage: response.usage });

    } catch (error) {
        console.error('Chat API error:', error.message);
        res.status(500).json({ error: error.message || 'Chat failed' });
    }
});

// ============================================================
// GET /api/rxnorm — Real drug interactions from NLM RxNorm
// ============================================================

app.get('/api/rxnorm', async (req, res) => {
    const { drugs } = req.query; // comma-separated drug names
    if (!drugs) return res.status(400).json({ error: 'drugs query param required' });

    const drugNames = drugs.split(',').map(d => d.trim()).filter(Boolean);
    if (drugNames.length < 2) {
        return res.json({ interactions: [], rxcuis: [], message: 'Need at least 2 drugs' });
    }

    try {
        // Step 1: Resolve RxCUIs for each drug name
        const rxcuiPromises = drugNames.map(name =>
            httpsGet(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}&search=1`)
                .catch(() => null)
        );
        const rxcuiRaw = await Promise.all(rxcuiPromises);

        const rxcuis = rxcuiRaw.map((data, i) => ({
            name: drugNames[i],
            rxcui: data?.idGroup?.rxnormId?.[0] || null
        })).filter(d => d.rxcui);

        if (rxcuis.length < 2) {
            return res.json({
                interactions: [],
                rxcuis,
                warning: 'Could not resolve RxCUI for all drugs — using local interaction data'
            });
        }

        // Step 2: Fetch interaction data
        const rxcuiList = rxcuis.map(d => d.rxcui).join('+');
        const intData = await httpsGet(
            `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuiList}`
        ).catch(() => ({ fullInteractionTypeGroup: [] }));

        // Step 3: Parse interactions
        const interactions = [];
        const fullInteractionTypeGroup = intData.fullInteractionTypeGroup || [];

        fullInteractionTypeGroup.forEach(group => {
            (group.fullInteractionType || []).forEach(type => {
                (type.interactionPair || []).forEach(pair => {
                    const concepts = pair.interactionConcept || [];
                    if (concepts.length >= 2) {
                        interactions.push({
                            drug1: concepts[0].minConceptItem?.name || '',
                            drug2: concepts[1].minConceptItem?.name || '',
                            severity: pair.severity || 'N/A',
                            description: pair.description || '',
                            source: group.sourceName || 'RxNorm/NLM'
                        });
                    }
                });
            });
        });

        // Deduplicate
        const seen = new Set();
        const unique = interactions.filter(ix => {
            const key = [ix.drug1, ix.drug2].sort().join('|');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        res.json({ interactions: unique, rxcuis });

    } catch (error) {
        console.error('RxNorm error:', error.message);
        res.json({ interactions: [], error: error.message });
    }
});

// ============================================================
// GET /api/health — Status check
// ============================================================

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        claudeConfigured: !!process.env.ANTHROPIC_API_KEY,
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// In-process drug data cache (TTL: 1hr per entry)
// ============================================================

const drugLookupCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

// ============================================================
// GET /api/drug-lookup — Real PK data from PubChem + OpenFDA + Claude
// ============================================================

app.get('/api/drug-lookup', async (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'name param required' });

    const cacheKey = name.toLowerCase();
    const cached = drugLookupCache.get(cacheKey);
    if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
        return res.json(cached.data);
    }

    try {
        const [pubchemResult, fdaResult] = await Promise.allSettled([
            httpsGet(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/MolecularFormula,MolecularWeight/JSON`),
            httpsGet(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:%22${encodeURIComponent(name)}%22&limit=1`)
        ]);

        const compound = pubchemResult.status === 'fulfilled'
            ? pubchemResult.value?.PropertyTable?.Properties?.[0] : null;
        const label = fdaResult.status === 'fulfilled'
            ? fdaResult.value?.results?.[0] : null;

        if (!label && !compound) {
            // Try brand name search
            const brandResult = await httpsGet(
                `https://api.fda.gov/drug/label.json?search=openfda.brand_name:%22${encodeURIComponent(name)}%22&limit=1`
            ).catch(() => null);
            if (!brandResult?.results?.[0]) {
                return res.status(404).json({ error: `No data found for "${name}"` });
            }
        }

        let pkParams = null;
        const clinPharm = label?.clinical_pharmacology?.[0] || label?.pharmacokinetics?.[0] || '';

        if (clinPharm.length > 80 && process.env.ANTHROPIC_API_KEY) {
            try {
                const pkResponse = await anthropic.messages.create({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 600,
                    messages: [{
                        role: 'user',
                        content: `Extract pharmacokinetic parameters from this FDA drug label text for the drug "${name}". Return ONLY valid JSON (no markdown, no explanation outside the JSON object):
{
  "halfLife": <number in hours, or null if not found>,
  "bioavailability": <number 0 to 1 (fraction, not percent), or null>,
  "Vd": <volume of distribution in L/kg, or null>,
  "Tmax": <time to peak concentration in hours, or null>,
  "proteinBinding": <protein binding percentage 0-100, or null>,
  "drugClass": "<drug class name>",
  "mechanism": "<1-2 sentence mechanism of action>",
  "uses": ["<indication1>", "<indication2>"]
}

Label text:
${clinPharm.substring(0, 2500)}`
                    }]
                });
                const text = pkResponse.content[0].text.trim();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) pkParams = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.log('PK extraction failed:', e.message);
            }
        }

        const data = {
            name: label?.openfda?.generic_name?.[0] || name,
            brandName: label?.openfda?.brand_name?.[0] || '',
            genericName: label?.openfda?.generic_name?.[0] || name,
            drugClass: pkParams?.drugClass || label?.openfda?.pharm_class_epc?.[0] || 'Unknown',
            manufacturer: label?.openfda?.manufacturer_name?.[0] || '',
            pkParams: pkParams || {},
            molecularFormula: compound?.MolecularFormula || '',
            molecularWeight: compound?.MolecularWeight || null,
            fdaLabel: {
                indications: label?.indications_and_usage?.[0]?.substring(0, 400) || '',
                warnings: label?.warnings?.[0]?.substring(0, 300) || '',
                contraindications: label?.contraindications?.[0]?.substring(0, 300) || '',
                drugInteractions: label?.drug_interactions?.[0]?.substring(0, 400) || '',
                clinicalPharmacology: clinPharm.substring(0, 600)
            },
            source: [compound ? 'pubchem' : null, label ? 'openfda' : null, pkParams ? 'claude-pk' : null].filter(Boolean).join('+')
        };

        drugLookupCache.set(cacheKey, { data, fetchedAt: Date.now() });
        res.json(data);

    } catch (error) {
        console.error('Drug lookup error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// GET /api/condition-drugs — Drugs for a condition from OpenFDA
// ============================================================

app.get('/api/condition-drugs', async (req, res) => {
    const { condition } = req.query;
    if (!condition) return res.status(400).json({ error: 'condition param required' });

    try {
        const data = await httpsGet(
            `https://api.fda.gov/drug/label.json?search=indications_and_usage:%22${encodeURIComponent(condition)}%22&limit=20`
        );

        const seen = new Set();
        const drugs = (data.results || []).map(r => {
            const generic = r.openfda?.generic_name?.[0];
            const brand = r.openfda?.brand_name?.[0];
            const name = generic || brand;
            if (!name || seen.has(name.toLowerCase())) return null;
            seen.add(name.toLowerCase());
            return {
                name,
                brandName: brand || '',
                genericName: generic || '',
                drugClass: r.openfda?.pharm_class_epc?.[0] || '',
                indications: r.indications_and_usage?.[0]?.substring(0, 250) || '',
                clinicalPharmacology: r.clinical_pharmacology?.[0]?.substring(0, 500) || '',
                warnings: r.warnings?.[0]?.substring(0, 200) || ''
            };
        }).filter(Boolean).slice(0, 12);

        res.json({ condition, drugs, total: data.meta?.results?.total || drugs.length });

    } catch (error) {
        console.error('Condition drugs error:', error.message);
        res.status(500).json({ error: error.message, drugs: [] });
    }
});

// ============================================================
// POST /api/ml-discover — ML + Tabular Regression drug combo prediction
// ============================================================

app.post('/api/ml-discover', async (req, res) => {
    const { condition, drugs, patientProfile } = req.body;

    if (!condition) return res.status(400).json({ error: 'condition required' });
    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({ error: 'Claude AI required for ML discovery. Configure ANTHROPIC_API_KEY.' });
    }

    try {
        const drugRows = (drugs || []).map(d => {
            const pk = d.pkParams || {};
            return `| ${d.name} | ${d.drugClass || 'Unknown'} | ${pk.halfLife != null ? pk.halfLife + 'h' : '?'} | ${pk.bioavailability != null ? (pk.bioavailability * 100).toFixed(0) + '%' : '?'} | ${pk.Vd != null ? pk.Vd + ' L/kg' : '?'} | ${pk.proteinBinding != null ? pk.proteinBinding + '%' : '?'} | ${(pk.mechanism || '').substring(0, 80) || d.drugClass || '—'} |`;
        }).join('\n');

        const patientStr = patientProfile
            ? `Age: ${patientProfile.age}y, Weight: ${patientProfile.weight}kg, eGFR: ${patientProfile.kidneyFunction}%, Liver: ${patientProfile.liverFunction}`
            : 'Standard adult patient';

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 3500,
            system: `You are a computational pharmacologist specializing in multi-target drug combination therapy and ML-based drug repurposing. You apply tabular regression analysis to pharmacokinetic and pharmacodynamic property matrices to identify optimal drug combinations. You evaluate feature importance, property correlations, mechanistic synergy, and PK compatibility.`,
            messages: [{
                role: 'user',
                content: `Apply tabular regression and ML analysis to predict optimal drug combinations for: **${condition}**

## Drug Property Feature Matrix (Input Data)
| Drug | Class | Half-Life | Bioavailability | Vd | Protein Binding | Mechanism |
|------|-------|-----------|-----------------|----|-----------------|-----------|
${drugRows}

## Patient Profile: ${patientStr}

## ML Analysis Tasks:
1. **Feature Importance Analysis**: Which PK/PD properties most predict efficacy for ${condition}?
2. **Synergy Regression**: Score drug pairs by complementary mechanisms and additive properties
3. **PK Compatibility Regression**: Match drugs with compatible half-lives and absorption profiles
4. **Novel Property Combinations**: Identify non-obvious combinations based on property analysis

Return ONLY valid JSON (no markdown code blocks, no explanation outside the JSON):
{
  "regressionInsights": {
    "keyFeatures": ["feature1", "feature2", "feature3"],
    "featureImportance": {"halfLife": 0.0, "Vd": 0.0, "bioavailability": 0.0, "proteinBinding": 0.0, "mechanism": 0.0},
    "correlationSummary": "2-3 sentences about property-efficacy correlations found",
    "methodology": "brief description of regression approach used"
  },
  "combinations": [
    {
      "drugs": ["Drug1", "Drug2"],
      "combinedScore": 0.87,
      "synergyType": "complementary",
      "mechanismSynergy": "why these mechanisms work together for this condition",
      "pkCompatibility": "PK profile compatibility explanation",
      "confidenceLevel": "high",
      "novelty": "established",
      "simulationParams": {
        "drug1": {
          "name": "Drug1",
          "suggestedDose": 500,
          "frequency": "bid",
          "halfLife": 6.5,
          "bioavailability": 0.5,
          "Vd": 4.6,
          "Tmax": 2.5,
          "proteinBinding": 0
        },
        "drug2": {
          "name": "Drug2",
          "suggestedDose": 100,
          "frequency": "single",
          "halfLife": 12,
          "bioavailability": 0.7,
          "Vd": 1.0,
          "Tmax": 2.0,
          "proteinBinding": 50
        }
      },
      "warnings": ["safety consideration"],
      "evidenceBase": "clinical"
    }
  ],
  "topRecommendation": "1-2 sentence summary of the best combination and why",
  "safetyNotes": ["note1", "note2"]
}`
            }]
        });

        const text = response.content[0].text.trim();
        let result = null;
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) result = JSON.parse(jsonMatch[0]);
        } catch (e) {
            return res.json({ success: false, rawText: text, error: 'JSON parse failed' });
        }

        res.json({ success: true, condition, result, usage: response.usage });

    } catch (error) {
        console.error('ML discover error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
    console.log(`\n🔬 Drug Interaction Lab running at http://localhost:${PORT}`);
    if (!process.env.ANTHROPIC_API_KEY) {
        console.log(`   ⚠️  ANTHROPIC_API_KEY not set — add it to a .env file`);
        console.log(`       Template analysis will be used instead of Claude AI`);
    } else {
        console.log(`   ✅ Claude AI (claude-sonnet-4-6) configured`);
    }
    console.log(`   ✅ RxNorm/NLM drug interaction API active (no key required)`);
    console.log(`   ✅ OpenFDA API active (no key required)`);
    console.log(`   Open http://localhost:${PORT} in your browser\n`);
});
