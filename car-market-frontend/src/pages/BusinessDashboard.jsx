import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import usePermissions from '../hooks/usePermissions';
import { businessIntelligenceAPI } from '../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#D32F2F', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#14b8a6'];

const Icons = {
  trendingUp: <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  trendingDown: <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>,
};

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-white/5 rounded-xl ${className}`}></div>
);

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111827] border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-sm font-bold text-slate-300 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-sm font-semibold text-white">
              {entry.name}: {prefix}{Number(entry.value).toLocaleString()}{suffix}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const BusinessDashboard = () => {
  const { t, i18n } = useTranslation();
  const { hasPermission } = usePermissions();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRtl = i18n.language?.startsWith('ar');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await businessIntelligenceAPI.getDashboard();
      setData(res.data);
    } catch (e) {
      console.error('BI Dashboard Error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap gap-6">
          {hasPermission('view_revenue') && <Skeleton className="h-40 flex-1 min-w-[250px]" />}
          {hasPermission('view_orders') && <Skeleton className="h-40 flex-1 min-w-[250px]" />}
          {hasPermission('view_cars') && <Skeleton className="h-40 flex-1 min-w-[250px]" />}
          {(hasPermission('view_ai_analytics') || hasPermission('view_users')) && <Skeleton className="h-40 flex-1 min-w-[250px]" />}
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          {hasPermission('view_revenue') && <Skeleton className="h-96 flex-1" />}
          {hasPermission('view_orders') && <Skeleton className="h-96 flex-1" />}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, revenue, orders, inventory, users, ai_analytics } = data;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      
      {/* 1. KEY PERFORMANCE INDICATORS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Revenue KPI */}
        {hasPermission('view_revenue') && (
        <div className="bg-[#111827] rounded-[24px] p-6 border border-white/5 shadow-xl hover:border-emerald-500/20 transition-all group">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('bi.totalRevenue') || 'Total Revenue'}</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-white tracking-tight">{(kpis.total_revenue / 1000000).toFixed(1)}M</h3>
            <span className="text-sm font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">DH</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400">{t('bi.thisMonth') || 'This Month'}: {(kpis.revenue_this_month / 1000).toFixed(0)}K</span>
            {kpis.revenue_growth !== null && (
              <div className="flex items-center gap-1">
                {kpis.revenue_growth > 0 ? Icons.trendingUp : Icons.trendingDown}
                <span className={`text-xs font-bold ${kpis.revenue_growth > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {Math.abs(kpis.revenue_growth)}%
                </span>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Orders KPI */}
        {hasPermission('view_orders') && (
        <div className="bg-[#111827] rounded-[24px] p-6 border border-white/5 shadow-xl hover:border-blue-500/20 transition-all group">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('bi.totalOrders') || 'Total Orders'}</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-white tracking-tight">{kpis.total_orders.toLocaleString()}</h3>
            <span className="text-sm font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg">{t('bi.deals') || 'Deals'}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400">{t('bi.conversionRate') || 'Conversion Rate'}</span>
            <span className="text-xs font-bold text-blue-400">{kpis.conversion_rate}%</span>
          </div>
        </div>
        )}

        {/* Inventory KPI */}
        {hasPermission('view_cars') && (
        <div className="bg-[#111827] rounded-[24px] p-6 border border-white/5 shadow-xl hover:border-red-500/20 transition-all group">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('bi.activeInventory') || 'Active Inventory'}</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-white tracking-tight">{kpis.total_cars.toLocaleString()}</h3>
            <span className="text-sm font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-lg">{t('bi.cars') || 'Cars'}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400">{t('bi.avgPrice') || 'Avg Price'}: {(kpis.avg_car_price / 1000).toFixed(0)}K DH</span>
            {kpis.cars_growth !== null && (
              <div className="flex items-center gap-1">
                {kpis.cars_growth > 0 ? Icons.trendingUp : Icons.trendingDown}
                <span className={`text-xs font-bold ${kpis.cars_growth > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {Math.abs(kpis.cars_growth)}%
                </span>
              </div>
            )}
          </div>
        </div>
        )}

        {/* AI & Users KPI */}
        {(hasPermission('view_ai_analytics') || hasPermission('view_users')) && (
        <div className="bg-[#111827] rounded-[24px] p-6 border border-white/5 shadow-xl hover:border-purple-500/20 transition-all group">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('bi.aiSearches') || 'AI Searches'}</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-white tracking-tight">{ai_analytics.total_searches?.toLocaleString() || 0}</h3>
            <span className="text-sm font-bold text-purple-500 bg-purple-500/10 px-2 py-1 rounded-lg">{t('bi.queries') || 'Queries'}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-400">{t('bi.buyerRate') || 'Buyer Rate'}</span>
            <span className="text-xs font-bold text-purple-400">{users.buyer_rate}%</span>
          </div>
        </div>
        )}
      </div>

      {/* 2. MAIN CHARTS (REVENUE & ORDERS TRENDS) */}
      {(hasPermission('view_revenue') || hasPermission('view_orders')) && (
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Revenue Growth Trend */}
        {hasPermission('view_revenue') && (
        <div className="bg-[#111827] flex-1 rounded-[24px] p-6 border border-white/5 shadow-xl min-h-[400px]">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">{t('bi.revenueTrend') || 'Revenue Trend (Last 12 Months)'}</h3>
            <p className="text-xs text-slate-400">{t('bi.revenueTrendDesc') || 'Total volume of approved sales over time.'}</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue.monthly_trend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis tickFormatter={(val) => `${(val/1000000).toFixed(1)}M`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <RechartsTooltip content={<CustomTooltip prefix="DH " />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={4} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

        {/* Order Conversion Funnel (Status) */}
        {hasPermission('view_orders') && (
        <div className="bg-[#111827] flex-1 rounded-[24px] p-6 border border-white/5 shadow-xl min-h-[400px] flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">{t('bi.orderStatus') || 'Order Status Distribution'}</h3>
            <p className="text-xs text-slate-400">{t('bi.orderStatusDesc') || 'Breakdown of pending, approved, and rejected deals.'}</p>
          </div>
          <div className="flex-1 flex items-center justify-between">
            <div className="w-1/2 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orders.status_breakdown} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                    {orders.status_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-4 pr-4">
              {orders.status_breakdown.map((status, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                    <span className="text-sm font-semibold text-slate-300">{status.name}</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {status.value} <span className="text-slate-500 font-normal ml-1">({kpis.total_orders > 0 ? Math.round((status.value/kpis.total_orders)*100) : 0}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>
      )}

      {/* 3. BUSINESS METRICS (BRANDS & PRICING) */}
      {(hasPermission('view_revenue') || hasPermission('view_cars')) && (
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Brand Performance (Revenue) */}
        {hasPermission('view_revenue') && (
        <div className="bg-[#111827] flex-[2] rounded-[24px] p-6 border border-white/5 shadow-xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">{t('bi.topBrands') || 'Top Brands by Revenue'}</h3>
            <p className="text-xs text-slate-400">{t('bi.topBrandsDesc') || 'Which brands generate the most monetary value.'}</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue.by_brand} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#ffffff05" />
                <XAxis type="number" tickFormatter={(val) => `${(val/1000).toFixed(0)}K`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="brand" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#cbd5e1', fontWeight: 600 }} width={80} />
                <RechartsTooltip content={<CustomTooltip prefix="DH " />} cursor={{fill: '#ffffff05'}} />
                <Bar dataKey="revenue" name="Revenue" fill="#D32F2F" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

        {/* Price Distribution */}
        {hasPermission('view_cars') && (
        <div className="bg-[#111827] flex-1 rounded-[24px] p-6 border border-white/5 shadow-xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">{t('bi.inventoryPricing') || 'Inventory Pricing'}</h3>
            <p className="text-xs text-slate-400">{t('bi.inventoryPricingDesc') || 'Distribution of cars across price brackets.'}</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventory.price_distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#ffffff05'}} />
                <Bar dataKey="count" name="Cars" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}
      </div>
      )}

      {/* 4. HIGH-VALUE LISTS & AI ANALYTICS */}
      {(hasPermission('view_orders') || hasPermission('view_ai_analytics')) && (
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Most Ordered Cars (Chart) */}
        {hasPermission('view_orders') && (
        <div className="bg-[#111827] flex-1 rounded-[24px] border border-white/5 shadow-xl overflow-hidden min-h-[400px]">
          <div className="p-6 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-lg font-bold text-white">{t('bi.mostPopular') || 'Most Popular Vehicles'}</h3>
            <p className="text-xs text-slate-400 mt-1">{t('bi.mostPopularDesc') || 'Vehicles with the highest number of orders placed.'}</p>
          </div>
          <div className="p-6 h-[350px]">
            {orders.top_cars.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500">{t('bi.noOrderData') || 'No order data available yet.'}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orders.top_cars.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#ffffff05" />
                  <XAxis type="number" dataKey="order_count" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis dataKey="title" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#cbd5e1', fontWeight: 500 }} width={140} tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + '...' : val} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#ffffff05'}} />
                  <Bar dataKey="order_count" name="Orders" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20}>
                    {orders.top_cars.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        )}

        {/* Top AI Searches (Chart) */}
        {hasPermission('view_ai_analytics') && (
        <div className="bg-[#111827] flex-1 rounded-[24px] border border-white/5 shadow-xl overflow-hidden min-h-[400px]">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">{t('bi.topAiQueries') || 'Top AI Search Queries'}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('bi.topAiQueriesDesc') || 'What users are asking the AI engine.'}</p>
            </div>
            <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-xs font-bold rounded-lg uppercase">{t('bi.aiEngine') || 'AI Engine'}</span>
          </div>
          <div className="p-6 h-[350px]">
            {!ai_analytics.top_queries || ai_analytics.top_queries.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500">{t('bi.noAiData') || 'No AI search data available yet.'}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ai_analytics.top_queries.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#ffffff05" />
                  <XAxis type="number" dataKey="count" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis dataKey="query" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#cbd5e1', fontWeight: 500 }} width={140} tickFormatter={(val) => val.length > 20 ? val.substring(0, 20) + '...' : val} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#ffffff05'}} />
                  <Bar dataKey="count" name="Searches" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                    {ai_analytics.top_queries.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        )}

      </div>
      )}

    </motion.div>
  );
};

export default BusinessDashboard;

