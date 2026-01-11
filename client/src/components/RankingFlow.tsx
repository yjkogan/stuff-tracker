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
        // Exclude target and unranked items, then sort by rank order (DESC)
        const others = itemsInCategory
          .filter(
            (i) => i.id !== targetItem.id && i.rankOrder !== undefined && i.rankOrder !== null,
          )
          .sort((a, b) => b.rankOrder! - a.rankOrder!);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetItem.id]);

  const finishRanking = async (rank: number) => {
    try {
      await api.updateItemRank(targetItem.id, rank);
      onComplete();
    } catch (e) {
      console.error(e);
      alert('Failed to save rank');
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
  const RankingCard = ({
    item,
    isTarget,
    onClick,
  }: {
    item: Item;
    isTarget: boolean;
    onClick: () => void;
  }) => (
    <button
      type='button'
      onClick={onClick}
      className={`group relative aspect-[3/4] w-72 cursor-pointer overflow-hidden rounded-3xl text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
        isTarget
          ? 'shadow-2xl shadow-indigo-500/30 ring-4 ring-indigo-500'
          : 'shadow-2xl shadow-black/50 ring-1 ring-white/20 hover:ring-white/40'
      } `}
    >
      {/* Background Image or Placeholder */}
      <div className='absolute inset-0 bg-gray-800'>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className='h-full w-full object-scale-down transition-opacity duration-300 group-hover:opacity-100'
          />
        ) : (
          <div className='flex h-full w-full flex-col items-center justify-center text-white/10 transition-colors group-hover:text-white/20'>
            <svg className='h-20 w-20' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1}
                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
          </div>
        )}
        {/* Gradient Overlay */}
        <div className='absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent' />
      </div>

      {/* Content Labels */}
      <div className='absolute left-0 top-4 flex w-full items-start justify-between px-4'>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md ${isTarget ? 'bg-indigo-500/90 text-white' : 'bg-white/10 text-white/70'} `}
        >
          {isTarget ? 'Rating This' : 'Comparison'}
        </span>
      </div>

      {/* Main Details */}
      <div className='absolute inset-x-0 bottom-0 flex flex-col items-center p-6 text-center'>
        <h3 className='mb-2 text-2xl font-bold leading-tight text-white drop-shadow-md'>
          {item.name}
        </h3>
        {item.notes && (
          <p className='line-clamp-2 max-w-[90%] text-sm font-medium text-white/60'>{item.notes}</p>
        )}
      </div>
    </button>
  );

  return (
    <div className='animate-in fade-in fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-xl duration-200'>
      <button
        onClick={onCancel}
        className='absolute right-6 top-6 rounded-full px-4 py-2 text-sm font-medium text-white/40 transition-all hover:bg-white/10 hover:text-white'
      >
        Skip
      </button>

      {loading ? (
        <div className='flex flex-col items-center gap-4'>
          <div className='h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-500' />
          <div className='animate-pulse font-medium text-white/50'>Finding match...</div>
        </div>
      ) : comparisonItem ? (
        <div className='flex w-full max-w-5xl flex-col items-center'>
          <h2 className='mb-12 bg-gradient-to-br from-white to-white/50 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl'>
            Which is better?
          </h2>

          <div className='flex flex-col items-center justify-center gap-8 md:flex-row md:gap-16'>
            {/* Target Item (Left) */}
            <div className='animate-in slide-in-from-left-8 fade-in fill-mode-both delay-100 duration-500'>
              <RankingCard item={targetItem} isTarget={true} onClick={() => handleChoice(true)} />
            </div>

            {/* VS Badge */}
            <div className='animate-in zoom-in relative z-10 delay-300 duration-500'>
              <div className='absolute inset-0 bg-indigo-500 opacity-20 blur-2xl' />
              <div className='flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl font-black italic text-white shadow-2xl backdrop-blur-md'>
                VS
              </div>
            </div>

            {/* Comparison Item (Right) */}
            <div className='animate-in slide-in-from-right-8 fade-in fill-mode-both delay-200 duration-500'>
              <RankingCard
                item={comparisonItem}
                isTarget={false}
                onClick={() => handleChoice(false)}
              />
            </div>
          </div>

          <div className='mt-12 text-sm font-medium uppercase tracking-wide text-white/30'>
            Select your preference
          </div>
        </div>
      ) : (
        <div className='animate-in zoom-in text-center duration-300'>
          <div className='mb-4 text-4xl'>🎉</div>
          <div className='mb-2 text-2xl font-bold text-white'>Ranking Complete!</div>
          <div className='text-white/50'>Returning to editor...</div>
        </div>
      )}
    </div>
  );
}
