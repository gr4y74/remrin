import { NextResponse } from "next/server";
import { IntelligenceScraper } from "@/lib/sudodo/intelligence-scraper";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  // Simple auth check for cron (In production, use Authorization header + CRON_SECRET)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (process.env.NODE_ENV === 'production' && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const scraper = new IntelligenceScraper();

    // 1. Get all distro slugs
    const { data: distros, error } = await supabase
      .from('sudododo_communities')
      .select('slug');

    if (error) throw error;

    // 2. Process each one (in sequence to avoid hitting rate limits of external APIs)
    const results = [];
    for (const d of distros) {
        const result = await scraper.refreshDistroIntel(d.slug);
        results.push(result);
    }

    return NextResponse.json({ 
        success: true, 
        timestamp: new Date().toISOString(),
        updated: results 
    });

  } catch (error) {
    console.error("[Cron] Intel Refresh Failed:", error);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
