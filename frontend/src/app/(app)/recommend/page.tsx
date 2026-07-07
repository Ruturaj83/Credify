'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { motion } from 'framer-motion';
import { Compass, Sparkles, CreditCard, AlertTriangle } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Alternative {
  name: string;
  issuer: string;
  reward: number;
  reason: string;
  card_color_from: string;
  card_color_to: string;
}

interface Recommendation {
  bestCard: string;
  bestCardIssuer: string;
  reward: number;
  reason: string;
  rate: string;
  card_color_from: string;
  card_color_to: string;
  alternatives: Alternative[];
  capImpact?: string;
}

const CATEGORIES = [
  'Travel',
  'Dining',
  'Grocery',
  'Shopping',
  'Online',
  'Fuel',
  'Entertainment',
  'Other',
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function RecommendPage() {
  /* form state */
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  /* async state */
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Recommendation | null>(null);
  const [error, setError] = useState('');

  /* ---- submit handler ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const { data } = await api.post('/analytics/recommend', {
        merchant,
        category,
        amount: parseFloat(amount),
      });
      setResult(data);
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---- helpers ---- */
  const isNoCards =
    error &&
    (error.toLowerCase().includes('no card') ||
      error.toLowerCase().includes('no cards') ||
      error.toLowerCase().includes('add card') ||
      error.toLowerCase().includes('portfolio'));

  const inputClasses =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none backdrop-blur transition-colors focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30';

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* ---- Header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-300">
          <Sparkles className="h-3.5 w-3.5" />
          Smart Recommendation Engine
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Card Recommender
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Find the best card for every transaction — maximise your rewards
          automatically.
        </p>
      </motion.div>

      {/* ---- Grid ---- */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* ========== LEFT — FORM ========== */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlassPanel>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Merchant */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Merchant
                </label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. Uber, Zomato, Amazon"
                  className={inputClasses}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClasses + ' appearance-none'}
                  required
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-gray-900">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Transaction Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={inputClasses}
                  required
                />
              </div>

              {/* Submit */}
              <PremiumButton
                type="submit"
                variant="secondary"
                isLoading={loading}
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Get Recommendation
              </PremiumButton>
            </form>
          </GlassPanel>
        </motion.div>

        {/* ========== RIGHT — RESULTS ========== */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col gap-6"
        >
          {/* —— Error state —— */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <GlassPanel>
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  {isNoCards ? (
                    <>
                      <CreditCard className="h-10 w-10 text-purple-400" />
                      <p className="text-sm font-medium text-white/80">
                        Add cards to your portfolio first
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-10 w-10 text-red-400" />
                      <p className="text-sm font-medium text-red-300">
                        {error}
                      </p>
                    </>
                  )}
                </div>
              </GlassPanel>
            </motion.div>
          )}

          {/* —— Empty / initial state —— */}
          {!result && !error && (
            <GlassPanel>
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                >
                  <Compass className="h-12 w-12 text-purple-400/60" />
                </motion.div>
                <h3 className="text-lg font-semibold text-white/70">
                  Awaiting Input
                </h3>
                <p className="max-w-xs text-sm text-white/40">
                  Enter a merchant, category, and amount to see which card
                  yields the highest reward.
                </p>
              </div>
            </GlassPanel>
          )}

          {/* —— Best Card —— */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <GlassPanel
                glowColor="purple"
                className="border border-green-500/30"
              >
                <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-green-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Best Card
                </div>

                <div className="flex items-start gap-4">
                  {/* Card visual chip */}
                  <div
                    className="h-10 w-16 flex-shrink-0 rounded-lg shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${result.card_color_from}, ${result.card_color_to})`,
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-white">
                      {result.bestCard}
                    </h3>
                    <p className="text-xs text-white/40">
                      {result.bestCardIssuer}
                    </p>

                    <div className="mt-3 flex flex-wrap items-baseline gap-3">
                      <span className="text-2xl font-extrabold text-green-400">
                        ₹{result.reward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      {result.rate && (
                        <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-300">
                          {result.rate}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-white/60">
                      {result.reason}
                    </p>

                    {/* Cap impact warning */}
                    {result.capImpact && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
                        <p className="text-xs leading-relaxed text-yellow-300/90">
                          {result.capImpact}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          )}

          {/* —— Alternatives —— */}
          {result && result.alternatives && result.alternatives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <GlassPanel>
                <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/40">
                  <CreditCard className="h-3.5 w-3.5" />
                  Alternatives
                </div>

                <ul className="space-y-4">
                  {result.alternatives.map((alt, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx }}
                      className="flex items-start gap-3"
                    >
                      {/* small gradient chip */}
                      <div
                        className="mt-0.5 h-7 w-11 flex-shrink-0 rounded-md"
                        style={{
                          background: `linear-gradient(135deg, ${alt.card_color_from}, ${alt.card_color_to})`,
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate text-sm font-semibold text-white">
                            {alt.name}
                          </span>
                          <span className="flex-shrink-0 text-xs text-white/30">
                            {alt.issuer}
                          </span>
                        </div>

                        <div className="mt-0.5 flex items-baseline gap-2">
                          <span className="text-sm font-bold text-green-400/80">
                            ₹{alt.reward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <p className="mt-0.5 text-xs leading-relaxed text-white/40">
                          {alt.reason}
                        </p>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </GlassPanel>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
