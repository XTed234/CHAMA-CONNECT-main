import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { colors } from '@/theme/colors';

interface SkeletonLineProps {
  width: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function SkeletonLine({ width, height = 14, borderRadius, style }: SkeletonLineProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius ?? height / 2,
          backgroundColor: colors.surfaceSecondary,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <SkeletonLine width={44} height={44} borderRadius={22} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonLine width="60%" height={14} />
          <SkeletonLine width="40%" height={12} />
        </View>
      </View>
      <SkeletonLine width="100%" height={12} />
      <SkeletonLine width="80%" height={12} />
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={{ padding: 20, gap: 16 }}>
      <SkeletonLine width="50%" height={28} />
      <SkeletonLine width="35%" height={16} />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <SkeletonCard />
        </View>
        <View style={{ flex: 1 }}>
          <SkeletonCard />
        </View>
      </View>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}
