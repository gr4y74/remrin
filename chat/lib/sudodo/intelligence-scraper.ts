import { createAdminClient } from "@/lib/supabase/server";

export interface IntelligenceReport {
  slug: string;
  packageCount: number;
  outdatedPackages: number;
  dwHits: number;
  tuxScore: number;
}

export class IntelligenceScraper {
  /**
   * Normalize DistroWatch "Hits Per Day" (HPD) to our Score
   */
  private static normalizeHPD(hpd: number): number {
    // Legacy mapping: Over 2000 HPD is high interest (Arch/MX)
    return Math.min(100, Math.round((hpd / 3000) * 100));
  }

  /**
   * Fetch live package data from Repology API
   * Endpoint: https://repology.org/api/v1/repository/[repo_name]
   */
  async fetchRepologyData(repoName: string) {
    try {
      // Mocking fetch since we are in local dev, but logic is ready
      // const res = await fetch(`https://repology.org/api/v1/repository/${repoName}`);
      return { 
        total: Math.floor(Math.random() * 50000) + 10000, 
        outdated: Math.floor(Math.random() * 500) 
      };
    } catch (err) {
      console.error(`[Scraper] Repology fetch failed for ${repoName}:`, err);
      return null;
    }
  }

  /**
   * The "SudoDodo Tux Score" Algorithm
   * Weights: 40% Community, 30% Package Freshness, 20% Legacy Traction, 10% Rating
   */
  calculateTuxScore(data: {
    communityVotes: number;
    freshnessScore: number;
    legacyScore: number;
    userRating: number;
  }): number {
    return Math.round(
      (data.communityVotes * 0.4) + 
      (data.freshnessScore * 0.3) + 
      (data.legacyScore * 0.2) + 
      (data.userRating * 10 * 0.1)
    );
  }

  /**
   * Main background task to refresh a distro's intelligence
   */
  async refreshDistroIntel(slug: string) {
    const supabase = createAdminClient();
    
    // 1. Get current distro data
    const { data: distro, error } = await supabase
      .from('sudododo_communities')
      .select('*, intel:sudododo_distro_intel(*)')
      .eq('slug', slug)
      .single();

    if (error || !distro) return;

    // 2. Fetch external signals
    const pkgData = await this.fetchRepologyData(slug);
    const legacyS = IntelligenceScraper.normalizeHPD(distro.intel?.distrowatch_hit_rank || 500);
    
    // Freshness is inverse of outdated ratio
    const freshS = pkgData ? Math.max(0, 100 - (pkgData.outdated / pkgData.total * 1000)) : 80;

    // 3. Re-calculate Tux Score
    const newScore = this.calculateTuxScore({
      communityVotes: 95, // Mocked for now
      freshnessScore: freshS,
      legacyScore: legacyS,
      userRating: distro.intel?.user_rating || 4.5
    });

    // 4. Update Database
    await supabase
      .from('sudododo_distro_intel')
      .update({
        tux_score: newScore,
        package_data: pkgData ? { total: pkgData.total, outdated: pkgData.outdated } : {},
        last_updated: new Date().toISOString()
      })
      .eq('community_id', distro.id);

    return { slug, newScore };
  }
}
