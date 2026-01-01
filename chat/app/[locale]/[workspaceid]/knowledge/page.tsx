import { MemoryVault } from '@/components/knowledge/MemoryVault';

export default function KnowledgeVaultPage() {
    return (
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <MemoryVault />
            </div>
        </div>
    );
}
