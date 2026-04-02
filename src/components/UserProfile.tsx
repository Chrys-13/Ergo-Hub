import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Shield, Calendar, Camera, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { cn } from '../lib/utils';

export const UserProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.displayName || '');
  const [university, setUniversity] = useState(profile?.university || '');
  const [major, setMajor] = useState(profile?.major || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || '');
      setUniversity(profile.university || '');
      setMajor(profile.major || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: name });

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: name,
        university,
        major,
        bio,
        updatedAt: new Date().toISOString()
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-serif text-[#1a1a1a]">Your Profile</h2>
        <p className="text-primary/60 font-serif italic">Manage your personal information and academic details.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center border-2 border-primary/10">
                <User size={40} className="text-primary" />
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                <Camera size={14} />
              </button>
            </div>
            <h3 className="text-xl font-serif text-[#1a1a1a]">{profile?.displayName || 'Knowledge Seeker'}</h3>
            <p className="text-primary/60 text-sm font-serif italic mb-4 capitalize">{profile?.role}</p>
            
            <div className="pt-6 border-t border-black/5 space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm font-serif text-primary/60">
                <Mail size={16} className="text-primary/40" />
                <span className="truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-serif text-primary/60">
                <Shield size={16} className="text-primary/40" />
                <span className="capitalize">{profile?.role} Access</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-serif text-primary/60">
                <Calendar size={16} className="text-primary/40" />
                <span>Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Recently'}</span>
              </div>
            </div>
          </div>

          <div className="bg-primary text-white p-8 rounded-3xl shadow-sm">
            <h4 className="text-lg font-serif mb-2">Ergo-Hub Status</h4>
            <div className="space-y-4 mt-4">
              <div className="bg-white/10 p-4 rounded-2xl">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Current Level</p>
                <p className="text-xl font-serif">Bronze Achiever</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Pain-Free Days</p>
                <p className="text-xl font-serif">12 Consecutive</p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
            <h3 className="text-xl font-serif text-[#1a1a1a] mb-8 flex items-center gap-2">
              <User size={20} className="text-primary" />
              Personal Details
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-serif uppercase tracking-widest text-primary/60">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-bg border-none rounded-xl px-4 py-3 font-serif focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-serif uppercase tracking-widest text-primary/60">University</label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full bg-bg border-none rounded-xl px-4 py-3 font-serif focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="e.g. Oxford University"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-serif uppercase tracking-widest text-primary/60">Major / Area of Study</label>
                  <input
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full bg-bg border-none rounded-xl px-4 py-3 font-serif focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-serif uppercase tracking-widest text-primary/60">Bio / Academic Goals</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full bg-bg border-none rounded-xl px-4 py-3 font-serif focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Tell us about your ergonomic journey and study goals..."
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-serif italic">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-serif italic">
                  <CheckCircle2 size={18} />
                  Profile updated successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-serif hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
