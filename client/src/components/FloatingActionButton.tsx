import { Plus } from 'lucide-react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';

export default function FloatingActionButton() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleClick = () => {
        const match = matchPath('/category/:category', location.pathname);
        const category = match?.params.category;

        navigate('/new', {
            state: { initialCategory: category ? decodeURIComponent(category) : '' }
        });
    };

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 z-50 group"
            aria-label="Add new item"
        >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
    );
}
