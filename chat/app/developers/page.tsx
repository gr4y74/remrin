import SandboxGenerator from '@/components/developers/SandboxGenerator'

export default function DevelopersPage() {
    return (
        <div className="min-h-screen bg-[#191724] text-[#e0def4] selection:bg-[#403d52]">
            {/* GRID BACKGROUND */}
            <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e0def4 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 space-y-32">
                
                {/* HERO SECTION */}
                <header className="text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#31748f]/10 border border-[#31748f]/20 text-[#31748f] text-xs font-bold tracking-widest uppercase">
                        <span className="w-2 h-2 rounded-full bg-[#31748f] animate-pulse"></span>
                        V1 Public Beta
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white">
                            The Headless AI<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9ccfd8] via-[#c4a7e7] to-[#ebbcba]">
                                Relationship Engine
                            </span>
                        </h1>
                        <p className="text-xl text-[#908caa] max-w-2xl mx-auto leading-relaxed">
                            Multi-tenant. Semantic Memory. Built for Production. Integrate deep, persistent AI relationships into any application with a single API.
                        </p>
                    </div>
                </header>

                {/* SANDBOX SECTION */}
                <section id="sandbox" className="space-y-12">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-white">Developer Sandbox</h2>
                        <p className="text-[#908caa]">Get a real API key and start experimenting instantly.</p>
                    </div>
                    <SandboxGenerator />
                </section>

                {/* FEATURES GRID */}
                <section className="grid md:grid-rows-1 md:grid-cols-3 gap-8">
                    <div className="bg-[#1f1d2e] border border-[#403d52] p-8 rounded-2xl space-y-4 group hover:border-[#9ccfd8] transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-[#9ccfd8]/10 flex items-center justify-center text-[#9ccfd8] text-2xl group-hover:scale-110 transition-transform">🧠</div>
                        <h3 className="text-xl font-bold text-white">Infinite Memory</h3>
                        <p className="text-[#908caa] text-sm leading-relaxed">
                            Native vector search (RAG) integrated into every persona. Locket objects ensure your AI never forgets a detail across sessions.
                        </p>
                    </div>
                    <div className="bg-[#1f1d2e] border border-[#403d52] p-8 rounded-2xl space-y-4 group hover:border-[#c4a7e7] transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-[#c4a7e7]/10 flex items-center justify-center text-[#c4a7e7] text-2xl group-hover:scale-110 transition-transform">🏘️</div>
                        <h3 className="text-xl font-bold text-white">Tenant Isolation</h3>
                        <p className="text-[#908caa] text-sm leading-relaxed">
                            Strict RLS-backed isolation for B2B licensees. Manage thousands of users and personas under a single organization.
                        </p>
                    </div>
                    <div className="bg-[#1f1d2e] border border-[#403d52] p-8 rounded-2xl space-y-4 group hover:border-[#ebbcba] transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-[#ebbcba]/10 flex items-center justify-center text-[#ebbcba] text-2xl group-hover:scale-110 transition-transform">📊</div>
                        <h3 className="text-xl font-bold text-white">Relational Graph</h3>
                        <p className="text-[#908caa] text-sm leading-relaxed">
                            Enable cross-persona memory sharing with permissioned safety broadcasts. The &quot;Peanut Allergy Model&quot; for your data.
                        </p>
                    </div>
                </section>

                {/* QUICK START */}
                <section className="space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-white">Quick Start</h2>
                        <p className="text-[#908caa]">Hit the ground running with a simple cURL request.</p>
                    </div>
                    <div className="bg-[#1f1d2e] border border-[#403d52] rounded-2xl overflow-hidden">
                        <div className="bg-[#26233a] px-4 py-2 border-bottom border-[#403d52] flex items-center justify-between">
                            <span className="text-xs font-mono text-[#908caa]">bash — curl</span>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#eb6f92]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#f6c177]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#9ccfd8]"></div>
                            </div>
                        </div>
                        <div className="p-6 overflow-x-auto">
                            <pre className="text-sm font-mono text-[#e0def4]">
                                <code>
{`curl -X POST https://remrin.ai/api/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "personaId": "YOUR_PERSONA_ID",
    "messages": [
      { "role": "user", "content": "Hello, Rem!" }
    ]
  }'`}
                                </code>
                            </pre>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="pt-24 border-t border-[#403d52] text-center">
                    <p className="text-[#908caa] text-sm italic">
                        &quot;Because every machine needs a soul, and every soul needs a friend.&quot;
                    </p>
                </footer>
            </div>
        </div>
    )
}
