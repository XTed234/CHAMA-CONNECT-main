import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { colors } from '@/theme/colors';
import { formatKES, formatDate, getChamaMembers } from '@/utils/firestore';
import { Chama, Membership } from '@/types';
import { MemberAvatar } from '@/components/MemberAvatar';
import { StatusBadge } from '@/components/StatusBadge';
import { Users, DollarSign, Calendar, Shield } from 'lucide-react-native';

export default function ChamaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [chama, setChama] = useState<Chama | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    console.log('[ChamaDetail] Loading chama:', id);
    const load = async () => {
      try {
        const chamaDoc = await getDoc(doc(db, 'chamas', id));
        if (chamaDoc.exists()) {
          const chamaData = { id: chamaDoc.id, ...chamaDoc.data() } as Chama;
          setChama(chamaData);
          const membersData = await getChamaMembers(id);
          setMembers(membersData);
        }
      } catch (err) {
        console.error('[ChamaDetail] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!chama) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
          Chama not found.
        </Text>
      </View>
    );
  }

  const activeMembers = members.filter((m) => m.status === 'active');
  const createdDate = formatDate(chama.createdAt);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Chama Header */}
      <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)', gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
              {chama.name}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'Nunito_400Regular', marginTop: 2 }}>
              {chama.description}
            </Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.divider }} />

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
              {activeMembers.length}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
              Active members
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primary, fontFamily: 'Nunito_800ExtraBold' }}>
              {formatKES(chama.contributionAmount)}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
              Monthly
            </Text>
          </View>
        </View>
      </View>

      {/* Details */}
      <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
        {[
          { icon: DollarSign, label: 'Contribution', value: formatKES(chama.contributionAmount) },
          { icon: Calendar, label: 'Due day', value: `Day ${chama.contributionDayOfMonth} of month` },
          { icon: Shield, label: 'Late fine', value: formatKES(chama.fineAmount) },
          { icon: Calendar, label: 'Created', value: createdDate },
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
              <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Members */}
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
        Members ({members.length})
      </Text>
      {members.map((member) => (
        <View
          key={member.id}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <MemberAvatar name={member.userName} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
              {member.userName}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
              {member.userEmail}
            </Text>
          </View>
          <StatusBadge variant={member.status} size="sm" />
        </View>
      ))}
    </ScrollView>
  );
}
