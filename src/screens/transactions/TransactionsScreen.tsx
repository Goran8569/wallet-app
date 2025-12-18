import React, { useCallback, useRef, useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTransactions } from "../../hooks/useTransactions";
import { MappedTransaction } from "../../utils/transactionMapper";
import { formatCurrency, formatDate } from "../../utils/validation";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import CollapsibleHeader, { useCollapsibleHeader } from "../../components/CollapsibleHeader";
import FilterScreen from "./FilterScreen";
import { colors } from "../../utils/colors";

interface GroupedTransaction {
  month: string;
  transactions: MappedTransaction[];
}

export default function TransactionsScreen() {
  const { scrollY, headerHeight, handleScroll } = useCollapsibleHeader();
  const { data: transactionsData, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } = useTransactions("transactions");
  const navigation = useNavigation();

  const loadingMoreRef = useRef(false);

  const [showFilterModal, setShowFilterModal] = useState(false);

  const transactions = useMemo(() => transactionsData?.transactions || [], [transactionsData]);

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: { month: string; date: Date; transactions: MappedTransaction[] } } = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.timestamp);
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      if (!groups[monthKey]) {
        groups[monthKey] = {
          month: monthKey,
          date: new Date(date.getFullYear(), date.getMonth(), 1),
          transactions: [],
        };
      }
      groups[monthKey].transactions.push(transaction);
    });

    return Object.values(groups)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((group) => ({
        month: group.month,
        transactions: group.transactions,
      }));
  }, [transactions]);

  const handleTransactionPress = useCallback(
    (transaction: MappedTransaction) => {
      (navigation as any).navigate("TransactionDetails", { transactionId: transaction.id });
    },
    [navigation]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !loadingMoreRef.current) {
      loadingMoreRef.current = true;
      fetchNextPage().finally(() => {
        loadingMoreRef.current = false;
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleMenuPress = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  const handleCloseFilter = useCallback(() => {
    setShowFilterModal(false);
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "declined":
        return "Declined";
      case "canceled":
        return "Canceled";
      default:
        return "Pending";
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return colors.success;
      case "pending":
        return colors.warning;
      case "declined":
        return colors.error;
      case "canceled":
        return colors.error;
      default:
        return colors.textSecondary;
    }
  }, []);

  const renderTransaction = useCallback(
    ({ item }: { item: MappedTransaction }) => {
      const isIncoming = item.direction === "in";

      return (
        <TouchableOpacity style={styles.transactionRow} onPress={() => handleTransactionPress(item)} activeOpacity={0.7}>
          <View style={styles.transactionLeft}>
            <Text style={styles.transactionName} numberOfLines={1}>
              {item.counterparty?.name || item.note || "Transaction"}
            </Text>
            <Text style={styles.transactionDate}>{formatDate(item.timestamp, true)}</Text>
          </View>
          <View style={styles.transactionRight}>
            <Text style={styles.transactionAmount}>
              {isIncoming ? "+" : "-"}
              {formatCurrency(item.amount, item.currency)}
            </Text>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusText(item.status)}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleTransactionPress, getStatusText, getStatusColor]
  );

  const renderSection = useCallback(
    ({ item }: { item: GroupedTransaction }) => (
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{item.month}</Text>
        {item.transactions.map((transaction) => (
          <View key={transaction.id}>{renderTransaction({ item: transaction })}</View>
        ))}
      </View>
    ),
    [renderTransaction]
  );

  const listContentStyle = useMemo(() => ({ paddingTop: headerHeight + 60 }), [headerHeight]);
  const emptyContainerStyle = useMemo(() => ({ paddingTop: headerHeight + 60 }), [headerHeight]);
  const errorContainerStyle = useMemo(() => ({ paddingTop: headerHeight + 60 }), [headerHeight]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <CollapsibleHeader title="Transactions" scrollY={scrollY} showFilter={true} onMenuPress={handleMenuPress} />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <CollapsibleHeader title="Transactions" scrollY={scrollY} showFilter={true} onMenuPress={handleMenuPress} />
        <View style={[styles.errorContainer, errorContainerStyle]}>
          <ErrorState title="Unable to load transactions" message="We couldn't fetch your transactions. Please check your connection and try again." onRetry={refetch} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CollapsibleHeader title="Transactions" scrollY={scrollY} showFilter={true} onMenuPress={handleMenuPress} />
      <FilterScreen visible={showFilterModal} onClose={handleCloseFilter} />

      {transactions && transactions.length > 0 ? (
        <FlatList
          data={groupedTransactions}
          renderItem={renderSection}
          keyExtractor={(item) => item.month}
          contentContainerStyle={[styles.listContent, listContentStyle]}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          removeClippedSubviews={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>Loading more transactions...</Text>
              </View>
            ) : hasNextPage ? (
              <View style={styles.footer}>
                <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore} disabled={isFetchingNextPage}>
                  <Text style={styles.loadMoreText}>Load More</Text>
                </TouchableOpacity>
              </View>
            ) : transactions.length > 0 ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>No more transactions to load</Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={[styles.emptyContainer, emptyContainerStyle]}>
          <EmptyState title="No transactions yet" message="Your transaction history will appear here once you start making payments or receiving money." />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  sectionHeader: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: colors.backgroundSecondary,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundSecondary,
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
    gap: 8,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loadMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
});
