import React from 'react';
import { Search, ArrowRight, RotateCcw } from 'lucide-react';
import { supabase, UserTruth } from '../lib/supabase';
import OpenAI from 'openai';

function HomePage() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [xUsername, setXUsername] = React.useState('');
  const [firstAnswer, setFirstAnswer] = React.useState('');
  const [secondAnswer, setSecondAnswer] = React.useState('');
  const [generatedTruth, setGeneratedTruth] = React.useState('');
  const [currentQuestion, setCurrentQuestion] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [firstQuestion, setFirstQuestion] = React.useState('');
  const [secondQuestion, setSecondQuestion] = React.useState('');

  const callOpenAIAPI = async (prompt) => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('VITE_OPENAI_API_KEY environment variable is not set');
      }

      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });

      const response = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a wise, introspective guide who asks profound questions that help people discover their inner truths. Keep responses concise and thought-provoking.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'gpt-5-nano-2025-08-07'
      });

      return response.choices[0].message.content?.trim() || '';
    } catch (error) {
      console.error('OpenAI API error:', error.message);
      throw error;
    }
  };

  const generateFirstQuestion = async () => {
    const prompt = 'Generate one profound, introspective question that helps someone discover a deep truth about themselves. The question should be thought-provoking and personal. Return only the question, no additional text.';
    return await callOpenAIAPI(prompt);
  };

  const generateSecondQuestion = async (firstAnswer) => {
    const prompt = `Based on this person's answer: "${firstAnswer}", generate a follow-up question that digs deeper into their psyche and helps reveal another layer of their inner truth. The question should be related but explore a different aspect of their personality or beliefs. Return only the question, no additional text.`;
    return await callOpenAIAPI(prompt);
  };

  const generateTruth = async (firstAnswer, secondAnswer) => {
    const prompt = `Based on these two answers:
1. "${firstAnswer}"
2. "${secondAnswer}"

Generate a profound, 6-8 word truth about this person that captures their essence or reveals something meaningful about their character. The truth should be insightful, positive, and feel like a revelation. Return only the truth statement, no quotes or additional text.`;
    return await callOpenAIAPI(prompt);
  };

  const storeTruthInDatabase = async () => {
    console.log('🔍 storeTruthInDatabase called - starting database insertion...');
    
    try {
      const userTruthData: UserTruth = {
        x_username: xUsername,
        first_question: firstQuestion,
        first_answer: firstAnswer,
        second_question: secondQuestion,
        second_answer: secondAnswer,
        generated_truth: generatedTruth,
      };

      console.log('📤 Data to be inserted:', userTruthData);
      console.log('🔗 Supabase client initialized:', !!supabase);

      const { data, error } = await supabase
        .from('user_truths')
        .insert([userTruthData]);

      if (error) {
        console.error('❌ Error storing truth in database:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('✅ Truth stored successfully in database');
        console.log('✅ Inserted data response:', data);
      }
    } catch (error) {
      console.error('💥 Unexpected error in storeTruthInDatabase:', error);
      console.error('💥 Error stack:', error.stack);
    }
  };

  const getWordCount = (text) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  const handleNext = async () => {
    setIsLoading(true);
    
    try {
      if (currentStep === 0 && xUsername.trim()) {
        const question = await generateFirstQuestion();
        setCurrentQuestion(question);
        setFirstQuestion(question);
        setCurrentStep(1);
      } else if (currentStep === 1 && firstAnswer.trim() && getWordCount(firstAnswer) <= 15) {
        const question = await generateSecondQuestion(firstAnswer);
        setCurrentQuestion(question);
        setSecondQuestion(question);
        setCurrentStep(2);
      } else if (currentStep === 2 && secondAnswer.trim() && getWordCount(secondAnswer) <= 15) {
        const truth = await generateTruth(firstAnswer, secondAnswer);
        setGeneratedTruth(truth);
        setCurrentStep(3);
        // Store the complete truth data in Supabase
        setTimeout(() => storeTruthInDatabase(), 100);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      // Fallback to default behavior if API fails
      if (currentStep === 0) {
        setCurrentQuestion("What drives your deepest fears about the future?");
        setFirstQuestion("What drives your deepest fears about the future?");
        setCurrentStep(1);
      } else if (currentStep === 1) {
        setCurrentQuestion("When do you feel most authentic and true to yourself?");
        setSecondQuestion("When do you feel most authentic and true to yourself?");
        setCurrentStep(2);
      } else if (currentStep === 2) {
        setGeneratedTruth("You are braver than you believe");
        setCurrentStep(3);
        setTimeout(() => storeTruthInDatabase(), 100);
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
    setXUsername('');
    setFirstAnswer('');
    setSecondAnswer('');
    setGeneratedTruth('');
    setFirstQuestion('');
    setSecondQuestion('');
    setCurrentQuestion('');
    setIsLoading(false);
  };

  const canProceed = () => {
    if (isLoading) return false;
    if (currentStep === 0) return xUsername.trim() !== '';
    if (currentStep === 1) return firstAnswer.trim() !== '' && getWordCount(firstAnswer) <= 15;
    if (currentStep === 2) return secondAnswer.trim() !== '' && getWordCount(secondAnswer) <= 15;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-300 to-yellow-300 relative overflow-hidden">
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
              $TRUTH
            </button>
          </div>
          
          {/* Bottom row - Navigation links */}
          <div className="flex items-center justify-center space-x-6">
            <a href="#" className="text-white text-sm font-medium hover:text-white/80 transition-colors">
              Find your truth
            </a>
            <a href="#" className="text-white text-sm font-medium hover:text-white/80 transition-colors">
              How it works
            </a>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <a href="#" className="text-white text-lg font-medium hover:text-white/80 transition-colors">
              Find your truth
            </a>
            <a href="#" className="text-white text-lg font-medium hover:text-white/80 transition-colors">
              How it works
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
            <button className="bg-black/60 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-black/70 transition-colors border border-white/10 text-base">
              $TRUTH
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-4 md:px-8 py-8 md:py-16 relative z-10">
        <h1 className="text-4xl md:text-6xl font-light text-white text-center mb-8 md:mb-16 tracking-wide">
          whats your truth?
        </h1>

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
                  {currentStep === 1 && "First question"}
                  {currentStep === 2 && "One more question"}
                  {currentStep === 3 && "Your truth"}
                </h3>
              </div>
              <div className="text-white/40 text-sm">
                {currentStep < 3 ? `${currentStep + 1} of 4` : "Complete"}
              </div>
            </div>

            {/* Form Content */}
            <div className="min-h-80 md:min-h-96 p-4 md:p-8 flex flex-col justify-center">
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

              {/* Step 1: First Question */}
              {currentStep === 1 && (
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

              {/* Step 2: Second Question */}
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

              {/* Step 3: Truth Display */}
              {currentStep === 3 && (
                <div className="text-center space-y-8">
                  <div>
                    <p className="text-white/60 text-sm mb-4">Your truth is:</p>
                    <h2 className="text-3xl font-light text-white mb-6 leading-relaxed">
                      "{generatedTruth}"
                    </h2>
                    <p className="text-white/80 text-lg">@{xUsername}</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <p className="text-white/60 text-sm mb-2">Share your truth:</p>
                    <p className="text-white/80">truth.fm</p>
                    <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-white/50 text-xs">Shareable PNG will be generated here</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-6">
          {currentStep < 3 ? (
            <button 
              onClick={handleNext}
              disabled={!canProceed()}
              className="hidden md:flex bg-black/60 backdrop-blur-sm text-white px-8 py-4 rounded-full font-medium hover:bg-black/70 transition-colors border border-white/10 items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              {isLoading ? 'Loading...' : (currentStep === 2 ? 'Get my truth' : 'Submit')}
            </button>
          ) : (
            <button 
              onClick={handleStartOver}
              className="bg-black/60 backdrop-blur-sm text-white px-8 py-4 rounded-full font-medium hover:bg-black/70 transition-colors border border-white/10 flex items-center"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Start over
            </button>
          )}
        </div>
      </div>

      {/* Background overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 pointer-events-none"></div>
    </div>
  );
}

export default HomePage;