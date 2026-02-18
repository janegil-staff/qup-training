import { Router } from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import * as authCtrl from "../controllers/auth.controller.js";
import * as exerciseCtrl from "../controllers/exercise.controller.js";
import * as workoutCtrl from "../controllers/workout.controller.js";
import * as socialCtrl from "../controllers/social.controller.js";
import * as nutritionCtrl from "../controllers/nutrition.controller.js";
import * as bodyStatsCtrl from "../controllers/bodystats.controller.js";
import * as challengeCtrl from "../controllers/challenge.controller.js";
import * as notificationCtrl from "../controllers/notification.controller.js";
import * as userCtrl from "../controllers/user.controller.js";
import * as uploadCtrl from "../controllers/upload.controller.js";
import * as aiCtrl from "../controllers/ai.controller.js";

const router = Router();

// Multer — store in memory buffer for Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

// ─── Auth ────────────────────────────────────────────────────────────
router.post("/auth/register", authCtrl.register);
router.post("/auth/login", authCtrl.login);
router.post("/auth/refresh", authCtrl.refresh);
router.get("/auth/me", auth, authCtrl.getMe);
router.post("/auth/logout", auth, authCtrl.logout);
router.post("/auth/forgot-password", authCtrl.forgotPassword);
router.post("/auth/reset-password", authCtrl.resetPassword);

// ─── User / Profile ──────────────────────────────────────────────────
router.put("/users/profile", auth, userCtrl.updateProfile);
router.put("/users/password", auth, userCtrl.changePassword);
router.get("/users/search", auth, userCtrl.searchUsers);
router.get("/users/:id/profile", auth, socialCtrl.getUserProfile);
router.post("/users/:id/follow", auth, socialCtrl.followUser);

// ─── Exercises ───────────────────────────────────────────────────────
router.get("/exercises", auth, exerciseCtrl.getAll);
router.get("/exercises/:id", auth, exerciseCtrl.getById);
router.post("/exercises", auth, exerciseCtrl.create);

// ─── Workout Templates ───────────────────────────────────────────────
router.get("/workouts/templates", auth, workoutCtrl.getTemplates);
router.get("/workouts/templates/:id", auth, workoutCtrl.getTemplateById);
router.post("/workouts/templates", auth, workoutCtrl.createTemplate);
router.delete("/workouts/templates/:id", auth, workoutCtrl.deleteTemplate);

// ─── Workout Logs ────────────────────────────────────────────────────
router.get("/workouts/log", auth, workoutCtrl.getLogs);
router.get("/workouts/log/:id", auth, workoutCtrl.getLogById);
router.post("/workouts/log", auth, workoutCtrl.createLog);

// ─── Workout Stats ───────────────────────────────────────────────────
router.get("/workouts/stats", auth, workoutCtrl.getStats);

// ─── Social / Feed ───────────────────────────────────────────────────
router.get("/feed", auth, socialCtrl.getFeed);
router.post("/posts", auth, socialCtrl.createPost);
router.post("/posts/:id/like", auth, socialCtrl.likePost);
router.post("/posts/:id/comment", auth, socialCtrl.commentPost);
router.delete("/posts/:id", auth, socialCtrl.deletePost);

// ─── Nutrition ───────────────────────────────────────────────────────
router.get("/nutrition/stats", auth, nutritionCtrl.getStats);
router.get("/nutrition/:date", auth, nutritionCtrl.getByDate);
router.post("/nutrition", auth, nutritionCtrl.logMeal);
router.put("/nutrition/:id", auth, nutritionCtrl.update);
router.delete("/nutrition/:id/meal/:mealIndex", auth, nutritionCtrl.deleteMeal);

// ─── Body Stats ──────────────────────────────────────────────────────
router.get("/body-stats", auth, bodyStatsCtrl.getAll);
router.get("/body-stats/latest", auth, bodyStatsCtrl.getLatest);
router.post("/body-stats", auth, bodyStatsCtrl.create);
router.delete("/body-stats/:id", auth, bodyStatsCtrl.remove);

// ─── Challenges ──────────────────────────────────────────────────────
router.get("/challenges", auth, challengeCtrl.getActive);
router.get("/challenges/:id", auth, challengeCtrl.getById);
router.post("/challenges", auth, challengeCtrl.create);
router.post("/challenges/:id/join", auth, challengeCtrl.join);
router.patch("/challenges/:id/progress", auth, challengeCtrl.updateProgress);
router.get("/challenges/:id/leaderboard", auth, challengeCtrl.getLeaderboard);

// ─── Notifications ───────────────────────────────────────────────────
router.get("/notifications", auth, notificationCtrl.getAll);
router.patch("/notifications/read-all", auth, notificationCtrl.readAll);
router.patch("/notifications/:id/read", auth, notificationCtrl.readOne);
router.delete("/notifications/:id", auth, notificationCtrl.remove);
router.post(
  "/notifications/push-token",
  auth,
  notificationCtrl.registerPushToken,
);

// ─── Upload ──────────────────────────────────────────────────────────
router.post(
  "/upload/image",
  auth,
  upload.single("image"),
  uploadCtrl.uploadImage,
);
router.post(
  "/upload/avatar",
  auth,
  upload.single("image"),
  uploadCtrl.uploadAvatar,
);
router.delete("/upload/image", auth, uploadCtrl.deleteImage);

// ─── AI Chat ─────────────────────────────────────────────────────────
router.post("/ai/chat", auth, aiCtrl.chat);

export default router;
