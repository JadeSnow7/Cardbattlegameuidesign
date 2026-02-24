import { useState, useCallback } from "react";
import { GamePhase, CardData, PlayerData, GameAnimation, AnimationPriority, GameCommand } from "../types/game";
import { createCard } from "../data/cardDatabase";
import { AIEngine, AIDifficulty } from "../ai/AIEngine";
import { EffectSystem } from "../systems/EffectSystem";
import { audioSystem, AudioEvent } from "../systems/AudioSystem";

interface GameState {
  phase: GamePhase;
  player: PlayerData & { board: CardData[]; hand: CardData[] };
  enemy: PlayerData & { board: CardData[]; hand: CardData[]; handCount: number };
  isPlayerTurn: boolean;
  turnCount: number;
  animations: GameAnimation[];
  isAnimating: boolean;
  gameMode: "pvp" | "pve";
  aiDifficulty?: AIDifficulty;
}

export function useGameState(mode: "pvp" | "pve" = "pve", aiDifficulty: AIDifficulty = AIDifficulty.Normal) {
  const [aiEngine] = useState(() => new AIEngine(aiDifficulty));
  const [effectSystem] = useState(() => new EffectSystem());

  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.MainPhase,
    gameMode: mode,
    aiDifficulty,
    player: {
      name: "战士玩家",
      avatar: "https://images.unsplash.com/photo-1693921978742-c93c4a3e6172?w=200&h=200&fit=crop",
      health: 28,
      maxHealth: 30,
      armor: 5,
      mana: 7,
      maxMana: 10,
      deck: [],
      board: [
        createCard("holy_knight"),
        createCard("flame_elemental"),
      ],
      hand: [
        createCard("flame_storm"),
        createCard("forest_guardian"),
        createCard("blade_storm"),
        createCard("shield_bearer"),
        createCard("dragon_breath"),
      ],
    },
    enemy: {
      name: "暗影法师",
      avatar: "https://images.unsplash.com/photo-1762968755051-5f0b37d75609?w=200&h=200&fit=crop",
      health: 22,
      maxHealth: 30,
      armor: 0,
      mana: 6,
      maxMana: 10,
      deck: [],
      board: [
        createCard("shadow_assassin"),
        createCard("stone_guardian"),
        createCard("dragon_whelp"),
      ],
      hand: [
        createCard("flame_elemental"),
        createCard("shield_bearer"),
        createCard("dragon_whelp"),
      ],
      handCount: 3,
    },
    isPlayerTurn: true,
    turnCount: 5,
    animations: [],
    isAnimating: false,
  });

  // 添加动画到队列
  const addAnimation = useCallback((animation: Omit<GameAnimation, "id">) => {
    const newAnimation: GameAnimation = {
      ...animation,
      id: `anim_${Date.now()}_${Math.random()}`,
    };

    setGameState((prev) => ({
      ...prev,
      animations: [...prev.animations, newAnimation].sort((a, b) => {
        const priorityOrder = { S: 0, A: 1, B: 2, C: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
    }));
  }, []);

  // 处理动画队列
  const processAnimations = useCallback(() => {
    setGameState((prev) => {
      if (prev.animations.length === 0 || prev.isAnimating) {
        return prev;
      }

      const [currentAnim, ...restAnimations] = prev.animations;
      
      // 设置动画中状态
      setTimeout(() => {
        setGameState((state) => ({
          ...state,
          isAnimating: false,
          animations: restAnimations,
        }));
      }, currentAnim.duration);

      return {
        ...prev,
        isAnimating: true,
      };
    });
  }, []);

  // 出牌
  const playCard = useCallback((cardId: string, slotIndex?: number) => {
    setGameState((prev) => {
      const cardIndex = prev.player.hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return prev;

      const card = prev.player.hand[cardIndex];
      if (card.cost > prev.player.mana) return prev;

      const newHand = prev.player.hand.filter((_, i) => i !== cardIndex);
      let newBoard = [...prev.player.board];
      let newMana = prev.player.mana - card.cost;
      let newEnemyBoard = [...prev.enemy.board];
      let newEnemyHealth = prev.enemy.health;

      // 播放出牌音效
      audioSystem.play(card.type === "spell" ? AudioEvent.SpellCast : AudioEvent.CardPlay);

      if (card.type === "minion") {
        // 添加随从到战场
        if (newBoard.length < 7) {
          const boardCard = { ...card, canAttack: card.keywords?.includes("突袭") };
          if (slotIndex !== undefined && slotIndex <= newBoard.length) {
            newBoard.splice(slotIndex, 0, boardCard);
          } else {
            newBoard.push(boardCard);
          }

          // 触发战吼效果
          if (card.skills) {
            card.skills.forEach((skill) => {
              if (skill.trigger === "OnSummon") {
                const result = effectSystem.executeSkill(skill, boardCard, newEnemyBoard, {
                  playerBoard: newBoard,
                  enemyBoard: newEnemyBoard,
                  playerHP: prev.player.health,
                  enemyHP: newEnemyHealth,
                });

                if (result.success && skill.effect === "DealDamage" && skill.target === "EnemyHero") {
                  newEnemyHealth -= skill.value || 0;
                }

                addAnimation({
                  type: "summon",
                  priority: AnimationPriority.B,
                  sourceId: card.id,
                  duration: 500,
                });
              }
            });
          }
        }
      } else if (card.type === "spell") {
        // 法术卡直接生效
        if (card.skills) {
          card.skills.forEach((skill) => {
            if (skill.effect === "DealDamage" && skill.target === "AllEnemies") {
              newEnemyBoard.forEach((enemyCard) => {
                if (enemyCard.currentHealth) {
                  enemyCard.currentHealth = Math.max(0, enemyCard.currentHealth - (skill.value || 0));
                }
              });
              // 移除死亡单位
              newEnemyBoard = newEnemyBoard.filter((c) => (c.currentHealth || 0) > 0);
            }
          });
        }

        addAnimation({
          type: "spell",
          priority: AnimationPriority.A,
          sourceId: card.id,
          duration: 800,
        });
      }

      return {
        ...prev,
        player: {
          ...prev.player,
          hand: newHand,
          board: newBoard,
          mana: newMana,
        },
        enemy: {
          ...prev.enemy,
          board: newEnemyBoard,
          health: newEnemyHealth,
        },
      };
    });
  }, [addAnimation, effectSystem]);

  // 攻击
  const attack = useCallback((attackerId: string, targetId: string) => {
    setGameState((prev) => {
      const attackerIndex = prev.player.board.findIndex((c) => c.id === attackerId);
      if (attackerIndex === -1) return prev;

      const attacker = prev.player.board[attackerIndex];
      if (!attacker.canAttack) return prev;

      // 播放攻击音效
      audioSystem.play(AudioEvent.Attack);

      // 添加攻击动画
      addAnimation({
        type: "attack",
        priority: AnimationPriority.B,
        sourceId: attackerId,
        targetId: targetId,
        duration: 600,
      });

      // 查找目标
      const targetInEnemyBoard = prev.enemy.board.findIndex((c) => c.id === targetId);
      
      let newPlayerBoard = [...prev.player.board];
      let newEnemyBoard = [...prev.enemy.board];
      let newEnemyHealth = prev.enemy.health;

      if (targetInEnemyBoard !== -1) {
        // 攻击敌方随从
        const target = newEnemyBoard[targetInEnemyBoard];
        const attackerDamage = attacker.attack || 0;
        const targetDamage = target.attack || 0;

        // 处理伤害
        target.currentHealth = (target.currentHealth || 0) - attackerDamage;
        attacker.currentHealth = (attacker.currentHealth || 0) - targetDamage;

        audioSystem.play(AudioEvent.Damage);

        addAnimation({
          type: "damage",
          priority: AnimationPriority.B,
          targetId: targetId,
          value: attackerDamage,
          duration: 400,
        });

        // 移除死亡单位
        if (target.currentHealth <= 0) {
          newEnemyBoard.splice(targetInEnemyBoard, 1);
          audioSystem.play(AudioEvent.Death);
          addAnimation({
            type: "death",
            priority: AnimationPriority.A,
            targetId: targetId,
            duration: 800,
          });
        }

        if (attacker.currentHealth <= 0) {
          newPlayerBoard.splice(attackerIndex, 1);
          audioSystem.play(AudioEvent.Death);
          addAnimation({
            type: "death",
            priority: AnimationPriority.A,
            targetId: attackerId,
            duration: 800,
          });
        } else {
          attacker.canAttack = false;
        }
      } else if (targetId === "enemy_hero") {
        // 攻击敌方英雄
        newEnemyHealth -= attacker.attack || 0;
        attacker.canAttack = false;

        audioSystem.play(AudioEvent.Damage);

        addAnimation({
          type: "damage",
          priority: AnimationPriority.B,
          targetId: "enemy_hero",
          value: attacker.attack || 0,
          duration: 400,
        });
      }

      return {
        ...prev,
        player: {
          ...prev.player,
          board: newPlayerBoard,
        },
        enemy: {
          ...prev.enemy,
          board: newEnemyBoard,
          health: newEnemyHealth,
        },
      };
    });
  }, [addAnimation]);

  // AI回合执行
  const executeAITurn = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameMode !== "pve" || prev.isPlayerTurn) return prev;

      // 生成AI行动
      const commands = aiEngine.generateAction(
        prev.enemy.health,
        prev.enemy.armor,
        prev.enemy.mana,
        prev.enemy.board,
        prev.enemy.hand,
        prev.player.health,
        prev.player.armor,
        prev.player.board
      );

      // 延迟执行AI指令，让玩家看清楚
      let delay = 1000;
      commands.forEach((cmd, index) => {
        setTimeout(() => {
          executeAICommand(cmd);
        }, delay + index * 800);
      });

      return prev;
    });
  }, [aiEngine]);

  // 执行AI指令
  const executeAICommand = useCallback((command: GameCommand) => {
    if (command.type === "PlayCard" && command.cardId) {
      // AI出牌
      setGameState((prev) => {
        const cardIndex = prev.enemy.hand.findIndex((c) => c.id === command.cardId);
        if (cardIndex === -1) return prev;

        const card = prev.enemy.hand[cardIndex];
        if (card.cost > prev.enemy.mana) return prev;

        const newHand = prev.enemy.hand.filter((_, i) => i !== cardIndex);
        let newBoard = [...prev.enemy.board];

        if (card.type === "minion" && newBoard.length < 7) {
          newBoard.push({ ...card, canAttack: card.keywords?.includes("突袭") });
        }

        return {
          ...prev,
          enemy: {
            ...prev.enemy,
            hand: newHand,
            board: newBoard,
            mana: prev.enemy.mana - card.cost,
            handCount: newHand.length,
          },
        };
      });
    } else if (command.type === "Attack" && command.cardId && command.targetId) {
      // AI攻击
      setGameState((prev) => {
        const attackerIndex = prev.enemy.board.findIndex((c) => c.id === command.cardId);
        if (attackerIndex === -1) return prev;

        const attacker = prev.enemy.board[attackerIndex];
        let newEnemyBoard = [...prev.enemy.board];
        let newPlayerBoard = [...prev.player.board];
        let newPlayerHealth = prev.player.health;

        if (command.targetId === "player_hero") {
          newPlayerHealth -= attacker.attack || 0;
          attacker.canAttack = false;
        } else {
          const targetIndex = newPlayerBoard.findIndex((c) => c.id === command.targetId);
          if (targetIndex !== -1) {
            const target = newPlayerBoard[targetIndex];
            target.currentHealth = (target.currentHealth || 0) - (attacker.attack || 0);
            attacker.currentHealth = (attacker.currentHealth || 0) - (target.attack || 0);

            if (target.currentHealth <= 0) {
              newPlayerBoard.splice(targetIndex, 1);
            }
            if (attacker.currentHealth <= 0) {
              newEnemyBoard.splice(attackerIndex, 1);
            } else {
              attacker.canAttack = false;
            }
          }
        }

        return {
          ...prev,
          player: {
            ...prev.player,
            board: newPlayerBoard,
            health: newPlayerHealth,
          },
          enemy: {
            ...prev.enemy,
            board: newEnemyBoard,
          },
        };
      });
    }
  }, []);

  // 回合结束
  const endTurn = useCallback(() => {
    audioSystem.play(AudioEvent.TurnEnd);

    setGameState((prev) => {
      const isNewPlayerTurn = !prev.isPlayerTurn;
      const newTurnCount = isNewPlayerTurn ? prev.turnCount + 1 : prev.turnCount;

      // 刷新随从可攻击状态
      const newPlayerBoard = prev.player.board.map((card) => ({
        ...card,
        canAttack: isNewPlayerTurn,
      }));

      const newEnemyBoard = prev.enemy.board.map((card) => ({
        ...card,
        canAttack: !isNewPlayerTurn,
      }));

      return {
        ...prev,
        phase: GamePhase.TurnEnd,
        isPlayerTurn: isNewPlayerTurn,
        turnCount: newTurnCount,
        player: {
          ...prev.player,
          mana: isNewPlayerTurn ? Math.min(prev.player.maxMana, prev.player.mana + 1) : prev.player.mana,
          board: newPlayerBoard,
        },
        enemy: {
          ...prev.enemy,
          mana: !isNewPlayerTurn ? Math.min(prev.enemy.maxMana, prev.enemy.mana + 1) : prev.enemy.mana,
          board: newEnemyBoard,
        },
      };
    });

    // 切换到下一回合
    setTimeout(() => {
      audioSystem.play(AudioEvent.TurnStart);
      
      setGameState((prev) => {
        const newState = {
          ...prev,
          phase: GamePhase.MainPhase,
        };

        // 如果是AI回合，执行AI
        if (!newState.isPlayerTurn && newState.gameMode === "pve") {
          setTimeout(() => {
            executeAITurn();
          }, 1000);
        }

        return newState;
      });
    }, 1000);
  }, [executeAITurn]);

  // 使用英雄技能
  const useHeroSkill = useCallback((cost: number) => {
    setGameState((prev) => {
      if (prev.player.mana < cost) return prev;

      audioSystem.play(AudioEvent.Heal);

      return {
        ...prev,
        player: {
          ...prev.player,
          armor: prev.player.armor + 2,
          mana: prev.player.mana - cost,
        },
      };
    });
  }, []);

  return {
    gameState,
    playCard,
    attack,
    endTurn,
    useHeroSkill,
    addAnimation,
    processAnimations,
  };
}