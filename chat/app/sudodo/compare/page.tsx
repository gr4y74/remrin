'use client';

import React, { useState, useEffect } from 'react';
import TopBar from '@/components/sudodo/community/TopBar';
import SubDodoIcon from '@/components/sudodo/community/SubDodoIcon';
import Link from 'next/link';

export default function DistroComparePage() {
  const [distroA, setDistroA] = useState<any>(null);
  const [distroB, setDistroB] = useState<any>(null);
  const [allDistros, setAllDistros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sudodo/communities?type=distro&limit=100')
      .then(res => res.json())
      .then(data => {
        setAllDistros(data.data || []);
        // Pre-select Fedora and Ubuntu as default "Battle"
        setDistroA(data.data?.find((d: any) => d.slug === 'fedora'));
        setDistroB(data.data?.find((d: any) => d.slug === 'ubuntu'));
        setIsLoading(false);
      });
  }, []);

  const renderMetric = (label: string, valA: any, valB: any, better: 'higher' | 'lower' | 'equal' = 'equal') => {
    const isABetter = better === 'higher' ? valA > valB : better === 'lower' ? valA < valB : false;
    const isBBetter = better === 'higher' ? valB > valA : better === 'lower' ? valB < valA : false;

    return (
      <div className="compare-row">
        <div className="c-metric-label">{label}</div>
        <div className={`c-val-container ${isABetter ? 'winner' : ''}`}>
           <div className="c-val">{valA}</div>
           {isABetter && <span className="winner-tag">BEST</span>}
        </div>
        <div className={`c-val-container ${isBBetter ? 'winner' : ''}`}>
           <div className="c-val">{valB}</div>
           {isBBetter && <span className="winner-tag">BEST</span>}
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="loading">Initializing Battle Arena...</div>;

  return (
    <div className="sudododo-page">
      <TopBar />
      
      <div className="compare-header">
        <div className="ch-inner">
          <div className="page-tag">{'// Distro-Battle · Side-by-Side Arena'}</div>
          <h1 className="page-title">Compare<br />Distributions</h1>
          <p className="page-sub">Match any two distros against your Digital Passport and hardware profile.</p>
        </div>
      </div>

      <div className="compare-arena glass">
        {/* TOP SELECTORS */}
        <div className="arena-selectors">
          <div className="sel-distro glass">
            <select 
                value={distroA?.slug} 
                onChange={(e) => setDistroA(allDistros.find(d => d.slug === e.target.value))}
            >
              {allDistros.map(d => <option key={d.id} value={d.slug}>{d.name.replace('r/', '')}</option>)}
            </select>
            <div className="sel-preview">
               <SubDodoIcon icon={distroA?.icon} name={distroA?.name} size={64} />
               <h2>{distroA?.name.replace('r/', '')}</h2>
            </div>
          </div>

          <div className="arena-vs">VS</div>

          <div className="sel-distro glass">
            <select 
               value={distroB?.slug} 
               onChange={(e) => setDistroB(allDistros.find(d => d.slug === e.target.value))}
            >
              {allDistros.map(d => <option key={d.id} value={d.slug}>{d.name.replace('r/', '')}</option>)}
            </select>
            <div className="sel-preview">
               <SubDodoIcon icon={distroB?.icon} name={distroB?.name} size={64} />
               <h2>{distroB?.name.replace('r/', '')}</h2>
            </div>
          </div>
        </div>

        {/* COMPARISON BODY */}
        <div className="compare-table">
          <div className="c-section-header">Core Metrics</div>
          {renderMetric('SudoDodo Score', 92, 88, 'higher')}
          {renderMetric('Stability Index', '10/10', '9/10')}
          {renderMetric('Freshness', 'Cutting Edge', 'Stable')}
          {renderMetric('Package Manager', 'dnf', 'apt')}
          
          <div className="c-section-header">{'// Hardware Compatibility (From Passport)'}</div>
          {renderMetric('NVIDIA Drivers', 'Experimental', 'Native Support', 'equal')}
          {renderMetric('Power Management', 'Good', 'Excellent', 'equal')}
          {renderMetric('Kernel Version', '6.8+', '6.5 (LTS)', 'higher')}

          <div className="c-section-header">Community Metadata</div>
          {renderMetric('Total Members', distroA?.members_count, distroB?.members_count, 'higher')}
          {renderMetric('Subreddit Health', '▲12% / mo', '▼2% / mo', 'higher')}
        </div>

        {/* DODO VERDICT ACTION */}
        <div className="dodo-verdict-box glass">
           <div className="dv-header">
              <span className="dv-icon">🐧</span>
              <h3>The Dodo&apos;s AI Verdict</h3>
           </div>
           <p>Based on your <strong>Digital Passport</strong> and <strong>NVIDIA GPU</strong>, {distroB?.name.replace('r/', '')} is the calculated winner due to its superior proprietary driver handles. However, {distroA?.name.replace('r/', '')} wins for development work requiring kernel 6.8+.</p>
           <button className="btn-primary">Generate Nuanced Report</button>
        </div>
      </div>

      <style jsx>{`
        .compare-arena { max-width: 1000px; margin: 0 auto 100px; border-radius: 20px; border: 1px solid #1e293b; overflow: hidden; }
        .arena-selectors { display: flex; align-items: center; justify-content: space-between; padding: 40px; background: rgba(0,0,0,0.2); border-bottom: 1px solid #1e293b; }
        .sel-distro { width: 40%; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .sel-distro select { width: 100%; background: #070a14; border: 1px solid #1e293b; color: #3b82f6; padding: 10px; border-radius: 8px; font-weight: 800; cursor: pointer; }
        .sel-preview { text-align: center; }
        .sel-preview h2 { margin-top: 15px; font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
        .arena-vs { font-family: 'JetBrains Mono', monospace; font-size: 40px; font-weight: 800; color: #1e293b; font-style: italic; }
        
        .compare-table { padding: 40px; }
        .c-section-header { margin: 40px 0 20px; font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 2px; }
        .compare-row { display: grid; grid-template-columns: 1fr 1fr 1fr; border-bottom: 1px solid #0f172a; padding: 20px 0; }
        .c-metric-label { font-size: 13px; color: #475569; font-weight: 600; display: flex; align-items: center; }
        .c-val-container { display: flex; align-items: center; justify-content: space-between; padding: 0 20px; }
        .c-val-container.winner .c-val { color: #fff; font-weight: 700; }
        .winner-tag { background: rgba(34, 197, 94, 0.15); color: #22c55e; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #22c55e40; }
        .c-val { font-size: 15px; color: #94a3b8; }
        
        .dodo-verdict-box { margin: 40px; padding: 24px; border-radius: 12px; border: 1px solid #3b82f640; background: rgba(59, 130, 246, 0.05); }
        .dv-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .dv-icon { font-size: 24px; }
        .dv-header h3 { margin: 0; font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #3b82f6; }
        .dodo-verdict-box p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
      `}</style>
    </div>
  );
}
