import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';
import { 
  Activity, Clock, CheckSquare, FileText, ShieldCheck, 
  ChevronRight, Plus, Info, TrendingDown, TrendingUp, Calendar as CalendarIcon, Filter
} from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { sendEmail } from '../lib/email';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit, QueryConstraint, getDocs, updateDoc, doc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { AnimatePresence } from 'motion/react';

type FilterRange = '7d' | '30d' | 'all' | 'custom';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      await updateDoc(doc(db, 'users', userId), { role: newRole });

      // Send email notification
      if (userToUpdate?.email) {
        await sendEmail(
          userToUpdate.email,
          'Account Role Updated - Ergo-Hub',
          `
          <div style="font-family: serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #0066CC10; border-radius: 24px;">
            <h2 style="color: #0066CC;">Your Account Role has been Updated</h2>
            <p>Hi ${userToUpdate.displayName || 'there'},</p>
            <p>An administrator has updated your account role on the Ergo-Hub platform.</p>
            <div style="background-color: #F0F8FF; padding: 20px; border-radius: 16px; margin: 20px 0;">
              <p style="margin: 0;"><strong>New Role:</strong> <span style="text-transform: capitalize; font-weight: bold; color: #0066CC;">${newRole}</span></p>
            </div>
            <p>You may need to refresh the application to see the changes reflected in your dashboard.</p>
            <p>If you have any questions regarding this change, please contact our support team.</p>
            <p style="font-style: italic; color: #0066CC60;">Best regards,<br>The Ergo-Hub Team</p>
          </div>
          `
        );
      }

      alert('Role updated successfully! A notification email has been sent.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
      <h3 className="text-xl font-serif text-[#1a1a1a] mb-6 flex items-center gap-2">
        <ShieldCheck size={20} className="text-primary" />
        User Role Management
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-serif text-sm">
          <thead>
            <tr className="border-b border-black/5 text-primary/40 uppercase tracking-widest text-[10px]">
              <th className="pb-4">User</th>
              <th className="pb-4">Current Role</th>
              <th className="pb-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {users.map((u) => (
              <tr key={u.id} className="group">
                <td className="py-4">
                  <p className="text-[#1a1a1a] font-bold">{u.displayName || 'Anonymous'}</p>
                  <p className="text-primary/60 text-xs italic">{u.email}</p>
                </td>
                <td className="py-4">
                  <span className="px-3 py-1 bg-bg rounded-full text-[10px] uppercase font-bold text-primary">
                    {u.role}
                  </span>
                </td>
                <td className="py-4">
                  <select 
                    value={u.role}
                    onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                    className="bg-transparent border-none text-xs text-primary focus:ring-0 cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="ambassador">Ambassador</option>
                    <option value="ot">OT</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { user, profile, isAdmin, isOT } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [preVAS, setPreVAS] = useState(5);
  const [postVAS, setPostVAS] = useState(2);
  const [focusMinutes, setFocusMinutes] = useState(45);
  const [compliance, setCompliance] = useState({
    lumbar: false,
    feet: false,
    neck: false
  });
  const [showLogForm, setShowLogForm] = useState(false);
  
  // Filtering state
  const [filterRange, setFilterRange] = useState<FilterRange>('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    if (!user) return;

    let startDate: string | null = null;
    const now = new Date();

    if (filterRange === '7d') {
      const d = new Date();
      d.setDate(now.getDate() - 7);
      startDate = d.toISOString();
    } else if (filterRange === '30d') {
      const d = new Date();
      d.setDate(now.getDate() - 30);
      startDate = d.toISOString();
    } else if (filterRange === 'custom' && customStart) {
      startDate = new Date(customStart).toISOString();
    }

    let endDate: string | null = null;
    if (filterRange === 'custom' && customEnd) {
      const d = new Date(customEnd);
      d.setHours(23, 59, 59, 999);
      endDate = d.toISOString();
    }

    const constraints: QueryConstraint[] = [
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    ];

    if (startDate) {
      constraints.push(where('createdAt', '>=', startDate));
    }
    if (endDate) {
      constraints.push(where('createdAt', '<=', endDate));
    }
    
    // If "all" and no limit specified, we might want a reasonable limit or none
    if (filterRange === 'all') {
      constraints.push(limit(100));
    }

    const q = query(collection(db, 'pain_logs'), ...constraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const processedLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          painReductionPercent: data.preVAS > 0 ? Math.round(((data.preVAS - data.postVAS) / data.preVAS) * 100) : 0,
          date: new Date(data.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
        };
      }).reverse();
      setLogs(processedLogs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pain_logs');
    });
    return () => unsubscribe();
  }, [user, filterRange, customStart, customEnd]);

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'pain_logs'), {
        userId: user.uid,
        preVAS,
        postVAS,
        focusEnduranceMinutes: focusMinutes,
        lumbarAlignment: compliance.lumbar,
        feetFlat: compliance.feet,
        neckNeutrality: compliance.neck,
        createdAt: new Date().toISOString()
      });
      setShowLogForm(false);
      alert('Log saved!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'pain_logs');
    }
  };

  const isAdminOrOT = isAdmin || isOT;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif text-[#1a1a1a]">Clinical Impact</h2>
          <p className="text-primary/60 font-serif italic">Tracking your ergonomic journey and academic endurance.</p>
        </div>
        {!isAdminOrOT && (
          <button 
            onClick={() => setShowLogForm(true)}
            className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-serif hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            Log Session
          </button>
        )}
      </header>

      {/* Date Filter Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
            <Filter size={18} className="text-primary" />
          </div>
          <h3 className="font-serif text-[#1a1a1a]">Filter Data</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {[
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: 'all', label: 'All Time' },
            { id: 'custom', label: 'Custom Range' },
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setFilterRange(range.id as FilterRange)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-serif transition-all",
                filterRange === range.id 
                  ? "bg-primary text-white shadow-sm" 
                  : "bg-bg text-primary/60 hover:text-primary"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {filterRange === 'custom' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-3 bg-bg p-2 rounded-2xl"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon size={14} className="text-primary/40" />
                <input 
                  type="date" 
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-transparent border-none text-xs font-serif text-primary focus:ring-0 p-0"
                />
              </div>
              <span className="text-primary/20">—</span>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-transparent border-none text-xs font-serif text-primary focus:ring-0 p-0"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-8">
          {isAdmin && <AdminPanel />}
          
          {/* VAS Trend Chart */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-serif text-[#1a1a1a] flex items-center gap-2">
                <Activity size={20} className="text-primary" />
                Pain Reduction Trend (VAS)
              </h3>
              <div className="flex items-center gap-4 text-xs font-serif uppercase tracking-widest text-primary/40">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-primary rounded-full" /> Pre-Ergo</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-primary/30 rounded-full" /> Post-Ergo</div>
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={logs}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0066CC10" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fontFamily: 'serif', fill: '#0066CC60' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    tick={{ fontSize: 10, fontFamily: 'serif', fill: '#0066CC60' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontFamily: 'serif' }}
                  />
                  <Line type="monotone" dataKey="preVAS" stroke="#0066CC" strokeWidth={3} dot={{ r: 4, fill: '#0066CC' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="postVAS" stroke="#0066CC30" strokeWidth={3} dot={{ r: 4, fill: '#0066CC30' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pain Reduction % Chart */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <h3 className="text-lg font-serif text-[#1a1a1a] mb-6 flex items-center gap-2">
                <TrendingDown size={20} className="text-primary" />
                Pain Reduction %
              </h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={logs}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0066CC10" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 9, fontFamily: 'serif', fill: '#0066CC60' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      unit="%"
                      tick={{ fontSize: 9, fontFamily: 'serif', fill: '#0066CC60' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontFamily: 'serif', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="painReductionPercent" stroke="#0066CC" strokeWidth={2} dot={{ r: 3, fill: '#0066CC' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Focus Endurance Trend Chart */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <h3 className="text-lg font-serif text-[#1a1a1a] mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" />
                Focus Endurance Trend
              </h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={logs}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0066CC10" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 9, fontFamily: 'serif', fill: '#0066CC60' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      unit="m"
                      tick={{ fontSize: 9, fontFamily: 'serif', fill: '#0066CC60' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontFamily: 'serif', fontSize: '12px' }}
                    />
                    <Bar dataKey="focusEnduranceMinutes" fill="#0066CC" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <h3 className="text-xl font-serif text-[#1a1a1a] mb-6 flex items-center gap-2">
                <Clock size={20} className="text-primary" />
                Focus Endurance
              </h3>
              <div className="flex items-end gap-4 mb-4">
                <span className="text-5xl font-serif text-[#1a1a1a]">
                  {logs.length > 0 ? Math.round(logs.reduce((acc, log) => acc + log.focusEnduranceMinutes, 0) / logs.length) : 0}
                </span>
                <span className="text-primary/60 font-serif italic mb-2">avg. minutes</span>
              </div>
              <div className="flex items-center gap-2 text-primary bg-primary/5 px-4 py-2 rounded-full w-fit">
                <TrendingUp size={16} />
                <span className="text-xs font-serif font-bold">Deep-work session average</span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <h3 className="text-xl font-serif text-[#1a1a1a] mb-6 flex items-center gap-2">
                <CheckSquare size={20} className="text-primary" />
                Posture Compliance
              </h3>
              <div className="space-y-4">
                {['Lumbar Alignment', 'Feet Flat', 'Neck Neutrality'].map((item, i) => {
                  const key = ['lumbarAlignment', 'feetFlat', 'neckNeutrality'][i];
                  const count = logs.filter(l => l[key]).length;
                  const percent = logs.length > 0 ? Math.round((count / logs.length) * 100) : 0;
                  return (
                    <div key={item}>
                      <div className="flex justify-between text-xs font-serif text-primary/60 mb-1 italic">
                        <span>{item}</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar / Admin View */}
        <div className="space-y-8">
          {isAdminOrOT ? (
            <>
              <div className="bg-primary text-white p-8 rounded-3xl shadow-sm">
                <ShieldCheck size={32} className="mb-4" />
                <h3 className="text-2xl font-serif mb-2">Academic ROI</h3>
                <p className="text-white/60 font-serif italic text-sm mb-6">
                  Correlation between ergonomic health and student retention.
                </p>
                <div className="space-y-4">
                  <div className="bg-white/10 p-4 rounded-2xl">
                    <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Retention Boost</p>
                    <p className="text-2xl font-serif">+12%</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl">
                    <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Satisfaction Score</p>
                    <p className="text-2xl font-serif">4.8/5</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
                <h3 className="text-xl font-serif text-[#1a1a1a] mb-6">Clinical Validation</h3>
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 bg-bg rounded-2xl group hover:bg-primary transition-all">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-primary group-hover:text-white" />
                      <span className="text-sm font-serif text-[#1a1a1a] group-hover:text-white">Posture Best Practices</span>
                    </div>
                    <ChevronRight size={16} className="text-primary/40 group-hover:text-white" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-bg rounded-2xl group hover:bg-primary transition-all">
                    <div className="flex items-center gap-3">
                      <Activity size={18} className="text-primary group-hover:text-white" />
                      <span className="text-sm font-serif text-[#1a1a1a] group-hover:text-white">Health Trend Review</span>
                    </div>
                    <ChevronRight size={16} className="text-primary/40 group-hover:text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <div className="flex items-center gap-3 mb-6">
                <Info size={20} className="text-primary" />
                <h3 className="text-xl font-serif text-[#1a1a1a]">OT Insights</h3>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-bg rounded-2xl">
                  <p className="text-xs font-serif text-primary font-bold mb-2">Pro Tip: Eye Level</p>
                  <p className="text-sm font-serif text-primary/60 italic">
                    Ensure your screen is at eye level using the neck roll. This reduces cervical spine pressure by 30%.
                  </p>
                </div>
                <div className="p-4 bg-bg rounded-2xl">
                  <p className="text-xs font-serif text-primary font-bold mb-2">The 90-90-90 Rule</p>
                  <p className="text-sm font-serif text-primary/60 italic">
                    Hips, knees, and ankles should all be at 90 degrees. Use the Ergo-Kit foot support if needed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Session Modal */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-serif text-[#1a1a1a]">Log Study Session</h3>
              <button onClick={() => setShowLogForm(false)} className="text-primary/40 hover:text-primary">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form className="space-y-8" onSubmit={handleSubmitLog}>
              <div className="space-y-4">
                <label className="block text-xs font-serif uppercase tracking-widest text-primary/60">Pain Level (VAS Scale)</label>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-serif italic mb-2">
                      <span>Before Ergo-Kit</span>
                      <span className="font-bold">{preVAS}/10</span>
                    </div>
                    <input 
                      type="range" min="0" max="10" value={preVAS} 
                      onChange={(e) => setPreVAS(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-bg rounded-full appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-serif italic mb-2">
                      <span>After Ergo-Kit</span>
                      <span className="font-bold">{postVAS}/10</span>
                    </div>
                    <input 
                      type="range" min="0" max="10" value={postVAS} 
                      onChange={(e) => setPostVAS(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-bg rounded-full appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif uppercase tracking-widest text-primary/60 mb-4">Focus Endurance</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" value={focusMinutes} 
                    onChange={(e) => setFocusMinutes(parseInt(e.target.value))}
                    className="w-24 bg-bg border-none rounded-xl px-4 py-3 font-serif text-center"
                  />
                  <span className="text-primary/60 font-serif italic">minutes of deep work</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-serif uppercase tracking-widest text-primary/60">Posture Compliance</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: 'lumbar', label: 'Lumbar Alignment: Lower back supported?' },
                    { key: 'feet', label: 'Feet Flat: Supported to reduce pressure?' },
                    { key: 'neck', label: 'Neck Neutrality: Screen at eye level?' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCompliance({ ...compliance, [item.key]: !compliance[item.key as keyof typeof compliance] })}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                        compliance[item.key as keyof typeof compliance] 
                          ? "bg-primary border-primary text-white" 
                          : "bg-white border-primary/10 text-primary/60"
                      )}
                    >
                      <CheckSquare size={18} />
                      <span className="text-sm font-serif">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button className="w-full bg-primary text-white py-4 rounded-2xl font-serif hover:bg-primary/90 transition-colors">
                Save Log
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
