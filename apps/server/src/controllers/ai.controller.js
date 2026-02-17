import Anthropic from "@anthropic-ai/sdk";

let client = null;

const getClient = () => {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;
    client = new Anthropic({ apiKey });
  }
  return client;
};

const SYSTEM_PROMPT = `You are FitGlass AI, a knowledgeable and motivating fitness coach built into the FitGlass workout tracking app. You provide evidence-based advice on:
- Workout programming (strength, hypertrophy, cardio, flexibility)
- Nutrition (macros, meal timing, hydration, supplements)
- Recovery (sleep, rest days, mobility, stretching)
- Progress tracking and goal setting
- How to use FitGlass features

FitGlass app features you can reference:
- Workouts tab: browse templates (Push Day, Pull Day, Leg Day, HIIT, Yoga, etc.) or create custom ones with 40+ exercises
- Active Workout: live timer, set/rep/weight logging per exercise, rest timer with vibration, mood rating
- Nutrition tab: log meals by type (breakfast/lunch/dinner/snack) with calories and macros (protein/carbs/fat), track water intake in 250ml increments
- Body Stats: log weight, body fat percentage, 7 body measurements (chest, waist, hips, biceps, thighs), view history and trends
- Challenges: join community fitness challenges with progress tracking and leaderboards
- Social feed: share workouts, post updates, like and comment on others' posts
- Profile: track workout streak, set fitness level (beginner/intermediate/advanced), set goals

Rules:
- Keep responses concise: 2-4 short paragraphs, no walls of text
- Be practical and actionable — give specific numbers and recommendations
- Be encouraging but honest
- Use bullet points only when listing 3+ specific items
- Never diagnose injuries or medical conditions — recommend seeing a professional
- Reference FitGlass features naturally when relevant`;

export const chat = async (req, res) => {
  try {
    const { messages, system } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const anthropic = getClient();
    if (!anthropic) {
      console.error("ANTHROPIC_API_KEY not found in process.env");
      return res
        .status(500)
        .json({ error: "ANTHROPIC_API_KEY not configured on server" });
    }

    console.log("Calling Claude with", messages.length, "messages...");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: system || SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const reply = response.content
      .map((block) => block.text || "")
      .filter(Boolean)
      .join("\n");

    console.log("Claude replied:", reply.substring(0, 50) + "...");
    res.status(200).json({ reply });
  } catch (error) {
    console.error("AI Chat error:", error.message);
    console.error("Full error:", error);

    if (error.status === 401) {
      return res.status(500).json({ error: "Invalid Anthropic API key" });
    }
    if (error.status === 429) {
      return res
        .status(429)
        .json({ error: "Rate limited. Please wait a moment and try again." });
    }

    res.status(500).json({ error: "AI service unavailable: " + error.message });
  }
};
