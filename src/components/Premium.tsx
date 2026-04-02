import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Crown, Check, Star, Zap, Shield, Headphones, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { useNotification } from './Notification';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

export const Premium: React.FC = () => {
  const { user, isPremium } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Simulated payment/upgrade
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          isPremium: true,
          premiumSince: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Firestore upgrade failed, simulating success for dummy mode:', e);
      }
      showNotification('Welcome to Ergo-Hub Premium!');
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: "Exclusive Hardware",
      description: "Access to the Ergo-Hub Pro Chair and limited edition kits.",
      icon: Star
    },
    {
      title: "Priority OT Support",
      description: "Direct 24/7 messaging with licensed Occupational Therapists.",
      icon: Headphones
    },
    {
      title: "Advanced Analytics",
      description: "Detailed posture heatmaps and long-term health projections.",
      icon: Zap
    },
    {
      title: "Extended Warranty",
      description: "Lifetime protection on all Ergo-Hub physical products.",
      icon: Shield
    }
  ];

  if (isPremium) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 py-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-4">
            <Crown size={40} className="text-primary" />
          </div>
          <h2 className="text-4xl font-serif text-[#1a1a1a]">You are a Premium Member</h2>
          <p className="text-primary/60 font-serif italic text-lg">Thank you for being part of our elite ergonomic community.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
            <h3 className="text-xl font-serif text-[#1a1a1a] mb-6">Your Benefits</h3>
            <ul className="space-y-4">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 bg-primary/10 p-1 rounded-full">
                    <Check size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-serif text-[#1a1a1a] font-bold">{f.title}</p>
                    <p className="text-sm font-serif text-primary/60 italic">{f.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-primary text-white p-8 rounded-3xl shadow-sm flex flex-col justify-between">
            <div>
              <Sparkles size={32} className="mb-4 text-white/40" />
              <h3 className="text-2xl font-serif mb-2">Pro Member Perks</h3>
              <p className="text-white/60 font-serif italic text-sm mb-6">
                Check the Marketplace for exclusive items marked with the Premium badge.
              </p>
            </div>
            <button className="w-full bg-white text-primary py-4 rounded-2xl font-serif font-bold hover:bg-white/90 transition-all">
              View Exclusive Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-12">
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full text-primary text-xs font-serif font-bold uppercase tracking-widest">
          <Crown size={14} />
          Elevate Your Experience
        </div>
        <h2 className="text-5xl font-serif text-[#1a1a1a] leading-tight">
          Unlock the Full Potential of <span className="italic">Ergonomic Excellence</span>
        </h2>
        <p className="text-primary/60 font-serif italic text-lg">
          Join Ergo-Hub Premium for exclusive access to high-end hardware, 
          professional clinical support, and advanced health insights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 group transition-all hover:border-primary/20"
            >
              <div className="w-12 h-12 bg-bg rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/5 transition-colors">
                <feature.icon size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-serif text-[#1a1a1a] mb-2">{feature.title}</h3>
              <p className="text-primary/60 font-serif italic text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Crown size={40} className="text-primary/5" />
          </div>
          
          <div className="mb-8">
            <p className="text-xs font-serif uppercase tracking-widest text-primary/40 mb-2">Premium Plan</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-serif text-[#1a1a1a]">$19.99</span>
              <span className="text-primary/40 font-serif italic">/month</span>
            </div>
          </div>

          <ul className="space-y-4 mb-10">
            {[
              "All Standard Features",
              "Ergo-Hub Pro Chair Access",
              "24/7 OT Messaging",
              "Advanced Health Heatmaps",
              "No Marketplace Fees",
              "Exclusive Ambassador Perks"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-serif text-primary/60">
                <Check size={16} className="text-primary" />
                {item}
              </li>
            ))}
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-primary text-white py-5 rounded-2xl font-serif font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Upgrade Now
                <ArrowRight size={20} />
              </>
            )}
          </button>
          <p className="text-center mt-4 text-[10px] font-serif text-primary/40 uppercase tracking-widest">
            Secure checkout • Cancel anytime
          </p>
        </div>
      </div>

      {/* Featured Premium Product */}
      <div className="bg-bg rounded-[40px] p-12 flex flex-col md:flex-row items-center gap-12 border border-black/5">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-white text-[10px] font-serif font-bold uppercase tracking-widest rounded-full">
            Premium Exclusive
          </div>
          <h3 className="text-4xl font-serif text-[#1a1a1a]">The Ergo-Hub Pro Chair</h3>
          <p className="text-primary/60 font-serif italic text-lg leading-relaxed">
            Engineered for 12+ hour study sessions. Features dynamic lumbar support, 
            breathable mesh, and 4D adjustable armrests. Available only to Premium members.
          </p>
          <div className="flex items-center gap-8 pt-4">
            <div>
              <p className="text-xs font-serif uppercase tracking-widest text-primary/40 mb-1">Retail Value</p>
              <p className="text-2xl font-serif text-[#1a1a1a]">$899</p>
            </div>
            <div>
              <p className="text-xs font-serif uppercase tracking-widest text-primary/40 mb-1">Member Price</p>
              <p className="text-2xl font-serif text-primary">$649</p>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <img 
            src="https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=1200" 
            alt="Ergo-Hub Pro Chair" 
            className="w-full h-full object-cover rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};
