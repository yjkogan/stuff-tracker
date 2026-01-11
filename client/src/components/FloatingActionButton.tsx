import { Plus } from 'lucide-react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';

export default function FloatingActionButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    const match = matchPath('/category/:category', location.pathname);
    const category = match?.params.category;

    navigate('/new', {
      state: { initialCategory: category ? decodeURIComponent(category) : '' },
    });
  };

  return (
    <button
      onClick={handleClick}
      className='group fixed bottom-6 right-6 z-50 rounded-full bg-indigo-600 p-4 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-indigo-700 hover:shadow-xl active:scale-95'
      aria-label='Add new item'
    >
      <Plus className='h-6 w-6 transition-transform duration-300 group-hover:rotate-90' />
    </button>
  );
}
