import React, { useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "../../store/services/api";
import { useAppSelector } from "../../store/hooks";
import { mapWalletToBalance } from "../../utils/transactionMapper";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { validateAmount } from "../../utils/validation";
import Toast from "react-native-toast-message";
import CollapsibleHeader, { useCollapsibleHeader } from "../../components/CollapsibleHeader";
import { colors } from "../../utils/colors";

const PAYMENT_METHODS = [
  { id: "card", label: "Credit/Debit Card" },
  { id: "bank", label: "Bank Transfer" },
];

export default function AddFundsScreen() {
  const { scrollY, headerHeight, handleScroll } = useCollapsibleHeader();

  const selectedCurrency = useAppSelector((state) => state.wallet.selectedCurrency);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [errors, setErrors] = useState<{ amount?: string }>({});

  const navigation = useNavigation();

  const { data: wallets } = useQuery({
    queryKey: ["balances"],
    queryFn: () => apiService.getBalances(),
  });

  const balances = useMemo(() => wallets?.map(mapWalletToBalance) || [], [wallets]);
  const availableCurrencies = useMemo(() => balances?.map((b) => b.currency) || [], [balances]);
  const currency = useMemo(() => selectedCurrency || availableCurrencies[0] || "USD", [selectedCurrency, availableCurrencies]);

  const validate = useCallback((): boolean => {
    const validation = validateAmount(amount);
    if (!validation.isValid) {
      setErrors({ amount: validation.error });
      return false;
    }
    setErrors({});
    return true;
  }, [amount]);

  const handleSubmit = useCallback(() => {
    if (validate()) {
      Toast.show({
        type: "success",
        text1: "Funds Added",
        text2: `Successfully added ${amount} ${currency.toUpperCase()}`,
      });
      navigation.goBack();
    }
  }, [validate, amount, currency, navigation]);

  const handleMethodChange = useCallback((newMethod: string) => {
    setMethod(newMethod);
  }, []);

  const contentStyle = useMemo(() => ({ paddingTop: headerHeight + 60 }), [headerHeight]);

  return (
    <View style={styles.container}>
      <CollapsibleHeader title="Add Funds" scrollY={scrollY} />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, contentStyle]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}>
        <View style={styles.form}>
          <Input label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" error={errors.amount} />

          <View style={styles.currencyInfo}>
            <Text style={styles.label}>Currency</Text>
            <Text style={styles.currencyValue}>{currency.toUpperCase()}</Text>
          </View>

          <View style={styles.methodSelector}>
            <Text style={styles.label}>Payment Method</Text>
            {PAYMENT_METHODS.map((pm) => (
              <TouchableOpacity key={pm.id} style={[styles.methodOption, method === pm.id && styles.methodOptionActive]} onPress={() => handleMethodChange(pm.id)}>
                <Text style={[styles.methodOptionText, method === pm.id && styles.methodOptionTextActive]}>{pm.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button title="Add Funds" onPress={handleSubmit} style={styles.submitButton} />
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
  currencyInfo: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  currencyValue: {
    fontSize: 16,
    color: colors.textSecondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  methodSelector: {
    marginBottom: 16,
  },
  methodOption: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodOptionActive: {
    backgroundColor: colors.backgroundTertiary,
    borderColor: colors.primary,
  },
  methodOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  methodOptionTextActive: {
    color: colors.primary,
    fontWeight: "500",
  },
  submitButton: {
    marginTop: 8,
  },
});
