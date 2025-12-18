import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setSelectedCurrency } from "../store/slices/walletSlice";
import { colors } from "../utils/colors";

interface CurrencyOption {
  code: string;
  iconName: string;
  iconType: string;
}

const CURRENCIES: CurrencyOption[] = [
  {
    code: "EUR",
    iconName: "eur",
    iconType: "FontAwesome",
  },
  {
    code: "GBP",
    iconName: "gbp",
    iconType: "FontAwesome",
  },
  {
    code: "USD",
    iconName: "usd",
    iconType: "FontAwesome",
  },
];

const renderCurrencyIcon = (currency: CurrencyOption, size: number = 20) => {
  const iconColor = colors.white;

  return <FontAwesome name={currency.iconName as any} size={size} color={iconColor} />;
};

export default function CurrencySelector() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const selectedCurrency = useAppSelector((state) => state.wallet.selectedCurrency);
  const [showModal, setShowModal] = useState(false);

  const currentCurrency = CURRENCIES.find((c) => c.code === selectedCurrency?.toUpperCase()) || CURRENCIES[0];

  const handleCurrencySelect = (currencyCode: string) => {
    dispatch(setSelectedCurrency(currencyCode));
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.selector} onPress={() => setShowModal(true)}>
        {renderCurrencyIcon(currentCurrency, 24)}
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <View style={[styles.modalContent, { marginTop: insets.top + 60 }]}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            {CURRENCIES.map((currency) => {
              const isSelected = selectedCurrency?.toUpperCase() === currency.code;
              return (
                <TouchableOpacity key={currency.code} style={[styles.currencyOption, isSelected && styles.currencyOptionSelected]} onPress={() => handleCurrencySelect(currency.code)}>
                  <View style={styles.currencyOptionLeft}>
                    {renderCurrencyIcon(currency, 20)}
                    <Text style={styles.currencyOptionText}>{currency.code}</Text>
                  </View>
                  {isSelected && <MaterialIcons name="check" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "flex-end",
    paddingRight: 20,
  },
  modalContent: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    marginTop: 60,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  currencyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  currencyOptionSelected: {
    backgroundColor: colors.background,
  },
  currencyOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  currencyOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
  },
});
