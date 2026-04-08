import { Toaster } from "@/components/ui/sonner"
import { GlobalState } from "@/components/utility/global-state"
import { Providers } from "@/components/utility/providers"
import TranslationsProvider from "@/components/utility/translations-provider"
import { RootLayoutContainer } from "@/components/layout/RootLayoutContainer"
import initTranslations from "@/lib/i18n"
import { Database } from "@/supabase/types"
import { createServerClient } from "@supabase/ssr"
import { Metadata, Viewport } from "next"
// import { Inter } from "next/font/google"
import { cookies } from "next/headers"
import { ReactNode } from "react"
import "../styles/retro-base.css"

// Force Node.js runtime to avoid Edge Runtime __dirname issues
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// const inter = Inter({ subsets: ["latin"] })
const APP_NAME = "Remrin.ai"
const APP_DEFAULT_TITLE = "Remrin.ai - Your Soulbound AI Companion"
const APP_TITLE_TEMPLATE = "%s | Remrin.ai"
const APP_DESCRIPTION = "Forge deep connections with unique AI souls. Create, summon, and chat with evolving personas in an immersive, collaborative universe."

interface RootLayoutProps {
  children: ReactNode
  params: {
    locale: string
  }
}

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: APP_DEFAULT_TITLE
    // startUpImage: [],
  },
  other: {
    "mobile-web-app-capable": "yes"
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE
    },
    description: APP_DESCRIPTION
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE
    },
    description: APP_DESCRIPTION
  }
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

const i18nNamespaces = ["translation"]

export default async function RootLayout({
  children,
  params: { locale }
}: RootLayoutProps) {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )
  const session = (await supabase.auth.getSession()).data.session
  console.log(`🏠 [RootLayout] SESSION: ${!!session}, USER: ${session?.user?.id}`)

  const { t, resources } = await initTranslations(locale, i18nNamespaces)

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://cdn.jsdelivr.net/gh/Lukas-W/font-logos@v0.18/assets/font-logos.css" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="theme-default">
        {/* SACRED ORANGE HEADER */}
        <div id="header" style={{ background: 'var(--accent)', color: 'var(--bg)', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '16px', fontWeight: 'bold' }}>
           <a href="/" style={{ color: 'var(--bg)', textDecoration: 'none', fontSize: '16px', letterSpacing: '1px' }}>🦤 sudo dodo <span style={{ opacity: 0.7, fontSize: '13px' }}>/ sudodo.do</span></a>
           <nav style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
              <a href="/en/sudodo/feed" style={{ color: 'var(--bg)' }}>feed</a>
              <a href="/en/sudodo/rankings" style={{ color: 'var(--bg)' }}>rankings</a>
              <a href="/en/sudodo/compare" style={{ color: 'var(--bg)' }}>battle</a>
              <a href="/en/sudodo/wizard" style={{ color: 'var(--bg)' }}>wizard</a>
           </nav>
           <div style={{ marginLeft: 'auto', fontSize: '12px' }}>
              {session?.user ? (
                <>logged in as: {session.user.user_metadata?.username || session.user.email} | <a href="/auth/logout" style={{ color: 'var(--bg)' }}>logout</a></>
              ) : (
                <><a href="/auth/login" style={{ color: 'var(--bg)' }}>login</a> | <a href="/auth/signup" style={{ color: 'var(--bg)' }}>create account</a></>
              )}
           </div>
        </div>

        {/* THEME CONFIG BAR */}
        <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '4px 16px', fontSize: '11px', display: 'flex', gap: '8px', alignItems: 'center' }}>
           <span style={{ color: 'var(--fg3)' }}>theme:</span>
           <button onClick={() => document.body.className = ''} style={{ fontSize: '10px', padding: '1px 6px' }}>default</button>
           <button onClick={() => document.body.className = 'theme-matrix'} style={{ fontSize: '10px', padding: '1px 6px' }}>matrix</button>
           <button onClick={() => document.body.className = 'theme-amber'} style={{ fontSize: '10px', padding: '1px 6px' }}>amber</button>
           <button onClick={() => document.body.className = 'theme-phosphor'} style={{ fontSize: '10px', padding: '1px 6px' }}>phosphor</button>
           <button onClick={() => document.body.className = 'theme-c64'} style={{ fontSize: '10px', padding: '1px 6px' }}>c64</button>
           <button onClick={() => document.body.className = 'theme-paper'} style={{ fontSize: '10px', padding: '1px 6px' }}>paper</button>
        </div>

        <main className="retro-container">
           {children}
        </main>
        
        <Toaster richColors position="top-center" duration={3000} />
      </body>
    </html>
  )
}
