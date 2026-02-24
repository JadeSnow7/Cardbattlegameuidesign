/**
 * 图片资源清单 — 唯一授权的图片 URL 来源
 *
 * 规则：
 * - 业务模块（cardDatabase、useGameState、App）禁止硬编码图片 URL
 * - 所有图片引用必须通过 getImageUrl(ImageAssetKey.*) 获取
 * - 新增图片先在此处注册，再在业务代码中使用
 *
 * 迁移状态：
 * - source="external"  → 外链资源（Unsplash CDN），尚未本地化
 * - source="managed"   → 已下载到 src/assets/ 的本地资源
 *
 * 阶段 B：收到真实素材后，将 url 替换为本地路径并更新 source 字段。
 */

// ── 资源键枚举 ────────────────────────────────────────────────────

export enum ImageAssetKey {
  // 卡牌插画（每张卡模板对应一个唯一键）
  Card_HolyKnight      = "Card_HolyKnight",
  Card_FlameElemental  = "Card_FlameElemental",
  Card_ShadowAssassin  = "Card_ShadowAssassin",
  Card_StoneGuardian   = "Card_StoneGuardian",
  Card_DragonWhelp     = "Card_DragonWhelp",
  Card_ForestGuardian  = "Card_ForestGuardian",
  Card_ShieldBearer    = "Card_ShieldBearer",
  Card_FlameStorm      = "Card_FlameStorm",
  Card_BladeStorm      = "Card_BladeStorm",
  Card_DragonBreath    = "Card_DragonBreath",

  // 英雄头像
  Avatar_Player        = "Avatar_Player",
  Avatar_Enemy         = "Avatar_Enemy",

  // 场景背景
  BG_Battle            = "BG_Battle",
}

// ── 元数据接口 ────────────────────────────────────────────────────

export interface AssetMeta {
  /** 资源 URL（外链或本地路径）— 不含尺寸参数 */
  url: string;
  /** external = 外链 CDN；managed = 已下载到 src/assets/ */
  source: "external" | "managed";
  /** 导入来源标识（如 "figma-import"、"design-team"） */
  owner: string;
  /** 版权协议（如 "unsplash"、"cc0"、"proprietary"） */
  license: string;
  /** 本地存储路径（source=managed 时必填） */
  localPath?: string;
}

// ── 资源注册表 ────────────────────────────────────────────────────

/**
 * 注意：5 个唯一 Unsplash 照片 ID 被多张卡共用（原型阶段）。
 * 阶段 B 中，每个 ImageAssetKey 应替换为独立的专属插画。
 *
 * Unsplash 照片 ID 映射：
 *  photo-1693921978742-c93c4a3e6172 → Card_HolyKnight, Card_BladeStorm, Avatar_Player
 *  photo-1542379653-b928db1b4956 → Card_FlameElemental, Card_FlameStorm
 *  photo-1762968755051-5f0b37d75609 → Card_ShadowAssassin, Card_ShieldBearer, Avatar_Enemy
 *  photo-1636075204447-ed932101c622 → Card_StoneGuardian, Card_ForestGuardian
 *  photo-1745130839558-55b2f78f1739 → Card_DragonWhelp, Card_DragonBreath
 *  photo-1727295849299-033e0a563261 → BG_Battle
 */
export const IMAGE_ASSETS: Readonly<Record<ImageAssetKey, AssetMeta>> = {
  // ── 卡牌插画 ──────────────────────────────────────────────────
  [ImageAssetKey.Card_HolyKnight]: {
    url: "https://images.unsplash.com/photo-1693921978742-c93c4a3e6172",
    source: "external",
    owner: "figma-import",
    license: "unsplash",
  },
  [ImageAssetKey.Card_FlameElemental]: {
    url: "https://images.unsplash.com/photo-1542379653-b928db1b4956",
    source: "external",
    owner: "figma-import",
    license: "unsplash",
  },
  [ImageAssetKey.Card_ShadowAssassin]: {
    url: "https://images.unsplash.com/photo-1762968755051-5f0b37d75609",
    source: "external",
    owner: "figma-import",
    license: "unsplash",
  },
  [ImageAssetKey.Card_StoneGuardian]: {
    url: "https://images.unsplash.com/photo-1636075204447-ed932101c622",
    source: "external",
    owner: "figma-import",
    license: "unsplash",
  },
  [ImageAssetKey.Card_DragonWhelp]: {
    url: "https://images.unsplash.com/photo-1745130839558-55b2f78f1739",
    source: "external",
    owner: "figma-import",
    license: "unsplash",
  },
  [ImageAssetKey.Card_ForestGuardian]: {
    url: "https://images.unsplash.com/photo-1636075204447-ed932101c622",
    source: "external",
    owner: "figma-import",
    license: "unsplash",
  },
  [ImageAssetKey.Card_ShieldBearer]: {
    url: "https://images.unsplash.com/photo-1762968755051-5f0b37d75609",
    source: "external",
    owner: "figma-import",
    license: "unsplash",
  },
  [ImageAssetKey.Card_FlameStorm]: {
    url: "https://images.unsplash.com/photo-1542379653-b928db1b4956",
    source: "external",
    owner: "figma-import",
    license: "unsplash",
  },
  [ImageAssetKey.Card_BladeStorm]: {
    url: "https://images.unsplash.com/photo-1693921978742-c93c4a3e6172",
    source: "external",
    owner: "figma-import",
    license: "unsplash",
  },
  [ImageAssetKey.Card_DragonBreath]: {
    url: "https://images.unsplash.com/photo-1745130839558-55b2f78f1739",
    source: "external",
    owner: "figma-import",
    license: "unsplash",
  },

  // ── 英雄头像 ──────────────────────────────────────────────────
  [ImageAssetKey.Avatar_Player]: {
    url: "https://images.unsplash.com/photo-1693921978742-c93c4a3e6172",
    source: "external",
    owner: "figma-import",
    license: "unsplash",
  },
  [ImageAssetKey.Avatar_Enemy]: {
    url: "https://images.unsplash.com/photo-1762968755051-5f0b37d75609",
    source: "external",
    owner: "figma-import",
    license: "unsplash",
  },

  // ── 场景背景 ──────────────────────────────────────────────────
  [ImageAssetKey.BG_Battle]: {
    url: "https://images.unsplash.com/photo-1727295849299-033e0a563261",
    source: "external",
    owner: "figma-import",
    license: "unsplash",
  },
};

// ── 工具函数 ──────────────────────────────────────────────────────

export interface ImageSizeParams {
  w: number;
  h: number;
  fit?: "crop" | "clip" | "fill" | "scale";
}

/**
 * 获取图片 URL，附带尺寸参数（仅对 Unsplash 外链生效）。
 *
 * @example
 * getImageUrl(ImageAssetKey.Card_HolyKnight, { w: 300, h: 400 })
 * // → "https://images.unsplash.com/photo-1693921978742-c93c4a3e6172?w=300&h=400&fit=crop"
 */
export function getImageUrl(key: ImageAssetKey, size?: ImageSizeParams): string {
  const asset = IMAGE_ASSETS[key];
  if (!size) return asset.url;

  const url = new URL(asset.url);
  url.searchParams.set("w", String(size.w));
  url.searchParams.set("h", String(size.h));
  url.searchParams.set("fit", size.fit ?? "crop");
  return url.toString();
}

/** 是否所有图片资源已本地化（无 external 来源）。 */
export function isFullyManaged(): boolean {
  return Object.values(IMAGE_ASSETS).every((a) => a.source === "managed");
}

/** 获取所有尚未本地化的资源键列表（阶段 B 迁移用）。 */
export function getExternalAssets(): ImageAssetKey[] {
  return (Object.keys(IMAGE_ASSETS) as ImageAssetKey[]).filter(
    (key) => IMAGE_ASSETS[key].source === "external",
  );
}
