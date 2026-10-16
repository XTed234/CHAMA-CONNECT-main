import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Chama, Membership, Cycle, Contribution, Fine, Payout } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatKES(amount: number): string {
  return `KES ${Number(amount).toLocaleString('en-KE')}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (hours < 48) return 'Yesterday';
  if (hours < 168) return `${Math.floor(hours / 24)}d ago`;
  return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Chama ───────────────────────────────────────────────────────────────────

export async function createChama(
  chairpersonId: string,
  data: {
    name: string;
    description: string;
    contributionAmount: number;
    contributionDayOfMonth: number;
    fineAmount: number;
    chairpersonName: string;
    chairpersonEmail: string;
  }
): Promise<string> {
  console.log('[Firestore] createChama:', data.name, 'by', chairpersonId);
  const chamaRef = await addDoc(collection(db, 'chamas'), {
    name: data.name,
    description: data.description,
    chairpersonId,
    contributionAmount: data.contributionAmount,
    contributionDayOfMonth: data.contributionDayOfMonth,
    fineAmount: data.fineAmount,
    currency: 'KES',
    createdAt: new Date().toISOString(),
    currentCycleId: null,
    memberCount: 1,
  });

  await addDoc(collection(db, 'memberships'), {
    userId: chairpersonId,
    chamaId: chamaRef.id,
    status: 'active',
    joinedAt: new Date().toISOString(),
    totalContributed: 0,
    outstandingFine: 0,
    userName: data.chairpersonName,
    userEmail: data.chairpersonEmail,
  });

  // Update user role to chairperson
  await setDoc(doc(db, 'users', chairpersonId), { role: 'chairperson' }, { merge: true });

  console.log('[Firestore] createChama success, id:', chamaRef.id);
  return chamaRef.id;
}

export async function requestJoinChama(
  userId: string,
  chamaId: string,
  userName: string,
  userEmail: string
): Promise<void> {
  console.log('[Firestore] requestJoinChama:', userId, '->', chamaId);
  // Check if already a member
  const q = query(
    collection(db, 'memberships'),
    where('userId', '==', userId),
    where('chamaId', '==', chamaId)
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error('You already have a membership request for this chama.');
  }
  await addDoc(collection(db, 'memberships'), {
    userId,
    chamaId,
    status: 'pending',
    joinedAt: new Date().toISOString(),
    totalContributed: 0,
    outstandingFine: 0,
    userName,
    userEmail,
  });
  console.log('[Firestore] requestJoinChama success');
}

export async function approveMember(membershipId: string): Promise<void> {
  console.log('[Firestore] approveMember:', membershipId);
  const memberRef = doc(db, 'memberships', membershipId);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) throw new Error('Membership not found');
  const memberData = memberSnap.data() as Membership;

  await updateDoc(memberRef, { status: 'active' });
  await updateDoc(doc(db, 'chamas', memberData.chamaId), {
    memberCount: increment(1),
  });
  console.log('[Firestore] approveMember success');
}

export async function rejectMember(membershipId: string): Promise<void> {
  console.log('[Firestore] rejectMember:', membershipId);
  await deleteDoc(doc(db, 'memberships', membershipId));
  console.log('[Firestore] rejectMember success');
}

// ─── Contributions ───────────────────────────────────────────────────────────

export async function recordContribution(
  userId: string,
  chamaId: string,
  cycleId: string,
  amount: number,
  userName: string
): Promise<void> {
  console.log('[Firestore] recordContribution:', userName, amount, 'KES');

  // Check existing contribution for this cycle
  const q = query(
    collection(db, 'contributions'),
    where('userId', '==', userId),
    where('cycleId', '==', cycleId)
  );
  const existing = await getDocs(q);

  const chamaDoc = await getDoc(doc(db, 'chamas', chamaId));
  const chamaData = chamaDoc.data() as Chama;
  const required = chamaData.contributionAmount;

  let totalPaid = amount;
  let existingContribId: string | null = null;

  if (!existing.empty) {
    const existingContrib = existing.docs[0];
    existingContribId = existingContrib.id;
    totalPaid = (existingContrib.data().amount || 0) + amount;
  }

  const status = totalPaid >= required ? 'paid' : 'partial';

  if (existingContribId) {
    await updateDoc(doc(db, 'contributions', existingContribId), {
      amount: totalPaid,
      status,
      date: new Date().toISOString(),
    });
  } else {
    await addDoc(collection(db, 'contributions'), {
      userId,
      chamaId,
      cycleId,
      amount,
      date: new Date().toISOString(),
      status,
      userName,
    });
  }

  // Update membership total
  const memberQ = query(
    collection(db, 'memberships'),
    where('userId', '==', userId),
    where('chamaId', '==', chamaId)
  );
  const memberSnap = await getDocs(memberQ);
  if (!memberSnap.empty) {
    await updateDoc(doc(db, 'memberships', memberSnap.docs[0].id), {
      totalContributed: increment(amount),
    });
  }

  // Update cycle total
  await updateDoc(doc(db, 'cycles', cycleId), {
    totalContributions: increment(amount),
  });

  console.log('[Firestore] recordContribution success, status:', status);
}

// ─── Cycles ──────────────────────────────────────────────────────────────────

export async function startNewCycle(chamaId: string, memberIds: string[]): Promise<string> {
  console.log('[Firestore] startNewCycle for chama:', chamaId, 'members:', memberIds.length);

  // Get current cycle number
  const cyclesQ = query(
    collection(db, 'cycles'),
    where('chamaId', '==', chamaId),
    orderBy('cycleNumber', 'desc')
  );
  const cyclesSnap = await getDocs(cyclesQ);
  const lastCycleNumber = cyclesSnap.empty ? 0 : (cyclesSnap.docs[0].data().cycleNumber || 0);

  const shuffled = fisherYates(memberIds);
  const chamaDoc = await getDoc(doc(db, 'chamas', chamaId));
  const chamaData = chamaDoc.data() as Chama;
  const payoutAmount = chamaData.contributionAmount * memberIds.length;

  const cycleRef = await addDoc(collection(db, 'cycles'), {
    chamaId,
    cycleNumber: lastCycleNumber + 1,
    startDate: new Date().toISOString(),
    status: 'active',
    payoutQueue: shuffled,
    completedPayouts: [],
    totalContributions: 0,
    payoutAmount,
  });

  await updateDoc(doc(db, 'chamas', chamaId), {
    currentCycleId: cycleRef.id,
  });

  console.log('[Firestore] startNewCycle success, cycleId:', cycleRef.id);
  return cycleRef.id;
}

// ─── Payouts ─────────────────────────────────────────────────────────────────

export async function simulatePayout(
  cycleId: string,
  chamaId: string,
  userId: string,
  amount: number,
  userName: string,
  cycleNumber: number
): Promise<void> {
  console.log('[Firestore] simulatePayout:', userName, amount, 'KES, cycle:', cycleNumber);

  await runTransaction(db, async (transaction) => {
    const cycleRef = doc(db, 'cycles', cycleId);
    const cycleSnap = await transaction.get(cycleRef);
    if (!cycleSnap.exists()) throw new Error('Cycle not found');

    const cycleData = cycleSnap.data() as Cycle;
    const nextIndex = cycleData.completedPayouts.length;
    const expectedUserId = cycleData.payoutQueue[nextIndex];

    if (expectedUserId !== userId) {
      throw new Error('This member is not next in the payout queue.');
    }

    const newCompleted = [...cycleData.completedPayouts, userId];
    const isLastPayout = newCompleted.length === cycleData.payoutQueue.length;

    transaction.update(cycleRef, {
      completedPayouts: newCompleted,
      ...(isLastPayout ? { status: 'completed', endDate: new Date().toISOString() } : {}),
    });

    // Create payout record
    const payoutRef = doc(collection(db, 'payouts'));
    transaction.set(payoutRef, {
      userId,
      chamaId,
      cycleId,
      amount,
      date: new Date().toISOString(),
      cycleNumber,
      userName,
    });

    console.log('[Firestore] simulatePayout transaction complete, isLast:', isLastPayout);
  });

  // If cycle completed, start new one
  const cycleSnap = await getDoc(doc(db, 'cycles', cycleId));
  if (cycleSnap.exists() && cycleSnap.data().status === 'completed') {
    console.log('[Firestore] Cycle completed, fetching active members for new cycle');
    const membersQ = query(
      collection(db, 'memberships'),
      where('chamaId', '==', chamaId),
      where('status', '==', 'active')
    );
    const membersSnap = await getDocs(membersQ);
    const memberIds = membersSnap.docs.map((d) => d.data().userId as string);
    if (memberIds.length > 0) {
      await startNewCycle(chamaId, memberIds);
    }
  }
}

// ─── Fines ───────────────────────────────────────────────────────────────────

export async function applyFine(
  userId: string,
  chamaId: string,
  cycleId: string,
  amount: number,
  reason: string,
  userName: string
): Promise<void> {
  console.log('[Firestore] applyFine:', userName, amount, 'KES, reason:', reason);
  await addDoc(collection(db, 'fines'), {
    userId,
    chamaId,
    cycleId,
    amount,
    reason,
    appliedAt: new Date().toISOString(),
    status: 'outstanding',
    userName,
  });

  const memberQ = query(
    collection(db, 'memberships'),
    where('userId', '==', userId),
    where('chamaId', '==', chamaId)
  );
  const memberSnap = await getDocs(memberQ);
  if (!memberSnap.empty) {
    await updateDoc(doc(db, 'memberships', memberSnap.docs[0].id), {
      outstandingFine: increment(amount),
    });
  }
  console.log('[Firestore] applyFine success');
}

export async function markFinePaid(fineId: string, userId: string, chamaId: string, amount: number): Promise<void> {
  console.log('[Firestore] markFinePaid:', fineId);
  await updateDoc(doc(db, 'fines', fineId), { status: 'paid' });

  const memberQ = query(
    collection(db, 'memberships'),
    where('userId', '==', userId),
    where('chamaId', '==', chamaId)
  );
  const memberSnap = await getDocs(memberQ);
  if (!memberSnap.empty) {
    const current = memberSnap.docs[0].data().outstandingFine || 0;
    await updateDoc(doc(db, 'memberships', memberSnap.docs[0].id), {
      outstandingFine: Math.max(0, current - amount),
    });
  }
  console.log('[Firestore] markFinePaid success');
}

export async function checkAndApplyFines(chamaId: string): Promise<void> {
  console.log('[Firestore] checkAndApplyFines for chama:', chamaId);
  const chamaDoc = await getDoc(doc(db, 'chamas', chamaId));
  if (!chamaDoc.exists()) return;
  const chamaData = chamaDoc.data() as Chama;
  if (!chamaData.currentCycleId) return;

  const cycleDoc = await getDoc(doc(db, 'cycles', chamaData.currentCycleId));
  if (!cycleDoc.exists()) return;
  const cycleData = cycleDoc.data() as Cycle;

  const today = new Date();
  const dueDate = new Date(today.getFullYear(), today.getMonth(), chamaData.contributionDayOfMonth);
  if (today <= dueDate) {
    console.log('[Firestore] checkAndApplyFines: not past due date yet');
    return;
  }

  const membersQ = query(
    collection(db, 'memberships'),
    where('chamaId', '==', chamaId),
    where('status', '==', 'active')
  );
  const membersSnap = await getDocs(membersQ);

  for (const memberDoc of membersSnap.docs) {
    const memberData = memberDoc.data() as Membership;
    const contribQ = query(
      collection(db, 'contributions'),
      where('userId', '==', memberData.userId),
      where('cycleId', '==', chamaData.currentCycleId)
    );
    const contribSnap = await getDocs(contribQ);
    const totalPaid = contribSnap.empty ? 0 : (contribSnap.docs[0].data().amount || 0);

    if (totalPaid < chamaData.contributionAmount) {
      // Check if fine already exists
      const fineQ = query(
        collection(db, 'fines'),
        where('userId', '==', memberData.userId),
        where('cycleId', '==', chamaData.currentCycleId)
      );
      const fineSnap = await getDocs(fineQ);
      if (fineSnap.empty) {
        await applyFine(
          memberData.userId,
          chamaId,
          chamaData.currentCycleId,
          chamaData.fineAmount,
          'Late contribution',
          memberData.userName
        );
      }
    }
  }
  console.log('[Firestore] checkAndApplyFines complete');
}

// ─── Membership lifecycle ─────────────────────────────────────────────────────

export async function requestExit(membershipId: string): Promise<void> {
  console.log('[Firestore] requestExit:', membershipId);
  await updateDoc(doc(db, 'memberships', membershipId), {
    status: 'exit_requested',
    exitRequestedAt: new Date().toISOString(),
  });
  console.log('[Firestore] requestExit success');
}

export async function processExit(membershipId: string): Promise<void> {
  console.log('[Firestore] processExit:', membershipId);
  const memberRef = doc(db, 'memberships', membershipId);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) throw new Error('Membership not found');
  const memberData = memberSnap.data() as Membership;

  await updateDoc(memberRef, {
    status: 'exited',
    exitedAt: new Date().toISOString(),
  });
  await updateDoc(doc(db, 'chamas', memberData.chamaId), {
    memberCount: increment(-1),
  });
  console.log('[Firestore] processExit success');
}

// ─── Demo Fallback Data for UI Preview ───────────────────────────────────────

const MOCK_CYCLE: Cycle = {
  id: 'cycle_demo_1',
  chamaId: 'chama_demo_1',
  cycleNumber: 3,
  startDate: '2025-03-01T00:00:00.000Z',
  status: 'active',
  payoutQueue: [
    'demo_user_chairperson',
    'demo_mem_2',
    'demo_mem_3',
    'demo_mem_4',
    'demo_mem_5',
    'demo_mem_6',
  ],
  completedPayouts: ['demo_mem_2'],
  totalContributions: 20000,
  payoutAmount: 30000,
};

const MOCK_MEMBERS: Membership[] = [
  {
    id: 'mem_demo_1',
    userId: 'demo_user_chairperson',
    chamaId: 'chama_demo_1',
    status: 'active',
    joinedAt: '2025-01-01T00:00:00.000Z',
    totalContributed: 30000,
    outstandingFine: 0,
    userName: 'Faith Wanjiku',
    userEmail: 'faith.wanjiku@connectchama.ke',
  },
  {
    id: 'mem_demo_2',
    userId: 'demo_mem_2',
    chamaId: 'chama_demo_1',
    status: 'active',
    joinedAt: '2025-01-02T00:00:00.000Z',
    totalContributed: 30000,
    outstandingFine: 0,
    userName: 'Grace Muthoni',
    userEmail: 'grace.m@example.com',
  },
  {
    id: 'mem_demo_3',
    userId: 'demo_mem_3',
    chamaId: 'chama_demo_1',
    status: 'active',
    joinedAt: '2025-01-05T00:00:00.000Z',
    totalContributed: 25000,
    outstandingFine: 200,
    userName: 'Mercy Achieng',
    userEmail: 'mercy.a@example.com',
  },
  {
    id: 'mem_demo_4',
    userId: 'demo_mem_4',
    chamaId: 'chama_demo_1',
    status: 'active',
    joinedAt: '2025-01-10T00:00:00.000Z',
    totalContributed: 30000,
    outstandingFine: 0,
    userName: 'David Kiprono',
    userEmail: 'david.k@example.com',
  },
  {
    id: 'mem_demo_5',
    userId: 'demo_mem_5',
    chamaId: 'chama_demo_1',
    status: 'pending',
    joinedAt: '2025-03-02T00:00:00.000Z',
    totalContributed: 0,
    outstandingFine: 0,
    userName: 'Brian Otieno',
    userEmail: 'brian.o@example.com',
  },
  {
    id: 'mem_demo_6',
    userId: 'demo_mem_6',
    chamaId: 'chama_demo_1',
    status: 'active',
    joinedAt: '2025-01-15T00:00:00.000Z',
    totalContributed: 20000,
    outstandingFine: 0,
    userName: 'Esther Njeri',
    userEmail: 'esther.n@example.com',
  },
];

const MOCK_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'contrib_demo_1',
    userId: 'demo_user_chairperson',
    chamaId: 'chama_demo_1',
    cycleId: 'cycle_demo_1',
    amount: 5000,
    date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: 'paid',
    userName: 'Faith Wanjiku',
  },
  {
    id: 'contrib_demo_2',
    userId: 'demo_mem_2',
    chamaId: 'chama_demo_1',
    cycleId: 'cycle_demo_1',
    amount: 5000,
    date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    status: 'paid',
    userName: 'Grace Muthoni',
  },
  {
    id: 'contrib_demo_3',
    userId: 'demo_mem_3',
    chamaId: 'chama_demo_1',
    cycleId: 'cycle_demo_1',
    amount: 3000,
    date: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    status: 'partial',
    userName: 'Mercy Achieng',
  },
  {
    id: 'contrib_demo_4',
    userId: 'demo_mem_4',
    chamaId: 'chama_demo_1',
    cycleId: 'cycle_demo_1',
    amount: 5000,
    date: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    status: 'paid',
    userName: 'David Kiprono',
  },
];

const MOCK_FINES: Fine[] = [
  {
    id: 'fine_demo_1',
    userId: 'demo_mem_3',
    chamaId: 'chama_demo_1',
    cycleId: 'cycle_demo_1',
    amount: 200,
    reason: 'Late contribution for Cycle 2',
    appliedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    status: 'outstanding',
    userName: 'Mercy Achieng',
  },
];

const MOCK_PAYOUTS: Payout[] = [
  {
    id: 'payout_demo_1',
    userId: 'demo_mem_2',
    chamaId: 'chama_demo_1',
    cycleId: 'cycle_demo_1',
    amount: 30000,
    date: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    cycleNumber: 2,
    userName: 'Grace Muthoni',
  },
];

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getChamaMembers(chamaId: string): Promise<Membership[]> {
  console.log('[Firestore] getChamaMembers:', chamaId);
  try {
    if (chamaId.startsWith('chama_demo')) return MOCK_MEMBERS;
    const q = query(collection(db, 'memberships'), where('chamaId', '==', chamaId));
    const snap = await getDocs(q);
    if (snap.empty) return MOCK_MEMBERS;
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Membership));
  } catch (err) {
    console.warn('[Firestore] Error getting members, using mock:', err);
    return MOCK_MEMBERS;
  }
}

export async function getActiveCycle(chamaId: string): Promise<Cycle | null> {
  try {
    if (chamaId.startsWith('chama_demo')) return MOCK_CYCLE;
    const chamaDoc = await getDoc(doc(db, 'chamas', chamaId));
    if (!chamaDoc.exists()) return MOCK_CYCLE;
    const chamaData = chamaDoc.data() as Chama;
    if (!chamaData.currentCycleId) return MOCK_CYCLE;
    const cycleDoc = await getDoc(doc(db, 'cycles', chamaData.currentCycleId));
    if (!cycleDoc.exists()) return MOCK_CYCLE;
    return { id: cycleDoc.id, ...cycleDoc.data() } as Cycle;
  } catch (err) {
    console.warn('[Firestore] Error getting active cycle, using mock:', err);
    return MOCK_CYCLE;
  }
}

export async function getUserContributions(userId: string, chamaId: string): Promise<Contribution[]> {
  console.log('[Firestore] getUserContributions:', userId);
  try {
    if (chamaId.startsWith('chama_demo')) {
      const existing = MOCK_CONTRIBUTIONS.filter((c) => c.userId === userId);
      if (existing.length > 0) return existing;
      return [
        {
          id: `contrib_${userId}`,
          userId: userId,
          chamaId: 'chama_demo_1',
          cycleId: 'cycle_demo_1',
          amount: 5000,
          date: new Date().toISOString(),
          status: 'paid',
          userName: 'You',
        },
      ];
    }
    const q = query(
      collection(db, 'contributions'),
      where('userId', '==', userId),
      where('chamaId', '==', chamaId),
      orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return [
        {
          id: `contrib_${userId}`,
          userId: userId,
          chamaId: 'chama_demo_1',
          cycleId: 'cycle_demo_1',
          amount: 5000,
          date: new Date().toISOString(),
          status: 'paid',
          userName: 'You',
        },
      ];
    }
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Contribution));
  } catch (err) {
    console.warn('[Firestore] Error getting user contribs, using mock:', err);
    return [
      {
        id: `contrib_${userId}`,
        userId: userId,
        chamaId: 'chama_demo_1',
        cycleId: 'cycle_demo_1',
        amount: 5000,
        date: new Date().toISOString(),
        status: 'paid',
        userName: 'You',
      },
    ];
  }
}

export async function getChamaContributions(chamaId: string, cycleId?: string): Promise<Contribution[]> {
  console.log('[Firestore] getChamaContributions:', chamaId);
  try {
    if (chamaId.startsWith('chama_demo')) return MOCK_CONTRIBUTIONS;
    let q;
    if (cycleId) {
      q = query(
        collection(db, 'contributions'),
        where('chamaId', '==', chamaId),
        where('cycleId', '==', cycleId),
        orderBy('date', 'desc')
      );
    } else {
      q = query(
        collection(db, 'contributions'),
        where('chamaId', '==', chamaId),
        orderBy('date', 'desc')
      );
    }
    const snap = await getDocs(q);
    if (snap.empty) return MOCK_CONTRIBUTIONS;
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Contribution));
  } catch (err) {
    console.warn('[Firestore] Error getting chama contribs, using mock:', err);
    return MOCK_CONTRIBUTIONS;
  }
}

export async function getUserFines(userId: string, chamaId: string): Promise<Fine[]> {
  console.log('[Firestore] getUserFines:', userId);
  try {
    if (chamaId.startsWith('chama_demo')) return MOCK_FINES.filter((f) => f.userId === userId);
    const q = query(
      collection(db, 'fines'),
      where('userId', '==', userId),
      where('chamaId', '==', chamaId),
      orderBy('appliedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Fine));
  } catch (err) {
    return MOCK_FINES.filter((f) => f.userId === userId);
  }
}

export async function getChamaFines(chamaId: string): Promise<Fine[]> {
  console.log('[Firestore] getChamaFines:', chamaId);
  try {
    if (chamaId.startsWith('chama_demo')) return MOCK_FINES;
    const q = query(
      collection(db, 'fines'),
      where('chamaId', '==', chamaId),
      orderBy('appliedAt', 'desc')
    );
    const snap = await getDocs(q);
    if (snap.empty) return MOCK_FINES;
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Fine));
  } catch (err) {
    return MOCK_FINES;
  }
}

export async function getChamaPayouts(chamaId: string): Promise<Payout[]> {
  console.log('[Firestore] getChamaPayouts:', chamaId);
  try {
    if (chamaId.startsWith('chama_demo')) return MOCK_PAYOUTS;
    const q = query(
      collection(db, 'payouts'),
      where('chamaId', '==', chamaId),
      orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    if (snap.empty) return MOCK_PAYOUTS;
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Payout));
  } catch (err) {
    return MOCK_PAYOUTS;
  }
}

export async function getAllChamas(): Promise<Chama[]> {
  console.log('[Firestore] getAllChamas');
  const snap = await getDocs(collection(db, 'chamas'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Chama));
}
