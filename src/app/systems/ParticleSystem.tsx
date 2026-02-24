import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

// 粒子类型
export enum ParticleType {
  Hit = "Hit",
  Buff = "Buff",
  Summon = "Summon",
  Heal = "Heal",
  Death = "Death",
  Spell = "Spell",
}

// 粒子配置
interface Particle {
  id: string;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  opacity: number;
}

interface ParticleEffectProps {
  type: ParticleType;
  x: number;
  y: number;
  onComplete?: () => void;
}

/**
 * 粒子效果组件
 */
export function ParticleEffect({ type, x, y, onComplete }: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // 生成粒子
    const newParticles = generateParticles(type, x, y);
    setParticles(newParticles);

    // 动画完成后清理
    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [type, x, y, onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: particle.x,
              y: particle.y,
              scale: 0,
              opacity: 1,
            }}
            animate={{
              x: particle.x + particle.vx,
              y: particle.y + particle.vy,
              scale: [0, 1, 0],
              opacity: [1, 0.8, 0],
            }}
            transition={{
              duration: particle.life,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              backgroundColor: particle.color,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * 生成粒子
 */
function generateParticles(type: ParticleType, x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  let count = 20;
  let colors: string[] = [];
  let sizeRange: [number, number] = [4, 8];
  let velocityMultiplier = 1;

  switch (type) {
    case ParticleType.Hit:
      count = 30;
      colors = ["#ef4444", "#f97316", "#fbbf24"];
      sizeRange = [6, 12];
      velocityMultiplier = 2;
      break;

    case ParticleType.Buff:
      count = 25;
      colors = ["#fbbf24", "#facc15", "#fde047"];
      sizeRange = [4, 8];
      velocityMultiplier = 1.5;
      break;

    case ParticleType.Summon:
      count = 40;
      colors = ["#8b5cf6", "#a78bfa", "#c4b5fd"];
      sizeRange = [3, 10];
      velocityMultiplier = 1.2;
      break;

    case ParticleType.Heal:
      count = 20;
      colors = ["#22c55e", "#4ade80", "#86efac"];
      sizeRange = [5, 10];
      velocityMultiplier = 1;
      break;

    case ParticleType.Death:
      count = 50;
      colors = ["#1f2937", "#374151", "#4b5563"];
      sizeRange = [4, 12];
      velocityMultiplier = 1.8;
      break;

    case ParticleType.Spell:
      count = 35;
      colors = ["#3b82f6", "#60a5fa", "#93c5fd"];
      sizeRange = [4, 10];
      velocityMultiplier = 1.5;
      break;
  }

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const velocity = (Math.random() * 100 + 50) * velocityMultiplier;

    particles.push({
      id: `particle_${Date.now()}_${i}`,
      type,
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity + Math.random() * -50,
      life: Math.random() * 1 + 1,
      size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 1,
    });
  }

  return particles;
}

/**
 * 光环特效
 */
export function AuraEffect({ x, y, color = "#fbbf24" }: { x: number; y: number; color?: string }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0, 1.5, 1],
        opacity: [0, 0.8, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 100,
        height: 100,
        borderRadius: "50%",
        border: `3px solid ${color}`,
        boxShadow: `0 0 20px ${color}`,
        pointerEvents: "none",
      }}
    />
  );
}

/**
 * 爆炸特效
 */
export function ExplosionEffect({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
      {/* Center Flash */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full"
      />

      {/* Shockwave */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 border-4 border-orange-500 rounded-full"
      />

      {/* Fire Ring */}
      <motion.div
        initial={{ scale: 0.5, opacity: 1 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 bg-gradient-radial from-yellow-500 via-orange-500 to-red-600 rounded-full blur-md"
      />
    </div>
  );
}
