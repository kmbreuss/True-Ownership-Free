import { Router, type IRouter } from "express";
import healthRouter from "./health";
import claudeRouter from "./claude";
import authPasswordRouter from "./authPassword";
import adminRouter from "./admin";
import userdataRouter from "./userdata";

const router: IRouter = Router();

router.use(healthRouter);
router.use(claudeRouter);
// Email + password auth — replaces the legacy Replit Auth (OIDC) flow
// that was removed in Stage 3 sub-step E.
router.use(authPasswordRouter);
router.use(adminRouter);
router.use(userdataRouter);

export default router;
