import { MAX_BOARD_SIZE, MAX_HAND_SIZE } from "../constants";

/**
 * 逻辑 UI 组件标识枚举
 *
 * 每个值唯一对应一个可被动画 / 回放 / 旁观系统寻址的 UI 节点。
 * 命名规则：{Owner}{Component}_{Index?}
 */
export enum UIKey {
  // ── Heroes ────────────────────────────────────────────────────
  PlayerHero = "PlayerHero",
  EnemyHero = "EnemyHero",

  // ── Hand containers ───────────────────────────────────────────
  PlayerHand = "PlayerHand",
  EnemyHand = "EnemyHand",

  // ── Deck zones ────────────────────────────────────────────────
  PlayerDeck = "PlayerDeck",
  EnemyDeck = "EnemyDeck",

  // ── Player Board Slots (0‑6) ──────────────────────────────────
  PlayerBoardSlot_0 = "PlayerBoardSlot_0",
  PlayerBoardSlot_1 = "PlayerBoardSlot_1",
  PlayerBoardSlot_2 = "PlayerBoardSlot_2",
  PlayerBoardSlot_3 = "PlayerBoardSlot_3",
  PlayerBoardSlot_4 = "PlayerBoardSlot_4",
  PlayerBoardSlot_5 = "PlayerBoardSlot_5",
  PlayerBoardSlot_6 = "PlayerBoardSlot_6",

  // ── Enemy Board Slots (0‑6) ───────────────────────────────────
  EnemyBoardSlot_0 = "EnemyBoardSlot_0",
  EnemyBoardSlot_1 = "EnemyBoardSlot_1",
  EnemyBoardSlot_2 = "EnemyBoardSlot_2",
  EnemyBoardSlot_3 = "EnemyBoardSlot_3",
  EnemyBoardSlot_4 = "EnemyBoardSlot_4",
  EnemyBoardSlot_5 = "EnemyBoardSlot_5",
  EnemyBoardSlot_6 = "EnemyBoardSlot_6",

  // ── Player Hand Slots (0‑9) ───────────────────────────────────
  PlayerHandSlot_0 = "PlayerHandSlot_0",
  PlayerHandSlot_1 = "PlayerHandSlot_1",
  PlayerHandSlot_2 = "PlayerHandSlot_2",
  PlayerHandSlot_3 = "PlayerHandSlot_3",
  PlayerHandSlot_4 = "PlayerHandSlot_4",
  PlayerHandSlot_5 = "PlayerHandSlot_5",
  PlayerHandSlot_6 = "PlayerHandSlot_6",
  PlayerHandSlot_7 = "PlayerHandSlot_7",
  PlayerHandSlot_8 = "PlayerHandSlot_8",
  PlayerHandSlot_9 = "PlayerHandSlot_9",

  // ── Enemy Hand Slots (0‑9) ────────────────────────────────────
  EnemyHandSlot_0 = "EnemyHandSlot_0",
  EnemyHandSlot_1 = "EnemyHandSlot_1",
  EnemyHandSlot_2 = "EnemyHandSlot_2",
  EnemyHandSlot_3 = "EnemyHandSlot_3",
  EnemyHandSlot_4 = "EnemyHandSlot_4",
  EnemyHandSlot_5 = "EnemyHandSlot_5",
  EnemyHandSlot_6 = "EnemyHandSlot_6",
  EnemyHandSlot_7 = "EnemyHandSlot_7",
  EnemyHandSlot_8 = "EnemyHandSlot_8",
  EnemyHandSlot_9 = "EnemyHandSlot_9",

  // ── Controls ──────────────────────────────────────────────────
  EndTurnButton = "EndTurnButton",
  HeroSkillButton = "HeroSkillButton",
  ManaCrystalBar = "ManaCrystalBar",
  TurnIndicator = "TurnIndicator",

  // ── Effect Layers ─────────────────────────────────────────────
  DamageNumberLayer = "DamageNumberLayer",
  SpellEffectLayer = "SpellEffectLayer",

  // ── Future: DeckBuilder / Spectator ───────────────────────────
  DeckBuilderPanel = "DeckBuilderPanel",
  SpectatorOverlay = "SpectatorOverlay",
}

// ── Indexed slot lookup tables ──────────────────────────────────

const PLAYER_BOARD_SLOTS: readonly UIKey[] = [
  UIKey.PlayerBoardSlot_0,
  UIKey.PlayerBoardSlot_1,
  UIKey.PlayerBoardSlot_2,
  UIKey.PlayerBoardSlot_3,
  UIKey.PlayerBoardSlot_4,
  UIKey.PlayerBoardSlot_5,
  UIKey.PlayerBoardSlot_6,
] as const;

const ENEMY_BOARD_SLOTS: readonly UIKey[] = [
  UIKey.EnemyBoardSlot_0,
  UIKey.EnemyBoardSlot_1,
  UIKey.EnemyBoardSlot_2,
  UIKey.EnemyBoardSlot_3,
  UIKey.EnemyBoardSlot_4,
  UIKey.EnemyBoardSlot_5,
  UIKey.EnemyBoardSlot_6,
] as const;

const PLAYER_HAND_SLOTS: readonly UIKey[] = [
  UIKey.PlayerHandSlot_0,
  UIKey.PlayerHandSlot_1,
  UIKey.PlayerHandSlot_2,
  UIKey.PlayerHandSlot_3,
  UIKey.PlayerHandSlot_4,
  UIKey.PlayerHandSlot_5,
  UIKey.PlayerHandSlot_6,
  UIKey.PlayerHandSlot_7,
  UIKey.PlayerHandSlot_8,
  UIKey.PlayerHandSlot_9,
] as const;

const ENEMY_HAND_SLOTS: readonly UIKey[] = [
  UIKey.EnemyHandSlot_0,
  UIKey.EnemyHandSlot_1,
  UIKey.EnemyHandSlot_2,
  UIKey.EnemyHandSlot_3,
  UIKey.EnemyHandSlot_4,
  UIKey.EnemyHandSlot_5,
  UIKey.EnemyHandSlot_6,
  UIKey.EnemyHandSlot_7,
  UIKey.EnemyHandSlot_8,
  UIKey.EnemyHandSlot_9,
] as const;

// ── Helpers ─────────────────────────────────────────────────────

/** Return the UIKey for a player board slot by index (0‑6). */
export function playerBoardSlot(index: number): UIKey {
  if (index < 0 || index >= MAX_BOARD_SIZE) {
    throw new RangeError(`playerBoardSlot index ${index} out of range [0, ${MAX_BOARD_SIZE})`);
  }
  return PLAYER_BOARD_SLOTS[index];
}

/** Return the UIKey for an enemy board slot by index (0‑6). */
export function enemyBoardSlot(index: number): UIKey {
  if (index < 0 || index >= MAX_BOARD_SIZE) {
    throw new RangeError(`enemyBoardSlot index ${index} out of range [0, ${MAX_BOARD_SIZE})`);
  }
  return ENEMY_BOARD_SLOTS[index];
}

/** Return the UIKey for a player hand slot by index (0‑9). */
export function playerHandSlot(index: number): UIKey {
  if (index < 0 || index >= MAX_HAND_SIZE) {
    throw new RangeError(`playerHandSlot index ${index} out of range [0, ${MAX_HAND_SIZE})`);
  }
  return PLAYER_HAND_SLOTS[index];
}

/** Return the UIKey for an enemy hand slot by index (0‑9). */
export function enemyHandSlot(index: number): UIKey {
  if (index < 0 || index >= MAX_HAND_SIZE) {
    throw new RangeError(`enemyHandSlot index ${index} out of range [0, ${MAX_HAND_SIZE})`);
  }
  return ENEMY_HAND_SLOTS[index];
}

/** Check whether a UIKey represents a board slot. */
export function isBoardSlotKey(key: UIKey): boolean {
  return key.startsWith("PlayerBoardSlot_") || key.startsWith("EnemyBoardSlot_");
}

/** Check whether a UIKey represents a hand slot. */
export function isHandSlotKey(key: UIKey): boolean {
  return key.startsWith("PlayerHandSlot_") || key.startsWith("EnemyHandSlot_");
}

/** Check whether a UIKey belongs to the player side. */
export function isPlayerSide(key: UIKey): boolean {
  return key.startsWith("Player");
}
