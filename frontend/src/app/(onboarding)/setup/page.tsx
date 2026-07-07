'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Check, CreditCard, ArrowRight, Loader2 } from 'lucide-react';

const steps = ['Welcome', 'Select Cards', 'Card Details', 'Done'];

export default function Setup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [cardDetails, setCardDetails] = useState<Record<string, {last4: string, limit: string, statementDay: string, dueDay: string}>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCatalogue = async () => {
      try {
        const res = await api.get('/catalogue/cards');
        setCatalogue(res.data);
      } catch (err) { console.error(err); }
    };
    fetchCatalogue();
  }, []);

  const handleNext = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (selectedCards.length === 0) return;
      // Initialize details for selected cards
      const details: Record<string, any> = {};
      selectedCards.forEach(id => {
        details[id] = { last4: '', limit: '500000', statementDay: '1', dueDay: '20' };
      });
      setCardDetails(details);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setIsSaving(true);
      try {
        for (const cardId of selectedCards) {
          const d = cardDetails[cardId] || {};
          await api.post('/user/cards', {
            catalogue_id: cardId,
            last_four_digits: d.last4 || '0000',
            credit_limit: parseFloat(d.limit) || 500000,
            statement_day: parseInt(d.statementDay) || 1,
            due_day: parseInt(d.dueDay) || 20,
          });
        }
        setCurrentStep(3);
      } catch (err: any) {
        console.error('Failed to add cards:', err);
      } finally {
        setIsSaving(false);
      }
    } else {
      router.push('/dashboard');
    }
  };

  const toggleCard = (id: string) => {
    setSelectedCards(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const updateDetail = (cardId: string, field: string, value: string) => {
    setCardDetails(prev => ({ ...prev, [cardId]: { ...prev[cardId], [field]: value } }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${i <= currentStep ? 'bg-purple-600 border-purple-600 text-white' : 'border-white/20 text-neutral-500'}`}>
                {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < currentStep ? 'bg-purple-600' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {currentStep === 0 && (
              <GlassPanel className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Welcome to CCIMS</h2>
                <p className="text-neutral-400 mb-8 max-w-sm mx-auto">Let&apos;s set up your credit card portfolio. We&apos;ll help you track rewards, manage spending, and get smart recommendations.</p>
                <PremiumButton onClick={handleNext} variant="secondary" className="gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </PremiumButton>
              </GlassPanel>
            )}

            {currentStep === 1 && (
              <GlassPanel className="p-8">
                <h2 className="text-xl font-bold text-white mb-2">Select Your Cards</h2>
                <p className="text-neutral-400 mb-6 text-sm">Choose the credit cards you currently own.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                  {catalogue.map(card => (
                    <button key={card.id} onClick={() => toggleCard(card.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                        ${selectedCards.includes(card.id) ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                      <div className={`w-10 h-7 rounded bg-gradient-to-br ${card.card_color_from} ${card.card_color_to} border border-white/20 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{card.name}</p>
                        <p className="text-neutral-500 text-xs">{card.issuer}</p>
                      </div>
                      {selectedCards.includes(card.id) && <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-between items-center">
                  <p className="text-neutral-500 text-sm">{selectedCards.length} selected</p>
                  <PremiumButton onClick={handleNext} variant="secondary" className="gap-2" disabled={selectedCards.length === 0}>
                    Continue <ArrowRight className="w-4 h-4" />
                  </PremiumButton>
                </div>
              </GlassPanel>
            )}

            {currentStep === 2 && (
              <GlassPanel className="p-8">
                <h2 className="text-xl font-bold text-white mb-2">Card Details</h2>
                <p className="text-neutral-400 mb-6 text-sm">Enter details for each card (or keep defaults).</p>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {selectedCards.map(id => {
                    const card = catalogue.find(c => c.id === id);
                    const d = cardDetails[id] || { last4: '', limit: '500000', statementDay: '1', dueDay: '20' };
                    return (
                      <div key={id} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                        <p className="text-white font-medium text-sm">{card?.name || id}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-neutral-500 text-xs">Last 4 Digits</label>
                            <input type="text" maxLength={4} placeholder="0000" value={d.last4}
                              onChange={e => updateDetail(id, 'last4', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mt-1" />
                          </div>
                          <div>
                            <label className="text-neutral-500 text-xs">Credit Limit (₹)</label>
                            <input type="number" value={d.limit} onChange={e => updateDetail(id, 'limit', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mt-1" />
                          </div>
                          <div>
                            <label className="text-neutral-500 text-xs">Statement Day</label>
                            <input type="number" min={1} max={28} value={d.statementDay} onChange={e => updateDetail(id, 'statementDay', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mt-1" />
                          </div>
                          <div>
                            <label className="text-neutral-500 text-xs">Due Day</label>
                            <input type="number" min={1} max={28} value={d.dueDay} onChange={e => updateDetail(id, 'dueDay', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mt-1" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-end">
                  <PremiumButton onClick={handleNext} variant="secondary" className="gap-2" isLoading={isSaving}>
                    Save & Continue <ArrowRight className="w-4 h-4" />
                  </PremiumButton>
                </div>
              </GlassPanel>
            )}

            {currentStep === 3 && (
              <GlassPanel className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">You&apos;re All Set!</h2>
                <p className="text-neutral-400 mb-8">Your cards have been added. Start tracking your rewards and spending.</p>
                <PremiumButton onClick={handleNext} variant="secondary" className="gap-2">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </PremiumButton>
              </GlassPanel>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
