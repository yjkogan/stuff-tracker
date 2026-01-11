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
    } catch (err: unknown) {
      console.error(err);
      let msg = 'Failed to save item';
      if (err instanceof Error) msg = err.message;
      setError(msg);
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

  if (loading)
    return (
      <div className='flex justify-center py-20'>
        <Loader2 className='h-8 w-8 animate-spin text-indigo-600' />
      </div>
    );

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
    <div className='space-y-6'>
      <h2 className='text-2xl font-bold text-gray-900'>{isNew ? 'New Entry' : 'Edit Entry'}</h2>

      {error && (
        <div className='rounded-xl border border-red-200 bg-red-50 p-4 text-red-700'>{error}</div>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='space-y-4'>
          <div>
            <div className='mb-1 flex items-center justify-between'>
              <label htmlFor='category' className='block text-sm font-medium text-gray-700'>
                Category
              </label>
              {formData.category && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                    categories.some((c) => c.toLowerCase() === formData.category.toLowerCase())
                      ? 'bg-green-100 text-green-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {categories.some((c) => c.toLowerCase() === formData.category.toLowerCase())
                    ? 'Existing'
                    : 'New Category'}
                </span>
              )}
            </div>
            <div className='group relative'>
              <input
                id='category'
                list='categories'
                type='text'
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className='w-full rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-lg font-semibold text-indigo-900 outline-none transition-all placeholder:text-indigo-300/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100'
                placeholder='Select or create...'
                required
              />
              {/* TODO: This data list approach kinda sucks from a UI standpoint and doesn't seem to work in Firefox */}
              <datalist id='categories'>
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label htmlFor='name' className='mb-1 block text-sm font-medium text-gray-700'>
              Name
            </label>
            <input
              id='name'
              type='text'
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className='w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'
              placeholder='What is it?'
              required
            />
          </div>

          <div>
            <label htmlFor='notes' className='mb-1 block text-sm font-medium text-gray-700'>
              Notes
            </label>
            <textarea
              id='notes'
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className='min-h-[120px] w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'
              placeholder='Any details...'
            />
          </div>
        </div>

        <ImageUpload
          value={selectedFile}
          onChange={setSelectedFile}
          currentImageUrl={formData.imageUrl}
          onClear={() => setFormData({ ...formData, imageUrl: '' })}
        />

        <div className='flex flex-col gap-3'>
          <button
            type='submit'
            disabled={saving}
            className='flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 font-medium text-white shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01] hover:bg-indigo-700 active:scale-[0.99] disabled:scale-100 disabled:opacity-70'
          >
            {saving ? <Loader2 className='h-5 w-5 animate-spin' /> : <Save className='h-5 w-5' />}
            <span>{isNew ? 'Save Item' : 'Update Item'}</span>
          </button>

          {!isNew && currentItem && (
            <>
              <button
                type='button'
                onClick={() => setRankingItem(currentItem)}
                className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-100 bg-white py-4 font-medium text-indigo-600 transition-all hover:border-indigo-200 hover:bg-indigo-50'
              >
                <Trophy className='h-5 w-5' />
                <span>Rank This Item</span>
              </button>

              <button
                type='button'
                onClick={handleDelete}
                className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-100 bg-white py-4 font-medium text-red-600 transition-all hover:border-red-200 hover:bg-red-50'
              >
                <Trash2 className='h-5 w-5' />
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
        title='Delete Item'
        message='Are you sure you want to delete this item? This action cannot be undone.'
      />
    </div>
  );
}
