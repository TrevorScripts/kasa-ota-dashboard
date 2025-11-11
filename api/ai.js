<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kasa OTA Performance Monitor - Multi-Week Analysis</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useMemo } = React;

    // -----------------------------
    // ICON COMPONENTS
    // -----------------------------
    const AlertTriangle = ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12" y2="17" />
      </svg>
    );

    const XCircle = ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );

    const CheckCircle = ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 12 15 17 10" />
      </svg>
    );

    const AlertCircle = ({ className = "w-6 h-6" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12" y2="16" />
      </svg>
    );

    const ChevronUp = ({ className = "w-5 h-5" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    );

    const ChevronDown = ({ className = "w-5 h-5" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    );

    const Zap = ({ className = "w-5 h-5" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );

    const DollarSign = ({ className = "w-5 h-5" }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    );

    // -----------------------------
    // SAMPLE DATA AND UTILITIES
    // -----------------------------
    const weeklyData = {
      "2025-11-03": `id_listing,name,conversionRate,expectedConversion,estimatedWeeklyLoss
1,Listing A,3.2,5.0,1200
2,Listing B,6.5,6.0,200
3,Listing C,2.0,4.5,1500`,
      "2025-10-27": `id_listing,name,conversionRate,expectedConversion,estimatedWeeklyLoss
1,Listing A,2.8,5.0,1400
2,Listing B,6.0,6.0,250
3,Listing C,2.5,4.5,1300`
    };

    function parseCSV(csv) {
      const [headerLine, ...lines] = csv.split("\n");
      const headers = headerLine.split(",");
      return lines.map(line => {
        const values = line.split(",");
        return headers.reduce((obj, key, idx) => {
          obj[key] = isNaN(values[idx]) ? values[idx] : parseFloat(values[idx]);
          return obj;
        }, {});
      });
    }

    function calculateMetrics(listing) {
      const severity = listing.conversionRate < listing.expectedConversion ? 2 : 0;
      let tier = 'healthy';
      if (listing.conversionRate < listing.expectedConversion * 0.6) tier = 'critical';
      else if (listing.conversionRate < listing.expectedConversion * 0.9) tier = 'high';
      else if (listing.conversionRate < listing.expectedConversion) tier = 'watch';
      return { ...listing, severity, tier, estimatedWeeklyLoss: listing.estimatedWeeklyLoss };
    }

    // -----------------------------
    // ALERT COMPONENT
    // -----------------------------
    const Alert = ({ listing, metrics, trend, onAnalyze, analyzing }) => {
      const [expanded, setExpanded] = useState(false);

      const tierConfig = {
        critical: { color: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-800', icon: <XCircle className="text-red-600" />, label: 'CRITICAL' },
        high: { color: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="text-orange-600" />, label: 'HIGH PRIORITY' },
        watch: { color: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="text-yellow-600" />, label: 'WATCH LIST' },
        healthy: { color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-800', icon: <CheckCircle className="text-green-600" />, label: 'HEALTHY' }
      };
      
      const config = tierConfig[metrics.tier];

      return (
        <div className={`border rounded-lg p-4 mb-3 ${config.color} flex justify-between items-start`}>
          <div className="flex items-center space-x-2">
            {config.icon}
            <div>
              <div className="font-semibold">{listing.name}</div>
              <div className="text-sm text-gray-700">Conversion: {metrics.conversionRate.toFixed(1)}% (Expected: {metrics.expectedConversion.toFixed(1)}%)</div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2 ml-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-600 hover:text-gray-900 p-1 transition-colors"
            >
              {expanded ? <ChevronUp /> : <ChevronDown />}
            </button>
            <button
              onClick={() => onAnalyze(listing)}
              disabled={analyzing === listing.id_listing}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <Zap />
              <span>{analyzing === listing.id_listing ? 'Analyzing...' : 'AI Diagnose'}</span>
            </button>
          </div>
        </div>
      );
    };

    // -----------------------------
    // MAIN DASHBOARD
    // -----------------------------
    function KasaDashboard() {
      const dateRanges = Object.keys(weeklyData);
      const [selectedWeek, setSelectedWeek] = useState(dateRanges[dateRanges.length - 1]);
      const [filterTier, setFilterTier] = useState('all');
      const [analyzing, setAnalyzing] = useState(null);
      const [aiInsights, setAiInsights] = useState({});

      const currentWeekData = useMemo(() => parseCSV(weeklyData[selectedWeek]), [selectedWeek]);
      const previousWeekData = useMemo(() => {
        const currentIndex = dateRanges.indexOf(selectedWeek);
        if (currentIndex > 0) return parseCSV(weeklyData[dateRanges[currentIndex - 1]]);
        return null;
      }, [selectedWeek]);

      const enrichedListings = useMemo(() => {
        return currentWeekData.map(listing => {
          const metrics = calculateMetrics(listing);
          let trend = null;
          if (previousWeekData) {
            const prevListing = previousWeekData.find(l => l.id_listing === listing.id_listing);
            if (prevListing) {
              const prevMetrics = calculateMetrics(prevListing);
              const convChange = metrics.conversionRate - prevMetrics.conversionRate;
              trend = { direction: convChange < -0.5 ? 'down' : convChange > 0.5 ? 'up' : 'flat', change: `${convChange > 0 ? '+' : ''}${convChange.toFixed(1)}%` };
            }
          }
          return { ...listing, metrics, trend };
        }).sort((a,b) => b.metrics.severity - a.metrics.severity);
      }, [currentWeekData, previousWeekData]);

      const filteredListings = useMemo(() => filterTier === 'all' ? enrichedListings : enrichedListings.filter(l => l.metrics.tier === filterTier), [enrichedListings, filterTier]);

      const stats = useMemo(() => {
        const critical = enrichedListings.filter(l => l.metrics.tier === 'critical').length;
        const high = enrichedListings.filter(l => l.metrics.tier === 'high').length;
        const watch = enrichedListings.filter(l => l.metrics.tier === 'watch').length;
        const totalLoss = enrichedListings.reduce((sum, l) => sum + l.metrics.estimatedWeeklyLoss, 0);
        return { critical, high, watch, totalLoss };
      }, [enrichedListings]);

      const handleAIAnalysis = async (listing) => {
        setAnalyzing(listing.id_listing);
        try {
          const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listing })
          });

          if (!response.ok) throw new Error('API request failed');
          const data = await response.json();
          setAiInsights(prev => ({ ...prev, [listing.id_listing]: data.content[0].text }));
        } catch (err) {
          setAiInsights(prev => ({ ...prev, [listing.id_listing]: `Analysis failed: ${err.message}` }));
        } finally {
          setAnalyzing(null);
        }
      };

      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <h1 className="text-2xl font-bold mb-4">Kasa OTA Performance Monitor</h1>
          <div className="mb-4">
            <label className="mr-2 font-semibold">Filter by Tier:</label>
            <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className="border rounded px-2 py-1">
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="watch">Watch</option>
              <option value="healthy">Healthy</option>
            </select>
          </div>

          {filteredListings.map(listing => (
            <div key={listing.id_listing}>
              <Alert listing={listing} metrics={listing.metrics} trend={listing.trend} onAnalyze={handleAIAnalysis} analyzing={analyzing} />
              {aiInsights[listing.id_listing] && (
                <div className="ml-8 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow">
                  <div className="flex items-start space-x-2">
                    <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-blue-900 mb-1">⚡ AI Analysis</div>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">{aiInsights[listing.id_listing]}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<KasaDashboard />);
  </script>
</body>
</html>
