import { CardData, CardSkill } from "../types/game";

// Buff数据结构
export interface Buff {
  id: string;
  name: string;
  duration: number; // -1 表示永久
  stackable: boolean;
  modifier: {
    attack?: number;
    health?: number;
    cost?: number;
  };
  visualEffect?: string;
}

// 效果执行上下文
export interface EffectContext {
  playerBoard: CardData[];
  enemyBoard: CardData[];
  playerHP: number;
  enemyHP: number;
}

// 效果执行结果（不可变：所有修改通过返回值传递）
export interface EffectResult {
  success: boolean;
  value?: number;
  targets?: string[];
  buffs?: Buff[];
  summonedCards?: CardData[];
  message?: string;
  /** 被修改的随从（key=卡牌ID, value=修改后的副本） */
  modifiedCards?: Map<string, CardData>;
  /** 对英雄HP的变化 */
  heroHPDelta?: number;
}

let buffIdCounter = 0;

/**
 * 效果执行系统（不可变版本）
 *
 * 所有方法返回新对象，不修改传入参数。
 * 调用方通过 EffectResult.modifiedCards 获取被修改的卡牌副本。
 */
export class EffectSystem {
  /**
   * 执行技能效果
   */
  executeSkill(
    skill: CardSkill,
    source: CardData,
    targets: CardData[],
    context: EffectContext
  ): EffectResult {
    switch (skill.effect) {
      case "DealDamage":
        return this.dealDamage(skill, targets, context);
      case "Heal":
        return this.heal(skill, source, targets);
      case "DrawCard":
        return this.drawCard(skill);
      case "Summon":
        return this.summon(skill, source);
      case "Buff":
        return this.applyBuff(skill, source, targets);
      default:
        return { success: false, message: "Unknown effect type" };
    }
  }

  /**
   * 造成伤害（不修改传入对象）
   */
  private dealDamage(
    skill: CardSkill,
    targets: CardData[],
    context: EffectContext
  ): EffectResult {
    const damage = skill.value || 0;
    const affectedTargets: string[] = [];
    const modifiedCards = new Map<string, CardData>();
    let heroHPDelta = 0;

    switch (skill.target) {
      case "Enemy":
        if (targets.length > 0) {
          const target = targets[0];
          if (target.currentHealth !== undefined) {
            modifiedCards.set(target.id, {
              ...target,
              currentHealth: Math.max(0, target.currentHealth - damage),
            });
            affectedTargets.push(target.id);
          }
        }
        break;

      case "EnemyHero":
        heroHPDelta = -damage;
        affectedTargets.push("enemy_hero");
        break;

      case "AllEnemies":
        for (const card of context.enemyBoard) {
          if (card.currentHealth !== undefined) {
            modifiedCards.set(card.id, {
              ...card,
              currentHealth: Math.max(0, card.currentHealth - damage),
            });
            affectedTargets.push(card.id);
          }
        }
        break;
    }

    return {
      success: true,
      value: damage,
      targets: affectedTargets,
      modifiedCards: modifiedCards.size > 0 ? modifiedCards : undefined,
      heroHPDelta: heroHPDelta !== 0 ? heroHPDelta : undefined,
      message: `Dealt ${damage} damage`,
    };
  }

  /**
   * 治疗（不修改传入对象）
   */
  private heal(
    skill: CardSkill,
    source: CardData,
    targets: CardData[]
  ): EffectResult {
    const healAmount = skill.value || 0;
    const affectedTargets: string[] = [];
    const modifiedCards = new Map<string, CardData>();

    switch (skill.target) {
      case "Self":
        if (source.currentHealth !== undefined && source.health !== undefined) {
          modifiedCards.set(source.id, {
            ...source,
            currentHealth: Math.min(source.health, source.currentHealth + healAmount),
          });
          affectedTargets.push(source.id);
        }
        break;

      case "Ally":
        if (targets.length > 0) {
          const target = targets[0];
          if (target.currentHealth !== undefined && target.health !== undefined) {
            modifiedCards.set(target.id, {
              ...target,
              currentHealth: Math.min(target.health, target.currentHealth + healAmount),
            });
            affectedTargets.push(target.id);
          }
        }
        break;
    }

    return {
      success: true,
      value: healAmount,
      targets: affectedTargets,
      modifiedCards: modifiedCards.size > 0 ? modifiedCards : undefined,
      message: `Healed ${healAmount} HP`,
    };
  }

  /**
   * 抽卡（纯数据返回）
   */
  private drawCard(skill: CardSkill): EffectResult {
    const drawCount = skill.count || 1;

    return {
      success: true,
      value: drawCount,
      message: `Drew ${drawCount} card(s)`,
    };
  }

  /**
   * 召唤随从（返回新创建的卡牌）
   */
  private summon(skill: CardSkill, source: CardData): EffectResult {
    const summonCount = skill.count || 1;
    const summonStats = skill.value || 1;

    const summonedCards: CardData[] = [];
    for (let i = 0; i < summonCount; i++) {
      summonedCards.push({
        id: `summoned_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
        name: "侍从",
        cost: 1,
        attack: summonStats,
        health: summonStats,
        currentHealth: summonStats,
        image: source.image,
        description: "被召唤的随从",
        type: "minion",
      });
    }

    return {
      success: true,
      summonedCards,
      message: `Summoned ${summonCount} minion(s)`,
    };
  }

  /**
   * 添加 Buff（不修改传入对象）
   */
  private applyBuff(
    skill: CardSkill,
    source: CardData,
    targets: CardData[]
  ): EffectResult {
    const buffValue = skill.value || 1;
    const modifiedCards = new Map<string, CardData>();

    const buff: Buff = {
      id: `buff_${++buffIdCounter}`,
      name: "增益",
      duration: -1,
      stackable: false,
      modifier: {
        attack: buffValue,
        health: buffValue,
      },
      visualEffect: "glow",
    };

    switch (skill.target) {
      case "Self":
        modifiedCards.set(source.id, {
          ...source,
          attack: (source.attack || 0) + buffValue,
          health: (source.health || 0) + buffValue,
          currentHealth: (source.currentHealth || 0) + buffValue,
        });
        break;

      case "Ally":
        for (const target of targets) {
          modifiedCards.set(target.id, {
            ...target,
            attack: (target.attack || 0) + buffValue,
            health: (target.health || 0) + buffValue,
            currentHealth: (target.currentHealth || 0) + buffValue,
          });
        }
        break;
    }

    return {
      success: true,
      buffs: [buff],
      modifiedCards: modifiedCards.size > 0 ? modifiedCards : undefined,
      message: `Applied buff +${buffValue}/+${buffValue}`,
    };
  }

  /**
   * 沉默效果（不修改传入对象）
   */
  silence(target: CardData): EffectResult {
    const modifiedCards = new Map<string, CardData>();
    modifiedCards.set(target.id, {
      ...target,
      skills: [],
      keywords: [],
      isTaunting: false,
      hasShield: false,
      isStealth: false,
    });

    return {
      success: true,
      targets: [target.id],
      modifiedCards,
      message: "Silenced",
    };
  }
}
