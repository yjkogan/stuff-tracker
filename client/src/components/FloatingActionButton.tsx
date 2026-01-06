import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FloatingActionButton() {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/new')}
            className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 z-50 group"
            aria-label="Add new item"
        >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
    );
}
