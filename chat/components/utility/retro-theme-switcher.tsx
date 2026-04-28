"use client"

import React from "react"

export function RetroThemeSwitcher() {
  const setTheme = (theme: string) => {
    const root = document.querySelector('.sudodo-root')
    if (root) {
      // Remove all theme-* classes
      root.className = root.className.replace(/\btheme-\S+/g, '').trim()
      if (theme) {
        root.classList.add(theme)
      }
    }
  }

  return (
    <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '4px 16px', fontSize: '11px', display: 'flex', gap: '8px', alignItems: 'center' }}>
       <span style={{ color: 'var(--fg3)' }}>theme:</span>
       <button onClick={() => setTheme('')} style={{ fontSize: '10px', padding: '1px 6px' }}>default</button>
       <button onClick={() => setTheme('theme-matrix')} style={{ fontSize: '10px', padding: '1px 6px' }}>matrix</button>
       <button onClick={() => setTheme('theme-amber')} style={{ fontSize: '10px', padding: '1px 6px' }}>amber</button>
       <button onClick={() => setTheme('theme-phosphor')} style={{ fontSize: '10px', padding: '1px 6px' }}>phosphor</button>
       <button onClick={() => setTheme('theme-c64')} style={{ fontSize: '10px', padding: '1px 6px' }}>c64</button>
       <button onClick={() => setTheme('theme-paper')} style={{ fontSize: '10px', padding: '1px 6px' }}>paper</button>
    </div>
  )
}
