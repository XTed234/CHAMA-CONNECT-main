import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CreditCard, Plus, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChama } from '@/contexts/ChamaContext';
import { colors } from '@/theme/colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StatusBadge } from '@/components/StatusBadge';
import { ContributionProgressBar } from '@/components/ContributionProgressBar';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import {
  getActiveCycle,
  getUserContributions,
  getChamaContributions,
  formatKES,
  formatDate,
} from '@/utils/firestore';
import { Cycle, Contribution } from '@/types';

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

export default function ContributionsScreen() {
  const { user } = useAuth();
  const { userChama } = useChama();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isChairperson = user?.role === 'chairperson';

  const loadData = useCallback(async () => {
    if (!userChama || !user) return;
    console.log('[Contributions] Loading data for chama:', userChama.id);
    setLoading(true);
    try {
      const [cycleData, contribData] = await Promise.all([
        getActiveCycle(userChama.id),
        isChairperson
          ? getChamaContributions(userChama.id)
          : getUserContributions(user.uid, userChama.id),
      ]);
      setCycle(cycleData);
      setContributions(contribData);
    } catch (err) {
      console.error('[Contributions] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [userChama, user, isChairperson]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    console.log('[Contributions] Pull to refresh');
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const currentCycleContrib = contributions.find((c) => c.cycleId === cycle?.id && c.userId === user?.uid);
  const paidAmount = currentCycleContrib?.amount || 0;
  const requiredAmount = userChama?.contributionAmount || 0;
  const remaining = Math.max(0, requiredAmount - paidAmount);

  const dueDay = userChama?.contributionDayOfMonth || 5;
  const now = new Date();
  const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
  const dueDateStr = dueDate.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: colors.forest }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.white, fontFamily: 'Nunito_800ExtraBold' }}>
          Contributions
        </Text>
        {cycle && (
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Nunito_400Regular', marginTop: 4 }}>
            Cycle {cycle.cycleNumber} · Due {dueDateStr}
          </Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {!userChama ? (
          <EmptyState
            icon={CreditCard}
            title="No chama yet"
            subtitle="Join a chama to start tracking contributions."
            ctaLabel="Join a chama"
            onCta={() => {
              console.log('[Contributions] Navigate to join chama');
              router.push('/chama/join');
            }}
          />
        ) : loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Current Cycle Card */}
            {cycle && !isChairperson && (
              <AnimatedListItem index={0}>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                    gap: 14,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                      This month
                    </Text>
                    <StatusBadge variant={currentCycleContrib?.status || 'unpaid'} />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginBottom: 2 }}>
                        Required
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                        {formatKES(requiredAmount)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginBottom: 2 }}>
                        Paid
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.leaf, fontFamily: 'Nunito_800ExtraBold' }}>
                        {formatKES(paidAmount)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginBottom: 2 }}>
                        Remaining
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: remaining > 0 ? colors.danger : colors.leaf, fontFamily: 'Nunito_800ExtraBold' }}>
                        {formatKES(remaining)}
                      </Text>
                    </View>
                  </View>

                  <ContributionProgressBar paid={paidAmount} required={requiredAmount} showLabels={false} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                      Due: {dueDateStr}
                    </Text>
                    <AnimatedPressable
                      onPress={() => {
                        console.log('[Contributions] Record contribution button pressed');
                        router.push('/contribution/record');
                      }}
                      style={{
                        backgroundColor: colors.primary,
                        borderRadius: 10,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Plus size={14} color={colors.white} />
                      <Text style={{ color: colors.white, fontSize: 13, fontWeight: '600', fontFamily: 'Nunito_600SemiBold' }}>
                        Record
                      </Text>
                    </AnimatedPressable>
                  </View>
                </View>
              </AnimatedListItem>
            )}

            {/* Chairperson summary */}
            {isChairperson && cycle && (
              <AnimatedListItem index={0}>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                    Cycle {cycle.cycleNumber} summary
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                        {formatKES(cycle.totalContributions)}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                        Total collected
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                        {contributions.filter((c) => c.cycleId === cycle.id).length}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                        Contributions
                      </Text>
                    </View>
                  </View>
                  <AnimatedPressable
                    onPress={() => {
                      console.log('[Contributions] Chairperson record contribution');
                      router.push('/contribution/record');
                    }}
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Plus size={14} color={colors.white} />
                    <Text style={{ color: colors.white, fontSize: 13, fontWeight: '600', fontFamily: 'Nunito_600SemiBold' }}>
                      Record contribution
                    </Text>
                  </AnimatedPressable>
                </View>
              </AnimatedListItem>
            )}

            {/* History */}
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold', marginBottom: 12 }}>
              {isChairperson ? 'All contributions' : 'My history'}
            </Text>

            {contributions.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No contributions yet"
                subtitle="Contributions will appear here once recorded."
                ctaLabel={!isChairperson ? 'Record contribution' : undefined}
                onCta={!isChairperson ? () => {
                  console.log('[Contributions] Empty state CTA: record contribution');
                  router.push('/contribution/record');
                } : undefined}
              />
            ) : (
              contributions.map((contrib, i) => {
                const dateDisplay = formatDate(contrib.date);
                const amountDisplay = formatKES(contrib.amount);
                return (
                  <AnimatedListItem key={contrib.id} index={i + 1}>
                    <View
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
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor:
                            contrib.status === 'paid'
                              ? 'rgba(76,175,109,0.12)'
                              : contrib.status === 'partial'
                              ? 'rgba(62,142,222,0.12)'
                              : 'rgba(192,57,43,0.10)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CreditCard
                          size={18}
                          color={
                            contrib.status === 'paid'
                              ? colors.leaf
                              : contrib.status === 'partial'
                              ? colors.sky
                              : colors.danger
                          }
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                          {isChairperson ? contrib.userName : 'Contribution'}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                          {dateDisplay}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                          {amountDisplay}
                        </Text>
                        <StatusBadge variant={contrib.status} size="sm" />
                      </View>
                    </View>
                  </AnimatedListItem>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
