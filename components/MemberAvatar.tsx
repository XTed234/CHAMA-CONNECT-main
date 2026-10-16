import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '@/theme/colors';

interface MemberAvatarProps {
  name: string;
  size?: number;
  bgColor?: string;
  textColor?: string;
}

export function MemberAvatar({
  name,
  size = 40,
  bgColor = colors.forest,
  textColor = colors.white,
}: MemberAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const fontSize = size * 0.38;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '700',
          color: textColor,
          fontFamily: 'Nunito_700Bold',
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
