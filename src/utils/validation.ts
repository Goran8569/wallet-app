export const validateAmount = (amount: string): { isValid: boolean; error?: string } => {
  if (!amount || amount.trim() === "") {
    return { isValid: false, error: "Amount is required" };
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    return { isValid: false, error: "Amount must be a valid number" };
  }

  if (numAmount <= 0) {
    return { isValid: false, error: "Amount must be greater than 0" };
  }

  return { isValid: true };
};

export const validateBalance = (amount: string, balance: number): { isValid: boolean; error?: string } => {
  const amountValidation = validateAmount(amount);
  if (!amountValidation.isValid) {
    return amountValidation;
  }

  const numAmount = parseFloat(amount);
  if (numAmount > balance) {
    return { isValid: false, error: "Amount exceeds available balance" };
  }

  return { isValid: true };
};

export const formatCurrency = (amount: string, currency: string): string => {
  const numAmount = parseFloat(amount);
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
  return `${formattedAmount} ${currency.toUpperCase()}`;
};

export const formatDate = (dateString: string, shortFormat?: boolean): string => {
  const date = new Date(dateString);
  if (shortFormat) {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
