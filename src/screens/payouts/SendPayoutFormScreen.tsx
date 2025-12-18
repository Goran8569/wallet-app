import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "../../store/services/api";
import { useAppSelector } from "../../store/hooks";
import { PayoutRequest, Wallet, PayoutProvider } from "../../types";
import { getCurrencyId, getCurrencyCode } from "../../utils/currency";
import { mapWalletToBalance } from "../../utils/transactionMapper";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { validateBalance } from "../../utils/validation";
import CollapsibleHeader, { useCollapsibleHeader } from "../../components/CollapsibleHeader";
import { colors } from "../../utils/colors";

const MOCK_BANK_ACCOUNTS = [
  { id: 1, bank_name: "Example Bank", account_number: "****1234" },
  { id: 2, bank_name: "Another Bank", account_number: "****5678" },
];

export default function SendPayoutFormScreen() {
  const { scrollY, headerHeight, handleScroll } = useCollapsibleHeader();

  const selectedCurrency = useAppSelector((state) => state.wallet.selectedCurrency);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(selectedCurrency || "USD");
  const [provider, setProvider] = useState<PayoutProvider>(PayoutProvider.BANK);
  const [walletId, setWalletId] = useState<number | null>(null);
  const [bankId, setBankId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const navigation = useNavigation();

  const { data: wallets } = useQuery({
    queryKey: ["balances"],
    queryFn: () => apiService.getBalances(),
  });

  const balances = useMemo(() => wallets?.map(mapWalletToBalance) || [], [wallets]);
  const availableCurrencies = useMemo(() => balances?.map((b) => b.currency) || [], [balances]);

  const selectedWallet = useMemo(() => wallets?.find((w) => getCurrencyCode(w.currency_id) === currency), [wallets, currency]);

  useEffect(() => {
    if (availableCurrencies.length > 0 && !currency) {
      setCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, currency]);

  useEffect(() => {
    if (selectedWallet) {
      setWalletId(selectedWallet.id);
    }
  }, [selectedWallet]);

  const currentBalance = useMemo(() => balances?.find((b) => b.currency === currency), [balances, currency]);

  const validate = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!amount) {
      newErrors.amount = "Amount is required";
    } else {
      const balance = currentBalance ? parseFloat(currentBalance.amount) : 0;
      const validation = validateBalance(amount, balance);
      if (!validation.isValid && validation.error) {
        newErrors.amount = validation.error;
      }
    }

    if (!currency || !walletId) {
      newErrors.currency = "Currency is required";
    }

    if (provider === PayoutProvider.BANK && !bankId) {
      newErrors.bankId = "Bank account is required for bank transfers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [amount, currentBalance, currency, walletId, provider, bankId]);

  const handleNext = useCallback(() => {
    if (validate() && walletId) {
      const currencyId = getCurrencyId(currency);
      if (!currencyId) {
        setErrors({ currency: "Invalid currency" });
        return;
      }

      const payoutData: PayoutRequest = {
        wallet_id: walletId,
        provider,
        amount: parseFloat(amount),
        currency_id: currencyId,
        ...(provider === PayoutProvider.BANK && bankId ? { bank_id: bankId } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      };
      (navigation as any).navigate("SendPayoutReview", { payoutData });
    }
  }, [validate, walletId, currency, provider, amount, bankId, note, navigation]);

  const handleProviderChange = useCallback((newProvider: PayoutProvider) => {
    setProvider(newProvider);
  }, []);

  const handleCurrencyChange = useCallback((newCurrency: string) => {
    setCurrency(newCurrency);
  }, []);

  const handleBankSelect = useCallback((id: number) => {
    setBankId(id);
  }, []);

  return (
    <View style={styles.container}>
      <CollapsibleHeader title="Send Payout" scrollY={scrollY} />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight + 60 }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}>
        <View style={styles.form}>
          <Input label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" error={errors.amount} />

          <View style={styles.currencySelector}>
            <Text style={styles.label}>Currency</Text>
            <View style={styles.currencyChips}>
              {availableCurrencies.map((curr) => (
                <TouchableOpacity key={curr} style={[styles.currencyChip, currency === curr && styles.currencyChipActive]} onPress={() => handleCurrencyChange(curr)}>
                  <Text style={[styles.currencyChipText, currency === curr && styles.currencyChipTextActive]}>{curr.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.currency && <Text style={styles.errorText}>{errors.currency}</Text>}
          </View>

          <View style={styles.providerSelector}>
            <Text style={styles.label}>Payment Method</Text>
            <TouchableOpacity style={[styles.providerOption, provider === PayoutProvider.BANK && styles.providerOptionActive]} onPress={() => handleProviderChange(PayoutProvider.BANK)}>
              <Text style={[styles.providerOptionText, provider === PayoutProvider.BANK && styles.providerOptionTextActive]}>Bank Transfer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.providerOption, provider === PayoutProvider.CARD && styles.providerOptionActive]} onPress={() => handleProviderChange(PayoutProvider.CARD)}>
              <Text style={[styles.providerOptionText, provider === PayoutProvider.CARD && styles.providerOptionTextActive]}>Card</Text>
            </TouchableOpacity>
          </View>

          {provider === PayoutProvider.BANK && (
            <View style={styles.bankSelector}>
              <Text style={styles.label}>Bank Account</Text>
              {MOCK_BANK_ACCOUNTS.map((bank) => (
                <TouchableOpacity key={bank.id} style={[styles.bankOption, bankId === bank.id && styles.bankOptionActive]} onPress={() => handleBankSelect(bank.id)}>
                  <View>
                    <Text style={styles.bankName}>{bank.bank_name}</Text>
                    <Text style={styles.bankAccount}>{bank.account_number}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {errors.bankId && <Text style={styles.errorText}>{errors.bankId}</Text>}
            </View>
          )}

          <Input label="Note (Optional)" value={note} onChangeText={setNote} placeholder="Add a note for this payout" multiline numberOfLines={3} error={errors.note} />

          {currentBalance && (
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Available Balance:</Text>
              <Text style={styles.balanceAmount}>
                {currentBalance.amount} {currentBalance.currency.toUpperCase()}
              </Text>
            </View>
          )}

          <Button title="Review" onPress={handleNext} style={styles.nextButton} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  form: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  currencySelector: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  currencyChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  currencyChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  currencyChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  currencyChipTextActive: {
    color: colors.textPrimary,
  },
  providerSelector: {
    marginBottom: 16,
  },
  providerOption: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  providerOptionActive: {
    backgroundColor: colors.backgroundTertiary,
    borderColor: colors.primary,
  },
  providerOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  providerOptionTextActive: {
    color: colors.primary,
    fontWeight: "500",
  },
  bankSelector: {
    marginBottom: 16,
  },
  bankOption: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bankOptionActive: {
    backgroundColor: colors.backgroundTertiary,
    borderColor: colors.primary,
  },
  bankName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  bankAccount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  balanceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  nextButton: {
    marginTop: 8,
  },
});
