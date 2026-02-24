// 高级技能脚本系统（Scriptable Effect）

import { CardData, CardSkill } from "../types/game";

// 条件类型
export type ConditionType =
  | "HasBuff"
  | "HasKeyword"
  | "HealthBelow"
  | "HealthAbove"
  | "BoardCount"
  | "HandCount"
  | "TurnNumber"
  | "IsAlive"
  | "CardType";

// 条件定义
export interface Condition {
  type: ConditionType;
  operator?: "=" | ">" | "<" | ">=" | "<=";
  value?: any;
}

// 高级技能定义
export interface ScriptableSkill extends CardSkill {
  conditions?: Condition[];
  repeatCount?: number; // 重复次数
  randomTarget?: boolean; // 是否随机目标
  chainEffect?: ScriptableSkill; // 连锁效果
}

// 技能执行上下文
export interface SkillContext {
  source: CardData;
  targets: CardData[];
  playerBoard: CardData[];
  enemyBoard: CardData[];
  playerHP: number;
  enemyHP: number;
  turnNumber: number;
}

export class ScriptableEffectSystem {
  /**
   * 检查条件是否满足
   */
  checkConditions(conditions: Condition[], context: SkillContext): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every((condition) => this.evaluateCondition(condition, context));
  }

  /**
   * 评估单个条件
   */
  private evaluateCondition(condition: Condition, context: SkillContext): boolean {
    const { source } = context;

    switch (condition.type) {
      case "HasBuff":
        // 检查是否有特定Buff（简化实现）
        return true;

      case "HasKeyword":
        return source.keywords?.includes(condition.value) || false;

      case "HealthBelow":
        return (source.currentHealth || 0) < (condition.value || 0);

      case "HealthAbove":
        return (source.currentHealth || 0) > (condition.value || 0);

      case "BoardCount":
        return this.compareValue(
          context.playerBoard.length,
          condition.operator || "=",
          condition.value || 0
        );

      case "HandCount":
        // 手牌数量检查（需要从context获取）
        return true;

      case "TurnNumber":
        return this.compareValue(
          context.turnNumber,
          condition.operator || "=",
          condition.value || 0
        );

      case "IsAlive":
        return (source.currentHealth || 0) > 0;

      case "CardType":
        return source.type === condition.value;

      default:
        return true;
    }
  }

  /**
   * 比较数值
   */
  private compareValue(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case "=":
        return actual === expected;
      case ">":
        return actual > expected;
      case "<":
        return actual < expected;
      case ">=":
        return actual >= expected;
      case "<=":
        return actual <= expected;
      default:
        return false;
    }
  }

  /**
   * 执行技能
   */
  executeSkill(skill: ScriptableSkill, context: SkillContext): void {
    // 检查条件
    if (!this.checkConditions(skill.conditions || [], context)) {
      return;
    }

    // 执行主效果
    const repeatCount = skill.repeatCount || 1;
    for (let i = 0; i < repeatCount; i++) {
      this.applyEffect(skill, context);
    }

    // 执行连锁效果
    if (skill.chainEffect) {
      this.executeSkill(skill.chainEffect, context);
    }
  }

  /**
   * 应用效果
   */
  private applyEffect(skill: ScriptableSkill, context: SkillContext): void {
    let targets = context.targets;

    // 随机目标
    if (skill.randomTarget && targets.length > 0) {
      const randomIndex = Math.floor(Math.random() * targets.length);
      targets = [targets[randomIndex]];
    }

    // 根据效果类型执行
    switch (skill.effect) {
      case "DealDamage":
        this.applyDamage(skill, targets, context);
        break;

      case "Heal":
        this.applyHeal(skill, targets, context);
        break;

      case "DrawCard":
        // 抽卡逻辑
        break;

      case "Summon":
        // 召唤逻辑
        break;

      case "Buff":
        this.applyBuff(skill, targets, context);
        break;
    }
  }

  /**
   * 应用伤害
   */
  private applyDamage(skill: ScriptableSkill, targets: CardData[], context: SkillContext): void {
    const damage = skill.value || 0;

    targets.forEach((target) => {
      if (target.currentHealth !== undefined) {
        target.currentHealth = Math.max(0, target.currentHealth - damage);
      }
    });
  }

  /**
   * 应用治疗
   */
  private applyHeal(skill: ScriptableSkill, targets: CardData[], context: SkillContext): void {
    const healAmount = skill.value || 0;

    targets.forEach((target) => {
      if (target.currentHealth !== undefined && target.health !== undefined) {
        target.currentHealth = Math.min(target.health, target.currentHealth + healAmount);
      }
    });
  }

  /**
   * 应用Buff
   */
  private applyBuff(skill: ScriptableSkill, targets: CardData[], context: SkillContext): void {
    const buffValue = skill.value || 0;

    targets.forEach((target) => {
      if (target.attack !== undefined) target.attack += buffValue;
      if (target.health !== undefined) {
        target.health += buffValue;
        target.currentHealth = (target.currentHealth || 0) + buffValue;
      }
    });
  }
}

// 示例技能定义
export const SCRIPTABLE_SKILLS: Record<string, ScriptableSkill> = {
  // 条件触发技能
  enrage: {
    trigger: "OnDamaged",
    effect: "Buff",
    target: "Self",
    value: 2,
    conditions: [{ type: "HealthBelow", value: 5 }],
  },

  // 连锁效果
  arcane_missiles: {
    trigger: "OnSummon",
    effect: "DealDamage",
    target: "Enemy",
    value: 1,
    repeatCount: 3,
    randomTarget: true,
  },

  // 复杂条件
  board_clear: {
    trigger: "OnSummon",
    effect: "DealDamage",
    target: "AllEnemies",
    value: 2,
    conditions: [
      { type: "BoardCount", operator: ">=", value: 3 },
      { type: "TurnNumber", operator: ">=", value: 5 },
    ],
  },

  // 连锁召唤
  summon_token: {
    trigger: "OnDeath",
    effect: "Summon",
    value: 1001,
    count: 2,
    chainEffect: {
      trigger: "OnSummon",
      effect: "Buff",
      target: "Ally",
      value: 1,
    },
  },
};

export const scriptableEffectSystem = new ScriptableEffectSystem();
