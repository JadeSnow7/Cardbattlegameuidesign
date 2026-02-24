import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface DamageNumberProps {
  damage: number;
  type: "damage" | "heal" | "shield";
  x: number;
  y: number;
  onComplete?: () => void;
}

export function DamageNumber({ damage, type, x, y, onComplete }: DamageNumberProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  const colors = {
    damage: "#ef4444",
    heal: "#22c55e",
    shield: "#3b82f6",
  };

  const symbols = {
    damage: "-",
    heal: "+",
    shield: "+",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: -80,
        scale: [0.5, 1.5, 1.2, 1],
      }}
      transition={{ duration: 1.5, times: [0, 0.2, 0.8, 1] }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        pointerEvents: "none",
        zIndex: 100,
      }}
      className="font-bold text-5xl"
    >
      <div
        style={{
          color: colors[type],
          textShadow: `0 0 10px ${colors[type]}, 0 0 20px ${colors[type]}, 0 2px 8px rgba(0,0,0,0.8)`,
        }}
      >
        {symbols[type]}
        {damage}
      </div>
    </motion.div>
  );
}
