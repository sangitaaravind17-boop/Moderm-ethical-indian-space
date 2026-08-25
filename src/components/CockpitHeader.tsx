import React, { useState, useEffect } from "react";
import { VesselState, SectorConfig, DifficultyTier, EmergentScenario } from "../types";
import {
  Compass,
  Shield,
  Heart,
  Flame,
  Coins,
  Gem,
  Volume2,
  VolumeX,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Cpu,
  Radio,
  Activity,
  Zap,
  Scale,
} from "lucide-react";

interface CockpitHeaderProps {
  vessel: VesselState;
  sector: SectorConfig;
  difficultyTier: DifficultyTier;
  activeScenario: EmergentScenario | null;
  pmiScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenBriefing: () => void;
  onJumpNextSector: () => void;
  onOpenDharmaModal?: () => void;
}

export const CockpitHeader: React.FC<CockpitHeaderProps> = ({
  vessel,
  sector,
  difficultyTier,
  activeScenario,
  pmiScore,
  isMuted,
  onToggleMute,
  onOpenBriefing,
  onJumpNextSector,
  onOpenDharmaModal,
}) => {
  const {
    hull,
    shields,
    coreTemp,
    salvageCredits,
    relicsRecovered,
    isHanumanProtocolActive,
    trimurtiActiveMode,
  } = vessel;
  const canJump = relicsRecovered >= sector.relicsNeeded;

  // Real-time mission uptime counter
  const [seconds, setSeconds] = useState(742);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTierBadge = (tier: DifficultyTier) => {
    switch (tier) {
      case "QUANTUM_OVERLORD":
        return "bg-purple-950 text-purple-300 border-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse";
      case "VECTORED_ACE":
        return "bg-amber-950 text-amber-300 border-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.4)]";
      case "OPERATOR":
        return "bg-emerald-950 text-emerald-300 border-emerald-700";
      case "CADET":
      default:
        return "bg-sky-950 text-sky-300 border-sky-700";
    }
  };

  const getTierLabel = (tier: DifficultyTier) => {
    switch (tier) {
      case "QUANTUM_OVERLORD":
        return "APEX OVERLORD (2.0x)";
      case "VECTORED_ACE":
        return "VECTORED ACE (1.4x)";
      case "OPERATOR":
        return "OPERATOR (1.0x)";
      case "CADET":
        return "CADET ASSIST (0.75x)";
    }
  };

  const isCoreOptimal = coreTemp <= 450;

  return (
    <header className="h-12 border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 bg-slate-900/80 backdrop-blur-md text-slate-300 font-mono text-xs select-none z-30 shrink-0">
      {/* Left: System Protocol & Sector Realm Identifier */}
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_#fbbf24]"></div>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
            <span>AETHER-7</span>
            <span className="text-slate-500 font-normal">//</span>
            <span className="text-cyan-300">{sector.realmName || sector.name}</span>
          </span>

          {/* Sanskrit Title Tag */}
          {sector.sanskritTitle && (
            <span className="hidden xl:inline-block text-[10px] text-amber-300/80 px-1.5 py-0.5 bg-amber-950/60 border border-amber-700/50 rounded">
              {sector.sanskritTitle}
            </span>
          )}

          {/* Hanuman Active Glow Badge */}
          {isHanumanProtocolActive && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[9px] font-bold rounded shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse">
              <Zap className="w-3 h-3 text-slate-950 fill-current" />
              <span>HANUMAN OVERCHARGE</span>
            </div>
          )}
          
          {/* Dynamic Difficulty Tier Indicator */}
          <div
            title={`V.E.C.T.O.R. Director Tier: ${difficultyTier}. Player Mastery Index: ${Math.round(pmiScore)}/100`}
            className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase transition-all duration-500 ${getTierBadge(
              difficultyTier
            )}`}
          >
            <Activity className="w-2.5 h-2.5" />
            <span>DIRECTOR: {getTierLabel(difficultyTier)}</span>
          </div>
        </div>
      </div>

      {/* Middle: Active Scenario or High Density Telemetry Status */}
      {activeScenario ? (
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-950/60 border border-amber-500/50 rounded text-amber-300 text-[10px] animate-pulse">
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          <span className="font-bold uppercase tracking-wider">{activeScenario.title}</span>
          <span className="text-slate-400">|</span>
          <span className="text-amber-200">
            OBJ: {activeScenario.objectiveCurrent}/{activeScenario.objectiveTarget} ({Math.round(activeScenario.activeTimeRemaining)}s)
          </span>
        </div>
      ) : (
        <div className="hidden lg:flex items-center gap-5 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase tracking-tighter">TRIMURTI:</span>
            <span className="text-cyan-300 font-bold">{trimurtiActiveMode}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase tracking-tighter">Core:</span>
            <span
              className={`font-bold ${
                isCoreOptimal
                  ? "text-emerald-400"
                  : coreTemp > 500
                  ? "text-rose-400 animate-pulse"
                  : "text-amber-400"
              }`}
            >
              {isCoreOptimal ? "OPTIMAL" : coreTemp > 500 ? "CRITICAL" : "ELEVATED"} ({Math.round(coreTemp)}K)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase tracking-tighter">Hull:</span>
            <span className={`font-semibold ${hull < 35 ? "text-rose-400 font-bold" : "text-slate-100"}`}>
              {Math.round(hull)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase tracking-tighter">Shields:</span>
            <span className="text-sky-300 font-semibold">{Math.round(shields)}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase tracking-tighter">Relics:</span>
            <span className="text-purple-300 font-bold">
              {relicsRecovered}/{sector.relicsNeeded}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase tracking-tighter">Salvage:</span>
            <span className="text-yellow-400 font-semibold">{salvageCredits} ¢</span>
          </div>
        </div>
      )}

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-2">
        {onOpenDharmaModal && (
          <button
            onClick={onOpenDharmaModal}
            title="Dharma Matrix Ethical Reasoning"
            className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900 border border-purple-600 text-purple-300 rounded text-[10px] uppercase font-bold flex items-center gap-1 transition"
          >
            <Scale className="w-3 h-3 text-purple-400" />
            <span className="hidden sm:inline">DHARMA</span>
          </button>
        )}

        {canJump && (
          <button
            onClick={onJumpNextSector}
            className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-slate-950 font-bold text-[10px] uppercase flex items-center gap-1 rounded-sm shadow-[0_0_12px_rgba(34,211,238,0.4)] animate-pulse transition cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            REALM JUMP
            <ChevronRight className="w-3 h-3" />
          </button>
        )}

        <button
          onClick={onOpenBriefing}
          title="Vimana Protocol Operations Manual"
          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-[10px] uppercase font-bold flex items-center gap-1 transition"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">MANUAL</span>
        </button>

        <button
          onClick={onToggleMute}
          title={isMuted ? "Unmute Audio" : "Mute Audio"}
          className={`p-1 rounded border transition ${
            isMuted
              ? "bg-rose-950/50 border-rose-800 text-rose-400"
              : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400"
          }`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
