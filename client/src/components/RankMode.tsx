import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Item } from '../types';
import ItemCard from './ItemCard';

export default function RankMode() {
    // Phase 1: Selection - Pick an item to rank
    // Phase 2: Ordering - Binary search comparison
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [targetItem, setTargetItem] = useState<Item | null>(null);

    // Binary Search State
    const [comparisonItem, setComparisonItem] = useState<Item | null>(null);
    const [minIdx, setMinIdx] = useState(0);
    const [maxIdx, setMaxIdx] = useState(0);
    const [sortedItems, setSortedItems] = useState<Item[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const items = await api.getAllItems();
            // Assuming 0.0 is unranked or we just allow re-ranking everything.
            // For now, let's say we pull out items that we want to "Insert" into the list.
            // But simplification: Just show all items list, click "Rank This", then do the logic.
            setAllItems(items);
            // Sort by rankOrder DESC
            // const sorted = [...items].sort((a, b) => (b.rankOrder || 0) - (a.rankOrder || 0));
            // setItems(sorted); // Initial view might just be list?
        } finally {
            setLoading(false);
        }
    };

    const startRanking = (item: Item) => {
        setTargetItem(item);
        // exclude target from the sorted list we compare against
        const others = allItems.filter(i => i.id !== item.id)
            .sort((a, b) => (b.rankOrder || 0) - (a.rankOrder || 0));

        setSortedItems(others);
        setMinIdx(0);
        setMaxIdx(others.length);

        // If no others, we are #1
        if (others.length === 0) {
            finishRanking(item, 100);
            return;
        }

        // Setup first comparison
        const mid = Math.floor(others.length / 2);
        setComparisonItem(others[mid]);
    };

    // "I prefer Target over Comparison" -> Target is BETTER -> Goes closer to index 0 (if 0 is top)
    // Wait, array is sorted DESC (0 is best/highest score).
    // If Target > Comparison, Target belongs at lower index (closer to 0).
    // so max = mid.
    // If Target < Comparison, Target belongs at higher index (further from 0).
    // so min = mid + 1.
    const handleChoice = (preferTarget: boolean) => {
        if (!targetItem || !comparisonItem) return;

        let newMin = minIdx;
        let newMax = maxIdx;

        if (preferTarget) {
            // Target is better than comparison item (which is at mid)
            // It belongs in [min, mid]
            newMax = Math.floor((minIdx + maxIdx) / 2);
        } else {
            // Target is worse
            // It belongs in [mid + 1, max]
            newMin = Math.floor((minIdx + maxIdx) / 2) + 1;
        }

        if (newMin >= newMax) {
            // Found split point at newMin
            // Insert at newMin
            calculateAndSaveRank(newMin);
        } else {
            setMinIdx(newMin);
            setMaxIdx(newMax);
            const mid = Math.floor((newMin + newMax) / 2);
            setComparisonItem(sortedItems[mid]);
        }
    };

    const calculateAndSaveRank = async (insertIndex: number) => {
        if (!targetItem) return;

        // sortedItems is DESC.
        // Insert at index `insertIndex`.
        // If index 0: > sortedItems[0].rankOrder.
        // If index N: < sortedItems[N-1].rankOrder.
        // If middle: between [index-1] and [index].

        let newRank = 0;
        if (sortedItems.length === 0) {
            newRank = 1000; // First item seed
        } else if (insertIndex === 0) {
            // Top of list
            // Add buffer of 100
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

        try {
            await api.updateItemRank(targetItem.id, newRank);
            // Refresh
            setTargetItem(null);
            setComparisonItem(null);
            fetchItems();
        } catch (e) {
            console.error(e);
            alert("Failed to save rank");
        }
    };

    const finishRanking = async (item: Item, rank: number) => {
        try {
            await api.updateItemRank(item.id, rank);
            setTargetItem(null);
            fetchItems();
        } catch (e) {
            console.error(e);
            alert("Failed to save rank");
        }
    }

    if (loading) return <div className="p-8 text-center text-white">Loading...</div>;

    // View: Compare
    if (targetItem && comparisonItem) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold text-white mb-8 text-center">Which is better?</h2>
                <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
                    <div className="flex-1 max-w-md">
                        <div className="text-center mb-2 text-blue-400 font-bold">Ranking This Item</div>
                        <div
                            onClick={() => handleChoice(true)}
                            className="h-full border-4 border-blue-500 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                        >
                            <ItemCard item={targetItem} onClick={() => handleChoice(true)} />
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="bg-gray-700 rounded-full p-4 text-xl font-bold text-white">VS</div>
                    </div>
                    <div className="flex-1 max-w-md">
                        <div className="text-center mb-2 text-gray-500 font-medium">Existing Item</div>
                        <div
                            onClick={() => handleChoice(false)}
                            className="h-full border-2 border-gray-600 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                        >
                            <ItemCard item={comparisonItem} onClick={() => handleChoice(false)} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // View: Select Item to Rank
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-white mb-2">Rank Items</h1>
            <p className="text-gray-400 mb-8">Select an item to place it in the ranked list.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allItems.map(item => (
                    <div key={item.id} className="relative group">
                        <ItemCard item={item} />
                        <button
                            onClick={() => startRanking(item)}
                            className="hidden group-hover:flex absolute inset-0 bg-black/60 items-center justify-center text-white font-bold text-sm tracking-wider uppercase rounded-2xl backdrop-blur-sm transition-all"
                        >
                            Rank This
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
