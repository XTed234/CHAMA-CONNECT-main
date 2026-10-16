import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { colors } from '@/theme/colors';
import { formatKES } from '@/utils/firestore';

interface ContributionProgressBarProps {
  paid: number;
  required: number;
  showLabels?: boolean;
}

export function ContributionProgressBar({ paid, required, showLabels = true }: ContributionProgressBarProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const ratio = required > 0 ? Math.min(paid / required, 1) : 0;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: ratio,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [ratio]);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const paidDisplay = formatKES(paid);
  const requiredDisplay = formatKES(required);

  return (
    <View style={{ gap: 6 }}>
      {showLabels && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: 'Nunito_400Regular' }}>
            {paidDisplay} paid
          </Text>
          <Text style={{ fontSize: 13, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
            {requiredDisplay} required
          </Text>
        </View>
      )}
      <View
        style={{
          height: 8,
          backgroundColor: colors.lightGray,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            width: widthInterpolated,
            backgroundColor: ratio >= 1 ? colors.leaf : ratio > 0.5 ? colors.sky : colors.danger,
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  );
}
