import { describe, it, expect, beforeEach } from "vitest";
import {
  UIKey,
  playerBoardSlot,
  enemyBoardSlot,
  playerHandSlot,
  enemyHandSlot,
  isBoardSlotKey,
  isHandSlotKey,
  isPlayerSide,
} from "./uiKeys";
import { UI_NODE_MAP } from "./uiNodeMap";
import { UIAdapter } from "./uiAdapter";
import { resolveAnimationUI } from "./resolveAnimationUI";
import { GameAnimation, AnimationPriority } from "../types/game";
import { CardData } from "../types/game";
import { MAX_BOARD_SIZE, MAX_HAND_SIZE } from "../constants";

// ── Helper ──────────────────────────────────────────────────────────
function makeMinion(id: string): CardData {
  return {
    id,
    name: "Test",
    cost: 1,
    attack: 2,
    health: 3,
    currentHealth: 3,
    image: "",
    description: "",
    type: "minion",
  };
}

function makeAnimation(overrides: Partial<GameAnimation> = {}): GameAnimation {
  return {
    id: "anim_1",
    type: "attack",
    priority: AnimationPriority.B,
    duration: 500,
    ...overrides,
  };
}

// ── UIKey helpers ───────────────────────────────────────────────────
describe("uiKeys helpers", () => {
  it("playerBoardSlot returns correct keys for 0-6", () => {
    expect(playerBoardSlot(0)).toBe(UIKey.PlayerBoardSlot_0);
    expect(playerBoardSlot(6)).toBe(UIKey.PlayerBoardSlot_6);
  });

  it("playerBoardSlot throws for out-of-range", () => {
    expect(() => playerBoardSlot(-1)).toThrow(RangeError);
    expect(() => playerBoardSlot(MAX_BOARD_SIZE)).toThrow(RangeError);
  });

  it("enemyBoardSlot returns correct keys for 0-6", () => {
    expect(enemyBoardSlot(0)).toBe(UIKey.EnemyBoardSlot_0);
    expect(enemyBoardSlot(6)).toBe(UIKey.EnemyBoardSlot_6);
  });

  it("playerHandSlot returns correct keys for 0-9", () => {
    expect(playerHandSlot(0)).toBe(UIKey.PlayerHandSlot_0);
    expect(playerHandSlot(9)).toBe(UIKey.PlayerHandSlot_9);
  });

  it("playerHandSlot throws for out-of-range", () => {
    expect(() => playerHandSlot(-1)).toThrow(RangeError);
    expect(() => playerHandSlot(MAX_HAND_SIZE)).toThrow(RangeError);
  });

  it("enemyHandSlot returns correct keys", () => {
    expect(enemyHandSlot(0)).toBe(UIKey.EnemyHandSlot_0);
  });

  it("isBoardSlotKey identifies board slots", () => {
    expect(isBoardSlotKey(UIKey.PlayerBoardSlot_3)).toBe(true);
    expect(isBoardSlotKey(UIKey.EnemyBoardSlot_5)).toBe(true);
    expect(isBoardSlotKey(UIKey.PlayerHero)).toBe(false);
    expect(isBoardSlotKey(UIKey.PlayerHandSlot_0)).toBe(false);
  });

  it("isHandSlotKey identifies hand slots", () => {
    expect(isHandSlotKey(UIKey.PlayerHandSlot_2)).toBe(true);
    expect(isHandSlotKey(UIKey.EnemyHandSlot_7)).toBe(true);
    expect(isHandSlotKey(UIKey.PlayerBoardSlot_0)).toBe(false);
  });

  it("isPlayerSide identifies player keys", () => {
    expect(isPlayerSide(UIKey.PlayerHero)).toBe(true);
    expect(isPlayerSide(UIKey.PlayerBoardSlot_0)).toBe(true);
    expect(isPlayerSide(UIKey.EnemyHero)).toBe(false);
    expect(isPlayerSide(UIKey.EndTurnButton)).toBe(false);
  });
});

// ── UI_NODE_MAP ─────────────────────────────────────────────────────
describe("UI_NODE_MAP", () => {
  it("has an entry for every UIKey value", () => {
    const allKeys = Object.values(UIKey);
    for (const key of allKeys) {
      expect(UI_NODE_MAP[key]).toBeDefined();
      expect(typeof UI_NODE_MAP[key]).toBe("string");
      expect(UI_NODE_MAP[key].length).toBeGreaterThan(0);
    }
  });

  it("all node IDs are unique", () => {
    const values = Object.values(UI_NODE_MAP);
    expect(new Set(values).size).toBe(values.length);
  });

  it("UIKey count matches UI_NODE_MAP entry count (no missing / extra entries)", () => {
    const keyCount = Object.values(UIKey).length;
    const mapCount = Object.keys(UI_NODE_MAP).length;
    expect(mapCount).toBe(keyCount);
  });

  it("all placeholder node IDs match NODE_ID_* naming convention", () => {
    const PLACEHOLDER_RE = /^NODE_ID_[A-Z0-9_]+$/;
    const UNBOUND_RE = /^UNBOUND:/;
    for (const [key, nodeId] of Object.entries(UI_NODE_MAP)) {
      const valid = PLACEHOLDER_RE.test(nodeId) || UNBOUND_RE.test(nodeId);
      expect(valid, `UIKey.${key} has invalid nodeId: "${nodeId}"`).toBe(true);
    }
  });

  it("no node ID is an empty string or whitespace", () => {
    for (const [key, nodeId] of Object.entries(UI_NODE_MAP)) {
      expect(nodeId.trim().length, `UIKey.${key} has blank nodeId`).toBeGreaterThan(0);
    }
  });
});

// ── UIAdapter ───────────────────────────────────────────────────────
describe("UIAdapter", () => {
  let adapter: UIAdapter;

  beforeEach(() => {
    adapter = new UIAdapter();
  });

  describe("single card binding", () => {
    it("binds and retrieves a card", () => {
      adapter.bindCard("card_1", UIKey.PlayerBoardSlot_0);
      expect(adapter.getUIKey("card_1")).toBe(UIKey.PlayerBoardSlot_0);
      expect(adapter.getCardId(UIKey.PlayerBoardSlot_0)).toBe("card_1");
    });

    it("unbinds a card", () => {
      adapter.bindCard("card_1", UIKey.PlayerBoardSlot_0);
      adapter.unbindCard("card_1");
      expect(adapter.getUIKey("card_1")).toBeUndefined();
      expect(adapter.getCardId(UIKey.PlayerBoardSlot_0)).toBeUndefined();
    });

    it("rebinding a card to a new slot clears the old slot", () => {
      adapter.bindCard("card_1", UIKey.PlayerBoardSlot_0);
      adapter.bindCard("card_1", UIKey.PlayerBoardSlot_3);
      expect(adapter.getUIKey("card_1")).toBe(UIKey.PlayerBoardSlot_3);
      expect(adapter.getCardId(UIKey.PlayerBoardSlot_0)).toBeUndefined();
    });

    it("binding a new card to an occupied slot evicts the old card", () => {
      adapter.bindCard("card_1", UIKey.PlayerBoardSlot_0);
      adapter.bindCard("card_2", UIKey.PlayerBoardSlot_0);
      expect(adapter.getUIKey("card_2")).toBe(UIKey.PlayerBoardSlot_0);
      expect(adapter.getUIKey("card_1")).toBeUndefined();
    });
  });

  describe("resolveId", () => {
    it("resolves player_hero to PlayerHero", () => {
      expect(adapter.resolveId("player_hero")).toBe(UIKey.PlayerHero);
    });

    it("resolves enemy_hero to EnemyHero", () => {
      expect(adapter.resolveId("enemy_hero")).toBe(UIKey.EnemyHero);
    });

    it("resolves a bound card ID", () => {
      adapter.bindCard("card_x", UIKey.EnemyBoardSlot_2);
      expect(adapter.resolveId("card_x")).toBe(UIKey.EnemyBoardSlot_2);
    });

    it("returns undefined for unknown ID", () => {
      expect(adapter.resolveId("unknown_id")).toBeUndefined();
    });
  });

  describe("getNodeId", () => {
    it("returns Figma node ID for a UIKey", () => {
      expect(adapter.getNodeId(UIKey.PlayerHero)).toBe("NODE_ID_PLAYER_HERO");
      expect(adapter.getNodeId(UIKey.EnemyBoardSlot_4)).toBe("NODE_ID_ENEMY_BOARD_SLOT_4");
    });
  });

  describe("rebindBoard", () => {
    it("binds player and enemy boards to correct slots", () => {
      const pBoard = [makeMinion("p0"), makeMinion("p1"), makeMinion("p2")];
      const eBoard = [makeMinion("e0"), makeMinion("e1")];
      adapter.rebindBoard(pBoard, eBoard);

      expect(adapter.getUIKey("p0")).toBe(UIKey.PlayerBoardSlot_0);
      expect(adapter.getUIKey("p1")).toBe(UIKey.PlayerBoardSlot_1);
      expect(adapter.getUIKey("p2")).toBe(UIKey.PlayerBoardSlot_2);
      expect(adapter.getUIKey("e0")).toBe(UIKey.EnemyBoardSlot_0);
      expect(adapter.getUIKey("e1")).toBe(UIKey.EnemyBoardSlot_1);
    });

    it("clears previous board bindings", () => {
      adapter.bindCard("old_card", UIKey.PlayerBoardSlot_5);
      adapter.rebindBoard([], []);
      expect(adapter.getUIKey("old_card")).toBeUndefined();
    });
  });

  describe("rebindHands", () => {
    it("binds hand cards to correct slots", () => {
      const pHand = [makeMinion("h0"), makeMinion("h1")];
      const eHand = [makeMinion("eh0")];
      adapter.rebindHands(pHand, eHand);

      expect(adapter.getUIKey("h0")).toBe(UIKey.PlayerHandSlot_0);
      expect(adapter.getUIKey("h1")).toBe(UIKey.PlayerHandSlot_1);
      expect(adapter.getUIKey("eh0")).toBe(UIKey.EnemyHandSlot_0);
    });
  });

  describe("rebindAll", () => {
    it("rebuilds all bindings from scratch", () => {
      adapter.bindCard("stale", UIKey.PlayerBoardSlot_6);
      adapter.rebindAll(
        [makeMinion("b0")],
        [makeMinion("eb0")],
        [makeMinion("h0")],
        [makeMinion("eh0")],
      );

      expect(adapter.getUIKey("stale")).toBeUndefined();
      expect(adapter.getUIKey("b0")).toBe(UIKey.PlayerBoardSlot_0);
      expect(adapter.getUIKey("eb0")).toBe(UIKey.EnemyBoardSlot_0);
      expect(adapter.getUIKey("h0")).toBe(UIKey.PlayerHandSlot_0);
      expect(adapter.getUIKey("eh0")).toBe(UIKey.EnemyHandSlot_0);
      expect(adapter.size).toBe(4);
    });
  });

  describe("snapshot / restore", () => {
    it("snapshot captures current state", () => {
      adapter.bindCard("a", UIKey.PlayerBoardSlot_0);
      adapter.bindCard("b", UIKey.EnemyBoardSlot_1);
      const snap = adapter.snapshot();
      expect(snap).toHaveLength(2);
    });

    it("restore rebuilds exact state", () => {
      adapter.bindCard("a", UIKey.PlayerBoardSlot_0);
      adapter.bindCard("b", UIKey.EnemyBoardSlot_1);
      const snap = adapter.snapshot();

      adapter.clearAll();
      expect(adapter.size).toBe(0);

      adapter.restore(snap);
      expect(adapter.getUIKey("a")).toBe(UIKey.PlayerBoardSlot_0);
      expect(adapter.getUIKey("b")).toBe(UIKey.EnemyBoardSlot_1);
      expect(adapter.size).toBe(2);
    });

    it("snapshot is serializable (JSON round-trip)", () => {
      adapter.bindCard("x", UIKey.PlayerHandSlot_3);
      const snap = adapter.snapshot();
      const json = JSON.stringify(snap);
      const parsed = JSON.parse(json);
      adapter.clearAll();
      adapter.restore(parsed);
      expect(adapter.getUIKey("x")).toBe(UIKey.PlayerHandSlot_3);
    });
  });

  describe("clearAll", () => {
    it("removes all bindings", () => {
      adapter.bindCard("a", UIKey.PlayerBoardSlot_0);
      adapter.bindCard("b", UIKey.PlayerBoardSlot_1);
      adapter.clearAll();
      expect(adapter.size).toBe(0);
      expect(adapter.getUIKey("a")).toBeUndefined();
    });
  });
});

// ── resolveAnimationUI ──────────────────────────────────────────────
describe("resolveAnimationUI", () => {
  let adapter: UIAdapter;

  beforeEach(() => {
    adapter = new UIAdapter();
  });

  it("resolves attack animation with source and target cards", () => {
    adapter.bindCard("attacker", UIKey.PlayerBoardSlot_1);
    adapter.bindCard("defender", UIKey.EnemyBoardSlot_3);

    const result = resolveAnimationUI(
      makeAnimation({ sourceId: "attacker", targetId: "defender" }),
      adapter,
    );

    expect(result.source).toBe(UIKey.PlayerBoardSlot_1);
    expect(result.target).toBe(UIKey.EnemyBoardSlot_3);
    expect(result.effectLayer).toBeUndefined(); // attack has no overlay layer
  });

  it("resolves hero target IDs", () => {
    const result = resolveAnimationUI(
      makeAnimation({ sourceId: "player_hero", targetId: "enemy_hero" }),
      adapter,
    );

    expect(result.source).toBe(UIKey.PlayerHero);
    expect(result.target).toBe(UIKey.EnemyHero);
  });

  it("resolves damage animation with DamageNumberLayer", () => {
    adapter.bindCard("target_card", UIKey.EnemyBoardSlot_0);

    const result = resolveAnimationUI(
      makeAnimation({ type: "damage", targetId: "target_card", value: 3 }),
      adapter,
    );

    expect(result.target).toBe(UIKey.EnemyBoardSlot_0);
    expect(result.effectLayer).toBe(UIKey.DamageNumberLayer);
  });

  it("resolves spell animation with SpellEffectLayer", () => {
    const result = resolveAnimationUI(
      makeAnimation({ type: "spell", sourceId: "player_hero" }),
      adapter,
    );

    expect(result.source).toBe(UIKey.PlayerHero);
    expect(result.effectLayer).toBe(UIKey.SpellEffectLayer);
  });

  it("resolves heal animation with DamageNumberLayer", () => {
    adapter.bindCard("healed", UIKey.PlayerBoardSlot_4);

    const result = resolveAnimationUI(
      makeAnimation({ type: "heal", targetId: "healed" }),
      adapter,
    );

    expect(result.target).toBe(UIKey.PlayerBoardSlot_4);
    expect(result.effectLayer).toBe(UIKey.DamageNumberLayer);
  });

  it("resolves summon animation with SpellEffectLayer", () => {
    adapter.bindCard("summoned", UIKey.PlayerBoardSlot_2);

    const result = resolveAnimationUI(
      makeAnimation({ type: "summon", sourceId: "summoned" }),
      adapter,
    );

    expect(result.source).toBe(UIKey.PlayerBoardSlot_2);
    expect(result.effectLayer).toBe(UIKey.SpellEffectLayer);
  });

  it("returns undefined for unbound source/target", () => {
    const result = resolveAnimationUI(
      makeAnimation({ sourceId: "ghost", targetId: "phantom" }),
      adapter,
    );

    expect(result.source).toBeUndefined();
    expect(result.target).toBeUndefined();
  });

  it("handles animation with no sourceId or targetId", () => {
    const result = resolveAnimationUI(
      makeAnimation({ type: "death" }),
      adapter,
    );

    expect(result.source).toBeUndefined();
    expect(result.target).toBeUndefined();
    expect(result.effectLayer).toBeUndefined();
  });
});
