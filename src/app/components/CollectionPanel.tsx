import { motion, AnimatePresence } from "motion/react";
import { Trophy, Package, Sparkles, X } from "lucide-react";
import { collectionSystem, CardPack, CardRarity } from "../systems/CollectionSystem";
import { useState } from "react";

interface CollectionPanelProps {
  onClose: () => void;
  playerId: string;
}

// 稀有度颜色
const RARITY_COLORS: Record<CardRarity, string> = {
  [CardRarity.Common]: "from-gray-500 to-gray-400",
  [CardRarity.Rare]: "from-blue-500 to-blue-400",
  [CardRarity.Epic]: "from-purple-600 to-purple-500",
  [CardRarity.Legendary]: "from-orange-600 to-yellow-500",
};

export function CollectionPanel({ onClose, playerId }: CollectionPanelProps) {
  const [collection] = useState(() => collectionSystem.getPlayerCollection(playerId));
  const [availablePacks] = useState(() => collectionSystem.getAvailablePacks());
  const [openingPack, setOpeningPack] = useState(false);
  const [drawnCards, setDrawnCards] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"packs" | "collection">("packs");

  const completion = collectionSystem.getCollectionCompletion(playerId);
  const rarityStats = collectionSystem.getCollectionByRarity(playerId);

  const handleOpenPack = (packId: string) => {
    try {
      setOpeningPack(true);
      const cards = collectionSystem.openPack(playerId, packId);
      setDrawnCards(cards);

      setTimeout(() => {
        setOpeningPack(false);
      }, 3000);
    } catch (error) {
      alert("金币不足！");
      setOpeningPack(false);
    }
  };

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
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border-2 border-purple-600/50 shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-6 border-b border-purple-600/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Package className="w-8 h-8 text-purple-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">卡牌收藏</h2>
                <p className="text-sm text-gray-300">
                  收藏进度: {completion.owned}/{completion.total} (
                  {completion.percentage.toFixed(1)}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">{collection.gold}</div>
                <div className="text-xs text-gray-400">金币</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-400">{collection.dust}</div>
                <div className="text-xs text-gray-400">奥术之尘</div>
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
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("packs")}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === "packs"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            卡包商店
          </button>
          <button
            onClick={() => setActiveTab("collection")}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === "collection"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            我的收藏
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-220px)]">
          <AnimatePresence mode="wait">
            {activeTab === "packs" ? (
              <motion.div
                key="packs"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-2 gap-6"
              >
                {availablePacks.map((pack) => (
                  <motion.div
                    key={pack.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 border-purple-600/30 hover:border-purple-600/60 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{pack.name}</h3>
                        <p className="text-sm text-gray-400">{pack.description}</p>
                      </div>
                      <div className="text-4xl">📦</div>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm text-gray-400 mb-2">包含:</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">普通</span>
                          <span className="text-white">
                            {(pack.rarityDistribution[CardRarity.Common] * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-400">稀有</span>
                          <span className="text-white">
                            {(pack.rarityDistribution[CardRarity.Rare] * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-400">史诗</span>
                          <span className="text-white">
                            {(pack.rarityDistribution[CardRarity.Epic] * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-orange-400">传说</span>
                          <span className="text-white">
                            {(pack.rarityDistribution[CardRarity.Legendary] * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenPack(pack.id)}
                      disabled={collection.gold < pack.price}
                      className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${
                        collection.gold >= pack.price
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : "bg-gray-700 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <Sparkles className="w-5 h-5" />
                      购买 ({pack.price} 金币)
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="collection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Rarity Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {Object.entries(rarityStats).map(([rarity, stats]) => (
                    <div
                      key={rarity}
                      className="bg-gray-800/50 p-4 rounded-xl text-center"
                    >
                      <div
                        className={`text-2xl font-bold bg-gradient-to-r ${
                          RARITY_COLORS[rarity as CardRarity]
                        } bg-clip-text text-transparent`}
                      >
                        {stats.owned}/{stats.total}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">{rarity}</div>
                      <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${
                            RARITY_COLORS[rarity as CardRarity]
                          }`}
                          style={{ width: `${(stats.owned / stats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Collection Info */}
                <div className="bg-gray-800/50 p-6 rounded-xl">
                  <h4 className="text-lg font-bold text-white mb-4">收藏统计</h4>
                  <div className="space-y-3 text-gray-300">
                    <div className="flex justify-between">
                      <span>总卡牌数</span>
                      <span className="font-bold">{collection.totalCardsOpened}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>独特卡牌</span>
                      <span className="font-bold">{collection.uniqueCardsOwned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>收藏完成度</span>
                      <span className="font-bold text-purple-400">
                        {completion.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pack Opening Animation */}
        <AnimatePresence>
          {openingPack && drawnCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring" }}
                className="text-center"
              >
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-3xl font-bold text-white mb-6">开包中...</h3>
                <div className="flex gap-4">
                  {drawnCards.map((cardId, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className="w-32 h-48 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold"
                    >
                      {cardId}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
