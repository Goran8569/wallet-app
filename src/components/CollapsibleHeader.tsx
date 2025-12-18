import React, { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../utils/colors";

interface CollapsibleHeaderProps {
  title: string;
  scrollY: Animated.Value;
  showFilter?: boolean;
  onMenuPress?: () => void;
}

export function useCollapsibleHeader() {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = insets.top + 60;

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: false,
  });

  return {
    scrollY,
    headerHeight,
    handleScroll,
  };
}

export default function CollapsibleHeader({ title, scrollY, showFilter = false, onMenuPress }: CollapsibleHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const headerHeight = insets.top + 60;
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.85],
    extrapolate: "clamp",
  });

  const smallTitleOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <>
      {/* Header with Back and Menu - Always visible */}
      <View style={[styles.headerBar, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Animated.Text
          style={[
            styles.smallTitle,
            {
              opacity: smallTitleOpacity,
            },
          ]}>
          {title}
        </Animated.Text>
        {showFilter ? (
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.menuButton} />
        )}
      </View>

      {/* Collapsible Large Title Header */}
      <Animated.View
        style={[
          styles.titleHeader,
          {
            paddingTop: headerHeight,
            opacity: titleOpacity,
            transform: [{ scale: titleScale }],
          },
        ]}
        pointerEvents="none">
        <View style={styles.largeTitleContainer}>
          <Text style={styles.largeTitle}>{title}</Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 101,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: colors.background,
    minHeight: 52,
  },
  titleHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  largeTitleContainer: {
    alignItems: "flex-start",
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  backIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  smallTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  menuIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: "600",
  },
});
