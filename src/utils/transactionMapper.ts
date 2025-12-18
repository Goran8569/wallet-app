import { Transaction, Wallet } from "../types";
import { getCurrencyCode } from "./currency";

export interface MappedTransaction {
  id: string;
  amount: string;
  currency: string;
  direction: "in" | "out";
  status: "completed" | "declined" | "pending" | "canceled";
  timestamp: string;
  counterparty?: {
    name: string;
    account?: string;
  };
  reference?: string;
  method?: "card" | "bank";
  note?: string;
  wallet_id: number;
  type: "top-up" | "withdrawal";
}

export const mapTransaction = (transaction: Transaction, wallet?: Wallet): MappedTransaction => {
  const currency = getCurrencyCode(transaction.currency_id);
  const isIncoming = transaction.amount > 0;
  const direction: "in" | "out" = isIncoming ? "in" : "out";

  const statusMap: Record<string, "completed" | "declined" | "pending" | "canceled"> = {
    completed: "completed",
    pending: "pending",
    failed: "declined",
  };
  const status = statusMap[transaction.status] || "pending";

  return {
    id: transaction.id?.toString() || `${transaction.wallet_id}-${transaction.created_at}`,
    amount: Math.abs(transaction.amount).toString(),
    currency,
    direction,
    status,
    timestamp: transaction.created_at,
    counterparty: {
      name: transaction.reason || "Unknown",
    },
    reference: wallet?.reference_number,
    method: transaction.provider === "bank" ? "bank" : transaction.provider === "card" ? "card" : undefined,
    note: transaction.reason,
    wallet_id: transaction.wallet_id,
    type: transaction.type,
  };
};

export const mapWalletToBalance = (wallet: Wallet): { amount: string; currency: string } => {
  return {
    amount: wallet.available_balance,
    currency: getCurrencyCode(wallet.currency_id),
  };
};
