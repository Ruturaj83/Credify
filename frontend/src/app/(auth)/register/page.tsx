'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { PremiumButton } from '@/components/ui/PremiumButton';

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength calculation
  const getStrength = (pw: string) => {
    let strength = 0;
    if (pw.length > 5) strength += 1;
    if (pw.length > 7) strength += 1;
    if (/[A-Z]/.test(pw)) strength += 1;
    if (/[0-9]/.test(pw)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pw)) strength += 1;
    return strength;
  };

  const strength = getStrength(password);
  const strengthColors = ['bg-red-500', 'bg-red-400', 'bg-yellow-500', 'bg-green-400', 'bg-green-500', 'bg-green-600'];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/register', { username, password });
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('token', res.data.access_token);
      router.push('/setup');
    } catch (err: any) {
      if (err.message === 'Network Error') {
        setError('Unable to connect to the server. Please check if the backend is running.');
      } else {
        setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <GlassPanel className="p-8" glowColor="purple">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Join CCIMS</h1>
          <p className="text-neutral-400">Start optimizing your credit strategy</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <AnimatedInput 
            label="Choose Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <div>
            <AnimatedInput 
              label="Create Password" 
              type="password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            {password.length > 0 && (
              <div className="mt-2 flex gap-1 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${strengthColors[strength]}`} 
                  style={{ width: `${(Math.max(1, strength) / 5) * 100}%` }}
                />
              </div>
            )}
          </div>
          <AnimatedInput 
            label="Confirm Password" 
            type="password"
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          
          <PremiumButton type="submit" variant="secondary" className="w-full mt-4" isLoading={isLoading}>
            Create Account
          </PremiumButton>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-400">
          Already a member?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Log in here
          </Link>
        </p>
      </GlassPanel>
    </motion.div>
  );
}
