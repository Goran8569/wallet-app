import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useMutation } from "@tanstack/react-query";
import * as LocalAuthentication from "expo-local-authentication";
import { useAppDispatch } from "../../store/hooks";
import { setToken } from "../../store/slices/authSlice";
import { authService } from "../../store/services/auth";
import { LoginRequest } from "../../types";
import Button from "../../components/Button";
import Input from "../../components/Input";
import ScreenLayout from "../../components/ScreenLayout";
import Toast from "react-native-toast-message";
import { colors } from "../../utils/colors";

export default function LoginScreen() {
  const dispatch = useAppDispatch();

  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password123");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isCheckingBiometric, setIsCheckingBiometric] = useState(true);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: async (response, credentials) => {
      dispatch(setToken(response.auth.access_token));
      await authService.storeBiometricCredentials(credentials);
      Toast.show({
        type: "success",
        text1: "Login successful",
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: error.message || "Please check your credentials",
      });
    },
  });

  const validate = useCallback((): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(() => {
    if (validate()) {
      loginMutation.mutate({ email, password });
    }
  }, [validate, loginMutation, email, password]);

  const handleBiometricLogin = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Toast.show({
          type: "info",
          text1: "Biometric authentication not available",
        });
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to login",
        fallbackLabel: "Use password",
      });

      if (result.success) {
        const storedCredentials = await authService.getBiometricCredentials();
        if (storedCredentials) {
          loginMutation.mutate(storedCredentials);
        } else {
          if (validate()) {
            loginMutation.mutate({ email, password });
          }
        }
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Biometric authentication failed",
      });
    }
  }, [loginMutation, validate, email, password]);

  const isLoading = useMemo(() => isCheckingBiometric || loginMutation.isPending, [isCheckingBiometric, loginMutation.isPending]);

  const loadingText = useMemo(() => (isCheckingBiometric ? "Authenticating..." : "Signing in..."), [isCheckingBiometric]);

  useEffect(() => {
    const attemptBiometricLogin = async () => {
      try {
        const isBiometricEnabled = await authService.isBiometricEnabled();
        if (!isBiometricEnabled) {
          setIsCheckingBiometric(false);
          return;
        }

        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          setIsCheckingBiometric(false);
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to login",
          fallbackLabel: "Use password",
          cancelLabel: "Cancel",
        });

        if (result.success) {
          const storedCredentials = await authService.getBiometricCredentials();
          if (storedCredentials) {
            loginMutation.mutate(storedCredentials);
          } else {
            setIsCheckingBiometric(false);
          }
        } else {
          setIsCheckingBiometric(false);
        }
      } catch (error) {
        setIsCheckingBiometric(false);
      }
    };

    attemptBiometricLogin();
  }, [loginMutation]);

  if (isLoading) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <Text style={styles.title}>Native Teams Wallet</Text>
          <Text style={styles.subtitle}>{loadingText}</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout keyboardAvoiding scrollable contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <Text style={styles.title}>Native Teams Wallet</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <View style={styles.form}>
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />

          <Input label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry autoCapitalize="none" autoComplete="password" error={errors.password} />

          <Button title="Sign In" onPress={handleLogin} loading={loginMutation.isPending} disabled={loginMutation.isPending} style={styles.loginButton} />

          <Button title="Use Biometric" onPress={handleBiometricLogin} variant="outline" style={styles.biometricButton} />
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    width: "100%",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  form: {
    width: "100%",
  },
  loginButton: {
    marginTop: 8,
  },
  biometricButton: {
    marginTop: 16,
  },
});
