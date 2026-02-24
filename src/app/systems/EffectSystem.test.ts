import { describe, it, expect } from "vitest";
import { EffectSystem } from "./EffectSystem";
import { CardData } from "../types/game";

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

function makeContext(overrides: Partial<Parameters<EffectSystem["executeSkill"]>[3]> = {}) {
  return {
    playerBoard: [],
    enemyBoard: [],
    playerHP: 30,
    enemyHP: 30,
    ...overrides,
  };
}

describe("EffectSystem", () => {
  const system = new EffectSystem();

  // ── DealDamage ──────────────────────────────────────────────────
  describe("DealDamage", () => {
    it("deals damage to a single enemy target via modifiedCards", () => {
      const target = makeMinion({ id: "t1", currentHealth: 5 });
      const result = system.executeSkill(
        { trigger: "OnSummon", effect: "DealDamage", target: "Enemy", value: 3 },
        makeMinion(),
        [target],
        makeContext()
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe(3);
      expect(result.modifiedCards?.get("t1")?.currentHealth).toBe(2);
    });

    it("does not mutate the original target", () => {
      const target = makeMinion({ id: "t2", currentHealth: 5 });
      system.executeSkill(
        { trigger: "OnSummon", effect: "DealDamage", target: "Enemy", value: 3 },
        makeMinion(),
        [target],
        makeContext()
      );

      expect(target.currentHealth).toBe(5);
    });

    it("deals damage to enemy hero via heroHPDelta", () => {
      const result = system.executeSkill(
        { trigger: "OnSummon", effect: "DealDamage", target: "EnemyHero", value: 5 },
        makeMinion(),
        [],
        makeContext()
      );

      expect(result.success).toBe(true);
      expect(result.heroHPDelta).toBe(-5);
    });

    it("deals damage to AllEnemies on enemy board", () => {
      const e1 = makeMinion({ id: "e1", currentHealth: 4 });
      const e2 = makeMinion({ id: "e2", currentHealth: 6 });
      const result = system.executeSkill(
        { trigger: "OnSummon", effect: "DealDamage", target: "AllEnemies", value: 2 },
        makeMinion(),
        [],
        makeContext({ enemyBoard: [e1, e2] })
      );

      expect(result.modifiedCards?.get("e1")?.currentHealth).toBe(2);
      expect(result.modifiedCards?.get("e2")?.currentHealth).toBe(4);
    });

    it("clamps health to 0 minimum", () => {
      const target = makeMinion({ id: "t3", currentHealth: 2 });
      const result = system.executeSkill(
        { trigger: "OnSummon", effect: "DealDamage", target: "Enemy", value: 10 },
        makeMinion(),
        [target],
        makeContext()
      );

      expect(result.modifiedCards?.get("t3")?.currentHealth).toBe(0);
    });
  });

  // ── Heal ────────────────────────────────────────────────────────
  describe("Heal", () => {
    it("heals self up to max health", () => {
      const source = makeMinion({ id: "s1", health: 10, currentHealth: 5 });
      const result = system.executeSkill(
        { trigger: "OnSummon", effect: "Heal", target: "Self", value: 3 },
        source,
        [],
        makeContext()
      );

      expect(result.modifiedCards?.get("s1")?.currentHealth).toBe(8);
    });

    it("does not heal above max health", () => {
      const source = makeMinion({ id: "s2", health: 10, currentHealth: 9 });
      const result = system.executeSkill(
        { trigger: "OnSummon", effect: "Heal", target: "Self", value: 5 },
        source,
        [],
        makeContext()
      );

      expect(result.modifiedCards?.get("s2")?.currentHealth).toBe(10);
    });

    it("heals an ally target", () => {
      const ally = makeMinion({ id: "a1", health: 8, currentHealth: 3 });
      const result = system.executeSkill(
        { trigger: "OnSummon", effect: "Heal", target: "Ally", value: 4 },
        makeMinion(),
        [ally],
        makeContext()
      );

      expect(result.modifiedCards?.get("a1")?.currentHealth).toBe(7);
    });
  });

  // ── DrawCard ────────────────────────────────────────────────────
  describe("DrawCard", () => {
    it("returns draw count", () => {
      const result = system.executeSkill(
        { trigger: "OnSummon", effect: "DrawCard", count: 2 },
        makeMinion(),
        [],
        makeContext()
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe(2);
    });

    it("defaults to 1 when count not specified", () => {
      const result = system.executeSkill(
        { trigger: "OnSummon", effect: "DrawCard" },
        makeMinion(),
        [],
        makeContext()
      );

      expect(result.value).toBe(1);
    });
  });

  // ── Summon ──────────────────────────────────────────────────────
  describe("Summon", () => {
    it("creates summoned cards with correct stats", () => {
      const result = system.executeSkill(
        { trigger: "OnDeath", effect: "Summon", value: 2, count: 1 },
        makeMinion(),
        [],
        makeContext()
      );

      expect(result.success).toBe(true);
      expect(result.summonedCards).toHaveLength(1);
      expect(result.summonedCards![0].attack).toBe(2);
      expect(result.summonedCards![0].health).toBe(2);
    });

    it("creates multiple summons", () => {
      const result = system.executeSkill(
        { trigger: "OnDeath", effect: "Summon", value: 1, count: 3 },
        makeMinion(),
        [],
        makeContext()
      );

      expect(result.summonedCards).toHaveLength(3);
    });

    it("summoned cards have unique IDs", () => {
      const result = system.executeSkill(
        { trigger: "OnDeath", effect: "Summon", value: 1, count: 2 },
        makeMinion(),
        [],
        makeContext()
      );

      const ids = result.summonedCards!.map((c) => c.id);
      expect(new Set(ids).size).toBe(2);
    });
  });

  // ── Buff ────────────────────────────────────────────────────────
  describe("Buff", () => {
    it("buffs self with +N/+N", () => {
      const source = makeMinion({ id: "b1", attack: 3, health: 4, currentHealth: 4 });
      const result = system.executeSkill(
        { trigger: "OnTurnEnd", effect: "Buff", target: "Self", value: 2 },
        source,
        [],
        makeContext()
      );

      const modified = result.modifiedCards?.get("b1");
      expect(modified?.attack).toBe(5);
      expect(modified?.health).toBe(6);
      expect(modified?.currentHealth).toBe(6);
    });

    it("does not mutate original source", () => {
      const source = makeMinion({ id: "b2", attack: 3, health: 4, currentHealth: 4 });
      system.executeSkill(
        { trigger: "OnTurnEnd", effect: "Buff", target: "Self", value: 2 },
        source,
        [],
        makeContext()
      );

      expect(source.attack).toBe(3);
    });

    it("buffs ally targets", () => {
      const ally = makeMinion({ id: "a2", attack: 1, health: 2, currentHealth: 2 });
      const result = system.executeSkill(
        { trigger: "OnSummon", effect: "Buff", target: "Ally", value: 3 },
        makeMinion(),
        [ally],
        makeContext()
      );

      const modified = result.modifiedCards?.get("a2");
      expect(modified?.attack).toBe(4);
      expect(modified?.health).toBe(5);
    });

    it("returns buff metadata", () => {
      const result = system.executeSkill(
        { trigger: "OnSummon", effect: "Buff", target: "Self", value: 1 },
        makeMinion(),
        [],
        makeContext()
      );

      expect(result.buffs).toHaveLength(1);
      expect(result.buffs![0].modifier.attack).toBe(1);
      expect(result.buffs![0].modifier.health).toBe(1);
    });
  });

  // ── Silence ─────────────────────────────────────────────────────
  describe("silence", () => {
    it("removes all abilities and keywords", () => {
      const target = makeMinion({
        id: "s1",
        keywords: ["嘲讽", "圣盾"],
        skills: [{ trigger: "OnDeath" as const, effect: "Summon" as const, value: 1, count: 1 }],
        isTaunting: true,
        hasShield: true,
        isStealth: false,
      });

      const result = system.silence(target);
      const modified = result.modifiedCards?.get("s1");

      expect(modified?.skills).toEqual([]);
      expect(modified?.keywords).toEqual([]);
      expect(modified?.isTaunting).toBe(false);
      expect(modified?.hasShield).toBe(false);
      expect(modified?.isStealth).toBe(false);
    });

    it("does not mutate original target", () => {
      const target = makeMinion({ id: "s2", keywords: ["嘲讽"], isTaunting: true });
      system.silence(target);
      expect(target.keywords).toEqual(["嘲讽"]);
      expect(target.isTaunting).toBe(true);
    });
  });

  // ── Unknown effect ─────────────────────────────────────────────
  describe("unknown effect", () => {
    it("returns failure for unknown effect type", () => {
      const result = system.executeSkill(
        { trigger: "OnSummon", effect: "UnknownEffect" as any },
        makeMinion(),
        [],
        makeContext()
      );

      expect(result.success).toBe(false);
    });
  });
});
