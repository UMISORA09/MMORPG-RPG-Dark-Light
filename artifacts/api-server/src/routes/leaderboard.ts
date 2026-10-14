import { Router } from "express";
import { db, charactersTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/leaderboard", async (_req, res) => {
  const characters = await db
    .select({
      id: charactersTable.id,
      name: charactersTable.name,
      className: charactersTable.className,
      level: charactersTable.level,
      experience: charactersTable.experience,
      kills: charactersTable.kills,
      userId: charactersTable.userId,
    })
    .from(charactersTable)
    .orderBy(desc(charactersTable.level), desc(charactersTable.experience))
    .limit(20);

  const result = await Promise.all(
    characters.map(async (c: any, idx: number) => {
      const [user] = await db
        .select({ username: usersTable.username })
        .from(usersTable)
        .where(eq(usersTable.id, c.userId))
        .limit(1);

      return {
        rank: idx + 1,
        characterName: c.name,
        className: c.className,
        level: c.level,
        experience: c.experience,
        kills: c.kills,
        username: user?.username ?? "???",
      };
    })
  );

  return res.status(200).json(result);
});

export default router;
