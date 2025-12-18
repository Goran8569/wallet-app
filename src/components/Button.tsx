import React, { useMemo } from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors } from "../utils/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({ title, onPress, variant = "primary", disabled = false, loading = false, style, textStyle }: ButtonProps) {
  const buttonStyle = useMemo((): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
    };

    if (disabled || loading) {
      return { ...baseStyle, opacity: 0.5 };
    }

    switch (variant) {
      case "primary":
        return { ...baseStyle, backgroundColor: colors.white };
      case "secondary":
      case "outline":
        return {
          ...baseStyle,
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.textPrimary,
        };
      default:
        return baseStyle;
    }
  }, [variant, disabled, loading]);

  const textStyleMemo = useMemo((): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 16,
      fontWeight: "600",
    };

    switch (variant) {
      case "primary":
        return { ...baseStyle, color: colors.textTertiary };
      case "secondary":
      case "outline":
        return { ...baseStyle, color: colors.textPrimary };
      default:
        return { ...baseStyle, color: colors.textPrimary };
    }
  }, [variant]);

  const indicatorColor = useMemo(() => (variant === "primary" ? colors.textTertiary : colors.textPrimary), [variant]);

  return (
    <TouchableOpacity style={[buttonStyle, style]} onPress={onPress} disabled={disabled || loading} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: disabled || loading }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      {loading ? <ActivityIndicator color={indicatorColor} /> : <Text style={[textStyleMemo, textStyle]}>{title}</Text>}
    </TouchableOpacity>
  );
}
