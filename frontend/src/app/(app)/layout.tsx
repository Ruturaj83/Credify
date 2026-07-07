'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthGuard } from '@/components/AuthGuard';
import { api } from '@/lib/api';
import {
  LayoutDashboard, CreditCard, Wallet, BarChart3, Compass,
  Bell, Menu, X, LogOut, ArrowRightLeft, AlertTriangle
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portfolio', label: 'Portfolio', icon: Wallet },
  { href: '/catalogue', label: 'Catalogue', icon: CreditCard },
  { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/recommend', label: 'Recommend', icon: Compass },
  { href: '/alerts', label: 'Alerts', icon: AlertTriangle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch { /* auth guard handles redirect */ }
    };
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/alerts');
        setAlertCount(res.data.filter((a: any) => !a.is_read).length);
      } catch {}
    };
    fetchUser();
    fetchAlerts();
  }, [pathname]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '??';

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[hsl(0,0%,4%)]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 border-r border-white/10 bg-white/[0.02] backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">CC</div>
            <div>
              <h1 className="text-white font-bold text-lg">CCIMS</h1>
              <p className="text-neutral-500 text-xs">Card Manager Pro</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive ? 'text-white bg-white/10' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}>
                  {isActive && (
                    <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10 rounded-xl"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                  )}
                  <item.icon className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                  {item.label === 'Alerts' && alertCount > 0 && (
                    <span className="ml-auto relative z-10 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {alertCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.username || 'Loading...'}</p>
                <p className="text-neutral-500 text-xs">{user?.card_count || 0} cards · ₹{user?.total_rewards || 0} pts</p>
              </div>
            </div>
            <button onClick={handleSignOut}
              className="flex items-center gap-2 text-neutral-400 hover:text-red-400 text-sm transition-colors w-full px-2 py-2 rounded-lg hover:bg-white/5">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl lg:px-8">
            <button className="lg:hidden text-white" onClick={() => setMobileOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden lg:block">
              <h2 className="text-white font-semibold text-lg capitalize">{pathname.replace('/', '') || 'Dashboard'}</h2>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/alerts" className="relative text-neutral-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                {alertCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />}
              </Link>
              <div className="lg:hidden w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs">{initials}</div>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
              <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-[hsl(0,0%,6%)] border-r border-white/10 z-50 p-6 flex flex-col lg:hidden">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-white font-bold text-lg">CCIMS</h1>
                  <button onClick={() => setMobileOpen(false)} className="text-neutral-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex-1 space-y-1">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                        ${pathname === item.href ? 'text-white bg-white/10' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}>
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <button onClick={handleSignOut}
                  className="flex items-center gap-2 text-neutral-400 hover:text-red-400 text-sm mt-4 px-4 py-3">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
