interface ClassSpriteProps {
  classId: string;
  className?: string;
  state?: 'idle' | 'attack' | 'hit';
}

export function ClassSprite({ classId, className = '', state = 'idle' }: ClassSpriteProps) {
  const spriteClass = `${className} pixel-sprite sprite-${state}`;

  if (classId === 'gunner') {
    return (
      <svg viewBox="0 0 96 96" className={spriteClass} xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" aria-hidden="true">
        <g className="sprite-shadow"><ellipse cx="48" cy="86" rx="25" ry="5" /></g>
        <g className="sprite-core">
          <path d="M31 18h34v26H31z" fill="#123448" />
          <path d="M37 12h22v7H37zM31 20h6v18h-6zM59 20h6v18h-6z" fill="#00b9eb" />
          <path d="M37 20h22v13H37z" fill="#176b8f" />
          <path d="M41 23h17v5H41z" fill="#9af3ff" />
          <path d="M34 43h29v25H34z" fill="#0e6d8e" />
          <path d="M40 43h16v18H40z" fill="#11a4cd" />
          <path d="M27 46h8v17h-8zM63 46h8v17h-8z" fill="#00b9eb" />
          <path d="M22 58h14v7H22zM62 58h14v7H62z" fill="#7eeaff" />
          <path d="M39 67h8v17h-8zM50 67h8v17h-8z" fill="#123448" />
          <path d="M35 84h14v5H35zM53 84h14v5H53z" fill="#071c2a" />
          <path d="M68 48h8v5h-8zM76 43h15v9H76zM88 39h5v13h-5z" fill="#344957" />
          <path d="M76 43h17v3H76z" fill="#f2c94c" />
          <path d="M40 10h16v4H40z" fill="#b6f7ff" />
        </g>
      </svg>
    );
  }
  
  if (classId === 'assassin') {
    return (
      <svg viewBox="0 0 96 96" className={spriteClass} xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" aria-hidden="true">
        <g className="sprite-shadow"><ellipse cx="48" cy="86" rx="24" ry="5" /></g>
        <g className="sprite-core">
          <path d="M27 22L48 7l21 15v29H27z" fill="#1e1439" />
          <path d="M34 19h28v20H34z" fill="#39215f" />
          <path d="M39 24h18v8H39z" fill="#e7c7ff" />
          <path d="M41 27h5v3h-5zM50 27h5v3h-5z" fill="#e255ff" />
          <path d="M32 41h32v27H32z" fill="#29164b" />
          <path d="M39 41h18v21H39z" fill="#5a2e87" />
          <path d="M25 43h9v20h-9zM62 43h9v20h-9z" fill="#39215f" />
          <path d="M19 55h15v5H19zM62 55h15v5H62z" fill="#d9d6e8" />
          <path d="M18 52h4v13h-4zM74 52h4v13h-4z" fill="#e255ff" />
          <path d="M39 67h9v18h-9zM50 67h9v18h-9z" fill="#1e1439" />
          <path d="M34 84h15v5H34zM53 84h15v5H53z" fill="#0b0716" />
          <path d="M27 22h7v30h-7zM62 22h7v30h-7z" fill="#140e29" />
        </g>
      </svg>
    );
  }
  
  if (classId === 'fighter') {
    return (
      <svg viewBox="0 0 96 96" className={spriteClass} xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" aria-hidden="true">
        <g className="sprite-shadow"><ellipse cx="48" cy="86" rx="27" ry="5" /></g>
        <g className="sprite-core">
          <path d="M34 12h28v28H34z" fill="#7e251f" />
          <path d="M39 16h18v16H39z" fill="#e55347" />
          <path d="M31 17h34v5H31z" fill="#f2c94c" />
          <path d="M42 23h5v4h-5zM51 23h5v4h-5z" fill="#28121a" />
          <path d="M29 39h38v29H29z" fill="#9f2d2a" />
          <path d="M38 42h20v20H38z" fill="#e55347" />
          <path d="M20 41h11v22H20zM65 41h11v22H65z" fill="#e55347" />
          <path d="M13 57h17v10H13zM66 57h17v10H66z" fill="#b83830" />
          <path d="M29 66h38v6H29z" fill="#f2c94c" />
          <path d="M38 71h10v14H38zM50 71h10v14H50z" fill="#7e251f" />
          <path d="M32 84h17v5H32zM52 84h17v5H52z" fill="#28121a" />
          <path d="M39 47h18v6H39z" fill="#f5a623" />
        </g>
      </svg>
    );
  }
  
  if (classId === 'tank') {
    return (
      <svg viewBox="0 0 96 96" className={spriteClass} xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" aria-hidden="true">
        <g className="sprite-shadow"><ellipse cx="48" cy="86" rx="30" ry="5" /></g>
        <g className="sprite-core">
          <path d="M30 8h36v30H30z" fill="#8b5d0b" />
          <path d="M36 13h24v16H36z" fill="#e6aa2c" />
          <path d="M36 24h24v7H36z" fill="#fff0a3" />
          <path d="M25 37h46v33H25z" fill="#75500b" />
          <path d="M34 40h28v24H34z" fill="#d48e13" />
          <path d="M15 38h12v25H15zM69 38h12v25H69z" fill="#a86e0c" />
          <path d="M8 49h20v22H8z" fill="#e6aa2c" />
          <path d="M11 53h14v14H11z" fill="#fff0a3" />
          <path d="M31 68h14v18H31zM51 68h14v18H51z" fill="#75500b" />
          <path d="M24 84h22v5H24zM50 84h22v5H50z" fill="#3a2607" />
          <path d="M43 47h10v10H43z" fill="#fff0a3" />
          <path d="M46 50h4v4h-4z" fill="#e6aa2c" />
        </g>
      </svg>
    );
  }
  
  return null;
}
