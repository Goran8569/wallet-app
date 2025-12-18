import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Linking, Animated } from "react-native";
import CollapsibleHeader, { useCollapsibleHeader } from "../../components/CollapsibleHeader";
import { colors } from "../../utils/colors";

export default function InfoScreen() {
  const { scrollY, headerHeight, handleScroll } = useCollapsibleHeader();

  const handleSupportPress = useCallback(() => {
    Linking.openURL("mailto:support@nteams.com");
  }, []);

  const handleWebsitePress = useCallback(() => {
    Linking.openURL("https://www.nativeteams.com");
  }, []);

  const contentStyle = useMemo(() => ({ paddingTop: headerHeight + 60 }), [headerHeight]);

  return (
    <View style={styles.container}>
      <CollapsibleHeader title="Info" scrollY={scrollY} />
      <Animated.ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, contentStyle]} onScroll={handleScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fees</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Transaction Fees</Text>
            <Text style={styles.infoText}>Standard transaction fees apply based on payment method and currency.</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Card Payments</Text>
            <Text style={styles.infoText}>2.9% + $0.30 per transaction</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Bank Transfers</Text>
            <Text style={styles.infoText}>$1.00 per transaction</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Limits</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Daily Limit</Text>
            <Text style={styles.infoText}>$10,000 per day</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Monthly Limit</Text>
            <Text style={styles.infoText}>$100,000 per month</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Single Transaction</Text>
            <Text style={styles.infoText}>Maximum $5,000 per transaction</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Contact Us</Text>
            <Text style={[styles.infoText, styles.link]} onPress={handleSupportPress}>
              support@nteams.com
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Website</Text>
            <Text style={[styles.infoText, styles.link]} onPress={handleWebsitePress}>
              www.nativeteams.com
            </Text>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  infoBlock: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  link: {
    color: colors.primary,
    textDecorationLine: "underline",
  },
});
