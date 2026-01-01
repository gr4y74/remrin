import { Badge } from '@/components/ui/badge'

interface TierBadgeProps {
    tier: 'wanderer' | 'soul_weaver' | 'architect' | 'titan'
    size?: 'sm' | 'md' | 'lg'
    showIcon?: boolean
}

const tierConfig = {
    wanderer: {
        label: 'Wanderer',
        color: 'bg-gray-500 text-white',
        icon: '🌙'
    },
    soul_weaver: {
        label: 'Soul Weaver',
        color: 'bg-blue-500 text-white',
        icon: '✨'
    },
    architect: {
        label: 'Architect',
        color: 'bg-purple-500 text-white',
        icon: '👑'
    },
    titan: {
        label: 'Titan',
        color: 'bg-amber-500 text-white',
        icon: '⚡'
    }
}

export function TierBadge({ tier, size = 'md', showIcon = true }: TierBadgeProps) {
    const config = tierConfig[tier]

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5'
    }

    return (
        <Badge className={`${config.color} ${sizeClasses[size]} font-medium`}>
            {showIcon && <span className="mr-1">{config.icon}</span>}
            {config.label}
        </Badge>
    )
}
