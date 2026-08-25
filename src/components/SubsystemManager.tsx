import React, { useState } from "react";
import { VesselState, PowerAllocations, AstraWeaponType, TrimurtiState } from "../types";
import { soundManager } from "../utils/audio";
import { ASTRA_CATALOG } from "../data/sectors";
import { CircularProgressCooldown } from "./CircularProgressCooldown";
import {
  Zap,
  Shield,
  Crosshair,
  Radio,
  ThermometerSnowflake,
  Flame,
  Activity,
  Cpu,
  Sparkles,
  Info,
  Layers,
  Power,
  RotateCcw,
} from "lucide-react";

interface SubsystemManagerProps {
  vessel: VesselState;
  setVessel: React.Dispatch<React.SetStateAction<VesselState>>;
  onVentRequested: () => void;
  onTriggerHanumanProtocol?: () => void;
}

export const SubsystemManager: React.FC<SubsystemManagerProps> = ({
  vessel,
  setVessel,
  onVentRequested,
  onTriggerHanumanProtocol,
}) => {
  const {
    powerAllocations,
    coreTemp,
    shields,
    maxShields,
    hull,
    maxHull,
    energy,
    maxEnergy,
    selectedAstra,
    isHanumanProtocolActive,
    hanumanProtocolTimeRemaining,
    trimurtiActiveMode,
  } = vessel;

  const [hoveredAstra, setHoveredAstra] = useState<AstraWeaponType | null>(null);

  // Rebalance power bus cleanly so total is 100%
  const handlePowerChange = (subsystem: keyof PowerAllocations, newValue: number) => {
    soundManager.playUiClick();
    const clampedNew = Math.max(5, Math.min(60, newValue));
    const current = { ...powerAllocations };
    const diff = clampedNew - current[subsystem];

    // Distribute diff proportionally across other 4 subsystems
    const otherKeys = (Object.keys(current) as (keyof PowerAllocations)[]).filter(
      (k) => k !== subsystem
    );
    const sumOthers = otherKeys.reduce((acc, k) => acc + current[k], 0);

    const updated: PowerAllocations = { ...current, [subsystem]: clampedNew };

    if (sumOthers > 0) {
      let remainingToDistribute = -diff;
      otherKeys.forEach((k, idx) => {
        if (idx === otherKeys.length - 1) {
          const sumSoFar = otherKeys
            .slice(0, idx)
            .reduce((acc, pk) => acc + updated[pk], 0);
          updated[k] = Math.max(5, 100 - clampedNew - sumSoFar);
        } else {
          const share = (current[k] / sumOthers) * remainingToDistribute;
          updated[k] = Math.max(5, Math.round(current[k] + share));
        }
      });
    }

    setVessel((v) => ({ ...v, powerAllocations: updated }));
  };

  // Apply Power Preset
  const applyPreset = (name: string, preset: PowerAllocations) => {
    soundManager.playUiClick();
    setVessel((v) => ({
      ...v,
      powerAllocations: preset,
      statusLog: `Chakra matrix configured: ${name}`,
    }));
  };

  // Switch Trimurti Supercomputer Mode
  const handleSetTrimurtiMode = (mode: "BRAHMA" | "VISHNU" | "SHIVA") => {
    soundManager.playUiClick();
    setVessel((v) => ({
      ...v,
      trimurtiActiveMode: mode,
      statusLog: `Trimurti Mode synchronized: ${mode}`,
    }));
  };

  // Select Astra Weapon
  const handleSelectAstra = (astra: AstraWeaponType) => {
    soundManager.playUiClick();
    setVessel((v) => ({
      ...v,
      selectedAstra: astra,
      statusLog: `Astra weapon engaged: ${astra.replace("_", " ")}`,
    }));
  };

  const tempPercentage = Math.min(100, Math.max(0, ((coreTemp - 300) / 300) * 100));
  const isOverheating = coreTemp > 480;
  const currentAstraInfo = ASTRA_CATALOG.find((a) => a.id === selectedAstra) || ASTRA_CATALOG[0];

  // Structural Overview Nodes
  const structuralNodes = [
    { id: "MULA", label: "DRIVE", status: "OK", color: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10" },
    { id: "ANAH", label: "SHLD", status: shields < 30 ? "DEP" : "OK", color: shields < 30 ? "text-amber-400 border-amber-500/50 bg-amber-500/10" : "text-emerald-400 border-emerald-500/50 bg-emerald-500/10" },
    {
      id: "MANI",
      label: "THRM",
      status: isOverheating ? "TEMP" : "OK",
      color: isOverheating ? "text-rose-400 border-rose-500/50 bg-rose-500/20 font-bold animate-pulse" : "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
    },
    { id: "AJNA", label: "SNSR", status: "OK", color: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10" },
    { id: "ASTR", label: "ORDA", status: "RDY", color: "text-purple-400 border-purple-500/50 bg-purple-500/10" },
    {
      id: "HANU",
      label: "PRTL",
      status: isHanumanProtocolActive ? "OVRD" : "STBY",
      color: isHanumanProtocolActive ? "text-amber-300 border-amber-500 bg-amber-500/20 font-bold animate-pulse" : "text-slate-500 border-slate-700 bg-slate-900",
    },
    { id: "TRIM", label: trimurtiActiveMode, status: "SYNC", color: "text-cyan-400 border-cyan-500/50 bg-cyan-500/10" },
    { id: "VIMN", label: "CORE", status: "LOCK", color: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10" },
  ];

  return (
    <div className="w-full flex flex-col gap-3 font-mono text-slate-300 select-none">
      {/* Hanuman Protocol Supercharge Banner */}
      <div className={`p-2.5 border rounded flex items-center justify-between transition-all ${
        isHanumanProtocolActive
          ? "bg-amber-950/70 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
          : "bg-slate-900/60 border-slate-800"
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
            isHanumanProtocolActive ? "bg-amber-400 text-slate-950 animate-pulse" : "bg-slate-800 text-slate-400"
          }`}>
            हनु
          </div>
          <div>
            <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1.5">
              <span>HANUMAN PROTOCOL</span>
              {isHanumanProtocolActive && (
                <span className="text-[9px] px-1 bg-amber-400 text-slate-950 rounded font-bold animate-pulse">
                  ACTIVE ({hanumanProtocolTimeRemaining.toFixed(1)}s)
                </span>
              )}
            </div>
            <div className="text-[9px] text-slate-400 font-sans">
              2.5x Thrust & Kinetic Shield Overcharge // Emergency Surge
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (onTriggerHanumanProtocol) {
              onTriggerHanumanProtocol();
            } else {
              setVessel((v) => ({
                ...v,
                isHanumanProtocolActive: true,
                hanumanProtocolTimeRemaining: 15,
                statusLog: "HANUMAN PROTOCOL ACTIVATED: Emergency kinetic supercharge initiated.",
              }));
              soundManager.playHanumanProtocolBurst();
            }
          }}
          disabled={isHanumanProtocolActive}
          className={`px-3 py-1 text-[10px] font-bold uppercase rounded flex items-center gap-1 transition ${
            isHanumanProtocolActive
              ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
              : "bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)] cursor-pointer"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          {isHanumanProtocolActive ? "OVERCHARGED" : "ACTIVATE"}
        </button>
      </div>

      {/* Astra Weapon Selection Matrix with Hover Tooltip */}
      <div className="p-3 bg-slate-900/50 border border-slate-800 space-y-2 relative">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-purple-400" />
            <span>ASTRA ORDNANCE MATRIX</span>
          </div>
          <span className="text-[9px] text-purple-400 font-bold">
            {currentAstraInfo.sanskritName}
          </span>
        </div>

        {/* 5 Astra Weapon Selector Buttons */}
        <div className="grid grid-cols-5 gap-1 text-[9px]">
          {ASTRA_CATALOG.map((astra) => {
            const isSelected = selectedAstra === astra.id;
            const isHov = hoveredAstra === astra.id;
            const isRailgun = astra.id === "VAYAVYA_ASTRA";

            const buttonElement = (
              <button
                id={isRailgun ? "toggle-weapon-btn" : undefined}
                onClick={() => handleSelectAstra(astra.id)}
                onMouseEnter={() => setHoveredAstra(astra.id)}
                onMouseLeave={() => setHoveredAstra(null)}
                className={`w-full p-1.5 rounded border transition-all text-center relative ${
                  isSelected
                    ? "bg-purple-950 border-purple-400 text-purple-200 font-bold shadow-[0_0_12px_rgba(168,85,247,0.5)] ring-1 ring-purple-400"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                } ${
                  isRailgun && isSelected
                    ? "border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                    : ""
                }`}
              >
                <div className="truncate font-bold">{astra.name.split(" ")[0]}</div>
                <div className="text-[8px] opacity-75">{astra.sanskritName}</div>
              </button>
            );

            return isRailgun ? (
              <CircularProgressCooldown
                key={astra.id}
                lastFired={vessel.lastRailgunFired}
                cooldownMs={vessel.railgunCooldownMs || astra.fireCooldownMs || 850}
                color="#f59e0b"
                className="w-full"
              >
                {buttonElement}
              </CircularProgressCooldown>
            ) : (
              <React.Fragment key={astra.id}>{buttonElement}</React.Fragment>
            );
          })}
        </div>

        {/* Selected / Hovered Weapon Stats Tooltip / Info Card */}
        {(() => {
          const displayAstra = hoveredAstra
            ? ASTRA_CATALOG.find((a) => a.id === hoveredAstra)!
            : currentAstraInfo;
          return (
            <div className="p-2 bg-slate-950 border border-purple-900/50 rounded text-[10px] space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-purple-300 font-bold">{displayAstra.name} ({displayAstra.category})</span>
                <span className="text-amber-400 font-mono font-bold">{displayAstra.damage} DMG</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400 font-mono">
                <div className="flex justify-between bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
                  <span>Shield Penetration:</span>
                  <span className="text-cyan-400 font-bold">{Math.round(displayAstra.shieldPenetration * 100)}%</span>
                </div>
                <div className="flex justify-between bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
                  <span>Heat Generation:</span>
                  <span className={displayAstra.heatCost < 0 ? "text-cyan-400 font-bold" : "text-rose-400 font-bold"}>
                    {displayAstra.heatCost > 0 ? `+${displayAstra.heatCost}K` : `${displayAstra.heatCost}K (Cryo)`}
                  </span>
                </div>
              </div>
              <div className="text-[9px] text-slate-500 font-sans italic">
                {displayAstra.specialTrait}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Trimurti Supercomputer Mode Selector */}
      <div className="p-3 bg-slate-900/50 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>TRIMURTI SUPERCOMPUTER SYSTEM</span>
          </div>
          <span className="text-[9px] text-cyan-400 font-bold">{trimurtiActiveMode} ACTIVE</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          <button
            onClick={() => handleSetTrimurtiMode("BRAHMA")}
            className={`p-2 rounded border transition text-center ${
              trimurtiActiveMode === "BRAHMA"
                ? "bg-amber-950 border-amber-400 text-amber-300 font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="font-bold text-xs">ब्रह्मा BRAHMA</div>
            <div className="text-[8px] text-slate-400">Creation / Nanite Hull Regen</div>
          </button>
          <button
            onClick={() => handleSetTrimurtiMode("VISHNU")}
            className={`p-2 rounded border transition text-center ${
              trimurtiActiveMode === "VISHNU"
                ? "bg-cyan-950 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="font-bold text-xs">विष्णु VISHNU</div>
            <div className="text-[8px] text-slate-400">Preservation / Shield Harmonics</div>
          </button>
          <button
            onClick={() => handleSetTrimurtiMode("SHIVA")}
            className={`p-2 rounded border transition text-center ${
              trimurtiActiveMode === "SHIVA"
                ? "bg-rose-950 border-rose-400 text-rose-300 font-bold shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="font-bold text-xs">शिव SHIVA</div>
            <div className="text-[8px] text-slate-400">Dissolution / Thermal Dissipation</div>
          </button>
        </div>
      </div>

      {/* Structural 8-Node Overview Matrix */}
      <div className="p-2.5 bg-slate-900/40 border border-slate-800">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
          <span>VIMANA NODE INTEGRITY</span>
          <span className="text-[9px] text-slate-500">8 CHAKRA NODES</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {structuralNodes.map((node) => (
            <div
              key={node.id}
              className={`h-9 border rounded flex flex-col items-center justify-center ${node.color}`}
            >
              <div className="text-[7px] opacity-75 font-mono">{node.id} // {node.label}</div>
              <div className="text-[9px] font-mono font-bold tracking-tight">{node.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 5 Chakra Subsystem Sliders Matrix */}
      <div className="p-3 bg-slate-950 border border-slate-800 space-y-3">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
          <span>CHAKRA POWER ALLOCATION</span>
          <span className="text-[9px] text-cyan-400 font-mono">100 MW BUS</span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Muladhara (Engines) */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-cyan-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                Muladhara Drive (Kinematics)
              </span>
              <span className="text-cyan-400 font-bold">{powerAllocations.engines}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              value={powerAllocations.engines}
              onChange={(e) => handlePowerChange("engines", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Anahata (Shields) */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-sky-300 flex items-center gap-1">
                <Shield className="w-3 h-3 text-sky-400" />
                Anahata Deflector (Shields)
              </span>
              <span className="text-sky-400 font-bold">{powerAllocations.shields}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              value={powerAllocations.shields}
              onChange={(e) => handlePowerChange("shields", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>

          {/* Agneya (Weapons) */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-rose-300 flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-rose-400" />
                Astra Capacitors (Weapons)
              </span>
              <span className="text-rose-400 font-bold">{powerAllocations.weapons}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              value={powerAllocations.weapons}
              onChange={(e) => handlePowerChange("weapons", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-400"
            />
          </div>

          {/* Ajna (Sensors) */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-purple-300 flex items-center gap-1">
                <Radio className="w-3 h-3 text-purple-400" />
                Ajna Array (Resonance LIDAR)
              </span>
              <span className="text-purple-400 font-bold">{powerAllocations.sensors}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              value={powerAllocations.sensors}
              onChange={(e) => handlePowerChange("sensors", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-400"
            />
          </div>

          {/* Manipura (Cooling) */}
          <div className="space-y-0.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-blue-300 flex items-center gap-1">
                <ThermometerSnowflake className="w-3 h-3 text-blue-400" />
                Manipura Radiators (Cryo Dissipation)
              </span>
              <span className="text-blue-400 font-bold">{powerAllocations.cooling}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              value={powerAllocations.cooling}
              onChange={(e) => handlePowerChange("cooling", parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-400"
            />
          </div>
        </div>

        {/* Emergency Vent Purge */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[9px] text-slate-400">
            DISSIPATION: <span className="text-cyan-300">{(powerAllocations.cooling * 0.75).toFixed(1)} K/s</span>
          </div>
          <button
            onClick={onVentRequested}
            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[10px] uppercase flex items-center gap-1 transition rounded-sm"
          >
            <ThermometerSnowflake className="w-3 h-3" />
            PURGE CRYO HEAT (-150K)
          </button>
        </div>
      </div>
    </div>
  );
};
