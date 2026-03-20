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
