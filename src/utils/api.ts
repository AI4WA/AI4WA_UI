import { getAuthHeaders } from './auth';

export const api = {
    get: async (url: string) => {
        const response = await fetch(`http://localhost:8000/api${url}`, {
            headers: getAuthHeaders(),
        });
        return response.json();
    },

    post: async (url: string, data: any) => {
        const response = await fetch(`http://localhost:8000/api${url}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return response.json();
    },

    // Add other methods as needed
};