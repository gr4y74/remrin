export const BREAKPOINTS = {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
    wide: 1440,
} as const

export const SIDEBAR = {
    collapsed: 64,
    expanded: 240,
} as const

export const SPACING = {
    page: {
        mobile: 'px-4 py-6',
        desktop: 'px-8 py-8',
    },
    card: {
        small: 'p-3',
        medium: 'p-4',
        large: 'p-6',
    },
    section: {
        tight: 'mt-4',
        normal: 'mt-6',
        loose: 'mt-8',
        extraLoose: 'mt-12',
    },
} as const

export const TYPOGRAPHY = {
    heading: {
        h1: 'font-tiempos-headline text-4xl md:text-5xl lg:text-6xl font-bold',
        h2: 'font-tiempos-headline text-2xl md:text-3xl lg:text-4xl font-bold',
        h3: 'font-tiempos-headline text-xl md:text-2xl font-semibold',
        h4: 'font-tiempos-headline text-lg md:text-xl font-semibold',
    },
    body: {
        large: 'font-tiempos-text text-lg',
        normal: 'font-tiempos-text text-base',
        small: 'font-tiempos-text text-sm',
        tiny: 'font-tiempos-fine text-xs',
    },
} as const

export const CARD = {
    base: 'bg-rp-surface border-rp-muted/20 rounded-2xl border transition-all',
    hover: 'hover:border-rp-iris/50 hover:shadow-lg hover:shadow-rp-iris/10',
    interactive: 'cursor-pointer active:scale-[0.98]',
} as const

export const BUTTON = {
    base: 'rounded-full font-medium transition-all duration-200',
    hover: 'hover:scale-105 active:scale-95',
} as const
