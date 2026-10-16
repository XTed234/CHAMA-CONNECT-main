import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/colors';
import { AppLogo } from '@/components/AppLogo';

export default function IndexScreen() {
  const { user, loading, hasSeenIntro } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      console.log('[Index] User authenticated, redirecting to tabs');
      router.replace('/(tabs)/(home)');
    } else if (!hasSeenIntro) {
      console.log('[Index] First time launch, redirecting to intro slides');
      router.replace('/intro');
    } else {
      console.log('[Index] Intro seen, directing to login');
      router.replace('/auth/login');
    }
  }, [user, loading, hasSeenIntro]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          width: 104,
          height: 104,
          borderRadius: 30,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.16,
          shadowRadius: 22,
          elevation: 8,
          borderWidth: 1,
          borderColor: 'rgba(26, 86, 219, 0.08)',
          marginBottom: 22,
        }}
      >
        <AppLogo size={80} />
      </View>
      <Text
        style={{
          fontSize: 28,
          fontWeight: '800',
          color: '#0F172A',
          letterSpacing: -0.6,
          fontFamily: 'Nunito_800ExtraBold',
          marginBottom: 6,
        }}
      >
        CHAMA CONNECT
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.textSecondary,
          fontFamily: 'Nunito_400Regular',
          marginBottom: 32,
        }}
      >
        Smart Merry-Go-Round & Chama Management
      </Text>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
