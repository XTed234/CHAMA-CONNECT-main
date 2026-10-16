import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function ContributionLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.forest },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: 'Nunito_700Bold', fontSize: 17 },
        headerBackButtonDisplayMode: 'minimal',
        presentation: 'formSheet',
      }}
    >
      <Stack.Screen
        name="record"
        options={{
          title: 'Record Contribution',
          presentation: 'formSheet',
          sheetGrabberVisible: true,
        }}
      />
    </Stack>
  );
}
