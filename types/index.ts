export type MembershipStatus = 'pending' | 'active' | 'exit_requested' | 'exited';
export type PayoutStatus = 'waiting' | 'next' | 'paid';
export type ContributionStatus = 'paid' | 'partial' | 'unpaid';
export type FineStatus = 'outstanding' | 'paid';
export type UserRole = 'member' | 'chairperson';

export interface User {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt: string;
}

export interface Chama {
  id: string;
  name: string;
  description: string;
  chairpersonId: string;
  contributionAmount: number;
  contributionDayOfMonth: number;
  fineAmount: number;
  currency: string;
  createdAt: string;
  currentCycleId: string | null;
  memberCount: number;
}

export interface Membership {
  id: string;
  userId: string;
  chamaId: string;
  status: MembershipStatus;
  joinedAt: string;
  exitRequestedAt?: string;
  exitedAt?: string;
  totalContributed: number;
  outstandingFine: number;
  userName: string;
  userEmail: string;
}

export interface Cycle {
  id: string;
  chamaId: string;
  cycleNumber: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed';
  payoutQueue: string[];
  completedPayouts: string[];
  totalContributions: number;
  payoutAmount: number;
}

export interface Contribution {
  id: string;
  userId: string;
  chamaId: string;
  cycleId: string;
  amount: number;
  date: string;
  status: ContributionStatus;
  userName: string;
}

export interface Fine {
  id: string;
  userId: string;
  chamaId: string;
  cycleId: string;
  amount: number;
  reason: string;
  appliedAt: string;
  status: FineStatus;
  relatedContributionId?: string;
  userName: string;
}

export interface Payout {
  id: string;
  userId: string;
  chamaId: string;
  cycleId: string;
  amount: number;
  date: string;
  cycleNumber: number;
  userName: string;
}
