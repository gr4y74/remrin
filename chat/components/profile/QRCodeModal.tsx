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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-rose-pine-base rounded-lg shadow-xl max-w-md w-full border border-rose-pine-highlight">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-rose-pine-highlight">
                    <h2 className="text-xl font-bold text-rose-pine-text">Profile QR Code</h2>
                    <button
                        onClick={onClose}
                        className="text-rose-pine-subtle hover:text-rose-pine-text transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-pine-love"></div>
                        </div>
                    ) : qrCodeUrl ? (
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-lg">
                                <Image
                                    src={qrCodeUrl}
                                    alt={`QR Code for ${username}'s profile`}
                                    width={512}
                                    height={512}
                                    className="w-full h-auto"
                                />
                            </div>
                            <p className="text-sm text-rose-pine-subtle text-center">
                                Scan this code to view @{username}'s profile
                            </p>
                        </div>
                    ) : (
                        <div className="text-center text-rose-pine-subtle py-8">
                            Failed to load QR code
                        </div>
                    )}
                </div>

                {/* Footer */}
                {qrCodeUrl && (
                    <div className="p-6 border-t border-rose-pine-highlight">
                        <button
                            onClick={handleDownload}
                            className="w-full px-6 py-3 bg-rose-pine-love text-white rounded hover:bg-rose-pine-love/90 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download QR Code
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
