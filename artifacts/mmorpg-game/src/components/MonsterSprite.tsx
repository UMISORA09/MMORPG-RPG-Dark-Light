interface MonsterSpriteProps {
  monsterId: string;
  className?: string;
  state?: 'idle' | 'hit';
}

export function MonsterSprite({ monsterId, className = '', state = 'idle' }: MonsterSpriteProps) {
  const spriteClass = `${className} monster-sprite monster-${state}`;

  const colors: Record<string, { main: string; dark: string; light: string }> = {
    slime: { main: '#63d471', dark: '#247a55', light: '#c6ff91' },
    goblin: { main: '#79a83b', dark: '#304d31', light: '#d1e780' },
    orc: { main: '#8495a7', dark: '#334456', light: '#d9e5ed' },
    wolf: { main: '#7a89a9', dark: '#273653', light: '#d7e7ff' },
    skeleton: { main: '#d8d2b9', dark: '#6f6b62', light: '#fff5c7' },
    vampire: { main: '#a94b86', dark: '#351934', light: '#f18ac0' },
    dragon: { main: '#d65348', dark: '#4f1a22', light: '#ffbf69' },
  };

  const color = colors[monsterId] ?? colors.slime;

  return (
    <svg
      viewBox="0 0 96 96"
      className={spriteClass}
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <g className="monster-shadow"><ellipse cx="48" cy="86" rx="27" ry="5" /></g>
      {monsterId === 'slime' ? (
        <g className="monster-core">
          <path d="M17 64v-9l8-17 12-9h22l12 9 8 17v9H71v10H25V64z" fill={color.main} />
          <path d="M25 64h46v10H25z" fill={color.dark} />
          <path d="M31 43h9v9h-9zM56 43h9v9h-9z" fill="#11202a" />
          <path d="M34 40h4v4h-4zM59 40h4v4h-4z" fill={color.light} />
          <path d="M42 57h12v5H42z" fill={color.light} />
        </g>
      ) : (
        <g className="monster-core">
          <path d="M29 25h38v43H29z" fill={color.main} />
          <path d="M23 36h9v27h-9zM64 36h9v27h-9z" fill={color.dark} />
          <path d="M34 68h11v17H34zM51 68h11v17H51z" fill={color.dark} />
          <path d="M21 82h25v6H21zM50 82h25v6H50z" fill={color.dark} />
          <path d="M35 39h8v8h-8zM53 39h8v8h-8z" fill="#101820" />
          <path d="M37 40h4v4h-4zM55 40h4v4h-4z" fill={color.light} />
          <path d="M39 55h18v5H39z" fill={color.dark} />
          {monsterId === 'goblin' && <path d="M20 28h13v8H20zM63 28h13v8H63z" fill={color.main} />}
          {monsterId === 'orc' && <path d="M35 25h26v8H35z" fill={color.dark} />}
          {monsterId === 'wolf' && <path d="M28 18h12v12H28zM56 18h12v12H56z" fill={color.dark} />}
          {monsterId === 'skeleton' && <path d="M39 62h18v5H39zM32 49h7v5h-7zM57 49h7v5h-7z" fill={color.light} />}
          {monsterId === 'vampire' && <path d="M36 57l5 9 5-9 5 9 5-9" fill="none" stroke={color.light} strokeWidth="3" />}
          {monsterId === 'dragon' && <path d="M18 29h12v9H18zM66 29h12v9H66zM30 12h12v13H30zM54 12h12v13H54z" fill={color.dark} />}
        </g>
      )}
    </svg>
  );
}