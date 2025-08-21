import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, MessageSquare, Sparkles, Share2 } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  text: string;
  icon: React.ReactNode;
}

const chapters: Chapter[] = [
  {
    id: 'what-is-our-truth',
    title: 'What is "Our Truth"',
    subtitle: 'A revolutionary platform for authentic self-discovery',
    text: 'Our Truth is an AI-powered platform that helps you discover profound insights about yourself through personalized questions. We believe everyone has unique truths waiting to be uncovered, and our technology helps reveal them in a meaningful, shareable way.',
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    id: 'community-context-ai',
    title: 'How Community-Context AI works',
    subtitle: 'AI that learns from collective human experience',
    text: 'Our Community-Context AI analyzes patterns from thousands of truth discoveries to generate increasingly personalized questions. The more people use our platform, the better our AI becomes at uncovering deep, authentic insights that resonate with the human experience.',
    icon: <MessageSquare className="w-5 h-5" />
  },
  {
    id: 'truth-token',
    title: '$TRUTH Token',
    subtitle: 'The currency of authentic self-expression',
    text: '$TRUTH is our native token that powers the Our Truth ecosystem. Token holders gain access to premium features, contribute to platform governance, and earn rewards for meaningful contributions to the community of truth seekers.',
    icon: <CheckCircle className="w-5 h-5" />
  },
  {
    id: 'truth-api',
    title: 'Truth API (Coming Soon)',
    subtitle: 'Integrate authentic insights into your applications',
    text: 'Our upcoming Truth API will allow developers to integrate our powerful insight generation technology into their own applications. Build authentic user experiences, create personalized content, and tap into the power of community-driven AI.',
    icon: <Share2 className="w-5 h-5" />
  },
  {
    id: 'try-it-now',
    title: 'Try it out now!',
    subtitle: 'Discover your truth in just 2 minutes',
    text: 'Ready to uncover your authentic self? Start your journey by sharing your X username and answering two thoughtful questions. Join thousands of others who have discovered their truths and shared them with the world.',
    icon: <Sparkles className="w-5 h-5" />
  }
];

function HowItWorksPage() {
  const [activeChapter, setActiveChapter] = useState(chapters[0].id);

  const currentChapter = chapters.find(chapter => chapter.id === activeChapter) || chapters[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-300 to-yellow-300">
      {/* Navigation */}
      <nav className="px-4 md:px-8 py-4 md:py-6 relative z-10">
        <div className="flex items-center justify-between">
          <a 
            href="/"
            className="flex items-center text-white hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Truth
          </a>
          
          <button className="bg-black/60 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-black/70 transition-colors border border-white/10 text-base">
            $TRUTH
          </button>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)] px-4 md:px-8 pb-8">
        {/* Left Sidebar - Chapters */}
        <div className="w-full lg:w-1/4 mb-8 lg:mb-0 lg:pr-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-3xl border border-white/10 p-6">
            <h2 className="text-white text-xl font-medium mb-6">Chapters</h2>
            <nav className="space-y-2">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => setActiveChapter(chapter.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-colors border ${
                    activeChapter === chapter.id
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="mr-3 opacity-70">
                      {chapter.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{chapter.title}</div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-2xl text-center">
            <div className="bg-black/40 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-12">
              {/* Chapter Icon */}
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <div className="text-white">
                  {currentChapter.icon}
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-light text-white mb-4 tracking-wide">
                {currentChapter.title}
              </h1>

              {/* Subtitle */}
              <h2 className="text-xl md:text-2xl text-white/80 font-light mb-8 leading-relaxed">
                {currentChapter.subtitle}
              </h2>

              {/* Text Content */}
              <div className="text-white/70 text-lg leading-relaxed max-w-xl mx-auto">
                <p>{currentChapter.text}</p>
              </div>

              {/* Chapter Navigation */}
              <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/10">
                <button
                  onClick={() => {
                    const currentIndex = chapters.findIndex(c => c.id === activeChapter);
                    if (currentIndex > 0) {
                      setActiveChapter(chapters[currentIndex - 1].id);
                    }
                  }}
                  disabled={chapters.findIndex(c => c.id === activeChapter) === 0}
                  className="text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                
                <div className="flex space-x-2">
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      onClick={() => setActiveChapter(chapter.id)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        activeChapter === chapter.id ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => {
                    const currentIndex = chapters.findIndex(c => c.id === activeChapter);
                    if (currentIndex < chapters.length - 1) {
                      setActiveChapter(chapters[currentIndex + 1].id);
                    }
                  }}
                  disabled={chapters.findIndex(c => c.id === activeChapter) === chapters.length - 1}
                  className="text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowItWorksPage;