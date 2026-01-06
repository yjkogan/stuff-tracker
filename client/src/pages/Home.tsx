import { useState, useEffect } from 'react';
import { api } from '../api/client';
import CategoryCard from '../components/CategoryCard';
import { Loader2 } from 'lucide-react';

export default function Home() {
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await api.getAllCategories();
                setCategories(data);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Categories</h2>

            {categories.length === 0 ? (
                <div className="py-20 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                    <p>No categories yet. Click + to add one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categories.map((cat) => (
                        <CategoryCard key={cat} name={cat} />
                    ))}
                </div>
            )}
        </div>
    );
}
