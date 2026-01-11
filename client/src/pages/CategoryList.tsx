import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Item } from '../types';
import ItemCard from '../components/ItemCard';
import { Loader2, PackageOpen } from 'lucide-react';

export default function CategoryList() {
  const { category } = useParams<{ category: string }>();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (category) {
        setLoading(true);
        try {
          const data = await api.getItemsByCategory(category);
          setItems(data);
        } finally {
          setLoading(false);
        }
      }
    }
    load();
  }, [category]);

  if (loading) {
    // TODO: Use shared spinner component
    return (
      <div className='flex justify-center py-20'>
        <Loader2 className='h-8 w-8 animate-spin text-indigo-600' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='mb-6'>
        <h2 className='text-3xl font-bold text-gray-900'>{category}</h2>
        <p className='text-gray-500'>{items.length} items</p>
      </div>

      {items.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white py-20 text-gray-400'>
          <PackageOpen className='mb-3 h-12 w-12 text-gray-300' />
          <p>This category is empty.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4'>
          {items.map((item, index) => (
            <ItemCard key={item.id} item={item} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
