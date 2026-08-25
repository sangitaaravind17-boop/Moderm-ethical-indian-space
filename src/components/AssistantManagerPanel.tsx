import React, { useState, useEffect, useRef } from "react";
import {
  VesselState,
  AssistantDiagnostic,
  ChatMessage,
  PowerAllocations,
  PlayerMasteryIndex,
  DirectorParameters,
  DirectorEventLog,
  EmergentScenario,
  DifficultyTier,
  CognitiveReasoningNode,
} from "../types";
import { soundManager } from "../utils/audio";
import {
  Bot,
  Terminal,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Flame,
  Zap,
  RotateCcw,
  SlidersHorizontal,
  Activity,
  Gauge,
  Crosshair,
  Shield,
  Radio,
  Cpu,
  RefreshCw,
  Target,
  Compass,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  Sliders,
} from "lucide-react";

interface AssistantManagerPanelProps {
  vessel: VesselState;
  setVessel: React.Dispatch<React.SetStateAction<VesselState>>;
  diagnostic: AssistantDiagnostic | null;
  setDiagnostic: React.Dispatch<React.SetStateAction<AssistantDiagnostic | null>>;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  pmi: PlayerMasteryIndex;
  directorParams: DirectorParameters;
  directorLogs: DirectorEventLog[];
  activeScenario: EmergentScenario | null;
  onExecutePowerDirective: (power: PowerAllocations) => void;
  onEmergencyVent: () => void;
  onEvaluateDirector: (customRationale?: string) => Promise<void>;
  onInjectScenario: (type?: string, customPrompt?: string) => Promise<void>;
  onSetDifficultyTierManually: (tier: DifficultyTier) => void;
}

export const AssistantManagerPanel: React.FC<AssistantManagerPanelProps> = ({
  vessel,
  setVessel,
  diagnostic,
  setDiagnostic,
  chatHistory,
  setChatHistory,
  pmi,
  directorParams,
  directorLogs,
  activeScenario,
  onExecutePowerDirective,
  onEmergencyVent,
  onEvaluateDirector,
  onInjectScenario,
  onSetDifficultyTierManually,
}) => {
  const [activeTab, setActiveTab] = useState<"TACTICAL" | "DIRECTOR" | "COGNITIVE">("TACTICAL");
  const [inputText, setInputText] = useState("");
  const [customScenarioPrompt, setCustomScenarioPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isEvaluatingDirector, setIsEvaluatingDirector] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Voice toggle
  const toggleVoice = () => {
    const nextState = !voiceEnabled;
    setVoiceEnabled(nextState);
    soundManager.setVoiceEnabled(nextState);
    soundManager.playUiClick();
  };

  // Run Real-Time Telemetry Diagnosis with Gemini
  const runDiagnosticCheck = async (query?: string, eventType?: string) => {
    setIsProcessing(true);
    soundManager.playRadarPing();

    try {
      const payload = {
        telemetry: {
          hull: Math.round(vessel.hull),
          shields: Math.round(vessel.shields),
          coreTemp: Math.round(vessel.coreTemp),
          reactorPower: vessel.reactorPower,
          powerAllocations: vessel.powerAllocations,
          speed: Math.round(Math.hypot(vessel.vx, vessel.vy)),
          anomaliesDetected: vessel.relicsRecovered,
          salvageCredits: vessel.salvageCredits,
          droneKills: vessel.droneKills,
        },
        playerQuery: query,
        eventType: eventType || "Routine Technical Telemetry Audit",
      };

      const res = await fetch("/api/assistant/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Diagnostic request failed");
      const data = await res.json();

      const newDiag: AssistantDiagnostic = {
        technicalDiagnosis: data.technicalDiagnosis || "Telemetry within acceptable operating envelope.",
        recommendedAction: data.recommendedAction || "Maintain current vector.",
        alertLevel: data.alertLevel || "NOMINAL",
        audioLogSummary: data.audioLogSummary || "Telemetry nominal.",
        suggestedPower: data.suggestedPower,
        timestamp: Date.now(),
      };

      setDiagnostic(newDiag);

      if (data.audioLogSummary) {
        soundManager.speakCockpitCallout(data.audioLogSummary);
      }
    } catch (err) {
      console.error("Diagnostic error:", err);
      setDiagnostic({
        technicalDiagnosis: "Local Telemetry Audit: Subsystems synchronized. Reactor operating at nominal efficiency.",
        recommendedAction: "Monitor Core Temperature and keep Shields charged.",
        alertLevel: "NOMINAL",
        audioLogSummary: "Subsystems synchronized.",
        timestamp: Date.now(),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Send Commander chat message to Dr. VECTOR
  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputText.trim();
    if (!textToSend || isProcessing) return;

    soundManager.playUiClick();
    setInputText("");

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "COMMANDER",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          telemetry: {
            hull: Math.round(vessel.hull),
            shields: Math.round(vessel.shields),
            coreTemp: Math.round(vessel.coreTemp),
            powerAllocations: vessel.powerAllocations,
            salvageCredits: vessel.salvageCredits,
            droneKills: vessel.droneKills,
            pmiScore: Math.round(pmi.overallScore),
            difficultyTier: directorParams.tier,
          },
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();

      const botMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        sender: "ASSISTANT_VECTOR",
        text: data.reply || "Directive received, Commander. Telemetry parameters logged.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        action: data.action,
      };

      setChatHistory((prev) => [...prev, botMsg]);

      if (data.reply) {
        soundManager.speakCockpitCallout(data.reply);
      }

      if (data.action?.type === "SET_POWER" && data.action.power) {
        onExecutePowerDirective(data.action.power);
      } else if (data.action?.type === "VENT_HEAT") {
        onEmergencyVent();
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory((prev) => [
        ...prev,
        {
          id: "bot-err-" + Date.now(),
          sender: "ASSISTANT_VECTOR",
          text: "Communications relay static detected. Local telemetry buffers confirmed stable.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger manual director evaluation
  const handleTriggerDirectorEval = async () => {
    setIsEvaluatingDirector(true);
    soundManager.playRadarPing();
    await onEvaluateDirector("Manual Director Calibration Requested by Commander");
    setIsEvaluatingDirector(false);
  };

  // Trigger scenario injection
  const handleTriggerScenarioInject = async (type?: string) => {
    setIsGeneratingScenario(true);
    soundManager.playUiClick();
    await onInjectScenario(type, customScenarioPrompt);
    setCustomScenarioPrompt("");
    setIsGeneratingScenario(false);
  };

  // Power bus loadout presets
  const POWER_PRESETS = [
    {
      name: "COMBAT INTERCEPTOR",
      desc: "High Pulse Wattage & Aegis Shields",
      power: { engines: 20, shields: 30, weapons: 35, sensors: 5, cooling: 10 },
      color: "border-rose-700/60 text-rose-300 hover:bg-rose-950/40",
    },
    {
      name: "CRYO PURGE",
      desc: "Maximum Heat Dissipation Radiance",
      power: { engines: 15, shields: 15, weapons: 10, sensors: 10, cooling: 50 },
      color: "border-cyan-700/60 text-cyan-300 hover:bg-cyan-950/40",
    },
    {
      name: "ANOMALY RECON",
      desc: "Supercharged Quantum Sensor Array",
      power: { engines: 25, shields: 15, weapons: 10, sensors: 35, cooling: 15 },
      color: "border-purple-700/60 text-purple-300 hover:bg-purple-950/40",
    },
    {
      name: "KINETIC EVASION",
      desc: "Max Sub-light Acceleration & Thrust",
      power: { engines: 50, shields: 25, weapons: 5, sensors: 5, cooling: 15 },
      color: "border-emerald-700/60 text-emerald-300 hover:bg-emerald-950/40",
    },
  ];

  // Simulated Cognitive Neural Reasoning Graph Nodes
  const cognitiveLayers: { name: string; tag: string; nodes: CognitiveReasoningNode[] }[] = [
    {
      name: "1. SENSOR INGRESS LAYER",
      tag: "REAL-TIME TELEMETRY BUS",
      nodes: [
        {
          id: "c1",
          layer: "SENSOR_INGRESS",
          title: "Reactor Thermal Flux",
          value: `${Math.round(vessel.coreTemp)}K (${vessel.coreTemp > 450 ? "STRAIN" : "STABLE"})`,
          weight: Math.min(1, vessel.coreTemp / 600),
          status: vessel.coreTemp > 480 ? "ALERT" : "NOMINAL",
        },
        {
          id: "c2",
          layer: "SENSOR_INGRESS",
          title: "Aegis Shield Harmonic",
          value: `${Math.round(vessel.shields)}% Capacitance`,
          weight: vessel.shields / 100,
          status: vessel.shields < 35 ? "ALERT" : "NOMINAL",
        },
        {
          id: "c3",
          layer: "SENSOR_INGRESS",
          title: "Kinematic Drift Velocity",
          value: `${Math.round(Math.hypot(vessel.vx, vessel.vy))} m/s`,
          weight: 0.74,
          status: "NOMINAL",
        },
      ],
    },
    {
      name: "2. HEURISTIC EVALUATION LAYER",
      tag: "COMBAT & HAZARD CALCULUS",
      nodes: [
        {
          id: "c4",
          layer: "HEURISTIC_EVAL",
          title: "Player Mastery Index (PMI)",
          value: `${pmi.overallScore.toFixed(1)} / 100`,
          weight: pmi.overallScore / 100,
          status: "OPTIMIZING",
        },
        {
          id: "c5",
          layer: "HEURISTIC_EVAL",
          title: "Gunnery Accuracy Ratio",
          value: `${pmi.gunneryAccuracy}% (${pmi.shotsHit}/${pmi.shotsFired})`,
          weight: pmi.gunneryAccuracy / 100,
          status: pmi.gunneryAccuracy > 60 ? "NOMINAL" : "OPTIMIZING",
        },
        {
          id: "c6",
          layer: "HEURISTIC_EVAL",
          title: "Cryo Dissipation Efficiency",
          value: `${(vessel.powerAllocations.cooling * 0.7 * directorParams.thermalDissipationRate).toFixed(1)} K/s`,
          weight: vessel.powerAllocations.cooling / 50,
          status: "NOMINAL",
        },
      ],
    },
    {
      name: "3. PREDICTIVE RISK MATRIX",
      tag: "AUTONOMIC DIRECTOR STATE",
      nodes: [
        {
          id: "c7",
          layer: "PREDICTIVE_RISK",
          title: "Director Threat Tier",
          value: `${directorParams.tier} (${directorParams.difficultyMultiplier.toFixed(1)}x Multiplier)`,
          weight: directorParams.difficultyMultiplier / 2.0,
          status: directorParams.tier === "QUANTUM_OVERLORD" ? "ALERT" : "NOMINAL",
        },
        {
          id: "c8",
          layer: "PREDICTIVE_RISK",
          title: "Sentinel Hostile Aggression",
          value: `${directorParams.droneAggression}% Coordination`,
          weight: directorParams.droneAggression / 100,
          status: directorParams.droneAggression > 70 ? "ALERT" : "NOMINAL",
        },
        {
          id: "c9",
          layer: "PREDICTIVE_RISK",
          title: "Active Scenario State",
          value: activeScenario ? `${activeScenario.title}` : "Baseline Equilibrium",
          weight: activeScenario ? 0.9 : 0.2,
          status: activeScenario ? "ALERT" : "NOMINAL",
        },
      ],
    },
    {
      name: "4. ACTION DISPATCH CONDUIT",
      tag: "SUBSYSTEM & VECTOR OVERRIDES",
      nodes: [
        {
          id: "c10",
          layer: "ACTION_DISPATCH",
          title: "Power Bus Distribution",
          value: `E:${vessel.powerAllocations.engines} S:${vessel.powerAllocations.shields} W:${vessel.powerAllocations.weapons} C:${vessel.powerAllocations.cooling}`,
          weight: 1.0,
          status: "NOMINAL",
        },
        {
          id: "c11",
          layer: "ACTION_DISPATCH",
          title: "Target Lead Solution",
          value: "Quadratic Intercept Solved (v=650m/s)",
          weight: 0.95,
          status: "NOMINAL",
        },
      ],
    },
  ];

  const getAlertBadge = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-950 text-rose-400 border border-rose-800 text-[9px] font-bold uppercase tracking-wider animate-pulse">
            <AlertTriangle className="w-3 h-3" /> CRITICAL
          </span>
        );
      case "HAZARD":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 text-[9px] font-bold uppercase tracking-wider">
            <AlertCircle className="w-3 h-3" /> HAZARD
          </span>
        );
      case "ADVISORY":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800 text-[9px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> ADVISORY
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-bold uppercase tracking-wider">
            <CheckCircle className="w-3 h-3" /> NOMINAL
          </span>
        );
    }
  };

  return (
    <div className="w-full flex flex-col gap-2.5 font-mono text-slate-300 select-none">
      {/* Dr. V.E.C.T.O.R. Header Card */}
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 bg-cyan-950/80 rounded border border-cyan-500/50 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-cyan-500/10 animate-pulse"></div>
              <Bot className="w-4 h-4 text-cyan-400 z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-300 tracking-wider">DR. V.E.C.T.O.R.</span>
                <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800/60 font-bold">
                  AUTONOMIC AI
                </span>
              </div>
              <div className="text-[9px] text-slate-500 tracking-tight">
                Virtual Engineering & Cybernetic Tactical Operations Representative
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              title={voiceEnabled ? "Mute Voice Synthesizer" : "Enable Voice Synthesizer"}
              className={`p-1.5 rounded border text-[10px] transition ${
                voiceEnabled
                  ? "bg-cyan-950/80 border-cyan-700 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                  : "bg-slate-900 border-slate-800 text-slate-600"
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 3 Technical Sub-Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 border border-slate-800 text-[10px] font-bold">
          <button
            onClick={() => {
              setActiveTab("TACTICAL");
              soundManager.playUiClick();
            }}
            className={`py-1 px-1.5 rounded flex items-center justify-center gap-1 transition ${
              activeTab === "TACTICAL"
                ? "bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-[0_0_6px_rgba(6,182,212,0.2)]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Crosshair className="w-3 h-3" />
            <span className="truncate">TACTICAL & CHAT</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("DIRECTOR");
              soundManager.playUiClick();
            }}
            className={`py-1 px-1.5 rounded flex items-center justify-center gap-1 transition ${
              activeTab === "DIRECTOR"
                ? "bg-purple-950 text-purple-300 border border-purple-700/80 shadow-[0_0_6px_rgba(168,85,247,0.2)]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Gauge className="w-3 h-3" />
            <span className="truncate">AI DIRECTOR & PMI</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("COGNITIVE");
              soundManager.playUiClick();
            }}
            className={`py-1 px-1.5 rounded flex items-center justify-center gap-1 transition ${
              activeTab === "COGNITIVE"
                ? "bg-amber-950 text-amber-300 border border-amber-700/80 shadow-[0_0_6px_rgba(245,158,11,0.2)]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span className="truncate">REASONING MATRIX</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: TACTICAL ASSISTANT & CHAT ================= */}
      {activeTab === "TACTICAL" && (
        <div className="flex flex-col gap-2.5">
          {/* Live Diagnostic Audit Box */}
          <div className="p-2.5 bg-slate-900/40 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  TELEMETRY DIAGNOSTIC AUDIT
                </span>
              </div>
              <div className="flex items-center gap-2">
                {diagnostic && getAlertBadge(diagnostic.alertLevel)}
                <button
                  onClick={() => runDiagnosticCheck()}
                  disabled={isProcessing}
                  title="Run Real-Time Telemetry Audit"
                  className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[9px] font-bold uppercase rounded flex items-center gap-1 transition"
                >
                  <RotateCcw className={`w-2.5 h-2.5 ${isProcessing ? "animate-spin" : ""}`} />
                  AUDIT
                </button>
              </div>
            </div>

            {diagnostic && (
              <div className="text-[11px] bg-slate-950/80 p-2.5 border border-slate-800/80 rounded space-y-1.5">
                <div className="text-slate-300 leading-snug">
                  <span className="text-cyan-400 font-bold">[DIAGNOSIS] </span>
                  {diagnostic.technicalDiagnosis}
                </div>
                <div className="text-emerald-300 leading-snug">
                  <span className="text-emerald-400 font-bold">[DIRECTIVE] </span>
                  {diagnostic.recommendedAction}
                </div>
                {diagnostic.suggestedPower && (
                  <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Suggested Grid:</span>
                    <button
                      onClick={() => onExecutePowerDirective(diagnostic.suggestedPower!)}
                      className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-bold uppercase rounded transition"
                    >
                      Apply Suggested Power
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 1-Click Power Loadout Presets */}
          <div className="p-2.5 bg-slate-900/40 border border-slate-800 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>TACTICAL LOADOUT PRESETS</span>
              <span className="text-[9px] text-slate-500">AUTONOMIC POWER BUS</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {POWER_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onExecutePowerDirective(preset.power)}
                  className={`p-1.5 bg-slate-950/80 border rounded text-left transition flex flex-col justify-between ${preset.color}`}
                >
                  <div className="text-[10px] font-bold flex items-center justify-between">
                    <span>{preset.name}</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </div>
                  <div className="text-[8px] text-slate-400 leading-tight truncate">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Tactical Command Chat */}
          <div className="p-2.5 bg-slate-900/40 border border-slate-800 flex flex-col h-[200px]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between pb-1 mb-1 border-b border-slate-800">
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3 text-cyan-400" />
                COMMAND TERMINAL // DR. V.E.C.T.O.R.
              </span>
              <span className="text-[9px] text-cyan-400 animate-pulse">ONLINE</span>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[11px]">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded border leading-snug ${
                    msg.sender === "COMMANDER"
                      ? "bg-slate-900/80 border-slate-700 text-slate-200 ml-4"
                      : "bg-cyan-950/40 border-cyan-800/60 text-cyan-200 mr-4"
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                    <span className="font-bold tracking-wider text-slate-400">
                      {msg.sender === "COMMANDER" ? "COMMANDER (YOU)" : "DR. V.E.C.T.O.R."}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div>{msg.text}</div>
                </div>
              ))}
              {isProcessing && (
                <div className="p-2 bg-cyan-950/20 border border-cyan-800/40 rounded text-cyan-300 text-[10px] flex items-center gap-2">
                  <RotateCcw className="w-3 h-3 animate-spin text-cyan-400" />
                  <span>Computing tactical vector telemetry...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="mt-2 flex gap-1.5">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Order Dr. VECTOR (e.g., 'Route 40% to weapons', 'Vent heat')"
                className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isProcessing || !inputText.trim()}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded transition flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: AUTONOMIC DIRECTOR & PMI ================= */}
      {activeTab === "DIRECTOR" && (
        <div className="flex flex-col gap-2.5">
          {/* Player Mastery Index (PMI) Breakdown */}
          <div className="p-2.5 bg-slate-900/40 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  PLAYER MASTERY INDEX (PMI)
                </span>
              </div>
              <span className="text-xs font-bold text-purple-300 px-2 py-0.5 bg-purple-950 border border-purple-800 rounded">
                SCORE: {pmi.overallScore.toFixed(1)} / 100
              </span>
            </div>

            {/* Metric Bars */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-1.5 bg-slate-950 border border-slate-800 rounded space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Gunnery Accuracy</span>
                  <span className="text-cyan-300 font-bold">{pmi.gunneryAccuracy}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full transition-all duration-500"
                    style={{ width: `${pmi.gunneryAccuracy}%` }}
                  ></div>
                </div>
                <div className="text-[8px] text-slate-500">
                  {pmi.shotsHit} hits / {pmi.shotsFired} laser pulses
                </div>
              </div>

              <div className="p-1.5 bg-slate-950 border border-slate-800 rounded space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Thermal Stability</span>
                  <span className="text-amber-300 font-bold">{pmi.thermalStability}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                  <div
                    className="bg-amber-400 h-full transition-all duration-500"
                    style={{ width: `${pmi.thermalStability}%` }}
                  ></div>
                </div>
                <div className="text-[8px] text-slate-500">
                  Strain time: {pmi.timeUnderThermalStrain.toFixed(1)}s
                </div>
              </div>

              <div className="p-1.5 bg-slate-950 border border-slate-800 rounded space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Kinematic Delta-V</span>
                  <span className="text-emerald-300 font-bold">{pmi.kinematicEfficiency}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-500"
                    style={{ width: `${pmi.kinematicEfficiency}%` }}
                  ></div>
                </div>
                <div className="text-[8px] text-slate-500">
                  Drift conservation rating: High
                </div>
              </div>

              <div className="p-1.5 bg-slate-950 border border-slate-800 rounded space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Salvage Cadence</span>
                  <span className="text-purple-300 font-bold">{pmi.salvageCadence}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                  <div
                    className="bg-purple-400 h-full transition-all duration-500"
                    style={{ width: `${pmi.salvageCadence}%` }}
                  ></div>
                </div>
                <div className="text-[8px] text-slate-500">
                  {vessel.relicsRecovered} relics / {vessel.droneKills} kills
                </div>
              </div>
            </div>
          </div>

          {/* Autonomic AI Director Tier Selector & Live Calibration */}
          <div className="p-2.5 bg-slate-900/40 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  DYNAMIC DIFFICULTY DIRECTOR
                </span>
              </div>
              <button
                onClick={handleTriggerDirectorEval}
                disabled={isEvaluatingDirector}
                className="px-2 py-0.5 bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 text-[9px] font-bold uppercase rounded flex items-center gap-1 transition"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isEvaluatingDirector ? "animate-spin" : ""}`} />
                CALIBRATE AI
              </button>
            </div>

            {/* Difficulty Tier Buttons */}
            <div className="grid grid-cols-4 gap-1 text-[9px] font-bold">
              {(["CADET", "OPERATOR", "VECTORED_ACE", "QUANTUM_OVERLORD"] as DifficultyTier[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => onSetDifficultyTierManually(tier)}
                  className={`py-1.5 px-1 rounded border text-center transition ${
                    directorParams.tier === tier
                      ? tier === "QUANTUM_OVERLORD"
                        ? "bg-purple-950 border-purple-500 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                        : tier === "VECTORED_ACE"
                        ? "bg-amber-950 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                        : tier === "OPERATOR"
                        ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                        : "bg-sky-950 border-sky-500 text-sky-300"
                      : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <div>{tier.replace("_", " ")}</div>
                  <div className="text-[8px] opacity-70">
                    {tier === "QUANTUM_OVERLORD"
                      ? "2.0x"
                      : tier === "VECTORED_ACE"
                      ? "1.4x"
                      : tier === "OPERATOR"
                      ? "1.0x"
                      : "0.75x"}
                  </div>
                </button>
              ))}
            </div>

            {/* Current Director Rationale Readout */}
            <div className="text-[10px] bg-slate-950 p-2 border border-slate-800/80 rounded space-y-1">
              <div className="text-slate-400">
                <span className="text-cyan-400 font-bold">[DIRECTOR RATIONALE] </span>
                Dr. V.E.C.T.O.R. dynamically modulates Sentinel hostile aggression ({directorParams.droneAggression}%) and cryo dissipation conductance ({(directorParams.thermalDissipationRate * 100).toFixed(0)}%) based on real-time PMI telemetry.
              </div>
            </div>
          </div>

          {/* Emergent Scenario Weaver Card */}
          <div className="p-2.5 bg-slate-900/40 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  EMERGENT SCENARIO WEAVER
                </span>
              </div>
              <span className="text-[9px] text-amber-400 font-bold">
                {activeScenario ? "SCENARIO ENGAGED" : "STANDBY"}
              </span>
            </div>

            {activeScenario ? (
              <div className="p-2 bg-amber-950/40 border border-amber-600/50 rounded space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">{activeScenario.title}</span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {Math.round(activeScenario.activeTimeRemaining)}s REMAINING
                  </span>
                </div>
                <div className="text-slate-300 text-[10px] leading-snug">
                  {activeScenario.hazardDescription}
                </div>
                <div className="text-emerald-300 text-[10px]">
                  <span className="font-bold">Directive: </span>
                  {activeScenario.technicalDirective}
                </div>

                {/* Objective Progress */}
                <div className="space-y-1 pt-1 border-t border-amber-800/60">
                  <div className="flex justify-between text-[10px] text-amber-200">
                    <span>Objective: {activeScenario.objectiveText}</span>
                    <span>
                      {activeScenario.objectiveCurrent} / {activeScenario.objectiveTarget}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (activeScenario.objectiveCurrent / activeScenario.objectiveTarget) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400">
                  Inject an emergent tactical scenario or have Dr. V.E.C.T.O.R. generate a custom aerospace challenge:
                </div>
                <div className="grid grid-cols-3 gap-1 text-[9px]">
                  <button
                    onClick={() => handleTriggerScenarioInject("ION_STORM")}
                    disabled={isGeneratingScenario}
                    className="p-1 bg-slate-950 hover:bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded"
                  >
                    ION CORONA
                  </button>
                  <button
                    onClick={() => handleTriggerScenarioInject("SENTINEL_INCURSION")}
                    disabled={isGeneratingScenario}
                    className="p-1 bg-slate-950 hover:bg-slate-900 border border-slate-700 text-rose-300 font-bold rounded"
                  >
                    SENTINEL SWARM
                  </button>
                  <button
                    onClick={() => handleTriggerScenarioInject("SINGULARITY_SURGE")}
                    disabled={isGeneratingScenario}
                    className="p-1 bg-slate-950 hover:bg-slate-900 border border-slate-700 text-purple-300 font-bold rounded"
                  >
                    CHRONO RIFT
                  </button>
                </div>

                {/* Custom AI Scenario Prompt */}
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={customScenarioPrompt}
                    onChange={(e) => setCustomScenarioPrompt(e.target.value)}
                    placeholder="Custom wargame (e.g., 'Heavy EMP ambush with bonus tachyon loot')"
                    className="flex-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-200"
                  />
                  <button
                    onClick={() => handleTriggerScenarioInject()}
                    disabled={isGeneratingScenario}
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-slate-950 font-bold text-[10px] rounded flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    GENERATE
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Director Event Log */}
          <div className="p-2.5 bg-slate-900/40 border border-slate-800 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>DIRECTOR EVENT CHRONOLOGY</span>
              <span className="text-[9px] text-slate-500">{directorLogs.length} EVENTS</span>
            </div>
            <div className="max-h-[110px] overflow-y-auto space-y-1 text-[10px] font-mono bg-slate-950 p-2 border border-slate-800 rounded">
              {directorLogs.map((log) => (
                <div key={log.id} className="leading-tight text-slate-300 border-b border-slate-900 pb-1">
                  <div className="flex items-center justify-between text-[8px] text-slate-500">
                    <span className="text-cyan-400 font-bold">[{log.eventType}]</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <div>{log.description}</div>
                  <div className="text-[9px] text-emerald-400 opacity-90">{log.impact}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: NEURO-VECTOR REASONING MATRIX ================= */}
      {activeTab === "COGNITIVE" && (
        <div className="flex flex-col gap-2.5">
          <div className="p-2 bg-slate-900/40 border border-slate-800 text-[10px] text-slate-400 leading-snug">
            <span className="text-cyan-400 font-bold">NEURO-VECTOR COGNITIVE REASONING: </span>
            Continuous tensor inspection of Dr. V.E.C.T.O.R.'s real-time telemetry heuristics, threat vectors, and autonomic control decisions.
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {cognitiveLayers.map((layer) => (
              <div key={layer.name} className="p-2.5 bg-slate-900/40 border border-slate-800 rounded space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-cyan-300">{layer.name}</span>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest">{layer.tag}</span>
                </div>

                <div className="space-y-1.5">
                  {layer.nodes.map((node) => (
                    <div
                      key={node.id}
                      className="p-1.5 bg-slate-950 border border-slate-800/90 rounded text-[10px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">{node.title}</span>
                        <span
                          className={`text-[9px] font-bold px-1 rounded ${
                            node.status === "ALERT"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : node.status === "OPTIMIZING"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          }`}
                        >
                          {node.value}
                        </span>
                      </div>

                      {/* Weight progress bar */}
                      <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            node.status === "ALERT"
                              ? "bg-rose-400"
                              : node.status === "OPTIMIZING"
                              ? "bg-amber-400"
                              : "bg-cyan-400"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(15, node.weight * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
