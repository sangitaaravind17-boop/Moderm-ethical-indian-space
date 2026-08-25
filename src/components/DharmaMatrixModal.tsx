import React, { useState } from "react";
import { DharmaDilemma } from "../types";
import { soundManager } from "../utils/audio";
import { X, Scale, HeartHandshake, BookOpen, AlertTriangle, Sparkles, CheckCircle } from "lucide-react";

interface DharmaMatrixModalProps {
  dilemma: DharmaDilemma;
  onClose: () => void;
  onResolveDilemma: (dilemmaId: string, choiceId: "OPTION_A" | "OPTION_B", alignment: string) => void;
}

export const DharmaMatrixModal: React.FC<DharmaMatrixModalProps> = ({
  dilemma,
  onClose,
  onResolveDilemma,
}) => {
  const [selectedOption, setSelectedOption] = useState<"OPTION_A" | "OPTION_B" | null>(null);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectChoice = async (choice: "OPTION_A" | "OPTION_B") => {
    setSelectedOption(choice);
    setLoading(true);
    soundManager.playUiClick();

    try {
      const resp = await fetch("/api/assistant/evaluate-dharma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dilemmaId: dilemma.id,
          choiceId: choice,
        }),
      });
      const data = await resp.json();
      setEvaluation(data);
      soundManager.playOmResonanceLock();
    } catch (e) {
      setEvaluation({
        reflection: choice === "OPTION_A"
          ? "Decision aligned with Karuna (Compassion). Direct human preservation affirmed."
          : "Decision aligned with Jnana (Sacred Knowledge). Ancient technological heritage preserved.",
        dharmaAlignment: choice === "OPTION_A" ? "KARUNA" : "JNANA",
        consequenceNarrative: choice === "OPTION_A"
          ? "Survivors rescued (+40% shield regeneration efficiency)."
          : "Vimana propulsion core recovered (+25% sub-light speed).",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnact = () => {
    if (!selectedOption) return;
    const alignment = selectedOption === "OPTION_A" ? dilemma.optionA.philosophicalAlignment : dilemma.optionB.philosophicalAlignment;
    onResolveDilemma(dilemma.id, selectedOption, alignment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 font-mono select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-purple-500/40 p-5 flex flex-col gap-4 text-slate-300 shadow-[0_0_35px_rgba(168,85,247,0.25)] rounded">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 font-bold text-sm">
              <Scale className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <span>DHARMA MATRIX // ETHICAL REASONING ENGINE</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-purple-950 text-purple-400 border border-purple-600 rounded">
                  {dilemma.sanskritConcept}
                </span>
              </div>
              <div className="text-[9px] text-slate-500 font-sans">
                AI-Assisted Moral Decision Matrix balancing Duty, Compassion, and Cosmic Knowledge
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

        {/* Crisis Scenario */}
        <div className="p-3 bg-slate-950 border border-purple-900/40 rounded space-y-1.5">
          <div className="text-[10px] text-purple-400 font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            {dilemma.title}
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            {dilemma.context}
          </p>
        </div>

        {/* The Two Choices */}
        {!evaluation ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Option A */}
            <div
              onClick={() => handleSelectChoice("OPTION_A")}
              className="p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-cyan-500/40 hover:border-cyan-400 rounded cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-1.5">
                  <HeartHandshake className="w-4 h-4 text-cyan-400" />
                  {dilemma.optionA.label}
                </div>
                <div className="text-[10px] text-cyan-300/80 font-mono mb-1.5">
                  ALIGNMENT: {dilemma.optionA.philosophicalAlignment}
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-tight mb-2">
                  {dilemma.optionA.description}
                </p>
              </div>
              <div className="text-[9px] text-slate-400 pt-2 border-t border-slate-800">
                <span className="text-cyan-400 font-bold">CONSEQUENCE: </span>
                {dilemma.optionA.consequence}
              </div>
            </div>

            {/* Option B */}
            <div
              onClick={() => handleSelectChoice("OPTION_B")}
              className="p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-amber-500/40 hover:border-amber-400 rounded cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1.5">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  {dilemma.optionB.label}
                </div>
                <div className="text-[10px] text-amber-300/80 font-mono mb-1.5">
                  ALIGNMENT: {dilemma.optionB.philosophicalAlignment}
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-tight mb-2">
                  {dilemma.optionB.description}
                </p>
              </div>
              <div className="text-[9px] text-slate-400 pt-2 border-t border-slate-800">
                <span className="text-amber-400 font-bold">CONSEQUENCE: </span>
                {dilemma.optionB.consequence}
              </div>
            </div>
          </div>
        ) : (
          /* Evaluation & Outcome */
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 border border-purple-500/50 rounded space-y-2">
              <div className="text-xs font-bold text-purple-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  V.E.C.T.O.R. DHARMA ASSESSMENT
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-600 rounded">
                  {evaluation.dharmaAlignment}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                "{evaluation.reflection}"
              </p>
              <div className="text-[10px] text-cyan-300 font-mono pt-1 border-t border-slate-800">
                ACTIVE BUFF: {evaluation.consequenceNarrative}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleEnact}
                className="px-5 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded font-mono shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                COMMIT DECISION TO DHARMA MATRIX
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
