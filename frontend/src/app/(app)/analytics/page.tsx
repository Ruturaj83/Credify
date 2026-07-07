'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { GlassPanel } from '@/components/ui/GlassPanel';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

interface MonthlyData {
  month: string;
  spend: number;
  rewards: number;
}

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface TrendsResponse {
  monthly_data: MonthlyData[];
}

interface CategoriesResponse {
  categories: CategoryData[];
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`skeleton-pulse ${className ?? ''}`}
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
        borderRadius: '8px',
      }}
    />
  );
}

export default function AnalyticsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [trendsRes, categoriesRes] = await Promise.all([
          api.get<TrendsResponse>('/analytics/trends'),
          api.get<CategoriesResponse>('/analytics/categories'),
        ]);
        setMonthlyData(trendsRes.data.monthly_data ?? []);
        setCategories(categoriesRes.data.categories ?? []);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const topCategory = categories.length
    ? categories.reduce((max, cat) => (cat.percentage > max.percentage ? cat : max), categories[0])
    : null;

  const isEmpty = !loading && monthlyData.length === 0 && categories.length === 0;

  if (isEmpty) {
    return (
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '3rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1.5rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(147, 51, 234, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart3 size={36} color="#9333ea" />
          </div>
          <p
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '1.1rem',
              textAlign: 'center',
              maxWidth: '320px',
              lineHeight: 1.6,
            }}
          >
            Start adding transactions to see your analytics
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '2rem 1.5rem',
        }}
      >
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: '2rem' }}
        >
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '0.5rem',
            }}
          >
            Analytics
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>
            Track your spending patterns and reward trends
          </p>
        </motion.div>

        {/* Dynamic Insight Banner */}
        {!loading && topCategory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            style={{ marginBottom: '2rem' }}
          >
            <GlassPanel>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.25rem 0',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(147, 51, 234, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={20} color="#a855f7" />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
                  Your top spending category is{' '}
                  <span style={{ color: '#a855f7', fontWeight: 600 }}>
                    {topCategory.name}
                  </span>{' '}
                  at{' '}
                  <span style={{ color: '#a855f7', fontWeight: 600 }}>
                    {topCategory.percentage}%
                  </span>
                </p>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* Main Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2rem',
          }}
          className="analytics-grid"
        >
          {/* Spending Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <GlassPanel>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(147, 51, 234, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp size={18} color="#9333ea" />
                </div>
                <h2
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#ffffff',
                  }}
                >
                  Spending Trends
                </h2>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <SkeletonPulse className="" />
                  <div style={{ height: '280px' }}>
                    <SkeletonPulse
                      className=""
                    />
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={monthlyData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorRewards" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#ffffff10"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        stroke="#ffffff50"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#ffffff60', fontSize: 12 }}
                      />
                      <YAxis
                        stroke="#ffffff50"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#ffffff60', fontSize: 12 }}
                        tickFormatter={(val: number) => `₹${val}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#000000dd',
                          border: '1px solid #ffffff20',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        labelStyle={{ color: '#ffffff90' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="spend"
                        stroke="#9333ea"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSpend)"
                        name="Spend"
                      />
                      <Area
                        type="monotone"
                        dataKey="rewards"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRewards)"
                        name="Rewards"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </GlassPanel>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <GlassPanel>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PieChart size={18} color="#3b82f6" />
                </div>
                <h2
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#ffffff',
                  }}
                >
                  Category Breakdown
                </h2>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <SkeletonPulse
                        className=""
                      />
                      <div style={{ height: '8px', width: `${80 - i * 12}%` }}>
                        <SkeletonPulse className="" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                  }}
                >
                  {categories.map((cat, index) => (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.05 * index }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <span
                          style={{
                            color: 'rgba(255,255,255,0.85)',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                          }}
                        >
                          {cat.name}
                        </span>
                        <span
                          style={{
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '0.85rem',
                          }}
                        >
                          ₹{cat.amount.toLocaleString('en-IN')}{' '}
                          <span style={{ color: cat.color, fontWeight: 600 }}>
                            {cat.percentage}%
                          </span>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.06)',
                          overflow: 'hidden',
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percentage}%` }}
                          transition={{ duration: 0.8, delay: 0.1 * index, ease: 'easeOut' }}
                          style={{
                            height: '100%',
                            borderRadius: '4px',
                            background: `linear-gradient(90deg, ${cat.color}, ${cat.color}99)`,
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassPanel>
          </motion.div>
        </div>
      </div>

      {/* Responsive grid style */}
      <style>{`
        @media (min-width: 1024px) {
          .analytics-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        .skeleton-pulse {
          min-height: 20px;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </>
  );
}
