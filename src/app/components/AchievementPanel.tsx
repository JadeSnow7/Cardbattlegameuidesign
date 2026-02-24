import { motion, AnimatePresence } from "motion/react";
import { Trophy, Award, Star, Lock, X } from "lucide-react";
import { achievementSystem, Achievement, AchievementCategory, AchievementRarity } from "../systems/AchievementSystem";
import { useState } from "react";

interface AchievementPanelProps {
  onClose: () => void;
  playerId: string;
}

// 稀有度颜色
const RARITY_COLORS: Record<AchievementRarity, string> = {
  [AchievementRarity.Common]: "from-gray-500 to-gray-400",
  [AchievementRarity.Rare]: "from-blue-500 to-blue-400",
  [AchievementRarity.Epic]: "from-purple-600 to-purple-500",
  [AchievementRarity.Legendary]: "from-orange-600 to-yellow-500",
};

const CATEGORY_NAMES: Record<AchievementCategory, string> = {
  [AchievementCategory.Battle]: "对战",
  [AchievementCategory.Collection]: "收集",
  [AchievementCategory.Skill]: "技巧",
  [AchievementCategory.Social]: "社交",
  [AchievementCategory.Season]: "赛季",
};

export function AchievementPanel({ onClose, playerId }: AchievementPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | "all">("all");
  const progress = achievementSystem.getPlayerProgress(playerId);
  const allAchievements = achievementSystem.getAllAchievements(playerId);
  const completion = achievementSystem.getCompletionPercentage(playerId);

  const filteredAchievements =
    selectedCategory === "all"
      ? allAchievements
      : achievementSystem.getAchievementsByCategory(playerId, selectedCategory);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border-2 border-yellow-600/50 shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 p-6 border-b border-yellow-600/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Award className="w-8 h-8 text-yellow-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">成就系统</h2>
                <p className="text-sm text-gray-300">
                  已解锁: {progress.unlockedCount}/{allAchievements.length} (
                  {completion.toFixed(1)}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">
                  {progress.totalPoints}
                </div>
                <div className="text-xs text-gray-400">成就点数</div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-4 border-b border-gray-700 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === "all"
                ? "bg-yellow-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            全部
          </button>
          {Object.entries(CATEGORY_NAMES).map(([category, name]) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as AchievementCategory)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-280px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAchievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className={`relative rounded-xl p-4 border-2 transition-colors ${
                  achievement.unlocked
                    ? `bg-gradient-to-r ${
                        RARITY_COLORS[achievement.rarity]
                      } bg-opacity-20 border-yellow-500/50`
                    : "bg-gray-800/50 border-gray-700"
                }`}
              >
                {/* Locked Overlay */}
                {!achievement.unlocked && achievement.hidden && (
                  <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center backdrop-blur-sm z-10">
                    <Lock className="w-12 h-12 text-gray-600" />
                  </div>
                )}

                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-lg flex items-center justify-center text-3xl ${
                      achievement.unlocked
                        ? `bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]}`
                        : "bg-gray-700"
                    }`}
                  >
                    {achievement.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4
                          className={`font-bold ${
                            achievement.unlocked ? "text-white" : "text-gray-400"
                          }`}
                        >
                          {achievement.name}
                        </h4>
                        <p
                          className={`text-xs ${
                            achievement.unlocked ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {achievement.description}
                        </p>
                      </div>
                      {achievement.unlocked && (
                        <Trophy className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>

                    {/* Progress */}
                    {!achievement.unlocked && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>进度</span>
                          <span>
                            {achievement.condition.current}/{achievement.condition.target}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500"
                            style={{
                              width: `${
                                (achievement.condition.current /
                                  achievement.condition.target) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Reward */}
                    <div className="mt-2 flex gap-2 text-xs">
                      {achievement.reward.gold && (
                        <span className="bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded">
                          💰 {achievement.reward.gold}
                        </span>
                      )}
                      {achievement.reward.cardPacks && (
                        <span className="bg-purple-900/50 text-purple-300 px-2 py-1 rounded">
                          📦 {achievement.reward.cardPacks}
                        </span>
                      )}
                      {achievement.reward.dust && (
                        <span className="bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                          ✨ {achievement.reward.dust}
                        </span>
                      )}
                      {achievement.reward.title && (
                        <span className="bg-red-900/50 text-red-300 px-2 py-1 rounded">
                          👑 {achievement.reward.title}
                        </span>
                      )}
                    </div>

                    {/* Unlock Time */}
                    {achievement.unlocked && achievement.unlockedAt && (
                      <div className="mt-2 text-xs text-gray-400">
                        解锁于{" "}
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
