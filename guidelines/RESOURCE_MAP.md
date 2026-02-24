# RESOURCE_MAP.md — 资源治理文档

> 本文档是项目资源的**唯一权威索引**。
> 所有图片、音频、Figma 节点的来源、许可、状态均在此处记录。
> `CLAUDE.md` 直接引用本文档。

---

## 一、图片资源

### 1.1 来源说明

| 来源标识 | 说明 | 许可 |
|----------|------|------|
| `figma-import` | 由 Figma Make 导出时自动选取的 Unsplash 图片 | [Unsplash License](https://unsplash.com/license) |
| `design-team` | 设计团队提供的专属资源（阶段 B） | proprietary |

### 1.2 卡牌插画（10 张）

| ImageAssetKey | Unsplash 照片 ID | 用途 | 状态 |
|---------------|-----------------|------|------|
| `Card_HolyKnight` | `photo-1693921978742-c93c4a3e6172` | 圣光骑士 | 🟡 external |
| `Card_FlameElemental` | `photo-1542379653-b928db1b4956` | 烈焰元素 | 🟡 external |
| `Card_ShadowAssassin` | `photo-1762968755051-5f0b37d75609` | 暗影刺客 | 🟡 external |
| `Card_StoneGuardian` | `photo-1636075204447-ed932101c622` | 石墙守卫 | 🟡 external |
| `Card_DragonWhelp` | `photo-1745130839558-55b2f78f1739` | 巨龙幼崽 | 🟡 external |
| `Card_ForestGuardian` | `photo-1636075204447-ed932101c622` | 森林守护者 | 🟡 external |
| `Card_ShieldBearer` | `photo-1762968755051-5f0b37d75609` | 盾牌侍卫 | 🟡 external |
| `Card_FlameStorm` | `photo-1542379653-b928db1b4956` | 炽炎风暴 | 🟡 external |
| `Card_BladeStorm` | `photo-1693921978742-c93c4a3e6172` | 剑刃风暴 | 🟡 external |
| `Card_DragonBreath` | `photo-1745130839558-55b2f78f1739` | 龙之吐息 | 🟡 external |

> ⚠️ **原型阶段**：5 个唯一照片 ID 被多张卡共用。阶段 B 应为每张卡替换为独立专属插画。

### 1.3 英雄头像（2 张）

| ImageAssetKey | Unsplash 照片 ID | 用途 | 状态 |
|---------------|-----------------|------|------|
| `Avatar_Player` | `photo-1693921978742-c93c4a3e6172` | 玩家头像 | 🟡 external |
| `Avatar_Enemy` | `photo-1762968755051-5f0b37d75609` | 敌方头像 | 🟡 external |

### 1.4 场景背景（1 张）

| ImageAssetKey | Unsplash 照片 ID | 用途 | 状态 |
|---------------|-----------------|------|------|
| `BG_Battle` | `photo-1727295849299-033e0a563261` | 战场背景 | 🟡 external |

### 1.5 唯一照片 ID 汇总

| 照片 ID | 引用次数 | 被引用的 ImageAssetKey |
|---------|---------|----------------------|
| `photo-1693921978742-c93c4a3e6172` | 3 | Card_HolyKnight, Card_BladeStorm, Avatar_Player |
| `photo-1542379653-b928db1b4956` | 2 | Card_FlameElemental, Card_FlameStorm |
| `photo-1762968755051-5f0b37d75609` | 3 | Card_ShadowAssassin, Card_ShieldBearer, Avatar_Enemy |
| `photo-1636075204447-ed932101c622` | 2 | Card_StoneGuardian, Card_ForestGuardian |
| `photo-1745130839558-55b2f78f1739` | 2 | Card_DragonWhelp, Card_DragonBreath |
| `photo-1727295849299-033e0a563261` | 1 | BG_Battle |

### 1.6 迁移状态（external → managed）

| 步骤 | 操作 | 状态 |
|------|------|------|
| 1 | 在 `imageManifest.ts` 完成所有资源注册 | ✅ 完成 |
| 2 | 业务代码全量改为 manifest 引用（无硬编码 URL） | ✅ 完成 |
| 3 | 下载本地素材到 `src/assets/images/{cards\|avatars\|backgrounds}/` | ❌ 待阶段 B |
| 4 | 更新 manifest `source: "managed"` + `localPath` | ❌ 待阶段 B |
| 5 | 替换为专属设计插画（非 Unsplash 共用照片） | ❌ 待阶段 B |

---

## 二、音频资源

| 状态 | 说明 |
|------|------|
| 当前机制 | `AudioSystem.ts` 使用 Web Audio API 生成占位符音效（generateBeepSound） |
| 外链音频 | 无 |
| 本地音频 | 无（`src/assets/audio/` 目录已创建，待填充） |
| 注册位置 | `src/app/resources/audioManifest.ts`（当前 `AudioAssetKey` 枚举为空） |
| 迁移路径 | 阶段 B：在 `AudioAssetKey` 追加枚举值 → 注册 URL/路径 → AudioSystem 加载 |

### 音频事件清单（待映射到真实文件）

| AudioEvent | 分类 | 当前状态 |
|-----------|------|---------|
| UIClick / UIHover / UIError | ui | 占位符 |
| Attack / Damage / Death / Heal | combat | 占位符 |
| CardPlay / CardDraw / CardHover / SpellCast | card | 占位符 |
| TurnStart / TurnEnd / Victory / Defeat | ambient | 占位符 |

---

## 三、Figma 节点映射

| 状态 | 说明 |
|------|------|
| 映射文件 | `src/app/adapter/uiNodeMap.ts` |
| 当前值 | 全部为 `NODE_ID_*` 占位符（48 个 UIKey，100% 覆盖） |
| 真实节点来源 | 阶段 B：通过 Figma MCP 获取，填入真实 node-id |
| 阻塞条件 | 需要 Figma 设计稿 URL + node-id |
| 节点详情 | 阶段 B 产出 `src/assets/figma/node-bindings.json` |

**UIKey 分类统计**：

| 分类 | 数量 |
|------|------|
| Heroes（PlayerHero / EnemyHero） | 2 |
| Hand containers | 2 |
| Deck zones | 2 |
| Player board slots (0-6) | 7 |
| Enemy board slots (0-6) | 7 |
| Player hand slots (0-9) | 10 |
| Enemy hand slots (0-9) | 10 |
| Controls | 4 |
| Effect layers | 2 |
| Future（DeckBuilder / Spectator） | 2 |
| **合计** | **48** |

---

## 四、代码资源

### 4.1 第三方组件（shadcn/ui）

- 来源：[shadcn/ui](https://ui.shadcn.com/)
- 许可：[MIT License](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md)
- 位置：`src/app/components/ui/`（48 个组件文件）
- 记录于：`ATTRIBUTIONS.md`

### 4.2 未使用资源

| 文件 | 说明 | 建议 |
|------|------|------|
| `src/app/components/figma/ImageWithFallback.tsx` | Figma Make 导出的图片错误回退组件，当前无任何业务代码引用 | 阶段 B 集成 Figma 图片时接入，或在确认永不使用后删除 |

---

## 五、资产目录结构

```
src/assets/
├── images/
│   ├── cards/          ← 卡牌插画（阶段 B 填充，当前仅 .gitkeep）
│   ├── avatars/        ← 英雄头像（阶段 B 填充）
│   └── backgrounds/    ← 场景背景（阶段 B 填充）
├── audio/              ← 音效文件（阶段 B 填充）
└── figma/              ← Figma 导出资产 + node-bindings.json（阶段 B 填充）
```

---

## 六、验收命令

```bash
# 1. 业务代码中无硬编码 Unsplash URL（仅 manifest 中允许）
grep -r "unsplash.com" src/app/ --include="*.ts" --include="*.tsx"
# 预期：仅匹配 src/app/resources/imageManifest.ts

# 2. 所有测试通过（含 manifest 完整性测试）
npm test
# 预期：5 test files, 118+ tests

# 3. 构建通过
npm run build
```
