import { Item, CreateItemDTO } from '../types';

// Backend returns these fields in snake_case
interface BackendItem {
    id: string;
    category: string;
    name: string;
    notes?: string | null;
    image_url?: string | null;
    created_at: string;
    rank_order: number;
    normalized_score: number;
}

function transformItem(item: BackendItem): Item {
    return {
        id: item.id,
        category: item.category,
        name: item.name,
        notes: item.notes ?? undefined,
        imageUrl: item.image_url ?? undefined, // Map snake_case to camelCase
        createdAt: new Date(item.created_at),
        rankOrder: item.rank_order,
        normalizedScore: item.normalized_score
    };
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    } as HeadersInit;

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!res.ok) {
        let errorMessage = 'An error occurred';
        try {
            // Try to parse as text first, could be JSON or plain text
            const errorBody = await res.text();
            // Try to see if it's JSON
            try {
                const jsonError = JSON.parse(errorBody);
                // If the backend sends { error: "message" } or similar
                if (jsonError.error) errorMessage = jsonError.error;
                else if (jsonError.message) errorMessage = jsonError.message;
                else errorMessage = errorBody;
            } catch {
                // Not JSON, use text if not empty
                if (errorBody) errorMessage = errorBody;
                else errorMessage = res.statusText;
            }
        } catch {
            errorMessage = res.statusText;
        }
        throw new Error(errorMessage);
    }

    return res;
}

export const api = {
    getAllItems: async (): Promise<Item[]> => {
        const res = await fetchWithAuth('/api/items');
        if (!res.ok) throw new Error('Failed to fetch items');
        const data: BackendItem[] = await res.json();
        return data.map(transformItem);
    },

    getItemsByCategory: async (category: string): Promise<Item[]> => {
        const res = await fetchWithAuth(`/api/items?category=${encodeURIComponent(category)}`);
        if (!res.ok) throw new Error('Failed to fetch items by category');
        const data: BackendItem[] = await res.json();
        return data.map(transformItem);
    },

    getItem: async (id: string): Promise<Item | undefined> => {
        const res = await fetchWithAuth(`/api/items/${id}`);
        if (res.status === 404) return undefined;
        if (!res.ok) throw new Error('Failed to fetch item');
        const data: BackendItem = await res.json();
        return transformItem(data);
    },

    createItem: async (data: CreateItemDTO): Promise<Item> => {
        const payload = {
            category: data.category,
            name: data.name,
            notes: data.notes,
            image_url: data.imageUrl,
        };
        const res = await fetchWithAuth('/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create item');
        const newItem: BackendItem = await res.json();
        return transformItem(newItem);
    },

    updateItem: async (id: string, data: Partial<CreateItemDTO>): Promise<Item> => {
        const payload: any = { ...data };
        if ('imageUrl' in data) {
            payload.image_url = data.imageUrl;
            delete payload.imageUrl;
        }

        const res = await fetchWithAuth(`/api/items/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update item');
        const updatedItem: BackendItem = await res.json();
        return transformItem(updatedItem);
    },

    getAllCategories: async (): Promise<string[]> => {
        const res = await fetchWithAuth('/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        return await res.json();
    },

    updateItemRank: async (id: string, rankOrder: number): Promise<void> => {
        const res = await fetchWithAuth(`/api/items/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rank_order: rankOrder })
        });
        if (!res.ok) throw new Error('Failed to update item rank');
    },

    uploadImage: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetchWithAuth('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) throw new Error('Failed to upload image');
        const data: { url: string } = await res.json();
        return data.url;
    },

    deleteItem: async (id: string): Promise<void> => {
        const res = await fetchWithAuth(`/api/items/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete item');
    }
};
