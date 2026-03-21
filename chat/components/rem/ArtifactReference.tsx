import { useChatSolo } from '../chat-solo/ChatSoloEngine'
import { Layout, FileCode, Maximize2 } from 'lucide-react'

interface ArtifactReferenceProps {
    title?: string
    type?: 'code' | 'web' | 'markdown'
    content: string
}

/**
 * In-chat Reference Card for Artifacts
 * Job 5 of Rem Cockpit Upgrade
 */
export const ArtifactReference: React.FC<ArtifactReferenceProps> = ({ 
    title = "Generated Artifact",
    type = "code",
    content
}) => {
    const { viewArtifact } = useChatSolo()

    return (
        <div 
            onClick={() => viewArtifact(content)}
            className="my-6 max-w-sm rounded-[24px] border border-border/60 bg-muted/20 p-5 transition-all hover:bg-muted/30 group/art cursor-pointer shadow-sm hover:shadow-md hover:border-rp-iris/30"
        >
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-[18px] bg-rp-iris/10 flex items-center justify-center border border-rp-iris/20 text-rp-iris group-hover:scale-105 transition-transform duration-300">
                    {type === 'web' ? <Layout className="w-6 h-6" /> : <FileCode className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">{title}</p>
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.15em] font-outfit mt-0.5 opacity-70">
                        {type === 'web' ? 'Web Application' : 'Source Code'}
                    </p>
                </div>
                <div className="p-2 rounded-full bg-muted/40 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform duration-300">
                    <Maximize2 className="w-4 h-4 text-muted-foreground" />
                </div>
            </div>
        </div>
    )
}
