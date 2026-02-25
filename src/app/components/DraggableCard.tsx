import { useDrag } from "react-dnd";
import { Card } from "./Card";
import { CardData } from "../types/game";

interface DraggableCardProps extends CardData {
  currentMana: number;
  onCardPlay?: (id: string, slotIndex?: number) => void;
  selectedCard?: string | null;
  onCardSelect?: (id: string) => void;
  onUnplayableAttempt?: (payload: { cardName: string; cost: number; currentMana: number }) => void;
}

export const ItemTypes = {
  CARD: "card",
};

export function DraggableCard({
  currentMana,
  onCardPlay,
  selectedCard,
  onCardSelect,
  onUnplayableAttempt,
  ...card
}: DraggableCardProps) {
  const isPlayable = card.cost <= currentMana;

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.CARD,
      item: { id: card.id, card },
      canDrag: isPlayable,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [card.id, isPlayable]
  );

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isPlayable ? "grab" : "not-allowed",
      }}
    >
      <Card
        {...card}
        isDraggable={true}
        isPlayable={isPlayable}
        isSelected={selectedCard === card.id}
        onClick={() => {
          if (isPlayable) {
            onCardSelect?.(card.id);
            return;
          }
          onUnplayableAttempt?.({
            cardName: card.name,
            cost: card.cost,
            currentMana,
          });
        }}
      />
    </div>
  );
}
