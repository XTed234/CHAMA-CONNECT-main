import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TrendingUp,
  Wallet,
  AlertTriangle,
  RotateCcw,
  Users,
  CheckCircle,
  Clock,
  Plus,
  CreditCard,
  List,
  Bell,
  UserPlus,
  Play,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChama } from '@/contexts/ChamaContext';
import { colors } from '@/theme/colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StatusBadge } from '@/components/StatusBadge';
import { MemberAvatar } from '@/components/MemberAvatar';
import { AppLogo } from '@/components/AppLogo';
import { ContributionProgressBar } from '@/components/ContributionProgressBar';
import { SkeletonDashboard } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import {
  getActiveCycle,
  getChamaMembers,
  getUserContributions,
  getChamaContributions,
  getChamaFines,
  formatKES,
  formatDate,
} from '@/utils/firestore';
import { Cycle, Membership, Contribution, Fine } from '@/types';

function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

const cardStyle = {
  backgroundColor: colors.surface,
  borderRadius: 16,
  padding: 16,
  borderWidth: 1,
  borderColor: colors.border,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { userChama, membership, chamaLoading, refreshChama } = useChama();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [myContributions, setMyContributions] = useState<Contribution[]>([]);
  const [allContributions, setAllContributions] = useState<Contribution[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isChairperson = user?.role === 'chairperson';

  const loadData = useCallback(async () => {
    if (!userChama || !user) return;
    console.log('[Home] Loading dashboard data for chama:', userChama.id);
    setDataLoading(true);
    try {
      const [cycleData, membersData] = await Promise.all([
        getActiveCycle(userChama.id),
        getChamaMembers(userChama.id),
      ]);
      let activeCycle = cycleData;
      let activeMembers = membersData;
      if (activeCycle && user && !activeCycle.payoutQueue.includes(user.uid)) {
        activeCycle = {
          ...activeCycle,
          payoutQueue: [user.uid, ...activeCycle.payoutQueue],
        };
      }
      if (activeMembers && user && membership && !activeMembers.some((m) => m.userId === user.uid)) {
        activeMembers = [membership, ...activeMembers];
      }
      setCycle(activeCycle);
      setMembers(activeMembers);

      const [myContribs, allContribs, finesData] = await Promise.all([
        getUserContributions(user.uid, userChama.id),
        getChamaContributions(userChama.id, activeCycle?.id),
        getChamaFines(userChama.id),
      ]);
      setMyContributions(myContribs);
      setAllContributions(allContribs);
      setFines(finesData);
    } catch (err) {
      console.error('[Home] loadData error:', err);
    } finally {
      setDataLoading(false);
    }
  }, [userChama, user, isChairperson]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    console.log('[Home] Pull to refresh');
    setRefreshing(true);
    refreshChama();
    await loadData();
    setRefreshing(false);
  }, [loadData, refreshChama]);

  if (!user) return null;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const greetingText = greeting();
  const firstName = user.fullName.split(' ')[0];

  // ─── MEMBER DASHBOARD ────────────────────────────────────────────────────────

  if (!isChairperson) {
    const currentCycleContrib = myContributions.find((c) => c.cycleId === cycle?.id);
    const paidAmount = currentCycleContrib?.amount || 0;
    const requiredAmount = userChama?.contributionAmount || 0;
    const payoutPosition = cycle
      ? cycle.payoutQueue.indexOf(user.uid) + 1
      : 0;
    const isNextPayout = cycle
      ? cycle.payoutQueue[cycle.completedPayouts.length] === user.uid
      : false;
    const payoutStatusText = isNextPayout ? 'Next' : payoutPosition > 0 ? `#${payoutPosition}` : '—';
    const outstandingFine = membership?.outstandingFine || 0;
    const totalContributed = membership?.totalContributed || 0;

    const pendingMembers = members.filter((m) => m.status === 'pending');

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            paddingBottom: 20,
            backgroundColor: colors.forest,
          }}
        >
          {/* Brand Row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <AppLogo size={18} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: colors.forest,
                  letterSpacing: 0.3,
                  fontFamily: 'Nunito_800ExtraBold',
                }}
              >
                CHAMA CONNECT
              </Text>
            </View>
            <MemberAvatar name={user.fullName} size={38} bgColor="rgba(255,255,255,0.2)" />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Nunito_400Regular' }}>
                {greetingText},
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: colors.white,
                  fontFamily: 'Nunito_800ExtraBold',
                  letterSpacing: -0.3,
                }}
              >
                {firstName}
              </Text>
              {userChama && (
                <View
                  style={{
                    marginTop: 6,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.white, fontFamily: 'Nunito_600SemiBold' }}>
                    {userChama.name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {chamaLoading || dataLoading ? (
          <SkeletonDashboard />
        ) : !userChama ? (
          <View style={{ padding: 20 }}>
            <EmptyState
              icon={Users}
              title="No chama yet"
              subtitle="Join a chama to start contributing and participating in the merry-go-round."
              ctaLabel="Join a chama"
              onCta={() => {
                console.log('[Home] Navigate to join chama');
                router.push('/chama/join');
              }}
            />
          </View>
        ) : (
          <View style={{ padding: 20, gap: 16 }}>
            {/* Stats Grid */}
            <AnimatedListItem index={0}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[cardStyle, { flex: 1 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(76,175,109,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={16} color={colors.leaf} />
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Contributed
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                    {formatKES(totalContributed)}
                  </Text>
                </View>
                <View style={[cardStyle, { flex: 1 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(62,142,222,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                      <Wallet size={16} color={colors.sky} />
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Balance
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                    {formatKES(paidAmount)}
                  </Text>
                </View>
              </View>
            </AnimatedListItem>

            <AnimatedListItem index={1}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[cardStyle, { flex: 1 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: outstandingFine > 0 ? 'rgba(192,57,43,0.12)' : 'rgba(107,114,128,0.10)', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={16} color={outstandingFine > 0 ? colors.danger : colors.gray} />
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Fine
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: outstandingFine > 0 ? colors.danger : colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                    {formatKES(outstandingFine)}
                  </Text>
                </View>
                <View style={[cardStyle, { flex: 1 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                      <RotateCcw size={16} color={colors.primary} />
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Position
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: isNextPayout ? colors.primary : colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                    {payoutStatusText}
                  </Text>
                </View>
              </View>
            </AnimatedListItem>

            {/* Contribution Progress */}
            {cycle && (
              <AnimatedListItem index={2}>
                <View style={cardStyle}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                      This month's contribution
                    </Text>
                    <StatusBadge variant={currentCycleContrib?.status || 'unpaid'} size="sm" />
                  </View>
                  <ContributionProgressBar paid={paidAmount} required={requiredAmount} />
                  <AnimatedPressable
                    onPress={() => {
                      console.log('[Home] Navigate to record contribution');
                      router.push('/contribution/record');
                    }}
                    style={{
                      marginTop: 14,
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.white, fontSize: 14, fontWeight: '600', fontFamily: 'Nunito_600SemiBold' }}>
                      Record contribution
                    </Text>
                  </AnimatedPressable>
                </View>
              </AnimatedListItem>
            )}

            {/* Next Payout Card */}
            {cycle && (
              <AnimatedListItem index={3}>
                <View style={[cardStyle, { backgroundColor: isNextPayout ? colors.primary : colors.surface }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isNextPayout ? 'rgba(255,255,255,0.2)' : colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                      <RotateCcw size={20} color={isNextPayout ? colors.white : colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: isNextPayout ? 'rgba(255,255,255,0.7)' : colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                        {isNextPayout ? 'You are next!' : `Payout position #${payoutPosition || '—'}`}
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: isNextPayout ? colors.white : colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                        {formatKES(cycle.payoutAmount)}
                      </Text>
                      <Text style={{ fontSize: 12, color: isNextPayout ? 'rgba(255,255,255,0.7)' : colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                        Cycle {cycle.cycleNumber}
                      </Text>
                    </View>
                  </View>
                </View>
              </AnimatedListItem>
            )}

            {/* Quick Actions */}
            <AnimatedListItem index={4}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold', marginBottom: 8 }}>
                Quick actions
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {[
                  { icon: CreditCard, label: 'Contribute', onPress: () => { console.log('[Home] Quick action: Contribute'); router.push('/contribution/record'); } },
                  { icon: RotateCcw, label: 'Queue', onPress: () => { console.log('[Home] Quick action: View queue'); router.push('/(tabs)/payout'); } },
                  { icon: List, label: 'History', onPress: () => { console.log('[Home] Quick action: History'); router.push('/(tabs)/contributions'); } },
                  { icon: AlertTriangle, label: 'Fines', onPress: () => { console.log('[Home] Quick action: Fines'); router.push('/(tabs)/members'); } },
                ].map((action, i) => (
                  <AnimatedPressable
                    key={i}
                    onPress={action.onPress}
                    style={{
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 12,
                      alignItems: 'center',
                      gap: 6,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                      <action.icon size={18} color={colors.primary} />
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'Nunito_600SemiBold', textAlign: 'center' }}>
                      {action.label}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>
            </AnimatedListItem>

            {/* Recent Activity */}
            {myContributions.length > 0 && (
              <AnimatedListItem index={5}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold', marginBottom: 8 }}>
                  Recent activity
                </Text>
                <View style={cardStyle}>
                  {myContributions.slice(0, 5).map((contrib, i) => {
                    const dateDisplay = formatDate(contrib.date);
                    const amountDisplay = formatKES(contrib.amount);
                    return (
                      <View key={contrib.id}>
                        {i > 0 && <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 10 }} />}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(76,175,109,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                            <CreditCard size={16} color={colors.leaf} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                              Contribution
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                              {dateDisplay}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                              {amountDisplay}
                            </Text>
                            <StatusBadge variant={contrib.status} size="sm" />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </AnimatedListItem>
            )}
          </View>
        )}
      </ScrollView>
    );
  }

  // ─── CHAIRPERSON DASHBOARD ───────────────────────────────────────────────────

  const activeMembers = members.filter((m) => m.status === 'active');
  const pendingMembers = members.filter((m) => m.status === 'pending');
  const totalContributions = allContributions.reduce((sum, c) => sum + c.amount, 0);
  const outstandingFines = fines.filter((f) => f.status === 'outstanding').reduce((sum, f) => sum + f.amount, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 20,
          backgroundColor: colors.forest,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Nunito_400Regular' }}>
              Welcome back,
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: colors.white, fontFamily: 'Nunito_800ExtraBold', letterSpacing: -0.3 }}>
              {firstName}
            </Text>
            {userChama && (
              <View style={{ marginTop: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: 12, color: colors.white, fontFamily: 'Nunito_600SemiBold' }}>
                  {userChama.name}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {pendingMembers.length > 0 && (
              <AnimatedPressable
                onPress={() => {
                  console.log('[Home] Navigate to members (pending alert)');
                  router.push('/(tabs)/members');
                }}
                style={{
                  backgroundColor: colors.danger,
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Bell size={12} color={colors.white} />
                <Text style={{ fontSize: 12, color: colors.white, fontWeight: '700', fontFamily: 'Nunito_700Bold' }}>
                  {pendingMembers.length} pending
                </Text>
              </AnimatedPressable>
            )}
            <MemberAvatar name={user.fullName} size={44} bgColor="rgba(255,255,255,0.2)" />
          </View>
        </View>
      </View>

      {chamaLoading || dataLoading ? (
        <SkeletonDashboard />
      ) : !userChama ? (
        <View style={{ padding: 20 }}>
          <EmptyState
            icon={Users}
            title="No chama yet"
            subtitle="Create a chama to start managing contributions and the merry-go-round rotation."
            ctaLabel="Create a chama"
            onCta={() => {
              console.log('[Home] Navigate to create chama');
              router.push('/chama/create');
            }}
          />
        </View>
      ) : (
        <View style={{ padding: 20, gap: 16 }}>
          {/* Stats Grid */}
          <AnimatedListItem index={0}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[cardStyle, { flex: 1 }]}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Users size={16} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                  {members.filter((m) => m.status !== 'exited').length}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginTop: 2 }}>
                  Total members
                </Text>
              </View>
              <View style={[cardStyle, { flex: 1 }]}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(76,175,109,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <CheckCircle size={16} color={colors.leaf} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                  {activeMembers.length}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginTop: 2 }}>
                  Active
                </Text>
              </View>
            </View>
          </AnimatedListItem>

          <AnimatedListItem index={1}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[cardStyle, { flex: 1 }]}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(62,142,222,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <TrendingUp size={16} color={colors.sky} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                  {formatKES(totalContributions)}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginTop: 2 }}>
                  Contributions
                </Text>
              </View>
              <View style={[cardStyle, { flex: 1 }]}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: outstandingFines > 0 ? 'rgba(192,57,43,0.12)' : 'rgba(107,114,128,0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <AlertTriangle size={16} color={outstandingFines > 0 ? colors.danger : colors.gray} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: outstandingFines > 0 ? colors.danger : colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                  {formatKES(outstandingFines)}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginTop: 2 }}>
                  Fines
                </Text>
              </View>
            </View>
          </AnimatedListItem>

          {/* Payout Rotation Card */}
          {cycle && (
            <AnimatedListItem index={2}>
              <View style={cardStyle}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                    Payout rotation
                  </Text>
                  <View style={{ backgroundColor: colors.primaryMuted, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 11, color: colors.primary, fontFamily: 'Nunito_600SemiBold' }}>
                      Cycle {cycle.cycleNumber}
                    </Text>
                  </View>
                </View>
                {cycle.payoutQueue.slice(0, 5).map((userId, i) => {
                  const member = members.find((m) => m.userId === userId);
                  const isPaid = cycle.completedPayouts.includes(userId);
                  const isNext = cycle.payoutQueue[cycle.completedPayouts.length] === userId;
                  const statusText = isPaid ? 'Paid' : isNext ? 'Next' : 'Waiting';
                  const memberName = member?.userName || 'Unknown';

                  return (
                    <View key={userId}>
                      {i > 0 && <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 8 }} />}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          backgroundColor: isNext ? colors.primaryMuted : 'transparent',
                          borderRadius: 10,
                          padding: isNext ? 8 : 0,
                          marginHorizontal: isNext ? -8 : 0,
                        }}
                      >
                        <Text style={{ fontSize: 13, color: colors.textTertiary, fontFamily: 'Nunito_600SemiBold', width: 20 }}>
                          {i + 1}.
                        </Text>
                        <MemberAvatar name={memberName} size={32} />
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: isNext ? colors.primary : colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                          {memberName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {isPaid ? (
                            <CheckCircle size={14} color={colors.leaf} />
                          ) : isNext ? (
                            <Clock size={14} color={colors.primary} />
                          ) : null}
                          <Text style={{ fontSize: 12, color: isPaid ? colors.leaf : isNext ? colors.primary : colors.textTertiary, fontFamily: 'Nunito_600SemiBold' }}>
                            {statusText}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
                {cycle.payoutQueue.length > 5 && (
                  <Text style={{ fontSize: 12, color: colors.textTertiary, textAlign: 'center', marginTop: 8, fontFamily: 'Nunito_400Regular' }}>
                    +{cycle.payoutQueue.length - 5} more members
                  </Text>
                )}
              </View>
            </AnimatedListItem>
          )}

          {/* Quick Actions */}
          <AnimatedListItem index={3}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold', marginBottom: 8 }}>
              Quick actions
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { icon: UserPlus, label: 'Approve', onPress: () => { console.log('[Home] Quick action: Approve members'); router.push('/(tabs)/members'); } },
                { icon: Play, label: 'Start cycle', onPress: () => { console.log('[Home] Quick action: Start cycle'); router.push('/(tabs)/payout'); } },
                { icon: CreditCard, label: 'Record', onPress: () => { console.log('[Home] Quick action: Record contribution'); router.push('/contribution/record'); } },
                { icon: AlertTriangle, label: 'Fines', onPress: () => { console.log('[Home] Quick action: View fines'); router.push('/(tabs)/contributions'); } },
              ].map((action, i) => (
                <AnimatedPressable
                  key={i}
                  onPress={action.onPress}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 12,
                    alignItems: 'center',
                    gap: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                    <action.icon size={18} color={colors.primary} />
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'Nunito_600SemiBold', textAlign: 'center' }}>
                    {action.label}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </AnimatedListItem>

          {/* No cycle state */}
          {!cycle && (
            <AnimatedListItem index={4}>
              <View style={[cardStyle, { alignItems: 'center', paddingVertical: 24 }]}>
                <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <RotateCcw size={24} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold', marginBottom: 4 }}>
                  No active cycle
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', fontFamily: 'Nunito_400Regular', marginBottom: 16 }}>
                  Start a cycle to begin the merry-go-round rotation
                </Text>
                <AnimatedPressable
                  onPress={() => {
                    console.log('[Home] Navigate to start cycle');
                    router.push('/(tabs)/payout');
                  }}
                  style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}
                >
                  <Text style={{ color: colors.white, fontSize: 14, fontWeight: '600', fontFamily: 'Nunito_600SemiBold' }}>
                    Start cycle
                  </Text>
                </AnimatedPressable>
              </View>
            </AnimatedListItem>
          )}
        </View>
      )}
    </ScrollView>
  );
}
