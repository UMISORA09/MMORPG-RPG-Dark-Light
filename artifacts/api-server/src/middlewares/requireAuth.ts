import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

export async function requireAuth(req: any, res: any, next: any): Promise<void> {
  const userId = Number(req.session?.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ error: "Chưa đăng nhập" });
    return;
  }

  const [user] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    req.session?.destroy(() => undefined);
    res.status(401).json({ error: "Phiên đăng nhập không hợp lệ" });
    return;
  }

  req.authUserId = user.id;
  next();
}