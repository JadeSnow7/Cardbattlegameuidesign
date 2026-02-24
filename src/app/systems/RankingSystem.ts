// 排行榜系统 - ELO评分模型

export enum RankTier {
  Bronze = "Bronze",
  Silver = "Silver",
  Gold = "Gold",
  Platinum = "Platinum",
  Diamond = "Diamond",
  Master = "Master",
  Legend = "Legend",
}

export interface PlayerRanking {
  playerId: string;
  playerName: string;
  mmr: number; // Match Making Rating
  tier: RankTier;
  division: number; // 1-5 (5最低)
  winCount: number;
  lossCount: number;
  winRate: number;
  matchCount: number;
  seasonRank: number;
  seasonId: string;
  lastMatchTime: number;
}

export interface MatchResult {
  playerId: string;
  opponentId: string;
  isWin: boolean;
  playerMMR: number;
  opponentMMR: number;
  mmrChange: number;
}

// ELO K因子配置
const K_FACTORS = {
  [RankTier.Bronze]: 32,
  [RankTier.Silver]: 28,
  [RankTier.Gold]: 24,
  [RankTier.Platinum]: 20,
  [RankTier.Diamond]: 16,
  [RankTier.Master]: 12,
  [RankTier.Legend]: 8,
};

// MMR对应的段位
const TIER_THRESHOLDS = {
  [RankTier.Bronze]: 0,
  [RankTier.Silver]: 1000,
  [RankTier.Gold]: 1500,
  [RankTier.Platinum]: 2000,
  [RankTier.Diamond]: 2500,
  [RankTier.Master]: 3000,
  [RankTier.Legend]: 3500,
};

export class RankingSystem {
  private playerRankings: Map<string, PlayerRanking> = new Map();
  private currentSeasonId: string;

  constructor(seasonId?: string) {
    this.currentSeasonId = seasonId || this.generateSeasonId();
  }

  /**
   * 生成赛季ID
   */
  private generateSeasonId(): string {
    const now = new Date();
    return `S${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  /**
   * 计算预期胜率（ELO公式）
   */
  private calculateExpectedScore(playerMMR: number, opponentMMR: number): number {
    return 1 / (1 + Math.pow(10, (opponentMMR - playerMMR) / 400));
  }

  /**
   * 根据MMR获取段位
   */
  private getTierFromMMR(mmr: number): RankTier {
    if (mmr >= TIER_THRESHOLDS[RankTier.Legend]) return RankTier.Legend;
    if (mmr >= TIER_THRESHOLDS[RankTier.Master]) return RankTier.Master;
    if (mmr >= TIER_THRESHOLDS[RankTier.Diamond]) return RankTier.Diamond;
    if (mmr >= TIER_THRESHOLDS[RankTier.Platinum]) return RankTier.Platinum;
    if (mmr >= TIER_THRESHOLDS[RankTier.Gold]) return RankTier.Gold;
    if (mmr >= TIER_THRESHOLDS[RankTier.Silver]) return RankTier.Silver;
    return RankTier.Bronze;
  }

  /**
   * 根据MMR计算段位分级
   */
  private getDivisionFromMMR(mmr: number, tier: RankTier): number {
    const tierMMR = TIER_THRESHOLDS[tier];
    const nextTierIndex = Object.values(RankTier).indexOf(tier) + 1;
    const nextTier = Object.values(RankTier)[nextTierIndex];
    const nextTierMMR = TIER_THRESHOLDS[nextTier] || tierMMR + 500;

    const tierRange = nextTierMMR - tierMMR;
    const progress = (mmr - tierMMR) / tierRange;

    return Math.max(1, Math.min(5, 6 - Math.ceil(progress * 5)));
  }

  /**
   * 获取玩家排名数据
   */
  getPlayerRanking(playerId: string): PlayerRanking | null {
    return this.playerRankings.get(playerId) || null;
  }

  /**
   * 初始化玩家排名
   */
  initializePlayer(playerId: string, playerName: string): PlayerRanking {
    const initialMMR = 1000;
    const ranking: PlayerRanking = {
      playerId,
      playerName,
      mmr: initialMMR,
      tier: this.getTierFromMMR(initialMMR),
      division: 3,
      winCount: 0,
      lossCount: 0,
      winRate: 0,
      matchCount: 0,
      seasonRank: 0,
      seasonId: this.currentSeasonId,
      lastMatchTime: Date.now(),
    };

    this.playerRankings.set(playerId, ranking);
    return ranking;
  }

  /**
   * 更新比赛结果
   */
  updateMatchResult(
    playerId: string,
    opponentId: string,
    isWin: boolean
  ): MatchResult {
    let playerRanking = this.playerRankings.get(playerId);
    let opponentRanking = this.playerRankings.get(opponentId);

    // 如果玩家不存在，初始化
    if (!playerRanking) {
      playerRanking = this.initializePlayer(playerId, `Player_${playerId}`);
    }
    if (!opponentRanking) {
      opponentRanking = this.initializePlayer(opponentId, `Player_${opponentId}`);
    }

    const playerMMR = playerRanking.mmr;
    const opponentMMR = opponentRanking.mmr;

    // 计算预期胜率
    const expectedScore = this.calculateExpectedScore(playerMMR, opponentMMR);

    // 实际结果
    const actualScore = isWin ? 1 : 0;

    // 计算MMR变化
    const kFactor = K_FACTORS[playerRanking.tier];
    const mmrChange = Math.round(kFactor * (actualScore - expectedScore));

    // 更新玩家MMR
    playerRanking.mmr = Math.max(0, playerRanking.mmr + mmrChange);
    playerRanking.tier = this.getTierFromMMR(playerRanking.mmr);
    playerRanking.division = this.getDivisionFromMMR(playerRanking.mmr, playerRanking.tier);
    playerRanking.matchCount++;
    playerRanking.lastMatchTime = Date.now();

    if (isWin) {
      playerRanking.winCount++;
    } else {
      playerRanking.lossCount++;
    }

    playerRanking.winRate = playerRanking.winCount / playerRanking.matchCount;

    // 同样更新对手的MMR
    const opponentExpectedScore = this.calculateExpectedScore(opponentMMR, playerMMR);
    const opponentActualScore = isWin ? 0 : 1;
    const opponentKFactor = K_FACTORS[opponentRanking.tier];
    const opponentMMRChange = Math.round(
      opponentKFactor * (opponentActualScore - opponentExpectedScore)
    );

    opponentRanking.mmr = Math.max(0, opponentRanking.mmr + opponentMMRChange);
    opponentRanking.tier = this.getTierFromMMR(opponentRanking.mmr);
    opponentRanking.division = this.getDivisionFromMMR(
      opponentRanking.mmr,
      opponentRanking.tier
    );
    opponentRanking.matchCount++;

    if (!isWin) {
      opponentRanking.winCount++;
    } else {
      opponentRanking.lossCount++;
    }

    opponentRanking.winRate = opponentRanking.winCount / opponentRanking.matchCount;

    return {
      playerId,
      opponentId,
      isWin,
      playerMMR,
      opponentMMR,
      mmrChange,
    };
  }

  /**
   * 获取排行榜（前N名）
   */
  getLeaderboard(limit: number = 100): PlayerRanking[] {
    return Array.from(this.playerRankings.values())
      .sort((a, b) => b.mmr - a.mmr)
      .slice(0, limit)
      .map((ranking, index) => ({
        ...ranking,
        seasonRank: index + 1,
      }));
  }

  /**
   * 重置赛季
   */
  resetSeason(): void {
    this.currentSeasonId = this.generateSeasonId();

    // 软重置：保留部分MMR
    this.playerRankings.forEach((ranking) => {
      const softResetMMR = Math.floor(ranking.mmr * 0.5 + 500);
      ranking.mmr = softResetMMR;
      ranking.tier = this.getTierFromMMR(softResetMMR);
      ranking.division = this.getDivisionFromMMR(softResetMMR, ranking.tier);
      ranking.winCount = 0;
      ranking.lossCount = 0;
      ranking.matchCount = 0;
      ranking.winRate = 0;
      ranking.seasonRank = 0;
      ranking.seasonId = this.currentSeasonId;
    });
  }

  /**
   * 匹配合适的对手
   */
  findMatchingOpponent(playerId: string): PlayerRanking | null {
    const playerRanking = this.playerRankings.get(playerId);
    if (!playerRanking) return null;

    const playerMMR = playerRanking.mmr;
    const mmrRange = 200;

    // 查找MMR接近的对手
    const candidates = Array.from(this.playerRankings.values()).filter(
      (ranking) =>
        ranking.playerId !== playerId &&
        Math.abs(ranking.mmr - playerMMR) <= mmrRange
    );

    if (candidates.length === 0) {
      // 扩大范围
      return Array.from(this.playerRankings.values()).find(
        (ranking) => ranking.playerId !== playerId
      ) || null;
    }

    // 返回最接近的对手
    return candidates.sort(
      (a, b) => Math.abs(a.mmr - playerMMR) - Math.abs(b.mmr - playerMMR)
    )[0];
  }
}

// 全局排行榜实例
export const rankingSystem = new RankingSystem();
