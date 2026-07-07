'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { api } from '@/lib/api';
import {
  Plus, X, Trash2, ChevronDown, RefreshCw,
  AlertCircle, CreditCard, Sparkles, Tag, Send,
  ArrowRightLeft, Loader2
} from 'lucide-react';

interface Transaction {
  id: number;
  merchant: string;
  category: string;
  amount: number;
  reward_earned: number;
  reward_rate_applied: number;
  tx_date: number;
  notes: string;
  card_name: string;
  card_color_from: string;
  card_color_to: string;
}

interface UserCard {
  id: number;
  name: string;
  last_four_digits: string;
}

const CATEGORIES = ['Travel', 'Dining', 'Grocery', 'Shopping', 'Online', 'Fuel', 'Entertainment', 'Other'];
const PAGE_SIZE = 20;

function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-5 w-72" />
        </div>
        <SkeletonBlock className="h-10 w-36" />
      </div>
      {[...Array(6)].map((_, i) => (
        <SkeletonBlock key={i} className="h-20" />
      ))}
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cards, setCards] = useState<UserCard[]>([]);
  const [filterCardId, setFilterCardId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  /* Form state */
  const [formCardId, setFormCardId] = useState('');
  const [formMerchant, setFormMerchant] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');

  /* Toast */
  const [toast, setToast] = useState<{ message: string; reward: number } | null>(null);

  const fetchCards = async () => {
    try {
      const res = await api.get('/user/cards');
      setCards(res.data);
    } catch { /* silent */ }
  };

  const fetchTransactions = useCallback(async (newOffset = 0, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: PAGE_SIZE.toString(), offset: newOffset.toString() };
      if (filterCardId) params.card_id = filterCardId;
      const res = await api.get('/transactions', { params });
      if (append) {
        setTransactions((prev) => [...prev, ...res.data.transactions]);
      } else {
        setTransactions(res.data.transactions);
      }
      setTotal(res.data.total);
      setOffset(newOffset);
    } catch {
      setError('Failed to load transactions.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterCardId]);

  useEffect(() => { fetchCards(); }, []);
  useEffect(() => { fetchTransactions(0); }, [fetchTransactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCardId || !formMerchant || !formCategory || !formAmount) return;
    setSubmitting(true);
    try {
      const res = await api.post('/transactions', {
        user_card_id: Number(formCardId),
        merchant: formMerchant,
        category: formCategory,
        amount: Number(formAmount),
        notes: formNotes || undefined,
      });
      setToast({ message: `Transaction recorded for ${formMerchant}`, reward: res.data.reward_earned ?? 0 });
      setTimeout(() => setToast(null), 5000);
      setShowForm(false);
      resetForm();
      fetchTransactions(0);
    } catch {
      alert('Failed to submit transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormCardId('');
    setFormMerchant('');
    setFormCategory('');
    setFormAmount('');
    setFormNotes('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setTotal((prev) => prev - 1);
    } catch {
      alert('Failed to delete transaction.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoadMore = () => {
    const newOffset = offset + PAGE_SIZE;
    fetchTransactions(newOffset, true);
  };

  /* ── Loading ── */
  if (loading) return <LoadingSkeleton />;

  /* ── Error ── */
  if (error && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
        </div>
        <button onClick={() => fetchTransactions(0)}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const selectClasses =
    'w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/40 transition-all appearance-none';
  const inputClasses =
    'w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/40 transition-all';

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50"
          >
            <GlassPanel className="p-4 border-emerald-500/30 bg-emerald-900/30 backdrop-blur-2xl max-w-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{toast.message}</p>
                  <p className="text-emerald-400 text-xs font-semibold">+{toast.reward} reward points earned!</p>
                </div>
                <button onClick={() => setToast(null)} className="text-neutral-400 hover:text-white ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-neutral-400">Record and review your credit card spend.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            showForm
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-white text-black hover:bg-neutral-200'
          }`}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Transaction'}
        </button>
      </motion.div>

      {/* Add Transaction Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <GlassPanel className="p-6" glowColor="purple">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-400" /> New Transaction
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card */}
                  <div>
                    <label className="text-xs text-neutral-400 mb-1.5 block">Card *</label>
                    <select value={formCardId} onChange={(e) => setFormCardId(e.target.value)} required className={selectClasses}>
                      <option value="" className="bg-neutral-900">Select a card</option>
                      {cards.map((c) => (
                        <option key={c.id} value={c.id} className="bg-neutral-900">
                          {c.name} (•••• {c.last_four_digits})
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Merchant */}
                  <div>
                    <label className="text-xs text-neutral-400 mb-1.5 block">Merchant *</label>
                    <input
                      type="text"
                      value={formMerchant}
                      onChange={(e) => setFormMerchant(e.target.value)}
                      placeholder="e.g. Swiggy, Amazon"
                      required
                      className={inputClasses}
                    />
                  </div>
                  {/* Category */}
                  <div>
                    <label className="text-xs text-neutral-400 mb-1.5 block">Category *</label>
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required className={selectClasses}>
                      <option value="" className="bg-neutral-900">Select category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-neutral-900">{cat}</option>
                      ))}
                    </select>
                  </div>
                  {/* Amount */}
                  <div>
                    <label className="text-xs text-neutral-400 mb-1.5 block">Amount (₹) *</label>
                    <input
                      type="number"
                      min={1}
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="500"
                      required
                      className={inputClasses}
                    />
                  </div>
                </div>
                {/* Notes */}
                <div>
                  <label className="text-xs text-neutral-400 mb-1.5 block">Notes (optional)</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Any additional details…"
                    rows={2}
                    className={inputClasses + ' resize-none'}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitting ? 'Submitting…' : 'Record Transaction'}
                  </button>
                </div>
              </form>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative">
          <select
            value={filterCardId}
            onChange={(e) => setFilterCardId(e.target.value)}
            className="bg-white/[0.06] border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none transition-all"
          >
            <option value="" className="bg-neutral-900">All Cards</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id} className="bg-neutral-900">
                {c.name} (•••• {c.last_four_digits})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <span className="text-neutral-500 text-sm">{total} transaction{total !== 1 ? 's' : ''}</span>
      </motion.div>

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <motion.div variants={item}>
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center"
            >
              <ArrowRightLeft className="w-8 h-8 text-neutral-500" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">No transactions yet</h2>
              <p className="text-neutral-400">Record your first spend to start tracking rewards!</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Add Transaction
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {transactions.map((tx) => (
              <motion.div
                key={tx.id}
                variants={item}
                layout
                exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
              >
                <GlassPanel className="p-4 hover:border-white/20 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    {/* Left */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tx.card_color_from || 'from-neutral-700'} ${tx.card_color_to || 'to-neutral-800'} flex items-center justify-center shrink-0`}>
                        <CreditCard className="w-5 h-5 text-white/70" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{tx.merchant}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-neutral-500">{tx.card_name}</span>
                          <span className="text-neutral-600">·</span>
                          <span className="text-xs text-neutral-500">{formatDate(tx.tx_date)}</span>
                          {tx.category && (
                            <>
                              <span className="text-neutral-600">·</span>
                              <span className="inline-flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                                <Tag className="w-3 h-3" /> {tx.category}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-white font-semibold">{formatCurrency(tx.amount)}</p>
                        {tx.reward_earned > 0 && (
                          <p className="text-xs text-emerald-400 flex items-center justify-end gap-1">
                            <Sparkles className="w-3 h-3" /> +{tx.reward_earned} pts
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="text-neutral-600 hover:text-red-400 transition-colors disabled:opacity-50 p-1"
                        title="Delete transaction"
                      >
                        {deletingId === tx.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Load More */}
          {transactions.length < total && (
            <motion.div variants={item} className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-3 bg-white/[0.06] hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                {loadingMore ? 'Loading…' : `Load More (${transactions.length} of ${total})`}
              </button>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
