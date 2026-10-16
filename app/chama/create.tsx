import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChama } from '@/contexts/ChamaContext';
import { colors } from '@/theme/colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { createChama } from '@/utils/firestore';

export default function CreateChamaScreen() {
  const { user } = useAuth();
  const { refreshChama } = useChama();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [fineAmount, setFineAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const descRef = useRef<TextInput>(null);
  const amountRef = useRef<TextInput>(null);
  const dayRef = useRef<TextInput>(null);
  const fineRef = useRef<TextInput>(null);

  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [dayFocused, setDayFocused] = useState(false);
  const [fineFocused, setFineFocused] = useState(false);

  const validate = (): string | null => {
    if (!name.trim()) return 'Chama name is required.';
    if (!description.trim()) return 'Description is required.';
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) return 'Enter a valid contribution amount.';
    const day = parseInt(dueDay);
    if (isNaN(day) || day < 1 || day > 28) return 'Due day must be between 1 and 28.';
    const fine = parseFloat(fineAmount);
    if (isNaN(fine) || fine < 0) return 'Enter a valid fine amount.';
    return null;
  };

  const handleCreate = async () => {
    console.log('[CreateChama] Create chama button pressed:', name);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!user) return;
    setError('');
    setLoading(true);
    try {
      await createChama(user.uid, {
        name: name.trim(),
        description: description.trim(),
        contributionAmount: parseFloat(contributionAmount),
        contributionDayOfMonth: parseInt(dueDay),
        fineAmount: parseFloat(fineAmount),
        chairpersonName: user.fullName,
        chairpersonEmail: user.email,
      });
      console.log('[CreateChama] Chama created successfully');
      refreshChama();
      router.replace('/(tabs)/(home)');
    } catch (err) {
      console.error('[CreateChama] Error:', err);
      setError('Could not create chama. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (focused: boolean) => ({
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15 as const,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: focused ? colors.primary : 'transparent',
    fontFamily: 'Nunito_400Regular',
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 14, color: colors.textSecondary, fontFamily: 'Nunito_400Regular', lineHeight: 20 }}>
          Set up your chama's details. You'll be the chairperson and can manage members and contributions.
        </Text>

        {/* Chama Name */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
            Chama name *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Umoja Savings Group"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => descRef.current?.focus()}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            style={inputStyle(nameFocused)}
          />
        </View>

        {/* Description */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
            Description *
          </Text>
          <TextInput
            ref={descRef}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of your chama"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            returnKeyType="next"
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
            style={[inputStyle(descFocused), { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }]}
          />
        </View>

        {/* Contribution Amount */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
            Monthly contribution (KES) *
          </Text>
          <TextInput
            ref={amountRef}
            value={contributionAmount}
            onChangeText={setContributionAmount}
            placeholder="e.g. 5000"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => dayRef.current?.focus()}
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
            style={inputStyle(amountFocused)}
          />
        </View>

        {/* Due Day */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
            Contribution due day (1–28) *
          </Text>
          <TextInput
            ref={dayRef}
            value={dueDay}
            onChangeText={setDueDay}
            placeholder="e.g. 5"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => fineRef.current?.focus()}
            onFocus={() => setDayFocused(true)}
            onBlur={() => setDayFocused(false)}
            style={inputStyle(dayFocused)}
          />
        </View>

        {/* Fine Amount */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
            Late fine amount (KES) *
          </Text>
          <TextInput
            ref={fineRef}
            value={fineAmount}
            onChangeText={setFineAmount}
            placeholder="e.g. 500"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={handleCreate}
            onFocus={() => setFineFocused(true)}
            onBlur={() => setFineFocused(false)}
            style={inputStyle(fineFocused)}
          />
        </View>

        {/* Error */}
        {error ? (
          <View style={{ backgroundColor: 'rgba(192,57,43,0.08)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(192,57,43,0.2)' }}>
            <Text style={{ fontSize: 13, color: colors.danger, fontFamily: 'Nunito_400Regular' }}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Create Button */}
        <AnimatedPressable
          onPress={handleCreate}
          disabled={loading}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            marginTop: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700', fontFamily: 'Nunito_700Bold' }}>
              Create chama
            </Text>
          )}
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
