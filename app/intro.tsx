import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  useWindowDimensions,
  StyleSheet,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { AppLogo } from '@/components/AppLogo';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useAuth } from '@/contexts/AuthContext';

interface IntroSlide {
  id: string;
  tag: string;
  icon: typeof Sparkles;
  title: string;
  highlight: string;
  description: string;
  image: ImageSourcePropType;
}

const SLIDES: IntroSlide[] = [
  {
    id: '1',
    tag: 'SMART COMMUNITY SAVINGS',
    icon: Sparkles,
    title: 'Empower Your',
    highlight: 'Merry-Go-Round',
    description:
      'Automate your Chama contributions, monitor transparent rotation cycles, and track every member with zero disputes.',
    image: require('@/assets/images/intro_slide1.jpg'),
  },
  {
    id: '2',
    tag: 'AUTOMATED & TRANSPARENT',
    icon: ShieldCheck,
    title: 'Fair Queues &',
    highlight: 'Instant Payouts',
    description:
      'Experience clear rotation orders, automated fine calculations, and real-time payout alerts built for trust and peace of mind.',
    image: require('@/assets/images/intro_slide2.jpg'),
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { setHasSeenIntro } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<IntroSlide>>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await setHasSeenIntro(true);
    router.push('/auth/register');
  };

  const handleSignIn = async () => {
    await setHasSeenIntro(true);
    router.push('/auth/login');
  };

  const handleSkip = async () => {
    await setHasSeenIntro(true);
    router.push('/auth/login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 12 }]}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <AppLogo size={36} />
        </View>

        <TouchableOpacity
          onPress={handleSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Sliding Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => {
          const TagIcon = item.icon;
          return (
            <View style={[styles.slide, { width }]}>
              {/* Slide Image Box */}
              <View style={styles.imageCard}>
                <Image source={item.image} style={styles.image} resizeMode="contain" />
              </View>

              {/* Slide Text Content */}
              <View style={styles.contentBox}>
                <View style={styles.tagPill}>
                  <TagIcon size={13} color={colors.primary} />
                  <Text style={styles.tagText}>{item.tag}</Text>
                </View>

                <Text style={styles.title}>
                  {item.title}{' '}
                  <Text style={styles.titleHighlight}>{item.highlight}</Text>
                </Text>

                <Text style={styles.description}>{item.description}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Bottom Controls */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Buttons */}
        {currentIndex === 0 ? (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={handleSignIn} style={styles.textButton}>
              <Text style={styles.textButtonLabel}>Sign In</Text>
            </TouchableOpacity>

            <AnimatedPressable onPress={handleNext} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>Next</Text>
              <ArrowRight size={18} color={colors.white} />
            </AnimatedPressable>
          </View>
        ) : (
          <View style={styles.finalActions}>
            <AnimatedPressable onPress={handleGetStarted} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Get Started — Create Account</Text>
              <ChevronRight size={18} color={colors.white} />
            </AnimatedPressable>

            <TouchableOpacity onPress={handleSignIn} style={styles.secondarySignInButton}>
              <Text style={styles.secondarySignInText}>
                Already have an account?{' '}
                <Text style={styles.secondarySignInHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  logoBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 86, 219, 0.08)',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Nunito_700Bold',
  },
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCard: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 330,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(26, 86, 219, 0.08)',
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentBox: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 86, 219, 0.10)',
    marginBottom: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
    fontFamily: 'Nunito_800ExtraBold',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 34,
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  titleHighlight: {
    color: colors.primary,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    gap: 20,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(26, 86, 219, 0.20)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  textButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: 'Nunito_700Bold',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    fontFamily: 'Nunito_700Bold',
  },
  finalActions: {
    gap: 12,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: -0.2,
  },
  secondarySignInButton: {
    paddingVertical: 8,
  },
  secondarySignInText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Nunito_600SemiBold',
  },
  secondarySignInHighlight: {
    color: colors.primary,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
  },
});
