export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { listing } = req.body;
  
  if (!listing) {
    return res.status(400).json({ error: "Listing data is required" });
  }

  try {
    const prompt = `You are an OTA performance analyst. Analyze this property listing:

Property: ${listing.name || "Unknown"}
ID: ${listing.id}
Impressions: ${listing.impressions || 0}
Views/Clicks: ${listing.clicks || 0}
Bookings: ${listing.bookings || 0}
CTR: ${listing.ctr ? listing.ctr.toFixed(2) : 0}%
Conversion Rate: ${listing.conversionRate ? listing.conversionRate.toFixed(2) : 0}%

Provide:
1. Primary issue (one sentence)
2. Root cause (2-3 possibilities)
3. Top 2 action items
4. Priority level (High/Medium/Low)

Keep response under 200 words.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return res.status(500).json({ 
        error: `API error: ${response.status}`,
        details: errorText 
      });
    }

    const data = await response.json();
    
    return res.status(200).json({
      content: data.content
    });

  } catch (error) {
    console.error("AI analysis error:", error);
    return res.status(500).json({ 
      error: "AI analysis failed",
      message: error.message 
    });
  }
}