// api/analyze.js
import { Anthropic, HUMAN_PROMPT, AI_PROMPT } from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { listing } = req.body;
  if (!listing) return res.status(400).json({ error: "Listing data is required" });

  try {
    const prompt = `${HUMAN_PROMPT}
Analyze this Airbnb listing and provide actionable insights.
Listing: ${JSON.stringify(listing, null, 2)}
${AI_PROMPT}`;

    const response = await client.completions.create({
      model: "claude-2",
      prompt,
      max_tokens_to_sample: 500,
      temperature: 0.7,
    });

    res.status(200).json({ content: [{ text: response.completion }] });
  } catch (error) {
    console.error("AI analysis error:", error);
    res.status(500).json({ error: "AI analysis failed" });
  }
}
