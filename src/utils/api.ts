// api.ts
import { getAuthHeaders } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const api = {
    get: async <T>(url: string): Promise<T> => {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: getAuthHeaders(),
        });
        return response.json();
    },

    post: async <T, D extends Record<string, unknown>>(url: string, data: D): Promise<T> => {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return response.json();
    },

    // Add other methods as needed
};