import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import classesRouter from "./classes";
import charactersRouter from "./characters";
import battleRouter from "./battle";
import leaderboardRouter from "./leaderboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(classesRouter);
router.use(charactersRouter);
router.use(battleRouter);
router.use(leaderboardRouter);

export default router;
