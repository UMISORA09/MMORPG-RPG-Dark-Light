interface ClassSpriteProps {
  classId: string;
  className?: string;
}

export function ClassSprite({ classId, className = '' }: ClassSpriteProps) {
  if (classId === 'gunner') {
    return (
      <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <rect x="26" y="8" width="12" height="12" fill="hsl(190 95% 45%)" />
        {/* Body */}
        <rect x="24" y="20" width="16" height="20" fill="hsl(190 95% 35%)" />
        {/* Arms */}
        <rect x="16" y="22" width="8" height="14" fill="hsl(190 95% 45%)" />
        <rect x="40" y="22" width="8" height="14" fill="hsl(190 95% 45%)" />
        {/* Gun (right arm) */}
        <rect x="48" y="26" width="8" height="4" fill="hsl(0 0% 30%)" />
        {/* Legs */}
        <rect x="26" y="40" width="6" height="16" fill="hsl(190 95% 30%)" />
        <rect x="32" y="40" width="6" height="16" fill="hsl(190 95% 30%)" />
        {/* Visor */}
        <rect x="28" y="12" width="8" height="4" fill="hsl(190 95% 60%)" opacity="0.8" />
      </svg>
    );
  }
  
  if (classId === 'assassin') {
    return (
      <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <rect x="26" y="8" width="12" height="12" fill="hsl(270 60% 30%)" />
        {/* Hood/Cape */}
        <polygon points="20,12 32,8 44,12 44,24 20,24" fill="hsl(270 60% 20%)" />
        {/* Body */}
        <rect x="24" y="20" width="16" height="18" fill="hsl(270 60% 25%)" />
        {/* Arms */}
        <rect x="18" y="22" width="6" height="12" fill="hsl(270 60% 30%)" />
        <rect x="40" y="22" width="6" height="12" fill="hsl(270 60% 30%)" />
        {/* Daggers */}
        <polygon points="16,30 18,28 20,30" fill="hsl(0 0% 70%)" />
        <polygon points="44,30 46,28 48,30" fill="hsl(0 0% 70%)" />
        {/* Legs */}
        <rect x="26" y="38" width="6" height="18" fill="hsl(270 60% 20%)" />
        <rect x="32" y="38" width="6" height="18" fill="hsl(270 60% 20%)" />
        {/* Eyes glow */}
        <rect x="28" y="14" width="3" height="2" fill="hsl(270 100% 70%)" />
        <rect x="33" y="14" width="3" height="2" fill="hsl(270 100% 70%)" />
      </svg>
    );
  }
  
  if (classId === 'fighter') {
    return (
      <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <rect x="26" y="8" width="12" height="12" fill="hsl(0 72% 51%)" />
        {/* Headband */}
        <rect x="24" y="10" width="16" height="3" fill="hsl(0 72% 30%)" />
        {/* Body */}
        <rect x="22" y="20" width="20" height="20" fill="hsl(0 72% 45%)" />
        {/* Muscular arms */}
        <rect x="14" y="22" width="8" height="16" fill="hsl(0 72% 51%)" />
        <rect x="42" y="22" width="8" height="16" fill="hsl(0 72% 51%)" />
        {/* Fists */}
        <rect x="12" y="36" width="6" height="6" fill="hsl(0 72% 40%)" />
        <rect x="46" y="36" width="6" height="6" fill="hsl(0 72% 40%)" />
        {/* Belt */}
        <rect x="22" y="34" width="20" height="3" fill="hsl(45 100% 50%)" />
        {/* Legs */}
        <rect x="24" y="40" width="7" height="16" fill="hsl(0 72% 35%)" />
        <rect x="33" y="40" width="7" height="16" fill="hsl(0 72% 35%)" />
      </svg>
    );
  }
  
  if (classId === 'tank') {
    return (
      <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
        {/* Helmet */}
        <rect x="24" y="6" width="16" height="14" fill="hsl(45 100% 40%)" />
        {/* Helmet visor */}
        <rect x="26" y="12" width="12" height="4" fill="hsl(45 100% 50%)" opacity="0.6" />
        {/* Body armor */}
        <rect x="20" y="20" width="24" height="22" fill="hsl(45 100% 35%)" />
        {/* Shoulder pads */}
        <rect x="14" y="20" width="6" height="8" fill="hsl(45 100% 40%)" />
        <rect x="44" y="20" width="6" height="8" fill="hsl(45 100% 40%)" />
        {/* Arms */}
        <rect x="16" y="28" width="6" height="12" fill="hsl(45 100% 30%)" />
        <rect x="42" y="28" width="6" height="12" fill="hsl(45 100% 30%)" />
        {/* Shield (left arm) */}
        <rect x="8" y="26" width="8" height="14" fill="hsl(45 100% 45%)" />
        <rect x="10" y="28" width="4" height="10" fill="hsl(45 100% 55%)" />
        {/* Legs */}
        <rect x="24" y="42" width="7" height="14" fill="hsl(45 100% 25%)" />
        <rect x="33" y="42" width="7" height="14" fill="hsl(45 100% 25%)" />
        {/* Chest emblem */}
        <rect x="30" y="26" width="4" height="4" fill="hsl(45 100% 60%)" />
      </svg>
    );
  }
  
  return null;
}
