import { useState } from 'react';

export interface ClassSpriteProps {
  classId: string;
  gender?: 'male' | 'female';
  className?: string;
  state?: 'idle' | 'attack' | 'hit';
}

const CHARACTER_ASSETS: Record<string, { male: string; female: string }> = {
  tank: {
    male: '/assets/characters/tank_male.png',
    female: '/assets/characters/tank_female.png',
  },
  fighter: {
    male: '/assets/characters/fighter_male.png',
    female: '/assets/characters/fighter_female.png',
  },
  assassin: {
    male: '/assets/characters/assassin_male.png',
    female: '/assets/characters/assassin_female.png',
  },
  gunner: {
    male: '/assets/characters/gunner_male.png',
    female: '/assets/characters/gunner_female.png',
  },
};

export function ClassSprite({ classId, gender = 'male', className = '', state = 'idle' }: ClassSpriteProps) {
  const normClass = classId?.toLowerCase() || 'fighter';
  const normGender = gender === 'female' ? 'female' : 'male';
  const [loadError, setLoadError] = useState(false);

  const asset = CHARACTER_ASSETS[normClass]?.[normGender] || CHARACTER_ASSETS.fighter.male;

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl ${className}`}>
      {!loadError ? (
        <img
          key={`${normClass}_${normGender}`}
          src={asset}
          alt={`${normClass} ${normGender}`}
          onError={() => setLoadError(true)}
          style={{ imageRendering: 'pixelated' }}
          className="w-full h-full object-contain object-center filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)] transform transition-transform duration-300 hover:scale-110 select-none pointer-events-none"
          loading="eager"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#271f20] text-amber-300 p-2">
          <span className="font-bold text-xs uppercase">{normClass}</span>
          <span className="text-[10px] text-white/50">{normGender}</span>
        </div>
      )}
    </div>
  );
}
