import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setFilters, resetFilters } from "../../store/slices/walletSlice";
import { TransactionType, TransactionStatus, FilterTransactionType, FilterTransactionStatus } from "../../types";
import { colors } from "../../utils/colors";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "../../store/services/api";
import { mapWalletToBalance } from "../../utils/transactionMapper";
import Button from "../../components/Button";
import EvilIcons from "@expo/vector-icons/EvilIcons";

interface FilterScreenProps {
  visible: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: { label: string; value: FilterTransactionStatus }[] = [
  { label: "Completed", value: TransactionStatus.COMPLETED as FilterTransactionStatus },
  { label: "Pending", value: TransactionStatus.PENDING as FilterTransactionStatus },
  { label: "Canceled", value: TransactionStatus.CANCELED as FilterTransactionStatus },
  { label: "Declined", value: TransactionStatus.DECLINED as FilterTransactionStatus },
];

const TRANSACTION_TYPES: { label: string; value: FilterTransactionType }[] = [
  { label: "All", value: TransactionType.ALL },
  { label: "In", value: TransactionType.IN },
  { label: "Out", value: TransactionType.OUT },
  { label: "Fees", value: TransactionType.FEE },
];

interface DateRangePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

function DateRangePickerModal({ visible, onClose, onConfirm, initialStartDate, initialEndDate }: DateRangePickerModalProps) {
  const [startDate, setStartDate] = useState<Date>(initialStartDate || new Date());
  const [endDate, setEndDate] = useState<Date>(initialEndDate || new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleConfirm = useCallback(() => {
    if (startDate <= endDate) {
      onConfirm(startDate, endDate);
    }
  }, [startDate, endDate, onConfirm]);

  const formatDateForDisplay = useCallback((date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const handleStartDateChange = useCallback(
    (event: any, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowStartPicker(false);
        if (event.type === "dismissed") {
          return;
        }
      }
      if (selectedDate) {
        setStartDate(selectedDate);
        if (selectedDate > endDate) {
          setEndDate(selectedDate);
        }
      }
    },
    [endDate]
  );

  const handleEndDateChange = useCallback(
    (event: any, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowEndPicker(false);
        if (event.type === "dismissed") {
          return;
        }
      }
      if (selectedDate && selectedDate >= startDate) {
        setEndDate(selectedDate);
      }
    },
    [startDate]
  );

  useEffect(() => {
    if (initialStartDate) setStartDate(initialStartDate);
    if (initialEndDate) setEndDate(initialEndDate);
  }, [initialStartDate, initialEndDate]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.datePickerOverlay}>
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <Text style={styles.datePickerTitle}>Select Date Range</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.datePickerContent}>
            <View style={styles.dateInputs}>
              <View>
                <Text style={styles.dateInputLabel}>Start Date</Text>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowStartPicker(true)}>
                  <Text style={styles.dateInputValue}>{formatDateForDisplay(startDate)}</Text>
                </TouchableOpacity>
                {showStartPicker && Platform.OS === "ios" && (
                  <View style={styles.iosDatePickerContainer}>
                    <DateTimePicker value={startDate} mode="date" display="spinner" onChange={handleStartDateChange} maximumDate={endDate} style={styles.iosDatePicker} />
                    <TouchableOpacity style={styles.datePickerDoneButton} onPress={() => setShowStartPicker(false)}>
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {showStartPicker && Platform.OS === "android" && <DateTimePicker value={startDate} mode="date" display="default" onChange={handleStartDateChange} maximumDate={endDate} />}
              </View>

              <View>
                <Text style={styles.dateInputLabel}>End Date</Text>
                <TouchableOpacity style={styles.dateInput} onPress={() => setShowEndPicker(true)}>
                  <Text style={styles.dateInputValue}>{formatDateForDisplay(endDate)}</Text>
                </TouchableOpacity>
                {showEndPicker && Platform.OS === "ios" && (
                  <View style={styles.iosDatePickerContainer}>
                    <DateTimePicker value={endDate} mode="date" display="spinner" onChange={handleEndDateChange} minimumDate={startDate} style={styles.iosDatePicker} />
                    <TouchableOpacity style={styles.datePickerDoneButton} onPress={() => setShowEndPicker(false)}>
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {showEndPicker && Platform.OS === "android" && <DateTimePicker value={endDate} mode="date" display="default" onChange={handleEndDateChange} minimumDate={startDate} />}
              </View>
            </View>
          </View>

          <View style={styles.datePickerFooter}>
            <TouchableOpacity style={styles.datePickerCancelButton} onPress={onClose}>
              <Text style={styles.datePickerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.datePickerConfirmButton} onPress={handleConfirm}>
              <Text style={styles.datePickerConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function FilterScreen({ visible, onClose }: FilterScreenProps) {
  const dispatch = useAppDispatch();

  const currentFilters = useAppSelector((state) => state.wallet.filters);

  const [selectedType, setSelectedType] = useState<FilterTransactionType>(currentFilters.type || TransactionType.ALL);
  const [selectedStatuses, setSelectedStatuses] = useState<FilterTransactionStatus[]>(currentFilters.statuses || []);
  const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(currentFilters.currency);
  const [dateFrom, setDateFrom] = useState<string | undefined>(currentFilters.dateFrom);
  const [dateTo, setDateTo] = useState<string | undefined>(currentFilters.dateTo);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const insets = useSafeAreaInsets();

  const { data: wallets } = useQuery({
    queryKey: ["balances"],
    queryFn: () => apiService.getBalances(),
  });

  const balances = useMemo(() => wallets?.map(mapWalletToBalance) || [], [wallets]);
  const availableCurrencies = useMemo(() => balances?.map((b) => b.currency) || [], [balances]);

  const formatDateRange = useCallback((): string => {
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const fromStr = `${from.getDate().toString().padStart(2, "0")}/${(from.getMonth() + 1).toString().padStart(2, "0")}/${from.getFullYear()}`;
      const toStr = `${to.getDate().toString().padStart(2, "0")}/${(to.getMonth() + 1).toString().padStart(2, "0")}/${to.getFullYear()}`;
      return `${fromStr} - ${toStr}`;
    }
    return "Select";
  }, [dateFrom, dateTo]);

  const handleStatusToggle = useCallback((status: FilterTransactionStatus) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  }, []);

  const handleApply = useCallback(() => {
    dispatch(
      setFilters({
        type: selectedType,
        currency: selectedCurrency,
        dateFrom: dateFrom,
        dateTo: dateTo,
        statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      })
    );
    onClose();
  }, [dispatch, selectedType, selectedCurrency, dateFrom, dateTo, selectedStatuses, onClose]);

  const handleClearAll = useCallback(() => {
    dispatch(resetFilters());
    setSelectedType(TransactionType.ALL);
    setSelectedStatuses([]);
    setSelectedCurrency(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
  }, [dispatch]);

  const handleDateRangePress = useCallback(() => {
    setShowDatePicker(true);
  }, []);

  const handleDateSelect = useCallback((startDate: Date, endDate: Date) => {
    const fromDate = new Date(startDate);
    fromDate.setHours(0, 0, 0, 0);
    setDateFrom(fromDate.toISOString().split("T")[0]);

    const toDate = new Date(endDate);
    toDate.setHours(23, 59, 59, 999);
    setDateTo(toDate.toISOString());
    setShowDatePicker(false);
  }, []);

  useEffect(() => {
    if (visible) {
      setSelectedType(currentFilters.type || TransactionType.ALL);
      setSelectedStatuses(currentFilters.statuses || []);
      setSelectedCurrency(currentFilters.currency);
      setDateFrom(currentFilters.dateFrom);
      setDateTo(currentFilters.dateTo);
    }
  }, [visible, currentFilters]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Date range</Text>
              <TouchableOpacity style={styles.dateRangeInput} onPress={handleDateRangePress}>
                <Text style={[styles.dateRangeText, !dateFrom && styles.dateRangePlaceholder]}>{formatDateRange()}</Text>
                <EvilIcons name="calendar" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Status</Text>
              {STATUS_OPTIONS.map((status) => {
                const isSelected = selectedStatuses.includes(status.value);
                return (
                  <TouchableOpacity key={status.value} style={styles.checkboxRow} onPress={() => handleStatusToggle(status.value)}>
                    <Text style={styles.checkboxLabel}>{status.label}</Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>{isSelected && <Text style={styles.checkmark}>✓</Text>}</View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Transaction category</Text>
              {TRANSACTION_TYPES.map((type) => {
                const isSelected = selectedType === type.value;
                return (
                  <TouchableOpacity key={type.value} style={styles.checkboxRow} onPress={() => setSelectedType(type.value)}>
                    <Text style={styles.checkboxLabel}>{type.label}</Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>{isSelected && <Text style={styles.checkmark}>✓</Text>}</View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {availableCurrencies.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Currency</Text>
                {availableCurrencies.map((currency) => {
                  const isSelected = selectedCurrency === currency;
                  return (
                    <TouchableOpacity key={currency} style={styles.checkboxRow} onPress={() => setSelectedCurrency(isSelected ? undefined : currency)}>
                      <Text style={styles.checkboxLabel}>{currency.toUpperCase()}</Text>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>{isSelected && <Text style={styles.checkmark}>✓</Text>}</View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button title="Apply" onPress={handleApply} variant="primary" style={styles.applyButton} />
            <Button title="Clear all" onPress={handleClearAll} variant="secondary" style={styles.clearButton} />
          </View>
        </View>

        {showDatePicker && <DateRangePickerModal visible={showDatePicker} onClose={() => setShowDatePicker(false)} onConfirm={handleDateSelect} initialStartDate={dateFrom ? new Date(dateFrom) : undefined} initialEndDate={dateTo ? new Date(dateTo) : undefined} />}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  dateRangeInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateRangeText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  dateRangePlaceholder: {
    color: colors.textSecondary,
  },
  calendarIcon: {
    fontSize: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "column",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
    backgroundColor: colors.backgroundSecondary,
  },
  clearButton: {
    width: "100%",
  },
  applyButton: {
    width: "100%",
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  datePickerContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    padding: 20,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  datePickerContent: {
    marginBottom: 20,
  },
  datePickerTabs: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 8,
  },
  datePickerTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  datePickerTabActive: {
    backgroundColor: colors.primary,
  },
  datePickerTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  datePickerTabTextActive: {
    color: colors.textPrimary,
  },
  dateInputs: {
    gap: 12,
    marginBottom: 12,
  },
  dateInput: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateInputLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateInputValue: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  datePickerHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  datePickerFooter: {
    flexDirection: "row",
    gap: 12,
  },
  datePickerCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  datePickerConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  iosDatePickerContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  iosDatePicker: {
    height: 200,
  },
  datePickerDoneButton: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
