import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

class AuthService {
  private client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async register(email: string, password: string, name?: string): Promise<{ user: User; token: string }> {
    try {
      const response = await this.client.post<RegisterResponse>('/auth/register', {
        email,
        password,
        name,
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Registration failed');
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await this.client.post<LoginResponse>('/auth/login', {
        email,
        password,
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Login failed');
      }
      throw error;
    }
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await this.client.get('/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  async getProfile(token: string): Promise<User> {
    try {
      const response = await this.client.get('/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to get profile');
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
