# Codex 行为规范（卡牌对决游戏）

> 本规范基于项目实际代码结构（React 18 + TypeScript + Vite）制定。
> 每条规则标注当前合规状态：✅ 已达标 / ⚠️ 部分达标 / ❌ 未达标。
> 所有修改必须渐进式推进，不得一次性重写核心模块。

---

## 一、总体目标

Codex 的核心职责：

- 保持架构稳定与可扩展性
- 优先保证核心卡牌对战逻辑的确定性与可维护性
- 不破坏已有模块边界
- 保持离线优先（Offline-First）
- 所有新增功能必须可被单元测试验证

---

## 二、架构行为规范

### 2.1 架构分层 ⚠️ 部分达标

当前项目目录结构：

```
src/app/
├── components/       # Presentation Layer（UI / 动画 / 输入）
│   ├── ui/           #   shadcn/ui 基础组件
│   ├── BattleBoard.tsx, Card.tsx, HandCards.tsx ...
├── hooks/
│   └── useGameState.ts  # Application + Domain（流程控制 + 战斗逻辑，当前耦合）
├── logic/
│   └── battleLogic.ts   # Domain Layer（8 个纯函数，已提取，可独立测试）
├── adapter/             # UI 适配层（UIKey / UIAdapter / resolveAnimationUI，无 React）
│   ├── uiKeys.ts
│   ├── uiNodeMap.ts
│   ├── uiAdapter.ts
│   └── resolveAnimationUI.ts
├── ai/
│   └── AIEngine.ts      # Domain Layer（AI 决策）
├── systems/             # Domain + Infrastructure（效果系统 / 音频 / 成就 / 排行）
│   ├── EffectSystem.ts  #   ✅ 已改为完全不可变（modifiedCards Map）
│   ├── AudioSystem.ts
│   ├── AchievementSystem.ts
│   ├── RankingSystem.ts
│   ├── CollectionSystem.ts
│   └── ScriptableEffectSystem.ts
├── data/
│   └── cardDatabase.ts  # Domain Layer（卡牌数据定义）
├── resources/           # 资源清单层（imageManifest / audioManifest）
│   ├── imageManifest.ts #   唯一图片 URL 来源，禁止业务代码绕过
│   └── audioManifest.ts #   音频注册（当前占位）
├── types/
│   └── game.ts          # Domain Layer（核心类型）
└── App.tsx              # Presentation Layer（顶层容器）
```

**现存问题**：`useGameState.ts` 混合了 React 生命周期管理（`useState`/`useCallback`）、游戏流程控制、战斗逻辑、音效触发（`audioSystem.play`）和异步调度（`setTimeout`）。

**规则**：

| # | 规则 | 状态 |
|---|------|------|
| A1 | UI 组件（`components/`）不得直接修改 `CardData` 对象的内部字段 | ✅ |
| A2 | 战斗逻辑函数（`attack`、`playCard`）不得调用渲染相关代码 | ✅ |
| A3 | 类型定义文件（`types/game.ts`）不得引用任何运行时模块 | ✅ |
| A4 | `EffectSystem` 和 `AIEngine` 不得引用 React API 或 DOM API | ✅ |
| A5 | 新增纯逻辑模块时，不得在其中导入 `audioSystem` 等基础设施单例 | ⚠️ |

**A5 现状**：`useGameState.ts` 直接导入 `audioSystem` 并在 9 处调用 `audioSystem.play()`。新增逻辑模块时禁止重复此模式，音效触发应通过事件回调或返回值传递到 UI 层处理。

**禁止**：

- ❌ UI 组件直接执行 `card.currentHealth -= 3`
- ❌ 在 `EffectSystem` 或 `AIEngine` 中调用 `audioSystem.play()`
- ❌ 在 `types/game.ts` 中 `import` 任何系统模块

---

### 2.2 模块边界 ✅ 基本达标

当前各模块职责明确：

| 模块 | 职责 | 可访问范围 |
|------|------|-----------|
| `types/game.ts` | 类型定义 | 无运行时依赖 |
| `data/cardDatabase.ts` | 卡牌模板数据 + 工厂函数 | 仅依赖 `types/game.ts` |
| `systems/EffectSystem.ts` | 技能效果执行 | 接收 `CardData` 参数，不访问全局状态 |
| `ai/AIEngine.ts` | AI 决策 | 接收 8 个参数（双方 HP/护甲/法力/战场），不访问手牌/牌库 |
| `hooks/useGameState.ts` | 游戏状态管理 + 流程控制 | 可调用 EffectSystem、AIEngine |
| `components/*.tsx` | UI 渲染 | 只读 `gameState`，通过回调触发操作 |
| `App.tsx` | 顶层编排 | 组合组件 + 调用 hook 返回的 action |

**规则**：

- 新增模块必须在上表中明确归属
- 跨层依赖方向：`components → hooks → systems/ai/data → types`
- 禁止反向依赖（如 `EffectSystem` 导入 `useGameState`）

---

## 三、核心战斗逻辑规范

### 3.1 纯逻辑化 ❌ 未达标

**当前状态**：`useGameState.ts` 中的战斗函数（`attack`、`playCard`、`endTurn`）内部直接调用：

- `audioSystem.play()` — 9 处（行 241, 343, 481, 521, 537, 548, 571, 799, 899）
- `setTimeout()` — 4 处（行 214, 622, 898, 910）
- `Date.now()` — 1 处（行 193，用于动画 ID）

**目标**：战斗核心逻辑应可脱离 React 运行时独立执行。

**规则**：

| # | 规则 | 状态 |
|---|------|------|
| B1 | 新增战斗逻辑函数必须是纯函数（无副作用、无 IO） | ❌ 现有函数不纯 |
| B2 | 音效触发通过返回事件列表传递，不在逻辑函数内直接调用 | ❌ |
| B3 | 异步调度（`setTimeout`）不得嵌套在状态更新回调内部 | ❌ 现有 3 处嵌套 |
| B4 | 已有 helper 函数（`checkGameEnd`、`damageHero`、`damageMinion`、`isValidAttackTarget`）保持纯函数 | ✅（已提取到 `logic/battleLogic.ts`） |

**迁移路径**（不要求一次完成）：

1. 将 `attack`/`playCard`/`endTurn` 中的核心计算提取为纯函数
2. 纯函数返回 `{ newState, events: AudioEvent[] }` 结构
3. React hook 层根据返回的 events 触发音效

**已达标的纯函数参考**（`useGameState.ts` 顶部）：

```typescript
// ✅ 这些函数已经是纯函数，可作为模板
function checkGameEnd(playerHP, enemyHP): "player" | "enemy" | "draw" | null
function damageHero(health, armor, damage): { health, armor }
function damageMinion(minion, damage): CardData
function hasTauntMinions(board): boolean
function isValidAttackTarget(attacker, targetId, enemyBoard): { valid, reason? }
function processDeathrattle(deadMinion, ownerBoard, effectSystem): { board }
function processTurnEndEffects(board, effectSystem): CardData[]
```

---

### 3.2 确定性 ❌ 未达标

**当前状态**：`Math.random()` 在以下关键路径中使用，且无种子注入：

| 位置 | 用途 | 影响确定性 |
|------|------|-----------|
| `cardDatabase.ts:200` | 卡牌实例 ID 生成 | 低（仅标识） |
| `cardDatabase.ts:225` | `shuffleDeck` 洗牌 | **高** |
| `useGameState.ts:416` | 单目标法术随机选择 | **高** |
| `AIEngine.ts:112-135` | Easy 模式随机决策 | **高** |
| `ParticleSystem.tsx` | 粒子视觉效果 | 无（仅视觉） |
| `CollectionSystem.ts:183-196` | 卡包抽卡概率 | 中 |

**规则**：

| # | 规则 | 状态 |
|---|------|------|
| C1 | 影响游戏结果的随机操作必须通过可注入的 RNG 函数实现 | ❌ |
| C2 | 同一 `输入序列 + 随机种子` 必须产生完全一致的结果 | ❌ |
| C3 | 纯视觉效果的随机（粒子系统）可以使用 `Math.random()` | ✅ |
| C4 | 卡牌实例 ID 生成可使用 `Date.now()` + `Math.random()` | ✅ |

**迁移路径**：

```typescript
// 推荐：创建可注入的 RNG
type RNG = () => number;

function createSeededRNG(seed: number): RNG {
  // 使用简单的线性同余算法
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (state >>> 0) / 0xFFFFFFFF;
  };
}

// 用法：shuffleDeck(deck, rng) 而非 shuffleDeck(deck)
```

---

### 3.3 卡牌行为规范 ✅ 基本达标

**当前状态**：卡牌是数据驱动的，通过 `CARD_DATABASE` 模板 + `createCard` 工厂：

```typescript
// ✅ 当前模式符合数据驱动要求
Card {
  id, name, cost, attack, health, type,
  keywords: CardKeyword[],  // "嘲讽" | "圣盾" | "潜行" | "突袭" | "飞行" | "剧毒"
  skills: CardSkill[],       // { trigger, effect, target, value, count }
}
```

**技能通过 EffectSystem 执行**，5 种效果类型：`DealDamage`、`Heal`、`DrawCard`、`Summon`、`Buff`。

**规则**：

| # | 规则 | 状态 |
|---|------|------|
| D1 | 卡牌定义必须在 `CARD_DATABASE`（`cardDatabase.ts`）中声明，禁止硬编码 | ✅ |
| D2 | 卡牌行为通过 `skills: CardSkill[]` 声明，由 `EffectSystem` 执行 | ✅ |
| D3 | 新增效果类型必须扩展 `CardSkill.effect` 联合类型和 `EffectSystem` | ✅ |
| D4 | 卡牌对象内部不得包含方法或复杂逻辑 | ✅ |
| D5 | 新增关键词必须扩展 `CardKeyword` 联合类型，并在 `attack`/`createCard` 中实现 | ✅ |

**禁止**：

- ❌ 在 `CardData` 接口中添加方法
- ❌ 在 `CARD_DATABASE` 的卡牌定义中写 `if-else` 逻辑
- ❌ 技能效果函数直接访问 `audioSystem` 等全局单例
- ❌ 卡牌直接修改对手状态（必须通过 EffectSystem 返回结果）

**现存问题**：`EffectSystem.ts` 直接修改传入的 `CardData` 对象属性（7 处直接赋值），违反不可变性。新增效果时必须返回新对象而非修改原对象。

---

## 四、状态管理规范

### 4.1 集中状态管理 ⚠️ 部分达标

**当前状态**：所有游戏状态集中在 `useGameState.ts` 的 `GameState` 接口中：

```typescript
interface GameState {
  phase: GamePhase;           // 6 种阶段（GameStart → MainPhase → ... → GameEnd）
  player: PlayerData & { board: CardData[]; hand: CardData[] };
  enemy: PlayerData & { board: CardData[]; hand: CardData[]; handCount: number };
  isPlayerTurn: boolean;
  turnCount: number;
  animations: GameAnimation[];
  isAnimating: boolean;
  gameMode: "pvp" | "pve";
  aiDifficulty?: AIDifficulty;
  winner?: "player" | "enemy" | "draw";
  fatigue: { player: number; enemy: number };
}
```

**状态修改方式**：通过 `setGameState((prev) => ({ ...prev, ... }))` 函数式更新。

**规则**：

| # | 规则 | 状态 |
|---|------|------|
| E1 | 所有游戏状态修改必须通过 `setGameState` 函数式更新 | ✅ |
| E2 | 状态更新中使用展开运算符保持不可变性 | ⚠️ 大部分遵守，但 EffectSystem 有直接修改 |
| E3 | UI 组件只能通过 hook 返回的 action 函数修改状态 | ✅ |
| E4 | 禁止在组件内部直接调用 `setGameState` | ✅（setGameState 未导出） |
| E5 | 所有状态更新必须在 `setGameState` 回调内读取 `prev`，不使用闭包捕获的旧状态 | ⚠️ |

**E5 现存问题**：`handleBoardCardClick`（`App.tsx`）在 `setTimeout` 回调中使用闭包捕获的 `gameState`（而非最新状态），可能导致状态不一致。

**当前方式 vs 理想方式对比**：

```typescript
// 当前方式（React useState 函数式更新）
setGameState((prev) => ({
  ...prev,
  player: { ...prev.player, health: newHealth },
}));

// 未来可选迁移方向（Action/Reducer 模式）
// 目前不要求迁移，但新增复杂逻辑时可考虑
// dispatch({ type: "DEAL_DAMAGE", target: "player", value: 3 });
```

**禁止**：

- ❌ `player.hp -= 3`（直接修改状态对象属性）
- ❌ `board.cards.push()`（直接修改数组）
- ❌ 在 `EffectSystem` 中执行 `source.attack += buffValue`（当前存在，应改为返回新对象）
- ❌ 组件内部缓存并修改 `gameState` 的引用

---

## 五、扩展性规范

### 5.1 可序列化操作 ❌ 未达标

**当前状态**：

- `GameCommand` 类型已存在，定义了 4 种操作：`PlayCard`、`Attack`、`EndTurn`、`UseHeroSkill`
- AI 的操作通过 `GameCommand[]` 返回，结构可序列化
- 但玩家操作直接调用函数（`playCard()`、`attack()`），无统一的 Command 记录

**规则**：

| # | 规则 | 状态 |
|---|------|------|
| F1 | 所有游戏操作必须可表示为 `GameCommand` | ⚠️ AI 操作可以，玩家操作直接调用函数 |
| F2 | `GameCommand` 必须是纯数据对象（可 `JSON.stringify`） | ✅ |
| F3 | 不在 Command 或状态对象中存储函数引用、DOM 引用、闭包 | ⚠️ |
| F4 | 即使当前无网络功能，新增操作也必须定义对应的 `GameCommand.type` | ❌ |

**迁移路径**：在新增操作时，先定义 `GameCommand.type`，再实现执行逻辑。不要求立即重构现有的 `playCard`/`attack` 调用方式。

---

## 六、性能与资源规范

### 6.1 性能约束 ⚠️

**当前依赖情况**（因为是 Web 应用而非原生小游戏，以下约束适度放宽）：

| 依赖 | 大小（gzip） | 必要性 |
|------|-------------|-------|
| React 18 | ~45 KB | 核心框架，保留 |
| motion (Framer Motion) | ~35 KB | 动画库，保留 |
| react-dnd | ~20 KB | 拖放功能，保留 |
| recharts | ~40 KB | 仅排行图表使用，可考虑懒加载 |
| Radix UI (shadcn) | ~30 KB | UI 基础组件，保留 |
| lucide-react | ~5 KB (tree-shaken) | 图标，保留 |

当前构建产物：`index.js` 420 KB (gzip 126 KB) + `index.css` 128 KB (gzip 18 KB)。

**规则**：

| # | 规则 | 状态 |
|---|------|------|
| G1 | 新增依赖前必须评估 bundle 大小影响，禁止引入 > 50KB gzip 的库 | ⚠️ |
| G2 | 游戏核心组件（`BattleBoard`、`Card`、`HandCards`）应使用 `React.memo` | ❌ 未使用 |
| G3 | 派生计算（如合法攻击目标列表）应使用 `useMemo` 缓存 | ❌ |
| G4 | `CARD_DATABASE` 中的模板对象不得在运行时被修改 | ✅ `createCard` 创建新实例 |
| G5 | `EffectSystem` 执行结果应返回新对象，不修改传入参数 | ❌ 当前直接修改 |

**G2/G3 影响**：当前每次 `setGameState` 触发重渲染时，所有子组件都会重新渲染。手牌区、战场区在每次状态变化时不必要地重新渲染。

---

## 七、AI 对手行为规范

### 7.1 信息隔离 ✅ 达标

**当前状态**：`AIEngine.generateAction()` 接收 8 个参数：

```typescript
generateAction(
  myHP, myArmor, myMana,     // AI 自身状态
  myBoard, myHand,            // AI 可见信息
  enemyHP, enemyArmor,        // 对手公开信息
  enemyBoard                  // 对手战场（公开）
): GameCommand[]
```

**AI 不可访问**：玩家手牌（`player.hand`）、玩家牌库（`player.deck`）、牌库剩余数量。

**规则**：

| # | 规则 | 状态 |
|---|------|------|
| H1 | AI 不得直接读取对手手牌或牌库内容 | ✅ 参数中不包含 |
| H2 | AI 只能通过 `generateAction()` 的参数进行决策 | ✅ |
| H3 | AI 操作必须返回 `GameCommand[]`，由 `executeAICommand` 统一执行 | ✅ |
| H4 | AI 不得绕过规则系统（嘲讽、潜行等限制也适用于 AI） | ✅ `executeAICommand` 中有嘲讽检查 |
| H5 | AI 策略通过 `AIDifficulty` 枚举选择，新策略通过新枚举值 + 新方法实现 | ✅ |

**现有策略**：

| 难度 | 方法 | 决策方式 |
|------|------|---------|
| Easy | `easyStrategy()` | 随机合法操作，30-50% 概率跳过 |
| Normal | `normalStrategy()` | 贪心：最大化费用利用、斩杀检测、优势交换 |
| Hard | `hardStrategy()` | 简化 Minimax + 启发式评分 |

**禁止**：

- ❌ AI 直接修改 `GameState`（必须返回 `GameCommand[]`）
- ❌ AI 策略方法内部调用 `setGameState`
- ❌ 新增 AI 策略时访问 `prev.player.hand` 或 `prev.player.deck`

---

## 八、错误处理规范

### 8.1 错误处理 ⚠️ 部分达标

**当前状态**：

- 6 处 `throw new Error()`：`cardDatabase.ts`（1 处）、`CollectionSystem.ts`（5 处）
- 3 处 `.catch(() => {})`：`AudioSystem.ts`（静默吞掉音频播放错误）
- 无 `Result<T, Error>` 模式
- 无全局错误边界（React Error Boundary）

**规则**：

| # | 规则 | 状态 |
|---|------|------|
| I1 | 所有异常必须可追踪，禁止空 `catch` 块吞掉错误 | ❌ AudioSystem 有 3 处空 catch |
| I2 | 对用户输入的验证失败应返回 `{ valid: false, reason }` 而非抛异常 | ⚠️ `isValidAttackTarget` 遵守，其他不一致 |
| I3 | 核心战斗逻辑中禁止 `try/catch`（逻辑错误不应被吞掉） | ✅ 战斗逻辑无 try/catch |
| I4 | 系统边界（音频加载、文件读写）允许使用 `try/catch` 但必须记录错误 | ❌ |

**推荐模式**：

```typescript
// ✅ 已在使用的模式（isValidAttackTarget）
function isValidAttackTarget(...): { valid: boolean; reason?: string }

// ❌ 避免的模式
.catch(() => {})           // 空 catch
.catch(() => { /* 静默 */ }) // 不记录的 catch
```

---

## 九、日志与调试规范

### 9.1 对局回放 ❌ 未实现

**当前状态**：零日志记录、零回放能力。`console.log` 在整个游戏逻辑中未使用。

**规则**：

| # | 规则 | 状态 |
|---|------|------|
| J1 | 每个 `GameCommand` 执行时应可选地记录到操作日志 | ❌ |
| J2 | 洗牌使用的随机种子应记录以支持回放 | ❌ |
| J3 | 日志不得依赖 UI 输出（不用 `alert`/DOM 操作） | ⚠️ `App.tsx` 曾用 `alert` |
| J4 | 日志格式必须可序列化为 JSON | ❌ |

**迁移路径**（低优先级，待确定性问题解决后再实现）：

```typescript
// 推荐：操作日志结构
interface GameLog {
  seed: number;
  playerDeck: string[];  // 模板 ID 列表
  enemyDeck: string[];
  commands: GameCommand[];
}
```

---

## 十、代码生成行为约束

### 10.1 代码质量规则

**规则**：

| # | 规则 |
|---|------|
| K1 | 单文件不超过 500 行（当前 `useGameState.ts` 约 560 行，应考虑拆分） |
| K2 | 单函数不超过 80 行 |
| K3 | 禁止魔法数字（如 `7` 表示战场上限，应定义为常量 `MAX_BOARD_SIZE = 7`） |
| K4 | 所有公开接口必须有 TypeScript 类型标注 |
| K5 | 优先使用小函数 + 单一职责 |
| K6 | 不生成未使用的代码或注释掉的代码 |

**当前存在的魔法数字**（应提取为常量）：

| 值 | 含义 | 出现位置 |
|----|------|---------|
| `7` | 战场随从上限 | `useGameState.ts` 多处、`AIEngine.ts` |
| `10` | 手牌上限 | `useGameState.ts` |
| `10` | 法力水晶上限 | `useGameState.ts` |
| `30` | 英雄初始生命值 | `useGameState.ts` |
| `3` / `4` | 起始抽牌数（先手/后手） | `useGameState.ts` |
| `2` | 英雄技能费用 | `App.tsx` |
| `800` | AI 操作间隔（ms） | `useGameState.ts` |
| `1000` | 回合切换延迟（ms） | `useGameState.ts` |

---

## 十一、版本演进规则

**规则**：

| # | 规则 |
|---|------|
| L1 | 不得一次性重写 `useGameState.ts`，新功能通过扩展实现 |
| L2 | 新增效果类型通过扩展 `CardSkill.effect` 联合类型 + `EffectSystem` 的 `switch` 分支 |
| L3 | 新增关键词通过扩展 `CardKeyword` 联合类型 + `attack`/`createCard` 逻辑 |
| L4 | 不破坏已有的 `GameCommand` 结构（可新增 `type` 值） |
| L5 | 如果某功能需要 > 3 个 `if-else` 分支，必须重构为注册/映射模式 |

**L5 示例**：

```typescript
// ❌ 避免
if (keyword === "嘲讽") { ... }
else if (keyword === "圣盾") { ... }
else if (keyword === "潜行") { ... }
// ... 继续添加

// ✅ 推荐
const keywordHandlers: Record<CardKeyword, KeywordHandler> = {
  "嘲讽": handleTaunt,
  "圣盾": handleDivineShield,
  "潜行": handleStealth,
  // 新增关键词只需添加一行
};
```

---

## 十二、安全与边界规范

**规则**：

| # | 规则 | 状态 |
|---|------|------|
| M1 | 不读取系统隐私数据（文件系统、联系人等） | ✅ |
| M2 | 不发起网络请求（当前为离线游戏） | ✅ 无 fetch/WebSocket |
| M3 | 不执行动态代码（`eval`、`new Function`） | ✅ |
| M4 | 不加载外部脚本 | ✅ |
| M5 | 图片资源使用 Unsplash URL，不加载任意外部资源 | ✅ |

---

## 十三、测试要求

### 13.1 测试现状 ✅ 已配置

当前项目已配置 Vitest，**118 个测试全绿**，覆盖纯函数、效果系统、适配器层、资源清单。

**测试文件**：

| 文件 | Tests | 覆盖范围 |
|------|-------|---------|
| `logic/battleLogic.test.ts` | 36 | checkGameEnd / damageHero / damageMinion / 关键词机制 |
| `systems/EffectSystem.test.ts` | 20 | DealDamage / Heal / DrawCard / Summon / Buff / silence |
| `data/cardDatabase.test.ts` | 12 | createCard / shuffleDeck / getDefaultDeckIds |
| `adapter/adapter.test.ts` | 39 | UIKey / UI_NODE_MAP / UIAdapter / resolveAnimationUI |
| `resources/resources.test.ts` | 11 | imageManifest / audioManifest / getImageUrl |

**规则**：

| # | 规则 | 优先级 |
|---|------|--------|
| N1 | 配置 Vitest 测试框架 | P0 |
| N2 | 纯函数（`checkGameEnd`、`damageHero`、`damageMinion`、`isValidAttackTarget`）必须有单元测试 | P0 |
| N3 | `EffectSystem` 每种效果类型至少 1 个测试 | P1 |
| N4 | `AIEngine` 每种难度策略至少 1 个测试 | P1 |
| N5 | 关键词机制（嘲讽强制、圣盾消耗、潜行限制、突袭限制、剧毒击杀）各 1 个测试 | P0 |
| N6 | 每个测试至少包含 1 个边界情况（如 HP = 0、牌库为空、战场已满） | P1 |
| N7 | 核心战斗逻辑测试覆盖率目标 ≥ 85% | P2 |

**优先测试的纯函数列表**（无需 mock，可直接测试）：

```
useGameState.ts:
  checkGameEnd(playerHP, enemyHP) → winner
  damageHero(health, armor, damage) → { health, armor }
  damageMinion(minion, damage) → CardData
  hasTauntMinions(board) → boolean
  isValidAttackTarget(attacker, targetId, enemyBoard) → { valid, reason? }

cardDatabase.ts:
  createCard(cardId) → CardData
  shuffleDeck(array) → array
  getDefaultDeckIds() → string[]

EffectSystem.ts:
  executeSkill(skill, source, targets, context) → EffectResult

AIEngine.ts:
  evaluateBoard(...) → BoardEvaluation
  generateAction(...) → GameCommand[]
```

---

## 十四、EffectSystem 直接修改问题清单

**✅ 已全部修复。** `EffectSystem.ts` 现已完全不可变：所有方法通过 `modifiedCards: Map<string, CardData>` 返回新对象副本，不修改传入参数。`silence()` 方法同样返回新对象。

以下为历史问题记录（已解决，供参考）：

| 原行号 | 原代码 | 修复方式 |
|--------|--------|---------|
| 79 | `target.currentHealth = ...` | 改为 `modifiedCards.set(target.id, { ...target, currentHealth: ... })` |
| 95, 125, 134 | 类似直接赋值 | 同上 |
| 219-232 | `source.attack += buffValue` | 改为返回新对象 |
| 251-252 | `target.skills = []; target.keywords = []` | 改为返回新对象 |

`ScriptableEffectSystem.ts` 中同类问题尚未修复（3 处），新增效果时勿重复此模式。

---

## 十五、总结：优先级排序

| 优先级 | 任务 | 影响 |
|--------|------|------|
| **P0** | 提取魔法数字为常量 | ✅ 完成（`constants.ts`） |
| **P0** | 配置 Vitest + 核心纯函数测试 | ✅ 完成（118 tests） |
| **P0** | EffectSystem 改为不可变返回 | ✅ 完成（modifiedCards Map） |
| **P1** | `useGameState` 中音效调用提取到 hook 层 | 分层清晰 |
| **P1** | 游戏组件添加 `React.memo` | 性能 |
| **P1** | RNG 注入替代 `Math.random()` | 确定性 |
| **P2** | 操作日志记录 | 回放能力 |
| **P2** | Action/Reducer 模式迁移 | 可序列化 |
| **P3** | 完整回放系统 | 调试能力 |
