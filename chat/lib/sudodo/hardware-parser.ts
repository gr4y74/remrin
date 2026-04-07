/**
 * SudoDodo Hardware Parser Engine
 * Turns raw terminal command output into a structured Hardware Profile.
 */

export interface HardwareProfile {
  cpu?: {
    model: string;
    cores: number;
    arch: string;
  };
  gpu?: {
    vendor: 'nvidia' | 'amd' | 'intel' | 'unknown';
    model: string;
    isDiscrete: boolean;
  };
  laptopModel?: string;
  kernel?: string;
}

export class HardwareParser {
  /**
   * Main entry point for parsing pasted terminal logs
   */
  static parse(rawOutput: string): HardwareProfile {
    const profile: HardwareProfile = {};

    // 1. Detect GPU (NVIDIA, AMD, Intel)
    // Looking for: "VGA compatible controller: NVIDIA Corporation..."
    if (/nvidia/i.test(rawOutput)) {
      profile.gpu = { 
        vendor: 'nvidia', 
        model: this.extractMatch(rawOutput, /nvidia\s+([^(\n]+)/i) || 'NVIDIA GPU',
        isDiscrete: true 
      };
    } else if (/amd/i.test(rawOutput) && /graphics/i.test(rawOutput)) {
      profile.gpu = { 
        vendor: 'amd', 
        model: this.extractMatch(rawOutput, /amd\s+([^(\n]+)/i) || 'AMD Radeon',
        isDiscrete: !/integrated/i.test(rawOutput) 
      };
    } else if (/intel/i.test(rawOutput) && /graphics/i.test(rawOutput)) {
        profile.gpu = { 
          vendor: 'intel', 
          model: this.extractMatch(rawOutput, /intel\s+([^(\n]+)/i) || 'Intel Graphics',
          isDiscrete: false 
        };
    }

    // 2. Detect CPU information from uname/lscpu context
    profile.cpu = {
        model: this.extractMatch(rawOutput, /model name\s+:\s+(.+)/i) || 'Generic CPU',
        cores: parseInt(this.extractMatch(rawOutput, /cpu\(s\):\s+(\d+)/i) || '1'),
        arch: /x86_64/i.test(rawOutput) ? 'x86_64' : /arm/i.test(rawOutput) ? 'ARM' : 'unknown'
    };

    // 3. Laptop Model (e.g., ThinkPad, Framework)
    if (/thinkpad/i.test(rawOutput)) profile.laptopModel = 'ThinkPad';
    if (/framework/i.test(rawOutput)) profile.laptopModel = 'Framework';

    return profile;
  }

  private static extractMatch(text: string, regex: RegExp): string | null {
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Generates a "Dodo Match" report based on the hardware profile
   */
  static getRecommendations(profile: HardwareProfile): string[] {
    const recs = [];
    if (profile.gpu?.vendor === 'nvidia') {
      recs.push('Pop!_OS (Best out-of-box NVIDIA support)');
      recs.push('Fedora (Solid with RPMFusion drivers)');
    } else if (profile.gpu?.vendor === 'amd') {
      recs.push('Arch Linux (Excellent Mesa/Open Source performance)');
      recs.push('Ubuntu (Very stable for AMD)');
    }

    if (profile.laptopModel === 'ThinkPad') {
      recs.push('Debian (ThinkPads are essentially the gold standard for Debian)');
    }

    return recs;
  }
}
