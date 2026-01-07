
export interface Item {
  id: string;
  category: string;
  name: string;
  notes?: string;
  imageUrl?: string;
  createdAt: Date;
  rankOrder?: number;
  normalizedScore?: number;
}

export type CreateItemDTO = Omit<Item, 'id' | 'createdAt'>;
