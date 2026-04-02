import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAuthReady: boolean;
  isAdmin: boolean;
  isOT: boolean;
  isAmbassador: boolean;
  isStudent: boolean;
  isPremium: boolean;
  logout: () => void;
  login: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  isAdmin: false,
  isOT: false,
  isAmbassador: false,
  isStudent: false,
  isPremium: false,
  logout: () => {},
  login: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>({
    uid: 'dummy-user-id',
    email: 'patient@ergo-hub.com',
    displayName: 'Patient User',
    emailVerified: true
  });
  const [profile, setProfile] = useState<any>({
    uid: 'dummy-user-id',
    email: 'patient@ergo-hub.com',
    displayName: 'Patient User',
    role: 'admin',
    isPremium: true,
    createdAt: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(true);

  const isAdmin = profile?.role === 'admin' || user?.email === 'patient@ergo-hub.com';
  const isOT = profile?.role === 'ot';
  const isAmbassador = profile?.role === 'ambassador';
  const isStudent = profile?.role === 'student';
  const isPremium = profile?.isPremium === true;

  const logout = () => {
    setUser(null);
    setProfile(null);
  };

  const login = () => {
    setUser({
      uid: 'dummy-user-id',
      email: 'patient@ergo-hub.com',
      displayName: 'Patient User',
      emailVerified: true
    });
    setProfile({
      uid: 'dummy-user-id',
      email: 'patient@ergo-hub.com',
      displayName: 'Patient User',
      role: 'admin',
      isPremium: true,
      createdAt: new Date().toISOString(),
    });
  };

  useEffect(() => {
    // We are in dummy mode, so we don't need to listen to real auth changes
    // But we keep the connection test for debugging if needed
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, '_connection_test_', 'ping'));
      } catch (error) {
        // Silently fail connection test in dummy mode
      }
    };
    testConnection();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAuthReady,
      isAdmin,
      isOT,
      isAmbassador,
      isStudent,
      isPremium,
      logout,
      login
    }}>
      {children}
    </AuthContext.Provider>
  );
};
