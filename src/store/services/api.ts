import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { LoginRequest, LoginResponse, ApiResponse, Wallet, TransactionsData, PayoutRequest, PayoutResponseData, ApiError } from "../../types";

const API_BASE_URL_SIMULATOR = Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:3000";
const API_BASE_URL_DEVICE = Constants.expoConfig?.extra?.apiBaseUrlDevice || "http://192.168.100.76:3000";
const API_KEY = Constants.expoConfig?.extra?.apiKey || "";

const metroBundlerHost = Constants.expoConfig?.hostUri?.split(":")[0] || "";
const isMetroUsingIP = metroBundlerHost && metroBundlerHost !== "localhost" && metroBundlerHost !== "127.0.0.1";

const isPhysicalDevice = Constants.isDevice === true || Constants.executionEnvironment === "standalone" || Constants.executionEnvironment === "bare" || isMetroUsingIP || (Platform.OS !== "web" && !__DEV__);

const API_BASE_URL = isPhysicalDevice ? API_BASE_URL_DEVICE : API_BASE_URL_SIMULATOR;

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY && { "X-API-Key": API_KEY }),
      },
      timeout: 10000,
    });

    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await SecureStore.getItemAsync("auth_token");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        const apiError: ApiError = {
          timestamp: error.response?.data?.timestamp,
          status: error.response?.status || 500,
          error: error.response?.data?.error || "Error",
          message: error.response?.data?.message || error.message || "An error occurred",
          path: error.response?.data?.path,
        };
        return Promise.reject(apiError);
      }
    );
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>("/auth/login", credentials);
    return response.data;
  }

  async getBalances(): Promise<Wallet[]> {
    const response = await this.client.get<ApiResponse<Wallet[]>>("/balances");
    return response.data.data;
  }

  async getTransactions(params?: { page?: number; per_page?: number; wallet_id?: number; type?: "top-up" | "withdrawal"; status?: "completed" | "pending" | "failed"; date_from?: string; date_to?: string; search?: string }): Promise<ApiResponse<TransactionsData>> {
    const response = await this.client.get<ApiResponse<TransactionsData>>("/transactions", { params });
    return response.data;
  }

  async createPayout(payout: PayoutRequest): Promise<ApiResponse<PayoutResponseData>> {
    const response = await this.client.post<ApiResponse<PayoutResponseData>>("/payouts", payout);
    return response.data;
  }
}

export const apiService = new ApiService();
