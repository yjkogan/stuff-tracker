import { Link } from 'react-router-dom';
import { Folder, ChevronRight } from 'lucide-react';

interface CategoryCardProps {
    name: string;
}

export default function CategoryCard({ name }: CategoryCardProps) {
    return (
        <Link
            to={`/category/${encodeURIComponent(name)}`}
            className="group block p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 active:scale-[0.98]"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        <Folder className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{name}</h3>
                    </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
        </Link>
    );
}
