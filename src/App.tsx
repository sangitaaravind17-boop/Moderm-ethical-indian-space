/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  VesselState,
  Asteroid,
  QuantumRelic,
  RogueDrone,
  Projectile,
  FloatingLoot,
  AssistantDiagnostic,
  ChatMessage,
  PowerAllocations,
  PlayerMasteryIndex,
  DirectorParameters,
  DirectorEventLog,
  EmergentScenario,
  DifficultyTier,
} from "./types";
import { SECTOR_CATALOG, DHARMA_DILEMMAS } from "./data/sectors";
import { soundManager } from "./utils/audio";
import { FlightCanvas } from "./components/FlightCanvas";
import { SubsystemManager } from "./components/SubsystemManager";
import { AssistantManagerPanel } from "./components/AssistantManagerPanel";
import { CockpitHeader } from "./components/CockpitHeader";
import { AnomalySpectrometerModal } from "./components/AnomalySpectrometerModal";
import { MissionBriefingModal } from "./components/MissionBriefingModal";
import { VedicResonanceModal } from "./components/VedicResonanceModal";
import { DharmaMatrixModal } from "./components/DharmaMatrixModal";
import { KalaConfrontationModal } from "./components/KalaConfrontationModal";
import {
  Bot,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Shield,
  Flame,
  Scale,
  Sun,
} from "lucide-react";

export default function App() {
  // Sector State
  const [sectorIndex, setSectorIndex] = useState(0);
  const currentSector = SECTOR_CATALOG[sectorIndex] || SECTOR_CATALOG[0];

  // Vessel State
  const [vessel, setVessel] = useState<VesselState>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    heading: -Math.PI / 2,
    angularVelocity: 0,
    thrust: 0,
    isRetrograde: false,

    hull: 100,
    maxHull: 100,
    shields: 100,
    maxShields: 100,
    coreTemp: 300, // 300K
    maxTemp: 600,

    reactorPower: 100,
    powerAllocations: {
      engines: 20,
      shields: 20,
      weapons: 20,
      sensors: 20,
      cooling: 20,
    },

    energy: 100,
    maxEnergy: 100,

    salvageCredits: 1250,
    score: 0,
    sectorIndex: 0,

    isTractorActive: false,
    isVentingHeat: false,
    isFiringLaser: false,
    isOverclockedSensors: false,
    selectedWeapon: "PULSE_LASER",
    selectedAstra: "AGNEYA_ASTRA",
    isHanumanProtocolActive: false,
    hanumanProtocolTimeRemaining: 0,
    trimurtiActiveMode: "BRAHMA",
    karmaBalance: 0,
    dharmaPath: "KSHATRIYA",

    lastLaserFired: 0,
    lastVentTime: 0,

    statusLog: "Pushpaka Vimana AETHER-7 systems synchronized with Vedic Protocol.",
    droneKills: 0,
    relicsRecovered: 0,
  });

  // World Entities
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [relics, setRelics] = useState<QuantumRelic[]>([]);
  const [drones, setDrones] = useState<RogueDrone[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [loot, setLoot] = useState<FloatingLoot[]>([]);

  // UI Modals & Panels
  const [isMuted, setIsMuted] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [inspectingRelic, setInspectingRelic] = useState<QuantumRelic | null>(null);
  const [isVedicResonanceOpen, setIsVedicResonanceOpen] = useState(false);
  const [isDharmaModalOpen, setIsDharmaModalOpen] = useState(false);
  const [isKalaEndingOpen, setIsKalaEndingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ASSISTANT" | "SUBSYSTEMS">("ASSISTANT");
  const [isWarping, setIsWarping] = useState(false);

  // Player Mastery Index (PMI) Tracking State
  const [pmi, setPmi] = useState<PlayerMasteryIndex>({
    overallScore: 65.0,
    gunneryAccuracy: 72,
    thermalStability: 85,
    kinematicEfficiency: 68,
    salvageCadence: 50,
    timeUnderThermalStrain: 0,
    shotsFired: 18,
    shotsHit: 13,
    distanceTraveled: 420,
  });

  // AI Director State
  const [directorParams, setDirectorParams] = useState<DirectorParameters>({
    tier: "OPERATOR",
    difficultyMultiplier: 1.0,
    droneAggression: 50,
    droneFireIntervalMultiplier: 1.0,
    asteroidDensityMultiplier: 1.0,
    thermalDissipationRate: 1.0,
    environmentalHazardsEnabled: true,
    activeScenarios: [],
  });

  // Director Chronology Logs
  const [directorLogs, setDirectorLogs] = useState<DirectorEventLog[]>([
    {
      id: "dlog-1",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      eventType: "INITIALIZATION",
      description: "Autonomic Director initialized at baseline OPERATOR tier (1.0x).",
      impact: "Standard Sentinel spawn rate and thermal conductivity confirmed.",
    },
  ]);

  // Emergent Tactical Scenario State
  const [activeScenario, setActiveScenario] = useState<EmergentScenario | null>(null);

  // Assistant Manager Diagnostics & Chat History
  const [diagnostic, setDiagnostic] = useState<AssistantDiagnostic | null>({
    technicalDiagnosis:
      "All five core subsystem matrices are synchronized at baseline 20% power. Kinetic vector tracking and magneto-hydrodynamic containment fields are stable.",
    recommendedAction:
      "Deploy pulse lasers against rogue sentinels, activate the tractor beam near spatial anomalies, and monitor core thermals.",
    alertLevel: "NOMINAL",
    audioLogSummary: "Systems nominal. Welcome aboard, Commander.",
    timestamp: Date.now(),
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "ASSISTANT_VECTOR",
      text: "Greetings, Commander. I am Dr. V.E.C.T.O.R., your Senior Technical Assistant Manager. All flight telemetry, thermal loops, and power bus conduits are under continuous real-time audit.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    },
  ]);

  // Procedural Sector Entity Spawner
  const loadSector = useCallback(
    (index: number) => {
      const sec = SECTOR_CATALOG[index] || SECTOR_CATALOG[0];

      // Spawn Asteroids
      const newAsteroids: Asteroid[] = [];
      const densityMult = directorParams.asteroidDensityMultiplier || 1.0;
      const astCount = Math.round((20 + index * 4) * densityMult);
      const minerals = ["Titanium-Silicate", "Platinum-Ferrite", "Xenon-Ice", "Hyper-Dense Basalt"];

      for (let i = 0; i < astCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 2200 + 350;
        const radius = Math.random() * 26 + 18;
        const mineral = minerals[Math.floor(Math.random() * minerals.length)];

        // Generate rough polygon vertices
        const points: { x: number; y: number }[] = [];
        const numPts = Math.floor(Math.random() * 4 + 7);
        for (let p = 0; p < numPts; p++) {
          const ptAngle = (p / numPts) * Math.PI * 2;
          const r = radius * (0.75 + Math.random() * 0.45);
          points.push({
            x: Math.cos(ptAngle) * r,
            y: Math.sin(ptAngle) * r,
          });
        }

        newAsteroids.push({
          id: `ast-${index}-${i}`,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          radius,
          health: radius * 3,
          maxHealth: radius * 3,
          mineral,
          value: Math.round(radius * 12),
          points,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.8,
        });
      }

      // Spawn Quantum Relics
      const newRelics: QuantumRelic[] = [];
      const relicClassifications = [
        "Type-IV Chrono Singularity Shard",
        "Strontium Harmonic Resonator",
        "Tachyon Containment Core",
        "Strangelet Spatial Fragment",
        "Precursor Dark-Energy Relic",
      ];
      const colors = ["#a855f7", "#ec4899", "#38bdf8", "#f59e0b", "#10b981"];

      for (let r = 0; r < sec.relicsNeeded + 2; r++) {
        const angle = (r / (sec.relicsNeeded + 2)) * Math.PI * 2 + Math.random() * 0.4;
        const dist = Math.random() * 1800 + 400;

        newRelics.push({
          id: `relic-${index}-${r}`,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          radius: 14,
          name: `Relic Matrix #${r + 1}`,
          classification: relicClassifications[r % relicClassifications.length],
          molecularDensity: parseFloat((Math.random() * 8 + 14).toFixed(2)),
          quantumCoherence: Math.floor(Math.random() * 15 + 85),
          value: Math.floor(Math.random() * 800 + 1200),
          pulsePhase: Math.random() * Math.PI * 2,
          color: colors[r % colors.length],
          isAnalyzed: false,
          scanProgress: 0,
          mantraFrequency: 390 + Math.random() * 80,
          mantraTargetFrequency: 432,
          mantraPhaseAngle: Math.floor(Math.random() * 360),
          mantraHarmonicRatio: 1.5,
          isMantraResonanceLocked: false,
        });
      }

      // Spawn Hostile Rogue Drones
      const newDrones: RogueDrone[] = [];
      const droneCount = 3 + index * 2;
      for (let d = 0; d < droneCount; d++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 2000 + 600;
        const droneType = d % 3 === 0 ? "HEAVY_SENTINEL" : "INTERCEPTOR";

        newDrones.push({
          id: `drone-${index}-${d}`,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          vx: 0,
          vy: 0,
          heading: 0,
          radius: droneType === "HEAVY_SENTINEL" ? 22 : 15,
          health: droneType === "HEAVY_SENTINEL" ? 140 : 70,
          maxHealth: droneType === "HEAVY_SENTINEL" ? 140 : 70,
          shields: droneType === "HEAVY_SENTINEL" ? 60 : 20,
          maxShields: droneType === "HEAVY_SENTINEL" ? 60 : 20,
          droneType,
          fireCooldown: droneType === "HEAVY_SENTINEL" ? 1800 : 2400,
          lastFireTime: performance.now() + Math.random() * 2000,
          evasionTimer: 0,
        });
      }

      setAsteroids(newAsteroids);
      setRelics(newRelics);
      setDrones(newDrones);
      setProjectiles([]);
      setLoot([]);

      setVessel((v) => ({
        ...v,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        relicsRecovered: 0,
        sectorIndex: index,
      }));
    },
    [directorParams.asteroidDensityMultiplier]
  );

  // Initialize first sector
  useEffect(() => {
    loadSector(0);
  }, [loadSector]);

  // Audio Mute Toggle
  const handleToggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    soundManager.setMuted(nextState);
  };

  // Warp Jump to Next Sector
  const handleJumpNextSector = () => {
    setIsWarping(true);
    soundManager.playAlarmKlaxon();

    setTimeout(() => {
      const nextIndex = (sectorIndex + 1) % SECTOR_CATALOG.length;
      setSectorIndex(nextIndex);
      loadSector(nextIndex);
      setIsWarping(false);

      // Assistant notification
      const newSectorName = SECTOR_CATALOG[nextIndex].name;
      soundManager.speakCockpitCallout(`Warp jump completed. Arrived in ${newSectorName}.`);

      setChatHistory((prev) => [
        ...prev,
        {
          id: "warp-" + Date.now(),
          sender: "ASSISTANT_VECTOR",
          text: `Sub-space warp successful. We have entered ${newSectorName}. Telemetry scanners are mapping local gravitational and quantum fields.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        },
      ]);
    }, 1800);
  };

  // Performance telemetry callbacks
  const handleShotFired = useCallback(() => {
    setPmi((prev) => {
      const nextFired = prev.shotsFired + 1;
      const acc = Math.round((prev.shotsHit / Math.max(1, nextFired)) * 100);
      const overall = (acc * 0.35 + prev.thermalStability * 0.3 + prev.kinematicEfficiency * 0.2 + prev.salvageCadence * 0.15);
      return {
        ...prev,
        shotsFired: nextFired,
        gunneryAccuracy: acc,
        overallScore: Math.min(100, Math.max(10, overall)),
      };
    });
  }, []);

  const handleShotHit = useCallback(() => {
    setPmi((prev) => {
      const nextHit = prev.shotsHit + 1;
      const acc = Math.round((nextHit / Math.max(1, prev.shotsFired)) * 100);
      const overall = (acc * 0.35 + prev.thermalStability * 0.3 + prev.kinematicEfficiency * 0.2 + prev.salvageCadence * 0.15);
      return {
        ...prev,
        shotsHit: nextHit,
        gunneryAccuracy: acc,
        overallScore: Math.min(100, Math.max(10, overall)),
      };
    });
  }, []);

  const handleDistanceTraveled = useCallback((dist: number) => {
    setPmi((prev) => ({
      ...prev,
      distanceTraveled: Math.round(prev.distanceTraveled + dist),
      kinematicEfficiency: Math.min(98, Math.max(30, Math.round(65 + (prev.distanceTraveled % 300) / 10))),
    }));
  }, []);

  const handleThermalStrainTime = useCallback((deltaSec: number) => {
    setPmi((prev) => {
      const strain = prev.timeUnderThermalStrain + deltaSec;
      const stab = Math.max(15, Math.round(100 - strain * 1.8));
      return {
        ...prev,
        timeUnderThermalStrain: strain,
        thermalStability: stab,
      };
    });
  }, []);

  // AI Director: Evaluate & Dynamically Adjust Difficulty
  const handleEvaluateDirector = async (customRationale?: string) => {
    try {
      const payload = {
        pmi,
        telemetry: {
          hull: Math.round(vessel.hull),
          shields: Math.round(vessel.shields),
          coreTemp: Math.round(vessel.coreTemp),
          droneKills: vessel.droneKills,
          relicsRecovered: vessel.relicsRecovered,
          salvageCredits: vessel.salvageCredits,
          currentTier: directorParams.tier,
        },
      };

      let data: any = null;
      try {
        const res = await fetch("/api/assistant/evaluate-director", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch (fetchErr) {
        // Network unavailable or transient fetch interruption
      }

      // If network response was unavailable, compute algorithmic fallback locally
      if (!data) {
        const score = pmi.overallScore ?? 50;
        const kills = vessel.droneKills;
        const hull = vessel.hull;
        let localTier: DifficultyTier = "OPERATOR";
        let localMult = 1.0;
        let localAggression = 50;
        let localFireMult = 1.0;
        let localAstMult = 1.0;
        let localThermalRate = 1.0;

        if (score >= 82 || (kills >= 8 && hull > 65)) {
          localTier = "QUANTUM_OVERLORD";
          localMult = 2.0;
          localAggression = 95;
          localFireMult = 0.65;
          localAstMult = 1.5;
          localThermalRate = 0.85;
        } else if (score >= 60 || kills >= 4) {
          localTier = "VECTORED_ACE";
          localMult = 1.4;
          localAggression = 75;
          localFireMult = 0.8;
          localAstMult = 1.25;
          localThermalRate = 0.95;
        } else if (score < 30 || hull < 35 || vessel.coreTemp > 520) {
          localTier = "CADET";
          localMult = 0.75;
          localAggression = 25;
          localFireMult = 1.35;
          localAstMult = 0.75;
          localThermalRate = 1.3;
        }

        data = {
          tier: localTier,
          difficultyMultiplier: localMult,
          droneAggression: localAggression,
          droneFireIntervalMultiplier: localFireMult,
          asteroidDensityMultiplier: localAstMult,
          thermalDissipationRate: localThermalRate,
          rationale: `Autonomic telemetry synchronized to ${localTier.replace("_", " ")} matrix.`,
          verbalAlert: `Difficulty calibrated to ${localTier.replace("_", " ")}.`,
        };
      }

      const newTier = data.tier || "OPERATOR";
      const newDirectorParams: DirectorParameters = {
        tier: newTier,
        difficultyMultiplier: data.difficultyMultiplier || 1.0,
        droneAggression: data.droneAggression ?? data.droneParameters?.aggression ?? 50,
        droneFireIntervalMultiplier: data.droneFireIntervalMultiplier ?? data.droneParameters?.fireIntervalMultiplier ?? 1.0,
        asteroidDensityMultiplier: data.asteroidDensityMultiplier ?? data.environmentalHazards?.asteroidFluxRate ?? 1.0,
        thermalDissipationRate: data.thermalDissipationRate ?? data.environmentalHazards?.thermalDissipationRate ?? 1.0,
        environmentalHazardsEnabled: data.environmentalHazardsEnabled ?? true,
        activeScenarios: directorParams.activeScenarios,
      };

      setDirectorParams(newDirectorParams);

      // Add to Director Event Log
      const newLog: DirectorEventLog = {
        id: "dlog-" + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        eventType: "DIFFICULTY_ADAPTATION",
        description: data.directorRationale || data.rationale || `Difficulty calibrated to ${newTier.replace("_", " ")}.`,
        impact: `Aggression: ${newDirectorParams.droneAggression}%, Mult: ${newDirectorParams.difficultyMultiplier}x.`,
      };

      setDirectorLogs((prev) => [newLog, ...prev.slice(0, 19)]);

      const alertMsg = data.audioBroadcast || data.verbalAlert;
      if (alertMsg) {
        soundManager.speakCockpitCallout(alertMsg);
      }
    } catch (err) {
      // Graceful fallback to avoid interrupting game loop
    }
  };

  // Generate & Inject Emergent Scenario
  const handleInjectScenario = async (type?: string, customPrompt?: string) => {
    try {
      const payload = {
        scenarioType: type,
        customPrompt,
        pmi,
        telemetry: {
          hull: Math.round(vessel.hull),
          shields: Math.round(vessel.shields),
          coreTemp: Math.round(vessel.coreTemp),
          droneKills: vessel.droneKills,
          sectorName: currentSector.name,
        },
      };

      let data: any = null;
      try {
        const res = await fetch("/api/assistant/generate-scenario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch (fetchErr) {
        // Fallback below
      }

      if (!data) {
        data = {
          title: "SCENARIO: SENTINEL VANGUARD INCURSION",
          type: "SENTINEL_INCURSION",
          hazardDescription: "Rogue Sentinel interceptor vanguard deployed to intercept AETHER-7.",
          technicalDirective: "Neutralize hostiles and maintain shield integrity.",
          durationSeconds: 60,
          objectiveText: "Neutralize 3 Rogue Sentinel Interceptors",
          objectiveTarget: 3,
          bonusSalvageReward: 2500,
          verbalBroadcast: "Tactical Scenario initiated: Sentinel Vanguard Incursion.",
        };
      }

      const scenarioData = data.scenario || data;
      const scenario: EmergentScenario = {
        id: scenarioData.id || "scen-" + Date.now(),
        type: (scenarioData.type as any) || (type as any) || "SENTINEL_INCURSION",
        title: scenarioData.title || "EMERGENT TACTICAL INCURSION",
        hazardDescription: scenarioData.hazardDescription || "Hostile spatial disturbance detected.",
        technicalDirective: scenarioData.technicalDirective || "Neutralize threats and secure the sector.",
        durationSeconds: scenarioData.durationSeconds || scenarioData.duration || 60,
        activeTimeRemaining: scenarioData.durationSeconds || scenarioData.duration || 60,
        objectiveText: scenarioData.objectiveText || "Eliminate 3 hostiles",
        objectiveTarget: scenarioData.objectiveTarget || 3,
        objectiveCurrent: 0,
        bonusSalvageReward: scenarioData.bonusSalvageReward || scenarioData.bonusSalvage || 1500,
        environmentalModifiers: scenarioData.environmentalModifiers || {},
        verbalBroadcast: scenarioData.verbalBroadcast || scenarioData.audioBriefing,
      };

      setActiveScenario(scenario);
      soundManager.playAlarmKlaxon();

      if (scenario.verbalBroadcast) {
        soundManager.speakCockpitCallout(scenario.verbalBroadcast);
      }

      // Log to Director Event Chronology
      setDirectorLogs((prev) => [
        {
          id: "dlog-" + Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          eventType: "SCENARIO_INJECTION",
          description: `Engaged: ${scenario.title}. ${scenario.hazardDescription}`,
          impact: `Target: ${scenario.objectiveText} (+${scenario.bonusSalvageReward} ¢).`,
        },
        ...prev.slice(0, 19),
      ]);
    } catch (err) {
      // Graceful fallback
    }
  };

  // Manual Difficulty Tier Override
  const handleSetDifficultyTierManually = (tier: DifficultyTier) => {
    soundManager.playUiClick();
    let mult = 1.0;
    let aggression = 50;
    let fireMult = 1.0;
    let astMult = 1.0;

    switch (tier) {
      case "CADET":
        mult = 0.75;
        aggression = 30;
        fireMult = 1.3;
        astMult = 0.8;
        break;
      case "OPERATOR":
        mult = 1.0;
        aggression = 50;
        fireMult = 1.0;
        astMult = 1.0;
        break;
      case "VECTORED_ACE":
        mult = 1.4;
        aggression = 75;
        fireMult = 0.8;
        astMult = 1.25;
        break;
      case "QUANTUM_OVERLORD":
        mult = 2.0;
        aggression = 95;
        fireMult = 0.6;
        astMult = 1.5;
        break;
    }

    setDirectorParams({
      tier,
      difficultyMultiplier: mult,
      droneAggression: aggression,
      droneFireIntervalMultiplier: fireMult,
      asteroidDensityMultiplier: astMult,
      thermalDissipationRate: tier === "CADET" ? 1.25 : tier === "QUANTUM_OVERLORD" ? 0.8 : 1.0,
      environmentalHazardsEnabled: true,
      activeScenarios: directorParams.activeScenarios,
    });

    setDirectorLogs((prev) => [
      {
        id: "dlog-" + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        eventType: "MANUAL_TIER_OVERRIDE",
        description: `Commander manually selected ${tier.replace("_", " ")} difficulty matrix.`,
        impact: `Multiplier: ${mult}x | Aggression: ${aggression}%.`,
      },
      ...prev.slice(0, 19),
    ]);

    soundManager.speakCockpitCallout(`Difficulty profile shifted to ${tier.replace("_", " ")}.`);
  };

  // Active Scenario Timer & Completion Loop
  useEffect(() => {
    if (!activeScenario) return;

    const timer = setInterval(() => {
      setActiveScenario((prev) => {
        if (!prev) return null;
        const nextTime = prev.activeTimeRemaining - 1;

        if (nextTime <= 0) {
          soundManager.speakCockpitCallout("Emergent scenario timeline expired.");
          return null;
        }

        return {
          ...prev,
          activeTimeRemaining: nextTime,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeScenario]);

  // Periodic Autonomic Director Evaluation (every 45s)
  useEffect(() => {
    const interval = setInterval(() => {
      handleEvaluateDirector("Periodic Autonomic Telemetry Calibration");
    }, 45000);

    return () => clearInterval(interval);
  }, [pmi, vessel]);

  // Handlers for game events
  const handleRelicCaptured = (relic: QuantumRelic) => {
    setVessel((v) => ({
      ...v,
      relicsRecovered: v.relicsRecovered + 1,
      salvageCredits: v.salvageCredits + relic.value,
      score: v.score + 500,
      statusLog: `Quantum Relic captured: ${relic.name} (+${relic.value} ¢)`,
    }));
    setInspectingRelic(relic);

    // Scenario Objective Progress
    if (activeScenario && activeScenario.type === "SINGULARITY_SURGE") {
      setActiveScenario((prev) => {
        if (!prev) return null;
        const current = prev.objectiveCurrent + 1;
        if (current >= prev.objectiveTarget) {
          soundManager.speakCockpitCallout("Scenario objective accomplished! Bonus credits awarded.");
          setVessel((v) => ({
            ...v,
            salvageCredits: v.salvageCredits + (prev.bonusSalvage || prev.bonusSalvageReward || 1500),
            score: v.score + 1000,
          }));
          return null;
        }
        return { ...prev, objectiveCurrent: current };
      });
    }
  };

  const handleDroneDestroyed = (drone: RogueDrone) => {
    setVessel((v) => ({
      ...v,
      droneKills: v.droneKills + 1,
      salvageCredits: v.salvageCredits + (drone.droneType === "HEAVY_SENTINEL" ? 600 : 300),
      score: v.score + 350,
      statusLog: `Hostile ${drone.droneType} eliminated.`,
    }));

    // Scenario Objective Progress
    if (activeScenario && (activeScenario.type === "SENTINEL_INCURSION" || activeScenario.type === "ION_STORM")) {
      setActiveScenario((prev) => {
        if (!prev) return null;
        const current = prev.objectiveCurrent + 1;
        if (current >= prev.objectiveTarget) {
          soundManager.speakCockpitCallout("Scenario objective accomplished! Tactical bonus credits credited.");
          setVessel((v) => ({
            ...v,
            salvageCredits: v.salvageCredits + (prev.bonusSalvage || prev.bonusSalvageReward || 1500),
            score: v.score + 1000,
          }));
          return null;
        }
        return { ...prev, objectiveCurrent: current };
      });
    }
  };

  const handleAsteroidDestroyed = (ast: Asteroid) => {
    setVessel((v) => ({
      ...v,
      salvageCredits: v.salvageCredits + ast.value,
      score: v.score + 50,
    }));
  };

  const handleLootCollected = (item: FloatingLoot) => {
    setVessel((v) => {
      let coreTemp = v.coreTemp;
      let energy = v.energy;
      let credits = v.salvageCredits;

      if (item.type === "CRYO_COOLANT") {
        coreTemp = Math.max(300, coreTemp - 80);
      } else if (item.type === "ENERGY_CELL") {
        energy = Math.min(v.maxEnergy, energy + 40);
      } else {
        credits += item.value;
      }

      return {
        ...v,
        coreTemp,
        energy,
        salvageCredits: credits,
        score: v.score + 100,
      };
    });
  };

  const handleVesselDamaged = (dmg: number, isShield: boolean) => {
    if (vessel.hull < 30) {
      soundManager.playAlarmKlaxon();
    }
  };

  // Assistant Power Directive execution
  const handleExecutePowerDirective = (newPower: PowerAllocations) => {
    soundManager.playUiClick();
    setVessel((v) => ({
      ...v,
      powerAllocations: newPower,
      statusLog: "Dr. VECTOR power directive applied.",
    }));

    setChatHistory((prev) => [
      ...prev,
      {
        id: "dir-" + Date.now(),
        sender: "SYSTEM",
        text: `EXECUTED POWER DIRECTIVE: Engines ${newPower.engines}%, Shields ${newPower.shields}%, Weapons ${newPower.weapons}%, Sensors ${newPower.sensors}%, Cooling ${newPower.cooling}%.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      },
    ]);
  };

  const handleEmergencyVent = () => {
    soundManager.playVentHiss();
    setVessel((v) => ({
      ...v,
      coreTemp: Math.max(300, v.coreTemp - 140),
      lastVentTime: performance.now(),
      statusLog: "Emergency cryo-heat manifold purged.",
    }));
  };

  // Toggle active weapon system (Pulse Laser vs Heavy Railgun)
  const handleToggleWeapon = () => {
    soundManager.playWeaponSwitch();
    setVessel((v) => {
      const nextWeapon = v.selectedWeapon === "PULSE_LASER" ? "HEAVY_RAILGUN" : "PULSE_LASER";
      const weaponDesc =
        nextWeapon === "PULSE_LASER"
          ? "Pulse Laser [Rapid Fire / Low Heat]"
          : "Heavy Railgun [Shield Penetration 65% / High Kinetic Output]";
      return {
        ...v,
        selectedWeapon: nextWeapon,
        statusLog: `Ordnance matrix switched to: ${weaponDesc}.`,
      };
    });
  };

  // Reconstitute Vessel on Destruction
  const handleReconstitute = () => {
    soundManager.playUiClick();
    setVessel((v) => ({
      ...v,
      hull: 100,
      shields: 100,
      coreTemp: 300,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      statusLog: "Vessel frame reconstituted at local sector anchor.",
    }));
  };

  const isDestroyed = vessel.hull <= 0;

  return (
    <div className="bg-slate-950 text-slate-300 font-sans h-screen w-screen flex flex-col overflow-hidden select-none">
      {/* Top Protocol & Aerospace Telemetry Header */}
      <CockpitHeader
        vessel={vessel}
        sector={currentSector}
        difficultyTier={directorParams.tier}
        activeScenario={activeScenario}
        pmiScore={pmi.overallScore}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenBriefing={() => setShowBriefing(true)}
        onJumpNextSector={handleJumpNextSector}
        onOpenDharmaModal={() => setIsDharmaModalOpen(true)}
      />

      {/* Main High-Density Workspace */}
      <main className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden relative">
        {/* Center Orbital Viewport Canvas */}
        <section className="flex-1 h-[52vh] lg:h-full relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
          <FlightCanvas
            vessel={vessel}
            setVessel={setVessel}
            sector={currentSector}
            directorParams={directorParams}
            activeScenario={activeScenario}
            asteroids={asteroids}
            setAsteroids={setAsteroids}
            relics={relics}
            setRelics={setRelics}
            drones={drones}
            setDrones={setDrones}
            projectiles={projectiles}
            setProjectiles={setProjectiles}
            loot={loot}
            setLoot={setLoot}
            onRelicCaptured={handleRelicCaptured}
            onDroneDestroyed={handleDroneDestroyed}
            onAsteroidDestroyed={handleAsteroidDestroyed}
            onLootCollected={handleLootCollected}
            onVesselDamaged={handleVesselDamaged}
            onAnomalyScanTriggered={(r) => {
              setInspectingRelic(r);
              setIsVedicResonanceOpen(true);
            }}
            onTriggerVedicResonance={(r) => {
              setInspectingRelic(r);
              setIsVedicResonanceOpen(true);
            }}
            onShotFired={handleShotFired}
            onShotHit={handleShotHit}
            onDistanceTraveled={handleDistanceTraveled}
            onThermalStrainTime={handleThermalStrainTime}
          />

          {/* High-Density Floating HUD Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none z-20 font-mono text-[9px]">
            <div className="bg-slate-900/90 border border-slate-700 px-2 py-1 text-slate-300 flex items-center gap-2 backdrop-blur-sm">
              <span className="text-cyan-400 font-bold uppercase">{currentSector.name}</span>
              <span className="text-slate-500">//</span>
              <span className="text-slate-400">X: {Math.round(vessel.x)} Y: {Math.round(vessel.y)}</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-700 px-2 py-1 text-slate-300 flex items-center gap-2 backdrop-blur-sm pointer-events-auto">
              <span className="text-slate-400">DELTA-V:</span>
              <span className="text-cyan-300 font-bold">{Math.round(Math.hypot(vessel.vx, vessel.vy))} m/s</span>
              <span className="text-slate-500">//</span>
              <span className="text-slate-400">ORDNANCE:</span>
              <button
                onClick={() => {
                  soundManager.playUiClick();
                  const astras: ("AGNEYA_ASTRA" | "VARUNA_ASTRA" | "VAYAVYA_ASTRA" | "NARAYANASTRA" | "BRAHMASTRA")[] = [
                    "AGNEYA_ASTRA",
                    "VARUNA_ASTRA",
                    "VAYAVYA_ASTRA",
                    "NARAYANASTRA",
                    "BRAHMASTRA",
                  ];
                  const currentIndex = astras.indexOf((vessel.selectedAstra as any) || "AGNEYA_ASTRA");
                  const nextAstra = astras[(currentIndex + 1) % astras.length];
                  setVessel((v) => ({
                    ...v,
                    selectedAstra: nextAstra,
                    selectedWeapon: nextAstra === "VAYAVYA_ASTRA" ? "HEAVY_RAILGUN" : "PULSE_LASER",
                    statusLog: `Ordnance switched: ${nextAstra.replace("_", " ")}`,
                  }));
                }}
                title="Click to cycle active Astra ordnance"
                className={`font-bold hover:underline cursor-pointer flex items-center gap-1 ${
                  vessel.selectedAstra === "VAYAVYA_ASTRA"
                    ? "text-amber-400"
                    : vessel.selectedAstra === "VARUNA_ASTRA"
                    ? "text-cyan-400"
                    : vessel.selectedAstra === "NARAYANASTRA"
                    ? "text-purple-400"
                    : vessel.selectedAstra === "BRAHMASTRA"
                    ? "text-pink-400"
                    : "text-sky-400"
                }`}
              >
                <span>{vessel.selectedAstra ? vessel.selectedAstra.replace("_", " ") : "PULSE LASER"}</span>
                <span className="text-[8px] opacity-60">⟳</span>
              </button>
            </div>
            {currentSector.id === "sector-kala" && (
              <button
                onClick={() => setIsKalaEndingOpen(true)}
                className="pointer-events-auto mt-1 px-2.5 py-1 bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-slate-950 font-bold uppercase tracking-wider text-[9px] rounded-sm flex items-center gap-1.5 shadow-lg shadow-purple-950/50 transition animate-pulse"
              >
                <Sparkles className="w-3 h-3" />
                INITIATE KALA SINGULARITY CONFRONTATION
              </button>
            )}
          </div>

          <div className="absolute top-2 right-2 flex flex-col gap-1 pointer-events-none z-20 font-mono text-[9px] text-right">
            <div className="bg-slate-900/90 border border-slate-700 px-2 py-1 text-slate-300 flex items-center gap-2 backdrop-blur-sm">
              <span className="text-slate-400">PMI MASTERY:</span>
              <span className="text-purple-400 font-bold">{pmi.overallScore.toFixed(0)}/100</span>
              <span className="text-slate-500">//</span>
              <span className="text-slate-400">DIRECTOR:</span>
              <span className="text-cyan-400 font-bold">{directorParams.tier.replace("_", " ")}</span>
            </div>
          </div>

          {/* Warp Tunnel Transition Overlay */}
          {isWarping && (
            <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-lg flex flex-col items-center justify-center font-mono">
              <Sparkles className="w-12 h-12 text-cyan-400 animate-spin duration-700" />
              <div className="text-lg font-black text-cyan-300 tracking-widest mt-3 animate-pulse">
                FOLDING SUB-SPACE LATTICE...
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                TRANSIT TO NEXT SECTOR IN PROGRESS
              </div>
            </div>
          )}

          {/* Vessel Meltdown / Destruction Overlay */}
          {isDestroyed && (
            <div className="absolute inset-0 z-40 bg-rose-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 font-mono text-center">
              <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
              <h2 className="text-xl font-extrabold text-rose-400 tracking-wider mt-3 uppercase">
                CRITICAL HULL INTEGRITY COMPROMISED
              </h2>
              <p className="text-xs text-slate-300 max-w-md mt-2 font-sans">
                Dr. V.E.C.T.O.R.: "Frigate structural frame breached. Subsystem containment failed. Engaging emergency drone reconstitution protocol."
              </p>
              <button
                onClick={handleReconstitute}
                className="mt-4 px-5 py-2 bg-gradient-to-r from-rose-600 to-cyan-600 hover:from-rose-500 hover:to-cyan-500 text-slate-950 rounded-sm text-xs font-bold flex items-center gap-2 shadow-xl shadow-rose-950/50 transition uppercase"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RECONSTITUTE AETHER-7 FRIGATE
              </button>
            </div>
          )}
        </section>

        {/* Right High-Density Tactical Deck */}
        <aside className="w-full lg:w-[460px] xl:w-[500px] h-[48vh] lg:h-full border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/90 flex flex-col justify-between overflow-hidden shadow-2xl z-20 shrink-0">
          {/* Deck Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 font-mono text-[10px] uppercase select-none">
            <button
              onClick={() => {
                soundManager.playUiClick();
                setActiveTab("ASSISTANT");
              }}
              className={`flex-1 py-2 px-3 font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === "ASSISTANT"
                  ? "bg-slate-950 text-cyan-400 border-b-2 border-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              DR. V.E.C.T.O.R. (AI ASSISTANT)
            </button>
            <button
              onClick={() => {
                soundManager.playUiClick();
                setActiveTab("SUBSYSTEMS");
              }}
              className={`flex-1 py-2 px-3 font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === "SUBSYSTEMS"
                  ? "bg-slate-950 text-cyan-400 border-b-2 border-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              POWER MATRIX & THERMALS
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === "ASSISTANT" ? (
              <AssistantManagerPanel
                vessel={vessel}
                setVessel={setVessel}
                diagnostic={diagnostic}
                setDiagnostic={setDiagnostic}
                chatHistory={chatHistory}
                setChatHistory={setChatHistory}
                pmi={pmi}
                directorParams={directorParams}
                directorLogs={directorLogs}
                activeScenario={activeScenario}
                onExecutePowerDirective={handleExecutePowerDirective}
                onEmergencyVent={handleEmergencyVent}
                onEvaluateDirector={handleEvaluateDirector}
                onInjectScenario={handleInjectScenario}
                onSetDifficultyTierManually={handleSetDifficultyTierManually}
              />
            ) : (
              <SubsystemManager
                vessel={vessel}
                setVessel={setVessel}
                onVentRequested={handleEmergencyVent}
              />
            )}
          </div>
        </aside>
      </main>

      {/* High-Density Command Footer Bar */}
      <footer className="h-10 border-t border-slate-800 bg-slate-900 flex items-center px-3 sm:px-4 justify-between font-mono text-xs select-none shrink-0 z-30">
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          <span className="text-cyan-400 font-bold">&gt;</span>
          <span className="text-slate-400 text-[10px] truncate max-w-[280px] sm:max-w-md md:max-w-xl">
            $ {vessel.statusLog}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative group flex items-center">
            <button
              id="toggle-weapon-btn"
              onClick={handleToggleWeapon}
              className={`relative overflow-hidden px-2.5 py-1 border text-[10px] font-bold uppercase transition-all duration-300 rounded-sm flex items-center gap-1.5 ${
                vessel.selectedWeapon === "HEAVY_RAILGUN"
                  ? "bg-amber-950/90 border-amber-400 text-amber-200 hover:bg-amber-900/90 railgun-active-pulse"
                  : "bg-cyan-950/80 border-cyan-500 text-cyan-300 hover:bg-cyan-900 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
              }`}
            >
              {vessel.selectedWeapon === "HEAVY_RAILGUN" && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm">
                  <div className="w-2/3 h-full bg-gradient-to-r from-transparent via-amber-400/30 to-transparent railgun-scan-sweep" />
                </div>
              )}
              <Zap
                className={`w-3 h-3 relative z-10 transition-transform ${
                  vessel.selectedWeapon === "HEAVY_RAILGUN" ? "text-amber-400 animate-pulse scale-110" : "text-cyan-400"
                }`}
              />
              <span className="relative z-10">TOGGLE WEAPON [Q]:</span>
              <span
                className={`relative z-10 font-black tracking-wide ${
                  vessel.selectedWeapon === "HEAVY_RAILGUN"
                    ? "text-amber-300 underline decoration-amber-400 decoration-2 underline-offset-2 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                    : "underline decoration-1 underline-offset-2"
                }`}
              >
                {vessel.selectedWeapon === "HEAVY_RAILGUN" ? "HEAVY RAILGUN" : "PULSE LASER"}
              </span>
            </button>

            {/* Interactive Ordnance Telemetry Tooltip */}
            <div className="absolute bottom-full mb-2.5 right-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50 w-72 bg-slate-950/95 border border-slate-700 shadow-2xl p-2.5 rounded-sm font-mono text-[10px] backdrop-blur-md">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <Zap className={`w-3.5 h-3.5 ${vessel.selectedWeapon === "HEAVY_RAILGUN" ? "text-amber-400" : "text-cyan-400"}`} />
                  <span className={vessel.selectedWeapon === "HEAVY_RAILGUN" ? "text-amber-300" : "text-cyan-300"}>
                    {vessel.selectedWeapon === "HEAVY_RAILGUN" ? "Heavy Railgun Battery" : "Pulse Laser Matrix"}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 bg-slate-900 px-1 py-0.5 border border-slate-800 rounded">
                  [HOTKEY: Q / X]
                </span>
              </div>

              {/* Core Telemetry Stats */}
              <div className="space-y-1.5">
                {/* Shield Penetration */}
                <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800/80 px-2 py-1 rounded-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    SHIELD PENETRATION:
                  </span>
                  <span className={`font-bold ${vessel.selectedWeapon === "HEAVY_RAILGUN" ? "text-amber-400" : "text-slate-400"}`}>
                    {vessel.selectedWeapon === "HEAVY_RAILGUN" ? "65% (Direct Hull DMG)" : "0% (Absorbed First)"}
                  </span>
                </div>

                {/* Heat Generation */}
                <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800/80 px-2 py-1 rounded-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-400" />
                    HEAT GENERATION:
                  </span>
                  <span className={`font-bold ${vessel.selectedWeapon === "HEAVY_RAILGUN" ? "text-rose-400" : "text-emerald-400"}`}>
                    {vessel.selectedWeapon === "HEAVY_RAILGUN" ? "+15.0 K / shot (High)" : "+3.8 K / shot (Nominal)"}
                  </span>
                </div>

                {/* Secondary Specs */}
                <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[9px] text-slate-400">
                  <div className="bg-slate-900/60 p-1 border border-slate-800 rounded-sm">
                    <span className="text-slate-500">BASE DAMAGE:</span>{" "}
                    <span className="text-slate-200 font-bold">
                      {vessel.selectedWeapon === "HEAVY_RAILGUN" ? "105 DMG" : "26 DMG"}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-1 border border-slate-800 rounded-sm">
                    <span className="text-slate-500">FIRE VELOCITY:</span>{" "}
                    <span className="text-slate-200 font-bold">
                      {vessel.selectedWeapon === "HEAVY_RAILGUN" ? "1350 m/s" : "680 m/s"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tooltip Arrow Pointer */}
              <div className="absolute -bottom-1 right-8 w-2 h-2 bg-slate-950 border-b border-r border-slate-700 transform rotate-45" />
            </div>
          </div>
          <button
            id="emergency-vent-btn"
            onClick={handleEmergencyVent}
            className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-bold uppercase transition rounded-sm"
          >
            VENT [V]
          </button>
          <button
            id="toggle-tractor-btn"
            onClick={() => {
              setVessel((v) => ({ ...v, isTractorActive: !v.isTractorActive }));
              soundManager.playUiClick();
            }}
            className={`px-2 py-1 border text-[10px] font-bold uppercase transition rounded-sm ${
              vessel.isTractorActive
                ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
            }`}
          >
            TRACTOR [E]: {vessel.isTractorActive ? "ON" : "OFF"}
          </button>
        </div>
      </footer>

      {/* Modals */}
      {showBriefing && <MissionBriefingModal onClose={() => setShowBriefing(false)} />}
      {inspectingRelic && !isVedicResonanceOpen && (
        <AnomalySpectrometerModal
          relic={inspectingRelic}
          onClose={() => setInspectingRelic(null)}
          onSalvageRelic={(relic, bonus) => {
            setVessel((v) => ({
              ...v,
              salvageCredits: v.salvageCredits + bonus,
              statusLog: `Refined ${relic.name} for +${bonus} Credits.`,
            }));
          }}
        />
      )}
      {isVedicResonanceOpen && inspectingRelic && (
        <VedicResonanceModal
          relic={inspectingRelic}
          onClose={() => {
            setIsVedicResonanceOpen(false);
            setInspectingRelic(null);
          }}
          onResonanceLocked={(relic, bonusCredits) => {
            setVessel((v) => ({
              ...v,
              salvageCredits: v.salvageCredits + bonusCredits,
              relicsRecovered: v.relicsRecovered + 1,
              shields: Math.min(v.maxShields, v.shields + 40),
              statusLog: `OM 432 Hz Resonance Locked! Ancient Vimana relic recovered (+${bonusCredits} Credits).`,
            }));
            setRelics((prev) => prev.filter((r) => r.id !== relic.id));
            setIsVedicResonanceOpen(false);
            setInspectingRelic(null);
          }}
        />
      )}
      {isDharmaModalOpen && (
        <DharmaMatrixModal
          dilemma={DHARMA_DILEMMAS[sectorIndex % DHARMA_DILEMMAS.length] || DHARMA_DILEMMAS[0]}
          onClose={() => setIsDharmaModalOpen(false)}
          onResolveDilemma={(dilemmaId, choiceId, alignment) => {
            setIsDharmaModalOpen(false);
            const isOptionA = choiceId === "OPTION_A";
            setVessel((v) => ({
              ...v,
              karmaBalance: (v.karmaBalance || 0) + (isOptionA ? 20 : -10),
              dharmaPath: isOptionA ? "KARUNA" : "JNANA",
              salvageCredits: v.salvageCredits + (isOptionA ? 1000 : 2500),
              shields: Math.min(v.maxShields, v.shields + (isOptionA ? 50 : 20)),
              statusLog: `Dharma Matrix resolved: Path affirmed as ${alignment}.`,
            }));
          }}
        />
      )}
      {isKalaEndingOpen && (
        <KalaConfrontationModal
          onClose={() => setIsKalaEndingOpen(false)}
          onSelectEnding={(ending) => {
            setVessel((v) => ({
              ...v,
              statusLog: `Cosmic Singularity Confrontation concluded: Chosen Path ${ending}.`,
            }));
          }}
          salvageScore={vessel.salvageCredits}
          dronesDestroyed={vessel.droneKills}
        />
      )}
    </div>
  );
}
