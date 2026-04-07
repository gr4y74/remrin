/**
 * SudoDodo Distro Intelligence Utility
 * 
 * Provides logic for hardware-distro matching and compatibility checks.
 */

export interface SystemProfile {
  cpu?: string;
  gpu?: string;
  ram?: number;
  model?: string; // e.g. "ThinkPad X1 Carbon Gen 6"
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
}

export interface CompatibilityReport {
  distroId: string;
  distroName: string;
  score: number; // 0-100
  notes: string[];
  status: 'perfect' | 'functional' | 'problematic' | 'unknown';
}

export class DistroIntelligence {
  /**
   * Check compatibility for a specific hardware model.
   * This will eventually query the Supabase Matrix, but starting with known hardcoded profiles.
   */
  static async checkHardwareCompatibility(profile: SystemProfile): Promise<CompatibilityReport[]> {
    const results: CompatibilityReport[] = [];
    
    // Prototype logic for ThinkPad X1 Carbon
    if (profile.model?.toLowerCase().includes('thinkpad x1 carbon')) {
      results.push({
        distroId: 'popos',
        distroName: 'Pop!_OS',
        score: 98,
        notes: [
          'Excellent CPU power management support.',
          'NVIDIA drivers (if applicable) are pre-baked.',
          'Touchpad/Trackpoint works out of the box.'
        ],
        status: 'perfect'
      });
      
      results.push({
        distroId: 'fedora',
        distroName: 'Fedora Workstation',
        score: 95,
        notes: [
          'Strong kernel support for latest ThinkPad firmware.',
          'GNOME gesture support matches Windows Precision drivers.'
        ],
        status: 'perfect'
      });

      results.push({
        distroId: 'arch',
        distroName: 'Arch Linux',
        score: 85,
        notes: [
          'Requires manual wifi card configuration in some Gen 6 batches.',
          'Wiki has dedicated page for this model.'
        ],
        status: 'functional'
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Get latest rankings based on our multi-source engine.
   */
  static async getLiveRankings() {
    // This will pull from sudododo_distro_intel table
    // For now returning mock data with proper fields
    return [
      { rank: 1, name: 'Pop!_OS', score: 98, beginner: 'yes', trend: 'up' },
      { rank: 2, name: 'Fedora', score: 92, beginner: 'mid', trend: 'same' },
      { rank: 3, name: 'Linux Mint', score: 90, beginner: 'yes', trend: 'down' }
    ];
  }
}
