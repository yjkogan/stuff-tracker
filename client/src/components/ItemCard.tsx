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
                    className="w-20 h-20 rounded-xl object-contain bg-gray-100 shadow-inner"
                />
            ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                    <span className="text-xs font-medium">No Img</span>
                </div>
            )}

            <div className="flex-1 min-w-0 py-1">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                        {item.name}
                    </h3>
                    <div className="flex items-center gap-1">
                        {rank && (
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                                #{rank}
                            </span>
                        )}
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full" title="Normalized Score (0-10)">
                            Score: {(item.normalizedScore ? item.normalizedScore / 10 : undefined)?.toFixed(1) ?? '?'}
                        </span>
                    </div>
                </div>

                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {item.notes || 'No notes'}
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <span>Submitted:</span>
                    <Calendar className="w-3 h-3" />
                    <time>{new Date(item.createdAt).toLocaleDateString()}</time>
                </div>
            </div>
        </>
    );

    const className = "group flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 active:scale-[0.99] w-full text-left";

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
