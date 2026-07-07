'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  TrendingUp, Sparkles, CreditCard, Star, Clock,
  ArrowRight, Plus, Compass, RefreshCw, Wallet,
  AlertCircle, ChevronRight
} from 'lucide-react';

interface Transaction {
  id: number;
  merchant: string;
  amount: number;
  reward_earned: number;
  tx_date: number;
  category: string;
  card_name: string;
}

interface Due {
  id: number;
  outstanding_amount: number;
  due_day: number;
  last_four_digits: string;
  name: string;
}

interface DashboardData {
  total_spend: number;
  total_rewards: number;
  card_count: number;
  most_used_card: string;
  recent_transactions: Transaction[];
  upcoming_dues: Due[];
}

function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Skeleton loader ── */
function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-5 w-96" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonBlock key={i} className="h-36" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <SkeletonBlock className="h-6 w-48" />
          {[...Array(4)].map((_, i) => (
            <SkeletonBlock key={i} className="h-16" />
          ))}
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="h-6 w-32" />
          <SkeletonBlock className="h-40" />
        </div>
      </div>
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res.data);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* ── Loading state ── */
  if (loading) return <LoadingSkeleton />;

  /* ── Error state ── */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  /* ── Empty state ── */
  if (!data || (data.card_count === 0 && data.recent_transactions.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center"
        >
          <CreditCard className="w-10 h-10 text-purple-400" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome! 🎉</h2>
          <p className="text-neutral-400 max-w-md">
            Add your first card to get started. We&apos;ll track your spending, rewards, and help you get the most out of every swipe.
          </p>
        </div>
        <Link
          href="/catalogue"
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Browse Catalogue
        </Link>
      </div>
    );
  }

  /* ── Stats cards data ── */
  const stats = [
    { label: 'Total Spend', value: formatCurrency(data.total_spend), icon: TrendingUp, color: 'text-emerald-400', glow: 'blue' as const },
    { label: 'Total Rewards', value: `${data.total_rewards.toLocaleString('en-IN')} pts`, icon: Sparkles, color: 'text-purple-400', glow: 'purple' as const },
    { label: 'Active Cards', value: data.card_count.toString(), icon: Wallet, color: 'text-blue-400', glow: 'none' as const },
    { label: 'Most Used Card', value: data.most_used_card || '—', icon: Star, color: 'text-amber-400', glow: 'none' as const },
  ];

  const quickActions = [
    { label: 'Add Transaction', href: '/transactions', icon: Plus, gradient: 'from-emerald-600 to-teal-600' },
    { label: 'Browse Catalogue', href: '/catalogue', icon: CreditCard, gradient: 'from-purple-600 to-blue-600' },
    { label: 'Get Recommendation', href: '/recommend', icon: Compass, gradient: 'from-amber-600 to-orange-600' },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-neutral-400">Your financial snapshot at a glance.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div key={idx} variants={item}>
            <GlassPanel className="p-6 hover:border-white/20 transition-colors" glowColor={stat.glow}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-neutral-400 text-sm mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white truncate">{stat.value}</h3>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      {/* Upcoming Dues */}
      {data.upcoming_dues && data.upcoming_dues.length > 0 && (
        <motion.div variants={item} className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-pink-400" /> Upcoming Dues
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.upcoming_dues.map((due) => (
              <GlassPanel key={due.id} className="p-5 border-l-4 border-l-pink-500/60" glowColor="pink">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white font-semibold">{due.name}</p>
                    <p className="text-neutral-500 text-xs">•••• {due.last_four_digits}</p>
                  </div>
                  <span className="text-xs text-pink-400 font-medium bg-pink-500/10 px-2 py-1 rounded-full">
                    Due day {due.due_day}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white mt-3">{formatCurrency(due.outstanding_amount)}</p>
              </GlassPanel>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <motion.div variants={item} className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
            <Link href="/transactions" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {data.recent_transactions.length === 0 ? (
            <GlassPanel className="p-8 text-center">
              <p className="text-neutral-400">No recent transactions yet.</p>
            </GlassPanel>
          ) : (
            <GlassPanel className="overflow-hidden">
              <div className="divide-y divide-white/[0.06]">
                {data.recent_transactions.map((tx) => (
                  <motion.div
                    key={tx.id}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                    className="p-4 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 text-neutral-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{tx.merchant}</p>
                        <p className="text-xs text-neutral-500 truncate">
                          {tx.card_name} · {formatDate(tx.tx_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-white font-semibold">{formatCurrency(tx.amount)}</p>
                      {tx.reward_earned > 0 && (
                        <p className="text-xs text-emerald-400 flex items-center justify-end gap-1">
                          <Sparkles className="w-3 h-3" /> +{tx.reward_earned} pts
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassPanel>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className="space-y-4">
          <h2 className="text-xl font-bold text-white">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <GlassPanel className="p-4 hover:border-white/20 transition-all group cursor-pointer mb-3">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-medium text-sm flex-1">{action.label}</span>
                    <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </GlassPanel>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
