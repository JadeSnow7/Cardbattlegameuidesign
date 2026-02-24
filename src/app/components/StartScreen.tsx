import { motion } from "motion/react";
import { CardDuelLogo } from "./CardDuelLogo";
import { Swords, Trophy, Users, Sparkles } from "lucide-react";

interface StartScreenProps {
  onStart: () => void;
  onShowRanking: () => void;
  onShowCollection: () => void;
}

export function StartScreen({ onStart, onShowRanking, onShowCollection }: StartScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 z-50 flex items-center justify-center"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, #5C6BC0 1px, transparent 1px),
              linear-gradient(to bottom, #5C6BC0 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Floating Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12">
        {/* Logo */}
        <CardDuelLogo size={150} showText={true} animate={true} />

        {/* Menu Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col gap-4 w-80"
        >
          {/* Start Game */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 px-8 py-4 rounded-xl text-white font-bold text-xl flex items-center justify-center gap-3 transition-all">
              <Swords className="w-6 h-6" />
              开始对战
            </div>
          </motion.button>

          {/* Secondary Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShowRanking}
              className="bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-6 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Trophy className="w-5 h-5" />
              排行榜
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShowCollection}
              className="bg-gradient-to-br from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 px-6 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              收藏
            </motion.button>
          </div>

          {/* PvP (Coming Soon) */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            disabled
            className="bg-gray-800 px-6 py-3 rounded-xl text-gray-500 font-semibold flex items-center justify-center gap-2 cursor-not-allowed relative overflow-hidden"
          >
            <Users className="w-5 h-5" />
            联机对战
            <span className="absolute top-1 right-1 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">
              敬请期待
            </span>
          </motion.button>
        </motion.div>

        {/* Version & Credits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center text-gray-400 text-sm"
        >
          <p>Version 1.0.0 - Phase 4</p>
          <p className="mt-1">© 2026 Card Duel. All rights reserved.</p>
        </motion.div>
      </div>

      {/* Decorative Corners */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-yellow-500/30 rounded-tl-3xl" />
      <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-yellow-500/30 rounded-tr-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-yellow-500/30 rounded-bl-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-yellow-500/30 rounded-br-3xl" />
    </motion.div>
  );
}
