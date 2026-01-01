import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CardCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sample data - you can easily replace this with your own content
  const cards = [
    {
      id: 1,
      title: "Your Title Here",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop",
      buttonText: "Learn More",
      link: "#"
    },
    {
      id: 2,
      title: "Another Card",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=600&fit=crop",
      buttonText: "Explore",
      link: "#"
    },
    {
      id: 3,
      title: "Featured Content",
      image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=600&fit=crop",
      buttonText: "Discover",
      link: "#"
    },
    {
      id: 4,
      title: "Amazing Views",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
      buttonText: "View More",
      link: "#"
    },
    {
      id: 5,
      title: "New Release",
      image: "https://images.unsplash.com/photo-1511576661531-b34d7da5d0bb?w=400&h=600&fit=crop",
      buttonText: "Watch Now",
      link: "#"
    },
    {
      id: 6,
      title: "Special Feature",
      image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=600&fit=crop",
      buttonText: "Check It Out",
      link: "#"
    }
  ];

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? cards.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === cards.length - 1 ? 0 : prevIndex + 1
    );
  };

  const getCardStyle = (index: number) => {
    const diff = index - currentIndex;
    const absPos = Math.abs(diff);

    if (absPos > 2) return { display: 'none' };

    // Center card
    if (diff === 0) {
      return {
        transform: 'translateX(0) translateZ(0) scale(1)',
        opacity: 1,
        zIndex: 3
      };
    }

    // Right cards
    if (diff > 0) {
      return {
        transform: `translateX(${diff * 280}px) translateZ(-${absPos * 200}px) scale(${1 - absPos * 0.15})`,
        opacity: 1 - absPos * 0.3,
        zIndex: 3 - absPos
      };
    }

    // Left cards
    return {
      transform: `translateX(${diff * 280}px) translateZ(-${absPos * 200}px) scale(${1 - absPos * 0.15})`,
      opacity: 1 - absPos * 0.3,
      zIndex: 3 - absPos
    };
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="w-full max-w-7xl">
        {/* Carousel Container */}
        <div className="relative" style={{ perspective: '2000px' }}>
          {/* Navigation Buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all text-white"
            aria-label="Previous"
          >
            <ChevronLeft size={32} />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all text-white"
            aria-label="Next"
          >
            <ChevronRight size={32} />
          </button>

          {/* Cards Container */}
          <div className="relative h-[600px] flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="absolute transition-all duration-500 ease-out"
                style={getCardStyle(index)}
              >
                {/* Card */}
                <div className="relative w-[320px] h-[480px] rounded-xl overflow-hidden shadow-2xl group cursor-pointer">
                  {/* Background Image */}
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80"></div>

                  {/* Card Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white text-2xl font-bold mb-4 drop-shadow-lg">
                      {card.title}
                    </h3>

                    {/* Button */}
                    <a
                      href={card.link}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-sm">▶</span>
                      <span>{card.buttonText}</span>
                    </a>
                  </div>

                  {/* Hover Border Effect */}
                  <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-xl transition-all duration-300"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-2 mt-8">
            {cards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/30 hover:bg-white/50'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700">
          <h4 className="text-white font-bold mb-3">How to customize:</h4>
          <ul className="text-slate-300 space-y-2 text-sm">
            <li>• Replace the <code className="bg-slate-800 px-2 py-1 rounded">cards</code> array with your own content</li>
            <li>• Update <code className="bg-slate-800 px-2 py-1 rounded">image</code>, <code className="bg-slate-800 px-2 py-1 rounded">title</code>, <code className="bg-slate-800 px-2 py-1 rounded">buttonText</code>, and <code className="bg-slate-800 px-2 py-1 rounded">link</code> for each card</li>
            <li>• Adjust colors in the button classes (currently yellow-400)</li>
            <li>• Modify card dimensions by changing w-[320px] and h-[480px]</li>
            <li>• The carousel automatically loops through all cards</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CardCarousel;
