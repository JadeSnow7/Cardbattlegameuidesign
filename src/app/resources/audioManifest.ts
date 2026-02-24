/**
 * 音频资源清单
 *
 * 当前状态：AudioSystem 使用 Web Audio API 生成的占位符音效，
 * 无任何外链或本地音频文件。此文件为阶段 B 真实音频接入预留结构。
 *
 * 迁移路径：
 * 1. 在 AudioAssetKey 中添加枚举值
 * 2. 在 AUDIO_ASSETS 中注册 URL 或本地路径
 * 3. AudioSystem 从此清单加载真实音频文件
 */

// ── 资源键枚举（当前为空，占位等待真实素材）────────────────────────

export enum AudioAssetKey {
  // 占位符示例（收到真实音频后替换）:
  // SFX_Attack    = "SFX_Attack",
  // SFX_Damage    = "SFX_Damage",
  // SFX_CardPlay  = "SFX_CardPlay",
  // BGM_Battle    = "BGM_Battle",
}

// ── 元数据接口 ────────────────────────────────────────────────────

export type AudioCategory = "ui" | "combat" | "card" | "ambient";

export interface AudioAssetMeta {
  url: string;
  source: "placeholder" | "external" | "managed";
  category: AudioCategory;
  license: string;
  localPath?: string;
}

// ── 资源注册表 ────────────────────────────────────────────────────

export const AUDIO_ASSETS: Readonly<Record<AudioAssetKey, AudioAssetMeta>> = {
  // 待阶段 B 填充
} as Readonly<Record<AudioAssetKey, AudioAssetMeta>>;

// ── 工具函数 ──────────────────────────────────────────────────────

/** 按分类获取音频资源列表。 */
export function getAudioByCategory(category: AudioCategory): AudioAssetKey[] {
  return (Object.keys(AUDIO_ASSETS) as AudioAssetKey[]).filter(
    (key) => AUDIO_ASSETS[key].category === category,
  );
}
