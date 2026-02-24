import { CardData } from "../types/game";
import { ImageAssetKey, getImageUrl } from "../resources/imageManifest";

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
    image: getImageUrl(ImageAssetKey.Card_HolyKnight, { w: 300, h: 400 }),
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
    image: getImageUrl(ImageAssetKey.Card_FlameElemental, { w: 300, h: 400 }),
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
    image: getImageUrl(ImageAssetKey.Card_ShadowAssassin, { w: 300, h: 400 }),
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
    image: getImageUrl(ImageAssetKey.Card_StoneGuardian, { w: 300, h: 400 }),
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
    image: getImageUrl(ImageAssetKey.Card_DragonWhelp, { w: 300, h: 400 }),
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
    image: getImageUrl(ImageAssetKey.Card_ForestGuardian, { w: 300, h: 400 }),
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
    image: getImageUrl(ImageAssetKey.Card_ShieldBearer, { w: 300, h: 400 }),
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
    image: getImageUrl(ImageAssetKey.Card_FlameStorm, { w: 300, h: 400 }),
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
    image: getImageUrl(ImageAssetKey.Card_BladeStorm, { w: 300, h: 400 }),
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
    image: getImageUrl(ImageAssetKey.Card_DragonBreath, { w: 300, h: 400 }),
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
  const keywords = template.keywords || [];
  return {
    ...template,
    id: `${cardId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    currentHealth: template.health,
    state: "Idle" as const,
    canAttack: keywords.includes("突袭") || false,
    rushActive: keywords.includes("突袭") || false,
    hasShield: keywords.includes("圣盾") || false,
    isTaunting: keywords.includes("嘲讽") || false,
    isStealth: keywords.includes("潜行") || false,
  };
}

// 默认卡组模板ID列表（2 copies of each = 20 cards）
export function getDefaultDeckIds(): string[] {
  const templates = Object.keys(CARD_DATABASE);
  const deckIds: string[] = [];
  for (const id of templates) {
    deckIds.push(id, id); // 2 copies each
  }
  return deckIds;
}

// Fisher-Yates 洗牌
export function shuffleDeck<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
