import { GameAnimation } from "../types/game";
import { UIKey } from "./uiKeys";
import { UIAdapter } from "./uiAdapter";

/**
 * 动画解析结果
 *
 * 将 GameAnimation 中的字符串 ID 转换为确定性 UIKey，
 * 供 Animation Queue / Replay / Spectator 渲染层消费。
 */
export interface ResolvedAnimationTargets {
  /** 动画发起方对应的 UIKey */
  source: UIKey | undefined;
  /** 动画目标方对应的 UIKey */
  target: UIKey | undefined;
  /** 应当激活的效果图层 */
  effectLayer: UIKey | undefined;
}

/**
 * 动画类型 → 效果图层映射
 *
 * 确定每类动画应当在哪个图层上播放覆盖效果。
 * undefined 表示该动画类型不使用覆盖图层。
 */
const ANIMATION_LAYER_MAP: Readonly<Record<GameAnimation["type"], UIKey | undefined>> = {
  attack: undefined,
  damage: UIKey.DamageNumberLayer,
  heal: UIKey.DamageNumberLayer,
  death: undefined,
  summon: UIKey.SpellEffectLayer,
  spell: UIKey.SpellEffectLayer,
};

/**
 * 将 GameAnimation 的 sourceId / targetId 解析为 UIKey 目标。
 *
 * 该函数是纯映射，不修改 adapter 或 animation 的任何状态。
 *
 * @param animation - 来自游戏逻辑的动画描述
 * @param adapter   - 持有当前 cardId ↔ UIKey 绑定的适配器
 * @returns 解析后的 UIKey 三元组
 *
 * @example
 * ```ts
 * const resolved = resolveAnimationUI(animation, adapter);
 * if (resolved.source && resolved.target) {
 *   animationQueue.enqueue({
 *     from: adapter.getNodeId(resolved.source),
 *     to: adapter.getNodeId(resolved.target),
 *     layer: resolved.effectLayer ? adapter.getNodeId(resolved.effectLayer) : undefined,
 *   });
 * }
 * ```
 */
export function resolveAnimationUI(
  animation: GameAnimation,
  adapter: UIAdapter,
): ResolvedAnimationTargets {
  const source = animation.sourceId !== undefined
    ? adapter.resolveId(animation.sourceId)
    : undefined;

  const target = animation.targetId !== undefined
    ? adapter.resolveId(animation.targetId)
    : undefined;

  const effectLayer = ANIMATION_LAYER_MAP[animation.type];

  return { source, target, effectLayer };
}
