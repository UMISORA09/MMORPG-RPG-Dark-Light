import { Router } from "express";
import { CHARACTER_CLASSES, MONSTERS } from "../data/classes";

const router = Router();

router.get("/classes", (_req, res) => {
  return res.status(200).json(CHARACTER_CLASSES);
});

router.get("/monsters", (_req, res) => {
  return res.status(200).json(MONSTERS);
});

export default router;
