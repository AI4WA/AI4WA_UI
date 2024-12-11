import { getAuthHeaders } from './auth';

export const api = {
    get: async <T>(url: string): Promise<T> => {
        const response = await fetch(`http://localhost:8000/api${url}`, {
            headers: getAuthHeaders(),
        });
        return response.json();
    },

    post: async <T, D extends Record<string, unknown>>(url: string, data: D): Promise<T> => {
        const response = await fetch(`http://localhost:8000/api${url}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return response.json();
    },

    // Add other methods as needed
};