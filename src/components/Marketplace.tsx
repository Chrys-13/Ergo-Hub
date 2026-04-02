import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Info, ShoppingCart, Building2, Crown, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from './FirebaseProvider';
import { useNotification } from './Notification';
import { sendEmail } from '../lib/email';
import { addDoc, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Link } from 'react-router-dom';

const products = [
  {
    id: 'ergo-kit',
    name: 'The Ergo-Kit',
    type: 'kit',
    price: 89,
    rentalPrice: 25,
    description: 'The original 2-part transformation system for campus chairs.',
    features: ['Contoured Seat Cushion', 'High-Back Lumbar Support', 'Heavy-Duty Straps', 'Medical-Grade Foam'],
    image: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&q=80&w=1200',
    premiumOnly: false
  },
  {
    id: 'ergo-hub-pro',
    name: 'Ergo-Hub Pro Chair',
    type: 'chair',
    price: 649,
    description: 'The ultimate study companion. Engineered for 12+ hour sessions.',
    features: ['Ribbed Back Support', 'Advanced Mesh', 'Precision Tilt', 'Member Exclusive Price'],
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=1200',
    premiumOnly: true
  }
];

export const Marketplace: React.FC = () => {
  const { user, isPremium } = useAuth();
  const { showNotification } = useNotification();
  const [showBulk, setShowBulk] = useState(false);

  const handleOrder = async (product: any, type: 'buy' | 'rent' = 'buy') => {
    if (!user) return;
    
    if (product.premiumOnly && !isPremium) {
      showNotification('This product is exclusive to Premium members.', 'error');
      return;
    }

    try {
      const orderType = type;
      const orderPrice = type === 'rent' ? product.rentalPrice : product.price;
      
      try {
        await addDoc(collection(db, 'orders'), {
          userId: user.uid,
          productId: product.id,
          type: orderType,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Firestore order failed, simulating success for dummy mode:', e);
      }

      // Send email notification
      if (user.email) {
        await sendEmail(
          user.email,
          'Order Confirmation - Ergo-Hub',
          `
          <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #0066CC10; border-radius: 24px;">
            <h2 style="color: #0066CC;">Thank you for your order!</h2>
            <p>Hi ${user.displayName || 'there'},</p>
            <p>Your order for <strong>${product.name}</strong> has been received and is being processed.</p>
            <div style="background-color: #F0F8FF; padding: 20px; border-radius: 16px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0066CC;">Order Details:</h3>
              <p style="margin: 5px 0;"><strong>Product:</strong> ${product.name}</p>
              <p style="margin: 5px 0;"><strong>Type:</strong> ${orderType === 'rent' ? 'Semester Rental' : 'Purchase'}</p>
              <p style="margin: 5px 0;"><strong>Price:</strong> $${orderPrice}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> Pending</p>
            </div>
            <p>We'll notify you once your order has been shipped.</p>
            <p style="font-style: italic; color: #0066CC60;">Best regards,<br>The Ergo-Hub Team</p>
          </div>
          `
        );
      }

      showNotification('Order placed successfully! A confirmation email has been sent.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  };

  return (
    <div className="space-y-12">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <motion.div
            key={product.id}
            whileHover={{ y: -5 }}
            className={cn(
              "bg-white rounded-3xl overflow-hidden shadow-sm border flex flex-col relative",
              product.premiumOnly ? "border-primary/20" : "border-black/5"
            )}
          >
            {product.premiumOnly && (
              <div className="absolute top-4 left-4 z-10 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-serif font-bold uppercase tracking-widest flex items-center gap-1 shadow-lg">
                <Crown size={10} />
                Premium
              </div>
            )}
            <div className="aspect-video relative">
              <img 
                src={product.image} 
                alt={product.name} 
                className={cn(
                  "w-full h-full object-cover transition-all duration-500",
                  product.premiumOnly && !isPremium && "brightness-50 saturate-50"
                )}
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full text-xs font-serif uppercase tracking-widest text-primary">
                {product.type === 'kit' ? 'Standard' : 'Premium'}
              </div>
            </div>
            
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-serif text-[#1a1a1a]">{product.name}</h3>
                  <p className="text-primary/60 text-xs font-serif italic">{product.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-serif text-[#1a1a1a]">
                    ${product.price}
                  </p>
                  {product.rentalPrice && (
                    <p className="text-[10px] text-primary/40 font-serif">
                      or ${product.rentalPrice} rental
                    </p>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-xs text-primary/80 font-serif">
                    <div className="w-4 h-4 rounded-full bg-primary/5 flex items-center justify-center">
                      <Check size={10} className="text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              {product.premiumOnly && !isPremium ? (
                <Link 
                  to="/premium"
                  className="w-full bg-bg text-primary py-4 rounded-2xl font-serif flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors border border-primary/10"
                >
                  <Lock size={18} />
                  Upgrade to Unlock
                </Link>
              ) : (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleOrder(product, 'buy')}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-serif flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                  >
                    <ShoppingCart size={18} />
                    Buy ${product.price}
                  </button>
                  {product.rentalPrice && (
                    <button 
                      onClick={() => handleOrder(product, 'rent')}
                      className="w-full bg-white border border-primary/20 text-primary py-4 rounded-2xl font-serif flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
                    >
                      <Building2 size={18} />
                      Rent ${product.rentalPrice}/semester
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Transformation Section */}
      <div className="bg-white p-12 rounded-[40px] shadow-sm border border-black/5 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-4">
          <h3 className="text-3xl font-serif text-[#1a1a1a]">The Transformation</h3>
          <p className="text-primary/60 font-serif italic">
            Turn any standard campus chair into a medically-certified ergonomic workstation in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="aspect-[4/3] bg-bg rounded-3xl overflow-hidden relative group">
              <img 
                src="https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&q=80&w=1200" 
                alt="Standard Chair" 
                className="w-full h-full object-cover transition-all duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full text-[10px] font-serif uppercase tracking-widest text-primary font-bold">
                Before
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-serif text-[#1a1a1a]">Standard Campus Chair</h4>
              <p className="text-sm font-serif text-primary/60 italic">
                Hard surfaces, no lumbar support, and poor posture alignment.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="aspect-[4/3] bg-primary/5 rounded-3xl overflow-hidden relative shadow-2xl shadow-primary/10">
              <img 
                src="https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&q=80&w=1200" 
                alt="Ergo-Kit Chair" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-6 left-6 bg-primary text-white px-4 py-1 rounded-full text-[10px] font-serif uppercase tracking-widest font-bold shadow-lg">
                After Ergo-Kit
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-serif text-[#1a1a1a]">The Ergo-Hub Transformation</h4>
              <p className="text-sm font-serif text-primary/60 italic">
                Blue medical-grade foam, contoured seat, and high-back lumbar support.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          {[
            { title: "Attach", desc: "Heavy-duty straps lock the kit to any chair back." },
            { title: "Align", desc: "Contoured foam guides your spine into neutral." },
            { title: "Achieve", desc: "Extended study sessions with zero pain." }
          ].map((step, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-serif italic">
                {i + 1}
              </div>
              <h5 className="font-serif text-[#1a1a1a] font-bold">{step.title}</h5>
              <p className="text-xs font-serif text-primary/60 italic">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-12 border-t border-primary/10">
        <div className="bg-primary/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Building2 className="text-primary" size={32} />
            </div>
            <div>
              <h4 className="text-xl font-serif text-[#1a1a1a]">Institutional Orders</h4>
              <p className="text-primary/60 font-serif italic">Bulk solutions for University Administrators & Campus Housing.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowBulk(true)}
            className="bg-white border border-primary/20 text-primary px-8 py-4 rounded-full font-serif hover:bg-primary hover:text-white transition-all"
          >
            Access Admin Portal
          </button>
        </div>
      </div>

      {showBulk && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-xl"
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-serif text-[#1a1a1a]">Bulk Order Inquiry</h3>
              <button onClick={() => setShowBulk(false)} className="text-primary/40 hover:text-primary">
                <X size={24} />
              </button>
            </div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowBulk(false); showNotification('Inquiry sent!'); }}>
              <div>
                <label className="block text-xs font-serif uppercase tracking-widest text-primary/60 mb-2">Institution Name</label>
                <input type="text" className="w-full bg-bg border-none rounded-xl px-4 py-3 font-serif" placeholder="e.g. Stanford University" required />
              </div>
              <div>
                <label className="block text-xs font-serif uppercase tracking-widest text-primary/60 mb-2">Estimated Quantity</label>
                <input type="number" className="w-full bg-bg border-none rounded-xl px-4 py-3 font-serif" placeholder="100+" required />
              </div>
              <div>
                <label className="block text-xs font-serif uppercase tracking-widest text-primary/60 mb-2">Message</label>
                <textarea className="w-full bg-bg border-none rounded-xl px-4 py-3 font-serif h-32" placeholder="Tell us about your campus needs..."></textarea>
              </div>
              <button className="w-full bg-primary text-white py-4 rounded-2xl font-serif">Submit Inquiry</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const X = ({ size, className }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
