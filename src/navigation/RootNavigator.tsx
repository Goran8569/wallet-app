import React, { useEffect, useCallback, useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";
import * as Linking from "expo-linking";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppSelector } from "../store/hooks";
import { parseDeepLink } from "../utils/deepLinking";
import { navigationRef } from "../../App";
import { colors } from "../utils/colors";
import LoginScreen from "../screens/auth/LoginScreen";
import WalletHomeScreen from "../screens/wallet/WalletHomeScreen";
import TransactionsScreen from "../screens/transactions/TransactionsScreen";
import TransactionDetailsScreen from "../screens/transactions/TransactionDetailsScreen";
import SendPayoutFormScreen from "../screens/payouts/SendPayoutFormScreen";
import SendPayoutReviewScreen from "../screens/payouts/SendPayoutReviewScreen";
import SendPayoutSuccessScreen from "../screens/payouts/SendPayoutSuccessScreen";
import AddFundsScreen from "../screens/wallet/AddFundsScreen";
import InfoScreen from "../screens/info/InfoScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const tabBarOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: colors.backgroundSecondary,
        borderTopWidth: 0,
        elevation: 0,
      },
    }),
    []
  );

  const homeIcon = useCallback(({ color, size }: { color: string; size: number }) => <MaterialIcons name="account-balance-wallet" size={size} color={color} />, []);

  const transactionsIcon = useCallback(({ color, size }: { color: string; size: number }) => <MaterialIcons name="swap-horiz" size={size} color={color} />, []);

  const infoIcon = useCallback(({ color, size }: { color: string; size: number }) => <MaterialIcons name="info" size={size} color={color} />, []);

  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen name="Home" component={WalletHomeScreen} options={{ tabBarLabel: "Home", tabBarIcon: homeIcon }} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ tabBarLabel: "Transactions", tabBarIcon: transactionsIcon }} />
      <Tab.Screen name="Info" component={InfoScreen} options={{ tabBarLabel: "Info", tabBarIcon: infoIcon }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [pendingDeepLink, setPendingDeepLink] = React.useState<string | null>(null);

  const screenOptions = useMemo(() => ({ headerShown: false }), []);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        setPendingDeepLink(url);
      }
    });

    const subscription = Linking.addEventListener("url", (event) => {
      setPendingDeepLink(event.url);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (pendingDeepLink && isAuthenticated) {
      const handleDeepLink = () => {
        if (!navigationRef.current?.isReady()) {
          setTimeout(handleDeepLink, 200);
          return;
        }

        const params = parseDeepLink(pendingDeepLink);

        if (params?.screen === "TransactionDetails" && params.id) {
          navigationRef.current.dispatch(
            CommonActions.navigate({
              name: "TransactionDetails",
              params: { transactionId: params.id },
            })
          );
          setPendingDeepLink(null);
        } else {
          setPendingDeepLink(null);
        }
      };

      setTimeout(handleDeepLink, 500);
    }
  }, [pendingDeepLink, isAuthenticated]);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} options={screenOptions} />
          <Stack.Screen name="SendPayoutForm" component={SendPayoutFormScreen} options={screenOptions} />
          <Stack.Screen name="SendPayoutReview" component={SendPayoutReviewScreen} options={screenOptions} />
          <Stack.Screen name="SendPayoutSuccess" component={SendPayoutSuccessScreen} options={screenOptions} />
          <Stack.Screen name="AddFunds" component={AddFundsScreen} options={screenOptions} />
        </>
      )}
    </Stack.Navigator>
  );
}
