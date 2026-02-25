import { motion } from "motion/react";
import { Settings, Flag, Zap } from "lucide-react";

interface ActionBarProps {
  onEndTurn: () => void;
  onSurrender: () => void;
  onSettings: () => void;
  isPlayerTurn: boolean;
  heroSkillCost: number;
  currentMana: number;
  onHeroSkill?: () => void;
  heroSkillCooldown?: number;
  layout?: "desktop" | "mobile";
}

export function ActionBar({
  onEndTurn,
  onSurrender,
  onSettings,
  isPlayerTurn,
  heroSkillCost,
  currentMana,
  onHeroSkill,
  heroSkillCooldown = 0,
  layout = "desktop",
}: ActionBarProps) {
  const canUseHeroSkill = currentMana >= heroSkillCost && heroSkillCooldown === 0;
  const endTurnLabel = isPlayerTurn ? "结束回合" : "对手回合";

  const heroSkillButton = (
    <motion.button
      whileHover={{ scale: canUseHeroSkill ? 1.05 : 1 }}
      whileTap={{ scale: canUseHeroSkill ? 0.95 : 1 }}
      onClick={canUseHeroSkill ? onHeroSkill : undefined}
      className={`relative rounded-xl border-3 flex items-center justify-center transition-all ${
        canUseHeroSkill
          ? "bg-gradient-to-br from-purple-600 to-purple-700 border-purple-400 shadow-lg shadow-purple-500/50 cursor-pointer"
          : "bg-gray-700/50 border-gray-600 cursor-not-allowed"
      } ${layout === "mobile" ? "h-14 w-full" : "h-16 w-16"}`}
    >
      <Zap className={`${layout === "mobile" ? "w-6 h-6" : "w-8 h-8"} ${canUseHeroSkill ? "text-yellow-300" : "text-gray-500"}`} />

      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border-2 border-white flex items-center justify-center">
        <span className="text-xs font-bold text-white">{heroSkillCost}</span>
      </div>

      {heroSkillCooldown > 0 && (
        <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">{heroSkillCooldown}</span>
        </div>
      )}
    </motion.button>
  );

  if (layout === "mobile") {
    return (
      <div className="border-t border-gray-700/50 bg-gradient-to-r from-gray-900/85 to-gray-800/85 backdrop-blur-sm px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
        <motion.button
          whileHover={{ scale: isPlayerTurn ? 1.02 : 1 }}
          whileTap={{ scale: isPlayerTurn ? 0.98 : 1 }}
          animate={
            isPlayerTurn
              ? {
                  boxShadow: [
                    "0 0 18px rgba(34, 197, 94, 0.45)",
                    "0 0 32px rgba(34, 197, 94, 0.75)",
                    "0 0 18px rgba(34, 197, 94, 0.45)",
                  ],
                }
              : {}
          }
          transition={{ repeat: Infinity, duration: 2 }}
          onClick={isPlayerTurn ? onEndTurn : undefined}
          disabled={!isPlayerTurn}
          className={`h-[60px] w-full min-h-[60px] rounded-2xl border-3 font-bold text-lg whitespace-nowrap shrink-0 transition-all ${
            isPlayerTurn
              ? "bg-gradient-to-r from-green-600 to-green-500 text-white border-green-400 shadow-xl cursor-pointer"
              : "bg-gray-700/50 text-gray-400 border-gray-600 cursor-not-allowed"
          }`}
        >
          {endTurnLabel}
        </motion.button>

        <div className="mt-3 grid grid-cols-3 gap-3 items-stretch">
          {heroSkillButton}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSettings}
            className="h-14 rounded-xl bg-gray-700/80 border-2 border-gray-600 flex items-center justify-center hover:bg-gray-600/80 transition-colors"
          >
            <Settings className="w-6 h-6 text-gray-300" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSurrender}
            className="h-14 px-3 rounded-xl bg-red-900/60 border-2 border-red-600 text-red-200 hover:bg-red-800/60 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Flag className="w-5 h-5" />
            <span className="text-sm font-semibold">投降</span>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-t border-gray-700/50">
      {/* Left: Hero Skill */}
      <div className="flex gap-3">
        {heroSkillButton}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSettings}
          className="w-16 h-16 rounded-xl bg-gray-700/80 border-2 border-gray-600 flex items-center justify-center hover:bg-gray-600/80 transition-colors"
        >
          <Settings className="w-6 h-6 text-gray-300" />
        </motion.button>
      </div>

      {/* Center: End Turn Button */}
      <motion.button
        whileHover={{ scale: isPlayerTurn ? 1.05 : 1 }}
        whileTap={{ scale: isPlayerTurn ? 0.95 : 1 }}
        animate={
          isPlayerTurn
            ? {
                boxShadow: [
                  "0 0 20px rgba(34, 197, 94, 0.5)",
                  "0 0 40px rgba(34, 197, 94, 0.8)",
                  "0 0 20px rgba(34, 197, 94, 0.5)",
                ],
              }
            : {}
        }
        transition={{ repeat: Infinity, duration: 2 }}
        onClick={isPlayerTurn ? onEndTurn : undefined}
        disabled={!isPlayerTurn}
        className={`px-12 py-4 rounded-2xl font-bold text-lg whitespace-nowrap shrink-0 transition-all ${
          isPlayerTurn
            ? "bg-gradient-to-r from-green-600 to-green-500 text-white border-3 border-green-400 shadow-xl cursor-pointer"
            : "bg-gray-700/50 text-gray-400 border-2 border-gray-600 cursor-not-allowed"
        }`}
      >
        {endTurnLabel}
      </motion.button>

      {/* Right: Surrender */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSurrender}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-900/60 border-2 border-red-600 text-red-200 hover:bg-red-800/60 transition-colors whitespace-nowrap shrink-0"
      >
        <Flag className="w-5 h-5" />
        <span className="font-semibold">投降</span>
      </motion.button>
    </div>
  );
}
