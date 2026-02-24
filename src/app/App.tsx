import { useState, useCallback, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, Trophy, Award, Package, Swords } from "lucide-react";
import { PlayerInfo } from "./components/PlayerInfo";
import { BattleBoard } from "./components/BattleBoard";
import { HandCards } from "./components/HandCards";
import { ActionBar } from "./components/ActionBar";
import { AttackLine } from "./components/AttackLine";
import { DamageNumber } from "./components/DamageNumber";
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
  const playerId = "player1";

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
          const fromX = 200 + attackerIndex * 140;
          const fromY = 600;
          const toX = 200 + targetIndex * 140;
          const toY = 300;

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
        const fromX = 200 + attackerIndex * 140;
        const fromY = 600;
        const toX = 100;
        const toY = 100;

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
  }, [attackingCardId, gameState, attack, canAttackTarget]);

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
        <div className="absolute inset-0 opacity-20">
          <img
            src={getImageUrl(ImageAssetKey.BG_Battle, { w: 1920, h: 1080 })}
            alt="battlefield"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

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
                  className={`text-7xl font-bold mb-4 ${
                    gameState.winner === "player"
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

        {/* Main Game Container */}
        <div className="relative z-10 flex flex-col h-screen">
          {/* Top Section - Enemy Info */}
          <div className="p-4">
            <div onClick={handleEnemyHeroClick} className={attackingCardId ? "cursor-crosshair" : ""}>
              <PlayerInfo
                name={gameState.enemy.name}
                avatar={gameState.enemy.avatar}
                health={gameState.enemy.health}
                maxHealth={gameState.enemy.maxHealth}
                armor={gameState.enemy.armor}
                mana={gameState.enemy.mana}
                maxMana={gameState.enemy.maxMana}
                handCount={gameState.enemy.handCount}
                deckCount={gameState.enemy.deck.length}
                isEnemy={true}
              />
            </div>
          </div>

          {/* Middle Section - Battle Board */}
          <div className="flex-1 overflow-auto">
            <BattleBoard
              enemyCards={gameState.enemy.board}
              playerCards={gameState.player.board}
              selectedCard={selectedCard}
              onCardSelect={handleBoardCardClick}
              onCardDrop={handleCardDrop}
              attackingCardId={attackingCardId}
            />
          </div>

          {/* Bottom Section - Player Info */}
          <div className="p-4 pt-0">
            <PlayerInfo
              name={gameState.player.name}
              avatar={gameState.player.avatar}
              health={gameState.player.health}
              maxHealth={gameState.player.maxHealth}
              armor={gameState.player.armor}
              mana={gameState.player.mana}
              maxMana={gameState.player.maxMana}
              handCount={gameState.player.hand.length}
              deckCount={gameState.player.deck.length}
            />
          </div>

          {/* Hand Cards */}
          <HandCards
            cards={gameState.player.hand}
            currentMana={gameState.player.mana}
            selectedCard={selectedCard}
            onCardSelect={handleCardSelect}
          />

          {/* Action Bar */}
          <ActionBar
            onEndTurn={handleEndTurn}
            onSurrender={handleSurrender}
            onSettings={handleSettings}
            isPlayerTurn={gameState.isPlayerTurn}
            heroSkillCost={HERO_SKILL_COST}
            currentMana={gameState.player.mana}
            onHeroSkill={handleHeroSkill}
          />
        </div>

        {/* Turn Indicator */}
        {!showStartScreen && !isGameStartScreen && !isGameEnd && (
          <AnimatePresence mode="wait">
            <motion.div
              key={gameState.turnCount}
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="bg-gradient-to-br from-yellow-500 to-orange-600 px-8 py-4 rounded-2xl border-4 border-yellow-400 shadow-2xl shadow-yellow-500/50">
                <div className="text-white text-center">
                  <div className="text-sm font-semibold opacity-80">
                    {gameState.isPlayerTurn ? "你的回合" : "敌方回合"}
                  </div>
                  <div className="text-4xl font-bold">{gameState.turnCount}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Attacking Indicator */}
        {attackingCardId && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl border-2 border-green-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse" />
              <span className="font-bold">选择攻击目标</span>
            </div>
          </motion.div>
        )}

        {/* Top Right Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
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

        {/* Top Left Brand */}
        <div className="absolute top-4 left-4">
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

        {/* Left Side Quick Access */}
        <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-2">
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

        {/* Menu Overlay */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center"
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
