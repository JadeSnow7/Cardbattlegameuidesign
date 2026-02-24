import { motion } from "motion/react";
import { DraggableCard } from "./DraggableCard";
import { CardData } from "../types/game";

interface HandCardsProps {
  cards: CardData[];
  currentMana: number;
  onCardPlay?: (id: string) => void;
  selectedCard?: string | null;
  onCardSelect?: (id: string) => void;
}

export function HandCards({
  cards,
  currentMana,
  onCardPlay,
  selectedCard,
  onCardSelect,
}: HandCardsProps) {
  return (
    <div className="relative">
      {/* Hand Container with Fan Effect */}
      <div className="flex justify-center items-end gap-2 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent">
        {cards.map((card, idx) => {
          const totalCards = cards.length;
          const middleIndex = (totalCards - 1) / 2;
          const offsetFromCenter = idx - middleIndex;
          const rotation = offsetFromCenter * 3; // degrees
          const yOffset = Math.abs(offsetFromCenter) * 4;

          return (
            <motion.div
              key={card.id}
              initial={{ y: 100, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
                rotate: rotation,
              }}
              transition={{
                type: "spring",
                delay: idx * 0.05,
              }}
              style={{
                transformOrigin: "bottom center",
                marginBottom: `${yOffset}px`,
              }}
              className="w-32"
            >
              <DraggableCard
                {...card}
                currentMana={currentMana}
                onCardPlay={onCardPlay}
                selectedCard={selectedCard}
                onCardSelect={onCardSelect}
              />
            </motion.div>
          );
        })}

        {/* Empty Hand Message */}
        {cards.length === 0 && (
          <div className="text-gray-400 text-sm py-8">手牌为空</div>
        )}
      </div>

      {/* Card Count Indicator */}
      <div className="absolute top-2 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-500/30">
        <span className="text-white text-sm font-semibold">
          手牌: {cards.length}
        </span>
      </div>
    </div>
  );
}