export type Rating = 'good' | 'bad' | 'meh';

export interface Item {
  id: string;
  category: string;
  name: string;
  notes?: string;
  imageUrl?: string;
  rating: Rating;
  createdAt: Date;
  rankOrder?: number;
}

export type CreateItemDTO = Omit<Item, 'id' | 'createdAt'>;
