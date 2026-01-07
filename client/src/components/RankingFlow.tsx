import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Item } from '../types';


interface RankingFlowProps {
    targetItem: Item;
    onComplete: () => void;
    onCancel: () => void;
}

export default function RankingFlow({ targetItem, onComplete, onCancel }: RankingFlowProps) {
    const [sortedItems, setSortedItems] = useState<Item[]>([]);
    const [comparisonItem, setComparisonItem] = useState<Item | null>(null);
    const [minIdx, setMinIdx] = useState(0);
    const [maxIdx, setMaxIdx] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const itemsInCategory = await api.getItemsByCategory(targetItem.category);
                // Exclude target and sort by rank order (DESC)
                const others = itemsInCategory.filter(i => i.id !== targetItem.id)
                    .sort((a, b) => (b.rankOrder || 0) - (a.rankOrder || 0));

                setSortedItems(others);

                if (others.length === 0) {
                    finishRanking(100);
                    return;
                }

                setMinIdx(0);
                setMaxIdx(others.length);

                // Start binary search at the middle
                const mid = Math.floor(others.length / 2);
                setComparisonItem(others[mid]);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [targetItem.id]);

    const finishRanking = async (rank: number) => {
        try {
            await api.updateItemRank(targetItem.id, rank);
            onComplete();
        } catch (e) {
            console.error(e);
            alert("Failed to save rank");
        }
    };

    const handleChoice = (preferTarget: boolean) => {
        if (!comparisonItem) return;

        let newMin = minIdx;
        let newMax = maxIdx;

        // Current list is sorted High -> Low (Best -> Worst)
        // If Target is BETTER than Comparison (High -> Low):
        // Target belongs to a lower index (closer to 0).
        if (preferTarget) {
            // Target > Comparison
            // Search in left half [min, mid]
            newMax = Math.floor((minIdx + maxIdx) / 2);
        } else {
            // Target < Comparison
            // Search in right half [mid + 1, max]
            newMin = Math.floor((minIdx + maxIdx) / 2) + 1;
        }

        if (newMin >= newMax) {
            calculateAndSaveRank(newMin);
        } else {
            setMinIdx(newMin);
            setMaxIdx(newMax);
            const mid = Math.floor((newMin + newMax) / 2);
            setComparisonItem(sortedItems[mid]);
        }
    };

    const calculateAndSaveRank = async (insertIndex: number) => {
        let newRank = 0;
        if (sortedItems.length === 0) {
            newRank = 1000;
        } else if (insertIndex === 0) {
            // Top of list
            newRank = (sortedItems[0].rankOrder || 0) + 100;
        } else if (insertIndex >= sortedItems.length) {
            // Bottom of list
            newRank = (sortedItems[sortedItems.length - 1].rankOrder || 0) - 100;
        } else {
            // Between two items
            const above = sortedItems[insertIndex - 1].rankOrder || 0;
            const below = sortedItems[insertIndex].rankOrder || 0;
            newRank = (above + below) / 2;
        }
        await finishRanking(newRank);
    };

    // Internal Card Component for consistency and isolation from the list-view ItemCard
    const RankingCard = ({ item, isTarget, onClick }: { item: Item; isTarget: boolean; onClick: () => void }) => (
        <div
            onClick={onClick}
            className={`
                group relative w-72 aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer 
                transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                ${isTarget
                    ? 'ring-4 ring-indigo-500 shadow-2xl shadow-indigo-500/30'
                    : 'ring-1 ring-white/20 hover:ring-white/40 shadow-2xl shadow-black/50'
                }
            `}
        >
            {/* Background Image or Placeholder */}
            <div className="absolute inset-0 bg-gray-800">
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-scale-down group-hover:opacity-100 transition-opacity duration-300" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/10 group-hover:text-white/20 transition-colors">
                        <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Content Labels */}
            <div className="absolute top-4 left-0 w-full px-4 flex justify-between items-start">
                <span className={`
                    text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md
                    ${isTarget ? 'bg-indigo-500/90 text-white' : 'bg-white/10 text-white/70'}
                `}>
                    {isTarget ? 'Rating This' : 'Comparison'}
                </span>


            </div>

            {/* Main Details */}
            <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col items-center text-center">
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight drop-shadow-md">
                    {item.name}
                </h3>
                {item.notes && (
                    <p className="text-sm text-white/60 line-clamp-2 max-w-[90%] font-medium">
                        {item.notes}
                    </p>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
            <button
                onClick={onCancel}
                className="absolute top-6 right-6 text-white/40 hover:text-white font-medium text-sm px-4 py-2 rounded-full hover:bg-white/10 transition-all"
            >
                Skip
            </button>

            {loading ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <div className="text-white/50 font-medium animate-pulse">Finding match...</div>
                </div>
            ) : comparisonItem ? (
                <div className="flex flex-col items-center w-full max-w-5xl">
                    <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 mb-12 tracking-tight">
                        Which is better?
                    </h2>

                    <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center justify-center">
                        {/* Target Item (Left) */}
                        <div className="animate-in slide-in-from-left-8 duration-500 fade-in fill-mode-both delay-100">
                            <RankingCard
                                item={targetItem}
                                isTarget={true}
                                onClick={() => handleChoice(true)}
                            />
                        </div>

                        {/* VS Badge */}
                        <div className="relative z-10 animate-in zoom-in duration-500 delay-300">
                            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20" />
                            <div className="bg-white/5 backdrop-blur-md rounded-full w-16 h-16 flex items-center justify-center text-xl font-black text-white italic shadow-2xl border border-white/10">
                                VS
                            </div>
                        </div>

                        {/* Comparison Item (Right) */}
                        <div className="animate-in slide-in-from-right-8 duration-500 fade-in fill-mode-both delay-200">
                            <RankingCard
                                item={comparisonItem}
                                isTarget={false}
                                onClick={() => handleChoice(false)}
                            />
                        </div>
                    </div>

                    <div className="mt-12 text-white/30 text-sm font-medium tracking-wide uppercase">
                        Select your preference
                    </div>
                </div>
            ) : (
                <div className="text-center animate-in zoom-in duration-300">
                    <div className="text-4xl mb-4">🎉</div>
                    <div className="text-2xl font-bold text-white mb-2">Ranking Complete!</div>
                    <div className="text-white/50">Returning to editor...</div>
                </div>
            )}
        </div>
    );
}
