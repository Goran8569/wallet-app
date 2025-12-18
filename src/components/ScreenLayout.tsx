import React, { ReactNode } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../utils/colors";

interface ScreenLayoutProps {
  children: ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
}

export default function ScreenLayout({ children, scrollable = false, keyboardAvoiding = false, contentContainerStyle, style }: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = [styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }, style];

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView style={containerStyle} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        {scrollable ? (
          <ScrollView contentContainerStyle={[styles.scrollContent, contentContainerStyle]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={contentContainerStyle}>{children}</View>
        )}
      </KeyboardAvoidingView>
    );
  }

  if (scrollable) {
    return (
      <View style={containerStyle}>
        <ScrollView contentContainerStyle={[styles.scrollContent, contentContainerStyle]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    );
  }

  return <View style={[containerStyle, contentContainerStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
