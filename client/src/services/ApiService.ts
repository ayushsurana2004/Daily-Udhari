import axios, { AxiosInstance } from 'axios';

class ApiService {
    private static instance: ApiService;
    private api: AxiosInstance;
    
    private constructor() {
        const baseUrl = import.meta.env.VITE_API_URL;

        this.api = axios.create({
            baseURL: baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add a request interceptor to attach the JWT token
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Add a response interceptor to auto-logout on 401 Unauthorized
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('token_expiry');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    public async post(url: string, data?: any) {
        return this.api.post(url, data);
    }

    public async get(url: string, config?: any) {
        return this.api.get(url, config);
    }

    public async put(url: string, data?: any) {
        return this.api.put(url, data);
    }

    public async delete(url: string, config?: any) {
        return this.api.delete(url, config);
    }

    // Auth specific methods
    public async login(credentials: any) {
        const response = await this.post('/login', credentials);
        if (response.data.token) {
            const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours in ms
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('token_expiry', expiryTime.toString());
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    }

    public logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('token_expiry');
    }
}

export default ApiService.getInstance();
