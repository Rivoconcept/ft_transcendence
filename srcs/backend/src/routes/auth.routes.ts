import { Router, type IRouter } from "express";
import { register, login, refresh, deleteUser } from "../controllers/auth.controller.js";

const router: IRouter = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.delete("/user", deleteUser);

export default router;
