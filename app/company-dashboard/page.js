"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CompanyNavbar from '@/component/CompanyNavbar';
import {
  BarChart3, Activity, Download, Filter, RefreshCw, TrendingUp, AlertTriangle,
  CheckCircle, XCircle, Eye, ExternalLink, Calendar, Globe, Star, Users,
  PieChart, LineChart, Hash, Clock, Target, Shield
} from 'lucide-react';

// Enhanced Chart Component for better visualizations
const PieChartComponent = ({ data, title }) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <PieChart className="text-purple-500" size={20} />
        {title}
      </h2>
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">{item.name}</span>
                <div className="text-right">
                  <span className="text-white font-semibold">{item.value}</span>
                  <span className="text-gray-400 text-xs ml-1">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color || '#8B5CF6'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Line Chart Component for timeline data
const LineChartComponent = ({ data, title }) => {
  if (!data || data.length === 0) return null;

  const maxY = Math.max(...data.map(d => d.y));
  const validData = data.filter(d => !isNaN(new Date(d.x).getTime()));
  const dates = validData.map(d => new Date(d.x).getTime());
  const minX = Math.min(...dates);
  const maxX = Math.max(...dates);

  const width = 300;
  const height = 200;

  let points, circles;
  if (maxX === minX || validData.length === 0) {
    // All dates are the same or no valid dates, spread evenly
    points = validData.map((d, i) => {
      const x = validData.length > 1 ? (i / (validData.length - 1)) * width : width / 2;
      const y = height - (d.y / maxY) * height;
      return `${x},${y}`;
    }).join(' ');
    circles = validData.map((d, i) => {
      const x = validData.length > 1 ? (i / (validData.length - 1)) * width : width / 2;
      const y = height - (d.y / maxY) * height;
      return { x, y, i };
    });
  } else {
    points = validData.map(d => {
      const x = ((new Date(d.x).getTime() - minX) / (maxX - minX)) * width;
      const y = height - (d.y / maxY) * height;
      return `${x},${y}`;
    }).join(' ');
    circles = validData.map((d, i) => {
      const x = ((new Date(d.x).getTime() - minX) / (maxX - minX)) * width;
      const y = height - (d.y / maxY) * height;
      return { x, y, i };
    });
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <LineChart className="text-blue-500" size={20} />
        {title}
      </h2>
      <svg width={width} height={height} className="w-full h-48">
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          points={points}
        />
        {circles.map(({ x, y, i }) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#3B82F6" />
        ))}
      </svg>
    </div>
  );
};

// Bar Chart Component for distributions
const BarChartComponent = ({ data, title }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="text-green-500" size={20} />
        {title}
      </h2>
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">{item.name}</span>
                <span className="text-white font-semibold">{item.value}</span>
              </div>
              <div className="h-4 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color || '#10B981'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced News Card with detailed information
const NewsCard = ({ news, index }) => {
  const [expanded, setExpanded] = useState(false);

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'REAL': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'FAKE': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Breaking News': 'bg-red-500/20 text-red-400',
      'Financial': 'bg-blue-500/20 text-blue-400',
      'Product/Innovation': 'bg-purple-500/20 text-purple-400',
      'Partnerships': 'bg-green-500/20 text-green-400',
      'Legal/Regulatory': 'bg-yellow-500/20 text-yellow-400'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-gray-500">#{news.id || index + 1}</span>
          <span className={`px-2 py-1 rounded-full text-xs border ${getCategoryColor(news.category)}`}>
            {news.category || 'General'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${getSentimentColor(news.sentiment)}`}>
            {news.sentiment || 'neutral'}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <Eye size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-3 leading-tight">
        {news.title || news.news_title}
      </h3>

      <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
        <div className="flex items-center gap-1">
          <Globe size={14} />
          <span>{news.source || news.news_source || 'Unknown Source'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>{news.date || 'Recent'}</span>
        </div>
        {news.source_url && (
          <a
            href={news.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-purple-400 transition-colors"
          >
            <ExternalLink size={14} />
            <span>View Source</span>
          </a>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm border ${getVerdictColor(news.verification?.verdict || news.verdict)}`}>
            {news.verification?.verdict || news.verdict || 'UNCERTAIN'}
          </div>
          <div className="flex items-center gap-1">
            <Target size={14} className="text-gray-400" />
            <span className="text-sm text-gray-300">
              {Math.round((news.verification?.confidence || news.confidence || 0) * 100)}% confidence
            </span>
          </div>
        </div>

        {news.relevance_score && (
          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-500" />
            <span className="text-sm text-gray-300">
              {(news.relevance_score * 100).toFixed(0)}% relevance
            </span>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Summary</h4>
            <p className="text-sm text-gray-400">{news.summary || news.news_summary}</p>
          </div>

          {news.snippet && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Source Snippet</h4>
              <p className="text-sm text-gray-400 italic">"{news.snippet}"</p>
            </div>
          )}

          {news.verification?.reasoning && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Verification Analysis</h4>
              <p className="text-sm text-gray-400">{news.verification.reasoning}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>Verified: {new Date(news.verification?.verified_at || news.verified_at || Date.now()).toLocaleString()}</span>
            </div>
            {news.verification?.bias_level && (
              <div className="flex items-center gap-1">
                <Shield size={12} />
                <span>Bias: {news.verification.bias_level}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function EnhancedCompanyDashboardPage() {
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [newsFilter, setNewsFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/company-auth/company', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
        loadDashboardData(data.company.id);
      } else {
        router.push('/company-login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/company-login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async (companyId) => {
    try {
      const response = await fetch(`/api/company/dashboard`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.analytics);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const handleFetchNews = async () => {
    if (!company) return;

    setIsFetching(true);

    // Start the analysis with longer timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout

      const response = await fetch('/api/company/fetch-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        await loadDashboardData(company.id);

        // Enhanced success message
        const message = `🎉 Enhanced Analysis Complete!\n\n📊 RESULTS SUMMARY:\n📰 Total News: ${result.stats?.total_news || 0} items\n✅ Verified Real: ${result.stats?.real_count || 0}\n❌ Fake/Misleading: ${result.stats?.fake_count || 0}\n⚠️ Uncertain: ${result.stats?.uncertain_count || 0}\n🎯 Reliability Score: ${result.stats?.reliability_score || 0}%\n📈 Categories: ${Object.keys(result.stats?.category_breakdown || {}).length}\n\n🔍 Check the dashboard for detailed analysis!`;

        alert(message);
      } else {
        const errorData = await response.text();
        alert(`❌ Analysis Failed\n\nThe enhanced analysis service encountered an issue. This could be due to:\n• Network connectivity\n• API rate limits\n• Server processing capacity\n\nPlease try again in a few minutes.`);
      }
    } catch (error) {
      console.error('Fetch news error:', error);

      if (error.name === 'AbortError') {
        alert(`⏰ Analysis Timeout\n\nThe enhanced analysis is taking longer than expected (3+ minutes).\n\nThis happens when:\n• Analyzing 40+ news items\n• Verifying each source\n• Computing detailed statistics\n\nThe analysis may still be running in the background. Try refreshing in a few minutes.`);
      } else {
        alert(`❌ Connection Error\n\nCannot connect to the analysis service.\n\nPlease check:\n• Backend service is running\n• Network connection\n• Try refreshing the page\n\nError: ${error.message}`);
      }
    } finally {
      setIsFetching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading Enhanced Dashboard...</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!dashboardData || !dashboardData.has_data) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <CompanyNavbar />
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-12">
              <Activity className="w-16 h-16 text-purple-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4">Enhanced News Intelligence Dashboard</h1>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Get comprehensive analysis of {company?.name} with 30 news items,
                sentiment analysis, source verification, and detailed insights.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm">
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <div className="text-purple-400 font-semibold">30 News Items</div>
                  <div className="text-gray-500">Comprehensive Coverage</div>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <div className="text-blue-400 font-semibold">5 Categories</div>
                  <div className="text-gray-500">Organized Analysis</div>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <div className="text-green-400 font-semibold">Source Verification</div>
                  <div className="text-gray-500">Real URLs & Snippets</div>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg">
                  <div className="text-yellow-400 font-semibold">Sentiment Analysis</div>
                  <div className="text-gray-500">Positive/Negative/Neutral</div>
                </div>
              </div>
              <button
                onClick={handleFetchNews}
                disabled={isFetching}
                className="inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105"
              >
                {isFetching ? (
                  <>
                    <RefreshCw className="animate-spin" size={24} />
                    Running Enhanced Analysis...
                  </>
                ) : (
                  <>
                    <TrendingUp size={24} />
                    Start Enhanced Analysis
                  </>
                )}
              </button>
              {isFetching && (
                <div className="mt-6 text-sm text-gray-400 space-y-2">
                  <p>🔍 Finding 30 news items across 5 categories...</p>
                  <p>📊 Analyzing sentiment and sources...</p>
                  <p>🎯 Computing reliability scores...</p>
                  <p className="text-yellow-400">This may take 1-2 minutes for complete analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboardData.statistics;
  const graphData = dashboardData.graph_data || {};
  const timeline = dashboardData.timeline || [];
  const allNews = dashboardData.all_verified_news || dashboardData.verified_news || [];
  const summary = dashboardData.summary || {};

  // Filter and sort news
  const filteredNews = allNews.filter(news => {
    if (newsFilter === 'all') return true;
    return (news.verification?.verdict || news.verdict) === newsFilter;
  });

  const sortedNews = filteredNews.sort((a, b) => {
    if (sortBy === 'relevance') return (b.relevance_score || 0) - (a.relevance_score || 0);
    if (sortBy === 'confidence') return (b.verification?.confidence || b.confidence || 0) - (a.verification?.confidence || a.confidence || 0);
    if (sortBy === 'date') return new Date(b.timestamp || b.verified_at || 0) - new Date(a.timestamp || a.verified_at || 0);
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <CompanyNavbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Enhanced News Intelligence
              </h1>
              <div className="flex items-center gap-4 text-gray-400">
                <span className="flex items-center gap-2">
                  <Globe size={16} />
                  {company?.name}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={16} />
                  Updated: {new Date(dashboardData.latest_fetch).toLocaleString()}
                </span>
                <span className="flex items-center gap-2">
                  <Hash size={16} />
                  {dashboardData.total_fetches} total analyses
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-4 lg:mt-0">
              <button
                onClick={handleFetchNews}
                disabled={isFetching}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition-all"
              >
                <RefreshCw className={isFetching ? 'animate-spin' : ''} size={18} />
                {isFetching ? 'Analyzing...' : 'Refresh Analysis'}
              </button>
            </div>
          </div>

          {/* Enhanced Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-200">Total News Items</p>
                <Activity className="text-blue-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{stats.total_news}</p>
              <p className="text-xs text-blue-300">30 comprehensive analysis</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-200">Verified Real</p>
                <CheckCircle className="text-green-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{stats.real_count}</p>
              <p className="text-xs text-green-300">{Math.round((stats.real_count / stats.total_news) * 100)}% verified authentic</p>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-red-200">Fake/Misleading</p>
                <XCircle className="text-red-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{stats.fake_count}</p>
              <p className="text-xs text-red-300">{Math.round((stats.fake_count / stats.total_news) * 100)}% misinformation</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-yellow-200">Uncertain</p>
                <AlertTriangle className="text-yellow-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{stats.uncertain_count}</p>
              <p className="text-xs text-yellow-300">Avg: {Math.round((stats.avg_confidence || 0) * 100)}% confidence</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-purple-200">Reliability Score</p>
                <Target className="text-purple-400" size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{stats.reliability_score || 0}%</p>
              <p className="text-xs text-purple-300">Overall trust rating</p>
            </div>
          </div>

          {/* Enhanced Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <PieChartComponent
              data={graphData.verdict_distribution}
              title="Verification Results"
            />
            <PieChartComponent
              data={graphData.sentiment_distribution}
              title="Sentiment Analysis"
            />
            <PieChartComponent
              data={graphData.category_distribution}
              title="News Categories"
            />
          </div>

          {/* Additional Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <LineChartComponent
              data={timeline.map(t => ({x: t.date, y: t.count || 1}))}
              title="News Timeline"
            />
            <BarChartComponent
              data={Object.entries(stats.source_breakdown || {}).slice(0, 10).map(([name, value]) => ({name, value}))}
              title="Top Sources"
            />
            <BarChartComponent
              data={[
                {name: 'High (80-100%)', value: allNews.filter(n => (n.verification?.confidence || n.confidence || 0) >= 0.8).length},
                {name: 'Medium (60-79%)', value: allNews.filter(n => (n.verification?.confidence || n.confidence || 0) >= 0.6 && (n.verification?.confidence || n.confidence || 0) < 0.8).length},
                {name: 'Low (40-59%)', value: allNews.filter(n => (n.verification?.confidence || n.confidence || 0) >= 0.4 && (n.verification?.confidence || n.confidence || 0) < 0.6).length},
                {name: 'Very Low (<40%)', value: allNews.filter(n => (n.verification?.confidence || n.confidence || 0) < 0.4).length},
              ]}
              title="Confidence Distribution"
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 mb-8 bg-[#111] p-1 rounded-xl">
            {['overview', 'news', 'sources', 'timeline'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg font-medium transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'news' && (
            <div>
              {/* News Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={newsFilter}
                    onChange={(e) => setNewsFilter(e.target.value)}
                    className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="all">All News ({allNews.length})</option>
                    <option value="REAL">Real ({stats.real_count})</option>
                    <option value="FAKE">Fake ({stats.fake_count})</option>
                    <option value="UNCERTAIN">Uncertain ({stats.uncertain_count})</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="relevance">Sort by Relevance</option>
                    <option value="confidence">Sort by Confidence</option>
                    <option value="date">Sort by Date</option>
                  </select>
                </div>
              </div>

              {/* Enhanced News Grid */}
              <div className="grid gap-6">
                {sortedNews.map((news, index) => (
                  <NewsCard key={index} news={news} index={index} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="grid gap-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="text-blue-400" size={20} />
                    Top Sources
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(stats.source_breakdown || {}).slice(0, 5).map(([source, count]) => (
                      <div key={source} className="flex justify-between text-sm">
                        <span className="text-gray-300 truncate">{source}</span>
                        <span className="text-white font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="text-purple-400" size={20} />
                    Data Freshness
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Update:</span>
                      <span className="text-white">{Math.round(dashboardData.data_freshness || 0)} hours ago</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Analyses:</span>
                      <span className="text-white">{dashboardData.total_fetches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Confidence:</span>
                      <span className="text-white">{Math.round((summary.avg_confidence || 0) * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="text-green-400" size={20} />
                    Trend Analysis
                  </h3>
                  <div className="space-y-3 text-sm">
                    {Object.entries(dashboardData.trend_data || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
                        <span className={`font-semibold ${
                          value === 'improving' ? 'text-green-400' :
                          value === 'declining' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show latest news preview in overview */}
          {activeTab === 'overview' && (
            <div className="bg-[#111] border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Latest Verified News</h2>
                <button
                  onClick={() => setActiveTab('news')}
                  className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                >
                  View All {allNews.length} →
                </button>
              </div>
              <div className="grid gap-4">
                {allNews.slice(0, 3).map((news, index) => (
                  <NewsCard key={index} news={news} index={index} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="grid gap-6">
              <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Globe className="text-green-400" size={20} />
                  News Sources Analysis
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BarChartComponent
                    data={Object.entries(stats.source_breakdown || {}).slice(0, 10).map(([name, value]) => ({name, value}))}
                    title="Top 10 Sources"
                  />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-300">Source Details</h3>
                    <div className="space-y-3">
                      {Object.entries(stats.source_breakdown || {}).slice(0, 10).map(([source, count]) => (
                        <div key={source} className="flex justify-between items-center p-3 bg-[#1a1a1a] rounded-lg">
                          <span className="text-gray-300 truncate flex-1">{source}</span>
                          <span className="text-white font-semibold ml-4">{count} articles</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="grid gap-6">
              <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Clock className="text-purple-400" size={20} />
                  News Timeline
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <LineChartComponent
                    data={timeline.map(t => ({x: t.date, y: t.count || 1}))}
                    title="News Volume Over Time"
                  />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-300">Timeline Events</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {timeline.map((t, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-[#1a1a1a] rounded-lg">
                          <span className="text-gray-300">{new Date(t.date).toLocaleDateString()}</span>
                          <span className="text-white font-semibold">{t.count || 1} news items</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}