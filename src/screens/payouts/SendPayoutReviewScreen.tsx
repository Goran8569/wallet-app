import React, { useCallback } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../../store/services/api";
import { PayoutRequest } from "../../types";
import { getCurrencyCode } from "../../utils/currency";
import Button from "../../components/Button";
import { formatCurrency } from "../../utils/validation";
import Toast from "react-native-toast-message";
import CollapsibleHeader, { useCollapsibleHeader } from "../../components/CollapsibleHeader";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setPayoutLoading } from "../../store/slices/walletSlice";
import { colors } from "../../utils/colors";

export default function SendPayoutReviewScreen() {
  const dispatch = useAppDispatch();

  const { scrollY, headerHeight, handleScroll } = useCollapsibleHeader();

  const isPayoutLoading = useAppSelector((state) => state.wallet.isPayoutLoading);

  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { payoutData }: { payoutData: PayoutRequest } = (route.params as any) || {};

  const payoutMutation = useMutation({
    mutationFn: (data: PayoutRequest) => apiService.createPayout(data),
    onMutate: () => {
      dispatch(setPayoutLoading(true));
    },
    onSuccess: (response) => {
      // Invalidate balances and transactions queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      dispatch(setPayoutLoading(false));
      (navigation as any).navigate("SendPayoutSuccess", { payoutResponse: response.data });
    },
    onError: (error: any) => {
      dispatch(setPayoutLoading(false));
      Toast.show({
        type: "error",
        text1: "Payout failed",
        text2: error.message || "Please try again",
      });
    },
  });

  const handleSubmit = useCallback(() => {
    if (payoutData) {
      payoutMutation.mutate(payoutData);
    }
  }, [payoutData, payoutMutation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (!payoutData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No payout data found</Text>
        <Button title="Go Back" onPress={handleBack} />
      </View>
    );
  }

  if (isPayoutLoading) {
    return <LoadingSpinner />;
  }

  const currency = getCurrencyCode(payoutData.currency_id);

  return (
    <View style={styles.container}>
      <CollapsibleHeader title="Review Payout" scrollY={scrollY} />

      <Animated.ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingTop: headerHeight + 60 }]} onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>Review Payout</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={styles.infoValue}>{formatCurrency(payoutData.amount.toString(), currency)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Currency</Text>
            <Text style={styles.infoValue}>{currency.toUpperCase()}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>{payoutData.provider === "bank" ? "Bank Transfer" : "Card"}</Text>
          </View>

          {payoutData.bank_id && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bank Account</Text>
              <Text style={styles.infoValue}>ID: {payoutData.bank_id}</Text>
            </View>
          )}

          {payoutData.note && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Note</Text>
              <Text style={styles.infoValue}>{payoutData.note}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Button title="Confirm & Send" onPress={handleSubmit} loading={payoutMutation.isPending} disabled={payoutMutation.isPending} style={styles.submitButton} />
          <Button title="Back" onPress={handleBack} variant="outline" disabled={payoutMutation.isPending} />
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
  reviewSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
    flex: 1,
    textAlign: "right",
  },
  actions: {
    gap: 12,
  },
  submitButton: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: "center",
    marginBottom: 16,
  },
});
