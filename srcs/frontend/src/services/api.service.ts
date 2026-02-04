import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
	private instance: AxiosInstance;
	private accessToken: string | null = null;

	constructor() {
		this.instance = axios.create({
			baseURL: API_BASE_URL,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		this.setupInterceptors();
	}

	private setupInterceptors(): void {
		// Request interceptor - add auth token
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
			(response) => response,
			async (error) => {
				if (error.response?.status === 401) {
					// Token expired - could implement refresh logic here
					this.clearToken();
				}
				return Promise.reject(error);
			}
		);
	}

	setToken(token: string): void {
		this.accessToken = token;
		localStorage.setItem('accessToken', token);
	}

	clearToken(): void {
		this.accessToken = null;
		localStorage.removeItem('accessToken');
	}

	loadToken(): void {
		const token = localStorage.getItem('accessToken');
		if (token) {
			this.accessToken = token;
		}
	}

	getToken(): string | null {
		return this.accessToken;
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
