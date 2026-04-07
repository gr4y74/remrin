import { createAdminClient } from "../../lib/supabase/server";
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import cheerio from 'cheerio';

/**
 * SudoDodo Asset Downloader & Local Host Engine
 * Downloads official logos from DistroWatch and localizes them
 */

const ASSET_DIR = path.join(process.cwd(), 'public/assets/sudodo/distros');

// Top 50 Popular Distros mapping to font-logos (fl- prefix)
const FONT_LOGOS_MAP: Record<string, string> = {
  'archlinux': 'fl-archlinux',
  'debian': 'fl-debian',
  'fedora': 'fl-fedora',
  'ubuntu': 'fl-ubuntu',
  'linuxmint': 'fl-linuxmint',
  'gentoo': 'fl-gentoo',
  'manjaro': 'fl-manjaro',
  'opensuse': 'fl-opensuse',
  'popos': 'fl-popos',
  'kali': 'fl-kali-linux',
  'elementary': 'fl-elementary',
  'nixos': 'fl-nixos',
  'freebsd': 'fl-freebsd',
  'slackware': 'fl-slackware',
  'void': 'fl-void',
  'zoran': 'fl-zorinos',
  'centos': 'fl-centos',
  'redhat': 'fl-redhat',
  'deepin': 'fl-deepin'
};

async function downloadLogo(slug: string, remoteUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(remoteUrl, { responseType: 'arraybuffer' });
    const ext = path.extname(remoteUrl) || '.png';
    const filename = `${slug}${ext}`;
    const fullPath = path.join(ASSET_DIR, filename);
    
    fs.writeFileSync(fullPath, response.data);
    return `/assets/sudodo/distros/${filename}`;
  } catch (err) {
    console.error(`[AssetEngine] Failed to download for ${slug}:`, err);
    return null;
  }
}

async function startLocalization() {
  const supabase = createAdminClient();
  
  // 1. Get all communities
  const { data: communities } = await supabase
    .from('sudododo_communities')
    .select('id, name, slug, icon');

  if (!communities) return;

  console.log(`[AssetEngine] Localizing branding for ${communities.length} distros...`);

  for (const community of communities) {
    // A. Check for Font-Logo match first (Highest performance)
    const fontIcon = FONT_LOGOS_MAP[community.slug];
    if (fontIcon) {
        await supabase.from('sudododo_communities').update({ icon: fontIcon }).eq('id', community.id);
        console.log(`[✨] Mapped to Font-Logo: ${community.name} -> ${fontIcon}`);
        continue;
    }

    // B. If current icon is a remote URL, download and localize it
    if (community.icon && community.icon.startsWith('http')) {
        const localPath = await downloadLogo(community.slug, community.icon);
        if (localPath) {
            await supabase.from('sudododo_communities').update({ icon: localPath }).eq('id', community.id);
            console.log(`[✔] Localized: ${community.name} -> ${localPath}`);
        }
    }
  }

  console.log("[AssetEngine] Completed.");
}

startLocalization();
