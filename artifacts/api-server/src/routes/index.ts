import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import classesRouter from "./classes";
import charactersRouter from "./characters";
import battleRouter from "./battle";
import leaderboardRouter from "./leaderboard";
import inventoryRouter from "./inventory";
import shopRouter from "./shop";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(classesRouter);
router.use(charactersRouter);
router.use(battleRouter);
router.use(leaderboardRouter);
router.use(inventoryRouter);
router.use(shopRouter);

export default router;
