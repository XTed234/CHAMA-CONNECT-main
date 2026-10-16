import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
  Sparkles,
  User as UserIcon,
  Crown,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AppLogo } from '@/components/AppLogo';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const handleSignIn = async () => {
    console.log('[Login] Sign in button pressed, email:', email);
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      console.log('[Login] Sign in successful, navigating to tabs');
      router.replace('/(tabs)/(home)');
    } catch (err: unknown) {
      console.error('[Login] Sign in error:', err);
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg || 'Sign in failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'chairperson' | 'member') => {
    if (role === 'chairperson') {
      setEmail('faith.wanjiku@connectchama.ke');
      setPassword('password123');
      await signIn(
        'faith.wanjiku@connectchama.ke',
        'password123',
        'Faith Wanjiku',
        'chairperson'
      );
    } else {
      setEmail('david.kiprono@example.com');
      setPassword('password123');
      await signIn(
        'david.kiprono@example.com',
        'password123',
        'David Kiprono',
        'member'
      );
    }
    router.replace('/(tabs)/(home)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 28,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header with Large Prominent Logo */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <AppLogo size={76} />
          </View>

          <Text style={styles.brandTitle}>CHAMA CONNECT</Text>
          <Text style={styles.brandSubtitle}>
            Smart Merry-Go-Round & Chama Management
          </Text>
        </View>

        {/* Main Content Card */}
        <View style={styles.formContainer}>
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to manage your circles and contributions
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/intro')}
              style={styles.introPill}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Sparkles size={13} color={colors.primary} />
              <Text style={styles.introPillText}>Intro</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Demo Segment */}
          <View style={styles.demoCard}>
            <Text style={styles.demoHeader}>1-TAP TEST SIGN IN:</Text>
            <View style={styles.demoPillsRow}>
              <TouchableOpacity
                onPress={() => handleQuickDemo('chairperson')}
                style={styles.demoPill}
                activeOpacity={0.7}
              >
                <Crown size={15} color={colors.primary} />
                <Text style={styles.demoPillText}>Faith (Chairperson)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleQuickDemo('member')}
                style={styles.demoPill}
                activeOpacity={0.7}
              >
                <UserIcon size={15} color={colors.sky} />
                <Text style={styles.demoPillText}>David (Member)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View
              style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
              ]}
            >
              <Mail
                size={19}
                color={emailFocused ? colors.primary : colors.textTertiary}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. alice@example.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={styles.textInputField}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
              ]}
            >
              <Lock
                size={19}
                color={passwordFocused ? colors.primary : colors.textTertiary}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder="Your secure password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                style={[styles.textInputField, { paddingRight: 44 }]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeIconButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={19} color={colors.textTertiary} />
                ) : (
                  <Eye size={19} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Notice */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* Primary Action Button */}
          <AnimatedPressable
            onPress={handleSignIn}
            disabled={loading}
            style={styles.signInButton}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Text style={styles.signInButtonText}>Sign In</Text>
                <ArrowRight size={19} color={colors.white} />
              </>
            )}
          </AnimatedPressable>

          {/* Register Prompt */}
          <View style={styles.registerRow}>
            <Text style={styles.registerPromptText}>Don't have an account?</Text>
            <AnimatedPressable
              onPress={() => {
                console.log('[Login] Navigate to register');
                router.push('/auth/register');
              }}
            >
              <Text style={styles.registerLinkText}>Create Account</Text>
            </AnimatedPressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(26, 86, 219, 0.08)',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.6,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
    maxWidth: 290,
  },
  formContainer: {
    width: '100%',
    gap: 18,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  introPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(26, 86, 219, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(26, 86, 219, 0.14)',
  },
  introPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Nunito_700Bold',
  },
  demoCard: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  demoHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    fontFamily: 'Nunito_800ExtraBold',
  },
  demoPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 86, 219, 0.16)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  demoPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Nunito_700Bold',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    fontFamily: 'Nunito_700Bold',
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  inputLeadingIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  textInputField: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 15,
    color: '#0F172A',
    fontFamily: 'Nunito_400Regular',
  },
  eyeIconButton: {
    position: 'absolute',
    right: 14,
    padding: 4,
    zIndex: 1,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.20)',
  },
  errorBannerText: {
    fontSize: 13,
    color: colors.danger,
    fontFamily: 'Nunito_600SemiBold',
  },
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  signInButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: -0.2,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  registerPromptText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Nunito_400Regular',
  },
  registerLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
  },
});
