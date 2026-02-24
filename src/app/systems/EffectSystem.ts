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

// 效果执行结果
export interface EffectResult {
  success: boolean;
  value?: number;
  targets?: string[];
  buffs?: Buff[];
  summonedCards?: CardData[];
  message?: string;
}

/**
 * 效果执行系统
 */
export class EffectSystem {
  /**
   * 执行技能效果
   */
  executeSkill(
    skill: CardSkill,
    source: CardData,
    targets: CardData[],
    context: {
      playerBoard: CardData[];
      enemyBoard: CardData[];
      playerHP: number;
      enemyHP: number;
    }
  ): EffectResult {
    switch (skill.effect) {
      case "DealDamage":
        return this.dealDamage(skill, source, targets, context);
      case "Heal":
        return this.heal(skill, source, targets, context);
      case "DrawCard":
        return this.drawCard(skill, context);
      case "Summon":
        return this.summon(skill, source, context);
      case "Buff":
        return this.addBuff(skill, source, targets, context);
      default:
        return { success: false, message: "Unknown effect type" };
    }
  }

  /**
   * 造成伤害
   */
  private dealDamage(
    skill: CardSkill,
    source: CardData,
    targets: CardData[],
    context: any
  ): EffectResult {
    const damage = skill.value || 0;
    const affectedTargets: string[] = [];

    switch (skill.target) {
      case "Enemy":
        // 对单个敌方目标造成伤害
        if (targets.length > 0) {
          const target = targets[0];
          if (target.currentHealth !== undefined) {
            target.currentHealth = Math.max(0, target.currentHealth - damage);
            affectedTargets.push(target.id);
          }
        }
        break;

      case "EnemyHero":
        // 对敌方英雄造成伤害
        context.enemyHP = Math.max(0, context.enemyHP - damage);
        affectedTargets.push("enemy_hero");
        break;

      case "AllEnemies":
        // 对所有敌方随从造成伤害
        context.enemyBoard.forEach((card: CardData) => {
          if (card.currentHealth !== undefined) {
            card.currentHealth = Math.max(0, card.currentHealth - damage);
            affectedTargets.push(card.id);
          }
        });
        break;
    }

    return {
      success: true,
      value: damage,
      targets: affectedTargets,
      message: `Dealt ${damage} damage`,
    };
  }

  /**
   * 治疗
   */
  private heal(
    skill: CardSkill,
    source: CardData,
    targets: CardData[],
    context: any
  ): EffectResult {
    const healAmount = skill.value || 0;
    const affectedTargets: string[] = [];

    switch (skill.target) {
      case "Self":
        if (source.currentHealth !== undefined && source.health !== undefined) {
          source.currentHealth = Math.min(source.health, source.currentHealth + healAmount);
          affectedTargets.push(source.id);
        }
        break;

      case "Ally":
        if (targets.length > 0) {
          const target = targets[0];
          if (target.currentHealth !== undefined && target.health !== undefined) {
            target.currentHealth = Math.min(target.health, target.currentHealth + healAmount);
            affectedTargets.push(target.id);
          }
        }
        break;
    }

    return {
      success: true,
      value: healAmount,
      targets: affectedTargets,
      message: `Healed ${healAmount} HP`,
    };
  }

  /**
   * 抽卡
   */
  private drawCard(skill: CardSkill, context: any): EffectResult {
    const drawCount = skill.count || 1;

    return {
      success: true,
      value: drawCount,
      message: `Drew ${drawCount} card(s)`,
    };
  }

  /**
   * 召唤随从
   */
  private summon(skill: CardSkill, source: CardData, context: any): EffectResult {
    const summonCount = skill.count || 1;
    const summonStats = skill.value || 1;

    // 创建召唤的随从（简化版）
    const summonedCards: CardData[] = [];
    for (let i = 0; i < summonCount; i++) {
      summonedCards.push({
        id: `summoned_${Date.now()}_${i}`,
        name: "侍从",
        cost: 1,
        attack: summonStats,
        health: summonStats,
        currentHealth: summonStats,
        image: source.image,
        description: "被召唤的随从",
        type: "minion",
        state: "Idle",
      });
    }

    return {
      success: true,
      summonedCards,
      message: `Summoned ${summonCount} minion(s)`,
    };
  }

  /**
   * 添加Buff
   */
  private addBuff(
    skill: CardSkill,
    source: CardData,
    targets: CardData[],
    context: any
  ): EffectResult {
    const buffValue = skill.value || 1;
    const buffs: Buff[] = [];

    const buff: Buff = {
      id: `buff_${Date.now()}`,
      name: "增益",
      duration: -1, // 永久
      stackable: false,
      modifier: {
        attack: buffValue,
        health: buffValue,
      },
      visualEffect: "glow",
    };

    switch (skill.target) {
      case "Self":
        if (source.attack !== undefined) source.attack += buffValue;
        if (source.health !== undefined) {
          source.health += buffValue;
          source.currentHealth = (source.currentHealth || 0) + buffValue;
        }
        buffs.push(buff);
        break;

      case "Ally":
        targets.forEach((target) => {
          if (target.attack !== undefined) target.attack += buffValue;
          if (target.health !== undefined) {
            target.health += buffValue;
            target.currentHealth = (target.currentHealth || 0) + buffValue;
          }
        });
        buffs.push(buff);
        break;
    }

    return {
      success: true,
      buffs,
      message: `Applied buff +${buffValue}/+${buffValue}`,
    };
  }

  /**
   * 沉默效果
   */
  silence(target: CardData): EffectResult {
    // 移除所有技能和关键词
    target.skills = [];
    target.keywords = [];

    return {
      success: true,
      targets: [target.id],
      message: "Silenced",
    };
  }
}
