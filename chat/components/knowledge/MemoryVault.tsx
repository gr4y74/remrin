'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Trash2, Loader2, Book, CheckCircle, AlertCircle, Globe, Lock, Shield, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { MemorySharing } from './MemorySharing';
import { createClient } from '@/lib/supabase/client';

interface KnowledgeItem {
    id: string;
    file_name: string;
    file_type: string;
    created_at: string;
    shared_with_all: boolean;
    persona_ids: string[];
}

export const MemoryVault: React.FC = () => {
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragActive, setIsDragActive] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [editingSharingId, setEditingSharingId] = useState<string | null>(null);

    const supabase = createClient();

    const fetchUser = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
    }, [supabase]);

    const fetchItems = useCallback(async () => {
        try {
            const res = await fetch('/api/v2/knowledge');
            if (!res.ok) throw new Error('Failed to fetch items');
            const data = await res.json();
            setItems(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load knowledge vault');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
        fetchItems();
    }, [fetchUser, fetchItems]);

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleUpload(files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            handleUpload(files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        const allowedExtensions = ['pdf', 'txt', 'md', 'json', 'js', 'ts', 'py'];
        const extension = file.name.split('.').pop()?.toLowerCase() || '';

        if (!allowedExtensions.includes(extension)) {
            toast.error(`Unsupported file type: .${extension}`);
            return;
        }

        setUploading(true);
        setUploadProgress(10);

        try {
            const formData = new FormData();
            formData.append('file', file);

            setUploadProgress(30);

            const res = await fetch('/api/v2/knowledge', {
                method: 'POST',
                body: formData,
            });

            setUploadProgress(80);

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Upload failed');
            }

            setUploadProgress(100);
            toast.success('Memory uploaded successfully');
            fetchItems();
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload');
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/v2/knowledge?id=${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Delete failed');

            toast.success('Memory deleted');
            setItems(items.filter(item => item.id !== id));
        } catch (error) {
            toast.error('Failed to delete memory');
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-3">
                <Book className="w-8 h-8 text-blue-500" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Knowledge Vault
                </h1>
            </div>

            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={onDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center gap-4 bg-opacity-5 ${isDragActive
                    ? 'border-blue-500 bg-blue-500/10 scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
            >
                <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileInput}
                    accept=".pdf,.txt,.md,.json,.js,.ts,.py"
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-4 w-full max-w-xs text-center">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                                className="h-full bg-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-white/60 text-sm">Uploading memory... {uploadProgress}%</p>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Upload className={`w-8 h-8 ${isDragActive ? 'text-blue-400' : 'text-blue-500'}`} />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-medium text-white">Drop your memories here</p>
                            <p className="text-white/40 text-sm mt-1">Accepts PDF, TXT, MD, JSON, JS, TS, PY</p>
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-white/80 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Stored Memories
                </h2>

                <div className="grid gap-3">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                        ))
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 border border-white/10 rounded-xl bg-white/5">
                            <p className="text-white/30 italic">No memories stored yet. Upload some files to feed the AI&apos;s mind.</p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {items.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex flex-col p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                {item.file_type === 'pdf' ? 'PDF' : <FileText className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-white">{item.file_name}</p>
                                                    {item.shared_with_all ? (
                                                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                                                    ) : item.persona_ids?.length > 0 ? (
                                                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                                                    ) : (
                                                        <Lock className="w-3.5 h-3.5 text-white/20" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-white/40">
                                                    <span className="uppercase">{item.file_type}</span>
                                                    <span>•</span>
                                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setEditingSharingId(editingSharingId === item.id ? null : item.id)}
                                                className={`p-2 rounded-lg transition-all ${editingSharingId === item.id
                                                    ? 'bg-blue-500/20 text-blue-400'
                                                    : 'hover:bg-white/5 text-white/20 hover:text-white/60'}`}
                                                title="Sharing Settings"
                                            >
                                                <Settings2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Memory"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {editingSharingId === item.id && userId && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <MemorySharing
                                                    memoryId={item.id}
                                                    userId={userId}
                                                    initialSharedWithAll={item.shared_with_all}
                                                    initialPersonaIds={item.persona_ids || []}
                                                    onUpdate={(sharedAll, pIds) => {
                                                        setItems(items.map(i =>
                                                            i.id === item.id
                                                                ? { ...i, shared_with_all: sharedAll, persona_ids: pIds }
                                                                : i
                                                        ));
                                                    }}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};
