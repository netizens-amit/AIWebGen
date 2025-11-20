// src/services/websocket.service.ts
import { io, Socket } from 'socket.io-client';
import { GenerationProgress } from '@/types/project.types';

class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket'],
    });
  }

  onProgress(callback: (data: GenerationProgress) => void) {
    this.socket?.on('generation:progress', callback);
  }

  // ✅ Added: Explicit onComplete method to fix TypeError
  // Maps to the same 'generation:progress' event but filters for 'completed' status
  // or listens to a specific 'generation:complete' event if backend emits it.
  // Assuming backend v2 emits 'generation:progress' with status='completed':
  onComplete(callback: (data: { projectId: string }) => void) {
    this.socket?.on('generation:progress', (data: GenerationProgress) => {
      if (data.status === 'completed') {
        callback({ projectId: data.projectId });
      }
    });
  }

  onError(callback: (data: { projectId: string; error: string }) => void) {
    // Listen for progress with failed status OR explicit error event
    this.socket?.on('generation:progress', (data: GenerationProgress) => {
      if (data.status === 'failed') {
        callback({ projectId: data.projectId, error: data.message });
      }
    });
  }

  offProgress() {
    this.socket?.off('generation:progress');
  }

  offComplete() {
    // Since we reuse the listener, removing 'generation:progress' removes this too
    // But for safety/clarity if we had separate events:
    this.socket?.off('generation:complete'); 
  }

  offError() {
    this.socket?.off('generation:error');
  }
  
  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const websocketService = new WebSocketService();
