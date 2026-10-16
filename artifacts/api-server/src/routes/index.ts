import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import classesRouter from "./classes";
import charactersRouter from "./characters";
import battleRouter from "./battle";
import encountersRouter from "./encounters";
import leaderboardRouter from "./leaderboard";
import inventoryRouter from "./inventory";
import shopRouter from "./shop";
import communityRouter from "./community";
import questsRouter from "./quests";
import blacksmithRouter from "./blacksmith";
import multiplayerRouter from "./multiplayer";
import endgameRouter from "./endgame";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(classesRouter);
router.use(charactersRouter);
router.use(battleRouter);
router.use(encountersRouter);
router.use(leaderboardRouter);
router.use(inventoryRouter);
router.use(shopRouter);
router.use(communityRouter);
router.use(questsRouter);
router.use(blacksmithRouter);
router.use(multiplayerRouter);
router.use(endgameRouter);

export default router;
