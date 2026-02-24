import { CardData } from "../types/game";
import { EffectSystem } from "../systems/EffectSystem";
import { MAX_BOARD_SIZE } from "../constants";

// 检查游戏是否结束
export function checkGameEnd(playerHP: number, enemyHP: number): "player" | "enemy" | "draw" | null {
  const playerDead = playerHP <= 0;
  const enemyDead = enemyHP <= 0;
  if (playerDead && enemyDead) return "draw";
  if (playerDead) return "enemy";
  if (enemyDead) return "player";
  return null;
}

// 对英雄造成伤害（计算护甲）
export function damageHero(health: number, armor: number, damage: number): { health: number; armor: number } {
  let remaining = damage;
  let newArmor = armor;
  let newHealth = health;
  if (newArmor > 0) {
    const absorbed = Math.min(newArmor, remaining);
    newArmor -= absorbed;
    remaining -= absorbed;
  }
  newHealth -= remaining;
  return { health: newHealth, armor: newArmor };
}

// 处理随从受伤（圣盾检查）
export function damageMinion(minion: CardData, damage: number): CardData {
  if (minion.hasShield) {
    return { ...minion, hasShield: false };
  }
  return { ...minion, currentHealth: (minion.currentHealth || 0) - damage };
}

// 检查嘲讽限制
export function hasTauntMinions(board: CardData[]): boolean {
  return board.some((c) => c.isTaunting && !c.isStealth);
}

export function isTauntTarget(card: CardData): boolean {
  return !!(card.isTaunting && !card.isStealth);
}

// 验证攻击目标合法性
export function isValidAttackTarget(
  attacker: CardData,
  targetId: string,
  enemyBoard: CardData[]
): { valid: boolean; reason?: string } {
  // Rush限制：不能攻击英雄
  if (attacker.rushActive && targetId === "enemy_hero") {
    return { valid: false, reason: "突袭随从本回合不能攻击英雄" };
  }

  // 嘲讽限制
  const hasTaunt = hasTauntMinions(enemyBoard);
  if (hasTaunt) {
    if (targetId === "enemy_hero") {
      if (attacker.keywords?.includes("飞行")) return { valid: true };
      return { valid: false, reason: "必须先攻击具有嘲讽的随从" };
    }
    const target = enemyBoard.find((c) => c.id === targetId);
    if (target && !isTauntTarget(target) && !attacker.keywords?.includes("飞行")) {
      return { valid: false, reason: "必须先攻击具有嘲讽的随从" };
    }
  }

  // 潜行限制
  const target = enemyBoard.find((c) => c.id === targetId);
  if (target?.isStealth) {
    return { valid: false, reason: "无法攻击具有潜行的随从" };
  }

  return { valid: true };
}

// 处理亡语效果
export function processDeathrattle(
  deadMinion: CardData,
  ownerBoard: CardData[],
  effectSystem: EffectSystem
): { board: CardData[] } {
  let newBoard = [...ownerBoard];
  if (deadMinion.skills) {
    for (const skill of deadMinion.skills) {
      if (skill.trigger === "OnDeath") {
        const result = effectSystem.executeSkill(skill, deadMinion, [], {
          playerBoard: newBoard,
          enemyBoard: [],
          playerHP: 0,
          enemyHP: 0,
        });
        if (result.success && result.summonedCards && newBoard.length < MAX_BOARD_SIZE) {
          for (const summoned of result.summonedCards) {
            if (newBoard.length < MAX_BOARD_SIZE) {
              newBoard.push(summoned);
            }
          }
        }
      }
    }
  }
  return { board: newBoard };
}

// 处理回合结束效果（使用不可变 EffectSystem 返回值）
export function processTurnEndEffects(board: CardData[], effectSystem: EffectSystem): CardData[] {
  return board.map((minion) => {
    if (!minion.skills) return minion;
    let updated = { ...minion };
    for (const skill of minion.skills) {
      if (skill.trigger === "OnTurnEnd") {
        const result = effectSystem.executeSkill(skill, updated, [], {
          playerBoard: board,
          enemyBoard: [],
          playerHP: 0,
          enemyHP: 0,
        });
        if (result.success && result.modifiedCards) {
          const modified = result.modifiedCards.get(updated.id);
          if (modified) {
            updated = modified;
          }
        }
      }
    }
    return updated;
  });
}
