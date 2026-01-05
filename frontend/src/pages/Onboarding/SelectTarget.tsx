import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, TrendingUp, Sparkles, Target, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/layout';
import { Button, Card, CareerLoader } from '@/components/ui';
import { occupationApi } from '@/services/api';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { Occupation } from '@/types';

// Career path from AI or database
interface AICareerPath {
  // AI format
  occupation_code?: string;
  occupation_title?: string;
  occupation?: Occupation;
  // Database format
  target_occupation?: Occupation;
  frequency?: number;
  // Common fields
  path_type?: 'promotion' | 'lateral' | 'adjacent' | 'stepping_stone';
  why_good_fit?: string;
  difficulty?: 'easy' | 'moderate' | 'stretch';
  skills_to_develop?: string[];
  timeline_hint?: string;
}

interface PathsResponse {
  source: 'database' | 'ai' | 'error';
  paths: AICareerPath[];
  encouragement?: string;
  error?: string;
}

const pathTypeLabels: Record<string, { label: string; color: string }> = {
  promotion: { label: 'Promotion', color: 'bg-green-100 text-green-700' },
  lateral: { label: 'Lateral Move', color: 'bg-blue-100 text-blue-700' },
  adjacent: { label: 'Adjacent Role', color: 'bg-purple-100 text-purple-700' },
  stepping_stone: { label: 'Stepping Stone', color: 'bg-amber-100 text-amber-700' },
};

const difficultyLabels: Record<string, { label: string; color: string }> = {
  easy: { label: 'Achievable', color: 'text-green-600' },
  moderate: { label: 'Moderate', color: 'text-amber-600' },
  stretch: { label: 'Stretch Goal', color: 'text-red-600' },
};

interface AIPathCardProps {
  path: AICareerPath;
  onSelect: () => void;
}

function AIPathCard({ path, onSelect }: AIPathCardProps) {
  // Get title from either format
  const title = path.target_occupation?.title || path.occupation?.title || path.occupation_title || 'Unknown Role';

  // Get path type - default to 'lateral' for database paths
  const pathType = pathTypeLabels[path.path_type || 'lateral'] || pathTypeLabels.lateral;
  const difficulty = difficultyLabels[path.difficulty || 'moderate'] || difficultyLabels.moderate;

  // Check if this is a database path (no AI-specific fields)
  const isDatabasePath = !!path.target_occupation && !path.why_good_fit;

  return (
    <Card
      variant="interactive"
      onClick={onSelect}
      className="p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-lg">
              {title}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${pathType.color}`}>
              {pathType.label}
            </span>
          </div>

          {path.why_good_fit ? (
            <p className="text-sm text-gray-600 mb-3">
              {path.why_good_fit}
            </p>
          ) : isDatabasePath && path.target_occupation?.description ? (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {path.target_occupation.description}
            </p>
          ) : null}

          {!isDatabasePath && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className={`font-medium ${difficulty.color}`}>
                {difficulty.label}
              </span>
              {path.timeline_hint && (
                <span className="text-gray-500">
                  {path.timeline_hint}
                </span>
              )}
            </div>
          )}

          {path.skills_to_develop && path.skills_to_develop.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-500 mb-1">Skills to develop:</p>
              <div className="flex flex-wrap gap-1">
                {path.skills_to_develop.slice(0, 3).map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
      </div>
    </Card>
  );
}

export default function SelectTarget() {
  const navigate = useNavigate();
  const { currentOccupation, setTargetOccupation, setStep } = useOnboardingStore();
  const [selectedPath, setSelectedPath] = useState<AICareerPath | null>(null);

  // Fetch career paths (now with AI fallback)
  const { data: pathsResponse, isLoading } = useQuery<PathsResponse>({
    queryKey: ['careerPaths', currentOccupation?.onet_soc_code],
    queryFn: async () => {
      const response = await fetch(
        `/api/occupations/${currentOccupation!.onet_soc_code}/paths/?limit=6`
      );
      return response.json();
    },
    enabled: !!currentOccupation?.onet_soc_code,
  });

  if (!currentOccupation) {
    navigate('/');
    return null;
  }

  const handleSelectPath = async (path: AICareerPath) => {
    // Database format: target_occupation contains the full occupation
    if (path.target_occupation) {
      setTargetOccupation(path.target_occupation);
      setStep(4);
      navigate('/onboarding/analysis');
      return;
    }

    // AI format: occupation contains the full occupation
    if (path.occupation) {
      setTargetOccupation(path.occupation);
      setStep(4);
      navigate('/onboarding/analysis');
      return;
    }

    // Fallback: fetch by occupation code
    if (path.occupation_code) {
      try {
        const occupation = await occupationApi.getById(path.occupation_code);
        setTargetOccupation(occupation);
        setStep(4);
        navigate('/onboarding/analysis');
      } catch (e) {
        console.error('Failed to fetch occupation:', e);
      }
    }
  };

  const handleBack = () => {
    setStep(2);
    navigate('/onboarding/skills');
  };

  const paths = pathsResponse?.paths || [];
  const isAISuggested = pathsResponse?.source === 'ai';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo variant="full" size="md" className="mb-6" />

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <div className="w-3 h-3 rounded-full bg-gray-300" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Where do you want to go?
          </h1>
          <p className="text-gray-600">
            {isAISuggested ? (
              <>
                <Sparkles className="inline w-4 h-4 mr-1 text-primary-500" />
                AI-suggested career paths based on your skills
              </>
            ) : (
              'Based on career data, people in your role typically advance to:'
            )}
          </p>
        </div>

        {/* Encouragement message from AI */}
        {pathsResponse?.encouragement && (
          <Card className="mb-6 p-4 bg-primary-50 border-primary-200">
            <p className="text-sm text-primary-800">
              {pathsResponse.encouragement}
            </p>
          </Card>
        )}

        {/* Paths Grid */}
        {isLoading ? (
          <Card className="mb-8">
            <CareerLoader />
          </Card>
        ) : paths.length > 0 ? (
          <div className="space-y-4 mb-8">
            {paths.map((path, index) => (
              <AIPathCard
                key={path.target_occupation?.onet_soc_code || path.occupation_code || index}
                path={path}
                onSelect={() => handleSelectPath(path)}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-8 mb-8">
            <p className="text-gray-500">
              {pathsResponse?.error || 'No career paths found for this role.'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              You can search for a specific target role below.
            </p>
          </Card>
        )}

        {/* Custom Search */}
        <div className="mb-8">
          <button className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  I have a different goal in mind
                </p>
                <p className="text-sm text-gray-500">
                  Search for any role you're interested in
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
            </div>
          </button>
        </div>

        {/* Help Link */}
        <div className="text-center mb-8">
          <button className="text-primary-600 hover:text-primary-700 text-sm">
            I'm not sure yet — help me decide
          </button>
        </div>

        {/* Back Link */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to skills
        </button>
      </div>
    </div>
  );
}
