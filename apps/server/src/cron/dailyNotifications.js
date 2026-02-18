import User from "../models/User.js";
import WorkoutLog from "../models/WorkoutLog.js";
import Notification from "../models/Notification.js";
import {
  notifyWorkoutReminder,
  notifyStreakAlert,
} from "../services/push.service.js";

/**
 * Daily Notification Cron
 *
 * Run this once daily (e.g. 6pm local time) via:
 *   - node-cron in your server
 *   - External cron (Render, Railway, etc.)
 *   - Or a simple setInterval as fallback
 *
 * It does two things:
 *   1. Sends streak alerts to users who HAVE a streak (motivation to keep going)
 *   2. Sends workout reminders to users who HAVEN'T worked out today
 */

export const runDailyNotifications = async () => {
  console.log("⏰ Running daily notification cron...");
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    // ─── 1. Get all users with push tokens & reminders enabled ─────
    const users = await User.find({
      expoPushToken: { $exists: true, $ne: null },
      "notificationPrefs.workoutReminder": { $ne: false },
    })
      .select(
        "_id firstName streakCount lastWorkoutDate notificationPrefs expoPushToken",
      )
      .lean();

    if (users.length === 0) {
      console.log("No users with push tokens found");
      return;
    }

    // ─── 2. Get today's workout logs to know who already trained ───
    const todaysLogs = await WorkoutLog.find({
      createdAt: { $gte: todayStart },
    })
      .select("userId")
      .lean();

    const trainedToday = new Set(todaysLogs.map((l) => l.userId.toString()));

    let streakAlerts = 0;
    let reminders = 0;

    for (const user of users) {
      const userId = user._id.toString();
      const hasTrainedToday = trainedToday.has(userId);

      if (hasTrainedToday && user.streakCount > 1) {
        // ── Streak alert: celebrate their streak ──────────────────
        await Notification.create({
          userId: user._id,
          type: "STREAK",
          title: `🔥 ${user.streakCount} day streak!`,
          body: "Keep the momentum going — you're on fire!",
          data: { streakCount: user.streakCount },
        });
        await notifyStreakAlert(user._id, user.streakCount);
        streakAlerts++;
      } else if (!hasTrainedToday) {
        // ── Workout reminder: nudge them to train ─────────────────
        // Don't ƒspam — only if they haven't been reminded today
        const alreadyReminded = await Notification.findOne({
          userId: user._id,
          type: "WORKOUT_REMINDER",
          createdAt: { $gte: todayStart },
        });

        if (!alreadyReminded) {
          const streakMsg =
            user.streakCount > 0
              ? `Don't lose your ${user.streakCount} day streak!`
              : "Start building a new streak today!";

          await Notification.create({
            userId: user._id,
            type: "WORKOUT_REMINDER",
            title: "💪 Time to Train!",
            body: streakMsg,
          });
          await notifyWorkoutReminder(user._id);
          reminders++;
        }
      }
    }

    console.log(
      `✅ Daily notifications sent: ${streakAlerts} streak alerts, ${reminders} workout reminders`,
    );
    return { streakAlerts, reminders };
  } catch (error) {
    console.error("❌ Daily notification cron error:", error.message);
  }
};

/**
 * Start the cron scheduler
 * Call this from your server startup (index.js / server.js)
 *
 * Usage:
 *   import { startNotificationCron } from './cron/dailyNotifications.js';
 *   startNotificationCron();
 */
export const startNotificationCron = () => {
  // Run at 6:00 PM every day (18:00 server time)
  // Using setInterval as a simple approach that works everywhere
  // For production, consider node-cron: cron.schedule('0 18 * * *', runDailyNotifications)

  const HOUR = 18; // 6 PM — adjust to your timezone
  const scheduleNext = () => {
    const now = new Date();
    const next = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      HOUR,
      0,
      0,
    );

    // If we've already passed the target hour today, schedule for tomorrow
    if (now >= next) {
      next.setDate(next.getDate() + 1);
    }

    const msUntilNext = next - now;
    console.log(
      `📅 Next daily notification cron in ${Math.round(msUntilNext / 3600000)}h`,
    );

    setTimeout(async () => {
      await runDailyNotifications();
      // Schedule the next day
      scheduleNext();
    }, msUntilNext);
  };

  scheduleNext();
  console.log("🔔 Daily notification cron scheduled");
};
