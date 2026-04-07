import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function NavBar() {
  return (
    <nav>
      <div className="logo">
        <div className="logo-icon">
          <Image src="/sudodo/logo.svg" alt="Sudo Dodo Logo" width={24} height={24} style={{ borderRadius: '4px' }} />
        </div>
        Sudo<span>Dodo</span>
      </div>
      <ul>
        <li><Link href="#wizard">Distro Finder</Link></li>
        <li><Link href="#distros">Distros</Link></li>
        <li><Link href="#tutorials">Tutorials</Link></li>
        <li><Link href="#community">Community</Link></li>
        <li><Link href="#tools">Tools</Link></li>
        <li><Link href="#" className="nav-cta">Join Free</Link></li>
      </ul>
    </nav>
  );
}
