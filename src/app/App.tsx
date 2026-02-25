import { useState, useCallback, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, Trophy, Award, Package } from "lucide-react";
import { DeckBuilder } from "./components/DeckBuilder";
import { RankingPanel } from "./components/RankingPanel";
import { AchievementPanel } from "./components/AchievementPanel";
import { CollectionPanel } from "./components/CollectionPanel";
import { CardDuelLogoCompact } from "./components/CardDuelLogo";
import { StartScreen } from "./components/StartScreen";
import { ParticleEffect, ParticleType } from "./systems/ParticleSystem";
import { useGameState } from "./hooks/useGameState";
import { GamePhase } from "./types/game";
import { AIDifficulty } from "./ai/AIEngine";
import { audioSystem } from "./systems/AudioSystem";
import { achievementSystem } from "./systems/AchievementSystem";
import { rankingSystem } from "./systems/RankingSystem";
import { HERO_SKILL_COST } from "./constants";
import { ImageAssetKey, getImageUrl } from "./resources/imageManifest";
import { usePlatform } from "./hooks/usePlatform";
import { GameLayoutDesktop, GameLayoutHandlers } from "./components/GameLayoutDesktop";
import { GameLayoutMobile } from "./components/GameLayoutMobile";
import { AttackLine } from "./components/AttackLine";
import { DamageNumber } from "./components/DamageNumber";

interface AttackAnimation {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

interface DamageAnimation {
  id: string;
  damage: number;
  type: "damage" | "heal" | "shield";
  x: number;
  y: number;
}

interface SavedDeck {
  name: string;
  cards: string[];
}

interface TurnNoticePayload {
  turnCount: number;
  isPlayerTurn: boolean;
}

export default function App() {
  const { gameState, playCard, attack, endTurn, useHeroSkill, startGame, restartGame, canAttackTarget } =
    useGameState("pve", AIDifficulty.Normal);

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [attackingCardId, setAttackingCardId] = useState<string | null>(null);
  const [attackAnimations, setAttackAnimations] = useState<AttackAnimation[]>([]);
  const [damageAnimations, setDamageAnimations] = useState<DamageAnimation[]>([]);
  const [particleEffects, setParticleEffects] = useState<Array<{ id: string; type: ParticleType; x: number; y: number }>>([]);
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [gameEndHandled, setGameEndHandled] = useState(false);
  const [turnNoticeVisible, setTurnNoticeVisible] = useState(false);
  const [turnNoticePayload, setTurnNoticePayload] = useState<TurnNoticePayload | null>(null);
  const lastTurnNoticeKeyRef = useRef("");
  const playerId = "player1";

  const { isDesktop } = usePlatform();

  // 处理游戏结束（胜利/失败触发排名和成就）
  useEffect(() => {
    if (gameState.phase === GamePhase.GameEnd && !gameEndHandled) {
      setGameEndHandled(true);
      setAttackingCardId(null);
      setSelectedCard(null);

      if (gameState.winner === "player") {
        rankingSystem.updateMatchResult(playerId, "ai", true);
        achievementSystem.triggerEvent(playerId, "win_count", 1);
      } else if (gameState.winner === "enemy") {
        rankingSystem.updateMatchResult(playerId, "ai", false);
      }
    }
  }, [gameState.phase, gameState.winner, gameEndHandled]);

  // 处理卡牌拖拽出牌
  const handleCardDrop = useCallback(
    (cardId: string, slotIndex: number) => {
      playCard(cardId, slotIndex);
      setSelectedCard(null);
    },
    [playCard]
  );

  // 处理卡牌选择
  const handleCardSelect = useCallback((id: string) => {
    setSelectedCard((prev) => (prev === id ? null : id));
  }, []);

  // 辅助函数：根据选择器获取屏幕中心坐标
  const getElementCenter = (elementId: string | null): { x: number; y: number } | null => {
    if (!elementId) return null;
    const el = document.querySelector(`[data-card-id="${elementId}"]`) ||
      document.querySelector(`[data-slot-index="${elementId}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    return null;
  };

  // 处理战场卡牌点击
  const handleBoardCardClick = useCallback(
    (id: string, isEnemy: boolean) => {
      if (attackingCardId && isEnemy) {
        // 验证攻击合法性
        if (!canAttackTarget(attackingCardId, id)) {
          setAttackingCardId(null);
          return;
        }

        const attackerIndex = gameState.player.board.findIndex((c) => c.id === attackingCardId);
        const targetIndex = gameState.enemy.board.findIndex((c) => c.id === id);

        if (attackerIndex !== -1 && targetIndex !== -1) {
          // 动态获取坐标，如果找不到 DOM 则 fallback 到底部/中部估算值
          const fromPos = getElementCenter(attackingCardId) || { x: window.innerWidth / 2, y: window.innerHeight - 200 };
          const toPos = getElementCenter(id) || { x: window.innerWidth / 2, y: 300 };

          const fromX = fromPos.x;
          const fromY = fromPos.y;
          const toX = toPos.x;
          const toY = toPos.y;

          const animId = `attack_${Date.now()}`;
          setAttackAnimations((prev) => [
            ...prev,
            { id: animId, fromX, fromY, toX, toY },
          ]);

          setTimeout(() => {
            attack(attackingCardId, id);

            const attacker = gameState.player.board.find((c) => c.id === attackingCardId);
            if (attacker?.attack) {
              setDamageAnimations((prev) => [
                ...prev,
                {
                  id: `damage_${Date.now()}`,
                  damage: attacker.attack || 0,
                  type: "damage",
                  x: toX,
                  y: toY,
                },
              ]);
            }

            setTimeout(() => {
              setAttackAnimations((prev) => prev.filter((a) => a.id !== animId));
            }, 600);
          }, 300);

          setAttackingCardId(null);
        }
      } else if (!isEnemy) {
        const card = gameState.player.board.find((c) => c.id === id);
        if (card?.canAttack) {
          setAttackingCardId(id);
        }
      }
    },
    [attackingCardId, gameState, attack, canAttackTarget]
  );

  // 处理英雄头像点击（攻击英雄）
  const handleEnemyHeroClick = useCallback(() => {
    if (attackingCardId) {
      // 验证攻击合法性
      if (!canAttackTarget(attackingCardId, "enemy_hero")) {
        setAttackingCardId(null);
        return;
      }

      const attackerIndex = gameState.player.board.findIndex((c) => c.id === attackingCardId);
      if (attackerIndex !== -1) {
        // 动态获取攻击者坐标，英雄坐标固定在左上角附近（由于在不同的 PlayerInfo 变体里，粗略指向一个较合理的位置）
        const fromPos = getElementCenter(attackingCardId) || { x: window.innerWidth / 2, y: window.innerHeight - 200 };
        const fromX = fromPos.x;
        const fromY = fromPos.y;

        // 英雄头像通常在左上角，可以简单使用固定位置，或动态查找
        const toX = isDesktop ? 100 : window.innerWidth / 2;
        const toY = isDesktop ? 100 : 80;

        const animId = `attack_${Date.now()}`;
        setAttackAnimations((prev) => [
          ...prev,
          { id: animId, fromX, fromY, toX, toY },
        ]);

        setTimeout(() => {
          attack(attackingCardId, "enemy_hero");

          const attacker = gameState.player.board.find((c) => c.id === attackingCardId);
          if (attacker?.attack) {
            setDamageAnimations((prev) => [
              ...prev,
              {
                id: `damage_${Date.now()}`,
                damage: attacker.attack,
                type: "damage",
                x: toX,
                y: toY,
              },
            ]);
          }

          setTimeout(() => {
            setAttackAnimations((prev) => prev.filter((a) => a.id !== animId));
          }, 600);
        }, 300);

        setAttackingCardId(null);
      }
    }
  }, [attackingCardId, gameState, attack, canAttackTarget, isDesktop]);

  const handleEndTurn = () => {
    setAttackingCardId(null);
    setSelectedCard(null);
    endTurn();
  };

  const handleSurrender = () => {
    if (confirm("确定要投降吗？")) {
      rankingSystem.updateMatchResult(playerId, "ai", false);
      restartGame();
      setShowStartScreen(true);
      setGameEndHandled(false);
    }
  };

  const handleSettings = () => {
    setShowMenu(!showMenu);
  };

  const handleHeroSkill = () => {
    useHeroSkill(HERO_SKILL_COST);
  };

  const toggleMute = () => {
    audioSystem.toggleMute();
    setIsMuted(!isMuted);
  };

  const openDeckBuilder = () => {
    setShowMenu(false);
    setShowDeckBuilder(true);
  };

  const openRanking = () => {
    setShowMenu(false);
    setShowRanking(true);
  };

  const openAchievements = () => {
    setShowMenu(false);
    setShowAchievements(true);
  };

  const openCollection = () => {
    setShowMenu(false);
    setShowCollection(true);
  };

  const handleQuickPlay = () => {
    startGame();
    setShowStartScreen(false);
    setGameEndHandled(false);
  };

  const handleStartWithDeck = (deck: SavedDeck) => {
    startGame(deck.cards);
    setShowStartScreen(false);
    setGameEndHandled(false);
  };

  const handleSaveDeck = (deck: SavedDeck) => {
    setSavedDecks((prev) => [...prev, deck]);
    setShowDeckBuilder(false);
  };

  const handleNewGame = () => {
    restartGame();
    setShowStartScreen(true);
    setGameEndHandled(false);
  };

  const isGameStartScreen = gameState.phase === GamePhase.GameStart;
  const isGameEnd = gameState.phase === GamePhase.GameEnd;
  const hasBlockingOverlay =
    showStartScreen ||
    isGameStartScreen ||
    isGameEnd ||
    showMenu ||
    showDeckBuilder ||
    showRanking ||
    showAchievements ||
    showCollection;

  useEffect(() => {
    if (hasBlockingOverlay) {
      setTurnNoticeVisible(false);
      return;
    }

    const turnKey = `${gameState.turnCount}-${gameState.isPlayerTurn ? "player" : "enemy"}`;
    if (lastTurnNoticeKeyRef.current === turnKey) return;

    lastTurnNoticeKeyRef.current = turnKey;
    setTurnNoticePayload({ turnCount: gameState.turnCount, isPlayerTurn: gameState.isPlayerTurn });
    setTurnNoticeVisible(true);

    const timer = window.setTimeout(() => {
      setTurnNoticeVisible(false);
    }, 1150);

    return () => window.clearTimeout(timer);
  }, [gameState.turnCount, gameState.isPlayerTurn, hasBlockingOverlay]);

  const layoutHandlers: GameLayoutHandlers = {
    onCardDrop: handleCardDrop,
    onBoardCardClick: handleBoardCardClick,
    onEnemyHeroClick: handleEnemyHeroClick,
    onEndTurn: handleEndTurn,
    onSurrender: handleSurrender,
    onSettings: handleSettings,
    onHeroSkill: handleHeroSkill,
    onCardSelect: handleCardSelect,
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <AnimatePresence>
        {showStartScreen && (
          <StartScreen
            onStart={handleQuickPlay}
            onShowRanking={() => {
              setShowStartScreen(false);
              setShowRanking(true);
            }}
            onShowCollection={() => {
              setShowStartScreen(false);
              setShowCollection(true);
            }}
          />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#1E1E2F] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 opacity-20 z-0">
          <img
            src={getImageUrl(ImageAssetKey.BG_Battle, { w: 1920, h: 1080 })}
            alt="battlefield"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 z-0" />

        {/* Layout Engine */}
        {isDesktop ? (
          <GameLayoutDesktop
            gameState={gameState}
            handlers={layoutHandlers}
            selectedCard={selectedCard}
            attackingCardId={attackingCardId}
            heroSkillCost={HERO_SKILL_COST}
          />
        ) : (
          <GameLayoutMobile
            gameState={gameState}
            handlers={layoutHandlers}
            selectedCard={selectedCard}
            attackingCardId={attackingCardId}
            heroSkillCost={HERO_SKILL_COST}
          />
        )}

        {/* Global Overlays (Render above layout) */}

        {/* Game End Overlay */}
        <AnimatePresence>
          {isGameEnd && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15 }}
                className="text-center"
              >
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`text-7xl font-bold mb-4 ${gameState.winner === "player"
                    ? "text-yellow-400 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]"
                    : gameState.winner === "enemy"
                      ? "text-red-400 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                      : "text-gray-300"
                    }`}
                >
                  {gameState.winner === "player" ? "胜利!" : gameState.winner === "enemy" ? "失败!" : "平局!"}
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-gray-300 text-lg mb-8"
                >
                  回合 {gameState.turnCount} ·{" "}
                  {gameState.winner === "player"
                    ? "恭喜你取得胜利！"
                    : gameState.winner === "enemy"
                      ? "再接再厉！"
                      : "势均力敌！"}
                </motion.p>

                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="flex gap-4 justify-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNewGame}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-xl text-white font-bold text-lg shadow-lg shadow-yellow-600/30"
                  >
                    再来一局
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNewGame}
                    className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-semibold"
                  >
                    返回主菜单
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Particle Effects */}
        <AnimatePresence>
          {particleEffects.map((effect) => (
            <ParticleEffect
              key={effect.id}
              type={effect.type}
              x={effect.x}
              y={effect.y}
              onComplete={() => {
                setParticleEffects((prev) => prev.filter((e) => e.id !== effect.id));
              }}
            />
          ))}
        </AnimatePresence>

        {/* Attack Animations */}
        <AnimatePresence>
          {attackAnimations.map((anim) => (
            <AttackLine
              key={anim.id}
              fromX={anim.fromX}
              fromY={anim.fromY}
              toX={anim.toX}
              toY={anim.toY}
              onComplete={() => {
                setAttackAnimations((prev) => prev.filter((a) => a.id !== anim.id));
              }}
            />
          ))}
        </AnimatePresence>

        {/* Damage Numbers */}
        <AnimatePresence>
          {damageAnimations.map((dmg) => (
            <DamageNumber
              key={dmg.id}
              damage={dmg.damage}
              type={dmg.type}
              x={dmg.x}
              y={dmg.y}
              onComplete={() => {
                setDamageAnimations((prev) => prev.filter((d) => d.id !== dmg.id));
              }}
            />
          ))}
        </AnimatePresence>

        {/* Turn Indicator */}
        <AnimatePresence mode="wait">
          {turnNoticeVisible && turnNoticePayload && (
            <motion.div
              key={`${turnNoticePayload.turnCount}-${turnNoticePayload.isPlayerTurn ? "player" : "enemy"}`}
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.45 }}
              className="absolute z-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="bg-gradient-to-br from-yellow-500 to-orange-600 px-8 py-4 rounded-2xl border-4 border-yellow-400 shadow-2xl shadow-yellow-500/50">
                <div className="text-white text-center">
                  <div className="text-sm font-semibold opacity-80">
                    {turnNoticePayload.isPlayerTurn ? "你的回合" : "敌方回合"}
                  </div>
                  <div className="text-4xl font-bold">{turnNoticePayload.turnCount}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attacking Indicator */}
        {attackingCardId && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute z-40 bottom-32 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl border-2 border-green-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse" />
              <span className="font-bold">选择攻击目标</span>
            </div>
          </motion.div>
        )}

        {/* Top Right Controls */}
        <div className="absolute z-30 top-4 right-4 flex gap-2">
          {/* AI Difficulty Indicator */}
          <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-500/30">
            <div className="text-white text-sm">
              <div className="opacity-60">AI难度</div>
              <div className="font-bold">{gameState.aiDifficulty}</div>
            </div>
          </div>

          {/* Phase Indicator */}
          <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-500/30">
            <div className="text-white text-sm">
              <div className="opacity-60">阶段</div>
              <div className="font-bold">{gameState.phase}</div>
            </div>
          </div>

          {/* Mute Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            className="bg-black/60 backdrop-blur-sm p-3 rounded-xl border border-gray-500/30 hover:bg-black/80 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </motion.button>
        </div>

        {/* Top Left Brand (Adjusted left-56 to clear sidebar in desktop) */}
        <div className={`absolute z-30 top-4 ${isDesktop ? 'left-60' : 'left-4'}`}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSettings}
            className="bg-black/45 backdrop-blur-sm px-3 py-2 rounded-xl border border-yellow-500/30 hover:border-yellow-400/60 transition-colors"
            title="打开菜单"
          >
            <CardDuelLogoCompact size={36} />
          </motion.button>
        </div>

        {/* Left Side Quick Access (Desktop only, mobile uses menu entries) */}
        {isDesktop && (
          <div className="absolute z-30 top-1/2 -translate-y-1/2 flex flex-col gap-2 left-60">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openRanking}
              className="bg-black/60 backdrop-blur-sm p-3 rounded-xl border border-gray-500/30 hover:bg-yellow-600/20 transition-colors group"
              title="排行榜"
            >
              <Trophy className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openAchievements}
              className="bg-black/60 backdrop-blur-sm p-3 rounded-xl border border-gray-500/30 hover:bg-yellow-600/20 transition-colors group"
              title="成就"
            >
              <Award className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCollection}
              className="bg-black/60 backdrop-blur-sm p-3 rounded-xl border border-gray-500/30 hover:bg-purple-600/20 transition-colors group"
              title="收藏"
            >
              <Package className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            </motion.button>
          </div>
        )}

        {/* Menu Overlay */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
              onClick={() => setShowMenu(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border-2 border-yellow-600/50 shadow-2xl min-w-[400px]"
              >
                <h2 className="text-2xl font-bold text-white mb-6">游戏菜单</h2>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openDeckBuilder}
                    className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    卡组构建
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openRanking}
                    className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-5 h-5" /> 排行榜
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openAchievements}
                    className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Award className="w-5 h-5" /> 成就
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openCollection}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Package className="w-5 h-5" /> 卡牌收藏
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowMenu(false)}
                    className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    继续游戏
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowMenu(false);
                      handleNewGame();
                    }}
                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors"
                  >
                    重新开始
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deck Builder */}
        <AnimatePresence>
          {showDeckBuilder && (
            <DeckBuilder
              onClose={() => {
                setShowDeckBuilder(false);
                if (gameState.phase === GamePhase.GameStart) {
                  setShowStartScreen(true);
                }
              }}
              onSaveDeck={handleSaveDeck}
            />
          )}
        </AnimatePresence>

        {/* Ranking Panel */}
        <AnimatePresence>
          {showRanking && (
            <RankingPanel
              onClose={() => {
                setShowRanking(false);
                if (gameState.phase === GamePhase.GameStart) {
                  setShowStartScreen(true);
                }
              }}
              playerId={playerId}
            />
          )}
        </AnimatePresence>

        {/* Achievement Panel */}
        <AnimatePresence>
          {showAchievements && (
            <AchievementPanel
              onClose={() => setShowAchievements(false)}
              playerId={playerId}
            />
          )}
        </AnimatePresence>

        {/* Collection Panel */}
        <AnimatePresence>
          {showCollection && (
            <CollectionPanel
              onClose={() => {
                setShowCollection(false);
                if (gameState.phase === GamePhase.GameStart) {
                  setShowStartScreen(true);
                }
              }}
              playerId={playerId}
            />
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
}
