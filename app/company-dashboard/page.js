"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CompanyNavbar from '@/component/CompanyNavbar';
import {
  TrendingUp, TrendingDown, AlertTriangle, Eye, RefreshCw, Download,
  Activity, BarChart3, PieChart, Calendar, Clock, Globe, Shield,
  CheckCircle, XCircle, AlertCircle, Zap, Target
} from 'lucide-react';

export default function CompanyDashboard() {
  const [company, setCompany] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [showPastReports, setShowPastReports] = useState(false);
  const [selectedReportDate, setSelectedReportDate] = useState(null);
  const [showAnalysisOptions, setShowAnalysisOptions] = useState(false);
  const [analysisPeriod, setAnalysisPeriod] = useState('today');
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/company/dashboard', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCompany(data.company);
        setAnalytics(data.analytics);
      } else {
        router.push('/company-login');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchNews = async () => {
    if (!company) return;
    
    setIsFetching(true);
    setError('');

    try {
      const response = await fetch('/api/company/fetch-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          companyId: company.id,
          analysisPeriod: analysisPeriod
        })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchDashboardData();
        setSelectedReportDate(null);
        setShowAnalysisOptions(false);
      } else {
        setError(data.error || 'Failed to fetch news');
      }
    } catch (error) {
      console.error('Fetch news error:', error);
      setError('An error occurred while fetching news');
    } finally {
      setIsFetching(false);
    }
  };

  const loadPastReport = async (timestamp) => {
    if (!company) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/company/report/${company.id}/${timestamp}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
        setSelectedReportDate(timestamp);
        setShowPastReports(false);
      } else {
        setError('Failed to load past report');
      }
    } catch (error) {
      console.error('Load past report error:', error);
      setError('An error occurred while loading the report');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTodayReport = () => {
    setSelectedReportDate(null);
    fetchDashboardData();
  };

  // Sentiment Score Gauge Component
  const SentimentGauge = ({ score }) => {
    const rotation = (score / 100) * 180 - 90;
    const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
    
    return (
      <div className="relative w-48 h-24 mx-auto">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="20"
          />
          {/* Colored arc */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke={color}
            strokeWidth="20"
            strokeDasharray={`${score * 2.51} 251`}
            strokeLinecap="round"
          />
          {/* Needle */}
          <line
            x1="100"
            y1="90"
            x2="100"
            y2="30"
            stroke={color}
            strokeWidth="3"
            transform={`rotate(${rotation} 100 90)`}
            strokeLinecap="round"
          />
          <circle cx="100" cy="90" r="5" fill={color} />
        </svg>
        <div className="absolute bottom-0 w-full text-center">
        </div>
      </div>
    );
  };

  // Crisis Alert Card
  const CrisisAlert = ({ alert }) => {
    const bgColor = alert.risk_level === 'HIGH' ? 'bg-red-500/10 border-red-500/30' :
                     alert.risk_level === 'MEDIUM' ? 'bg-yellow-500/10 border-yellow-500/30' :
                     'bg-green-500/10 border-green-500/30';
    
    const textColor = alert.risk_level === 'HIGH' ? 'text-red-400' :
                      alert.risk_level === 'MEDIUM' ? 'text-yellow-400' :
                      'text-green-400';

    return (
      <div className={`border rounded-xl p-6 ${bgColor}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle size={20} className={textColor} />
              Crisis Alert
            </h3>
            <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
          </div>
          <div className={`text-2xl font-bold ${textColor}`}>
            {alert.risk_score}/100
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <div className="text-2xl font-bold text-white">{alert.mentions_today}</div>
            <div className="text-xs text-gray-400">Mentions Today</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{alert.negative_today}</div>
            <div className="text-xs text-gray-400">Negative</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{alert.positive_today}</div>
            <div className="text-xs text-gray-400">Positive</div>
          </div>
        </div>
      </div>
    );
  };

  // Stat Card Component
  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = "purple" }) => (
    <div className="bg-[#111] border border-white/10 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
          <Icon size={24} className={`text-${color}-400`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );

  // Pie Chart Component
  const PieChartComponent = ({ data, title }) => {
    if (!data || data.length === 0) return null;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return (
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-6">{title}</h3>
        <div className="flex items-center gap-8">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const angle = (percentage / 100) * 360;
                const radius = 40;
                const x1 = 50 + radius * Math.cos((currentAngle * Math.PI) / 180);
                const y1 = 50 + radius * Math.sin((currentAngle * Math.PI) / 180);
                const endAngle = currentAngle + angle;
                const x2 = 50 + radius * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 50 + radius * Math.sin((endAngle * Math.PI) / 180);
                const largeArc = angle > 180 ? 1 : 0;

                const path = `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                currentAngle = endAngle;

                return (
                  <path
                    key={index}
                    d={path}
                    fill={item.color || '#8B5CF6'}
                    opacity="0.9"
                  />
                );
              })}
              <circle cx="50" cy="50" r="25" fill="#0a0a0a" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{total}</div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color || '#8B5CF6' }}
                  />
                  <span className="text-sm text-gray-300">{item.name}</span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {item.value} ({((item.value / total) * 100).toFixed(0)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Bar Chart Component
  const BarChartComponent = ({ data, title, dataKey = "value" }) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d[dataKey] || 0));

    return (
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-6">{title}</h3>
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = maxValue > 0 ? (item[dataKey] / maxValue) * 100 : 0;
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">{item.name || item.date}</span>
                  <span className="text-white font-semibold">{item[dataKey]}</span>
                </div>
                <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Line Chart Component for Sentiment Trend
  const LineChartComponent = ({ data, title }) => {
    if (!data || data.length === 0) return null;

    const chartData = data.slice(0, 7).reverse();
    
    // Handle edge cases - ensure we have valid data
    const allValues = chartData.flatMap(d => [
      d.positive || 0, 
      d.neutral || 0, 
      d.negative || 0
    ]);
    const maxValue = Math.max(...allValues, 1); // Minimum 1 to avoid division by zero
    
    const padding = 40;
    const width = 600;
    const height = 300;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const getX = (index) => {
      if (chartData.length <= 1) return padding + chartWidth / 2;
      return padding + (index / (chartData.length - 1)) * chartWidth;
    };
    
    const getY = (value) => {
      const safeValue = value || 0;
      if (maxValue === 0) return height - padding;
      return height - padding - (safeValue / maxValue) * chartHeight;
    };

    const createPath = (key) => {
      return chartData.map((d, i) => {
        const x = getX(i);
        const y = getY(d[key] || 0);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');
    };

    return (
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-6">{title}</h3>
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = height - padding - (i / 4) * chartHeight;
              return (
                <g key={i}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="#333"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding - 10}
                    y={y + 4}
                    fill="#666"
                    fontSize="12"
                    textAnchor="end"
                  >
                    {Math.round((maxValue * i) / 4)}
                  </text>
                </g>
              );
            })}

            {/* Positive line */}
            <path
              d={createPath('positive')}
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Neutral line */}
            <path
              d={createPath('neutral')}
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Negative line */}
            <path
              d={createPath('negative')}
              fill="none"
              stroke="#EF4444"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {chartData.map((d, i) => {
              const x = getX(i);
              const posY = getY(d.positive || 0);
              const neuY = getY(d.neutral || 0);
              const negY = getY(d.negative || 0);
              
              return (
                <g key={i}>
                  <circle cx={x} cy={posY} r="4" fill="#10B981" />
                  <circle cx={x} cy={neuY} r="4" fill="#9CA3AF" />
                  <circle cx={x} cy={negY} r="4" fill="#EF4444" />
                  {/* Date labels */}
                  <text
                    x={x}
                    y={height - padding + 20}
                    fill="#666"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {d.date ? new Date(d.date).getDate() : i + 1}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-400">Positive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span className="text-sm text-gray-400">Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-400">Negative</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // News Feed Item
  const NewsFeedItem = ({ news }) => {
    const sentimentColor = news.sentiment === 'positive' ? 'text-green-400 bg-green-500/10' :
                          news.sentiment === 'negative' ? 'text-red-400 bg-red-500/10' :
                          'text-gray-400 bg-gray-500/10';
    
    const verdictIcon = news.verification?.verdict === 'REAL' ? <CheckCircle size={16} className="text-green-400" /> :
                       news.verification?.verdict === 'FAKE' ? <XCircle size={16} className="text-red-400" /> :
                       <AlertCircle size={16} className="text-yellow-400" />;

    return (
      <div className="bg-[#111] border border-white/10 rounded-lg p-4 hover:border-purple-500/30 transition-all">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h4 className="font-semibold text-white flex-1 line-clamp-2">{news.title}</h4>
          {verdictIcon}
        </div>
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{news.summary}</p>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${sentimentColor}`}>
              {news.sentiment}
            </span>
            <span className="text-xs text-gray-500">{news.category}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={12} />
            {news.date}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <CompanyNavbar />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-400">Real-time monitoring for {company?.name}</p>
              {selectedReportDate && (
                <p className="text-sm text-purple-400 mt-1">
                  Viewing Past Report: {new Date(selectedReportDate).toLocaleString()}
                </p>
              )}
              {analytics?.is_today && !selectedReportDate && (
                <p className="text-sm text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle size={14} />
                  Today's Analysis Available
                </p>
              )}
              {analytics?.analysis_period && (
                <div className="mt-2 inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full text-xs">
                  <Calendar size={12} className="text-purple-400" />
                  <span className="text-purple-400">
                    {analytics.analysis_period === 'today' ? 'Today\'s Analysis' :
                     analytics.analysis_period === 'week' ? 'This Week\'s Analysis' :
                     analytics.analysis_period === 'month' ? 'This Month\'s Analysis' :
                     analytics.analysis_period === 'year' ? 'This Year\'s Analysis' : 
                     'Analysis'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4 md:mt-0 flex-wrap">
              {selectedReportDate && (
                <button
                  onClick={loadTodayReport}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-all"
                >
                  <Calendar size={18} />
                  Back to Today
                </button>
              )}
              {analytics?.past_reports && analytics.past_reports.length > 0 && (
                <button
                  onClick={() => setShowPastReports(!showPastReports)}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-all"
                >
                  <Clock size={18} />
                  Past Reports ({analytics.past_reports.length})
                </button>
              )}
              <button
                onClick={() => setShowAnalysisOptions(!showAnalysisOptions)}
                disabled={isFetching}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-all"
              >
                <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
                {isFetching ? 'Analyzing...' : analytics?.has_today_analysis && !selectedReportDate ? 'Re-analyze' : 'Analyze Now'}
              </button>
            </div>
          </div>

          {/* Analysis Options Modal */}
          {showAnalysisOptions && (
            <div className="bg-[#111] border border-purple-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Select Analysis Period</h3>
              
              {/* Period Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { value: 'today', label: 'Today', desc: 'Last 24 hours' },
                  { value: 'week', label: 'This Week', desc: 'Last 7 days' },
                  { value: 'month', label: 'This Month', desc: 'Last 30 days' },
                  { value: 'year', label: 'This Year', desc: 'Last 365 days' }
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setAnalysisPeriod(period.value)}
                    className={`p-4 rounded-lg border transition-all ${
                      analysisPeriod === period.value
                        ? 'bg-purple-500/20 border-purple-500'
                        : 'bg-[#1a1a1a] border-white/10 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{period.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{period.desc}</div>
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleFetchNews}
                  disabled={isFetching}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-all"
                >
                  <Zap size={18} />
                  {isFetching ? 'Analyzing...' : 'Start Analysis'}
                </button>
                <button
                  onClick={() => setShowAnalysisOptions(false)}
                  className="px-6 py-3 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Past Reports Dropdown */}
          {showPastReports && analytics?.past_reports && (
            <div className="bg-[#111] border border-white/10 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Select a Past Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analytics.past_reports.map((report, index) => (
                  <button
                    key={index}
                    onClick={() => loadPastReport(report.timestamp)}
                    className={`text-left p-4 rounded-lg border transition-all ${
                      selectedReportDate === report.timestamp
                        ? 'bg-purple-500/20 border-purple-500'
                        : 'bg-[#1a1a1a] border-white/10 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{report.date}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        report.crisis_level === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                        report.crisis_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {report.crisis_level}
                      </span>
                    </div>
                    <div className="text-xs text-purple-400 mb-1">
                      {report.analysis_period === 'today' ? '📅 Today' :
                       report.analysis_period === 'week' ? '📅 This Week' :
                       report.analysis_period === 'month' ? '📅 This Month' :
                       report.analysis_period === 'year' ? '📅 This Year' : '📅 Today'}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{report.total_news} news items</span>
                      <span>Sentiment: {report.sentiment_score}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!analytics || !analytics.has_data ? (
            <div className="bg-[#111] border border-white/10 rounded-xl p-12 text-center">
              <Activity size={48} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">
                {analytics?.has_today_analysis === false ? "No Analysis Today" : "No Data Available"}
              </h3>
              <p className="text-gray-400 mb-6">
                {analytics?.message || 'Click "Analyze Now" to start tracking today\'s news'}
              </p>
              <button
                onClick={handleFetchNews}
                disabled={isFetching}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-8 py-4 rounded-lg font-medium transition-all text-lg"
              >
                <Zap size={20} className={isFetching ? 'animate-spin' : ''} />
                {isFetching ? 'Analyzing...' : 'Analyze Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Report Date Indicator */}
              {!analytics.is_today && analytics.analysis_date && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-blue-400" />
                    <div>
                      <h3 className="font-semibold text-blue-400">Viewing Historical Report</h3>
                      <p className="text-sm text-gray-400">
                        Analysis from: {new Date(analytics.analysis_date).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Today's Analysis Badge */}
              {analytics.is_today && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-green-400" />
                    <div>
                      <h3 className="font-semibold text-green-400">Today's Latest Analysis</h3>
                      <p className="text-sm text-gray-400">
                        Updated: {new Date(analytics.analysis_date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Overall Sentiment & Crisis Alert */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Target size={20} className="text-purple-400" />
                    Overall Sentiment
                  </h3>
                  <SentimentGauge score={analytics.statistics?.overall_sentiment_score || 50} />
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {analytics.statistics?.sentiment_breakdown?.positive || 0}
                      </div>
                      <div className="text-xs text-gray-400">Positive</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-400">
                        {analytics.statistics?.sentiment_breakdown?.neutral || 0}
                      </div>
                      <div className="text-xs text-gray-400">Neutral</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-400">
                        {analytics.statistics?.sentiment_breakdown?.negative || 0}
                      </div>
                      <div className="text-xs text-gray-400">Negative</div>
                    </div>
                  </div>
                </div>

                {analytics.crisis_alert && (
                  <CrisisAlert alert={analytics.crisis_alert} />
                )}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Mentions Today"
                  value={analytics.statistics?.mentions_today || 0}
                  subtitle="Live tracking"
                  icon={Eye}
                  color="blue"
                />
                <StatCard
                  title="This Week"
                  value={analytics.statistics?.mentions_week || 0}
                  subtitle="Last 7 days"
                  icon={Calendar}
                  color="green"
                />
                <StatCard
                  title="Real News"
                  value={analytics.statistics?.real_count || 0}
                  subtitle={`${analytics.statistics?.reliability_score || 0}% verified`}
                  icon={CheckCircle}
                  color="green"
                />
                <StatCard
                  title="Fake News Detected"
                  value={analytics.statistics?.fake_count || 0}
                  subtitle="Requires attention"
                  icon={Shield}
                  color="red"
                />
              </div>

              {/* Negative Spike Alert */}
              {analytics.negative_spike?.detected && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <Zap size={24} className="text-red-400" />
                    <div>
                      <h3 className="text-lg font-bold text-red-400">Negative News Spike Detected!</h3>
                      <p className="text-sm text-gray-400">
                        Negative mentions increased by {analytics.negative_spike.increase} 
                        (from {analytics.negative_spike.from} to {analytics.negative_spike.to})
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Fake News Details */}
              {analytics.fake_news_details && analytics.fake_news_details.length > 0 && (
                <div className="bg-[#111] border border-red-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <XCircle size={20} className="text-red-400" />
                    Fake News Circulating About Your Company
                  </h3>
                  <div className="space-y-3">
                    {analytics.fake_news_details.map((fake, index) => (
                      <div key={index} className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                        <div className="font-semibold text-white mb-2">{fake.title}</div>
                        <div className="text-sm text-gray-400 mb-2">{fake.reasoning}</div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Source: {fake.source}</span>
                          <span>Date: {fake.date}</span>
                          <span className="text-red-400">Confidence: {(fake.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PieChartComponent 
                  data={analytics.graph_data?.sentiment_distribution || []}
                  title="Overall Sentiment Distribution"
                />
                <PieChartComponent 
                  data={analytics.graph_data?.verdict_distribution || []}
                  title="News Authenticity"
                />
              </div>

              {/* Sentiment Breakdown By Day */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LineChartComponent 
                  data={analytics.sentiment_by_day || []}
                  title="Sentiment Trend (7 Days)"
                />

                <BarChartComponent 
                  data={analytics.graph_data?.negative_by_date || []}
                  title="Negative News Spike Tracker"
                  dataKey="count"
                />
              </div>

              {/* Sentiment by Topic & Source */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-6">Sentiment by Topic</h3>
                  <div className="space-y-4">
                    {Object.entries(analytics.sentiment_by_topic || {}).map(([topic, sentiments], index) => (
                      <div key={index}>
                        <div className="text-sm font-medium text-gray-300 mb-2">{topic}</div>
                        <div className="flex gap-2 text-xs">
                          <div className="flex-1 bg-green-500/20 rounded px-2 py-1">
                            <span className="text-green-400">+{sentiments.positive || 0}</span>
                          </div>
                          <div className="flex-1 bg-gray-500/20 rounded px-2 py-1">
                            <span className="text-gray-400">{sentiments.neutral || 0}</span>
                          </div>
                          <div className="flex-1 bg-red-500/20 rounded px-2 py-1">
                            <span className="text-red-400">-{sentiments.negative || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-6">Sentiment by Source</h3>
                  <div className="space-y-4">
                    {Object.entries(analytics.sentiment_by_source || {}).slice(0, 5).map(([source, sentiments], index) => (
                      <div key={index}>
                        <div className="text-sm font-medium text-gray-300 mb-2">{source}</div>
                        <div className="flex gap-2 text-xs">
                          <div className="flex-1 bg-green-500/20 rounded px-2 py-1">
                            <span className="text-green-400">+{sentiments.positive || 0}</span>
                          </div>
                          <div className="flex-1 bg-gray-500/20 rounded px-2 py-1">
                            <span className="text-gray-400">{sentiments.neutral || 0}</span>
                          </div>
                          <div className="flex-1 bg-red-500/20 rounded px-2 py-1">
                            <span className="text-red-400">-{sentiments.negative || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live News Feed */}
              <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Activity size={20} className="text-purple-400" />
                    Live News Feed
                  </h3>
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">Positive</button>
                    <button className="text-xs px-3 py-1 rounded-full bg-gray-500/20 text-gray-400">Neutral</button>
                    <button className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400">Negative</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                  {analytics.all_verified_news?.map((news, index) => (
                    <NewsFeedItem key={index} news={news} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
