import { useRef, useState, useEffect } from 'react';

interface ImageUploadProps {
    value: File | null;
    onChange: (file: File | null) => void;
    currentImageUrl?: string | null;
    onClear?: () => void;
}

export function ImageUpload({ value, onChange, currentImageUrl, onClear }: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [preview, setPreview] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        if (value) {
            const url = URL.createObjectURL(value);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreview(null);
        }
    }, [value]);

    // Cleanup stream on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

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

    const startCamera = async () => {
        try {
            setCameraError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            setIsCameraOpen(true);
            // Wait for state update and ref
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            }, 0);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setCameraError("Could not access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
        setCameraError(null);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
                        onChange(file);
                        stopCamera();
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    // If camera is open, show camera UI
    if (isCameraOpen) {
        return (
            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Take Photo</label>
                <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                        <button
                            type="button"
                            onClick={stopCamera}
                            className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={capturePhoto}
                            className="bg-white text-black p-3 rounded-full hover:bg-gray-200 transition-colors shadow-lg"
                            title="Take Photo"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 gap-3 bg-gray-50/50 hover:bg-gray-50">
                    {cameraError ? (
                        <div className="text-red-500 text-sm text-center mb-2">{cameraError}</div>
                    ) : null}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-blue-400 transition-colors text-sm font-medium text-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                            Upload File
                        </button>
                        <span className="text-gray-400 self-center text-sm">or</span>
                        <button
                            type="button"
                            onClick={startCamera}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-blue-400 transition-colors text-sm font-medium text-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                            Take Photo
                        </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Supports drag and drop</div>
                </div>
            )}
        </div>
    );
}
