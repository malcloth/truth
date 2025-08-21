import React from 'react';

function CommunityContextDiagram() {
  return (
    <div className="w-full max-w-4xl mx-auto my-8">
      <svg
        viewBox="0 0 800 400"
        className="w-full h-auto"
        style={{ maxHeight: '300px' }}
      >
        {/* Background */}
        <rect width="800" height="400" fill="transparent" />
        
        {/* Left Red Box - Initial Input */}
        <rect
          x="50"
          y="150"
          width="80"
          height="100"
          rx="8"
          fill="none"
          stroke="#EF4444"
          strokeWidth="4"
        />
        
        {/* Connecting lines from red to blue boxes */}
        <path
          d="M 130 180 Q 180 160 220 140"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
        />
        <path
          d="M 130 190 Q 180 180 220 180"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
        />
        <path
          d="M 130 200 Q 180 200 220 220"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
        />
        <path
          d="M 130 210 Q 180 220 220 260"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
        />
        <path
          d="M 130 220 Q 180 240 220 300"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
        />
        
        {/* Blue boxes - Sub-agents */}
        <rect x="220" y="130" width="40" height="30" rx="4" fill="none" stroke="#3B82F6" strokeWidth="2" />
        <rect x="220" y="170" width="40" height="30" rx="4" fill="none" stroke="#3B82F6" strokeWidth="2" />
        <rect x="220" y="210" width="40" height="30" rx="4" fill="none" stroke="#3B82F6" strokeWidth="2" />
        <rect x="220" y="250" width="40" height="30" rx="4" fill="none" stroke="#3B82F6" strokeWidth="2" />
        <rect x="220" y="290" width="40" height="30" rx="4" fill="none" stroke="#3B82F6" strokeWidth="2" />
        
        {/* Yellow grouping ellipses */}
        <ellipse
          cx="280"
          cy="165"
          rx="60"
          ry="45"
          fill="none"
          stroke="#EAB308"
          strokeWidth="3"
          opacity="0.8"
        />
        <ellipse
          cx="280"
          cy="275"
          rx="60"
          ry="45"
          fill="none"
          stroke="#EAB308"
          strokeWidth="3"
          opacity="0.8"
        />
        
        {/* Connecting lines from yellow groups to central yellow */}
        <path
          d="M 340 165 Q 380 165 420 180"
          fill="none"
          stroke="#EAB308"
          strokeWidth="3"
        />
        <path
          d="M 340 275 Q 380 275 420 220"
          fill="none"
          stroke="#EAB308"
          strokeWidth="3"
        />
        
        {/* Central Yellow box - Larger agent */}
        <rect
          x="420"
          y="180"
          width="60"
          height="40"
          rx="8"
          fill="none"
          stroke="#EAB308"
          strokeWidth="4"
        />
        
        {/* Connecting line from central yellow to final red */}
        <path
          d="M 480 200 Q 520 200 560 200"
          fill="none"
          stroke="#EF4444"
          strokeWidth="3"
        />
        
        {/* Right Red Box - Final Output */}
        <rect
          x="560"
          y="150"
          width="80"
          height="100"
          rx="8"
          fill="none"
          stroke="#EF4444"
          strokeWidth="4"
        />
        
        {/* Labels */}
        <text x="90" y="120" textAnchor="middle" className="fill-white/60 text-sm font-medium">
          User Inputs
        </text>
        <text x="240" y="120" textAnchor="middle" className="fill-white/60 text-sm font-medium">
          Sub-agents
        </text>
        <text x="280" y="350" textAnchor="middle" className="fill-white/60 text-sm font-medium">
          Randomized Pools
        </text>
        <text x="450" y="140" textAnchor="middle" className="fill-white/60 text-sm font-medium">
          Larger Agent
        </text>
        <text x="600" y="120" textAnchor="middle" className="fill-white/60 text-sm font-medium">
          Collective Wisdom
        </text>
      </svg>
    </div>
  );
}

export default CommunityContextDiagram;