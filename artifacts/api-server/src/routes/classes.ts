import { Router } from "express";
import { CHARACTER_CLASSES } from "../data/classes";
import { getCatalogMonsters } from "../lib/inventory";

const router = Router();

router.get("/classes", (_req, res) => {
  return res.status(200).json(CHARACTER_CLASSES);
});

router.get("/monsters", async (_req, res) => {
  const monsters = await getCatalogMonsters();
  return res.status(200).json(monsters.map((monster: any) => ({
    id: monster.id,
    name: monster.name,
    level: monster.level,
    hp: monster.hp,
    atk: monster.atk,
    def: monster.def,
    expReward: monster.expReward,
    goldReward: monster.goldReward,
    emoji: monster.emoji,
    description: monster.description,
  })));
});

export default router;
