export enum TransactionType {
  ALL = "all",
  IN = "in",
  OUT = "out",
  FEE = "fee",
  TOP_UP = "top-up",
  WITHDRAWAL = "withdrawal",
}

export enum TransactionStatus {
  COMPLETED = "completed",
  PENDING = "pending",
  FAILED = "failed",
  DECLINED = "declined",
  CANCELED = "canceled",
}

export enum PayoutProvider {
  BANK = "bank",
  CARD = "card",
}

export enum CurrencyId {
  EUR = 1,
  USD = 2,
  GBP = 9,
}

export enum ExecutionEnvironment {
  STORE_CLIENT = "storeClient",
  STANDALONE = "standalone",
  BARE = "bare",
}
