import express from "express";
import {
  authUser,
  deleteUser,
  updateUser,
  registerUser,
  getUsers,
  verifyUser,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getUsers);
router.post("/register", registerUser);
router.post("/login", authUser);
router.post("/verify", verifyUser);
router.put("/", updateUser);
router.delete("/", deleteUser);

export default router;
