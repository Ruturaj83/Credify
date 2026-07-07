'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { PremiumButton } from '@/components/ui/PremiumButton';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      localStorage.setItem('token', res.data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.message === 'Network Error') {
        setError('Unable to connect to the server. Please check if the backend is running.');
      } else {
        setError(err.response?.data?.detail || 'Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <GlassPanel className="p-8" glowColor="blue">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">CC</div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
          <p className="text-neutral-400">Sign in to your card portfolio</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <AnimatedInput 
            label="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <AnimatedInput 
            label="Password" 
            type="password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <PremiumButton type="submit" className="w-full mt-4" isLoading={isLoading}>
            Log In
          </PremiumButton>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-400">
          New to CCIMS?{' '}
          <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
            Create an account
          </Link>
        </p>
      </GlassPanel>
    </motion.div>
  );
}
