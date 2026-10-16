import crypto from "node:crypto";

const TOKEN_SECRET = process.env.SESSION_SECRET || "mmorpg-dev-secret-key-beta";

export interface TokenPayload {
  id: number;
  username: string;
  selectedRegion?: string;
  selectedServerId?: string;
  exp?: number;
}

export function signToken(
  payload: Omit<TokenPayload, "exp">,
  expiresInMs: number = 30 * 24 * 60 * 60 * 1000,
): string {
  const fullPayload: TokenPayload = {
    ...payload,
    exp: Date.now() + expiresInMs,
  };
  const body = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [body, signature] = parts;
    if (!body || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(body)
      .digest("base64url");

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

