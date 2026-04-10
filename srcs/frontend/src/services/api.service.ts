import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/';

interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

class ApiService {
	private instance: AxiosInstance;
	private accessToken: string | null = null;
	private refreshToken: string | null = null;
	private isRefreshing: boolean = false;
	private refreshSubscribers: ((token: string) => void)[] = [];

	constructor() {
		this.instance = axios.create({
			baseURL: API_BASE_URL,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		this.loadToken();
		this.setupInterceptors();
	}

	private onRefreshed(token: string): void {
		this.refreshSubscribers.forEach(callback => callback(token));
		this.refreshSubscribers = [];
	}

	private addRefreshSubscriber(callback: (token: string) => void): void {
		this.refreshSubscribers.push(callback);
	}

	private async attemptTokenRefresh(): Promise<string> {
		if (!this.refreshToken) {
			throw new Error('No refresh token available');
		}

		const response = await this.instance.post<TokenPair>('auth/refresh', {
			refreshToken: this.refreshToken
		});

		const { accessToken, refreshToken } = response.data;
		this.setTokens(accessToken, refreshToken);
		return accessToken;
	}

	private setupInterceptors(): void {
		// Request interceptor - add auth token
// api.service.ts -> vérifier le request interceptor
		this.instance.interceptors.request.use(
		(config) => {
			if (this.accessToken) {
			config.headers.Authorization = `Bearer ${this.accessToken}`;
			}
			return config;
		},
		(error) => Promise.reject(error)
		);

		// Response interceptor - handle errors
		this.instance.interceptors.response.use(
			(response) => {
				// Check if response data contains an error field
				if (response.data && typeof response.data === 'object' && 'error' in response.data) {
					const errorMessage = response.data.error || 'An error occurred';
					return Promise.reject(new Error(errorMessage));
				}
				return response;
			},
			async (error) => {
				const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

				// Only attempt refresh on 401 and if we have a refresh token
				if (error.response?.status === 401 && this.refreshToken && !originalRequest._retry) {
					// Don't retry refresh endpoint itself
					if (originalRequest.url?.includes('auth/refresh')) {
						this.clearTokens();
						return Promise.reject(error);
					}

					if (this.isRefreshing) {
						// Wait for the refresh to complete
						return new Promise((resolve) => {
							this.addRefreshSubscriber((token: string) => {
								originalRequest.headers.Authorization = `Bearer ${token}`;
								resolve(this.instance(originalRequest));
							});
						});
					}

					originalRequest._retry = true;
					this.isRefreshing = true;

					try {
						const newToken = await this.attemptTokenRefresh();
						this.isRefreshing = false;
						this.onRefreshed(newToken);

						// Retry original request with new token
						originalRequest.headers.Authorization = `Bearer ${newToken}`;
						return this.instance(originalRequest);
					} catch (refreshError) {
						this.isRefreshing = false;
						this.refreshSubscribers = [];
						this.clearTokens();
						// Return the original 401 error
						const errorMessage = error.response?.data?.error
							|| error.response?.data?.message
							|| error.message
							|| 'Session expired. Please log in again.';
						return Promise.reject(new Error(errorMessage));
					}
				}

				// Propagate 403 requiresVerification as-is for login flow
				if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
					return Promise.reject(error.response.data);
				}

				// Extract error message from response if available
				const errorMessage = error.response?.data?.error
					|| error.response?.data?.message
					|| error.message
					|| 'An error occurred';
				return Promise.reject(new Error(errorMessage));
			}
		);
	}

	setTokens(accessToken: string, refreshToken: string): void {
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		localStorage.setItem('accessToken', accessToken);
		localStorage.setItem('refreshToken', refreshToken);
	}

	clearTokens(): void {
		this.accessToken = null;
		this.refreshToken = null;
		localStorage.removeItem('accessToken');
		localStorage.removeItem('refreshToken');
	}

	loadToken(): void {
		const accessToken = localStorage.getItem('accessToken');
		const refreshToken = localStorage.getItem('refreshToken');
		if (accessToken) {
			this.accessToken = accessToken;
		}
		if (refreshToken) {
			this.refreshToken = refreshToken;
		}
	}

	getToken(): string | null {
		return this.accessToken;
	}

	getRefreshToken(): string | null {
		return this.refreshToken;
	}

	isAuthenticated(): boolean {
		return !!this.accessToken;
	}

	async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const response: AxiosResponse<T> = await this.instance.get(url, config);
		return response.data;
	}

	async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
		const response: AxiosResponse<T> = await this.instance.post(url, data, config);
		return response.data;
	}

	async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
		const response: AxiosResponse<T> = await this.instance.put(url, data, config);
		return response.data;
	}

	async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
		const response: AxiosResponse<T> = await this.instance.patch(url, data, config);
		return response.data;
	}

	async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const response: AxiosResponse<T> = await this.instance.delete(url, config);
		return response.data;
	}
}

export const apiService = new ApiService();
export default apiService;
