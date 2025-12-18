import { TransactionType, TransactionStatus } from "./enums";

export type FilterTransactionType = TransactionType.ALL | TransactionType.IN | TransactionType.OUT | TransactionType.FEE;

export type FilterTransactionStatus = TransactionStatus.COMPLETED | TransactionStatus.DECLINED | TransactionStatus.PENDING | TransactionStatus.CANCELED | TransactionStatus.FAILED;

export interface TransactionFilters {
  type: FilterTransactionType;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
  statuses?: FilterTransactionStatus[];
}
