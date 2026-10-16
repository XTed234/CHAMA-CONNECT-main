import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StatusBadge } from '@/components/StatusBadge';
import { MemberAvatar } from '@/components/MemberAvatar';
import { markFinePaid, formatKES, formatDate } from '@/utils/firestore';
import { Fine } from '@/types';
import { AlertTriangle, CheckCircle, Calendar, FileText } from 'lucide-react-native';

export default function FineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [fine, setFine] = useState<Fine | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    if (!id) return;
    console.log('[FineDetail] Loading fine:', id);
    const load = async () => {
      try {
        const fineDoc = await getDoc(doc(db, 'fines', id));
        if (fineDoc.exists()) {
          setFine({ id: fineDoc.id, ...fineDoc.data() } as Fine);
        }
      } catch (err) {
        console.error('[FineDetail] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleMarkPaid = async () => {
    if (!fine) return;
    console.log('[FineDetail] Mark fine as paid:', fine.id);
    Alert.alert('Mark as paid', `Mark this fine of ${formatKES(fine.amount)} as paid?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark paid',
        onPress: async () => {
          setMarkingPaid(true);
          try {
            await markFinePaid(fine.id, fine.userId, fine.chamaId, fine.amount);
            setFine({ ...fine, status: 'paid' });
            console.log('[FineDetail] Fine marked as paid');
          } catch (err) {
            console.error('[FineDetail] Mark paid error:', err);
            Alert.alert('Error', 'Could not mark fine as paid.');
          } finally {
            setMarkingPaid(false);
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

  if (!fine) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
          Fine not found.
        </Text>
      </View>
    );
  }

  const isChairperson = user?.role === 'chairperson';
  const appliedDate = formatDate(fine.appliedAt);
  const amountDisplay = formatKES(fine.amount);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Amount Card */}
      <View
        style={{
          backgroundColor: fine.status === 'paid' ? 'rgba(76,175,109,0.08)' : 'rgba(192,57,43,0.06)',
          borderRadius: 20,
          padding: 24,
          alignItems: 'center',
          gap: 8,
          borderWidth: 1,
          borderColor: fine.status === 'paid' ? 'rgba(76,175,109,0.2)' : 'rgba(192,57,43,0.15)',
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: fine.status === 'paid' ? 'rgba(76,175,109,0.15)' : 'rgba(192,57,43,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {fine.status === 'paid' ? (
            <CheckCircle size={24} color={colors.leaf} />
          ) : (
            <AlertTriangle size={24} color={colors.danger} />
          )}
        </View>
        <Text
          style={{
            fontSize: 36,
            fontWeight: '800',
            color: fine.status === 'paid' ? colors.leaf : colors.danger,
            fontFamily: 'Nunito_800ExtraBold',
            letterSpacing: -1,
          }}
        >
          {amountDisplay}
        </Text>
        <StatusBadge variant={fine.status} />
      </View>

      {/* Member */}
      <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <MemberAvatar name={fine.userName} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
            {fine.userName}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
            Member
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
        {[
          { icon: FileText, label: 'Reason', value: fine.reason },
          { icon: Calendar, label: 'Applied', value: appliedDate },
        ].map((item, i) => (
          <View key={i}>
            {i > 0 && <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: 14 }} />}
            <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                <item.icon size={18} color={colors.primary} />
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                {item.label}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'Nunito_400Regular', maxWidth: 160, textAlign: 'right' }}>
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Mark as Paid */}
      {isChairperson && fine.status === 'outstanding' && (
        <AnimatedPressable
          onPress={handleMarkPaid}
          disabled={markingPaid}
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
          {markingPaid ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <CheckCircle size={18} color={colors.white} />
              <Text style={{ color: colors.white, fontSize: 15, fontWeight: '700', fontFamily: 'Nunito_700Bold' }}>
                Mark as paid
              </Text>
            </>
          )}
        </AnimatedPressable>
      )}
    </ScrollView>
  );
}
