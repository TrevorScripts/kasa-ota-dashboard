const handleAIAnalysis = async (listing) => {
  setAnalyzing(listing.id);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing }),
    });

    // If API returns non-200, throw error
    if (!response.ok) {
      const text = await response.text(); // Get raw response to debug
      throw new Error(text);
    }

    const data = await response.json();
    setAiInsights(prev => ({ ...prev, [listing.id]: data.content[0].text }));
  } catch (err) {
    console.error(err);
    setAiInsights(prev => ({
      ...prev,
      [listing.id]: `Analysis failed: ${err.message}`,
    }));
  } finally {
    setAnalyzing(null);
  }
};
