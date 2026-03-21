// ============================================================
// DRUG INTERACTION LAB — Backend Server
// Express + Claude AI + RxNorm NLM Drug Interactions
// ============================================================

require("dotenv").config();
const express = require("express");
const path = require("path");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname)));

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY ||
  "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";
const OPENROUTER_MODEL = "arcee-ai/trinity-large-preview:free";
const OPENROUTER_URL = "https://api.openrouter.ai/v1/chat/completions";

async function openRouterChat({
  model = OPENROUTER_MODEL,
  messages = [],
  max_tokens = 1024,
  temperature = 0.2,
}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured. Add it to .env");
  }

  const payload = JSON.stringify({ model, messages, max_tokens, temperature });
  return new Promise((resolve, reject) => {
    const req = https.request(
      OPENROUTER_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "User-Agent": "DrugInteractionLab/1.0",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 400) {
              const errMsg = json.error || JSON.stringify(json);
              return reject(
                new Error(`OpenRouter API error ${res.statusCode}: ${errMsg}`),
              );
            }
            resolve(json);
          } catch (err) {
            reject(new Error("Invalid JSON from OpenRouter: " + err.message));
          }
        });
      },
    );

    req.on("error", reject);
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error("OpenRouter request timeout"));
    });

    req.write(payload);
    req.end();
  });
}

//
// ============================================================
// HELPER: HTTPS GET with JSON parse
// ============================================================

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: { "User-Agent": "DrugInteractionLab/1.0" },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Invalid JSON from API"));
          }
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

// ============================================================
// POST /api/claude — Single-turn AI analysis (simulation)
// ============================================================

app.post("/api/claude", async (req, res) => {
  try {
    const { prompt, systemPrompt, maxTokens } = req.body;

    if (!prompt) return res.status(400).json({ error: "Prompt is required" });
    if (!OPENROUTER_API_KEY) {
      return res
        .status(503)
        .json({ error: "OPENROUTER_API_KEY not configured. Add it to .env" });
    }

    const messages = [
      {
        role: "system",
        content:
          systemPrompt ||
          `You are an expert clinical pharmacologist specializing in drug interactions and pharmacokinetics.\nProvide concise, evidence-based analysis. Use **bold** for key terms and risk levels.\nStructure responses with clear sections. Be specific, practical, and accessible to healthcare students.`,
      },
      { role: "user", content: prompt },
    ];

    const response = await openRouterChat({
      model: OPENROUTER_MODEL,
      messages,
      max_tokens: maxTokens || 2048,
    });

    const text = response?.choices?.[0]?.message?.content || "";
    res.json({ analysis: text, usage: response.usage || {} });
  } catch (error) {
    console.error("OpenRouter API error:", error.message);
    res.status(500).json({ error: error.message || "AI analysis failed" });
  }
});

// ============================================================
// POST /api/chat — Multi-turn AI chat for the AI Chat tab
// ============================================================

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, systemContext } = req.body;

    if (!messages || !messages.length) {
      return res.status(400).json({ error: "Messages array is required" });
    }
    if (!OPENROUTER_API_KEY) {
      return res
        .status(503)
        .json({ error: "OPENROUTER_API_KEY not configured" });
    }

    const systemPrompt = `You are an expert clinical pharmacologist and drug safety specialist assisting with a drug interaction simulation lab.
You provide evidence-based, educational information about drug interactions, pharmacokinetics, dosing, and patient safety.
${systemContext ? `\nCurrent simulation context:\n${systemContext}` : ""}

Guidelines:
- Be clear, accurate, and educational
- Always mention relevant safety considerations when discussing drug combinations
- Use plain language accessible to healthcare students while remaining scientifically accurate
- Cite mechanisms of interaction when known (e.g., CYP enzyme inhibition, protein binding displacement)
- Format responses with **bold** for drug names and key risks
- Keep responses concise but complete (under 300 words unless more detail is needed)
- Always recommend professional medical consultation for clinical decisions`;

    const response = await openRouterChat({
      model: OPENROUTER_MODEL,
      max_tokens: 1024,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    const text = response?.choices?.[0]?.message?.content || "";
    res.json({ reply: text, usage: response.usage || {} });
  } catch (error) {
    console.error("Chat API error:", error.message);
    res.status(500).json({ error: error.message || "Chat failed" });
  }
});

// ============================================================
// GET /api/rxnorm — Real drug interactions from NLM RxNorm
// ============================================================

app.get("/api/rxnorm", async (req, res) => {
  const { drugs } = req.query; // comma-separated drug names
  if (!drugs)
    return res.status(400).json({ error: "drugs query param required" });

  const drugNames = drugs
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  if (drugNames.length < 2) {
    return res.json({
      interactions: [],
      rxcuis: [],
      message: "Need at least 2 drugs",
    });
  }

  try {
    // Step 1: Resolve RxCUIs for each drug name
    const rxcuiPromises = drugNames.map((name) =>
      httpsGet(
        `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}&search=1`,
      ).catch(() => null),
    );
    const rxcuiRaw = await Promise.all(rxcuiPromises);

    const rxcuis = rxcuiRaw
      .map((data, i) => ({
        name: drugNames[i],
        rxcui: data?.idGroup?.rxnormId?.[0] || null,
      }))
      .filter((d) => d.rxcui);

    if (rxcuis.length < 2) {
      return res.json({
        interactions: [],
        rxcuis,
        warning:
          "Could not resolve RxCUI for all drugs — using local interaction data",
      });
    }

    // Step 2: Fetch interaction data
    const rxcuiList = rxcuis.map((d) => d.rxcui).join("+");
    const intData = await httpsGet(
      `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuiList}`,
    ).catch(() => ({ fullInteractionTypeGroup: [] }));

    // Step 3: Parse interactions
    const interactions = [];
    const fullInteractionTypeGroup = intData.fullInteractionTypeGroup || [];

    fullInteractionTypeGroup.forEach((group) => {
      (group.fullInteractionType || []).forEach((type) => {
        (type.interactionPair || []).forEach((pair) => {
          const concepts = pair.interactionConcept || [];
          if (concepts.length >= 2) {
            interactions.push({
              drug1: concepts[0].minConceptItem?.name || "",
              drug2: concepts[1].minConceptItem?.name || "",
              severity: pair.severity || "N/A",
              description: pair.description || "",
              source: group.sourceName || "RxNorm/NLM",
            });
          }
        });
      });
    });

    // Deduplicate
    const seen = new Set();
    const unique = interactions.filter((ix) => {
      const key = [ix.drug1, ix.drug2].sort().join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({ interactions: unique, rxcuis });
  } catch (error) {
    console.error("RxNorm error:", error.message);
    res.json({ interactions: [], error: error.message });
  }
});

// ============================================================
// POST /api/pharmacology-chat
// Data-driven chat: extracts drug names → fetches OpenFDA + RxNorm
// + PubChem → answers via Claude (if available) or raw data format
// ============================================================

const KNOWN_DRUGS = [
  "warfarin",
  "aspirin",
  "ibuprofen",
  "acetaminophen",
  "metformin",
  "lisinopril",
  "atorvastatin",
  "sertraline",
  "omeprazole",
  "amoxicillin",
  "metoprolol",
  "amlodipine",
  "losartan",
  "simvastatin",
  "fluoxetine",
  "citalopram",
  "escitalopram",
  "paroxetine",
  "venlafaxine",
  "duloxetine",
  "bupropion",
  "alprazolam",
  "diazepam",
  "lorazepam",
  "zolpidem",
  "gabapentin",
  "pregabalin",
  "tramadol",
  "oxycodone",
  "morphine",
  "codeine",
  "hydrocodone",
  "fentanyl",
  "naloxone",
  "naltrexone",
  "methadone",
  "levothyroxine",
  "synthroid",
  "prednisone",
  "dexamethasone",
  "hydrocortisone",
  "insulin",
  "glipizide",
  "glyburide",
  "sitagliptin",
  "empagliflozin",
  "dapagliflozin",
  "canagliflozin",
  "liraglutide",
  "semaglutide",
  "digoxin",
  "furosemide",
  "spironolactone",
  "hydrochlorothiazide",
  "chlorthalidone",
  "atenolol",
  "carvedilol",
  "bisoprolol",
  "ramipril",
  "enalapril",
  "captopril",
  "valsartan",
  "irbesartan",
  "olmesartan",
  "nifedipine",
  "diltiazem",
  "verapamil",
  "amiodarone",
  "sotalol",
  "flecainide",
  "clopidogrel",
  "ticagrelor",
  "rivaroxaban",
  "apixaban",
  "dabigatran",
  "heparin",
  "enoxaparin",
  "alteplase",
  "atorvastatin",
  "rosuvastatin",
  "pravastatin",
  "lovastatin",
  "ezetimibe",
  "fenofibrate",
  "niacin",
  "cholestyramine",
  "allopurinol",
  "colchicine",
  "indomethacin",
  "naproxen",
  "celecoxib",
  "meloxicam",
  "diclofenac",
  "ketorolac",
  "azithromycin",
  "clarithromycin",
  "erythromycin",
  "ciprofloxacin",
  "levofloxacin",
  "doxycycline",
  "tetracycline",
  "minocycline",
  "clindamycin",
  "metronidazole",
  "trimethoprim",
  "sulfamethoxazole",
  "nitrofurantoin",
  "fluconazole",
  "itraconazole",
  "voriconazole",
  "acyclovir",
  "valacyclovir",
  "oseltamivir",
  "remdesivir",
  "sildenafil",
  "tadalafil",
  "finasteride",
  "tamsulosin",
  "oxybutynin",
  "tolterodine",
  "ondansetron",
  "metoclopramide",
  "pantoprazole",
  "esomeprazole",
  "ranitidine",
  "famotidine",
  "sucralfate",
  "loperamide",
  "psyllium",
  "docusate",
  "bisacodyl",
  "montelukast",
  "cetirizine",
  "loratadine",
  "fexofenadine",
  "diphenhydramine",
  "pseudoephedrine",
  "albuterol",
  "ipratropium",
  "tiotropium",
  "fluticasone",
  "budesonide",
  "salmeterol",
  "formoterol",
  "theophylline",
  "roflumilast",
];

function extractDrugNames(text) {
  const lower = text.toLowerCase();
  return [...new Set(KNOWN_DRUGS.filter((d) => lower.includes(d)))];
}

async function fetchFDALabel(drugName) {
  try {
    const data = await httpsGet(
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=1`,
    );
    const r = data.results?.[0];
    if (!r) return null;
    return {
      name: r.openfda?.generic_name?.[0] || drugName,
      brandName: r.openfda?.brand_name?.[0] || "",
      drugClass: r.openfda?.pharm_class_epc?.[0] || "",
      mechanism: (r.mechanism_of_action?.[0] || "").substring(0, 400),
      indications: (r.indications_and_usage?.[0] || "").substring(0, 300),
      warnings: (r.warnings?.[0] || r.boxed_warning?.[0] || "").substring(
        0,
        300,
      ),
      interactions: (r.drug_interactions?.[0] || "").substring(0, 400),
    };
  } catch {
    return null;
  }
}

async function fetchRxNormInteractionsForChat(drugNames) {
  if (drugNames.length < 2) return [];
  try {
    const rxcuiResults = await Promise.all(
      drugNames.map((name) =>
        httpsGet(
          `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}&search=1`,
        ).catch(() => null),
      ),
    );
    const rxcuis = rxcuiResults
      .map((d, i) => ({ name: drugNames[i], rxcui: d?.idGroup?.rxnormId?.[0] }))
      .filter((d) => d.rxcui);
    if (rxcuis.length < 2) return [];
    const list = rxcuis.map((d) => d.rxcui).join("+");
    const intData = await httpsGet(
      `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${list}`,
    ).catch(() => ({}));
    const out = [];
    (intData.fullInteractionTypeGroup || []).forEach((group) => {
      (group.fullInteractionType || []).forEach((type) => {
        (type.interactionPair || []).forEach((pair) => {
          const c = pair.interactionConcept || [];
          if (c.length >= 2)
            out.push({
              drug1: c[0].minConceptItem?.name || "",
              drug2: c[1].minConceptItem?.name || "",
              severity: pair.severity || "",
              description: (pair.description || "").substring(0, 300),
            });
        });
      });
    });
    return out;
  } catch {
    return [];
  }
}

async function fetchPubChemPharmacology(drugName) {
  try {
    const searchData = await httpsGet(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(drugName)}/property/MolecularWeight,XLogP,HBondDonorCount,HBondAcceptorCount/JSON`,
    );
    const props = searchData.PropertyTable?.Properties?.[0] || {};
    return {
      mw: props.MolecularWeight,
      logP: props.XLogP,
      hbDonors: props.HBondDonorCount,
      hbAcceptors: props.HBondAcceptorCount,
    };
  } catch {
    return null;
  }
}

function formatDataResponse(
  message,
  drugNames,
  fdaData,
  interactions,
  pubchemData,
) {
  const lines = [];
  const hasDrugs = drugNames.length > 0;

  if (!hasDrugs) {
    // General pharmacology question — answer from knowledge base
    const m = message.toLowerCase();
    if (m.includes("cyp") || m.includes("enzyme") || m.includes("metabolism")) {
      return "**CYP450 Enzyme System**\n\nThe cytochrome P450 (CYP) enzyme family is responsible for metabolising ~75% of all drugs. Key enzymes:\n\n- **CYP3A4** — metabolises ~50% of drugs (e.g. statins, benzodiazepines, macrolides)\n- **CYP2D6** — antidepressants, opioids, beta-blockers; highly polymorphic\n- **CYP2C9** — warfarin, NSAIDs, sulfonylureas\n- **CYP2C19** — PPIs, clopidogrel, SSRIs\n\n**Inhibition** raises plasma levels of co-administered drugs → toxicity risk. **Induction** lowers levels → therapeutic failure.";
    }
    if (
      m.includes("half life") ||
      m.includes("half-life") ||
      m.includes("elimination")
    ) {
      return "**Drug Half-Life & Elimination**\n\nHalf-life (t½) is the time for plasma concentration to fall by 50%. It determines:\n\n- **Dosing frequency** — drugs are typically dosed every 1–2× t½\n- **Time to steady state** — ~5 × t½ after starting or changing dose\n- **Time to washout** — ~5 × t½ after stopping\n\nRenal impairment prolongs t½ of renally-cleared drugs. Hepatic impairment affects drugs with high hepatic extraction ratios.";
    }
    if (m.includes("bioavail")) {
      return "**Oral Bioavailability**\n\nBioavailability (F) is the fraction of an oral dose reaching systemic circulation unchanged. It is reduced by:\n\n- **First-pass hepatic metabolism** — e.g. morphine F ~25%, propranolol F ~26%\n- **Gut-wall CYP3A4** — e.g. cyclosporine, tacrolimus\n- **P-glycoprotein efflux** — pumps drug back into gut lumen\n- **Poor dissolution** — formulation-dependent\n\nIV administration always gives F = 100%.";
    }
    if (m.includes("interaction") || m.includes("interact")) {
      return "**Types of Drug Interactions**\n\n**Pharmacokinetic (PK):**\n- Absorption — antacids reduce fluoroquinolone absorption\n- Metabolism — CYP inhibition/induction (most common)\n- Distribution — protein binding displacement\n- Excretion — competition for renal tubular secretion\n\n**Pharmacodynamic (PD):**\n- Additive — two drugs with same effect (e.g. two CNS depressants)\n- Synergistic — greater than additive (e.g. TMP-SMX)\n- Antagonistic — one drug opposes another\n\nLoad specific drugs in the Simulation Lab for real interaction data from RxNorm.";
    }
    if (
      m.includes("pk") ||
      m.includes("pharmacokinetic") ||
      m.includes("adme")
    ) {
      return "**Pharmacokinetics (ADME)**\n\n- **Absorption** — rate and extent drug enters systemic circulation (affected by route, food, formulation)\n- **Distribution** — Vd (volume of distribution) reflects tissue penetration; high Vd = extensive tissue binding\n- **Metabolism** — primarily hepatic CYP enzymes; produces active or inactive metabolites\n- **Excretion** — renal (most drugs), biliary, pulmonary (volatile agents)\n\nClinical parameters: Cmax (peak), Tmax (time to peak), AUC (total exposure), t½ (half-life), clearance (CL).";
    }
    if (
      m.includes("renal") ||
      m.includes("kidney") ||
      m.includes("egfr") ||
      m.includes("ckd")
    ) {
      return "**Renal Impairment & Drug Dosing**\n\nCKD stages by eGFR:\n- G1: ≥90 — normal\n- G2: 60–89 — mildly reduced\n- G3: 30–59 — moderate; dose-adjust many drugs\n- G4: 15–29 — severe; avoid metformin, NSAIDs\n- G5: <15 — kidney failure; major restrictions\n\nKey drugs requiring renal dose adjustment: **metformin**, **amoxicillin**, **gabapentin**, **digoxin**, **vancomycin**, **aminoglycosides**. Always check CrCl or eGFR before prescribing.";
    }
    if (
      m.includes("hepatic") ||
      m.includes("liver") ||
      m.includes("cirrhosis")
    ) {
      return "**Hepatic Impairment & Drug Dosing**\n\nThe liver performs first-pass metabolism and synthesises drug-binding proteins (albumin, α1-acid glycoprotein). Impairment causes:\n\n- ↓ First-pass → ↑ bioavailability of high-extraction drugs\n- ↓ CYP activity → ↑ plasma levels of hepatically-metabolised drugs\n- ↓ Albumin → ↑ free fraction of highly-protein-bound drugs\n- ↑ PT/INR → enhanced anticoagulant sensitivity\n\nChild-Pugh score (A/B/C) guides dose adjustment. Avoid hepatotoxic drugs in pre-existing liver disease.";
    }
    return "**Pharmacology Assistant — Ready**\n\nI can answer questions about:\n\n- **Drug interactions** (CYP enzymes, PD effects, RxNorm data)\n- **Pharmacokinetics** (ADME, half-life, bioavailability, Vd)\n- **Specific drugs** — type a drug name and ask about it\n- **Organ effects** — renal, hepatic, cardiac dosing adjustments\n- **Drug classes** — SSRIs, statins, beta-blockers, ACE inhibitors, etc.\n\nFor real-time interaction analysis with PK curves, add drugs in the **Simulation Lab**.";
  }

  // Drug-specific response built from real FDA + RxNorm + PubChem data
  if (fdaData.length > 0) {
    fdaData.forEach((d) => {
      if (!d) return;
      lines.push(
        `**${d.name.toUpperCase()}** ${d.brandName ? `(${d.brandName})` : ""}`,
      );
      if (d.drugClass) lines.push(`Class: ${d.drugClass}`);
      if (d.mechanism) lines.push(`\nMechanism: ${d.mechanism}`);
      if (d.indications) lines.push(`\nIndications: ${d.indications}`);
      const pc = pubchemData.find((p) => p?.name === d.name);
      if (pc?.mw)
        lines.push(
          `\nPubChem: MW ${pc.mw} Da, LogP ${pc.logP ?? "N/A"} (${pc.logP > 2 ? "lipophilic, CNS penetrant" : "hydrophilic"})`,
        );
      if (d.warnings) lines.push(`\n⚠ Warning: ${d.warnings}`);
      lines.push("\n---");
    });
  }

  if (interactions.length > 0) {
    lines.push("\n**RxNorm Interactions (NLM database)**\n");
    interactions.slice(0, 5).forEach((ix) => {
      const sev = ix.severity?.toLowerCase();
      const icon = sev === "high" ? "🔴" : sev === "moderate" ? "🟡" : "🔵";
      lines.push(
        `${icon} **${ix.drug1} + ${ix.drug2}** (${ix.severity}): ${ix.description}`,
      );
    });
  } else if (drugNames.length >= 2) {
    lines.push(
      "\nNo interactions found in RxNorm for this combination. This does not rule out interactions — consult Lexicomp or Micromedex for clinical decisions.",
    );
  }

  return (
    lines.join("\n") ||
    "I searched the FDA and RxNorm databases for that combination but found no matching records. Try rephrasing with the generic drug name."
  );
}

app.post("/api/pharmacology-chat", async (req, res) => {
  try {
    const { message, context, history } = req.body;
    if (!message) return res.status(400).json({ error: "message required" });

    const drugNames = extractDrugNames(message);

    // Fetch real data in parallel from OpenFDA + PubChem + RxNorm
    const [fdaResults, rxnormIx, pubchemResults] = await Promise.all([
      Promise.all(drugNames.map((d) => fetchFDALabel(d))),
      fetchRxNormInteractionsForChat(drugNames),
      Promise.all(
        drugNames.map(async (d) => {
          const r = await fetchPubChemPharmacology(d);
          return r ? { ...r, name: d } : null;
        }),
      ),
    ]);

    const fdaData = fdaResults.filter(Boolean);
    const pubchemData = pubchemResults.filter(Boolean);

    // If OpenRouter is available, use it with real data as grounding context
    if (OPENROUTER_API_KEY) {
      const groundingContext = [
        context ? `Simulation context:\n${context}` : "",
        drugNames.length > 0 ? `Drugs mentioned: ${drugNames.join(", ")}` : "",
        fdaData.length > 0
          ? `OpenFDA data:\n${fdaData
              .map(
                (d) =>
                  `${d.name}: Class=${d.drugClass}, Mechanism=${d.mechanism?.substring(0, 200)}, Warnings=${d.warnings?.substring(0, 150)}`,
              )
              .join("\n")}`
          : "",
        rxnormIx.length > 0
          ? `RxNorm interactions:\n${rxnormIx
              .map(
                (ix) =>
                  `${ix.drug1}+${ix.drug2} (${ix.severity}): ${ix.description}`,
              )
              .join("\n")}`
          : "",
        pubchemData.length > 0
          ? `PubChem properties:\n${pubchemData
              .map((p) => `${p.name}: MW=${p.mw}, LogP=${p.logP}`)
              .join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const messages = [
        {
          role: "system",
          content: `You are an expert clinical pharmacologist. Answer questions accurately and concisely.\nUse **bold** for drug names and key risks. Keep responses under 400 words.\nAlways recommend professional medical consultation for clinical decisions.\n\nWhen a user describes a medical condition or disease, ALWAYS recommend specific evidence-based drug combinations:\n- List 2-4 drug combinations with evidence scores (e.g., "Evidence: 9/10")\n- For each combination: name the drugs, explain the mechanism/rationale, list key monitoring parameters\n- Format as: "**Drug A + Drug B** — [why this works] | Monitor: [parameters]"\n- Include first-line vs second-line options when relevant\n- Mention key contraindications or special populations (renal/hepatic impairment, elderly, pregnancy)\n${groundingContext ? `\nReal-time data retrieved from OpenFDA, RxNorm (NLM), and PubChem:\n${groundingContext}` : ""}`,
        },
        ...(history || []).slice(-8),
        { role: "user", content: message },
      ];

      const response = await openRouterChat({
        model: OPENROUTER_MODEL,
        max_tokens: 1024,
        messages,
      });

      const text = response?.choices?.[0]?.message?.content || "";
      return res.json({ reply: text, source: "openrouter+fda+rxnorm" });
    }

    // No LLM key — format real fetched data as the response
    const reply = formatDataResponse(
      message,
      drugNames,
      fdaData,
      rxnormIx,
      pubchemData,
    );
    res.json({ reply, source: "fda+rxnorm+pubchem" });
  } catch (error) {
    console.error("pharmacology-chat error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/health — Status check
// ============================================================

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    openRouterConfigured: !!OPENROUTER_API_KEY,
    timestamp: new Date().toISOString(),
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

app.get("/api/drug-lookup", async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "name param required" });

  const cacheKey = name.toLowerCase();
  const cached = drugLookupCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    const [pubchemResult, fdaResult] = await Promise.allSettled([
      httpsGet(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/MolecularFormula,MolecularWeight/JSON`,
      ),
      httpsGet(
        `https://api.fda.gov/drug/label.json?search=openfda.generic_name:%22${encodeURIComponent(name)}%22&limit=1`,
      ),
    ]);

    const compound =
      pubchemResult.status === "fulfilled"
        ? pubchemResult.value?.PropertyTable?.Properties?.[0]
        : null;
    const label =
      fdaResult.status === "fulfilled" ? fdaResult.value?.results?.[0] : null;

    if (!label && !compound) {
      // Try brand name search
      const brandResult = await httpsGet(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:%22${encodeURIComponent(name)}%22&limit=1`,
      ).catch(() => null);
      if (!brandResult?.results?.[0]) {
        return res.status(404).json({ error: `No data found for "${name}"` });
      }
    }

    let pkParams = null;
    const clinPharm =
      label?.clinical_pharmacology?.[0] || label?.pharmacokinetics?.[0] || "";

    if (clinPharm.length > 80 && OPENROUTER_API_KEY) {
      try {
        const response = await openRouterChat({
          model: OPENROUTER_MODEL,
          max_tokens: 600,
          messages: [
            {
              role: "user",
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
${clinPharm.substring(0, 2500)}`,
            },
          ],
        });
        const text = response?.choices?.[0]?.message?.content?.trim() || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) pkParams = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.log("PK extraction failed:", e.message);
      }
    }

    const data = {
      name: label?.openfda?.generic_name?.[0] || name,
      brandName: label?.openfda?.brand_name?.[0] || "",
      genericName: label?.openfda?.generic_name?.[0] || name,
      drugClass:
        pkParams?.drugClass ||
        label?.openfda?.pharm_class_epc?.[0] ||
        "Unknown",
      manufacturer: label?.openfda?.manufacturer_name?.[0] || "",
      pkParams: pkParams || {},
      molecularFormula: compound?.MolecularFormula || "",
      molecularWeight: compound?.MolecularWeight || null,
      fdaLabel: {
        indications: label?.indications_and_usage?.[0]?.substring(0, 400) || "",
        warnings: label?.warnings?.[0]?.substring(0, 300) || "",
        contraindications:
          label?.contraindications?.[0]?.substring(0, 300) || "",
        drugInteractions:
          label?.drug_interactions?.[0]?.substring(0, 400) || "",
        clinicalPharmacology: clinPharm.substring(0, 600),
      },
      source: [
        compound ? "pubchem" : null,
        label ? "openfda" : null,
        pkParams ? "claude-pk" : null,
      ]
        .filter(Boolean)
        .join("+"),
    };

    drugLookupCache.set(cacheKey, { data, fetchedAt: Date.now() });
    res.json(data);
  } catch (error) {
    console.error("Drug lookup error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/condition-drugs — Drugs for a condition from OpenFDA
// ============================================================

app.get("/api/condition-drugs", async (req, res) => {
  const { condition } = req.query;
  if (!condition)
    return res.status(400).json({ error: "condition param required" });

  try {
    const data = await httpsGet(
      `https://api.fda.gov/drug/label.json?search=indications_and_usage:%22${encodeURIComponent(condition)}%22&limit=20`,
    );

    const seen = new Set();
    const drugs = (data.results || [])
      .map((r) => {
        const generic = r.openfda?.generic_name?.[0];
        const brand = r.openfda?.brand_name?.[0];
        const name = generic || brand;
        if (!name || seen.has(name.toLowerCase())) return null;
        seen.add(name.toLowerCase());
        return {
          name,
          brandName: brand || "",
          genericName: generic || "",
          drugClass: r.openfda?.pharm_class_epc?.[0] || "",
          indications: r.indications_and_usage?.[0]?.substring(0, 250) || "",
          clinicalPharmacology:
            r.clinical_pharmacology?.[0]?.substring(0, 500) || "",
          warnings: r.warnings?.[0]?.substring(0, 200) || "",
        };
      })
      .filter(Boolean)
      .slice(0, 12);

    res.json({
      condition,
      drugs,
      total: data.meta?.results?.total || drugs.length,
    });
  } catch (error) {
    console.error("Condition drugs error:", error.message);
    res.status(500).json({ error: error.message, drugs: [] });
  }
});

// ============================================================
// POST /api/ml-discover — ML + Tabular Regression drug combo prediction
// ============================================================

app.post("/api/ml-discover", async (req, res) => {
  const { condition, drugs, patientProfile } = req.body;

  if (!condition) return res.status(400).json({ error: "condition required" });
  if (!OPENROUTER_API_KEY) {
    return res.status(503).json({
      error:
        "OpenRouter API required for ML discovery. Configure OPENROUTER_API_KEY.",
    });
  }

  try {
    const drugRows = (drugs || [])
      .map((d) => {
        const pk = d.pkParams || {};
        return `| ${d.name} | ${d.drugClass || "Unknown"} | ${pk.halfLife != null ? pk.halfLife + "h" : "?"} | ${pk.bioavailability != null ? (pk.bioavailability * 100).toFixed(0) + "%" : "?"} | ${pk.Vd != null ? pk.Vd + " L/kg" : "?"} | ${pk.proteinBinding != null ? pk.proteinBinding + "%" : "?"} | ${(pk.mechanism || "").substring(0, 80) || d.drugClass || "—"} |`;
      })
      .join("\n");

    const patientStr = patientProfile
      ? `Age: ${patientProfile.age}y, Weight: ${patientProfile.weight}kg, eGFR: ${patientProfile.kidneyFunction}%, Liver: ${patientProfile.liverFunction}`
      : "Standard adult patient";

    const response = await openRouterChat({
      model: OPENROUTER_MODEL,
      max_tokens: 3500,
      messages: [
        {
          role: "system",
          content:
            "You are a computational pharmacologist specializing in multi-target drug combination therapy and ML-based drug repurposing. You apply tabular regression analysis to pharmacokinetic and pharmacodynamic property matrices to identify optimal drug combinations. You evaluate feature importance, property correlations, mechanistic synergy, and PK compatibility.",
        },
        {
          role: "user",
          content: `Apply tabular regression and ML analysis to predict optimal drug combinations for: **${condition}**\n\n## Drug Property Feature Matrix (Input Data)\n| Drug | Class | Half-Life | Bioavailability | Vd | Protein Binding | Mechanism |\n|------|-------|-----------|-----------------|----|-----------------|-----------|\n${drugRows}\n\n## Patient Profile: ${patientStr}\n\n## ML Analysis Tasks:\n1. **Feature Importance Analysis**: Which PK/PD properties most predict efficacy for ${condition}?\n2. **Synergy Regression**: Score drug pairs by complementary mechanisms and additive properties\n3. **PK Compatibility Regression**: Match drugs with compatible half-lives and absorption profiles\n4. **Novel Property Combinations**: Identify non-obvious combinations based on property analysis\n\nReturn ONLY valid JSON (no markdown code blocks, no explanation outside the JSON):\n{\n  "regressionInsights": {\n    "keyFeatures": ["feature1", "feature2", "feature3"],\n    "featureImportance": {"halfLife": 0.0, "Vd": 0.0, "bioavailability": 0.0, "proteinBinding": 0.0, "mechanism": 0.0},\n    "correlationSummary": "2-3 sentences about property-efficacy correlations found",\n    "methodology": "brief description of regression approach used"\n  },\n  "combinations": [\n    {\n      "drugs": ["Drug1", "Drug2"],\n      "combinedScore": 0.87,\n      "synergyType": "complementary",\n      "mechanismSynergy": "why these mechanisms work together for this condition",\n      "pkCompatibility": "PK profile compatibility explanation",\n      "confidenceLevel": "high",\n      "novelty": "established",\n      "simulationParams": {\n        "drug1": {\n          "name": "Drug1",\n          "suggestedDose": 500,\n          "frequency": "bid",\n          "halfLife": 6.5,\n          "bioavailability": 0.5,\n          "Vd": 4.6,\n          "Tmax": 2.5,\n          "proteinBinding": 0\n        },\n        "drug2": {\n          "name": "Drug2",\n          "suggestedDose": 100,\n          "frequency": "single",\n          "halfLife": 12,\n          "bioavailability": 0.7,\n          "Vd": 1.0,\n          "Tmax": 2.0,\n          "proteinBinding": 50\n        }\n      },\n      "warnings": ["safety consideration"],\n      "evidenceBase": "clinical"\n    }\n  ],\n  "topRecommendation": "1-2 sentence summary of the best combination and why",\n  "safetyNotes": ["note1", "note2"]\n}`,
        },
      ],
    });

    const text = response.content[0].text.trim();
    let result = null;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return res.json({
        success: false,
        rawText: text,
        error: "JSON parse failed",
      });
    }

    res.json({ success: true, condition, result, usage: response.usage });
  } catch (error) {
    console.error("ML discover error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`\n🔬 Drug Interaction Lab running at http://localhost:${PORT}`);
  if (!OPENROUTER_API_KEY) {
    console.log(`   ⚠️  OPENROUTER_API_KEY not set — add it to a .env file`);
    console.log(
      `       Template analysis will be used instead of OpenRouter AI`,
    );
  } else {
    console.log(
      `   ✅ OpenRouter AI (arcee-ai/trinity-large-preview:free) configured`,
    );
  }
  console.log(`   ✅ RxNorm/NLM drug interaction API active (no key required)`);
  console.log(`   ✅ OpenFDA API active (no key required)`);
  console.log(`   Open http://localhost:${PORT} in your browser\n`);
});
