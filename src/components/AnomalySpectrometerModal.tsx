import React, { useState } from "react";
import { QuantumRelic, AnomalyReport } from "../types";
import { soundManager } from "../utils/audio";
import {
  Gem,
  Cpu,
  Atom,
  ShieldAlert,
  Coins,
  X,
  Sparkles,
  Activity,
  CheckCircle,
} from "lucide-react";

interface AnomalySpectrometerModalProps {
  relic: QuantumRelic | null;
  onClose: () => void;
  onSalvageRelic: (relic: QuantumRelic, bonusCredits: number) => void;
}

export const AnomalySpectrometerModal: React.FC<AnomalySpectrometerModalProps> = ({
  relic,
  onClose,
  onSalvageRelic,
}) => {
  const [report, setReport] = useState<AnomalyReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!relic) return null;

  const runDeepSpectrometry = async () => {
    setIsAnalyzing(true);
    soundManager.playRadarPing();

    try {
      const res = await fetch("/api/assistant/analyze-anomaly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anomalyData: {
            name: relic.name,
            classification: relic.classification,
            molecularDensity: relic.molecularDensity,
            quantumCoherence: relic.quantumCoherence,
            value: relic.value,
          },
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
      setReport({
        spectrometerClassification: relic.classification || "Type-III Exotic Crystallite Node",
        quantumCoherence: `${relic.quantumCoherence}%`,
        atomicComposition: "Superconducting Strontium-Carbon Lattice",
        hazardRating: "LOW",
        salvageYieldEst: `${relic.value} Credits`,
        operationalRecommendation: "Safe for immediate sub-atomic decimation and resource refinement.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSalvage = () => {
    soundManager.playRelicRecovered();
    onSalvageRelic(relic, relic.value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 font-mono select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 p-4 flex flex-col gap-3 text-slate-300 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Gem className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-slate-100 uppercase tracking-wider">{relic.name}</div>
              <div className="text-[9px] text-slate-500">
                SPECIMEN ID: {relic.id}
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

        {/* Visual Graphic & Basic Stats */}
        <div className="bg-slate-950 border border-slate-800 p-3 flex items-center gap-3">
          <div className="w-12 h-12 bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-center shrink-0">
            <Atom className="w-6 h-6 text-cyan-300 animate-spin duration-[6000ms]" />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-slate-500 block uppercase">CLASSIFICATION:</span>
              <span className="font-bold text-cyan-300">{relic.classification}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase">SALVAGE VALUE:</span>
              <span className="font-bold text-yellow-400">{relic.value} ¢</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase">DENSITY:</span>
              <span className="font-semibold text-slate-300">{relic.molecularDensity} g/cm³</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase">COHERENCE:</span>
              <span className="font-semibold text-purple-400">{relic.quantumCoherence}%</span>
            </div>
          </div>
        </div>

        {/* Deep Spectrometry Assistant Audit */}
        {report ? (
          <div className="bg-slate-950 border border-slate-800 p-3 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between text-[9px] text-slate-500 uppercase border-b border-slate-800 pb-1">
              <span>Dr. V.E.C.T.O.R. Spectrometer Analysis</span>
              <span className="text-emerald-400 font-bold">VERIFIED</span>
            </div>
            <div className="text-[11px] text-slate-300 font-sans space-y-1">
              <div><strong className="text-cyan-400 font-mono text-[10px]">ATOMIC LATTICE:</strong> {report.atomicComposition}</div>
              <div><strong className="text-cyan-400 font-mono text-[10px]">HAZARD METRIC:</strong> {report.hazardRating}</div>
              <div><strong className="text-cyan-400 font-mono text-[10px]">DIRECTIVE:</strong> {report.operationalRecommendation}</div>
            </div>
          </div>
        ) : (
          <button
            onClick={runDeepSpectrometry}
            disabled={isAnalyzing}
            className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-cyan-800/80 text-cyan-400 text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
            {isAnalyzing ? "AI AUDITING SPECTROMETRY..." : "REQUEST DEEP AI SPECTROMETRIC AUDIT"}
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase transition"
          >
            CANCEL
          </button>
          <button
            onClick={handleSalvage}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-bold uppercase flex items-center gap-1.5 transition"
          >
            <Coins className="w-3.5 h-3.5" />
            REFINE & HARVEST (+{relic.value} ¢)
          </button>
        </div>
      </div>
    </div>
  );
};
