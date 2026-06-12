import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AiAdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/ai/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAnalytics(response.data);
      } catch (err) {
        console.error('Failed to load AI Analytics', err);
        setError('Could not load AI Analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const intentColors = [
    '#D32F2F', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#ec4899'
  ];

  const confidenceColors = { high: '#10b981', medium: '#f59e0b', low: '#D32F2F' };

  const getBadgeColor = (confidence) => {
    if (confidence === 'High') return 'bg-emerald-500/10 text-emerald-400';
    if (confidence === 'Medium') return 'bg-amber-500/10 text-amber-400';
    return 'bg-red-500/10 text-red-400';
  };

  const maxIntentCount = analytics?.most_searched_intents?.reduce((max, i) => Math.max(max, i.count), 1) || 1;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm font-semibold">Loading AI Analytics...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-red-400 text-sm font-semibold">{error}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Analytics</h1>
          <p className="text-slate-500 mt-1">Real-time semantic engine intelligence monitoring</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-2 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Engine Active
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total AI Queries', value: analytics.total_queries?.toLocaleString(), color: 'text-red-500', bg: 'bg-red-500/10', icon: '🔍' },
          { label: 'Recommendation CTR', value: `${analytics.recommendation_ctr}%`, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: '🎯' },
          { label: 'Visual Searches', value: analytics.visual_searches?.toLocaleString(), color: 'text-blue-400', bg: 'bg-blue-500/10', icon: '📷' },
          { label: 'Avg AI Latency', value: `${analytics.avg_latency_ms} ms`, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: '⚡' },
        ].map((card, i) => (
          <div key={i} className="bg-[#111827] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 ${card.bg} rounded-xl flex items-center justify-center text-xl`}>{card.icon}</div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">LIVE</span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{card.value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-widest">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Intent Bar Chart */}
        <div className="lg:col-span-2 bg-[#111827] rounded-2xl p-8 border border-white/5">
          <h3 className="text-lg font-bold text-white mb-6">Top Detected Semantic Intents</h3>
          <div className="space-y-4">
            {analytics.most_searched_intents?.map((item, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-300">{item.intent}</span>
                  <span className="text-sm font-bold text-white">{item.count}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(item.count / maxIntentCount) * 100}%`,
                      backgroundColor: intentColors[i % intentColors.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Donut */}
        <div className="bg-[#111827] rounded-2xl p-8 border border-white/5">
          <h3 className="text-lg font-bold text-white mb-6">AI Confidence Scores</h3>
          <div className="space-y-4 mt-4">
            {[
              { label: 'High Confidence', count: analytics.confidence_metrics?.high, key: 'high' },
              { label: 'Medium Confidence', count: analytics.confidence_metrics?.medium, key: 'medium' },
              { label: 'Low / Fallback', count: analytics.confidence_metrics?.low, key: 'low' },
            ].map((item) => {
              const total = (analytics.confidence_metrics?.high || 0) + (analytics.confidence_metrics?.medium || 0) + (analytics.confidence_metrics?.low || 0);
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-slate-400">{item.label}</span>
                    <span className="text-sm font-bold text-white">{pct}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: confidenceColors[item.key] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Engine Status</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">sentence-transformers</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">FAISS Index</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">CLIP Visual</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Embedding Cache</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Queries Table */}
      <div className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Recent Semantic Queries</h3>
          <span className="text-xs font-bold text-slate-500 bg-white/5 px-3 py-1.5 rounded-lg">
            Live Feed
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Query', 'Detected Intent', 'AI Confidence', 'Top Match'].map((h) => (
                  <th key={h} className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {analytics.recent_queries?.map((q, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-all group">
                  <td className="px-8 py-4">
                    <span className="font-semibold text-white text-sm">{q.query}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-xs font-bold bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg">{q.primary_intent}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-lg ${getBadgeColor(q.confidence)}`}>{q.confidence}</span>
                  </td>
                  <td className="px-8 py-4 text-sm font-semibold text-slate-300">{q.top_match}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AiAdminDashboard;

