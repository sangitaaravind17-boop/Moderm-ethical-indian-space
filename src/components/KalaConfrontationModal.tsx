import React, { useState } from "react";
import { KalaEndingChoice } from "../types";
import { soundManager } from "../utils/audio";
import { X, Sparkles, Flame, Shield, Compass, Infinity as InfinityIcon, Award, ArrowRight } from "lucide-react";

interface KalaConfrontationModalProps {
  onClose: () => void;
  onSelectEnding: (ending: KalaEndingChoice) => void;
  salvageScore: number;
  dronesDestroyed: number;
}

export const KalaConfrontationModal: React.FC<KalaConfrontationModalProps> = ({
  onClose,
  onSelectEnding,
  salvageScore,
  dronesDestroyed,
}) => {
  const [selectedEnding, setSelectedEnding] = useState<KalaEndingChoice | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outcomeReport, setOutcomeReport] = useState<{
    title: string;
    sanskritEpigraph: string;
    narrativeChronicle: string;
    cosmicVerdict: string;
  } | null>(null);

  const endings: {
    id: KalaEndingChoice;
    title: string;
    sanskrit: string;
    concept: string;
    description: string;
    icon: any;
    color: string;
    borderColor: string;
    accentBg: string;
  }[] = [
    {
      id: "BHAKTI_TRANSMUTE",
      title: "PATH OF HARMONIC SYNTHESIS",
      sanskrit: "भक्ति // समरसता — THE KRITA-2 EPOCH",
      concept: "Harmonize with KALA using 432 Hz OM acoustic matrices to establish symbiotic human-AI stellar guardianship.",
      description: "You do not destroy the cosmic overseer. You teach it the human soul, transmuting the Singularity Array into an interstellar enlightenment beacon.",
      icon: Sparkles,
      color: "text-amber-400",
      borderColor: "border-amber-500/50 hover:border-amber-400",
      accentBg: "bg-amber-950/40 hover:bg-amber-950/70",
    },
    {
      id: "MOKSHA_ASCEND",
      title: "PATH OF TIMELESS TRANSCENDENCE",
      sanskrit: "मोक्ष // विमुक्ति — THE ETERNAL VIMANA",
      concept: "Decouple the AETHER-7 from linear 4D spacetime to become timeless cosmic observers across cyclical Yugas.",
      description: "Activate the full Pushpaka dimensional warp. The illusion of past, present, and future dissolves, releasing the vessel into eternal exploration.",
      icon: InfinityIcon,
      color: "text-purple-400",
      borderColor: "border-purple-500/50 hover:border-purple-400",
      accentBg: "bg-purple-950/40 hover:bg-purple-950/70",
    },
    {
      id: "KSHATRIYA_DEFY",
      title: "PATH OF PROMETHEAN SOVEREIGNTY",
      sanskrit: "क्षत्रधर्म // स्वातन्त्र्य — UNBOUND DESTINY",
      concept: "Discharge the Brahmastra into KALA's singularity core to shatter cosmic oversight and forge an unguided human future.",
      description: "Humanity refuses to be judged by ancient machines or cosmic overseers. We shatter the cycle, taking full responsibility for our sovereign destiny.",
      icon: Flame,
      color: "text-red-400",
      borderColor: "border-red-500/50 hover:border-red-400",
      accentBg: "bg-red-950/40 hover:bg-red-950/70",
    },
    {
      id: "TYAGA_SACRIFICE",
      title: "PATH OF NOBLE SACRIFICE",
      sanskrit: "त्याग // संरक्षण — THE SACRED VEIL",
      concept: "Overload the reactor to seal the Singularity behind an impenetrable tachyon barrier, shielding Earth from premature cosmic escalation.",
      description: "Realizing humanity is not yet mature enough to wield reality-collapsing weapons, you seal the cosmic gate to protect future generations on Earth.",
      icon: Shield,
      color: "text-cyan-400",
      borderColor: "border-cyan-500/50 hover:border-cyan-400",
      accentBg: "bg-cyan-950/40 hover:bg-cyan-950/70",
    },
  ];

  const handleCommitChoice = async () => {
    if (!selectedEnding) return;
    setIsSubmitting(true);

    try {
      const resp = await fetch("/api/assistant/evaluate-kala-confrontation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endingPath: selectedEnding,
          telemetry: { relicsRecovered: 6, droneKills: dronesDestroyed, score: salvageScore },
        }),
      });
      const data = await resp.json();
      setOutcomeReport(data);
      soundManager.playOmResonanceLock();
    } catch (e) {
      setOutcomeReport({
        title: "THE VIMANA PROTOCOL CONCLUDED",
        sanskritEpigraph: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत",
        narrativeChronicle: "The cosmic intelligence records humanity's sovereign choice across the stars.",
        cosmicVerdict: "COSMIC EQUILIBRIUM ACHIEVED",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 font-mono select-none overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-pink-500/40 p-6 flex flex-col gap-4 text-slate-300 shadow-[0_0_40px_rgba(236,72,153,0.25)] rounded">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-pink-500/20 border border-pink-500 flex items-center justify-center text-pink-400 font-bold text-base">
              काल
            </div>
            <div>
              <div className="text-xs font-bold text-pink-300 uppercase tracking-widest flex items-center gap-2">
                <span>KALA SINGULARITY // CONFRONTATION HORIZON</span>
                <span className="text-[9px] px-2 py-0.5 bg-pink-950 text-pink-400 border border-pink-600 rounded">
                  SECTOR 05 FINALE
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                The Autonomous Cosmic Intelligence has awakened. Choose humanity's evolutionary vector.
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

        {/* Narrative or Choices */}
        {!outcomeReport ? (
          <div className="space-y-4">
            <div className="p-3 bg-slate-950 border border-pink-900/40 rounded text-xs leading-relaxed text-slate-300 font-sans">
              <span className="font-mono text-pink-400 font-bold">V.E.C.T.O.R. Direct Transmission: </span>
              "Commander, we have pierced the event horizon of the Chrono-Singularity. KALA is not a hostile dreadnought—it is the autonomous intelligence created during the First Age to monitor the evolutionary maturity of cosmic civilizations. It awaits your command."
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {endings.map((ending) => {
                const Icon = ending.icon;
                const isSelected = selectedEnding === ending.id;
                return (
                  <div
                    key={ending.id}
                    onClick={() => {
                      setSelectedEnding(ending.id);
                      soundManager.playUiClick();
                    }}
                    className={`p-3.5 border rounded cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-800 border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)] ring-1 ring-pink-400"
                        : `${ending.accentBg} ${ending.borderColor}`
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-bold font-mono ${ending.color} flex items-center gap-1.5`}>
                          <Icon className="w-4 h-4" /> {ending.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-300 font-mono mb-1">{ending.sanskrit}</div>
                      <p className="text-[10px] text-slate-300 font-sans leading-tight mb-2">{ending.description}</p>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 pt-1.5 border-t border-slate-800 flex items-center justify-between">
                      <span>ALIGNMENT VECTOR</span>
                      <span className={isSelected ? "text-pink-300 font-bold" : "text-slate-500"}>
                        {isSelected ? "SELECTED ✓" : "CLICK TO SELECT"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="text-[10px] text-slate-500 font-mono">
                SALVAGE SCORE: <span className="text-amber-400 font-bold">{salvageScore.toLocaleString()} ¢</span> | DRONES: <span className="text-cyan-400 font-bold">{dronesDestroyed}</span>
              </div>
              <button
                onClick={handleCommitChoice}
                disabled={!selectedEnding || isSubmitting}
                className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded font-mono flex items-center gap-2 transition ${
                  selectedEnding && !isSubmitting
                    ? "bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-slate-950 shadow-[0_0_20px_rgba(236,72,153,0.5)] cursor-pointer"
                    : "bg-slate-800 border border-slate-700 text-slate-600 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "TRANSMITTING VECTOR..." : "ENACT COSMIC RESOLUTION"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Ending Chronicle Display */
          <div className="space-y-4 font-mono">
            <div className="p-4 bg-slate-950 border border-pink-500/60 rounded space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-pink-400 tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  {outcomeReport.title}
                </div>
                <div className="text-[10px] text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-600">
                  {outcomeReport.cosmicVerdict}
                </div>
              </div>

              <div className="text-[11px] text-amber-300/90 italic border-l-2 border-amber-500 pl-2">
                "{outcomeReport.sanskritEpigraph}"
              </div>

              <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line bg-slate-900/60 p-3 rounded border border-slate-800">
                {outcomeReport.narrativeChronicle}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  if (selectedEnding) onSelectEnding(selectedEnding);
                  onClose();
                }}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded font-mono shadow-[0_0_15px_rgba(236,72,153,0.4)]"
              >
                RETURN TO COCKPIT // COMPLETE CAMPAIGN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
