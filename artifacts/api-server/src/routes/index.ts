import { Router, type IRouter } from "express";
import healthRouter from "./health";
import claudeRouter from "./claude";
import authRouter from "./auth";
import userdataRouter from "./userdata";

const router: IRouter = Router();

router.use(healthRouter);
router.use(claudeRouter);
router.use(authRouter);
router.use(userdataRouter);

export default router;
