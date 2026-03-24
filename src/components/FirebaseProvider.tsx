import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

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
});

export const useAuth = () => useContext(AuthContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const isAdmin = profile?.role === 'admin' || user?.email === 'chrysolite77ci@gmail.com';
  const isOT = profile?.role === 'ot';
  const isAmbassador = profile?.role === 'ambassador';
  const isStudent = profile?.role === 'student';
  const isPremium = profile?.isPremium === true;

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Initial check and creation if missing
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          const newProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            role: 'student',
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, newProfile);
        }

        // Listen for real-time updates
        unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data());
          }
          setLoading(false);
          setIsAuthReady(true);
        }, (error) => {
          console.error("Profile sync error:", error);
          setLoading(false);
          setIsAuthReady(true);
        });
      } else {
        setProfile(null);
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
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
      isPremium
    }}>
      {children}
    </AuthContext.Provider>
  );
};
