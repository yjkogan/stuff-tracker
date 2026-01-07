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
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900">{category}</h2>
                <p className="text-gray-500">{items.length} items</p>
            </div>

            {items.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                    <PackageOpen className="w-12 h-12 mb-3 text-gray-300" />
                    <p>This category is empty.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {items.map((item, index) => (
                        <ItemCard
                            key={item.id}
                            item={item}
                            rank={index + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
