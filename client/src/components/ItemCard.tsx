import { Link } from 'react-router-dom';
import { Item } from '../types';
import { Calendar } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
  rank?: number;
}

export default function ItemCard({ item, onClick, rank }: ItemCardProps) {
  const CardContent = () => (
    <>
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className='h-20 w-20 rounded-xl bg-gray-100 object-contain shadow-inner'
        />
      ) : (
        <div className='flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400'>
          <span className='text-xs font-medium'>No Img</span>
        </div>
      )}

      <div className='min-w-0 flex-1 py-1'>
        <div className='flex items-start justify-between gap-2'>
          <h3 className='truncate font-semibold text-gray-900 transition-colors group-hover:text-indigo-600'>
            {item.name}
          </h3>
          <div className='flex items-center gap-1'>
            {rank && (
              <span className='rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600'>
                #{rank}
              </span>
            )}
            <span
              className='rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-400'
              title='Normalized Score (0-10)'
            >
              {item.normalizedScore !== undefined && item.normalizedScore !== null
                ? `Score: ${(item.normalizedScore / 10).toFixed(1)}`
                : 'Not rated'}
            </span>
          </div>
        </div>

        <p className='mt-1 line-clamp-2 text-sm text-gray-500'>{item.notes || 'No notes'}</p>

        <div className='mt-3 flex items-center gap-2 text-xs font-medium text-gray-400'>
          <span>Submitted:</span>
          <Calendar className='h-3 w-3' />
          <time>{new Date(item.createdAt).toLocaleDateString()}</time>
        </div>
      </div>
    </>
  );

  const className =
    'group flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 active:scale-[0.99] w-full text-left';

  if (onClick) {
    return (
      <button onClick={onClick} className={className}>
        <CardContent />
      </button>
    );
  }

  return (
    <Link to={`/item/${item.id}`} className={className}>
      <CardContent />
    </Link>
  );
}
