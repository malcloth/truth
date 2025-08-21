import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, MessageSquare, Sparkles, Share2 } from 'lucide-react';
import CommunityContextDiagram from '../components/CommunityContextDiagram';

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
    title: 'What is Our Truth?',
    subtitle: 'The world\'s first community-context AI',
    text: 'Truth is the world\'s first community-context AI. Answer just two AI-generated questions to discover a revealing truth about yourself.\n\nMeanwhile, @ourtruthai tweets wisdom 10x daily - each one inspired by the collective context of everyone who\'s participated.\n\nEvery interaction makes it smarter, creating an AI that truly understands crypto twitter\'s soul. The more degens contribute, the more unhinged and accurate it becomes.',
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    id: 'community-context-ai',
    title: 'Community-Context AI',
    subtitle: 'Proprietary system for scaling user inputs into AI context',
    text: 'This is a proprietary system for scaling user inputs into AI context.\n\nFor the longest time, AI context has been closed - controlled by companies, trained on scraped data. Truth makes context open to the public, meaning anyone can contribute to training the bot.\n\nHere\'s how it works: A swarm of sub-agents summarize user inputs in randomized pools, which then inform a larger agent. This lets us scale to thousands of community contributions without overwhelming or contradicting the AI.\n\nThink of it like this: Every time someone participates, they\'re adding a drop to an ocean of consciousness. Each drop changes the current, and eventually, the entire ocean thinks differently.\n\nThe Truth bot is just the first application of this context tech. More applications coming soon.',
    icon: <MessageSquare className="w-5 h-5" />
  },
  {
    id: 'truth-token',
    title: '$TRUTH Token',
    subtitle: 'Ownership in the future of open AI',
    text: '$TRUTH launched on @heavendex with tokenomics fully open for trading and dev supply under 10%.\n\nFuture plans: The Truth API will allow anyone to build on top of the community context protocol. Fees from these projects will burn $TRUTH, creating sustainable value for holders.\n\nThis isn\'t just a token - it\'s ownership in the future of open AI.',
    icon: <CheckCircle className="w-5 h-5" />
  },
  {
    id: 'truth-api',
    title: 'Truth API',
    subtitle: 'Build anything on top of community-context tech (Coming Soon)',
    text: 'Build anything on top of community-context tech. Doesn\'t have to be truth-related - the structure of public-contributed context is the breakthrough.\n\nImagine AI apps that actually understand their users because users train them directly.',
    icon: <Share2 className="w-5 h-5" />
  },
  {
    id: 'try-it-now',
    title: 'Try It Out Now',
    subtitle: 'Get your truth. Contribute to the collective. Shape the future of AI.',
    text: 'Ready to uncover your truth and contribute to the collective consciousness?\n\nStart your journey by sharing your X username and answering two AI-generated questions.\n\nEvery participation makes the AI smarter and more accurate.',
    icon: <Sparkles className="w-5 h-5" />
  }
];

function HowItWorksPage() {
  const [activeChapter, setActiveChapter] = useState(chapters[0].id);

  const currentChapter = chapters.find(chapter => chapter.id === activeChapter) || chapters[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-200 to-yellow-100">
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
              <div className="text-white/70 text-lg leading-relaxed max-w-4xl mx-auto space-y-6">
                {currentChapter.id === 'community-context-ai' ? (
                  <>
                    <p className="leading-relaxed">
                      This is a proprietary system for scaling user inputs into AI context.
                    </p>
                    <p className="leading-relaxed">
                      For the longest time, AI context has been closed - controlled by companies, trained on scraped data. Truth makes context open to the public, meaning anyone can contribute to training the bot.
                    </p>
                    
                    {/* Diagram */}
                    <CommunityContextDiagram />
                    
                    <p className="leading-relaxed">
                      Here's how it works: A swarm of sub-agents summarize user inputs in randomized pools, which then inform a larger agent. This lets us scale to thousands of community contributions without overwhelming or contradicting the AI.
                    </p>
                    <p className="leading-relaxed">
                      Think of it like this: Every time someone participates, they're adding a drop to an ocean of consciousness. Each drop changes the current, and eventually, the entire ocean thinks differently.
                    </p>
                    <p className="leading-relaxed">
                      The Truth bot is just the first application of this context tech. More applications coming soon.
                    </p>
                  </>
                ) : (
                  currentChapter.text.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="leading-relaxed">
                      {paragraph}
                    </p>
                  ))
                )}
                
                {/* Special CTA for the last chapter */}
                {currentChapter.id === 'try-it-now' && (
                  <div className="mt-8">
                    <a
                      href="/"
                      className="inline-flex items-center bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-2xl font-medium transition-colors border border-white/10"
                    >
                      Back to Truth →
                    </a>
                  </div>
                )}
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