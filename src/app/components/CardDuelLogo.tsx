import { motion } from "motion/react";

interface LogoProps {
  size?: number;
  showText?: boolean;
  animate?: boolean;
}

export function CardDuelLogo({ size = 120, showText = true, animate = true }: LogoProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Logo Icon */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={animate ? { scale: 0, rotate: -180 } : undefined}
        animate={animate ? { scale: 1, rotate: 0 } : undefined}
        transition={animate ? { type: "spring", duration: 0.8 } : undefined}
      >
        {/* Background Circle Glow */}
        <motion.circle
          cx="100"
          cy="100"
          r="90"
          fill="url(#glow)"
          animate={animate ? {
            opacity: [0.3, 0.6, 0.3],
          } : undefined}
          transition={animate ? {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          } : undefined}
        />

        {/* Left Card */}
        <motion.g
          initial={animate ? { x: -20, opacity: 0 } : undefined}
          animate={animate ? { x: 0, opacity: 1 } : undefined}
          transition={animate ? { delay: 0.3, duration: 0.5 } : undefined}
        >
          <rect
            x="30"
            y="60"
            width="60"
            height="85"
            rx="8"
            fill="url(#cardGradient1)"
            stroke="#5C6BC0"
            strokeWidth="3"
          />
          <circle cx="60" cy="90" r="12" fill="#EF5350" />
          <path
            d="M 45 110 L 60 125 L 75 110"
            stroke="#66BB6A"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </motion.g>

        {/* Right Card */}
        <motion.g
          initial={animate ? { x: 20, opacity: 0 } : undefined}
          animate={animate ? { x: 0, opacity: 1 } : undefined}
          transition={animate ? { delay: 0.3, duration: 0.5 } : undefined}
        >
          <rect
            x="110"
            y="60"
            width="60"
            height="85"
            rx="8"
            fill="url(#cardGradient2)"
            stroke="#29B6F6"
            strokeWidth="3"
          />
          <circle cx="140" cy="90" r="12" fill="#FFD700" />
          <path
            d="M 125 110 L 140 95 L 155 110"
            stroke="#EF5350"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </motion.g>

        {/* Center Sword Clash */}
        <motion.g
          initial={animate ? { scale: 0 } : undefined}
          animate={animate ? { scale: 1 } : undefined}
          transition={animate ? { delay: 0.5, type: "spring" } : undefined}
        >
          {/* Left Sword */}
          <path
            d="M 85 100 L 70 85 L 75 80 L 90 95 Z"
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="2"
          />
          <rect x="68" y="83" width="4" height="12" fill="#8B4513" transform="rotate(-45 70 85)" />

          {/* Right Sword */}
          <path
            d="M 115 100 L 130 85 L 125 80 L 110 95 Z"
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="2"
          />
          <rect x="128" y="83" width="4" height="12" fill="#8B4513" transform="rotate(45 130 85)" />

          {/* Clash Effect */}
          <motion.g
            animate={animate ? {
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8],
            } : undefined}
            transition={animate ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            } : undefined}
          >
            <circle cx="100" cy="90" r="8" fill="#FFF" opacity="0.8" />
            <circle cx="100" cy="90" r="12" fill="none" stroke="#FFA500" strokeWidth="2" />
            <circle cx="100" cy="90" r="16" fill="none" stroke="#FFD700" strokeWidth="1.5" />
          </motion.g>
        </motion.g>

        {/* Energy Particles */}
        {[
          { x: 100, y: 40, delay: 0 },
          { x: 140, y: 100, delay: 0.3 },
          { x: 60, y: 100, delay: 0.6 },
          { x: 100, y: 150, delay: 0.9 },
        ].map((particle, i) => (
          <motion.circle
            key={i}
            cx={particle.x}
            cy={particle.y}
            r="3"
            fill="#29B6F6"
            animate={animate ? {
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            } : undefined}
            transition={animate ? {
              duration: 2,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut"
            } : undefined}
          />
        ))}

        {/* Gradients */}
        <defs>
          <radialGradient id="glow">
            <stop offset="0%" stopColor="#5C6BC0" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1E1E2F" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="cardGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5C6BC0" />
            <stop offset="100%" stopColor="#3949AB" />
          </linearGradient>

          <linearGradient id="cardGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#29B6F6" />
            <stop offset="100%" stopColor="#0288D1" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Logo Text */}
      {showText && (
        <motion.div
          className="text-center"
          initial={animate ? { opacity: 0, y: 20 } : undefined}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={animate ? { delay: 0.8, duration: 0.5 } : undefined}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg">
            CARD DUEL
          </h1>
          <p className="text-sm text-gray-400 tracking-widest uppercase">
            战术对决
          </p>
        </motion.div>
      )}
    </div>
  );
}

// Compact version for header/nav
export function CardDuelLogoCompact({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simplified Logo for compact display */}
        <circle cx="100" cy="100" r="90" fill="url(#compactGlow)" />
        
        {/* Cards */}
        <rect x="40" y="70" width="50" height="70" rx="6" fill="url(#cardGradient1)" stroke="#5C6BC0" strokeWidth="3" />
        <rect x="110" y="70" width="50" height="70" rx="6" fill="url(#cardGradient2)" stroke="#29B6F6" strokeWidth="3" />
        
        {/* Clash Symbol */}
        <circle cx="100" cy="100" r="15" fill="#FFD700" stroke="#FFA500" strokeWidth="3" />
        <path d="M 90 100 L 110 100 M 100 90 L 100 110" stroke="#FFF" strokeWidth="4" strokeLinecap="round" />

        <defs>
          <radialGradient id="compactGlow">
            <stop offset="0%" stopColor="#5C6BC0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1E1E2F" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cardGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5C6BC0" />
            <stop offset="100%" stopColor="#3949AB" />
          </linearGradient>
          <linearGradient id="cardGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#29B6F6" />
            <stop offset="100%" stopColor="#0288D1" />
          </linearGradient>
        </defs>
      </svg>
      
      <div className="flex flex-col">
        <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          CARD DUEL
        </span>
      </div>
    </div>
  );
}
