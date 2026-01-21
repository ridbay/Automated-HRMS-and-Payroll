
import React from 'react';
import { motion } from 'framer-motion';

// Defined ConfettiParticleProps interface to fix type mismatch error on line 50
interface ConfettiParticleProps {
  color: string;
  index: number;
}

// Typed ConfettiParticle as React.FC to correctly handle standard React props like 'key'
const ConfettiParticle: React.FC<ConfettiParticleProps> = ({ color, index }) => {
  const randomX = Math.random() * 200 - 100;
  const randomY = Math.random() * -300 - 100;
  const randomRotate = Math.random() * 360;

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
      animate={{ 
        x: randomX, 
        y: randomY, 
        opacity: 0, 
        scale: 0.5, 
        rotate: randomRotate 
      }}
      transition={{ 
        duration: 2 + Math.random(), 
        ease: "easeOut",
        delay: index * 0.01 
      }}
      className={`absolute w-3 h-3 rounded-sm ${color} z-[300] pointer-events-none`}
      style={{
        left: '50%',
        top: '50%',
      }}
    />
  );
};

interface CelebrationProps {
  active: boolean;
}

const Celebration: React.FC<CelebrationProps> = ({ active }) => {
  if (!active) return null;

  const colors = [
    'bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 
    'bg-amber-500', 'bg-violet-500', 'bg-sky-500'
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-[250] flex items-center justify-center">
      {Array.from({ length: 60 }).map((_, i) => (
        <ConfettiParticle 
          key={i} 
          index={i} 
          color={colors[i % colors.length]} 
        />
      ))}
    </div>
  );
};

export default Celebration;
