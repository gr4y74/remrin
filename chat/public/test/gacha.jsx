import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Crown, Star } from 'lucide-react';

const GachaCardPull = () => {
  const [isPulling, setIsPulling] = useState(false);
  const [pulledCards, setPulledCards] = useState([]);
  const [showCards, setShowCards] = useState(false);
  const [currency, setCurrency] = useState(1000);
  const [pullAnimation, setPullAnimation] = useState('');
  const [particleEffect, setParticleEffect] = useState(false);

  // Mock card data - replace with your actual API call
  const mockCards = [
    { id: 1, name: 'Shadow Weaver', rarity: 'legendary', image: '🌌', stats: { creativity: 95, detail: 92, engagement: 88 }, creator: 'User123' },
    { id: 2, name: 'Crystal Guardian', rarity: 'epic', image: '💎', stats: { creativity: 85, detail: 80, engagement: 75 }, creator: 'User456' },
    { id: 3, name: 'Forest Sprite', rarity: 'rare', image: '🌿', stats: { creativity: 70, detail: 65, engagement: 68 }, creator: 'User789' },
    { id: 4, name: 'Simple Bot', rarity: 'common', image: '🤖', stats: { creativity: 45, detail: 40, engagement: 42 }, creator: 'User101' },
    { id: 5, name: 'Void Walker', rarity: 'legendary', image: '🌀', stats: { creativity: 98, detail: 95, engagement: 93 }, creator: 'User202' },
    { id: 6, name: 'Flame Dancer', rarity: 'epic', image: '🔥', stats: { creativity: 82, detail: 78, engagement: 80 }, creator: 'User303' },
  ];

  const rarityWeights = {
    common: 50,
    rare: 30,
    epic: 15,
    legendary: 5
  };

  const rarityConfig = {
    common: {
      color: '#94a3b8',
      glow: '#cbd5e1',
      gradient: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
      icon: Star,
      label: 'Common'
    },
    rare: {
      color: '#3b82f6',
      glow: '#60a5fa',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
      icon: Sparkles,
      label: 'Rare'
    },
    epic: {
      color: '#a855f7',
      glow: '#c084fc',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      icon: Zap,
      label: 'Epic'
    },
    legendary: {
      color: '#f59e0b',
      glow: '#fbbf24',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fef3c7 100%)',
      icon: Crown,
      label: 'Legendary'
    }
  };

  const getRandomCard = () => {
    const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
      random -= weight;
      if (random <= 0) {
        const cardsOfRarity = mockCards.filter(card => card.rarity === rarity);
        return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
      }
    }
    return mockCards[0];
  };

  const performPull = (count) => {
    const cost = count === 1 ? 100 : 900;
    if (currency < cost) {
      alert('Not enough currency!');
      return;
    }

    setCurrency(currency - cost);
    setIsPulling(true);
    setPullAnimation('pulling');
    setParticleEffect(true);
    setShowCards(false);

    setTimeout(() => {
      const newCards = Array.from({ length: count }, () => getRandomCard());
      setPulledCards(newCards);
      setPullAnimation('reveal');
      
      setTimeout(() => {
        setShowCards(true);
        setIsPulling(false);
        setPullAnimation('');
        setParticleEffect(false);
      }, 1000);
    }, 2500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #0f0f23 0%, #1a1a3e 50%, #2d1b4e 100%)',
      padding: '2rem',
      fontFamily: '"DM Sans", -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Stars */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.4
      }}>
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '2px',
              height: '2px',
              background: 'white',
              borderRadius: '50%',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s`,
              boxShadow: '0 0 4px rgba(255,255,255,0.8)'
            }}
          />
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Orbitron:wght@700;900&display=swap');
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
          50% { box-shadow: 0 0 40px currentColor, 0 0 80px currentColor; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0) scale(1); }
          10% { transform: translateX(-10px) scale(1.05); }
          20% { transform: translateX(10px) scale(1.05); }
          30% { transform: translateX(-10px) scale(1.05); }
          40% { transform: translateX(10px) scale(1.05); }
          50% { transform: translateX(-5px) scale(1.1); }
          60% { transform: translateX(5px) scale(1.1); }
          70% { transform: translateX(-5px) scale(1.1); }
          80% { transform: translateX(5px) scale(1.1); }
          90% { transform: translateX(0) scale(1.15); }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes cardReveal {
          0% { transform: rotateY(90deg) scale(0.5); opacity: 0; }
          50% { transform: rotateY(45deg) scale(0.75); }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
        
        @keyframes particleBurst {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '3rem',
          padding: '1.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontFamily: '"Orbitron", monospace',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #dc2626 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 40px rgba(251, 191, 36, 0.5)',
            margin: 0,
            letterSpacing: '2px'
          }}>
            AI CHARACTER GACHA
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            borderRadius: '50px',
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#0f0f23',
            boxShadow: '0 10px 30px rgba(251, 191, 36, 0.3)'
          }}>
            <Sparkles size={24} />
            {currency.toLocaleString()} Credits
          </div>
        </div>

        {/* Pull Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '4rem'
        }}>
          {[
            { count: 1, cost: 100, label: 'Single Pull' },
            { count: 10, cost: 900, label: '10x Pull (Save 10%)' }
          ].map(({ count, cost, label }) => (
            <button
              key={count}
              onClick={() => performPull(count)}
              disabled={isPulling || currency < cost}
              style={{
                padding: '1.5rem 3rem',
                fontSize: '1.25rem',
                fontWeight: '700',
                fontFamily: '"DM Sans", sans-serif',
                background: isPulling ? 'rgba(148, 163, 184, 0.3)' : 
                           'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: isPulling || currency < cost ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isPulling ? 'none' : '0 10px 40px rgba(59, 130, 246, 0.4)',
                transform: 'translateY(0)',
                opacity: currency < cost ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isPulling && currency >= cost) {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 50px rgba(59, 130, 246, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(59, 130, 246, 0.4)';
              }}
            >
              {isPulling ? 'SUMMONING...' : label}
              <div style={{
                position: 'absolute',
                bottom: '0.5rem',
                right: '1rem',
                fontSize: '0.875rem',
                opacity: 0.8
              }}>
                {cost} Credits
              </div>
            </button>
          ))}
        </div>

        {/* Pull Animation Container */}
        {isPulling && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            position: 'relative'
          }}>
            {/* Particle Effects */}
            {particleEffect && [...Array(30)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: '8px',
                  height: '8px',
                  background: ['#fbbf24', '#f59e0b', '#3b82f6', '#a855f7'][Math.floor(Math.random() * 4)],
                  borderRadius: '50%',
                  '--tx': `${(Math.random() - 0.5) * 400}px`,
                  '--ty': `${(Math.random() - 0.5) * 400}px`,
                  animation: 'particleBurst 1.5s ease-out forwards',
                  animationDelay: `${Math.random() * 0.5}s`,
                  boxShadow: '0 0 10px currentColor'
                }}
              />
            ))}

            <div style={{
              fontSize: '10rem',
              animation: pullAnimation === 'pulling' ? 'shake 2s ease-in-out' : 
                        pullAnimation === 'reveal' ? 'fadeIn 0.5s ease-out' : 'none',
              filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.8))'
            }}>
              ✨
            </div>
          </div>
        )}

        {/* Cards Display */}
        {showCards && pulledCards.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: pulledCards.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            {pulledCards.map((card, index) => {
              const config = rarityConfig[card.rarity];
              const Icon = config.icon;
              
              return (
                <div
                  key={`${card.id}-${index}`}
                  style={{
                    background: config.gradient,
                    borderRadius: '20px',
                    padding: '2rem',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 20px 60px ${config.glow}40`,
                    animation: `cardReveal 0.8s ease-out ${index * 0.1}s both`,
                    border: `2px solid ${config.glow}`,
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-10px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  }}
                >
                  {/* Shimmer Effect for Legendary */}
                  {card.rarity === 'legendary' && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite',
                      pointerEvents: 'none'
                    }} />
                  )}

                  {/* Rarity Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '50px',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    <Icon size={16} />
                    {config.label}
                  </div>

                  {/* Card Image */}
                  <div style={{
                    fontSize: '8rem',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    filter: card.rarity === 'legendary' ? 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))' : 'none'
                  }}>
                    {card.image}
                  </div>

                  {/* Card Name */}
                  <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: 'white',
                    marginBottom: '0.5rem',
                    textAlign: 'center',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
                  }}>
                    {card.name}
                  </h2>

                  {/* Creator */}
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    textAlign: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    Created by {card.creator}
                  </p>

                  {/* Stats */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '1rem'
                  }}>
                    {Object.entries(card.stats).map(([stat, value]) => (
                      <div key={stat} style={{ marginBottom: '0.75rem' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.25rem',
                          fontSize: '0.875rem',
                          color: 'white',
                          textTransform: 'capitalize',
                          fontWeight: '600'
                        }}>
                          <span>{stat}</span>
                          <span>{value}</span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${value}%`,
                            height: '100%',
                            background: 'white',
                            borderRadius: '3px',
                            transition: 'width 1s ease-out',
                            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Instructions */}
        {!isPulling && pulledCards.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '1.125rem',
            marginTop: '4rem',
            animation: 'fadeIn 1s ease-out'
          }}>
            <p style={{ marginBottom: '1rem', fontSize: '1.5rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              🎲 Ready to summon an AI Character?
            </p>
            <p>
              Choose your pull and discover unique AI characters created by the community!
            </p>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
              Higher rarity = More creativity, detail, and effort from the creator
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GachaCardPull;
