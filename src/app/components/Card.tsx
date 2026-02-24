import { motion } from "motion/react";
import { Sword, Heart, Zap, Shield, Wind } from "lucide-react";
import { useState } from "react";

interface CardProps {
  id: string;
  name: string;
  cost: number;
  attack?: number;
  health?: number;
  image: string;
  description: string;
  type: "minion" | "spell";
  keywords?: string[];
  onPlay?: (id: string) => void;
  isDraggable?: boolean;
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export function Card({
  id,
  name,
  cost,
  attack,
  health,
  image,
  description,
  type,
  keywords = [],
  onPlay,
  isDraggable = false,
  isPlayable = true,
  isSelected = false,
  onClick,
}: CardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const cardVariants = {
    hover: {
      scale: isDraggable ? 1.15 : 1.05,
      y: isDraggable ? -20 : -5,
      rotateZ: isDraggable ? 0 : 0,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      className={`relative w-full cursor-pointer select-none ${
        !isPlayable ? "opacity-50" : ""
      }`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Card Container */}
      <div
        className={`relative rounded-xl overflow-hidden border-4 shadow-2xl ${
          type === "spell"
            ? "border-purple-500/60 shadow-purple-500/30"
            : "border-yellow-600/60 shadow-yellow-600/30"
        } ${isSelected ? "ring-4 ring-green-400" : ""} ${
          isHovered ? "shadow-3xl" : ""
        }`}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={image}
            alt={name}
            className={`w-full h-full object-cover ${
              isHovered ? "scale-110" : "scale-100"
            } transition-transform duration-500`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        {/* Cost Badge */}
        <div className="absolute top-2 left-2 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border-3 border-white flex items-center justify-center shadow-lg z-10">
          <span className="text-xl font-bold text-white drop-shadow-lg">
            {cost}
          </span>
        </div>

        {/* Card Content */}
        <div className="relative p-3 pt-16 h-48 flex flex-col justify-end">
          {/* Keywords */}
          {keywords.length > 0 && (
            <div className="flex gap-1 mb-2">
              {keywords.map((keyword, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-purple-600/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white"
                >
                  {keyword === "飞行" && <Wind className="w-3 h-3" />}
                  {keyword === "突袭" && <Zap className="w-3 h-3" />}
                  {keyword === "嘲讽" && <Shield className="w-3 h-3" />}
                  <span>{keyword}</span>
                </div>
              ))}
            </div>
          )}

          {/* Name */}
          <h3 className="text-white font-bold text-sm mb-1 drop-shadow-lg">
            {name}
          </h3>

          {/* Description */}
          <p className="text-gray-200 text-xs mb-2 line-clamp-2">{description}</p>

          {/* Stats for Minions */}
          {type === "minion" && (
            <div className="flex justify-between mt-auto">
              <div className="flex items-center gap-1 bg-gradient-to-br from-red-600 to-red-700 px-3 py-1 rounded-lg border-2 border-red-400 shadow-lg">
                <Sword className="w-4 h-4 text-yellow-300" />
                <span className="text-white font-bold text-lg">{attack}</span>
              </div>
              <div className="flex items-center gap-1 bg-gradient-to-br from-green-600 to-green-700 px-3 py-1 rounded-lg border-2 border-green-400 shadow-lg">
                <Heart className="w-4 h-4 text-red-300" />
                <span className="text-white font-bold text-lg">{health}</span>
              </div>
            </div>
          )}

          {/* Spell Badge */}
          {type === "spell" && (
            <div className="mt-auto">
              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 rounded-lg border-2 border-purple-400">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span className="text-white font-bold text-sm">法术</span>
              </div>
            </div>
          )}
        </div>

        {/* Glow Effect on Hover */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-yellow-400/20 via-transparent to-transparent pointer-events-none"
          />
        )}
      </div>

      {/* Not Playable Overlay */}
      {!isPlayable && (
        <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-sm">费用不足</span>
        </div>
      )}
    </motion.div>
  );
}
