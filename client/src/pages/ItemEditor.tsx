import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/mockClient';
import { Rating } from '../types';
import { ThumbsUp, ThumbsDown, Minus, Loader2, Save, Image as ImageIcon } from 'lucide-react';

export default function ItemEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id;

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        notes: '',
        rating: 'meh' as Rating,
        imageUrl: '',
    });

    useEffect(() => {
        async function init() {
            const cats = await api.getAllCategories();
            setCategories(cats);

            if (!isNew && id) {
                const item = await api.getItem(id);
                if (item) {
                    setFormData({
                        name: item.name,
                        category: item.category,
                        notes: item.notes || '',
                        rating: item.rating,
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
                await api.createItem(formData);
            } else if (id) {
                await api.updateItem(id, formData);
            }
            navigate(-1);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const RatingButton = ({ value, icon: Icon, label }: { value: Rating, icon: any, label: string }) => {
        const isSelected = formData.rating === value;
        let activeClass = '';
        if (value === 'good') activeClass = 'bg-green-100 text-green-700 border-green-200 ring-2 ring-green-500 ring-offset-2';
        if (value === 'bad') activeClass = 'bg-red-100 text-red-700 border-red-200 ring-2 ring-red-500 ring-offset-2';
        if (value === 'meh') activeClass = 'bg-yellow-100 text-yellow-700 border-yellow-200 ring-2 ring-yellow-500 ring-offset-2';

        return (
            <button
                type="button"
                onClick={() => setFormData({ ...formData, rating: value })}
                className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-1 transition-all duration-200 ${isSelected
                        ? activeClass
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
            >
                <Icon className={`w-6 h-6 ${isSelected ? 'scale-110' : ''}`} />
                <span className="text-xs font-medium">{label}</span>
            </button>
        );
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{isNew ? 'New Entry' : 'Edit Entry'}</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload Placeholder */}
                <div className="w-full aspect-video rounded-3xl bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-indigo-300 transition-colors cursor-pointer group">
                    <ImageIcon className="w-8 h-8 mb-2 group-hover:text-indigo-500" />
                    <span className="text-sm font-medium">Add Photo</span>
                </div>

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
                            <datalist id="categories">
                                {categories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                        <div className="flex gap-3">
                            <RatingButton value="good" icon={ThumbsUp} label="Good" />
                            <RatingButton value="meh" icon={Minus} label="Meh" />
                            <RatingButton value="bad" icon={ThumbsDown} label="Bad" />
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

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>{isNew ? 'Save Item' : 'Update Item'}</span>
                </button>
            </form>
        </div>
    );
}
