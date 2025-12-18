import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { store, persistor } from "./src/store/store";
import CustomToast from "./src/components/CustomToast";
import { cacheService } from "./src/store/services/cache";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export const navigationRef = React.createRef<NavigationContainerRef<any>>();

function AppContent() {
  useEffect(() => {
    cacheService.seedCacheIfNeeded();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
              <StatusBar style="light" />
              <CustomToast />
            </NavigationContainer>
          </QueryClientProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

export default function App() {
  return <AppContent />;
}
