import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="logo">
            <div className="logo-icon">🐧</div>
            Sudo<span>Dodo</span>
          </div>
          <p>The everything Linux platform. One place for distro discovery, tutorials, community, and tools. Built by Linux users, for Linux users.</p>
        </div>
        <div className="footer-col">
          <h4>Platform</h4>
          <ul>
            <li><Link href="#">Distro Wizard</Link></li>
            <li><Link href="#">Distro Database</Link></li>
            <li><Link href="#">Tutorials</Link></li>
            <li><Link href="#">News</Link></li>
            <li><Link href="#">Tools</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Community</h4>
          <ul>
            <li><Link href="#">Forums</Link></li>
            <li><Link href="#">Discord</Link></li>
            <li><Link href="#">Matrix</Link></li>
            <li><Link href="#">Newsletter</Link></li>
            <li><Link href="#">Contributing</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><Link href="#">About</Link></li>
            <li><Link href="#">Blog</Link></li>
            <li><Link href="#">API</Link></li>
            <li><Link href="#">Privacy</Link></li>
            <li><Link href="#">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 Sudo Dodo. Open source. Built with ❤️ for the Linux community.</p>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>kernel: 6.13.0-stable</p>
      </div>
    </footer>
  );
}
