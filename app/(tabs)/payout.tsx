import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { RotateCcw, CheckCircle, Clock, Play, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChama } from '@/contexts/ChamaContext';
import { colors } from '@/theme/colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { MemberAvatar } from '@/components/MemberAvatar';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import {
  getActiveCycle,
  getChamaMembers,
  getChamaPayouts,
  simulatePayout,
  startNewCycle,
  formatKES,
  formatDate,
} from '@/utils/firestore';
import { Cycle, Membership, Payout } from '@/types';

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

export default function PayoutScreen() {
  const { user } = useAuth();
  const { userChama, refreshChama } = useChama();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [startCycleLoading, setStartCycleLoading] = useState(false);

  const isChairperson = user?.role === 'chairperson';

  const loadData = useCallback(async () => {
    if (!userChama) return;
    console.log('[Payout] Loading data for chama:', userChama.id);
    setLoading(true);
    try {
      const [cycleData, membersData, payoutsData] = await Promise.all([
        getActiveCycle(userChama.id),
        getChamaMembers(userChama.id),
        getChamaPayouts(userChama.id),
      ]);
      setCycle(cycleData);
      setMembers(membersData);
      setPayouts(payoutsData);
    } catch (err) {
      console.error('[Payout] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [userChama]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    console.log('[Payout] Pull to refresh');
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleStartCycle = async () => {
    if (!userChama) return;
    console.log('[Payout] Start cycle button pressed');
    const activeMembers = members.filter((m) => m.status === 'active');
    if (activeMembers.length < 2) {
      Alert.alert('Not enough members', 'You need at least 2 active members to start a cycle.');
      return;
    }
    Alert.alert(
      'Start new cycle',
      `Start a new merry-go-round cycle with ${activeMembers.length} members? The payout order will be randomized.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start cycle',
          onPress: async () => {
            setStartCycleLoading(true);
            try {
              const memberIds = activeMembers.map((m) => m.userId);
              await startNewCycle(userChama.id, memberIds);
              console.log('[Payout] New cycle started');
              await loadData();
              refreshChama();
            } catch (err) {
              console.error('[Payout] Start cycle error:', err);
              Alert.alert('Error', 'Could not start cycle. Try again.');
            } finally {
              setStartCycleLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSimulatePayout = async () => {
    if (!cycle || !userChama) return;
    const nextIndex = cycle.completedPayouts.length;
    const nextUserId = cycle.payoutQueue[nextIndex];
    const nextMember = members.find((m) => m.userId === nextUserId);
    if (!nextMember) return;

    console.log('[Payout] Simulate payout button pressed for:', nextMember.userName);
    Alert.alert(
      'Simulate payout',
      `Record payout of ${formatKES(cycle.payoutAmount)} to ${nextMember.userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm payout',
          onPress: async () => {
            setPayoutLoading(true);
            try {
              await simulatePayout(
                cycle.id,
                userChama.id,
                nextUserId,
                cycle.payoutAmount,
                nextMember.userName,
                cycle.cycleNumber
              );
              console.log('[Payout] Payout simulated successfully');
              await loadData();
              refreshChama();
            } catch (err) {
              console.error('[Payout] Simulate payout error:', err);
              Alert.alert('Error', err instanceof Error ? err.message : 'Could not process payout. Try again.');
            } finally {
              setPayoutLoading(false);
            }
          },
        },
      ]
    );
  };

  const nextIndex = cycle ? cycle.completedPayouts.length : 0;
  const nextUserId = cycle ? cycle.payoutQueue[nextIndex] : null;
  const nextMember = nextUserId ? members.find((m) => m.userId === nextUserId) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: colors.forest }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.white, fontFamily: 'Nunito_800ExtraBold', flex: 1 }}>
            Merry-Go-Round
          </Text>
          {cycle && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: colors.white, fontFamily: 'Nunito_700Bold' }}>
                Cycle {cycle.cycleNumber}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {!userChama ? (
          <EmptyState
            icon={RotateCcw}
            title="No chama yet"
            subtitle="Join or create a chama to participate in the merry-go-round."
          />
        ) : loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : !cycle ? (
          <View style={{ gap: 16 }}>
            <EmptyState
              icon={RotateCcw}
              title="No active cycle"
              subtitle={
                isChairperson
                  ? 'Start a cycle to begin the merry-go-round rotation for your members.'
                  : 'The chairperson hasn\'t started a cycle yet. Check back soon.'
              }
              ctaLabel={isChairperson ? 'Start cycle' : undefined}
              onCta={isChairperson ? handleStartCycle : undefined}
            />
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* Payout Amount Card */}
            <AnimatedListItem index={0}>
              <View
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 20,
                  padding: 20,
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Nunito_400Regular' }}>
                  Payout amount per member
                </Text>
                <Text style={{ fontSize: 36, fontWeight: '800', color: colors.white, fontFamily: 'Nunito_800ExtraBold', letterSpacing: -1 }}>
                  {formatKES(cycle.payoutAmount)}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito_400Regular' }}>
                  {cycle.completedPayouts.length} of {cycle.payoutQueue.length} paid out
                </Text>
              </View>
            </AnimatedListItem>

            {/* Next Payout + Simulate Button */}
            {isChairperson && nextMember && (
              <AnimatedListItem index={1}>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                    gap: 14,
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.textTertiary, fontFamily: 'Nunito_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Next payout
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <MemberAvatar name={nextMember.userName} size={48} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                        {nextMember.userName}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                        {formatKES(cycle.payoutAmount)}
                      </Text>
                    </View>
                  </View>
                  <AnimatedPressable
                    onPress={handleSimulatePayout}
                    disabled={payoutLoading}
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 12,
                      paddingVertical: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {payoutLoading ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <>
                        <Play size={16} color={colors.white} />
                        <Text style={{ color: colors.white, fontSize: 15, fontWeight: '700', fontFamily: 'Nunito_700Bold' }}>
                          Simulate payout
                        </Text>
                      </>
                    )}
                  </AnimatedPressable>
                </View>
              </AnimatedListItem>
            )}

            {/* Queue List */}
            <AnimatedListItem index={2}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold', marginBottom: 8 }}>
                Payout queue
              </Text>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                }}
              >
                {cycle.payoutQueue.map((userId, i) => {
                  const member = members.find((m) => m.userId === userId);
                  const isPaid = cycle.completedPayouts.includes(userId);
                  const isNext = cycle.payoutQueue[cycle.completedPayouts.length] === userId;
                  const memberName = member?.userName || 'Unknown';

                  return (
                    <View key={userId}>
                      {i > 0 && <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: 16 }} />}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          padding: 14,
                          backgroundColor: isNext ? colors.primaryMuted : 'transparent',
                        }}
                      >
                        <Text style={{ fontSize: 14, color: colors.textTertiary, fontFamily: 'Nunito_700Bold', width: 24, textAlign: 'center' }}>
                          {i + 1}
                        </Text>
                        <MemberAvatar name={memberName} size={36} />
                        <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: isNext ? colors.primary : colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                          {memberName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {isPaid ? (
                            <CheckCircle size={16} color={colors.leaf} />
                          ) : isNext ? (
                            <Clock size={16} color={colors.primary} />
                          ) : null}
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '600',
                              color: isPaid ? colors.leaf : isNext ? colors.primary : colors.textTertiary,
                              fontFamily: 'Nunito_600SemiBold',
                            }}
                          >
                            {isPaid ? 'Paid' : isNext ? 'Next' : 'Waiting'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </AnimatedListItem>

            {/* Payout History */}
            {payouts.length > 0 && (
              <AnimatedListItem index={3}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold', marginBottom: 8 }}>
                  Payout history
                </Text>
                {payouts.map((payout, i) => {
                  const dateDisplay = formatDate(payout.date);
                  const amountDisplay = formatKES(payout.amount);
                  return (
                    <View
                      key={payout.id}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        padding: 14,
                        marginBottom: 10,
                        borderWidth: 1,
                        borderColor: colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(76,175,109,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={18} color={colors.leaf} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                          {payout.userName}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                          Cycle {payout.cycleNumber} · {dateDisplay}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.leaf, fontFamily: 'Nunito_700Bold' }}>
                        {amountDisplay}
                      </Text>
                    </View>
                  );
                })}
              </AnimatedListItem>
            )}

            {/* Start new cycle if current is completed */}
            {isChairperson && cycle.status === 'completed' && (
              <AnimatedListItem index={4}>
                <AnimatedPressable
                  onPress={handleStartCycle}
                  disabled={startCycleLoading}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 14,
                    paddingVertical: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {startCycleLoading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <>
                      <RotateCcw size={18} color={colors.white} />
                      <Text style={{ color: colors.white, fontSize: 15, fontWeight: '700', fontFamily: 'Nunito_700Bold' }}>
                        Start new cycle
                      </Text>
                    </>
                  )}
                </AnimatedPressable>
              </AnimatedListItem>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
