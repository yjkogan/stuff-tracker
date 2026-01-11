import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { Item } from '../types';
import { Loader2, Save, Trophy, Trash2 } from 'lucide-react';
import RankingFlow from '../components/RankingFlow';
import { ImageUpload } from '../components/ImageUpload';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ItemEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isNew = !id;

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [rankingItem, setRankingItem] = useState<Item | null>(null);
    const [currentItem, setCurrentItem] = useState<Item | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        category: location.state?.initialCategory || '',
        notes: '',
        imageUrl: '',
    });

    // File state for Upload-on-Save
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
        setError(null);
        try {
            let finalImageUrl = formData.imageUrl;

            // Upload image if a new file is selected
            if (selectedFile) {
                finalImageUrl = await api.uploadImage(selectedFile);
            }

            const payload = { ...formData, imageUrl: finalImageUrl };

            if (isNew) {
                const newItem = await api.createItem(payload);
                // Instead of navigating back, start ranking flow
                setRankingItem(newItem);
            } else if (id) {
                await api.updateItem(id, payload);
                navigate(`/category/${encodeURIComponent(formData.category)}`);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save item');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        setSaving(true);
        try {
            if (id) {
                await api.deleteItem(id);
                navigate(`/category/${encodeURIComponent(formData.category)}`, { replace: true });
            }
        } catch (err) {
            console.error(err);
            alert('Failed to delete item');
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

            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            {formData.category && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${categories.some(c => c.toLowerCase() === formData.category.toLowerCase())
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-indigo-100 text-indigo-700'
                                    }`}>
                                    {categories.some(c => c.toLowerCase() === formData.category.toLowerCase())
                                        ? 'Existing'
                                        : 'New Category'}
                                </span>
                            )}
                        </div>
                        <div className="relative group">
                            <input
                                list="categories"
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 text-lg font-semibold text-indigo-900 bg-indigo-50/50 rounded-xl border border-indigo-100 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-indigo-300/50"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all min-h-[120px]"
                            placeholder="Any details..."
                        />
                    </div>
                </div>

                <ImageUpload
                    value={selectedFile}
                    onChange={setSelectedFile}
                    currentImageUrl={formData.imageUrl}
                    onClear={() => setFormData({ ...formData, imageUrl: '' })}
                />

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
                        <>
                            <button
                                type="button"
                                onClick={() => setRankingItem(currentItem)}
                                className="w-full py-4 bg-white text-indigo-600 border-2 border-indigo-100 rounded-xl font-medium hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Trophy className="w-5 h-5" />
                                <span>Rank This Item</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                className="w-full py-4 bg-white text-red-600 border-2 border-red-100 rounded-xl font-medium hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span>Delete Item</span>
                            </button>
                        </>
                    )}
                </div>
            </form>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Delete Item"
                message="Are you sure you want to delete this item? This action cannot be undone."
            />
        </div>
    );
}
