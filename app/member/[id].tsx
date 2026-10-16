import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useChama } from '@/contexts/ChamaContext';
import { colors } from '@/theme/colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { MemberAvatar } from '@/components/MemberAvatar';
import { StatusBadge } from '@/components/StatusBadge';
import {
  getUserContributions,
  getUserFines,
  getActiveCycle,
  approveMember,
  rejectMember,
  processExit,
  formatKES,
  formatDate,
} from '@/utils/firestore';
import { Membership, Contribution, Fine, Cycle } from '@/types';
import { CreditCard, AlertTriangle, Check, X, LogOut } from 'lucide-react-native';

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { userChama, refreshChama } = useChama();
  const navigation = useNavigation();

  const [membership, setMembership] = useState<Membership | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    console.log('[MemberDetail] Loading member:', id);
    const load = async () => {
      try {
        const memberDoc = await getDoc(doc(db, 'memberships', id));
        if (!memberDoc.exists()) return;
        const memberData = { id: memberDoc.id, ...memberDoc.data() } as Membership;
        setMembership(memberData);
        navigation.setOptions({ title: memberData.userName });

        const [contribs, finesData, cycleData] = await Promise.all([
          getUserContributions(memberData.userId, memberData.chamaId),
          getUserFines(memberData.userId, memberData.chamaId),
          getActiveCycle(memberData.chamaId),
        ]);
        setContributions(contribs);
        setFines(finesData);
        setCycle(cycleData);
      } catch (err) {
        console.error('[MemberDetail] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleApprove = async () => {
    if (!membership) return;
    console.log('[MemberDetail] Approve member:', membership.id);
    setActionLoading(true);
    try {
      await approveMember(membership.id);
      setMembership({ ...membership, status: 'active' });
      refreshChama();
    } catch (err) {
      console.error('[MemberDetail] Approve error:', err);
      Alert.alert('Error', 'Could not approve member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!membership) return;
    console.log('[MemberDetail] Reject member:', membership.id);
    Alert.alert('Reject member', `Remove ${membership.userName}'s request?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await rejectMember(membership.id);
            navigation.goBack();
          } catch (err) {
            console.error('[MemberDetail] Reject error:', err);
            Alert.alert('Error', 'Could not reject member.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleProcessExit = async () => {
    if (!membership) return;
    console.log('[MemberDetail] Process exit:', membership.id);
    Alert.alert('Process exit', `Confirm exit for ${membership.userName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm exit',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await processExit(membership.id);
            setMembership({ ...membership, status: 'exited' });
            refreshChama();
          } catch (err) {
            console.error('[MemberDetail] Process exit error:', err);
            Alert.alert('Error', 'Could not process exit.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!membership) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
          Member not found.
        </Text>
      </View>
    );
  }

  const payoutPosition = cycle ? cycle.payoutQueue.indexOf(membership.userId) + 1 : 0;
  const joinedDate = formatDate(membership.joinedAt);
  const totalContributed = membership.totalContributed || 0;
  const outstandingFine = membership.outstandingFine || 0;
  const isChairperson = user?.role === 'chairperson';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <MemberAvatar name={membership.userName} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
              {membership.userName}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
              {membership.userEmail}
            </Text>
            <View style={{ marginTop: 6 }}>
              <StatusBadge variant={membership.status} />
            </View>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.divider }} />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
              {formatKES(totalContributed)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginTop: 2 }}>
              Contributed
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.divider }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: outstandingFine > 0 ? colors.danger : colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
              {formatKES(outstandingFine)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginTop: 2 }}>
              Fine
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.divider }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
              {payoutPosition > 0 ? `#${payoutPosition}` : '—'}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginTop: 2 }}>
              Position
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
      </View>

      {/* Chairperson Actions */}
      {isChairperson && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {membership.status === 'pending' && (
            <>
              <AnimatedPressable
                onPress={handleApprove}
                disabled={actionLoading}
                style={{ flex: 1, backgroundColor: 'rgba(76,175,109,0.12)', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {actionLoading ? <ActivityIndicator size="small" color={colors.leaf} /> : (
                  <>
                    <Check size={16} color={colors.leaf} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.leaf, fontFamily: 'Nunito_600SemiBold' }}>Approve</Text>
                  </>
                )}
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleReject}
                disabled={actionLoading}
                style={{ flex: 1, backgroundColor: 'rgba(192,57,43,0.08)', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <X size={16} color={colors.danger} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.danger, fontFamily: 'Nunito_600SemiBold' }}>Reject</Text>
              </AnimatedPressable>
            </>
          )}
          {membership.status === 'exit_requested' && (
            <AnimatedPressable
              onPress={handleProcessExit}
              disabled={actionLoading}
              style={{ flex: 1, backgroundColor: 'rgba(192,57,43,0.08)', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {actionLoading ? <ActivityIndicator size="small" color={colors.danger} /> : (
                <>
                  <LogOut size={16} color={colors.danger} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.danger, fontFamily: 'Nunito_600SemiBold' }}>Process exit</Text>
                </>
              )}
            </AnimatedPressable>
          )}
        </View>
      )}

      {/* Contribution History */}
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
        Contribution history
      </Text>
      {contributions.length === 0 ? (
        <Text style={{ fontSize: 14, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', textAlign: 'center', paddingVertical: 16 }}>
          No contributions yet.
        </Text>
      ) : (
        contributions.map((contrib) => {
          const dateDisplay = formatDate(contrib.date);
          const amountDisplay = formatKES(contrib.amount);
          return (
            <View key={contrib.id} style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
          );
        })
      )}

      {/* Fine History */}
      {fines.length > 0 && (
        <>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
            Fine history
          </Text>
          {fines.map((fine) => {
            const dateDisplay = formatDate(fine.appliedAt);
            const amountDisplay = formatKES(fine.amount);
            return (
              <View key={fine.id} style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(192,57,43,0.10)', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={16} color={colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                    {fine.reason}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                    {dateDisplay}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.danger, fontFamily: 'Nunito_700Bold' }}>
                    {amountDisplay}
                  </Text>
                  <StatusBadge variant={fine.status} size="sm" />
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}
