/**
 * SudoDodo Initial Data Seed
 * This script provides the foundational compatibility data for our "Distro Intelligence" engine.
 */

const SEED_DATA = {
  hardware: [
    { manufacturer: 'Lenovo', model_name: 'ThinkPad X1 Carbon Gen 6', category: 'laptop' }
  ],
  distros: [
    { 
      name: 'Pop!_OS', 
      slug: 'popos', 
      icon: '🚀', 
      theme_color: '#48a999',
      tagline: 'The Linux distro that gets out of your way',
      intel: {
        tux_score: 98,
        monthly_installs: '743k',
        user_rating: 4.7,
        beginner_friendliness: 'yes',
        latest_version: '24.04 LTS',
        rank_position: 1,
        distrowatch_hit_rank: 3,
        hardware_compatibility: [
          {
            model: 'ThinkPad X1 Carbon Gen 6',
            status: 'perfect',
            notes: ['Full suspension/hibernation support.', 'Trackpoint sensitivity is optimal.']
          }
        ]
      }
    },
    { 
      name: 'Arch Linux', 
      slug: 'arch', 
      icon: '🏔️', 
      theme_color: '#1793d1',
      tagline: 'A simple, lightweight distribution',
      intel: {
        tux_score: 87,
        monthly_installs: '621k',
        user_rating: 4.8,
        beginner_friendliness: 'no',
        latest_version: 'Rolling',
        rank_position: 4,
        distrowatch_hit_rank: 1,
        hardware_compatibility: [
          {
            model: 'ThinkPad X1 Carbon Gen 6',
            status: 'functional',
            notes: ['Requires manual setup for fingerprint reader.', 'TPM 2.0 requires extra config.']
          }
        ]
      }
    }
  ],
  knowledge: [
    {
      source_id: 'arch-wiki',
      title: 'Lenovo ThinkPad X1 Carbon (Gen 6) - Installation',
      url: 'https://wiki.archlinux.org/title/Lenovo_ThinkPad_X1_Carbon_(Gen_6)',
      content_snippet: 'Most of the hardware is supported by recent kernels. The only exception is the trackpoint/touchpad which might require psmouse.synaptics_intertouch=1 to enable SMBus/RMI support.',
      category: 'technical'
    },
    {
      source_id: 'linux-journey',
      title: 'Common Linux Commands - ls',
      url: 'https://linuxjourney.com/lesson/ls-list-files',
      content_snippet: 'The ls command is used to list the contents of a directory. Common flags include -l for long format and -a for hidden files.',
      category: 'beginner'
    }
  ]
};

console.log('--- SudoDodo SQL SEED GENERATOR ---');

let sql = '';

// Generate Hardware Inserts
SEED_DATA.hardware.forEach(h => {
  sql += `INSERT INTO sudododo_hardware (manufacturer, model_name, category) VALUES ('${h.manufacturer}', '${h.model_name}', '${h.category}') ON CONFLICT DO NOTHING;\n`;
});

// Generate Distro and Intel Inserts
SEED_DATA.distros.forEach(d => {
  sql += `INSERT INTO sudododo_communities (name, slug, icon, theme_color, tagline) VALUES ('${d.name}', '${d.slug}', '${d.icon}', '${d.theme_color}', '${d.tagline}') ON CONFLICT (slug) DO UPDATE SET tagline = EXCLUDED.tagline RETURNING id;\n`;
  
  // Note: In real setup, we'd need ID from community to link to intel. 
  // For the script, we use subqueries.
  sql += `INSERT INTO sudododo_distro_intel (community_id, tux_score, monthly_installs, user_rating, beginner_friendliness, latest_version, rank_position, distrowatch_hit_rank, hardware_compatibility)
  SELECT id, ${d.intel.tux_score}, '${d.intel.monthly_installs}', ${d.intel.user_rating}, '${d.intel.beginner_friendliness}', '${d.intel.latest_version}', ${d.intel.rank_position}, ${d.intel.distrowatch_hit_rank}, '${JSON.stringify(d.intel.hardware_compatibility)}'::jsonb
  FROM sudododo_communities WHERE slug = '${d.slug}';\n\n`;
});

// Generate Knowledge Inserts
SEED_DATA.knowledge.forEach(k => {
  sql += `INSERT INTO sudododo_knowledge_cache (source_id, title, url, content_snippet, category) VALUES ('${k.source_id}', '${k.title}', '${k.url}', '${k.content_snippet.replace(/'/g, "''")}', '${k.category}') ON CONFLICT (url) DO NOTHING;\n`;
});

console.log(sql);
