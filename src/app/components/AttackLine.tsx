import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface AttackLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  onComplete?: () => void;
}

export function AttackLine({ fromX, fromY, toX, toY, onComplete }: AttackLineProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);

      if (newProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    animate();
  }, [onComplete]);

  // 计算贝塞尔曲线控制点
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2 - 50; // 向上弯曲

  const currentX = fromX + (toX - fromX) * progress;
  const currentY = fromY + (toY - fromY) * progress - Math.sin(progress * Math.PI) * 50;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-50"
      style={{ width: "100%", height: "100%" }}
    >
      {/* Attack Path */}
      <motion.path
        d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`}
        stroke="#fbbf24"
        strokeWidth="4"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: progress, opacity: 1 }}
        strokeDasharray="10 5"
      />

      {/* Projectile */}
      <motion.circle
        cx={currentX}
        cy={currentY}
        r="8"
        fill="#fbbf24"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.5, 1] }}
        transition={{ duration: 0.3 }}
      >
        <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
      </motion.circle>

      {/* Glow Effect */}
      <motion.circle
        cx={currentX}
        cy={currentY}
        r="20"
        fill="#fbbf24"
        opacity="0.3"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 2, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
    </svg>
  );
}
