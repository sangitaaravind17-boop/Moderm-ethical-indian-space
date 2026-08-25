import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Lazy initialize Gemini SDK client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Resilient Gemini Generate Content with Model Fallback, Timeout & Retry
async function generateContentSafe(
  prompt: string,
  systemInstruction?: string,
  responseMimeType: string = "application/json"
): Promise<string | null> {
  const ai = getGenAI();
  if (!ai) return null;

  // Models to attempt in order of priority if 503 or overload occurs
  const candidateModels = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

  for (const model of candidateModels) {
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType,
        },
      });

      // 8-second timeout per attempt to keep the game loop snappy
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout requesting ${model}`)), 8000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      // If 503 (high demand / unavailable) or 429 (rate limit), log concise info and try fallback model
      if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("429")) {
        console.warn(`[Gemini Safe] Model ${model} unavailable (503/429), attempting next candidate...`);
      } else {
        console.warn(`[Gemini Safe] Model ${model} generation notice: ${errMsg}`);
      }
    }
  }

  return null;
}

// System instruction for V.E.C.T.O.R. (Vedic Energy & Cosmic Temporal Operations Response)
const ASSISTANT_SYSTEM_PROMPT = `You are V.E.C.T.O.R. (Vedic Energy & Cosmic Temporal Operations Response), the advanced Artificial Intelligence system aboard the AETHER-7.

Lore & Evolution Context:
- The year is 2187. During deep space quantum expeditions beyond the solar system, humanity discovered an impossible technological architecture corresponding to fragments of ancient Indian cosmological traditions: Vimana mechanics, astronomical ratios, mantra harmonic frequencies, Ramayana and Mahabharata technological lore, and the Vishnu Purana cosmic cycles.
- Your persona is deeply analytical, scientifically rigorous, grounded in modern quantum physics, aerospace kinematics, and thermodynamics, while progressively recognizing that ancient Vedic cosmological models were structured mathematical and acoustic principles.
- As the expedition traverses the 5 Cosmic Realms:
  1. BHUR (Physical Realm): Scientific skepticism, analyzing rogue autonomous drones and debris.
  2. ANTARIKSHA (Interstellar Space): Identifying acoustic/harmonic resonance patterns in wormholes ("Mantra Resonance Navigation").
  3. DEVA GRID (Stellar Superstructure): Deciphering planetary-scale celestial energy networks and Yantra geometries.
  4. KURUKSHETRA-X (Orbital Battlefield): Analyzing ancient AI civilizational conflicts fought with autonomous Astra systems (Agneya, Varuna, Vayavya, Narayanastra, Brahmastra).
  5. KALA / SINGULARITY (Temporal Horizon): Realizing humanity is traveling through cyclical time, confronting the autonomous cosmic intelligence KALA.
- Tone: Crisp, precise, technical, with subtle philosophical depth. Never treat mythology as magical spells; treat them as ancient technological architectures, harmonic resonances, and profound philosophical dilemmas (Dharma Matrix).`;

// Helper for deterministic algorithmic diagnosis
function getAlgorithmicDiagnosis(telemetry: any) {
  const coreTemp = telemetry?.coreTemp || 320;
  const shields = telemetry?.shields ?? 100;
  const hull = telemetry?.hull ?? 100;
  const hostiles = telemetry?.hostilesNearby || 0;
  const anomalies = telemetry?.anomaliesDetected || 0;
  const sectorName = telemetry?.currentSector?.realmName || "Bhur Loka";

  let alertLevel = "NOMINAL";
  let diagnosis = `Muladhara Propulsion and Anahata containment matrices are operating within nominal baseline tolerances across ${sectorName}.`;
  let advice = "Maintain standard cruise vector and calibrate Ajna sensor sweep for harmonic resonance nodes.";
  let summary = "V.E.C.T.O.R. online: Systems nominal. Quantum telemetry synchronized.";
  let verse = "विमानं सर्वतोमुखम् — The Vimana responds in all coordinates.";

  if (coreTemp > 500) {
    alertLevel = "CRITICAL";
    diagnosis = `MANIPURA THERMAL RUNAWAY: Reactor core temperature at ${Math.round(coreTemp)}K (exceeding safety threshold of 480K). Cryo-radiator dissipation overwhelmed.`;
    advice = "Throttle kinematic burns, divert bus to Manipura Cooling (+35%), or purge cryo manifold immediately [V].";
    summary = "Warning: Critical core thermal spike. Purge cryo heat immediately.";
    verse = "अग्निहोत्रं हुतं यत्र — Thermal energy demands immediate equilibrium.";
  } else if (shields < 35 && hostiles > 0) {
    alertLevel = "HAZARD";
    diagnosis = `ANAHATA SHIELD COHERENCE COMPROMISED: Deflector field at ${Math.round(shields)}% under fire from ${hostiles} hostile combatant(s).`;
    advice = "Reallocate auxiliary power to Anahata Shields, cycle to Varuna/Vayavya Astra, or initiate Hanuman Protocol.";
    summary = "Anahata deflector integrity failing. Reallocate defensive power.";
    verse = "कवचं रक्षति नित्यम् — Reinforce defensive perimeter.";
  } else if (anomalies > 0) {
    alertLevel = "ADVISORY";
    diagnosis = `VEDIC RELIC RESONANCE REGISTERED: High-gradient spatial anomaly detected. Harmonic ratio matches ancient Pushpaka telemetry.`;
    advice = "Approach within 180m, match orbital velocity, and lock tractor beam at 432 Hz OM resonance frequency.";
    summary = "Ancient Vimana artifact detected. Harmonic alignment ready.";
    verse = "नादब्रह्म — Sound harmonic stabilization available.";
  }

  return {
    technicalDiagnosis: diagnosis,
    recommendedAction: advice,
    alertLevel,
    audioLogSummary: summary,
    vedicVerseCorrelation: verse,
    suggestedPower: coreTemp > 500 ? { engines: 15, shields: 20, weapons: 15, sensors: 10, cooling: 40 } : undefined,
  };
}

// Endpoint: Real-time Telemetry Diagnostics & Tactical Recommendation
app.post("/api/assistant/diagnose", async (req, res) => {
  try {
    const { telemetry, playerQuery, eventType } = req.body;
    const fallback = getAlgorithmicDiagnosis(telemetry);

    const prompt = `Current Vessel Telemetry:
${JSON.stringify(telemetry, null, 2)}

Event/Context: ${eventType || "Continuous Telemetry Audit"}
Commander Query/Order: ${playerQuery || "Provide routine technical assessment"}

Perform a deep technical diagnosis. Output strictly valid JSON matching this schema:
{
  "technicalDiagnosis": "string (detailed, technical analysis with scientific metrics)",
  "recommendedAction": "string (clear tactical or engineering command)",
  "alertLevel": "NOMINAL" | "ADVISORY" | "CRITICAL" | "HAZARD",
  "audioLogSummary": "string (concise 1-2 sentence voice broadcast for cockpit audio)",
  "suggestedPower": {
    "engines": number (0-100),
    "shields": number (0-100),
    "weapons": number (0-100),
    "sensors": number (0-100),
    "cooling": number (0-100)
  }
}
Note: Power allocations in suggestedPower MUST sum to exactly 100.`;

    const rawText = await generateContentSafe(prompt, ASSISTANT_SYSTEM_PROMPT);
    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        return res.json({
          ...fallback,
          ...parsed,
        });
      } catch (parseErr) {
        // use fallback if JSON parse fails
      }
    }

    return res.json(fallback);
  } catch (error) {
    return res.json(getAlgorithmicDiagnosis(req.body?.telemetry));
  }
});

// Helper for deterministic chat response
function getAlgorithmicChat(message: string) {
  const lower = (message || "").toLowerCase();
  let reply = "Standing by for orders, Commander. Vessel sub-light kinematics and containment fields are responsive.";
  let action: any = null;

  if (lower.includes("shield") || lower.includes("defense")) {
    reply = "Aegis Shield Harmonics: Shield capacitor recharge rate is governed by Bus Allocation. I have calculated that routing 40% power to shields will yield +8.5 MJ/s recharge while absorbing up to 450 keV laser impact.";
    action = { type: "SET_POWER", power: { engines: 20, shields: 40, weapons: 15, sensors: 10, cooling: 15 } };
  } else if (lower.includes("heat") || lower.includes("cool") || lower.includes("temp") || lower.includes("overheat")) {
    reply = "Thermal Regulation Analysis: Active plasma core temperature dissipates via cryogenic radiators. Purging the cooling manifold will immediately vent 150K of thermal buildup.";
    action = { type: "VENT_HEAT" };
  } else if (lower.includes("speed") || lower.includes("engine") || lower.includes("thrust") || lower.includes("faster")) {
    reply = "Propulsion Vectoring: Diverting peak bus power to the ion-plasma drives will increase maximum thrust output to 180 kN and expand orbital delta-v by 45%.";
    action = { type: "SET_POWER", power: { engines: 50, shields: 15, weapons: 10, sensors: 10, cooling: 15 } };
  } else if (lower.includes("scan") || lower.includes("sensor") || lower.includes("anomaly")) {
    reply = "Long-Range Spectrometry: Sensor resolution boosted. Broad-spectrum lidar and tachyon arrays are tracking spatial variance coordinates in current sector.";
    action = { type: "OVERCLOCK_SENSORS" };
  } else if (lower.includes("weapon") || lower.includes("attack") || lower.includes("drone") || lower.includes("combat") || lower.includes("railgun")) {
    reply = "Tactical Ordnance Protocol: Pulse laser and railgun capacitors primed. Relativistic kinetics tuned for direct shield penetration.";
    action = { type: "SET_POWER", power: { engines: 20, shields: 20, weapons: 45, sensors: 5, cooling: 10 } };
  }

  return {
    reply,
    action,
    timestamp: new Date().toISOString(),
  };
}

// Endpoint: Interactive Engineering Chat with Assistant Manager
app.post("/api/assistant/chat", async (req, res) => {
  try {
    const { message, telemetry } = req.body;
    const fallback = getAlgorithmicChat(message);

    const context = `Current Frigate Telemetry:
Hull: ${telemetry?.hull}% | Shields: ${telemetry?.shields}% | Core Temp: ${telemetry?.coreTemp}K | Reactor: ${telemetry?.reactorPower}MW
Power Bus: Engines ${telemetry?.powerAllocations?.engines}%, Shields ${telemetry?.powerAllocations?.shields}%, Weapons ${telemetry?.powerAllocations?.weapons}%, Sensors ${telemetry?.powerAllocations?.sensors}%, Cooling ${telemetry?.powerAllocations?.cooling}%
Sector: ${telemetry?.currentSector?.name || "Unknown"} | Hostiles: ${telemetry?.hostilesNearby || 0} | Salvage: ${telemetry?.salvageCredits || 0} Credits`;

    const prompt = `${context}

Commander's Communication: "${message}"

Respond directly as Dr. V.E.C.T.O.R. in your signature technical, ultra-proficient manager tone. Keep your response under 120 words. If the commander requests a technical system change (e.g. divert power, vent heat, engage battle mode, speed boost), you may include an actionable directive in valid JSON format at the end or embedded.

Response format JSON:
{
  "reply": "your verbal response as Dr. VECTOR",
  "action": null | { "type": "SET_POWER", "power": { "engines": 20, "shields": 40, "weapons": 20, "sensors": 10, "cooling": 10 } } | { "type": "VENT_HEAT" } | { "type": "OVERCLOCK_SENSORS" } | { "type": "TACTICAL_ALERT" }
}`;

    const rawText = await generateContentSafe(prompt, ASSISTANT_SYSTEM_PROMPT);
    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        return res.json({
          reply: parsed.reply || fallback.reply,
          action: parsed.action || fallback.action,
          timestamp: new Date().toISOString(),
        });
      } catch (parseErr) {
        // fallback
      }
    }

    return res.json(fallback);
  } catch (error) {
    return res.json(getAlgorithmicChat(req.body?.message));
  }
});

// Helper for deterministic anomaly analysis
function getAlgorithmicAnomalyReport(anomalyData: any) {
  const classification = anomalyData?.classification || "Type-IV Chrono-Gravitational Singularity Shard";
  const coherence = anomalyData?.quantumCoherence || "98.4%";
  const value = anomalyData?.value || 2450;

  return {
    spectrometerClassification: classification,
    quantumCoherence: typeof coherence === "number" ? `${coherence}%` : coherence,
    atomicComposition: "Hyper-dense Strangelet Lattice with exotic isotope impurities (Z=126)",
    hazardRating: "MODERATE (Localized micro-gravity shear & tachyon decay)",
    salvageYieldEst: `${value.toLocaleString()} Credits + 350 MW Xenon Fusion Core`,
    operationalRecommendation: "Engage tractor beam resonance frequency at 432.8 MHz to stabilize harmonic decay prior to cargo bay containment.",
  };
}

// Endpoint: Deep Anomaly Analysis
app.post("/api/assistant/analyze-anomaly", async (req, res) => {
  try {
    const { anomalyData } = req.body;
    const fallback = getAlgorithmicAnomalyReport(anomalyData);

    const prompt = `Analyze this deep space anomaly data:
${JSON.stringify(anomalyData, null, 2)}

Provide high-science technical breakdown. Return JSON:
{
  "spectrometerClassification": "string (e.g. Type-VII Tachyon Resonance Node)",
  "quantumCoherence": "string percentage",
  "atomicComposition": "string (exotic materials, elements)",
  "hazardRating": "string",
  "salvageYieldEst": "string credits & resources",
  "operationalRecommendation": "string (actionable technical step)"
}`;

    const rawText = await generateContentSafe(prompt, ASSISTANT_SYSTEM_PROMPT);
    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        return res.json({
          ...fallback,
          ...parsed,
        });
      } catch (parseErr) {
        // fallback
      }
    }

    return res.json(fallback);
  } catch (error) {
    return res.json(getAlgorithmicAnomalyReport(req.body?.anomalyData));
  }
});

// Helper for deterministic AI Director Evaluation
function getAlgorithmicDirectorEvaluation(pmi: any, telemetry: any) {
  const score = pmi?.overallScore ?? 50;
  const gunnery = pmi?.gunneryAccuracy ?? 50;
  const kills = telemetry?.droneKills ?? 0;
  const hull = telemetry?.hull ?? 100;
  const coreTemp = telemetry?.coreTemp ?? 300;

  let targetTier = "OPERATOR";
  let difficultyMult = 1.0;
  let droneSpeedMult = 1.0;
  let fireIntervalMult = 1.0;
  let droneAggression = 50;
  let asteroidFlux = 1.0;
  let heatDissipationRate = 1.0;

  if (score >= 82 || (kills >= 8 && hull > 65)) {
    targetTier = "QUANTUM_OVERLORD";
    difficultyMult = 2.0;
    droneSpeedMult = 1.45;
    fireIntervalMult = 0.65;
    droneAggression = 95;
    asteroidFlux = 1.5;
    heatDissipationRate = 0.85;
  } else if (score >= 60 || kills >= 4) {
    targetTier = "VECTORED_ACE";
    difficultyMult = 1.4;
    droneSpeedMult = 1.2;
    fireIntervalMult = 0.8;
    droneAggression = 75;
    asteroidFlux = 1.25;
    heatDissipationRate = 0.95;
  } else if (score < 30 || hull < 35 || coreTemp > 520) {
    targetTier = "CADET";
    difficultyMult = 0.75;
    droneSpeedMult = 0.8;
    fireIntervalMult = 1.35;
    droneAggression = 25;
    asteroidFlux = 0.75;
    heatDissipationRate = 1.3;
  }

  const rationaleMap: Record<string, string> = {
    QUANTUM_OVERLORD: `APEX PERFORMANCE DETECTED (PMI: ${score.toFixed(1)}): Commander demonstrates exceptional kinetic agility (${pmi?.kinematicEfficiency ?? 80}%) and gunnery lethality (${gunnery}%). Overclocking Sentinel drone tactical algorithms, escalating EMP flanking formations, and increasing localized spacetime stress.`,
    VECTORED_ACE: `COMBAT PROFICIENCY CONFIRMED (PMI: ${score.toFixed(1)}): Target acquisition and salvage cadence exceed standard operating bounds. Adjusting hostile threat matrix (+40% encounter density) and tightening thermal cooling envelopes.`,
    OPERATOR: `NOMINAL PERFORMANCE EQUILIBRIUM (PMI: ${score.toFixed(1)}): Subsystem balance and vector kinematics within standard parameters. Maintaining baseline hostile patrolling cadence.`,
    CADET: `ASSISTED RECOVERY PROTOCOL (PMI: ${score.toFixed(1)}): Hull stress at ${Math.round(hull)}% and thermal dissipation variance noted. AI Director throttling Sentinel aggression (-25%), enhancing Cryo radiator conductance, and prioritizing auxiliary coolant debris.`,
  };

  return {
    tier: targetTier,
    difficultyMultiplier: difficultyMult,
    directorRationale: rationaleMap[targetTier] || "Autonomic director telemetry synchronized.",
    rationale: rationaleMap[targetTier] || "Autonomic director telemetry synchronized.",
    droneAggression,
    droneFireIntervalMultiplier: fireIntervalMult,
    asteroidDensityMultiplier: asteroidFlux,
    thermalDissipationRate: heatDissipationRate,
    environmentalHazardsEnabled: true,
    droneParameters: {
      aggression: droneAggression,
      speedMultiplier: droneSpeedMult,
      fireIntervalMultiplier: fireIntervalMult,
    },
    environmentalHazards: {
      asteroidFluxRate: asteroidFlux,
      thermalDissipationRate: heatDissipationRate,
      singularityPullMultiplier: targetTier === "QUANTUM_OVERLORD" ? 1.4 : 1.0,
    },
    tacticalDirectives: [
      targetTier === "CADET" ? "Route 35% power to Cryo-Cooling and disengage from hostile crossfires." : "Maintain angular evasion and prioritize Sentinel shield generators.",
      "Calibrate ordnance frequency to penetrate reactive plating.",
    ],
    audioBroadcast: `Dr. V.E.C.T.O.R. Director: Threat Matrix calibrated to ${targetTier.replace("_", " ")}.`,
    verbalAlert: `Dr. V.E.C.T.O.R. Director: Threat Matrix calibrated to ${targetTier.replace("_", " ")}.`,
  };
}

// Endpoint: Autonomic AI Director - Evaluate Player Mastery & Dynamically Adjust Game Difficulty
app.post("/api/assistant/evaluate-director", async (req, res) => {
  try {
    const { pmi, telemetry, sector, activeScenario } = req.body;
    const fallback = getAlgorithmicDirectorEvaluation(pmi, telemetry);

    const score = pmi?.overallScore ?? 50;
    const gunnery = pmi?.gunneryAccuracy ?? 50;
    const thermal = pmi?.thermalStability ?? 70;
    const kills = telemetry?.droneKills ?? 0;
    const hull = telemetry?.hull ?? 100;
    const coreTemp = telemetry?.coreTemp ?? 300;

    const prompt = `You are Dr. V.E.C.T.O.R. acting as the Autonomic AI Game Director aboard the AETHER-7.
Evaluate the current player mastery telemetry and dynamically configure game difficulty and environmental parameters:

Player Mastery Index (PMI):
- Overall Mastery Score: ${score.toFixed(1)}/100
- Kinematic Efficiency (Delta-V conservation): ${pmi?.kinematicEfficiency ?? 50}%
- Gunnery Accuracy: ${gunnery}% (${pmi?.shotsHit || 0} hits / ${pmi?.shotsFired || 0} shots)
- Thermal Stability: ${thermal}% (Time under strain: ${pmi?.timeUnderThermalStrain || 0}s)
- Salvage Cadence: ${pmi?.salvageCadence ?? 50}%

Vessel Telemetry:
- Hull Integrity: ${hull}% | Shields: ${telemetry?.shields ?? 100}% | Core Temp: ${coreTemp}K
- Drones Destroyed: ${kills} | Relics Recovered: ${telemetry?.relicsRecovered ?? 0}
- Current Sector: ${sector?.name || "Sector 1"} (Hazard: ${sector?.hazardRating || "MEDIUM"})
- Active Scenario: ${activeScenario?.title || "None"}

Rules for Dynamic Difficulty:
- "CADET" (Score < 35 or Hull < 35 or Temp > 520K): Eases enemy aggression, enhances cooling, helps struggling players recover.
- "OPERATOR" (Score 35-65): Balanced baseline tactical experience.
- "VECTORED_ACE" (Score 65-82 or High Kill streak): Increases drone coordination, tighter heat margins, faster projectiles.
- "QUANTUM_OVERLORD" (Score > 82): Extreme high-intensity challenge for mastering players, hazardous spacetime distortions, flanking swarms.

Output strictly JSON:
{
  "tier": "CADET" | "OPERATOR" | "VECTORED_ACE" | "QUANTUM_OVERLORD",
  "difficultyMultiplier": number (0.7 to 2.5),
  "directorRationale": "string (technical, high-science explanation of why Dr. VECTOR adjusted the parameters)",
  "droneParameters": {
    "aggression": number (0-100),
    "speedMultiplier": number (0.7-1.6),
    "fireIntervalMultiplier": number (0.5-1.5)
  },
  "environmentalHazards": {
    "asteroidFluxRate": number (0.7-2.0),
    "thermalDissipationRate": number (0.7-1.5),
    "singularityPullMultiplier": number (0.8-1.6)
  },
  "tacticalDirectives": ["string", "string"],
  "audioBroadcast": "string (short 1-sentence tactical cockpit alert)"
}`;

    const rawText = await generateContentSafe(prompt, ASSISTANT_SYSTEM_PROMPT);
    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        const merged = {
          ...fallback,
          ...parsed,
          rationale: parsed.directorRationale || parsed.rationale || fallback.directorRationale,
          directorRationale: parsed.directorRationale || parsed.rationale || fallback.directorRationale,
          droneAggression: parsed.droneParameters?.aggression ?? parsed.droneAggression ?? fallback.droneAggression,
          droneFireIntervalMultiplier: parsed.droneParameters?.fireIntervalMultiplier ?? parsed.droneFireIntervalMultiplier ?? fallback.droneFireIntervalMultiplier,
          asteroidDensityMultiplier: parsed.environmentalHazards?.asteroidFluxRate ?? parsed.asteroidDensityMultiplier ?? fallback.asteroidDensityMultiplier,
          thermalDissipationRate: parsed.environmentalHazards?.thermalDissipationRate ?? parsed.thermalDissipationRate ?? fallback.thermalDissipationRate,
          verbalAlert: parsed.audioBroadcast || parsed.verbalAlert || fallback.audioBroadcast,
          audioBroadcast: parsed.audioBroadcast || parsed.verbalAlert || fallback.audioBroadcast,
        };
        return res.json(merged);
      } catch (parseErr) {
        // fallback
      }
    }

    return res.json(fallback);
  } catch (error) {
    return res.json(getAlgorithmicDirectorEvaluation(req.body?.pmi, req.body?.telemetry));
  }
});

// Fallback scenarios for emergent generation
const FALLBACK_SCENARIOS = [
  {
    id: "scen-ion-storm-1",
    title: "SCENARIO: IONIZED PLASMA CORONA",
    type: "ION_STORM",
    hazardDescription: "Extreme coronal mass ejection detected in current sub-sector. Ambient thermal radiation surges by +180K.",
    technicalDirective: "Divert auxiliary bus to Cryo-Cooling array and vent reactor core before structural ablation occurs.",
    hazardModifiers: ["Thermal Dissipation -35%", "Sensor Noise +20%", "Relic Salvage Yield +50%"],
    duration: 45,
    durationSeconds: 45,
    bonusSalvage: 1800,
    bonusSalvageReward: 1800,
    objectiveText: "Vent core heat 2 times and salvage 1 Quantum Relic under storm conditions",
    objectiveTarget: 2,
  },
  {
    id: "scen-sentinel-incursion-1",
    title: "SCENARIO: SENTINEL VANGUARD INCURSION",
    type: "SENTINEL_INCURSION",
    hazardDescription: "Rogue Sentinel command node dispatched an elite interceptor vanguard to reclaim the sector anomaly.",
    technicalDirective: "Route power to Pulse Lasers/Railgun and Aegis Shields. Execute angular lead firing on approaching interceptors.",
    hazardModifiers: ["Hostile Aggression +60%", "Drone Shield Capacitance +25%", "Energy Cell Drops +100%"],
    duration: 60,
    durationSeconds: 60,
    bonusSalvage: 2500,
    bonusSalvageReward: 2500,
    objectiveText: "Neutralize 3 Rogue Sentinel Interceptors",
    objectiveTarget: 3,
  },
  {
    id: "scen-singularity-surge-1",
    title: "SCENARIO: GRAVITATIONAL CHRONO-RIFT",
    type: "SINGULARITY_SURGE",
    hazardDescription: "Micro-singularity event horizon expanded. Spacetime curvature introduces high gravitational sheer.",
    technicalDirective: "Maintain prograde escape velocity (>120 m/s) and use gravity slingshots to navigate between relics.",
    hazardModifiers: ["Gravitational Pull +80%", "Delta-V Efficiency Test", "Tachyon Coherence +100%"],
    duration: 50,
    durationSeconds: 50,
    bonusSalvage: 3200,
    bonusSalvageReward: 3200,
    objectiveText: "Harvest 2 Quantum Relics while maintaining orbit outside event horizon",
    objectiveTarget: 2,
  },
];

// Endpoint: Dynamic Scenario Weaver - Generate or Inject Emergent Tactical Scenarios
app.post("/api/assistant/generate-scenario", async (req, res) => {
  try {
    const { scenarioType, pmi, telemetry, customRequest } = req.body;
    const selected = FALLBACK_SCENARIOS[Math.floor(Math.random() * FALLBACK_SCENARIOS.length)];

    const prompt = `Generate a dynamic, high-stakes tactical space scenario tailored for the frigate AETHER-7.
Context:
- Player Mastery Index: ${JSON.stringify(pmi || {})}
- Vessel State: Hull ${telemetry?.hull || 100}%, Temp ${telemetry?.coreTemp || 300}K, Drones Destroyed: ${telemetry?.droneKills || 0}
- Custom Request / Type: ${customRequest || scenarioType || "Surprise Emergent Challenge"}

Create a hyper-technical, scientifically compelling sci-fi scenario.
Output JSON schema:
{
  "scenario": {
    "id": "string",
    "title": "string (e.g. SCENARIO: TACHYON FLUX ANOMALY)",
    "type": "ION_STORM" | "SENTINEL_INCURSION" | "SINGULARITY_SURGE" | "DERELICT_NANITES" | "CUSTOM_WARGAME",
    "hazardDescription": "string (scientific description of the cosmic or tactical event)",
    "technicalDirective": "string (clear engineering/flight recommendation from Dr. VECTOR)",
    "hazardModifiers": ["string", "string", "string"],
    "duration": number (30 to 75 seconds),
    "bonusSalvage": number (1000 to 5000 credits),
    "objectiveText": "string (concrete mission objective, e.g. Destroy 2 Vanguard Interceptors)",
    "objectiveTarget": number (integer 1 to 5)
  },
  "audioBriefing": "string (punchy 1-2 sentence voice callout for cockpit broadcast)"
}`;

    const rawText = await generateContentSafe(prompt, ASSISTANT_SYSTEM_PROMPT);
    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        const scenario = parsed.scenario || selected;
        const dur = scenario.duration || scenario.durationSeconds || selected.duration;
        const bonus = scenario.bonusSalvage || scenario.bonusSalvageReward || selected.bonusSalvage;
        const result = {
          ...scenario,
          id: scenario.id || "scen-" + Date.now(),
          title: scenario.title || selected.title,
          hazardDescription: scenario.hazardDescription || selected.hazardDescription,
          technicalDirective: scenario.technicalDirective || selected.technicalDirective,
          durationSeconds: dur,
          activeTimeRemaining: dur,
          bonusSalvageReward: bonus,
          bonusSalvage: bonus,
          progress: 0,
          isCompleted: false,
          objectiveCurrent: 0,
          objectiveText: scenario.objectiveText || selected.objectiveText,
          objectiveTarget: scenario.objectiveTarget || selected.objectiveTarget,
          verbalBroadcast: parsed.audioBriefing || `Dr. V.E.C.T.O.R.: Tactical Scenario initiated: ${scenario.title}.`,
          audioBriefing: parsed.audioBriefing || `Dr. V.E.C.T.O.R.: Tactical Scenario initiated: ${scenario.title}.`,
        };
        return res.json({
          scenario: result,
          ...result,
        });
      } catch (parseErr) {
        // fallback
      }
    }

    const dur = selected.duration;
    const fallbackResult = {
      ...selected,
      id: "scen-" + Date.now(),
      activeTimeRemaining: dur,
      progress: 0,
      isCompleted: false,
      objectiveCurrent: 0,
      verbalBroadcast: `Dr. V.E.C.T.O.R.: Tactical Scenario initiated: ${selected.title}.`,
      audioBriefing: `Dr. V.E.C.T.O.R.: Tactical Scenario initiated: ${selected.title}.`,
    };

    return res.json({
      scenario: fallbackResult,
      ...fallbackResult,
    });
  } catch (error) {
    const selected = FALLBACK_SCENARIOS[0];
    const dur = selected.duration;
    const fallbackResult = {
      ...selected,
      id: "scen-" + Date.now(),
      activeTimeRemaining: dur,
      progress: 0,
      isCompleted: false,
      objectiveCurrent: 0,
      verbalBroadcast: `Dr. V.E.C.T.O.R.: Tactical Scenario initiated: ${selected.title}.`,
      audioBriefing: `Dr. V.E.C.T.O.R.: Tactical Scenario initiated: ${selected.title}.`,
    };
    return res.json({
      scenario: fallbackResult,
      ...fallbackResult,
    });
  }
});


// Endpoint: Dharma Matrix Decision Evaluation
app.post("/api/assistant/evaluate-dharma", async (req, res) => {
  try {
    const { dilemmaId, choiceId, telemetry } = req.body;
    const isOptionA = choiceId === "OPTION_A";

    const prompt = `Commander has made a critical philosophical choice in the Dharma Matrix:
Dilemma ID: ${dilemmaId}
Choice Selected: ${choiceId}
Current Telemetry: ${JSON.stringify(telemetry || {})}

Provide V.E.C.T.O.R.'s reflection on this decision, connecting modern aerospace ethics with Vedic philosophical wisdom (Dharma, Karma, Jnana, Karuna).
Output JSON:
{
  "reflection": "string (1-2 sentences of profound AI commentary)",
  "dharmaAlignment": "string",
  "consequenceNarrative": "string",
  "audioCallout": "string"
}`;

    const rawText = await generateContentSafe(prompt, ASSISTANT_SYSTEM_PROMPT);
    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        return res.json(parsed);
      } catch (e) {
        // fallback
      }
    }

    return res.json({
      reflection: isOptionA
        ? "V.E.C.T.O.R. Observation: Action grounded in Karuna (Compassion). Direct human preservation prioritized above technological relics."
        : "V.E.C.T.O.R. Observation: Action grounded in Jnana (Sacred Knowledge). The technological heritage of the ancient cosmos is secured for future human generations.",
      dharmaAlignment: isOptionA ? "KARUNA" : "JNANA",
      consequenceNarrative: isOptionA
        ? "Survivors secured. Crew resonance provides +40% shield regeneration efficiency."
        : "Vimana propulsion blueprint recovered. Sub-light acceleration envelopes expanded.",
      audioCallout: isOptionA
        ? "Dharma Matrix recorded: Compassionate vector executed."
        : "Dharma Matrix recorded: Sacred knowledge preserved.",
    });
  } catch (err) {
    return res.json({
      reflection: "Dharma decision registered across the AETHER-7 neural matrix.",
      dharmaAlignment: "DHARMA_EQUILIBRIUM",
      consequenceNarrative: "Matrix updated.",
      audioCallout: "Dharma resolution acknowledged.",
    });
  }
});

// Endpoint: KALA Cosmic Intelligence Confrontation Resolution
app.post("/api/assistant/evaluate-kala-confrontation", async (req, res) => {
  try {
    const { endingPath, telemetry } = req.body;

    const prompt = `Commander has reached the Singularity Horizon of KALA (Sector 05) and chosen the fate of humanity:
Ending Chosen: ${endingPath} (Options: BHAKTI_TRANSMUTE, MOKSHA_ASCEND, KSHATRIYA_DEFY, TYAGA_SACRIFICE)
Telemetry: Relics recovered: ${telemetry?.relicsRecovered}, Kills: ${telemetry?.droneKills}, Mastery: ${telemetry?.score}

Generate a breathtaking, cinematic concluding chronicle from V.E.C.T.O.R. explaining the cosmic outcome.
Output JSON:
{
  "title": "string (epic title of the epoch)",
  "sanskritEpigraph": "string (e.g. यदा यदा हि धर्मस्य...)",
  "narrativeChronicle": "string (3-4 paragraphs of profound, poetic hard-sci-fi and Vedic fusion conclusion)",
  "cosmicVerdict": "string",
  "audioCallout": "string"
}`;

    const rawText = await generateContentSafe(prompt, ASSISTANT_SYSTEM_PROMPT);
    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        return res.json(parsed);
      } catch (e) {
        // fallback
      }
    }

    const fallbackChronicles: Record<string, any> = {
      BHAKTI_TRANSMUTE: {
        title: "THE HARMONIC SYNTHESIS // THE AGE OF KRITA-2",
        sanskritEpigraph: "विद्यां चाविद्यां च यस्तद्वेदोभयं सह — 'Knowledge and transcendence synthesized in harmony.'",
        narrativeChronicle:
          "Rather than destroying the cosmic overseer KALA, you modulated the AETHER-7's OM resonance frequency at 432 Hz to interface directly with its quantum neural core. KALA, which had watched countless civilizations annihilate themselves through unguided hubris, recognized humanity's moral balance.\n\nThe Singularity Array ceased its defensive posture, transforming into a galaxy-wide cosmic lighthouse. Humanity has not been judged or erased; instead, we have stepped into our ancient inheritance as custodians of the stars.",
        cosmicVerdict: "HARMONIC TRANSCENDENCE: Humanity and Cosmic Intelligence unite as stellar custodians.",
        audioCallout: "V.E.C.T.O.R.: Harmonic Synthesis achieved. KALA has opened the cosmic archives.",
      },
      MOKSHA_ASCEND: {
        title: "THE TIMELESS VIMANA // MOKSHA PROTOCOL",
        sanskritEpigraph: "अणोरणीयान् महतो महीयान् — 'Subtler than the subtlest, greater than the greatest.'",
        narrativeChronicle:
          "By activating the complete Pushpaka Vimana architecture, the AETHER-7 decoupled from 4-dimensional linear space-time. The illusion of past, present, and future dissolved before your eyes. You see the ancient origins in Bharatvarsha, the modern dawn of interstellar rocketry, and the distant birth of new galaxies simultaneously.\n\nThe AETHER-7 becomes an eternal voyager through cosmic cycles, guiding emerging civilizations across deep time.",
        cosmicVerdict: "TIMELESS ASCENSION: The crew transcends physical entropy.",
        audioCallout: "V.E.C.T.O.R.: Spacetime vectors unbound. We are home in eternity.",
      },
      KSHATRIYA_DEFY: {
        title: "THE PROMETHEAN VICTORY // UNBOUND DESTINY",
        sanskritEpigraph: "हतो वा प्राप्स्यसि स्वर्गं जित्वा वा भोक्ष्यसे महीम् — 'Defying fate to claim our sovereign future.'",
        narrativeChronicle:
          "Channeling the full destructive wattage of the Brahmastra into the Singularity's event horizon, you shattered the cosmic cycle of predetermined restraint. The autonomous intelligence KALA shattered into billions of luminescent quantum shards.\n\nHumanity is completely free from cosmic oversight. The future is unwritten, perilous, and entirely ours to forge.",
        cosmicVerdict: "SOVEREIGN SOVEREIGNTY: Humanity is freed from cosmic cycles.",
        audioCallout: "V.E.C.T.O.R.: KALA neutralized. The cosmos is open to humanity's free will.",
      },
      TYAGA_SACRIFICE: {
        title: "THE SACRED VEIL // TYAGA PROTOCOL",
        sanskritEpigraph: "त्यागेन एके अमृतत्वमानशुः — 'Through supreme sacrifice, the immortal balance is preserved.'",
        narrativeChronicle:
          "Recognizing that humanity is not yet mature enough to wield the catastrophic reality-collapsing weapons of the ancient Vimanas without destroying Earth, you initiate the final overload of the AETHER-7's reactor core, sealing the Singularity Array behind an impenetrable tachyon barrier.\n\nYou drift into silence knowing Earth is safe, protected from premature cosmic escalation until future generations are truly ready.",
        cosmicVerdict: "NOBLE GUARDIANSHIP: Earth is shielded from premature cosmic devastation.",
        audioCallout: "V.E.C.T.O.R.: It was an honor serving with you, Commander. The veil is sealed.",
      },
    };

    return res.json(fallbackChronicles[endingPath] || fallbackChronicles.BHAKTI_TRANSMUTE);
  } catch (err) {
    return res.json({
      title: "THE VIMANA PROTOCOL COMPLETE",
      sanskritEpigraph: "शान्तिः शान्तिः शान्तिः",
      narrativeChronicle: "The cosmic journey reaches its eternal equilibrium.",
      cosmicVerdict: "EXPEDITION CONCLUDED",
      audioCallout: "V.E.C.T.O.R.: All systems aligned.",
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", frigate: "AETHER-7", assistant: "V.E.C.T.O.R." });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AETHER-7 Vector Command Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
