import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTransactions } from "../../hooks/useTransactions";
import { cacheService } from "../../store/services/cache";
import { mapTransaction, MappedTransaction } from "../../utils/transactionMapper";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import { formatCurrency, formatDate } from "../../utils/validation";
import Toast from "react-native-toast-message";
import CollapsibleHeader, { useCollapsibleHeader } from "../../components/CollapsibleHeader";
import { colors } from "../../utils/colors";

export default function TransactionDetailsScreen() {
  const { scrollY, headerHeight, handleScroll } = useCollapsibleHeader();

  const [cachedTransaction, setCachedTransaction] = useState<MappedTransaction | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(false);

  const route = useRoute();
  const navigation = useNavigation();
  const { transactionId } = (route.params as any) || {};

  const { data: transactionsData, isLoading, error, refetch } = useTransactions("transactions");

  const transaction = useMemo(() => {
    return transactionsData?.transactions?.find((tx) => {
      const txId = tx.id?.toString();
      const searchId = transactionId?.toString();
      return txId === searchId;
    });
  }, [transactionsData, transactionId]);

  const displayTransaction = useMemo(() => {
    return transaction || cachedTransaction;
  }, [transaction, cachedTransaction]);

  const handleRepeatPayout = useCallback(() => {
    Toast.show({
      type: "info",
      text1: "Repeat Payout",
      text2: "This feature is not yet implemented",
    });
  }, []);

  const isIncoming = useMemo(() => displayTransaction?.direction === "in", [displayTransaction]);

  const statusColor = useMemo(() => {
    if (!displayTransaction) return colors.textSecondary;
    if (displayTransaction.status === "completed") return colors.success;
    if (displayTransaction.status === "declined" || displayTransaction.status === "canceled") return colors.error;
    return colors.warning;
  }, [displayTransaction]);

  const statusText = useMemo(() => {
    if (!displayTransaction) return "Pending";
    if (displayTransaction.status === "completed") return "Completed";
    if (displayTransaction.status === "declined") return "Declined";
    if (displayTransaction.status === "canceled") return "Canceled";
    return "Pending";
  }, [displayTransaction]);

  const contentStyle = useMemo(() => ({ paddingTop: headerHeight + 60 }), [headerHeight]);

  useEffect(() => {
    if (!transaction && transactionId) {
      const loadFromCache = async () => {
        setIsLoadingCache(true);
        try {
          const cached = await cacheService.getCachedTransactions();
          if (cached && cached.length > 0) {
            const cachedTx = cached.find((tx) => {
              const txId = tx.id?.toString();
              const searchId = transactionId?.toString();
              return txId === searchId;
            });
            if (cachedTx) {
              const mapped = mapTransaction(cachedTx);
              setCachedTransaction(mapped);
            }
          }
        } catch (error) {
        } finally {
          setIsLoadingCache(false);
        }
      };
      loadFromCache();
    }
  }, [transaction, transactionId]);

  if (isLoading && !cachedTransaction && !transaction) {
    return <LoadingSpinner />;
  }

  if ((error || !transaction) && !cachedTransaction && !isLoadingCache) {
    return <ErrorState onRetry={refetch} />;
  }

  if (isLoadingCache && !transaction) {
    return <LoadingSpinner />;
  }

  if (!displayTransaction) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <CollapsibleHeader title="Transaction Details" scrollY={scrollY} />

      <Animated.ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, contentStyle]} onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={styles.infoValue}>
              {isIncoming ? "+" : "-"}
              {formatCurrency(displayTransaction.amount, displayTransaction.currency)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, { color: statusColor }]}>{statusText}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(displayTransaction.timestamp)}</Text>
          </View>

          {displayTransaction.reference && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reference</Text>
              <Text style={styles.infoValue}>{displayTransaction.reference}</Text>
            </View>
          )}

          {displayTransaction.method && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Method</Text>
              <Text style={styles.infoValue}>{displayTransaction.method.charAt(0).toUpperCase() + displayTransaction.method.slice(1)}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{displayTransaction.type === "top-up" ? "Top-up" : "Withdrawal"}</Text>
          </View>
        </View>

        {displayTransaction.counterparty && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>

            {displayTransaction.counterparty.name && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Reason</Text>
                <Text style={styles.infoValue}>{displayTransaction.counterparty.name}</Text>
              </View>
            )}

            {displayTransaction.counterparty.account && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account</Text>
                <Text style={styles.infoValue}>{displayTransaction.counterparty.account}</Text>
              </View>
            )}
          </View>
        )}

        {displayTransaction.note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note</Text>
            <Text style={styles.noteText}>{displayTransaction.note}</Text>
          </View>
        )}

        {displayTransaction.direction === "out" && (
          <View style={styles.actions}>
            <Button title="Repeat Payout" onPress={handleRepeatPayout} variant="primary" style={styles.actionButton} />
          </View>
        )}
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
  section: {
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
  noteText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  actions: {
    paddingVertical: 16,
  },
  actionButton: {
    width: "100%",
  },
});
