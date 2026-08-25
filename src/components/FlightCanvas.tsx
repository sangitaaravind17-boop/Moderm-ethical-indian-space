import React, { useEffect, useRef } from "react";
import {
  VesselState,
  Asteroid,
  QuantumRelic,
  RogueDrone,
  Projectile,
  FloatingLoot,
  Particle,
  SectorConfig,
  Vector2D,
  DirectorParameters,
  EmergentScenario,
  AstraWeaponType,
} from "../types";
import { soundManager } from "../utils/audio";
import { ASTRA_CATALOG } from "../data/sectors";

interface FlightCanvasProps {
  vessel: VesselState;
  setVessel: React.Dispatch<React.SetStateAction<VesselState>>;
  sector: SectorConfig;
  directorParams: DirectorParameters;
  activeScenario: EmergentScenario | null;
  asteroids: Asteroid[];
  setAsteroids: React.Dispatch<React.SetStateAction<Asteroid[]>>;
  relics: QuantumRelic[];
  setRelics: React.Dispatch<React.SetStateAction<QuantumRelic[]>>;
  drones: RogueDrone[];
  setDrones: React.Dispatch<React.SetStateAction<RogueDrone[]>>;
  projectiles: Projectile[];
  setProjectiles: React.Dispatch<React.SetStateAction<Projectile[]>>;
  loot: FloatingLoot[];
  setLoot: React.Dispatch<React.SetStateAction<FloatingLoot[]>>;
  onRelicCaptured: (relic: QuantumRelic) => void;
  onDroneDestroyed: (drone: RogueDrone) => void;
  onAsteroidDestroyed: (ast: Asteroid) => void;
  onLootCollected: (item: FloatingLoot) => void;
  onVesselDamaged: (dmg: number, isShield: boolean) => void;
  onAnomalyScanTriggered: (relic: QuantumRelic) => void;
  onShotFired?: () => void;
  onShotHit?: () => void;
  onDistanceTraveled?: (distance: number) => void;
  onThermalStrainTime?: (deltaSec: number) => void;
  onTriggerVedicResonance?: (relic: QuantumRelic) => void;
}

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  layer: number;
}

export const FlightCanvas: React.FC<FlightCanvasProps> = ({
  vessel,
  setVessel,
  sector,
  directorParams,
  activeScenario,
  asteroids,
  setAsteroids,
  relics,
  setRelics,
  drones,
  setDrones,
  projectiles,
  setProjectiles,
  loot,
  setLoot,
  onRelicCaptured,
  onDroneDestroyed,
  onAsteroidDestroyed,
  onLootCollected,
  onVesselDamaged,
  onAnomalyScanTriggered,
  onShotFired,
  onShotHit,
  onDistanceTraveled,
  onThermalStrainTime,
  onTriggerVedicResonance,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const lastTimeRef = useRef<number>(performance.now());
  const cameraRef = useRef<Vector2D>({ x: 0, y: 0 });
  const shockwavesRef = useRef<{ x: number; y: number; radius: number; maxRadius: number; color: string; alpha: number }[]>([]);

  // Init stars for background
  useEffect(() => {
    const starCount = sector.starCount || 240;
    const newStars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      newStars.push({
        x: (Math.random() - 0.5) * 6000,
        y: (Math.random() - 0.5) * 6000,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.7 + 0.3,
        layer: Math.random() * 0.7 + 0.3,
      });
    }
    starsRef.current = newStars;
  }, [sector]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      // Quick key triggers
      if (e.code === "KeyV") {
        triggerVentHeat();
      }
      if (e.code === "KeyE") {
        setVessel((v) => ({ ...v, isTractorActive: !v.isTractorActive }));
        soundManager.playUiClick();
      }
      if (e.code === "KeyQ" || e.code === "KeyX") {
        cycleWeapon();
      }
      if (e.code === "KeyH") {
        // Toggle Hanuman Protocol if not active
        triggerHanumanProtocol();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const triggerHanumanProtocol = () => {
    setVessel((v) => {
      if (v.isHanumanProtocolActive) return v;
      soundManager.playHanumanProtocolBurst();
      return {
        ...v,
        isHanumanProtocolActive: true,
        hanumanProtocolTimeRemaining: 15,
        statusLog: "HANUMAN PROTOCOL ACTIVATED: 2.5x kinetic thrust & shield overcharge!",
      };
    });
  };

  const cycleWeapon = () => {
    soundManager.playWeaponSwitch();
    setVessel((v) => {
      const astraList: AstraWeaponType[] = [
        "AGNEYA_ASTRA",
        "VARUNA_ASTRA",
        "VAYAVYA_ASTRA",
        "NARAYANASTRA",
        "BRAHMASTRA",
      ];
      const currentIndex = astraList.indexOf(v.selectedAstra || "AGNEYA_ASTRA");
      const nextAstra = astraList[(currentIndex + 1) % astraList.length];
      const astraInfo = ASTRA_CATALOG.find((a) => a.id === nextAstra);
      return {
        ...v,
        selectedAstra: nextAstra,
        selectedWeapon: nextAstra === "VAYAVYA_ASTRA" ? "HEAVY_RAILGUN" : "PULSE_LASER",
        statusLog: `Ordnance switched to ${astraInfo?.name || nextAstra} (${astraInfo?.sanskritName}).`,
      };
    });
  };

  const triggerVentHeat = () => {
    setVessel((v) => {
      const now = performance.now();
      if (now - v.lastVentTime < 3500) return v; // 3.5s cooldown
      soundManager.playVentHiss();

      // Vent particles
      for (let i = 0; i < 25; i++) {
        const angle = v.heading + Math.PI + (Math.random() - 0.5) * 1.5;
        const speed = Math.random() * 4 + 2;
        particlesRef.current.push({
          x: v.x,
          y: v.y,
          vx: Math.cos(angle) * speed * 25,
          vy: Math.sin(angle) * speed * 25,
          size: Math.random() * 4 + 2,
          color: "#38bdf8",
          alpha: 0.9,
          life: 0,
          maxLife: 30,
        });
      }

      return {
        ...v,
        coreTemp: Math.max(300, v.coreTemp - 150),
        lastVentTime: now,
        statusLog: "Manipura Cryo Vent engaged: -150K thermal energy purged.",
      };
    });
  };

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      const keys = keysRef.current;

      // --- 1. VESSEL KINEMATICS & INPUT HANDLING ---
      setVessel((prev) => {
        let {
          x,
          y,
          vx,
          vy,
          heading,
          angularVelocity,
          hull,
          maxHull,
          shields,
          maxShields,
          coreTemp,
          powerAllocations,
          energy,
          maxEnergy,
          isTractorActive,
          lastLaserFired,
          selectedAstra,
          isHanumanProtocolActive,
          hanumanProtocolTimeRemaining,
          trimurtiActiveMode,
        } = prev;

        // Subsystem Multipliers
        const enginePowerRatio = powerAllocations.engines / 20;
        const shieldPowerRatio = powerAllocations.shields / 20;
        const weaponPowerRatio = powerAllocations.weapons / 20;
        const sensorPowerRatio = powerAllocations.sensors / 20;
        const coolingPowerRatio = powerAllocations.cooling / 20;

        // Hanuman Protocol Supercharge factor
        const hanumanSpeedMult = isHanumanProtocolActive ? 2.2 : 1.0;

        // Handle Hanuman Protocol Timer
        if (isHanumanProtocolActive) {
          hanumanProtocolTimeRemaining -= dt;
          if (hanumanProtocolTimeRemaining <= 0) {
            isHanumanProtocolActive = false;
            hanumanProtocolTimeRemaining = 0;
          }
        }

        // Trimurti Mode Passives
        if (trimurtiActiveMode === "BRAHMA") {
          // Brahma: Nanite Hull Repair
          hull = Math.min(maxHull, hull + 1.2 * dt);
        } else if (trimurtiActiveMode === "VISHNU") {
          // Vishnu: Shield Preservation
          shields = Math.min(maxShields, shields + 2.2 * dt);
        } else if (trimurtiActiveMode === "SHIVA") {
          // Shiva: Thermal Dissipation Boost
          if (coreTemp > 300) {
            coreTemp = Math.max(300, coreTemp - 4.0 * dt);
          }
        }

        // Rotation
        const turnSpeed = (3.2 * (isHanumanProtocolActive ? 1.3 : 1.0)) * dt;
        if (keys["KeyA"] || keys["ArrowLeft"]) {
          heading -= turnSpeed;
        }
        if (keys["KeyD"] || keys["ArrowRight"]) {
          heading += turnSpeed;
        }

        // Thrust / Acceleration
        let isThrusting = false;
        let thrustMag = 0;
        const maxAcc = 280 * enginePowerRatio * hanumanSpeedMult;

        if (keys["KeyW"] || keys["ArrowUp"]) {
          isThrusting = true;
          thrustMag = 1;
          const ax = Math.cos(heading) * maxAcc * dt;
          const ay = Math.sin(heading) * maxAcc * dt;
          vx += ax;
          vy += ay;

          // Heating from engine burn
          coreTemp += (9.5 * enginePowerRatio * (isHanumanProtocolActive ? 0.6 : 1.0)) * dt;

          // Spawn thruster plasma particles
          const plumeAngle = heading + Math.PI + (Math.random() - 0.5) * 0.4;
          const pSpeed = Math.random() * 80 + 120;
          particlesRef.current.push({
            x: x - Math.cos(heading) * 22,
            y: y - Math.sin(heading) * 22,
            vx: vx + Math.cos(plumeAngle) * pSpeed * 0.05,
            vy: vy + Math.sin(plumeAngle) * pSpeed * 0.05,
            size: Math.random() * 4 + 2,
            color: isHanumanProtocolActive ? "#fbbf24" : enginePowerRatio > 1.5 ? "#f43f5e" : "#06b6d4",
            alpha: 0.9,
            life: 0,
            maxLife: 20,
          });
        }

        // Retrograde Brake (KeyS or ArrowDown)
        if (keys["KeyS"] || keys["ArrowDown"]) {
          isThrusting = true;
          thrustMag = 0.6;
          const currentSpeed = Math.hypot(vx, vy);
          if (currentSpeed > 0.1) {
            const brakeFactor = Math.min(1, (200 * enginePowerRatio * dt) / currentSpeed);
            vx -= vx * brakeFactor;
            vy -= vy * brakeFactor;

            // Spawn bow thruster puffs
            particlesRef.current.push({
              x: x + Math.cos(heading) * 18,
              y: y + Math.sin(heading) * 18,
              vx: vx - Math.cos(heading) * 2,
              vy: vy - Math.sin(heading) * 2,
              size: 2.5,
              color: "#38bdf8",
              alpha: 0.6,
              life: 0,
              maxLife: 12,
            });
          }
        }

        // Update continuous thruster audio
        soundManager.updateThrusterAudio(isThrusting, thrustMag * enginePowerRatio);

        // Natural space friction / drag (slight, realistic vector retention)
        vx *= 0.998;
        vy *= 0.998;

        // Position integration
        x += vx * dt;
        y += vy * dt;

        // Report distance traveled
        if (onDistanceTraveled) {
          onDistanceTraveled(Math.hypot(vx, vy) * dt);
        }

        // Report thermal strain time
        if (coreTemp > 480 && onThermalStrainTime) {
          onThermalStrainTime(dt);
        }

        // Blackhole gravitational pull in Singularity sector
        if (sector.hasBlackhole && sector.blackholePos && sector.blackholeMass) {
          const dx = sector.blackholePos.x - x;
          const dy = sector.blackholePos.y - y;
          const distSq = Math.max(dx * dx + dy * dy, 2500);
          const dist = Math.sqrt(distSq);
          const singMult = directorParams?.environmentalHazardsEnabled !== false ? 1.0 : 0.8;
          const gravityForce = (sector.blackholeMass * 12000 * singMult) / distSq;
          vx += (dx / dist) * gravityForce * dt;
          vy += (dy / dist) * gravityForce * dt;

          // Event horizon damage if too close (< 80px)
          if (dist < 80) {
            hull = Math.max(0, hull - 35 * dt);
            coreTemp += 50 * dt;
            onVesselDamaged(35 * dt, false);
          }
        }

        // Thermal cooling dissipation
        const baseDissipation = 14 * coolingPowerRatio * (directorParams?.thermalDissipationRate || 1.0);
        if (coreTemp > 300) {
          coreTemp = Math.max(300, coreTemp - baseDissipation * dt);
        }

        // Overheating hazard damage if > 550K
        if (coreTemp > 550) {
          hull = Math.max(0, hull - 8 * dt);
        }

        // Shield capacitor recharge
        if (shields < maxShields && energy > 10) {
          const rechargeRate = 6.5 * shieldPowerRatio * dt;
          shields = Math.min(maxShields, shields + rechargeRate);
          energy = Math.max(0, energy - 2.5 * shieldPowerRatio * dt);
        }

        // Passive Reactor energy generation
        energy = Math.min(maxEnergy, energy + 12 * dt);

        // --- ASTRA WEAPON FIRING LOGIC ---
        const isSpacePressed = keys["Space"];
        const now = performance.now();
        const astraType = selectedAstra || "AGNEYA_ASTRA";
        const astraInfo = ASTRA_CATALOG.find((a) => a.id === astraType) || ASTRA_CATALOG[0];

        const fireDelay = Math.max(astraInfo.fireCooldownMs * 0.5, astraInfo.fireCooldownMs / weaponPowerRatio);
        const energyCost = astraInfo.energyCost;

        if (isSpacePressed && now - lastLaserFired > fireDelay && energy >= energyCost) {
          lastLaserFired = now;
          energy -= energyCost;

          if (onShotFired) onShotFired();

          const noseX = x + Math.cos(heading) * 28;
          const noseY = y + Math.sin(heading) * 28;

          if (astraType === "AGNEYA_ASTRA") {
            // Rapid Plasma Lance
            soundManager.playLaser(false);
            const pSpeed = 740;
            setProjectiles((prevP) => [
              ...prevP,
              {
                id: "p-" + Math.random().toString(36).substr(2, 9),
                x: noseX,
                y: noseY,
                vx: vx + Math.cos(heading) * pSpeed,
                vy: vy + Math.sin(heading) * pSpeed,
                damage: astraInfo.damage * weaponPowerRatio,
                life: 0,
                maxLife: 1.4,
                isEnemy: false,
                color: "#38bdf8",
                weaponType: "PULSE_LASER",
                shieldPenetration: 0.1,
              },
            ]);
            coreTemp += astraInfo.heatCost * weaponPowerRatio;
          } else if (astraType === "VARUNA_ASTRA") {
            // Cryo EMP Pulse Shockwave
            soundManager.playVarunaAstra();
            const pSpeed = 520;
            setProjectiles((prevP) => [
              ...prevP,
              {
                id: "p-" + Math.random().toString(36).substr(2, 9),
                x: noseX,
                y: noseY,
                vx: vx + Math.cos(heading) * pSpeed,
                vy: vy + Math.sin(heading) * pSpeed,
                damage: astraInfo.damage * weaponPowerRatio,
                life: 0,
                maxLife: 1.8,
                isEnemy: false,
                color: "#06b6d4",
                weaponType: "PULSE_LASER",
                shieldPenetration: 0.25,
              },
            ]);
            // Cool reactor by 15K!
            coreTemp = Math.max(300, coreTemp - 15);
            // Visual cryogenic shockwave
            shockwavesRef.current.push({
              x: noseX,
              y: noseY,
              radius: 10,
              maxRadius: 180,
              color: "#06b6d4",
              alpha: 0.8,
            });
          } else if (astraType === "VAYAVYA_ASTRA") {
            // Relativistic Kinetic Tungsten Slug (Heavy Railgun)
            soundManager.playRailgun();
            const pSpeed = 1450;
            // Recoil kick
            vx -= Math.cos(heading) * 35;
            vy -= Math.sin(heading) * 35;

            // Dispatch global event for circular progress bar animation around #toggle-weapon-btn
            window.dispatchEvent(
              new CustomEvent("heavy-railgun-fired", {
                detail: { timestamp: Date.now(), cooldownMs: fireDelay },
              })
            );

            setProjectiles((prevP) => [
              ...prevP,
              {
                id: "p-" + Math.random().toString(36).substr(2, 9),
                x: noseX,
                y: noseY,
                vx: vx + Math.cos(heading) * pSpeed,
                vy: vy + Math.sin(heading) * pSpeed,
                damage: astraInfo.damage * weaponPowerRatio,
                life: 0,
                maxLife: 1.8,
                isEnemy: false,
                color: "#f59e0b",
                weaponType: "HEAVY_RAILGUN",
                shieldPenetration: 0.75, // 75% direct penetration!
              },
            ]);

            // Muzzle flash particle burst
            for (let i = 0; i < 8; i++) {
              const pAngle = heading + (Math.random() - 0.5) * 0.9;
              const pSpd = Math.random() * 110 + 60;
              particlesRef.current.push({
                x: noseX,
                y: noseY,
                vx: vx + Math.cos(pAngle) * pSpd,
                vy: vy + Math.sin(pAngle) * pSpd,
                size: Math.random() * 3 + 2,
                color: "#fbbf24",
                alpha: 1.0,
                life: 0,
                maxLife: 18,
              });
            }
            coreTemp += astraInfo.heatCost * weaponPowerRatio;
          } else if (astraType === "NARAYANASTRA") {
            // Quad-Cluster Homing Seeker Missiles
            soundManager.playNarayanastra();
            for (let i = -1.5; i <= 1.5; i += 1.0) {
              const spreadAngle = heading + (i * Math.PI) / 8;
              const pSpeed = 480;
              setProjectiles((prevP) => [
                ...prevP,
                {
                  id: "p-" + Math.random().toString(36).substr(2, 9),
                  x: noseX,
                  y: noseY,
                  vx: vx + Math.cos(spreadAngle) * pSpeed,
                  vy: vy + Math.sin(spreadAngle) * pSpeed,
                  damage: astraInfo.damage * 0.3 * weaponPowerRatio,
                  life: 0,
                  maxLife: 2.5,
                  isEnemy: false,
                  color: "#c084fc",
                  weaponType: "PULSE_LASER",
                  shieldPenetration: 0.4,
                },
              ]);
            }
            coreTemp += astraInfo.heatCost * weaponPowerRatio;
          } else if (astraType === "BRAHMASTRA") {
            // Strategic Quantum Reality Collapse (600px shockwave!)
            soundManager.playBrahmastra();
            shockwavesRef.current.push({
              x: x,
              y: y,
              radius: 20,
              maxRadius: 600,
              color: "#fbbf24",
              alpha: 1.0,
            });

            // Instant Area of Effect Obliteration
            setDrones((prevDrones) =>
              prevDrones.filter((d) => {
                const dist = Math.hypot(d.x - x, d.y - y);
                if (dist < 600) {
                  onDroneDestroyed(d);
                  soundManager.playExplosion(1.0);
                  return false;
                }
                return true;
              })
            );

            setAsteroids((prevAst) =>
              prevAst.filter((a) => {
                const dist = Math.hypot(a.x - x, a.y - y);
                if (dist < 600) {
                  onAsteroidDestroyed(a);
                  return false;
                }
                return true;
              })
            );

            coreTemp += astraInfo.heatCost;
          }
        }

        return {
          ...prev,
          x,
          y,
          vx,
          vy,
          heading,
          thrust: isThrusting ? thrustMag : 0,
          hull,
          shields,
          coreTemp,
          energy,
          lastLaserFired,
          isHanumanProtocolActive,
          hanumanProtocolTimeRemaining,
        };
      });

      // --- 2. CAMERA LERP ---
      const lerpSpeed = 0.08;
      cameraRef.current.x += (vessel.x - cameraRef.current.x) * lerpSpeed;
      cameraRef.current.y += (vessel.y - cameraRef.current.y) * lerpSpeed;

      const halfW = canvas.width / 2;
      const halfH = canvas.height / 2;
      const camX = cameraRef.current.x;
      const camY = cameraRef.current.y;

      // --- 3. CLEAR & RENDER BACKGROUND ---
      ctx.fillStyle = "#070b12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ambient Sector Glow
      const ambientGrad = ctx.createRadialGradient(
        halfW,
        halfH,
        50,
        halfW,
        halfH,
        Math.max(halfW, halfH)
      );
      ambientGrad.addColorStop(0, sector.ambientColor || "rgba(14, 165, 233, 0.06)");
      ambientGrad.addColorStop(1, "transparent");
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Coordinate Grid Lines (Tactical Aerospace Overlay)
      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.035)";
      ctx.lineWidth = 1;
      const gridSize = 200;
      const startGridX = Math.floor((camX - halfW) / gridSize) * gridSize;
      const startGridY = Math.floor((camY - halfH) / gridSize) * gridSize;

      for (let gx = startGridX; gx < camX + halfW + gridSize; gx += gridSize) {
        const screenX = gx - camX + halfW;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvas.height);
        ctx.stroke();
      }
      for (let gy = startGridY; gy < camY + halfH + gridSize; gy += gridSize) {
        const screenY = gy - camY + halfH;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvas.width, screenY);
        ctx.stroke();
      }
      ctx.restore();

      // Render Parallax Stars
      ctx.save();
      for (const s of starsRef.current) {
        const screenX = ((s.x - camX * s.layer + 6000) % 6000) - 3000 + halfW;
        const screenY = ((s.y - camY * s.layer + 6000) % 6000) - 3000 + halfH;

        if (screenX >= -10 && screenX <= canvas.width + 10 && screenY >= -10 && screenY <= canvas.height + 10) {
          ctx.fillStyle = `rgba(255, 255, 255, ${s.brightness})`;
          ctx.beginPath();
          ctx.arc(screenX, screenY, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Render Black Hole / Singularity if present
      if (sector.hasBlackhole && sector.blackholePos) {
        const bhScreenX = sector.blackholePos.x - camX + halfW;
        const bhScreenY = sector.blackholePos.y - camY + halfH;

        ctx.save();
        const accretion = ctx.createRadialGradient(
          bhScreenX,
          bhScreenY,
          40,
          bhScreenX,
          bhScreenY,
          260
        );
        accretion.addColorStop(0, "rgba(0, 0, 0, 1)");
        accretion.addColorStop(0.2, "rgba(244, 114, 182, 0.7)");
        accretion.addColorStop(0.5, "rgba(168, 85, 247, 0.4)");
        accretion.addColorStop(1, "transparent");

        ctx.fillStyle = accretion;
        ctx.beginPath();
        ctx.arc(bhScreenX, bhScreenY, 260, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(bhScreenX, bhScreenY, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#f472b6";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      }

      // --- 4. RENDER SHOCKWAVES ---
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.radius += 450 * dt;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

        const sx = sw.x - camX + halfW;
        const sy = sw.y - camY + halfH;

        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = 4;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(sx, sy, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (sw.radius >= sw.maxRadius) {
          shockwavesRef.current.splice(i, 1);
        }
      }

      // --- 5. UPDATE & RENDER PROJECTILES ---
      setProjectiles((prevP) => {
        const nextP: Projectile[] = [];

        for (const p of prevP) {
          // Narayanastra Homing Logic
          if (!p.isEnemy && p.color === "#c084fc" && drones.length > 0) {
            // Find closest drone
            let closestD = drones[0];
            let minDist = 99999;
            for (const d of drones) {
              const dist = Math.hypot(d.x - p.x, d.y - p.y);
              if (dist < minDist) {
                minDist = dist;
                closestD = d;
              }
            }
            if (closestD && minDist < 600) {
              const targetAngle = Math.atan2(closestD.y - p.y, closestD.x - p.x);
              const currentAngle = Math.atan2(p.vy, p.vx);
              const speed = Math.hypot(p.vx, p.vy);
              const steerAngle = currentAngle + (targetAngle - currentAngle) * 0.15;
              p.vx = Math.cos(steerAngle) * speed;
              p.vy = Math.sin(steerAngle) * speed;
            }
          }

          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life += dt;

          if (p.life < p.maxLife) {
            nextP.push(p);

            const sx = p.x - camX + halfW;
            const sy = p.y - camY + halfH;

            ctx.save();
            if (p.weaponType === "HEAVY_RAILGUN") {
              ctx.fillStyle = "#ffffff";
              ctx.shadowColor = "#f59e0b";
              ctx.shadowBlur = 16;
              ctx.beginPath();
              ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = "#fbbf24";
              ctx.lineWidth = 3.2;
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(sx - p.vx * 0.035, sy - p.vy * 0.035);
              ctx.stroke();
            } else {
              ctx.fillStyle = p.color;
              ctx.shadowColor = p.color;
              ctx.shadowBlur = 8;
              ctx.beginPath();
              ctx.arc(sx, sy, p.isEnemy ? 3.5 : 2.5, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = p.color;
              ctx.lineWidth = p.isEnemy ? 2 : 1.5;
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(sx - p.vx * 0.02, sy - p.vy * 0.02);
              ctx.stroke();
            }
            ctx.restore();
          }
        }
        return nextP;
      });

      // --- 6. UPDATE & RENDER ASTEROIDS ---
      setAsteroids((prevAst) => {
        const nextAst: Asteroid[] = [];

        for (const ast of prevAst) {
          ast.x += ast.vx * dt;
          ast.y += ast.vy * dt;
          ast.rotation += ast.rotSpeed * dt;

          // Check Projectile Collisions
          projectiles.forEach((p) => {
            if (!p.isEnemy) {
              const d = Math.hypot(p.x - ast.x, p.y - ast.y);
              if (d < ast.radius + 4) {
                ast.health -= p.damage;
                p.life = p.maxLife;
                if (onShotHit) onShotHit();
                soundManager.playExplosion(0.4);

                for (let i = 0; i < 4; i++) {
                  particlesRef.current.push({
                    x: p.x,
                    y: p.y,
                    vx: (Math.random() - 0.5) * 80,
                    vy: (Math.random() - 0.5) * 80,
                    size: 2,
                    color: "#fbbf24",
                    alpha: 0.8,
                    life: 0,
                    maxLife: 15,
                  });
                }
              }
            }
          });

          // Check Vessel Collision
          const vDist = Math.hypot(vessel.x - ast.x, vessel.y - ast.y);
          if (vDist < ast.radius + 18) {
            const angle = Math.atan2(vessel.y - ast.y, vessel.x - ast.x);
            vessel.vx += Math.cos(angle) * 80;
            vessel.vy += Math.sin(angle) * 80;

            const impactDmg = Math.round(ast.radius * 0.4 * (vessel.isHanumanProtocolActive ? 0.25 : 1.0));
            if (vessel.shields > impactDmg) {
              vessel.shields -= impactDmg;
              soundManager.playShieldDeflect();
              onVesselDamaged(impactDmg, true);
            } else {
              const remaining = impactDmg - vessel.shields;
              vessel.shields = 0;
              vessel.hull = Math.max(0, vessel.hull - remaining);
              soundManager.playExplosion(1.0);
              onVesselDamaged(impactDmg, false);
            }
          }

          if (ast.health > 0) {
            nextAst.push(ast);

            const sx = ast.x - camX + halfW;
            const sy = ast.y - camY + halfH;

            if (sx >= -100 && sx <= canvas.width + 100 && sy >= -100 && sy <= canvas.height + 100) {
              ctx.save();
              ctx.translate(sx, sy);
              ctx.rotate(ast.rotation);

              ctx.fillStyle = "#1e293b";
              ctx.strokeStyle = "#475569";
              ctx.lineWidth = 2;

              ctx.beginPath();
              ast.points.forEach((pt, idx) => {
                if (idx === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
              });
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              if (ast.health < ast.maxHealth) {
                ctx.strokeStyle = "#ef4444";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(
                  0,
                  0,
                  ast.radius + 6,
                  -Math.PI / 2,
                  -Math.PI / 2 + (Math.PI * 2 * ast.health) / ast.maxHealth
                );
                ctx.stroke();
              }

              ctx.restore();
            }
          } else {
            onAsteroidDestroyed(ast);
            soundManager.playExplosion(0.8);

            setLoot((prevLoot) => [
              ...prevLoot,
              {
                id: "loot-" + Math.random().toString(36).substr(2, 9),
                x: ast.x,
                y: ast.y,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30,
                type: Math.random() > 0.4 ? "ALLOY" : "CRYO_COOLANT",
                name: ast.mineral,
                value: ast.value,
                life: 30,
              },
            ]);

            for (let i = 0; i < 16; i++) {
              particlesRef.current.push({
                x: ast.x,
                y: ast.y,
                vx: (Math.random() - 0.5) * 160,
                vy: (Math.random() - 0.5) * 160,
                size: Math.random() * 3 + 1,
                color: "#94a3b8",
                alpha: 0.9,
                life: 0,
                maxLife: 35,
              });
            }
          }
        }
        return nextAst;
      });

      // --- 7. UPDATE & RENDER ROGUE DRONES ---
      setDrones((prevDrones) => {
        const nextDrones: RogueDrone[] = [];

        for (const drone of prevDrones) {
          const dx = vessel.x - drone.x;
          const dy = vessel.y - drone.y;
          const dist = Math.hypot(dx, dy);

          drone.heading = Math.atan2(dy, dx);
          drone.evasionTimer += dt;

          const speedMult = directorParams?.droneAggression ? directorParams.droneAggression / 50 : 1.0;
          const speed = (drone.droneType === "SCOUT" ? 140 : 95) * speedMult;
          const desiredDist = 240;

          if (dist > desiredDist) {
            drone.vx += (Math.cos(drone.heading) * speed - drone.vx) * 0.05;
            drone.vy += (Math.sin(drone.heading) * speed - drone.vy) * 0.05;
          } else {
            const strafeAngle = drone.heading + Math.PI / 2;
            drone.vx += (Math.cos(strafeAngle) * speed * 0.7 - drone.vx) * 0.05;
            drone.vy += (Math.sin(strafeAngle) * speed * 0.7 - drone.vy) * 0.05;
          }

          drone.x += drone.vx * dt;
          drone.y += drone.vy * dt;

          // Drone Laser Firing
          const effectiveCooldown = drone.fireCooldown * (directorParams?.droneFireIntervalMultiplier || 1.0);
          if (currentTime - drone.lastFireTime > effectiveCooldown && dist < 480) {
            drone.lastFireTime = currentTime;
            soundManager.playLaser(true);

            setProjectiles((prevP) => [
              ...prevP,
              {
                id: "dp-" + Math.random().toString(36).substr(2, 9),
                x: drone.x,
                y: drone.y,
                vx: Math.cos(drone.heading) * 420,
                vy: Math.sin(drone.heading) * 420,
                damage: drone.droneType === "HEAVY_SENTINEL" ? 18 : 10,
                life: 0,
                maxLife: 1.8,
                isEnemy: true,
                color: "#ef4444",
              },
            ]);
          }

          // Check Player Projectile Hits on Drone
          projectiles.forEach((p) => {
            if (!p.isEnemy) {
              const d = Math.hypot(p.x - drone.x, p.y - drone.y);
              if (d < drone.radius + 6) {
                p.life = p.maxLife;
                if (onShotHit) onShotHit();

                if (drone.shields > 0) {
                  if (p.shieldPenetration && p.shieldPenetration > 0) {
                    const penetrationDamage = p.damage * p.shieldPenetration;
                    const shieldDamage = p.damage * (1 - p.shieldPenetration);

                    drone.health -= penetrationDamage;
                    drone.shields = Math.max(0, drone.shields - shieldDamage);
                    soundManager.playShieldDeflect();
                  } else {
                    drone.shields = Math.max(0, drone.shields - p.damage);
                    soundManager.playShieldDeflect();
                  }
                } else {
                  drone.health -= p.damage;
                  soundManager.playExplosion(0.5);
                }

                // Slow down drone if hit by Varuna
                if (p.color === "#06b6d4") {
                  drone.vx *= 0.3;
                  drone.vy *= 0.3;
                }
              }
            }
          });

          if (drone.health > 0) {
            nextDrones.push(drone);

            const sx = drone.x - camX + halfW;
            const sy = drone.y - camY + halfH;

            if (sx >= -100 && sx <= canvas.width + 100 && sy >= -100 && sy <= canvas.height + 100) {
              ctx.save();
              ctx.translate(sx, sy);
              ctx.rotate(drone.heading);

              // Shield Bubble
              if (drone.shields > 0) {
                ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, drone.radius + 5, 0, Math.PI * 2);
                ctx.stroke();
              }

              // Drone Chassis
              ctx.fillStyle = "#881337";
              ctx.strokeStyle = "#f43f5e";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(drone.radius, 0);
              ctx.lineTo(-drone.radius, -drone.radius * 0.8);
              ctx.lineTo(-drone.radius * 0.4, 0);
              ctx.lineTo(-drone.radius, drone.radius * 0.8);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              ctx.restore();
            }
          } else {
            onDroneDestroyed(drone);
            soundManager.playExplosion(1.0);

            setLoot((prevLoot) => [
              ...prevLoot,
              {
                id: "loot-" + Math.random().toString(36).substr(2, 9),
                x: drone.x,
                y: drone.y,
                vx: (Math.random() - 0.5) * 40,
                vy: (Math.random() - 0.5) * 40,
                type: "SALVAGE_CORE",
                name: "Corrupted Asura Core",
                value: drone.salvageValue,
                life: 35,
              },
            ]);

            for (let i = 0; i < 24; i++) {
              particlesRef.current.push({
                x: drone.x,
                y: drone.y,
                vx: (Math.random() - 0.5) * 220,
                vy: (Math.random() - 0.5) * 220,
                size: Math.random() * 4 + 1,
                color: "#f43f5e",
                alpha: 1,
                life: 0,
                maxLife: 40,
              });
            }
          }
        }
        return nextDrones;
      });

      // --- 8. UPDATE & RENDER ENEMY PROJECTILES HITTING PLAYER ---
      projectiles.forEach((p) => {
        if (p.isEnemy) {
          const dist = Math.hypot(p.x - vessel.x, p.y - vessel.y);
          if (dist < 26) {
            p.life = p.maxLife;

            const effectiveDmg = Math.round(p.damage * (vessel.isHanumanProtocolActive ? 0.25 : 1.0));

            if (vessel.shields > 0) {
              const sDmg = Math.min(vessel.shields, effectiveDmg);
              vessel.shields -= sDmg;
              const overflow = effectiveDmg - sDmg;
              if (overflow > 0) {
                vessel.hull = Math.max(0, vessel.hull - overflow);
              }
              soundManager.playShieldDeflect();
              onVesselDamaged(effectiveDmg, true);
            } else {
              vessel.hull = Math.max(0, vessel.hull - effectiveDmg);
              soundManager.playExplosion(0.6);
              onVesselDamaged(effectiveDmg, false);
            }
          }
        }
      });

      // --- 9. UPDATE & RENDER RELICS / ANOMALIES ---
      setRelics((prevRelics) => {
        const nextRelics: QuantumRelic[] = [];

        for (const relic of prevRelics) {
          const dx = vessel.x - relic.x;
          const dy = vessel.y - relic.y;
          const dist = Math.hypot(dx, dy);

          relic.pulsePhase += dt * 3;

          // Tractor Beam Pull
          if (vessel.isTractorActive && dist < 340) {
            const pullForce = 190 * dt;
            relic.vx += (dx / dist) * pullForce;
            relic.vy += (dy / dist) * pullForce;

            // Draw Tractor Beam Wave
            const vsx = vessel.x - camX + halfW;
            const vsy = vessel.y - camY + halfH;
            const rsx = relic.x - camX + halfW;
            const rsy = relic.y - camY + halfH;

            ctx.save();
            ctx.strokeStyle = "rgba(6, 182, 212, 0.45)";
            ctx.lineWidth = 3;
            ctx.shadowColor = "#06b6d4";
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.moveTo(vsx, vsy);
            const midX = (vsx + rsx) / 2 + Math.sin(currentTime * 0.01) * 12;
            const midY = (vsy + rsy) / 2 + Math.cos(currentTime * 0.01) * 12;
            ctx.quadraticCurveTo(midX, midY, rsx, rsy);
            ctx.stroke();
            ctx.restore();

            relic.scanProgress = Math.min(100, relic.scanProgress + 30 * dt);
          }

          relic.x += relic.vx * dt;
          relic.y += relic.vy * dt;
          relic.vx *= 0.98;
          relic.vy *= 0.98;

          // Capture check
          if (dist < 34) {
            onRelicCaptured(relic);
            soundManager.playRelicRecovered();

            for (let i = 0; i < 28; i++) {
              particlesRef.current.push({
                x: relic.x,
                y: relic.y,
                vx: (Math.random() - 0.5) * 180,
                vy: (Math.random() - 0.5) * 180,
                size: Math.random() * 4 + 2,
                color: relic.color,
                alpha: 1,
                life: 0,
                maxLife: 40,
              });
            }
          } else {
            nextRelics.push(relic);

            const sx = relic.x - camX + halfW;
            const sy = relic.y - camY + halfH;

            if (sx >= -100 && sx <= canvas.width + 100 && sy >= -100 && sy <= canvas.height + 100) {
              ctx.save();
              ctx.translate(sx, sy);

              const glowScale = 1 + Math.sin(relic.pulsePhase) * 0.25;

              // Outer Quantum Halo
              const halo = ctx.createRadialGradient(0, 0, 5, 0, 0, relic.radius * 2.2 * glowScale);
              halo.addColorStop(0, relic.color);
              halo.addColorStop(1, "transparent");
              ctx.fillStyle = halo;
              ctx.beginPath();
              ctx.arc(0, 0, relic.radius * 2.2 * glowScale, 0, Math.PI * 2);
              ctx.fill();

              // Geometric Octahedron Anomaly
              ctx.fillStyle = "#ffffff";
              ctx.strokeStyle = relic.color;
              ctx.lineWidth = 2;
              ctx.shadowColor = relic.color;
              ctx.shadowBlur = 12;

              ctx.beginPath();
              ctx.moveTo(0, -relic.radius);
              ctx.lineTo(relic.radius * 0.9, 0);
              ctx.lineTo(0, relic.radius);
              ctx.lineTo(-relic.radius * 0.9, 0);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Holographic Sanskrit / Realm Tag
              ctx.shadowBlur = 0;
              ctx.font = "10px monospace";
              ctx.fillStyle = relic.color;
              ctx.textAlign = "center";
              ctx.fillText(relic.classification, 0, relic.radius + 16);

              ctx.restore();
            }
          }
        }
        return nextRelics;
      });

      // --- 10. UPDATE & RENDER FLOATING LOOT ---
      setLoot((prevLoot) => {
        const nextLoot: FloatingLoot[] = [];

        for (const item of prevLoot) {
          const dx = vessel.x - item.x;
          const dy = vessel.y - item.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 220 || vessel.isTractorActive) {
            const pull = 220 * dt;
            item.vx += (dx / dist) * pull;
            item.vy += (dy / dist) * pull;
          }

          item.x += item.vx * dt;
          item.y += item.vy * dt;
          item.life -= dt;

          if (dist < 28) {
            onLootCollected(item);
            soundManager.playUiClick();
          } else if (item.life > 0) {
            nextLoot.push(item);

            const sx = item.x - camX + halfW;
            const sy = item.y - camY + halfH;

            ctx.save();
            ctx.translate(sx, sy);
            ctx.fillStyle = item.type === "CRYO_COOLANT" ? "#06b6d4" : "#fbbf24";
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 8;
            ctx.fillRect(-5, -5, 10, 10);
            ctx.restore();
          }
        }
        return nextLoot;
      });

      // --- 11. UPDATE & RENDER PARTICLES ---
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += 1;

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        } else {
          const sx = p.x - camX + halfW;
          const sy = p.y - camY + halfH;
          const progress = p.life / p.maxLife;
          const currentAlpha = p.alpha * (1 - progress);

          ctx.save();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = currentAlpha;
          ctx.beginPath();
          ctx.arc(sx, sy, p.size * (1 - progress * 0.4), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // --- 12. RENDER PLAYER VESSEL (PUSHPAKA VIMANA) ---
      const vsx = vessel.x - camX + halfW;
      const vsy = vessel.y - camY + halfH;

      ctx.save();
      ctx.translate(vsx, vsy);
      ctx.rotate(vessel.heading);

      // Hanuman Protocol Radiant Golden Aura
      if (vessel.isHanumanProtocolActive) {
        ctx.save();
        const pulse = 1 + Math.sin(currentTime * 0.01) * 0.15;
        ctx.strokeStyle = "rgba(245, 158, 11, 0.8)";
        ctx.fillStyle = "rgba(245, 158, 11, 0.2)";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(0, 0, 42 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sacred geometric diamond ring
        ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -36 * pulse);
        ctx.lineTo(36 * pulse, 0);
        ctx.lineTo(0, 36 * pulse);
        ctx.lineTo(-36 * pulse, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // Anahata Shield Bubble (if shields > 0)
      if (vessel.shields > 0) {
        const shieldAlpha = (vessel.shields / vessel.maxShields) * 0.35 + 0.1;
        ctx.strokeStyle = `rgba(56, 189, 248, ${shieldAlpha})`;
        ctx.fillStyle = `rgba(56, 189, 248, ${shieldAlpha * 0.25})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.ellipse(0, 0, 34, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Vimana Hull Geometry (Stepped ancient architecture accents)
      ctx.shadowBlur = 8;
      ctx.shadowColor = vessel.isHanumanProtocolActive ? "#f59e0b" : "#0284c7";
      ctx.fillStyle = "#091220";
      ctx.strokeStyle = vessel.isHanumanProtocolActive ? "#fbbf24" : "#38bdf8";
      ctx.lineWidth = 2;

      // Primary Vimana Fuselage
      ctx.beginPath();
      ctx.moveTo(28, 0); // Golden prow
      ctx.lineTo(10, -12); // Forward stepped wing
      ctx.lineTo(4, -18);
      ctx.lineTo(-14, -22); // Main stepped wing tip
      ctx.lineTo(-20, -12); // Engine nacelle
      ctx.lineTo(-16, 0); // Core drive housing
      ctx.lineTo(-20, 12);
      ctx.lineTo(-14, 22);
      ctx.lineTo(4, 18);
      ctx.lineTo(10, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ancient Bronze / Copper filigree accents
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-4, -10);
      ctx.lineTo(-12, -4);
      ctx.lineTo(-12, 4);
      ctx.lineTo(-4, 10);
      ctx.closePath();
      ctx.stroke();

      // Central Sacred Bindu / Reactor Core
      const coreHue = vessel.coreTemp > 500 ? "#ef4444" : vessel.isHanumanProtocolActive ? "#fbbf24" : "#06b6d4";
      ctx.fillStyle = coreHue;
      ctx.shadowColor = coreHue;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(-2, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // Cockpit Crystal Canopy
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.ellipse(14, 0, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // --- 13. TACTICAL HUD OVERLAY (Velocity Vector & Crosshair) ---
      ctx.save();
      const reticleDist = 120;
      const rx = vsx + Math.cos(vessel.heading) * reticleDist;
      const ry = vsy + Math.sin(vessel.heading) * reticleDist;

      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(rx, ry, 6, 0, Math.PI * 2);
      ctx.stroke();

      const currentSpeed = Math.hypot(vessel.vx, vessel.vy);
      if (currentSpeed > 20) {
        const velAngle = Math.atan2(vessel.vy, vessel.vx);
        const vxScreen = vsx + Math.cos(velAngle) * 60;
        const vyScreen = vsy + Math.sin(velAngle) * 60;

        ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
        ctx.beginPath();
        ctx.arc(vxScreen, vyScreen, 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [
    sector,
    projectiles,
    asteroids,
    drones,
    relics,
    loot,
    vessel,
    onRelicCaptured,
    onDroneDestroyed,
    onAsteroidDestroyed,
    onLootCollected,
    onVesselDamaged,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair touch-none"
      />

      {/* Flight Control Keybind Indicator */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-2 text-xs font-mono bg-slate-900/85 backdrop-blur-md border border-amber-500/20 px-3 py-2 rounded-lg text-amber-300 shadow-lg">
        <span className="flex items-center gap-1">
          <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white">W/A/S/D</kbd> Muladhara Thrust
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1">
          <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white">SPACE</kbd> Fire Astra
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1">
          <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white">Q/X</kbd> Cycle Astra
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1">
          <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white">H</kbd> Hanuman Protocol
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1">
          <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white">E</kbd> Tractor Beam
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1">
          <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-white">V</kbd> Vent Heat
        </span>
      </div>

      {/* Mini-Radar Long Range Tactical Sensor */}
      <div className="absolute top-4 right-4 z-10 w-44 h-44 bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-xl p-2 flex flex-col shadow-lg shadow-cyan-950/40">
        <div className="flex justify-between items-center text-[10px] font-mono text-cyan-400 border-b border-slate-800 pb-1 mb-1">
          <span>AJNA LIDAR // 2.5KM</span>
          <span className="animate-pulse flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </div>
        <div className="relative flex-1 rounded-lg bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(6,182,212,0.15)_360deg)] animate-spin duration-[4000ms]"></div>
          <div className="absolute w-28 h-28 rounded-full border border-cyan-500/10 pointer-events-none"></div>
          <div className="absolute w-16 h-16 rounded-full border border-cyan-500/20 pointer-events-none"></div>
          <div className="w-2 h-2 rounded-full bg-cyan-400 z-10 shadow-sm shadow-cyan-400"></div>

          {/* Anomaly Radar Blips */}
          {relics.map((r) => {
            const rx = ((r.x - vessel.x) / 2500) * 80;
            const ry = ((r.y - vessel.y) / 2500) * 80;
            if (Math.abs(rx) > 70 || Math.abs(ry) > 70) return null;
            return (
              <div
                key={r.id}
                className="absolute w-2 h-2 rounded-full bg-purple-400 animate-ping"
                style={{ transform: `translate(${rx}px, ${ry}px)` }}
              />
            );
          })}

          {/* Hostile Asura Drone Radar Blips */}
          {drones.map((d) => {
            const dx = ((d.x - vessel.x) / 2500) * 80;
            const dy = ((d.y - vessel.y) / 2500) * 80;
            if (Math.abs(dx) > 70 || Math.abs(dy) > 70) return null;
            return (
              <div
                key={d.id}
                className="absolute w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500"
                style={{ transform: `translate(${dx}px, ${dy}px)` }}
              />
            );
          })}

          {/* Asteroids Radar Blips */}
          {asteroids.slice(0, 15).map((a) => {
            const ax = ((a.x - vessel.x) / 2500) * 80;
            const ay = ((a.y - vessel.y) / 2500) * 80;
            if (Math.abs(ax) > 70 || Math.abs(ay) > 70) return null;
            return (
              <div
                key={a.id}
                className="absolute w-1 h-1 rounded-full bg-slate-500"
                style={{ transform: `translate(${ax}px, ${ay}px)` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
