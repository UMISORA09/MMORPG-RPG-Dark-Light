import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { verifyToken } from "../lib/token";

export async function extractAuthUser(req: any): Promise<any | null> {
  let userId = Number(req.session?.userId);
  let tokenData: any = null;

  // If no session userId, check Authorization header (Bearer <token>) or cookie (clb_token)
  if (!Number.isInteger(userId) || userId <= 0) {
    const authHeader = req.headers?.authorization;
    let token = "";
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies?.clb_token) {
      token = req.cookies.clb_token;
    }

    if (token) {
      tokenData = verifyToken(token);
      if (tokenData?.id) {
        userId = Number(tokenData.id);
      }
    }
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  // If running in In-Memory / Standalone mode on serverless and user was not found:
  // Automatically restore user record from the verified token
  if (!user && tokenData) {
    try {
      const inserted = await db
        .insert(usersTable)
        .values({
          id: tokenData.id,
          username: tokenData.username || `Hero_${tokenData.id}`,
          passwordHash: "stateless_token_auth",
          selectedRegion: tokenData.selectedRegion || "VN",
          selectedServerId: tokenData.selectedServerId || "s1_long_vuong",
        })
        .returning();
      user = inserted[0];
    } catch {
      [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
    }
  }

  if (!user) {
    return null;
  }

  // Ensure session and request properties are synchronized
  if (!req.session) {
    req.session = {} as any;
  }
  req.session.userId = user.id;
  req.authUserId = user.id;
  req.authUser = user;

  return user;
}

export async function requireAuth(req: any, res: any, next: any): Promise<void> {
  const user = await extractAuthUser(req);
  if (!user) {
    if (req.session?.destroy) {
      req.session.destroy(() => undefined);
    }
    res.status(401).json({ error: "Chưa đăng nhập" });
    return;
  }
  next();
}