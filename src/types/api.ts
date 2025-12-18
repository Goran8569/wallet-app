import { TransactionType, TransactionStatus, PayoutProvider } from "./enums";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  access_token_expire: string;
  refresh_token: string;
  refresh_token_expire: string;
}

export interface TwoFactorAuth {
  enabled: boolean;
  type: string | null;
}

export interface LoginResponse {
  auth: AuthTokens;
  tfa: TwoFactorAuth;
}

export interface ApiResponse<T> {
  data: T;
  message: string | string[];
  status: number;
  type: string;
}

export interface Wallet {
  id: number;
  user_id: string;
  currency_id: number;
  available_balance: string;
  current_balance: string;
  reserved_balance: string;
  reference_number: string;
}

export interface Balance {
  amount: string;
  currency: string;
}

export interface Transaction {
  wallet_id: number;
  type: TransactionType.TOP_UP | TransactionType.WITHDRAWAL;
  status: TransactionStatus.COMPLETED | TransactionStatus.PENDING | TransactionStatus.FAILED;
  reason: string;
  amount: number;
  currency_id: number;
  created_at: string;
  id?: number;
  provider?: PayoutProvider;
  bank_id?: number | null;
}

export interface TransactionsData {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  has_more: boolean;
  items: Transaction[];
}

export interface PayoutRequest {
  wallet_id: number;
  provider: PayoutProvider;
  amount: number;
  currency_id: number;
  bank_id?: number;
  note?: string;
}

export interface PayoutResponseData {
  id: number;
  status: string;
  amount: number;
  provider: PayoutProvider;
  wallet_id: number;
  currency_id: number;
  created_at: string;
}

export interface ApiError {
  timestamp?: string;
  status: number;
  error: string;
  message: string;
  path?: string;
}

export const CURRENCY_MAP: Record<number, string> = {
  [1]: "EUR",
  [2]: "USD",
  [9]: "GBP",
};
