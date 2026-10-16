import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import { colors } from '@/theme/colors';

const TABS = [
  { name: '(home)', route: '/(tabs)/(home)' as const, icon: 'home' as const, label: 'Home' },
  { name: 'members', route: '/(tabs)/members' as const, icon: 'group' as const, label: 'Members' },
  { name: 'contributions', route: '/(tabs)/contributions' as const, icon: 'payments' as const, label: 'Contribute' },
  { name: 'payout', route: '/(tabs)/payout' as const, icon: 'autorenew' as const, label: 'Payout' },
  { name: 'settings', route: '/(tabs)/settings' as const, icon: 'settings' as const, label: 'Settings' },
];

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const tabBarWidth = Math.min(width - 32, 420);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="members" />
        <Stack.Screen name="contributions" />
        <Stack.Screen name="payout" />
        <Stack.Screen name="settings" />
      </Stack>
      <FloatingTabBar
        tabs={TABS}
        containerWidth={tabBarWidth}
        borderRadius={35}
        bottomMargin={16}
      />
    </View>
  );
}
