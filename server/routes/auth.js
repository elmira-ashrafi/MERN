import express from "express";
import {
  editProfile,
  register,
  login,
  logout,
  csrfToken,
  requireAuth,
  currentUser,
  confirmCode,
  setNewPassword,
  getProfilePicture
} from "../controllers/auth.js";
import { rateLimit } from "../utils/rateLimit.js";
import { avatarUploadMiddleware } from "../services/upload.service.js";

const router = express.Router();

// per client: stops one address hammering the auth endpoints at all
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "too many attempts. please try again later",
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) =>
    `${req.ip}:${String(req.body?.email || "")
      .trim()
      .toLocaleLowerCase()}`,
  message: "too many attempts for this account. please try again later",
});

router.get("/csrf-token", csrfToken);
router.get("/current-user", requireAuth, currentUser);
router.get('/profile-picture', requireAuth, getProfilePicture)
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, loginLimiter, login);
router.post("/logout", logout);
router.post("/confirm-code", authLimiter, confirmCode);
router.post("/new-password", authLimiter, setNewPassword);
router.post("/edit-profile", requireAuth, avatarUploadMiddleware(), editProfile);

export default router;
