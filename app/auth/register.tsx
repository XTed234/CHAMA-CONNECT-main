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
  ArrowLeft,
  User as UserIcon,
  Crown,
  Phone,
  Mail,
  Lock,
  CheckCircle2,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AppLogo } from '@/components/AppLogo';
import { UserRole } from '@/types';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Please enter your full name.';
    if (!email.trim()) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleRegister = async () => {
    console.log('[Register] Create account pressed:', { fullName, email, role });
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);

    try {
      await signUp(
        email.trim(),
        password,
        fullName.trim(),
        role,
        phoneNumber.trim() || undefined
      );
      console.log('[Register] Account created and profile saved, navigating to tabs');
      router.replace('/(tabs)/(home)');
    } catch (err: unknown) {
      console.error('[Register] Error:', err);
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
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
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 28,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header with Back button and Large Logo */}
        <View style={styles.topNavigation}>
          <AnimatedPressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={18} color={colors.primary} />
          </AnimatedPressable>
          <Text style={styles.navTitle}>Create Account</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Brand Header */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <AppLogo size={68} />
          </View>
          <Text style={styles.brandTitle}>CHAMA CONNECT</Text>
          <Text style={styles.brandSubtitle}>
            Join your savings circle and track payouts with transparency
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Role Selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Select Your Role</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                onPress={() => setRole('member')}
                style={[
                  styles.roleOption,
                  role === 'member' && styles.roleOptionActive,
                ]}
                activeOpacity={0.7}
              >
                <UserIcon
                  size={18}
                  color={role === 'member' ? colors.primary : colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.roleOptionText,
                      role === 'member' && styles.roleOptionTextActive,
                    ]}
                  >
                    Member
                  </Text>
                  <Text style={styles.roleSubtext}>Join cycles & save</Text>
                </View>
                {role === 'member' && (
                  <CheckCircle2 size={16} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole('chairperson')}
                style={[
                  styles.roleOption,
                  role === 'chairperson' && styles.roleOptionActive,
                ]}
                activeOpacity={0.7}
              >
                <Crown
                  size={18}
                  color={role === 'chairperson' ? colors.primary : colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.roleOptionText,
                      role === 'chairperson' && styles.roleOptionTextActive,
                    ]}
                  >
                    Chairperson
                  </Text>
                  <Text style={styles.roleSubtext}>Lead & manage group</Text>
                </View>
                {role === 'chairperson' && (
                  <CheckCircle2 size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View
              style={[
                styles.inputWrapper,
                nameFocused && styles.inputWrapperFocused,
              ]}
            >
              <UserIcon
                size={18}
                color={nameFocused ? colors.primary : colors.textTertiary}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Alice Wanjiku"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                style={styles.textInputField}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View
              style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
              ]}
            >
              <Mail
                size={18}
                color={emailFocused ? colors.primary : colors.textTertiary}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                ref={emailRef}
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. alice@example.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                style={styles.textInputField}
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number (M-Pesa / SMS)</Text>
            <View
              style={[
                styles.inputWrapper,
                phoneFocused && styles.inputWrapperFocused,
              ]}
            >
              <Phone
                size={18}
                color={phoneFocused ? colors.primary : colors.textTertiary}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                ref={phoneRef}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="e.g. +254 712 345 678"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                style={styles.textInputField}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password *</Text>
            <View
              style={[
                styles.inputWrapper,
                passFocused && styles.inputWrapperFocused,
              ]}
            >
              <Lock
                size={18}
                color={passFocused ? colors.primary : colors.textTertiary}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
                style={[styles.textInputField, { paddingRight: 44 }]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeIconButton}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.textTertiary} />
                ) : (
                  <Eye size={18} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View
              style={[
                styles.inputWrapper,
                confirmFocused && styles.inputWrapperFocused,
              ]}
            >
              <Lock
                size={18}
                color={confirmFocused ? colors.primary : colors.textTertiary}
                style={styles.inputLeadingIcon}
              />
              <TextInput
                ref={confirmRef}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat your password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showConfirm}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                style={[styles.textInputField, { paddingRight: 44 }]}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm((v) => !v)}
                style={styles.eyeIconButton}
              >
                {showConfirm ? (
                  <EyeOff size={18} color={colors.textTertiary} />
                ) : (
                  <Eye size={18} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <AnimatedPressable
            onPress={handleRegister}
            disabled={loading}
            style={styles.submitButton}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Create Account</Text>
                <ArrowRight size={18} color={colors.white} />
              </>
            )}
          </AnimatedPressable>

          {/* Sign In Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginPromptText}>Already have an account?</Text>
            <AnimatedPressable onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLinkText}>Sign in</Text>
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
  },
  topNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 86, 219, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Nunito_700Bold',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 86,
    height: 86,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(26, 86, 219, 0.08)',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
    maxWidth: 290,
  },
  formContainer: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    fontFamily: 'Nunito_700Bold',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  roleOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(26, 86, 219, 0.06)',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Nunito_700Bold',
  },
  roleOptionTextActive: {
    color: colors.primary,
  },
  roleSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Nunito_400Regular',
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
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: -0.2,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Nunito_400Regular',
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
  },
});
