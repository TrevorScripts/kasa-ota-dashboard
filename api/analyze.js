cat > api/analyze.js << 'EOF'
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { listing } = req.body;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: `You are an OTA performance analyst. Analyze this listing's metrics and provide a brief, actionable diagnosis:

Listing: ${listing.name}
Search Appearances: ${listing.appearances.toLocaleString()}
Total Views: ${listing.views.toLocaleString()}
Bookings: ${listing.bookings}
Click-through Rate: ${listing.ctr.toFixed(2)}%
Conversion Rate: ${listing.conversionRate.toFixed(2)}%
Expected Conversion: ${listing.expectedConversion.toFixed(1)}%

Provide:
1. **Primary Issue:** (one sentence)
2. **Root Cause Hypothesis:** (2-3 possibilities)
3. **Top 2 Action Items:** (specific, actionable steps)
4. **Priority Level:** (P1/P2/P3)

Be concise and actionable. Format as plain text with clear sections.`
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Anthropic API Error:", errorData);
            return res.status(response.status).json({ 
                error: errorData.error?.message || 'API request failed' 
            });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
EOF
