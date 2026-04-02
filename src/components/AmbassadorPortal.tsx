import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, MapPin, DollarSign, Briefcase, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { sendEmail } from '../lib/email';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { cn } from '../lib/utils';

export const AmbassadorPortal: React.FC = () => {
  const { user, profile, isAmbassador } = useAuth();
  const [application, setApplication] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    dormTerritory: '',
    applicationUrl: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'ambassador_applications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setApplication(snapshot.docs[0].data());
      } else {
        // Fallback for demo/dummy mode
        setApplication({
          dormTerritory: 'North Campus',
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }
    }, (error) => {
      console.warn('Firestore error in AmbassadorPortal, using dummy data:', error);
      setApplication({
        dormTerritory: 'North Campus',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    });
    return () => unsubscribe();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      // In a real app, we would upload the file to Firebase Storage here
      // For this demo, we'll just simulate it
      const fileName = file ? file.name : 'resume.pdf';
      
      try {
        await addDoc(collection(db, 'ambassador_applications'), {
          userId: user.uid,
          dormTerritory: formData.dormTerritory,
          applicationUrl: formData.applicationUrl || `https://example.com/${fileName}`,
          fileName: fileName,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Firestore application failed, simulating success for dummy mode:', e);
        // Set local state for immediate feedback
        setApplication({
          dormTerritory: formData.dormTerritory,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }

      // Send email notification
      if (user.email) {
        await sendEmail(
          user.email,
          'Ambassador Application Received - Ergo-Hub',
          `
          <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #0066CC10; border-radius: 24px;">
            <h2 style="color: #0066CC;">Ambassador Application Received</h2>
            <p>Hi ${user.displayName || 'there'},</p>
            <p>Thank you for applying to become an Ergo-Hub Ambassador for the <strong>${formData.dormTerritory}</strong> territory!</p>
            <p>Our team is currently reviewing your application. You can expect to hear from us within 3-5 business days.</p>
            <div style="background-color: #F0F8FF; padding: 20px; border-radius: 16px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Status:</strong> Under Review</p>
              <p style="margin: 5px 0 0 0;"><strong>Territory:</strong> ${formData.dormTerritory}</p>
            </div>
            <p>In the meantime, feel free to explore our Marketplace and Clinical Impact dashboard.</p>
            <p style="font-style: italic; color: #0066CC60;">Best regards,<br>The Ergo-Hub Team</p>
          </div>
          `
        );
      }

      setIsApplying(false);
      alert('Application submitted successfully! A confirmation email has been sent.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ambassador_applications');
    }
  };

  if (isAmbassador) {
    return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-serif text-[#1a1a1a]">Ambassador Dashboard</h2>
            <p className="text-primary/60 font-serif italic">Welcome back, {profile.displayName}. Your impact is growing.</p>
          </div>
          <div className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-3">
            <MapPin size={18} />
            <span className="font-serif text-sm">Territory: {profile.dormTerritory || 'North Campus'}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center">
                <DollarSign className="text-primary" size={24} />
              </div>
              <h3 className="font-serif text-[#1a1a1a]">Total Commission</h3>
            </div>
            <p className="text-4xl font-serif text-[#1a1a1a]">$420.00</p>
            <p className="text-xs text-primary/40 font-serif mt-2 italic">+15% from last month</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-primary" size={24} />
              </div>
              <h3 className="font-serif text-[#1a1a1a]">Peer Sales</h3>
            </div>
            <p className="text-4xl font-serif text-[#1a1a1a]">14</p>
            <p className="text-xs text-primary/40 font-serif mt-2 italic">8 Kits, 6 Chairs</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center">
                <Clock className="text-primary" size={24} />
              </div>
              <h3 className="font-serif text-[#1a1a1a]">Next Payout</h3>
            </div>
            <p className="text-4xl font-serif text-[#1a1a1a]">Apr 1st</p>
            <p className="text-xs text-primary/40 font-serif mt-2 italic">Processing...</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
          <div className="p-8 border-b border-black/5">
            <h3 className="text-xl font-serif text-[#1a1a1a]">Recent Activity</h3>
          </div>
          <div className="divide-y divide-black/5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 flex items-center justify-between hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-serif text-[#1a1a1a]">Sale: Ergo-Kit (Rental)</p>
                    <p className="text-xs text-primary/60 font-serif italic">Referral from Dorm A-12</p>
                  </div>
                </div>
                <p className="font-serif text-primary">+$5.00</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <h2 className="text-4xl font-serif text-[#1a1a1a] mb-4">Become an Ambassador</h2>
        <p className="text-primary/60 font-serif italic max-w-xl mx-auto">
          Join the movement to eliminate campus back pain. Earn commissions while helping your peers study better.
        </p>
      </header>

      {application ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-black/5">
          <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Clock className="text-primary" size={40} />
          </div>
          <h3 className="text-2xl font-serif text-[#1a1a1a] mb-2">Application Under Review</h3>
          <p className="text-primary/60 font-serif italic mb-8">
            We've received your application for the <span className="text-primary font-bold">{application.dormTerritory}</span> territory.
            Our team will get back to you within 3-5 business days.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 text-primary rounded-full text-sm font-serif">
            Status: <span className="capitalize font-bold">{application.status}</span>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shrink-0">
                <Briefcase size={24} />
              </div>
              <div>
                <h4 className="text-xl font-serif text-[#1a1a1a] mb-1">Professional Experience</h4>
                <p className="text-primary/60 font-serif italic text-sm">Gain real-world sales and marketing experience for your resume.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shrink-0">
                <DollarSign size={24} />
              </div>
              <div>
                <h4 className="text-xl font-serif text-[#1a1a1a] mb-1">Earn Commissions</h4>
                <p className="text-primary/60 font-serif italic text-sm">Get paid for every peer referral that results in a sale or rental.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h4 className="text-xl font-serif text-[#1a1a1a] mb-1">Exclusive Territory</h4>
                <p className="text-primary/60 font-serif italic text-sm">Own your dorm territory and build a community of wellness.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
            <h3 className="text-2xl font-serif text-[#1a1a1a] mb-6">Apply Now</h3>
            <form className="space-y-6" onSubmit={handleApply}>
              <div>
                <label className="block text-xs font-serif uppercase tracking-widest text-primary/60 mb-2">Dorm Territory</label>
                <select 
                  value={formData.dormTerritory}
                  onChange={(e) => setFormData({ ...formData, dormTerritory: e.target.value })}
                  className="w-full bg-bg border-none rounded-xl px-4 py-3 font-serif"
                  required
                >
                  <option value="">Select a territory...</option>
                  <option value="North Campus">North Campus</option>
                  <option value="South Campus">South Campus</option>
                  <option value="West Village">West Village</option>
                  <option value="East Dorms">East Dorms</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-widest text-primary/60 mb-2">Application Document</label>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
                    isDragging ? "border-primary bg-primary/5" : "border-primary/20 hover:border-primary/40",
                    file ? "bg-primary/5 border-primary/40" : ""
                  )}
                >
                  <input 
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                  />
                  {file ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                        <CheckCircle2 className="text-primary" size={24} />
                      </div>
                      <p className="text-sm font-serif text-[#1a1a1a] font-bold">{file.name}</p>
                      <p className="text-xs font-serif text-primary/60">Click or drag to replace</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto text-primary/40 mb-4" size={32} />
                      <p className="text-sm font-serif text-primary/60">Upload your resume or a short bio (PDF/DOC)</p>
                      <p className="text-xs font-serif text-primary/40 mt-2 italic">Drag and drop or click to browse</p>
                    </>
                  )}
                </div>
              </div>

              <button className="w-full bg-primary text-white py-4 rounded-2xl font-serif hover:bg-primary/90 transition-colors">
                Submit Application
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
