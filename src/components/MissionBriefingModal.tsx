import React from "react";
import { X, Compass, Zap, Shield, Flame, Gem, Radio, Crosshair } from "lucide-react";

interface MissionBriefingModalProps {
  onClose: () => void;
}

export const MissionBriefingModal: React.FC<MissionBriefingModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 font-mono select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 p-5 flex flex-col gap-3 text-slate-300 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-xs font-bold text-slate-100 uppercase tracking-widest">
                AETHER-7 // FLIGHT & SUBSYSTEM OPERATIONS MANUAL
              </div>
              <div className="text-[9px] text-slate-500">
                DR. V.E.C.T.O.R. TECHNICAL MANAGEMENT SUITE
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 text-xs font-sans leading-relaxed text-slate-300">
          <div className="bg-slate-950 p-3 border border-slate-800 space-y-1">
            <h3 className="text-cyan-400 font-mono text-xs font-bold flex items-center gap-1.5 uppercase">
              <Crosshair className="w-3.5 h-3.5" /> 1. Dual Ordnance Matrix & Weapon Switching
            </h3>
            <p className="text-[11px] text-slate-400">
              Cycle weapons dynamically using <kbd className="bg-slate-900 border border-slate-700 px-1 text-cyan-300">Q</kbd> or the footer toggle:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
              <li><strong>Pulse Laser:</strong> High rate of fire (7.5/s), low thermal strain, ideal for dogfights and debris clearing.</li>
              <li><strong>Heavy Railgun:</strong> Slow fire rate, massive kinetic impact, and <strong>65% shield penetration</strong> directly damaging enemy hulls through shields!</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-3 border border-slate-800 space-y-1">
            <h3 className="text-cyan-400 font-mono text-xs font-bold flex items-center gap-1.5 uppercase">
              <Zap className="w-3.5 h-3.5" /> 2. Vector Kinematics & Subsystem Power Bus
            </h3>
            <p className="text-[11px] text-slate-400">
              Your vessel is governed by true inertial physics. Power allocation governs system effectiveness:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
              <li><strong>Kinematic Drives:</strong> Maximum thrust, acceleration, and retrograde braking force.</li>
              <li><strong>Aegis Shields:</strong> Shield capacitance and auto-recharge rate from stored energy.</li>
              <li><strong>Pulse Lasers:</strong> Firing cadence, pulse wattage, and thermal generation.</li>
              <li><strong>Quantum Sensors:</strong> Radar reach and anomaly scan range.</li>
              <li><strong>Cryo-Cooling:</strong> Continuous plasma core heat dissipation rate.</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-3 border border-slate-800 space-y-1">
            <h3 className="text-amber-400 font-mono text-xs font-bold flex items-center gap-1.5 uppercase">
              <Flame className="w-3.5 h-3.5" /> 3. Thermodynamics & Meltdown Prevention
            </h3>
            <p className="text-[11px] text-slate-400">
              Hard burns and laser discharges generate extreme heat in the plasma core. If temperature exceeds <strong>480K</strong>, alarms will trigger. Over <strong>550K</strong> causes critical structural hull damage.
            </p>
            <p className="text-[11px] text-cyan-300 font-mono">
              → Press [V] or click "VENT CRYO HEAT" to instantly purge 140K of thermal buildup!
            </p>
          </div>

          <div className="bg-slate-950 p-3 border border-slate-800 space-y-1">
            <h3 className="text-purple-400 font-mono text-xs font-bold flex items-center gap-1.5 uppercase">
              <Gem className="w-3.5 h-3.5" /> 4. Quantum Relics & Dr. V.E.C.T.O.R.
            </h3>
            <p className="text-[11px] text-slate-400">
              Salvage anomalies by approaching them with the Tractor Beam ([E]). Dr. V.E.C.T.O.R. continuously audits your telemetry, offers real-time tactical advice, and can execute automated power loadouts.
            </p>
          </div>

          {/* Keybinds Matrix */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="bg-slate-950 p-2 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-500">THRUST / ACCEL:</span>
              <kbd className="bg-slate-900 border border-slate-700 px-1.5 py-0.5 text-slate-200">W / UP</kbd>
            </div>
            <div className="bg-slate-950 p-2 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-500">VECTOR PITCH:</span>
              <kbd className="bg-slate-900 border border-slate-700 px-1.5 py-0.5 text-slate-200">A / D / LEFT / RIGHT</kbd>
            </div>
            <div className="bg-slate-950 p-2 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-500">FIRE PRIMARY WEAPON:</span>
              <kbd className="bg-slate-900 border border-slate-700 px-1.5 py-0.5 text-slate-200">SPACE</kbd>
            </div>
            <div className="bg-slate-950 p-2 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-500">CYCLE WEAPON:</span>
              <kbd className="bg-slate-900 border border-slate-700 px-1.5 py-0.5 text-cyan-300">Q / X</kbd>
            </div>
            <div className="bg-slate-950 p-2 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-500">TRACTOR BEAM:</span>
              <kbd className="bg-slate-900 border border-slate-700 px-1.5 py-0.5 text-slate-200">E</kbd>
            </div>
            <div className="bg-slate-950 p-2 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-500">VENT CRYO HEAT:</span>
              <kbd className="bg-slate-900 border border-slate-700 px-1.5 py-0.5 text-slate-200">V</kbd>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-bold uppercase transition"
          >
            ACKNOWLEDGE & COMMENCE EXPEDITION
          </button>
        </div>
      </div>
    </div>
  );
};
