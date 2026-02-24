import { motion } from "motion/react";
import { Heart, Shield, Droplet, Flame } from "lucide-react";

interface PlayerInfoProps {
  name: string;
  avatar: string;
  health: number;
  maxHealth: number;
  armor: number;
  mana: number;
  maxMana: number;
  handCount: number;
  isEnemy?: boolean;
  status?: Array<{ type: string; icon: string }>;
}

export function PlayerInfo({
  name,
  avatar,
  health,
  maxHealth,
  armor,
  mana,
  maxMana,
  handCount,
  isEnemy = false,
  status = [],
}: PlayerInfoProps) {
  const healthPercent = (health / maxHealth) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: isEnemy ? -20 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${
        isEnemy
          ? "from-red-900/40 to-red-800/30"
          : "from-blue-900/40 to-blue-800/30"
      } backdrop-blur-sm border-2 ${
        isEnemy ? "border-red-500/30" : "border-blue-500/30"
      }`}
    >
      {/* Avatar */}
      <div className="relative">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-16 h-16 rounded-full border-4 border-yellow-400/80 overflow-hidden shadow-lg shadow-yellow-400/30"
        >
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        </motion.div>
        {status.length > 0 && (
          <div className="absolute -top-1 -right-1 flex gap-0.5">
            {status.map((s, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-purple-600 border-2 border-purple-400 flex items-center justify-center text-xs"
              >
                {s.icon}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold">{name}</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-300">
              <Droplet className="w-3 h-3" />
              <span>{handCount}</span>
            </div>
          </div>
        </div>

        {/* Health Bar */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" />
            <div className="flex-1 h-6 bg-black/40 rounded-full overflow-hidden border border-red-900/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${healthPercent}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center"
              >
                <span className="text-xs font-bold text-white drop-shadow-lg">
                  {health}/{maxHealth}
                </span>
              </motion.div>
            </div>
            {armor > 0 && (
              <div className="flex items-center gap-1 bg-blue-600/80 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3 text-blue-200" />
                <span className="text-xs font-bold text-white">{armor}</span>
              </div>
            )}
          </div>

          {/* Mana */}
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-blue-400" />
            <div className="flex gap-1">
              {Array.from({ length: maxMana }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`w-5 h-5 rounded-full border-2 ${
                    i < mana
                      ? "bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-300 shadow-lg shadow-cyan-400/50"
                      : "bg-gray-700/50 border-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-cyan-300 font-bold">
              {mana}/{maxMana}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
