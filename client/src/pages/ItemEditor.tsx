import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Item } from '../types';
import { Loader2, Save, Trophy } from 'lucide-react';
import RankingFlow from '../components/RankingFlow';

export default function ItemEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id;

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

    // Logic for Ranking Integration
    const [rankingItem, setRankingItem] = useState<Item | null>(null);
    const [currentItem, setCurrentItem] = useState<Item | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        notes: '',
        imageUrl: '',
    });

    useEffect(() => {
        async function init() {
            // TODO: Share categories that we already fetched
            const cats = await api.getAllCategories();
            setCategories(cats);

            if (!isNew && id) {
                const item = await api.getItem(id);
                if (item) {
                    setCurrentItem(item);
                    setFormData({
                        name: item.name,
                        category: item.category,
                        notes: item.notes || '',
                        imageUrl: item.imageUrl || '',
                    });
                }
            }
            setLoading(false);
        }
        init();
    }, [id, isNew]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isNew) {
                const newItem = await api.createItem(formData);
                // Instead of navigating back, start ranking flow
                setRankingItem(newItem);
            } else if (id) {
                await api.updateItem(id, formData);
                navigate(`/category/${encodeURIComponent(formData.category)}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };



    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    if (rankingItem) {
        return (
            <RankingFlow
                targetItem={rankingItem}
                onComplete={() => navigate(`/category/${encodeURIComponent(rankingItem.category)}`)}
                onCancel={() => navigate(`/category/${encodeURIComponent(rankingItem.category)}`)}
            />
        );
    }


    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{isNew ? 'New Entry' : 'Edit Entry'}</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload Placeholder */}
                {/* <div className="w-full aspect-video rounded-3xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-indigo-300 transition-colors cursor-pointer group">
                    <ImageIcon className="w-8 h-8 mb-2 group-hover:text-indigo-500" />
                    <span className="text-sm font-medium">Add Photo</span>
                </div> */}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all"
                            placeholder="What is it?"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <div className="relative">
                            <input
                                list="categories"
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Select or create..."
                                required
                            />
                            {/* TODO: This data list approach kinda sucks from a UI standpoint and doesn't seem to work in Firefox */}
                            <datalist id="categories">
                                {categories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all min-h-[120px]"
                            placeholder="Any details..."
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>{isNew ? 'Save Item' : 'Update Item'}</span>
                    </button>

                    {!isNew && currentItem && (
                        <button
                            type="button"
                            onClick={() => setRankingItem(currentItem)}
                            className="w-full py-4 bg-white text-indigo-600 border-2 border-indigo-100 rounded-xl font-medium hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Trophy className="w-5 h-5" />
                            <span>Rank This Item</span>
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
