import React from 'react';
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';

export const APP_LOGO_SOURCE = require('@/assets/images/logo_icon.png');

export interface AppLogoProps {
  /** Desired width of the logo image */
  width?: number;
  /** Desired height of the logo image */
  height?: number;
  /**
   * Size shortcut for square icon; sets width and height equally.
   * Example: size=80 results in an 80x80 crisp prominent logo.
   */
  size?: number;
  /** Image style overrides */
  style?: StyleProp<ImageStyle>;
  /** Optional container style */
  containerStyle?: StyleProp<ViewStyle>;
  /** Wrap the logo in a clean, elevated white card/badge */
  withCardBackground?: boolean;
}

/**
 * AppLogo component renders the Chama Connect emblem with high resolution and crisp detail.
 */
export function AppLogo({
  width,
  height,
  size,
  style,
  containerStyle,
  withCardBackground = false,
}: AppLogoProps) {
  let finalWidth = width;
  let finalHeight = height;

  if (size) {
    finalHeight = size;
    finalWidth = size;
  } else if (width && !height) {
    finalHeight = width;
  } else if (!width && height) {
    finalWidth = height;
  } else if (!width && !height) {
    finalWidth = 48;
    finalHeight = 48;
  }

  const imageElement = (
    <Image
      source={APP_LOGO_SOURCE}
      style={[
        {
          width: finalWidth,
          height: finalHeight,
        },
        style,
      ]}
      resizeMode="contain"
      accessibilityLabel="Chama Connect Logo"
    />
  );

  if (withCardBackground) {
    return (
      <View
        style={[
          {
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 4,
          },
          containerStyle,
        ]}
      >
        {imageElement}
      </View>
    );
  }

  if (containerStyle) {
    return <View style={containerStyle}>{imageElement}</View>;
  }

  return imageElement;
}

export default AppLogo;
