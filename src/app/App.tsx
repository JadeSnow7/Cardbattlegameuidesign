import { useState, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, Trophy, Award, Package } from "lucide-react";
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
import { ParticleEffect, ParticleType } from "./systems/ParticleSystem";
import { useGameState } from "./hooks/useGameState";
import { AIDifficulty } from "./ai/AIEngine";
import { audioSystem } from "./systems/AudioSystem";
import { achievementSystem } from "./systems/AchievementSystem";
import { rankingSystem } from "./systems/RankingSystem";

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

export default function App() {
  const { gameState, playCard, attack, endTurn, useHeroSkill } = useGameState("pve", AIDifficulty.Normal);
  
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
  const [isMuted, setIsMuted] = useState(false);
  const playerId = "player1"; // 实际项目中应从登录系统获取

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
      // 如果有攻击者，且点击的是敌方单位，执行攻击
      if (attackingCardId && isEnemy) {
        // 获取攻击者和目标的位置（简化版，实际应该获取真实DOM位置）
        const attackerIndex = gameState.player.board.findIndex((c) => c.id === attackingCardId);
        const targetIndex = gameState.enemy.board.findIndex((c) => c.id === id);

        if (attackerIndex !== -1 && targetIndex !== -1) {
          const fromX = 200 + attackerIndex * 140; // 简化计算
          const fromY = 600;
          const toX = 200 + targetIndex * 140;
          const toY = 300;

          // 添加攻击动画
          const animId = `attack_${Date.now()}`;
          setAttackAnimations((prev) => [
            ...prev,
            { id: animId, fromX, fromY, toX, toY },
          ]);

          // 延迟执行攻击逻辑
          setTimeout(() => {
            attack(attackingCardId, id);
            
            // 添加伤害数字
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

            // 移除攻击动画
            setTimeout(() => {
              setAttackAnimations((prev) => prev.filter((a) => a.id !== animId));
            }, 600);
          }, 300);

          setAttackingCardId(null);
        }
      } else if (!isEnemy) {
        // 点击己方单位，选择为攻击者
        const card = gameState.player.board.find((c) => c.id === id);
        if (card?.canAttack) {
          setAttackingCardId(id);
        }
      }
    },
    [attackingCardId, gameState, attack]
  );

  // 处理英雄头像点击（攻击英雄）
  const handleEnemyHeroClick = useCallback(() => {
    if (attackingCardId) {
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
  }, [attackingCardId, gameState, attack]);

  const handleEndTurn = () => {
    setAttackingCardId(null);
    setSelectedCard(null);
    endTurn();
  };

  const handleSurrender = () => {
    if (confirm("确定要投降吗？")) {
      // 记录失败
      rankingSystem.updateMatchResult(playerId, "ai", false);
      alert("你选择了投降!");
    }
  };

  // 游戏胜利
  const handleVictory = () => {
    // 更新排名
    const result = rankingSystem.updateMatchResult(playerId, "ai", true);
    
    // 触发成就
    achievementSystem.triggerEvent(playerId, "win_count", 1);
    
    alert(`胜利！MMR +${result.mmrChange}`);
  };

  // 游戏失败
  const handleDefeat = () => {
    // 更新排名
    const result = rankingSystem.updateMatchResult(playerId, "ai", false);
    
    alert(`失败！MMR ${result.mmrChange}`);
  };

  const handleSettings = () => {
    setShowMenu(!showMenu);
  };

  const handleHeroSkill = () => {
    useHeroSkill(2);
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-[#1E1E2F] relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1727295849299-033e0a563261?w=1920&h=1080&fit=crop"
            alt="battlefield"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

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
            heroSkillCost={2}
            currentMana={gameState.player.mana}
            onHeroSkill={handleHeroSkill}
          />
        </div>

        {/* Turn Indicator */}
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
                    📚 卡组构建
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
                    onClick={() => window.location.reload()}
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
              onClose={() => setShowDeckBuilder(false)}
              onSaveDeck={(deck) => {
                console.log("Saved deck:", deck);
                setShowDeckBuilder(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* Ranking Panel */}
        <AnimatePresence>
          {showRanking && (
            <RankingPanel
              onClose={() => setShowRanking(false)}
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
              onClose={() => setShowCollection(false)}
              playerId={playerId}
            />
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
}