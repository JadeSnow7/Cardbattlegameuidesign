import { CardData } from "../types/game";
import { UIKey, playerBoardSlot, enemyBoardSlot, playerHandSlot, enemyHandSlot } from "./uiKeys";
import { UI_NODE_MAP } from "./uiNodeMap";

/**
 * 绑定快照 — 可序列化的 [cardId, UIKey] 元组数组。
 * 用于 Network Sync、Replay 回滚时的确定性重建。
 */
export type BindingSnapshot = ReadonlyArray<readonly [string, UIKey]>;

/**
 * UI 适配器
 *
 * 负责维护 CardData.id ↔ UIKey 的运行时双向映射。
 * 纯映射逻辑，不含 React 生命周期、不修改 GameState。
 *
 * 线程模型：单写多读。由协调层（Game Loop / Command Executor）
 * 在每条 GameCommand 执行后同步调用 bind/unbind，
 * 动画队列和旁观系统只读查询。
 */
export class UIAdapter {
  /** cardId → UIKey */
  private readonly cardToKey = new Map<string, UIKey>();
  /** UIKey → cardId（反向索引，加速 slot 查询） */
  private readonly keyToCard = new Map<UIKey, string>();

  // ── 单条绑定 ──────────────────────────────────────────────────

  /** 将一张卡绑定到指定 UIKey（slot / hand 位等）。 */
  bindCard(cardId: string, uiKey: UIKey): void {
    // 先清理旧绑定
    const oldKey = this.cardToKey.get(cardId);
    if (oldKey !== undefined) {
      this.keyToCard.delete(oldKey);
    }
    const oldCard = this.keyToCard.get(uiKey);
    if (oldCard !== undefined) {
      this.cardToKey.delete(oldCard);
    }

    this.cardToKey.set(cardId, uiKey);
    this.keyToCard.set(uiKey, cardId);
  }

  /** 解除一张卡的绑定。 */
  unbindCard(cardId: string): void {
    const key = this.cardToKey.get(cardId);
    if (key !== undefined) {
      this.keyToCard.delete(key);
    }
    this.cardToKey.delete(cardId);
  }

  /** 根据 cardId 查询其绑定的 UIKey。 */
  getUIKey(cardId: string): UIKey | undefined {
    return this.cardToKey.get(cardId);
  }

  /** 根据 UIKey 查询绑定到该 slot 的 cardId。 */
  getCardId(uiKey: UIKey): string | undefined {
    return this.keyToCard.get(uiKey);
  }

  /** 根据 UIKey 查询对应的 Figma 节点 ID。 */
  getNodeId(uiKey: UIKey): string {
    return UI_NODE_MAP[uiKey];
  }

  // ── 英雄 ID 特殊解析 ─────────────────────────────────────────

  /**
   * 将游戏逻辑中的 sourceId / targetId 解析为 UIKey。
   *
   * 优先级:
   *  1. 保留字 "player_hero" / "enemy_hero" → 英雄 UIKey
   *  2. cardToKey 运行时绑定
   *  3. undefined（未绑定）
   */
  resolveId(id: string): UIKey | undefined {
    switch (id) {
      case "player_hero":
        return UIKey.PlayerHero;
      case "enemy_hero":
        return UIKey.EnemyHero;
      default:
        return this.cardToKey.get(id);
    }
  }

  // ── 批量操作 ──────────────────────────────────────────────────

  /**
   * 根据当前场面状态重建全部绑定。
   * 用于回合开始同步、网络重连、Replay 跳帧。
   */
  rebindBoard(playerBoard: CardData[], enemyBoard: CardData[]): void {
    // 清除所有 board slot 绑定
    for (let i = 0; i < 7; i++) {
      this.unbindSlot(playerBoardSlot(i));
      this.unbindSlot(enemyBoardSlot(i));
    }

    playerBoard.forEach((card, i) => {
      this.bindCard(card.id, playerBoardSlot(i));
    });

    enemyBoard.forEach((card, i) => {
      this.bindCard(card.id, enemyBoardSlot(i));
    });
  }

  /**
   * 根据当前手牌状态重建手牌绑定。
   */
  rebindHands(playerHand: CardData[], enemyHand: CardData[]): void {
    for (let i = 0; i < 10; i++) {
      this.unbindSlot(playerHandSlot(i));
      this.unbindSlot(enemyHandSlot(i));
    }

    playerHand.forEach((card, i) => {
      this.bindCard(card.id, playerHandSlot(i));
    });

    enemyHand.forEach((card, i) => {
      this.bindCard(card.id, enemyHandSlot(i));
    });
  }

  /**
   * 完整重建：场面 + 手牌。
   * 单次调用即可将 UIAdapter 恢复到与 GameState 一致的状态。
   */
  rebindAll(
    playerBoard: CardData[],
    enemyBoard: CardData[],
    playerHand: CardData[],
    enemyHand: CardData[],
  ): void {
    this.clearAll();
    this.rebindBoard(playerBoard, enemyBoard);
    this.rebindHands(playerHand, enemyHand);
  }

  /** 清除所有绑定。 */
  clearAll(): void {
    this.cardToKey.clear();
    this.keyToCard.clear();
  }

  // ── 快照 / 还原（用于 Rollback） ─────────────────────────────

  /** 导出当前绑定状态为可序列化的元组数组。 */
  snapshot(): BindingSnapshot {
    return Array.from(this.cardToKey.entries()).map(
      ([cardId, key]) => [cardId, key] as const,
    );
  }

  /** 从快照还原绑定状态（确定性重建）。 */
  restore(snap: BindingSnapshot): void {
    this.clearAll();
    for (const [cardId, key] of snap) {
      this.bindCard(cardId, key);
    }
  }

  // ── 查询工具 ──────────────────────────────────────────────────

  /** 当前绑定总数。 */
  get size(): number {
    return this.cardToKey.size;
  }

  /** 调试用：返回所有绑定的只读视图。 */
  debugDump(): ReadonlyMap<string, UIKey> {
    return this.cardToKey;
  }

  // ── 内部工具 ──────────────────────────────────────────────────

  private unbindSlot(uiKey: UIKey): void {
    const cardId = this.keyToCard.get(uiKey);
    if (cardId !== undefined) {
      this.cardToKey.delete(cardId);
      this.keyToCard.delete(uiKey);
    }
  }
}
