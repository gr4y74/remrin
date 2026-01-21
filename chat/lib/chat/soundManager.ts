export class ChatSoundManager {
    private sounds: Map<string, HTMLAudioElement> = new Map();
    private enabled: boolean = true;
    private volume: number = 0.5;

    private soundFiles = {
        buddyOnline: '/sounds/chat/buddy-online.mp3',
        buddyOffline: '/sounds/chat/buddy-offline.mp3',
        imReceive: '/sounds/chat/im-receive.mp3',
        imSend: '/sounds/chat/im-send.mp3',
        roomEnter: '/sounds/chat/room-enter.mp3',
        roomLeave: '/sounds/chat/room-leave.mp3',
        error: '/sounds/chat/error.mp3'
    };

    constructor() {
        if (typeof window !== 'undefined') {
            this.preloadSounds();
            this.loadSettings();
        }
    }

    private preloadSounds() {
        Object.entries(this.soundFiles).forEach(([key, url]) => {
            const audio = new Audio(url);
            audio.preload = 'auto'; // Load metadata and data
            this.sounds.set(key, audio);
        });
    }

    private loadSettings() {
        try {
            const savedSettings = localStorage.getItem('chat_sound_settings');
            if (savedSettings) {
                const { enabled, volume } = JSON.parse(savedSettings);
                this.enabled = enabled;
                this.setVolume(volume);
            }
        } catch (e) {
            console.error('Failed to load sound settings', e);
        }
    }

    public play(sound: keyof typeof this.soundFiles): void {
        if (!this.enabled || !this.sounds.has(sound)) return;

        const audio = this.sounds.get(sound);
        if (audio) {
            audio.currentTime = 0;
            audio.volume = this.volume;
            audio.play().catch(e => {
                // Audio play can fail if user hasn't interacted with document
                console.warn('Failed to play sound:', sound, e);
            });
        }
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        this.saveSettings();
    }

    public setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    public getSettings() {
        return { enabled: this.enabled, volume: this.volume };
    }

    private saveSettings() {
        if (typeof window !== 'undefined') {
            localStorage.setItem('chat_sound_settings', JSON.stringify({
                enabled: this.enabled,
                volume: this.volume
            }));
        }
    }
}

export const chatSounds = new ChatSoundManager();
