import { Rating } from '../types';
import { LucideIcon } from 'lucide-react';

interface RatingButtonProps {
    value: Rating;
    currentRating: Rating;
    icon: LucideIcon;
    label: string;
    onClick: (value: Rating) => void;
}

export default function RatingButton({ value, currentRating, icon: Icon, label, onClick }: RatingButtonProps) {
    const isSelected = currentRating === value;
    let activeClass = '';
    
    if (value === 'good') activeClass = 'bg-green-100 text-green-700 border-green-200 ring-2 ring-green-500 ring-offset-2';
    if (value === 'bad') activeClass = 'bg-red-100 text-red-700 border-red-200 ring-2 ring-red-500 ring-offset-2';
    if (value === 'meh') activeClass = 'bg-yellow-100 text-yellow-700 border-yellow-200 ring-2 ring-yellow-500 ring-offset-2';

    return (
        <button
            type="button"
            onClick={() => onClick(value)}
            className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-1 transition-all duration-200 ${isSelected
                    ? activeClass
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
        >
            <Icon className={`w-6 h-6 ${isSelected ? 'scale-110' : ''}`} />
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
}
