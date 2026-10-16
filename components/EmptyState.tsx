import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/theme/colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon: Icon, title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        <Icon size={32} color={colors.primary} strokeWidth={1.5} />
      </View>
      <Text
        style={{
          fontSize: 17,
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
          fontFamily: 'Nunito_700Bold',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
          maxWidth: 280,
          fontFamily: 'Nunito_400Regular',
        }}
      >
        {subtitle}
      </Text>
      {ctaLabel && onCta && (
        <AnimatedPressable
          onPress={onCta}
          style={{
            marginTop: 8,
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontSize: 15,
              fontWeight: '600',
              fontFamily: 'Nunito_600SemiBold',
            }}
          >
            {ctaLabel}
          </Text>
        </AnimatedPressable>
      )}
    </View>
  );
}
