import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasSeenIntro: boolean;
  setHasSeenIntro: (seen: boolean) => Promise<void>;
  signIn: (email: string, password: string, nameOverride?: string, roleOverride?: UserRole) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole, phoneNumber?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const DEFAULT_USER: User = {
  uid: 'demo_user_1',
  fullName: 'Faith Wanjiku',
  email: 'faith.wanjiku@connectchama.ke',
  phoneNumber: '+254 712 345 678',
  role: 'chairperson',
  createdAt: '2025-01-01T00:00:00.000Z',
};

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY_USER = '@connectchama_user';
const STORAGE_KEY_INTRO = '@connectchama_has_seen_intro';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hasSeenIntro, setHasSeenIntroState] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore user & intro state on app mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const [storedUserJson, storedIntro] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_USER),
          AsyncStorage.getItem(STORAGE_KEY_INTRO),
        ]);

        if (storedUserJson) {
          const parsed = JSON.parse(storedUserJson) as User;
          setUser(parsed);
        }
        if (storedIntro === 'true') {
          setHasSeenIntroState(true);
        }
      } catch (err) {
        console.error('[AuthContext] Error reading from AsyncStorage:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const setHasSeenIntro = async (seen: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_INTRO, seen ? 'true' : 'false');
      setHasSeenIntroState(seen);
    } catch (err) {
      console.error('[AuthContext] Error setting hasSeenIntro:', err);
    }
  };

  const signIn = async (
    email: string,
    password: string,
    nameOverride?: string,
    roleOverride?: UserRole
  ) => {
    console.log('[AuthContext] signIn with:', email);
    // Derive a clean full name from the email if not explicitly provided
    let derivedName = nameOverride?.trim();
    if (!derivedName) {
      const emailPrefix = email.split('@')[0] || 'User';
      derivedName = emailPrefix
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }

    const authenticatedUser: User = {
      uid: 'usr_' + Math.random().toString(36).substr(2, 9),
      fullName: derivedName || 'Chama Member',
      email: email.trim().toLowerCase(),
      phoneNumber: user?.phoneNumber || '+254 700 000 000',
      role: roleOverride || (email.toLowerCase().includes('chair') ? 'chairperson' : 'member'),
      createdAt: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authenticatedUser));
      await AsyncStorage.setItem(STORAGE_KEY_INTRO, 'true');
      setHasSeenIntroState(true);
      setUser(authenticatedUser);
      console.log('[AuthContext] signIn success, user profile updated:', authenticatedUser);
    } catch (err) {
      console.error('[AuthContext] Error storing signed-in user:', err);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'member',
    phoneNumber?: string
  ) => {
    console.log('[AuthContext] signUp with:', { fullName, email, role, phoneNumber });
    const newUser: User = {
      uid: 'usr_' + Date.now(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber?.trim() || undefined,
      role: role,
      createdAt: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      await AsyncStorage.setItem(STORAGE_KEY_INTRO, 'true');
      setHasSeenIntroState(true);
      setUser(newUser);
      console.log('[AuthContext] signUp success, new profile active:', newUser);
    } catch (err) {
      console.error('[AuthContext] Error saving registered user:', err);
    }
  };

  const signOut = async () => {
    console.log('[AuthContext] signOut');
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_USER);
      setUser(null);
    } catch (err) {
      console.error('[AuthContext] Error clearing user during signOut:', err);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    try {
      await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
      setUser(updated);
      console.log('[AuthContext] Profile updated:', updated);
    } catch (err) {
      console.error('[AuthContext] Error updating profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasSeenIntro,
        setHasSeenIntro,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
