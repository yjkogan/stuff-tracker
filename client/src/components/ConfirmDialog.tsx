import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity'
        onClick={onClose}
        role='button'
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose();
        }}
        aria-label='Close dialog'
      />

      {/* Modal Card */}
      <div className='animate-in fade-in zoom-in-95 relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl duration-200'>
        <div className='p-6'>
          <div className='flex items-start gap-4'>
            <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100'>
              <AlertTriangle className='h-6 w-6 text-red-600' />
            </div>
            <div className='flex-1'>
              <h3 className='mb-2 text-lg font-bold text-gray-900'>{title}</h3>
              <p className='leading-relaxed text-gray-500'>{message}</p>
            </div>
            <button
              onClick={onClose}
              className='p-2 text-gray-400 transition-colors hover:text-gray-500'
            >
              <X className='h-5 w-5' />
            </button>
          </div>
        </div>

        <div className='flex justify-end gap-3 bg-gray-50 px-6 py-4'>
          <button
            onClick={onClose}
            className='rounded-lg px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100'
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className='rounded-lg bg-red-600 px-4 py-2 font-medium text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 active:scale-95'
          >
            Delete Item
          </button>
        </div>
      </div>
    </div>
  );
}
