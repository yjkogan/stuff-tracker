import { useRef, useState, useEffect } from 'react';

interface ImageUploadProps {
    value: File | null;
    onChange: (file: File | null) => void;
    currentImageUrl?: string | null;
    onClear?: () => void;
}

export function ImageUpload({ value, onChange, currentImageUrl, onClear }: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (value) {
            const url = URL.createObjectURL(value);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreview(null);
        }
    }, [value]);

    const hasImage = !!value || !!currentImageUrl;
    const displayUrl = value ? preview : currentImageUrl;

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (value) {
            onChange(null);
        } else if (onClear) {
            onClear();
        }
    };

    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Image</label>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    onChange(file);
                }}
            />

            {hasImage && displayUrl ? (
                <div className="relative w-full h-64 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden group">
                    <img
                        src={displayUrl}
                        alt="Item preview"
                        className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="bg-white/90 text-gray-700 p-2 rounded-full shadow-sm hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                    <span className="text-sm text-gray-500">Click to upload image</span>
                </div>
            )}
        </div>
    );
}
