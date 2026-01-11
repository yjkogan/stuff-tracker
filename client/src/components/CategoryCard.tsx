import { Link } from 'react-router-dom';
import { Folder, ChevronRight } from 'lucide-react';

interface CategoryCardProps {
  name: string;
}

export default function CategoryCard({ name }: CategoryCardProps) {
  return (
    <Link
      to={`/category/${encodeURIComponent(name)}`}
      className='group block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-100 hover:shadow-md active:scale-[0.98]'
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='rounded-xl bg-indigo-50 p-3 text-indigo-600 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white'>
            <Folder className='h-6 w-6' />
          </div>
          <div>
            <h3 className='font-semibold text-gray-900 transition-colors group-hover:text-indigo-700'>
              {name}
            </h3>
          </div>
        </div>

        <ChevronRight className='h-5 w-5 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-indigo-400' />
      </div>
    </Link>
  );
}
