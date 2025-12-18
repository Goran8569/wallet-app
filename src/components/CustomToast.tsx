import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { colors } from "../utils/colors";

const toastConfig = {
  success: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={styles.toastContainer}>
      <View style={[styles.toastContent, styles.successBorder]}>
        <View style={styles.toastTextContainer}>
          {text1 && <Text style={styles.toastTitle}>{text1}</Text>}
          {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
        </View>
      </View>
    </View>
  ),
  error: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={styles.toastContainer}>
      <View style={[styles.toastContent, styles.errorBorder]}>
        <View style={styles.toastTextContainer}>
          {text1 && <Text style={styles.toastTitle}>{text1}</Text>}
          {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
        </View>
      </View>
    </View>
  ),
  info: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={styles.toastContainer}>
      <View style={[styles.toastContent, styles.infoBorder]}>
        <View style={styles.toastTextContainer}>
          {text1 && <Text style={styles.toastTitle}>{text1}</Text>}
          {text2 && <Text style={styles.toastMessage}>{text2}</Text>}
        </View>
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    width: "100%",
    alignItems: "center",
  },
  toastContent: {
    minHeight: 60,
    width: "90%",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successBorder: {
    borderLeftColor: colors.success,
  },
  errorBorder: {
    borderLeftColor: colors.error,
  },
  infoBorder: {
    borderLeftColor: colors.primary,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  toastMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});

export default function CustomToast() {
  return <Toast topOffset={60} config={toastConfig} />;
}
