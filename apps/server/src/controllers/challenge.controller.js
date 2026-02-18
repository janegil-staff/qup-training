import Challenge from "../models/Challenge.js";
import Notification from "../models/Notification.js";

// ─── Get Active Challenges ───────────────────────────────────────────
export const getActive = async (req, res) => {
  try {
    const now = new Date();
    const challenges = await Challenge.find({
      isPublic: true,
      endDate: { $gte: now },
    })
      .populate("createdBy", "firstName lastName")
      .sort({ startDate: -1 });

    // Add user's participation status
    const enriched = challenges.map((c) => {
      const obj = c.toObject();
      const participation = obj.participants.find(
        (p) => p.userId.toString() === req.userId,
      );
      obj.joined = !!participation;
      obj.myProgress = participation?.progress || 0;
      obj.participantCount = obj.participants.length;
      return obj;
    });

    res.status(200).json(enriched);
  } catch (error) {
    console.error("GetChallenges error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Get by ID ───────────────────────────────────────────────────────
export const getById = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate("createdBy", "firstName lastName")
      .populate("participants.userId", "firstName lastName avatar");
    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });
    res.status(200).json(challenge);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Create Challenge ────────────────────────────────────────────────
export const create = async (req, res) => {
  try {
    const { name, description, type, target, unit, startDate, endDate, image } =
      req.body;
    if (!name || !target || !startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Name, target, startDate, and endDate are required" });
    }

    const challenge = await Challenge.create({
      name,
      description,
      type: type || "WORKOUT_COUNT",
      target,
      unit,
      startDate,
      endDate,
      image,
      createdBy: req.userId,
      isPublic: true,
      participants: [{ userId: req.userId, progress: 0 }],
    });

    res.status(201).json(challenge);
  } catch (error) {
    console.error("CreateChallenge error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Join Challenge ──────────────────────────────────────────────────
export const join = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });

    const already = challenge.participants.find(
      (p) => p.userId.toString() === req.userId,
    );
    if (already) return res.status(400).json({ error: "Already joined" });

    if (new Date() > challenge.endDate)
      return res.status(400).json({ error: "Challenge has ended" });

    challenge.participants.push({ userId: req.userId, progress: 0 });
    await challenge.save();

    res
      .status(200)
      .json({
        message: "Joined",
        participantCount: challenge.participants.length,
      });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Update Progress ─────────────────────────────────────────────────
export const updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });

    const participant = challenge.participants.find(
      (p) => p.userId.toString() === req.userId,
    );
    if (!participant)
      return res.status(400).json({ error: "Not a participant" });

    participant.progress = progress;
    if (progress >= challenge.target && !participant.completedAt) {
      participant.completedAt = new Date();
      await Notification.create({
        userId: req.userId,
        type: "ACHIEVEMENT",
        title: `You completed "${challenge.name}"!`,
        data: { challengeId: challenge._id },
      });
    }
    await challenge.save();

    res
      .status(200)
      .json({
        progress: participant.progress,
        completed: !!participant.completedAt,
      });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Leaderboard ─────────────────────────────────────────────────────
export const getLeaderboard = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id).populate(
      "participants.userId",
      "firstName lastName avatar",
    );
    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });

    const leaderboard = challenge.participants
      .map((p) => ({
        userId: p.userId,
        progress: p.progress,
        completed: !!p.completedAt,
        completedAt: p.completedAt,
        percentage: Math.min(
          100,
          Math.round((p.progress / challenge.target) * 100),
        ),
      }))
      .sort((a, b) => b.progress - a.progress);

    res
      .status(200)
      .json({ leaderboard, target: challenge.target, unit: challenge.unit });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const remove = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });
    if (challenge.createdBy.toString() !== req.userId) {
      return res
        .status(403)
        .json({ error: "Only the creator can delete this challenge" });
    }
    const response = await challenge.deleteOne();

    res.json({ message: "Challenge deleted" });
  } catch (err) {
    console.log("ERR, ", err);
    res.status(500).json({ error: err.message });
  }
};
