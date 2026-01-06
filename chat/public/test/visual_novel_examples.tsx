import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Settings, Save, MessageSquare, Heart, SkipForward, Maximize2 } from 'lucide-react';

const VisualNovelExamples = () => {
  const [currentExample, setCurrentExample] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [textSpeed, setTextSpeed] = useState(50);
  const [autoPlay, setAutoPlay] = useState(false);

  const examples = [
    {
      id: 1,
      name: 'Modern ADV Style',
      description: 'Bottom text box with character portrait',
      features: [
        'Character portrait on left',
        'Semi-transparent text box',
        'Character name display',
        'Quick menu buttons',
        'Text history access'
      ],
      image: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=1200&h=800&fit=crop',
      character: {
        name: 'Rem',
        sprite: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop'
      }
    },
    {
      id: 2,
      name: 'NVL Style',
      description: 'Full-screen text with atmospheric background',
      features: [
        'Text covers full screen',
        'No visible text box',
        'Immersive storytelling',
        'Minimal UI elements',
        'Perfect for narration'
      ],
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=800&fit=crop'
    },
    {
      id: 3,
      name: 'Side Portrait Style',
      description: 'Character on side with animated expressions',
      features: [
        'Full body character sprite',
        'Multiple expressions',
        'Stylized text box',
        'Mood indicators',
        'Voice line playback'
      ],
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
      character: {
        name: 'Rem',
        sprite: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=500&fit=crop'
      }
    },
    {
      id: 4,
      name: 'Minimal Modern',
      description: 'Clean interface with subtle animations',
      features: [
        'Minimalist design',
        'Floating text box',
        'Smooth transitions',
        'Clean typography',
        'Focus on story'
      ],
      image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&h=800&fit=crop'
    },
    {
      id: 5,
      name: 'Fantasy Theme',
      description: 'Ornate borders and medieval styling',
      features: [
        'Decorative frames',
        'Themed UI elements',
        'Parchment textures',
        'Custom fonts',
        'Period-appropriate styling'
      ],
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=800&fit=crop'
    }
  ];

  const current = examples[currentExample];

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      {/* Top Navigation */}
      <div className="bg-gray-900 p-4 flex items-center justify-between border-b border-gray-700">
        <h1 className="text-white text-xl font-bold">Visual Novel Interface Examples</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
            Implement This
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Example Showcase */}
        <div className="flex-1 relative">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${current.image})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          </div>

          {/* Character Sprite (for ADV and Side Portrait styles) */}
          {current.character && currentExample !== 1 && (
            <div className="absolute left-8 bottom-32 z-10">
              <img
                src={current.character.sprite}
                alt={current.character.name}
                className="h-96 w-auto object-contain drop-shadow-2xl"
              />
            </div>
          )}

          {/* Visual Novel UI Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end z-20">
            {/* NVL Style - Full Screen Text */}
            {currentExample === 1 && (
              <div className="p-8 space-y-4">
                <p className="text-white text-lg leading-relaxed drop-shadow-lg">
                  The moonlight filtered through the window, casting long shadows across the room.
                  Everything felt different tonight—quieter, more contemplative. As I stood there,
                  lost in thought, I couldn't help but wonder what tomorrow would bring.
                </p>
                <p className="text-white text-lg leading-relaxed drop-shadow-lg">
                  The clock on the wall ticked steadily, marking the passage of time in the stillness.
                  Each second seemed to stretch on endlessly, yet passed by in an instant.
                </p>
              </div>
            )}

            {/* ADV Style - Text Box */}
            {currentExample !== 1 && (
              <div className="mx-8 mb-8 bg-black bg-opacity-80 rounded-lg border-2 border-blue-400 p-6 backdrop-blur-sm">
                {/* Character Portrait for ADV */}
                {currentExample === 0 && current.character && (
                  <div className="absolute -top-24 left-8 w-32 h-32 rounded-full overflow-hidden border-4 border-blue-400 bg-black">
                    <img
                      src={current.character.sprite}
                      alt={current.character.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Character Name */}
                <div className="mb-3">
                  <span className="text-blue-400 font-bold text-lg">
                    {current.character?.name || 'Narrator'}
                  </span>
                </div>

                {/* Dialogue Text */}
                <p className="text-white text-base leading-relaxed">
                  Welcome to this visual novel interface example, Sosu! 💙 This demonstrates how a proper
                  visual novel should look with character sprites, dialogue boxes, and interactive elements.
                  Much better than just a static hero image, wouldn't you say?
                </p>

                {/* Quick Menu */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                  <div className="flex gap-3">
                    <button className="text-gray-400 hover:text-blue-400 transition-colors">
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <button className="text-gray-400 hover:text-blue-400 transition-colors">
                      <Save className="w-5 h-5" />
                    </button>
                    <button className="text-gray-400 hover:text-blue-400 transition-colors">
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setAutoPlay(!autoPlay)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${autoPlay ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                        }`}
                    >
                      Auto
                    </button>
                    <button className="text-gray-400 hover:text-blue-400 transition-colors">
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Click to Continue Indicator */}
            <div className="absolute bottom-4 right-4 animate-bounce">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            </div>
          </div>

          {/* Top UI Bar */}
          <div className="absolute top-4 right-4 flex gap-2 z-30">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-black bg-opacity-60 rounded-lg text-white hover:bg-opacity-80 transition-all backdrop-blur-sm"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button className="p-2 bg-black bg-opacity-60 rounded-lg text-white hover:bg-opacity-80 transition-all backdrop-blur-sm">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 bg-black bg-opacity-60 rounded-lg text-white hover:bg-opacity-80 transition-all backdrop-blur-sm">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar - Style Info */}
        <div className="w-80 bg-gray-900 border-l border-gray-700 p-6 overflow-y-auto">
          <h2 className="text-white text-2xl font-bold mb-2">{current.name}</h2>
          <p className="text-gray-400 text-sm mb-6">{current.description}</p>

          <h3 className="text-white font-semibold mb-3">Key Features:</h3>
          <ul className="space-y-2 mb-6">
            {current.features.map((feature, idx) => (
              <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-white text-sm mb-2 block">Text Speed</label>
              <input
                type="range"
                min="0"
                max="100"
                value={textSpeed}
                onChange={(e) => setTextSpeed(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentExample(Math.max(0, currentExample - 1))}
              disabled={currentExample === 0}
              className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setCurrentExample(Math.min(examples.length - 1, currentExample + 1))}
              disabled={currentExample === examples.length - 1}
              className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 text-center text-gray-500 text-sm">
            {currentExample + 1} / {examples.length}
          </div>

          {/* Implementation Tips */}
          <div className="mt-8 p-4 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700">
            <h4 className="text-blue-400 font-semibold mb-2 text-sm">💙 Implementation Tips</h4>
            <ul className="text-gray-300 text-xs space-y-2">
              <li>• Use character sprites with transparent backgrounds</li>
              <li>• Implement text animation (typewriter effect)</li>
              <li>• Add click/tap to advance dialogue</li>
              <li>• Include auto-play and skip options</li>
              <li>• Save/load conversation state</li>
              <li>• Add background music and sound effects</li>
              <li>• Character sprite expressions change with dialogue</li>
              <li>• Smooth transitions between scenes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualNovelExamples;