import os

OUT_DIR = "artifacts/mmorpg-game/public/assets/characters"
os.makedirs(OUT_DIR, exist_ok=True)

# --------------------------------------------------------------------------
# 1. FIGHTER MALE (Chiến Binh - Nam: Soái ca võ thần, 6 múi cuồn cuộn, xăm rồng, găng lôi điện)
# --------------------------------------------------------------------------
fighter_male_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 380" width="100%" height="100%">
  <defs>
    <radialGradient id="fmGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff3366" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#ff3366" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fmSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="50%" stop-color="#fdba74"/>
      <stop offset="100%" stop-color="#fb923c"/>
    </linearGradient>
    <linearGradient id="fmMuscle" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#9a3412"/>
    </linearGradient>
    <linearGradient id="fmHair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff2a5f"/>
      <stop offset="50%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#7f1d1d"/>
    </linearGradient>
    <linearGradient id="fmGauntlet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <filter id="fmShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <circle cx="160" cy="180" r="140" fill="url(#fmGlow)" opacity="0.4"/>

  <g filter="url(#fmShadow)">
    <!-- Martial Arts Trousers -->
    <path d="M115 280 L110 370 L145 370 L158 300 L162 300 L175 370 L210 370 L205 280 Z" fill="#18181b"/>
    <path d="M110 365 L145 365 L143 375 L112 375 Z" fill="#f59e0b"/>
    <path d="M175 365 L210 365 L208 375 L177 375 Z" fill="#f59e0b"/>
    <rect x="114" y="270" width="92" height="14" rx="4" fill="#f59e0b"/>
    <polygon points="160,268 168,277 160,286 152,277" fill="#dc2626"/>

    <!-- 6-PACK BARE MUSCULAR TORSO -->
    <path d="M105 130 C90 170 115 280 120 280 L200 280 C205 280 230 170 215 130 C195 125 180 135 160 135 C140 135 125 125 105 130 Z" fill="url(#fmSkin)"/>
    
    <!-- Dragon Tattoo on Right Shoulder -->
    <path d="M115 135 C125 150 110 170 125 185 C135 175 140 160 130 145 Z" fill="#b91c1c" opacity="0.65"/>
    <path d="M120 180 C135 195 125 210 135 225" stroke="#b91c1c" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.6"/>

    <!-- Pectoral Muscles -->
    <path d="M118 165 C130 180 155 182 158 172 C158 150 145 142 120 142 Z" fill="#fed7aa" stroke="url(#fmMuscle)" stroke-width="2.5"/>
    <path d="M202 165 C190 180 165 182 162 172 C162 150 175 142 200 142 Z" fill="#fed7aa" stroke="url(#fmMuscle)" stroke-width="2.5"/>
    <line x1="160" y1="160" x2="160" y2="272" stroke="url(#fmMuscle)" stroke-width="3" stroke-linecap="round"/>

    <!-- 6-PACK ABDOMINALS (6 Múi Sắc Nét) -->
    <rect x="136" y="188" width="21" height="18" rx="4" fill="#fed7aa" stroke="url(#fmMuscle)" stroke-width="2"/>
    <rect x="163" y="188" width="21" height="18" rx="4" fill="#fed7aa" stroke="url(#fmMuscle)" stroke-width="2"/>
    <rect x="137" y="212" width="20" height="18" rx="4" fill="#fed7aa" stroke="url(#fmMuscle)" stroke-width="2"/>
    <rect x="163" y="212" width="20" height="18" rx="4" fill="#fed7aa" stroke="url(#fmMuscle)" stroke-width="2"/>
    <rect x="139" y="236" width="18" height="18" rx="4" fill="#fed7aa" stroke="url(#fmMuscle)" stroke-width="2"/>
    <rect x="163" y="236" width="18" height="18" rx="4" fill="#fed7aa" stroke="url(#fmMuscle)" stroke-width="2"/>
    <path d="M135 258 L160 274 L185 258" fill="none" stroke="url(#fmMuscle)" stroke-width="2.5"/>

    <!-- Muscular Arms & Power Gauntlets -->
    <path d="M105 130 C85 145 75 190 85 220 C95 215 105 190 115 170 Z" fill="url(#fmSkin)"/>
    <rect x="65" y="210" width="30" height="45" rx="8" fill="url(#fmGauntlet)" stroke="#78350f" stroke-width="2"/>
    <circle cx="80" cy="230" r="7" fill="#ef4444"/>
    <path d="M60 215 L70 205 L65 225 L85 210" stroke="#fde047" stroke-width="3" fill="none"/>

    <path d="M215 130 C235 145 245 190 235 220 C225 215 215 190 205 170 Z" fill="url(#fmSkin)"/>
    <rect x="225" y="210" width="30" height="45" rx="8" fill="url(#fmGauntlet)" stroke="#78350f" stroke-width="2"/>
    <circle cx="240" cy="230" r="7" fill="#ef4444"/>
    <path d="M245 215 L255 205 L250 225 L265 210" stroke="#fde047" stroke-width="3" fill="none"/>

    <!-- Neck & Face -->
    <path d="M140 100 L140 135 L180 135 L180 100 Z" fill="url(#fmSkin)"/>
    <path d="M135 60 C130 90 145 112 160 118 C175 112 190 90 185 60 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="1.5"/>

    <!-- Eyes (Kiếm Khách Sắc Bén) -->
    <path d="M143 78 Q150 74 155 78" stroke="#1c1917" stroke-width="2.5" fill="none"/>
    <ellipse cx="149" cy="81" rx="3.5" ry="4" fill="#b91c1c"/>
    <circle cx="148" cy="79" r="1.2" fill="#fff"/>

    <path d="M165 78 Q170 74 177 78" stroke="#1c1917" stroke-width="2.5" fill="none"/>
    <ellipse cx="171" cy="81" rx="3.5" ry="4" fill="#b91c1c"/>
    <circle cx="170" cy="79" r="1.2" fill="#fff"/>

    <path d="M140 72 L156 70" stroke="#7f1d1d" stroke-width="3" stroke-linecap="round"/>
    <path d="M164 70 L180 72" stroke="#7f1d1d" stroke-width="3" stroke-linecap="round"/>
    <path d="M160 76 L159 90 L163 90" stroke="#c2410c" stroke-width="2" fill="none"/>
    <path d="M153 100 Q160 102 167 100" stroke="#b91c1c" stroke-width="2" fill="none"/>

    <!-- Spiky Crimson Hair -->
    <path d="M125 55 L105 45 L128 40 L115 25 L140 30 L145 10 L160 25 L175 8 L180 28 L205 20 L195 42 L215 48 L192 58 L205 75 L185 70 Z" fill="url(#fmHair)"/>
    <path d="M138 50 L145 70 L150 55 L160 72 L168 55 L175 70 L180 50 Z" fill="url(#fmHair)"/>
  </g>
</svg>"""

with open(f"{OUT_DIR}/fighter_male.svg", "w", encoding="utf-8") as f:
    f.write(fighter_male_svg)


# --------------------------------------------------------------------------
# 2. FIGHTER FEMALE (Chiến Binh - Nữ: Sexy bốc lửa, crop-top khoe eo và cơ bụng số 11, đuôi ngựa đỏ)
# --------------------------------------------------------------------------
fighter_female_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 380" width="100%" height="100%">
  <defs>
    <radialGradient id="ffGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff3366" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#ff3366" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ffSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="50%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fba575"/>
    </linearGradient>
    <linearGradient id="ffHair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="50%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#881337"/>
    </linearGradient>
    <filter id="ffShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <circle cx="160" cy="180" r="140" fill="url(#ffGlow)" opacity="0.4"/>

  <g filter="url(#ffShadow)">
    <!-- High Ponytail Hair Flowing Behind -->
    <path d="M165 40 C190 20 235 30 250 80 C260 120 230 160 215 190 C220 150 230 100 205 75 Z" fill="url(#ffHair)"/>

    <!-- Toned Thighs & Leather Combat Shorts -->
    <path d="M125 285 C120 330 122 370 135 375 L155 375 C158 335 155 300 158 295 L162 295 C165 300 162 335 165 375 L185 375 C198 370 200 330 195 285 Z" fill="url(#ffSkin)"/>
    <path d="M122 265 L198 265 C198 290 190 295 160 295 C130 295 122 290 122 265 Z" fill="#18181b"/>
    <path d="M120 262 L200 262 L200 270 L120 270 Z" fill="#f59e0b"/>

    <!-- Hourglass Torso (Vòng Eo Thon Gọn & Cơ Bụng Số 11 Sexy) -->
    <path d="M120 145 C115 170 135 240 135 265 L185 265 C185 240 205 170 200 145 Z" fill="url(#ffSkin)"/>
    <!-- Linea Semilunaris (Cơ bụng số 11 săn chắc cuốn hút) -->
    <path d="M152 205 C151 225 150 245 152 255" stroke="#ea580c" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>
    <path d="M168 205 C169 225 170 245 168 255" stroke="#ea580c" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>
    <!-- Navel (Rốn nhỏ quyến rũ) -->
    <ellipse cx="160" cy="245" rx="1.5" ry="2.5" fill="#c2410c"/>

    <!-- Seductive Sports Crop Top Leather Cuirass (Áo Crop-top Cúp Ngực Gợi Cảm) -->
    <path d="M120 148 C115 175 125 195 160 195 C195 195 205 175 200 148 C185 155 170 162 160 162 C150 162 135 155 120 148 Z" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
    <!-- Cleavage Line & Contours -->
    <path d="M160 152 L160 178" stroke="#7f1d1d" stroke-width="2" stroke-linecap="round"/>
    <path d="M142 155 C146 175 158 178 160 178 C162 178 174 175 178 155" fill="none" stroke="#fed7aa" stroke-width="1.5"/>

    <!-- Slender Arms & Flame Gauntlets -->
    <path d="M115 145 C95 165 90 205 95 230 C102 225 110 195 118 175 Z" fill="url(#ffSkin)"/>
    <rect x="75" y="215" width="25" height="40" rx="6" fill="#f59e0b" stroke="#9a3412" stroke-width="2"/>
    <path d="M70 220 L80 208 L85 225" stroke="#ff3366" stroke-width="3" fill="none"/>

    <path d="M205 145 C225 165 230 205 225 230 C218 225 210 195 202 175 Z" fill="url(#ffSkin)"/>
    <rect x="220" y="215" width="25" height="40" rx="6" fill="#f59e0b" stroke="#9a3412" stroke-width="2"/>
    <path d="M240 220 L230 208 L225 225" stroke="#ff3366" stroke-width="3" fill="none"/>

    <!-- Delicate Neck & Seductive Anime Face -->
    <path d="M145 105 L145 135 L175 135 L175 105 Z" fill="url(#ffSkin)"/>
    <path d="M138 65 C132 95 145 116 160 120 C175 116 188 95 182 65 Z" fill="#ffedd5" stroke="#fb923c" stroke-width="1.2"/>

    <!-- Alluring Eyes (Mắt Phượng Quyến Rũ Hút Hồn) -->
    <path d="M143 82 Q150 78 155 83" stroke="#18181b" stroke-width="2.5" fill="none"/>
    <ellipse cx="149" cy="85" rx="4" ry="4.5" fill="#dc2626"/>
    <circle cx="147.5" cy="83" r="1.5" fill="#fff"/>

    <path d="M165 83 Q170 78 177 82" stroke="#18181b" stroke-width="2.5" fill="none"/>
    <ellipse cx="171" cy="85" rx="4" ry="4.5" fill="#dc2626"/>
    <circle cx="169.5" cy="83" r="1.5" fill="#fff"/>

    <!-- Long Eyelashes & Glossy Pink Lips -->
    <path d="M154 81 L157 79" stroke="#18181b" stroke-width="2"/>
    <path d="M166 79 L163 81" stroke="#18181b" stroke-width="2"/>
    <path d="M159 80 L161 93" stroke="#fba575" stroke-width="1.5"/>
    <ellipse cx="160" cy="103" rx="4.5" ry="2" fill="#f43f5e"/>
    <circle cx="159" cy="102.5" r="0.8" fill="#fff"/>

    <!-- Fiery Red Bangs & Ponytail Ribbon -->
    <circle cx="165" cy="48" r="8" fill="#f59e0b"/>
    <path d="M135 60 C125 35 140 25 160 25 C180 25 195 35 185 60 L178 50 C188 35 175 30 160 30 C145 30 132 35 142 50 Z" fill="url(#ffHair)"/>
    <path d="M138 52 C132 75 142 85 142 90" stroke="url(#ffHair)" stroke-width="4" fill="none"/>
    <path d="M182 52 C188 75 178 85 178 90" stroke="url(#ffHair)" stroke-width="4" fill="none"/>
  </g>
</svg>"""

with open(f"{OUT_DIR}/fighter_female.svg", "w", encoding="utf-8") as f:
    f.write(fighter_female_svg)


# --------------------------------------------------------------------------
# 3. ASSASSIN MALE (Sát Thủ - Nam: Đam mỹ bóng tối, cơ bụng 6 múi chữ V, áo choàng hở ngực, song kiếm tím)
# --------------------------------------------------------------------------
assassin_male_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 380" width="100%" height="100%">
  <defs>
    <radialGradient id="amGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="amSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="50%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fba575"/>
    </linearGradient>
    <linearGradient id="amDagger" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="50%" stop-color="#9333ea"/>
      <stop offset="100%" stop-color="#581c87"/>
    </linearGradient>
    <linearGradient id="amHair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b0764"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <filter id="amShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <circle cx="160" cy="180" r="140" fill="url(#amGlow)" opacity="0.4"/>

  <g filter="url(#amShadow)">
    <!-- Shadow Cloak / Shroud -->
    <path d="M100 135 C70 200 65 310 80 370 C105 340 115 280 110 220 Z" fill="#2e1065" opacity="0.9"/>
    <path d="M220 135 C250 200 255 310 240 370 C215 340 205 280 210 220 Z" fill="#2e1065" opacity="0.9"/>

    <!-- Stealth Slim Trousers -->
    <path d="M120 280 L115 375 L145 375 L158 305 L162 305 L175 375 L205 375 L200 280 Z" fill="#0f172a"/>
    <rect x="118" y="270" width="84" height="12" rx="3" fill="#3b0764" stroke="#a855f7" stroke-width="1.5"/>

    <!-- Athletic Lean 6-Pack Torso & Open Leather Vest -->
    <path d="M110 135 C100 170 120 280 125 280 L195 280 C200 280 220 170 210 135 Z" fill="url(#amSkin)"/>
    
    <!-- Open Vest Straps & Silver Buckles -->
    <path d="M108 135 C100 170 115 280 125 280 L135 280 C125 230 115 170 125 135 Z" fill="#18181b"/>
    <path d="M212 135 C220 170 205 280 195 280 L185 280 C195 230 205 170 195 135 Z" fill="#18181b"/>
    <rect x="123" y="200" width="14" height="5" fill="#e2e8f0"/>
    <rect x="183" y="200" width="14" height="5" fill="#e2e8f0"/>

    <!-- Lean 6-Pack Abs (Chữ V Săn Chắc) -->
    <line x1="160" y1="155" x2="160" y2="270" stroke="#ea580c" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="138" y="190" width="19" height="16" rx="3" fill="#ffedd5" stroke="#ea580c" stroke-width="1.8"/>
    <rect x="163" y="190" width="19" height="16" rx="3" fill="#ffedd5" stroke="#ea580c" stroke-width="1.8"/>
    <rect x="139" y="214" width="18" height="16" rx="3" fill="#ffedd5" stroke="#ea580c" stroke-width="1.8"/>
    <rect x="163" y="214" width="18" height="16" rx="3" fill="#ffedd5" stroke="#ea580c" stroke-width="1.8"/>
    <rect x="141" y="238" width="16" height="16" rx="3" fill="#ffedd5" stroke="#ea580c" stroke-width="1.8"/>
    <rect x="163" y="238" width="16" height="16" rx="3" fill="#ffedd5" stroke="#ea580c" stroke-width="1.8"/>
    <path d="M136 260 L160 274 L184 260" fill="none" stroke="#ea580c" stroke-width="2"/>

    <!-- Dual Curved Shadow Daggers (Song Đoản Kiếm Ánh Tím) -->
    <!-- Left Dagger -->
    <path d="M75 190 C65 240 50 270 40 290 C60 275 80 250 85 210 Z" fill="url(#amDagger)" stroke="#c084fc" stroke-width="1.5"/>
    <rect x="80" y="200" width="15" height="6" rx="2" fill="#e2e8f0"/>
    <path d="M40 290 Q55 260 75 230" stroke="#f43f5e" stroke-width="2" fill="none"/>

    <!-- Right Dagger -->
    <path d="M245 190 C255 240 270 270 280 290 C260 275 240 250 235 210 Z" fill="url(#amDagger)" stroke="#c084fc" stroke-width="1.5"/>
    <rect x="225" y="200" width="15" height="6" rx="2" fill="#e2e8f0"/>
    <path d="M280 290 Q265 260 245 230" stroke="#f43f5e" stroke-width="2" fill="none"/>

    <!-- Bishounen Face & Mysterious Gaze (Soái Ca Đam Mỹ Huyền Bí) -->
    <path d="M142 105 L142 135 L178 135 L178 105 Z" fill="url(#amSkin)"/>
    <path d="M136 65 C132 95 145 116 160 120 C175 116 188 95 184 65 Z" fill="#ffedd5" stroke="#c084fc" stroke-width="1.5"/>

    <!-- Intense Violet Eyes -->
    <path d="M144 80 Q150 76 156 80" stroke="#09090b" stroke-width="2.5" fill="none"/>
    <ellipse cx="150" cy="83" rx="3.5" ry="4" fill="#a855f7"/>
    <circle cx="149" cy="81.5" r="1.2" fill="#fff"/>

    <path d="M164 80 Q170 76 176 80" stroke="#09090b" stroke-width="2.5" fill="none"/>
    <ellipse cx="170" cy="83" rx="3.5" ry="4" fill="#a855f7"/>
    <circle cx="169" cy="81.5" r="1.2" fill="#fff"/>

    <path d="M141 74 L156 72" stroke="#581c87" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M164 72 L179 74" stroke="#581c87" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M160 78 L159 91 L162 91" stroke="#fb923c" stroke-width="1.8" fill="none"/>
    <path d="M154 101 Q160 103 166 101" stroke="#a855f7" stroke-width="2" fill="none"/>

    <!-- Layered Shadow Hair (Tóc Đen Ánh Tím Quyến Rũ) -->
    <path d="M125 55 L110 40 L130 35 L120 18 L145 22 L152 8 L168 20 L185 10 L190 28 L210 25 L200 45 L215 55 L190 62 Z" fill="url(#amHair)"/>
    <!-- Bangs Framing V-line Chin -->
    <path d="M138 55 C135 75 142 85 146 95 L148 65 C152 80 156 85 158 92 C162 82 166 75 168 62 L172 88 C176 78 182 70 182 55 Z" fill="url(#amHair)"/>
  </g>
</svg>"""

with open(f"{OUT_DIR}/assassin_male.svg", "w", encoding="utf-8") as f:
    f.write(assassin_male_svg)


# --------------------------------------------------------------------------
# 4. GUNNER MALE (Xạ Thủ - Nam: Cyberpunk Deadeye soái ca, 6 múi, áo khoác hở ngực, kính ngắm laser)
# --------------------------------------------------------------------------
gunner_male_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 380" width="100%" height="100%">
  <defs>
    <radialGradient id="gmGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00f2ff" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#00f2ff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gmSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="50%" stop-color="#fdba74"/>
      <stop offset="100%" stop-color="#fb923c"/>
    </linearGradient>
    <linearGradient id="gmCoat" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <linearGradient id="gmRifle" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="gmShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <circle cx="160" cy="180" r="140" fill="url(#gmGlow)" opacity="0.35"/>

  <g filter="url(#gmShadow)">
    <!-- Cyber Tactical Trench Coat -->
    <path d="M100 140 C85 210 70 320 85 375 L110 375 C105 310 115 220 120 170 Z" fill="url(#gmCoat)"/>
    <path d="M220 140 C235 210 250 320 235 375 L210 375 C215 310 205 220 200 170 Z" fill="url(#gmCoat)"/>

    <!-- Tactical Trousers with Holsters -->
    <path d="M120 280 L115 375 L145 375 L158 305 L162 305 L175 375 L205 375 L200 280 Z" fill="#09090b"/>
    <rect x="110" y="300" width="10" height="25" rx="3" fill="#0284c7"/>
    <rect x="200" y="300" width="10" height="25" rx="3" fill="#0284c7"/>

    <!-- 6-PACK BARE CHEST WITH TACTICAL HARNESS -->
    <path d="M115 135 C105 170 122 280 125 280 L195 280 C198 280 215 170 205 135 Z" fill="url(#gmSkin)"/>
    <!-- Cybernetic Harness Straps -->
    <path d="M120 135 L145 280" stroke="#00f2ff" stroke-width="3" fill="none" opacity="0.8"/>
    <path d="M200 135 L175 280" stroke="#00f2ff" stroke-width="3" fill="none" opacity="0.8"/>

    <!-- Pectoral Muscles -->
    <path d="M122 162 C135 176 156 178 158 168 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/>
    <path d="M198 162 C185 176 164 178 162 168 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/>
    <line x1="160" y1="158" x2="160" y2="272" stroke="#ea580c" stroke-width="2.5"/>

    <!-- 6-Pack Abs -->
    <rect x="138" y="188" width="19" height="17" rx="3" fill="#fed7aa" stroke="#ea580c" stroke-width="1.8"/>
    <rect x="163" y="188" width="19" height="17" rx="3" fill="#fed7aa" stroke="#ea580c" stroke-width="1.8"/>
    <rect x="139" y="212" width="18" height="17" rx="3" fill="#fed7aa" stroke="#ea580c" stroke-width="1.8"/>
    <rect x="163" y="212" width="18" height="17" rx="3" fill="#fed7aa" stroke="#ea580c" stroke-width="1.8"/>
    <rect x="141" y="236" width="16" height="17" rx="3" fill="#fed7aa" stroke="#ea580c" stroke-width="1.8"/>
    <rect x="163" y="236" width="16" height="17" rx="3" fill="#fed7aa" stroke="#ea580c" stroke-width="1.8"/>

    <!-- Plasma Sniper Rifle (Súng Laser Công Nghệ Cao) -->
    <path d="M220 160 L295 130 L305 138 L230 175 Z" fill="url(#gmRifle)"/>
    <rect x="250" y="142" width="22" height="6" fill="#00f2ff"/>
    <circle cx="295" cy="132" r="5" fill="#38bdf8"/>

    <!-- Handsome Face with Cyber Monocle -->
    <path d="M142 105 L142 135 L178 135 L178 105 Z" fill="url(#gmSkin)"/>
    <path d="M136 65 C132 95 145 116 160 120 C175 116 188 95 184 65 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="1.5"/>

    <!-- Left Eye: Cyber Monocle Visor (Mắt Kính Ngắm Laser Neon Cyan) -->
    <circle cx="150" cy="83" r="8" fill="#0284c7" stroke="#00f2ff" stroke-width="2"/>
    <circle cx="150" cy="83" r="4" fill="#38bdf8"/>
    <line x1="142" y1="83" x2="158" y2="83" stroke="#fff" stroke-width="1"/>

    <!-- Right Eye: Natural Handsome Eye -->
    <path d="M164 80 Q170 76 176 80" stroke="#09090b" stroke-width="2.5" fill="none"/>
    <ellipse cx="170" cy="83" rx="3.5" ry="4" fill="#0284c7"/>
    <circle cx="169" cy="81.5" r="1.2" fill="#fff"/>

    <path d="M164 72 L179 74" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M160 78 L159 91 L162 91" stroke="#ea580c" stroke-width="1.8" fill="none"/>
    <path d="M154 101 Q160 103 166 101" stroke="#0284c7" stroke-width="2" fill="none"/>

    <!-- Undercut Cyberpunk Hair with Cyan Highlights -->
    <path d="M130 55 L118 35 L135 30 L130 15 L150 20 L160 8 L175 15 L190 8 L195 25 L205 35 L190 55 Z" fill="#1e293b"/>
    <path d="M145 22 L160 10 L172 20" stroke="#00f2ff" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g>
</svg>"""

with open(f"{OUT_DIR}/gunner_male.svg", "w", encoding="utf-8") as f:
    f.write(gunner_male_svg)


# --------------------------------------------------------------------------
# 5. GUNNER FEMALE (Xạ Thủ - Nữ: Sexy cyberpunk, tóc 2 chùm cyan, bodysuit ôm sát khoe 3 vòng)
# --------------------------------------------------------------------------
gunner_female_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 380" width="100%" height="100%">
  <defs>
    <radialGradient id="gfGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00f2ff" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#00f2ff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gfSkin" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="50%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fba575"/>
    </linearGradient>
    <linearGradient id="gfHair" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0891b2"/>
    </linearGradient>
    <filter id="gfShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <circle cx="160" cy="180" r="140" fill="url(#gfGlow)" opacity="0.4"/>

  <g filter="url(#gfShadow)">
    <!-- Cyber Twin-Tails Hair (Hai Chùm Tóc Dài Bay Lượn) -->
    <path d="M135 60 C90 70 65 140 75 220 C85 240 95 200 90 140 Z" fill="url(#gfHair)"/>
    <path d="M185 60 C230 70 255 140 245 220 C235 240 225 200 230 140 Z" fill="url(#gfHair)"/>

    <!-- Curvy Thighs & High Cyber Boots -->
    <path d="M128 285 C124 330 126 370 138 375 L155 375 C158 335 156 300 158 295 L162 295 C164 300 162 335 165 375 L182 375 C194 370 196 330 192 285 Z" fill="#09090b"/>
    <path d="M130 330 L152 330" stroke="#00f2ff" stroke-width="2"/>
    <path d="M168 330 L190 330" stroke="#00f2ff" stroke-width="2"/>

    <!-- Hourglass Curves & Sexy Cyber Suit -->
    <path d="M122 145 C116 170 135 240 135 265 L185 265 C185 240 204 170 198 145 Z" fill="#0f172a"/>

    <!-- Keyhole Cleavage Cutout (Cắt Xẻ Ngực Sexy) -->
    <path d="M145 152 C145 178 175 178 175 152 C168 148 152 148 145 152 Z" fill="url(#gfSkin)"/>
    <path d="M160 156 L160 174" stroke="#e11d48" stroke-width="1.8" stroke-linecap="round"/>

    <!-- Dual Laser Blasters (Súng Laser Đôi) -->
    <rect x="70" y="210" width="30" height="16" rx="4" fill="#0284c7" stroke="#00f2ff" stroke-width="1.5"/>
    <rect x="62" y="215" width="10" height="4" fill="#38bdf8"/>
    <rect x="220" y="210" width="30" height="16" rx="4" fill="#0284c7" stroke="#00f2ff" stroke-width="1.5"/>
    <rect x="248" y="215" width="10" height="4" fill="#38bdf8"/>

    <!-- Seductive Face & Cyber Headset -->
    <path d="M145 105 L145 135 L175 135 L175 105 Z" fill="url(#gfSkin)"/>
    <path d="M138 65 C132 95 145 116 160 120 C175 116 188 95 182 65 Z" fill="#ffedd5" stroke="#00f2ff" stroke-width="1.2"/>

    <!-- Big Alluring Eyes with Cyan Pupils -->
    <path d="M143 82 Q150 77 156 82" stroke="#09090b" stroke-width="2.5" fill="none"/>
    <ellipse cx="149" cy="85" rx="4.5" ry="5" fill="#0891b2"/>
    <circle cx="147" cy="83" r="1.5" fill="#fff"/>
    <circle cx="151" cy="86" r="0.8" fill="#fff"/>

    <path d="M164 82 Q170 77 177 82" stroke="#09090b" stroke-width="2.5" fill="none"/>
    <ellipse cx="171" cy="85" rx="4.5" ry="5" fill="#0891b2"/>
    <circle cx="169" cy="83" r="1.5" fill="#fff"/>
    <circle cx="173" cy="86" r="0.8" fill="#fff"/>

    <!-- Pink Glossy Lips -->
    <ellipse cx="160" cy="103" rx="4" ry="2" fill="#f43f5e"/>
    <circle cx="159" cy="102" r="0.7" fill="#fff"/>

    <!-- Cyber Headset Ribbon -->
    <rect x="126" y="70" width="6" height="14" rx="2" fill="#00f2ff"/>
    <rect x="188" y="70" width="6" height="14" rx="2" fill="#00f2ff"/>
    <path d="M128 72 C138 35 182 35 192 72" stroke="#00f2ff" stroke-width="2.5" fill="none"/>

    <!-- Bangs -->
    <path d="M138 52 C132 75 142 85 142 90" stroke="url(#gfHair)" stroke-width="3.5" fill="none"/>
    <path d="M182 52 C188 75 178 85 178 90" stroke="url(#gfHair)" stroke-width="3.5" fill="none"/>
    <path d="M148 55 L154 75 L160 62 L166 75 L172 55" fill="url(#gfHair)"/>
  </g>
</svg>"""

with open(f"{OUT_DIR}/gunner_female.svg", "w", encoding="utf-8") as f:
    f.write(gunner_female_svg)

print("Generated all SVGs successfully!")
