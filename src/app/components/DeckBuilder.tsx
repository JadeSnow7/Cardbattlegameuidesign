import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Filter,
  Save,
  Upload,
  Download,
  X,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { CardData } from "../types/game";
import { CARD_DATABASE } from "../data/cardDatabase";
import { Card } from "./Card";

interface DeckData {
  name: string;
  cards: string[]; // Card IDs
}

interface DeckBuilderProps {
  onClose: () => void;
  onSaveDeck: (deck: DeckData) => void;
  initialDeck?: DeckData;
}

export function DeckBuilder({ onClose, onSaveDeck, initialDeck }: DeckBuilderProps) {
  const [deckName, setDeckName] = useState(initialDeck?.name || "新卡组");
  const [selectedCards, setSelectedCards] = useState<string[]>(initialDeck?.cards || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [costFilter, setCostFilter] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "minion" | "spell">("all");
  const [rarityFilter, setRarityFilter] = useState<"all" | "common" | "rare" | "epic">("all");

  // 获取所有卡牌
  const allCards = useMemo(() => {
    return Object.values(CARD_DATABASE);
  }, []);

  // 筛选卡牌
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      // 搜索过滤
      if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 费用过滤
      if (costFilter !== null && card.cost !== costFilter) {
        return false;
      }

      // 类型过滤
      if (typeFilter !== "all" && card.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [allCards, searchQuery, costFilter, typeFilter]);

  // 卡组统计
  const deckStats = useMemo(() => {
    const totalCards = selectedCards.length;
    const manaCurve: Record<number, number> = {};
    const typeCount = { minion: 0, spell: 0 };

    selectedCards.forEach((instanceId) => {
      const templateId = getTemplateId(instanceId);
      const template = CARD_DATABASE[templateId];
      if (template) {
        const cost = Math.min(template.cost, 7);
        manaCurve[cost] = (manaCurve[cost] || 0) + 1;
        typeCount[template.type]++;
      }
    });

    const avgCost =
      selectedCards.reduce((sum, instanceId) => {
        const templateId = getTemplateId(instanceId);
        const template = CARD_DATABASE[templateId];
        return sum + (template?.cost || 0);
      }, 0) / (totalCards || 1);

    return { totalCards, manaCurve, typeCount, avgCost };
  }, [selectedCards]);

  // 添加卡牌到卡组
  const addCard = (cardId: string) => {
    // 最多30张卡，每张卡最多2张
    const cardCount = selectedCards.filter((id) => id.startsWith(cardId + "::")).length;
    if (selectedCards.length < 30 && cardCount < 2) {
      setSelectedCards([...selectedCards, `${cardId}::${Date.now()}`]);
    }
  };

  // 从卡组移除卡牌
  const removeCard = (instanceId: string) => {
    setSelectedCards(selectedCards.filter((id) => id !== instanceId));
  };

  // 提取模板ID
  const getTemplateId = (instanceId: string): string => {
    return instanceId.split("::")[0];
  };

  // 保存卡组
  const handleSave = () => {
    if (selectedCards.length >= 10) {
      onSaveDeck({ name: deckName, cards: selectedCards.map(getTemplateId) });
      onClose();
    }
  };

  // 导出卡组
  const exportDeck = () => {
    const deckData = JSON.stringify({ name: deckName, cards: selectedCards }, null, 2);
    const blob = new Blob([deckData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deckName}.json`;
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-7xl h-[90vh] overflow-hidden border-2 border-yellow-600/50 shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 p-6 border-b border-yellow-600/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sparkles className="w-8 h-8 text-yellow-400" />
              <div>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="text-2xl font-bold text-white bg-transparent border-b-2 border-transparent hover:border-yellow-400 focus:border-yellow-400 outline-none transition-colors"
                />
                <div className="text-sm text-gray-300 mt-1">
                  {deckStats.totalCards}/30 张卡牌 · 平均费用: {deckStats.avgCost.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportDeck}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                <Download className="w-4 h-4" />
                导出
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={deckStats.totalCards < 10}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-bold ${
                  deckStats.totalCards >= 10
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-600 cursor-not-allowed"
                }`}
              >
                <Save className="w-4 h-4" />
                保存卡组
              </motion.button>
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

        <div className="flex h-[calc(100%-120px)]">
          {/* Left Panel - Card Collection */}
          <div className="flex-1 p-6 overflow-auto">
            {/* Filters */}
            <div className="mb-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索卡牌..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 outline-none"
                />
              </div>

              {/* Cost Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCostFilter(null)}
                  className={`px-3 py-1 rounded ${
                    costFilter === null ? "bg-yellow-600" : "bg-gray-700 hover:bg-gray-600"
                  } text-white text-sm`}
                >
                  全部
                </button>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((cost) => (
                  <button
                    key={cost}
                    onClick={() => setCostFilter(cost)}
                    className={`px-3 py-1 rounded ${
                      costFilter === cost ? "bg-yellow-600" : "bg-gray-700 hover:bg-gray-600"
                    } text-white text-sm`}
                  >
                    {cost === 7 ? "7+" : cost}
                  </button>
                ))}
              </div>

              {/* Type Filter */}
              <div className="flex gap-2">
                {(["all", "minion", "spell"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-4 py-2 rounded ${
                      typeFilter === type ? "bg-yellow-600" : "bg-gray-700 hover:bg-gray-600"
                    } text-white text-sm capitalize`}
                  >
                    {type === "all" ? "全部" : type === "minion" ? "随从" : "法术"}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-4 gap-4">
              {filteredCards.map((card) => {
                const cardCount = selectedCards.filter((id) => getTemplateId(id) === card.id).length;
                return (
                  <motion.div
                    key={card.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => addCard(card.id)}
                    className="relative cursor-pointer"
                  >
                    <div className="w-full">
                      <Card {...card} />
                    </div>
                    {cardCount > 0 && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold border-2 border-white">
                        {cardCount}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Current Deck */}
          <div className="w-96 bg-gray-900/50 border-l border-gray-700 p-6 overflow-auto">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              法力曲线
            </h3>

            {/* Mana Curve Chart */}
            <div className="mb-6 bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-end justify-between h-32 gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((cost) => {
                  const count = deckStats.manaCurve[cost] || 0;
                  const maxCount = Math.max(...Object.values(deckStats.manaCurve), 1);
                  const height = (count / maxCount) * 100;

                  return (
                    <div key={cost} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        className="w-full bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t"
                      />
                      <div className="text-xs text-gray-400">{cost}</div>
                      <div className="text-xs text-white font-bold">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deck List */}
            <h3 className="text-xl font-bold text-white mb-4">卡组列表</h3>
            <div className="space-y-2">
              {selectedCards.map((instanceId) => {
                const templateId = getTemplateId(instanceId);
                const template = CARD_DATABASE[templateId];
                if (!template) return null;

                return (
                  <motion.div
                    key={instanceId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {template.cost}
                      </div>
                      <div>
                        <div className="text-white text-sm font-semibold">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">
                          {template.type === "minion" ? "随从" : "法术"}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeCard(instanceId)}
                      className="p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
