
import React from 'react';
import { MuscleGroup } from '../types';

interface MuscleMapProps {
  intensities: Record<MuscleGroup, number>; // 0 to 1
}

const MuscleMap: React.FC<MuscleMapProps> = ({ intensities }) => {
  const getColor = (group: MuscleGroup) => {
    const val = intensities[group] || 0;
    if (val === 0) return 'fill-zinc-200 dark:fill-zinc-800';
    if (val < 0.3) return 'fill-cyan-900';
    if (val < 0.6) return 'fill-cyan-600';
    return 'fill-cyan-400';
  };

  return (
    <div className="relative w-full aspect-[2/3] flex items-center justify-center">
      <svg viewBox="0 0 200 300" className="h-full w-auto drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]">
        {/* Head */}
        <circle cx="100" cy="30" r="15" className="fill-zinc-200 dark:fill-zinc-900" />
        
        {/* Neck */}
        <rect x="95" y="45" width="10" height="10" className="fill-zinc-200 dark:fill-zinc-900" />

        {/* Shoulders */}
        <path d="M70 55 Q100 50 130 55 L140 70 Q100 65 60 70 Z" className={getColor(MuscleGroup.SHOULDERS)} />

        {/* Chest */}
        <path d="M70 75 Q100 70 130 75 L130 110 Q100 115 70 110 Z" className={getColor(MuscleGroup.CHEST)} />

        {/* Abs/Core */}
        <path d="M75 115 L125 115 L120 160 L80 160 Z" className={getColor(MuscleGroup.CORE)} />

        {/* Back (Visible on sides) */}
        <path d="M65 75 L70 75 L70 110 L65 110 Z" className={getColor(MuscleGroup.BACK)} />
        <path d="M130 75 L135 75 L135 110 L130 110 Z" className={getColor(MuscleGroup.BACK)} />

        {/* Upper Arms */}
        <path d="M55 75 L65 75 L65 130 L55 130 Z" className={getColor(MuscleGroup.TRICEPS)} />
        <path d="M135 75 L145 75 L145 130 L135 130 Z" className={getColor(MuscleGroup.TRICEPS)} />
        
        <path d="M60 75 L68 75 L68 110 L60 110 Z" className={getColor(MuscleGroup.BICEPS)} />
        <path d="M132 75 L140 75 L140 110 L132 110 Z" className={getColor(MuscleGroup.BICEPS)} />

        {/* Pelvis */}
        <path d="M80 165 L120 165 L125 185 L75 185 Z" className={getColor(MuscleGroup.GLUTES)} />

        {/* Upper Legs (Quads/Hams) */}
        <path d="M75 190 L98 190 L95 245 L78 245 Z" className={getColor(MuscleGroup.QUADS)} />
        <path d="M102 190 L125 190 L122 245 L105 245 Z" className={getColor(MuscleGroup.QUADS)} />

        {/* Lower Legs (Calves) */}
        <path d="M80 250 L93 250 L91 290 L82 290 Z" className={getColor(MuscleGroup.CALVES)} />
        <path d="M107 250 L120 250 L118 290 L109 290 Z" className={getColor(MuscleGroup.CALVES)} />
      </svg>
      
      {/* Glow Effect Overlays for Active Muscles */}
      <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-cyan-500/5 to-transparent"></div>
    </div>
  );
};

export default MuscleMap;
