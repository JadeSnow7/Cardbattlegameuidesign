import { useDrop } from "react-dnd";
import { ItemTypes } from "./DraggableCard";
import { motion } from "motion/react";

interface BoardSlotProps {
  index: number;
  onCardDrop: (cardId: string, slotIndex: number) => void;
  isEmpty: boolean;
  children?: React.ReactNode;
}

export function BoardSlot({ index, onCardDrop, isEmpty, children }: BoardSlotProps) {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ItemTypes.CARD,
      drop: (item: { id: string; card: any }) => {
        onCardDrop(item.id, index);
      },
      canDrop: (item) => {
        return item.card.type === "minion";
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [index]
  );

  const isActive = isOver && canDrop;

  return (
    <div ref={drop} className="relative w-full h-full">
      {isEmpty ? (
        <motion.div
          animate={{
            borderColor: isActive ? "#22c55e" : "rgba(75, 85, 99, 0.3)",
            backgroundColor: isActive ? "rgba(34, 197, 94, 0.1)" : "transparent",
            scale: isActive ? 1.05 : 1,
          }}
          className="w-full h-full border-2 border-dashed rounded-xl transition-all"
        />
      ) : (
        children
      )}

      {/* Drop Indicator */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 border-4 border-green-400 rounded-xl pointer-events-none bg-green-400/20"
        />
      )}
    </div>
  );
}
