import axios from 'axios';
import { User, Workspace, File, AuthResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: async (username: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const workspaceAPI = {
  getWorkspaces: async (): Promise<Workspace[]> => {
    const response = await api.get('/workspaces');
    return response.data;
  },

  createWorkspace: async (name: string, description?: string): Promise<Workspace> => {
    const response = await api.post('/workspaces', { name, description });
    return response.data;
  },

  getWorkspace: async (id: string): Promise<Workspace> => {
    const response = await api.get(`/workspaces/${id}`);
    return response.data;
  },

  addMember: async (workspaceId: string, userId: string, role: string): Promise<Workspace> => {
    const response = await api.post(`/workspaces/${workspaceId}/members`, { userId, role });
    return response.data;
  },
};

export const fileAPI = {
  getFiles: async (workspaceId: string): Promise<File[]> => {
    const response = await api.get(`/files/workspace/${workspaceId}`);
    return response.data;
  },

  createFile: async (workspaceId: string, name: string, content: string, language: string, path: string): Promise<File> => {
    const response = await api.post(`/files/workspace/${workspaceId}`, { name, content, language, path });
    return response.data;
  },

  getFile: async (id: string): Promise<File> => {
    const response = await api.get(`/files/${id}`);
    return response.data;
  },

  updateFile: async (id: string, content: string, name?: string, language?: string): Promise<File> => {
    const response = await api.put(`/files/${id}`, { content, name, language });
    return response.data;
  },

  deleteFile: async (id: string): Promise<void> => {
    await api.delete(`/files/${id}`);
  },
};

export default api;
