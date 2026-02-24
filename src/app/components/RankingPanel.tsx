import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Medal, Award, TrendingUp, X } from "lucide-react";
import { rankingSystem, RankTier, PlayerRanking } from "../systems/RankingSystem";

interface RankingPanelProps {
  onClose: () => void;
  playerId: string;
}

// 段位图标映射
const TIER_ICONS: Record<RankTier, string> = {
  [RankTier.Bronze]: "🥉",
  [RankTier.Silver]: "🥈",
  [RankTier.Gold]: "🥇",
  [RankTier.Platinum]: "💎",
  [RankTier.Diamond]: "💠",
  [RankTier.Master]: "👑",
  [RankTier.Legend]: "🌟",
};

// 段位颜色
const TIER_COLORS: Record<RankTier, string> = {
  [RankTier.Bronze]: "from-orange-800 to-orange-600",
  [RankTier.Silver]: "from-gray-400 to-gray-300",
  [RankTier.Gold]: "from-yellow-500 to-yellow-400",
  [RankTier.Platinum]: "from-cyan-500 to-cyan-400",
  [RankTier.Diamond]: "from-blue-500 to-blue-400",
  [RankTier.Master]: "from-purple-600 to-purple-500",
  [RankTier.Legend]: "from-red-600 to-orange-500",
};

export function RankingPanel({ onClose, playerId }: RankingPanelProps) {
  const [activeTab, setActiveTab] = useState<"my_rank" | "leaderboard">("my_rank");
  const [playerRanking] = useState<PlayerRanking | null>(
    rankingSystem.getPlayerRanking(playerId) || rankingSystem.initializePlayer(playerId, "玩家")
  );
  const [leaderboard] = useState<PlayerRanking[]>(rankingSystem.getLeaderboard(100));

  if (!playerRanking) return null;

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
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 border-yellow-600/50 shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 p-6 border-b border-yellow-600/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">排行榜</h2>
                <p className="text-sm text-gray-300">赛季 {playerRanking.seasonId}</p>
              </div>
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

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("my_rank")}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === "my_rank"
                ? "bg-yellow-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            我的排名
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === "leaderboard"
                ? "bg-yellow-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            全球排行榜
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            {activeTab === "my_rank" ? (
              <motion.div
                key="my_rank"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Player Rank Card */}
                <div
                  className={`bg-gradient-to-r ${
                    TIER_COLORS[playerRanking.tier]
                  } p-1 rounded-2xl`}
                >
                  <div className="bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="text-6xl">{TIER_ICONS[playerRanking.tier]}</div>
                        <div>
                          <h3 className="text-3xl font-bold text-white">
                            {playerRanking.tier} {playerRanking.division}
                          </h3>
                          <p className="text-gray-400">{playerRanking.playerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-yellow-400">
                          {playerRanking.mmr}
                        </div>
                        <p className="text-gray-400 text-sm">MMR</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>下一段位进度</span>
                        <span>75%</span>
                      </div>
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "75%" }}
                          transition={{ duration: 1 }}
                          className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {playerRanking.winCount}
                        </div>
                        <div className="text-xs text-gray-400">胜利</div>
                      </div>
                      <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-400">
                          {playerRanking.lossCount}
                        </div>
                        <div className="text-xs text-gray-400">失败</div>
                      </div>
                      <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {(playerRanking.winRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">胜率</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Season Info */}
                <div className="bg-gray-800/50 p-6 rounded-xl">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                    赛季信息
                  </h4>
                  <div className="space-y-3 text-gray-300">
                    <div className="flex justify-between">
                      <span>赛季排名</span>
                      <span className="font-bold text-yellow-400">
                        #{playerRanking.seasonRank || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>总场次</span>
                      <span className="font-bold">{playerRanking.matchCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>最后对战</span>
                      <span className="font-bold">
                        {new Date(playerRanking.lastMatchTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="space-y-2">
                  {leaderboard.slice(0, 50).map((player, index) => (
                    <motion.div
                      key={player.playerId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex items-center gap-4 p-4 rounded-xl ${
                        player.playerId === playerId
                          ? "bg-yellow-600/20 border-2 border-yellow-600"
                          : "bg-gray-800/50 hover:bg-gray-800 transition-colors"
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-12 text-center">
                        {index < 3 ? (
                          <div className="text-3xl">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                          </div>
                        ) : (
                          <div className="text-xl font-bold text-gray-400">
                            #{index + 1}
                          </div>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1">
                        <div className="font-bold text-white">{player.playerName}</div>
                        <div className="text-sm text-gray-400">
                          {player.tier} {player.division}
                        </div>
                      </div>

                      {/* MMR */}
                      <div className="text-right">
                        <div className="text-xl font-bold text-yellow-400">
                          {player.mmr}
                        </div>
                        <div className="text-xs text-gray-400">
                          {player.winCount}W / {player.lossCount}L
                        </div>
                      </div>

                      {/* Tier Icon */}
                      <div className="text-3xl">{TIER_ICONS[player.tier]}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
