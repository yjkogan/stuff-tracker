import { Item, CreateItemDTO } from '../types';

const DELAY = 500;

const SEED_DATA: Item[] = [
    {
        id: '1',
        category: 'Movies',
        name: 'Inception',
        notes: 'Mind blowing',
        rating: 'good',
        createdAt: new Date('2023-01-01'),
    },
    {
        id: '2',
        category: 'Restaurants',
        name: 'Burger & Co',
        notes: 'A bit greasy',
        rating: 'meh',
        createdAt: new Date('2023-02-15'),
    },
    {
        id: '3',
        category: 'Books',
        name: 'The Pragmatic Programmer',
        rating: 'good',
        createdAt: new Date('2023-03-10'),
    }
];

let items: Item[] = [...SEED_DATA];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
    getAllItems: async (): Promise<Item[]> => {
        await sleep(DELAY);
        return [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    getItemsByCategory: async (category: string): Promise<Item[]> => {
        await sleep(DELAY);
        return items
            .filter((item) => item.category === category)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },

    getItem: async (id: string): Promise<Item | undefined> => {
        await sleep(DELAY);
        return items.find((item) => item.id === id);
    },

    createItem: async (data: CreateItemDTO): Promise<Item> => {
        await sleep(DELAY);
        const newItem: Item = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date(),
        };
        items.push(newItem);
        return newItem;
    },

    updateItem: async (id: string, data: Partial<CreateItemDTO>): Promise<Item> => {
        await sleep(DELAY);
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) throw new Error('Item not found');

        items[index] = { ...items[index], ...data };
        return items[index];
    },

    getAllCategories: async (): Promise<string[]> => {
        await sleep(DELAY);
        const categories = new Set(items.map((item) => item.category));
        return Array.from(categories).sort();
    }
};
