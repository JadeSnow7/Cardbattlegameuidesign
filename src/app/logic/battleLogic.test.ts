import { describe, it, expect } from "vitest";
import {
  checkGameEnd,
  damageHero,
  damageMinion,
  hasTauntMinions,
  isTauntTarget,
  isValidAttackTarget,
  processDeathrattle,
  processTurnEndEffects,
} from "./battleLogic";
import { EffectSystem } from "../systems/EffectSystem";
import { CardData } from "../types/game";

// ── Helper ──────────────────────────────────────────────────────────
function makeMinion(overrides: Partial<CardData> = {}): CardData {
  return {
    id: `test_${Math.random().toString(36).slice(2, 7)}`,
    name: "TestMinion",
    cost: 1,
    attack: 2,
    health: 3,
    currentHealth: 3,
    image: "",
    description: "",
    type: "minion",
    ...overrides,
  };
}

// ── checkGameEnd ────────────────────────────────────────────────────
describe("checkGameEnd", () => {
  it("returns null when both players alive", () => {
    expect(checkGameEnd(30, 30)).toBeNull();
    expect(checkGameEnd(1, 1)).toBeNull();
  });

  it("returns 'enemy' when player HP <= 0", () => {
    expect(checkGameEnd(0, 10)).toBe("enemy");
    expect(checkGameEnd(-5, 10)).toBe("enemy");
  });

  it("returns 'player' when enemy HP <= 0", () => {
    expect(checkGameEnd(10, 0)).toBe("player");
    expect(checkGameEnd(10, -3)).toBe("player");
  });

  it("returns 'draw' when both HP <= 0", () => {
    expect(checkGameEnd(0, 0)).toBe("draw");
    expect(checkGameEnd(-1, -2)).toBe("draw");
  });
});

// ── damageHero ──────────────────────────────────────────────────────
describe("damageHero", () => {
  it("reduces health when no armor", () => {
    const result = damageHero(30, 0, 5);
    expect(result.health).toBe(25);
    expect(result.armor).toBe(0);
  });

  it("absorbs damage with armor first", () => {
    const result = damageHero(30, 3, 5);
    expect(result.armor).toBe(0);
    expect(result.health).toBe(28); // 5 - 3 = 2 to health
  });

  it("armor fully absorbs when damage <= armor", () => {
    const result = damageHero(30, 10, 5);
    expect(result.armor).toBe(5);
    expect(result.health).toBe(30);
  });

  it("handles zero damage", () => {
    const result = damageHero(30, 5, 0);
    expect(result.health).toBe(30);
    expect(result.armor).toBe(5);
  });

  it("allows health to go negative", () => {
    const result = damageHero(3, 0, 10);
    expect(result.health).toBe(-7);
  });
});

// ── damageMinion ────────────────────────────────────────────────────
describe("damageMinion", () => {
  it("reduces currentHealth by damage", () => {
    const minion = makeMinion({ currentHealth: 5 });
    const result = damageMinion(minion, 3);
    expect(result.currentHealth).toBe(2);
  });

  it("does not mutate the original", () => {
    const minion = makeMinion({ currentHealth: 5 });
    damageMinion(minion, 3);
    expect(minion.currentHealth).toBe(5);
  });

  it("consumes divine shield instead of dealing damage", () => {
    const minion = makeMinion({ currentHealth: 5, hasShield: true });
    const result = damageMinion(minion, 10);
    expect(result.currentHealth).toBe(5);
    expect(result.hasShield).toBe(false);
  });

  it("allows health to go below zero", () => {
    const minion = makeMinion({ currentHealth: 2 });
    const result = damageMinion(minion, 5);
    expect(result.currentHealth).toBe(-3);
  });
});

// ── hasTauntMinions ─────────────────────────────────────────────────
describe("hasTauntMinions", () => {
  it("returns false for empty board", () => {
    expect(hasTauntMinions([])).toBe(false);
  });

  it("returns false when no taunt minions", () => {
    expect(hasTauntMinions([makeMinion()])).toBe(false);
  });

  it("returns true when a taunt minion exists", () => {
    expect(hasTauntMinions([makeMinion({ isTaunting: true })])).toBe(true);
  });

  it("returns false when taunt minion has stealth", () => {
    expect(hasTauntMinions([makeMinion({ isTaunting: true, isStealth: true })])).toBe(false);
  });
});

// ── isTauntTarget ───────────────────────────────────────────────────
describe("isTauntTarget", () => {
  it("returns true for taunt without stealth", () => {
    expect(isTauntTarget(makeMinion({ isTaunting: true }))).toBe(true);
  });

  it("returns false for taunt with stealth", () => {
    expect(isTauntTarget(makeMinion({ isTaunting: true, isStealth: true }))).toBe(false);
  });

  it("returns false for non-taunt", () => {
    expect(isTauntTarget(makeMinion())).toBe(false);
  });
});

// ── isValidAttackTarget ─────────────────────────────────────────────
describe("isValidAttackTarget", () => {
  it("allows attacking hero with no taunt on board", () => {
    const attacker = makeMinion();
    const result = isValidAttackTarget(attacker, "enemy_hero", []);
    expect(result.valid).toBe(true);
  });

  it("blocks hero attack when taunt exists", () => {
    const attacker = makeMinion();
    const tauntMinion = makeMinion({ isTaunting: true });
    const result = isValidAttackTarget(attacker, "enemy_hero", [tauntMinion]);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("嘲讽");
  });

  it("blocks non-taunt target when taunt exists", () => {
    const attacker = makeMinion();
    const normalMinion = makeMinion({ id: "normal_1" });
    const tauntMinion = makeMinion({ isTaunting: true, id: "taunt_1" });
    const result = isValidAttackTarget(attacker, "normal_1", [normalMinion, tauntMinion]);
    expect(result.valid).toBe(false);
  });

  it("allows attacking taunt target when taunt exists", () => {
    const attacker = makeMinion();
    const tauntMinion = makeMinion({ isTaunting: true, id: "taunt_1" });
    const result = isValidAttackTarget(attacker, "taunt_1", [tauntMinion]);
    expect(result.valid).toBe(true);
  });

  it("flying ignores taunt for hero attacks", () => {
    const attacker = makeMinion({ keywords: ["飞行"] });
    const tauntMinion = makeMinion({ isTaunting: true });
    const result = isValidAttackTarget(attacker, "enemy_hero", [tauntMinion]);
    expect(result.valid).toBe(true);
  });

  it("flying ignores taunt for non-taunt target attacks", () => {
    const attacker = makeMinion({ keywords: ["飞行"] });
    const normalMinion = makeMinion({ id: "normal_1" });
    const tauntMinion = makeMinion({ isTaunting: true, id: "taunt_1" });
    const result = isValidAttackTarget(attacker, "normal_1", [normalMinion, tauntMinion]);
    expect(result.valid).toBe(true);
  });

  it("blocks attacking stealthed minion", () => {
    const attacker = makeMinion();
    const stealthMinion = makeMinion({ isStealth: true, id: "stealth_1" });
    const result = isValidAttackTarget(attacker, "stealth_1", [stealthMinion]);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("潜行");
  });

  it("rush minion cannot attack hero", () => {
    const attacker = makeMinion({ rushActive: true });
    const result = isValidAttackTarget(attacker, "enemy_hero", []);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("突袭");
  });

  it("rush minion can attack minions", () => {
    const attacker = makeMinion({ rushActive: true });
    const target = makeMinion({ id: "target_1" });
    const result = isValidAttackTarget(attacker, "target_1", [target]);
    expect(result.valid).toBe(true);
  });
});

// ── processDeathrattle ──────────────────────────────────────────────
describe("processDeathrattle", () => {
  const effectSystem = new EffectSystem();

  it("returns board unchanged when no skills", () => {
    const dead = makeMinion();
    const board = [makeMinion({ id: "alive" })];
    const result = processDeathrattle(dead, board, effectSystem);
    expect(result.board).toHaveLength(1);
  });

  it("summons minions on death with OnDeath Summon skill", () => {
    const dead = makeMinion({
      skills: [{ trigger: "OnDeath" as const, effect: "Summon" as const, value: 2, count: 1 }],
    });
    const board: CardData[] = [];
    const result = processDeathrattle(dead, board, effectSystem);
    expect(result.board).toHaveLength(1);
    expect(result.board[0].attack).toBe(2);
    expect(result.board[0].health).toBe(2);
  });

  it("does not mutate original board", () => {
    const dead = makeMinion({
      skills: [{ trigger: "OnDeath" as const, effect: "Summon" as const, value: 1, count: 1 }],
    });
    const board: CardData[] = [];
    processDeathrattle(dead, board, effectSystem);
    expect(board).toHaveLength(0);
  });

  it("respects MAX_BOARD_SIZE when summoning", () => {
    const dead = makeMinion({
      skills: [{ trigger: "OnDeath" as const, effect: "Summon" as const, value: 1, count: 3 }],
    });
    // Fill board to 6 slots
    const board = Array.from({ length: 6 }, (_, i) => makeMinion({ id: `fill_${i}` }));
    const result = processDeathrattle(dead, board, effectSystem);
    // MAX_BOARD_SIZE is 7, so only 1 can be summoned
    expect(result.board).toHaveLength(7);
  });
});

// ── processTurnEndEffects ───────────────────────────────────────────
describe("processTurnEndEffects", () => {
  const effectSystem = new EffectSystem();

  it("returns board unchanged when no skills", () => {
    const board = [makeMinion({ id: "no_skill" })];
    const result = processTurnEndEffects(board, effectSystem);
    expect(result).toHaveLength(1);
    expect(result[0].attack).toBe(board[0].attack);
  });

  it("applies OnTurnEnd Buff +1/+1", () => {
    const minion = makeMinion({
      id: "dragon",
      attack: 5,
      health: 6,
      currentHealth: 6,
      skills: [{ trigger: "OnTurnEnd" as const, effect: "Buff" as const, target: "Self" as const, value: 1 }],
    });
    const result = processTurnEndEffects([minion], effectSystem);
    expect(result[0].attack).toBe(6);
    expect(result[0].health).toBe(7);
    expect(result[0].currentHealth).toBe(7);
  });

  it("does not mutate original board", () => {
    const minion = makeMinion({
      id: "dragon",
      attack: 5,
      health: 6,
      currentHealth: 6,
      skills: [{ trigger: "OnTurnEnd" as const, effect: "Buff" as const, target: "Self" as const, value: 1 }],
    });
    processTurnEndEffects([minion], effectSystem);
    expect(minion.attack).toBe(5);
  });
});
