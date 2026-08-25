import React, { useState, useEffect, useRef } from "react";

interface CircularProgressCooldownProps {
  lastFired?: number;
  cooldownMs?: number;
  color?: string;
  className?: string;
  children?: React.ReactNode;
  strokeWidth?: number;
  showTimerText?: boolean;
}

export const CircularProgressCooldown: React.FC<CircularProgressCooldownProps> = ({
  lastFired = 0,
  cooldownMs = 850,
  color = "#f59e0b",
  className = "",
  children,
  strokeWidth = 2.5,
  showTimerText = false,
}) => {
  const [progress, setProgress] = useState<number>(1); // 1 = fully charged/ready, 0 = just fired
  const [isCoolingDown, setIsCoolingDown] = useState<boolean>(false);
  const [remainingTimeSec, setRemainingTimeSec] = useState<number>(0);
  const [justCompleted, setJustCompleted] = useState<boolean>(false);

  const prevLastFiredRef = useRef<number>(lastFired);
  const animFrameRef = useRef<number | null>(null);

  // Listen to external fire events or prop changes
  useEffect(() => {
    const handleRailgunEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ timestamp: number; cooldownMs?: number }>;
      if (customEvent.detail?.timestamp) {
        startCooldown(customEvent.detail.timestamp, customEvent.detail.cooldownMs || cooldownMs);
      }
    };

    window.addEventListener("heavy-railgun-fired", handleRailgunEvent);
    return () => {
      window.removeEventListener("heavy-railgun-fired", handleRailgunEvent);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cooldownMs]);

  useEffect(() => {
    if (lastFired > 0 && lastFired !== prevLastFiredRef.current) {
      prevLastFiredRef.current = lastFired;
      startCooldown(lastFired, cooldownMs);
    }
  }, [lastFired, cooldownMs]);

  const startCooldown = (firedAt: number, duration: number) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    setIsCoolingDown(true);
    setJustCompleted(false);

    const update = () => {
      const now = Date.now();
      const elapsed = now - firedAt;
      const currentProgress = Math.min(1, Math.max(0, elapsed / duration));
      const remainingMs = Math.max(0, duration - elapsed);

      setProgress(currentProgress);
      setRemainingTimeSec(remainingMs / 1000);

      if (currentProgress < 1) {
        animFrameRef.current = requestAnimationFrame(update);
      } else {
        setIsCoolingDown(false);
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 600);
      }
    };

    animFrameRef.current = requestAnimationFrame(update);
  };

  // SVG Geometry Calculations
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  // Sweep offset: when progress is 0 (just fired), stroke is empty (or full remaining)
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Background and Interactive Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {children}
      </div>

      {/* SVG Circular Progress Bar Border */}
      <svg
        className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] pointer-events-none -rotate-90 z-20 overflow-visible"
        viewBox="0 0 52 52"
      >
        <defs>
          <filter id="railgun-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="railgun-cooldown-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Outer Background Track Circle */}
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          stroke="rgba(245, 158, 11, 0.15)"
          strokeWidth={strokeWidth}
          strokeDasharray="3 3"
        />

        {/* Animated Cooldown Progress Bar Circle */}
        {isCoolingDown && (
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            stroke="url(#railgun-cooldown-grad)"
            strokeWidth={strokeWidth + 1}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#railgun-glow)"
            className="transition-all duration-75"
          />
        )}

        {/* Ready Pulsing Ring when fully primed */}
        {!isCoolingDown && (
          <circle
            cx="26"
            cy="26"
            r={radius}
            fill="none"
            stroke={justCompleted ? "#34d399" : color}
            strokeWidth={justCompleted ? strokeWidth + 1.5 : strokeWidth * 0.8}
            opacity={justCompleted ? 1 : 0.4}
            strokeDasharray={justCompleted ? "none" : "2 4"}
            className={justCompleted ? "animate-ping origin-center" : ""}
          />
        )}
      </svg>

      {/* Floating Cooldown Overlay Badge */}
      {isCoolingDown && (
        <div className="absolute -bottom-2 -right-1 bg-amber-950/90 border border-amber-500/80 text-amber-300 font-mono text-[8px] px-1 py-0.2 rounded shadow-md z-30 pointer-events-none animate-pulse">
          {remainingTimeSec.toFixed(1)}s
        </div>
      )}
    </div>
  );
};
