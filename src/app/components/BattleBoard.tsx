import { motion } from "motion/react";
import { Card } from "./Card";
import { BoardSlot } from "./BoardSlot";
import { CardData } from "../types/game";

interface BattleBoardProps {
  enemyCards: CardData[];
  playerCards: CardData[];
  onCardSelect?: (id: string, isEnemy: boolean) => void;
  selectedCard?: string | null;
  onCardDrop?: (cardId: string, slotIndex: number) => void;
  attackingCardId?: string | null;
}

export function BattleBoard({
  enemyCards,
  playerCards,
  onCardSelect,
  selectedCard,
  onCardDrop,
  attackingCardId,
}: BattleBoardProps) {
  return (
    <div className="flex flex-col h-full py-4 px-4 overflow-hidden">
      {/* Enemy Board */}
      <div className="relative flex-1 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-7 gap-2 h-full"
        >
          {Array.from({ length: 7 }).map((_, idx) => {
            const card = enemyCards[idx];
            const isValidTarget = attackingCardId && card;

            return (
              <div key={idx} className="relative h-full flex flex-col justify-center">
                {card ? (
                  <motion.div
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{
                      type: "spring",
                      delay: idx * 0.1,
                    }}
                    className={`h-full flex flex-col justify-center ${isValidTarget ? "cursor-crosshair" : ""}`}
                    data-card-id={card.id}
                  >
                    <Card
                      {...card}
                      type="minion"
                      onClick={() => onCardSelect?.(card.id, true)}
                      isSelected={selectedCard === card.id}
                    />
                    {card.isTaunting && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                        <div className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                          嘲讽
                        </div>
                      </div>
                    )}
                    {/* Attack Target Indicator */}
                    {isValidTarget && (
                      <motion.div
                        animate={{
                          boxShadow: [
                            "0 0 0 2px #ef4444",
                            "0 0 0 4px #ef4444",
                            "0 0 0 2px #ef4444",
                          ],
                        }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute inset-0 rounded-xl pointer-events-none z-20"
                      />
                    )}
                  </motion.div>
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-gray-600/30 rounded-xl flex items-center justify-center p-2" data-slot-index={idx}>
                    <div className="w-full h-full rounded-lg" />
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-red-500/5 to-transparent rounded-xl -z-10" />
      </div>

      {/* Center Divider */}
      <div className="relative h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent my-2 shrink-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1E1E2F] px-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 border-4 border-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-500/50">
            <span className="text-white font-bold text-sm">VS</span>
          </div>
        </div>
      </div>

      {/* Player Board */}
      <div className="relative flex-1 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-7 gap-2 h-full"
        >
          {Array.from({ length: 7 }).map((_, idx) => {
            const card = playerCards[idx];
            return (
              <div key={idx} className="relative h-full flex flex-col justify-center">
                <BoardSlot
                  index={idx}
                  onCardDrop={(cardId, slotIndex) => onCardDrop?.(cardId, slotIndex)}
                  isEmpty={!card}
                  className="h-full w-full"
                >
                  {card && (
                    <motion.div
                      initial={{ scale: 0, rotateY: 180 }}
                      animate={{ scale: 1, rotateY: 0 }}
                      transition={{
                        type: "spring",
                        delay: idx * 0.1,
                      }}
                      className="h-full flex flex-col justify-center"
                      data-card-id={card.id}
                    >
                      <Card
                        {...card}
                        type="minion"
                        onClick={() => onCardSelect?.(card.id, false)}
                        isSelected={selectedCard === card.id}
                      />
                      {card.canAttack && (
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute inset-0 border-3 border-green-400 rounded-xl pointer-events-none z-20"
                        />
                      )}
                    </motion.div>
                  )}
                </BoardSlot>
              </div>
            );
          })}
        </motion.div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-blue-500/5 to-transparent rounded-xl -z-10" />
      </div>
    </div>
  );
}