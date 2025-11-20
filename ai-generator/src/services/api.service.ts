// src/services/api.service.ts

import axios, { AxiosInstance } from "axios";
import {
  GenerateWebsiteRequest,
  ApiResponse,
  Project,
  AvailableModel,
  GenerationProgress
} from "@/types/project.types";

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generator method that yields progress updates from the SSE stream
   * [cite: 12, 14, 16] - backend controller implements generateStream
   */
  async *generateWebsiteStream(
    data: GenerateWebsiteRequest,
    endpoint: string = '/generation/generate-stream'
  ): AsyncGenerator<GenerationProgress, void, unknown> {
    const token = localStorage.getItem("token");
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Generation failed');
    }

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6);
            const data = JSON.parse(jsonStr) as GenerationProgress;
            yield data;
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  }

  // Standard CRUD endpoints matching Backend Controller
  async getProjects(): Promise<ApiResponse<Project[]>> {
    const response = await this.client.get("/generation/projects"); // [cite: 28]
    return response.data;
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    const response = await this.client.get(`/generation/project/${id}`); // [cite: 21]
    return response.data;
  }

  // New Endpoint: Fetches pre-formatted Sandpack files
  async getSandpackFiles(id: string): Promise<ApiResponse<{ projectId: string; codeType: string; files: Record<string, string> }>> {
    const response = await this.client.get(`/generation/project/${id}/sandpack-files`); // 
    return response.data;
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.post(`/generation/project/${id}/delete`); // [cite: 40]
    return response.data;
  }

  async getAvailableModels(): Promise<ApiResponse<AvailableModel[]>> {
    const response = await this.client.get("/generation/models"); // [cite: 43]
    return response.data;
  }
}

export const apiService = new ApiService();