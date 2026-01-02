"use client"

import { useState } from "react"
import { IconSearch, IconFileText, IconExternalLink } from "@tabler/icons-react"

interface DocFile {
    name: string
    path: string
}

export function DocsLibrary({ files }: { files: DocFile[] }) {
    const [search, setSearch] = useState("")

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="relative">
                <IconSearch className="text-rp-muted absolute left-4 top-1/2 -translate-y-1/2" size={18} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search documentation library..."
                    className="bg-rp-surface border-rp-muted/20 text-rp-text placeholder:text-rp-muted focus:border-rp-iris w-full rounded-xl border py-4 pl-12 pr-4 transition-all focus:outline-none focus:ring-2 focus:ring-rp-iris/20"
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFiles.map((file) => (
                    <div key={file.path} className="group bg-rp-surface border-rp-muted/20 relative flex flex-col rounded-2xl border p-5 transition-all hover:bg-rp-overlay">
                        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-rp-base">
                            <IconFileText size={24} className="group-hover:text-rp-foam text-rp-subtle transition-colors" />
                        </div>
                        <h4 className="text-rp-text mb-1 font-bold leading-tight truncate-2-lines">{file.name}</h4>
                        <p className="text-rp-muted text-[10px] font-mono mb-4">{file.path.split('/').pop()}</p>

                        <a
                            href={`#`}
                            onClick={(e) => e.preventDefault()}
                            className="text-rp-iris mt-auto flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
                        >
                            <IconExternalLink size={14} />
                            Open Walkthrough
                        </a>
                    </div>
                ))}
            </div>
        </div>
    )
}
