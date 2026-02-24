import { UIKey } from "./uiKeys";

/**
 * UIKey → Figma Node‑ID 映射表
 *
 * 每条目的值是 Figma 节点 ID 占位符。实际接入 Figma 后，
 * 可通过 Figma REST API (`/v1/files/:key/nodes`) 或
 * Figma Plugin API (`figma.getNodeById()`) 解析为真实节点。
 *
 * 占位符命名规则：NODE_ID_{SCREAMING_SNAKE_CASE(UIKey)}
 * 更新方式：运行 Figma 导出脚本自动填充或手工替换。
 */
export const UI_NODE_MAP: Readonly<Record<UIKey, string>> = {
  // Heroes
  [UIKey.PlayerHero]: "NODE_ID_PLAYER_HERO",
  [UIKey.EnemyHero]: "NODE_ID_ENEMY_HERO",

  // Hand containers
  [UIKey.PlayerHand]: "NODE_ID_PLAYER_HAND",
  [UIKey.EnemyHand]: "NODE_ID_ENEMY_HAND",

  // Deck zones
  [UIKey.PlayerDeck]: "NODE_ID_PLAYER_DECK",
  [UIKey.EnemyDeck]: "NODE_ID_ENEMY_DECK",

  // Player Board Slots
  [UIKey.PlayerBoardSlot_0]: "NODE_ID_PLAYER_BOARD_SLOT_0",
  [UIKey.PlayerBoardSlot_1]: "NODE_ID_PLAYER_BOARD_SLOT_1",
  [UIKey.PlayerBoardSlot_2]: "NODE_ID_PLAYER_BOARD_SLOT_2",
  [UIKey.PlayerBoardSlot_3]: "NODE_ID_PLAYER_BOARD_SLOT_3",
  [UIKey.PlayerBoardSlot_4]: "NODE_ID_PLAYER_BOARD_SLOT_4",
  [UIKey.PlayerBoardSlot_5]: "NODE_ID_PLAYER_BOARD_SLOT_5",
  [UIKey.PlayerBoardSlot_6]: "NODE_ID_PLAYER_BOARD_SLOT_6",

  // Enemy Board Slots
  [UIKey.EnemyBoardSlot_0]: "NODE_ID_ENEMY_BOARD_SLOT_0",
  [UIKey.EnemyBoardSlot_1]: "NODE_ID_ENEMY_BOARD_SLOT_1",
  [UIKey.EnemyBoardSlot_2]: "NODE_ID_ENEMY_BOARD_SLOT_2",
  [UIKey.EnemyBoardSlot_3]: "NODE_ID_ENEMY_BOARD_SLOT_3",
  [UIKey.EnemyBoardSlot_4]: "NODE_ID_ENEMY_BOARD_SLOT_4",
  [UIKey.EnemyBoardSlot_5]: "NODE_ID_ENEMY_BOARD_SLOT_5",
  [UIKey.EnemyBoardSlot_6]: "NODE_ID_ENEMY_BOARD_SLOT_6",

  // Player Hand Slots
  [UIKey.PlayerHandSlot_0]: "NODE_ID_PLAYER_HAND_SLOT_0",
  [UIKey.PlayerHandSlot_1]: "NODE_ID_PLAYER_HAND_SLOT_1",
  [UIKey.PlayerHandSlot_2]: "NODE_ID_PLAYER_HAND_SLOT_2",
  [UIKey.PlayerHandSlot_3]: "NODE_ID_PLAYER_HAND_SLOT_3",
  [UIKey.PlayerHandSlot_4]: "NODE_ID_PLAYER_HAND_SLOT_4",
  [UIKey.PlayerHandSlot_5]: "NODE_ID_PLAYER_HAND_SLOT_5",
  [UIKey.PlayerHandSlot_6]: "NODE_ID_PLAYER_HAND_SLOT_6",
  [UIKey.PlayerHandSlot_7]: "NODE_ID_PLAYER_HAND_SLOT_7",
  [UIKey.PlayerHandSlot_8]: "NODE_ID_PLAYER_HAND_SLOT_8",
  [UIKey.PlayerHandSlot_9]: "NODE_ID_PLAYER_HAND_SLOT_9",

  // Enemy Hand Slots
  [UIKey.EnemyHandSlot_0]: "NODE_ID_ENEMY_HAND_SLOT_0",
  [UIKey.EnemyHandSlot_1]: "NODE_ID_ENEMY_HAND_SLOT_1",
  [UIKey.EnemyHandSlot_2]: "NODE_ID_ENEMY_HAND_SLOT_2",
  [UIKey.EnemyHandSlot_3]: "NODE_ID_ENEMY_HAND_SLOT_3",
  [UIKey.EnemyHandSlot_4]: "NODE_ID_ENEMY_HAND_SLOT_4",
  [UIKey.EnemyHandSlot_5]: "NODE_ID_ENEMY_HAND_SLOT_5",
  [UIKey.EnemyHandSlot_6]: "NODE_ID_ENEMY_HAND_SLOT_6",
  [UIKey.EnemyHandSlot_7]: "NODE_ID_ENEMY_HAND_SLOT_7",
  [UIKey.EnemyHandSlot_8]: "NODE_ID_ENEMY_HAND_SLOT_8",
  [UIKey.EnemyHandSlot_9]: "NODE_ID_ENEMY_HAND_SLOT_9",

  // Controls
  [UIKey.EndTurnButton]: "NODE_ID_END_TURN_BUTTON",
  [UIKey.HeroSkillButton]: "NODE_ID_HERO_SKILL_BUTTON",
  [UIKey.ManaCrystalBar]: "NODE_ID_MANA_CRYSTAL_BAR",
  [UIKey.TurnIndicator]: "NODE_ID_TURN_INDICATOR",

  // Effect Layers
  [UIKey.DamageNumberLayer]: "NODE_ID_DAMAGE_NUMBER_LAYER",
  [UIKey.SpellEffectLayer]: "NODE_ID_SPELL_EFFECT_LAYER",

  // Future
  [UIKey.DeckBuilderPanel]: "NODE_ID_DECK_BUILDER_PANEL",
  [UIKey.SpectatorOverlay]: "NODE_ID_SPECTATOR_OVERLAY",
};
