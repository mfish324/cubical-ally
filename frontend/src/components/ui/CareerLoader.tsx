import { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, Target, Sparkles, Rocket, Award } from 'lucide-react';

const messages = [
  { text: "Mapping your career trajectory...", icon: TrendingUp },
  { text: "Analyzing skill pathways...", icon: Target },
  { text: "Finding roles that match your potential...", icon: Sparkles },
  { text: "Calculating promotion probabilities...", icon: Rocket },
  { text: "Discovering hidden opportunities...", icon: Award },
  { text: "Charting your path to success...", icon: Briefcase },
];

const funFacts = [
  "People who document their wins are 2.5x more likely to get promoted",
  "The average promotion takes 3 years — you can beat that",
  "Skills transfer: 70% of what you know applies to your next role",
  "Most managers wish employees asked for promotions more often",
  "Evidence-based cases have a 67% higher success rate",
];

interface CareerLoaderProps {
  variant?: 'default' | 'compact';
}

export function CareerLoader({ variant = 'default' }: CareerLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * funFacts.length));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Cap at 90% to avoid "fake 100%"
        return prev + Math.random() * 15;
      });
    }, 800);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const CurrentIcon = messages[messageIndex].icon;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <CurrentIcon className="w-5 h-5 text-primary-600 animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-primary-300 border-t-primary-600 animate-spin" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{messages[messageIndex].text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      {/* Animated Icon */}
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
          <CurrentIcon
            className="w-10 h-10 text-primary-600 transition-all duration-500 ease-out"
            style={{ transform: `scale(${1 + Math.sin(Date.now() / 500) * 0.1})` }}
          />
        </div>
        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 rounded-full bg-primary-400" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
          <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 -ml-0.75 rounded-full bg-secondary-400" />
        </div>
      </div>

      {/* Message */}
      <p className="text-lg font-medium text-gray-900 mb-2 transition-opacity duration-300">
        {messages[messageIndex].text}
      </p>

      {/* Progress bar */}
      <div className="w-64 mx-auto h-1.5 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progress, 90)}%` }}
        />
      </div>

      {/* Fun fact */}
      <div className="max-w-sm mx-auto px-4 py-3 bg-primary-50 rounded-lg border border-primary-100">
        <p className="text-xs text-primary-600 font-medium mb-1">Did you know?</p>
        <p className="text-sm text-primary-800">{funFacts[factIndex]}</p>
      </div>
    </div>
  );
}

export default CareerLoader;
