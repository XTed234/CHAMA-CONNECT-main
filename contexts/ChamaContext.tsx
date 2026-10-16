import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Chama, Membership } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface ChamaContextType {
  userChama: Chama | null;
  membership: Membership | null;
  chamaLoading: boolean;
  loadChama: () => Promise<void>;
  refreshChama: () => void;
}

const ChamaContext = createContext<ChamaContextType | null>(null);

// Demo Chama & Membership to preview all app UI screens
export const DEMO_CHAMA: Chama = {
  id: 'chama_demo_1',
  name: 'Tumaini Merry-Go-Round',
  description: 'Monthly savings and rotating payout Chama',
  chairpersonId: 'demo_user_chairperson',
  contributionAmount: 5000,
  contributionDayOfMonth: 15,
  fineAmount: 200,
  currency: 'KES',
  createdAt: '2025-01-01T00:00:00.000Z',
  currentCycleId: 'cycle_demo_1',
  memberCount: 6,
};

export const DEMO_MEMBERSHIP: Membership = {
  id: 'mem_demo_1',
  userId: 'demo_user_chairperson',
  chamaId: 'chama_demo_1',
  status: 'active',
  joinedAt: '2025-01-01T00:00:00.000Z',
  totalContributed: 30000,
  outstandingFine: 0,
  userName: 'Faith Wanjiku',
  userEmail: 'faith.wanjiku@connectchama.ke',
};

export function ChamaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Initialized with demo data so UI is immediately visible
  const [userChama, setUserChama] = useState<Chama | null>(DEMO_CHAMA);
  const [membership, setMembership] = useState<Membership | null>(DEMO_MEMBERSHIP);
  const [chamaLoading, setChamaLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadChama = useCallback(async () => {
    if (!user) {
      setUserChama(null);
      setMembership(null);
      return;
    }
    // Reflect user's profile information in the chama membership
    const activeChama: Chama = {
      ...DEMO_CHAMA,
      chairpersonId: user.role === 'chairperson' ? user.uid : DEMO_CHAMA.chairpersonId,
    };
    const activeMembership: Membership = {
      ...DEMO_MEMBERSHIP,
      userId: user.uid,
      userName: user.fullName,
      userEmail: user.email,
    };
    setUserChama(activeChama);
    setMembership(activeMembership);
  }, [user]);

  const refreshChama = useCallback(() => {
    console.log('[ChamaContext] refreshChama triggered');
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    loadChama();
  }, [loadChama, refreshKey]);

  // Real-time listener for chama updates
  useEffect(() => {
    if (!userChama?.id) return;
    console.log('[ChamaContext] Setting up real-time listener for chama:', userChama.id);
    const unsub = onSnapshot(doc(db, 'chamas', userChama.id), (snap) => {
      if (snap.exists()) {
        setUserChama({ id: snap.id, ...snap.data() } as Chama);
      }
    });
    return unsub;
  }, [userChama?.id]);

  // Real-time listener for membership updates
  useEffect(() => {
    if (!membership?.id) return;
    const unsub = onSnapshot(doc(db, 'memberships', membership.id), (snap) => {
      if (snap.exists()) {
        setMembership({ id: snap.id, ...snap.data() } as Membership);
      }
    });
    return unsub;
  }, [membership?.id]);

  return (
    <ChamaContext.Provider value={{ userChama, membership, chamaLoading, loadChama, refreshChama }}>
      {children}
    </ChamaContext.Provider>
  );
}

export function useChama() {
  const ctx = useContext(ChamaContext);
  if (!ctx) throw new Error('useChama must be used within ChamaProvider');
  return ctx;
}
