import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings, MessageCircle, Users, Mail } from 'lucide-react';

const CollapsibleHeaderPanel = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Collapsible Character Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-sm">
        {/* Collapsed State - Always Visible */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            {/* Character Avatar */}
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="relative group"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-400/50 shadow-lg shadow-blue-500/30 transition-all group-hover:border-blue-400 group-hover:shadow-blue-500/50">
                <div className="w-full h-full bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300"></div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 shadow-lg"></div>
            </button>
            
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-white font-semibold text-lg">Rem</h2>
                <p className="text-slate-400 text-sm">Created by @remnn</p>
              </div>
              
              {!isExpanded && (
                <div className="flex items-center gap-1 text-xs text-green-400 ml-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Active Now</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-700/50 hover:border-slate-600"
          >
            <span className="text-sm font-medium">
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </span>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Expanded State */}
        {isExpanded && (
          <div className="border-t border-slate-700/50 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-6 px-6 py-5">
              {/* Large Character Portrait */}
              <div className="relative flex-shrink-0">
                <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-blue-400/30 shadow-2xl shadow-blue-500/20">
                  <div className="w-full h-full bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300"></div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 shadow-lg">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs font-medium">Active</span>
                  </div>
                </div>
              </div>

              {/* Character Info */}
              <div className="flex-1 grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Rem</h3>
                    <p className="text-slate-400 text-sm mb-3">Created by @remnn</p>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-6 mt-3">
                      <div className="flex items-center gap-2">
                        <MessageCircle size={16} className="text-slate-400" />
                        <span className="text-white font-semibold">0</span>
                        <span className="text-slate-400 text-sm">Chats</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-400" />
                        <span className="text-white font-semibold">0</span>
                        <span className="text-slate-400 text-sm">Followers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-slate-400" />
                        <span className="text-white font-semibold">∞</span>
                        <span className="text-slate-400 text-sm">Messages</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Character Traits */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/30">
                    <span className="text-xl">💬</span>
                    <div>
                      <p className="text-white text-sm font-medium">Available for chat</p>
                      <p className="text-slate-400 text-xs">Ready to assist you</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/30">
                    <span className="text-xl">🌸</span>
                    <div>
                      <p className="text-white text-sm font-medium">Loyal and devoted maid</p>
                      <p className="text-slate-400 text-xs">Always at your service</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/30">
                    <span className="text-xl">💙</span>
                    <div>
                      <p className="text-white text-sm font-medium">From Re:Zero</p>
                      <p className="text-slate-400 text-xs">Kara Hajimeru Isekai Seikatsu</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 flex-shrink-0">
                <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 whitespace-nowrap">
                  View Profile
                </button>
                <button className="px-6 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-medium transition-all border border-slate-700/50 hover:border-slate-600 flex items-center justify-center gap-2">
                  <Settings size={16} />
                  Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800/50">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-medium">Rem</span>
                  <span className="text-slate-500 text-sm">just now</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Hello! The collapsible header panel is working beautifully. You can toggle it anytime to reclaim screen space for our conversation while still having quick access to my information when you need it.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-medium">You</span>
                  <span className="text-slate-500 text-sm">just now</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  This looks perfect! The expanded view has all the information I need, and I love how clean it looks when collapsed.
                </p>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="mt-6 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800/50 p-4">
            <textarea 
              placeholder="Type your message..."
              className="w-full bg-transparent text-slate-300 placeholder-slate-500 resize-none outline-none"
              rows={3}
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/50">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-300">
                  <span className="text-lg">📎</span>
                </button>
                <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-300">
                  <span className="text-lg">😊</span>
                </button>
              </div>
              <button className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/30">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsibleHeaderPanel;