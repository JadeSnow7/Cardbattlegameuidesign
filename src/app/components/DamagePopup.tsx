import { motion } from "motion/react";

interface DamagePopupProps {
  damage: number;
  type: "damage" | "heal" | "shield";
  x: number;
  y: number;
}

export function DamagePopup({ damage, type, x, y }: DamagePopupProps) {
  const colors = {
    damage: "text-red-500",
    heal: "text-green-500",
    shield: "text-blue-500",
  };

  const symbols = {
    damage: "-",
    heal: "+",
    shield: "+",
  };

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{
        opacity: [1, 1, 0],
        y: -50,
        scale: [0.5, 1.5, 1],
      }}
      transition={{ duration: 1.5 }}
      style={{ position: "absolute", left: x, top: y }}
      className={`font-bold text-4xl ${colors[type]} pointer-events-none z-50 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]`}
    >
      {symbols[type]}
      {damage}
    </motion.div>
  );
}
