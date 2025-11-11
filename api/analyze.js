// /api/analyze.js
import { Anthropic, HUMAN_PROMPT, AI_PROMPT } from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { listing } = req.body;

    if (!listing) {
      return res.status(400).json({ error: 'Listing data is required' });
    }

    // Build the prompt for Claude
    const prompt = `${HUMAN_PROMPT} 
Analyze this Airbnb listing and provide actionable insights to improve bookings, conversion rate, and overall performance. Include likely issues and recommended actions. 
Listing Data: ${JSON.stringify(listing, null, 2)}
${AI_PROMPT}`;

    // Call Claude
    const response = await client.completions.create({
      model: "claude-2",          // or "claude-instant-v1"
      prompt,
      max_tokens_to_sample: 500,
      temperature: 0.7
    });

    return res.status(200).json({
      content: [
        { text: response.completion }
      ]
    });

  } catch (error) {
    console.error("AI analysis error:", error);
    return res.status(500).json({ error: 'AI analysis failed' });
  }
}
