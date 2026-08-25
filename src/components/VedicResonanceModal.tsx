import React, { useState, useEffect, useRef } from "react";
import { QuantumRelic } from "../types";
import { soundManager } from "../utils/audio";
import { X, Sparkles, Activity, Compass, Music, CheckCircle2, Lock } from "lucide-react";

interface VedicResonanceModalProps {
  relic: QuantumRelic | null;
  onClose: () => void;
  onResonanceLocked: (relic: QuantumRelic, bonusCredits: number) => void;
}

export const VedicResonanceModal: React.FC<VedicResonanceModalProps> = ({
  relic,
  onClose,
  onResonanceLocked,
}) => {
  const [frequency, setFrequency] = useState(400);
  const [phaseAngle, setPhaseAngle] = useState(180);
  const [harmonicRatio, setHarmonicRatio] = useState<"1:1" | "3:2" | "4:3" | "9:8">("1:1");
  const [coherence, setCoherence] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const targetFreq = relic?.mantraTargetFrequency || 432;
  const targetPhase = 108;
  const targetHarmonic = "3:2";

  // Calculate resonance coherence based on proximity to ancient Vedic ratios (432 Hz, 108 deg, 3:2 fifth harmonic)
  useEffect(() => {
    if (!relic) return;
    const freqDiff = Math.abs(frequency - targetFreq);
    const phaseDiff = Math.abs(phaseAngle - targetPhase);
    const harmonicMatch = harmonicRatio === targetHarmonic ? 1.0 : 0.4;

    const freqScore = Math.max(0, 1 - freqDiff / 80);
    const phaseScore = Math.max(0, 1 - phaseDiff / 90);

    const calculatedCoherence = Math.round((freqScore * 0.45 + phaseScore * 0.3 + harmonicMatch * 0.25) * 100);
    setCoherence(calculatedCoherence);

    if (calculatedCoherence >= 92 && !isLocked) {
      setIsLocked(true);
      soundManager.playOmResonanceLock();
    }
  }, [frequency, phaseAngle, harmonicRatio, relic, isLocked, targetFreq]);

  // Animated Sacred Yantra / Mandala Visualizer Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let time = 0;

    const render = () => {
      time += 0.025;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.min(cx, cy) - 20;

      // Background radial glow
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
      grad.addColorStop(0, isLocked ? "rgba(245, 158, 11, 0.25)" : "rgba(34, 211, 238, 0.15)");
      grad.addColorStop(1, "rgba(15, 23, 42, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Outer concentric ring
      ctx.strokeStyle = isLocked ? "rgba(245, 158, 11, 0.8)" : "rgba(56, 189, 248, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // 12 Outer Petal Mandalas
      const petals = 12;
      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2 + time * 0.2;
        const px = cx + Math.cos(angle) * (r * 0.85);
        const py = cy + Math.sin(angle) * (r * 0.85);

        ctx.strokeStyle = isLocked ? "#fbbf24" : "#38bdf8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, r * 0.18, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Interlocking Sri Yantra Triangles
      const triCount = 9;
      for (let i = 0; i < triCount; i++) {
        const triSize = r * (0.25 + (i / triCount) * 0.55);
        const inverted = i % 2 === 1;
        const rot = inverted ? -time * 0.15 : time * 0.15;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot + (phaseAngle * Math.PI) / 180);

        ctx.strokeStyle = isLocked
          ? `rgba(245, 158, 11, ${0.4 + (coherence / 100) * 0.6})`
          : `rgba(168, 85, 247, ${0.3 + (coherence / 100) * 0.5})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        for (let j = 0; j < 3; j++) {
          const a = (j * 2 * Math.PI) / 3 - Math.PI / 2;
          const x = Math.cos(a) * triSize;
          const y = Math.sin(a) * triSize;
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // Center Bindu Node with sacred glyph ॐ
      ctx.fillStyle = isLocked ? "#fbbf24" : "#22d3ee";
      ctx.beginPath();
      ctx.arc(cx, cy, 14 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
      ctx.fill();

      // Devanagari OM in Center
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 16px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ॐ", cx, cy + 1);

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [frequency, phaseAngle, harmonicRatio, coherence, isLocked]);

  if (!relic) return null;

  const handleClaimHarmonization = () => {
    soundManager.playRelicRecovered();
    onResonanceLocked(relic, relic.value + 1200);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 font-mono select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-amber-500/40 p-5 flex flex-col gap-4 text-slate-300 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold text-sm">
              ॐ
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <span>VEDIC RESONANCE MATRIX // NAAD HARMONIZER</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-950 text-amber-400 border border-amber-600 rounded">
                  {relic.sanskritName || "पुष्पक विमान खण्ड"}
                </span>
              </div>
              <div className="text-[9px] text-slate-500 font-sans">
                Acoustic & Frequency Calibration Suite for Ancient Anomaly Stabilization
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

        {/* Center Canvas & Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Yantra Visualizer Canvas */}
          <div className="relative flex items-center justify-center bg-slate-950 border border-slate-800 p-2 rounded">
            <canvas ref={canvasRef} width={220} height={220} className="w-[220px] h-[220px]" />
            {isLocked && (
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-950/80 border border-amber-500 text-amber-300 text-[9px] font-bold uppercase rounded flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-3 h-3 text-amber-400" />
                OM LOCK ACTIVE
              </div>
            )}
          </div>

          {/* Resonance Metrics */}
          <div className="space-y-3 font-mono text-[11px]">
            <div className="p-2.5 bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">HARMONIC COHERENCE:</span>
                <span className={`font-bold ${coherence > 85 ? "text-amber-400 animate-pulse" : "text-cyan-400"}`}>
                  {coherence}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    coherence > 85 ? "bg-gradient-to-r from-amber-500 to-yellow-400" : "bg-cyan-500"
                  }`}
                  style={{ width: `${coherence}%` }}
                ></div>
              </div>
              <div className="text-[9px] text-slate-500 flex justify-between">
                <span>THRESHOLD: 90%</span>
                <span>STATUS: {isLocked ? "STABILIZED" : "ATTUNING"}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950 border border-slate-800 space-y-1 text-[10px]">
              <div className="text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                V.E.C.T.O.R. HARMONIC DECODER:
              </div>
              <p className="text-slate-400 font-sans text-[10px] leading-tight">
                {isLocked
                  ? "Resonance locked at 432 Hz fundamental concert pitch. The anomaly has opened its internal quantum repository."
                  : "Modulate the fundamental frequency (sweet spot ~432 Hz), phase angle (108°), and 3:2 harmonic ratio to induce OM Resonance Lock."}
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Frequency, Phase, Harmonic Ratio */}
        <div className="space-y-3 bg-slate-950 p-3 border border-slate-800 text-xs">
          {/* Frequency Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-cyan-300 flex items-center gap-1">
                <Music className="w-3 h-3 text-cyan-400" /> Fundamental Frequency (Hz)
              </span>
              <span className="text-cyan-400 font-bold">{frequency} Hz (Target: ~432 Hz)</span>
            </div>
            <input
              type="range"
              min="108"
              max="864"
              step="2"
              value={frequency}
              onChange={(e) => {
                setFrequency(parseInt(e.target.value));
                soundManager.playUiClick();
              }}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Phase Angle Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-purple-300 flex items-center gap-1">
                <Compass className="w-3 h-3 text-purple-400" /> Geometric Phase Angle (θ)
              </span>
              <span className="text-purple-400 font-bold">{phaseAngle}° (Target: ~108°)</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="4"
              value={phaseAngle}
              onChange={(e) => {
                setPhaseAngle(parseInt(e.target.value));
                soundManager.playUiClick();
              }}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-400"
            />
          </div>

          {/* Harmonic Ratio Selector */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">HARMONIC RATIO:</span>
            <div className="flex gap-1.5">
              {(["1:1", "3:2", "4:3", "9:8"] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => {
                    setHarmonicRatio(ratio);
                    soundManager.playUiClick();
                  }}
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded border transition ${
                    harmonicRatio === ratio
                      ? "bg-amber-950 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {ratio} {ratio === "3:2" ? "(SAMVADI)" : ""}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[10px] text-slate-500">
            SPECIMEN: <span className="text-slate-300 font-bold">{relic.name}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase transition"
            >
              DISENGAGE
            </button>
            <button
              onClick={handleClaimHarmonization}
              disabled={!isLocked}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase flex items-center gap-1.5 rounded-sm transition ${
                isLocked
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse cursor-pointer"
                  : "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              {isLocked ? `HARMONIZE & HARVEST (+${relic.value + 1200} ¢)` : "AWAITING OM RESONANCE LOCK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
