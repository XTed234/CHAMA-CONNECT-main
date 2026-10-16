import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function MemberLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.forest },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: 'Nunito_700Bold', fontSize: 17 },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="[id]" options={{ title: 'Member Details' }} />
    </Stack>
  );
}
