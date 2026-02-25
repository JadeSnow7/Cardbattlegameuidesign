import { PlayerInfo } from "./PlayerInfo";
import { BattleBoard } from "./BattleBoard";
import { HandCards } from "./HandCards";
import { ActionBar } from "./ActionBar";
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
    return (
        <div className="relative z-10 flex flex-col h-[100dvh] overflow-hidden">
            {/* Top Section - Enemy Info */}
            <div className="px-3 pb-2 pt-[calc(env(safe-area-inset-top,0px)+3.5rem)] shrink-0">
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
                        variant="mobile"
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
                    phaseLabel={gameState.phase}
                />
            </div>

            {/* Bottom Section */}
            <div className="shrink-0 flex flex-col relative z-20 bg-gradient-to-t from-black/65 via-black/45 to-transparent border-t border-white/5">
                <div className="px-3 pt-2 pb-1">
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
                        variant="mobile"
                    />
                </div>

                <div className="h-[clamp(148px,24vh,220px)]">
                    <HandCards
                        cards={gameState.player.hand}
                        currentMana={gameState.player.mana}
                        selectedCard={selectedCard}
                        onCardSelect={handlers.onCardSelect}
                        onUnplayableAttempt={handlers.onUnplayableCardAttempt}
                        layout="docked"
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
