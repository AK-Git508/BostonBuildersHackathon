// ========================================
// DRUG SIMULATION ENGINE - Backend Server
// Express + Claude API Proxy
// ========================================

require('dotenv').config();
const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

// ========================================
// CLAUDE API PROXY ENDPOINT
// ========================================

app.post('/api/claude', async (req, res) => {
    try {
        const { prompt, systemPrompt, maxTokens } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(503).json({
                error: 'ANTHROPIC_API_KEY not configured. Set it in your .env file.'
            });
        }

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: maxTokens || 2048,
            system: systemPrompt || `You are an expert clinical pharmacologist and drug safety analyst.
Provide concise, evidence-based analysis of drug properties, pharmacokinetics, safety profiles, and clinical recommendations.
Use precise medical terminology but ensure explanations are accessible to healthcare professionals.
Format responses with clear sections using **bold** for emphasis. Keep responses focused and practical.`,
            messages: [{ role: 'user', content: prompt }]
        });

        res.json({
            analysis: response.content[0].text,
            usage: response.usage
        });

    } catch (error) {
        console.error('Claude API error:', error.message);
        res.status(500).json({
            error: error.message || 'AI analysis failed',
            code: error.status || 500
        });
    }
});

// ========================================
// HEALTH CHECK
// ========================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        claudeConfigured: !!process.env.ANTHROPIC_API_KEY,
        timestamp: new Date().toISOString()
    });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
    console.log(`\n🚀 Drug Simulation Engine running at http://localhost:${PORT}`);
    console.log(`\n📋 Setup:`);
    if (!process.env.ANTHROPIC_API_KEY) {
        console.log(`   ⚠️  ANTHROPIC_API_KEY not set. Create a .env file with:`);
        console.log(`       ANTHROPIC_API_KEY=your_key_here`);
        console.log(`   Claude AI analysis will not be available.`);
    } else {
        console.log(`   ✅ Claude AI is configured and ready`);
    }
    console.log(`   ✅ OpenFDA integration is active (no key required)`);
    console.log(`\n   Open http://localhost:${PORT} in your browser\n`);
});
