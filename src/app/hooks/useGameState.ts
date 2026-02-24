import { useState, useCallback } from "react";
import { GamePhase, CardData, PlayerData, GameAnimation, AnimationPriority, GameCommand } from "../types/game";
import { createCard, getDefaultDeckIds, shuffleDeck } from "../data/cardDatabase";
import { AIEngine, AIDifficulty } from "../ai/AIEngine";
import { EffectSystem } from "../systems/EffectSystem";
import { audioSystem, AudioEvent } from "../systems/AudioSystem";
import {
  MAX_BOARD_SIZE,
  MAX_HAND_SIZE,
  MAX_MANA,
  HERO_INITIAL_HEALTH,
  STARTING_HAND_FIRST,
  STARTING_HAND_SECOND,
  HERO_SKILL_ARMOR,
  AI_ACTION_DELAY_MS,
  AI_TURN_START_DELAY_MS,
  TURN_TRANSITION_DELAY_MS,
} from "../constants";
import {
  checkGameEnd,
  damageHero,
  damageMinion,
  hasTauntMinions,
  isTauntTarget,
  isValidAttackTarget,
  processDeathrattle,
  processTurnEndEffects,
} from "../logic/battleLogic";
import { ImageAssetKey, getImageUrl } from "../resources/imageManifest";

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
  winner?: "player" | "enemy" | "draw";
  fatigue: { player: number; enemy: number };
}

function createInitialState(mode: "pvp" | "pve", aiDifficulty: AIDifficulty): GameState {
  return {
    phase: GamePhase.GameStart,
    gameMode: mode,
    aiDifficulty,
    player: {
      name: "战士玩家",
      avatar: getImageUrl(ImageAssetKey.Avatar_Player, { w: 200, h: 200 }),
      health: HERO_INITIAL_HEALTH,
      maxHealth: HERO_INITIAL_HEALTH,
      armor: 0,
      mana: 0,
      maxMana: 0,
      deck: [],
      board: [],
      hand: [],
    },
    enemy: {
      name: "暗影法师",
      avatar: getImageUrl(ImageAssetKey.Avatar_Enemy, { w: 200, h: 200 }),
      health: HERO_INITIAL_HEALTH,
      maxHealth: HERO_INITIAL_HEALTH,
      armor: 0,
      mana: 0,
      maxMana: 0,
      deck: [],
      board: [],
      hand: [],
      handCount: 0,
    },
    isPlayerTurn: true,
    turnCount: 0,
    animations: [],
    isAnimating: false,
    fatigue: { player: 0, enemy: 0 },
  };
}

export function useGameState(mode: "pvp" | "pve" = "pve", aiDifficulty: AIDifficulty = AIDifficulty.Normal) {
  const [aiEngine] = useState(() => new AIEngine(aiDifficulty));
  const [effectSystem] = useState(() => new EffectSystem());

  const [gameState, setGameState] = useState<GameState>(() => createInitialState(mode, aiDifficulty));

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

  // 开始游戏
  const startGame = useCallback((playerDeckIds?: string[], enemyDeckIds?: string[]) => {
    const pDeckIds = playerDeckIds || getDefaultDeckIds();
    const eDeckIds = enemyDeckIds || getDefaultDeckIds();

    const playerDeck = shuffleDeck(pDeckIds.map((id) => createCard(id)));
    const enemyDeck = shuffleDeck(eDeckIds.map((id) => createCard(id)));

    const playerHand = playerDeck.splice(0, STARTING_HAND_FIRST);
    const enemyHand = enemyDeck.splice(0, STARTING_HAND_SECOND);

    audioSystem.play(AudioEvent.TurnStart);

    setGameState((prev) => ({
      ...prev,
      phase: GamePhase.MainPhase,
      player: {
        ...prev.player,
        health: 30,
        maxHealth: 30,
        armor: 0,
        mana: 1,
        maxMana: 1,
        deck: playerDeck,
        board: [],
        hand: playerHand,
      },
      enemy: {
        ...prev.enemy,
        health: 30,
        maxHealth: 30,
        armor: 0,
        mana: 1,
        maxMana: 1,
        deck: enemyDeck,
        board: [],
        hand: enemyHand,
        handCount: enemyHand.length,
      },
      isPlayerTurn: true,
      turnCount: 1,
      winner: undefined,
      fatigue: { player: 0, enemy: 0 },
    }));
  }, []);

  // 抽牌逻辑
  const drawCardForPlayer = useCallback((isPlayer: boolean) => {
    setGameState((prev) => {
      if (prev.phase === GamePhase.GameEnd) return prev;

      const side = isPlayer ? "player" : "enemy";
      const deck = [...prev[side].deck];
      const hand = [...prev[side].hand];

      if (deck.length === 0) {
        // 疲劳伤害
        const newFatigue = prev.fatigue[side === "player" ? "player" : "enemy"] + 1;
        const heroResult = damageHero(prev[side].health, prev[side].armor, newFatigue);
        const winner = isPlayer
          ? checkGameEnd(heroResult.health, prev.enemy.health)
          : checkGameEnd(prev.player.health, heroResult.health);

        return {
          ...prev,
          [side]: {
            ...prev[side],
            health: heroResult.health,
            armor: heroResult.armor,
            ...(side === "enemy" ? { handCount: hand.length } : {}),
          },
          fatigue: { ...prev.fatigue, [side === "player" ? "player" : "enemy"]: newFatigue },
          ...(winner ? { phase: GamePhase.GameEnd, winner } : {}),
        };
      }

      const drawnCard = deck.shift()!;
      if (hand.length < MAX_HAND_SIZE) {
        hand.push(drawnCard);
      }

      return {
        ...prev,
        [side]: {
          ...prev[side],
          deck,
          hand,
          ...(side === "enemy" ? { handCount: hand.length } : {}),
        },
      };
    });
  }, []);

  // 出牌
  const playCard = useCallback((cardId: string, slotIndex?: number) => {
    setGameState((prev) => {
      if (prev.phase === GamePhase.GameEnd || !prev.isPlayerTurn) return prev;

      const cardIndex = prev.player.hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return prev;

      const card = prev.player.hand[cardIndex];
      if (card.cost > prev.player.mana) return prev;

      const newHand = prev.player.hand.filter((_, i) => i !== cardIndex);
      let newPlayerBoard = [...prev.player.board];
      let newMana = prev.player.mana - card.cost;
      let newEnemyBoard = [...prev.enemy.board];
      let newEnemyHealth = prev.enemy.health;
      let newEnemyArmor = prev.enemy.armor;
      let newPlayerHealth = prev.player.health;

      audioSystem.play(card.type === "spell" ? AudioEvent.SpellCast : AudioEvent.CardPlay);

      if (card.type === "minion") {
        if (newPlayerBoard.length < MAX_BOARD_SIZE) {
          const boardCard: CardData = {
            ...card,
            canAttack: card.keywords?.includes("突袭") || false,
            rushActive: card.keywords?.includes("突袭") || false,
            hasShield: card.keywords?.includes("圣盾") || false,
            isTaunting: card.keywords?.includes("嘲讽") || false,
            isStealth: card.keywords?.includes("潜行") || false,
          };

          if (slotIndex !== undefined && slotIndex <= newPlayerBoard.length) {
            newPlayerBoard.splice(slotIndex, 0, boardCard);
          } else {
            newPlayerBoard.push(boardCard);
          }

          // 触发战吼效果
          if (card.skills) {
            card.skills.forEach((skill) => {
              if (skill.trigger === "OnSummon") {
                const result = effectSystem.executeSkill(skill, boardCard, newEnemyBoard, {
                  playerBoard: newPlayerBoard,
                  enemyBoard: newEnemyBoard,
                  playerHP: newPlayerHealth,
                  enemyHP: newEnemyHealth,
                });

                if (result.success) {
                  if (skill.effect === "DealDamage" && skill.target === "EnemyHero") {
                    const heroResult = damageHero(newEnemyHealth, newEnemyArmor, skill.value || 0);
                    newEnemyHealth = heroResult.health;
                    newEnemyArmor = heroResult.armor;
                  }
                  if (skill.effect === "Heal" && skill.target === "Self") {
                    newPlayerHealth = Math.min(prev.player.maxHealth, newPlayerHealth + (skill.value || 0));
                  }
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
        if (card.skills) {
          card.skills.forEach((skill) => {
            if (skill.effect === "DealDamage") {
              if (skill.target === "AllEnemies") {
                newEnemyBoard = newEnemyBoard.map((enemyCard) => {
                  return damageMinion(enemyCard, skill.value || 0);
                });
                // 处理死亡随从的亡语
                const dying = newEnemyBoard.filter((c) => (c.currentHealth || 0) <= 0);
                newEnemyBoard = newEnemyBoard.filter((c) => (c.currentHealth || 0) > 0);
                for (const dead of dying) {
                  const result = processDeathrattle(dead, newEnemyBoard, effectSystem);
                  newEnemyBoard = result.board;
                }
              } else if (skill.target === "EnemyHero") {
                const heroResult = damageHero(newEnemyHealth, newEnemyArmor, skill.value || 0);
                newEnemyHealth = heroResult.health;
                newEnemyArmor = heroResult.armor;
              } else if (skill.target === "Enemy") {
                // Single target damage - for now, hits a random enemy minion
                if (newEnemyBoard.length > 0) {
                  const idx = Math.floor(Math.random() * newEnemyBoard.length);
                  newEnemyBoard[idx] = damageMinion(newEnemyBoard[idx], skill.value || 0);
                  if ((newEnemyBoard[idx].currentHealth || 0) <= 0) {
                    const dead = newEnemyBoard[idx];
                    newEnemyBoard.splice(idx, 1);
                    const result = processDeathrattle(dead, newEnemyBoard, effectSystem);
                    newEnemyBoard = result.board;
                  }
                } else {
                  // No minions, hit hero
                  const heroResult = damageHero(newEnemyHealth, newEnemyArmor, skill.value || 0);
                  newEnemyHealth = heroResult.health;
                  newEnemyArmor = heroResult.armor;
                }
              }
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

      // 检查胜负
      const winner = checkGameEnd(newPlayerHealth, newEnemyHealth);

      return {
        ...prev,
        player: {
          ...prev.player,
          hand: newHand,
          board: newPlayerBoard,
          mana: newMana,
          health: newPlayerHealth,
        },
        enemy: {
          ...prev.enemy,
          board: newEnemyBoard,
          health: newEnemyHealth,
          armor: newEnemyArmor,
        },
        ...(winner ? { phase: GamePhase.GameEnd, winner } : {}),
      };
    });
  }, [addAnimation, effectSystem]);

  // 攻击
  const attack = useCallback((attackerId: string, targetId: string) => {
    setGameState((prev) => {
      if (prev.phase === GamePhase.GameEnd) return prev;

      const attackerIndex = prev.player.board.findIndex((c) => c.id === attackerId);
      if (attackerIndex === -1) return prev;

      const attacker = { ...prev.player.board[attackerIndex] };
      if (!attacker.canAttack) return prev;

      // 验证攻击目标
      const validation = isValidAttackTarget(attacker, targetId, prev.enemy.board);
      if (!validation.valid) return prev;

      audioSystem.play(AudioEvent.Attack);

      addAnimation({
        type: "attack",
        priority: AnimationPriority.B,
        sourceId: attackerId,
        targetId: targetId,
        duration: 600,
      });

      let newPlayerBoard = prev.player.board.map((c) => ({ ...c }));
      let newEnemyBoard = prev.enemy.board.map((c) => ({ ...c }));
      let newEnemyHealth = prev.enemy.health;
      let newEnemyArmor = prev.enemy.armor;
      let newPlayerHealth = prev.player.health;
      let newPlayerArmor = prev.player.armor;
      const attackerRef = newPlayerBoard[attackerIndex];

      const targetInEnemyBoard = newEnemyBoard.findIndex((c) => c.id === targetId);

      if (targetInEnemyBoard !== -1) {
        // 攻击敌方随从
        const target = newEnemyBoard[targetInEnemyBoard];
        const attackerDamage = attacker.attack || 0;
        const targetDamage = target.attack || 0;

        // 处理圣盾
        const damagedTarget = damageMinion(target, attackerDamage);
        const damagedAttacker = damageMinion(attackerRef, targetDamage);
        newEnemyBoard[targetInEnemyBoard] = damagedTarget;
        newPlayerBoard[attackerIndex] = damagedAttacker;

        // 剧毒检查
        if (attacker.keywords?.includes("剧毒") && attackerDamage > 0 && !damagedTarget.hasShield) {
          newEnemyBoard[targetInEnemyBoard] = { ...newEnemyBoard[targetInEnemyBoard], currentHealth: 0 };
        }
        if (target.keywords?.includes("剧毒") && targetDamage > 0 && !damagedAttacker.hasShield) {
          newPlayerBoard[attackerIndex] = { ...newPlayerBoard[attackerIndex], currentHealth: 0 };
        }

        audioSystem.play(AudioEvent.Damage);

        addAnimation({
          type: "damage",
          priority: AnimationPriority.B,
          targetId: targetId,
          value: attackerDamage,
          duration: 400,
        });

        // 移除死亡单位并触发亡语
        if ((newEnemyBoard[targetInEnemyBoard]?.currentHealth || 0) <= 0) {
          const dead = newEnemyBoard[targetInEnemyBoard];
          newEnemyBoard.splice(targetInEnemyBoard, 1);
          const result = processDeathrattle(dead, newEnemyBoard, effectSystem);
          newEnemyBoard = result.board;
          audioSystem.play(AudioEvent.Death);
          addAnimation({ type: "death", priority: AnimationPriority.A, targetId, duration: 800 });
        }

        // 检查attackerIndex是否还有效（可能因为上面的splice改变了）
        const currentAttackerIndex = newPlayerBoard.findIndex((c) => c.id === attackerId);
        if (currentAttackerIndex !== -1 && (newPlayerBoard[currentAttackerIndex].currentHealth || 0) <= 0) {
          const dead = newPlayerBoard[currentAttackerIndex];
          newPlayerBoard.splice(currentAttackerIndex, 1);
          const result = processDeathrattle(dead, newPlayerBoard, effectSystem);
          newPlayerBoard = result.board;
          audioSystem.play(AudioEvent.Death);
          addAnimation({ type: "death", priority: AnimationPriority.A, targetId: attackerId, duration: 800 });
        } else if (currentAttackerIndex !== -1) {
          newPlayerBoard[currentAttackerIndex] = {
            ...newPlayerBoard[currentAttackerIndex],
            canAttack: false,
            // 攻击后解除潜行
            isStealth: false,
          };
        }
      } else if (targetId === "enemy_hero") {
        // 攻击敌方英雄
        const heroResult = damageHero(newEnemyHealth, newEnemyArmor, attacker.attack || 0);
        newEnemyHealth = heroResult.health;
        newEnemyArmor = heroResult.armor;

        // 攻击者标记已攻击，解除潜行
        newPlayerBoard[attackerIndex] = {
          ...newPlayerBoard[attackerIndex],
          canAttack: false,
          isStealth: false,
        };

        audioSystem.play(AudioEvent.Damage);

        addAnimation({
          type: "damage",
          priority: AnimationPriority.B,
          targetId: "enemy_hero",
          value: attacker.attack || 0,
          duration: 400,
        });
      }

      // 检查胜负
      const winner = checkGameEnd(newPlayerHealth, newEnemyHealth);

      return {
        ...prev,
        player: {
          ...prev.player,
          board: newPlayerBoard,
          health: newPlayerHealth,
          armor: newPlayerArmor,
        },
        enemy: {
          ...prev.enemy,
          board: newEnemyBoard,
          health: newEnemyHealth,
          armor: newEnemyArmor,
        },
        ...(winner ? { phase: GamePhase.GameEnd, winner } : {}),
      };
    });
  }, [addAnimation, effectSystem]);

  // AI回合执行
  const executeAITurn = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameMode !== "pve" || prev.isPlayerTurn || prev.phase === GamePhase.GameEnd) return prev;

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

      let delay = AI_TURN_START_DELAY_MS;
      commands.forEach((cmd, index) => {
        setTimeout(() => {
          executeAICommand(cmd);
        }, delay + index * AI_ACTION_DELAY_MS);
      });

      return prev;
    });
  }, [aiEngine]);

  // 执行AI指令
  const executeAICommand = useCallback((command: GameCommand) => {
    if (command.type === "PlayCard" && command.cardId) {
      setGameState((prev) => {
        if (prev.phase === GamePhase.GameEnd) return prev;

        const cardIndex = prev.enemy.hand.findIndex((c) => c.id === command.cardId);
        if (cardIndex === -1) return prev;

        const card = prev.enemy.hand[cardIndex];
        if (card.cost > prev.enemy.mana) return prev;

        const newHand = prev.enemy.hand.filter((_, i) => i !== cardIndex);
        let newBoard = [...prev.enemy.board];
        let newPlayerHealth = prev.player.health;
        let newPlayerArmor = prev.player.armor;
        let newEnemyHealth = prev.enemy.health;

        if (card.type === "minion" && newBoard.length < MAX_BOARD_SIZE) {
          const boardCard: CardData = {
            ...card,
            canAttack: card.keywords?.includes("突袭") || false,
            rushActive: card.keywords?.includes("突袭") || false,
            hasShield: card.keywords?.includes("圣盾") || false,
            isTaunting: card.keywords?.includes("嘲讽") || false,
            isStealth: card.keywords?.includes("潜行") || false,
          };
          newBoard.push(boardCard);

          // 触发AI战吼
          if (card.skills) {
            card.skills.forEach((skill) => {
              if (skill.trigger === "OnSummon") {
                if (skill.effect === "DealDamage" && skill.target === "EnemyHero") {
                  const heroResult = damageHero(newPlayerHealth, newPlayerArmor, skill.value || 0);
                  newPlayerHealth = heroResult.health;
                  newPlayerArmor = heroResult.armor;
                }
              }
            });
          }
        } else if (card.type === "spell" && card.skills) {
          // AI法术处理
          card.skills.forEach((skill) => {
            if (skill.effect === "DealDamage" && skill.target === "AllEnemies") {
              // 这里"敌方"对AI来说是玩家方
              // 简化：AI的AoE对玩家场面生效
            }
          });
        }

        const winner = checkGameEnd(newPlayerHealth, newEnemyHealth);

        return {
          ...prev,
          player: {
            ...prev.player,
            health: newPlayerHealth,
            armor: newPlayerArmor,
          },
          enemy: {
            ...prev.enemy,
            hand: newHand,
            board: newBoard,
            mana: prev.enemy.mana - card.cost,
            handCount: newHand.length,
            health: newEnemyHealth,
          },
          ...(winner ? { phase: GamePhase.GameEnd, winner } : {}),
        };
      });
    } else if (command.type === "Attack" && command.cardId && command.targetId) {
      setGameState((prev) => {
        if (prev.phase === GamePhase.GameEnd) return prev;

        const attackerIndex = prev.enemy.board.findIndex((c) => c.id === command.cardId);
        if (attackerIndex === -1) return prev;

        const attacker = prev.enemy.board[attackerIndex];

        // AI也需要遵守嘲讽规则
        const targetId = command.targetId!;
        if (targetId === "player_hero" && hasTauntMinions(prev.player.board)) {
          if (!attacker.keywords?.includes("飞行")) {
            // 重定向到嘲讽随从
            const tauntTarget = prev.player.board.find((c) => isTauntTarget(c));
            if (tauntTarget) {
              command.targetId = tauntTarget.id;
            } else {
              return prev;
            }
          }
        }

        let newEnemyBoard = prev.enemy.board.map((c) => ({ ...c }));
        let newPlayerBoard = prev.player.board.map((c) => ({ ...c }));
        let newPlayerHealth = prev.player.health;
        let newPlayerArmor = prev.player.armor;
        let newEnemyHealth = prev.enemy.health;

        if (command.targetId === "player_hero") {
          const heroResult = damageHero(newPlayerHealth, newPlayerArmor, attacker.attack || 0);
          newPlayerHealth = heroResult.health;
          newPlayerArmor = heroResult.armor;
          newEnemyBoard[attackerIndex] = { ...newEnemyBoard[attackerIndex], canAttack: false, isStealth: false };
        } else {
          const targetIndex = newPlayerBoard.findIndex((c) => c.id === command.targetId);
          if (targetIndex !== -1) {
            const target = newPlayerBoard[targetIndex];
            const attackerDmg = attacker.attack || 0;
            const targetDmg = target.attack || 0;

            newPlayerBoard[targetIndex] = damageMinion(target, attackerDmg);
            newEnemyBoard[attackerIndex] = damageMinion(newEnemyBoard[attackerIndex], targetDmg);

            // 剧毒
            if (attacker.keywords?.includes("剧毒") && attackerDmg > 0 && !newPlayerBoard[targetIndex].hasShield) {
              newPlayerBoard[targetIndex] = { ...newPlayerBoard[targetIndex], currentHealth: 0 };
            }
            if (target.keywords?.includes("剧毒") && targetDmg > 0 && !newEnemyBoard[attackerIndex].hasShield) {
              newEnemyBoard[attackerIndex] = { ...newEnemyBoard[attackerIndex], currentHealth: 0 };
            }

            // 死亡处理
            if ((newPlayerBoard[targetIndex]?.currentHealth || 0) <= 0) {
              const dead = newPlayerBoard[targetIndex];
              newPlayerBoard.splice(targetIndex, 1);
              const result = processDeathrattle(dead, newPlayerBoard, effectSystem);
              newPlayerBoard = result.board;
            }
            const atkIdx = newEnemyBoard.findIndex((c) => c.id === command.cardId);
            if (atkIdx !== -1 && (newEnemyBoard[atkIdx].currentHealth || 0) <= 0) {
              const dead = newEnemyBoard[atkIdx];
              newEnemyBoard.splice(atkIdx, 1);
              const result = processDeathrattle(dead, newEnemyBoard, effectSystem);
              newEnemyBoard = result.board;
            } else if (atkIdx !== -1) {
              newEnemyBoard[atkIdx] = { ...newEnemyBoard[atkIdx], canAttack: false, isStealth: false };
            }
          }
        }

        const winner = checkGameEnd(newPlayerHealth, newEnemyHealth);

        return {
          ...prev,
          player: {
            ...prev.player,
            board: newPlayerBoard,
            health: newPlayerHealth,
            armor: newPlayerArmor,
          },
          enemy: {
            ...prev.enemy,
            board: newEnemyBoard,
            health: newEnemyHealth,
          },
          ...(winner ? { phase: GamePhase.GameEnd, winner } : {}),
        };
      });
    } else if (command.type === "EndTurn") {
      // AI结束回合 → 玩家回合开始
      endTurn();
    }
  }, [effectSystem]);

  // 回合结束
  const endTurn = useCallback(() => {
    audioSystem.play(AudioEvent.TurnEnd);

    setGameState((prev) => {
      if (prev.phase === GamePhase.GameEnd) return prev;

      const isNewPlayerTurn = !prev.isPlayerTurn;
      const newTurnCount = isNewPlayerTurn ? prev.turnCount + 1 : prev.turnCount;

      // 处理当前玩家的回合结束效果
      let currentPlayerBoard = prev.isPlayerTurn
        ? processTurnEndEffects(prev.player.board, effectSystem)
        : prev.player.board;
      let currentEnemyBoard = !prev.isPlayerTurn
        ? processTurnEndEffects(prev.enemy.board, effectSystem)
        : prev.enemy.board;

      // 新玩家的法力值更新
      const newPlayerMaxMana = isNewPlayerTurn ? Math.min(MAX_MANA, prev.player.maxMana + 1) : prev.player.maxMana;
      const newPlayerMana = isNewPlayerTurn ? newPlayerMaxMana : prev.player.mana;
      const newEnemyMaxMana = !isNewPlayerTurn ? Math.min(MAX_MANA, prev.enemy.maxMana + 1) : prev.enemy.maxMana;
      const newEnemyMana = !isNewPlayerTurn ? newEnemyMaxMana : prev.enemy.mana;

      // 刷新新玩家的随从攻击状态，清除rushActive
      const refreshedPlayerBoard = currentPlayerBoard.map((card) => ({
        ...card,
        canAttack: isNewPlayerTurn,
        rushActive: isNewPlayerTurn ? false : card.rushActive,
      }));

      const refreshedEnemyBoard = currentEnemyBoard.map((card) => ({
        ...card,
        canAttack: !isNewPlayerTurn,
        rushActive: !isNewPlayerTurn ? false : card.rushActive,
      }));

      // 抽牌
      const drawSide = isNewPlayerTurn ? "player" : "enemy";
      const drawDeck = [...prev[drawSide].deck];
      const drawHand = isNewPlayerTurn ? [...prev.player.hand] : [...prev.enemy.hand];
      let newFatigue = { ...prev.fatigue };
      let drawPlayerHealth = prev.player.health;
      let drawPlayerArmor = prev.player.armor;
      let drawEnemyHealth = prev.enemy.health;
      let drawEnemyArmor = prev.enemy.armor;

      if (drawDeck.length === 0) {
        // 疲劳
        const fatigueKey = isNewPlayerTurn ? "player" : "enemy";
        newFatigue[fatigueKey] += 1;
        if (isNewPlayerTurn) {
          const result = damageHero(drawPlayerHealth, drawPlayerArmor, newFatigue.player);
          drawPlayerHealth = result.health;
          drawPlayerArmor = result.armor;
        } else {
          const result = damageHero(drawEnemyHealth, drawEnemyArmor, newFatigue.enemy);
          drawEnemyHealth = result.health;
          drawEnemyArmor = result.armor;
        }
      } else {
        const drawn = drawDeck.shift()!;
        if (drawHand.length < MAX_HAND_SIZE) {
          drawHand.push(drawn);
        }
      }

      const winner = checkGameEnd(drawPlayerHealth, drawEnemyHealth);

      return {
        ...prev,
        phase: winner ? GamePhase.GameEnd : GamePhase.TurnEnd,
        isPlayerTurn: isNewPlayerTurn,
        turnCount: newTurnCount,
        player: {
          ...prev.player,
          mana: newPlayerMana,
          maxMana: newPlayerMaxMana,
          board: refreshedPlayerBoard,
          hand: isNewPlayerTurn ? drawHand : prev.player.hand,
          deck: isNewPlayerTurn ? drawDeck : prev.player.deck,
          health: drawPlayerHealth,
          armor: drawPlayerArmor,
        },
        enemy: {
          ...prev.enemy,
          mana: newEnemyMana,
          maxMana: newEnemyMaxMana,
          board: refreshedEnemyBoard,
          hand: !isNewPlayerTurn ? drawHand : prev.enemy.hand,
          deck: !isNewPlayerTurn ? drawDeck : prev.enemy.deck,
          handCount: !isNewPlayerTurn ? drawHand.length : prev.enemy.handCount,
          health: drawEnemyHealth,
          armor: drawEnemyArmor,
        },
        fatigue: newFatigue,
        ...(winner ? { winner } : {}),
      };
    });

    // 切换到下一回合
    setTimeout(() => {
      audioSystem.play(AudioEvent.TurnStart);

      setGameState((prev) => {
        if (prev.phase === GamePhase.GameEnd) return prev;

        const newState = {
          ...prev,
          phase: GamePhase.MainPhase,
        };

        if (!newState.isPlayerTurn && newState.gameMode === "pve") {
          setTimeout(() => {
            executeAITurn();
          }, AI_TURN_START_DELAY_MS);
        }

        return newState;
      });
    }, TURN_TRANSITION_DELAY_MS);
  }, [executeAITurn, effectSystem]);

  // 使用英雄技能
  const useHeroSkill = useCallback((cost: number) => {
    setGameState((prev) => {
      if (prev.player.mana < cost || prev.phase === GamePhase.GameEnd) return prev;

      audioSystem.play(AudioEvent.Heal);

      return {
        ...prev,
        player: {
          ...prev.player,
          armor: prev.player.armor + HERO_SKILL_ARMOR,
          mana: prev.player.mana - cost,
        },
      };
    });
  }, []);

  // 验证攻击目标是否合法（供UI层使用）
  const canAttackTarget = useCallback((attackerId: string, targetId: string): boolean => {
    const attacker = gameState.player.board.find((c) => c.id === attackerId);
    if (!attacker || !attacker.canAttack) return false;
    const validation = isValidAttackTarget(attacker, targetId, gameState.enemy.board);
    return validation.valid;
  }, [gameState.player.board, gameState.enemy.board]);

  // 重新开始游戏
  const restartGame = useCallback(() => {
    setGameState(createInitialState(mode, aiDifficulty));
  }, [mode, aiDifficulty]);

  return {
    gameState,
    playCard,
    attack,
    endTurn,
    useHeroSkill,
    addAnimation,
    processAnimations,
    startGame,
    restartGame,
    canAttackTarget,
  };
}
