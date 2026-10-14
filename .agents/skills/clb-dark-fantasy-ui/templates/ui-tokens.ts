/**
 * Chiến Long Bá — Dark Fantasy & Slate Teal UI Tokens
 * Quy chuẩn mã màu, bo góc, bóng đổ và kiểu dáng cho toàn bộ giao diện game.
 */

export const CLB_UI_TOKENS = {
  colors: {
    // Canvas / Outer Background
    canvasBg: "#4c6e6f",
    canvasRadial: "radial-gradient(circle at 50% 50%, #567c7d 0%, #446364 75%, #385253 100%)",

    // Main Card & Modal Panels
    cardBg: "#342a2b",
    cardBorder: "#5d4648",

    // Sub-containers, Inputs, Stat Blocks
    subPanelBg: "#4a383a",
    subPanelHover: "#5d4648",
    activeSubPanel: "#584245",
    nestedBg: "#271f20",

    // Primary Brand Action Color
    primaryCyan: "#28c3e1",
    primaryCyanGlow: "rgba(40, 195, 225, 0.45)",
    buttonTextDark: "#1c161a",

    // Typography
    textWhite: "#ffffff",
    textMuted: "#8e7a7c",
    textError: "#fb7185",
  },

  borderRadius: {
    modalCard: "rounded-[34px]",
    card: "rounded-[28px]",
    subCard: "rounded-2xl",
    input: "rounded-xl",
    actionButton: "rounded-full",
  },

  shadows: {
    modal: "shadow-[0_30px_90px_rgba(0,0,0,0.55),0_10px_30px_rgba(0,0,0,0.4)]",
    card: "shadow-[0_20px_50px_rgba(0,0,0,0.45)]",
    primaryButton: "shadow-[0_0_25px_rgba(40,195,225,0.45)]",
    activeGlow: "shadow-[0_0_25px_rgba(40,195,225,0.35)]",
  },
} as const;
