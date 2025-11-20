// src/types/project.types.ts

export enum CodeType {
  HTML = 'HTML',
  REACT = 'REACT',
}

export enum AIModel {
  GEMINI = 'GEMINI',
  QWEN = 'QWEN',
}

export enum ProjectStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface GenerateWebsiteRequest {
  companyName: string;
  industry: string;
  websiteType: string;
  designStyle: string;
  codeType: CodeType;
  aiModel: AIModel;
  colorScheme: ColorScheme;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Matches the Stream response structure
export interface GenerationProgress {
  projectId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  currentStep?: string;
  files?: Record<string, string>; // Sent on completion
  error?: string;
}

export interface ProjectFile {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  content?: string; // Content is now available directly if needed
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  companyName: string;
  industry: string;
  websiteType: string;
  designStyle: string;
  colorScheme: ColorScheme;
  codeType: CodeType;
  aiModel: AIModel;
  status: ProjectStatus;
  progress: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  files: ProjectFile[];
}

export interface AvailableModel {
  id: AIModel;
  name: string;
  description: string;
  provider: string;
}