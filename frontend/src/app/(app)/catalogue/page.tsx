'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CreditCard,
  Star,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  ArrowRight,
  Gem,
  Wallet,
  RefreshCw,
} from 'lucide-react';

/* ─────────────────────── types ─────────────────────── */

interface CatalogueCard {
  id: number;
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
  lounge_access_domestic: number;
  fee_waiver_condition: string;
  welcome_bonus: string;
}

interface AddForm {
  last_four_digits: string;
  credit_limit: string;
  statement_day: string;
  due_day: string;
}

const CATEGORIES = [
  'All',
  'Premium',
  'Super Premium',
  'Lifestyle',
  'Cashback',
  'Travel',
  'Online Shopping',
  'Entry Level',
  'Metal',
  'Grocery',
] as const;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  All: <Sparkles className="w-3.5 h-3.5" />,
  Premium: <Gem className="w-3.5 h-3.5" />,
  'Super Premium': <Star className="w-3.5 h-3.5" />,
  Travel: <ArrowRight className="w-3.5 h-3.5" />,
  Cashback: <Wallet className="w-3.5 h-3.5" />,
};

/* ─────────────────────── page ─────────────────────── */

export default function CataloguePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [cards, setCards] = useState<CatalogueCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── fetch cards ── */
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      const { data } = await api.get('/catalogue/cards', { params });
      setCards(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load cards. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const timer = setTimeout(fetchCards, 350);
    return () => clearTimeout(timer);
  }, [fetchCards]);

  /* ── render ── */
  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
          Card Catalogue
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Explore and add cards to your wallet
        </p>
      </motion.div>

      {/* search bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <GlassPanel className="flex items-center gap-3 px-4 py-3 rounded-2xl" glowColor="purple">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards by name, issuer, or network…"
            className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-white/40 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </GlassPanel>
      </motion.div>

      {/* category pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-2 mb-8"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border',
              category === cat
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                : 'bg-white/[0.04] border-white/[0.06] text-white/50 hover:bg-white/[0.08] hover:text-white/70'
            )}
          >
            {CATEGORY_ICONS[cat] || <CreditCard className="w-3.5 h-3.5" />}
            {cat}
          </button>
        ))}
      </motion.div>

      {/* error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-white/60 text-sm text-center max-w-md">{error}</p>
          <PremiumButton variant="outline" onClick={fetchCards}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </PremiumButton>
        </motion.div>
      )}

      {/* loading skeleton */}
      {loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[280px] rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
          ))}
        </div>
      )}

      {/* empty state */}
      {!loading && !error && cards.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40 text-sm">No cards found matching your criteria</p>
        </motion.div>
      )}

      {/* card grid */}
      {!loading && !error && cards.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          style={{ perspective: '1000px' }}
        >
          <AnimatePresence mode="popLayout">
            {cards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30, rotateX: -8 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
              >
                <FlipCard card={card} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────── flip card ─────────────────────── */

function FlipCard({ card }: { card: CatalogueCard }) {
  const [flipped, setFlipped] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddForm>({ last_four_digits: '', credit_limit: '', statement_day: '', due_day: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const benefits: string[] = (() => {
    try {
      return JSON.parse(card.benefits_json || '[]');
    } catch {
      return [];
    }
  })();

  const feeLabel = (amt: number) => (amt === 0 ? 'Free' : `₹${amt.toLocaleString('en-IN')}`);

  const handleSubmit = async () => {
    if (!form.last_four_digits || !form.credit_limit || !form.statement_day || !form.due_day) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post('/user/cards', {
        catalogue_id: card.id,
        last_four_digits: form.last_four_digits,
        credit_limit: parseFloat(form.credit_limit),
        statement_day: parseInt(form.statement_day),
        due_day: parseInt(form.due_day),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
        setForm({ last_four_digits: '', credit_limit: '', statement_day: '', due_day: '' });
      }, 2000);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || 'Failed to add card');
    } finally {
      setSubmitting(false);
    }
  };

  const gradientStyle = {
    background: `linear-gradient(135deg, ${card.card_color_from}, ${card.card_color_to})`,
  };

  return (
    <div
      className="h-[320px] cursor-pointer [perspective:1000px]"
      onClick={() => {
        if (!showForm) setFlipped((p) => !p);
      }}
    >
      <div
        className={cn(
          'relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]',
          flipped && '[transform:rotateY(180deg)]'
        )}
      >
        {/* ── FRONT ── */}
        <div
          className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between [backface-visibility:hidden] overflow-hidden shadow-2xl"
          style={gradientStyle}
        >
          {/* subtle overlay */}
          <div className="absolute inset-0 bg-black/20 rounded-2xl pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-white/[0.07] pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-white/[0.05] pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-medium">
              {card.issuer}
            </span>
            <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">{card.name}</h3>
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            {/* network badge */}
            <span className="inline-flex items-center self-start gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] font-semibold uppercase tracking-wider text-white/80 border border-white/10">
              <Shield className="w-3 h-3" />
              {card.network}
            </span>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Annual Fee</p>
                <p className="text-xl font-bold text-white">{feeLabel(card.annual_fee)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Rewards</p>
                <p className="text-sm font-semibold text-white/90">
                  {card.base_reward_rate}x {card.reward_type}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          className="absolute inset-0 rounded-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden shadow-2xl"
          style={gradientStyle}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl" />
          <div className="relative z-10 h-full p-5 flex flex-col overflow-y-auto custom-scrollbar">
            {showForm ? (
              /* ── inline add form ── */
              <div className="flex flex-col gap-3 h-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-white">Add to Wallet</h4>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-white/40 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {success ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center gap-3"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    <p className="text-emerald-300 text-sm font-medium">Card added successfully!</p>
                  </motion.div>
                ) : (
                  <>
                    <FormInput
                      label="Last 4 Digits"
                      value={form.last_four_digits}
                      onChange={(v) => setForm({ ...form, last_four_digits: v })}
                      maxLength={4}
                      placeholder="1234"
                    />
                    <FormInput
                      label="Credit Limit"
                      value={form.credit_limit}
                      onChange={(v) => setForm({ ...form, credit_limit: v })}
                      type="number"
                      placeholder="500000"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <FormInput
                        label="Statement Day"
                        value={form.statement_day}
                        onChange={(v) => setForm({ ...form, statement_day: v })}
                        type="number"
                        placeholder="1-28"
                      />
                      <FormInput
                        label="Due Day"
                        value={form.due_day}
                        onChange={(v) => setForm({ ...form, due_day: v })}
                        type="number"
                        placeholder="1-28"
                      />
                    </div>

                    {submitError && (
                      <p className="text-red-400 text-[11px]">{submitError}</p>
                    )}

                    <PremiumButton
                      variant="primary"
                      isLoading={submitting}
                      onClick={handleSubmit}
                      className="mt-auto w-full"
                    >
                      {submitting ? 'Adding…' : 'Confirm'}
                    </PremiumButton>
                  </>
                )}
              </div>
            ) : (
              /* ── benefits & info ── */
              <>
                <h4 className="text-sm font-semibold text-white mb-3">Benefits & Details</h4>

                {/* benefits list */}
                {benefits.length > 0 && (
                  <ul className="space-y-1.5 mb-3 flex-1 min-h-0">
                    {benefits.slice(0, 4).map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-white/70">
                        <Star className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{b}</span>
                      </li>
                    ))}
                    {benefits.length > 4 && (
                      <li className="text-[10px] text-white/40 pl-5">
                        +{benefits.length - 4} more benefits
                      </li>
                    )}
                  </ul>
                )}

                {/* fee & bonus info */}
                <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                  <InfoBadge label="Annual Fee" value={feeLabel(card.annual_fee)} />
                  <InfoBadge label="Joining Fee" value={feeLabel(card.joining_fee)} />
                  {card.welcome_bonus && (
                    <div className="col-span-2">
                      <InfoBadge label="Welcome Bonus" value={card.welcome_bonus} />
                    </div>
                  )}
                  {card.fee_waiver_condition && (
                    <div className="col-span-2">
                      <InfoBadge label="Fee Waiver" value={card.fee_waiver_condition} />
                    </div>
                  )}
                </div>

                {/* add to wallet button */}
                <div onClick={(e) => e.stopPropagation()}>
                  <PremiumButton
                    variant="primary"
                    onClick={() => setShowForm(true)}
                    className="w-full"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Add to Wallet
                  </PremiumButton>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── small components ─────────────────────── */

function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.06] rounded-lg px-2.5 py-1.5 border border-white/[0.06]">
      <p className="text-white/40 uppercase tracking-wider text-[9px] mb-0.5">{label}</p>
      <p className="text-white/80 text-[11px] font-medium line-clamp-2">{value}</p>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = 'text',
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition"
      />
    </div>
  );
}
