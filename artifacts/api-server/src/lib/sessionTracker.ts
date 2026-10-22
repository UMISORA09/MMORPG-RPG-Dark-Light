import crypto from "node:crypto";

export interface ActiveSessionRecord {
  sessionId: string;
  userId: number;
  characterId: number;
  claimedAt: number;
  lastHeartbeat: number;
}

// Map tracking active gameplay session by character ID
const characterSessions = new Map<number, ActiveSessionRecord>();

// Map tracking active gameplay session by user ID (enforces 1 character / 1 account playing at a time)
const userSessions = new Map<number, ActiveSessionRecord>();

// Map tracking the latest login session token per user ID (cross-device/tab login displacement)
const userLatestLoginSessions = new Map<number, string>();

/**
 * Register a new login session for a user.
 * Any subsequent requests using an older login session will be flagged as displaced.
 */
export function registerLoginSession(userId: number, explicitSessionId?: string): string {
  const sessionId = explicitSessionId || `login_${Date.now()}_${crypto.randomUUID()}`;
  userLatestLoginSessions.set(userId, sessionId);
  return sessionId;
}

/**
 * Validate if a token's sessionId matches the user's latest login session.
 */
export function isLatestLoginSession(userId: number, sessionId?: string): boolean {
  if (!sessionId) return true; // Backward compatibility if token has no session ID
  const latest = userLatestLoginSessions.get(userId);
  if (!latest) return true;
  return latest === sessionId;
}

/**
 * Claims single-character gameplay session for a given account and character.
 * If this account was playing another character or was in another tab/device,
 * this replaces it as the single authoritative active session.
 */
export function claimGameplaySession(
  characterId: number,
  userId: number,
  sessionId: string
): { success: boolean; displacedSessionId?: string } {
  if (!characterId || !sessionId) return { success: false };

  const now = Date.now();
  const existingForChar = characterSessions.get(characterId);
  const existingForUser = userSessions.get(userId);

  const displacedSessionId =
    (existingForChar && existingForChar.sessionId !== sessionId ? existingForChar.sessionId : null) ||
    (existingForUser && existingForUser.sessionId !== sessionId ? existingForUser.sessionId : null) ||
    undefined;

  const record: ActiveSessionRecord = {
    sessionId,
    userId,
    characterId,
    claimedAt: now,
    lastHeartbeat: now,
  };

  characterSessions.set(characterId, record);
  userSessions.set(userId, record);

  return { success: true, displacedSessionId };
}

/**
 * Verifies if the incoming request's sessionId is the active authoritative session for this character.
 * If another session has claimed the character or user account, returns valid: false with reason.
 */
export function verifyGameplaySession(
  characterId: number,
  userId: number,
  sessionId?: string | null
): { valid: boolean; activeSessionId?: string; reason?: string } {
  if (!characterId) return { valid: true };

  const currentForChar = characterSessions.get(characterId);
  const currentForUser = userId ? userSessions.get(userId) : null;

  // If no session has been claimed yet, we allow it (and it will claim on next sync)
  if (!currentForChar && !currentForUser) {
    return { valid: true };
  }

  // If client did not provide a sessionId, but there is an active session registered
  if (!sessionId) {
    // If active session is recent (last 30 seconds)
    const active = currentForChar || currentForUser;
    if (active && Date.now() - active.lastHeartbeat < 30000) {
      return {
        valid: false,
        activeSessionId: active.sessionId,
        reason: "Yêu cầu thiếu mã phiên làm việc hoặc phiên đã bị thay thế.",
      };
    }
    return { valid: true };
  }

  // Check character match
  if (currentForChar && currentForChar.sessionId !== sessionId) {
    if (Date.now() - currentForChar.lastHeartbeat < 60000) {
      return {
        valid: false,
        activeSessionId: currentForChar.sessionId,
        reason: "Tài khoản hoặc nhân vật này đã được đăng nhập từ một cửa sổ hoặc thiết bị khác.",
      };
    }
  }

  // Check user account match (cannot play multiple characters simultaneously on 1 account)
  if (currentForUser && currentForUser.sessionId !== sessionId) {
    if (Date.now() - currentForUser.lastHeartbeat < 60000) {
      return {
        valid: false,
        activeSessionId: currentForUser.sessionId,
        reason: "Tài khoản của bạn đang được sử dụng ở một phiên đăng nhập khác.",
      };
    }
  }

  // Valid session: touch heartbeat
  if (currentForChar && currentForChar.sessionId === sessionId) {
    currentForChar.lastHeartbeat = Date.now();
  }
  if (currentForUser && currentForUser.sessionId === sessionId) {
    currentForUser.lastHeartbeat = Date.now();
  }

  return { valid: true };
}

/**
 * Releases active session on explicit character exit or logout
 */
export function releaseGameplaySession(characterId: number, sessionId?: string): void {
  const current = characterSessions.get(characterId);
  if (!sessionId || (current && current.sessionId === sessionId)) {
    characterSessions.delete(characterId);
    if (current?.userId) {
      const userActive = userSessions.get(current.userId);
      if (!sessionId || (userActive && userActive.sessionId === sessionId)) {
        userSessions.delete(current.userId);
      }
    }
  }
}

// Periodic cleanup of abandoned sessions (> 2 minutes inactive)
setInterval(() => {
  const now = Date.now();
  for (const [charId, record] of characterSessions.entries()) {
    if (now - record.lastHeartbeat > 120000) {
      characterSessions.delete(charId);
    }
  }
  for (const [userId, record] of userSessions.entries()) {
    if (now - record.lastHeartbeat > 120000) {
      userSessions.delete(userId);
    }
  }
}, 30000).unref();
