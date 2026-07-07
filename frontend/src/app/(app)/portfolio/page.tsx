'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  CreditCard, Trash2, Zap, ArrowRight, RefreshCw,
  AlertCircle, Wifi, Plus, PlaneTakeoff
} from 'lucide-react';

interface UserCard {
  id: number;
  catalogue_id: number;
  card_nickname: string;
  last_four_digits: string;
  credit_limit: number;
  outstanding_amount: number;
  statement_day: number;
  due_day: number;
  lounge_visits_used: number;
  current_cycle_spend: number;
  total_rewards_earned: number;
  name: string;
  issuer: string;
  network: string;
  card_color_from: string;
  card_color_to: string;
  lounge_access_domestic: number;
  lounge_access_international: number;
}

function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

/* ── Skeleton ── */
function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-5 w-80" />
        </div>
        <SkeletonBlock className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonBlock key={i} className="h-72" />
        ))}
      </div>
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const cardItem = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Portfolio() {
  const [cards, setCards] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const fetchCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/user/cards');
      setCards(res.data);
    } catch {
      setError('Failed to load your cards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCards(); }, []);

  const handleRemove = async (card: UserCard) => {
    const confirmed = window.confirm(
      `Remove "${card.name}" (•••• ${card.last_four_digits}) from your portfolio? This cannot be undone.`
    );
    if (!confirmed) return;

    setRemovingId(card.id);
    try {
      await api.delete(`/user/cards/${card.id}`);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
    } catch {
      alert('Failed to remove card. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  /* ── Loading ── */
  if (loading) return <LoadingSkeleton />;

  /* ── Error ── */
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
          onClick={fetchCards}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  /* ── Empty ── */
  if (cards.length === 0) {
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
          <h2 className="text-2xl font-bold text-white mb-2">No cards yet</h2>
          <p className="text-neutral-400 max-w-md">
            Browse the catalogue to add one! We&apos;ll help you track spending, dues, and rewards across all your cards.
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

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={cardItem} className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Portfolio</h1>
          <p className="text-neutral-400">Manage your active cards and track utilization.</p>
        </div>
        <Link
          href="/catalogue"
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold rounded-xl text-sm hover:bg-neutral-200 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Card
        </Link>
      </motion.div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {cards.map((card) => {
            const utilPercent = card.credit_limit > 0
              ? Math.min(Math.round((card.outstanding_amount / card.credit_limit) * 100), 100)
              : 0;
            const totalLounge = (card.lounge_access_domestic || 0) + (card.lounge_access_international || 0);
            const hasLounge = totalLounge > 0;

            return (
              <motion.div
                key={card.id}
                variants={cardItem}
                layout
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
              >
                <GlassPanel className="p-0 overflow-hidden hover:border-white/20 transition-colors">
                  {/* Card Visual */}
                  <div className={`bg-gradient-to-br ${card.card_color_from} ${card.card_color_to} p-6 relative overflow-hidden`}>
                    {/* Decorative circles */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/[0.06]" />
                    <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-white/[0.04]" />

                    <div className="relative z-10 flex justify-between items-start mb-8">
                      <div>
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{card.issuer}</p>
                        <h3 className="text-white font-bold text-lg mt-1">{card.name}</h3>
                      </div>
                      <span className="text-white/80 text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {card.network}
                      </span>
                    </div>

                    <div className="relative z-10 flex items-end justify-between">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-5 h-5 text-white/40 rotate-90" />
                        <span className="text-white font-mono text-lg tracking-widest">
                          •••• {card.last_four_digits}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-6 space-y-5">
                    {/* Outstanding / Limit */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-400">Outstanding</span>
                        <span className="text-white font-semibold">
                          {formatCurrency(card.outstanding_amount)}{' '}
                          <span className="text-neutral-500 font-normal">/ {formatCurrency(card.credit_limit)}</span>
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${utilPercent}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            utilPercent > 80
                              ? 'bg-gradient-to-r from-red-500 to-rose-400'
                              : utilPercent > 50
                              ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                              : 'bg-gradient-to-r from-purple-500 to-blue-400'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">{utilPercent}% utilised</p>
                    </div>

                    {/* Stats Row */}
                    <div className="flex gap-4">
                      <div className="flex-1 bg-white/[0.04] rounded-xl p-3">
                        <p className="text-xs text-neutral-500 mb-1">Rewards Earned</p>
                        <p className="text-green-400 font-bold flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" /> {card.total_rewards_earned.toLocaleString('en-IN')} pts
                        </p>
                      </div>
                      {hasLounge && (
                        <div className="flex-1 bg-white/[0.04] rounded-xl p-3">
                          <p className="text-xs text-neutral-500 mb-1">Lounge Visits</p>
                          <p className="text-blue-400 font-bold flex items-center gap-1">
                            <PlaneTakeoff className="w-3.5 h-3.5" /> {card.lounge_visits_used} / {totalLounge}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                      <Link
                        href={`/cards/${card.id}`}
                        className="text-sm font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                      >
                        View Details <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleRemove(card)}
                        disabled={removingId === card.id}
                        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        {removingId === card.id ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
