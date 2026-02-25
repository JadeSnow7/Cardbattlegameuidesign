import { motion } from "motion/react";
import { DraggableCard } from "./DraggableCard";
import { CardData } from "../types/game";

interface HandCardsProps {
  cards: CardData[];
  currentMana: number;
  onCardPlay?: (id: string) => void;
  selectedCard?: string | null;
  onCardSelect?: (id: string) => void;
  onUnplayableAttempt?: (payload: { cardName: string; cost: number; currentMana: number }) => void;
  layout?: "overlay" | "docked";
}

export function HandCards({
  cards,
  currentMana,
  onCardPlay,
  selectedCard,
  onCardSelect,
  onUnplayableAttempt,
  layout = "overlay",
}: HandCardsProps) {
  const isDocked = layout === "docked";
  const totalCards = cards.length;

  const cardWidth = isDocked ? (totalCards >= 7 ? 90 : totalCards >= 5 ? 96 : 106) : 128;
  const overlap = isDocked ? Math.min(38, Math.max(14, (totalCards - 3) * 6)) : 0;
  const maxRotation = isDocked ? 12 : 8;

  return (
    <div className={`relative ${isDocked ? "h-full" : ""}`}>
      {/* Hand Container with Fan Effect */}
      <div
        className={`flex justify-center items-end px-4 ${
          isDocked
            ? "h-full gap-0 py-2 bg-gradient-to-t from-black/55 via-black/35 to-transparent"
            : "gap-2 py-3 bg-gradient-to-t from-black/60 to-transparent"
        }`}
      >
        {cards.map((card, idx) => {
          const middleIndex = (totalCards - 1) / 2;
          const offsetFromCenter = idx - middleIndex;
          const rotation = totalCards > 1 ? (offsetFromCenter / middleIndex) * maxRotation : 0;
          const yOffset = isDocked ? Math.abs(offsetFromCenter) * 1.6 : Math.abs(offsetFromCenter) * 4;
          const isSelected = selectedCard === card.id;

          return (
            <motion.div
              key={card.id}
              initial={{ y: 100, opacity: 0 }}
              animate={{
                y: isSelected && isDocked ? -20 : 0,
                opacity: 1,
                rotate: rotation,
                scale: isSelected && isDocked ? 1.06 : 1,
              }}
              transition={{
                type: "spring",
                delay: idx * 0.05,
                stiffness: 300,
                damping: 26,
              }}
              style={{
                transformOrigin: "bottom center",
                marginBottom: `${yOffset}px`,
                marginLeft: idx === 0 ? 0 : `${-overlap}px`,
                width: `${cardWidth}px`,
                zIndex: isSelected ? 50 : 10 + idx,
              }}
              className="shrink-0"
            >
              <DraggableCard
                {...card}
                currentMana={currentMana}
                onCardPlay={onCardPlay}
                selectedCard={selectedCard}
                onCardSelect={onCardSelect}
                onUnplayableAttempt={onUnplayableAttempt}
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
      <div className={`absolute left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-500/30 ${isDocked ? "top-1" : "top-2"}`}>
        <span className="text-white text-sm font-semibold">
          手牌: {cards.length}
        </span>
      </div>
    </div>
  );
}
