// 成就系统

export enum AchievementCategory {
  Battle = "Battle", // 对战类
  Collection = "Collection", // 收集类
  Skill = "Skill", // 技巧类
  Social = "Social", // 社交类
  Season = "Season", // 赛季类
}

export enum AchievementRarity {
  Common = "Common",
  Rare = "Rare",
  Epic = "Epic",
  Legendary = "Legendary",
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  condition: {
    type: string; // "win_count", "card_collection", "single_turn_kill", etc.
    target: number;
    current: number;
  };
  reward: {
    gold?: number;
    dust?: number;
    cardPacks?: number;
    title?: string;
  };
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  hidden?: boolean; // 隐藏成就
}

export interface PlayerAchievementProgress {
  playerId: string;
  achievements: Map<string, Achievement>;
  unlockedCount: number;
  totalPoints: number;
}

// 成就定义库
const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // 对战类
  {
    id: "first_blood",
    name: "首胜",
    description: "赢得第一场对战",
    category: AchievementCategory.Battle,
    rarity: AchievementRarity.Common,
    condition: { type: "win_count", target: 1, current: 0 },
    reward: { gold: 100 },
    icon: "🏆",
    unlocked: false,
  },
  {
    id: "battle_veteran",
    name: "战斗老兵",
    description: "赢得100场对战",
    category: AchievementCategory.Battle,
    rarity: AchievementRarity.Rare,
    condition: { type: "win_count", target: 100, current: 0 },
    reward: { gold: 1000, cardPacks: 3 },
    icon: "⚔️",
    unlocked: false,
  },
  {
    id: "battle_master",
    name: "战斗大师",
    description: "赢得500场对战",
    category: AchievementCategory.Battle,
    rarity: AchievementRarity.Epic,
    condition: { type: "win_count", target: 500, current: 0 },
    reward: { gold: 5000, cardPacks: 10, title: "战斗大师" },
    icon: "👑",
    unlocked: false,
  },
  {
    id: "win_streak_5",
    name: "五连胜",
    description: "连续赢得5场对战",
    category: AchievementCategory.Battle,
    rarity: AchievementRarity.Rare,
    condition: { type: "win_streak", target: 5, current: 0 },
    reward: { gold: 500 },
    icon: "🔥",
    unlocked: false,
  },

  // 收集类
  {
    id: "collector_beginner",
    name: "收藏家入门",
    description: "收集50张不同的卡牌",
    category: AchievementCategory.Collection,
    rarity: AchievementRarity.Common,
    condition: { type: "unique_cards", target: 50, current: 0 },
    reward: { gold: 200, cardPacks: 1 },
    icon: "📚",
    unlocked: false,
  },
  {
    id: "collector_expert",
    name: "收藏家专家",
    description: "收集200张不同的卡牌",
    category: AchievementCategory.Collection,
    rarity: AchievementRarity.Epic,
    condition: { type: "unique_cards", target: 200, current: 0 },
    reward: { gold: 2000, cardPacks: 5 },
    icon: "📖",
    unlocked: false,
  },
  {
    id: "legendary_collector",
    name: "传奇收藏家",
    description: "收集所有传奇卡牌",
    category: AchievementCategory.Collection,
    rarity: AchievementRarity.Legendary,
    condition: { type: "legendary_cards", target: 20, current: 0 },
    reward: { gold: 10000, dust: 5000, title: "传奇收藏家" },
    icon: "💎",
    unlocked: false,
    hidden: true,
  },

  // 技巧类
  {
    id: "one_turn_kill",
    name: "一回合击杀",
    description: "在单回合内造成30点伤害",
    category: AchievementCategory.Skill,
    rarity: AchievementRarity.Rare,
    condition: { type: "single_turn_damage", target: 30, current: 0 },
    reward: { gold: 500 },
    icon: "💥",
    unlocked: false,
  },
  {
    id: "board_control",
    name: "场面控制",
    description: "同时在场上拥有7个随从",
    category: AchievementCategory.Skill,
    rarity: AchievementRarity.Common,
    condition: { type: "board_count", target: 7, current: 0 },
    reward: { gold: 300 },
    icon: "🛡️",
    unlocked: false,
  },
  {
    id: "comeback_victory",
    name: "绝地翻盘",
    description: "在生命值低于5时获胜",
    category: AchievementCategory.Skill,
    rarity: AchievementRarity.Epic,
    condition: { type: "low_hp_win", target: 1, current: 0 },
    reward: { gold: 1000, cardPacks: 2 },
    icon: "🔄",
    unlocked: false,
  },

  // 赛季类
  {
    id: "reach_gold",
    name: "黄金玩家",
    description: "达到黄金段位",
    category: AchievementCategory.Season,
    rarity: AchievementRarity.Rare,
    condition: { type: "reach_tier", target: 3, current: 0 },
    reward: { gold: 1000, cardPacks: 3 },
    icon: "🥇",
    unlocked: false,
  },
  {
    id: "reach_legend",
    name: "传说玩家",
    description: "达到传说段位",
    category: AchievementCategory.Season,
    rarity: AchievementRarity.Legendary,
    condition: { type: "reach_tier", target: 7, current: 0 },
    reward: { gold: 10000, cardPacks: 20, title: "传说玩家" },
    icon: "🌟",
    unlocked: false,
  },
];

export class AchievementSystem {
  private playerProgress: Map<string, PlayerAchievementProgress> = new Map();
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 监听各种游戏事件
  }

  /**
   * 获取玩家成就进度
   */
  getPlayerProgress(playerId: string): PlayerAchievementProgress {
    let progress = this.playerProgress.get(playerId);

    if (!progress) {
      progress = {
        playerId,
        achievements: new Map(),
        unlockedCount: 0,
        totalPoints: 0,
      };

      // 初始化所有成就
      ACHIEVEMENT_DEFINITIONS.forEach((achievement) => {
        progress!.achievements.set(achievement.id, { ...achievement });
      });

      this.playerProgress.set(playerId, progress);
    }

    return progress;
  }

  /**
   * 触发成就事件
   */
  triggerEvent(playerId: string, eventType: string, value: number = 1): Achievement[] {
    const progress = this.getPlayerProgress(playerId);
    const unlockedAchievements: Achievement[] = [];

    progress.achievements.forEach((achievement) => {
      if (achievement.unlocked) return;

      // 检查条件类型是否匹配
      if (achievement.condition.type === eventType) {
        achievement.condition.current += value;

        // 检查是否达成
        if (achievement.condition.current >= achievement.condition.target) {
          achievement.unlocked = true;
          achievement.unlockedAt = Date.now();
          progress.unlockedCount++;
          progress.totalPoints += this.getAchievementPoints(achievement.rarity);

          unlockedAchievements.push(achievement);

          // 发放奖励
          this.grantReward(playerId, achievement.reward);
        }
      }
    });

    return unlockedAchievements;
  }

  /**
   * 根据稀有度获取成就点数
   */
  private getAchievementPoints(rarity: AchievementRarity): number {
    switch (rarity) {
      case AchievementRarity.Common:
        return 10;
      case AchievementRarity.Rare:
        return 25;
      case AchievementRarity.Epic:
        return 50;
      case AchievementRarity.Legendary:
        return 100;
      default:
        return 0;
    }
  }

  /**
   * 发放成就奖励
   */
  private grantReward(playerId: string, reward: Achievement["reward"]): void {
    console.log(`[Achievement] Player ${playerId} received reward:`, reward);
    // 实际项目中应该调用货币系统、卡包系统等
  }

  /**
   * 获取所有成就
   */
  getAllAchievements(playerId: string, includeHidden: boolean = false): Achievement[] {
    const progress = this.getPlayerProgress(playerId);
    const achievements = Array.from(progress.achievements.values());

    if (!includeHidden) {
      return achievements.filter((a) => !a.hidden || a.unlocked);
    }

    return achievements;
  }

  /**
   * 获取分类成就
   */
  getAchievementsByCategory(
    playerId: string,
    category: AchievementCategory
  ): Achievement[] {
    const progress = this.getPlayerProgress(playerId);
    return Array.from(progress.achievements.values()).filter(
      (a) => a.category === category
    );
  }

  /**
   * 获取最近解锁的成就
   */
  getRecentlyUnlocked(playerId: string, limit: number = 5): Achievement[] {
    const progress = this.getPlayerProgress(playerId);
    return Array.from(progress.achievements.values())
      .filter((a) => a.unlocked)
      .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
      .slice(0, limit);
  }

  /**
   * 获取成就完成度百分比
   */
  getCompletionPercentage(playerId: string): number {
    const progress = this.getPlayerProgress(playerId);
    const total = progress.achievements.size;
    const unlocked = progress.unlockedCount;
    return (unlocked / total) * 100;
  }
}

// 全局成就系统实例
export const achievementSystem = new AchievementSystem();
