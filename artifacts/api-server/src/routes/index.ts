import { Router, type IRouter } from "express";
import healthRouter from "./health";
import claudeRouter from "./claude";
import authRouter from "./auth";
import authPasswordRouter from "./authPassword";
import adminRouter from "./admin";
import userdataRouter from "./userdata";

const router: IRouter = Router();

router.use(healthRouter);
router.use(claudeRouter);
// Email + password auth (Stage 3). Mounted alongside the legacy OIDC
// router below; both will coexist until Sub-step E removes OIDC.
router.use(authPasswordRouter);
router.use(adminRouter);
router.use(authRouter);
router.use(userdataRouter);

export default router;
