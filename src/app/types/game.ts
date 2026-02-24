// 游戏状态机类型定义

export enum GamePhase {
  GameStart = "GameStart",
  TurnStart = "TurnStart",
  MainPhase = "MainPhase",
  ResolvePhase = "ResolvePhase",
  TurnEnd = "TurnEnd",
  GameEnd = "GameEnd",
}

export enum CardState {
  Idle = "Idle",
  Selected = "Selected",
  Dragging = "Dragging",
  Attacking = "Attacking",
  Damaged = "Damaged",
  Dead = "Dead",
}

export enum AnimationPriority {
  S = "S", // 大招
  A = "A", // 随从死亡
  B = "B", // 普通攻击
  C = "C", // 数值变化
}

export type CardKeyword = "飞行" | "突袭" | "嘲讽" | "圣盾" | "潜行" | "剧毒";

export interface CardSkill {
  trigger: "OnSummon" | "OnDeath" | "OnAttack" | "OnTurnStart" | "OnTurnEnd";
  effect: "DealDamage" | "Heal" | "DrawCard" | "Summon" | "Buff";
  target?: "Enemy" | "EnemyHero" | "AllEnemies" | "Self" | "Ally";
  value?: number;
  count?: number;
}

export interface CardData {
  id: string;
  name: string;
  cost: number;
  attack?: number;
  health?: number;
  currentHealth?: number;
  image: string;
  description: string;
  type: "minion" | "spell";
  keywords?: CardKeyword[];
  skills?: CardSkill[];
  state?: CardState;
  canAttack?: boolean;
  rushActive?: boolean;
  isTaunting?: boolean;
  hasShield?: boolean;
  isStealth?: boolean;
}

export interface PlayerData {
  name: string;
  avatar: string;
  health: number;
  maxHealth: number;
  armor: number;
  mana: number;
  maxMana: number;
  deck: CardData[];
}

export interface GameAnimation {
  id: string;
  type: "attack" | "damage" | "heal" | "death" | "summon" | "spell";
  priority: AnimationPriority;
  sourceId?: string;
  targetId?: string;
  value?: number;
  duration: number;
  canInterrupt?: boolean;
}

export interface GameCommand {
  type: "PlayCard" | "Attack" | "EndTurn" | "UseHeroSkill";
  playerId: string;
  cardId?: string;
  targetId?: string;
  slotIndex?: number;
}
