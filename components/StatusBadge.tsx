import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/theme/colors';

type BadgeVariant =
  | 'active'
  | 'pending'
  | 'exit_requested'
  | 'exited'
  | 'paid'
  | 'partial'
  | 'unpaid'
  | 'outstanding'
  | 'next'
  | 'waiting'
  | 'chairperson'
  | 'member';

const BADGE_CONFIG: Record<BadgeVariant, { bg: string; text: string; label: string }> = {
  active: { bg: 'rgba(62,142,222,0.15)', text: colors.sky, label: 'Active' },
  pending: { bg: 'rgba(26,86,219,0.12)', text: colors.primary, label: 'Pending' },
  exit_requested: { bg: 'rgba(239,68,68,0.12)', text: colors.danger, label: 'Exit Requested' },
  exited: { bg: 'rgba(100,116,139,0.15)', text: colors.gray, label: 'Exited' },
  paid: { bg: 'rgba(16,185,129,0.15)', text: '#059669', label: 'Paid' },
  partial: { bg: 'rgba(62,142,222,0.15)', text: colors.sky, label: 'Partial' },
  unpaid: { bg: 'rgba(239,68,68,0.12)', text: colors.danger, label: 'Unpaid' },
  outstanding: { bg: 'rgba(239,68,68,0.12)', text: colors.danger, label: 'Outstanding' },
  next: { bg: 'rgba(26,86,219,0.12)', text: colors.primary, label: 'Next' },
  waiting: { bg: 'rgba(100,116,139,0.12)', text: colors.gray, label: 'Waiting' },
  chairperson: { bg: 'rgba(26,86,219,0.14)', text: colors.primary, label: 'Chairperson' },
  member: { bg: 'rgba(62,142,222,0.14)', text: colors.sky, label: 'Member' },
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ variant, label, size = 'md' }: StatusBadgeProps) {
  const config = BADGE_CONFIG[variant] || BADGE_CONFIG.waiting;
  const displayLabel = label || config.label;
  const fontSize = size === 'sm' ? 10 : 12;
  const paddingH = size === 'sm' ? 6 : 8;
  const paddingV = size === 'sm' ? 2 : 3;

  return (
    <View
      style={{
        backgroundColor: config.bg,
        borderRadius: 6,
        paddingHorizontal: paddingH,
        paddingVertical: paddingV,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '600',
          color: config.text,
          fontFamily: 'Nunito_600SemiBold',
        }}
      >
        {displayLabel}
      </Text>
    </View>
  );
}
