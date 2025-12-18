import * as SecureStore from "expo-secure-store";
import { apiService } from "./api";
import { LoginRequest, LoginResponse } from "../../types";

const AUTH_TOKEN_KEY = "auth_token";
const BIOMETRIC_CREDENTIALS_KEY = "biometric_credentials";
const BIOMETRIC_ENABLED_KEY = "biometric_enabled";

export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiService.login(credentials);
    await this.storeToken(response.auth.access_token);
    return response;
  }

  async storeToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  }

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  async storeBiometricCredentials(credentials: LoginRequest): Promise<void> {
    try {
      const credentialsJson = JSON.stringify(credentials);
      await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, credentialsJson);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
    } catch (error) {}
  }

  async getBiometricCredentials(): Promise<LoginRequest | null> {
    try {
      const credentialsJson = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (credentialsJson) {
        return JSON.parse(credentialsJson);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === "true";
    } catch (error) {
      return false;
    }
  }

  async clearBiometricCredentials(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    } catch (error) {}
  }
}

export const authService = new AuthService();
