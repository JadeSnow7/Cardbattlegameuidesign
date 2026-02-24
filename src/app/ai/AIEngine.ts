import { CardData, GameCommand } from "../types/game";
import { MAX_BOARD_SIZE } from "../constants";

// AI难度等级
export enum AIDifficulty {
  Easy = "Easy",
  Normal = "Normal",
  Hard = "Hard",
  Expert = "Expert",
}

// 局面评估结果
interface BoardEvaluation {
  score: number;
  heroHP: number;
  boardAttack: number;
  boardHP: number;
  handValue: number;
  tauntBonus: number;
  enemyThreat: number;
}

// AI决策引擎
export class AIEngine {
  private difficulty: AIDifficulty;

  constructor(difficulty: AIDifficulty = AIDifficulty.Normal) {
    this.difficulty = difficulty;
  }

  /**
   * 评估当前局面得分
   */
  evaluateBoard(
    myHP: number,
    myBoard: CardData[],
    myHand: CardData[],
    enemyHP: number,
    enemyBoard: CardData[]
  ): BoardEvaluation {
    const boardAttack = myBoard.reduce((sum, card) => sum + (card.attack || 0), 0);
    const boardHP = myBoard.reduce((sum, card) => sum + (card.currentHealth || 0), 0);
    const handValue = myHand.reduce((sum, card) => sum + (card.cost || 0) * 0.5, 0);
    const tauntBonus = myBoard.filter((c) => c.keywords?.includes("嘲讽")).length * 0.7;
    const enemyThreat = enemyBoard.reduce((sum, card) => sum + (card.attack || 0), 0);

    const score =
      myHP * 1.5 +
      boardAttack * 1.2 +
      boardHP * 0.8 +
      handValue * 0.5 +
      tauntBonus * 0.7 -
      enemyThreat * 1.0;

    return {
      score,
      heroHP: myHP,
      boardAttack,
      boardHP,
      handValue,
      tauntBonus,
      enemyThreat,
    };
  }

  /**
   * 生成AI的行动指令
   */
  generateAction(
    myHP: number,
    myArmor: number,
    myMana: number,
    myBoard: CardData[],
    myHand: CardData[],
    enemyHP: number,
    enemyArmor: number,
    enemyBoard: CardData[]
  ): GameCommand[] {
    const commands: GameCommand[] = [];

    switch (this.difficulty) {
      case AIDifficulty.Easy:
        return this.easyStrategy(myMana, myBoard, myHand, enemyBoard);
      case AIDifficulty.Normal:
        return this.normalStrategy(myMana, myBoard, myHand, enemyHP, enemyBoard);
      case AIDifficulty.Hard:
        return this.hardStrategy(
          myHP,
          myMana,
          myBoard,
          myHand,
          enemyHP,
          enemyBoard
        );
      default:
        return this.easyStrategy(myMana, myBoard, myHand, enemyBoard);
    }
  }

  /**
   * Easy难度：随机合法出牌
   */
  private easyStrategy(
    mana: number,
    board: CardData[],
    hand: CardData[],
    enemyBoard: CardData[]
  ): GameCommand[] {
    const commands: GameCommand[] = [];

    // 随机出牌
    const playableCards = hand.filter((card) => card.cost <= mana && board.length < MAX_BOARD_SIZE);
    if (playableCards.length > 0 && Math.random() > 0.3) {
      const randomCard = playableCards[Math.floor(Math.random() * playableCards.length)];
      commands.push({
        type: "PlayCard",
        playerId: "ai",
        cardId: randomCard.id,
        slotIndex: board.length,
      });
      mana -= randomCard.cost;
    }

    // 随机攻击
    const attackers = board.filter((card) => card.canAttack);
    attackers.forEach((attacker) => {
      if (Math.random() > 0.5 && enemyBoard.length > 0) {
        const randomTarget =
          enemyBoard[Math.floor(Math.random() * enemyBoard.length)];
        commands.push({
          type: "Attack",
          playerId: "ai",
          cardId: attacker.id,
          targetId: randomTarget.id,
        });
      } else if (Math.random() > 0.3) {
        // 攻击英雄
        commands.push({
          type: "Attack",
          playerId: "ai",
          cardId: attacker.id,
          targetId: "player_hero",
        });
      }
    });

    commands.push({
      type: "EndTurn",
      playerId: "ai",
    });

    return commands;
  }

  /**
   * Normal难度：贪心策略（最大化攻击/费用利用率）
   */
  private normalStrategy(
    mana: number,
    board: CardData[],
    hand: CardData[],
    enemyHP: number,
    enemyBoard: CardData[]
  ): GameCommand[] {
    const commands: GameCommand[] = [];
    let remainingMana = mana;

    // 1. 优先出高费卡
    const playableCards = hand
      .filter((card) => card.cost <= remainingMana && board.length < MAX_BOARD_SIZE)
      .sort((a, b) => (b.cost || 0) - (a.cost || 0));

    for (const card of playableCards) {
      if (card.cost <= remainingMana && board.length < MAX_BOARD_SIZE) {
        commands.push({
          type: "PlayCard",
          playerId: "ai",
          cardId: card.id,
          slotIndex: board.length,
        });
        remainingMana -= card.cost;
        board.push(card);
      }
    }

    // 2. 计算是否可以斩杀
    const totalDamage = board
      .filter((card) => card.canAttack)
      .reduce((sum, card) => sum + (card.attack || 0), 0);

    if (totalDamage >= enemyHP) {
      // 全力攻击英雄
      board.filter((card) => card.canAttack).forEach((attacker) => {
        commands.push({
          type: "Attack",
          playerId: "ai",
          cardId: attacker.id,
          targetId: "player_hero",
        });
      });
    } else {
      // 3. 优先解场（攻击敌方随从）
      const attackers = board.filter((card) => card.canAttack);
      const hasTaunt = enemyBoard.some((card) => card.keywords?.includes("嘲讽"));

      attackers.forEach((attacker) => {
        if (hasTaunt) {
          // 必须攻击嘲讽
          const tauntTargets = enemyBoard.filter((card) =>
            card.keywords?.includes("嘲讽")
          );
          if (tauntTargets.length > 0) {
            // 选择生命最低的嘲讽
            const target = tauntTargets.sort(
              (a, b) => (a.currentHealth || 0) - (b.currentHealth || 0)
            )[0];
            commands.push({
              type: "Attack",
              playerId: "ai",
              cardId: attacker.id,
              targetId: target.id,
            });
          }
        } else {
          // 优先击杀攻击力高的敌方随从
          const targets = enemyBoard
            .filter((card) => (card.currentHealth || 0) <= (attacker.attack || 0))
            .sort((a, b) => (b.attack || 0) - (a.attack || 0));

          if (targets.length > 0) {
            commands.push({
              type: "Attack",
              playerId: "ai",
              cardId: attacker.id,
              targetId: targets[0].id,
            });
          } else {
            // 攻击英雄
            commands.push({
              type: "Attack",
              playerId: "ai",
              cardId: attacker.id,
              targetId: "player_hero",
            });
          }
        }
      });
    }

    commands.push({
      type: "EndTurn",
      playerId: "ai",
    });

    return commands;
  }

  /**
   * Hard难度：Minimax + 启发式
   */
  private hardStrategy(
    myHP: number,
    mana: number,
    board: CardData[],
    hand: CardData[],
    enemyHP: number,
    enemyBoard: CardData[]
  ): GameCommand[] {
    // 简化版Minimax：评估多种可能的出牌组合
    const commands: GameCommand[] = [];
    let remainingMana = mana;
    let currentBoard = [...board];

    // 生成所有可能的出牌组合
    const playSequences = this.generatePlaySequences(hand, remainingMana, currentBoard);

    // 评估每种组合
    let bestSequence: GameCommand[] = [];
    let bestScore = -Infinity;

    for (const sequence of playSequences) {
      const simulatedBoard = this.simulatePlay(currentBoard, sequence);
      const evaluation = this.evaluateBoard(
        myHP,
        simulatedBoard,
        hand,
        enemyHP,
        enemyBoard
      );

      if (evaluation.score > bestScore) {
        bestScore = evaluation.score;
        bestSequence = sequence;
      }
    }

    commands.push(...bestSequence);

    // ��能攻击决策
    const attackCommands = this.generateSmartAttacks(currentBoard, enemyBoard, enemyHP);
    commands.push(...attackCommands);

    commands.push({
      type: "EndTurn",
      playerId: "ai",
    });

    return commands;
  }

  /**
   * 生成所有可能的出牌序列
   */
  private generatePlaySequences(
    hand: CardData[],
    mana: number,
    board: CardData[]
  ): GameCommand[][] {
    const sequences: GameCommand[][] = [];
    const playableCards = hand.filter((card) => card.cost <= mana && board.length < MAX_BOARD_SIZE);

    // 简化：只考虑单张卡的出牌
    sequences.push([]); // 不出牌

    for (const card of playableCards) {
      sequences.push([
        {
          type: "PlayCard",
          playerId: "ai",
          cardId: card.id,
          slotIndex: board.length,
        },
      ]);
    }

    return sequences;
  }

  /**
   * 模拟出牌
   */
  private simulatePlay(board: CardData[], commands: GameCommand[]): CardData[] {
    const simBoard = [...board];
    // 简化模拟
    return simBoard;
  }

  /**
   * 生成智能攻击指令
   */
  private generateSmartAttacks(
    myBoard: CardData[],
    enemyBoard: CardData[],
    enemyHP: number
  ): GameCommand[] {
    const commands: GameCommand[] = [];
    const attackers = myBoard.filter((card) => card.canAttack);

    // 计算斩杀线
    const totalDamage = attackers.reduce((sum, card) => sum + (card.attack || 0), 0);

    if (totalDamage >= enemyHP) {
      // 斩杀
      attackers.forEach((attacker) => {
        commands.push({
          type: "Attack",
          playerId: "ai",
          cardId: attacker.id,
          targetId: "player_hero",
        });
      });
    } else {
      // 优先换优势
      attackers.forEach((attacker) => {
        const favorableTargets = enemyBoard.filter(
          (target) =>
            (target.currentHealth || 0) <= (attacker.attack || 0) &&
            (attacker.currentHealth || 0) > (target.attack || 0)
        );

        if (favorableTargets.length > 0) {
          // 优先击杀高攻击
          const target = favorableTargets.sort(
            (a, b) => (b.attack || 0) - (a.attack || 0)
          )[0];
          commands.push({
            type: "Attack",
            playerId: "ai",
            cardId: attacker.id,
            targetId: target.id,
          });
        } else {
          // 打脸
          commands.push({
            type: "Attack",
            playerId: "ai",
            cardId: attacker.id,
            targetId: "player_hero",
          });
        }
      });
    }

    return commands;
  }
}
