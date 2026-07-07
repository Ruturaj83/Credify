'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  Trash2,
  Shield,
  Plane,
  Gift,
  IndianRupee,
  Calendar,
  TrendingUp,
  Award,
  Fuel,
  Globe,
  Receipt,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface CatalogueCard {
  name: string;
  issuer: string;
  network: string;
  card_type: string;
  annual_fee: number;
  joining_fee: number;
  reward_type: string;
  base_reward_rate: number;
  card_color_from: string;
  card_color_to: string;
  benefits_json: string;
  reward_rules_json: string;
  lounge_access_domestic: number;
  lounge_access_international: number;
  fee_waiver_condition: string;
  welcome_bonus: string;
  milestone_rewards: string;
  forex_markup: number;
  fuel_surcharge_waiver: string;
}

interface CardDetail {
  id: number;
  catalogue_card: CatalogueCard;
  last_four_digits: string;
  credit_limit: number;
  outstanding: number;
  current_cycle_spend: number;
  statement_day: number;
  due_day: number;
  domestic_lounge_visits_used: number;
  international_lounge_visits_used: number;
}

interface Transaction {
  id: number;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  reward_earned: number;
}

interface RewardRule {
  category: string;
  rate: number;
  cap: number;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/5 ${className ?? ''}`}
    />
  );
}

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [card, setCard] = useState<CardDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [cardRes, txRes] = await Promise.all([
          api.get(`/api/user/cards/${id}`),
          api.get(`/api/transactions?card_id=${id}&limit=5`),
        ]);
        setCard(cardRes.data);
        setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
      } catch (err) {
        console.error('Failed to fetch card details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleRemoveCard = async () => {
    if (!window.confirm('Are you sure you want to remove this card?')) return;
    setRemoving(true);
    try {
      await api.delete(`/api/user/cards/${id}`);
      router.push('/portfolio');
    } catch (err) {
      console.error('Failed to remove card:', err);
      setRemoving(false);
    }
  };

  const parseJSON = <T,>(jsonStr: string | undefined | null, fallback: T): T => {
    if (!jsonStr) return fallback;
    try {
      return JSON.parse(jsonStr);
    } catch {
      return fallback;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN').format(amount);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getUtilizationColor = (pct: number) => {
    if (pct < 30) return '#22c55e';
    if (pct < 70) return '#eab308';
    return '#ef4444';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
  };

  /* ─── Loading Skeleton ─── */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <SkeletonBlock className="h-10 w-32" />
        <SkeletonBlock className="aspect-[1.6/1] w-full max-w-md mx-auto" />
        <SkeletonBlock className="h-48 w-full" />
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-56 w-full" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-white/70 text-lg">Card not found.</p>
        <PremiumButton onClick={() => router.push('/portfolio')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portfolio
        </PremiumButton>
      </div>
    );
  }

  const cc = card.catalogue_card;
  const utilization = card.credit_limit > 0 ? (card.outstanding / card.credit_limit) * 100 : 0;
  const rewardRules: RewardRule[] = parseJSON(cc.reward_rules_json, []);
  const benefits: string[] = parseJSON(cc.benefits_json, []);

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── Back Button ─── */}
      <motion.button
        variants={itemVariants}
        onClick={() => router.push('/portfolio')}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Portfolio</span>
      </motion.button>

      {/* ─── Card Visual ─── */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <div
          className="aspect-[1.6/1] w-full max-w-md mx-auto rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${cc.card_color_from || '#6366f1'}, ${cc.card_color_to || '#8b5cf6'})`,
          }}
        >
          {/* Shine overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background:
                'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 45%, transparent 50%)',
            }}
          />

          <div className="flex items-start justify-between relative z-10">
            <span className="text-white/90 font-semibold text-sm tracking-wide uppercase">
              {cc.issuer}
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-bold tracking-wider">
              {cc.network}
            </span>
          </div>

          <div className="relative z-10 space-y-3">
            <p className="text-white/90 text-lg tracking-[0.25em] font-mono text-center">
              •••• •••• •••• {card.last_four_digits}
            </p>
            <p className="text-white font-semibold text-base">{cc.name}</p>
          </div>
        </div>
      </motion.div>

      {/* ─── Financial Overview ─── */}
      <motion.div variants={itemVariants}>
        <GlassPanel className="p-6 space-y-5">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            Financial Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Outstanding', value: card.outstanding, icon: AlertCircle, color: 'text-red-400' },
              { label: 'Credit Limit', value: card.credit_limit, icon: Shield, color: 'text-blue-400' },
              { label: 'Current Cycle Spend', value: card.current_cycle_spend, icon: TrendingUp, color: 'text-purple-400' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 rounded-xl p-4 border border-white/5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-white/50 text-xs uppercase tracking-wide">
                    {stat.label}
                  </span>
                </div>
                <p className="text-white text-xl font-bold">
                  ₹{formatCurrency(stat.value)}
                </p>
              </div>
            ))}
          </div>

          {/* Utilization Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-sm">Credit Utilization</span>
              <span
                className="text-sm font-semibold"
                style={{ color: getUtilizationColor(utilization) }}
              >
                {utilization.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(utilization, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ backgroundColor: getUtilizationColor(utilization) }}
              />
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      {/* ─── Statement Info ─── */}
      <motion.div variants={itemVariants}>
        <GlassPanel className="p-6">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-sky-400" />
            Billing Cycle
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <span className="text-white/50 text-xs uppercase tracking-wide">
                Statement Day
              </span>
              <p className="text-white text-2xl font-bold mt-1">{card.statement_day}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <span className="text-white/50 text-xs uppercase tracking-wide">
                Due Day
              </span>
              <p className="text-white text-2xl font-bold mt-1">{card.due_day}</p>
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      {/* ─── Reward Structure ─── */}
      {rewardRules.length > 0 && (
        <motion.div variants={itemVariants}>
          <GlassPanel className="p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Reward Structure
              <span className="ml-auto text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                {cc.reward_type}
              </span>
            </h2>
            <div className="space-y-2">
              {rewardRules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-white/80 text-sm font-medium">
                      {rule.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-emerald-400 text-sm font-bold">
                      {rule.rate}%
                    </span>
                    {rule.cap > 0 && (
                      <span className="text-white/40 text-xs">
                        Cap ₹{formatCurrency(rule.cap)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-white/40 text-xs mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Base reward rate: {cc.base_reward_rate}%
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {/* ─── Benefits ─── */}
      {benefits.length > 0 && (
        <motion.div variants={itemVariants}>
          <GlassPanel className="p-6 space-y-4">
            <h2 className="text-white font-semibold text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-400" />
              Benefits
            </h2>
            <ul className="space-y-2">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                  <span className="text-white/70 text-sm leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </GlassPanel>
        </motion.div>
      )}

      {/* ─── Lounge Access ─── */}
      <motion.div variants={itemVariants}>
        <GlassPanel className="p-6 space-y-5">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <Plane className="w-5 h-5 text-cyan-400" />
            Lounge Access
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Domestic */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-white/60 text-sm">Domestic</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-white text-2xl font-bold">
                  {card.domestic_lounge_visits_used}
                </span>
                <span className="text-white/40 text-sm">
                  / {cc.lounge_access_domestic}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{
                    width: cc.lounge_access_domestic > 0
                      ? `${Math.min((card.domestic_lounge_visits_used / cc.lounge_access_domestic) * 100, 100)}%`
                      : '0%',
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* International */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span className="text-white/60 text-sm">International</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-white text-2xl font-bold">
                  {card.international_lounge_visits_used}
                </span>
                <span className="text-white/40 text-sm">
                  / {cc.lounge_access_international}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-sky-500"
                  initial={{ width: 0 }}
                  animate={{
                    width: cc.lounge_access_international > 0
                      ? `${Math.min((card.international_lounge_visits_used / cc.lounge_access_international) * 100, 100)}%`
                      : '0%',
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      {/* ─── Fee Information ─── */}
      <motion.div variants={itemVariants}>
        <GlassPanel className="p-6 space-y-4">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-orange-400" />
            Fee Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <span className="text-white/50 text-xs uppercase tracking-wide">
                Annual Fee
              </span>
              <p className="text-white text-xl font-bold mt-1">
                ₹{formatCurrency(cc.annual_fee)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <span className="text-white/50 text-xs uppercase tracking-wide">
                Joining Fee
              </span>
              <p className="text-white text-xl font-bold mt-1">
                ₹{formatCurrency(cc.joining_fee)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 sm:col-span-1">
              <span className="text-white/50 text-xs uppercase tracking-wide">
                Fee Waiver
              </span>
              <p className="text-white/80 text-sm mt-1 leading-relaxed">
                {cc.fee_waiver_condition || 'N/A'}
              </p>
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      {/* ─── Additional Details ─── */}
      <motion.div variants={itemVariants}>
        <GlassPanel className="p-6 space-y-4">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-violet-400" />
            Additional Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/5">
              <Globe className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-white/50 text-xs uppercase tracking-wide">
                  Forex Markup
                </span>
                <p className="text-white font-semibold mt-0.5">{cc.forex_markup}%</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/5">
              <Fuel className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-white/50 text-xs uppercase tracking-wide">
                  Fuel Surcharge Waiver
                </span>
                <p className="text-white/80 text-sm mt-0.5 leading-relaxed">
                  {cc.fuel_surcharge_waiver || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/5">
              <Sparkles className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-white/50 text-xs uppercase tracking-wide">
                  Welcome Bonus
                </span>
                <p className="text-white/80 text-sm mt-0.5 leading-relaxed">
                  {cc.welcome_bonus || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-white/50 text-xs uppercase tracking-wide">
                  Milestone Rewards
                </span>
                <p className="text-white/80 text-sm mt-0.5 leading-relaxed">
                  {cc.milestone_rewards || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      {/* ─── Recent Transactions ─── */}
      <motion.div variants={itemVariants}>
        <GlassPanel className="p-6 space-y-4">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-400" />
            Recent Transactions
          </h2>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Receipt className="w-10 h-10 text-white/20" />
              <p className="text-white/40 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {tx.merchant}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/30 text-xs">
                        {formatDate(tx.date)}
                      </span>
                      <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-medium">
                        {tx.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-white font-semibold text-sm">
                      ₹{formatCurrency(tx.amount)}
                    </p>
                    {tx.reward_earned > 0 && (
                      <span className="text-emerald-400 text-xs flex items-center justify-end gap-1">
                        <Sparkles className="w-3 h-3" />
                        +{tx.reward_earned}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      </motion.div>

      {/* ─── Remove Card ─── */}
      <motion.div variants={itemVariants} className="flex justify-center pb-8">
        <button
          onClick={handleRemoveCard}
          disabled={removing}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">
            {removing ? 'Removing…' : 'Remove Card'}
          </span>
        </button>
      </motion.div>
    </motion.div>
  );
}
