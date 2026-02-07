import { apiClient } from './client';

export interface Bot {
  id: string;
  name: string;
  phoneNumber: string;
  status: string;
  isActive: boolean;
  totalMessages: number;
  totalCommands: number;
  totalGroups: number;
  createdAt: string;
}

export interface CreateBotData {
  name: string;
  phoneNumber: string;
}

export const botsApi = {
  getAll: async (): Promise<Bot[]> => {
    const response = await apiClient.get('/bots');
    return response.data;
  },

  getById: async (id: string): Promise<Bot> => {
    const response = await apiClient.get(`/bots/${id}`);
    return response.data;
  },

  create: async (data: CreateBotData): Promise<Bot> => {
    const response = await apiClient.post('/bots', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateBotData>): Promise<Bot> => {
    const response = await apiClient.patch(`/bots/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/bots/${id}`);
  },

  start: async (id: string) => {
    const response = await apiClient.post(`/bots/${id}/start`);
    return response.data;
  },

  stop: async (id: string) => {
    const response = await apiClient.post(`/bots/${id}/stop`);
    return response.data;
  },

  restart: async (id: string) => {
    const response = await apiClient.post(`/bots/${id}/restart`);
    return response.data;
  },

  getQR: async (id: string) => {
    const response = await apiClient.get(`/bots/${id}/qr`);
    return response.data;
  },

  getStats: async (id: string) => {
    const response = await apiClient.get(`/bots/${id}/stats`);
    return response.data;
  },

  getLogs: async (id: string, limit = 100) => {
    const response = await apiClient.get(`/bots/${id}/logs`, {
      params: { limit },
    });
    return response.data;
  },
};
