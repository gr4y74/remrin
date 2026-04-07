import React from 'react';

interface SubDodoIconProps {
  icon: string;
  name: string;
  className?: string;
  size?: number;
}

/**
 * Smart Icon Component
 * Handles fl- (font-logos), /assets/ (local images), and emojis
 */
export default function SubDodoIcon({ icon, name, className = '', size = 32 }: SubDodoIconProps) {
  const isFontIcon = icon?.startsWith('fl-');
  const isLocalAsset = icon?.startsWith('/assets/');
  const isRemote = icon?.startsWith('http');

  const style: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${size * 0.8}px`
  };

  if (isFontIcon) {
    return (
      <div className={`sd-icon-wrapper ${className}`} style={style}>
        <i className={`${icon} sd-font-glyph`}></i>
      </div>
    );
  }

  if (isLocalAsset || isRemote) {
    return (
      <div className={`sd-icon-wrapper ${className}`} style={style}>
        <img 
          src={icon} 
          alt={name} 
          className="sd-img-glyph"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    );
  }

  // Fallback to emoji or placeholder
  return (
    <div className={`sd-icon-wrapper emoji-fallback ${className}`} style={style}>
      {icon || '🐧'}
    </div>
  );
}
