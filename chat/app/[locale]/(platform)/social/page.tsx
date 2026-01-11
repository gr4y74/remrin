import { Metadata } from 'next';
import { FeedContainer } from '@/components/feed/FeedContainer';

export const metadata: Metadata = {
    title: 'Social Feed | Remrin',
    description: 'Connect and share with the Remrin community.',
};

export default function SocialFeedPage() {
    return (
        <div className="bg-rp-base min-h-screen">
            <header className="sticky top-0 z-20 bg-rp-base/80 backdrop-blur-md border-b border-rp-highlight-low h-16 flex items-center px-6">
                <h1 className="text-2xl font-tiempos-headline font-bold text-rp-text">Remrin Social</h1>
            </header>

            <main className="container max-w-4xl mx-auto py-8">
                <FeedContainer />
            </main>
        </div>
    );
}
