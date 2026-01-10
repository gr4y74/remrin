'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Loader2, X, Check, Image as ImageIcon } from 'lucide-react';

interface EditableImageProps {
    value: string | null;
    onSave: (file: File) => Promise<string>; // Returns the new image URL
    label?: string;
    disabled?: boolean;
    className?: string;
    aspectRatio?: 'square' | 'banner'; // square for avatar, banner for cover
    maxSizeMB?: number;
}

export function EditableImage({
    value,
    onSave,
    label,
    disabled = false,
    className = '',
    aspectRatio = 'square',
    maxSizeMB = 5,
}: EditableImageProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const validateFile = (file: File): string | null => {
        // Check file type
        if (!file.type.startsWith('image/')) {
            return 'Please select an image file';
        }

        // Check file size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            return `File size must be less than ${maxSizeMB}MB`;
        }

        return null;
    };

    const handleFileSelect = useCallback((file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
            setIsEditing(true);
        };
        reader.readAsDataURL(file);
    }, [maxSizeMB]);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleSave = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            // Simulate progress (in real implementation, you'd track actual upload progress)
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => Math.min(prev + 10, 90));
            }, 100);

            const newImageUrl = await onSave(selectedFile);

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Reset state
            setTimeout(() => {
                setIsEditing(false);
                setPreview(null);
                setSelectedFile(null);
                setUploadProgress(0);
            }, 500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setPreview(null);
        setSelectedFile(null);
        setError(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        if (!disabled && !isEditing) {
            fileInputRef.current?.click();
        }
    };

    const containerClasses = aspectRatio === 'square'
        ? 'aspect-square w-32 h-32 rounded-full'
        : 'aspect-[3/1] w-full max-w-2xl rounded-lg';

    if (!isEditing) {
        return (
            <div className={`group ${className}`}>
                {label && (
                    <label className="block text-sm font-medium text-rp-subtle mb-2">
                        {label}
                    </label>
                )}
                <div
                    onClick={handleClick}
                    className={`
                        ${containerClasses}
                        relative cursor-pointer overflow-hidden
                        border-2 border-dashed border-rp-subtle/30
                        hover:border-rp-iris transition-all duration-200
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleClick();
                        }
                    }}
                    aria-label={`Upload ${label || 'image'}`}
                >
                    {value ? (
                        <>
                            <img
                                src={value}
                                alt={label || 'Profile image'}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
                                          transition-opacity flex items-center justify-center">
                                <Upload className="w-8 h-8 text-white" />
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full bg-rp-overlay flex flex-col items-center justify-center gap-2">
                            <ImageIcon className="w-8 h-8 text-rp-subtle" />
                            <span className="text-sm text-rp-subtle">Click to upload</span>
                        </div>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={disabled}
                />
            </div>
        );
    }

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-rp-subtle mb-2">
                    {label}
                </label>
            )}
            <div className="space-y-4">
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        ${containerClasses}
                        relative overflow-hidden
                        border-2 border-dashed
                        ${isDragging ? 'border-rp-iris bg-rp-iris/10' : 'border-rp-subtle/30'}
                        transition-all duration-200
                    `}
                >
                    {preview ? (
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-rp-overlay flex flex-col items-center justify-center gap-2">
                            <Upload className="w-8 h-8 text-rp-subtle" />
                            <span className="text-sm text-rp-subtle">Drop image here</span>
                        </div>
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-8 h-8 text-rp-iris animate-spin" />
                            <div className="w-3/4 bg-rp-base rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-rp-iris transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <span className="text-sm text-white">{uploadProgress}%</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="text-sm text-rp-love" role="alert">
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={!selectedFile || isUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-rp-iris text-white rounded-lg
                                 hover:bg-rp-iris/80 transition-colors disabled:opacity-50 
                                 disabled:cursor-not-allowed"
                    >
                        <Check className="w-4 h-4" />
                        <span>Save Image</span>
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-rp-overlay text-rp-text rounded-lg
                                 hover:bg-rp-overlay/80 transition-colors disabled:opacity-50 
                                 disabled:cursor-not-allowed"
                    >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                    </button>
                </div>

                <div className="text-xs text-rp-subtle">
                    Supported formats: JPG, PNG, GIF. Max size: {maxSizeMB}MB
                </div>
            </div>
        </div>
    );
}
