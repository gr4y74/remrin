'use client';

import { X, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
}

export function QRCodeModal({ isOpen, onClose, username }: QRCodeModalProps) {
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && !qrCodeUrl) {
            fetchQRCode();
        }
    }, [isOpen]);

    const fetchQRCode = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/profile/qr-code?username=${username}&format=png`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setQrCodeUrl(url);
        } catch (error) {
            console.error('Failed to fetch QR code:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!qrCodeUrl) return;

        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = `${username}-profile-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-rp-base rounded-3xl shadow-2xl max-w-md w-full border border-rp-highlight-med overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-rp-highlight-low">
                    <h2 className="text-xl font-bold text-rp-text">Neural Identity QR</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-rp-overlay rounded-full text-rp-subtle hover:text-rp-text transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rp-iris"></div>
                            <p className="text-rp-subtle animate-pulse">Encoding identity...</p>
                        </div>
                    ) : qrCodeUrl ? (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-inner-lg">
                                <Image
                                    src={qrCodeUrl}
                                    alt={`QR Code for ${username}&apos;s profile`}
                                    width={512}
                                    height={512}
                                    className="w-full h-auto"
                                />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-rp-text font-bold">@{username}</p>
                                <p className="text-sm text-rp-subtle">
                                    Scan this code to view @{username}&apos;s profile
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-rp-love py-8 bg-rp-love/10 rounded-xl border border-rp-love/20">
                            Failed to generate Identity QR
                        </div>
                    )}
                </div>

                {/* Footer */}
                {qrCodeUrl && (
                    <div className="p-6 bg-rp-surface border-t border-rp-highlight-low">
                        <button
                            onClick={handleDownload}
                            className="w-full px-6 py-4 bg-rp-iris text-white rounded-2xl hover:opacity-90 transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-rp-iris/20"
                        >
                            <Download className="w-5 h-5" />
                            Secure Download
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
