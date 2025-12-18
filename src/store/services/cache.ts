import AsyncStorage from "@react-native-async-storage/async-storage";
import { Wallet, Transaction } from "../../types";
import { generateMockWallets, generateMockTransactions } from "./mockData";

const CACHE_KEYS = {
  BALANCES: "cached_balances",
  TRANSACTIONS: "cached_transactions",
  CACHE_SEEDED: "cache_seeded",
};

export class CacheService {
  async cacheBalances(wallets: Wallet[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.BALANCES, JSON.stringify(wallets));
    } catch (error) {}
  }

  async getCachedBalances(): Promise<Wallet[] | null> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.BALANCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  async cacheTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {}
  }

  async getCachedTransactions(): Promise<Transaction[] | null> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([CACHE_KEYS.BALANCES, CACHE_KEYS.TRANSACTIONS, CACHE_KEYS.CACHE_SEEDED]);
    } catch (error) {}
  }

  async seedCacheIfNeeded(): Promise<void> {
    try {
      const seeded = await AsyncStorage.getItem(CACHE_KEYS.CACHE_SEEDED);
      if (seeded === "true") {
        return;
      }

      const existingBalances = await this.getCachedBalances();
      const existingTransactions = await this.getCachedTransactions();

      if (!existingBalances || existingBalances.length === 0) {
        const mockWallets = generateMockWallets();
        await this.cacheBalances(mockWallets);
      }

      if (!existingTransactions || existingTransactions.length === 0) {
        const mockTransactions = generateMockTransactions();
        await this.cacheTransactions(mockTransactions);
      }

      await AsyncStorage.setItem(CACHE_KEYS.CACHE_SEEDED, "true");
    } catch (error) {}
  }
}

export const cacheService = new CacheService();
