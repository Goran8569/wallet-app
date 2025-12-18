import { Wallet, Transaction, CurrencyId, TransactionType, TransactionStatus, PayoutProvider } from "../../types";

export function generateMockWallets(): Wallet[] {
  return [
    {
      id: 1,
      user_id: "1",
      currency_id: CurrencyId.EUR,
      available_balance: "1250.50",
      current_balance: "1250.50",
      reserved_balance: "0.00",
      reference_number: "WAL001",
    },
    {
      id: 2,
      user_id: "1",
      currency_id: CurrencyId.USD,
      available_balance: "850.25",
      current_balance: "850.25",
      reserved_balance: "0.00",
      reference_number: "WAL002",
    },
    {
      id: 3,
      user_id: "1",
      currency_id: CurrencyId.GBP,
      available_balance: "750.00",
      current_balance: "750.00",
      reserved_balance: "0.00",
      reference_number: "WAL003",
    },
  ];
}

export function generateMockTransactions(): Transaction[] {
  const now = new Date();
  const transactions: Transaction[] = [];

  const types: Array<TransactionType.TOP_UP | TransactionType.WITHDRAWAL> = [TransactionType.TOP_UP, TransactionType.WITHDRAWAL];
  const statuses: Array<TransactionStatus.COMPLETED | TransactionStatus.PENDING | TransactionStatus.FAILED> = [TransactionStatus.COMPLETED, TransactionStatus.PENDING, TransactionStatus.FAILED];
  const currencies = [CurrencyId.EUR, CurrencyId.USD, CurrencyId.GBP];
  const reasons = ["Salary payment", "Rent payment", "Freelance work", "Online purchase", "Investment return", "Utility bill", "Grocery shopping", "Restaurant payment", "Subscription fee", "Refund"];

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(i / 5);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));

    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const currencyId = currencies[Math.floor(Math.random() * currencies.length)];
    const walletId = currencyId === CurrencyId.EUR ? 1 : currencyId === CurrencyId.USD ? 2 : 3;
    const reason = reasons[Math.floor(Math.random() * reasons.length)];

    const baseAmount = Math.random() * 2000 + 50;
    const amount = type === TransactionType.TOP_UP ? baseAmount : -baseAmount;

    transactions.push({
      id: i + 1,
      wallet_id: walletId,
      type,
      status,
      reason,
      amount: Math.round(amount * 100) / 100,
      currency_id: currencyId,
      created_at: date.toISOString(),
      provider: type === TransactionType.WITHDRAWAL ? (Math.random() > 0.5 ? PayoutProvider.BANK : PayoutProvider.CARD) : undefined,
      bank_id: type === TransactionType.WITHDRAWAL && Math.random() > 0.5 ? 1 : null,
    });
  }

  return transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
