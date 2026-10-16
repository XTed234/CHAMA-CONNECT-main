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
import { Users, ChevronRight, Check, X, LogOut, Eye } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChama } from '@/contexts/ChamaContext';
import { colors } from '@/theme/colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StatusBadge } from '@/components/StatusBadge';
import { MemberAvatar } from '@/components/MemberAvatar';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import {
  getChamaMembers,
  approveMember,
  rejectMember,
  requestExit,
  processExit,
  formatKES,
  formatDate,
} from '@/utils/firestore';
import { Membership, MembershipStatus } from '@/types';

type FilterTab = 'all' | 'active' | 'pending' | 'exit_requested' | 'exited';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'exit_requested', label: 'Exit Req.' },
  { key: 'exited', label: 'Exited' },
];

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

export default function MembersScreen() {
  const { user } = useAuth();
  const { userChama, membership, refreshChama } = useChama();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isChairperson = user?.role === 'chairperson';

  const loadMembers = useCallback(async () => {
    if (!userChama) return;
    console.log('[Members] Loading members for chama:', userChama.id);
    setLoading(true);
    try {
      const data = await getChamaMembers(userChama.id);
      setMembers(data);
    } catch (err) {
      console.error('[Members] loadMembers error:', err);
    } finally {
      setLoading(false);
    }
  }, [userChama]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const onRefresh = useCallback(async () => {
    console.log('[Members] Pull to refresh');
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  }, [loadMembers]);

  const handleApprove = async (membershipId: string, memberName: string) => {
    console.log('[Members] Approve member:', membershipId, memberName);
    setActionLoading(membershipId);
    try {
      await approveMember(membershipId);
      await loadMembers();
      refreshChama();
    } catch (err) {
      console.error('[Members] Approve error:', err);
      Alert.alert('Error', 'Could not approve member. Try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (membershipId: string, memberName: string) => {
    console.log('[Members] Reject member:', membershipId, memberName);
    Alert.alert(
      'Reject member',
      `Remove ${memberName}'s request to join?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(membershipId);
            try {
              await rejectMember(membershipId);
              await loadMembers();
            } catch (err) {
              console.error('[Members] Reject error:', err);
              Alert.alert('Error', 'Could not reject member. Try again.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleProcessExit = async (membershipId: string, memberName: string) => {
    console.log('[Members] Process exit:', membershipId, memberName);
    Alert.alert(
      'Process exit',
      `Confirm exit for ${memberName}? This will remove them from the chama.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm exit',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(membershipId);
            try {
              await processExit(membershipId);
              await loadMembers();
              refreshChama();
            } catch (err) {
              console.error('[Members] Process exit error:', err);
              Alert.alert('Error', 'Could not process exit. Try again.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleRequestExit = async () => {
    if (!membership) return;
    console.log('[Members] Request exit for membership:', membership.id);
    Alert.alert(
      'Request to leave',
      'Are you sure you want to request to leave this chama? The chairperson will need to approve your exit.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request exit',
          style: 'destructive',
          onPress: async () => {
            try {
              await requestExit(membership.id);
              refreshChama();
            } catch (err) {
              console.error('[Members] Request exit error:', err);
              Alert.alert('Error', 'Could not submit exit request. Try again.');
            }
          },
        },
      ]
    );
  };

  const filteredMembers = members.filter((m) => {
    if (activeFilter === 'all') return true;
    return m.status === activeFilter;
  });

  // ─── MEMBER VIEW ─────────────────────────────────────────────────────────────

  if (!isChairperson) {
    const joinedDate = membership?.joinedAt ? formatDate(membership.joinedAt) : '—';
    const totalContributed = membership?.totalContributed || 0;
    const outstandingFine = membership?.outstandingFine || 0;

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: colors.forest }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.white, fontFamily: 'Nunito_800ExtraBold' }}>
            My membership
          </Text>
        </View>

        <View style={{ padding: 20, gap: 16 }}>
          {!userChama || !membership ? (
            <EmptyState
              icon={Users}
              title="No membership"
              subtitle="You haven't joined a chama yet."
              ctaLabel="Join a chama"
              onCta={() => {
                console.log('[Members] Navigate to join chama');
                router.push('/chama/join');
              }}
            />
          ) : (
            <>
              {/* Membership Card */}
              <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)', gap: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <MemberAvatar name={user?.fullName || ''} size={56} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                      {user?.fullName}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                      {user?.email}
                    </Text>
                    <View style={{ marginTop: 6 }}>
                      <StatusBadge variant={membership.status} />
                    </View>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: colors.divider }} />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                      {formatKES(totalContributed)}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginTop: 2 }}>
                      Total contributed
                    </Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: colors.divider }} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: outstandingFine > 0 ? colors.danger : colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                      {formatKES(outstandingFine)}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginTop: 2 }}>
                      Outstanding fine
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                    Member since
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                    {joinedDate}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                    Chama
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                    {userChama.name}
                  </Text>
                </View>
              </View>

              {/* Request Exit */}
              {membership.status === 'active' && (
                <AnimatedPressable
                  onPress={handleRequestExit}
                  style={{
                    backgroundColor: 'rgba(192,57,43,0.08)',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(192,57,43,0.2)',
                  }}
                >
                  <LogOut size={16} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: 14, fontWeight: '600', fontFamily: 'Nunito_600SemiBold' }}>
                    Request to leave chama
                  </Text>
                </AnimatedPressable>
              )}

              {membership.status === 'exit_requested' && (
                <View style={{ backgroundColor: 'rgba(192,57,43,0.08)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(192,57,43,0.2)' }}>
                  <Text style={{ fontSize: 14, color: colors.danger, fontFamily: 'Nunito_600SemiBold', textAlign: 'center' }}>
                    Exit request pending chairperson approval
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    );
  }

  // ─── CHAIRPERSON VIEW ─────────────────────────────────────────────────────────

  const pendingCount = members.filter((m) => m.status === 'pending').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.forest }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.white, fontFamily: 'Nunito_800ExtraBold', flex: 1 }}>
            Members
          </Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
            <Text style={{ fontSize: 13, color: colors.white, fontFamily: 'Nunito_700Bold' }}>
              {members.filter((m) => m.status !== 'exited').length}
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.key;
              const count = tab.key === 'all' ? members.length : members.filter((m) => m.status === tab.key).length;
              return (
                <AnimatedPressable
                  key={tab.key}
                  onPress={() => {
                    console.log('[Members] Filter tab pressed:', tab.key);
                    setActiveFilter(tab.key);
                  }}
                  style={{
                    backgroundColor: isActive ? colors.white : 'rgba(255,255,255,0.15)',
                    borderRadius: 20,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 13, color: isActive ? colors.primary : colors.white, fontFamily: 'Nunito_600SemiBold' }}>
                    {tab.label}
                  </Text>
                  {count > 0 && (
                    <View style={{ backgroundColor: isActive ? colors.primaryMuted : 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ fontSize: 10, color: isActive ? colors.primary : colors.white, fontFamily: 'Nunito_700Bold' }}>
                        {count}
                      </Text>
                    </View>
                  )}
                </AnimatedPressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : !userChama ? (
          <EmptyState
            icon={Users}
            title="No chama yet"
            subtitle="Create a chama to manage members."
            ctaLabel="Create a chama"
            onCta={() => {
              console.log('[Members] Navigate to create chama');
              router.push('/chama/create');
            }}
          />
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={`No ${activeFilter === 'all' ? '' : activeFilter.replace('_', ' ')} members`}
            subtitle="Members will appear here once they join or change status."
          />
        ) : (
          filteredMembers.map((member, i) => {
            const isLoading = actionLoading === member.id;
            const joinedDate = formatDate(member.joinedAt);
            const totalContributed = member.totalContributed || 0;
            const outstandingFine = member.outstandingFine || 0;

            return (
              <AnimatedListItem key={member.id} index={i}>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
                    gap: 12,
                  }}
                >
                  {/* Member Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <MemberAvatar name={member.userName} size={44} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                        {member.userName}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                        {member.userEmail}
                      </Text>
                    </View>
                    <StatusBadge variant={member.status} size="sm" />
                  </View>

                  {/* Stats */}
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                        {formatKES(totalContributed)}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                        Contributed
                      </Text>
                    </View>
                    {outstandingFine > 0 && (
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.danger, fontFamily: 'Nunito_700Bold' }}>
                          {formatKES(outstandingFine)}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                          Fine
                        </Text>
                      </View>
                    )}
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                        {joinedDate}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                        Joined
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {member.status === 'pending' && (
                      <>
                        <AnimatedPressable
                          onPress={() => handleApprove(member.id, member.userName)}
                          disabled={isLoading}
                          style={{
                            flex: 1,
                            backgroundColor: 'rgba(76,175,109,0.12)',
                            borderRadius: 10,
                            paddingVertical: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          {isLoading ? (
                            <ActivityIndicator size="small" color={colors.leaf} />
                          ) : (
                            <>
                              <Check size={14} color={colors.leaf} />
                              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.leaf, fontFamily: 'Nunito_600SemiBold' }}>
                                Approve
                              </Text>
                            </>
                          )}
                        </AnimatedPressable>
                        <AnimatedPressable
                          onPress={() => handleReject(member.id, member.userName)}
                          disabled={isLoading}
                          style={{
                            flex: 1,
                            backgroundColor: 'rgba(192,57,43,0.08)',
                            borderRadius: 10,
                            paddingVertical: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <X size={14} color={colors.danger} />
                          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.danger, fontFamily: 'Nunito_600SemiBold' }}>
                            Reject
                          </Text>
                        </AnimatedPressable>
                      </>
                    )}
                    {member.status === 'exit_requested' && (
                      <AnimatedPressable
                        onPress={() => handleProcessExit(member.id, member.userName)}
                        disabled={isLoading}
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(192,57,43,0.08)',
                          borderRadius: 10,
                          paddingVertical: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color={colors.danger} />
                        ) : (
                          <>
                            <LogOut size={14} color={colors.danger} />
                            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.danger, fontFamily: 'Nunito_600SemiBold' }}>
                              Process exit
                            </Text>
                          </>
                        )}
                      </AnimatedPressable>
                    )}
                    <AnimatedPressable
                      onPress={() => {
                        console.log('[Members] View member detail:', member.id);
                        router.push(`/member/${member.id}`);
                      }}
                      style={{
                        backgroundColor: colors.primaryMuted,
                        borderRadius: 10,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Eye size={14} color={colors.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary, fontFamily: 'Nunito_600SemiBold' }}>
                        View
                      </Text>
                    </AnimatedPressable>
                  </View>
                </View>
              </AnimatedListItem>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
