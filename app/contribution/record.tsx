import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useChama } from '@/contexts/ChamaContext';
import { colors } from '@/theme/colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { ContributionProgressBar } from '@/components/ContributionProgressBar';
import {
  getActiveCycle,
  getUserContributions,
  recordContribution,
  formatKES,
} from '@/utils/firestore';
import { Cycle, Contribution } from '@/types';
import { CreditCard, X } from 'lucide-react-native';

export default function RecordContributionScreen() {
  const { user } = useAuth();
  const { userChama, membership } = useChama();
  const router = useRouter();

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [existingContrib, setExistingContrib] = useState<Contribution | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [amountFocused, setAmountFocused] = useState(false);

  useEffect(() => {
    if (!userChama || !user) return;
    console.log('[RecordContribution] Loading cycle data');
    const load = async () => {
      try {
        const cycleData = await getActiveCycle(userChama.id);
        setCycle(cycleData);
        if (cycleData) {
          const contribs = await getUserContributions(user.uid, userChama.id);
          const current = contribs.find((c) => c.cycleId === cycleData.id);
          setExistingContrib(current || null);
          const required = userChama.contributionAmount;
          const paid = current?.amount || 0;
          const remaining = Math.max(0, required - paid);
          setAmount(remaining > 0 ? String(remaining) : '');
        }
      } catch (err) {
        console.error('[RecordContribution] Load error:', err);
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, [userChama, user]);

  const handleRecord = async () => {
    console.log('[RecordContribution] Record button pressed, amount:', amount);
    if (!amount.trim()) {
      setError('Please enter an amount.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!user || !userChama || !cycle) {
      setError('No active cycle found. Ask the chairperson to start a cycle.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await recordContribution(user.uid, userChama.id, cycle.id, numAmount, user.fullName);
      console.log('[RecordContribution] Contribution recorded successfully');
      Alert.alert('Success', `Contribution of ${formatKES(numAmount)} recorded successfully!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('[RecordContribution] Error:', err);
      setError('Could not record contribution. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const required = userChama?.contributionAmount || 0;
  const paid = existingContrib?.amount || 0;
  const remaining = Math.max(0, required - paid);

  if (dataLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: 'Nunito_700Bold' }}>
                Record contribution
              </Text>
              {cycle && (
                <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Nunito_400Regular' }}>
                  Cycle {cycle.cycleNumber}
                </Text>
              )}
            </View>
          </View>
          <AnimatedPressable
            onPress={() => {
              console.log('[RecordContribution] Close button pressed');
              router.back();
            }}
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} color={colors.textSecondary} />
          </AnimatedPressable>
        </View>

        {/* Progress */}
        {cycle && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginBottom: 2 }}>
                  Required
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, fontFamily: 'Nunito_800ExtraBold' }}>
                  {formatKES(required)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginBottom: 2 }}>
                  Already paid
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.leaf, fontFamily: 'Nunito_800ExtraBold' }}>
                  {formatKES(paid)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Nunito_400Regular', marginBottom: 2 }}>
                  Remaining
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: remaining > 0 ? colors.danger : colors.leaf, fontFamily: 'Nunito_800ExtraBold' }}>
                  {formatKES(remaining)}
                </Text>
              </View>
            </View>
            <ContributionProgressBar paid={paid} required={required} showLabels={false} />
          </View>
        )}

        {!cycle && (
          <View style={{ backgroundColor: 'rgba(192,57,43,0.08)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(192,57,43,0.2)' }}>
            <Text style={{ fontSize: 14, color: colors.danger, fontFamily: 'Nunito_400Regular', textAlign: 'center' }}>
              No active cycle. Ask the chairperson to start a cycle first.
            </Text>
          </View>
        )}

        {/* Amount Input */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, fontFamily: 'Nunito_600SemiBold' }}>
            Amount (KES) *
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder={`e.g. ${remaining > 0 ? remaining : required}`}
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={handleRecord}
            onFocus={() => {
              console.log('[RecordContribution] Amount input focused');
              setAmountFocused(true);
            }}
            onBlur={() => setAmountFocused(false)}
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 20,
              color: colors.text,
              borderWidth: 1.5,
              borderColor: amountFocused ? colors.primary : 'transparent',
              fontFamily: 'Nunito_700Bold',
              textAlign: 'center',
            }}
            autoFocus
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

        {/* Submit */}
        <AnimatedPressable
          onPress={handleRecord}
          disabled={loading || !cycle}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700', fontFamily: 'Nunito_700Bold' }}>
              Record contribution
            </Text>
          )}
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
