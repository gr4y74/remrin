'use client';

import React, { useState } from 'react';
import { Win95Window } from './Win95Window';
import { Win95Button } from './Win95Button';

interface AwayMessageModalProps {
    onClose: () => void;
    onSave: (message: string) => void;
    initialMessage?: string;
}

export const AwayMessageModal: React.FC<AwayMessageModalProps> = ({
    onClose,
    onSave,
    initialMessage = "I'm away from my computer right now."
}) => {
    const [message, setMessage] = useState(initialMessage);

    const handleSave = () => {
        onSave(message);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[100]">
            <Win95Window
                title="Set Away Message"
                className="w-[350px]"
                onClose={onClose}
                icon="/icons/win95/accessibility-window-abc.png"
            >
                <div className="p-4 flex flex-col gap-4">
                    <div className="text-[11px]">
                        Enter the message you want people to see when you are away:
                    </div>

                    <textarea
                        className="w-full h-24 bg-white border-2 border-[inset] border-[#808080] p-2 font-['Courier_New',_monospace] text-[12px] outline-none resize-none"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        autoFocus
                    />

                    <div className="flex justify-end gap-2">
                        <Win95Button onClick={handleSave} className="px-6 font-bold">
                            OK
                        </Win95Button>
                        <Win95Button onClick={onClose} className="px-4">
                            Cancel
                        </Win95Button>
                    </div>
                </div>
            </Win95Window>
        </div>
    );
};
