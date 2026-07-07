'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { api } from '@/lib/api';
import {
  AlertCircle, AlertTriangle, Info, CheckCircle2,
  RefreshCw, Bell, BellOff, Check, Loader2
} from 'lucide-react';

interface Alert {
  id: number;
  alert_type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  is_read: boolean;
  created_at: number;
}

function timeAgo(ts: number): string {
  const now = Date.now() / 1000;
  const diff = Math.max(0, now - ts);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const severityConfig = {
  info: {
    border: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    bgGlow: 'bg-blue-500/5',
    unreadRing: 'ring-blue-500/20',
    Icon: Info,
  },
  warning: {
    border: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    bgGlow: 'bg-amber-500/5',
    unreadRing: 'ring-amber-500/20',
    Icon: AlertTriangle,
  },
  danger: {
    border: 'border-red-500/30',
    iconColor: 'text-red-400',
    bgGlow: 'bg-red-500/5',
    unreadRing: 'ring-red-500/20',
    Icon: AlertCircle,
  },
};

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-36" />
        <SkeletonBlock className="h-5 w-64" />
      </div>
      {[...Array(5)].map((_, i) => (
        <SkeletonBlock key={i} className="h-24" />
      ))}
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data);
    } catch {
      setError('Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleMarkRead = async (id: number) => {
    setMarkingId(id);
    try {
      await api.put(`/alerts/${id}/read`);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );
    } catch {
      alert('Failed to mark alert as read.');
    } finally {
      setMarkingId(null);
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
          onClick={fetchAlerts}
          className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  /* ── Empty ── */
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center"
        >
          <BellOff className="w-10 h-10 text-emerald-400" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">All caught up! 🎉</h2>
          <p className="text-neutral-400 max-w-md">No alerts right now. We&apos;ll notify you about upcoming dues, unusual spending, and reward opportunities.</p>
        </div>
      </div>
    );
  }

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-3xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Alerts</h1>
          <p className="text-neutral-400">
            {unreadCount > 0
              ? `You have ${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`
              : 'All alerts have been read'}
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-full">
            <Bell className="w-3 h-3" /> {unreadCount} new
          </span>
        )}
      </motion.div>

      {/* Alert List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity] || severityConfig.info;
            const SeverityIcon = config.Icon;

            return (
              <motion.div
                key={alert.id}
                variants={item}
                layout
              >
                <GlassPanel
                  className={`p-5 border-l-4 ${config.border} transition-all ${
                    !alert.is_read
                      ? `ring-1 ${config.unreadRing} ${config.bgGlow}`
                      : 'opacity-75'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      !alert.is_read ? config.bgGlow : 'bg-white/5'
                    }`}>
                      <SeverityIcon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className={`font-semibold text-sm ${!alert.is_read ? 'text-white' : 'text-neutral-300'}`}>
                            {alert.title}
                            {!alert.is_read && (
                              <span className="inline-block w-2 h-2 rounded-full bg-purple-500 ml-2 align-middle" />
                            )}
                          </h3>
                          <p className="text-neutral-400 text-sm mt-1 leading-relaxed">{alert.message}</p>
                        </div>
                        <span className="text-xs text-neutral-600 whitespace-nowrap shrink-0 pt-0.5">
                          {timeAgo(alert.created_at)}
                        </span>
                      </div>

                      {!alert.is_read && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleMarkRead(alert.id)}
                            disabled={markingId === alert.id}
                            className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white bg-white/[0.06] hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {markingId === alert.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            {markingId === alert.id ? 'Marking…' : 'Mark as Read'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Read-all indicator */}
      {unreadCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 text-sm text-emerald-400 py-4"
        >
          <CheckCircle2 className="w-4 h-4" /> All caught up!
        </motion.div>
      )}
    </motion.div>
  );
}
