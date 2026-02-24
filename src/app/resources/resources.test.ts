import { describe, it, expect } from "vitest";
import { ImageAssetKey, IMAGE_ASSETS, getImageUrl, getExternalAssets } from "./imageManifest";
import { AudioAssetKey, AUDIO_ASSETS } from "./audioManifest";

// ── imageManifest ───────────────────────────────────────────────────
describe("imageManifest", () => {
  it("IMAGE_ASSETS covers every ImageAssetKey", () => {
    const allKeys = Object.values(ImageAssetKey);
    for (const key of allKeys) {
      expect(IMAGE_ASSETS[key], `Missing entry for ImageAssetKey.${key}`).toBeDefined();
    }
  });

  it("ImageAssetKey count matches IMAGE_ASSETS entry count", () => {
    expect(Object.keys(IMAGE_ASSETS).length).toBe(Object.values(ImageAssetKey).length);
  });

  it("all URLs are non-empty strings", () => {
    for (const [key, meta] of Object.entries(IMAGE_ASSETS)) {
      expect(meta.url.trim().length, `ImageAssetKey.${key} has blank url`).toBeGreaterThan(0);
    }
  });

  it("all external URLs are valid Unsplash URLs", () => {
    const UNSPLASH_RE = /^https:\/\/images\.unsplash\.com\/photo-[a-z0-9-]+$/;
    for (const [key, meta] of Object.entries(IMAGE_ASSETS)) {
      if (meta.license === "unsplash") {
        expect(
          UNSPLASH_RE.test(meta.url),
          `ImageAssetKey.${key} has malformed Unsplash url: "${meta.url}"`,
        ).toBe(true);
      }
    }
  });

  it("all entries have non-empty owner and license", () => {
    for (const [key, meta] of Object.entries(IMAGE_ASSETS)) {
      expect(meta.owner.trim().length, `ImageAssetKey.${key} has blank owner`).toBeGreaterThan(0);
      expect(meta.license.trim().length, `ImageAssetKey.${key} has blank license`).toBeGreaterThan(0);
    }
  });

  it("managed entries must have a localPath", () => {
    for (const [key, meta] of Object.entries(IMAGE_ASSETS)) {
      if (meta.source === "managed") {
        expect(
          meta.localPath?.trim().length,
          `ImageAssetKey.${key} is managed but missing localPath`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

// ── getImageUrl ─────────────────────────────────────────────────────
describe("getImageUrl", () => {
  it("returns bare URL when no size specified", () => {
    const url = getImageUrl(ImageAssetKey.Card_HolyKnight);
    expect(url).toBe("https://images.unsplash.com/photo-1693921978742-c93c4a3e6172");
    expect(url).not.toContain("?");
  });

  it("appends size params correctly", () => {
    const url = getImageUrl(ImageAssetKey.Card_HolyKnight, { w: 300, h: 400 });
    expect(url).toContain("w=300");
    expect(url).toContain("h=400");
    expect(url).toContain("fit=crop");
  });

  it("uses custom fit param", () => {
    const url = getImageUrl(ImageAssetKey.BG_Battle, { w: 1920, h: 1080, fit: "fill" });
    expect(url).toContain("fit=fill");
  });
});

// ── getExternalAssets ───────────────────────────────────────────────
describe("getExternalAssets", () => {
  it("returns all currently-external keys", () => {
    const externals = getExternalAssets();
    // All 13 assets are currently external
    expect(externals.length).toBe(Object.values(ImageAssetKey).length);
  });
});

// ── audioManifest ───────────────────────────────────────────────────
describe("audioManifest", () => {
  it("AUDIO_ASSETS has no unknown keys beyond AudioAssetKey enum", () => {
    const validKeys = new Set<string>(Object.values(AudioAssetKey));
    for (const key of Object.keys(AUDIO_ASSETS)) {
      expect(validKeys.has(key), `Unknown key in AUDIO_ASSETS: "${key}"`).toBe(true);
    }
  });
});
