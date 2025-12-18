import React, { useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiService } from "../../store/services/api";
import { cacheService } from "../../store/services/cache";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setSelectedCurrency } from "../../store/slices/walletSlice";
import { logout } from "../../store/slices/authSlice";
import { authService } from "../../store/services/auth";
import { mapWalletToBalance, MappedTransaction } from "../../utils/transactionMapper";
import { useTransactions } from "../../hooks/useTransactions";
import { formatCurrency, formatDate } from "../../utils/validation";
import { colors } from "../../utils/colors";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import AppHeader from "../../components/AppHeader";
import ScreenLayout from "../../components/ScreenLayout";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Feather from "@expo/vector-icons/Feather";

export default function WalletHomeScreen() {
  const dispatch = useAppDispatch();

  const selectedCurrency = useAppSelector((state) => state.wallet.selectedCurrency);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const {
    data: wallets,
    isLoading: balancesLoading,
    error: balancesError,
    refetch: refetchBalances,
  } = useQuery({
    queryKey: ["balances"],
    queryFn: async () => {
      try {
        const data = await apiService.getBalances();
        await cacheService.cacheBalances(data);
        return data;
      } catch (error: any) {
        if (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK" || !error.response) {
          const cached = await cacheService.getCachedBalances();
          if (cached && cached.length > 0) {
            return cached;
          }
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = useTransactions("wallet");

  useFocusEffect(
    useCallback(() => {
      refetchBalances();
      refetchTransactions();
    }, [refetchBalances, refetchTransactions])
  );

  const balances = useMemo(() => wallets?.map(mapWalletToBalance) || [], [wallets]);

  const primaryBalance = useMemo(() => balances?.find((b) => b.currency === selectedCurrency) || balances?.[0], [balances, selectedCurrency]);
  const recentTransactions = useMemo(() => transactionsData?.transactions?.slice(0, 3) || [], [transactionsData]);
  const headerHeight = useMemo(() => 60, []);

  const handleSendPayout = useCallback(() => {
    navigation.navigate("SendPayoutForm" as never);
  }, [navigation]);

  const handleAddFunds = useCallback(() => {
    navigation.navigate("AddFunds" as never);
  }, [navigation]);

  const handleSeeAll = useCallback(() => {
    (navigation as any).navigate("Transactions");
  }, [navigation]);

  const handleTransactionPress = useCallback(
    (transaction: MappedTransaction) => {
      (navigation as any).navigate("TransactionDetails", { transactionId: transaction.id });
    },
    [navigation]
  );

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
      dispatch(logout());
    } catch (error) {}
  }, [dispatch]);

  const balanceCurrency = useMemo(() => primaryBalance?.currency.toUpperCase() || "EUR", [primaryBalance]);
  const balanceAmount = useMemo(() => (primaryBalance ? formatCurrency(primaryBalance.amount, primaryBalance.currency) : formatCurrency("0.00", "EUR")), [primaryBalance]);

  const transactionStatusColor = useCallback((status: string) => {
    if (status === "completed") return colors.success;
    if (status === "declined" || status === "canceled") return colors.error;
    return colors.warning;
  }, []);

  const transactionStatusText = useCallback((status: string) => {
    if (status === "completed") return "Completed";
    if (status === "declined") return "Declined";
    if (status === "canceled") return "Canceled";
    return "Pending";
  }, []);

  useEffect(() => {
    if (balances && balances.length > 0 && !selectedCurrency) {
      dispatch(setSelectedCurrency(balances[0].currency));
    }
  }, [balances, selectedCurrency, dispatch]);

  if (balancesLoading || transactionsLoading) {
    return <LoadingSpinner />;
  }

  if (balancesError && (!wallets || wallets.length === 0)) {
    return <ErrorState onRetry={refetchBalances} />;
  }

  return (
    <ScreenLayout scrollable contentContainerStyle={{ paddingTop: headerHeight }}>
      <AppHeader onLogout={handleLogout} />

      <View style={styles.balanceSection}>
        <View style={styles.balanceLabelRow}>
          <Text style={styles.balanceLabel}>{balanceCurrency} balance</Text>
          <TouchableOpacity style={styles.infoIcon}>
            <Text style={styles.infoIconText}>i</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceAmount}>{balanceAmount}</Text>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleAddFunds}>
          <View style={styles.actionButtonIcon}>
            <Feather name="plus" size={24} color="white" />
          </View>
          <Text style={styles.actionButtonLabel}>Add Funds</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSendPayout}>
          <View style={styles.actionButtonIcon}>
            <MaterialIcons name="send" size={24} color="white" />
          </View>
          <Text style={styles.actionButtonLabel}>Send</Text>
        </TouchableOpacity>
      </View>

      <ImageBackground source={require("../../../assets/images/promotion-card-bg.jpg")} style={styles.cardBanner} imageStyle={styles.cardBannerImage}>
        <View style={styles.cardBannerContent}>
          <Text style={styles.cardBannerText}>Get your card and{"\n"}use it anywhere</Text>
          <TouchableOpacity style={styles.orderCardButton}>
            <Text style={styles.orderCardButtonText}>Order card</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardBannerCards}>
          <Image source={require("../../../assets/images/card.png")} style={styles.cardImage} resizeMode="contain" />
          <Image source={require("../../../assets/images/card2.png")} style={[styles.cardImage, styles.cardImageOverlap]} resizeMode="contain" />
        </View>
      </ImageBackground>

      {transactionsError ? (
        <View style={styles.transactionsSection}>
          <View style={styles.transactionErrorContainer}>
            <Text style={styles.transactionErrorText}>Failed to load transactions</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetchTransactions()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : recentTransactions.length > 0 ? (
        <View style={styles.transactionsSection}>
          {recentTransactions.map((transaction, index) => (
            <TouchableOpacity key={transaction.id} style={[styles.transactionItem, index === recentTransactions.length - 1 && styles.transactionItemLast]} onPress={() => handleTransactionPress(transaction)}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionName} numberOfLines={1}>
                  {transaction.counterparty?.name || transaction.note || "Transaction"}
                </Text>
                <Text style={styles.transactionDate}>{formatDate(transaction.timestamp, true)}</Text>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>
                  {transaction.direction === "in" ? "+" : "-"}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </Text>
                <Text style={[styles.transactionStatus, { color: transactionStatusColor(transaction.status) }]}>{transactionStatusText(transaction.status)}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAll}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>💰</Text>
          <Text style={styles.emptyStateTitle}>There's nothing here yet</Text>
          <Text style={styles.emptyStateMessage}>Make your first transaction by adding money to your wallet.</Text>
        </View>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  balanceSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: "center",
  },
  balanceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 6,
  },
  infoIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.textSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  infoIconText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  actionButton: {
    alignItems: "center",
  },
  actionButtonIcon: {
    width: 64,
    height: 64,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionButtonLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  cardBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    height: 200,
    position: "relative",
  },
  cardBannerImage: {
    borderRadius: 20,
    resizeMode: "cover",
  },
  cardBannerContent: {
    padding: 24,
    zIndex: 2,
    justifyContent: "center",
    height: 200,
  },
  cardBannerText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 10,
    lineHeight: 25,
  },
  orderCardButton: {
    backgroundColor: colors.white,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: "flex-start",
    minWidth: 140,
  },
  orderCardButtonText: {
    color: colors.textTertiary,
    fontSize: 16,
    fontWeight: "600",
  },
  cardBannerCards: {
    position: "absolute",
    right: -30,
    top: 30,
    height: "100%",
    zIndex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  cardImage: {
    width: 170,
    height: 225,
    position: "absolute",
    bottom: 0,
  },
  cardImageOverlap: {
    right: 30,
    bottom: 10,
    zIndex: -1,
    transform: [{ rotate: "12deg" }],
    opacity: 0.9,
  },
  emptyState: {
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 32,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center",
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  transactionsSection: {
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    overflow: "hidden",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionItemLast: {
    borderBottomWidth: 0,
  },
  transactionLeft: {
    flex: 1,
    marginRight: 16,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    textTransform: "capitalize",
  },
  seeAllButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    position: "relative",
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
    marginRight: 8,
  },
  transactionErrorContainer: {
    padding: 32,
    alignItems: "center",
  },
  transactionErrorText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
