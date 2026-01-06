import { Link } from 'react-router-dom';
import { Rating, Item } from '../types';
import { ThumbsUp, ThumbsDown, Minus, Calendar } from 'lucide-react';

interface ItemCardProps {
    item: Item;
}

const RatingIcon = ({ rating }: { rating: Rating }) => {
    switch (rating) {
        case 'good':
            return <div className="p-1.5 rounded-full bg-green-100 text-green-600"><ThumbsUp className="w-4 h-4" /></div>;
        case 'bad':
            return <div className="p-1.5 rounded-full bg-red-100 text-red-600"><ThumbsDown className="w-4 h-4" /></div>;
        case 'meh':
            return <div className="p-1.5 rounded-full bg-yellow-100 text-yellow-600"><Minus className="w-4 h-4" /></div>;
    }
};

export default function ItemCard({ item }: ItemCardProps) {
    return (
        <Link
            to={`/item/${item.id}`}
            className="group flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 active:scale-[0.99]"
        >
            {item.imageUrl ? (
                <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover bg-gray-100 shadow-inner"
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
                    <RatingIcon rating={item.rating} />
                </div>

                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {item.notes || 'No notes...'}
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <Calendar className="w-3 h-3" />
                    <time>{new Date(item.createdAt).toLocaleDateString()}</time>
                </div>
            </div>
        </Link>
    );
}
