import { createAdminClient } from "../../lib/supabase/server";
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * SudoDodo Official Logo Scraper
 * Extracts authentic distro logos from DistroWatch
 */

async function scrapeLogo(distroSlug: string) {
  try {
    // DistroWatch distribution names often correspond closely to our slugs
    // We normalize some common ones that might fail
    let searchName = distroSlug;
    if (searchName === 'cachyos') searchName = 'cachy';
    if (searchName === 'popos') searchName = 'pop';
    
    const url = `https://distrowatch.com/table.php?distribution=${searchName}`;
    const { data: html } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    const $ = cheerio.load(html);
    
    // DistroWatch logos are usually in the /images/cg/ directory
    const logoImg = $('img[src*="/images/cg/"]').first();
    const logoSrc = logoImg.attr('src');

    if (logoSrc) {
      return `https://distrowatch.com/${logoSrc}`;
    }
  } catch (err) {
    console.warn(`[Scraper] Failed to find logo for: ${distroSlug}`);
  }
  return null;
}

async function startScraping() {
  const supabase = createAdminClient();
  
  // 1. Get all communities that need a real icon (still have the emoji)
  const { data: communities, error } = await supabase
    .from('sudododo_communities')
    .select('id, name, slug')
    .eq('icon', '🐧') // Only target placeholders
    .order('members_count', { ascending: false });

  if (error || !communities) {
    console.error("Fetch error:", error);
    return;
  }

  console.log(`[Scraper] Starting batch for ${communities.length} distros...`);

  for (const community of communities) {
    console.log(`[Scraper] Processing ${community.name}...`);
    
    const logoUrl = await scrapeLogo(community.slug);
    
    if (logoUrl) {
      const { error: updateError } = await supabase
        .from('sudododo_communities')
        .update({ icon: logoUrl })
        .eq('id', community.id);
      
      if (!updateError) {
        console.log(`[✔] Updated logo for ${community.name}`);
      }
    }

    // 2. Rate limiting: Wait 1.5 seconds between requests
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log("[Scraper] Task complete.");
}

// In this environment, we run the first 10 immediately to prove concept
startScraping();
