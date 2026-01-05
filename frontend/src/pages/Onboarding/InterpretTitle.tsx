import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Sparkles, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { occupationApi } from '@/services/api';
import { useOnboardingStore } from '@/stores/onboardingStore';

interface InterpretMatch {
  code: string;
  title: string;
  confidence: number;
  explanation: string;
}

interface InterpretResponse {
  needs_clarification: boolean;
  clarifying_question: string | null;
  matches: InterpretMatch[];
}

export default function InterpretTitle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentOccupation, reset } = useOnboardingStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<InterpretResponse | null>(null);

  const title = (location.state as { title?: string })?.title || '';

  useEffect(() => {
    if (!title) {
      navigate('/');
      return;
    }

    let cancelled = false;

    const interpret = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await occupationApi.interpret(title);
        if (!cancelled) {
          setResults(data);
        }
      } catch (err) {
        console.error('Interpretation failed:', err);
        if (!cancelled) {
          setError('We couldn\'t interpret your job title. Please try a different title or select from our suggestions.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    interpret();

    return () => {
      cancelled = true;
    };
  }, [title, navigate]);

  const handleSelectMatch = async (match: InterpretMatch) => {
    try {
      // Fetch full occupation details
      const occupation = await occupationApi.getById(match.code);
      reset();
      setCurrentOccupation(occupation);
      navigate('/onboarding/confirm');
    } catch (err) {
      console.error('Failed to fetch occupation:', err);
      setError('Failed to load occupation details. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo variant="full" size="md" className="mb-6" />
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="text-center py-12">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary-600 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Analyzing your job title...
              </h2>
              <p className="text-gray-500">
                "{title}"
              </p>
              <p className="text-sm text-gray-400 mt-4">
                Our AI is matching your title to standardized occupations
              </p>
            </div>
          </Card>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="text-center py-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Couldn't match your title
              </h2>
              <p className="text-gray-500 mb-6 max-w-md">
                {error}
              </p>
              <Button onClick={handleBack} variant="secondary">
                Try a different title
              </Button>
            </div>
          </Card>
        )}

        {/* Results */}
        {results && results.matches && results.matches.length > 0 && !isLoading && !error && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                We found some matches!
              </h1>
              <p className="text-gray-600">
                Your title "<span className="font-medium">{title}</span>" matches these occupations:
              </p>
            </div>

            <div className="space-y-4">
              {results.matches.map((match, index) => (
                <Card
                  key={match.code}
                  className={`cursor-pointer hover:border-primary-300 hover:shadow-md transition-all ${
                    index === 0 ? 'border-primary-200 bg-primary-50/30' : ''
                  }`}
                  onClick={() => handleSelectMatch(match)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {match.title}
                        </h3>
                        {index === 0 && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                            Best match
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {match.explanation}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-semibold text-primary-600">
                        {match.confidence}%
                      </div>
                      <div className="text-xs text-gray-500">match</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Click on the occupation that best describes your role
            </p>
          </>
        )}

        {/* No Results */}
        {results && (!results.matches || results.matches.length === 0) && !isLoading && !error && (
          <Card className="text-center py-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No close matches found
              </h2>
              <p className="text-gray-500 mb-6 max-w-md">
                We couldn't find a good match for "{title}". Try being more specific or use a common job title.
              </p>
              <Button onClick={handleBack} variant="secondary">
                Try a different title
              </Button>
            </div>
          </Card>
        )}

        {/* Back Link */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mt-6 mx-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to search
        </button>
      </div>
    </div>
  );
}
