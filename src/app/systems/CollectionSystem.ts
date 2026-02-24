// 卡牌收集系统

export enum CardRarity {
  Common = "Common",
  Rare = "Rare",
  Epic = "Epic",
  Legendary = "Legendary",
}

export interface OwnedCard {
  cardId: string;
  count: number;
  isGolden: boolean;
  obtainedAt: number;
}

export interface CardPack {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  price: number;
  rarityDistribution: {
    [CardRarity.Common]: number;
    [CardRarity.Rare]: number;
    [CardRarity.Epic]: number;
    [CardRarity.Legendary]: number;
  };
}

export interface PlayerCollection {
  playerId: string;
  ownedCards: Map<string, OwnedCard>;
  dust: number; // 奥术之尘（用于合成卡牌）
  gold: number; // 金币（用于购买卡包）
  totalCardsOpened: number;
  uniqueCardsOwned: number;
}

// 卡包类型定义
const CARD_PACKS: CardPack[] = [
  {
    id: "classic_pack",
    name: "经典卡包",
    description: "包含基础卡牌",
    cardCount: 5,
    price: 100,
    rarityDistribution: {
      [CardRarity.Common]: 0.7,
      [CardRarity.Rare]: 0.2,
      [CardRarity.Epic]: 0.08,
      [CardRarity.Legendary]: 0.02,
    },
  },
  {
    id: "premium_pack",
    name: "高级卡包",
    description: "更高概率获得稀有卡牌",
    cardCount: 5,
    price: 300,
    rarityDistribution: {
      [CardRarity.Common]: 0.5,
      [CardRarity.Rare]: 0.3,
      [CardRarity.Epic]: 0.15,
      [CardRarity.Legendary]: 0.05,
    },
  },
];

// 卡牌稀有度对应的尘量
const DUST_VALUES = {
  craft: {
    [CardRarity.Common]: 40,
    [CardRarity.Rare]: 100,
    [CardRarity.Epic]: 400,
    [CardRarity.Legendary]: 1600,
  },
  disenchant: {
    [CardRarity.Common]: 5,
    [CardRarity.Rare]: 20,
    [CardRarity.Epic]: 100,
    [CardRarity.Legendary]: 400,
  },
};

export class CollectionSystem {
  private collections: Map<string, PlayerCollection> = new Map();
  private cardDatabase: Map<string, { rarity: CardRarity }> = new Map();

  constructor() {
    this.initializeCardDatabase();
  }

  /**
   * 初始化卡牌数据库（简化版）
   */
  private initializeCardDatabase(): void {
    // 实际项目中应该从服务器加载
    this.cardDatabase.set("holy_knight", { rarity: CardRarity.Common });
    this.cardDatabase.set("flame_elemental", { rarity: CardRarity.Common });
    this.cardDatabase.set("shadow_assassin", { rarity: CardRarity.Rare });
    this.cardDatabase.set("stone_guardian", { rarity: CardRarity.Rare });
    this.cardDatabase.set("dragon_whelp", { rarity: CardRarity.Epic });
    this.cardDatabase.set("forest_guardian", { rarity: CardRarity.Epic });
    this.cardDatabase.set("flame_storm", { rarity: CardRarity.Legendary });
  }

  /**
   * 获取玩家收藏
   */
  getPlayerCollection(playerId: string): PlayerCollection {
    let collection = this.collections.get(playerId);

    if (!collection) {
      collection = {
        playerId,
        ownedCards: new Map(),
        dust: 100, // 初始奥术之尘
        gold: 500, // 初始金币
        totalCardsOpened: 0,
        uniqueCardsOwned: 0,
      };

      this.collections.set(playerId, collection);
    }

    return collection;
  }

  /**
   * 添加卡牌到收藏
   */
  addCard(playerId: string, cardId: string, count: number = 1): void {
    const collection = this.getPlayerCollection(playerId);
    let ownedCard = collection.ownedCards.get(cardId);

    if (!ownedCard) {
      ownedCard = {
        cardId,
        count: 0,
        isGolden: false,
        obtainedAt: Date.now(),
      };
      collection.ownedCards.set(cardId, ownedCard);
      collection.uniqueCardsOwned++;
    }

    ownedCard.count += count;
    collection.totalCardsOpened += count;
  }

  /**
   * 开启卡包
   */
  openPack(playerId: string, packId: string): string[] {
    const collection = this.getPlayerCollection(playerId);
    const pack = CARD_PACKS.find((p) => p.id === packId);

    if (!pack) {
      throw new Error(`Pack ${packId} not found`);
    }

    // 检查金币
    if (collection.gold < pack.price) {
      throw new Error("Insufficient gold");
    }

    // 扣除金币
    collection.gold -= pack.price;

    // 生成卡牌
    const drawnCards: string[] = [];
    const availableCards = Array.from(this.cardDatabase.keys());

    for (let i = 0; i < pack.cardCount; i++) {
      const rarity = this.rollRarity(pack.rarityDistribution);
      const cardsOfRarity = availableCards.filter(
        (cardId) => this.cardDatabase.get(cardId)?.rarity === rarity
      );

      if (cardsOfRarity.length > 0) {
        const randomCard =
          cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
        drawnCards.push(randomCard);
        this.addCard(playerId, randomCard);
      }
    }

    return drawnCards;
  }

  /**
   * 根据概率抽取稀有度
   */
  private rollRarity(distribution: CardPack["rarityDistribution"]): CardRarity {
    const random = Math.random();
    let cumulative = 0;

    for (const [rarity, probability] of Object.entries(distribution)) {
      cumulative += probability;
      if (random <= cumulative) {
        return rarity as CardRarity;
      }
    }

    return CardRarity.Common;
  }

  /**
   * 分解卡牌获取奥术之尘
   */
  disenchantCard(playerId: string, cardId: string, count: number = 1): number {
    const collection = this.getPlayerCollection(playerId);
    const ownedCard = collection.ownedCards.get(cardId);

    if (!ownedCard || ownedCard.count < count) {
      throw new Error("Card not owned or insufficient count");
    }

    const cardData = this.cardDatabase.get(cardId);
    if (!cardData) {
      throw new Error("Card not found in database");
    }

    const dustGained = DUST_VALUES.disenchant[cardData.rarity] * count;
    collection.dust += dustGained;

    ownedCard.count -= count;
    if (ownedCard.count === 0) {
      collection.ownedCards.delete(cardId);
      collection.uniqueCardsOwned--;
    }

    return dustGained;
  }

  /**
   * 合成卡牌
   */
  craftCard(playerId: string, cardId: string): boolean {
    const collection = this.getPlayerCollection(playerId);
    const cardData = this.cardDatabase.get(cardId);

    if (!cardData) {
      throw new Error("Card not found in database");
    }

    const dustCost = DUST_VALUES.craft[cardData.rarity];

    if (collection.dust < dustCost) {
      return false;
    }

    collection.dust -= dustCost;
    this.addCard(playerId, cardId);

    return true;
  }

  /**
   * 获取收藏完成度
   */
  getCollectionCompletion(playerId: string): {
    owned: number;
    total: number;
    percentage: number;
  } {
    const collection = this.getPlayerCollection(playerId);
    const total = this.cardDatabase.size;
    const owned = collection.uniqueCardsOwned;

    return {
      owned,
      total,
      percentage: (owned / total) * 100,
    };
  }

  /**
   * 获取按稀有度分类的收藏
   */
  getCollectionByRarity(
    playerId: string
  ): Record<CardRarity, { owned: number; total: number }> {
    const collection = this.getPlayerCollection(playerId);
    const stats: Record<CardRarity, { owned: number; total: number }> = {
      [CardRarity.Common]: { owned: 0, total: 0 },
      [CardRarity.Rare]: { owned: 0, total: 0 },
      [CardRarity.Epic]: { owned: 0, total: 0 },
      [CardRarity.Legendary]: { owned: 0, total: 0 },
    };

    // 统计总数
    this.cardDatabase.forEach((data, cardId) => {
      stats[data.rarity].total++;
      if (collection.ownedCards.has(cardId)) {
        stats[data.rarity].owned++;
      }
    });

    return stats;
  }

  /**
   * 赠送金币
   */
  addGold(playerId: string, amount: number): void {
    const collection = this.getPlayerCollection(playerId);
    collection.gold += amount;
  }

  /**
   * 赠送奥术之尘
   */
  addDust(playerId: string, amount: number): void {
    const collection = this.getPlayerCollection(playerId);
    collection.dust += amount;
  }

  /**
   * 获取可购买的卡包列表
   */
  getAvailablePacks(): CardPack[] {
    return CARD_PACKS;
  }
}

// 全局收藏系统实例
export const collectionSystem = new CollectionSystem();
