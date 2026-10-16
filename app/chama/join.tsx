import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Users, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChama } from '@/contexts/ChamaContext';
import { colors } from '@/theme/colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import { getAllChamas, requestJoinChama, formatKES } from '@/utils/firestore';
import { Chama } from '@/types';

export default function JoinChamaScreen() {
  const { user } = useAuth();
  const { refreshChama } = useChama();
  const router = useRouter();

  const [chamas, setChamas] = useState<Chama[]>([]);
  const [filtered, setFiltered] = useState<Chama[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [searchFocused, setSearchFocused] = useState(false);

  const loadChamas = useCallback(async () => {
    console.log('[JoinChama] Loading available chamas');
    setLoading(true);
    try {
      const data = await getAllChamas();
      setChamas(data);
      setFiltered(data);
    } catch (err) {
      console.error('[JoinChama] loadChamas error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChamas();
  }, [loadChamas]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(chamas.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)));
  }, [search, chamas]);

  const handleRequestJoin = async (chama: Chama) => {
    if (!user) return;
    console.log('[JoinChama] Request to join:', chama.id, chama.name);
    setRequestingId(chama.id);
    try {
      await requestJoinChama(user.uid, chama.id, user.fullName, user.email);
      setSentRequests((prev) => new Set([...prev, chama.id]));
      console.log('[JoinChama] Join request sent for:', chama.name);
      Alert.alert(
        'Request sent!',
        `Your request to join "${chama.name}" has been sent. The chairperson will review it shortly.`,
        [{ text: 'OK', onPress: () => { refreshChama(); router.back(); } }]
      );
    } catch (err) {
      console.error('[JoinChama] Request join error:', err);
      const msg = err instanceof Error ? err.message : 'Could not send request.';
      Alert.alert('Error', msg);
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Search */}
      <View style={{ padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceSecondary,
            borderRadius: 12,
            paddingHorizontal: 12,
            gap: 8,
            borderWidth: 1.5,
            borderColor: searchFocused ? colors.primary : 'transparent',
          }}
        >
          <Search size={18} color={colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={(t) => {
              console.log('[JoinChama] Search query:', t);
              setSearch(t);
            }}
            placeholder="Search chamas by name..."
            placeholderTextColor={colors.textTertiary}
            style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text, fontFamily: 'Nunito_400Regular' }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No chamas found"
            subtitle={search ? `No chamas match "${search}". Try a different search.` : 'No chamas are available to join yet.'}
          />
        ) : (
          filtered.map((chama) => {
            const isRequesting = requestingId === chama.id;
            const hasSent = sentRequests.has(chama.id);
            const contributionDisplay = formatKES(chama.contributionAmount);

            return (
              <View
                key={chama.id}
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
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                      {chama.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'Nunito_400Regular', marginTop: 2 }} numberOfLines={2}>
                      {chama.description}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary, fontFamily: 'Nunito_700Bold' }}>
                      {contributionDisplay}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                      Monthly
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                      {chama.memberCount}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                      Members
                    </Text>
                  </View>
                </View>

                <AnimatedPressable
                  onPress={() => handleRequestJoin(chama)}
                  disabled={isRequesting || hasSent}
                  style={{
                    backgroundColor: hasSent ? 'rgba(76,175,109,0.12)' : colors.primary,
                    borderRadius: 10,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {isRequesting ? (
                    <ActivityIndicator size="small" color={hasSent ? colors.leaf : colors.white} />
                  ) : hasSent ? (
                    <>
                      <CheckCircle size={14} color={colors.leaf} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.leaf, fontFamily: 'Nunito_600SemiBold' }}>
                        Request sent
                      </Text>
                    </>
                  ) : (
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.white, fontFamily: 'Nunito_600SemiBold' }}>
                      Request to join
                    </Text>
                  )}
                </AnimatedPressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
