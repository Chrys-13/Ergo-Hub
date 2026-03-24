import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';
import { Login } from './components/Login';
import { Marketplace } from './components/Marketplace';
import { AmbassadorPortal } from './components/AmbassadorPortal';
import { Dashboard } from './components/Dashboard';
import { UserProfile } from './components/UserProfile';
import { Premium } from './components/Premium';
import { ShoppingBag, Users, LayoutDashboard, LogOut, Menu, X, User, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { cn } from './lib/utils';

const Navigation = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { path: '/', label: 'Marketplace', icon: ShoppingBag },
    { path: '/ambassador', label: 'Ambassador', icon: Users },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/premium', label: 'Premium', icon: Crown },
  ];

  const handleLogout = () => signOut(auth);

  return (
    <nav className="bg-white border-b border-primary/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-serif text-xl italic">E</span>
              </div>
              <span className="text-xl font-serif text-[#1a1a1a] hidden sm:block">The Ergo-Hub</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 text-sm font-serif transition-colors py-2 px-4 rounded-full",
                  location.pathname === item.path
                    ? "bg-primary text-white"
                    : "text-primary/60 hover:text-primary hover:bg-primary/5"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
            <div className="h-6 w-px bg-primary/10 mx-2" />
            <div className="flex items-center gap-4">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-serif text-[#1a1a1a]">{profile?.displayName}</p>
                <p className="text-xs font-serif text-primary/60 italic capitalize">{profile?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-primary/60 hover:text-primary transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-primary/60 hover:text-primary"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-primary/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-serif",
                    location.pathname === item.path
                      ? "bg-primary text-white"
                      : "text-primary/60"
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-primary/60 font-serif"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/ambassador" element={<AmbassadorPortal />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/premium" element={<Premium />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <Router>
        <AppContent />
      </Router>
    </FirebaseProvider>
  );
}
