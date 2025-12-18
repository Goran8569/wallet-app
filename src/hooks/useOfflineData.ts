import { useEffect, useState } from "react";
import { cacheService } from "../store/services/cache";
import { Balance, Transaction } from "../types";
import { mapWalletToBalance } from "../utils/transactionMapper";

export function useOfflineData() {
  const [cachedBalances, setCachedBalances] = useState<Balance[] | null>(null);
  const [cachedTransactions, setCachedTransactions] = useState<Transaction[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const wallets = await cacheService.getCachedBalances();
        const transactions = await cacheService.getCachedTransactions();
        const balances = wallets ? wallets.map(mapWalletToBalance) : null;
        setCachedBalances(balances);
        setCachedTransactions(transactions);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadCache();
  }, []);

  return {
    cachedBalances,
    cachedTransactions,
    isLoading,
  };
}
