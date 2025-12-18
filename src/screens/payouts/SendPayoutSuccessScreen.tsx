import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { PayoutResponseData } from "../../types";
import { getCurrencyCode } from "../../utils/currency";
import Button from "../../components/Button";
import ScreenLayout from "../../components/ScreenLayout";
import { formatCurrency, formatDate } from "../../utils/validation";
import { colors } from "../../utils/colors";

export default function SendPayoutSuccessScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { payoutResponse }: { payoutResponse: PayoutResponseData } = (route.params as any) || {};

  const handleDone = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" as never }],
    });
  }, [navigation]);

  const currency = useMemo(() => (payoutResponse ? getCurrencyCode(payoutResponse.currency_id) : "USD"), [payoutResponse]);

  return (
    <ScreenLayout contentContainerStyle={styles.content}>
      <View style={styles.successIcon}>
        <Text style={styles.successIconText}>✓</Text>
      </View>

      <Text style={styles.title}>Payout Successful!</Text>
      <Text style={styles.subtitle}>Your payout has been processed</Text>

      {payoutResponse && (
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>{formatCurrency(payoutResponse.amount.toString(), currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={styles.summaryValue}>{payoutResponse.status}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transaction ID</Text>
            <Text style={styles.summaryValue}>{payoutResponse.id}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>{formatDate(payoutResponse.created_at)}</Text>
          </View>
        </View>
      )}

      <Button title="Done" onPress={handleDone} style={styles.doneButton} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 48,
    color: colors.textPrimary,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: "center",
  },
  summary: {
    width: "100%",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  doneButton: {
    width: "100%",
    minWidth: 200,
  },
});
