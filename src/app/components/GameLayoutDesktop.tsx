import { PlayerInfo } from "./PlayerInfo";
import { BattleBoard } from "./BattleBoard";
import { HandCards } from "./HandCards";
import { ActionBar } from "./ActionBar";
import { useGameState } from "../hooks/useGameState";

type GameState = ReturnType<typeof useGameState>["gameState"];

export interface GameLayoutHandlers {
    onCardDrop: (cardId: string, slotIndex: number) => void;
    onBoardCardClick: (id: string, isEnemy: boolean) => void;
    onEnemyHeroClick: () => void;
    onEndTurn: () => void;
    onSurrender: () => void;
    onSettings: () => void;
    onHeroSkill: () => void;
    onCardSelect: (id: string) => void;
    onUnplayableCardAttempt?: (payload: { cardName: string; cost: number; currentMana: number }) => void;
}

interface GameLayoutDesktopProps {
    gameState: GameState;
    handlers: GameLayoutHandlers;
    selectedCard: string | null;
    attackingCardId: string | null;
    heroSkillCost: number;
}

export function GameLayoutDesktop({
    gameState,
    handlers,
    selectedCard,
    attackingCardId,
    heroSkillCost,
}: GameLayoutDesktopProps) {
    return (
        <div className="relative z-10 flex h-screen overflow-hidden">
            {/* Left Sidebar - Player Status */}
            <div className="w-56 h-full flex flex-col justify-between p-4 bg-black/40 backdrop-blur-md border-r border-white/5 shrink-0 z-20">
                <PlayerInfo
                    name={gameState.enemy.name}
                    avatar={gameState.enemy.avatar}
                    health={gameState.enemy.health}
                    maxHealth={gameState.enemy.maxHealth}
                    armor={gameState.enemy.armor}
                    mana={gameState.enemy.mana}
                    maxMana={gameState.enemy.maxMana}
                    handCount={gameState.enemy.handCount}
                    deckCount={gameState.enemy.deck.length}
                    isEnemy={true}
                    variant="sidebar"
                    onAvatarClick={handlers.onEnemyHeroClick}
                />

                <div className="flex-1 flex items-center justify-center my-4">
                    {/* Decorative divider in sidebar */}
                    <div className="w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                </div>

                <PlayerInfo
                    name={gameState.player.name}
                    avatar={gameState.player.avatar}
                    health={gameState.player.health}
                    maxHealth={gameState.player.maxHealth}
                    armor={gameState.player.armor}
                    mana={gameState.player.mana}
                    maxMana={gameState.player.maxMana}
                    handCount={gameState.player.hand.length}
                    deckCount={gameState.player.deck.length}
                    variant="sidebar"
                />
            </div>

            {/* Main Right Area */}
            <div className="flex-1 flex flex-col h-full min-w-0">
                {/* Battle Board Area (Takes majority of height) */}
                <div className="flex-1 min-h-0 relative">
                    <BattleBoard
                        enemyCards={gameState.enemy.board}
                        playerCards={gameState.player.board}
                        selectedCard={selectedCard}
                        onCardSelect={handlers.onBoardCardClick}
                        onCardDrop={handlers.onCardDrop}
                        attackingCardId={attackingCardId}
                        phaseLabel={gameState.phase}
                    />
                </div>

                {/* Bottom Area: Hand & Actions */}
                <div className="shrink-0 flex flex-col relative z-20">
                    <div className="absolute bottom-full left-0 right-0">
                        <HandCards
                            cards={gameState.player.hand}
                            currentMana={gameState.player.mana}
                            selectedCard={selectedCard}
                            onCardSelect={handlers.onCardSelect}
                            onUnplayableAttempt={handlers.onUnplayableCardAttempt}
                        />
                    </div>

                    <ActionBar
                        onEndTurn={handlers.onEndTurn}
                        onSurrender={handlers.onSurrender}
                        onSettings={handlers.onSettings}
                        isPlayerTurn={gameState.isPlayerTurn}
                        heroSkillCost={heroSkillCost}
                        currentMana={gameState.player.mana}
                        onHeroSkill={handlers.onHeroSkill}
                        layout="desktop"
                    />
                </div>
            </div>
        </div>
    );
}
