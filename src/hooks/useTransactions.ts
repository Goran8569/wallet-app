import { useInfiniteQuery } from "@tanstack/react-query";
import { apiService } from "../store/services/api";
import { cacheService } from "../store/services/cache";
import { useAppSelector } from "../store/hooks";
import { Transaction, TransactionsData } from "../types";
import { mapTransaction } from "../utils/transactionMapper";

export function useTransactions(screen: string) {
  const filters = useAppSelector((state) => state.wallet.filters);

  const shouldUseFilters = screen !== "wallet";
  const queryKey = shouldUseFilters ? ["transactions", filters, screen] : ["transactions", screen];

  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params: any = {
        page: pageParam,
        per_page: 15,
      };

      if (shouldUseFilters) {
        if (filters.type === "in") {
          params.type = "top-up";
        } else if (filters.type === "out") {
          params.type = "withdrawal";
        }

        if (filters.dateFrom) {
          params.date_from = filters.dateFrom;
        }

        if (filters.dateTo) {
          params.date_to = filters.dateTo;
        }

        if (filters.statuses && filters.statuses.length === 1) {
          const status = filters.statuses[0];
          if (status === "completed") {
            params.status = "completed";
          } else if (status === "declined" || status === "canceled") {
            params.status = "failed";
          } else if (status === "pending") {
            params.status = "pending";
          }
        }
      }

      try {
        const response = await apiService.getTransactions(params);
        if (response.data.items) {
          const cached = await cacheService.getCachedTransactions();
          const allTransactions = cached || [];
          const merged = [...allTransactions];
          response.data.items.forEach((tx) => {
            if (!merged.find((t) => t.id === tx.id)) {
              merged.push(tx);
            }
          });
          const sorted = merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          await cacheService.cacheTransactions(sorted.slice(0, 50));
        }
        return response;
      } catch (error: any) {
        const isNetworkError = error.code === "ECONNABORTED" || error.code === "ERR_NETWORK" || !error.response;
        if (isNetworkError) {
          const cached = await cacheService.getCachedTransactions();
          if (cached && cached.length > 0) {
            let filtered = [...cached];

            if (shouldUseFilters) {
              if (filters.type === "in") {
                filtered = filtered.filter((tx) => tx.type === "top-up");
              } else if (filters.type === "out") {
                filtered = filtered.filter((tx) => tx.type === "withdrawal");
              }

              if (filters.dateFrom) {
                filtered = filtered.filter((tx) => new Date(tx.created_at) >= new Date(filters.dateFrom!));
              }

              if (filters.dateTo) {
                filtered = filtered.filter((tx) => new Date(tx.created_at) <= new Date(filters.dateTo!));
              }

              if (filters.statuses && filters.statuses.length === 1) {
                const status = filters.statuses[0];
                if (status === "completed") {
                  filtered = filtered.filter((tx) => tx.status === "completed");
                } else if (status === "declined" || status === "canceled") {
                  filtered = filtered.filter((tx) => tx.status === "failed");
                } else if (status === "pending") {
                  filtered = filtered.filter((tx) => tx.status === "pending");
                }
              }
            }

            const page = pageParam as number;
            const perPage = 15;
            const startIndex = (page - 1) * perPage;
            const endIndex = startIndex + perPage;
            const paginated = filtered.slice(startIndex, endIndex);

            const mockResponse: { data: TransactionsData } = {
              data: {
                current_page: page,
                per_page: perPage,
                total: filtered.length,
                last_page: Math.ceil(filtered.length / perPage),
                has_more: endIndex < filtered.length,
                items: paginated,
              },
            };
            return mockResponse;
          }
        }
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.data.has_more ? lastPage.data.current_page + 1 : undefined;
    },
    initialPageParam: 1,
    retry: false,
    select: (data) => {
      let transactions: Transaction[] = [];

      data.pages.forEach((page) => {
        transactions = [...transactions, ...page.data.items];
      });

      let mappedTransactions = transactions.map((tx) => mapTransaction(tx));

      let filteredTransactions = mappedTransactions;

      if (shouldUseFilters) {
        if (filters.type === "fee") {
          filteredTransactions = filteredTransactions.filter((tx) => {
            return tx.type !== "top-up" && tx.type !== "withdrawal";
          });
        }

        if (filters.currency) {
          filteredTransactions = filteredTransactions.filter((tx) => tx.currency === filters.currency);
        }

        if (filters.statuses && filters.statuses.length > 0) {
          filteredTransactions = filteredTransactions.filter((tx) => {
            const txStatus = tx.status;
            return filters.statuses!.some((status) => {
              if (status === txStatus) return true;
              if (status === "canceled" && txStatus === "canceled") return true;
              if (status === "failed" && (txStatus === "declined" || txStatus === "canceled")) return true;
              return false;
            });
          });
        }
      }

      return {
        transactions: filteredTransactions,
        hasMore: data.pages.length > 0 ? data.pages[data.pages.length - 1].data.has_more : false,
        total: data.pages[0]?.data.total || 0,
      };
    },
  });
}
