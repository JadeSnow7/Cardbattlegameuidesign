import { CardData } from "../types/game";

// 数据驱动的卡牌数据库
export const CARD_DATABASE: Record<string, CardData> = {
  // 随从卡
  holy_knight: {
    id: "holy_knight",
    name: "圣光骑士",
    cost: 4,
    attack: 4,
    health: 5,
    currentHealth: 5,
    image: "https://images.unsplash.com/photo-1693921978742-c93c4a3e6172?w=300&h=400&fit=crop",
    description: "亡语: 召唤一个2/2的侍从",
    type: "minion",
    keywords: ["圣盾"],
    skills: [
      {
        trigger: "OnDeath",
        effect: "Summon",
        value: 2,
        count: 1,
      },
    ],
  },
  
  flame_elemental: {
    id: "flame_elemental",
    name: "烈焰元素",
    cost: 3,
    attack: 3,
    health: 2,
    currentHealth: 2,
    image: "https://images.unsplash.com/photo-1542379653-b928db1b4956?w=300&h=400&fit=crop",
    description: "战吼: 造成2点伤害",
    type: "minion",
    keywords: ["突袭"],
    skills: [
      {
        trigger: "OnSummon",
        effect: "DealDamage",
        target: "EnemyHero",
        value: 2,
      },
    ],
  },

  shadow_assassin: {
    id: "shadow_assassin",
    name: "暗影刺客",
    cost: 2,
    attack: 2,
    health: 1,
    currentHealth: 1,
    image: "https://images.unsplash.com/photo-1762968755051-5f0b37d75609?w=300&h=400&fit=crop",
    description: "潜行",
    type: "minion",
    keywords: ["潜行"],
  },

  stone_guardian: {
    id: "stone_guardian",
    name: "石墙守卫",
    cost: 5,
    attack: 1,
    health: 7,
    currentHealth: 7,
    image: "https://images.unsplash.com/photo-1636075204447-ed932101c622?w=300&h=400&fit=crop",
    description: "嘲讽",
    type: "minion",
    keywords: ["嘲讽"],
    isTaunting: true,
  },

  dragon_whelp: {
    id: "dragon_whelp",
    name: "巨龙幼崽",
    cost: 6,
    attack: 5,
    health: 6,
    currentHealth: 6,
    image: "https://images.unsplash.com/photo-1745130839558-55b2f78f1739?w=300&h=400&fit=crop",
    description: "飞行, 回合结束时+1/+1",
    type: "minion",
    keywords: ["飞行"],
    skills: [
      {
        trigger: "OnTurnEnd",
        effect: "Buff",
        target: "Self",
        value: 1,
      },
    ],
  },

  forest_guardian: {
    id: "forest_guardian",
    name: "森林守护者",
    cost: 5,
    attack: 4,
    health: 5,
    currentHealth: 5,
    image: "https://images.unsplash.com/photo-1636075204447-ed932101c622?w=300&h=400&fit=crop",
    description: "战吼: 恢复5点生命值",
    type: "minion",
    keywords: ["嘲讽"],
    skills: [
      {
        trigger: "OnSummon",
        effect: "Heal",
        target: "Self",
        value: 5,
      },
    ],
  },

  shield_bearer: {
    id: "shield_bearer",
    name: "盾牌侍卫",
    cost: 3,
    attack: 2,
    health: 4,
    currentHealth: 4,
    image: "https://images.unsplash.com/photo-1762968755051-5f0b37d75609?w=300&h=400&fit=crop",
    description: "战吼: 获得3点护甲",
    type: "minion",
    keywords: ["嘲讽"],
    skills: [
      {
        trigger: "OnSummon",
        effect: "Buff",
        target: "Self",
        value: 3,
      },
    ],
  },

  // 法术卡
  flame_storm: {
    id: "flame_storm",
    name: "炽炎风暴",
    cost: 7,
    image: "https://images.unsplash.com/photo-1542379653-b928db1b4956?w=300&h=400&fit=crop",
    description: "对所有敌方随从造成4点伤害",
    type: "spell",
    skills: [
      {
        trigger: "OnSummon",
        effect: "DealDamage",
        target: "AllEnemies",
        value: 4,
      },
    ],
  },

  blade_storm: {
    id: "blade_storm",
    name: "剑刃风暴",
    cost: 2,
    image: "https://images.unsplash.com/photo-1693921978742-c93c4a3e6172?w=300&h=400&fit=crop",
    description: "对所有随从造成1点伤害",
    type: "spell",
    skills: [
      {
        trigger: "OnSummon",
        effect: "DealDamage",
        target: "AllEnemies",
        value: 1,
      },
    ],
  },

  dragon_breath: {
    id: "dragon_breath",
    name: "龙之吐息",
    cost: 4,
    image: "https://images.unsplash.com/photo-1745130839558-55b2f78f1739?w=300&h=400&fit=crop",
    description: "造成6点伤害",
    type: "spell",
    skills: [
      {
        trigger: "OnSummon",
        effect: "DealDamage",
        target: "Enemy",
        value: 6,
      },
    ],
  },
};

// 创建卡牌实例
export function createCard(cardId: string): CardData {
  const template = CARD_DATABASE[cardId];
  if (!template) {
    throw new Error(`Card ${cardId} not found in database`);
  }
  return {
    ...template,
    id: `${cardId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    currentHealth: template.health,
    state: "Idle" as const,
    canAttack: template.keywords?.includes("突袭") || false,
  };
}
