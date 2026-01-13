'use client';

import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextareaAutosize } from '@/components/ui/textarea-autosize';
import {
    Image as ImageIcon,
    X,
    Globe,
    Lock,
    Users,
    Smile,
    AtSign,
    Sparkles
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { usePost } from '@/hooks/feed/usePost';
import { Post } from '@/types/social';
import { motion, AnimatePresence } from 'framer-motion';
import { EmojiButton } from '@/components/ui/EmojiButton';
import { PickerItem } from '@/components/ui/UniversalPicker';
import { useEmojiInsertion } from '@/hooks/useEmojiInsertion';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (post: Post) => void;
}

const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see this post' },
    { value: 'followers', label: 'Followers', icon: Users, description: 'Only your followers can see this' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you can see this' },
] as const;

export function CreatePostModal({ isOpen, onClose, onSuccess }: CreatePostModalProps) {
    const { createPost, isLoading } = usePost();
    const [content, setContent] = useState('');
    const [visibility, setVisibility] = useState<Post['visibility']>('public');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { insertEmoji } = useEmojiInsertion(textareaRef, content, setContent);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (mediaFiles.length + files.length > 4) {
            alert('Maximum 4 images allowed');
            return;
        }

        const newMediaFiles = [...mediaFiles, ...files];
        setMediaFiles(newMediaFiles);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeMedia = (index: number) => {
        const newFiles = [...mediaFiles];
        newFiles.splice(index, 1);
        setMediaFiles(newFiles);

        const newPreviews = [...previews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setPreviews(newPreviews);
    };

    const handleSubmit = async () => {
        if (!content.trim() && mediaFiles.length === 0) return;

        try {
            const post = await createPost({
                content,
                media_files: mediaFiles,
                visibility,
                post_type: mediaFiles.length > 0 ? 'image' : 'text'
            });
            onSuccess(post);
            handleClose();
        } catch (error) {
            console.error(error);
        }
    };

    const handleClose = () => {
        setContent('');
        setMediaFiles([]);
        setPreviews([]);
        setVisibility('public');
        onClose();
    };

    const handleEmojiSelect = (item: PickerItem) => {
        if (item.type === 'emoji') {
            insertEmoji(item.data);
        } else {
            // GIF or sticker - add as media file
            // For now, we'll just show a toast
            // TODO: Implement actual GIF/sticker as media
            console.log('GIF/Sticker selected:', item);
        }
    };

    const currentVisibility = VISIBILITY_OPTIONS.find(v => v.value === visibility)!;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[550px] bg-rp-surface border-rp-highlight-low p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-rp-highlight-low">
                    <DialogTitle className="text-rp-text flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-rp-gold" />
                        Create New Post
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 space-y-4">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-rp-overlay border border-rp-highlight-low shrink-0" />
                        <div className="flex-1 space-y-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-rp-overlay border-rp-highlight-low text-rp-subtle hover:text-rp-text rounded-full flex gap-1.5 translate-y-1">
                                        <currentVisibility.icon className="w-3 h-3" />
                                        {currentVisibility.label}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-rp-overlay border-rp-highlight-low w-56">
                                    {VISIBILITY_OPTIONS.map((option) => (
                                        <DropdownMenuItem
                                            key={option.value}
                                            onClick={() => setVisibility(option.value)}
                                            className="flex flex-col items-start gap-1 py-2 cursor-pointer focus:bg-rp-highlight-low"
                                        >
                                            <div className="flex items-center gap-2 font-medium text-rp-text">
                                                <option.icon className="w-4 h-4" />
                                                {option.label}
                                            </div>
                                            <span className="text-[10px] text-rp-muted leading-tight">{option.description}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <TextareaAutosize
                                textareaRef={textareaRef}
                                value={content}
                                onValueChange={(val) => setContent(val)}
                                placeholder="What's on your mind? Capture a soul moment..."
                                className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 text-rp-text placeholder:text-rp-muted resize-none text-lg leading-relaxed pt-2"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Character counter & Tags */}
                    <div className="flex justify-end pr-4">
                        <span className={`text-xs ${content.length > 9000 ? 'text-rp-love' : 'text-rp-muted'}`}>
                            {content.length}/10,000
                        </span>
                    </div>

                    {/* Media Previews */}
                    <AnimatePresence>
                        {previews.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`grid gap-2 min-h-[100px] ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                                    }`}
                            >
                                {previews.map((url, i) => (
                                    <div key={url} className="relative aspect-video rounded-xl overflow-hidden group border border-rp-highlight-low">
                                        <Image src={url} alt="Preview" fill className="object-cover" />
                                        <button
                                            onClick={() => removeMedia(i)}
                                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Tools */}
                <div className="p-3 bg-rp-overlay/30 border-t border-rp-highlight-low flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-rp-rose hover:bg-rp-rose/10 rounded-full"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={mediaFiles.length >= 4}
                        >
                            <ImageIcon className="w-5 h-5" />
                        </Button>
                        <EmojiButton
                            onSelect={handleEmojiSelect}
                            position="top"
                            theme="dark"
                            className="text-rp-gold hover:bg-rp-gold/10 rounded-full"
                        />
                        <Button variant="ghost" size="icon" className="text-rp-foam hover:bg-rp-foam/10 rounded-full">
                            <AtSign className="w-5 h-5" />
                        </Button>
                    </div>

                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />

                    <Button
                        onClick={handleSubmit}
                        disabled={(!content.trim() && mediaFiles.length === 0) || isLoading}
                        className="bg-rp-rose hover:bg-rp-rose/90 text-white rounded-full px-6 font-bold shadow-lg shadow-rp-rose/20 h-10 min-w-[80px]"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Post'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
