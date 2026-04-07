/**
 * SudoDodo Expert Sources Registry
 * 
 * This registry defines the priority, scraping rules, and categorization
 * for the external websites we are centralizing into SudoDodo.
 */

export interface ExpertSource {
  id: string;
  name: string;
  url: string;
  priority: number; // 1 (Highest) to 10
  category: 'beginner' | 'wiki' | 'admin' | 'community' | 'interactive' | 'news';
  capabilities: ('rag' | 'search' | 'interactive' | 'news')[];
  description: string;
}

export const EXPERT_SOURCES: ExpertSource[] = [
  // 1. Beginner Foundations
  {
    id: 'linux-journey',
    name: 'Linux Journey',
    url: 'https://linuxjourney.com',
    priority: 1,
    category: 'beginner',
    capabilities: ['rag', 'search'],
    description: 'Structured lessons for elementary Linux concepts.'
  },
  {
    id: 'linux-survival',
    name: 'Linux Survival',
    url: 'https://linuxsurvival.com',
    priority: 2,
    category: 'beginner',
    capabilities: ['interactive'],
    description: 'Command line survival guide.'
  },

  // 2. Technical Wikis
  {
    id: 'arch-wiki',
    name: 'Arch Wiki',
    url: 'https://wiki.archlinux.org',
    priority: 1,
    category: 'wiki',
    capabilities: ['rag', 'search'],
    description: 'The definitive repository for advanced Linux configurations.'
  },
  {
    id: 'ldp',
    name: 'Linux Documentation Project',
    url: 'https://tldp.org',
    priority: 3,
    category: 'wiki',
    capabilities: ['rag'],
    description: 'Historical and deep-dive HOWTOs.'
  },

  // 3. Admin & Specialized
  {
    id: 'nixcraft',
    name: 'nixCraft',
    url: 'https://www.cyberciti.biz',
    priority: 2,
    category: 'admin',
    capabilities: ['rag', 'search', 'news'],
    description: 'Expert-level sysadmin tutorials and tips.'
  },
  {
    id: 'it-foss',
    name: 'It\'s FOSS',
    url: 'https://itsfoss.com',
    priority: 2,
    category: 'news',
    capabilities: ['news', 'rag'],
    description: 'Desktop-focused Linux community news and guides.'
  },

  // 4. Community & Q&A
  {
    id: 'stack-exchange-linux',
    name: 'Unix & Linux Stack Exchange',
    url: 'https://unix.stackexchange.com',
    priority: 3,
    category: 'community',
    capabilities: ['search'],
    description: 'Expert technical Q&A.'
  },
  {
    id: 'linux-org',
    name: 'Linux.org',
    url: 'https://linux.org',
    priority: 4,
    category: 'community',
    capabilities: ['search', 'news'],
    description: 'Forums and legacy guides.'
  }
];

export class SourcesManager {
  static getByCategory(category: ExpertSource['category']) {
    return EXPERT_SOURCES.filter(s => s.category === category);
  }

  static getById(id: string) {
    return EXPERT_SOURCES.find(s => s.id === id);
  }
}
