import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authPasswordRouter from "./authPassword";
import userdataRouter from "./userdata";
import freeRouter from "./free";

const router: IRouter = Router();

router.use(healthRouter);
router.use(freeRouter);
router.use(authPasswordRouter);
router.use(userdataRouter);

export default router;
