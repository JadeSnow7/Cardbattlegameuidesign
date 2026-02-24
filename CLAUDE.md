# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 项目现状

炉石传说风格卡牌对战游戏，React 18 + TypeScript + Vite + Tailwind CSS v4，UI 文本为中文。
源自 Figma Make 自动生成，已完成多轮架构补全。

| 维度 | 状态 |
|------|------|
| 测试框架 | ✅ Vitest 已配置，当前 **118 tests** 全绿 |
| 纯函数层 | ✅ `src/app/logic/battleLogic.ts` 已提取 8 个纯函数 |
| UI 适配层 | ✅ `src/app/adapter/` 完整（UIKey / UIAdapter / resolveAnimationUI） |
| 资源清单 | ✅ `src/app/resources/imageManifest.ts` 统一管理所有图片 URL |
| 常量提取 | ✅ `src/app/constants.ts` 覆盖所有魔法数字 |
| EffectSystem | ✅ 完全不可变（返回 modifiedCards Map，不修改传入参数） |
| 核心游戏循环 | ✅ 胜负判定 / 抽牌疲劳 / 6 个关键词 / 亡语 / 回合结束效果 |
| Figma 节点映射 | ⚠️ `uiNodeMap.ts` 仍为 `NODE_ID_*` 占位符，待阶段 B 替换 |
| 数据持久化 | ❌ 全内存，刷新即失 |
| 移动端 | ❌ 仅桌面 Web |

---

## 命令

```bash
npm install        # 安装依赖
npm run dev        # 启动 Vite 开发服务器（http://localhost:5173）
npm run build      # 生产构建
npm test           # Vitest 单次运行
npm run test:watch # Vitest 监听模式
```

---

## 模块边界（严格分层）

```
components/          ← Presentation（只读 gameState，通过回调触发操作）
  └── ui/            ← shadcn/ui Radix 基础组件
hooks/               ← Application（useGameState：状态机 + 流程控制）
adapter/             ← UI 适配层（纯映射，无 React，无 GameState 修改）
logic/               ← Domain 纯函数（无副作用，可独立测试）
systems/             ← Infrastructure（EffectSystem / AudioSystem / 成就 / 排行 / 收藏）
ai/                  ← Domain（AIEngine：接收参数 → 返回 GameCommand[]）
data/                ← Domain（CARD_DATABASE + createCard + shuffleDeck）
resources/           ← 资源清单（imageManifest / audioManifest）
types/               ← Domain 类型（无任何运行时导入）
constants.ts         ← 全局常量
App.tsx              ← 顶层编排
```

**依赖方向**（禁止反向）：
`components → hooks → systems/logic/data/adapter → types/constants/resources`

详细规则见 [`CODEX_RULES.md`](./CODEX_RULES.md)。

---

## 资源管理规则

| 规则 | 说明 |
|------|------|
| **唯一来源** | 所有图片 URL 必须通过 `getImageUrl(ImageAssetKey.*)` 获取 |
| **禁止硬编码** | 业务代码（cardDatabase、useGameState、App）中禁止直接写图片 URL |
| **新增图片** | 先在 `imageManifest.ts` 注册 `ImageAssetKey` + `AssetMeta`，再在业务中引用 |
| **音频** | 当前为 Web Audio API 占位符；真实音频文件在阶段 B 通过 `audioManifest.ts` 注册 |
| **本地素材** | 下载到 `src/assets/images/{cards|avatars|backgrounds}/`，更新 `source: "managed"` + `localPath` |
| **验收** | `grep -r "unsplash.com" src/app/ --include="*.ts" --include="*.tsx"` 仅应匹配 `resources/imageManifest.ts` |

资源完整文档见 [`guidelines/RESOURCE_MAP.md`](./guidelines/RESOURCE_MAP.md)。

---

## Figma 实施规则（阶段 B）

1. 配置 MCP：`codex mcp add figma --url https://mcp.figma.com/mcp`，重启会话
2. 对每个提供的 URL + node-id 执行 `get_design_context` / `get_screenshot`
3. 用真实 node-id 替换 `src/app/adapter/uiNodeMap.ts` 中的 `NODE_ID_*` 占位符
4. 无对应节点的 `UIKey` 必须标记为 `UNBOUND:<原因>`，**禁止留空值**
5. 同步更新 `src/assets/figma/node-bindings.json`（fileKey、nodeId、页面名）
6. 产出 `guidelines/FIGMA_PARITY.md` 节点级视觉对照表

---

## 变更前后检查清单

**变更前**：
- [ ] 阅读相关文件，理解现有模式后再修改
- [ ] 确认变更层级（纯函数 / hook / 组件），不跨层引用

**变更后**：
```bash
npm test          # 必须全绿
npm run build     # 必须通过
# 资源检查（仅 manifest 中应有 URL）
grep -r "unsplash.com" src/app/ --include="*.ts" --include="*.tsx"
# 适配器完整性
# UIKey 数量 == UI_NODE_MAP 条目数（adapter.test.ts 已覆盖）
```

---

## 禁止事项

| 禁止 | 原因 |
|------|------|
| 业务代码中硬编码图片/音频 URL | 违反资源清单单一来源原则 |
| `EffectSystem` / `AIEngine` 内调用 `audioSystem.play()` | 违反分层规则 A4/A5 |
| 直接修改 `CardData` 属性（`card.attack += 1`） | 违反不可变性规则 E2 |
| 在 `types/game.ts` 中 `import` 运行时模块 | 违反类型层边界 A3 |
| `UIAdapter` 中访问 `GameState` | 违反适配层职责 |
| 静默 `catch(() => {})` | 违反错误处理规则 I1 |
| `AI` 读取 `player.hand` / `player.deck` | 违反信息隔离规则 H1 |
| 一次性重写 `useGameState.ts` | 违反渐进演进规则 L1 |

---

## 架构速查

### 卡牌流程
```
CARD_DATABASE[id]
  → createCard(id)              # 生成唯一实例 ID，从 keywords 推导 flags
  → shuffleDeck(deck)           # Fisher-Yates
  → useGameState.startGame()    # 初始化双方牌库 / 手牌
  → playCard / attack / endTurn # 状态机转换
  → EffectSystem.executeSkill() # 纯映射，返回 modifiedCards Map
  → battleLogic 纯函数          # checkGameEnd / damageHero / 等
```

### UI 适配流程
```
GameState.player.board[i].id
  → UIAdapter.bindCard(id, playerBoardSlot(i))
  → resolveAnimationUI(animation, adapter) → { source, target, effectLayer }
  → UIAdapter.getNodeId(key) → "NODE_ID_*" (阶段 B 替换为真实节点)
```

### 扩展关键词
1. 在 `types/game.ts` 的 `CardKeyword` 联合类型追加新词
2. 在 `logic/battleLogic.ts` 的 `isValidAttackTarget` 添加检查逻辑
3. 在 `data/cardDatabase.ts` 的 `createCard` 推导对应 flag
4. 在 `battleLogic.test.ts` 补充关键词行为测试

### 扩展卡牌效果
1. 在 `types/game.ts` 的 `CardSkill.effect` 追加新类型
2. 在 `systems/EffectSystem.ts` 的 `switch` 增加对应 case（必须返回新对象，禁止修改传参）
3. 在 `systems/EffectSystem.test.ts` 补充测试
