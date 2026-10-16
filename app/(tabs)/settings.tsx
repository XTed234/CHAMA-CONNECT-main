import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Shield,
  LogOut,
  ChevronRight,
  Info,
  Building2,
  Calendar,
  DollarSign,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useChama } from '@/contexts/ChamaContext';
import { colors } from '@/theme/colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { MemberAvatar } from '@/components/MemberAvatar';
import { StatusBadge } from '@/components/StatusBadge';
import { AppLogo } from '@/components/AppLogo';
import { formatKES, formatDate } from '@/utils/firestore';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { userChama, membership } = useChama();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    console.log('[Settings] Sign out button pressed');
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
              console.log('[Settings] Signed out, navigating to login');
              router.replace('/auth/login');
            } catch (err) {
              console.error('[Settings] Sign out error:', err);
              Alert.alert('Error', 'Could not sign out. Try again.');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  if (!user) return null;

  const joinedDate = membership?.joinedAt ? formatDate(membership.joinedAt) : '—';
  const roleVariant = user.role === 'chairperson' ? 'chairperson' : 'member';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: colors.forest }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.white, fontFamily: 'Nunito_800ExtraBold' }}>
          Settings
        </Text>
      </View>

      <View style={{ padding: 20, gap: 20 }}>
        {/* Profile Card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <MemberAvatar name={user.fullName} size={72} />
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
              {user.fullName}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
              {user.email}
            </Text>
            <View style={{ marginTop: 4 }}>
              <StatusBadge variant={roleVariant} />
            </View>
          </View>
        </View>

        {/* Chama Section */}
        {userChama && (
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textTertiary, fontFamily: 'Nunito_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Chama
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: 'hidden',
              }}
            >
              <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                    {userChama.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                    {userChama.description}
                  </Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: 14 }} />
              <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                    Monthly contribution
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                    Due on day {userChama.contributionDayOfMonth} of each month
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary, fontFamily: 'Nunito_700Bold' }}>
                  {formatKES(userChama.contributionAmount)}
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: 14 }} />
              <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                    Member since
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                  {joinedDate}
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: 14 }} />
              <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                    Late fine
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.danger, fontFamily: 'Nunito_700Bold' }}>
                  {formatKES(userChama.fineAmount)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Account Actions */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textTertiary, fontFamily: 'Nunito_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Account
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <AnimatedPressable
              onPress={() => {
                console.log('[Settings] Edit profile pressed');
                Alert.alert('Edit profile', 'Profile editing coming soon.');
              }}
              style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} color={colors.primary} />
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                Edit profile
              </Text>
              <ChevronRight size={16} color={colors.textTertiary} />
            </AnimatedPressable>
            <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: 14 }} />
            <AnimatedPressable
              onPress={() => {
                console.log('[Settings] Change password pressed');
                Alert.alert('Change password', 'Password change coming soon.');
              }}
              style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={18} color={colors.primary} />
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text, fontFamily: 'Nunito_600SemiBold' }}>
                Change password
              </Text>
              <ChevronRight size={16} color={colors.textTertiary} />
            </AnimatedPressable>
          </View>
        </View>

        {/* App Info */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textTertiary, fontFamily: 'Nunito_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            About
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
              padding: 16,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <AppLogo size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                  CHAMA CONNECT
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
                  Merry-Go-Round & Chama Platform
                </Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            <AnimatedPressable
              onPress={() => router.push('/intro')}
              style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary, fontFamily: 'Nunito_700Bold' }}>
                  View Intro Walkthrough
                </Text>
              </View>
              <ChevronRight size={16} color={colors.primary} />
            </AnimatedPressable>

            <View style={{ height: 1, backgroundColor: colors.border }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: colors.textTertiary, fontFamily: 'Nunito_600SemiBold' }}>
                App Version
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                v1.0.0
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.danger, fontFamily: 'Nunito_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Danger zone
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(192,57,43,0.15)',
              overflow: 'hidden',
            }}
          >
            <AnimatedPressable
              onPress={handleSignOut}
              disabled={signingOut}
              style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(192,57,43,0.10)', alignItems: 'center', justifyContent: 'center' }}>
                {signingOut ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <LogOut size={18} color={colors.danger} />
                )}
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.danger, fontFamily: 'Nunito_600SemiBold' }}>
                Sign out
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
