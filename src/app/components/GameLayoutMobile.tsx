import { PlayerInfo } from "./PlayerInfo";
import { BattleBoard } from "./BattleBoard";
import { HandCards } from "./HandCards";
import { ActionBar } from "./ActionBar";
import { GamePhase } from "../types/game";
import { useGameState } from "../hooks/useGameState";

type GameState = ReturnType<typeof useGameState>["gameState"];
import { GameLayoutHandlers } from "./GameLayoutDesktop";

interface GameLayoutMobileProps {
    gameState: GameState;
    handlers: GameLayoutHandlers;
    selectedCard: string | null;
    attackingCardId: string | null;
    heroSkillCost: number;
}

export function GameLayoutMobile({
    gameState,
    handlers,
    selectedCard,
    attackingCardId,
    heroSkillCost,
}: GameLayoutMobileProps) {
    // Mobile placeholder: Currently falls back to the old vertical layout.
    // Will be specifically redesigned for touch in a future update.
    return (
        <div className="relative z-10 flex flex-col h-screen overflow-hidden">
            {/* Top Section - Enemy Info */}
            <div className="p-4 shrink-0">
                <div onClick={handlers.onEnemyHeroClick} className={attackingCardId ? "cursor-crosshair" : ""}>
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
                        variant="bar"
                    />
                </div>
            </div>

            {/* Middle Section - Battle Board */}
            <div className="flex-1 min-h-0 relative">
                <BattleBoard
                    enemyCards={gameState.enemy.board}
                    playerCards={gameState.player.board}
                    selectedCard={selectedCard}
                    onCardSelect={handlers.onBoardCardClick}
                    onCardDrop={handlers.onCardDrop}
                    attackingCardId={attackingCardId}
                />
            </div>

            {/* Bottom Section - Player Info */}
            <div className="p-4 pt-0 shrink-0">
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
                    variant="bar"
                />
            </div>

            {/* Action Bar and Hand Cards container */}
            <div className="shrink-0 flex flex-col relative z-20">
                <div className="absolute bottom-full left-0 right-0">
                    <HandCards
                        cards={gameState.player.hand}
                        currentMana={gameState.player.mana}
                        selectedCard={selectedCard}
                        onCardSelect={handlers.onCardSelect}
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
                    layout="mobile"
                />
            </div>
        </div>
    );
}
