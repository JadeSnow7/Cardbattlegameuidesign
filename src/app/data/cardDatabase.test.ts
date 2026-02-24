import { describe, it, expect } from "vitest";
import { CARD_DATABASE, createCard, getDefaultDeckIds, shuffleDeck } from "./cardDatabase";

describe("CARD_DATABASE", () => {
  it("contains at least 8 cards", () => {
    expect(Object.keys(CARD_DATABASE).length).toBeGreaterThanOrEqual(8);
  });

  it("all minion cards have required fields", () => {
    for (const [id, card] of Object.entries(CARD_DATABASE)) {
      expect(card.id).toBe(id);
      expect(card.name).toBeTruthy();
      expect(card.cost).toBeGreaterThanOrEqual(0);
      expect(card.type).toBeTruthy();
      if (card.type === "minion") {
        expect(card.attack).toBeGreaterThanOrEqual(0);
        expect(card.health).toBeGreaterThan(0);
        expect(card.currentHealth).toBe(card.health);
      }
    }
  });
});

describe("createCard", () => {
  it("creates an instance with unique ID", () => {
    const card1 = createCard("holy_knight");
    const card2 = createCard("holy_knight");
    expect(card1.id).not.toBe(card2.id);
    expect(card1.id).toContain("holy_knight");
  });

  it("copies template stats correctly", () => {
    const card = createCard("flame_elemental");
    expect(card.name).toBe("烈焰元素");
    expect(card.cost).toBe(3);
    expect(card.attack).toBe(3);
    expect(card.health).toBe(2);
    expect(card.currentHealth).toBe(2);
    expect(card.type).toBe("minion");
  });

  it("throws for unknown card ID", () => {
    expect(() => createCard("nonexistent_card")).toThrowError("not found");
  });

  it("derives keyword flags correctly", () => {
    const knight = createCard("holy_knight");
    expect(knight.hasShield).toBe(true);   // 圣盾
    expect(knight.isTaunting).toBe(false);

    const guardian = createCard("stone_guardian");
    expect(guardian.isTaunting).toBe(true); // 嘲讽
    expect(guardian.hasShield).toBe(false);

    const assassin = createCard("shadow_assassin");
    expect(assassin.isStealth).toBe(true);  // 潜行

    const flame = createCard("flame_elemental");
    expect(flame.rushActive).toBe(true);    // 突袭
    expect(flame.canAttack).toBe(true);     // 突袭 → can attack immediately
  });

  it("copies skills from template", () => {
    const card = createCard("flame_elemental");
    expect(card.skills).toHaveLength(1);
    expect(card.skills![0].trigger).toBe("OnSummon");
    expect(card.skills![0].effect).toBe("DealDamage");
  });
});

describe("getDefaultDeckIds", () => {
  it("returns 2 copies of each card template", () => {
    const deckIds = getDefaultDeckIds();
    const templateCount = Object.keys(CARD_DATABASE).length;
    expect(deckIds).toHaveLength(templateCount * 2);
  });

  it("each template appears exactly twice", () => {
    const deckIds = getDefaultDeckIds();
    const counts = new Map<string, number>();
    for (const id of deckIds) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    for (const count of counts.values()) {
      expect(count).toBe(2);
    }
  });
});

describe("shuffleDeck", () => {
  it("preserves all elements", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = shuffleDeck(input);
    expect(result).toHaveLength(input.length);
    expect(result.sort((a, b) => a - b)).toEqual(input);
  });

  it("does not mutate the input array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffleDeck(input);
    expect(input).toEqual(copy);
  });

  it("returns a new array", () => {
    const input = [1, 2, 3];
    const result = shuffleDeck(input);
    expect(result).not.toBe(input);
  });
});
