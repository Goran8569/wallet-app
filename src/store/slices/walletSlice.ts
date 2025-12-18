import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TransactionFilters, TransactionType } from "../../types";

interface WalletState {
  selectedCurrency: string | null;
  filters: TransactionFilters;
  paginationCursor: string | null;
  isPayoutLoading: boolean;
}

const defaultFilters: TransactionFilters = {
  type: TransactionType.ALL,
};

const initialState: WalletState = {
  selectedCurrency: null,
  filters: defaultFilters,
  paginationCursor: null,
  isPayoutLoading: false,
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setSelectedCurrency: (state, action: PayloadAction<string | null>) => {
      state.selectedCurrency = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<TransactionFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPaginationCursor: (state, action: PayloadAction<string | null>) => {
      state.paginationCursor = action.payload;
    },
    resetFilters: (state) => {
      state.filters = defaultFilters;
      state.paginationCursor = null;
    },
    setPayoutLoading: (state, action: PayloadAction<boolean>) => {
      state.isPayoutLoading = action.payload;
    },
  },
});

export const { setSelectedCurrency, setFilters, setPaginationCursor, resetFilters, setPayoutLoading } = walletSlice.actions;
export default walletSlice.reducer;
