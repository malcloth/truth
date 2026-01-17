import React from 'react';
import { Search, ArrowRight, RotateCcw, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

function HomePage() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [selectedFlow, setSelectedFlow] = React.useState<'truth' | 'wisdom' | null>(null);
  const [xUsername, setXUsername] = React.useState('');
  const [firstAnswer, setFirstAnswer] = React.useState('');
  const [secondAnswer, setSecondAnswer] = React.useState('');
  const [wisdomText, setWisdomText] = React.useState('');
  const [generatedTruth, setGeneratedTruth] = React.useState('');
  const [currentQuestion, setCurrentQuestion] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [firstQuestion, setFirstQuestion] = React.useState('');
  const [secondQuestion, setSecondQuestion] = React.useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = React.useState(0);
  const [bubbles, setBubbles] = React.useState([]);

  const loadingMessages = [
    "your question is coming...",
    "stop selling the bag 💎",
    "literally have patience",
    "hold more than 3 sec bro",
    "trust the process ✨",
    "diamonds hands only 💎🙌",
    "brewing something good...",
    "patience is a virtue",
    "good things take time",
    "generating wisdom..."
  ];

  React.useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading, loadingMessages.length]);

  // Bubble animation effect
  React.useEffect(() => {
    const createBubble = () => {
      const id = Date.now() + Math.random();
      const bubble = {
        id,
        left: Math.random() * 200 - 50, // Random position around logo (-50px to 150px from center)
        delay: Math.random() * 2, // Random delay 0-2 seconds
      };
      
      setBubbles(prev => [...prev, bubble]);
      
      // Remove bubble after animation completes
      setTimeout(() => {
        setBubbles(prev => prev.filter(b => b.id !== id));
      }, 4000 + bubble.delay * 1000);
    };

    // Create bubbles at random intervals
    const bubbleInterval = setInterval(() => {
      createBubble();
    }, Math.random() * 3000 + 2000); // Random interval 2-5 seconds

    return () => clearInterval(bubbleInterval);
  }, []);

  const callGenerateTruthAPI = async (type: 'first_question' | 'second_question' | 'generate_truth' | 'submit_wisdom', firstAnswer?: string, secondAnswer?: string, xUsername?: string, firstQuestion?: string, secondQuestion?: string, wisdomText?: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-truth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          firstAnswer,
          secondAnswer,
          xUsername,
          firstQuestion,
          secondQuestion,
          wisdomText
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate content');
      }

      return data;
    } catch (error) {
      console.error('Generate Truth API error:', error);
      throw error;
    }
  };

  const getWordCount = (text) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  const handleNext = async () => {
    setIsLoading(true);
    
    try {
      if (currentStep === 0 && xUsername.trim()) {
        // Move to flow selection step
        setCurrentStep(1);
      } else if (currentStep === 1 && selectedFlow === 'truth') {
        const response = await callGenerateTruthAPI('first_question');
        setCurrentQuestion(response.result);
        setFirstQuestion(response.result);
        setCurrentStep(2);
      } else if (currentStep === 1 && selectedFlow === 'wisdom') {
        setCurrentStep(4); // Jump to wisdom input step
      } else if (currentStep === 2 && firstAnswer.trim() && getWordCount(firstAnswer) <= 15) {
        const response = await callGenerateTruthAPI('second_question', firstAnswer);
        setCurrentQuestion(response.result);
        setSecondQuestion(response.result);
        setCurrentStep(3);
      } else if (currentStep === 3 && secondAnswer.trim() && getWordCount(secondAnswer) <= 15) {
        console.log('✨ Calling API to generate truth...');
        const response = await callGenerateTruthAPI('generate_truth', firstAnswer, secondAnswer, xUsername, firstQuestion, secondQuestion);
        console.log('📦 Truth generated:', response.result);
        setGeneratedTruth(response.result);
        setCurrentStep(5); // Truth result step
      } else if (currentStep === 4 && wisdomText.trim() && getWordCount(wisdomText) <= 15) {
        console.log('🧠 Submitting wisdom...');
        const response = await callGenerateTruthAPI('submit_wisdom', undefined, undefined, xUsername, undefined, undefined, wisdomText);
        console.log('✅ Wisdom submitted successfully');
        setCurrentStep(6); // Wisdom success step
      }
    } catch (error) {
      console.error('Error generating content:', error);
      console.error('Error details:', error.message);
      // Fallback to default behavior if API fails
      if (currentStep === 0) {
        setCurrentStep(1);
      } else if (currentStep === 1 && selectedFlow === 'truth') {
        setCurrentQuestion("What drives your deepest fears about the future?");
        setFirstQuestion("What drives your deepest fears about the future?");
        setCurrentStep(2);
      } else if (currentStep === 2) {
        setCurrentQuestion("When do you feel most authentic and true to yourself?");
        setSecondQuestion("When do you feel most authentic and true to yourself?");
        setCurrentStep(3);
      } else if (currentStep === 3) {
        setGeneratedTruth("You are braver than you believe");
        setCurrentStep(5);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextareaChange = (value, setter) => {
    const wordCount = getWordCount(value);
    if (wordCount <= 15) {
      setter(value);
    } else {
      // If trying to exceed 15 words, only keep the first 15 words
      const words = value.trim().split(/\s+/);
      const limitedValue = words.slice(0, 15).join(' ');
      setter(limitedValue);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(0);
    setSelectedFlow(null);
    setXUsername('');
    setFirstAnswer('');
    setSecondAnswer('');
    setWisdomText('');
    setGeneratedTruth('');
    setFirstQuestion('');
    setSecondQuestion('');
    setCurrentQuestion('');
    setIsLoading(false);
  };

  const handleShareToX = () => {
    const tweetText = `I found out my $truth. ourtruth.xyz: "${generatedTruth}" @ourtruthai on @heavendex`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank');
  };

  const canProceed = () => {
    if (isLoading) return false;
    if (currentStep === 0) return xUsername.trim() !== '';
    if (currentStep === 1) return selectedFlow !== null;
    if (currentStep === 2) return firstAnswer.trim() !== '' && getWordCount(firstAnswer) <= 15;
    if (currentStep === 3) return secondAnswer.trim() !== '' && getWordCount(secondAnswer) <= 15;
    if (currentStep === 4) return wisdomText.trim() !== '' && getWordCount(wisdomText) <= 15;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-200 to-yellow-100 relative overflow-hidden">
      {/* Navigation */}
      <nav className="px-4 md:px-8 py-4 md:py-6 relative z-10">
        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Top row - Search and $TRUTH button */}
          <div className="flex items-center justify-between mb-3">
            <div className="relative flex-1 mr-3">
              <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-full px-3 py-2 border border-white/10">
                <Search className="w-4 h-4 text-white/70 mr-2" />
                <input 
                  type="text" 
                  placeholder="knowledge search - soon" 
                  className="bg-transparent text-white placeholder-white/70 outline-none flex-1 text-sm"
                />
              </div>
            </div>
            <button className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium hover:bg-black/70 transition-colors border border-white/10 text-sm">
              <a 
                href="https://heaven.xyz/token/FvDsYRpB5zEuPKjuVBPAu8RkXbL8VE4ujcj6GRB9A777" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                $TRUTH
              </a>
            </button>
          </div>
          
          {/* Bottom row - Navigation links */}
          <div className="flex items-center justify-center space-x-4">
            <a href="#" className="text-white text-sm font-medium hover:text-white/80 transition-colors">
              Find your truth
            </a>
            <a href="/how-it-works" className="text-white text-sm font-medium hover:text-white/80 transition-colors">
              How it works
            </a>
            <a href="/how-it-works?chapter=truth-api" className="text-white text-sm font-medium hover:text-white/80 transition-colors">
              Truth API
            </a>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <a href="#" className="text-white text-lg font-medium hover:text-white/80 transition-colors">
              Find your truth
            </a>
            <a href="/how-it-works" className="text-white text-lg font-medium hover:text-white/80 transition-colors">
              How it works
            </a>
            <a href="/how-it-works?chapter=truth-api" className="text-white text-lg font-medium hover:text-white/80 transition-colors">
              Truth API
            </a>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
                <Search className="w-5 h-5 text-white/70 mr-3" />
                <input 
                  type="text" 
                  placeholder="knowledge search - soon" 
                  className="bg-transparent text-white placeholder-white/70 outline-none flex-1 w-40 text-base"
                />
                <span className="text-white/50 text-sm ml-4 bg-white/10 px-2 py-1 rounded border border-white/20">
                  /
                </span>
              </div>
            </div>
            <a 
              href="https://heaven.xyz/token/FvDsYRpB5zEuPKjuVBPAu8RkXbL8VE4ujcj6GRB9A777" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-black/60 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-black/70 transition-colors border border-white/10 text-base"
            >
              $TRUTH
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-4 md:px-8 py-8 md:py-16 relative z-10">
        {/* Logo */}
        <div className="mb-8 md:mb-12 relative">
          <img 
            src="/Untitled (5000 x 5000 px).png" 
            alt="Truth Logo" 
            className="w-24 h-24 md:w-28 md:h-28 object-contain"
          />
          
          {/* Floating Bubbles */}
          {bubbles.map((bubble) => (
            <div
              key={bubble.id}
              className="absolute pointer-events-none animate-float-up"
              style={{
                left: `calc(50% + ${bubble.left}px)`,
                top: '50%',
                animationDelay: `${bubble.delay}s`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium border border-white/30 whitespace-nowrap shadow-lg">
                +1 Truth
              </div>
            </div>
          ))}
        </div>
        
        <h1 className="text-4xl md:text-6xl font-light text-white text-center mb-8 md:mb-16 tracking-wide">
          whats your truth?
        </h1>
        
        <p className="text-base md:text-lg text-white/80 text-center mb-8 md:mb-16 max-w-3xl mx-auto leading-relaxed">
          the more truths that feed into the system, the more wisdom i get. Find out our truth @ourtruthai on X
        </p>

        {/* 3D Cards Container */}
        <div className="relative w-full max-w-2xl mx-auto mb-8 md:mb-16">
          <div className="bg-black/80 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden">
            {/* Form Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{currentStep + 1}</span>
                </div>
                <h3 className="text-white text-base md:text-lg font-medium">
                  {currentStep === 0 && "What's your X username?"}
                  {currentStep === 1 && "Choose your path"}
                  {currentStep === 2 && "First question"}
                  {currentStep === 3 && "One more question"}
                  {currentStep === 4 && "Share your wisdom"}
                  {currentStep === 5 && "Your truth"}
                  {currentStep === 6 && "Wisdom shared"}
                </h3>
              </div>
              <div className="text-white/40 text-sm">
                {currentStep < 5 ? `${currentStep + 1} of ${selectedFlow === 'wisdom' ? '3' : '4'}` : "Complete"}
              </div>
            </div>

            {/* Form Content */}
            <div className="min-h-80 md:min-h-96 p-4 md:p-8 flex flex-col justify-center relative">
              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg font-medium transition-opacity duration-500">
                      {loadingMessages[loadingMessageIndex]}
                    </p>
                    <p className="text-white/60 text-sm mt-2">AI is cooking... 🔥</p>
                  </div>
                </div>
              )}
              
              {/* Step 0: Username Input */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <p className="text-white/80 text-lg mb-4">
                      Let's start with your X username
                    </p>
                    <p className="text-white/60 text-sm">
                      This will appear on your shareable truth
                    </p>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">@</span>
                    <input
                      type="text"
                      value={xUsername}
                      onChange={(e) => setXUsername(e.target.value)}
                      placeholder="username"
                      className="w-full bg-white/10 text-white placeholder-white/40 rounded-2xl pl-10 pr-6 py-4 outline-none focus:ring-2 focus:ring-white/30 transition-all text-lg"
                      onKeyPress={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                    />
                    {/* Mobile Submit Button */}
                    <button 
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="md:hidden absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-black px-4 py-1 rounded-full text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Loading...' : 'Submit'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Flow Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <p className="text-white/80 text-lg mb-4">
                      Choose your path, @{xUsername}
                    </p>
                    <p className="text-white/60 text-sm">
                      Discover your truth or contribute wisdom to shape the AI
                    </p>
                  </div>
                  <div className="grid gap-4">
                    <button
                      onClick={() => {
                        setSelectedFlow('truth');
                        handleNext();
                      }}
                      className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-6 rounded-2xl font-medium transition-colors border border-white/10 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium mb-2">🔮 Find your truth</h4>
                          <p className="text-white/60 text-sm">Answer two AI questions to discover a revealing truth about yourself</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/40" />
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFlow('wisdom');
                        handleNext();
                      }}
                      className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-6 rounded-2xl font-medium transition-colors border border-white/10 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium mb-2">🧠 Tell us your wisdom</h4>
                          <p className="text-white/60 text-sm">Share insights that will directly influence the AI's personality</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/40" />
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: First Question */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <p className="text-white/80 text-lg mb-4">
                      {currentQuestion}
                    </p>
                    <p className="text-white/60 text-sm">
                      Answer in 15 words or less
                    </p>
                  </div>
                  <div className="relative">
                    <textarea
                      value={firstAnswer}
                      onChange={(e) => handleTextareaChange(e.target.value, setFirstAnswer)}
                      placeholder="Your honest answer..."
                      className="w-full bg-white/10 text-white placeholder-white/40 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-white/30 transition-all text-lg resize-none"
                      rows={3}
                    />
                    <div className={`absolute bottom-3 right-4 text-sm ${
                      getWordCount(firstAnswer) > 15 ? 'text-red-400' : 'text-white/40'
                    }`}>
                      {getWordCount(firstAnswer)}/15 words
                    </div>
                    {/* Mobile Submit Button */}
                    <button 
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="md:hidden absolute bottom-3 left-4 bg-white text-black px-4 py-1 rounded-full text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Loading...' : 'Submit'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Second Question */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <p className="text-white/80 text-lg mb-4">
                      {currentQuestion}
                    </p>
                    <p className="text-white/60 text-sm">
                      Answer in 15 words or less
                    </p>
                  </div>
                  <div className="relative">
                    <textarea
                      value={secondAnswer}
                      onChange={(e) => handleTextareaChange(e.target.value, setSecondAnswer)}
                      placeholder="Your honest answer..."
                      className="w-full bg-white/10 text-white placeholder-white/40 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-white/30 transition-all text-lg resize-none"
                      rows={3}
                    />
                    <div className={`absolute bottom-3 right-4 text-sm ${
                      getWordCount(secondAnswer) > 15 ? 'text-red-400' : 'text-white/40'
                    }`}>
                      {getWordCount(secondAnswer)}/15 words
                    </div>
                    {/* Mobile Submit Button */}
                    <button 
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="md:hidden absolute bottom-3 left-4 bg-white text-black px-4 py-1 rounded-full text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Loading...' : 'Submit'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Wisdom Input */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <p className="text-white/80 text-lg mb-4">
                      What's your wisdom?
                    </p>
                    <p className="text-white/60 text-sm">
                      Share insights that will directly influence the AI and shape its personality over time. Limit: 15 words.
                    </p>
                  </div>
                  <div className="relative">
                    <textarea
                      value={wisdomText}
                      onChange={(e) => handleTextareaChange(e.target.value, setWisdomText)}
                      placeholder="Your wisdom..."
                      className="w-full bg-white/10 text-white placeholder-white/40 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-white/30 transition-all text-lg resize-none"
                      rows={3}
                    />
                    <div className={`absolute bottom-3 right-4 text-sm ${
                      getWordCount(wisdomText) > 15 ? 'text-red-400' : 'text-white/40'
                    }`}>
                      {getWordCount(wisdomText)}/15 words
                    </div>
                    {/* Mobile Submit Button */}
                    <button 
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="md:hidden absolute bottom-3 left-4 bg-white text-black px-4 py-1 rounded-full text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Sharing...' : 'Share'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Truth Result */}
              {currentStep === 5 && (
                <div className="text-center space-y-8">
                  <div>
                    <p className="text-white/60 text-sm mb-4">Your truth is:</p>
                    <h2 className="text-3xl font-light text-white mb-6 leading-relaxed">
                      "{generatedTruth}"
                    </h2>
                    <p className="text-white/80 text-lg">@{xUsername}</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <p className="text-white/60 text-sm mb-4">Share your truth:</p>
                    <button
                      onClick={handleShareToX}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-6 py-4 rounded-xl font-medium transition-colors border border-blue-400/20 flex items-center justify-center"
                    >
                      <span className="mr-2">🐦</span>
                      Share on X
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 6: Wisdom Success */}
              {currentStep === 6 && (
                <div className="text-center space-y-8">
                  <div>
                    <p className="text-white/60 text-sm mb-4">Thank you for sharing your wisdom:</p>
                    <h2 className="text-2xl font-light text-white mb-6 leading-relaxed">
                      "{wisdomText}"
                    </h2>
                    <p className="text-white/80 text-lg mb-6">@{xUsername}</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <p className="text-white/60 text-sm mb-4">
                      Your wisdom has been added to the collective consciousness. It will help shape the AI's personality and influence future posts from @ourtruthai.
                    </p>
                    <div className="flex flex-col space-y-3">
                      <a
                        href="https://twitter.com/ourtruthai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-6 py-4 rounded-xl font-medium transition-colors border border-blue-400/20 flex items-center justify-center"
                      >
                        <span className="mr-2">🐦</span>
                        Follow @ourtruthai
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-6">
          {(currentStep < 5 && currentStep !== 1) ? (
            <button 
              onClick={handleNext}
              disabled={!canProceed()}
              className="hidden md:flex bg-black/60 backdrop-blur-sm text-white px-8 py-4 rounded-full font-medium hover:bg-black/70 transition-colors border border-white/10 items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              {isLoading ? 'Loading...' : (
                currentStep === 3 ? 'Get my truth' : 
                currentStep === 4 ? 'Share wisdom' : 
                'Submit'
              )}
            </button>
          ) : (currentStep === 5 || currentStep === 6) ? (
            <button 
              onClick={handleStartOver}
              className="bg-black/60 backdrop-blur-sm text-white px-8 py-4 rounded-full font-medium hover:bg-black/70 transition-colors border border-white/10 flex items-center"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Start over
            </button>
          ) : null}
        </div>
      </div>

      {/* Background overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none"></div>
    </div>
  );
}

export default HomePage;