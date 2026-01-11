'use client';

import { IconBrandTwitter, IconBrandGithub, IconBrandLinkedin, IconBrandDiscord, IconBrandYoutube, IconBrandTwitch, IconBrandInstagram, IconWorld } from '@tabler/icons-react';

interface SocialLink {
    id: string;
    platform: string;
    handle?: string;
    url: string;
}

interface SocialLinksDisplayProps {
    links: SocialLink[];
}

const PLATFORM_ICONS: Record<string, any> = {
    twitter: IconBrandTwitter,
    github: IconBrandGithub,
    linkedin: IconBrandLinkedin,
    discord: IconBrandDiscord,
    youtube: IconBrandYoutube,
    twitch: IconBrandTwitch,
    instagram: IconBrandInstagram,
    website: IconWorld,
};

export function SocialLinksDisplay({ links }: SocialLinksDisplayProps) {
    if (!links || links.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {links.map((link) => {
                const Icon = PLATFORM_ICONS[link.platform] || IconWorld;

                return (
                    <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rp-highlight-med bg-rp-surface text-rp-text hover:border-rp-love hover:text-rp-love transition-colors text-sm"
                        title={link.handle || link.platform}
                    >
                        <Icon className="w-4 h-4" />
                        {link.handle && <span>{link.handle}</span>}
                    </a>
                );
            })}
        </div>
    );
}
